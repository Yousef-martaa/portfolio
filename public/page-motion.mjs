export function initPageMotion(document) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = [];
  const reveal = element => {
    if (preference.matches) return;
    animations.push(element.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], {
      duration: 850, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'
    }));
  };
  if (!document.body.classList.contains('home')) document.querySelectorAll('.page-opening > *, .contact-opening > *').forEach(reveal);
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); }
  }), { threshold: .12 });
  document.querySelectorAll('.profile > *, .skill-row, .experience-row, .contact-callout').forEach(element => observer.observe(element));
  preference.addEventListener('change', () => { if (preference.matches) animations.forEach(animation => animation.cancel()); });
}
