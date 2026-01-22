from django.core.management.base import BaseCommand
from django.db import transaction
from blog.models import BlogPost, Category, Tag


class Command(BaseCommand):
    help = 'Update categories and tags for blog posts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--post-id',
            type=int,
            help='Update a specific post by ID',
        )
        parser.add_argument(
            '--post-slug',
            type=str,
            help='Update a specific post by slug',
        )
        parser.add_argument(
            '--category',
            type=str,
            help='Set category by name or slug',
        )
        parser.add_argument(
            '--category-id',
            type=int,
            help='Set category by ID',
        )
        parser.add_argument(
            '--remove-category',
            action='store_true',
            help='Remove category from post(s)',
        )
        parser.add_argument(
            '--tags',
            type=str,
            nargs='+',
            help='Set tags by name (space-separated). Use --tags "tag1" "tag2"',
        )
        parser.add_argument(
            '--tag-ids',
            type=int,
            nargs='+',
            help='Set tags by ID (space-separated). Use --tag-ids 1 2 3',
        )
        parser.add_argument(
            '--add-tags',
            type=str,
            nargs='+',
            help='Add tags to existing tags (space-separated)',
        )
        parser.add_argument(
            '--remove-tags',
            type=str,
            nargs='+',
            help='Remove tags (space-separated)',
        )
        parser.add_argument(
            '--clear-tags',
            action='store_true',
            help='Remove all tags from post(s)',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Apply to all posts',
        )
        parser.add_argument(
            '--status',
            type=str,
            choices=['draft', 'published', 'archived'],
            help='Apply to posts with specific status',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Get posts to update
        posts = BlogPost.objects.all()
        
        if options['post_id']:
            posts = posts.filter(id=options['post_id'])
        elif options['post_slug']:
            posts = posts.filter(slug=options['post_slug'])
        elif not options['all']:
            self.stdout.write(
                self.style.ERROR('Must specify --post-id, --post-slug, or --all')
            )
            return
        
        if options['status']:
            posts = posts.filter(status=options['status'])
        
        posts = posts.select_related('category').prefetch_related('tags')
        post_count = posts.count()
        
        if post_count == 0:
            self.stdout.write(self.style.WARNING('No posts found matching criteria'))
            return
        
        self.stdout.write(f'Found {post_count} post(s) to update')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Process category
        category = None
        if options['remove_category']:
            category = None
        elif options['category_id']:
            try:
                category = Category.objects.get(id=options['category_id'])
            except Category.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Category with ID {options["category_id"]} not found')
                )
                return
        elif options['category']:
            try:
                category = Category.objects.get(slug=options['category'])
            except Category.DoesNotExist:
                try:
                    category = Category.objects.get(name=options['category'])
                except Category.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(f'Category "{options["category"]}" not found')
                    )
                    return
        
        # Process tags
        tags_to_set = None
        tags_to_add = []
        tags_to_remove = []
        
        if options['clear_tags']:
            tags_to_set = []
        elif options['tag_ids']:
            tags_to_set = Tag.objects.filter(id__in=options['tag_ids'])
            missing = set(options['tag_ids']) - set(tags_to_set.values_list('id', flat=True))
            if missing:
                self.stdout.write(
                    self.style.WARNING(f'Tag IDs not found: {missing}')
                )
        elif options['tags']:
            tags_to_set = []
            for tag_name in options['tags']:
                tag, created = Tag.objects.get_or_create(
                    name=tag_name,
                    defaults={'slug': tag_name.lower().replace(' ', '-')}
                )
                tags_to_set.append(tag)
                if created:
                    self.stdout.write(f'Created new tag: {tag.name}')
        
        if options['add_tags']:
            for tag_name in options['add_tags']:
                tag, created = Tag.objects.get_or_create(
                    name=tag_name,
                    defaults={'slug': tag_name.lower().replace(' ', '-')}
                )
                tags_to_add.append(tag)
                if created:
                    self.stdout.write(f'Created new tag: {tag.name}')
        
        if options['remove_tags']:
            tags_to_remove = Tag.objects.filter(name__in=options['remove_tags'])
            missing = set(options['remove_tags']) - set(tags_to_remove.values_list('name', flat=True))
            if missing:
                self.stdout.write(
                    self.style.WARNING(f'Tags not found: {missing}')
                )
        
        # Update posts
        updated_count = 0
        with transaction.atomic():
            for post in posts:
                changes = []
                
                # Update category
                if category is not None or options['remove_category']:
                    old_category = post.category
                    post.category = category
                    if old_category != category:
                        changes.append(f'Category: {old_category} → {category}')
                
                # Update tags
                if tags_to_set is not None:
                    old_tags = list(post.tags.all())
                    if not dry_run:
                        post.tags.set(tags_to_set)
                    changes.append(f'Tags: {[t.name for t in old_tags]} → {[t.name for t in tags_to_set]}')
                else:
                    if tags_to_add:
                        old_tags = list(post.tags.all())
                        if not dry_run:
                            post.tags.add(*tags_to_add)
                        new_tags = list(post.tags.all()) if not dry_run else old_tags + tags_to_add
                        changes.append(f'Added tags: {[t.name for t in tags_to_add]}')
                    
                    if tags_to_remove:
                        old_tags = list(post.tags.all())
                        if not dry_run:
                            post.tags.remove(*tags_to_remove)
                        changes.append(f'Removed tags: {[t.name for t in tags_to_remove]}')
                
                if changes:
                    if not dry_run:
                        post.save()
                    updated_count += 1
                    self.stdout.write(f'\nPost: {post.title} (ID: {post.id})')
                    for change in changes:
                        self.stdout.write(f'  - {change}')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'\nDRY RUN: Would update {updated_count} post(s)')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\nSuccessfully updated {updated_count} post(s)')
            )

