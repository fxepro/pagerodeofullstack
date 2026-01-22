"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applyTheme } from "@/lib/theme";
import { 
  BookOpen, 
  ArrowLeft, 
  Clock, 
  Eye, 
  User, 
  Calendar as CalendarIcon,
  ExternalLink,
  Video,
  FileText,
  Loader2,
  AlertCircle,
  Edit,
  Trash2
} from "lucide-react";
import { fetchLearningMaterialBySlug, incrementViewCount, deleteLearningMaterial, type LearningMaterial } from "@/lib/api/collateral";
import Link from "next/link";

export default function LearningMaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [material, setMaterial] = useState<LearningMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchMaterial = async () => {
      try {
        setLoading(true);
        const data = await fetchLearningMaterialBySlug(slug);
        setMaterial(data);
        
        // Increment view count
        if (data.id) {
          try {
            await incrementViewCount(data.id);
          } catch (e) {
            // Silently fail view count increment
            console.warn('Failed to increment view count:', e);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load learning material');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [slug]);

  const handleDelete = async () => {
    if (!material) return;
    
    if (!confirm('Are you sure you want to delete this learning material? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteLearningMaterial(material.id);
      router.push('/workspace/collateral');
    } catch (error: any) {
      console.error('Error deleting material:', error);
      alert(error.message || 'Failed to delete learning material');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={applyTheme.page()}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-palette-primary mx-auto mb-4" />
            <p className={applyTheme.text('secondary')}>Loading learning material...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className={applyTheme.page()}>
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={`${applyTheme.text('primary')} flex items-center gap-2`}>
              <AlertCircle className="h-5 w-5 text-red-500" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={applyTheme.text('secondary')}>
              {error || 'Learning material not found'}
            </p>
            <Button 
              onClick={() => router.push('/workspace/collateral')} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Collateral
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getContentTypeLabel = (contentType: string) => {
    return contentType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className={applyTheme.page()}>
      {/* Back Button and Actions */}
      <div className="mb-6 flex items-center justify-between">
        <Button 
          onClick={() => router.push('/workspace/collateral')} 
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Collateral
        </Button>
        <div className="flex gap-2">
          <Button 
            onClick={() => router.push(`/workspace/collateral/${slug}/edit`)} 
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            onClick={handleDelete}
            variant="destructive"
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {getContentTypeIcon(material.content_type)}
              <Badge variant="outline" className="capitalize">
                {getContentTypeLabel(material.content_type)}
              </Badge>
              {material.category && (
                <Badge variant="outline">
                  {material.category.name}
                </Badge>
              )}
            </div>
            <h1 className={`text-4xl font-bold ${applyTheme.text('primary')} mb-3`}>
              {material.title}
            </h1>
            {material.excerpt && (
              <p className={`text-lg ${applyTheme.text('secondary')} mb-4`}>
                {material.excerpt}
              </p>
            )}
          </div>
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {material.author && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{material.author.full_name || material.author.username}</span>
            </div>
          )}
          {material.published_at && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{new Date(material.published_at).toLocaleDateString()}</span>
            </div>
          )}
          {material.read_time > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{material.read_time} min read</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{material.views_count} views</span>
          </div>
        </div>

        {/* Tags */}
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {material.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Related Feature Link */}
        {material.related_feature_url && (
          <div className="mt-4">
            <Link
              href={material.related_feature_url}
              className="inline-flex items-center gap-2 text-palette-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Go to {material.related_feature || 'Related Feature'}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Video URL */}
      {material.video_url && (
        <Card className={applyTheme.card() + " mb-8"}>
          <CardHeader>
            <CardTitle className={`${applyTheme.text('primary')} flex items-center gap-2`}>
              <Video className="h-5 w-5" />
              Video Tutorial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={material.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-palette-primary hover:underline flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Watch Video
            </a>
          </CardContent>
        </Card>
      )}

      {/* Featured Image */}
      {material.featured_image_url && (
        <div className="mb-8">
          <img
            src={material.featured_image_url}
            alt={material.title}
            className="w-full rounded-lg object-cover max-h-96"
          />
        </div>
      )}

      {/* Content */}
      <Card className={applyTheme.card()}>
        <CardContent className="pt-6">
          <div 
            className={`prose prose-slate max-w-none ${applyTheme.text('primary')}`}
            dangerouslySetInnerHTML={{ __html: material.content }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

