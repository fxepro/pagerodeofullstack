import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  TrendingUp, 
  Zap, 
  Shield, 
  Globe,
  FileText,
  BarChart3
} from "lucide-react";

export const metadata: Metadata = {
  title: "PageRodeo Blog - Web Performance Insights & Optimization Tips",
  description: "Expert insights on web performance optimization, Core Web Vitals, SEO best practices, and website speed improvement strategies. Learn from performance testing experts.",
  keywords: "web performance, Core Web Vitals, SEO optimization, website speed, performance testing, PageSpeed Insights, Lighthouse, web optimization",
  authors: [{ name: "PageRodeo Team" }],
  openGraph: {
    title: "PageRodeo Blog - Web Performance Insights & Optimization Tips",
    description: "Expert insights on web performance optimization, Core Web Vitals, SEO best practices, and website speed improvement strategies.",
    type: "website",
    url: "https://pagerodeo.com/blog",
    siteName: "PageRodeo",
  },
  twitter: {
    card: "summary_large_image",
    title: "PageRodeo Blog - Web Performance Insights & Optimization Tips",
    description: "Expert insights on web performance optimization, Core Web Vitals, SEO best practices, and website speed improvement strategies.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Sample blog posts data
const blogPosts = [
  {
    id: 1,
    title: "Understanding Core Web Vitals: The Complete Guide to Web Performance Metrics",
    excerpt: "Learn everything about Core Web Vitals - LCP, FID, and CLS. Discover how these metrics impact your SEO rankings and user experience.",
    content: "Core Web Vitals are a set of specific factors that Google considers important in a webpage's overall user experience. These metrics measure real-world user experience for loading performance, interactivity, and visual stability...",
    author: "Sarah Johnson",
    date: "2024-01-15",
    readTime: "8 min read",
    category: "Performance",
    tags: ["Core Web Vitals", "SEO", "Performance", "Google"],
    featured: true,
    image: "/blog/core-web-vitals.jpg"
  },
  {
    id: 2,
    title: "10 Proven Strategies to Improve Your Website's Loading Speed",
    excerpt: "Discover actionable techniques to reduce your website's loading time and improve user experience. From image optimization to code splitting.",
    content: "Website speed is crucial for user experience and SEO rankings. A slow website can lead to higher bounce rates and lower conversion rates. Here are 10 proven strategies to improve your website's loading speed...",
    author: "Mike Chen",
    date: "2024-01-12",
    readTime: "6 min read",
    category: "Optimization",
    tags: ["Speed", "Optimization", "Performance", "Tips"],
    featured: true,
    image: "/blog/website-speed.jpg"
  },
  {
    id: 3,
    title: "The Impact of Mobile Performance on SEO Rankings in 2024",
    excerpt: "Explore how mobile performance affects your search engine rankings and learn best practices for mobile optimization.",
    content: "Mobile performance has become increasingly important for SEO rankings. With Google's mobile-first indexing, your mobile site performance directly impacts your search visibility...",
    author: "Emily Rodriguez",
    date: "2024-01-10",
    readTime: "7 min read",
    category: "SEO",
    tags: ["Mobile", "SEO", "Rankings", "2024"],
    featured: false,
    image: "/blog/mobile-seo.jpg"
  },
  {
    id: 4,
    title: "Lighthouse vs PageSpeed Insights: Which Tool Should You Use?",
    excerpt: "Compare Google's two main performance testing tools and understand when to use each for optimal results.",
    content: "Both Lighthouse and PageSpeed Insights are powerful tools for measuring web performance, but they serve different purposes. Understanding their differences can help you choose the right tool for your needs...",
    author: "David Kim",
    date: "2024-01-08",
    readTime: "5 min read",
    category: "Tools",
    tags: ["Lighthouse", "PageSpeed", "Tools", "Comparison"],
    featured: false,
    image: "/blog/lighthouse-vs-pagespeed.jpg"
  },
  {
    id: 5,
    title: "Image Optimization: The Complete Guide to Faster Loading Images",
    excerpt: "Learn advanced image optimization techniques including WebP, lazy loading, and responsive images to boost your site's performance.",
    content: "Images often account for the largest portion of a webpage's size. Proper image optimization can significantly improve your site's loading speed and user experience...",
    author: "Lisa Wang",
    date: "2024-01-05",
    readTime: "9 min read",
    category: "Optimization",
    tags: ["Images", "Optimization", "WebP", "Performance"],
    featured: false,
    image: "/blog/image-optimization.jpg"
  },
  {
    id: 6,
    title: "JavaScript Performance: How to Optimize Your Code for Better Speed",
    excerpt: "Discover JavaScript optimization techniques including code splitting, tree shaking, and bundle optimization for improved performance.",
    content: "JavaScript can significantly impact your website's performance. Large JavaScript bundles can slow down your site and affect user experience. Here's how to optimize your JavaScript code...",
    author: "Alex Thompson",
    date: "2024-01-03",
    readTime: "10 min read",
    category: "Development",
    tags: ["JavaScript", "Performance", "Code", "Optimization"],
    featured: false,
    image: "/blog/javascript-optimization.jpg"
  }
];

const categories = [
  { name: "Performance", count: 2, icon: TrendingUp },
  { name: "Optimization", count: 2, icon: Zap },
  { name: "SEO", count: 1, icon: BarChart3 },
  { name: "Tools", count: 1, icon: Shield },
  { name: "Development", count: 1, icon: Globe }
];

export default function BlogPage() {
  const featuredPosts = blogPosts.filter(post => post.featured);
  const recentPosts = blogPosts.filter(post => !post.featured).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-palette-primary to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              PageRodeo Blog
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              Expert insights on web performance optimization, Core Web Vitals, SEO best practices, and website speed improvement strategies.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <TrendingUp className="h-4 w-4 mr-1" />
                Performance Tips
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Zap className="h-4 w-4 mr-1" />
                Optimization
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <BarChart3 className="h-4 w-4 mr-1" />
                SEO Insights
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Shield className="h-4 w-4 mr-1" />
                Best Practices
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Posts */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center">
                <FileText className="h-8 w-8 mr-3 text-palette-primary" />
                Featured Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredPosts.map((post) => (
                  <Card key={post.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-palette-primary border-palette-accent-2">
                          {post.category}
                        </Badge>
                        <Badge variant="secondary" className="bg-palette-accent-3 text-palette-primary">
                          Featured
                        </Badge>
                      </div>
                      <CardTitle className="group-hover:text-palette-primary transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {post.author}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(post.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {post.readTime}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" className="group-hover:bg-palette-primary group-hover:text-white group-hover:border-palette-primary transition-all">
                        Read More
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Recent Posts */}
            <section>
              <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center">
                <TrendingUp className="h-8 w-8 mr-3 text-palette-primary" />
                Latest Articles
              </h2>
              <div className="space-y-6">
                {recentPosts.map((post) => (
                  <Card key={post.id} className="group hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-2/3 p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-palette-primary border-palette-accent-2">
                            {post.category}
                          </Badge>
                        </div>
                        <CardTitle className="group-hover:text-palette-primary transition-colors mb-2">
                          {post.title}
                        </CardTitle>
                        <CardDescription className="text-slate-600 mb-4">
                          {post.excerpt}
                        </CardDescription>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {post.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(post.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {post.readTime}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="group-hover:bg-palette-primary group-hover:text-white group-hover:border-palette-primary transition-all">
                            Read More
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                      <div className="md:w-1/3 p-6 flex items-center justify-center bg-slate-50">
                        <div className="w-full h-32 bg-gradient-to-br from-palette-accent-3 to-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-12 w-12 text-palette-accent-2" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Link
                        key={category.name}
                        href={`/blog/category/${category.name.toLowerCase()}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-palette-primary" />
                          <span className="text-sm group-hover:text-palette-primary transition-colors">
                            {category.name}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Newsletter Signup */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stay Updated</CardTitle>
                  <CardDescription>
                    Get the latest performance tips and insights delivered to your inbox.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-palette-primary"
                    />
                    <Button className="w-full bg-palette-primary hover:bg-palette-primary-hover">
                      Subscribe
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Popular Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Popular Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {["Performance", "SEO", "Optimization", "Core Web Vitals", "Lighthouse", "Speed", "Mobile", "JavaScript"].map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs hover:bg-palette-accent-3 hover:border-palette-accent-2 cursor-pointer">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
