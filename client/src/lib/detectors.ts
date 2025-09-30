export const detectors = {
  ap: [/\bAP\b/i, /Advanced\s*Placement/i],
  ib: [/\bIB\b/i],
  honors: [/Honors?/i],
  dual: [/Dual\s*Enroll/i, /College\s*Level/i]
};

export function detect(name: string): 'AP'|'IB'|'Honors'|'Dual'|'Unknown' {
  if (detectors.ap.some(r => r.test(name))) return 'AP';
  if (detectors.ib.some(r => r.test(name))) return 'IB';
  if (detectors.honors.some(r => r.test(name))) return 'Honors';
  if (detectors.dual.some(r => r.test(name))) return 'Dual';
  return 'Unknown';
}
