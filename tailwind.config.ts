import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary Blue (#2563EB / #2F65E8)
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          dark: '#0f172a',
        },
        surface: {
          ground: '#f8fafc',
          card: '#ffffff',
          soft: '#f1f5f9',
          accent: '#edf4ff',
        },
        status: {
          verified: '#10b981',
          verifiedBg: '#ecfdf5',
          verifiedText: '#047857',
          gap: '#ef4444',
          gapBg: '#fef2f2',
          gapText: '#b91c1c',
          warning: '#f59e0b',
          warningBg: '#fffbeb',
          warningText: '#b45309',
          purple: '#8b5cf6',
          purpleBg: '#f5f3ff',
          purpleText: '#6d28d9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(15, 23, 42, 0.05)',
        'soft-md': '0 4px 12px rgba(15, 23, 42, 0.05)',
        'soft-lg': '0 8px 24px rgba(15, 23, 42, 0.07)',
        'card-glow': '0 0 20px rgba(37, 99, 235, 0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
};
export default config;
