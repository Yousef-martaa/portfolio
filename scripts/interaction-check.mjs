import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {openBrowserPage,pause} from './cdp.mjs';
const p=await openBrowserPage(), results=[];
const active=()=>p.evaluate('Number(projectReel.dataset.active)');
const scroll=async()=>{await p.evaluate('reelViewport.scrollIntoView({block:"start",behavior:"instant"})');await pause(200)};
const mouse=(type,x,y,extra={})=>p.send('Input.dispatchMouseEvent',{type,x,y,...extra});
const swipe=async(x,y,dx,dy)=>{await p.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let n=1;n<=8;n++){await p.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*n/8,y:y+dy*n/8,id:1}]});await pause(35)}await p.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(1100)};
try{
 for(const width of [1440,390,320]){
  await p.send('Page.bringToFront');await p.size(width,900);await p.navigate('http://127.0.0.1:8765/');await p.waitFor('document.querySelectorAll(".reel-slide").length === 6');await pause(3500);
  await p.evaluate('sessionStorage.clear()');await p.navigate('http://127.0.0.1:8765/');await p.waitFor('document.querySelectorAll(".reel-slide").length === 6');await pause(3500);
  const hintVisible=()=>p.evaluate('getComputedStyle(reelDragHint).visibility === "visible"');
  assert(await hintVisible());
  assert.equal(await p.evaluate('getComputedStyle(document.querySelector(".brand-mark i")).backgroundColor'),await p.evaluate('getComputedStyle(document.querySelector(".surname")).color'));
  assert(await p.evaluate('document.documentElement.scrollWidth')<=width);
  const intro=await p.evaluate('({heading:document.querySelector(".intro-line h2").textContent,copy:document.querySelector(".intro-purpose").textContent,size:getComputedStyle(document.querySelector(".intro-purpose")).fontSize})');
  assert(intro.copy.startsWith('This site started with a need of my own:'));
  await scroll();
  for(const dx of [0,5,30]){
   await mouse('mousePressed',width*.7,180,{button:'left',clickCount:1});await mouse('mouseMoved',width*.7-dx,180,{button:'left',buttons:1});await mouse('mouseReleased',width*.7-dx,180,{button:'left',clickCount:1});await pause(150);assert(await hintVisible());assert.equal(await active(),0);
  }
  await p.evaluate(`reelViewport.dispatchEvent(new PointerEvent('pointerdown',{pointerId:99,clientX:200,clientY:100,button:0,bubbles:true}));reelViewport.dispatchEvent(new PointerEvent('pointercancel',{pointerId:99,bubbles:true}))`);assert(await hintVisible());
  for(const i of [0,2,5]){
   await p.evaluate(`document.querySelectorAll('.reel-dot')[${i}].click()`);await pause(1100);await scroll();
   const before=await p.evaluate('scrollY');await mouse('mouseWheel',width/2,180,{deltaY:220,deltaX:0});await pause(700);
   assert(await p.evaluate('scrollY')>before,`vertical scroll ${width}/${i}`);assert.equal(await active(),i);
  }
  await p.evaluate('reelPrev.click()');assert.equal(await active(),4);await p.evaluate('reelNext.click()');assert.equal(await active(),5);
  await p.evaluate('projectReel.focus()');await p.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Home'});assert.equal(await active(),0);
  await scroll();await mouse('mouseWheel',width/2,180,{deltaX:100,deltaY:0});await pause(1100);assert.equal(await active(),1);
  assert(await hintVisible());
  await scroll();await mouse('mouseMoved',width*.7,180);await pause(200);
  assert.equal(await p.evaluate('document.querySelector(".reel-cursor")'),null);
  assert.equal(await p.evaluate('getComputedStyle(reelViewport).cursor'),'grab');
  await mouse('mousePressed',width*.7,180,{button:'left',clickCount:1});await mouse('mouseMoved',width*.7-110,180,{button:'left',buttons:1});
  assert.equal(await p.evaluate('getComputedStyle(reelViewport).cursor'),'grabbing');
  const layout=await p.evaluate('document.querySelector(".reel-controls").getBoundingClientRect().height');
  await mouse('mouseReleased',width*.7-110,180,{button:'left',clickCount:1});await pause(1200);assert.equal(await active(),2);
  assert.equal(await hintVisible(),false);assert.equal(await p.evaluate('document.querySelector(".reel-controls").getBoundingClientRect().height'),layout);
  await p.send('Page.reload');await p.waitFor('document.readyState === "complete" && !!document.querySelector(".reel-slide")');assert.equal(await hintVisible(),false);
  await p.navigate('http://127.0.0.1:8765/projects.html');await p.navigate('http://127.0.0.1:8765/');await p.waitFor('!!document.querySelector(".reel-slide")');assert.equal(await hintVisible(),false);
  await p.evaluate('reelNext.click();reelNext.click();reelNext.click()');assert.equal(await active(),3);
  await p.send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await p.evaluate('sessionStorage.clear()');await p.navigate('http://127.0.0.1:8765/');await p.waitFor('!!document.querySelector(".reel-slide")');await pause(3500);assert(await hintVisible());
  assert.equal(await p.evaluate('getComputedStyle(document.querySelector(".swipe-copy")).display'),'inline');
  await scroll();let scrollBefore=await p.evaluate('scrollY');await swipe(width*.6,300,0,-160);assert(await p.evaluate('scrollY')>scrollBefore);assert(await hintVisible());assert.equal(await active(),0);
  await scroll();await swipe(width*.75,180,-110,0);assert.equal(await active(),1);assert.equal(await hintVisible(),false);
  await p.evaluate('reelNext.click();reelNext.click();reelNext.click()');assert.equal(await active(),4);
  await scroll();let before=await p.evaluate('scrollY');await swipe(width*.6,300,0,-160);assert(await p.evaluate('scrollY')>before);assert.equal(await active(),4);
  await scroll();before=await p.evaluate('scrollY');await swipe(width*.6,300,-65,-160);assert(await p.evaluate('scrollY')>before);assert.equal(await active(),4);
  await p.send('Emulation.setTouchEmulationEnabled',{enabled:false});
  await p.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await p.evaluate('reelNext.click()');assert.equal(await p.evaluate('getComputedStyle(reelRail).transitionDuration'),'0s');
  await p.evaluate('document.querySelector(".is-current .explore-project").click()');await p.waitFor('document.querySelector("dialog").open');assert.equal(await p.evaluate('document.activeElement.className'),'detail-close');
  await p.evaluate('document.querySelector(".detail-close").click()');await p.waitFor('!document.querySelector("dialog").open');assert.equal(await p.evaluate('document.activeElement.className'),'explore-project');
  await pause(1200);assert.equal(await p.evaluate('document.querySelector(".reel-cursor")'),null);
  await p.send('Emulation.setEmulatedMedia',{features:[]});await scroll();await p.screenshot(path.join(os.tmpdir(),`portfolio-interaction-${width}.png`));
  results.push({width,passed:'vertical wheel at first/middle/last; arrows; keyboard; horizontal wheel; native drag cursors; hint dismissal; horizontal/vertical/diagonal touch; reduced motion; details focus; no circle'});
 }
 assert.deepEqual(p.errors,[]);console.log(JSON.stringify(results,null,2));
}finally{await p.close()}


