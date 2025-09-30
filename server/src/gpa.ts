import type { Course, WeightingConfig, CalcResult } from './types.js';

  if (typeof course.finalGrade === 'number') {
    percent = course.gradeScale === 'percentage' ? course.finalGrade : undefined;
  }

  if (percent === undefined && course.markingPeriods && course.markingPeriods.length) {
    const sumW = course.markingPeriods.reduce((a, b) => a + b.weight, 0) || 1;
    percent = course.markingPeriods.reduce((acc, mp) => acc + mp.percent * (mp.weight / sumW), 0);
  }

  // If still undefined, caller may inject assignment-derived percent
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
