"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [plan, setPlan] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    const planParam = searchParams.get('plan');
    const subIdParam = searchParams.get('subscription_id');
    
    setPlan(planParam);
    setSubscriptionId(subIdParam);
    
    // Clear selected plan from sessionStorage
    sessionStorage.removeItem('selectedPlan');
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl mb-2">Payment Successful!</CardTitle>
          <CardDescription className="text-lg">
            Your subscription has been activated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>Plan:</strong> {plan || 'N/A'}
            </p>
            {subscriptionId && (
              <p className="text-sm text-green-800 mt-2">
                <strong>Subscription ID:</strong> {subscriptionId}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-slate-600 text-center">
              Thank you for subscribing! Your account has been upgraded and you now have access to all features in your plan.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push('/workspace')}
                className="flex-1"
              >
                Go to Workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/workspace/profile')}
                className="flex-1"
              >
                View Subscription
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

