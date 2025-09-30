import React from 'react';

export default function GPAResults({ result }:{ result:{ unweightedGPA:number; weightedGPA:number; byCourse:any[] }|null }){
  if (!result) return null;
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="p-4 border rounded-2xl">
        <div className="text-sm opacity-70">Unweighted GPA</div>
        <div className="text-4xl font-bold">{result.unweightedGPA.toFixed(3)}</div>
      </div>
      <div className="p-4 border rounded-2xl">
        <div className="text-sm opacity-70">Weighted GPA</div>
        <div className="text-4xl font-bold">{result.weightedGPA.toFixed(3)}</div>
      </div>
      <div className="p-4 border rounded-2xl">
        <div className="text-sm opacity-70">Courses</div>
        <ul className="text-sm mt-2 space-y-1">
          {result.byCourse.map((r:any)=> (
            <li key={r.course.id} className="flex justify-between"><span>{r.course.name}</span><span>{r.weighted.toFixed(2)}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
