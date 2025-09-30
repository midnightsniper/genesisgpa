import React from 'react';
import type { Course } from '../lib/gpa';

export default function CourseTable({ courses, setCourses }:{ courses:Course[]; setCourses:(c:Course[])=>void }){
  const update = (i:number, patch:Partial<Course>)=>{
    const next = courses.slice();
    next[i] = { ...next[i], ...patch };
    setCourses(next);
  };
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Course</th>
            <th className="p-2">Level</th>
            <th className="p-2">Credit</th>
            <th className="p-2">MPs (label:percent:weight)</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c, i) => (
            <tr key={c.id} className="border-t">
              <td className="p-2"><input value={c.name} onChange={e=>update(i,{name:e.target.value})} className="border p-1 rounded w-64"/></td>
              <td className="p-2">
                <select value={c.level||'Unknown'} onChange={e=>update(i,{level:e.target.value as any})} className="border p-1 rounded">
                  {['AP','Honors','IB','Dual','Unknown'].map(x=> <option key={x} value={x}>{x}</option>)}
                </select>
              </td>
              <td className="p-2"><input type="number" step="0.1" value={c.credit} onChange={e=>update(i,{credit:parseFloat(e.target.value)})} className="border p-1 rounded w-20"/></td>
              <td className="p-2">
                <div className="flex flex-wrap gap-2">
                  {(c.markingPeriods||[]).map((mp, k)=> (
                    <span key={k} className="inline-flex items-center gap-1 border rounded px-2 py-1">
                      <input value={mp.label} onChange={e=>{ const mps=[...(c.markingPeriods||[])]; mps[k] = { ...mps[k], label:e.target.value }; update(i,{markingPeriods:mps}); }} className="w-16 border rounded p-0.5"/>
                      <input type="number" value={mp.percent} onChange={e=>{ const mps=[...(c.markingPeriods||[])]; mps[k] = { ...mps[k], percent:Number(e.target.value) }; update(i,{markingPeriods:mps}); }} className="w-20 border rounded p-0.5"/>
                      <input type="number" step="0.1" value={mp.weight} onChange={e=>{ const mps=[...(c.markingPeriods||[])]; mps[k] = { ...mps[k], weight:Number(e.target.value) }; update(i,{markingPeriods:mps}); }} className="w-20 border rounded p-0.5"/>
                    </span>
                  ))}
                  <button className="px-2 py-1 border rounded" onClick={()=>update(i,{ markingPeriods:[...(c.markingPeriods||[]), { label:'MP', percent:90, weight:0.5 }] })}>+ MP</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
