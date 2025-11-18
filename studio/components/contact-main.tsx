"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Globe,
  Users,
  Headphones
} from "lucide-react"

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export function ContactMain() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Send to Django backend
      const response = await fetch(`${API_BASE}/api/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Message Sent!",
          description: "Thank you for contacting us. We'll get back to you within 24 hours.",
        })
        
        // Reset form
        setFormData({ name: "", email: "", subject: "", message: "" })
      } else {
        throw new Error(result.error || 'Failed to send message')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-palette-accent-2 via-palette-accent-1 to-palette-primary">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-35">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-palette-primary-hover rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-800 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-palette-primary rounded-full mix-blend-multiply filter blur-2xl opacity-55 animate-pulse animation-delay-4000"></div>
          </div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-8">
            <Badge variant="outline" className="border-white/40 text-white bg-white/15 backdrop-blur-sm px-6 py-2 text-sm font-medium shadow-lg">
              <MessageSquare className="h-4 w-4 mr-2" />
              Get in Touch
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contact Us
          </h1>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            Have questions about our services? Need help with your website performance? 
            We're here to help you succeed.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          
          {/* Contact Form & Info */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Contact Form */}
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Send className="h-5 w-5 text-palette-primary" />
                  Send us a Message
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Fill out the form below and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                        className="border-palette-accent-2 focus:border-palette-accent-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        required
                        className="border-palette-accent-2 focus:border-palette-accent-2"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What's this about?"
                      required
                      className="border-palette-accent-2 focus:border-palette-accent-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      required
                      className="border-palette-accent-2 focus:border-palette-accent-2"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="border-palette-accent-2/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-palette-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-palette-accent-3 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-palette-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Email</h4>
                      <p className="text-slate-600">contact@pagerodeo.com</p>
                      <p className="text-sm text-slate-500">We respond within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-palette-accent-3 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-palette-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Business Hours</h4>
                      <p className="text-slate-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-slate-600">Saturday: 10:00 AM - 4:00 PM</p>
                      <p className="text-sm text-slate-500">EST Time Zone</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-palette-accent-3 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-palette-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Support</h4>
                      <p className="text-slate-600">24/7 Technical Support</p>
                      <p className="text-slate-600">Priority Support for Enterprise</p>
                      <p className="text-sm text-slate-500">Available via email and chat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200/50 shadow-lg bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Why Choose PageRodeo?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-green-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Expert performance optimization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>AI-powered insights and recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Comprehensive monitoring solutions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>24/7 technical support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Enterprise-grade security</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-palette-primary" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription className="text-slate-600">
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">How quickly do you respond?</h4>
                    <p className="text-slate-600 text-sm">We typically respond to all inquiries within 24 hours during business days.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Do you offer free consultations?</h4>
                    <p className="text-slate-600 text-sm">Yes! We offer free initial consultations to discuss your specific needs and how we can help.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">What services do you provide?</h4>
                    <p className="text-slate-600 text-sm">We offer website performance testing, monitoring, SSL checks, sitemap generation, and AI-powered analysis.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Do you work with small businesses?</h4>
                    <p className="text-slate-600 text-sm">Absolutely! We work with businesses of all sizes, from startups to enterprise companies.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Can you help with existing websites?</h4>
                    <p className="text-slate-600 text-sm">Yes, we can analyze and optimize existing websites to improve their performance and user experience.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">What's your pricing model?</h4>
                    <p className="text-slate-600 text-sm">We offer flexible pricing plans. Contact us for a customized quote based on your specific needs.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
