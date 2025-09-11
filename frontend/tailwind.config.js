/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        card: "#ffffff",
        success: "#16a34a",
        destructive: "#dc2626",
        muted: "#6b7280",
        background: "#f9fafb",
        border: "#e5e7eb",
      },
    },
  },
  plugins: [],
};
