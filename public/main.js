fetch("/api/projects")
  .then(res => res.json())
  .then(projects => {
    const container = document.getElementById("projects");

    projects.forEach(p => {
      const div = document.createElement("div");

      div.innerHTML = `
        <h3>${p.title}</h3>
        <p class="project-desc">${p.description}</p>
        <button class="toggle-btn">Read more</button>
        <small>${p.tech}</small>
`;


      const button = div.querySelector(".toggle-btn");

      button.addEventListener("click", () => {
        div.classList.toggle("expanded");
        button.textContent =
          button.textContent === "Read more"
            ? "Show less"
            : "Read more";
      });

      container.appendChild(div);
    });
  });
