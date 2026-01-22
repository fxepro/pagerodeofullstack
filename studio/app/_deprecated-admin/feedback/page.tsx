"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Star, 
  Search, 
  Filter, 
  Download, 
  Eye,
  Trash2,
  Reply,
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { applyTheme, LAYOUT } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

interface Feedback {
  id: number;
  user_email: string | null;
  user: string;
  rating: number;
  great_work: string;
  could_be_better: string;
  remove_and_relish: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  responded_at: string | null;
}

interface FeedbackStats {
  total: number;
  new: number;
  reviewed: number;
  responded: number;
  average_rating: number;
  response_rate: number;
}

export default function AdminFeedbackPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [feedbackData, setFeedbackData] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    new: 0,
    reviewed: 0,
    responded: 0,
    average_rating: 0,
    response_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please log in to view feedback');
        setLoading(false);
        return;
      }

      // Build query params
      const params = new URLSearchParams();
      if (filterRating !== "all") {
        params.append('rating', filterRating);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const url = `${API_BASE}/api/admin/feedback/${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`Failed to fetch feedback: ${response.statusText}`);
      }

      const data = await response.json();
      setFeedbackData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback');
      toast({
        title: "Error",
        description: err.message || 'Failed to load feedback',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/admin/feedback/stats/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    // Debounce search and filter changes
    const timer = setTimeout(() => {
      fetchFeedback();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filterRating]);

  const handleUpdateStatus = async (feedbackId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/admin/feedback/${feedbackId}/update/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Feedback status updated successfully",
        });
        fetchFeedback();
        fetchStats();
      } else {
        throw new Error('Failed to update feedback status');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update feedback status',
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (feedbackId: number) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/admin/feedback/${feedbackId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Feedback deleted successfully",
        });
        fetchFeedback();
        fetchStats();
      } else {
        throw new Error('Failed to delete feedback');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete feedback',
        variant: "destructive",
      });
    }
  };

  const filteredFeedback = feedbackData.filter(feedback => {
    // Server-side filtering is already applied, but we can do client-side filtering for additional refinement
    const matchesSearch = !searchTerm || 
      (feedback.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       feedback.great_work?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       feedback.could_be_better?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       feedback.remove_and_relish?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRating = filterRating === "all" || 
      (filterRating === "5" && feedback.rating === 5) ||
      (filterRating === "4" && feedback.rating === 4) ||
      (filterRating === "3" && feedback.rating === 3) ||
      (filterRating === "2" && feedback.rating === 2) ||
      (filterRating === "1" && feedback.rating === 1);
    
    return matchesSearch && matchesRating;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-600";
      case "reviewed": return "bg-yellow-600";
      case "responded": return "bg-green-600";
      case "archived": return "bg-gray-600";
      default: return "bg-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "New";
      case "reviewed": return "Reviewed";
      case "responded": return "Responded";
      case "archived": return "Archived";
      default: return "Unknown";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isFilled = starNumber <= rating;
      
      return (
        <Star
          key={index}
          className={`h-4 w-4 ${
            isFilled ? "text-yellow-400 fill-current" : "text-gray-400"
          }`}
        />
      );
    });
  };

  if (loading && feedbackData.length === 0) {
    return (
      <div className={applyTheme.page()}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className={applyTheme.page()}>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Feedback</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">New Feedback</p>
                <p className="text-2xl font-bold text-blue-400">{stats.new}</p>
              </div>
              <Badge className="bg-blue-600 text-white">New</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.average_rating.toFixed(1)}
                </p>
              </div>
              <div className="flex">
                {renderStars(Math.round(stats.average_rating))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Response Rate</p>
                <p className="text-2xl font-bold text-green-400">{stats.response_rate.toFixed(0)}%</p>
              </div>
              <Reply className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className={applyTheme.card()}>
        <CardContent className={applyTheme.cardContent()}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search feedback by user, content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Feedback List */}
      <div className="space-y-4 mt-6">
        {filteredFeedback.map((feedback) => (
          <Card key={feedback.id} className={applyTheme.card()}>
            <CardHeader className={applyTheme.cardHeader()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-palette-primary rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={applyTheme.text('primary')}>
                      {feedback.user || 'Anonymous'}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex">
                        {renderStars(feedback.rating)}
                      </div>
                      <span className={`text-sm ${applyTheme.text('secondary')}`}>
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getStatusColor(feedback.status)} text-white`}>
                    {getStatusText(feedback.status)}
                  </Badge>
                  <div className="flex space-x-1">
                    {feedback.status === 'new' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-slate-600 hover:text-palette-primary hover:bg-palette-accent-3"
                        onClick={() => handleUpdateStatus(feedback.id, 'reviewed')}
                        title="Mark as Reviewed"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {feedback.status !== 'responded' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-slate-600 hover:text-palette-primary hover:bg-palette-accent-3"
                        onClick={() => handleUpdateStatus(feedback.id, 'responded')}
                        title="Mark as Responded"
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(feedback.id)}
                      title="Delete Feedback"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className={`${applyTheme.cardContent()} space-y-4`}>
              {feedback.great_work && (
                <div>
                  <h4 className={`text-sm font-semibold ${applyTheme.status('success')} mb-2 flex items-center`}>
                    <span className={`w-2 h-2 ${applyTheme.status('success')} rounded-full mr-2`}></span>
                    What did we do great?
                  </h4>
                  <p className={`${applyTheme.text('secondary')} text-sm bg-slate-50 p-3 rounded-lg`}>
                    {feedback.great_work}
                  </p>
                </div>
              )}

              {feedback.could_be_better && (
                <div>
                  <h4 className={`text-sm font-semibold ${applyTheme.status('info')} mb-2 flex items-center`}>
                    <span className={`w-2 h-2 ${applyTheme.status('info')} rounded-full mr-2`}></span>
                    What could be better?
                  </h4>
                  <p className={`${applyTheme.text('secondary')} text-sm bg-slate-50 p-3 rounded-lg`}>
                    {feedback.could_be_better}
                  </p>
                </div>
              )}

              {feedback.remove_and_relish && (
                <div>
                  <h4 className={`text-sm font-semibold ${applyTheme.status('error')} mb-2 flex items-center`}>
                    <span className={`w-2 h-2 ${applyTheme.status('error')} rounded-full mr-2`}></span>
                    What should we remove and relish?
                  </h4>
                  <p className={`${applyTheme.text('secondary')} text-sm bg-slate-50 p-3 rounded-lg`}>
                    {feedback.remove_and_relish}
                  </p>
                </div>
              )}

              {feedback.admin_notes && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">Admin Notes</h4>
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                    {feedback.admin_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && filteredFeedback.length === 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No feedback found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
