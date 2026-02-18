const GITHUB_USERNAME = "yousef-martaa";

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
   Render Projects Page (ALL projects)
========================= */
async function renderProjects() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  const repos = await fetchAllRepos();
  grid.innerHTML = "";

  repos.forEach(repo => {
    if (repo.fork) return;

    const card = document.createElement("div");
    card.className = "project-card";

    card.innerHTML = `
      <h3>${repo.name}</h3>
      <p>${repo.description || "No description provided."}</p>
      <div class="project-actions">
        <a href="${repo.html_url}" target="_blank">GitHub</a>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* =========================
   Render Pinned Projects (HOME - STATIC)
========================= */
const pinnedProjects = [

  {
    name: "mogges-store.se",
    description: "Production-ready e-commerce platform and integrated AI chatbot.",
    liveUrl: "https://mogges-store.se",
    
  },


  {
    name: "Mental-Health-Chatbot",
    description: "AI-powered mental health chatbot built with Python.",
    url: "https://github.com/Chatbot-Mental-Health/Mental-Health-Chatbot"
  },
  {
    name: "Portfolio",
    description: "Personal portfolio website built with HTML, CSS, and JavaScript.",
    url: "https://github.com/yousef-martaa/portfolio"
  },
  {
    name: "CookieBliss",
    description: "Commercial cookie website built as a real client project.",
    url: "https://github.com/FeatureDev/CookieBliss"
  }
];

function renderPinnedProjects() {
  const container = document.getElementById("pinnedProjectsGrid");
  if (!container) return;

  container.innerHTML = "";

  pinnedProjects.forEach(project => {
    const card = document.createElement("div");
    card.className = "project-card";

    card.innerHTML = `
      <h3>${project.name}</h3>
      <p>${project.description}</p>
      <a href="${project.url}" target="_blank">GitHub</a>
    `;

    container.appendChild(card);
  });
}

/* =========================
   Init
========================= */
renderProjects();
renderPinnedProjects();
