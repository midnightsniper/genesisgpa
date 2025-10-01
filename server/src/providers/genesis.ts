import { chromium, Browser } from 'playwright';
import { detectLevel } from '../detectors.js';

export type GenesisFetchInput = {
  // Accept either the root (https://parents.ebnet.org/genesis) or the login page
  url: string;
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
  return new URL(url).origin; // e.g. https://parents.ebnet.org
}

async function resolveStudentId(page: import('playwright').Page): Promise<string> {
  // 1) Try the current URL first
  {
    const m = page.url().match(/studentid=(\d+)/i);
    if (m) return m[1];
  }

  // 2) Any anchor with studentid in href
  const anchorHref = await page.$$eval<HTMLAnchorElement, string | null>(
    'a[href*="studentid="]',
    (as) => {
      for (const a of as) {
        const href = a.getAttribute('href') || '';
        const m = href.match(/studentid=(\d+)/i);
        if (m) return m[1];
      }
      return null;
    }
  );
  if (anchorHref) return anchorHref;

  // 3) Any element id like "studentDialog112185" or similar
  const fromId = await page.$$eval<HTMLElement, string | null>(
    '[id^="student"], [id*="student"]',
    (els) => {
      for (const el of els) {
        const id = el.id || '';
        const m = id.match(/student(?:Dialog|Summary|Card)?(\d{4,})/i);
        if (m) return m[1];
      }
      return null;
    }
  );
  if (fromId) return fromId;

  // 4) Scan inline scripts for ...studentid=12345...
  const fromScript = await page.$$eval('script', (scripts) => {
    for (const s of scripts) {
      const txt = s.textContent || '';
      const m = txt.match(/studentid\s*=\s*["']?(\d{4,})["']?/i) || txt.match(/studentid=(\d{4,})/i);
      if (m) return m[1];
    }
    return null as string | null;
  });
  if (fromScript) return fromScript;

  throw new Error('Could not extract studentId');
}

export async function fetchGenesis(input: GenesisFetchInput): Promise<GenesisData> {
  const base = originOf(input.url); // e.g. https://parents.ebnet.org
  const loginUrl = `${base}/genesis/parents?gohome=true`; // stable landing
  const browser: Browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // --- LOGIN (form or POST fallback) ---
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

    // If login inputs present, use form; otherwise do POST to j_security_check
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

    // Land on Summary, then get studentId (works even if URL lacks it)
    // Ensure body is rendered
    await page.waitForSelector('body', { timeout: 15000 });
    const studentId = await resolveStudentId(page);

    // --- GRADEBOOK: weekly summary ---
    const gradebookUrl = `${base}/genesis/parents?tab1=studentdata&tab2=gradebook&tab3=weeklysummary&action=form&studentid=${studentId}`;
    await page.goto(gradebookUrl, { waitUntil: 'domcontentloaded' });

    // Course cards: .gbClassContainer each, name in .gbClassName, MP cells as .gbMPBox
    const courses = await page.$$eval('.gbClassContainer', (nodes) => {
      const out: any[] = [];
      for (const box of nodes as any[]) {
        const nameEl = (box as HTMLElement).querySelector('.gbClassName');
        if (!nameEl) continue;
        const courseName = (nameEl.textContent || '').trim();
        if (!courseName) continue;

        const mpGrades: { label: string; percent: number; weight: number }[] = [];
        const mpCells = (box as HTMLElement).querySelectorAll('.gbMPBox');
        let mpIndex = 0;
        for (const mp of Array.from(mpCells) as HTMLElement[]) {
          const raw = (mp.textContent || '').trim();
          const pct = parseFloat(raw.replace('%', ''));
          if (!Number.isNaN(pct)) {
            mpGrades.push({ label: `MP${++mpIndex}`, percent: pct, weight: 1 });
          }
        }

        out.push({
          id: (globalThis.crypto as any)?.randomUUID?.() || String(Math.random()),
          name: courseName,
          code: undefined,
          credit: 0, // fill below from Grading
          level: 'Unknown',
          markingPeriods: mpGrades
        });
      }
      return out;
    });

    // --- GRADING: Current Grades (to get credits) ---
    const gradingUrl = `${base}/genesis/parents?tab1=studentdata&tab2=grading&tab3=current&action=form&studentid=${studentId}`;
    await page.goto(gradingUrl, { waitUntil: 'domcontentloaded' });

    // Table columns typically: Course | Sem | School | Teacher | Cr | ...
    const creditsMap = await page.$$eval('table tr', (rows) => {
      const map: Record<string, number> = {};
      for (const tr of rows as any[]) {
        const tds = Array.from((tr as HTMLElement).querySelectorAll('td')).map(td => (td.textContent || '').trim());
        if (tds.length >= 5) {
          const course = tds[0];
          // Column 4 or 5 tends to be Credits; use the last numeric in row as fallback
          let credit = parseFloat(tds[4]);
          if (Number.isNaN(credit)) {
            for (let i = tds.length - 1; i >= 0; i--) {
              const maybe = parseFloat(tds[i]);
              if (!Number.isNaN(maybe)) { credit = maybe; break; }
            }
          }
          if (course) map[course] = Number.isFinite(credit) ? credit : 1;
        }
      }
      return map;
    });

    // --- Normalize + detect level (AP/Honors/IB/etc.) ---
    const normalized = courses.map((c: any) => ({
      ...c,
      credit: creditsMap[c.name] ?? 1,
      level: detectLevel(c.name)
    }));

    // --- Assignments (placeholder; implement by scraping listassignments if needed) ---
    const assignments: GenesisData['assignments'] = [];

    return { courses: normalized, assignments };
  } finally {
    await browser.close();
  }
}
