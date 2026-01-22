"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, User, Clock, ArrowRight } from 'lucide-react';
import { fetchFeaturedPosts, fetchRecentPosts, fetchCategories, fetchTags, type BlogPost, type Category, type Tag } from '@/lib/api/blog';
import { format } from 'date-fns';
import { SimpleHeroSection } from '@/components/simple-hero-section';

export default function BlogPage() {
  const router = useRouter();
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        fetchFeaturedPosts(),
        fetchRecentPosts(10),
        fetchCategories(),
        fetchTags(),
      ]);
      
      // Handle featured posts
      if (results[0].status === 'fulfilled') {
        setFeaturedPosts(results[0].value);
      } else {
        console.error('Error loading featured posts:', results[0].reason);
        setFeaturedPosts([]);
      }
      
      // Handle recent posts
      if (results[1].status === 'fulfilled') {
        setRecentPosts(results[1].value);
      } else {
        console.error('Error loading recent posts:', results[1].reason);
        setRecentPosts([]);
      }
      
      // Handle categories
      if (results[2].status === 'fulfilled') {
        setCategories(results[2].value);
      } else {
        console.error('Error loading categories:', results[2].reason);
        setCategories([]);
      }
      
      // Handle tags
      if (results[3].status === 'fulfilled') {
        setTags(results[3].value);
      } else {
        console.error('Error loading tags:', results[3].reason);
        setTags([]);
      }
    } catch (error) {
      console.error('Error loading blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/blog?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <SimpleHeroSection
        title="Blog"
        subtitle="Insights, tips, and updates about website performance, SEO, and digital marketing"
        gradientFrom="from-palette-primary"
        gradientVia="via-palette-primary"
        gradientTo="to-palette-secondary"
      />
      <div className="container mx-auto px-4 py-12 max-w-7xl">

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Featured Posts</h2>
                <div className="space-y-6">
                  {featuredPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <Link href={`/blog/${post.slug}`}>
                          <div className="flex gap-6">
                            {post.featured_image_url && (
                              <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                                <Image
                                  src={post.featured_image_url}
                                  alt={post.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {post.category && (
                                  <Badge variant="outline">{post.category.name}</Badge>
                                )}
                                <Badge>Featured</Badge>
                              </div>
                              <h3 className="text-xl font-semibold mb-2 hover:text-palette-primary">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="text-muted-foreground mb-4 line-clamp-2">
                                  {post.excerpt}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {post.author.full_name || post.author.username}
                                </span>
                                {post.published_at && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(post.published_at), 'MMM d, yyyy')}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {post.read_time} min read
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Posts */}
            {recentPosts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Recent Posts</h2>
                <div className="space-y-6">
                  {recentPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <Link href={`/blog/${post.slug}`}>
                          <div className="flex gap-6">
                            {post.featured_image_url && (
                              <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                                <Image
                                  src={post.featured_image_url}
                                  alt={post.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {post.category && (
                                  <Badge variant="outline">{post.category.name}</Badge>
                                )}
                              </div>
                              <h3 className="text-xl font-semibold mb-2 hover:text-palette-primary">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="text-muted-foreground mb-4 line-clamp-2">
                                  {post.excerpt}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {post.author.full_name || post.author.username}
                                </span>
                                {post.published_at && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(post.published_at), 'MMM d, yyyy')}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {post.read_time} min read
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {featuredPosts.length === 0 && recentPosts.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No blog posts available yet.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            {categories.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/blog?category=${category.slug}`}
                        className="flex items-center justify-between p-2 rounded hover:bg-accent transition-colors"
                      >
                        <span>{category.name}</span>
                        <Badge variant="secondary">{category.post_count}</Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/blog?tag=${tag.slug}`}
                        className="inline-block"
                      >
                        <Badge variant="outline" className="hover:bg-accent">
                          {tag.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
