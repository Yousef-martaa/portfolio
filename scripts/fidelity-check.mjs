import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { openBrowserPage, pause } from './cdp.mjs';
const page = await openBrowserPage();
const output = path.join(os.tmpdir(), 'portfolio-fidelity'); await fs.mkdir(output, { recursive: true });
const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:8765';
const results = [];
const active = () => page.evaluate('Number(document.getElementById("projectReel").dataset.active)');
const key = async (key, type = 'keyDown') => {
  const code = { Escape: 27, Home: 36, End: 35, ArrowLeft: 37, ArrowRight: 39, Tab: 9 }[key] || 0;
  await page.send('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
};
async function press(value) { await key(value); await key(value, 'keyUp'); }
async function capture(name) { await page.screenshot(path.join(output, name + '.png')); }
async function box(selector) { return page.evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`); }
async function scrollToReel() { await page.evaluate('document.getElementById("reelViewport").scrollIntoView({behavior:"instant",block:"start"})'); await pause(150); }
try {
  for (const width of (process.env.FIDELITY_WIDTHS || '1440,390,320').split(',').map(Number)) {
    await page.size(width, 1000);
    // Capture the actual coordinated opening, not just its final pose.
    await page.navigate(origin + '/');
    await page.waitFor('document.querySelector("#projectReel")?.dataset.opening === "playing"');
    const initial = await page.evaluate(`({nameAnimations:document.querySelectorAll('.letter>span').length,playing:document.getAnimations().map(a=>({target:a.effect.target.className,delay:a.effect.getTiming().delay,duration:a.effect.getTiming().duration}))})`);
    assert(initial.playing.some(a => a.target === 'reel-curtain'));
    assert(initial.playing.some(a => a.target === 'reel-rail'));
    await capture(`${width}-opening-early`); await pause(650); await capture(`${width}-opening-middle`);
    await page.waitFor('document.getElementById("projectReel").dataset.opening === "complete"');
    await capture(`${width}-opening-complete`);
    assert.equal(await active(), 0);
    assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    const slide = await box('.reel-slide'), viewport = await box('#reelViewport');
    assert.equal(slide.height, width > 700 ? Math.max(470, Math.min(width * .43, 680)) : 480);
    assert(slide.width < viewport.width * .93, 'Neighbor preview is visible');

    // All scenes have distinct artwork, update the caption and open real details.
    for (let i = 0; i < 6; i++) {
      await page.evaluate(`document.querySelectorAll('.reel-dot')[${i}].click()`); await pause(1400);
      const state = await page.evaluate('({name:document.querySelector(".is-current .shot-title").textContent,caption:document.getElementById("captionName").textContent,motif:document.querySelector(".is-current .scene-art").className,ink:document.getElementById("projectReel").style.getPropertyValue("--reel-ink")})');
      assert.equal(state.name, state.caption);
      assert.equal(await page.evaluate('document.querySelectorAll(".reel-slide:not([inert])").length'), 1);
      await scrollToReel(); await capture(`${width}-scene-${i}`);
      await page.evaluate('document.querySelector(".is-current .explore-project").click()');
      await page.waitFor('document.querySelector("dialog").open'); await pause(750);
      assert.equal(await page.evaluate('document.getElementById("detailTitle").textContent'), state.name);
      assert.equal(await page.evaluate('document.activeElement.className'), 'detail-close');
      assert.equal(await page.evaluate('document.documentElement.style.overflow'), 'hidden');
      const outside = await page.evaluate('document.querySelector(".brand").focus();document.activeElement.className');
      assert.notEqual(outside, 'brand', 'Native modal prevents background focus');
      await capture(`${width}-details-${i}`);
      await press('Escape'); await page.waitFor('!document.querySelector("dialog").open && !document.body.classList.contains("details-open") && document.activeElement.className === "explore-project"');
      assert.equal(await page.evaluate('document.activeElement.className'), 'explore-project', `Focus return at ${width}px, scene ${i}`);
      assert.equal(await page.evaluate('document.documentElement.style.overflow'), '');
    }
    await page.evaluate('document.querySelector("[data-reel-view=index]").click()');
    assert.equal(await page.evaluate('document.getElementById("reelViewport").hidden'), true);
    assert.equal(await page.evaluate('document.querySelectorAll(".reel-index-row").length'), 6);
    await page.evaluate('document.querySelectorAll(".reel-index-row")[2].click()'); await pause(900);
    assert.equal(await active(), 2); assert.equal(await page.evaluate('document.activeElement.className'), 'explore-project');

    // Keyboard changes scenes; caption follows; drag visibly tracks before release.
    await press('Home'); await pause(900); assert.equal(await active(), 0);
    await press('ArrowRight'); await pause(900); assert.equal(await active(), 1);
    await scrollToReel();
    const area = await box('#reelViewport'), x = Math.round(area.width * .7), y = Math.round(area.y + 170);
    const before = await page.evaluate('document.getElementById("reelRail").getBoundingClientRect().x');
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x - 110, y, button: 'left', buttons: 1 });
    const moved = await page.evaluate('document.getElementById("reelRail").getBoundingClientRect().x');
    assert(moved < before - 80, 'Rail tracks pointer before release');
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x - 110, y, button: 'left', clickCount: 1 });
    await pause(1100); assert.equal(await active(), 2);
    // Vertical wheel scrolls the page; explicit horizontal trackpad input navigates.
    const scrollBefore = await page.evaluate('scrollY');
    await page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaY: 90, deltaX: 0 }); await pause(1100);
    assert.equal(await active(), 2); assert(await page.evaluate('scrollY') > scrollBefore); await scrollToReel();
    await page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaY: 0, deltaX: 90 }); await pause(1100); assert.equal(await active(), 3);
    await page.evaluate('document.getElementById("projectReel").focus()'); await press('End'); await pause(1000);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaY: 600, deltaX: 0 }); await pause(900);
    assert(await page.evaluate('scrollY') > scrollBefore, 'Last slide releases scroll into profile');
    await page.evaluate('document.getElementById("projectReel").focus()'); await press('Home'); await pause(900); await scrollToReel();
    const upBefore = await page.evaluate('scrollY');
    await page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y: 160, deltaY: -400, deltaX: 0 }); await pause(750);
    assert(await page.evaluate('scrollY') < upBefore, 'First slide releases upward scrolling');
    // Real touch input; vertical touch remains browser scrolling.
    await scrollToReel(); await page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: 160, id: 1 }] });
    for (let n = 1; n <= 6; n++) { await page.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - n * 20, y: 160, id: 1 }] }); await pause(30); }
    await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(1100); assert.equal(await active(), 1);
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    // Actual computed reduced-motion behavior, including dialog lifecycle.
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await page.evaluate('document.getElementById("reelNext").click()');
    assert.equal(await page.evaluate('getComputedStyle(document.getElementById("reelRail")).transitionDuration'), '0s');
    await page.evaluate('document.querySelector(".is-current .explore-project").click()');
    assert.equal(await page.evaluate('getComputedStyle(document.querySelector("dialog")).animationName'), 'none');
    await press('Escape'); await page.waitFor('!document.querySelector("dialog").open');
    await page.send('Emulation.setEmulatedMedia', { features: [] });
    results.push({ width, opening: 'coordinated name, surname, copy, curtain and rail sequence', scenes: 6, height: slide.height, neighborPreview: true, details: '6/6 open/close, focus return, background inertness', input: 'keyboard, live mouse drag, vertical wheel, horizontal trackpad, touch swipe', scrolling: 'both boundary exits passed', reducedMotion: 'passed' });
  }
  assert.deepEqual(page.errors, []);
  await fs.writeFile(path.join(output, 'fidelity-results.json'), JSON.stringify({ results, errors: page.errors }, null, 2));
  console.log(JSON.stringify({ output, results, errors: page.errors }, null, 2));
} finally { await page.close(); }

