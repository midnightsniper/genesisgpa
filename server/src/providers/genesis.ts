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
    // Navigate to login page
    await page.goto(input.url, { waitUntil: 'domcontentloaded' });

    // Wait for username field to appear
    await page.waitForSelector('#j_username', { timeout: 30000 });

    // Fill in credentials
    await page.fill('#j_username', input.username);
    await page.fill('#j_password', input.password);

    // Click the Login button
    await page.click('input[type="submit"][value="Login"]');

    // Wait until the post-login DOM loads
    await page.waitForLoadState('domcontentloaded');

    // Try navigating to Gradebook or Summary if available
    await page.locator('a:has-text("Gradebook"), a:has-text("Summary")')
      .first()
      .click({ timeout: 10000 })
      .catch(() => { /* optional: ignore if not present */ });

    // Scrape course info (placeholder logic — adjust to your district’s table structure)
    const courses = await page.$$eval('table tr', rows => {
      const out: any[] = [];
      rows.forEach((tr: any) => {
        const tds = Array.from(tr.querySelectorAll('td')).map((td: any) => td.textContent?.trim() || '');
        if (tds.length >= 3 && /\d+/.test(tds[2])) {
          out.push({
            id: tds[0] || (globalThis.crypto as any)?.randomUUID?.() || String(Math.random()),
            name: tds[1],
            code: tds[0],
            credit: parseFloat(tds[2]) || 1,
            level: 'Unknown',
            markingPeriods: []
          });
        }
      });
      return out;
    });

    // Dummy marking periods for now
    for (const c of courses) {
      c.markingPeriods = [
        { label: 'MP1', percent: 95, weight: 0.5 },
        { label: 'MP2', percent: 92, weight: 0.5 }
      ];
    }

    const normalized = courses.map((c: any) => ({
      ...c,
      level: detectLevel(c.name)
    }));

    const assignments: GenesisData['assignments'] = [];

    return { courses: normalized, assignments };
  } finally {
    await browser.close();
  }
}
