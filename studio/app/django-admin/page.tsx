"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DjangoAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Django admin with trailing slash
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // Production: redirect to /django-admin/
        window.location.href = `${protocol}//${hostname}/django-admin/`;
      } else {
        // Development: redirect to localhost:8000
        window.location.href = 'http://localhost:8000/django-admin/';
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to Django admin...</p>
    </div>
  );
}

