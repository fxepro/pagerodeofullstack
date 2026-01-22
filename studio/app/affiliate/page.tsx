"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Clock,
  Target,
  Zap,
  BarChart3,
  Gift,
  Award
} from "lucide-react";
import Link from "next/link";
import { SimpleHeroSection } from "@/components/simple-hero-section";

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <SimpleHeroSection
        title="Affiliate Program"
        subtitle="Earn commissions by referring customers to PageRodeo. Join our growing network of partners and monetize your audience."
        gradientFrom="from-palette-primary"
        gradientVia="via-palette-primary"
        gradientTo="to-palette-secondary"
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* CTA Section */}
        <div className="text-center mb-16">
          <Button size="lg" asChild className="bg-palette-primary hover:bg-palette-primary-hover text-white">
            <Link href="/affiliate-signup">
              <Users className="h-5 w-5 mr-2" />
              Apply to Become an Affiliate
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Benefits Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Join Our Affiliate Program?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <DollarSign className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Competitive Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Earn generous commissions on every successful referral. Our standard commission rate is 20% of subscription revenue.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Recurring Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Earn commissions on recurring subscriptions, not just one-time purchases. Build a sustainable income stream.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>Reliable Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get paid on time through PayPal, Stripe, or bank transfer. Minimum payout threshold of $50.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-yellow-600 mb-4" />
                <CardTitle>Easy Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Track your referrals, conversions, and earnings in real-time through your affiliate dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Gift className="h-10 w-10 text-pink-600 mb-4" />
                <CardTitle>Marketing Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access banners, links, and promotional materials to help you promote PageRodeo effectively.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>Dedicated Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get dedicated support from our affiliate team to help you succeed and maximize your earnings.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-palette-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-palette-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Apply</h3>
                <p className="text-sm text-gray-600">
                  Fill out our simple application form with your business information
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-palette-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-palette-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Get Approved</h3>
                <p className="text-sm text-gray-600">
                  Our team reviews your application within 2-3 business days
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-palette-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-palette-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Share Your Link</h3>
                <p className="text-sm text-gray-600">
                  Get your unique affiliate link and start promoting PageRodeo
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-palette-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-palette-primary">4</span>
                </div>
                <h3 className="font-semibold mb-2">Earn Commissions</h3>
                <p className="text-sm text-gray-600">
                  Earn commissions when your referrals become paying customers
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Commission Details */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-palette-primary/5 to-palette-secondary/5 border-2 border-palette-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Commission Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-palette-primary" />
                    Standard Commission
                  </h3>
                  <p className="text-gray-700 mb-2">
                    <span className="font-bold text-2xl text-palette-primary">20%</span> of subscription revenue
                  </p>
                  <p className="text-sm text-gray-600">
                    Applied to all successful referrals who become paying customers
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-palette-primary" />
                    Payout Schedule
                  </h3>
                  <p className="text-gray-700 mb-2">
                    <span className="font-bold">Monthly</span> payouts
                  </p>
                  <p className="text-sm text-gray-600">
                    Minimum payout threshold: $50. Payouts processed within 5-7 business days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Requirements */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Requirements
          </h2>
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Valid business or individual tax information (W-9 for US affiliates)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Active website, blog, or social media presence</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Compliance with our affiliate terms and guidelines</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">No spam, misleading claims, or unethical marketing practices</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-palette-primary to-palette-secondary text-white border-0">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join our affiliate program today and start earning commissions by sharing PageRodeo with your audience.
              </p>
              <Button size="lg" asChild className="bg-white text-palette-primary hover:bg-palette-accent-3">
                <Link href="/affiliate-signup">
                  <Users className="h-5 w-5 mr-2" />
                  Apply Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

