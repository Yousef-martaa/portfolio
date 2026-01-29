const GITHUB_USERNAME = "yousef-martaa";
const pinnedProjectsKey = "pinnedProjects";

async function fetchGitHubProjects() {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated`
  );
  return await res.json();
}

async function renderProjects() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  const repos = await fetchGitHubProjects();
  const pinned = JSON.parse(localStorage.getItem(pinnedProjectsKey)) || [];

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

    card.querySelector(".pin-btn").onclick = () => togglePin(repo.id);
    grid.appendChild(card);
  });
}

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

const grid = document.getElementById("projectsGrid");
const pinned = JSON.parse(localStorage.getItem("pinnedProjects")) || [];

if (grid) {
  projects.forEach(project => {
    const isPinned = pinned.includes(project.id);

    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <div class="project-actions">
        <button class="pin-btn">
          ${isPinned ? "★ Pinned" : "☆ Pin"}
        </button>
      </div>
    `;

    card.querySelector(".pin-btn").onclick = () => {
      togglePin(project.id);
    };

    grid.appendChild(card);
  });
}

function togglePin(id) {
  let pins = JSON.parse(localStorage.getItem("pinnedProjects")) || [];

  if (pins.includes(id)) {
    pins = pins.filter(p => p !== id);
  } else {
    pins.push(id);
  }

  localStorage.setItem("pinnedProjects", JSON.stringify(pins));
  location.reload();
}



async function renderPinnedProjects() {
  const container = document.getElementById("pinnedProjectsGrid");
  if (!container) return;

  const pinned = JSON.parse(localStorage.getItem(pinnedProjectsKey)) || [];
  if (pinned.length === 0) return;

  const repos = await fetchGitHubProjects();

  repos
    .filter(repo => pinned.includes(repo.id))
    .slice(0, 2)
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


renderProjects();
renderPinnedProjects();
