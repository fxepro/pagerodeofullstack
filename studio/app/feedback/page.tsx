import { Suspense } from "react";
import FeedbackMain from "@/components/feedback-main";

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-palette-accent-3">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary"></div>
        </div>
      }>
        <FeedbackMain />
      </Suspense>
    </div>
  );
}
