import type { Course, WeightingConfig, CalcResult } from './types.js';

export const defaultWeighting: WeightingConfig = {
  baseScale: '4.0',
  apBoost: 1.0,
  honorsBoost: 0.5,
  ibBoost: 1.0,
  dualBoost: 0.5,
  percentToGPA: [
    { cutoff: 97, gpa: 4.0 },
    { cutoff: 93, gpa: 4.0 },
    { cutoff: 90, gpa: 3.7 },
    { cutoff: 87, gpa: 3.3 },
    { cutoff: 83, gpa: 3.0 },
    { cutoff: 80, gpa: 2.7 },
    { cutoff: 77, gpa: 2.3 },
    { cutoff: 73, gpa: 2.0 },
    { cutoff: 70, gpa: 1.7 },
    { cutoff: 67, gpa: 1.3 },
    { cutoff: 65, gpa: 1.0 },
    { cutoff: 0,  gpa: 0.0 }
  ]
};

function percentToGpa(percent: number, cfg: WeightingConfig): number {
  for (const row of cfg.percentToGPA) {
    if (percent >= row.cutoff) return row.gpa;
  }
  return 0;
}

export function calcCourseGPA(course: Course, cfg: WeightingConfig = defaultWeighting) {
  let percent: number | undefined = undefined;

  if (typeof course.finalGrade === 'number') {
    percent = course.gradeScale === 'percentage' ? course.finalGrade : undefined;
  }

  if (percent === undefined && course.markingPeriods?.length) {
    const sumW = course.markingPeriods.reduce((a, b) => a + b.weight, 0) || 1;
    percent = course.markingPeriods.reduce(
      (acc, mp) => acc + mp.percent * (mp.weight / sumW),
      0
    );
  }

  if (percent === undefined) percent = 0;

  const unweighted = percentToGpa(percent, cfg);
  let boost = 0;
  switch (course.level) {
    case 'AP': boost = cfg.apBoost; break;
    case 'Honors': boost = cfg.honorsBoost; break;
    case 'IB': boost = cfg.ibBoost ?? 1.0; break;
    case 'Dual': boost = cfg.dualBoost ?? 0.5; break;
  }
  const weighted = Math.min(unweighted + boost, 5.0);
  return { unweighted, weighted };
}

export function calcGPA(courses: Course[], cfg: WeightingConfig = defaultWeighting): CalcResult {
  let totalCredits = 0;
  let uwSum = 0;
  let wSum = 0;

  const byCourse = courses.map(course => {
    const { unweighted, weighted } = calcCourseGPA(course, cfg);
    const credit = course.credit || 1;
    totalCredits += credit;
    uwSum += unweighted * credit;
    wSum += weighted * credit;
    return {
      course,
      unweighted,
      weighted,
      contribution: weighted * credit
    };
  });

  return {
    unweightedGPA: totalCredits ? uwSum / totalCredits : 0,
    weightedGPA: totalCredits ? wSum / totalCredits : 0,
    byCourse
  };
}
