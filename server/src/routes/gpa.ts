import { Router } from 'express';
import { calcGPA } from '../gpa.js';

export const gpaRouter = Router();

gpaRouter.post('/calc', (req, res) => {
  const { courses, weighting } = req.body;
  if (!Array.isArray(courses)) return res.status(400).json({ error: 'courses[] required' });
  const result = calcGPA(courses, weighting);
  res.json(result);
});
