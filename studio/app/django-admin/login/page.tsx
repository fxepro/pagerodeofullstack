"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, LogIn } from "lucide-react";

export default function DjangoAdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [djangoAdminUrl, setDjangoAdminUrl] = useState('http://localhost:8000/django-admin/');
  const [csrfToken, setCsrfToken] = useState("");

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

      // Fetch CSRF token from Django admin login page
      fetch(`${djangoAdminUrl}login/`)
        .then(res => res.text())
        .then(html => {
          // Extract CSRF token from Django's login form
          const csrfMatch = html.match(/name=['"]csrfmiddlewaretoken['"] value=['"]([^'"]+)['"]/);
          if (csrfMatch) {
            setCsrfToken(csrfMatch[1]);
          }
        })
        .catch(() => {
          // If we can't get CSRF token, form will still work via redirect
        });
    }
  }, [djangoAdminUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Create a form and submit it to Django admin login
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${djangoAdminUrl}login/`;
    
    const usernameInput = document.createElement('input');
    usernameInput.type = 'hidden';
    usernameInput.name = 'username';
    usernameInput.value = username;
    form.appendChild(usernameInput);

    const passwordInput = document.createElement('input');
    passwordInput.type = 'hidden';
    passwordInput.name = 'password';
    passwordInput.value = password;
    form.appendChild(passwordInput);

    if (csrfToken) {
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfmiddlewaretoken';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);
    }

    document.body.appendChild(form);
    form.submit();
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
              Sign in to Django administration panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="pl-10 bg-white/70 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 bg-white/70 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 font-medium shadow-md"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

