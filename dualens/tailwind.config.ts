import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-app-strong) / <alpha-value>)",
        paper: "rgb(var(--color-app-panel) / <alpha-value>)",
        accent: "rgb(var(--color-app-strong) / <alpha-value>)",
        moss: "rgb(var(--color-app-muted) / <alpha-value>)",
        app: "rgb(var(--color-app) / <alpha-value>)",
        "app-panel": "rgb(var(--color-app-panel) / <alpha-value>)",
        "app-card": "rgb(var(--color-app-card) / <alpha-value>)",
        "app-soft": "rgb(var(--color-app-soft) / <alpha-value>)",
        "app-foreground": "rgb(var(--color-app-foreground) / <alpha-value>)",
        "app-muted": "rgb(var(--color-app-muted) / <alpha-value>)",
        "app-line": "rgb(var(--color-app-line) / <alpha-value>)",
        "app-strong": "rgb(var(--color-app-strong) / <alpha-value>)",
        "app-inverse": "rgb(var(--color-app-inverse) / <alpha-value>)",
        "app-focus": "rgb(var(--color-app-focus) / <alpha-value>)"
      },
      boxShadow: {
        "app-soft": "0 14px 42px var(--shadow-soft)"
      }
    }
  },
  plugins: []
};

export default config;
