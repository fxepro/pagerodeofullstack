"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, LogIn, ExternalLink } from "lucide-react";

export default function DjangoAdminLoginPage() {
  const [djangoAdminUrl, setDjangoAdminUrl] = useState('http://localhost:8000/django-admin/');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Detect current protocol (http or https)
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      
      // In production, use same protocol and hostname
      // In development, use localhost:8000
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // Production: use same domain with /django-admin/
        setDjangoAdminUrl(`${protocol}//${hostname}/django-admin/`);
      } else {
        // Development: use localhost:8000
        setDjangoAdminUrl('http://localhost:8000/django-admin/');
      }
    }
  }, []);

  const handleRedirect = () => {
    window.location.href = djangoAdminUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Django Admin Login
            </CardTitle>
            <CardDescription className="text-slate-600">
              Access Django administration panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                Django Admin uses its own authentication system.
              </p>
            </div>

            <Button
              onClick={handleRedirect}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 font-medium shadow-md"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to Django Admin
            </Button>

            <div className="text-center text-sm text-slate-600">
              <p>URL: {djangoAdminUrl}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

