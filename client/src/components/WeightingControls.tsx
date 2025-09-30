import React from 'react';
export default function WeightingControls({ w, setW }:{ w:any; setW:(x:any)=>void }){
  const upd=(k:string,v:number)=>setW({...w,[k]:v});
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {[
        ['apBoost','AP Boost'],
        ['honorsBoost','Honors Boost'],
        ['ibBoost','IB Boost'],
        ['dualBoost','Dual Boost']
      ].map(([k,label])=> (
        <label key={k} className="text-sm flex flex-col gap-1">
          <span>{label}</span>
          <input type="number" step="0.1" value={w[k]} onChange={e=>upd(k,parseFloat(e.target.value))} className="border p-2 rounded"/>
        </label>
      ))}
    </div>
  );
}
