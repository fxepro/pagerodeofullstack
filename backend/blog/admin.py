from django.contrib import admin
from .models import Category, Tag, BlogPost, BlogAuthor


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'order', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['order']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'status', 'featured', 'published_at', 'views_count', 'created_at']
    list_filter = ['status', 'featured', 'category', 'tags', 'created_at', 'published_at']
    search_fields = ['title', 'excerpt', 'content']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ['tags']
    readonly_fields = ['created_at', 'updated_at', 'views_count', 'read_time']
    
    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'excerpt', 'content', 'featured_image')
        }),
        ('Metadata', {
            'fields': ('author', 'category', 'tags', 'status', 'featured', 'language')
        }),
        ('Publishing', {
            'fields': ('published_at', 'created_at', 'updated_at')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords', 'og_image'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('views_count', 'read_time'),
            'classes': ('collapse',)
        }),
        ('Translations', {
            'fields': ('translations',),
            'classes': ('collapse',)
        }),
    )


@admin.register(BlogAuthor)
class BlogAuthorAdmin(admin.ModelAdmin):
    list_display = ['user', 'author_page_url']
    search_fields = ['user__username', 'user__email', 'bio']
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Profile', {
            'fields': ('bio', 'avatar', 'author_page_url')
        }),
        ('Social Links', {
            'fields': ('social_links',),
            'classes': ('collapse',)
        }),
    )
