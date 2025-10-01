import { chromium, Browser } from 'playwright';
import { detectLevel } from '../detectors.js';

export type GenesisFetchInput = {
  url: string;       // e.g. https://parents.ebnet.org/genesis
  username: string;
  password: string;
};

export type GenesisData = {
  courses: Array<{
    id: string;
    name: string;
    code?: string;
    credit: number;
    level?: string;
    markingPeriods?: { label: string; percent: number; weight: number }[];
  }>;
  assignments: Array<{
    id: string;
    courseId: string;
    title: string;
    category?: string;
    pointsEarned: number;
    pointsPossible: number;
    date?: string;
  }>;
};

function originOf(url: string) {
  return new URL(url).origin;
}

async function resolveStudentId(page: import('playwright').Page): Promise<string> {
  // 1) URL param
  const urlMatch = page.url().match(/studentid=(\d+)/i);
  if (urlMatch) return urlMatch[1];

  // 2) Anchor with studentid
  const fromAnchor = await page.$$eval('a[href*="studentid="]', (as: any[]) => {
    for (const a of as) {
      const href = (a as any).getAttribute?.('href') || '';
      const m = href.match(/studentid=(\d+)/i);
      if (m) return m[1];
    }
    return null;
  });
  if (fromAnchor) return fromAnchor;

  // 3) Element IDs like studentDialog112185
  const fromId = await page.$$eval('[id^="student"], [id*="student"]', (els: any[]) => {
    for (const el of els) {
      const id = (el as any).id || '';
      const m = id.match(/student(?:Dialog|Summary|Card)?(\d{4,})/i);
      if (m) return m[1];
    }
    return null;
  });
  if (fromId) return fromId;

  // 4) Inline scripts
  const fromScript = await page.$$eval('script', (scripts: any[]) => {
    for (const s of scripts) {
      const txt = (s as any).textContent || '';
      const m =
        txt.match(/studentid\s*=\s*["']?(\d{4,})["']?/i) ||
        txt.match(/studentid=(\d{4,})/i);
      if (m) return m[1];
    }
    return null;
  });
  if (fromScript) return fromScript;

  throw new Error('Could not extract studentId');
}

export async function fetchGenesis(input: GenesisFetchInput): Promise<GenesisData> {
  const base = originOf(input.url);
  const loginUrl = `${base}/genesis/parents?gohome=true`;
  const summaryUrl = `${base}/genesis/parents?tab1=studentdata&tab2=studentsummary&action=form`;

  const browser: Browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // --- LOGIN ---
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

    if (await page.locator('#j_username').count()) {
      await page.fill('#j_username', input.username);
      await page.fill('#j_password', input.password);
      await page.click('input[type="submit"][value="Login"]');
      await page.waitForLoadState('domcontentloaded');
    } else {
      await page.request.post(`${base}/genesis/j_security_check`, {
        form: { j_username: input.username, j_password: input.password }
      });
      await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    }

    // --- SUMMARY PAGE ---
    await page.goto(summaryUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#mainContainer, .container, body.parentsBodyMobile', { timeout: 20000 });

    const studentId = await resolveStudentId(page);

    // --- GRADEBOOK ---
    const gradebookUrl = `${base}/genesis/parents?tab1=studentdata&tab2=gradebook&tab3=weeklysummary&action=form&studentid=${studentId}`;
    await page.goto(gradebookUrl, { waitUntil: 'domcontentloaded' });

    const courses = await page.$$eval('.gbClassContainer', (nodes: any[]) => {
      const out: any[] = [];
      for (const box of nodes) {
        const nameEl = (box as any).querySelector?.('.gbClassName');
        if (!nameEl) continue;
        const courseName = (nameEl.textContent || '').trim();
        if (!courseName) continue;

        const mpGrades: { label: string; percent: number; weight: number }[] = [];
        const mpCells = (box as any).querySelectorAll?.('.gbMPBox') || [];
        let idx = 0;
        for (const mp of Array.from(mpCells) as any[]) {
          const raw = (mp.textContent || '').trim();
          const pct = parseFloat(raw.replace('%', ''));
          if (!Number.isNaN(pct)) mpGrades.push({ label: `MP${++idx}`, percent: pct, weight: 1 });
        }

        out.push({
          id: (globalThis as any).crypto?.randomUUID?.() || String(Math.random()),
          name: courseName,
          code: undefined,
          credit: 0,
          level: 'Unknown',
          markingPeriods: mpGrades
        });
      }
      return out;
    });

    // --- GRADING ---
    const gradingUrl = `${base}/genesis/parents?tab1=studentdata&tab2=grading&tab3=current&action=form&studentid=${studentId}`;
    await page.goto(gradingUrl, { waitUntil: 'domcontentloaded' });

    const creditsMap = await page.$$eval('table tr', (rows: any[]) => {
      const map: Record<string, number> = {};
      for (const tr of rows) {
        const tds = Array.from((tr as any).querySelectorAll?.('td') || [])
          .map((td: any) => (td.textContent || '').trim());
        if (tds.length >= 2) {
          const course = tds[0];
          let credit = parseFloat(tds[4]);
          if (Number.isNaN(credit)) {
            for (let i = tds.length - 1; i >= 1; i--) {
              const maybe = parseFloat(tds[i]);
              if (!Number.isNaN(maybe)) { credit = maybe; break; }
            }
          }
          if (course) map[course] = Number.isFinite(credit) ? credit : 1;
        }
      }
      return map;
    });

    const normalized = (courses as any[]).map(c => ({
      ...c,
      credit: creditsMap[c.name] ?? 1,
      level: detectLevel(c.name)
    }));

    return { courses: normalized, assignments: [] };
  } finally {
    await browser.close();
  }
}
