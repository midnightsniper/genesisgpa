import React, { useState } from 'react';
import { FileDrop } from './FileDrop';
import { importCSV, importGenesis } from '../lib/api';
import { detect } from '../lib/detectors';

export default function ImportPanel({ onData }:{ onData:(data:any)=>void }){
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleCSV(file: File){
    setLoading(true); setError(undefined);
    try{ const data = await importCSV(file); onData(postProcess(data)); } catch(e:any){ setError(e.message||'Upload failed'); } finally{ setLoading(false); }
  }
  function postProcess(data:any){
    data.courses = (data.courses||[]).map((c:any)=>({ ...c, level: c.level && c.level!=='Unknown'? c.level : detect(c.name) }));
    return data;
  }
  async function handleGenesis(){
    setLoading(true); setError(undefined);
    try{ const data = await importGenesis({ url, username, password }); onData(postProcess(data)); } catch(e:any){ setError(e.message||'Import failed'); } finally{ setLoading(false); }
  }
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-4 rounded-2xl border">
        <h3 className="font-semibold mb-2">Upload CSV/Excel</h3>
        <FileDrop onFile={handleCSV} />
      </div>
      <div className="p-4 rounded-2xl border">
        <h3 className="font-semibold mb-2">Connect Genesis (experimental)</h3>
        <div className="space-y-2">
          <input placeholder="Genesis portal URL" className="w-full border p-2 rounded" value={url} onChange={e=>setUrl(e.target.value)} />
          <input placeholder="Username" className="w-full border p-2 rounded" value={username} onChange={e=>setUsername(e.target.value)} />
          <input placeholder="Password" type="password" className="w-full border p-2 rounded" value={password} onChange={e=>setPassword(e.target.value)} />
          <button disabled={loading} onClick={handleGenesis} className="px-4 py-2 rounded-xl border shadow">
            {loading? 'Connecting…' : 'Connect'}
          </button>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
      </div>
    </div>
  );
}
