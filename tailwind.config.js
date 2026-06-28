/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        dark: "#0F172A",
        accent: "#F59E0B",
        soft: "#F8FAFC"
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        premium: "0 24px 80px rgba(15, 23, 42, 0.16)"
      }
    }
  },
  plugins: []
};
