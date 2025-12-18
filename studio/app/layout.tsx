import type React from "react"
import type { Metadata } from "next"
import { Inter, Montserrat, Lato, Source_Sans_3, Archivo } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { ConditionalNavigation } from "@/components/conditional-navigation"
import { ConditionalFooter } from "@/components/conditional-footer"
import { ToasterProvider } from "@/components/toaster-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { PaletteProvider } from "@/components/palette-provider"
import { PostHogProviderWrapper } from "@/lib/posthog"
import { LanguageProvider } from "@/components/language-provider"
import { I18nProvider } from "@/components/i18n-provider"

const defaultPalette = {
  name: 'Default Purple',
  primary_color: '#9333ea',
  secondary_color: '#7c3aed',
  accent_1: '#a855f7',
  accent_2: '#c084fc',
  accent_3: '#e9d5ff',
};

const paletteHydrationScript = `(() => {
  if (typeof document === 'undefined') return;

  var palette = null;
  try {
    var stored = localStorage.getItem('activePalette');
    palette = stored ? JSON.parse(stored) : null;
  } catch (error) {
    palette = null;
  }

  if (!palette) {
    palette = ${JSON.stringify(defaultPalette)};
  }

  var adjustColor = function(hex, percent) {
    if (!hex) return hex;
    hex = hex.replace('#', '');
    if (hex.length !== 6) return '#' + hex;
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    var adjustChannel = function(channel) {
      var value = Math.max(0, Math.min(255, channel + (channel * percent / 100)));
      return Math.round(value).toString(16).padStart(2, '0');
    };
    return '#' + adjustChannel(r) + adjustChannel(g) + adjustChannel(b);
  };

  var css = ':root{' +
    '--color-primary:' + palette.primary_color + ';' +
    '--color-secondary:' + palette.secondary_color + ';' +
    '--color-accent-1:' + palette.accent_1 + ';' +
    '--color-accent-2:' + palette.accent_2 + ';' +
    '--color-accent-3:' + palette.accent_3 + ';' +
    '--color-primary-hover:' + adjustColor(palette.primary_color, -10) + ';' +
    '--color-secondary-hover:' + adjustColor(palette.secondary_color, -10) + ';' +
  '}';

  var styleId = 'palette-hydrated-vars';
  var existing = document.getElementById(styleId);
  if (existing && existing.tagName === 'STYLE') {
    existing.innerHTML = css;
  } else {
    var style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = css;
    document.head.appendChild(style);
  }
})();`

// Multi-language font support: Latin, Latin Extended, Cyrillic, Greek for European languages
const inter = Inter({ 
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek", "greek-ext"],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
  preload: true
})

const montserrat = Montserrat({ 
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
  preload: true
})

const lato = Lato({ 
  subsets: ["latin", "latin-ext"],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-lato',
  display: 'swap',
  preload: true
})

const sourceSans3 = Source_Sans_3({ 
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek", "greek-ext", "vietnamese"],
  weight: ['400', '600', '700'],
  variable: '--font-source-sans-3',
  display: 'swap',
  preload: true
})

const archivo = Archivo({ 
  subsets: ["latin", "latin-ext"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
  preload: true
})

export const metadata: Metadata = {
  title: "pagerodeo - Website Performance Testing Tool",
  description: "Professional website performance testing and monitoring tool with comprehensive analysis, Core Web Vitals, and AI-powered recommendations.",
  icons: {
    icon: [
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_io/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { url: '/favicon_io/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon_io/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  manifest: '/favicon_io/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon_io/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon_io/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <meta name="theme-color" content="#8b5cf6" />
        <script dangerouslySetInnerHTML={{ __html: paletteHydrationScript }} />
      </head>
      <body className={`${montserrat.className} ${inter.variable} ${lato.variable} ${sourceSans3.variable} ${archivo.variable}`}>
        <LanguageProvider />
        <I18nProvider>
        <PostHogProviderWrapper>
          <ThemeProvider>
            <PaletteProvider>
              {/* Conditional navigation - hidden for dashboard routes */}
              <ConditionalNavigation />
              
              {/* Fallback: Original navigation (commented out for now) */}
              {/* <Navigation /> */}
              
              <main className="min-h-screen bg-background">{children}</main>
              <ConditionalFooter />
              <ToasterProvider />
            </PaletteProvider>
          </ThemeProvider>
        </PostHogProviderWrapper>
        </I18nProvider>
      </body>
    </html>
  )
}
