import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function TrendChart({ points }:{ points:{ label:string; uw:number; w:number }[] }){
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis domain={[0,5]} />
          <Tooltip />
          <Line dataKey="uw" dot={false} />
          <Line dataKey="w" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
