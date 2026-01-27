const express = require("express");
const app = express();

const PORT = 3000;

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
