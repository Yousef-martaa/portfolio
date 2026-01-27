fetch("/api/projects")
  .then(res => res.json())
  .then(projects => {
    const container = document.getElementById("projects");

    projects.forEach(p => {
      const div = document.createElement("div");
      div.innerHTML = `
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <small>${p.tech}</small>
      `;
      container.appendChild(div);
    });
  });
