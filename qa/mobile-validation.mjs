import { chromium, webkit, devices } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { computeTargetHitRadiusPx, canCollectTarget } from '../src/legacy/huntValidation.js';

const BASE = 'http://127.0.0.1:4173/Hirundu1.1-/';
const outDir = path.resolve('qa-results');
await fs.mkdir(outDir, { recursive: true });

const results = [];
const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function testCase(deviceName, browserName, name, fn) {
  const row = { device: deviceName, browser: browserName, name, ok: false };
  try {
    row.details = await fn();
    row.ok = true;
  } catch (error) {
    row.error = String(error?.stack || error);
    failures.push(row);
  }
  results.push(row);
}

async function newContext(browser, profileName) {
  const profile = { ...devices[profileName] };
  delete profile.defaultBrowserType;
  const context = await browser.newContext(profile);
  await context.addInitScript(() => {
    try {
      localStorage.setItem('player_name', 'Mobile QA');
      localStorage.setItem('__lang__', 'fr');
      localStorage.setItem('hirundu_arcade_language', 'fr');
    } catch {}
  });
  return context;
}

async function startClassicHunt(page, level) {
  await page.goto(BASE + '#/level/' + level, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1100);
  const name = page.locator('#playerName');
  if (await name.count() && await name.isVisible()) await name.fill('Mobile QA');
  const start = page.locator('#startBtn');
  if (await start.count() && await start.isVisible()) {
    await start.click();
    await page.waitForTimeout(800);
  }
}

async function classicHuntCheck(browser, profileName, label, level) {
  const context = await newContext(browser, profileName);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  try {
    await startClassicHunt(page, level);
    const canvas = await page.locator('#c').boundingBox();
    const phase = await page.locator('body').getAttribute('data-game-phase');
    const dims = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
      sh: document.documentElement.scrollHeight,
      ch: document.documentElement.clientHeight,
    }));
    assert(canvas && canvas.width > 250 && canvas.height > 350, 'canvas too small or missing');
    assert(dims.sw <= dims.cw + 1, 'horizontal overflow detected');
    assert(phase === 'hunt', 'expected hunt phase, got ' + phase);
    assert(pageErrors.length === 0, 'page errors: ' + pageErrors.join(' | '));
    return { canvas, phase, viewport: page.viewportSize(), dims };
  } finally {
    await context.close();
  }
}

async function rootCheck(browser, profileName) {
  const context = await newContext(browser, profileName);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const childCount = await page.locator('#root').evaluate(el => el.childElementCount);
    const text = (await page.locator('body').innerText()).trim();
    assert(childCount > 0, 'React root is empty');
    assert(text.length > 10, 'body looks blank');
    assert(pageErrors.length === 0, 'page errors: ' + pageErrors.join(' | '));
    return { childCount, text: text.slice(0, 140), url: page.url() };
  } finally {
    await context.close();
  }
}

async function flightCheck(browser, profileName, level) {
  const context = await newContext(browser, profileName);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  try {
    await page.goto(BASE + 'level' + level + '-flight/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const b = document.getElementById('start');
      return b && !b.disabled;
    }, null, { timeout: 12000 });
    await page.locator('#start').click();
    await page.waitForTimeout(700);
    const canvas = await page.locator('#game').boundingBox();
    const dims = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    assert(canvas && canvas.width > 250 && canvas.height > 350, 'flight canvas missing/small');
    assert(dims.sw <= dims.cw + 1, 'horizontal overflow detected');
    await page.locator('#pause').click();
    await page.waitForTimeout(150);
    assert(await page.locator('#pauseLangRow').isVisible(), 'pause language selector not visible');
    assert(await page.locator('#musicToggle').isVisible(), 'pause music toggle not visible');
    await page.locator('#lang').selectOption('it');
    const stored = await page.evaluate(() => localStorage.getItem('__lang__'));
    assert(stored === 'it', 'flight language did not persist');
    assert(pageErrors.length === 0, 'page errors: ' + pageErrors.join(' | '));
    return { canvas, storedLanguage: stored, dims };
  } finally {
    await context.close();
  }
}

