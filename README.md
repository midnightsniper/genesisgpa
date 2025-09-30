# genesisgpa
A full-stack app to calculate GPA based on Genesis.

```📦 genesis-gpa
├─ 📁 server              # Node/Express API, Playwright connector
│  ├─ package.json
│  ├─ .env.example
│  └─ src
│     ├─ server.ts
│     ├─ config.ts
│     ├─ gpa.ts          # core GPA math
│     ├─ detectors.ts    # AP/Honors detection rules
│     ├─ routes
│     │  ├─ health.ts
│     │  ├─ gpa.ts       # /api/gpa/calc
│     │  ├─ import.ts    # /api/import/csv, /api/import/genesis
│     │  └─ export.ts    # /api/export/csv/pdf
│     └─ providers
│        └─ genesis.ts   # Playwright fetcher (login + scrape + normalize)
├─ 📁 client              # React + Vite + Tailwind + shadcn/ui + Recharts
│  ├─ package.json
│  ├─ index.html
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  └─ src
│     ├─ main.tsx
│     ├─ App.tsx
│     ├─ lib
│     │  ├─ api.ts
│     │  ├─ gpa.ts       # shared types + client helpers
│     │  └─ detectors.ts # mirrors server
│     ├─ components
│     │  ├─ Navbar.tsx
│     │  ├─ ImportPanel.tsx
│     │  ├─ CourseTable.tsx
│     │  ├─ AssignmentTable.tsx
│     │  ├─ GPAResults.tsx
│     │  ├─ WeightingControls.tsx
│     │  ├─ TrendChart.tsx
│     │  └─ FileDrop.tsx
│     └─ styles.css
└─ README.md
