"""
Performance timeline events parser for Lighthouse data.

Extracts trace events for performance timeline visualization.
"""

from typing import List
from ..models import PerformanceTimelineEvent
from .base_normalizer import normalize_lighthouse_json


def parse_timeline_events(performance_analysis, lighthouse_data):
    """
    Parse performance timeline events from Lighthouse data.
    
    Creates timeline events from:
    1. Audit milestones (First Paint, FCP, LCP, DOM Content Loaded, Load Complete) - ALWAYS available
    2. traceEvents (if available in JSON) - may not be available from PageSpeed API
    
    Args:
        performance_analysis: PerformanceAnalysis instance
        lighthouse_data: Raw Lighthouse JSON data
        
    Returns:
        List of created PerformanceTimelineEvent objects
    """
    if not lighthouse_data:
        print("[ParseTimelineEvents] No lighthouse_data")
        return []
    
    # Normalize the JSON structure
    lighthouse_result = normalize_lighthouse_json(lighthouse_data)
    if not lighthouse_result or not isinstance(lighthouse_result, dict):
        print("[ParseTimelineEvents] Failed to normalize lighthouse_data or result is not a dict")
        return []
    
    # Get audit_report from performance_analysis for direct linking
    audit_report = performance_analysis.audit_report
    timeline_events = []
    sequence = 0
    
    # Get audits for milestone events (these are what the frontend displays)
    audits = lighthouse_result.get('audits', {})
    
    # Define timeline milestones that match what's displayed in the frontend
    timeline_milestones = [
        {
            'name': 'First Paint',
            'audit_key': 'first-meaningful-paint',
            'category': 'paint',
            'description': 'The first pixel is painted to the screen'
        },
        {
            'name': 'First Contentful Paint',
            'audit_key': 'first-contentful-paint',
            'category': 'paint',
            'description': 'The first content element is painted'
        },
        {
            'name': 'Largest Contentful Paint',
            'audit_key': 'largest-contentful-paint',
            'category': 'paint',
            'description': 'The largest content element is painted'
        },
        {
            'name': 'DOM Content Loaded',
            'audit_key': 'interactive',
            'category': 'navigation',
            'description': 'HTML parsing is complete and DOM is ready'
        },
        {
            'name': 'Load Complete',
            'audit_key': 'speed-index',
            'category': 'navigation',
            'description': 'All resources have finished loading'
        },
    ]
    
    # Create timeline events from audit milestones (these are always available)
    for milestone in timeline_milestones:
        audit = audits.get(milestone['audit_key'], {})
        numeric_value = audit.get('numericValue')
        
        if numeric_value is not None:
            # Convert milliseconds to microseconds for timestamp
            timestamp_ms = numeric_value
            timestamp_us = timestamp_ms * 1000  # Convert to microseconds
            
            try:
                timeline_event = PerformanceTimelineEvent.objects.create(
                    performance_analysis=performance_analysis,
                    audit_report=audit_report,
                    name=milestone['name'],
                    category=milestone['category'],
                    timestamp=timestamp_us,
                    duration=None,  # Milestones are instant events
                    phase='I',  # Instant event
                    pid=None,
                    tid=None,
                    sequence=sequence,
                    data={
                        'description': milestone['description'],
                        'value_ms': timestamp_ms,
                        'audit_key': milestone['audit_key'],
                        'source': 'audit'
                    }
                )
                timeline_events.append(timeline_event)
                sequence += 1
            except Exception as e:
                print(f"[ParseTimelineEvents] [ERROR] Error creating milestone {milestone['name']}: {e}")
                continue
    
    print(f"[ParseTimelineEvents] Created {len(timeline_events)} timeline milestone events from audits")
    
    # Also try to parse traceEvents if available (may not be in PageSpeed API response)
    trace_events = lighthouse_result.get('traceEvents', [])
    
    # If not found, check if it's nested in lighthouseResult
    if not trace_events and 'lighthouseResult' in lighthouse_result:
        nested_lhr = lighthouse_result.get('lighthouseResult', {})
        if isinstance(nested_lhr, dict):
            trace_events = nested_lhr.get('traceEvents', [])
    
    # If still not found, check the original lighthouse_data
    if not trace_events and isinstance(lighthouse_data, dict):
        if 'lighthouseResult' in lighthouse_data:
            lhr = lighthouse_data.get('lighthouseResult', {})
            if isinstance(lhr, dict):
                trace_events = lhr.get('traceEvents', [])
        elif 'traceEvents' in lighthouse_data:
            trace_events = lighthouse_data.get('traceEvents', [])
    
    # Parse traceEvents if available
    if trace_events:
        print(f"[ParseTimelineEvents] Found {len(trace_events)} traceEvents, parsing...")
        for event in trace_events:
            try:
                name = event.get('name', '')
                category = event.get('cat', 'other')
                timestamp = event.get('ts', 0)  # Already in microseconds
                duration = event.get('dur', None)
                phase = event.get('ph', 'I')
                pid = event.get('pid')
                tid = event.get('tid')
                args = event.get('args', {})
                
                # Map category
                category_map = {
                    'navigation': 'navigation',
                    'paint': 'paint',
                    'measure': 'measure',
                    'mark': 'mark',
                    'script': 'script',
                    'layout': 'layout',
                }
                mapped_category = category_map.get(category.split(',')[0] if ',' in category else category, 'other')
                
                timeline_event = PerformanceTimelineEvent.objects.create(
                    performance_analysis=performance_analysis,
                    audit_report=audit_report,
                    name=name,
                    category=mapped_category,
                    timestamp=timestamp,
                    duration=duration,
                    phase=phase,
                    pid=pid,
                    tid=tid,
                    sequence=sequence,
                    data=args if isinstance(args, dict) else {'source': 'traceEvent'}
                )
                timeline_events.append(timeline_event)
                sequence += 1
            except Exception as e:
                print(f"[ParseTimelineEvents] [ERROR] Error parsing traceEvent {sequence}: {e}")
                continue
    
    print(f"[ParseTimelineEvents] [OK] Successfully created {len(timeline_events)} PerformanceTimelineEvent records total")
    return timeline_events

