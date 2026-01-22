"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Edit, Save, X, Loader2, User, Mail, Phone, Globe, 
  DollarSign, Building, FileText, MapPin, CreditCard, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { 
  fetchAffiliate, updateAffiliate, deleteAffiliate, approveAffiliate, suspendAffiliate,
  type Affiliate
} from '@/lib/api/affiliates';
import { usePermissions } from '@/hooks/use-permissions';
import { format } from 'date-fns';

export default function AffiliateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const affiliateId = parseInt(params?.id as string);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    commission_rate: 20.00,
    commission_type: 'percentage' as 'percentage' | 'fixed',
    fixed_commission_amount: null as number | null,
    status: 'pending' as 'pending' | 'active' | 'suspended' | 'inactive',
    notes: '',
    payout_threshold: 50.00,
    payout_method: 'paypal' as 'paypal' | 'stripe' | 'bank_transfer' | 'check',
    payout_email: '',
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
    w9_completed: false,
  });

  useEffect(() => {
    if (affiliateId) {
      loadAffiliate();
    }
  }, [affiliateId]);

  const loadAffiliate = async () => {
    try {
      setLoading(true);
      const data = await fetchAffiliate(affiliateId);
      setAffiliate(data);
      setFormData({
        company_name: data.company_name || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        website: data.website || '',
        commission_rate: Number(data.commission_rate || 20.00),
        commission_type: data.commission_type || 'percentage',
        fixed_commission_amount: data.fixed_commission_amount ? Number(data.fixed_commission_amount) : null,
        status: data.status || 'pending',
        notes: data.notes || '',
        payout_threshold: Number(data.payout_threshold || 50.00),
        payout_method: data.payout_method || 'paypal',
        payout_email: data.payout_email || '',
        tax_entity_type: data.tax_entity_type || 'individual',
        tax_id_type: data.tax_id_type || '',
        tax_id_number: data.tax_id_number || '',
        legal_name: data.legal_name || '',
        tax_address_line1: data.tax_address_line1 || '',
        tax_address_line2: data.tax_address_line2 || '',
        tax_city: data.tax_city || '',
        tax_state: data.tax_state || '',
        tax_postal_code: data.tax_postal_code || '',
        tax_country: data.tax_country || 'US',
        w9_completed: data.w9_completed || false,
      });
    } catch (error: any) {
      console.error('Error loading affiliate:', error);
      alert('Failed to load affiliate details');
      router.push('/workspace/affiliates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateAffiliate(affiliateId, formData);
      setAffiliate(updated);
      setIsEditing(false);
      // Reload to get fresh data
      await loadAffiliate();
    } catch (error: any) {
      console.error('Error updating affiliate:', error);
      alert(error.message || 'Failed to update affiliate');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (affiliate) {
      // Reset form data
      setFormData({
        company_name: affiliate.company_name || '',
        contact_email: affiliate.contact_email || '',
        contact_phone: affiliate.contact_phone || '',
        website: affiliate.website || '',
        commission_rate: Number(affiliate.commission_rate || 20.00),
        commission_type: affiliate.commission_type || 'percentage',
        fixed_commission_amount: affiliate.fixed_commission_amount ? Number(affiliate.fixed_commission_amount) : null,
        status: affiliate.status || 'pending',
        notes: affiliate.notes || '',
        payout_threshold: Number(affiliate.payout_threshold || 50.00),
        payout_method: affiliate.payout_method || 'paypal',
        payout_email: affiliate.payout_email || '',
        tax_entity_type: affiliate.tax_entity_type || 'individual',
        tax_id_type: affiliate.tax_id_type || '',
        tax_id_number: affiliate.tax_id_number || '',
        legal_name: affiliate.legal_name || '',
        tax_address_line1: affiliate.tax_address_line1 || '',
        tax_address_line2: affiliate.tax_address_line2 || '',
        tax_city: affiliate.tax_city || '',
        tax_state: affiliate.tax_state || '',
        tax_postal_code: affiliate.tax_postal_code || '',
        tax_country: affiliate.tax_country || 'US',
        w9_completed: affiliate.w9_completed || false,
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this affiliate? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      await deleteAffiliate(affiliateId);
      router.push('/workspace/affiliates');
    } catch (error: any) {
      console.error('Error deleting affiliate:', error);
      alert(error.message || 'Failed to delete affiliate');
      setDeleting(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approveAffiliate(affiliateId);
      await loadAffiliate();
    } catch (error: any) {
      console.error('Error approving affiliate:', error);
      alert(error.message || 'Failed to approve affiliate');
    }
  };

  const handleSuspend = async () => {
    try {
      await suspendAffiliate(affiliateId);
      await loadAffiliate();
    } catch (error: any) {
      console.error('Error suspending affiliate:', error);
      alert(error.message || 'Failed to suspend affiliate');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      case 'inactive':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading affiliate details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="space-y-6 px-4 md:px-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Affiliate not found</p>
            <Button onClick={() => router.push('/workspace/affiliates')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Affiliates
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/workspace/affiliates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-h4-dynamic font-bold">Affiliate Details</h1>
            <p className="text-muted-foreground mt-1">
              {affiliate.user.full_name || affiliate.user.username} - {affiliate.affiliate_code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              {hasPermission('affiliates.change') && (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {affiliate.status === 'pending' && hasPermission('affiliates.approve') && (
                <Button variant="default" onClick={handleApprove}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
              {affiliate.status === 'active' && hasPermission('affiliates.suspend') && (
                <Button variant="destructive" onClick={handleSuspend}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
              )}
              {hasPermission('affiliates.delete') && (
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Badge / Selector */}
      <div>
        {isEditing ? (
          <div className="max-w-xs">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'pending' | 'active' | 'suspended' | 'inactive') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Badge variant={getStatusBadgeVariant(affiliate.status)} className="text-sm px-3 py-1">
            {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commission">Commission Settings</TabsTrigger>
          <TabsTrigger value="payout">Payout Information</TabsTrigger>
          <TabsTrigger value="tax">Tax Information</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Username</Label>
                  <p className="font-medium">{affiliate.user.username}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{affiliate.user.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{affiliate.user.full_name || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Affiliate Code</Label>
                  <p className="font-medium font-mono">{affiliate.affiliate_code}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_email">Contact Email *</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        required
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Company Name</Label>
                      <p className="font-medium">{affiliate.company_name || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Contact Email</Label>
                      <p className="font-medium">{affiliate.contact_email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Contact Phone</Label>
                      <p className="font-medium">{affiliate.contact_phone || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Website</Label>
                      {affiliate.website ? (
                        <a href={affiliate.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                          {affiliate.website}
                        </a>
                      ) : (
                        <p className="font-medium">—</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={6}
                  placeholder="Admin notes about this affiliate..."
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {affiliate.notes || 'No notes available'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Application Notes */}
          {affiliate.application_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Application Notes
                </CardTitle>
                <CardDescription>Notes provided by the applicant during sign-up</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{affiliate.application_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Info */}
          {affiliate.rejected_at && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  Rejection Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {affiliate.rejected_at && (
                  <div>
                    <Label className="text-muted-foreground">Rejected At</Label>
                    <p className="font-medium">{format(new Date(affiliate.rejected_at), 'PPpp')}</p>
                  </div>
                )}
                {affiliate.rejection_reason && (
                  <div>
                    <Label className="text-muted-foreground">Rejection Reason</Label>
                    <p className="font-medium whitespace-pre-wrap">{affiliate.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="font-medium">{format(new Date(affiliate.created_at), 'PPpp')}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <p className="font-medium">{format(new Date(affiliate.updated_at), 'PPpp')}</p>
              </div>
              {affiliate.approved_at && (
                <div>
                  <Label className="text-muted-foreground">Approved At</Label>
                  <p className="font-medium">{format(new Date(affiliate.approved_at), 'PPpp')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Settings Tab */}
        <TabsContent value="commission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Commission Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="commission_type">Commission Type</Label>
                    <Select
                      value={formData.commission_type}
                      onValueChange={(value: 'percentage' | 'fixed') => 
                        setFormData({ ...formData, commission_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.commission_type === 'percentage' ? (
                    <div>
                      <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                      <Input
                        id="commission_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.commission_rate}
                        onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="fixed_commission_amount">Fixed Commission Amount ($)</Label>
                      <Input
                        id="fixed_commission_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.fixed_commission_amount || ''}
                        onChange={(e) => setFormData({ ...formData, fixed_commission_amount: parseFloat(e.target.value) || null })}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-muted-foreground">Commission Type</Label>
                    <p className="font-medium capitalize">{affiliate.commission_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Commission Rate</Label>
                    <p className="font-medium">
                      {affiliate.commission_type === 'percentage' 
                        ? `${affiliate.commission_rate}%`
                        : `$${Number(affiliate.fixed_commission_amount || 0).toFixed(2)}`}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payout Information Tab */}
        <TabsContent value="payout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payout Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="payout_threshold">Payout Threshold ($)</Label>
                    <Input
                      id="payout_threshold"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.payout_threshold}
                      onChange={(e) => setFormData({ ...formData, payout_threshold: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payout_method">Payout Method</Label>
                    <Select
                      value={formData.payout_method}
                      onValueChange={(value: 'paypal' | 'stripe' | 'bank_transfer' | 'check') => 
                        setFormData({ ...formData, payout_method: value })
                      }
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
                      onChange={(e) => setFormData({ ...formData, payout_email: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-muted-foreground">Payout Threshold</Label>
                    <p className="font-medium">${Number(affiliate.payout_threshold || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payout Method</Label>
                    <p className="font-medium capitalize">{affiliate.payout_method}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payout Email</Label>
                    <p className="font-medium">{affiliate.payout_email || '—'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Information Tab */}
        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Tax Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="tax_entity_type">Entity Type</Label>
                    <Select
                      value={formData.tax_entity_type}
                      onValueChange={(value: 'individual' | 'business') => 
                        setFormData({ ...formData, tax_entity_type: value })
                      }
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
                      onValueChange={(value: 'ssn' | 'ein' | '') => 
                        setFormData({ ...formData, tax_id_type: value })
                      }
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
                  {formData.tax_id_type && (
                    <div>
                      <Label htmlFor="tax_id_number">Tax ID Number</Label>
                      <Input
                        id="tax_id_number"
                        type="password"
                        value={formData.tax_id_number}
                        onChange={(e) => setFormData({ ...formData, tax_id_number: e.target.value })}
                        placeholder="Enter tax ID"
                      />
                      <p className="text-sm text-muted-foreground mt-1">This information is encrypted</p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="legal_name">Legal Name / Business Name</Label>
                    <Input
                      id="legal_name"
                      value={formData.legal_name}
                      onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_address_line1">Address Line 1</Label>
                    <Input
                      id="tax_address_line1"
                      value={formData.tax_address_line1}
                      onChange={(e) => setFormData({ ...formData, tax_address_line1: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_address_line2">Address Line 2</Label>
                    <Input
                      id="tax_address_line2"
                      value={formData.tax_address_line2}
                      onChange={(e) => setFormData({ ...formData, tax_address_line2: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="tax_city">City</Label>
                      <Input
                        id="tax_city"
                        value={formData.tax_city}
                        onChange={(e) => setFormData({ ...formData, tax_city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tax_state">State</Label>
                      <Input
                        id="tax_state"
                        value={formData.tax_state}
                        onChange={(e) => setFormData({ ...formData, tax_state: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tax_postal_code">Postal Code</Label>
                      <Input
                        id="tax_postal_code"
                        value={formData.tax_postal_code}
                        onChange={(e) => setFormData({ ...formData, tax_postal_code: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tax_country">Country</Label>
                    <Input
                      id="tax_country"
                      value={formData.tax_country}
                      onChange={(e) => setFormData({ ...formData, tax_country: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="w9_completed"
                      checked={formData.w9_completed}
                      onCheckedChange={(checked) => setFormData({ ...formData, w9_completed: checked === true })}
                    />
                    <Label htmlFor="w9_completed" className="cursor-pointer">W-9 Form Completed</Label>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-muted-foreground">Entity Type</Label>
                    <p className="font-medium capitalize">{affiliate.tax_entity_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tax ID Type</Label>
                    <p className="font-medium">{affiliate.tax_id_type ? affiliate.tax_id_type.toUpperCase() : '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tax ID Number</Label>
                    <p className="font-medium">{affiliate.tax_id_number ? '••••••••' : '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Legal Name</Label>
                    <p className="font-medium">{affiliate.legal_name || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tax Address</Label>
                    <p className="font-medium">
                      {affiliate.tax_address_line1 ? (
                        <>
                          {affiliate.tax_address_line1}
                          {affiliate.tax_address_line2 && <>, {affiliate.tax_address_line2}</>}
                          <br />
                          {affiliate.tax_city && affiliate.tax_city}
                          {affiliate.tax_state && <>, {affiliate.tax_state}</>}
                          {affiliate.tax_postal_code && <> {affiliate.tax_postal_code}</>}
                          {affiliate.tax_country && <>, {affiliate.tax_country}</>}
                        </>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">W-9 Completed</Label>
                    <div className="flex items-center gap-2">
                      {affiliate.w9_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <p className="font-medium">{affiliate.w9_completed ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Total Referrals</Label>
                  <p className="text-2xl font-bold">{affiliate.total_referrals}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Conversions</Label>
                  <p className="text-2xl font-bold">{affiliate.total_conversions}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Conversion Rate</Label>
                  <p className="text-2xl font-bold">
                    {affiliate.total_referrals > 0 
                      ? `${((affiliate.total_conversions / affiliate.total_referrals) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commission Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Total Earned</Label>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(affiliate.total_commission_earned || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Paid</Label>
                  <p className="text-2xl font-bold text-blue-600">
                    ${Number(affiliate.total_commission_paid || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Pending</Label>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${Number(affiliate.total_commission_pending || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Current Year Earnings</Label>
                  <p className="text-2xl font-bold">
                    ${Number(affiliate.current_year_earnings || 0).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

