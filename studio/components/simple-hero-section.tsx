"use client"

import React from "react"

export interface SimpleHeroSectionProps {
  /** Main heading text (one line) */
  title: string
  /** Subtitle/description text (one line) */
  subtitle: string
  /** Custom gradient background colors (default: palette-primary to palette-secondary) */
  gradientFrom?: string
  gradientVia?: string
  gradientTo?: string
}

export function SimpleHeroSection({
  title,
  subtitle,
  gradientFrom = "from-palette-primary",
  gradientVia = "via-palette-primary",
  gradientTo = "to-palette-secondary",
}: SimpleHeroSectionProps) {
  return (
    <section className={`relative py-20 px-4 bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} overflow-hidden`}>
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-32 right-1/3 w-8 h-8 bg-white/5 rounded-full animate-pulse delay-3000"></div>
      </div>
      
      <div className="relative z-10 container mx-auto max-w-4xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          {title}
        </h1>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>
    </section>
  )
}

