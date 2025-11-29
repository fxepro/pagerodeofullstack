import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import time
from collections import deque

@csrf_exempt
@require_http_methods(["POST", "GET"])
def generate_sitemap(request):
    """
    Generate sitemap by crawling a website
    """
    # Add a simple GET endpoint for testing
    if request.method == 'GET':
        return JsonResponse({
            'success': True,
            'message': 'Sitemap API is working',
            'method': 'GET'
        })
    
    try:
        data = json.loads(request.body)
        url = data.get('url')
        
        if not url:
            return JsonResponse({'error': 'URL is required'}, status=400)
        
        # Validate URL
        parsed_url = urlparse(url)
        if not parsed_url.scheme or not parsed_url.netloc:
            return JsonResponse({'error': 'Invalid URL'}, status=400)
        
        # Ensure URL has scheme
        if not parsed_url.scheme:
            url = 'https://' + url
        
        # Crawl the website
        sitemap_data = crawl_website(url)
        
        return JsonResponse({
            'success': True,
            'sitemap': sitemap_data,
            'total_pages': count_pages(sitemap_data)
        })
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[Sitemap] ========================================")
        print(f"[Sitemap] ERROR: {str(e)}")
        print(f"[Sitemap] ========================================")
        print(f"[Sitemap] Traceback: {error_trace}")
        print(f"[Sitemap] ========================================")
        return JsonResponse({
            'error': str(e),
            'traceback': error_trace
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def fetch_sitemap_xml(request):
    """
    Fetch and parse sitemap XML from a URL (CORS proxy)
    """
    try:
        data = json.loads(request.body)
        sitemap_url = data.get('sitemap_url')
        
        if not sitemap_url:
            return JsonResponse({'error': 'Sitemap URL is required'}, status=400)
        
        # Fetch the sitemap XML
        response = requests.get(sitemap_url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; SitemapGenerator/1.0)'
        })
        
        if response.status_code != 200:
            return JsonResponse({'error': f'Failed to fetch sitemap: {response.status_code}'}, status=400)
        
        return JsonResponse({
            'success': True,
            'xml_content': response.text,
            'content_type': response.headers.get('content-type', 'application/xml')
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def normalize_url(url):
    """
    Normalize URL to ensure consistency (remove trailing slash, etc.)
    
    CANONICAL URL FORMAT:
    - Homepage: https://example.com (no trailing slash)
    - Other pages: https://example.com/path (no trailing slash)
    
    This prevents duplicate entries like:
    - https://example.com vs https://example.com/
    """
    parsed = urlparse(url)
    
    # For homepage, always use without trailing slash for consistency
    if parsed.path in ['/', '']:
        normalized = f"{parsed.scheme}://{parsed.netloc}"
    else:
        # For all other paths, remove trailing slash
        path = parsed.path.rstrip('/')
        normalized = f"{parsed.scheme}://{parsed.netloc}{path}"
    
    return normalized

def crawl_website(start_url, max_pages=100, max_depth=4):
    """
    Crawl a website and generate sitemap structure
    """
    # Normalize the start URL
    start_url = normalize_url(start_url)
    
    visited = set()
    to_visit = deque([(start_url, 0, None)])  # (url, depth, parent_url)
    sitemap = []
    parent_child_map = {}  # Track actual parent-child relationships
    base_domain = urlparse(start_url).netloc
    
    while to_visit and len(visited) < max_pages:
        current_url, depth, parent_url = to_visit.popleft()
        
        # Normalize the current URL
        current_url = normalize_url(current_url)
        
        if current_url in visited or depth > max_depth:
            continue
            
        try:
            # Add delay to be respectful
            time.sleep(0.5)
            
            print(f"Attempting to crawl: {current_url}")
            response = requests.get(current_url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; SitemapGenerator/1.0)'
            })
            
            if response.status_code != 200:
                print(f"Failed to fetch {current_url}: Status {response.status_code}")
                continue
                
            visited.add(current_url)
            
            # Parse the page
            soup = BeautifulSoup(response.text, 'html.parser')
            title = soup.find('title')
            title_text = title.get_text().strip() if title else 'Untitled'
            
            # Skip pages that are clearly not content pages based on title
            # BUT NEVER skip the starting URL (homepage) or blog content
            is_blog_content = '/blog' in current_url.lower() or '/post' in current_url.lower() or '/article' in current_url.lower()
            
            if current_url != start_url and not is_blog_content:
                skip_title_patterns = [
                    'author:', 'category:', 'tag:', 'archive:', 
                    'login', 'register', 'sign in', 'sign up',
                    'search results', '404', 'page not found',
                    'error', 'admin', 'dashboard'
                ]
                
                if any(pattern.lower() in title_text.lower() for pattern in skip_title_patterns):
                    print(f"Skipping non-content page: {current_url} - {title_text}")
                    continue
            
            # Log if we found blog content
            if is_blog_content:
                print(f"Found blog content: {current_url} - {title_text}")
            
            # Create sitemap node
            node = {
                'url': current_url,
                'title': title_text,
                'depth': depth,
                'status': 'success',
                'lastModified': response.headers.get('last-modified', ''),
                'priority': calculate_priority(current_url, depth),
                'children': []
            }
            
            print(f"Crawled: {current_url} (depth {depth}) - {title_text} - Priority: {calculate_priority(current_url, depth)}")
            if parent_url:
                print(f"  └── Parent: {parent_url}")
            
            # Track parent-child relationship based on URL structure, not discovery order
            # NEVER treat the homepage as a child of any other page
            if parent_url and current_url != start_url:
                # Determine the logical parent based on URL structure
                logical_parent = determine_logical_parent(current_url, parent_url, start_url)
                if logical_parent and logical_parent != current_url:  # Avoid self-reference
                    if logical_parent not in parent_child_map:
                        parent_child_map[logical_parent] = []
                    parent_child_map[logical_parent].append(current_url)
            
            # Find links on the page
            if depth < max_depth:
                links = soup.find_all('a', href=True)
                print(f"Found {len(links)} links on {current_url}")
                for link in links:
                    href = link['href']
                    # Skip non-HTTP links and fragments
                    if not href or href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:') or href.startswith('javascript:'):
                        continue
                        
                    absolute_url = urljoin(current_url, href)
                    parsed_link = urlparse(absolute_url)
                    
                    # Skip non-HTTP schemes
                    if parsed_link.scheme not in ['http', 'https']:
                        continue
                    
                    # Skip common file extensions that shouldn't be in sitemaps
                    path_lower = parsed_link.path.lower()
                    skip_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js', '.xml', '.txt', '.zip', '.doc', '.docx', '.xls', '.xlsx']
                    if any(path_lower.endswith(ext) for ext in skip_extensions):
                        continue
                    
                    # Skip non-page content (WordPress and general CMS patterns)
                    skip_patterns = [
                        '/author/', '/authors/',
                        '/category/', '/categories/', '/cat/',
                        '/tag/', '/tags/',
                        '/archive/', '/archives/',
                        '/feed/', '/feeds/',
                        '/wp-admin/', '/wp-login/', '/wp-content/',
                        '/admin/', '/login/', '/register/',
                        '/search/', '/api/',
                        '/attachment/', '/attachments/',
                        '/media/', '/uploads/',
                        '/date/', '/year/', '/month/',
                        '/comments/', '/comment/',
                        '/rss/', '/atom/'
                    ]
                    
                    # Normalize URL using our function
                    normalized_url = normalize_url(absolute_url)
                    
                    # Skip URLs with query parameters 
                    if '?' in absolute_url or '#' in absolute_url:
                        print(f"Filtered out URL with parameters: {absolute_url}")
                        continue
                    
                    # Don't filter the start URL or its immediate children too aggressively
                    if normalized_url != start_url and any(pattern in normalized_url.lower() for pattern in skip_patterns):
                        print(f"Filtered out by pattern: {normalized_url}")
                        continue
                    
                    # Log blog URLs specifically
                    if '/blog' in normalized_url.lower() or '/post' in normalized_url.lower() or '/article' in normalized_url.lower():
                        print(f"Found blog/post URL: {normalized_url}")
                    
                    # Only crawl links from the same domain
                    if (parsed_link.netloc == base_domain and 
                        normalized_url not in visited and
                        not any(normalized_url == item[0] for item in to_visit)):
                        
                        # Calculate proper depth based on URL hierarchy, not just discovery order
                        proper_depth = calculate_url_depth(normalized_url, start_url)
                        to_visit.append((normalized_url, proper_depth, current_url))
            
            sitemap.append(node)
            
        except Exception as e:
            print(f"Error crawling {current_url}: {e}")
            continue
    
    print(f"Crawling completed. Found {len(sitemap)} pages, visited {len(visited)} URLs.")
    
    # Initial deduplication step - remove duplicates before hierarchy building
    def deduplicate_flat_sitemap(nodes):
        seen_urls = set()
        deduplicated = []
        
        for node in nodes:
            normalized_url = normalize_url(node['url'])
            if normalized_url not in seen_urls:
                seen_urls.add(normalized_url)
                deduplicated.append(node)
            else:
                print(f"Removed duplicate during flat deduplication: {node['url']}")
        
        return deduplicated
    
    sitemap = deduplicate_flat_sitemap(sitemap)
    print(f"After initial deduplication: {len(sitemap)} pages")
    
    # Debug: Print all URLs before hierarchy building
    print("=== ALL CRAWLED URLs ===")
    for i, node in enumerate(sitemap):
        print(f"{i+1}. {node['url']} - {node['title']}")
    
    # Build hierarchical structure using actual parent-child relationships
    hierarchy = build_hierarchy_from_relationships(sitemap, parent_child_map, start_url)
    print(f"Built hierarchy with {len(hierarchy)} root nodes")
    print(f"Parent-child relationships: {parent_child_map}")
    
    # Debug: Print final hierarchy
    print("=== FINAL HIERARCHY ===")
    def print_hierarchy(nodes, indent=0):
        for node in nodes:
            print("  " * indent + f"- {node['url']} ({node['title']})")
            if node.get('children'):
                print_hierarchy(node['children'], indent + 1)
    print_hierarchy(hierarchy)
    
    # Final deduplication step - remove any remaining duplicates
    def deduplicate_hierarchy(nodes):
        seen_urls = set()
        deduplicated = []
        
        for node in nodes:
            normalized_url = normalize_url(node['url'])
            if normalized_url not in seen_urls:
                seen_urls.add(normalized_url)
                # Recursively deduplicate children
                if node.get('children'):
                    node['children'] = deduplicate_hierarchy(node['children'])
                deduplicated.append(node)
            else:
                print(f"Removed duplicate: {node['url']}")
        
        return deduplicated
    
    final_hierarchy = deduplicate_hierarchy(hierarchy)
    print(f"After deduplication: {len(final_hierarchy)} root nodes")
    
    return final_hierarchy

