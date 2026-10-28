// Package semantics stay CommonJS; browser code uses native modules.
import('./site.mjs').then(({ init }) => init()).catch(() => {
  const status = document.getElementById('projectsStatus');
  if (status) status.textContent = 'Projects could not load. Please use the GitHub link below.';
});
