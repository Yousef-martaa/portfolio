import { element, cover, detailButton } from './render.mjs';

export function createReel(document, projects) {
  const theatre = document.getElementById('projectReel'), rail = document.getElementById('reelRail');
  if (!theatre || !rail || !projects.length) return;
  const viewport = document.getElementById('reelViewport'), indexView = document.getElementById('reelIndex');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const hint = document.getElementById('reelDragHint');
  const hintKey = 'portfolio:reel-drag-discovered';
  // Session storage survives reloads and route navigation, but is scoped to this tab.
  try { if (sessionStorage.getItem(hintKey) === '1') hint?.classList.add('is-dismissed'); } catch {}
  function dismissHint() {
    hint?.classList.add('is-dismissed');
    try { sessionStorage.setItem(hintKey, '1'); } catch {}
  }
  let current = 0, view = 'reel', drag, dragged = false, wheelSum = 0, wheelAt = 0, wheelLock = 0;
  let animations = [], opening = [];
  const stop = () => { animations.forEach(a => a.cancel()); animations = []; };
  const stopOpening = () => { opening.forEach(a => a.cancel()); opening = []; curtain.style.transform = 'scaleY(0)'; };
  const slides = projects.map((project, i) => {
    const slide = element(document, 'article', 'reel-slide');
    slide.setAttribute('aria-roledescription', 'slide'); slide.setAttribute('aria-label', `${project.name}, ${i + 1} of ${projects.length}`);
    slide.style.setProperty('--scene', project.palette[0]);
    slide.style.setProperty('--reel-ink', project.palette[1]);
    slide.append(cover(document, project, i));
    const top = element(document, 'div', 'shot-top');
    top.append(element(document, 'p', 'micro', `${String(i + 1).padStart(2, '0')} / ${project.category}`), element(document, 'span', 'micro shot-role', project.role));
    const bottom = element(document, 'div', 'shot-bottom');
    bottom.append(element(document, 'h3', 'shot-title', project.name), detailButton(document, project));
    slide.append(top, bottom); return slide;
  });
  rail.replaceChildren(...slides);
  const curtain = element(document, 'div', 'reel-curtain'); curtain.setAttribute('aria-hidden', 'true'); viewport.append(curtain);
  const dots = projects.map((project, i) => {
    const button = element(document, 'button', 'reel-dot'); button.type = 'button';
    button.setAttribute('aria-label', `Show ${project.name}`); button.addEventListener('click', () => { setView('reel'); select(i); }); return button;
  });
  document.getElementById('reelDots').replaceChildren(...dots);
  const indexRows = projects.map((project, i) => {
    const button = element(document, 'button', 'reel-index-row'); button.type = 'button';
    button.append(element(document, 'span', 'micro', String(i + 1).padStart(2, '0')), element(document, 'span', 'index-title', project.name),
      element(document, 'span', 'micro index-category', project.category), element(document, 'span', 'index-arrow', '↗'));
    button.addEventListener('click', () => { setView('reel'); select(i, true); }); return button;
  }); indexView.replaceChildren(...indexRows);
  const offset = () => slides[current].offsetLeft - slides[0].offsetLeft;
  const place = (delta = 0) => { rail.style.transform = `translate3d(${-offset() + delta}px,0,0)`; };

  function animateScene() {
    if (preference.matches) return;
    const slide = slides[current], title = slide.querySelector('.shot-title');
    animations.push(title.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 850, delay: 100, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
    const motif = projects[current].motif;
    const parts = slide.querySelectorAll('.scene-art > *, .cover-image');
    parts.forEach((part, i) => {
      const from = motif === 'indoor' ? { translate: '8% 5%', rotate: '-5deg', opacity: .1 } :
        motif === 'family' ? { translate: '0 14%', rotate: '8deg', opacity: .1 } :
        motif === 'commerce' ? { translate: '12% 0', scale: '1.08', opacity: .2 } :
        motif === 'context' ? { translate: '0 18%', rotate: '-8deg', opacity: .1 } : { translate: '8% 0', opacity: .15 };
      animations.push(part.animate([from, { translate: '0 0', scale: '1', rotate: '0deg', opacity: 1 }], { duration: 1100 + i * 90, delay: i * 55, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
    });
    const layers = { operations: '.ops-step', family: '.family-page', commerce: '.textile-fold', indoor: '.aisle', people: '.people-column', context: '.context-sheet' };
    slide.querySelectorAll(layers[motif] || '.repository-map').forEach((part, i) => {
      animations.push(part.animate([{ opacity: 0, translate: motif === 'commerce' ? '18% 0' : '0 24px' }, { opacity: 1, translate: '0 0' }], {
        duration: 700, delay: 100 + i * (motif === 'indoor' ? 30 : 80), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'
      }));
    });
    if (motif === 'indoor') {
      animations.push(slide.querySelector('.indoor-route').animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }], { duration: 1000, delay: 150, easing: 'ease-in-out', fill: 'backwards' }));
      animations.push(slide.querySelector('.position-dot').animate([{ scale: '0', opacity: 0 }, { scale: '1', opacity: 1 }], { duration: 400, delay: 700, fill: 'backwards' }));
    }
    const note = document.getElementById('captionNote');
    animations.push(note.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 550 }));
  }
  function select(index, moveFocus = false, interaction = true) {
    if (interaction) stopOpening(); stop();
    const previous = current; current = (index + projects.length) % projects.length;
    theatre.dataset.active = String(current);
    slides.forEach((slide, i) => { slide.inert = i !== current; slide.setAttribute('aria-hidden', String(i !== current)); slide.classList.toggle('is-current', i === current); dots[i].setAttribute('aria-pressed', String(i === current)); });
    theatre.style.setProperty('--scene', projects[current].palette[0]); theatre.style.setProperty('--reel-ink', projects[current].palette[1]);
    document.getElementById('reelCount').textContent = `${String(current + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')} — ${projects[current].name}`;
    document.getElementById('captionName').textContent = projects[current].name;
    const note = document.getElementById('captionNote');
    note.textContent = projects[current].caption;
    if (projects[current].captionCredit) note.append(element(document, 'small', 'caption-credit', projects[current].captionCredit));
    const link = document.getElementById('captionLink'); link.href = projects[current].primaryUrl || 'projects.html';
    link.textContent = projects[current].site ? 'View site ↗' : projects[current].code ? 'View code ↗' : 'Complete collection ↗';
    if (projects[current].primaryUrl) { link.target = '_blank'; link.rel = 'noopener noreferrer'; } else link.removeAttribute('target');
    place(); if (previous !== current) animateScene();
    if (moveFocus) slides[current].querySelector('.explore-project').focus({ preventScroll: true });
  }
  function setView(next) {
    stopOpening(); view = next; theatre.dataset.view = view;
    viewport.hidden = view !== 'reel'; indexView.hidden = view !== 'index';
    document.querySelectorAll('[data-reel-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.reelView === view)));
    if (view === 'reel') requestAnimationFrame(() => place());
  }
  document.querySelectorAll('[data-reel-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.reelView)));
  document.getElementById('reelPrev').addEventListener('click', () => { setView('reel'); select(current - 1); });
  document.getElementById('reelNext').addEventListener('click', () => { setView('reel'); select(current + 1); });
  theatre.addEventListener('keydown', event => {
    if (document.body.classList.contains('details-open') || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const inSlide = rail.contains(document.activeElement); setView('reel');
    select(event.key === 'Home' ? 0 : event.key === 'End' ? projects.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1), inSlide);
  });
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('a,button')) return;
    stopOpening(); stop(); dragged = false; drag = { x: event.clientX, y: event.clientY, id: event.pointerId, dx: 0 };
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!dragged && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { drag = null; return; }
    // Commit only to a clearly horizontal gesture; leave diagonal/vertical touch to the browser.
    if (!dragged && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) { dragged = true; viewport.classList.add('is-dragging'); if (!viewport.hasPointerCapture(event.pointerId)) viewport.setPointerCapture(event.pointerId); }
    if (dragged) { drag.dx = dx; const edge = (current === 0 && dx > 0) || (current === projects.length - 1 && dx < 0); place(edge ? dx * .22 : dx); }
  });
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = drag.dx; drag = null; viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    const next = Math.max(0, Math.min(projects.length - 1, current + (dx < 0 ? 1 : -1)));
    if (event.type !== 'pointercancel' && Math.abs(dx) > 45 && next !== current) {
      select(next);
      dismissHint();
    } else place();
    setTimeout(() => { dragged = false; }, 100);
  }
  viewport.addEventListener('pointerup', endDrag); viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('click', event => { if (dragged) { event.preventDefault(); event.stopPropagation(); } }, true);
  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || event.shiftKey || document.body.classList.contains('details-open')) return;
    // Ordinary and diagonal scrolling belongs to the page, at every project.
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.5) { wheelSum = 0; return; }
    const delta = event.deltaX * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1);
    if (!delta) return;
    const direction = Math.sign(delta), now = performance.now();
    // Release immediately at both ends, even during a transition. The page never traps scrolling.
    if ((current === 0 && direction < 0) || (current === projects.length - 1 && direction > 0)) { wheelSum = 0; return; }
    event.preventDefault(); if (now < wheelLock) return;
    if (now - wheelAt > 220 || Math.sign(wheelSum) !== direction) wheelSum = 0;
    wheelAt = now; wheelSum += delta;
    if (Math.abs(wheelSum) >= 50) { select(current + direction); wheelSum = 0; wheelLock = now + (preference.matches ? 250 : 850); }
  }, { passive: false });
  function playOpening() {
    if (preference.matches) return;
    const timing = { duration: 1100, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' };
    document.querySelectorAll('.letter > span').forEach((letter, i) => opening.push(letter.animate([{ transform: 'translateY(110%) rotate(4deg)' }, { transform: 'none' }], { ...timing, delay: i * 65 })));
    const surname = document.querySelector('.surname');
    opening.push(surname.animate([{ clipPath: 'inset(100% 0 0)' }, { clipPath: 'inset(0)' }], { ...timing, delay: 320 }));
    document.querySelectorAll('.intro-line > *').forEach(part => opening.push(part.animate([{ transform: 'translateY(25px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { ...timing, duration: 900, delay: 450 })));
    opening.push(curtain.animate([{ transform: 'scaleY(1)', offset: 0 }, { transform: 'scaleY(1)', offset: .22 }, { transform: 'scaleY(0)' }], { ...timing, duration: 1350, delay: 250 }));
    opening.push(rail.animate([{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(-35px,0,0)', offset: .42 }, { transform: 'translate3d(0,0,0)' }], { ...timing, duration: 1450, delay: 1350 }));
    theatre.dataset.opening = 'playing';
    Promise.all(opening.map(animation => animation.finished.catch(() => {}))).then(() => { theatre.dataset.opening = 'complete'; });
  }
  new ResizeObserver(() => place()).observe(viewport);
  document.fonts?.ready.then(() => place());
  preference.addEventListener('change', () => { if (preference.matches) { stopOpening(); stop(); } });
  select(0, false, false); requestAnimationFrame(playOpening);
}
