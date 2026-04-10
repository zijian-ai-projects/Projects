import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#fbfbfa",
        accent: "#111111",
        moss: "#6d6d6a",
        app: "#f3f3f1",
        "app-panel": "#fbfbfa",
        "app-card": "#ffffff",
        "app-foreground": "#161616",
        "app-muted": "#6d6d6a",
        "app-line": "#dbdbd7",
        "app-strong": "#111111"
      }
    }
  },
  plugins: []
};

export default config;
