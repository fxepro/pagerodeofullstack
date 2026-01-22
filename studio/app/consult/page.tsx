"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MessageCircle, 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  Shield, 
  CheckCircle,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Gauge,
  Eye,
  Download,
  Zap,
  Server,
  AlertTriangle,
  Cpu,
  Database,
  Settings,
  Star,
  Users,
  Award,
  FileText,
  Upload,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Search
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { SimpleHeroSection } from "@/components/simple-hero-section";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export default function ConsultPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    service: "",
    budget: "",
    timeline: "",
    priority: "",
    message: "",
    files: [] as File[],
    issues: [] as string[],
    currentTools: "",
    goals: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const handleIssueToggle = (issue: string) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.includes(issue)
        ? prev.issues.filter(i => i !== issue)
        : [...prev.issues, issue]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Send to Django backend
      const response = await fetch(`${API_BASE}/api/consultation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Consultation Request Submitted",
          description: "We'll get back to you within 24 hours with next steps.",
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          company: "",
          phone: "",
          service: "",
          budget: "",
          timeline: "",
          priority: "",
          message: "",
          files: [],
          issues: [],
          currentTools: "",
          goals: ""
        });
      } else {
        throw new Error(result.error || 'Failed to submit consultation request');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit consultation request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <SimpleHeroSection
        title="Get Expert Performance Help"
        subtitle="Professional website performance analysis and optimization services. Let our experts help you understand, decipher, and improve your website performance."
        gradientFrom="from-palette-primary"
        gradientVia="via-palette-primary"
        gradientTo="to-palette-secondary"
      />

      {/* Service Offerings */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Service Offerings
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive performance analysis and optimization services tailored to your needs
            </p>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Performance Analysis */}
            <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-white to-slate-50 transition-all duration-500 transform hover:-translate-y-2" style={{ boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-accent-1/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-accent-1 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Performance Analysis</h3>
                  <p className="text-slate-600 mb-4">
                    Comprehensive review and interpretation of your website's performance data to identify key bottlenecks and optimization opportunities.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-1" />
                    Review and interpret performance reports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-1" />
                    Identify key bottlenecks and issues
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-1" />
                    Provide actionable recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-1" />
                    Create improvement roadmap
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Optimization Strategy */}
            <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-white to-slate-50 transition-all duration-500 transform hover:-translate-y-2" style={{ boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-2/5 to-palette-accent-2/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-2 to-palette-accent-2 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Optimization Strategy</h3>
                  <p className="text-slate-600 mb-4">
                    Custom improvement recommendations with detailed implementation plans, resource requirements, and success metrics.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-2" />
                    Custom improvement recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-2" />
                    Implementation timeline
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-2" />
                    Resource requirements
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-2" />
                    Success metrics definition
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Technical Consultation */}
            <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-white to-slate-50 transition-all duration-500 transform hover:-translate-y-2" style={{ boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Cpu className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Technical Consultation</h3>
                  <p className="text-slate-600 mb-4">
                    Deep-dive technical analysis including code review, architecture recommendations, and tool selection guidance.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-1" />
                    Deep-dive technical issues
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-1" />
                    Code review and optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-1" />
                    Architecture recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-1" />
                    Tool selection guidance
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Training Sessions */}
            <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-white to-slate-50 transition-all duration-500 transform hover:-translate-y-2" style={{ boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-3/5 to-palette-accent-2/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-3 to-palette-accent-2 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BookOpen className="h-8 w-8 text-palette-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Training Sessions</h3>
                  <p className="text-slate-600 mb-4">
                    Comprehensive training programs to teach your team performance optimization best practices and hands-on techniques.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-3" />
                    Teach teams how to use performance tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-3" />
                    Best practices workshops
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-3" />
                    Hands-on optimization training
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-accent-3" />
                    Ongoing support and mentoring
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Ongoing Support */}
            <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-white to-slate-50 transition-all duration-500 transform hover:-translate-y-2" style={{ boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Ongoing Support</h3>
                  <p className="text-slate-600 mb-4">
                    Continuous performance monitoring and support with regular check-ins, implementation assistance, and progress tracking.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-red-500" />
                    Monthly performance monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-red-500" />
                    Regular check-ins and advice
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-red-500" />
                    Implementation assistance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-red-500" />
                    Progress tracking and reporting
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Performance Audit */}
            <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-white to-slate-50 transition-all duration-500 transform hover:-translate-y-2" style={{ boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-palette-secondary/5 to-palette-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-secondary to-palette-secondary-hover flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Performance Audit</h3>
                  <p className="text-slate-600 mb-4">
                    Comprehensive website health assessment combining analysis, strategy, and technical review for complete performance optimization.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-secondary" />
                    Complete website health assessment
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-secondary" />
                    Multi-tool performance analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-secondary" />
                    Comprehensive optimization roadmap
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-palette-secondary" />
                    Priority-based action plan
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Consultation Form */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Request Your Consultation
            </h2>
            <p className="text-xl text-gray-600">
              Tell us about your performance challenges and we'll help you solve them
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Consultation Form */}
            <div>
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Consultation Request Form</CardTitle>
                  <CardDescription className="text-center">
                    Fill out the form below and we'll get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <Label htmlFor="service">Service Needed *</Label>
                  <Select value={formData.service} onValueChange={(value) => handleInputChange("service", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance-analysis">Performance Analysis</SelectItem>
                      <SelectItem value="optimization-strategy">Optimization Strategy</SelectItem>
                      <SelectItem value="technical-consultation">Technical Consultation</SelectItem>
                      <SelectItem value="training-sessions">Training Sessions</SelectItem>
                      <SelectItem value="ongoing-support">Ongoing Support</SelectItem>
                      <SelectItem value="performance-audit">Performance Audit</SelectItem>
                      <SelectItem value="custom">Custom Package</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget and Timeline */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="budget">Budget Range</Label>
                    <Select value={formData.budget} onValueChange={(value) => handleInputChange("budget", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                        <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                        <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                        <SelectItem value="10000+">$10,000+</SelectItem>
                        <SelectItem value="custom">Custom pricing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeline">Timeline</Label>
                    <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate (ASAP)</SelectItem>
                        <SelectItem value="1week">1 week</SelectItem>
                        <SelectItem value="2-4weeks">2-4 weeks</SelectItem>
                        <SelectItem value="1-3months">1-3 months</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Priority Level */}
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select priority level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent (within 24 hours)</SelectItem>
                      <SelectItem value="high">High (within 1 week)</SelectItem>
                      <SelectItem value="medium">Medium (within 1 month)</SelectItem>
                      <SelectItem value="low">Low (flexible timeline)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Performance Issues */}
                <div>
                  <Label>Performance Issues (Select all that apply)</Label>
                  <div className="grid md:grid-cols-2 gap-3 mt-3">
                    {[
                      "Core Web Vitals problems",
                      "Loading speed issues",
                      "Mobile performance",
                      "SEO performance",
                      "Security concerns",
                      "Accessibility issues"
                    ].map((issue) => (
                      <div key={issue} className="flex items-center space-x-2">
                        <Checkbox
                          id={issue}
                          checked={formData.issues.includes(issue)}
                          onCheckedChange={() => handleIssueToggle(issue)}
                        />
                        <Label htmlFor={issue} className="text-sm">{issue}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals and Current Tools */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="goals">What are your main goals?</Label>
                    <Textarea
                      id="goals"
                      value={formData.goals}
                      onChange={(e) => handleInputChange("goals", e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentTools">Current tools being used</Label>
                    <Textarea
                      id="currentTools"
                      value={formData.currentTools}
                      onChange={(e) => handleInputChange("currentTools", e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message">Additional Details *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    required
                    className="mt-1"
                    rows={4}
                    placeholder="Describe your performance challenges, what you've tried, and what you hope to achieve..."
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label htmlFor="files">Upload Performance Reports (Optional)</Label>
                  <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop files here, or click to select
                    </p>
                    <Input
                      id="files"
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.csv,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('files')?.click()}
                    >
                      Choose Files
                    </Button>
                    {formData.files.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Selected files:</p>
                        {formData.files.map((file, index) => (
                          <p key={index} className="text-xs text-gray-500">{file.name}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white px-8 py-3 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Submit Consultation Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
                </CardContent>
              </Card>
            </div>

            {/* Calendar Booking */}
            <div>
              <Card className="shadow-xl sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-palette-primary" />
                    Book Appointment
                  </CardTitle>
                  <CardDescription>
                    Schedule a consultation call at your convenience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-br from-palette-accent-3 to-palette-accent-3 rounded-lg">
                      <Calendar className="h-12 w-12 text-palette-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Your Call</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose a time that works best for you. We'll send you a calendar invite with meeting details.
                      </p>
                      <Button className="w-full bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white">
                        <Calendar className="h-4 w-4 mr-2" />
                        Open Calendar
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Available Times</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>Monday - Friday</span>
                          <span className="text-palette-primary font-medium">9 AM - 6 PM</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>Saturday</span>
                          <span className="text-palette-primary font-medium">10 AM - 4 PM</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>Sunday</span>
                          <span className="text-gray-400">Closed</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-3">Meeting Options</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          <span>Phone Call</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-blue-600" />
                          <span>Video Conference</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-palette-primary" />
                          <span>In-Person (Local)</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">Quick Contact</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>(555) 123-4567</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>consult@pagerodeo.com</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600">
              Success stories from our performance optimization clients
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                company: "TechStart Inc.",
                rating: 5,
                text: "The performance analysis was incredibly detailed and actionable. Our site speed improved by 40% in just 2 weeks following their recommendations.",
                improvement: "40% faster load times"
              },
              {
                name: "Mike Chen",
                company: "E-commerce Plus",
                rating: 5,
                text: "Professional, knowledgeable, and delivered exactly what they promised. The implementation plan was clear and easy to follow.",
                improvement: "60% better Core Web Vitals"
              },
              {
                name: "Emily Rodriguez",
                company: "Digital Agency",
                rating: 5,
                text: "Outstanding service! They helped us understand complex performance issues and provided solutions that actually worked.",
                improvement: "50% reduction in bounce rate"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.company}</p>
                    <Badge variant="outline" className="mt-2 text-green-600 border-green-200">
                      {testimonial.improvement}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Common questions about our consulting services
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                question: "How quickly will I receive my consultation?",
                answer: "We respond to all consultation requests within 24 hours. For urgent requests, we can often provide initial feedback within 4-6 hours during business hours."
              },
              {
                question: "What information do I need to provide?",
                answer: "The more information you can provide about your current performance issues, the better we can help. This includes performance reports, website URLs, current tools you're using, and specific goals you want to achieve."
              },
              {
                question: "Do you work with all types of websites?",
                answer: "Yes! We work with websites of all sizes and types - from small business sites to large e-commerce platforms. Our expertise covers WordPress, React, Vue, Angular, and custom-built applications."
              },
              {
                question: "What if I'm not satisfied with the consultation?",
                answer: "We offer a 100% satisfaction guarantee. If you're not completely satisfied with our analysis and recommendations, we'll provide a full refund or additional consultation at no extra cost."
              },
              {
                question: "Can you help with ongoing performance monitoring?",
                answer: "Absolutely! We offer ongoing support packages that include regular performance monitoring, monthly reports, and continuous optimization recommendations to keep your site performing at its best."
              },
              {
                question: "What's included in a Performance Audit?",
                answer: "Our Performance Audit is a comprehensive assessment that includes multi-tool analysis, complete website health evaluation, detailed optimization roadmap, and priority-based action plan. It's perfect for getting a complete picture of your site's performance."
              },
              {
                question: "Do you provide training for my development team?",
                answer: "Yes! We offer comprehensive training sessions including hands-on workshops, best practices training, tool usage guidance, and ongoing mentoring. We can train your team on performance optimization techniques and tools."
              },
              {
                question: "How much does a consultation cost?",
                answer: "Our consultation pricing varies based on the scope and complexity of your needs. We offer flexible packages from basic analysis to comprehensive audits. Contact us for a custom quote based on your specific requirements."
              },
              {
                question: "Can you help with mobile performance issues?",
                answer: "Absolutely! Mobile performance is a critical part of our analysis. We specialize in Core Web Vitals, mobile-first optimization, responsive design performance, and mobile-specific loading issues."
              },
              {
                question: "What tools do you use for performance analysis?",
                answer: "We use a comprehensive suite of tools including Google PageSpeed Insights, Lighthouse, GTmetrix, WebPageTest, Chrome DevTools, and custom monitoring solutions. We also integrate with your existing analytics and monitoring tools."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Improve Your Website Performance?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get expert analysis and actionable recommendations to boost your site's performance and user experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
              <MessageCircle className="h-5 w-5 mr-2" />
              Start Free Consultation
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Phone className="h-5 w-5 mr-2" />
              Call Us: (555) 123-4567
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
