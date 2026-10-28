// Purpose-specific compositions. These are labeled concepts, not fabricated UI.
export function buildArtwork(document, project) {
  const node = (tag, cls, text) => {
    const el = document.createElement(tag); el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const art = node('div', `scene-art art-${project.motif}`);
  art.setAttribute('aria-hidden', 'true');
  if (project.motif === 'operations') {
    const flow = node('div', 'ops-flow');
    ['Multiple sources', 'Business rules', 'The right team'].forEach((label, i) => {
      const step = node('div', 'ops-step'); step.append(node('small', '', `0${i + 1}`), node('span', '', label)); flow.append(step);
    });
    art.append(node('strong', 'art-display', 'Collect.\nPrioritize.\nAssign.'), flow);
  } else if (project.motif === 'family') {
    const orbit = node('div', 'family-orbit');
    ['Family life', 'Local events', 'Your rights', 'Community'].forEach((text, i) => {
      const page = node('div', `family-page family-page-${i}`, text);
      page.append(node('span', 'family-symbol', ['◌', '↗', '§', '◎'][i])); orbit.append(page);
    });
    art.append(node('strong', 'art-display', 'A little closer.'), orbit);
  } else if (project.motif === 'commerce') {
    const textile = node('div', 'textile');
    textile.append(node('i', 'textile-fold fold-one'), node('i', 'textile-fold fold-two'), node('i', 'textile-fold fold-three'));
    const tag = node('div', 'collection-tag'); tag.append(node('span', '', 'COLLECTION /'), node('strong', '', 'Two\nlanguages.\nOne store.'), node('small', '', 'Commerce concept'));
    art.append(node('strong', 'art-display', 'Sukna.'), textile, tag);
  } else if (project.motif === 'indoor') {
    const plan = node('div', 'indoor-plan');
    for (let i = 0; i < 12; i++) plan.append(node('i', 'aisle'));
    plan.append(node('div', 'indoor-route'), node('div', 'position-dot'), node('span', 'plan-label', 'YOU ARE HERE'));
    art.append(plan, node('strong', 'art-display', 'Find your way.'));
  } else if (project.motif === 'people') {
    const columns = node('div', 'people-columns');
    ['PEOPLE', 'ROLES', 'ACCESS'].forEach((label, i) => {
      const column = node('div', 'people-column');
      for (let j = 0; j < 3; j++) { const tile = node('div', 'people-tile', label); tile.append(node('span', '', `0${i * 3 + j + 1}`)); column.append(tile); }
      columns.append(column);
    }); art.append(columns);
  } else if (project.motif === 'context') {
    const stack = node('div', 'context-stack');
    ['RULES', 'CONTEXT', 'MEMORY'].forEach((label, i) => {
      const sheet = node('div', 'context-sheet'); sheet.append(node('small', '', `AR&MF / 0${i + 1}`), node('strong', '', label), node('span', '', ['Set direction.', 'Keep focus.', 'Carry it forward.'][i])); stack.append(sheet);
    }); art.append(stack);
  } else {
    const grid = node('div', 'repository-map');
    for (let i = 0; i < 6; i++) grid.append(node('span', '', String(i + 1).padStart(2, '0')));
    art.append(grid);
  }
  return art;
}
