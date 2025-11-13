"use client";
import React, { useState } from "react";
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
  User
} from "lucide-react";
import { applyTheme, LAYOUT } from "@/lib/theme";

export default function AdminFeedbackPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("all");

  // Sample feedback data - replace with real API calls
  const feedbackData = [
    {
      id: 1,
      user: "john.doe@example.com",
      rating: 5,
      greatWork: "The performance analysis is incredibly detailed and the AI insights are spot on. The visual waterfalls help me understand exactly where the bottlenecks are.",
      couldBeBetter: "Would love to see more historical data comparison features.",
      removeAndRelish: "The old loading animation was a bit distracting, glad it's been updated.",
      submittedAt: "2024-01-15T10:30:00Z",
      status: "new"
    },
    {
      id: 2,
      user: "sarah.wilson@company.com",
      rating: 4,
      greatWork: "The sitemap generator works perfectly and the export feature is very useful for our SEO team.",
      couldBeBetter: "Sometimes the crawling takes a bit long for large sites. Maybe add a progress indicator?",
      removeAndRelish: "The previous interface was confusing, the new design is much cleaner.",
      submittedAt: "2024-01-14T15:45:00Z",
      status: "reviewed"
    },
    {
      id: 3,
      user: "mike.chen@startup.io",
      rating: 3,
      greatWork: "The SSL checker provides comprehensive information about certificate details.",
      couldBeBetter: "The results could be more actionable. Maybe add specific recommendations for improvement?",
      removeAndRelish: "The old color scheme was hard to read, the new dark theme is much better.",
      submittedAt: "2024-01-13T09:20:00Z",
      status: "new"
    },
    {
      id: 4,
      user: "emma.brown@agency.com",
      rating: 5,
      greatWork: "The AI health monitoring is revolutionary! Being able to track AI model performance in real-time is exactly what we needed.",
      couldBeBetter: "Could you add more detailed cost breakdowns for different AI providers?",
      removeAndRelish: "The previous feedback system was hard to find, the new dedicated page is perfect.",
      submittedAt: "2024-01-12T14:15:00Z",
      status: "responded"
    }
  ];

  const filteredFeedback = feedbackData.filter(feedback => {
    const matchesSearch = feedback.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.greatWork.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.couldBeBetter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.removeAndRelish.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      default: return "bg-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "New";
      case "reviewed": return "Reviewed";
      case "responded": return "Responded";
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

  return (
    <div className={applyTheme.page()}>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Feedback</p>
                <p className="text-2xl font-bold text-slate-800">{feedbackData.length}</p>
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
                <p className="text-2xl font-bold text-blue-400">
                  {feedbackData.filter(f => f.status === "new").length}
                </p>
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
                  {(feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length).toFixed(1)}
                </p>
              </div>
              <div className="flex">
                {renderStars(Math.round(feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Response Rate</p>
                <p className="text-2xl font-bold text-green-400">75%</p>
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
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.map((feedback) => (
          <Card key={feedback.id} className={applyTheme.card()}>
            <CardHeader className={applyTheme.cardHeader()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-palette-primary rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={applyTheme.text('primary')}>{feedback.user}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex">
                        {renderStars(feedback.rating)}
                      </div>
                      <span className={`text-sm ${applyTheme.text('secondary')}`}>
                        {new Date(feedback.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getStatusColor(feedback.status)} text-white`}>
                    {getStatusText(feedback.status)}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" className="text-slate-600 hover:text-palette-primary hover:bg-palette-accent-3">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-600 hover:text-palette-primary hover:bg-palette-accent-3">
                      <Reply className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className={`${applyTheme.cardContent()} space-y-4`}>
              {feedback.greatWork && (
                <div>
                  <h4 className={`text-sm font-semibold ${applyTheme.status('success')} mb-2 flex items-center`}>
                    <span className={`w-2 h-2 ${applyTheme.status('success')} rounded-full mr-2`}></span>
                    What did we do great?
                  </h4>
                  <p className={`${applyTheme.text('secondary')} text-sm bg-slate-50 p-3 rounded-lg`}>
                    {feedback.greatWork}
                  </p>
                </div>
              )}

              {feedback.couldBeBetter && (
                <div>
                  <h4 className={`text-sm font-semibold ${applyTheme.status('info')} mb-2 flex items-center`}>
                    <span className={`w-2 h-2 ${applyTheme.status('info')} rounded-full mr-2`}></span>
                    What could be better?
                  </h4>
                  <p className={`${applyTheme.text('secondary')} text-sm bg-slate-50 p-3 rounded-lg`}>
                    {feedback.couldBeBetter}
                  </p>
                </div>
              )}

              {feedback.removeAndRelish && (
                <div>
                  <h4 className={`text-sm font-semibold ${applyTheme.status('error')} mb-2 flex items-center`}>
                    <span className={`w-2 h-2 ${applyTheme.status('error')} rounded-full mr-2`}></span>
                    What should we remove and relish?
                  </h4>
                  <p className={`${applyTheme.text('secondary')} text-sm bg-slate-50 p-3 rounded-lg`}>
                    {feedback.removeAndRelish}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFeedback.length === 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No feedback found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
