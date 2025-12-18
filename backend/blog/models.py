from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.utils import timezone
import re


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    excerpt = models.TextField(max_length=500, blank=True)
    content = models.TextField(help_text='Markdown or HTML content')
    featured_image = models.ImageField(upload_to='blog/images/', null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_posts')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    views_count = models.IntegerField(default=0)
    read_time = models.IntegerField(default=0, help_text='Estimated reading time in minutes')
    
    # SEO fields
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(max_length=500, blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)
    og_image = models.ImageField(upload_to='blog/og_images/', null=True, blank=True)
    
    # Multi-language support
    language = models.CharField(max_length=5, default='en')
    translations = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', '-published_at']),
            models.Index(fields=['featured', '-published_at']),
            models.Index(fields=['category', '-published_at']),
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
        return f'/blog/{self.slug}/'


class BlogAuthor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='blog_author_profile')
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='blog/avatars/', null=True, blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    author_page_url = models.URLField(blank=True)

    class Meta:
        verbose_name = "Blog Author"
        verbose_name_plural = "Blog Authors"

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}"
