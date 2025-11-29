"""
Audit details parser for Lighthouse data.

Extracts all individual Lighthouse audit details for analysis.
"""

from ..models import PerformanceAnalysis


def parse_audit_details(performance_analysis: PerformanceAnalysis, lighthouse_result: dict) -> None:
    """
    Parse all audit details from Lighthouse results and store in JSONB field.
    
    This stores all individual audits for later querying and analysis.
    
    Args:
        performance_analysis: PerformanceAnalysis instance to update
        lighthouse_result: Normalized Lighthouse result dict
    """
    if not lighthouse_result or not isinstance(lighthouse_result, dict):
        print("[ParseAuditDetails] No lighthouse_result or not a dict")
        return
    
    audits = lighthouse_result.get("audits", {})
    if not audits:
        print("[ParseAuditDetails] No audits found in lighthouse_result")
        return
    
    # Store audit details in a structured format
    audit_details = {}
    
    for audit_id, audit_data in audits.items():
        if not isinstance(audit_data, dict):
            continue
        
        audit_details[audit_id] = {
            "title": audit_data.get("title", ""),
            "description": audit_data.get("description", ""),
            "score": audit_data.get("score"),
            "numericValue": audit_data.get("numericValue"),
            "numericUnit": audit_data.get("numericUnit"),
            "displayValue": audit_data.get("displayValue"),
            "explanation": audit_data.get("explanation"),
            "details": audit_data.get("details"),
            "id": audit_id
        }
    
    # Store audit details in recommendations field as a structured format
    # Note: This extends the recommendations field to include audit_details
    # The full audit data is also available in full_results JSONField
    if audit_details:
        # Preserve existing recommendations and config_environment if they exist
        current_recommendations = performance_analysis.recommendations
        
        # If recommendations is already a dict, preserve existing structure
        if isinstance(current_recommendations, dict):
            # Update audit_details but keep existing data (recommendations, config_environment)
            current_recommendations["audit_details"] = audit_details
            current_recommendations["audit_count"] = len(audit_details)
            performance_analysis.recommendations = current_recommendations
        elif isinstance(current_recommendations, list):
            # If it's a list, convert to dict format
            performance_analysis.recommendations = {
                "recommendations": current_recommendations,
                "audit_details": audit_details,
                "audit_count": len(audit_details)
            }
        else:
            # If it's None or other format, create new structure
            performance_analysis.recommendations = {
                "recommendations": [],
                "audit_details": audit_details,
                "audit_count": len(audit_details)
            }
        
        performance_analysis.save(update_fields=['recommendations'])
        print(f"[ParseAuditDetails] [OK] Stored {len(audit_details)} audit details")
    else:
        print("[ParseAuditDetails] ⚠️ No audit details to store")

