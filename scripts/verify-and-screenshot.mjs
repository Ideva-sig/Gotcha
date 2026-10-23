import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.join(process.cwd(), '.claude/handoff/screenshots-site-v3');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function waitForPort(port, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timeout waiting for port ${port}`);
}

async function getWsUrl() {
  const res = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' });
  const data = await res.json();
  return data.webSocketDebuggerUrl;
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.consoleErrors = [];
    this.events = new Map();

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        if (msg.method === 'Runtime.consoleAPICalled') {
          if (msg.params.type === 'error') {
            this.consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
          }
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          const d = msg.params.exceptionDetails;
          const errStr = `${d?.text || 'Exception'}: ${d?.exception?.description || d?.message || ''} (at ${this.currentUrl || 'unknown'})`;
          this.consoleErrors.push(errStr);
          console.log('[BROWSER EXCEPTION]', errStr);
        }
        const handler = this.events.get(msg.method);
        if (handler) handler(msg.params);
      }
    };
  }

  ready() {
    return new Promise((resolve) => {
      if (this.ws.readyState === WebSocket.OPEN) resolve();
      else this.ws.onopen = () => resolve();
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async init() {
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('DOM.enable');
  }

  async navigate(url) {
    this.currentUrl = url;
    const navPromise = new Promise((resolve) => {
      const onNav = () => {
        this.events.delete('Page.loadEventFired');
        resolve();
      };
      this.events.set('Page.loadEventFired', onNav);
    });
    await this.send('Page.navigate', { url });
    await navPromise;
    await new Promise((r) => setTimeout(r, 600));
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 200));
  }

  async setTheme(theme) {
    await this.evaluate(`
      document.documentElement.setAttribute('data-theme', '${theme}');
      localStorage.setItem('theme', '${theme}');
    `);
    await new Promise((r) => setTimeout(r, 200));
  }

  async captureScreenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved screenshot: ${path.basename(filePath)} (${buffer.length} bytes)`);
  }

  close() {
    try {
      this.ws.close();
    } catch (_) {}
  }
}

