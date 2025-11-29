"""
Category scores parser for Lighthouse data.

Extracts and stores category scores (Performance, SEO, Accessibility, Best Practices).
"""

from ..models import PerformanceAnalysis


def parse_category_scores(performance_analysis: PerformanceAnalysis, lighthouse_result: dict) -> None:
    """
    Extract and store category scores from Lighthouse results.
    
    Categories include: Performance, SEO, Accessibility, Best Practices, PWA
    
    Args:
        performance_analysis: PerformanceAnalysis instance to update
        lighthouse_result: Normalized Lighthouse result dict
    """
    if not lighthouse_result or not isinstance(lighthouse_result, dict):
        print("[ParseCategoryScores] No lighthouse_result or not a dict")
        return
    
    categories = lighthouse_result.get("categories", {})
    if not categories:
        print("[ParseCategoryScores] No categories found in lighthouse_result")
        return
    
    # Extract category scores (Lighthouse returns scores as 0-1, we store as 0-100)
    accessibility_score = None
    best_practices_score = None
    seo_score = None
    
    if "accessibility" in categories:
        acc_score = categories["accessibility"].get("score")
        if acc_score is not None:
            accessibility_score = int(acc_score * 100)
    
    if "best-practices" in categories:
        bp_score = categories["best-practices"].get("score")
        if bp_score is not None:
            best_practices_score = int(bp_score * 100)
    elif "bestPractices" in categories:
        bp_score = categories["bestPractices"].get("score")
        if bp_score is not None:
            best_practices_score = int(bp_score * 100)
    
    if "seo" in categories:
        seo_score_val = categories["seo"].get("score")
        if seo_score_val is not None:
            seo_score = int(seo_score_val * 100)
    
    # Update the performance analysis with category scores
    update_fields = []
    if accessibility_score is not None:
        performance_analysis.accessibility_score = accessibility_score
        update_fields.append('accessibility_score')
    if best_practices_score is not None:
        performance_analysis.best_practices_score = best_practices_score
        update_fields.append('best_practices_score')
    if seo_score is not None:
        performance_analysis.seo_score = seo_score
        update_fields.append('seo_score')
    
    if update_fields:
        performance_analysis.save(update_fields=update_fields)
        print(f"[ParseCategoryScores] [OK] Stored category scores: accessibility={accessibility_score}, best_practices={best_practices_score}, seo={seo_score}")
    else:
        print("[ParseCategoryScores] ⚠️ No category scores found to store")

