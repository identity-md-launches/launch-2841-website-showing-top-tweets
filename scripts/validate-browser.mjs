import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

// Exercises the committed static export at a subpath, with no development server.
const exportRoot = resolve('dist');
const evidenceRoot = resolve('test/scratch/interaction');
await mkdir(evidenceRoot, { recursive: true });
const data = JSON.parse(await readFile('src/data/tweets.json', 'utf8')).posts;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!path.startsWith('/preview/')) throw new Error('Unknown route');
    const file = resolve(exportRoot, path.slice('/preview/'.length) || 'index.html');
    if (!file.startsWith(exportRoot + sep)) throw new Error('Outside export');
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const report = { results: [], limitations: [], browsers: {}, viewports: [] };
let failures = 0;

async function check(name, action) {
  try { await action(); report.results.push({ name, passed: true }); }
  catch (error) { failures++; report.results.push({ name, passed: false, error: error.message }); console.error(`FAIL: ${name}: ${error.message}`); }
}

async function suite(engine, name) {
  let browser;
  try { browser = await engine.launch({ headless: true }); }
  catch (error) {
    report.browsers[name] = 'Unavailable';
    report.limitations.push(`${name}: ${error.message}`);
    if (name === 'Chromium' || process.argv.includes('--require-webkit')) failures++;
    return;
  }
  report.browsers[name] = browser.version();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [], failedRequests = [], externalRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failedRequests.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => { if (!request.url().startsWith(url)) externalRequests.push(request.url()); });
  const cards = () => page.locator('.tweet-card');
  const count = async n => assert.equal(await cards().count(), n);
  const filter = text => page.getByRole('button', { name: text, exact: true });
  const navigate = text => page.getByRole('navigation').getByRole('link', { name: new RegExp(`^${text}`) }).click();
  const currentIds = () => cards().evaluateAll(elements => elements.map(element => element.dataset.tweetId));
  const sortedIds = key => [...data].sort((a, b) => key === 'newest' ? Date.parse(b.publishedAt) - Date.parse(a.publishedAt) : b[key] - a[key] || Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).map(tweet => tweet.id);
  const prefix = `${name}: `;
  try {
    await page.goto(url);
    await page.waitForFunction(() => document.querySelectorAll('.tweet-card').length === 12);
    await page.evaluate(() => document.fonts.ready);
    await check(prefix + 'loads all 12 real posts at a static subpath', () => count(12));
    await check(prefix + 'most-liked ranking is correct', async () => assert.deepEqual(await currentIds(), sortedIds('likes')));
    await check(prefix + 'first mobile screen includes product and action', async () => {
      for (const selector of ['h1', '.hero .button', '.tweet-card:first-child .tweet-text', '.tweet-card:first-child .source-link']) {
        const box = await page.locator(selector).boundingBox();
        assert(box && box.y >= 0 && box.y + box.height <= 844, selector);
      }
    });
    await page.screenshot({ path: resolve(evidenceRoot, `${name.toLowerCase()}-390.png`) });
    await check(prefix + 'main action moves to the tweet feed', async () => {
      await page.getByRole('link', { name: 'Explore tweets', exact: true }).click();
      await page.waitForFunction(() => document.activeElement?.id === 'feed');
      assert(await page.locator('#feed').evaluate(element => element.getBoundingClientRect().y < innerHeight));
    });
    for (const key of ['reposts', 'newest', 'likes']) {
      await check(prefix + `sorts by ${key}`, async () => {
        await page.locator('#sort').selectOption(key);
        assert.deepEqual(await currentIds(), sortedIds(key));
      });
    }
    for (const topic of ['AI & agents', 'Builders', 'Community', 'Memes']) {
      await check(prefix + `filters ${topic}`, async () => {
        await filter(topic).click();
        assert.equal(await filter(topic).getAttribute('aria-pressed'), 'true');
        assert.deepEqual(new Set(await currentIds()), new Set(data.filter(tweet => tweet.topic === topic).map(tweet => tweet.id)));
      });
    }
    await filter('All tweets').click();
    await check(prefix + 'search is case-insensitive and trims whitespace', async () => {
      await page.getByRole('searchbox').fill('  IMD TERMINAL  ');
      await count(1);
      assert.equal((await currentIds())[0], '2115740326153371722');
    });
    await check(prefix + 'search finds authors by handle', async () => {
      await page.getByRole('searchbox').fill('0xfinne'); await count(1);
    });
    await check(prefix + 'search and topic filters combine', async () => {
      await filter('Memes').click(); await count(0);
      assert(await page.getByRole('heading', { name: 'No tweets found' }).isVisible());
    });
    await check(prefix + 'clear filters recovers results and focus', async () => {
      await filter('Clear filters').click(); await count(12);
      assert(await page.getByRole('searchbox').evaluate(element => document.activeElement === element));
      assert.equal(await filter('All tweets').getAttribute('aria-pressed'), 'true');
    });
    await check(prefix + 'unmatched search has an actionable empty state', async () => {
      await page.getByRole('searchbox').fill('purple-platypus'); await count(0);
      assert((await page.locator('.empty-state').textContent()).includes('purple-platypus'));
      await filter('Clear filters').click(); await count(12);
    });
    await check(prefix + 'clear search preserves the selected topic', async () => {
      await filter('Builders').click(); await page.getByRole('searchbox').fill('0xfinne');
      await filter('Clear search').click(); await count(3);
      assert.equal(await filter('Builders').getAttribute('aria-pressed'), 'true');
      await filter('All tweets').click();
    });
    await check(prefix + 'saved empty state returns to discovery', async () => {
      await navigate('Saved'); await count(0);
      assert(await page.getByRole('heading', { name: 'Keep a little signal.' }).isVisible());
      await filter('Explore tweets').click(); await count(12);
    });
    await check(prefix + 'bookmarks update the control and Saved count', async () => {
      await page.getByRole('button', { name: 'Save tweet by @blknoiz06', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: 'Unsave tweet by @blknoiz06', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.getByRole('button', { name: 'Save tweet by @surfcoderepeat', exact: true }).click();
      assert.equal(await page.locator('.saved-count').textContent(), '2');
    });
    await check(prefix + 'saved view contains only bookmarks', async () => {
      await navigate('Saved'); await count(2);
      assert.deepEqual(new Set(await currentIds()), new Set(['2107170024980930713', '2107939454396567581']));
    });
    await check(prefix + 'bookmarks and saved route survive reload', async () => {
      await page.reload(); await page.locator('.tweet-card').first().waitFor(); await count(2);
      assert(await page.getByRole('heading', { name: 'Saved tweets' }).isVisible());
    });
    await check(prefix + 'removing a saved tweet preserves a keyboard destination', async () => {
      await page.getByRole('button', { name: 'Unsave tweet by @blknoiz06', exact: true }).click(); await count(1);
      await page.waitForFunction(() => document.activeElement?.id === 'feed');
    });
    await check(prefix + 'bookmarks synchronize across tabs', async () => {
      const tab = await context.newPage(); await tab.goto(url + '#saved'); await tab.locator('.tweet-card').first().waitFor();
      await page.getByRole('button', { name: 'Unsave tweet by @surfcoderepeat', exact: true }).click();
      await tab.getByRole('heading', { name: 'Keep a little signal.' }).waitFor();
      await tab.close();
    });
    await navigate('Discover');
    const shareButton = page.getByRole('button', { name: 'Share tweet by @blknoiz06', exact: true });
    await check(prefix + 'share dialog uses the original tweet URL', async () => {
      await shareButton.click();
      assert.equal(await page.getByLabel('Tweet link').inputValue(), data.find(tweet => tweet.handle === 'blknoiz06').url);
    });
    await check(prefix + 'clipboard success gives feedback', async () => {
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copied = value; } } }));
      await filter('Copy link').click();
      assert(await filter('Copied').isVisible());
      assert.equal(await page.evaluate(() => window.__copied), await page.getByLabel('Tweet link').inputValue());
    });
    await check(prefix + 'Escape closes the dialog and restores focus', async () => {
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(), 0);
      assert(await shareButton.evaluate(element => document.activeElement === element));
    });
    await check(prefix + 'denied clipboard offers manual copy', async () => {
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied for validation'); } } }));
      await shareButton.click(); await filter('Copy link').click();
      assert((await page.locator('.copy-message').textContent()).includes('copy it manually'));
      assert(await page.getByLabel('Tweet link').evaluate(element => document.activeElement === element && element.selectionStart === 0 && element.selectionEnd === element.value.length));
      await filter('Close dialog').click();
    });
    await check(prefix + 'About discloses provenance and local storage', async () => {
      await page.getByRole('button', { name: 'About this feed', exact: true }).click();
      const text = await page.getByRole('dialog').textContent();
      for (const phrase of ['12 posts from 10 authors', 'not a complete ranking of X', 'stored only in this browser']) assert(text.includes(phrase), phrase);
    });
    await check(prefix + 'native modal traps keyboard focus', async () => {
      try {
        for (let index = 0; index < 12; index++) {
          await page.keyboard.press('Tab');
          assert(await page.evaluate(() => document.activeElement?.closest('dialog') !== null));
        }
        for (let index = 0; index < 6; index++) {
          await page.keyboard.press('Shift+Tab');
          assert(await page.evaluate(() => document.activeElement?.closest('dialog') !== null));
        }
      } finally { await page.keyboard.press('Escape'); }
    });
    await check(prefix + 'source links retain original status IDs', async () => {
      const links = await page.locator('.source-link').evaluateAll(elements => elements.map(element => ({ href: element.href, target: element.target, rel: element.rel })));
      assert.deepEqual(new Set(links.map(link => link.href)), new Set(data.map(tweet => tweet.url)));
      assert(links.every(link => link.target === '_blank' && link.rel.includes('noopener')));
    });
    for (const width of [320, 390, 640, 900, 1100, 1440]) {
      await check(prefix + `responsive layout at ${width}px`, async () => {
        await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
        await page.evaluate(() => window.scrollTo(0, 0));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        const layout = await page.locator('.tweet-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
        assert.equal(layout, width <= 624 ? 1 : 2);
        const shot = resolve(evidenceRoot, `${name.toLowerCase()}-${width}.png`);
        await page.screenshot({ path: shot });
        report.viewports.push({ browser: name, width, screenshot: shot.split('/').slice(-4).join('/') });
      });
    }
    await check(prefix + '200% text enlargement reflows at 390px', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addStyleTag({ content: 'html{font-size:200% !important}' });
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize), '32px');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert(await page.locator('.hero-content').evaluate(element => element.scrollWidth <= element.clientWidth));
      await page.screenshot({ path: resolve(evidenceRoot, `${name.toLowerCase()}-text-200.png`), fullPage: true });
      await page.reload();
    });
    await check(prefix + 'reduced motion disables page motion', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
      assert.equal(await page.locator('.button-primary').first().evaluate(element => getComputedStyle(element).transitionDuration), '0s');
    });
    await check(prefix + 'keyboard skip link is visible and reaches the feed', async () => {
      await page.reload(); await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Skip to tweets');
      assert(await page.locator('.skip-link').evaluate(element => element.getBoundingClientRect().y >= 0));
      await page.screenshot({ path: resolve(evidenceRoot, `${name.toLowerCase()}-focus.png`) });
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'feed');
    });
    await check(prefix + 'WCAG A/AA automated audit of discovery', async () => {
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      await writeFile(resolve(evidenceRoot, `${name.toLowerCase()}-axe.json`), JSON.stringify(audit, null, 2));
      assert.deepEqual(audit.violations.map(violation => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map(node => node.target) })), []);
      assert.deepEqual(audit.incomplete.filter(item => item.id === 'aria-prohibited-attr').map(item => item.id), []);
    });
    await check(prefix + 'rendered without external requests or resource/script errors', async () => {
      assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []); assert.deepEqual(externalRequests, []);
      assert(await page.evaluate(() => document.fonts.check('16px "DM Sans"')));
    });
    const denied = await browser.newContext();
    await denied.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage unavailable for validation'); }; });
    await check(prefix + 'unavailable storage keeps bookmarks in memory and warns', async () => {
      const tab = await denied.newPage(); await tab.goto(url); await tab.locator('.tweet-card').first().waitFor();
      await tab.getByRole('button', { name: 'Save tweet by @blknoiz06', exact: true }).click();
      assert((await tab.getByRole('alert').textContent()).includes('last until you leave this page'));
      await tab.getByRole('navigation').getByRole('link', { name: /^Saved/ }).click();
      assert.equal(await tab.locator('.tweet-card').count(), 1);
    });
    await denied.close();
    const corrupted = await browser.newContext();
    await corrupted.addInitScript(() => localStorage.setItem('pond-saved-tweets-v1', '{invalid-json'));
    await check(prefix + 'malformed saved data does not break discovery', async () => {
      const tab = await corrupted.newPage(); await tab.goto(url); await tab.locator('.tweet-card').first().waitFor();
      assert.equal(await tab.locator('.tweet-card').count(), 12);
    });
    await corrupted.close();
  } finally { await context.close(); await browser.close(); }
}

try {
  assert((await stat('dist/index.html')).isFile());
  await suite(chromium, 'Chromium');
  await suite(webkit, 'WebKit');
} finally {
  server.close();
  report.passed = report.results.filter(result => result.passed).length;
  report.failed = failures;
  await writeFile(resolve(evidenceRoot, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed, browsers: report.browsers, limitations: report.limitations, evidence: 'test/scratch/interaction/results.json' }, null, 2));
}
process.exitCode = failures ? 1 : 0;