async function arkanoidCheck(browser, profileName, level) {
  const context = await newContext(browser, profileName);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  try {
    await page.goto(BASE + 'level' + level + '-arkanoid/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    const canvasCount = await page.locator('canvas').count();
    const dims = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    assert(canvasCount > 0, 'Arkanoid canvas missing');
    assert(dims.sw <= dims.cw + 1, 'horizontal overflow detected');
    assert(pageErrors.length === 0, 'page errors: ' + pageErrors.join(' | '));
    return { canvasCount, dims };
  } finally {
    await context.close();
  }
}

async function battleLanguageCheck(browser, landscapeProfileName) {
  const context = await newContext(browser, landscapeProfileName);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  try {
    await page.goto(BASE + '#/level/1?test=battle', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const name = page.locator('#playerName');
    if (await name.count() && await name.isVisible()) await name.fill('Mobile QA');
    const start = page.locator('#startBtn');
    if (await start.count() && await start.isVisible()) {
      await start.click();
      await page.waitForTimeout(500);
    }
    const battleStart = page.locator('#__battle_start_btn');
    await battleStart.waitFor({ state: 'visible', timeout: 8000 });
    assert(!(await battleStart.isDisabled()), 'battle start should be enabled in landscape');
    await battleStart.click();
    await page.waitForTimeout(700);
    const phaseBefore = await page.locator('body').getAttribute('data-game-phase');
    assert(phaseBefore === 'battle', 'expected battle phase, got ' + phaseBefore);

    await page.evaluate(() => { window.__MOBILE_QA_MARKER__ = 'alive'; });
    await page.locator('#pauseBtn').click();
    await page.waitForTimeout(150);
    const select = page.locator('.game-pause__language select');
    await select.waitFor({ state: 'visible', timeout: 3000 });
    const beforeUrl = page.url();
    await select.selectOption('it');
    await page.waitForTimeout(350);

    const marker = await page.evaluate(() => window.__MOBILE_QA_MARKER__ || null);
    const phaseAfter = await page.locator('body').getAttribute('data-game-phase');
    const htmlLang = await page.locator('html').getAttribute('lang');
    assert(marker === 'alive', 'page reloaded during battle language change');
    assert(page.url() === beforeUrl, 'URL changed during battle language change');
    assert(phaseAfter === 'battle', 'battle phase lost after language change');
    assert(htmlLang === 'it', 'battle labels did not switch to Italian');
    assert(pageErrors.length === 0, 'page errors: ' + pageErrors.join(' | '));
    return { phaseBefore, phaseAfter, marker, htmlLang };
  } finally {
    await context.close();
  }
}

async function orientationGateCheck(browser, portraitProfileName) {
  const context = await newContext(browser, portraitProfileName);
  const page = await context.newPage();
  try {
    await page.goto(BASE + '#/level/1?test=battle', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    const start = page.locator('#startBtn');
    if (await start.count() && await start.isVisible()) {
      await start.click();
      await page.waitForTimeout(450);
    }
    const battleStart = page.locator('#__battle_start_btn');
    await battleStart.waitFor({ state: 'visible', timeout: 8000 });
    const disabledPortrait = await battleStart.isDisabled();
    assert(disabledPortrait, 'battle start should be disabled in portrait');
    const vp = page.viewportSize();
    await page.setViewportSize({ width: vp.height, height: vp.width });
    await page.waitForTimeout(450);
    const disabledLandscape = await battleStart.isDisabled();
    assert(!disabledLandscape, 'battle start did not enable after landscape rotation');
    return { disabledPortrait, disabledLandscape };
  } finally {
    await context.close();
  }
}

async function sourceRegressionChecks() {
  const l1 = await fs.readFile('src/game.js', 'utf8');
  const l2 = await fs.readFile('src/levels/level2/level2_game.js', 'utf8');
  const l3 = await fs.readFile('src/levels/level3/level3_game.js', 'utf8');
  const l8 = await fs.readFile('public/level8-flight/game.js', 'utf8');

  assert(/MAP_ZOOM:\s*1\b/.test(l1), 'L1 framing no longer uses MAP_ZOOM 1');
  assert(/MAP_ZOOM:\s*1\.30/.test(l2), 'L2 framing no longer uses MAP_ZOOM 1.30');
  assert(/MAP_ZOOM:\s*1\.30/.test(l3), 'classic shared framing no longer uses MAP_ZOOM 1.30');
  assert(!/scale\(1,-1\)/.test(l8), 'L8 mirrored scrolling has returned');

  const target = { key: 'a', x: .50, y: .50 };
  const neighbour = { key: 'b', x: .56, y: .50 };
  const radius390 = computeTargetHitRadiusPx(target, [target, neighbour], 390, 664);
  const radius393 = computeTargetHitRadiusPx(target, [target, neighbour], 393, 727);
  assert(radius390 <= 18 && radius393 <= 18, 'X hit radius too large on mobile');
  assert(!canCollectTarget({ questionReady:false, targetEntryReady:true, now:2000, collectLockUntil:0, playerX:100, playerY:100, targetX:100, targetY:100, radiusPx:18 }), 'X can validate before question');
  return { radius390, radius393 };
}

const browsers = [
  { browserName: 'WebKit', device: 'iPhone 13', landscape: 'iPhone 13 landscape', launcher: webkit },
  { browserName: 'Chromium', device: 'Pixel 5', landscape: 'Pixel 5 landscape', launcher: chromium },
];

await testCase('source', 'Node', 'regression guards', sourceRegressionChecks);

for (const cfg of browsers) {
  const browser = await cfg.launcher.launch({ headless: true });
  try {
    await testCase(cfg.device, cfg.browserName, 'root/PWA entry is not blank', () => rootCheck(browser, cfg.device));
    await testCase(cfg.device, cfg.browserName, 'Level 1 classic hunt portrait layout', () => classicHuntCheck(browser, cfg.device, cfg.browserName, 1));
    await testCase(cfg.device, cfg.browserName, 'Level 2 classic hunt portrait layout', () => classicHuntCheck(browser, cfg.device, cfg.browserName, 2));
    for (const level of [4, 6, 8]) {
      await testCase(cfg.device, cfg.browserName, 'Level ' + level + ' flight hunt runtime', () => flightCheck(browser, cfg.device, level));
    }
    for (const level of [3, 5, 7]) {
      await testCase(cfg.device, cfg.browserName, 'Level ' + level + ' Arkanoid mobile load', () => arkanoidCheck(browser, cfg.device, level));
    }
    await testCase(cfg.landscape, cfg.browserName, 'battle language hot swap keeps battle alive', () => battleLanguageCheck(browser, cfg.landscape));
    await testCase(cfg.device, cfg.browserName, 'battle portrait -> landscape gate', () => orientationGateCheck(browser, cfg.device));
  } finally {
    await browser.close();
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  mainSha: process.env.GITHUB_SHA || null,
  total: results.length,
  passed: results.filter(x => x.ok).length,
  failed: failures.length,
  results,
};
await fs.writeFile(path.join(outDir, 'mobile-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (failures.length) process.exitCode = 1;
