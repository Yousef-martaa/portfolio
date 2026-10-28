// Pointer depth complements reel motion without taking over scroll or focus.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const progress = document.createElement('div');
progress.className = 'reading-progress'; progress.setAttribute('aria-hidden','true');
document.body.append(progress);
let scheduled = false;
function updateProgress(){
  scheduled=false;
  const length=document.documentElement.scrollHeight-innerHeight;
  progress.style.transform=`scaleX(${length>0?Math.max(0,Math.min(1,scrollY/length)):0})`;
}
addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateProgress)}},{passive:true});
addEventListener('resize',updateProgress);updateProgress();
const viewport=document.getElementById('reelViewport');
if(viewport){
 let frame=0,last=null,activeCover=null;
 function reset(){if(activeCover){activeCover.style.removeProperty('--depth-x');activeCover.style.removeProperty('--depth-y');activeCover=null;}}
 viewport.addEventListener('pointermove',e=>{
  if(!fine.matches||reduced.matches||e.pointerType==='touch'){reset();return;}
  last={x:e.clientX,y:e.clientY};
  if(frame)return;
  frame=requestAnimationFrame(()=>{
   frame=0;if(!last)return;
   const box=viewport.getBoundingClientRect(),x=last.x-box.left,y=last.y-box.top;
   const cover=viewport.querySelector('.is-current .project-cover');
   if(cover!==activeCover){if(activeCover){activeCover.style.removeProperty('--depth-x');activeCover.style.removeProperty('--depth-y');}activeCover=cover;}
   if(cover){cover.style.setProperty('--depth-x',`${(x/box.width-.5)*14}px`);cover.style.setProperty('--depth-y',`${(y/box.height-.5)*10}px`);}
  });
 });
 viewport.addEventListener('pointerleave',()=>{last=null;reset()});
 reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
}
