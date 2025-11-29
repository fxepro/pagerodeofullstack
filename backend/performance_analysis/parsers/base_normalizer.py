"""
Base normalizer for Lighthouse JSON data.

Handles variations in JSON structure from different sources.
"""

import json
from typing import Optional, Dict, Any


def normalize_lighthouse_json(raw: Any) -> Optional[Dict[str, Any]]:
    """
    Normalize Lighthouse JSON to ensure consistent structure.
    
    Lighthouse JSON varies depending on:
    - Mobile vs desktop
    - Throttling preset
    - Google API version
    - Local node build
    
    This function ensures we always get the lighthouseResult object.
    
    Args:
        raw: Raw input (dict, str, or None)
        
    Returns:
        Normalized lighthouse_result dict or None
    """
    if not raw:
        return None
    
    # Handle string input
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            print("[NormalizeLighthouse] Failed to parse JSON string")
            return None
    
    # If it's already a dict and has lighthouseResult, return the normalized structure
    if isinstance(raw, dict):
        if "lighthouseResult" in raw:
            return raw["lighthouseResult"]
        # If it's already the lighthouseResult structure, return as-is
        if "audits" in raw or "categories" in raw or "networkRequests" in raw:
            return raw
    
    return raw

