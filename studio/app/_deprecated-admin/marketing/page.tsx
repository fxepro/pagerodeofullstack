"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { applyTheme } from "@/lib/theme";
import axios from "axios";
import { Plus, Edit, Trash2, Star, Calendar, DollarSign } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

interface SubscriptionPlan {
  id: number;
  plan_name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
}

interface Deal {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_plan: number;
  base_plan_name?: string;
  discount_percentage: number;
  original_price: number;
  deal_price: number;
  billing_period: 'monthly' | 'annual';
  start_date: string;
  end_date: string;
  is_active: boolean;
  featured: boolean;
  badge_text: string;
  max_redemptions?: number;
  current_redemptions: number;
  display_priority: number;
  paypal_plan_id?: string;
  stripe_plan_id?: string;
  coinbase_plan_id?: string;
}

export default function AdminMarketingPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState<Partial<Deal>>({
    name: '',
    slug: '',
    description: '',
    base_plan: 0,
    discount_percentage: 0,
    original_price: 0,
    deal_price: 0,
    billing_period: 'annual',
    start_date: '',
    end_date: '',
    is_active: true,
    featured: false,
    badge_text: 'LIMITED TIME DEAL',
    max_redemptions: null,
    display_priority: 0,
  });

  useEffect(() => {
    fetchDeals();
    fetchPlans();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchDeals = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/deals/`, {
        headers: getAuthHeaders(),
      });
      setDeals(response.data.deals || []);
    } catch (error: any) {
      console.error("Error fetching deals:", error);
      alert(error.response?.data?.error || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/deals/plans/`, {
        headers: getAuthHeaders(),
      });
      setPlans(response.data.plans || []);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
    }
  };

  const handleCreate = () => {
    setEditingDeal(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      base_plan: 0,
      discount_percentage: 0,
      original_price: 0,
      deal_price: 0,
      billing_period: 'annual',
      start_date: '',
      end_date: '',
      is_active: true,
      featured: false,
      badge_text: 'LIMITED TIME DEAL',
      max_redemptions: null,
      display_priority: 0,
    });
    setShowForm(true);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
    const formatForInput = (isoString: string) => {
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setFormData({
      ...deal,
      start_date: formatForInput(deal.start_date),
      end_date: formatForInput(deal.end_date),
    });
    setShowForm(true);
  };

  const handleDelete = async (dealId: number) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/deals/${dealId}/delete/`, {
        headers: getAuthHeaders(),
      });
      fetchDeals();
    } catch (error: any) {
      console.error("Error deleting deal:", error);
      alert(error.response?.data?.error || "Failed to delete deal");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDeal
        ? `${API_BASE}/api/admin/deals/${editingDeal.id}/update/`
        : `${API_BASE}/api/admin/deals/create/`;
      
      const method = editingDeal ? 'put' : 'post';

      // Convert datetime-local to ISO format
      const submitData = {
        ...formData,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : '',
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : '',
      };

      await axios[method](url, submitData, {
        headers: getAuthHeaders(),
      });

      setShowForm(false);
      fetchDeals();
    } catch (error: any) {
      console.error("Error saving deal:", error);
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to save deal");
    }
  };

  const getPlanName = (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    return plan?.display_name || `Plan ${planId}`;
  };

  if (loading) {
    return (
      <div className={applyTheme.page()}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={applyTheme.page()}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Marketing & Deals</h1>
          <p className="text-slate-600 mt-1">Manage promotional deals and featured offers</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-palette-primary hover:bg-palette-primary/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Deal
        </Button>
      </div>

      {showForm && (
        <Card className={applyTheme.card() + " mb-6"}>
          <CardHeader>
            <CardTitle>{editingDeal ? 'Edit Deal' : 'Create New Deal'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Deal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (!editingDeal) {
                        setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Base Plan *
                  </label>
                  <select
                    required
                    value={formData.base_plan}
                    onChange={(e) => setFormData({ ...formData, base_plan: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  >
                    <option value={0}>Select a plan</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.display_name} (${plan.price_monthly}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Billing Period *
                  </label>
                  <select
                    required
                    value={formData.billing_period}
                    onChange={(e) => setFormData({ ...formData, billing_period: e.target.value as 'monthly' | 'annual' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Discount Percentage *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Original Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Deal Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.deal_price}
                    onChange={(e) => setFormData({ ...formData, deal_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Display Priority
                  </label>
                  <input
                    type="number"
                    value={formData.display_priority}
                    onChange={(e) => setFormData({ ...formData, display_priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max Redemptions (leave empty for unlimited)
                  </label>
                  <input
                    type="number"
                    value={formData.max_redemptions || ''}
                    onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-palette-primary focus:border-transparent"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-palette-primary border-slate-300 rounded focus:ring-palette-primary"
                    />
                    <span className="text-sm font-medium text-slate-700">Active</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-palette-primary border-slate-300 rounded focus:ring-palette-primary"
                    />
                    <span className="text-sm font-medium text-slate-700">Featured (Homepage)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-palette-primary hover:bg-palette-primary/90 text-white"
                >
                  {editingDeal ? 'Update Deal' : 'Create Deal'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {deals.length === 0 ? (
          <Card className={applyTheme.card()}>
            <CardContent className="text-center py-12">
              <p className="text-slate-600">No deals created yet. Click "Create Deal" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          deals.map((deal) => (
            <Card key={deal.id} className={applyTheme.card()}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-xl">{deal.name}</CardTitle>
                      {deal.featured && (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      )}
                      {!deal.is_active && (
                        <span className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(deal.start_date).toLocaleDateString()} - {new Date(deal.end_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${deal.original_price} → ${deal.deal_price} ({deal.discount_percentage}% off)
                      </span>
                      <span>{deal.billing_period === 'monthly' ? 'Monthly' : 'Annual'}</span>
                      <span>Base Plan: {getPlanName(deal.base_plan)}</span>
                      {deal.max_redemptions && (
                        <span>Redemptions: {deal.current_redemptions}/{deal.max_redemptions}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(deal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(deal.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {deal.description && (
                <CardContent>
                  <p className="text-slate-600">{deal.description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

