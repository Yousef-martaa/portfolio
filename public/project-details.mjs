import { element, cover, projectActions } from './render.mjs';

export function installProjectDetails(document) {
  const dialog = element(document, 'dialog', 'project-dialog');
  dialog.setAttribute('aria-labelledby', 'detailTitle');
  const heading = element(document, 'header', 'detail-heading');
  const category = element(document, 'p', 'micro');
  const close = element(document, 'button', 'detail-close', 'Back to the work ×'); close.type = 'button';
  close.setAttribute('aria-label', 'Close project details'); heading.append(category, close);
  const content = element(document, 'div', 'detail-content');
  const footer = element(document, 'footer', 'detail-footer');
  dialog.append(heading, content, footer); document.body.append(dialog);
  let trigger, closing, previousOverflow, restored = true;
  function restorePage() {
    if (restored) return;
    restored = true;
    document.documentElement.style.overflow = previousOverflow || '';
    document.body.classList.remove('details-open');
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  }
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  async function dismiss() {
    if (closing || !dialog.open) return;
    closing = true;
    dialog.classList.add('is-leaving');
    if (!reduced()) await Promise.all(dialog.getAnimations().map(animation => animation.finished.catch(() => {})));
    dialog.close(); restorePage(); dialog.classList.remove('is-leaving'); closing = false;
  }
  close.addEventListener('click', dismiss);
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  dialog.addEventListener('close', restorePage);
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button:not(:disabled), a[href]')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('project:open', event => {
    const project = event.detail.project;
    trigger = event.detail.trigger; closing = false; restored = false;
    category.textContent = `${project.category} / Project overview`;
    const left = element(document, 'div', 'detail-title-column');
    const title = element(document, 'h2', '', project.name); title.id = 'detailTitle';
    left.append(title, cover(document, project, 0));
    const copy = element(document, 'div', 'detail-copy');
    copy.append(element(document, 'p', 'detail-description', project.description), element(document, 'p', 'project-role', project.role));
    if (project.statuses.length) copy.append(element(document, 'p', 'status-label', project.statuses.join(' · ')));
    copy.append(element(document, 'p', 'detail-tech', project.technology));
    content.replaceChildren(left, copy);
    footer.replaceChildren(element(document, 'p', 'micro', 'Purpose first. Then the technology.'), projectActions(document, project));
    previousOverflow = document.documentElement.style.overflow;
    dialog.showModal(); document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('details-open'); close.focus({ preventScroll: true });
  });
  return dialog;
}
