import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#f7f2e8",
        accent: "#bf5b2c",
        moss: "#496a4b"
      }
    }
  },
  plugins: []
};

export default config;
