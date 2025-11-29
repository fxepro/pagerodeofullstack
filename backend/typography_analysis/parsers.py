"""
Parsing functions to extract data from Typography analysis full_results JSON
"""

from .models import TypographyAnalysis


def parse_typography_data(typography_analysis: TypographyAnalysis) -> None:
    """
    Parse data from TypographyAnalysis.full_results and populate table columns.
    
    Args:
        typography_analysis: TypographyAnalysis instance to parse data for
    """
    full_results = typography_analysis.full_results
    
    if not full_results:
        print("[ParseTypography] No full_results to parse")
        return
    
    if not isinstance(full_results, dict):
        print(f"[ParseTypography] full_results is not a dict: {type(full_results)}")
        return
    
    print(f"[ParseTypography] Parsing Typography data for TypographyAnalysis {typography_analysis.id}")
    print(f"[ParseTypography] full_results keys: {list(full_results.keys())[:20] if isinstance(full_results, dict) else 'Not a dict'}")
    
    update_fields = []
    
    # Helper function to get value with camelCase/snake_case fallback
    def get_value(key_snake, key_camel=None):
        if key_camel is None:
            # Convert snake_case to camelCase
            key_camel = ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(key_snake.split('_')))
            key_camel = key_camel[0].lower() + key_camel[1:] if key_camel else key_camel
        return full_results.get(key_snake) or full_results.get(key_camel)
    
    # Extract font data (handle both camelCase and snake_case)
    font_field_mapping = {
        'fonts_used': 'fontsUsed',
        'font_sizes': 'fontSizes',
        'font_weights': 'fontWeights',
        'line_heights': 'lineHeights',
        'font_families': 'fontFamilies'
    }
    
    for field_snake, field_camel in font_field_mapping.items():
        value = get_value(field_snake, field_camel)
        if value and isinstance(value, list):
            current_value = getattr(typography_analysis, field_snake)
            if value != current_value:
                setattr(typography_analysis, field_snake, value)
                update_fields.append(field_snake)
    
    # Extract typography metrics
    total_fonts = get_value('total_fonts', 'totalFonts')
    if total_fonts is not None and typography_analysis.total_fonts != total_fonts:
        typography_analysis.total_fonts = total_fonts
        update_fields.append('total_fonts')
    
    total_font_sizes = get_value('total_font_sizes', 'totalFontSizes')
    if total_font_sizes is not None and typography_analysis.total_font_sizes != total_font_sizes:
        typography_analysis.total_font_sizes = total_font_sizes
        update_fields.append('total_font_sizes')
    
    min_font_size = get_value('min_font_size', 'minFontSize')
    if min_font_size is not None and typography_analysis.min_font_size != min_font_size:
        typography_analysis.min_font_size = min_font_size
        update_fields.append('min_font_size')
    
    max_font_size = get_value('max_font_size', 'maxFontSize')
    if max_font_size is not None and typography_analysis.max_font_size != max_font_size:
        typography_analysis.max_font_size = max_font_size
        update_fields.append('max_font_size')
    
    avg_font_size = get_value('avg_font_size', 'avgFontSize')
    if avg_font_size is not None and typography_analysis.avg_font_size != avg_font_size:
        typography_analysis.avg_font_size = avg_font_size
        update_fields.append('avg_font_size')
    
    health_score = get_value('health_score', 'healthScore')
    if health_score is not None and typography_analysis.health_score != health_score:
        typography_analysis.health_score = health_score
        update_fields.append('health_score')
    
    issues = get_value('issues')
    if issues and isinstance(issues, list) and typography_analysis.issues != issues:
        typography_analysis.issues = issues
        update_fields.append('issues')
    
    recommendations = get_value('recommendations')
    if recommendations and isinstance(recommendations, list) and typography_analysis.recommendations != recommendations:
        typography_analysis.recommendations = recommendations
        update_fields.append('recommendations')
    
    accessibility_issues = get_value('accessibility_issues', 'accessibilityIssues')
    if accessibility_issues and isinstance(accessibility_issues, list) and typography_analysis.accessibility_issues != accessibility_issues:
        typography_analysis.accessibility_issues = accessibility_issues
        update_fields.append('accessibility_issues')
    
    if update_fields:
        typography_analysis.save(update_fields=update_fields)
        print(f"[ParseTypography] [OK] Updated {len(update_fields)} fields: {', '.join(update_fields)}")
    else:
        print("[ParseTypography] [OK] No fields to update (data already parsed or missing)")

