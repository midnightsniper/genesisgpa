import { Router } from 'express';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const exportRouter = Router();

exportRouter.post('/pdf', async (req, res) => {
  const { title = 'GPA Report', summary } = req.body || {};
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // Letter
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const text = typeof summary === 'string' ? summary : JSON.stringify(summary, null, 2);
  page.drawText(title, { x: 48, y: 740, size: 18, font, color: rgb(0,0,0) });
  page.drawText(text, { x: 48, y: 710, size: 10, font, color: rgb(0,0,0), lineHeight: 12, maxWidth: 516 });
  const bytes = await pdf.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="gpa-report.pdf"`);
  res.send(Buffer.from(bytes));
});
