"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { BlogRichTextEditor } from '@/components/blog-rich-text-editor';
import { fetchBlogPost, updateBlogPost, fetchCategories, fetchTags, type Category, type Tag } from '@/lib/api/blog';
import { useDebounce } from '@/hooks/use-debounce';
import { slugify } from '@/lib/utils';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: null as number | null,
    status: 'draft' as 'draft' | 'published' | 'archived',
    featured: false,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    language: 'en',
  });

  useEffect(() => {
    loadPost();
    loadCategoriesAndTags();
  }, [postId]);

  // Auto-generate slug from title
  const debouncedTitle = useDebounce(formData.title, 300);
  useEffect(() => {
    if (debouncedTitle && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: slugify(debouncedTitle) }));
    }
  }, [debouncedTitle]);

  const loadPost = async () => {
    try {
      const post = await fetchBlogPost(postId);
      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content,
        category_id: post.category?.id || null,
        status: post.status,
        featured: post.featured,
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        meta_keywords: post.meta_keywords || '',
        language: post.language || 'en',
      });
      setSelectedTagIds(post.tags.map(t => t.id));
    } catch (error) {
      console.error('Error loading post:', error);
      alert('Failed to load post');
      router.push('/workspace/blogging');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesAndTags = async () => {
    try {
      const [cats, tagList] = await Promise.all([
        fetchCategories(),
        fetchTags(),
      ]);
      setCategories(cats);
      setTags(tagList);
    } catch (error) {
      console.error('Error loading categories/tags:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateBlogPost(postId, {
        ...formData,
        tag_ids: selectedTagIds,
      });
      router.push('/workspace/blogging');
    } catch (error: any) {
      console.error('Error updating post:', error);
      alert(error.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/workspace/blogging')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Blog Post</h1>
          <p className="text-muted-foreground mt-1">Update your blog post</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Title, slug, and excerpt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                  placeholder="post-url-slug"
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Short description of the post"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.excerpt.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content *</CardTitle>
              <CardDescription>Main blog post content</CardDescription>
            </CardHeader>
            <CardContent>
              <BlogRichTextEditor
                value={formData.content}
                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                placeholder="Write your blog post content here..."
              />
            </CardContent>
          </Card>

          {/* Categories and Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Categories & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id?.toString() || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value ? parseInt(value) : null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTagIds(prev => [...prev, tag.id]);
                          } else {
                            setSelectedTagIds(prev => prev.filter(id => id !== tag.id));
                          }
                        }}
                      />
                      <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer">
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured Post
                </Label>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optional SEO metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title (defaults to post title)"
                />
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO description"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div>
                <Label htmlFor="meta_keywords">Meta Keywords</Label>
                <Input
                  id="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push('/workspace/blogging')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.title || !formData.content}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

