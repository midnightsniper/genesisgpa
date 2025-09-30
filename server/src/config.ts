import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 5177),
  origin: process.env.ORIGIN || 'http://localhost:5173'
};
