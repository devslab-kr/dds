import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createServer } from 'vite';
import solid from 'vite-plugin-solid';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixtureId = join(root, 'src/__tests__/dialog-focus-browser.tsx').replaceAll('\\', '/');
const fixture = `
  import { createSignal, Show } from 'solid-js';
  import { render } from 'solid-js/web';
  import { Dialog } from '../dialog';
  const [open, setOpen] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [retry, setRetry] = createSignal(false);
  let field: HTMLInputElement; let fallback: HTMLButtonElement;
  Object.assign(window, { addRetry: () => setRetry(true), setDialogBusy: setBusy });
  render(() => <>
    <button id="opener" onClick={() => setOpen(true)}>Open task</button>
    <p id="background">Background work</p>
    <button ref={fallback} id="fallback">Fallback focus</button>
    <div id="retry-region"><Show when={retry()}><button id="retry" onClick={() => { setRetry(false); field.focus(); }}>Retry failed task</button></Show></div>
    <Dialog open={open()} onOpenChange={setOpen} title="Scoped task" role="alertdialog"
      portal unstyled class="task-panel" overlayClass="task-overlay" closeOnOutside={false}
      initialFocus={() => field} finalFocus={() => fallback}
      additionalFocusContainers={() => [document.getElementById('retry-region')]}
      onEscapeKeyDown={event => { if (busy()) event.preventDefault(); }}
      frame={parts => <><header>{parts.title}</header><section>{parts.children}</section><footer>{parts.actions}</footer></>}
      actions={<button id="last">Last action</button>}>
      <input ref={field} aria-label="Task field" /><button>Submit task</button>
    </Dialog>
  </>, document.getElementById('app')!);
`;
let server;
let browser;
try {
  server = await createServer({ root, configFile: false, plugins: [
    { name: 'dialog-test-fixture',
      resolveId(id) { if (id === '/src/__tests__/dialog-focus-browser.tsx' || id.replaceAll('\\', '/') === fixtureId) return fixtureId; },
      load(id) { if (id === fixtureId) return fixture; },
      configureServer(vite) {
        vite.middlewares.use((request, response, next) => {
          if (request.url !== '/') return next();
          response.setHeader('Content-Type', 'text/html');
          response.end('<!doctype html><html><head><style>.task-overlay{position:fixed;inset:0;display:grid;place-items:center;background:#0006}.task-panel{background:white;padding:24px}#retry-region{position:fixed;bottom:12px;right:12px;z-index:20}</style></head><body><div id="app"></div><script type="module" src="/src/__tests__/dialog-focus-browser.tsx"></script></body></html>');
        });
      },
    },
    solid({ hot: false }),
  ], server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.getByRole('button', { name: 'Open task' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Scoped task' });
  await dialog.waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Task field');
  assert.equal(await page.locator('#background').evaluate(element => Boolean(element.closest('[aria-hidden="true"]'))), true);
  assert.equal(await page.locator('#retry-region').evaluate(element => Boolean(element.closest('[aria-hidden="true"]'))), false);
  await page.evaluate(() => window.addRetry());
  await page.locator('#last').focus(); await page.keyboard.press('Tab');
  assert.equal(await page.locator('#retry').evaluate(element => element === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.getByRole('textbox', { name: 'Task field' }).evaluate(element => element === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.locator('#retry').evaluate(element => element === document.activeElement), true);
  await page.getByRole('button', { name: 'Retry failed task' }).click();
  await page.locator('#retry').waitFor({ state: 'detached' });
  assert.equal(await dialog.isVisible(), true);
  await page.evaluate(() => window.setDialogBusy(true)); await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), true);
  await page.evaluate(() => window.setDialogBusy(false)); await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.activeElement?.id === 'fallback');
  assert.equal(await page.locator('#background').evaluate(element => Boolean(element.closest('[aria-hidden="true"]'))), false);
  assert.deepEqual(errors, []);
  console.log('DDS dialog real-browser portal/frame, initial/final focus, dynamic retry Tab cycle, external ARIA scope and busy Escape passed');
} finally {
  await Promise.allSettled([browser?.close(), server?.close()]);
}
