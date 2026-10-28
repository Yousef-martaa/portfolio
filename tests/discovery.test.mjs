import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverRepositories, eligibleRepositories, fetchPages, excludePortfolio } from '../public/discovery.mjs';
import { normalizeProject, safeHttpUrl, projectHomepage } from '../public/projects.mjs';
import { metadata } from '../public/project-data.mjs';
import { renderCatalogue } from '../public/render.mjs';

const repo = (id, name, extra = {}) => ({ id, name, full_name: `Yousef-martaa/${name}`, private: false, fork: false, updated_at: '2026-10-01T00:00:00Z', owner: { type: 'User' }, ...extra });
const response = (data, link = '', status = 200, extraHeaders = {}) => ({ ok: status === 200, status, headers: new Headers({ link, ...extraHeaders }), json: async () => data });
function fakeDocument() {
  class Node {
    constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; this.style = { setProperty() {} }; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener() {}
    set innerHTML(_) { throw new Error('External metadata must not use HTML parsing'); }
  }
  return { createElement: tag => new Node(tag) };
}
test('new uncurated repository is discovered, normalized and rendered without changing metadata', async () => {
  const novel = repo(99999, 'brand-new-unlisted-tool', { description: '<img src=x onerror=alert(1)>', language: 'Rust' });
  assert.equal(metadata.has(novel.full_name.toLowerCase()), false);
  const result = await discoverRepositories({ fetchImpl: async url => response(url.includes('/repos?') ? [novel] : []) });
  const projects = result.repositories.map(r => normalizeProject(r));
  const doc = fakeDocument(), root = doc.createElement('div'); renderCatalogue(doc, root, projects);
  assert.equal(root.children.length, 1);
  const copy = root.children[0].children[1];
  assert.equal(copy.children[1].textContent, 'brand-new-unlisted-tool');
  assert.equal(copy.children[2].textContent, novel.description);
  assert.equal(projects[0].code, 'https://github.com/Yousef-martaa/brand-new-unlisted-tool');
  assert.equal(projects[0].primaryUrl, projects[0].code);
  assert.equal(projects[0].technology, 'Rust');
});
test('pagination covers user repos, organization list and organization repos; deduplicates and globally sorts', async () => {
  const calls = [], base = 'https://api.github.com';
  const result = await discoverRepositories({ fetchImpl: async raw => {
    calls.push(raw); const url = new URL(raw), page2 = url.searchParams.get('page') === '2';
    if (url.pathname.endsWith('/orgs')) return response(page2 ? [{ login: 'second-org' }] : [{ login: 'first-org' }], page2 ? '' : `<${raw}&page=2>; rel="next"`);
    if (url.pathname === '/users/Yousef-martaa/repos') return response(page2 ? [repo(2, 'zeta')] : [repo(1, 'alpha'), repo(7, 'fork', { fork: true })], page2 ? '' : `<${raw}&page=2>; rel="next"`);
    if (url.pathname === '/orgs/first-org/repos') return response(page2 ? [repo(3, 'archived', { archived: true, disabled: true, is_template: true, updated_at: '2026-10-02' })] : [repo(1, 'alpha')], page2 ? '' : `<${raw}&page=2>; rel="next"`);
    assert.equal(url.origin, base); return response([]);
  } });
  assert.deepEqual(result.repositories.map(r => r.name), ['archived', 'alpha', 'zeta']);
  for (const path of ['/users/Yousef-martaa/repos', '/users/Yousef-martaa/orgs', '/orgs/first-org/repos']) assert(calls.some(url => url.includes(path) && url.includes('page=2')));
  assert(calls.some(url => url.includes('/orgs/second-org/repos')));
  const status = normalizeProject(result.repositories[0]).statuses;
  assert.deepEqual(status, ['Archived', 'Disabled', 'Template']); assert.deepEqual(result.errors, []);
});
test('later-page failures preserve completed user and organization results', async () => {
  const result = await discoverRepositories({ fetchImpl: async raw => {
    const url = new URL(raw);
    if (url.pathname.endsWith('/orgs')) return response([{ login: 'good' }, { login: 'broken' }]);
    if (url.pathname.includes('/users/')) return response([repo(1, 'personal')]);
    if (url.pathname.includes('/broken/')) return response({ message: 'failure' }, '', 503);
    if (url.searchParams.has('page')) return response({ message: 'limited' }, '', 403, { 'x-ratelimit-remaining': '0' });
    return response([repo(2, 'org')], `<${raw}&page=2>; rel="next"`);
  } });
  assert.equal(result.repositories.length, 2); assert.equal(result.errors.length, 2);
  assert(result.errors.some(e => e.includes('request limit')));
});
test('organization chains have bounded concurrency', async () => {
  let active = 0, maximum = 0;
  await discoverRepositories({ fetchImpl: async url => {
    if (url.includes('/users/') && url.includes('/orgs?')) return response(Array.from({ length: 8 }, (_, i) => ({ login: `org-${i}` })));
    if (url.includes('/orgs/')) { active++; maximum = Math.max(maximum, active); await new Promise(r => setTimeout(r, 5)); active--; }
    return response([]);
  } });
  assert.equal(maximum, 3);
});
test('invalid shapes, total failure, timeout, foreign links and pagination cycles are bounded', async () => {
  assert((await fetchPages('/users/test/orgs', { fetchImpl: async () => response({ message: 'bad' }) })).errors.length);
  assert((await fetchPages('/users/test/orgs', { fetchImpl: async () => response([], '<https://evil.example/x>; rel="next"') })).errors.length);
  const cycle = await fetchPages('/users/test/orgs', { fetchImpl: async url => response([], `<${url}>; rel="next"`) });
  assert(cycle.errors.some(e => e.includes('repeated')));
  const timed = await fetchPages('/users/test/orgs', { timeout: 5, fetchImpl: (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))) });
  assert(timed.errors.some(e => e.includes('timed out')));
  const result = await discoverRepositories({ fetchImpl: async () => response({}, '', 500) });
  assert.equal(result.repositories.length, 0); assert.equal(result.errors.length, 2);
});
test('private data and forks are excluded; missing editorial data never excludes eligible repositories', () => {
  assert.deepEqual(eligibleRepositories([repo(1, 'keep'), repo(2, 'private', { private: true }), repo(3, 'fork', { fork: true }), null]).map(r => r.id), [1]);
});

