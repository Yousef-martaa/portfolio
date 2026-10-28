import { buildArtwork } from './cover-art.mjs';

export function element(document, tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function detailButton(document, project, label = 'Explore project ↗') {
  const button = element(document, 'button', 'explore-project', label); button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  button.addEventListener('click', () => button.dispatchEvent(new CustomEvent('project:open', { bubbles: true, detail: { project, trigger: button } })));
  return button;
}

export function projectActions(document, project) {
  const actions = element(document, 'div', 'project-actions');
  for (const [label, url] of [['View site ↗', project.site], ['View code ↗', project.code]]) {
    if (!url) continue;
    const link = element(document, 'a', 'text-link', label);
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; actions.append(link);
  }
  if (!project.site && !project.code) actions.append(element(document, 'span', 'micro', 'Project overview · no public link verified'));
  return actions;
}

export function cover(document, project, index) {
  const art = element(document, 'div', `project-cover motif-${project.motif}`);
  if (!project.image) art.setAttribute('aria-hidden', 'true');
  art.style.setProperty('--scene', project.palette[0]);
  art.style.setProperty('--scene-ink', project.palette[1]);
  art.style.setProperty('--accent', project.palette[2]);
  art.append(buildArtwork(document, project));
  if (project.image) {
    const image = element(document, 'img', 'cover-image');
    image.src = project.image; image.alt = project.imageAlt;
    image.draggable = false;
    image.loading = 'lazy'; image.width = 1200; image.height = 834;
    art.append(image);
  }
  art.append(element(document, 'span', 'cover-number', String(index + 1).padStart(2, '0')),
    element(document, 'span', 'cover-word', project.name), element(document, 'span', 'cover-label', project.coverLabel));
  return art;
}

export function projectRow(document, project, index) {
  const article = element(document, 'article', 'catalogue-project');
  article.append(cover(document, project, index));
  const body = element(document, 'div', 'project-copy');
  body.append(element(document, 'p', 'micro', project.category), element(document, 'h2', '', project.name),
    element(document, 'p', '', project.description), element(document, 'p', 'project-role', project.role));
  if (project.technology) body.append(element(document, 'p', 'micro', project.technology));
  if (project.statuses.length) body.append(element(document, 'p', 'status-label', project.statuses.join(' · ')));
  body.append(projectActions(document, project), detailButton(document, project)); article.append(body);
  return article;
}

export function renderCatalogue(document, container, projects) {
  container.replaceChildren(...projects.map((project, i) => projectRow(document, project, i)));
}
