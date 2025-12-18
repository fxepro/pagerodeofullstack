"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, Send, Heart, ThumbsUp, AlertTriangle } from "lucide-react";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export default function FeedbackMain() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [greatWork, setGreatWork] = useState("");
  const [couldBeBetter, setCouldBeBetter] = useState("");
  const [removeAndRelish, setRemoveAndRelish] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting feedback.",
        variant: "destructive",
      });
      return;
    }

    if (!greatWork && !couldBeBetter && !removeAndRelish) {
      toast({
        title: "Feedback Required",
        description: "Please provide at least one piece of feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to Django backend
      const response = await fetch(`${API_BASE}/api/feedback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          greatWork,
          couldBeBetter,
          removeAndRelish
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Thank You!",
          description: "Your feedback has been submitted successfully. We appreciate your input!",
        });

        // Reset form
        setRating(0);
        setGreatWork("");
        setCouldBeBetter("");
        setRemoveAndRelish("");
      } else {
        throw new Error(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isFilled = starNumber <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className="focus:outline-none focus:ring-2 focus:ring-palette-primary focus:ring-offset-2 rounded-full p-1"
          onClick={() => setRating(starNumber)}
          onMouseEnter={() => setHoveredRating(starNumber)}
          onMouseLeave={() => setHoveredRating(0)}
        >
            <Star
              className={`h-12 w-12 transition-all duration-200 ${
                isFilled
                  ? "text-palette-accent-1 fill-current"
                  : "text-gray-300 hover:text-palette-accent-2"
              }`}
            />
        </button>
      );
    });
  };

  const getRatingText = () => {
    if (rating === 0) return "Rate your experience";
    if (rating === 1) return "Poor";
    if (rating === 2) return "Fair";
    if (rating === 3) return "Good";
    if (rating === 4) return "Very Good";
    if (rating === 5) return "Excellent";
    return "";
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-palette-primary via-palette-primary to-palette-secondary overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-2000"></div>
          <div className="absolute bottom-32 right-1/3 w-8 h-8 bg-white/5 rounded-full animate-pulse delay-3000"></div>
        </div>
        
        <div className="relative z-10 container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Share Your
            <span className="block bg-gradient-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent">
              Feedback
            </span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Help us improve PageRodeo by sharing your thoughts, suggestions, and experiences
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-8 pt-12">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              How was your experience?
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Your feedback helps us make PageRodeo better for everyone
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Star Rating */}
              <div className="text-center">
                <div className="flex justify-center items-center space-x-2 mb-4">
                  {renderStars()}
                </div>
                <p className="text-xl font-semibold text-gray-700">
                  {getRatingText()}
                </p>
              </div>

              {/* Feedback Sections */}
              <div className="space-y-6">
                {/* Great Work */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      What did we do great?
                    </h3>
                  </div>
                  <Textarea
                    placeholder="Tell us what you loved about PageRodeo. What features worked well? What exceeded your expectations?"
                    value={greatWork}
                    onChange={(e) => setGreatWork(e.target.value)}
                    className="min-h-[100px] resize-none border-gray-200 focus:border-palette-accent-1 focus:ring-palette-primary"
                  />
                </div>

                {/* Could Be Better */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      What could be better?
                    </h3>
                  </div>
                  <Textarea
                    placeholder="Share suggestions for improvement. What features need work? What would make your experience smoother?"
                    value={couldBeBetter}
                    onChange={(e) => setCouldBeBetter(e.target.value)}
                    className="min-h-[100px] resize-none border-gray-200 focus:border-palette-accent-1 focus:ring-palette-primary"
                  />
                </div>

                {/* Remove and Relish */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      What should we remove and relish?
                    </h3>
                  </div>
                  <Textarea
                    placeholder="What features are frustrating or unnecessary? What should we completely remove or redesign?"
                    value={removeAndRelish}
                    onChange={(e) => setRemoveAndRelish(e.target.value)}
                    className="min-h-[100px] resize-none border-gray-200 focus:border-palette-accent-1 focus:ring-palette-primary"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6 pb-12">
                <Button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-palette-primary-hover hover:to-palette-secondary text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