def build_hierarchy_from_relationships(nodes, parent_child_map, root_url):
    """
    Build hierarchical structure using actual crawled parent-child relationships
    """
    # Create a map for quick lookup
    node_map = {node['url']: node for node in nodes}
    
    # Build children arrays based on actual relationships
    for parent_url, child_urls in parent_child_map.items():
        if parent_url in node_map:
            for child_url in child_urls:
                if child_url in node_map:
                    node_map[parent_url]['children'].append(node_map[child_url])
    
    # Find root nodes (those that aren't children of any other node)
    all_children = set()
    for child_urls in parent_child_map.values():
        all_children.update(child_urls)
    
    root_nodes = []
    processed_urls = set()  # Track processed URLs to avoid duplicates
    
    # First, add the homepage as the primary root node
    if root_url in node_map:
        root_nodes.append(node_map[root_url])
        processed_urls.add(root_url)
        print(f"Added homepage as root: {root_url}")
    
    # Then add other root nodes (pages that aren't children of anything)
    for node in nodes:
        if node['url'] not in processed_urls and node['url'] not in all_children:
            root_nodes.append(node)
            processed_urls.add(node['url'])
            print(f"Added other root node: {node['url']}")
    
    print(f"Found {len(root_nodes)} root nodes: {[node['url'] for node in root_nodes]}")
    
    # Debug: Print the structure of root nodes and their children
    for root in root_nodes:
        print(f"Root: {root['url']} has {len(root.get('children', []))} children")
        for child in root.get('children', []):
            print(f"  - Child: {child['url']} has {len(child.get('children', []))} children")
    
    return root_nodes

