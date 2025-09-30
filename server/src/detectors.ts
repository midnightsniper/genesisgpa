export const defaultDetectors = {
  ap: [/\bAP\b/i, /Advanced\s*Placement/i],
  ib: [/\bIB\b/i, /International\s*Baccalaureate/i],
  honors: [/Honors?/i, /HNR/i],
  dual: [/Dual\s*Enroll/i, /College\s*Level/i]
};

export function detectLevel(name: string): 'AP' | 'Honors' | 'IB' | 'Dual' | 'CP' | 'Standard' | 'Unknown' {
  if (defaultDetectors.ap.some(r => r.test(name))) return 'AP';
  if (defaultDetectors.ib.some(r => r.test(name))) return 'IB';
  if (defaultDetectors.honors.some(r => r.test(name))) return 'Honors';
  if (defaultDetectors.dual.some(r => r.test(name))) return 'Dual';
  return 'Unknown';
}
