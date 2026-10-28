// Optional real-browser validation using Chrome's DevTools protocol; no dependency install.
// Start an isolated Chrome with --remote-debugging-port=9223, then run this script.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:8765';
const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const waiting = new Map(), exceptions = [], consoleErrors = [];
socket.addEventListener('message', e => {
  const data = JSON.parse(e.data);
  if (data.id) { const task = waiting.get(data.id); waiting.delete(data.id); data.error ? task.reject(new Error(data.error.message)) : task.resolve(data.result); }
  if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails.text + ' ' + (data.params.exceptionDetails.exception?.description || ''));
  if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') consoleErrors.push(data.params.args.map(a => a.value || a.description).join(' '));
});
function cdp(method, params = {}) { return new Promise((resolve, reject) => { const n = ++id; waiting.set(n, { resolve, reject }); socket.send(JSON.stringify({ id: n, method, params })); }); }
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Evaluation failed');
  return result.result.value;
}
const pause = ms => new Promise(r => setTimeout(r, ms));
async function until(expression, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await pause(100); }
  throw new Error('Timed out: ' + expression);
}
async function navigate(route) {
  await cdp('Page.navigate', { url: origin + route });
  await until('document.readyState === "complete"');
  await evaluate('document.fonts.ready'); await pause(1800);
}
const output = path.join(os.tmpdir(), 'portfolio-cobalt-validation'); await fs.mkdir(output, { recursive: true });
async function screenshot(name) {
  const metrics = await cdp('Page.getLayoutMetrics');
  const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: metrics.cssContentSize.width, height: metrics.cssContentSize.height, scale: 1 } });
  await fs.writeFile(path.join(output, name + '.png'), Buffer.from(result.data, 'base64'));
}
const results = [];
try {
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Page.bringToFront');
  for (const width of [1440, 390, 320]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    for (const route of ['/', '/projects.html', '/skills.html', '/contact.html']) {
      await navigate(route);
      if (route === '/') await until('document.querySelectorAll(".reel-slide").length === 6');
      if (route === '/projects.html') await until('document.getElementById("projectsGrid").getAttribute("aria-busy") === "false"', 45000);
      const layout = await evaluate(`({width:innerWidth,content:document.documentElement.scrollWidth,nav:[...document.querySelectorAll('.site-header nav a')].map(a=>({text:a.textContent,width:a.getBoundingClientRect().width,height:a.getBoundingClientRect().height})),status:document.getElementById('projectsStatus')?.textContent,count:document.getElementById('projectCount')?.textContent})`);
      assert(layout.content <= width, `${route} overflows at ${width}: ${layout.content}`);
      results.push({ route, width, ...layout }); await screenshot(`${width}-${route === '/' ? 'home' : route.slice(1, -5)}`);
    }
  }
  await navigate('/'); await until('document.querySelectorAll(".reel-slide").length === 6');
  await evaluate('document.getElementById("projectReel").focus()');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight' }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight' });
  assert((await evaluate('document.getElementById("reelCount").textContent')).startsWith('02'));
  assert.equal(await evaluate('document.querySelectorAll(".reel-slide:not([inert])").length'), 1);
  await evaluate('document.getElementById("reelNext").click()');
  assert((await evaluate('document.getElementById("reelCount").textContent')).startsWith('03'));
  await cdp('Emulation.setTouchEmulationEnabled', { enabled: true });
  await evaluate('document.getElementById("reelViewport").scrollIntoView()'); await pause(1300);
  const point = await evaluate('(()=>{const r=document.getElementById("reelViewport").getBoundingClientRect();return {x:Math.round(innerWidth*.7),y:Math.round(r.top+100)}})()');
  await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, id: 1 }] });
  for (let step = 1; step <= 5; step++) { await cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x - step * 20, y: point.y, id: 1 }] }); await pause(40); }
  await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(900);
  assert((await evaluate('document.getElementById("reelCount").textContent')).startsWith('04'), 'Touch swipe advances reel');
  // Wheel movement now navigates the reference-style reel; its last slide releases page scroll.
  await evaluate('document.getElementById("projectReel").focus()');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'End' });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'End' });
  await pause(900);
  const before = await evaluate('scrollY');
  await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 180, y: 250, deltaY: 650, deltaX: 0 }); await pause(900);
  assert(await evaluate('scrollY') > before, 'Ordinary wheel scroll exits reel');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".letter>span")).animationName'), 'none');
  assert.equal(await evaluate('getComputedStyle(document.getElementById("reelRail")).transitionDuration'), '0s');
  results.push({ reel: 'keyboard, arrows, real touch swipe, inactive-slide inertness, wheel scrolling and reduced motion passed' });

  // Deterministic browser fixture: the new repository has no curated metadata.
  const fixtureScript = `(()=>{const original=window.fetch;window.fetch=async function(url,options){if(!String(url).startsWith('https://api.github.com/'))return original(url,options);const orgs=String(url).includes('/orgs?');const data=orgs?[]:Array.from({length:14},(_,i)=>({id:90000+i,name:i===0?'brand-new-unlisted-tool':'fixture-'+i,full_name:'Yousef-martaa/'+(i===0?'brand-new-unlisted-tool':'fixture-'+i),description:i===0?'<img src=x onerror=window.INJECTED=true>':'Fixture project',language:'Rust',private:false,fork:false,updated_at:'2026-10-27',owner:{type:'User'}}));return new Response(JSON.stringify(orgs?data:[...data,{id:999999,name:'portfolio',full_name:'Yousef-martaa/portfolio',private:false,fork:false}]),{status:200,headers:{'Content-Type':'application/json'}})}})();`;
  const hook = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: fixtureScript });
  await navigate('/projects.html'); await until('document.querySelectorAll("#projectsGrid .catalogue-project").length === 12');
  assert.equal(await evaluate('document.querySelector("#projectsGrid h2").textContent'), 'brand-new-unlisted-tool');
  assert.equal(await evaluate('document.querySelector("#projectsGrid img")'), null);
  assert.equal(await evaluate('Boolean(window.INJECTED)'), false);
  assert.equal(await evaluate('document.querySelector("#projectsGrid .project-actions a").getAttribute("href")'), 'https://github.com/Yousef-martaa/brand-new-unlisted-tool');
  await evaluate('document.getElementById("showMore").click()');
  assert.equal(await evaluate('document.querySelectorAll("#projectsGrid .catalogue-project").length'), 14);
  assert.equal(await evaluate('projectCount.textContent'), '14 public repositories');
  assert.equal(await evaluate(`!!document.querySelector('a[href="https://github.com/Yousef-martaa/portfolio"]')`), false);
  assert.equal(await evaluate('document.activeElement.tagName'), 'H2');
  await evaluate('document.querySelector("#projectsGrid .explore-project").click()');
  await until('document.querySelector("dialog").open');
  assert.equal(await evaluate('document.getElementById("detailTitle").textContent'), 'brand-new-unlisted-tool');
  assert.equal(await evaluate('document.querySelector(".detail-description").textContent'), '<img src=x onerror=window.INJECTED=true>');
  assert.equal(await evaluate('document.querySelector("dialog img")'), null);
  await evaluate('document.querySelector(".detail-close").click()');
  await until('!document.querySelector("dialog").open');
  results.push({ discoveryFixture: 'uncurated new repository rendered; malicious description stayed text; repository fallback; all 14 progressively revealed; focus moved to first newly revealed heading' });
  await screenshot('320-projects-fixture'); await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: hook.identifier });

  for (const mode of ['partial', 'empty', 'total']) {
    const stateHook = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{const original=fetch;window.fetch=async(url,options)=>{if(!String(url).startsWith('https://api.github.com/'))return original(url,options);const mode=${JSON.stringify(mode)};const orgs=String(url).includes('/orgs?'),broken=String(url).includes('/orgs/broken/');if(!window.RECOVER&&(mode==='total'||broken))return new Response('{}',{status:503});const data=orgs?(mode==='partial'&&!window.RECOVER?[{login:'broken'}]:[]):mode==='empty'&&!window.RECOVER?[]:[{id:77777,name:'recovered-tool',full_name:'Yousef-martaa/recovered-tool',private:false,fork:false,updated_at:'2026-10-27'}];return new Response(JSON.stringify(data),{status:200})}})();` });
    await navigate('/projects.html'); await until('document.getElementById("projectsGrid").getAttribute("aria-busy") === "false"');
    const state = await evaluate('({status:document.getElementById("projectsStatus").textContent,count:document.querySelectorAll("#projectsGrid .catalogue-project").length,retry:!document.getElementById("projectsRetry").hidden})');
    assert.equal(state.count, mode === 'partial' ? 1 : 0);
    assert.equal(state.retry, mode !== 'empty');
    assert(state.status.includes(mode === 'partial' ? 'Partial collection' : mode === 'empty' ? 'No eligible' : 'GitHub is unavailable'));
    if (mode !== 'empty') {
      await evaluate('window.RECOVER=true;document.getElementById("projectsRetry").click()');
      await until('document.getElementById("projectsRetry").hidden');
      assert.equal(await evaluate('document.querySelectorAll("#projectsGrid .catalogue-project").length'), 1);
    }
    await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: stateHook.identifier });
  }
  results.push({ states: 'partial failure retains results; empty and total error states; Retry recovers both partial and total failures' });

  await navigate('/contact.html');
  await evaluate(`window.originalFetch=fetch;window.contactCalls=0;window.fetch=async(...args)=>{window.contactCalls++;await new Promise(r=>setTimeout(r,600));return new Response(JSON.stringify({message:'Mock temporary failure'}),{status:503})};document.getElementById('name').value='Preview Visitor';document.getElementById('email').value='visitor@example.org';document.getElementById('message').value='Mock validation only';document.getElementById('contactForm').requestSubmit();document.getElementById('contactForm').requestSubmit()`);
  await until('document.getElementById("formMessage").classList.contains("error")');
  assert.equal(await evaluate('window.contactCalls'), 1);
  assert.equal(await evaluate('document.querySelector(".send-btn").disabled'), false);
  assert.equal(await evaluate('document.getElementById("message").value'), 'Mock validation only');
  await evaluate('window.fetch=window.originalFetch');
  await evaluate(`document.getElementById('name').value='Preview Visitor';document.getElementById('email').value='visitor@example.org';document.getElementById('message').value='Mock validation only';document.getElementById('contactForm').requestSubmit()`);
  await until('document.getElementById("contactForm").hidden');
  assert((await evaluate('document.getElementById("formMessage").textContent')).includes('Thanks'));
  assert.equal(await evaluate('document.activeElement.id'), 'formMessage');
  assert.equal(await evaluate('document.getElementById("name").value'), '');
  results.push({ contact: 'duplicate submission blocked; failure keeps input and restores button; mock success resets/hides form and focuses status; no SMTP used' });
  assert.deepEqual(exceptions, [], 'No uncaught browser exceptions');
  assert.deepEqual(consoleErrors, [], 'No console.error calls');
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, exceptions, consoleErrors }, null, 2));
  console.log(JSON.stringify({ output, results, exceptions, consoleErrors }, null, 2));
} finally { await cdp('Page.close').catch(() => {}); socket.close(); }


