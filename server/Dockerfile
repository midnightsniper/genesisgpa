# Playwright image has Chromium + all OS deps preinstalled
FROM mcr.microsoft.com/playwright:v1.47.2-jammy

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
# Build TS ➜ JS (uses server/tsconfig.json)
RUN npm run build

ENV NODE_ENV=production
ENV PORT=5177
EXPOSE 5177

# Start the compiled server
CMD ["node","dist/server.js"]
