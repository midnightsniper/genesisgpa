import React from 'react';
export function FileDrop({ onFile }:{ onFile:(f:File)=>void }){
  const onChange=(e:React.ChangeEvent<HTMLInputElement>)=>{ const f=e.target.files?.[0]; if(f) onFile(f); };
  return (
    <label className="border-2 border-dashed rounded-2xl p-6 block text-center cursor-pointer">
      <div>Drop CSV/XLSX here or click to upload</div>
      <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={onChange}/>
    </label>
  );
}
