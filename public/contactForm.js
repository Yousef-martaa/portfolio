const form = document.getElementById('contactForm');
const messageBox = document.getElementById('formMessage');
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled || !form.reportValidity()) return;
  button.disabled = true; button.textContent = 'Sending…'; form.setAttribute('aria-busy', 'true');
  messageBox.textContent = 'Sending your message…';
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 30000);
  try {
    const data = Object.fromEntries(['name', 'email', 'subject', 'message'].map(id => [id, document.getElementById(id).value]));
    const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: controller.signal });
    if (!response.ok) {
      let payload; try { payload = await response.json(); } catch { /* Handle proxy HTML too. */ }
      throw new Error(payload?.message || 'Message could not be sent. Please try again or use email or telephone.');
    }
    form.reset(); form.hidden = true;
    messageBox.textContent = 'Thanks for reaching out! I’ll get back to you as soon as possible. If it’s urgent, call 072-783-3392.';
    messageBox.className = 'form-message success'; messageBox.focus();
  } catch (error) {
    messageBox.textContent = error.name === 'AbortError' ? 'The request timed out; delivery could not be confirmed. Please contact me directly.' : error.message;
    messageBox.className = 'form-message error';
  } finally { clearTimeout(timer); button.disabled = false; button.textContent = 'Send message ↗'; form.setAttribute('aria-busy', 'false'); }
});
