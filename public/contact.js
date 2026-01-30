const form = document.getElementById("contactForm");
const messageBox = document.getElementById("formMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    subject: document.getElementById("subject").value,
    message: document.getElementById("message").value,
  };

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      messageBox.innerHTML =
        "✅ Thanks for reaching out! I’ll get back to you as soon as possible.<br/>If it’s urgent, call <strong>072-783-3392</strong>.";
      messageBox.className = "form-message success";
      form.reset();
    } else {
      messageBox.textContent = "❌ Failed to send message.";
      messageBox.className = "form-message error";
    }
  } catch (error) {
    messageBox.textContent = "❌ Server error.";
    messageBox.className = "form-message error";
  }
});
