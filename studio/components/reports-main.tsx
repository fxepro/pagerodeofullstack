"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  FileText,
  Eye,
  Filter,
  RefreshCw
} from "lucide-react";

export function ReportsMain() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const mockReports = [
    {
      id: 1,
      title: "Performance Analysis Report",
      type: "Performance",
      date: "2024-01-15",
      status: "completed",
      description: "Comprehensive performance analysis for example.com",
      metrics: {
        score: 85,
        tests: 12,
        issues: 3
      }
    },
    {
      id: 2,
      title: "SEO Audit Report",
      type: "SEO",
      date: "2024-01-14",
      status: "completed",
      description: "Search engine optimization analysis",
      metrics: {
        score: 92,
        tests: 8,
        issues: 1
      }
    },
    {
      id: 3,
      title: "Security Assessment",
      type: "Security",
      date: "2024-01-13",
      status: "completed",
      description: "Website security vulnerability assessment",
      metrics: {
        score: 78,
        tests: 15,
        issues: 5
      }
    },
    {
      id: 4,
      title: "Accessibility Report",
      type: "Accessibility",
      date: "2024-01-12",
      status: "completed",
      description: "WCAG compliance and accessibility analysis",
      metrics: {
        score: 88,
        tests: 10,
        issues: 2
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Performance":
        return "bg-blue-100 text-blue-800";
      case "SEO":
        return "bg-green-100 text-green-800";
      case "Security":
        return "bg-red-100 text-red-800";
      case "Accessibility":
        return "bg-palette-accent-3 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-palette-accent-3 to-palette-accent-3/80 backdrop-blur-sm border-b border-palette-accent-2/50 text-slate-800 p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Reports</h1>
              <p className="text-slate-600">
                View and download your website analysis reports
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Reports</p>
                  <p className="text-2xl font-bold text-slate-800">{mockReports.length}</p>
                </div>
                <div className="w-12 h-12 bg-palette-primary rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">This Month</p>
                  <p className="text-2xl font-bold text-slate-800">4</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Score</p>
                  <p className="text-2xl font-bold text-slate-800">86</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Issues Found</p>
                  <p className="text-2xl font-bold text-slate-800">11</p>
                </div>
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card className="bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-palette-primary" />
              Recent Reports
            </CardTitle>
            <CardDescription className="text-slate-600">
              Your latest website analysis reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800">{report.title}</h3>
                      <Badge className={getTypeColor(report.type)}>
                        {report.type}
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {report.date}
                      </span>
                      <span>Score: {report.metrics.score}/100</span>
                      <span>Tests: {report.metrics.tests}</span>
                      <span>Issues: {report.metrics.issues}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" className="bg-palette-primary hover:bg-palette-primary-hover text-white">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ReportsMain;
