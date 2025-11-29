"""
Helper utilities for parsing Lighthouse data.

Shared functions used across multiple parsers.
"""

from typing import Dict, Any, Optional


def safe_get(data: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    """
    Safely get nested dictionary values.
    
    Args:
        data: Dictionary to search
        keys: Path of keys to traverse
        default: Default value if path not found
        
    Returns:
        Value at path or default
        
    Example:
        safe_get(data, 'lighthouseResult', 'categories', 'performance', 'score')
    """
    current = data
    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)
            if current is None:
                return default
        else:
            return default
    return current if current is not None else default


def extract_timing_breakdown(timing: Dict[str, Any]) -> Dict[str, Optional[float]]:
    """
    Extract timing breakdown from a timing dict.
    
    Args:
        timing: Timing dictionary from Lighthouse
        
    Returns:
        Dictionary with timing breakdown in milliseconds
    """
    dns_time = None
    if timing.get('dnsStart') is not None:
        dns_time = (timing.get('dnsEnd', 0) - timing.get('dnsStart', 0)) * 1000
    
    connect_time = None
    if timing.get('connectStart') is not None:
        connect_time = (timing.get('connectEnd', 0) - timing.get('connectStart', 0)) * 1000
    
    ssl_time = None
    if timing.get('sslStart') is not None:
        ssl_time = (timing.get('sslEnd', 0) - timing.get('sslStart', 0)) * 1000
    
    send_time = None
    if timing.get('sendStart') is not None:
        send_time = (timing.get('sendEnd', 0) - timing.get('sendStart', 0)) * 1000
    
    wait_time = None
    if timing.get('sendEnd') is not None:
        wait_time = (timing.get('receiveHeadersEnd', 0) - timing.get('sendEnd', 0)) * 1000
    
    receive_time = None
    if timing.get('receiveHeadersEnd') is not None:
        receive_time = (timing.get('endTime', 0) - timing.get('receiveHeadersEnd', 0)) * 1000
    
    return {
        'dns_time': dns_time,
        'connect_time': connect_time,
        'ssl_time': ssl_time,
        'send_time': send_time,
        'wait_time': wait_time,
        'receive_time': receive_time,
    }

