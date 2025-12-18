"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { fetchBlogPostBySlug, incrementViewCount, fetchRecentPosts, type BlogPost } from '@/lib/api/blog';
import { format } from 'date-fns';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    try {
      const postData = await fetchBlogPostBySlug(slug);
      setPost(postData);
      
      // Increment view count
      try {
        await incrementViewCount(postData.id);
      } catch (error) {
        // Ignore view count errors
      }
      
      // Load related posts (same category)
      if (postData.category) {
        try {
          const related = await fetchRecentPosts(3);
          setRelatedPosts(related.filter(p => p.id !== postData.id && p.category?.id === postData.category?.id).slice(0, 3));
        } catch (error) {
          // Ignore related posts errors
        }
      }
    } catch (error) {
      console.error('Error loading post:', error);
      router.push('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Post not found</h2>
          <Button onClick={() => router.push('/blog')}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.push('/blog')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>

        {/* Post Header */}
        <article className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          {/* Category and Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {post.category && (
              <Link href={`/blog?category=${post.category.slug}`}>
                <Badge variant="outline" className="hover:bg-accent">
                  {post.category.name}
                </Badge>
              </Link>
            )}
            {post.tags.map((tag) => (
              <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                <Badge key={tag.id} variant="secondary" className="hover:bg-accent">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>

          {/* Meta Information */}
          <div className="flex items-center gap-6 text-muted-foreground mb-6 pb-6 border-b">
            <div className="flex items-center gap-2">
              {post.author.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt={post.author.full_name || post.author.username}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
              <span>{post.author.full_name || post.author.username}</span>
            </div>
            {post.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{format(new Date(post.published_at), 'MMMM d, yyyy')}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{post.read_time} min read</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.featured_image_url}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-8 font-medium">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Footer */}
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {post.views_count} views
                </span>
              </div>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Post
              </Button>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <Link href={`/blog/${relatedPost.slug}`}>
                      {relatedPost.featured_image_url && (
                        <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                          <Image
                            src={relatedPost.featured_image_url}
                            alt={relatedPost.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <h3 className="text-lg font-semibold mb-2 hover:text-palette-primary">
                        {relatedPost.title}
                      </h3>
                      {relatedPost.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      )}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          margin-top: 2em;
          margin-bottom: 1em;
          font-weight: 600;
        }
        .blog-content h1 { font-size: 2.5em; }
        .blog-content h2 { font-size: 2em; }
        .blog-content h3 { font-size: 1.75em; }
        .blog-content h4 { font-size: 1.5em; }
        .blog-content p {
          margin-bottom: 1.5em;
          line-height: 1.8;
        }
        .blog-content ul,
        .blog-content ol {
          margin-bottom: 1.5em;
          padding-left: 2em;
        }
        .blog-content li {
          margin-bottom: 0.5em;
        }
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 2em 0;
        }
        .blog-content a {
          color: var(--palette-primary);
          text-decoration: underline;
        }
        .blog-content blockquote {
          border-left: 4px solid var(--palette-primary);
          padding-left: 1em;
          margin: 2em 0;
          font-style: italic;
          color: #666;
        }
        .blog-content code {
          background: #f4f4f4;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .blog-content pre {
          background: #f4f4f4;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 2em 0;
        }
        .blog-content pre code {
          background: none;
          padding: 0;
        }
      `}</style>
    </div>
  );
}

