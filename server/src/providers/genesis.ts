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

export async function fetchGenesis(input: GenesisFetchInput): Promise<GenesisData> {
  const browser: Browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // --- LOGIN ---
    await page.goto(input.url, { waitUntil: 'domcontentloaded' });

    const loginForm = page.locator('#j_username');
    if (await loginForm.count() > 0) {
      await page.fill('#j_username', input.username);
      await page.fill('#j_password', input.password);
      await page.click('input[type="submit"][value="Login"]');
      await page.waitForLoadState('domcontentloaded');
    } else {
      // Fallback: direct POST to j_security_check
      const base = new URL(input.url).origin;
      await page.request.post(`${base}/genesis/j_security_check`, {
        form: {
          j_username: input.username,
          j_password: input.password
        }
      });
      await page.goto(`${base}/genesis/parents?gohome=true`, { waitUntil: 'domcontentloaded' });
    }

    // --- EXTRACT STUDENT ID FROM SUMMARY PAGE URL ---
    const currentUrl = page.url();
    const studentIdMatch = currentUrl.match(/studentid=(\d+)/);
    if (!studentIdMatch) throw new Error('Could not extract studentId');
    const studentId = studentIdMatch[1];

    // --- GRADEBOOK PAGE ---
    const gradebookUrl = `${new URL(input.url).origin}/genesis/parents?tab1=studentdata&tab2=gradebook&tab3=weeklysummary&action=form&studentid=${studentId}`;
    await page.goto(gradebookUrl, { waitUntil: 'domcontentloaded' });

    const courses = await page.$$eval('.gbClassContainer', (nodes) => {
      const out: any[] = [];
      nodes.forEach((box: any) => {
        const nameEl = box.querySelector('.gbClassName');
        if (!nameEl) return;
        const courseName = nameEl.textContent?.trim() || '';

        const mpGrades: { label: string; percent: number; weight: number }[] = [];
        const mpCells = box.querySelectorAll('.gbMPBox');
        mpCells.forEach((mp: any, idx: number) => {
          const text = mp.textContent?.trim() || '';
          const percent = parseFloat(text.replace('%', ''));
          if (!isNaN(percent)) {
            mpGrades.push({
              label: `MP${idx + 1}`,
              percent,
              weight: 1
            });
          }
        });

        out.push({
          id: crypto.randomUUID(),
          name: courseName,
          code: undefined,
          credit: 0, // filled later
          level: 'Unknown',
          markingPeriods: mpGrades
        });
      });
      return out;
    });

    // --- GRADING PAGE (CREDITS) ---
    const gradingUrl = `${new URL(input.url).origin}/genesis/parents?tab1=studentdata&tab2=grading&tab3=current&action=form&studentid=${studentId}`;
    await page.goto(gradingUrl, { waitUntil: 'domcontentloaded' });

    const creditsMap = await page.$$eval('table tr', (rows) => {
      const map: Record<string, number> = {};
      rows.forEach((tr) => {
        const tds = Array.from(tr.querySelectorAll('td')).map((td: any) => td.textContent?.trim() || '');
        if (tds.length >= 5) {
          const name = tds[0];
          const credit = parseFloat(tds[4]) || 0;
          if (name) map[name] = credit;
        }
      });
      return map;
    });

    // --- NORMALIZE COURSES ---
    const normalized = courses.map((c: any) => {
      const credit = creditsMap[c.name] || 1;
      return {
        ...c,
        credit,
        level: detectLevel(c.name) // detect Honors/AP
      };
    });

    // --- ASSIGNMENTS (Future extension: scrape tab3=listassignments) ---
    const assignments: GenesisData['assignments'] = [];

    return { courses: normalized, assignments };
  } finally {
    await browser.close();
  }
}
