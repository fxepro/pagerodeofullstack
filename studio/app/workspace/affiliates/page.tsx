"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, Edit, Trash2, Eye, Users, Loader2, ArrowUpDown, ArrowUp, ArrowDown,
  CheckCircle2, XCircle, Clock, DollarSign, TrendingUp, UserCheck
} from 'lucide-react';
import { 
  fetchAffiliates, deleteAffiliate, approveAffiliate, suspendAffiliate, rejectAffiliate,
  fetchReferrals, fetchCommissions, fetchPayouts, fetchAffiliateStats,
  approveCommission, processPayout,
  type Affiliate, type Referral, type Commission, type AffiliatePayout, type AffiliateStats
} from '@/lib/api/affiliates';
import { usePermissions } from '@/hooks/use-permissions';
import { format } from 'date-fns';

type SortField = 'affiliate_code' | 'user' | 'status' | 'total_referrals' | 'total_commission_earned' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function AffiliatesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState('affiliates');
  
  // Affiliates state
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(true);
  const [affiliatesSearch, setAffiliatesSearch] = useState('');
  const [affiliatesStatusFilter, setAffiliatesStatusFilter] = useState<string>('all');
  const [affiliatesSortField, setAffiliatesSortField] = useState<SortField>('created_at');
  const [affiliatesSortDirection, setAffiliatesSortDirection] = useState<SortDirection>('desc');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Referrals state
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  
  // Commissions state
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState(true);
  const [commissionsStatusFilter, setCommissionsStatusFilter] = useState<string>('all');
  
  // Payouts state
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [payoutsStatusFilter, setPayoutsStatusFilter] = useState<string>('all');
  
  // Stats state
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Applications state
  const [applications, setApplications] = useState<Affiliate[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState<number | null>(null);

  // Check admin permission
  useEffect(() => {
    if (!hasPermission('affiliates.view')) {
      router.push('/workspace');
    }
  }, [hasPermission, router]);

  useEffect(() => {
    if (activeTab === 'affiliates') {
      loadAffiliates();
    } else if (activeTab === 'applications') {
      loadApplications();
    } else if (activeTab === 'referrals') {
      loadReferrals();
    } else if (activeTab === 'commissions') {
      loadCommissions();
    } else if (activeTab === 'payouts') {
      loadPayouts();
    }
    loadStats();
  }, [activeTab, affiliatesStatusFilter, affiliatesSearch, commissionsStatusFilter, payoutsStatusFilter]);

  const loadAffiliates = async () => {
    setAffiliatesLoading(true);
    try {
      const params: any = {};
      if (affiliatesStatusFilter !== 'all') {
        params.status = affiliatesStatusFilter;
      }
      if (affiliatesSearch) {
        params.search = affiliatesSearch;
      }
      const data = await fetchAffiliates(params);
      // Sort locally
      const sorted = [...data].sort((a, b) => {
        let aVal: any, bVal: any;
        switch (affiliatesSortField) {
          case 'affiliate_code':
            aVal = a.affiliate_code;
            bVal = b.affiliate_code;
            break;
          case 'user':
            aVal = a.user.username;
            bVal = b.user.username;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          case 'total_referrals':
            aVal = a.total_referrals;
            bVal = b.total_referrals;
            break;
          case 'total_commission_earned':
            aVal = a.total_commission_earned;
            bVal = b.total_commission_earned;
            break;
          case 'created_at':
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
            break;
          default:
            return 0;
        }
        if (aVal < bVal) return affiliatesSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return affiliatesSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      setAffiliates(sorted);
    } catch (error) {
      console.error('Error loading affiliates:', error);
    } finally {
      setAffiliatesLoading(false);
    }
  };

  const loadReferrals = async () => {
    setReferralsLoading(true);
    try {
      const data = await fetchReferrals();
      setReferrals(data);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setReferralsLoading(false);
    }
  };

  const loadCommissions = async () => {
    setCommissionsLoading(true);
    try {
      const params: any = {};
      if (commissionsStatusFilter !== 'all') {
        params.status = commissionsStatusFilter;
      }
      const data = await fetchCommissions(params);
      setCommissions(data);
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setCommissionsLoading(false);
    }
  };

  const loadPayouts = async () => {
    setPayoutsLoading(true);
    try {
      const params: any = {};
      if (payoutsStatusFilter !== 'all') {
        params.status = payoutsStatusFilter;
      }
      const data = await fetchPayouts(params);
      setPayouts(data);
    } catch (error) {
      console.error('Error loading payouts:', error);
    } finally {
      setPayoutsLoading(false);
    }
  };

  const loadApplications = async () => {
    setApplicationsLoading(true);
    try {
      const data = await fetchAffiliates({ status: 'pending' });
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await fetchAffiliateStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      // Set default stats if loading fails
      setStats({
        total_affiliates: 0,
        active_affiliates: 0,
        pending_affiliates: 0,
        total_referrals: 0,
        total_conversions: 0,
        conversion_rate: 0,
        total_commissions_earned: 0,
        total_commissions_paid: 0,
        total_commissions_pending: 0,
        pending_payouts_count: 0,
        pending_payouts_amount: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this affiliate? This action cannot be undone.')) {
      return;
    }
    
    setDeletingId(id);
    try {
      await deleteAffiliate(id);
      loadAffiliates();
    } catch (error) {
      console.error('Error deleting affiliate:', error);
      alert('Failed to delete affiliate');
    } finally {
      setDeletingId(null);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveAffiliate(id);
      if (activeTab === 'applications') {
        loadApplications();
      } else {
        loadAffiliates();
      }
      loadStats();
    } catch (error) {
      console.error('Error approving affiliate:', error);
      alert('Failed to approve affiliate');
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setRejectingId(id);
    try {
      await rejectAffiliate(id, rejectReason);
      setShowRejectDialog(null);
      setRejectReason('');
      if (activeTab === 'applications') {
        loadApplications();
      } else {
        loadAffiliates();
      }
      loadStats();
    } catch (error) {
      console.error('Error rejecting affiliate:', error);
      alert('Failed to reject affiliate');
    } finally {
      setRejectingId(null);
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      await suspendAffiliate(id);
      loadAffiliates();
      loadStats();
    } catch (error) {
      console.error('Error suspending affiliate:', error);
      alert('Failed to suspend affiliate');
    }
  };

  const handleApproveCommission = async (id: number) => {
    try {
      await approveCommission(id);
      loadCommissions();
      loadStats();
    } catch (error) {
      console.error('Error approving commission:', error);
      alert('Failed to approve commission');
    }
  };

  const handleProcessPayout = async (id: number) => {
    if (!confirm('Are you sure you want to process this payout?')) {
      return;
    }
    try {
      await processPayout(id);
      loadPayouts();
      loadStats();
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('Failed to process payout');
    }
  };

  const handleSort = (field: SortField) => {
    if (affiliatesSortField === field) {
      setAffiliatesSortDirection(affiliatesSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAffiliatesSortField(field);
      setAffiliatesSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (affiliatesSortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return affiliatesSortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
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

  const getCommissionStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'approved':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPayoutStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!hasPermission('affiliates.view')) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h4-dynamic font-bold">Affiliates Management</h1>
          <p className="text-muted-foreground mt-1">Manage affiliate accounts, track referrals, and process commissions</p>
        </div>
        <Button onClick={() => router.push('/workspace/affiliates/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Affiliate
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Affiliates</p>
                  <p className="text-h2-dynamic font-bold">{stats.total_affiliates}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Affiliates</p>
                  <p className="text-h2-dynamic font-bold">{stats.active_affiliates}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Commissions</p>
                  <p className="text-h2-dynamic font-bold">${Number(stats.total_commissions_earned || 0).toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-h2-dynamic font-bold">${Number(stats.pending_payouts_amount || 0).toFixed(2)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">
            Applications ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="affiliates">
            Affiliates ({affiliates.length})
          </TabsTrigger>
          <TabsTrigger value="referrals">
            Referrals ({referrals.length})
          </TabsTrigger>
          <TabsTrigger value="commissions">
            Commissions ({commissions.length})
          </TabsTrigger>
          <TabsTrigger value="payouts">
            Payouts ({payouts.length})
          </TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {applicationsLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading applications...</p>
              </CardContent>
            </Card>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-h4-dynamic font-semibold mb-2">No pending applications</h3>
                <p className="text-muted-foreground">All applications have been reviewed</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pending Applications ({applications.length})</CardTitle>
                <CardDescription>Review and approve or reject affiliate applications</CardDescription>
              </CardHeader>
              <CardContent className="p-0 px-4 md:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Email</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Payout Method</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{affiliate.user.full_name || affiliate.user.username}</div>
                            <div className="text-sm text-muted-foreground">{affiliate.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{affiliate.company_name || '—'}</TableCell>
                        <TableCell>{affiliate.contact_email}</TableCell>
                        <TableCell>
                          {affiliate.website ? (
                            <a href={affiliate.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {affiliate.website}
                            </a>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>{affiliate.payout_method}</TableCell>
                        <TableCell>{format(new Date(affiliate.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/workspace/affiliates/${affiliate.id}`)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {hasPermission('affiliates.approve') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(affiliate.id)}
                                  title="Approve"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowRejectDialog(affiliate.id)}
                                  title="Reject"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                          {showRejectDialog === affiliate.id && (
                            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                              <Label htmlFor={`reject-reason-${affiliate.id}`} className="text-sm font-medium">
                                Rejection Reason
                              </Label>
                              <Textarea
                                id={`reject-reason-${affiliate.id}`}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                rows={3}
                                className="mt-2"
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(affiliate.id)}
                                  disabled={rejectingId === affiliate.id || !rejectReason.trim()}
                                >
                                  {rejectingId === affiliate.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Confirm Reject'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setShowRejectDialog(null);
                                    setRejectReason('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search affiliates..."
                      value={affiliatesSearch}
                      onChange={(e) => {
                        setAffiliatesSearch(e.target.value);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={affiliatesStatusFilter} onValueChange={(value) => {
                  setAffiliatesStatusFilter(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Affiliates Table */}
          {affiliatesLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading affiliates...</p>
              </CardContent>
            </Card>
          ) : affiliates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-h4-dynamic font-semibold mb-2">No affiliates found</h3>
                <p className="text-muted-foreground mb-4">
                  {affiliatesSearch || affiliatesStatusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first affiliate account'}
                </p>
                {!affiliatesSearch && affiliatesStatusFilter === 'all' && (
                  <Button onClick={() => router.push('/workspace/affiliates/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Affiliate
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 px-4 md:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          onClick={() => handleSort('affiliate_code')}
                          className="flex items-center hover:text-foreground"
                        >
                          Code
                          {getSortIcon('affiliate_code')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('user')}
                          className="flex items-center hover:text-foreground"
                        >
                          User
                          {getSortIcon('user')}
                        </button>
                      </TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center hover:text-foreground"
                        >
                          Status
                          {getSortIcon('status')}
                        </button>
                      </TableHead>
                      <TableHead>Commission Rate</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('total_referrals')}
                          className="flex items-center hover:text-foreground"
                        >
                          Referrals
                          {getSortIcon('total_referrals')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('total_commission_earned')}
                          className="flex items-center hover:text-foreground"
                        >
                          Earnings
                          {getSortIcon('total_commission_earned')}
                        </button>
                      </TableHead>
                      <TableHead>W-9</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell className="font-medium">{affiliate.affiliate_code}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{affiliate.user.full_name || affiliate.user.username}</div>
                            <div className="text-sm text-muted-foreground">{affiliate.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{affiliate.company_name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(affiliate.status)}>
                            {affiliate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {affiliate.commission_type === 'percentage' 
                            ? `${affiliate.commission_rate}%`
                            : `$${Number(affiliate.fixed_commission_amount || 0).toFixed(2)}`}
                        </TableCell>
                        <TableCell>{affiliate.total_referrals}</TableCell>
                        <TableCell>${Number(affiliate.total_commission_earned || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          {affiliate.w9_completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/workspace/affiliates/${affiliate.id}`)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/workspace/affiliates/${affiliate.id}/edit`)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {affiliate.status === 'pending' && hasPermission('affiliates.approve') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(affiliate.id)}
                                title="Approve"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            {affiliate.status === 'active' && hasPermission('affiliates.suspend') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSuspend(affiliate.id)}
                                title="Suspend"
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                            {hasPermission('affiliates.delete') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(affiliate.id)}
                                disabled={deletingId === affiliate.id}
                                title="Delete"
                              >
                                {deletingId === affiliate.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          {referralsLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading referrals...</p>
              </CardContent>
            </Card>
          ) : referrals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-h4-dynamic font-semibold mb-2">No referrals found</h3>
                <p className="text-muted-foreground">Referrals will appear here when users sign up via affiliate links</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 px-4 md:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Referred User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Signed Up</TableHead>
                      <TableHead>Converted</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>{referral.affiliate.affiliate_code}</TableCell>
                        <TableCell>{referral.referral_code}</TableCell>
                        <TableCell>
                          {referral.referred_user ? (
                            <div>
                              <div className="font-medium">{referral.referred_user.full_name || referral.referred_user.username}</div>
                              <div className="text-sm text-muted-foreground">{referral.referred_user.email}</div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(referral.status)}>
                            {referral.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {referral.signed_up_at ? format(new Date(referral.signed_up_at), 'MMM d, yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          {referral.converted_at ? format(new Date(referral.converted_at), 'MMM d, yyyy') : '—'}
                        </TableCell>
                        <TableCell>{format(new Date(referral.created_at), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={commissionsStatusFilter} onValueChange={(value) => {
                setCommissionsStatusFilter(value);
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {commissionsLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading commissions...</p>
              </CardContent>
            </Card>
          ) : commissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-h4-dynamic font-semibold mb-2">No commissions found</h3>
                <p className="text-muted-foreground">Commissions will appear here when referrals convert to subscriptions</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 px-4 md:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Subscription Amount</TableHead>
                      <TableHead>Commission Rate</TableHead>
                      <TableHead>Commission Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>{commission.affiliate.affiliate_code}</TableCell>
                        <TableCell>${Number(commission.subscription_amount || 0).toFixed(2)}</TableCell>
                        <TableCell>{commission.commission_rate}%</TableCell>
                        <TableCell className="font-medium">${Number(commission.commission_amount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getCommissionStatusBadgeVariant(commission.status)}>
                            {commission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(commission.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          {commission.status === 'pending' && hasPermission('commissions.approve') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveCommission(commission.id)}
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={payoutsStatusFilter} onValueChange={(value) => {
                setPayoutsStatusFilter(value);
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {payoutsLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading payouts...</p>
              </CardContent>
            </Card>
          ) : payouts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-h4-dynamic font-semibold mb-2">No payouts found</h3>
                <p className="text-muted-foreground">Payouts will appear here when affiliates request payouts</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 px-4 md:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Commissions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>{payout.affiliate.affiliate_code}</TableCell>
                        <TableCell className="font-medium">${Number(payout.total_amount || 0).toFixed(2)}</TableCell>
                        <TableCell>{payout.payout_method}</TableCell>
                        <TableCell>
                          <Badge variant={getPayoutStatusBadgeVariant(payout.status)}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(payout.period_start), 'MMM d')} - {format(new Date(payout.period_end), 'MMM d, yyyy')}</div>
                          </div>
                        </TableCell>
                        <TableCell>{payout.commission_count || 0}</TableCell>
                        <TableCell>{format(new Date(payout.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          {payout.status === 'pending' && hasPermission('payouts.process') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleProcessPayout(payout.id)}
                              title="Process Payout"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
