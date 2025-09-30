import React from 'react';
import type { Assignment } from '../types';

export default function AssignmentTable({ assignments }:{ assignments: Assignment[] }){
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Course</th>
            <th className="p-2">Title</th>
            <th className="p-2">Earned</th>
            <th className="p-2">Possible</th>
            <th className="p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map(a => (
            <tr key={a.id} className="border-t">
              <td className="p-2">{a.courseId}</td>
              <td className="p-2">{a.title}</td>
              <td className="p-2">{a.pointsEarned}</td>
              <td className="p-2">{a.pointsPossible}</td>
              <td className="p-2">{a.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
