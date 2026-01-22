"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Tag, Percent, Calendar, CheckCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { getDjangoApiUrl } from "@/lib/api-config";
import { SimpleHeroSection } from "@/components/simple-hero-section";

interface Deal {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_plan: {
    name: string;
    display_name: string;
  };
  discount_percentage: number;
  original_price: number;
  deal_price: number;
  billing_period: 'monthly' | 'annual';
  start_date: string;
  end_date: string;
  badge_text: string;
  is_valid: boolean;
}

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch active deals
    axios.get(getDjangoApiUrl('/api/deals/active/'))
      .then(response => {
        setDeals(response.data.deals || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching deals:', error);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateSavings = (original: number, deal: number) => {
    return original - deal;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-palette-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <SimpleHeroSection
        title="Special Deals & Promotions"
        subtitle="Take advantage of our limited-time offers and save on your subscription"
        gradientFrom="from-palette-primary"
        gradientVia="via-palette-primary"
        gradientTo="to-palette-secondary"
      />
      <div className="container mx-auto px-4 py-12 max-w-7xl">

        {/* Deals Grid */}
        {deals.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">No Active Deals</h2>
            <p className="text-slate-600 mb-6">Check back soon for new promotional offers!</p>
            <Button asChild>
              <Link href="/upgrade">View All Plans</Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {deals.map((deal) => (
              <Card key={deal.id} className="relative overflow-hidden border-2 border-palette-primary/20 hover:border-palette-primary/40 transition-all duration-300 hover:shadow-xl">
                {/* Deal Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-to-r from-palette-primary to-palette-secondary text-white">
                    {deal.badge_text}
                  </Badge>
                </div>

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">{deal.discount_percentage}% OFF</span>
                  </div>
                  <CardTitle className="text-2xl mb-2">{deal.name}</CardTitle>
                  <CardDescription className="text-base">
                    {deal.base_plan.display_name} Plan
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Description */}
                  {deal.description && (
                    <p className="text-slate-600 text-sm">{deal.description}</p>
                  )}

                  {/* Pricing */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Original Price</span>
                      <span className="line-through text-slate-400">${deal.original_price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Your Savings</span>
                      <span className="text-green-600 font-semibold">
                        -${calculateSavings(deal.original_price, deal.deal_price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold">Deal Price</span>
                      <span className="text-2xl font-bold text-palette-primary">
                        ${deal.deal_price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                      {deal.billing_period === 'monthly' 
                        ? `Billed monthly at $${deal.deal_price.toFixed(2)}/mo`
                        : `Billed annually at $${deal.deal_price.toFixed(2)}/year`}
                    </p>
                  </div>

                  {/* Validity Period */}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Valid until {formatDate(deal.end_date)}
                    </span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>All {deal.base_plan.display_name} features included</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>Cancel anytime</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-palette-primary to-palette-secondary hover:from-palette-primary-hover hover:to-palette-secondary-hover text-white"
                    onClick={() => router.push(`/checkout?deal=${deal.slug}`)}
                  >
                    Claim Deal Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-to-r from-palette-primary/10 to-palette-secondary/10 border-2 border-palette-primary/20">
            <CardContent className="py-8">
              <h2 className="text-2xl font-bold mb-4">Don't See a Deal for You?</h2>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Check out our regular pricing plans. All plans include a 10% discount when billed annually.
              </p>
              <Button asChild size="lg">
                <Link href="/upgrade">
                  View All Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

