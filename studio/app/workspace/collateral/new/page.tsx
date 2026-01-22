"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { CollateralRichTextEditor } from '@/components/collateral-rich-text-editor';
import { 
  fetchCollateralCategories, 
  fetchCollateralTags,
  createLearningMaterial,
  type CollateralCategory,
  type CollateralTag 
} from '@/lib/api/collateral';
import { slugify } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

export default function NewCollateralPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CollateralCategory[]>([]);
  const [tags, setTags] = useState<CollateralTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: null as number | null,
    content_type: 'documentation' as 'documentation' | 'tutorial' | 'video' | 'guide' | 'quick-start' | 'reference' | 'faq',
    status: 'draft' as 'draft' | 'published' | 'archived',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    language: 'en',
  });

  useEffect(() => {
    loadCategoriesAndTags();
  }, []);

  // Auto-generate slug from title
  const debouncedTitle = useDebounce(formData.title, 300);
  useEffect(() => {
    if (debouncedTitle && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: slugify(debouncedTitle) }));
    }
  }, [debouncedTitle]);

  const loadCategoriesAndTags = async () => {
    try {
      const [cats, tagList] = await Promise.all([
        fetchCollateralCategories(),
        fetchCollateralTags(),
      ]);
      setCategories(cats);
      setTags(tagList);
    } catch (error) {
      console.error('Error loading categories/tags:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const material = await createLearningMaterial({
        ...formData,
        tag_ids: selectedTagIds,
      });
      router.push(`/workspace/collateral/${material.slug}`);
    } catch (error: any) {
      console.error('Error creating material:', error);
      alert(error.message || 'Failed to create learning material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-h4-dynamic font-bold">New Learning Material</h1>
          <p className="text-muted-foreground mt-1">Create a new learning material</p>
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
                  placeholder="Enter material title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                  placeholder="material-url-slug"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Auto-generated from title if left empty
                </p>
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Short description of the material"
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
              <CardDescription>Main learning material content with rich text formatting</CardDescription>
            </CardHeader>
            <CardContent>
              <CollateralRichTextEditor
                value={formData.content}
                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                placeholder="Write your learning material content here..."
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
                  value={formData.category_id?.toString() || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value === 'none' ? null : parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
                <Label htmlFor="content_type">Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, content_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="quick-start">Quick Start</SelectItem>
                    <SelectItem value="reference">Reference</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.content}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Material
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

