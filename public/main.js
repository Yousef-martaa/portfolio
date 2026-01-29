const GITHUB_USERNAME = "yousef-martaa";
const pinnedProjectsKey = "pinnedProjects";

/* =========================
   Fetch GitHub Repos
========================= */
async function fetchUserRepos() {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`
  );
  return await res.json();
}

async function fetchOrgRepos() {
  const orgsRes = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/orgs`
  );
  const orgs = await orgsRes.json();

  const repos = [];

  for (const org of orgs) {
    const res = await fetch(
      `https://api.github.com/orgs/${org.login}/repos?per_page=100&sort=updated`
    );
    const data = await res.json();
    repos.push(...data);
  }

  return repos;
}

async function fetchAllRepos() {
  const [userRepos, orgRepos] = await Promise.all([
    fetchUserRepos(),
    fetchOrgRepos()
  ]);

  return [...userRepos, ...orgRepos];
}

/* =========================
   Render Projects Page
========================= */
async function renderProjects() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  const repos = await fetchAllRepos();
  const pinned = JSON.parse(localStorage.getItem(pinnedProjectsKey)) || [];

  grid.innerHTML = "";

  repos.forEach(repo => {
    if (repo.fork) return;

    const isPinned = pinned.includes(repo.id);

    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <h3>${repo.name}</h3>
      <p>${repo.description || "No description provided."}</p>
      <div class="project-actions">
        <a href="${repo.html_url}" target="_blank">GitHub</a>
        <button class="pin-btn">
          ${isPinned ? "★ Pinned" : "☆ Pin"}
        </button>
      </div>
    `;

    card.querySelector(".pin-btn").addEventListener("click", () => {
      togglePin(repo.id);
    });

    grid.appendChild(card);
  });
}

/* =========================
   Pin / Unpin
========================= */
function togglePin(id) {
  let pins = JSON.parse(localStorage.getItem(pinnedProjectsKey)) || [];

  if (pins.includes(id)) {
    pins = pins.filter(p => p !== id);
  } else {
    pins.push(id);
  }

  localStorage.setItem(pinnedProjectsKey, JSON.stringify(pins));
  location.reload();
}

/* =========================
   Render Pinned Projects (Home)
========================= */
async function renderPinnedProjects() {
  const container = document.getElementById("pinnedProjectsGrid");
  if (!container) return;

  const pinned = JSON.parse(localStorage.getItem(pinnedProjectsKey)) || [];
  if (pinned.length === 0) return;

  const repos = await fetchAllRepos();
  container.innerHTML = "";

  repos
    .filter(repo => pinned.includes(repo.id))
    .forEach(repo => {
      const card = document.createElement("div");
      card.className = "project-card";
      card.innerHTML = `
        <h3>${repo.name}</h3>
        <p>${repo.description || "No description provided."}</p>
        <a href="${repo.html_url}" target="_blank">GitHub</a>
      `;
      container.appendChild(card);
    });
}

/* =========================
   Init
========================= */
renderProjects();
renderPinnedProjects();
