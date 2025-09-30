const API = import.meta.env.VITE_API || 'http://localhost:5177';

export async function importGenesis(body: { url: string; username: string; password: string; }) {
  const res = await fetch(`${API}/api/import/genesis`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function importCSV(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API}/api/import/csv`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function calcGPA(payload: any) {
  const res = await fetch(`${API}/api/gpa/calc`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function exportPDF(title: string, summary: any) {
  const res = await fetch(`${API}/api/export/pdf`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, summary }) });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'gpa-report.pdf'; a.click();
  URL.revokeObjectURL(url);
}
