export type Course = {
  id: string; name: string; code?: string;
  level?: 'AP'|'Honors'|'IB'|'Dual'|'Unknown';
  credit: number; gradeScale: 'percentage'|'letter';
  finalGrade?: number;
  markingPeriods?: { label: string; percent: number; weight: number }[];
};

export type Weighting = { apBoost: number; honorsBoost: number; ibBoost: number; dualBoost: number; };

export const defaultMap = [
  { cutoff: 97, gpa: 4.0 }, { cutoff: 93, gpa: 4.0 }, { cutoff: 90, gpa: 3.7 },
  { cutoff: 87, gpa: 3.3 }, { cutoff: 83, gpa: 3.0 }, { cutoff: 80, gpa: 2.7 },
  { cutoff: 77, gpa: 2.3 }, { cutoff: 73, gpa: 2.0 }, { cutoff: 70, gpa: 1.7 },
  { cutoff: 67, gpa: 1.3 }, { cutoff: 65, gpa: 1.0 }, { cutoff: 0, gpa: 0 }
];

export function percentToGpa(p: number, map = defaultMap) {
  for (const r of map) if (p >= r.cutoff) return r.gpa; return 0;
}

export function mpAverage(mps: Course['markingPeriods']) {
  if (!mps?.length) return undefined; const sumW = mps.reduce((a,b)=>a+b.weight,0)||1;
  return mps.reduce((acc,mp)=>acc+mp.percent*(mp.weight/sumW),0);
}

export function courseGPA(course: Course, w: Weighting) {
  const percent = course.finalGrade ?? mpAverage(course.markingPeriods) ?? 0;
  const unweighted = percentToGpa(percent);
  let boost = 0;
  if (course.level==='AP') boost = w.apBoost; else if (course.level==='Honors') boost = w.honorsBoost; else if (course.level==='IB') boost = w.ibBoost; else if (course.level==='Dual') boost = w.dualBoost;
  const weighted = Math.min(unweighted + boost, 5);
  return { percent, unweighted, weighted };
}

export function overallGPA(courses: Course[], w: Weighting) {
  let csum = 0, uw=0, wg=0;
  const rows = courses.map(c=>{ const {unweighted, weighted} = courseGPA(c,w); const cr=c.credit||1; csum+=cr; uw+=unweighted*cr; wg+=weighted*cr; return {c, unweighted, weighted, cr}; });
  return { unweighted: csum?uw/csum:0, weighted: csum?wg/csum:0, rows };
}