test('only this exact portfolio identity is excluded from discovery and editorial collections', async () => {
  const repositories = [repo(1, 'portfolio'), repo(2, 'portfolio', { full_name: 'another-owner/portfolio' }),
    repo(3, 'portfolio-tools'), repo(4, 'PORTFOLIO', { full_name: 'YOUSEF-MARTAA/PORTFOLIO' })];
  const result = await discoverRepositories({ fetchImpl: async url => response(url.includes('/repos?') ? repositories : []) });
  assert.deepEqual(result.repositories.map(r => r.id).sort(), [2, 3]);
  assert.deepEqual(excludePortfolio([{ fullName: 'Yousef-martaa/portfolio' }, { fullName: 'another-owner/portfolio' }, { key: 'independent' }]),
    [{ fullName: 'another-owner/portfolio' }, { key: 'independent' }]);
});
test('metadata matches full owner/repo identity, not a coincidental title; organization ownership stays explicit', () => {
  const project = normalizeProject(repo(101, 'staffsync', { full_name: 'different-org/staffsync', owner: { type: 'Organization' } }));
  assert.equal(project.site, null); assert.equal(project.name, 'staffsync');
  assert.equal(project.role, 'Organization repository · different-org');
});
test('URL selection validates schemes and project destinations; verified override wins', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '//example.org', 'https://user:pass@example.org', 'https://example.org/ bad', 'https://localhost']) assert.equal(safeHttpUrl(url), null);
  for (const url of ['https://github.com/person', 'https://docs.example.org/', 'https://img.shields.io/badge/x', 'https://example.org/README.md']) assert.equal(projectHomepage(url), null);
  assert.equal(normalizeProject(repo(1, 'tool', { homepage: 'javascript:bad' })).site, null);
  assert.equal(normalizeProject(repo(1, 'tool', { homepage: 'https://tool.example.org' })).site, 'https://tool.example.org/');
  assert.equal(normalizeProject(repo(1, 'tool', { homepage: 'https://other.example.org' }), { verifiedSite: 'https://verified.example.org' }).site, 'https://verified.example.org/');
});
