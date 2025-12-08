"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Image 
                src="/Pagerodeo-Logo-Black.png" 
                alt="PageRodeo Logo" 
                width={200} 
                height={50}
                className="object-contain hover:opacity-90 transition-opacity duration-300"
              />
            </Link>
          </div>

          {/* 404 Content */}
          <div className="mb-12">
            <h1 className="text-9xl font-bold text-palette-primary mb-4">404</h1>
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Page Not Found</h2>
            <p className="text-lg text-slate-600 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="bg-palette-primary hover:bg-palette-primary-hover text-white"
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Go to Homepage
              </Link>
            </Button>
            
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
              onClick={() => window.history.back()}
            >
              <span>
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </span>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-4">Or try one of these popular pages:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/performance" 
                className="text-sm text-palette-primary hover:underline"
              >
                Performance
              </Link>
              <Link 
                href="/monitor" 
                className="text-sm text-palette-primary hover:underline"
              >
                Monitor
              </Link>
              <Link 
                href="/upgrade" 
                className="text-sm text-palette-primary hover:underline"
              >
                Upgrade
              </Link>
              <Link 
                href="/workspace" 
                className="text-sm text-palette-primary hover:underline"
              >
                Workspace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

