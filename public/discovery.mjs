export const USERNAME = 'Yousef-martaa';
// Exact identity confirmed from this repository's origin remote.
export const PORTFOLIO_REPOSITORY = 'Yousef-martaa/portfolio';
export function excludePortfolio(projects) {
  return projects.filter(project =>
    (project?.full_name || project?.fullName || '').toLowerCase() !== PORTFOLIO_REPOSITORY.toLowerCase());
}
const API = 'https://api.github.com';

// Each chain retains completed pages, even when a later page fails.
export async function fetchPages(path, { fetchImpl = globalThis.fetch, timeout = 12000 } = {}) {
  const items = [], errors = [], seen = new Set();
  let url = new URL(path, API).href;
  const original = new URL(url);
  while (url) {
    if (seen.has(url)) { errors.push(`${original.pathname}: repeated pagination link.`); break; }
    seen.add(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetchImpl(url, {
        signal: controller.signal, headers: { Accept: 'application/vnd.github+json' }
      });
      if (!response.ok) {
        const limited = response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0');
        throw new Error(limited ? 'GitHub request limit reached. Please try again later.' : `GitHub returned HTTP ${response.status}.`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Unexpected GitHub response.');
      items.push(...data);
      const links = response.headers.get('link') || '';
      const next = links.match(/<([^>]+)>;\s*rel="next"/);
      if (next) {
        const candidate = new URL(next[1], API);
        if (candidate.origin !== API || candidate.pathname !== original.pathname) throw new Error('Invalid pagination destination.');
        url = candidate.href;
      } else if (!links && data.length === 100) {
        const candidate = new URL(url);
        candidate.searchParams.set('page', String(Number(candidate.searchParams.get('page') || 1) + 1));
        url = candidate.href;
      } else url = null;
    } catch (error) {
      errors.push(`${original.pathname}: ${error.name === 'AbortError' ? 'Request timed out.' : error.message}`);
      break;
    } finally { clearTimeout(timer); }
  }
  return { items, errors };
}

export function eligibleRepositories(repositories) {
  const byId = new Map();
  for (const repo of excludePortfolio(repositories)) {
    if (!repo || !Number.isSafeInteger(repo.id) || typeof repo.full_name !== 'string' ||
        !/^[\w.-]+\/[\w.-]+$/.test(repo.full_name) || typeof repo.name !== 'string' ||
        repo.private === true || (repo.visibility && repo.visibility !== 'public') || repo.fork) continue;
    const previous = byId.get(repo.id);
    if (!previous || (Date.parse(repo.updated_at) || 0) > (Date.parse(previous.updated_at) || 0)) byId.set(repo.id, repo);
  }
  return [...byId.values()].sort((a, b) =>
    ((Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0)) ||
    a.full_name.toLowerCase().localeCompare(b.full_name.toLowerCase(), 'en') || a.id - b.id);
}

export async function discoverRepositories(options = {}) {
  const [user, organizations] = await Promise.all([
    fetchPages(`/users/${USERNAME}/repos?type=owner&per_page=100&sort=updated&direction=desc`, options),
    fetchPages(`/users/${USERNAME}/orgs?per_page=100`, options)
  ]);
  const errors = [...user.errors, ...organizations.errors];
  const repos = [...user.items];
  if (organizations.items.some(org => !org || typeof org.login !== 'string' || !/^[\w-]+$/.test(org.login))) {
    errors.push('Some malformed organization entries could not be loaded.');
  }
  const queue = [...new Set(organizations.items.filter(org => org && typeof org.login === 'string' && /^[\w-]+$/.test(org.login)).map(org => org.login))];
  // At most three organization chains are in flight. A failed chain never rejects others.
  await Promise.all(Array.from({ length: Math.min(3, queue.length) }, async () => {
    while (queue.length) {
      const login = queue.shift();
      const result = await fetchPages(`/orgs/${login}/repos?type=public&per_page=100&sort=updated&direction=desc`, options);
      repos.push(...result.items); errors.push(...result.errors);
    }
  }));
  const malformed = repos.some(repo => !repo || !Number.isSafeInteger(repo.id) || typeof repo.full_name !== 'string' || typeof repo.name !== 'string');
  if (malformed) errors.push('Some malformed GitHub entries could not be displayed.');
  return { repositories: eligibleRepositories(repos), errors };
}

let shared;
export function loadRepositories({ retry = false } = {}) {
  if (retry || !shared) shared = discoverRepositories();
  return shared;
}