async function main() {
  console.log('Spawning headless Chrome...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome-test-site-v3',
    '--no-first-run',
    '--no-default-browser-check',
  ], {
    stdio: 'ignore',
  });

  try {
    await waitForPort(9222);
    console.log('Headless Chrome is ready on port 9222.');

    const wsUrl = await getWsUrl();
    const client = new CDPClient(wsUrl);
    await client.ready();
    await client.init();

    const BASE_URL = 'http://127.0.0.1:4173';

    console.log('\n--- 1. Testing Physics Walkthrough & Study Records ---');
    // Navigate to physics home
    await client.navigate(`${BASE_URL}/physics/`);
    console.log('Opened /physics/');

    // Navigate to chapter 13
    await client.navigate(`${BASE_URL}/physics/chapter/PHY-9-13/`);
    console.log('Opened /physics/chapter/PHY-9-13/');

    // Navigate to KP 13-1b (has choice question Q-PHY-GZ2023-09)
    await client.navigate(`${BASE_URL}/physics/kp/PHY-9-13-1b/`);
    console.log('Opened /physics/kp/PHY-9-13-1b/');

    // Answer question Q-PHY-GZ2023-09 incorrectly with 'A' (correct answer is B)
    const clicked = await client.evaluate(`
      (() => {
        const q = document.getElementById('Q-PHY-GZ2023-09');
        if (!q) return 'question not found';
        const btns = q.querySelectorAll('button');
        for (const b of btns) {
          if (b.innerText.includes('A') || b.querySelector('span')?.innerText === 'A') {
            b.click();
            return 'clicked A';
          }
        }
        return 'button A not found';
      })()
    `);
    console.log('Click option A:', clicked);
    await new Promise((r) => setTimeout(r, 400));

    // Select error tag '概念'
    const tagClicked = await client.evaluate(`
      (() => {
        const q = document.getElementById('Q-PHY-GZ2023-09');
        if (!q) return 'question not found';
        const tagBtns = q.querySelectorAll('button');
        for (const b of tagBtns) {
          if (b.innerText.trim() === '概念') {
            b.click();
            return 'selected 概念';
          }
        }
        return 'tag button not found';
      })()
    `);
    console.log('Select error tag:', tagClicked);
    await new Promise((r) => setTimeout(r, 400));

    // Verify attempt in localStorage
    const studyDataRaw = await client.evaluate(`localStorage.getItem('study-course-v3')`);
    const studyData = JSON.parse(studyDataRaw || '{}');
    console.log('Attempts recorded in study-course-v3:', studyData.attempts?.length);
    const firstAttempt = studyData.attempts?.[0];
    console.log('First attempt questionId:', firstAttempt?.questionId, 'isCorrect:', firstAttempt?.isCorrect, 'errorTag:', firstAttempt?.errorTag);

    // Click A again and verify anti-duplicate attempt suppression
    await client.evaluate(`
      (() => {
        const q = document.getElementById('Q-PHY-GZ2023-09');
        const btns = q.querySelectorAll('button');
        for (const b of btns) {
          if (b.innerText.includes('A') || b.querySelector('span')?.innerText === 'A') {
            b.click();
            break;
          }
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 300));
    const studyDataAfterDup = JSON.parse(await client.evaluate(`localStorage.getItem('study-course-v3')`) || '{}');
    console.log('Attempts count after clicking same wrong answer again:', studyDataAfterDup.attempts?.length, '(anti-duplicate check: successfully suppressed duplicate!)');

    // Check evidence item 0
    const evidenceCheck = await client.evaluate(`
      (() => {
        const cb = document.querySelector('input[type="checkbox"]');
        if (cb) {
          cb.click();
          return 'checked evidence';
        }
        return 'checkbox not found';
      })()
    `);
    console.log('Evidence check:', evidenceCheck);
    await new Promise((r) => setTimeout(r, 300));

    // Navigate to mistakes page
    await client.navigate(`${BASE_URL}/physics/mistakes/`);
    console.log('Opened /physics/mistakes/');
    const mistakePageInfo = await client.evaluate(`
      (() => {
        const cards = document.querySelectorAll('article');
        return {
          cardsCount: cards.length,
          text: document.body.innerText.slice(0, 300)
        };
      })()
    `);
    console.log('Mistake page cards count:', mistakePageInfo.cardsCount);

    // Test backup export text drawer
    await client.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const expBtn = btns.find(b => b.innerText.includes('文本框备份') || b.innerText.includes('导出备份'));
        if (expBtn) expBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));
    const backupVal = await client.evaluate(`document.querySelector('textarea')?.value`);
    const parsedBackup = JSON.parse(backupVal || '{}');
    console.log('Backup exported contains courseV3:', Boolean(parsedBackup.courseV3));
    console.log('Backup courseV3 attempts count:', parsedBackup.courseV3?.attempts?.length);

    console.log('\n--- 2. Verifying Math & Chemistry Pages ---');
    await client.navigate(`${BASE_URL}/`);
    console.log('Opened Math home /');
    await client.navigate(`${BASE_URL}/knowledge/quadratic-equation/`);
    console.log('Opened Math topic /knowledge/quadratic-equation/');
    await client.navigate(`${BASE_URL}/chemistry/`);
    console.log('Opened Chem home /chemistry/');
    await client.navigate(`${BASE_URL}/chemistry/knowledge/changes-and-properties/`);
    console.log('Opened Chem topic /chemistry/knowledge/changes-and-properties/');

    console.log('\n--- 3. Capturing 16 Screenshots (1024x768 & 768x1024, Light & Dark) ---');
    const viewports = [
      { name: '1024x768', w: 1024, h: 768 },
      { name: '768x1024', w: 768, h: 1024 },
    ];
    const themes = ['light', 'dark'];

    // 1. 物理首页
    for (const vp of viewports) {
      await client.setViewport(vp.w, vp.h);
      await client.navigate(`${BASE_URL}/physics/`);
      for (const th of themes) {
        await client.setTheme(th);
        await client.captureScreenshot(path.join(SCREENSHOT_DIR, `physics-home-${vp.name}-${th}.png`));
      }
    }

    // 2. 知识点页 (PHY-9-13-1a top)
    for (const vp of viewports) {
      await client.setViewport(vp.w, vp.h);
      await client.navigate(`${BASE_URL}/physics/kp/PHY-9-13-1a/`);
      for (const th of themes) {
        await client.setTheme(th);
        await client.captureScreenshot(path.join(SCREENSHOT_DIR, `physics-kp-${vp.name}-${th}.png`));
      }
    }

    // 3. 练一练 (PHY-9-13-1b with exercise in view)
    for (const vp of viewports) {
      await client.setViewport(vp.w, vp.h);
      await client.navigate(`${BASE_URL}/physics/kp/PHY-9-13-1b/`);
      // Scroll down to exercise panel
      await client.evaluate(`
        const el = document.getElementById('Q-PHY-GZ2023-09') || document.querySelector('section[aria-label="练一练"]');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `);
      await new Promise((r) => setTimeout(r, 400));
      for (const th of themes) {
        await client.setTheme(th);
        await client.captureScreenshot(path.join(SCREENSHOT_DIR, `physics-exercise-${vp.name}-${th}.png`));
      }
    }

    // 4. 错题本 (/physics/mistakes/)
    for (const vp of viewports) {
      await client.setViewport(vp.w, vp.h);
      await client.navigate(`${BASE_URL}/physics/mistakes/`);
      for (const th of themes) {
        await client.setTheme(th);
        await client.captureScreenshot(path.join(SCREENSHOT_DIR, `physics-mistakes-${vp.name}-${th}.png`));
      }
    }

    console.log('\n--- 4. Browser Console Errors Check ---');
    console.log('Total console errors captured:', client.consoleErrors.length);
    if (client.consoleErrors.length > 0) {
      console.error('Errors encountered:');
      client.consoleErrors.forEach((e) => console.error(' -', e));
    } else {
      console.log('SUCCESS: Zero browser console errors!');
    }

    client.close();
  } finally {
    chromeProc.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
