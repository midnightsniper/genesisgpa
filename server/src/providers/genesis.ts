import { chromium, Browser } from 'playwright';
import { detectLevel } from '../detectors.js';

export type GenesisFetchInput = {
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

export async function fetchGenesis(input: GenesisFetchInput): Promise<GenesisData> {
  const browser: Browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(input.url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#j_username', { timeout: 30000 });
    await page.fill('#j_username', input.username);
    await page.fill('#j_password', input.password);
    await page.click('input[type="submit"][value="Login"]');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('a:has-text("Gradebook")').first().click({ timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');

    const courses = await page.$$eval('.gbClassName', (nodes) => {
      const out: any[] = [];
      nodes.forEach((el: any) => {
        const courseName = el.textContent?.trim() || '';
        const parentBox = el.closest('.gbClassContainer') || el.closest('div');
        if (!parentBox) return;

        const mpGrades: { label: string; percent: number; weight: number }[] = [];
        const mpCells = parentBox.querySelectorAll('.gbMPBox');
        mpCells.forEach((mp: any, idx: number) => {
          const text = mp.textContent?.trim() || '';
          const percent = parseFloat(text.replace('%', ''));
          if (!isNaN(percent)) {
            mpGrades.push({
              label: `MP${idx + 1}`,
              percent,
              weight: 1 // will normalize later
            });
          }
        });

        out.push({
          id: crypto.randomUUID(),
          name: courseName,
          code: undefined,
          credit: 0, 
          level: 'Unknown',
          markingPeriods: mpGrades
        });
      });
      return out;
    });

    await page.locator('a:has-text("Grading")').first().click({ timeout: 10000 });
    await page.locator('a:has-text("Current Grades")').first().click({ timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');

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

    const normalized = courses.map((c: any) => {
      const credit = creditsMap[c.name] || 1;
      return {
        ...c,
        credit,
        level: detectLevel(c.name)
      };
    });

    const assignments: GenesisData['assignments'] = []; // (future: scrape “List Assignments” tab)

    return { courses: normalized, assignments };
  } finally {
    await browser.close();
  }
}
