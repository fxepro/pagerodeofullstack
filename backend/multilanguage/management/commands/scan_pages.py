import os
import re
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from multilanguage.models import PageTranslationStatus


def detect_translation_usage(file_path: Path, check_imports: bool = True) -> str:
    """
    Detect if a file uses translations by scanning its content.
    Also checks imported components if check_imports is True.
    Returns: 'implemented', 'partial', or 'not-implemented'
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for translation imports
        has_use_translation = 'useTranslation' in content
        has_i18n_import = 'react-i18next' in content or 'i18next' in content
        
        # Check for translation function usage
        # Pattern: t('key') or t("key") or t(`key`)
        translation_pattern = r"t\s*\(\s*['\"`][^'\"`]+['\"`]"
        has_translation_calls = bool(re.search(translation_pattern, content))
        
        # Check for i18n object usage
        has_i18n_usage = bool(re.search(r'\bi18n\.', content))
        
        # Check if this file itself uses translations
        file_has_translations = has_use_translation or has_i18n_import
        file_uses_translations = has_translation_calls or has_i18n_usage
        
        # If file itself uses translations, return status
        if file_has_translations:
            if file_uses_translations:
                return 'implemented'
            else:
                return 'partial'
        
        # If file doesn't use translations directly, check imported components
        if check_imports and not file_has_translations:
            # Find imports from @/components/
            component_import_pattern = r"from\s+['\"]@/components/([^'\"]+)['\"]"
            component_imports = re.findall(component_import_pattern, content)
            
            # Also check relative imports like ../components/ or ./components/
            relative_import_pattern = r"from\s+['\"](?:\.\.?/)+components/([^'\"]+)['\"]"
            relative_imports = re.findall(relative_import_pattern, content)
            
            all_component_imports = component_imports + relative_imports
            
            if all_component_imports:
                # Check each imported component for translations
                backend_dir = Path(settings.BASE_DIR)
                project_root = backend_dir.parent
                components_dir = project_root / 'studio' / 'components'
                
                found_implemented = False
                found_partial = False
                
                for component_name in all_component_imports:
                    # Try to find the component file
                    # Could be component-name.tsx, component-name/index.tsx, etc.
                    possible_paths = [
                        components_dir / f"{component_name}.tsx",
                        components_dir / f"{component_name}.ts",
                        components_dir / component_name / "index.tsx",
                        components_dir / component_name / "index.ts",
                    ]
                    
                    for comp_path in possible_paths:
                        if comp_path.exists():
                            # Recursively check component (but don't check its imports to avoid infinite loops)
                            comp_status = detect_translation_usage(comp_path, check_imports=False)
                            if comp_status == 'implemented':
                                found_implemented = True
                            elif comp_status == 'partial':
                                found_partial = True
                            break
                
                # If any component is implemented, page is implemented
                if found_implemented:
                    return 'implemented'
                # If any component is partial, page is partial
                elif found_partial:
                    return 'partial'
        
        # No translations found
        return 'not-implemented'
            
    except Exception as e:
        # If we can't read the file, default to not-implemented
        print(f"Warning: Could not read {file_path}: {e}")
        return 'not-implemented'


def scan_pages_for_translation():
    """
    Scan the studio/app directory for all page.tsx files and create/update PageTranslationStatus records
    """
    # Get the project root (parent of backend directory)
    backend_dir = Path(settings.BASE_DIR)
    project_root = backend_dir.parent
    studio_app_dir = project_root / 'studio' / 'app'
    
    if not studio_app_dir.exists():
        raise Exception(f"Studio app directory not found: {studio_app_dir}")
    
    pages_found = []
    
    # Walk through all page.tsx files
    for page_file in studio_app_dir.rglob('page.tsx'):
        # Get relative path from studio/app
        relative_path = page_file.relative_to(studio_app_dir)
        
        # Convert file path to route
        # Remove 'page.tsx' and convert to route format
        route_parts = relative_path.parts[:-1]  # Remove 'page.tsx'
        
        # Build route
        if len(route_parts) == 0:
            route = '/'
        else:
            route = '/' + '/'.join(route_parts)
            # Handle dynamic routes [param]
            route = re.sub(r'\[(\w+)\]', r'[\1]', route)
        
        # Determine page type
        page_type = 'workspace'
        if route.startswith('/workspace'):
            page_type = 'workspace'
        elif route.startswith('/admin'):
            page_type = 'admin'
        elif route.startswith('/dashboard'):
            page_type = 'dashboard'
        elif route.startswith('/api'):
            page_type = 'api'
        elif any(route.startswith(f'/{p}') for p in ['login', 'register', 'verify-email', 'checkout', 'logout']):
            page_type = 'public'
        elif route == '/' or route.startswith('/') and not route.startswith('/workspace') and not route.startswith('/admin') and not route.startswith('/dashboard'):
            # Check if it's a public page (like /performance, /typography, etc.)
            public_routes = ['/performance', '/typography', '/dns', '/ssl', '/sitemap', '/monitor', '/links', 
                           '/api-info', '/about', '/contact', '/blog', '/privacy', '/terms', '/cookies',
                           '/deals', '/upgrade', '/consult', '/audit', '/results', '/feedback', '/ai-info',
                           '/ai-monitor', '/ai-health', '/monitor-info', '/performance-info', '/sitemap-info',
                           '/ssl-info', '/links-info']
            if route in public_routes or any(route.startswith(p) for p in public_routes):
                page_type = 'public'
            else:
                page_type = 'public'  # Default to public for unknown routes
        
        component_path = f"studio/app/{relative_path.as_posix()}"
        
        # Detect translation usage by scanning file content
        detected_status = detect_translation_usage(page_file)
        
        pages_found.append({
            'page_route': route,
            'component_path': component_path,
            'page_type': page_type,
            'detected_status': detected_status,
        })
    
    # Also scan for components in studio/components
    components_dir = Path(settings.BASE_DIR).parent / 'studio' / 'components'
    if components_dir.exists():
        for component_file in components_dir.rglob('*.tsx'):
            relative_path = component_file.relative_to(components_dir)
            component_name = component_file.stem
            route = f'Component: {component_name}'
            component_path = f"studio/components/{relative_path.as_posix()}"
            
            # Detect translation usage for components too
            detected_status = detect_translation_usage(component_file)
            
            pages_found.append({
                'page_route': route,
                'component_path': component_path,
                'page_type': 'component',
                'detected_status': detected_status,
            })
    
    # Create or update PageTranslationStatus records
    new_pages = 0
    updated_pages = 0
    
    for page_data in pages_found:
        # Use detected status from file content analysis
        detected_status = page_data.get('detected_status', 'not-implemented')
        
        page, created = PageTranslationStatus.objects.update_or_create(
            page_route=page_data['page_route'],
            defaults={
                'component_path': page_data['component_path'],
                'page_type': page_data['page_type'],
                'auto_discovered': True,
            }
        )
        
        # Set status for newly created pages based on detection
        if created:
            page.status = detected_status
            page.save()
            new_pages += 1
        else:
            # Update component path if it changed
            if page.component_path != page_data['component_path']:
                page.component_path = page_data['component_path']
                page.save()
                updated_pages += 1
            
            # Update status if detection found a different status (but only if it's more complete)
            # Don't downgrade from implemented to partial/not-implemented
            if detected_status == 'implemented' and page.status != 'implemented':
                page.status = detected_status
                page.save()
                updated_pages += 1
            elif detected_status == 'partial' and page.status == 'not-implemented':
                page.status = detected_status
                page.save()
                updated_pages += 1
    
    return new_pages, updated_pages


class Command(BaseCommand):
    help = 'Scan the codebase for pages and update PageTranslationStatus records'

    def handle(self, *args, **options):
        try:
            new_pages, updated_pages = scan_pages_for_translation()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully scanned pages. Found {new_pages} new pages, updated {updated_pages} existing pages.'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error scanning pages: {str(e)}')
            )
            raise

