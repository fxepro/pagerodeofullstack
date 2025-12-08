/**
 * Tailwind CSS v3.4 Configuration
 * 
 * Theme customization using CSS variables for dynamic theming.
 * Base variables are defined in app/globals.css.
 * 
 * ⚠️ CRITICAL: This config runs in Node.js during build time, NOT in the browser.
 * 
 * ❌ NEVER USE THESE IN THIS FILE:
 * - window
 * - document
 * - localStorage
 * - navigator
 * - matchMedia
 * - Any browser-only APIs
 * 
 * ✅ ONLY USE:
 * - Static values
 * - CSS variables (var(--variable-name))
 * - Node.js APIs (require, module.exports)
 * 
 * For runtime theming, use CSS variables and update them in your React components.
 */

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  theme: {
    extend: {
      colors: {
        // Shadcn/UI colors using HSL variables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        
        // Dynamic palette colors from backend (using raw CSS variables)
        palette: {
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          secondary: 'var(--color-secondary)',
          'secondary-hover': 'var(--color-secondary-hover)',
          'accent-1': 'var(--color-accent-1)',
          'accent-2': 'var(--color-accent-2)',
          'accent-3': 'var(--color-accent-3)',
        },
      },
      
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      
      fontFamily: {
        body: 'var(--font-body)',
        heading: 'var(--font-heading)',
      },
      
      fontSize: {
        'base-dynamic': 'var(--font-size-base)',
        'h1-dynamic': 'var(--font-size-h1)',
        'h2-dynamic': 'var(--font-size-h2)',
        'h3-dynamic': 'var(--font-size-h3)',
        'h4-dynamic': 'var(--font-size-h4)',
        'h5-dynamic': 'var(--font-size-h5)',
        'h6-dynamic': 'var(--font-size-h6)',
      },
    },
  },
  
  plugins: [
    require('tailwindcss-animate'),
  ],
};

module.exports = config;
