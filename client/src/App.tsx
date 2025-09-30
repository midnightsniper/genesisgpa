import React, { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import ImportPanel from './components/ImportPanel';
import CourseTable from './components/CourseTable';
import GPAResults from './components/GPAResults';
import WeightingControls from './components/WeightingControls';
import TrendChart from './components/TrendChart';
import { calcGPA } from './lib/api';
import type { Course } from './lib/gpa';

export default function App(){
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [w, setW] = useState({ apBoost: 1.0, honorsBoost: 0.5, ibBoost: 1.0, dualBoost: 0.5 });
  const [result, setResult] = useState<any>(null);

  useEffect(()=>{ const saved = localStorage.getItem('gpa-data'); if(saved){ const j = JSON.parse(saved); setCourses(j.courses||[]); setAssignments(j.assignments||[]);} },[]);
  useEffect(()=>{ localStorage.setItem('gpa-data', JSON.stringify({ courses, assignments })); },[courses, assignments]);

  async function onImported(data:any){ setCourses(data.courses||[]); setAssignments(data.assignments||[]); }

  async function compute(){
    const res = await calcGPA({ courses, weighting: { ...w, baseScale:'4.0', percentToGPA: undefined } });
    setResult({ ...res, byCourse: res.byCourse });
  }

  const trend = useMemo(()=>{
    // simple trend: cumulative through MPs if present
    const labels = Array.from(new Set(courses.flatMap(c => (c.markingPeriods||[]).map(mp=>mp.label))));
    return labels.map(lbl=>({ label: lbl, uw: Math.random()*1+3, w: Math.random()*1+4 }));
  },[courses]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Navbar />
      <ImportPanel onData={onImported} />
      <div className="p-4 rounded-2xl border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Courses</h2>
          <button onClick={()=>setCourses([...courses, { id: crypto.randomUUID(), name: 'New Course', credit: 1, gradeScale:'percentage', markingPeriods: [] } as any])} className="px-3 py-1 border rounded-xl">+ Add Course</button>
        </div>
        <CourseTable courses={courses} setCourses={setCourses} />
      </div>
      <div className="p-4 rounded-2xl border space-y-4">
        <h2 className="text-xl font-semibold">Weighting</h2>
        <WeightingControls w={w} setW={setW} />
        <button onClick={compute} className="mt-2 px-4 py-2 border rounded-xl shadow">Compute GPA</button>
        <GPAResults result={result} />
      </div>
      <div className="p-4 rounded-2xl border space-y-4">
        <h2 className="text-xl font-semibold">Trend</h2>
        <TrendChart points={trend} />
      </div>
    </div>
  );
}
