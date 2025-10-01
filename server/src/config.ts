export const config = {
  // Render will inject PORT, default to 5177 for local dev
  port: process.env.PORT ? parseInt(process.env.PORT) : 5177,

  // 👇 Add all allowed frontends here
  origin: [
    "https://midnightsniper.github.io",
    "https://midnightsniper.github.io/genesisgpa"
  ]
};
