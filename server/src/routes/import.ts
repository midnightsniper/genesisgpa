import { Router } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { fetchGenesis } from '../providers/genesis.js';

const upload = multer({ storage: multer.memoryStorage() });
export const importRouter = Router();

importRouter.post('/csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
  // Expect headers: name, code, credit, level, mp1, mp1w, mp2, mp2w, ...
  const courses = rows.map(r => ({
    id: crypto.randomUUID?.() || String(Math.random()),
    name: r.name,
    code: r.code,
    credit: parseFloat(r.credit) || 1,
    level: r.level || 'Unknown',
    gradeScale: 'percentage',
    markingPeriods: [1,2,3,4].flatMap(i => {
      const p = Number(r[`mp${i}`]);
      const w = Number(r[`mp${i}w`]);
      return isFinite(p) && isFinite(w) && w>0 ? [{ label: `MP${i}`, percent: p, weight: w }] : [];
    })
  }));
  res.json({ courses, assignments: [] });
});

importRouter.post('/genesis', async (req, res) => {
  const { url, username, password } = req.body || {};
  if (!url || !username || !password) return res.status(400).json({ error: 'url, username, password required' });
  try {
    const data = await fetchGenesis({ url, username, password });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'genesis import failed' });
  }
});
