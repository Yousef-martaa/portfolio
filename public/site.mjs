import { loadRepositories, excludePortfolio } from './discovery.mjs';
import { curated, additional } from './project-data.mjs';
import { normalizeProject } from './projects.mjs';
import { renderCatalogue } from './render.mjs';
import { createReel } from './reel.mjs';
import { installProjectDetails } from './project-details.mjs';
import { initPageMotion } from './page-motion.mjs';
export { createReel } from './reel.mjs';

export async function init() {
  installProjectDetails(document);
  initPageMotion(document);
  if (document.getElementById('projectReel')) {
    createReel(document, excludePortfolio(curated).map(p => normalizeProject(null, p)));

  }
  const catalogue = document.getElementById('projectsGrid');
  if (!catalogue) return;
  const status = document.getElementById('projectsStatus'), retry = document.getElementById('projectsRetry');
  const count = document.getElementById('projectCount'), supplemental = document.getElementById('caseStudies');
  let shown = 12, projects = [];
  const more = document.getElementById('showMore');
  function reveal() {
    renderCatalogue(document, catalogue, projects.slice(0, shown)); more.hidden = projects.length <= shown;
    more.textContent = `Show more (${Math.max(0, projects.length - shown)} remaining) ↓`;
  }
  more.addEventListener('click', () => {
    const previous = shown; shown += 12; reveal();
    const heading = catalogue.children[previous]?.querySelector('h2');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  });
  async function refresh(isRetry = false) {
    retry.disabled = true; catalogue.setAttribute('aria-busy', 'true'); status.textContent = 'Discovering public repositories…';
    try {
      const result = await loadRepositories({ retry: isRetry });
      projects = result.repositories.map(repo => normalizeProject(repo)); shown = 12; reveal(); count.textContent = `${projects.length} public repositories`;
      status.textContent = result.errors.length ?
        (projects.length ? 'Partial collection. Completed results are shown; some GitHub requests failed. ' : 'GitHub is unavailable. ') + result.errors.join(' ') :
        (projects.length ? 'Up to date with this visit’s GitHub response. New public repositories appear here automatically.' : 'No eligible public repositories were returned.');
      retry.hidden = result.errors.length === 0;
      const discovered = new Set(result.repositories.map(r => r.full_name.toLowerCase()));
      const extras = excludePortfolio([...curated, ...additional]).filter(p => !p.fullName || !discovered.has(p.fullName.toLowerCase()));
      renderCatalogue(document, supplemental, extras.map(p => normalizeProject(null, p)));
    } catch { status.textContent = 'GitHub could not be reached. Please retry or browse the GitHub profile.'; retry.hidden = false; }
    finally { retry.disabled = false; catalogue.setAttribute('aria-busy', 'false'); }
  }
  retry.addEventListener('click', () => refresh(true)); await refresh();
}
