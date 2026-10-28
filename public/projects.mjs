import { metadata } from './project-data.mjs';

export function safeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim() || /[\s\u0000-\u001f]/.test(value.trim())) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) return null;
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}

export function projectHomepage(value) {
  const valid = safeHttpUrl(value);
  if (!valid) return null;
  const url = new URL(valid);
  // Source repositories, badges and documentation are not deployed applications.
  if (['github.com', 'www.github.com', 'api.github.com', 'raw.githubusercontent.com', 'shields.io', 'img.shields.io', 'docs.google.com'].includes(url.hostname) ||
      url.hostname.startsWith('docs.') || /(^|\/)(readme(?:\.md)?|docs?|badge[s]?)(\/|$)/i.test(url.pathname)) return null;
  return valid;
}

export function normalizeProject(repo, override = undefined) {
  const editorial = override || metadata.get(repo?.full_name?.toLowerCase()) || {};
  const fullName = repo?.full_name || editorial.fullName;
  const code = fullName && /^[\w.-]+\/[\w.-]+$/.test(fullName) ? `https://github.com/${fullName}` : null;
  const site = projectHomepage(editorial.verifiedSite) || projectHomepage(repo?.homepage);
  const owner = fullName?.split('/')[0];
  const org = repo?.owner?.type === 'Organization' || (owner && owner.toLowerCase() !== 'yousef-martaa');
  return {
    id: repo?.id || editorial.key, fullName, name: editorial.name || repo?.name || 'Untitled project',
    caption: editorial.caption || editorial.category || repo?.language || 'A public project, open to explore.',
    captionCredit: editorial.captionCredit,
    description: editorial.description || (typeof repo?.description === 'string' && repo.description) || 'A public repository. Explore the source for more context.',
    category: editorial.category || (typeof repo?.language === 'string' && repo.language) || 'Public repository',
    technology: editorial.technology || (typeof repo?.language === 'string' && repo.language) || '',
    role: editorial.role || (org ? `Organization repository · ${owner}` : `Personal repository · ${owner || 'Yousef Martaa'}`),
    statuses: [editorial.status, repo?.archived && 'Archived', repo?.disabled && 'Disabled', repo?.is_template && 'Template'].filter(Boolean),
    site, code, primaryUrl: site || code, linkSource: editorial.source || (site ? 'GitHub homepage metadata' : 'Public repository identity'),
    palette: editorial.palette || ['#292b2b', '#f8f5ed', '#c2c1b8'],
    image: editorial.image, imageAlt: editorial.imageAlt,
    coverLabel: editorial.image ? 'Public interface · October 2026' : 'Concept illustration',
    motif: editorial.motif || 'repository'
  };
}
