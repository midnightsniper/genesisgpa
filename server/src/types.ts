// server/src/types.ts
export type Course = {
  id: string;
  name: string;
  code?: string;
  level?: 'AP' | 'Honors' | 'IB' | 'Dual' | 'CP' | 'Standard' | 'Unknown';
  credit: number;                  // e.g., 1.0 full year, 0.5 semester
  gradeScale: 'percentage' | 'letter';
  finalGrade?: number;             // if using % scale, 0–100
  markingPeriods?: { label: string; percent: number; weight: number }[];
};

export type Assignment = {
  id: string;
  courseId: string;
  title: string;
  category?: string;
  pointsEarned: number;
  pointsPossible: number;
  date?: string;
};

export type WeightingConfig = {
  baseScale: '4.0' | '5.0' | '100';
  apBoost: number;
  honorsBoost: number;
  ibBoost?: number;
  dualBoost?: number;
  percentToGPA: { cutoff: number; gpa: number }[];
  letterMap?: Record<string, number>;
};

export type CalcResult = {
  unweightedGPA: number;
  weightedGPA: number;
  byCourse: Array<{
    course: Course;
    unweighted: number;
    weighted: number;
    contribution: number;
  }>;
};
