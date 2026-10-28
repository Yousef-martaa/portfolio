import fs from 'node:fs/promises';

export const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function openBrowserPage() {
  const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map(), errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const task = pending.get(message.id); pending.delete(message.id);
      if (task) message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.value || arg.description).join(' '));
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  };
  const waitFor = async (expression, timeout = 20000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await pause(80); }
    throw new Error(`Timed out: ${expression}`);
  };
  const navigate = async url => { await send('Page.navigate', { url }); await waitFor('document.readyState === "complete"'); };
  const size = (width, height = 1000) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  const screenshot = async (file, full = true) => {
    const params = { format: 'png', captureBeyondViewport: full };
    if (full) { const metrics = await send('Page.getLayoutMetrics'); params.clip = { x: 0, y: 0, width: metrics.cssContentSize.width, height: metrics.cssContentSize.height, scale: 1 }; }
    const shot = await send('Page.captureScreenshot', params); await fs.writeFile(file, Buffer.from(shot.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  return { send, evaluate, waitFor, navigate, size, screenshot, errors,
    async close() { await send('Page.close').catch(() => {}); socket.close(); } };
}
