"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { SimpleHeroSection } from '@/components/simple-hero-section';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function AffiliateSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // User info
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    // Affiliate info
    company_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    // Tax info
    tax_entity_type: 'individual' as 'individual' | 'business',
    tax_id_type: '' as 'ssn' | 'ein' | '',
    tax_id_number: '',
    legal_name: '',
    tax_address_line1: '',
    tax_address_line2: '',
    tax_city: '',
    tax_state: '',
    tax_postal_code: '',
    tax_country: 'US',
    // Payout info
    payout_method: 'paypal' as 'paypal' | 'stripe' | 'bank_transfer' | 'check',
    payout_email: '',
    // Additional
    notes: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.email || !formData.contact_email || !formData.company_name) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare data
      const submitData: any = {
        email: formData.email,
        contact_email: formData.contact_email,
        company_name: formData.company_name,
        contact_phone: formData.contact_phone,
        website: formData.website,
        tax_entity_type: formData.tax_entity_type,
        payout_method: formData.payout_method,
        payout_email: formData.payout_email,
        tax_country: formData.tax_country,
      };

      // Add optional fields
      if (formData.username) submitData.username = formData.username;
      if (formData.first_name) submitData.first_name = formData.first_name;
      if (formData.last_name) submitData.last_name = formData.last_name;
      if (formData.tax_id_type) submitData.tax_id_type = formData.tax_id_type;
      if (formData.tax_id_number) submitData.tax_id_number = formData.tax_id_number;
      if (formData.legal_name) submitData.legal_name = formData.legal_name;
      if (formData.tax_address_line1) submitData.tax_address_line1 = formData.tax_address_line1;
      if (formData.tax_address_line2) submitData.tax_address_line2 = formData.tax_address_line2;
      if (formData.tax_city) submitData.tax_city = formData.tax_city;
      if (formData.tax_state) submitData.tax_state = formData.tax_state;
      if (formData.tax_postal_code) submitData.tax_postal_code = formData.tax_postal_code;
      if (formData.notes) submitData.notes = formData.notes;

      const response = await fetch(`${API_BASE}/api/affiliates/affiliates/apply/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.error) {
          throw new Error(data.error);
        }
        if (typeof data === 'object' && Object.keys(data).length > 0) {
          const errorMessages = Object.entries(data)
            .map(([key, value]: [string, any]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join('\n');
          throw new Error(errorMessages);
        }
        throw new Error('Failed to submit application. Please try again.');
      }

      setSuccess(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          email: '',
          username: '',
          first_name: '',
          last_name: '',
          company_name: '',
          contact_email: '',
          contact_phone: '',
          website: '',
          tax_entity_type: 'individual',
          tax_id_type: '',
          tax_id_number: '',
          legal_name: '',
          tax_address_line1: '',
          tax_address_line2: '',
          tax_city: '',
          tax_state: '',
          tax_postal_code: '',
          tax_country: 'US',
          payout_method: 'paypal',
          payout_email: '',
          notes: '',
        });
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SimpleHeroSection
        title="Become an Affiliate"
        subtitle="Fill out the form below to apply for our affiliate program. All applications are reviewed within 2-3 business days."
        gradientFrom="from-palette-primary"
        gradientVia="via-palette-primary"
        gradientTo="to-palette-secondary"
      />
      
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
          <CardHeader>
            <CardTitle>Affiliate Application</CardTitle>
            <CardDescription>
              Fill out the form below to apply for our affiliate program. All applications are reviewed within 2-3 business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your application has been submitted successfully! We'll review it and get back to you within 2-3 business days.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Contact Email *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      required
                      value={formData.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      placeholder="contact@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username (optional)</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      placeholder="johndoe"
                    />
                    <p className="text-sm text-gray-500 mt-1">Leave blank to auto-generate from email</p>
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Phone Number</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => handleChange('contact_phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Company Information</h3>
                
                <div>
                  <Label htmlFor="company_name">Company/Business Name *</Label>
                  <Input
                    id="company_name"
                    required
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Tax Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_entity_type">Entity Type</Label>
                    <Select
                      value={formData.tax_entity_type}
                      onValueChange={(value: 'individual' | 'business') => handleChange('tax_entity_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tax_id_type">Tax ID Type</Label>
                    <Select
                      value={formData.tax_id_type}
                      onValueChange={(value: 'ssn' | 'ein' | '') => handleChange('tax_id_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssn">SSN</SelectItem>
                        <SelectItem value="ein">EIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.tax_id_type && (
                  <div>
                    <Label htmlFor="tax_id_number">Tax ID Number</Label>
                    <Input
                      id="tax_id_number"
                      type="password"
                      value={formData.tax_id_number}
                      onChange={(e) => handleChange('tax_id_number', e.target.value)}
                      placeholder="Enter your tax ID"
                    />
                    <p className="text-sm text-gray-500 mt-1">This information is encrypted and secure</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="legal_name">Legal Name / Business Name</Label>
                  <Input
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => handleChange('legal_name', e.target.value)}
                    placeholder="Full legal name or business name"
                  />
                </div>

                <div>
                  <Label htmlFor="tax_address_line1">Address Line 1</Label>
                  <Input
                    id="tax_address_line1"
                    value={formData.tax_address_line1}
                    onChange={(e) => handleChange('tax_address_line1', e.target.value)}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <Label htmlFor="tax_address_line2">Address Line 2</Label>
                  <Input
                    id="tax_address_line2"
                    value={formData.tax_address_line2}
                    onChange={(e) => handleChange('tax_address_line2', e.target.value)}
                    placeholder="Apartment, suite, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tax_city">City</Label>
                    <Input
                      id="tax_city"
                      value={formData.tax_city}
                      onChange={(e) => handleChange('tax_city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_state">State</Label>
                    <Input
                      id="tax_state"
                      value={formData.tax_state}
                      onChange={(e) => handleChange('tax_state', e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_postal_code">Postal Code</Label>
                    <Input
                      id="tax_postal_code"
                      value={formData.tax_postal_code}
                      onChange={(e) => handleChange('tax_postal_code', e.target.value)}
                      placeholder="ZIP/Postal Code"
                    />
                  </div>
                </div>
              </div>

              {/* Payout Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Payout Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payout_method">Preferred Payout Method</Label>
                    <Select
                      value={formData.payout_method}
                      onValueChange={(value: 'paypal' | 'stripe' | 'bank_transfer' | 'check') => handleChange('payout_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payout_email">Payout Email</Label>
                    <Input
                      id="payout_email"
                      type="email"
                      value={formData.payout_email}
                      onChange={(e) => handleChange('payout_email', e.target.value)}
                      placeholder="payout@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <Label htmlFor="notes">Additional Information</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Tell us about your marketing channels, audience, or any other relevant information..."
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

