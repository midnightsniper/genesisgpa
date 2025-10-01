import cors from "cors";
import express from "express";

const app = express();

app.use(cors({
  origin: [
    "https://midnightsniper.github.io",              // your user site
    "https://midnightsniper.github.io/genesisgpa"   // your repo site
  ],
  credentials: true
}));
