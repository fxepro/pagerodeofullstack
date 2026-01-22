"""
Collateral Models
Learning materials, documentation, and tutorials for PageRodeo features
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.utils import timezone
import re


class CollateralCategory(models.Model):
    """Categories for organizing learning materials (My Tools, Administration, Integrations)"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name from lucide-react")
    created_at = models.DateTimeField(auto_now_add=True)
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Collateral Category"
        verbose_name_plural = "Collateral Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class CollateralTag(models.Model):
    """Tags for learning materials (feature names, content types, etc.)"""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True, help_text="Optional description of what this tag represents")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Collateral Tag"
        verbose_name_plural = "Collateral Tags"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class LearningMaterial(models.Model):
    """Learning materials: documentation, tutorials, guides, etc."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    CONTENT_TYPE_CHOICES = [
        ('documentation', 'Documentation'),
        ('tutorial', 'Tutorial'),
        ('video', 'Video'),
        ('guide', 'Guide'),
        ('quick-start', 'Quick Start'),
        ('reference', 'Reference'),
        ('faq', 'FAQ'),
    ]
    
    # Basic information
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    excerpt = models.TextField(max_length=500, blank=True, help_text="Short description/summary")
    content = models.TextField(help_text='Markdown or HTML content')
    
    # Media
    featured_image = models.ImageField(upload_to='collateral/images/', null=True, blank=True)
    video_url = models.URLField(blank=True, help_text="URL to video (YouTube, Vimeo, etc.)")
    
    # Relationships
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_materials')
    category = models.ForeignKey(CollateralCategory, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(CollateralTag, blank=True)
    
    # Content classification
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='documentation')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    featured = models.BooleanField(default=False, help_text="Feature this material prominently")
    
    # Publishing
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Analytics
    views_count = models.IntegerField(default=0)
    read_time = models.IntegerField(default=0, help_text='Estimated reading time in minutes')
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(max_length=500, blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)
    og_image = models.ImageField(upload_to='collateral/og_images/', null=True, blank=True)
    
    # Multi-language support
    language = models.CharField(max_length=5, default='en')
    translations = models.JSONField(default=dict, blank=True)
    
    # Related feature/page
    related_feature = models.CharField(
        max_length=100, 
        blank=True, 
        help_text="Related feature/page slug (e.g., 'site-audit', 'user-management')"
    )
    related_feature_url = models.CharField(
        max_length=200, 
        blank=True, 
        help_text="URL to related feature page (e.g., '/workspace/site-audit')"
    )

    class Meta:
        verbose_name = "Learning Material"
        verbose_name_plural = "Learning Materials"
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', '-published_at']),
            models.Index(fields=['featured', '-published_at']),
            models.Index(fields=['category', '-published_at']),
            models.Index(fields=['content_type', '-published_at']),
            models.Index(fields=['related_feature']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        
        # Auto-set published_at when status changes to published
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        
        # Calculate read time (approximately 200 words per minute)
        if self.content:
            # Remove HTML tags for word count
            text_content = re.sub(r'<[^>]+>', '', self.content)
            word_count = len(text_content.split())
            self.read_time = max(1, round(word_count / 200))
        
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return f'/workspace/collateral/{self.slug}/'


class LearningMaterialAuthor(models.Model):
    """Extended author profile for learning materials (optional)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='collateral_author_profile')
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='collateral/avatars/', null=True, blank=True)
    expertise_areas = models.JSONField(default=list, blank=True, help_text="List of expertise areas")
    social_links = models.JSONField(default=dict, blank=True)
    author_page_url = models.URLField(blank=True)

    class Meta:
        verbose_name = "Learning Material Author"
        verbose_name_plural = "Learning Material Authors"

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}"

