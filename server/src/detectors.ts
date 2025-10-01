export const defaultDetectors = {
  ap: [/\bAP\b/i, /Advanced\s*Placement/i],
  ib: [/\bIB\b/i, /International\s*Baccalaureate/i],
  honors: [
    /\bHonors?\b/i,
    /\bHNR\b/i,
    /\bH$/i
  ],
  dual: [/\bDual\s*Enroll(?:ment)?\b/i, /\bCollege\s*Level\b/i]
};

export function detectLevel(name: string): 'AP' | 'Honors' | 'IB' | 'Dual' | 'CP' | 'Standard' | 'Unknown' {
  if (defaultDetectors.ap.some(r => r.test(name))) return 'AP';
  if (defaultDetectors.ib.some(r => r.test(name))) return 'IB';
  if (defaultDetectors.honors.some(r => r.test(name))) return 'Honors';
  if (defaultDetectors.dual.some(r => r.test(name))) return 'Dual';
  // fallback: could check for "CP" (College Prep) or "Standard"
  if (/\bCP\b/i.test(name)) return 'CP';
  if (/Standard/i.test(name)) return 'Standard';
  return 'Unknown';
}
