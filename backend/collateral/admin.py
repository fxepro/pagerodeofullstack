"""
Django admin configuration for collateral app
"""
from django.contrib import admin
from django import forms
from .models import CollateralCategory, CollateralTag, LearningMaterial, LearningMaterialAuthor

# Try to use CKEditor if available, otherwise use Textarea
try:
    from ckeditor.widgets import CKEditorWidget
    USE_CKEDITOR = True
except ImportError:
    USE_CKEDITOR = False


@admin.register(CollateralCategory)
class CollateralCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'order', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['order']


@admin.register(CollateralTag)
class CollateralTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(LearningMaterial)
class LearningMaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'content_type', 'status', 'featured', 'published_at', 'views_count', 'created_at']
    list_filter = ['status', 'featured', 'category', 'content_type', 'tags', 'created_at', 'published_at']
    search_fields = ['title', 'excerpt', 'content', 'related_feature']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ['tags']
    readonly_fields = ['created_at', 'updated_at', 'views_count', 'read_time']
    
    # Add rich text editor for content field
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if USE_CKEDITOR:
            form.base_fields['content'].widget = CKEditorWidget()
        else:
            # Use a larger textarea if CKEditor is not available
            form.base_fields['content'].widget = forms.Textarea(attrs={'rows': 20, 'cols': 80})
        return form
    
    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'excerpt', 'content', 'featured_image', 'video_url', 'content_type')
        }),
        ('Organization', {
            'fields': ('author', 'category', 'tags', 'related_feature', 'related_feature_url')
        }),
        ('Publishing', {
            'fields': ('status', 'featured', 'published_at', 'created_at', 'updated_at')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords', 'og_image'),
            'classes': ('collapse',)
        }),
        ('Analytics', {
            'fields': ('views_count', 'read_time'),
            'classes': ('collapse',)
        }),
        ('Multi-language', {
            'fields': ('language', 'translations'),
            'classes': ('collapse',)
        }),
    )


@admin.register(LearningMaterialAuthor)
class LearningMaterialAuthorAdmin(admin.ModelAdmin):
    list_display = ['user', 'author_page_url']
    search_fields = ['user__username', 'user__email', 'bio']
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Profile', {
            'fields': ('bio', 'avatar', 'author_page_url', 'expertise_areas')
        }),
        ('Social Links', {
            'fields': ('social_links',),
            'classes': ('collapse',)
        }),
    )

