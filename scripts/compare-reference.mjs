import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { openBrowserPage, pause } from './cdp.mjs';
const page = await openBrowserPage();
const directory = path.join(os.tmpdir(), 'portfolio-fidelity'); await fs.mkdir(directory, { recursive: true });
const findings = [];
const phase = process.env.COMPARISON_PHASE || 'before';
try {
  for (const width of [1440, 390]) {
    await page.size(width);
    await page.navigate(pathToFileURL(path.resolve('portfolio-handoff/design-reference.html')).href);
    // The reference wrapper's opaque sandbox prevents DOM measurement. Relax only
    // this local browser instance, then reload the same authored srcdoc unchanged.
    await page.evaluate(`(()=>{const frame=document.querySelector('iframe');const source=frame.srcdoc;frame.removeAttribute('sandbox');frame.srcdoc=source})()`);
    await page.waitFor('document.querySelector("iframe")?.contentDocument?.querySelector(".ym-shot")');
    await pause(3300);
    const ref = `document.querySelector('iframe').contentDocument`;
    findings.push(await page.evaluate(`(()=>{const d=${ref},root=d.querySelector('#ym-cobalt-motion');return {source:'reference',width:${width},masthead:d.querySelector('.ym-masthead').getBoundingClientRect().height,shot:d.querySelector('.ym-shot').getBoundingClientRect().height,shotWidth:d.querySelector('.ym-shot').getBoundingClientRect().width,rootWidth:root.clientWidth,caption:!!d.querySelector('.ym-project-caption'),index:!!d.querySelector('.ym-index-list'),details:!!d.querySelector('.ym-case-overlay')}})()`));
    await page.evaluate(`document.querySelector('iframe').style.height=(${ref}.body.scrollHeight+5)+'px'`);
    await page.screenshot(path.join(directory, `${width}-reference.png`));
    await page.evaluate(`${ref}.querySelector('[data-next]').click()`); await pause(1100);
    await page.screenshot(path.join(directory, `${width}-reference-next.png`), false);
    await page.evaluate(`${ref}.querySelector('.ym-current [data-open]').click()`); await pause(800);
    await page.screenshot(path.join(directory, `${width}-reference-details.png`), false);
    for (const route of ['/', '/projects.html', '/skills.html', '/contact.html']) {
      await page.navigate('http://127.0.0.1:8765' + route); await pause(2200);
      if (route === '/projects.html') await page.waitFor('document.querySelector("#projectsGrid").getAttribute("aria-busy")==="false"', 45000);
      findings.push(await page.evaluate(`({source:${JSON.stringify('implementation-' + phase)},route:${JSON.stringify(route)},width:${width},height:document.documentElement.scrollHeight,shotHeight:document.querySelector('.reel-slide')?.getBoundingClientRect().height,caption:!!document.querySelector('.project-caption'),details:!!document.querySelector('dialog'),overflow:document.documentElement.scrollWidth>innerWidth})`));
      await page.screenshot(path.join(directory, `${width}-${phase}-${route === '/' ? 'home' : route.slice(1,-5)}.png`));
    }
  }
  await fs.writeFile(path.join(directory, `comparison-${phase}.json`), JSON.stringify(findings, null, 2));
  console.log(JSON.stringify({ directory, findings }, null, 2));
} finally { await page.close(); }