def build_hierarchy(nodes, root_url):
    """
    Build hierarchical structure from flat list of nodes
    """
    # Create a map for quick lookup
    node_map = {node['url']: node for node in nodes}
    root_nodes = []
    
    for node in nodes:
        if node['url'] == root_url:
            root_nodes.append(node)
        else:
            # Find parent by URL structure
            parent_url = find_parent_url(node['url'], node_map.keys())
            if parent_url and parent_url in node_map:
                node_map[parent_url]['children'].append(node)
            else:
                # If no parent found, add as root
                root_nodes.append(node)
    
    return root_nodes

def find_parent_url(url, all_urls):
    """
    Find the parent URL for a given URL
    """
    parsed_url = urlparse(url)
    path_parts = parsed_url.path.strip('/').split('/')
    
    for i in range(len(path_parts) - 1, 0, -1):
        parent_path = '/' + '/'.join(path_parts[:i]) + '/'
        parent_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parent_path}"
        if parent_url in all_urls:
            return parent_url
    
    # If no parent found, return the root
    return f"{parsed_url.scheme}://{parsed_url.netloc}/"

def determine_logical_parent(current_url, discovered_from_url, start_url):
    """
    Determine the logical parent based on URL structure, not just discovery order
    """
    try:
        current_parsed = urlparse(current_url)
        current_path = current_parsed.path.rstrip('/') if current_parsed.path != '/' else ''
        
        # Special handling for blog posts - they should be children of blog sections
        if '/blog/' in current_path.lower():
            # Find the closest blog parent
            path_parts = current_path.split('/')
            for i in range(len(path_parts) - 1, 0, -1):
                if path_parts[i-1].lower() == 'blog':
                    # Create the blog section URL
                    blog_parent_path = '/'.join(path_parts[:i])
                    blog_parent_url = f"{current_parsed.scheme}://{current_parsed.netloc}{blog_parent_path}"
                    return blog_parent_url
        
        # For regular pages, find the immediate parent based on URL structure
        if current_path and current_path != '/':
            path_parts = [p for p in current_path.split('/') if p]
            if len(path_parts) > 1:
                # Parent is one level up
                parent_path = '/' + '/'.join(path_parts[:-1])
                parent_url = f"{current_parsed.scheme}://{current_parsed.netloc}{parent_path}"
                return parent_url
            else:
                # Direct child of homepage
                return start_url
        
        # Homepage has no parent
        return None
        
    except Exception as e:
        print(f"Error determining logical parent for {current_url}: {e}")
        return discovered_from_url  # Fallback to discovery-based parent

def calculate_url_depth(url, start_url):
    """
    Calculate proper depth based on URL path structure
    """
    # Normalize both URLs for consistent comparison
    normalized_url = normalize_url(url)
    normalized_start = normalize_url(start_url)
    
    start_parsed = urlparse(normalized_start)
    url_parsed = urlparse(normalized_url)
    
    # Homepage is always depth 0
    if url_parsed.path in ['/', '']:
        return 0
    
    # Count path segments (excluding empty ones)
    path_segments = [seg for seg in url_parsed.path.strip('/').split('/') if seg]
    
    # Depth is number of path segments
    return len(path_segments)

def calculate_priority(url, depth):
    """
    Calculate priority based on URL structure and depth
    """
    if depth == 0:
        return 1.0
    elif depth == 1:
        return 0.8
    elif depth == 2:
        return 0.6
    else:
        return 0.4

def count_pages(nodes):
    """
    Count total pages in sitemap
    """
    count = len(nodes)
    for node in nodes:
        count += count_pages(node.get('children', []))
    return count
