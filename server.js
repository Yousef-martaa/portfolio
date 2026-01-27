const express = require("express");
const app = express();

app.use(express.static("public"));

app.get("/api/projects", (req, res) => {
  res.json([
    {
      title: "CookieBliss",
      tech: "HTML, CSS, JavaScript, Express",
      description: "Simple e-commerce frontend with Node.js backend."
    }
  ]);
});

module.exports = app;
