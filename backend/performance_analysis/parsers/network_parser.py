"""
Network requests parser for Lighthouse data.

Extracts waterfall chart data from Lighthouse results.
"""

from typing import List
from ..models import NetworkRequest
from .base_normalizer import normalize_lighthouse_json


def parse_network_requests(performance_analysis, lighthouse_data):
    """
    Parse network requests from Lighthouse data and create NetworkRequest objects.
    
    Args:
        performance_analysis: PerformanceAnalysis instance
        lighthouse_data: Raw Lighthouse JSON data
        
    Returns:
        List of created NetworkRequest objects
    """
    if not lighthouse_data:
        print("[ParseNetworkRequests] No lighthouse_data")
        return []
    
    # Normalize the JSON structure
    lighthouse_result = normalize_lighthouse_json(lighthouse_data)
    if not lighthouse_result or not isinstance(lighthouse_result, dict):
        print("[ParseNetworkRequests] Failed to normalize lighthouse_data or result is not a dict")
        return []
    
    # DEBUG: Log the structure we're working with
    print(f"[ParseNetworkRequests] lighthouse_result keys: {list(lighthouse_result.keys())[:20]}")
    
    # Try multiple possible locations for network requests
    network_requests_data = lighthouse_result.get('networkRequests', [])
    print(f"[ParseNetworkRequests] Checked lighthouseResult.networkRequests: {len(network_requests_data) if network_requests_data else 0} found")
    
    # If not found, try in audits
    if not network_requests_data:
        audits = lighthouse_result.get('audits', {})
        print(f"[ParseNetworkRequests] Checking audits, available audit keys: {list(audits.keys())[:10] if isinstance(audits, dict) else 'Not a dict'}")
        network_audit = audits.get('network-requests', {})
        if network_audit:
            details = network_audit.get('details', {})
            network_requests_data = details.get('items', [])
            print(f"[ParseNetworkRequests] Found in audits['network-requests']['details']['items']: {len(network_requests_data)}")
    
    # If still not found, try in loadingExperience
    if not network_requests_data:
        loading_experience = lighthouse_result.get('loadingExperience', {})
        network_requests_data = loading_experience.get('networkRequests', [])
        print(f"[ParseNetworkRequests] Checked loadingExperience.networkRequests: {len(network_requests_data) if network_requests_data else 0} found")
    
    print(f"[ParseNetworkRequests] Final count: {len(network_requests_data)} network requests")
    
    if not network_requests_data:
        print("[ParseNetworkRequests] No network requests data found")
        return []
    
    # Get audit_report from performance_analysis for direct linking
    audit_report = performance_analysis.audit_report
    
    network_requests = []
    for idx, request in enumerate(network_requests_data):
        try:
            # Extract timing information
            # Note: startTime/endTime can be at request level OR in timing object
            timing = request.get('timing', {})
            
            # Get startTime/endTime - check both locations
            start_time_seconds = request.get('startTime') or timing.get('startTime', 0)
            end_time_seconds = request.get('endTime') or timing.get('endTime', 0)
            
            # Convert to milliseconds
            start_time = start_time_seconds * 1000 if start_time_seconds else 0
            end_time = end_time_seconds * 1000 if end_time_seconds else 0
            duration = end_time - start_time if start_time and end_time else 0
            
            # Calculate timing breakdown (all in seconds, convert to ms)
            dns_start = timing.get('dnsStart')
            dns_end = timing.get('dnsEnd')
            dns_time = (dns_end - dns_start) * 1000 if (dns_start is not None and dns_end is not None) else None
            
            connect_start = timing.get('connectStart')
            connect_end = timing.get('connectEnd')
            connect_time = (connect_end - connect_start) * 1000 if (connect_start is not None and connect_end is not None) else None
            
            ssl_start = timing.get('sslStart')
            ssl_end = timing.get('sslEnd')
            ssl_time = (ssl_end - ssl_start) * 1000 if (ssl_start is not None and ssl_end is not None) else None
            
            send_start = timing.get('sendStart')
            send_end = timing.get('sendEnd')
            send_time = (send_end - send_start) * 1000 if (send_start is not None and send_end is not None) else None
            
            receive_headers_end = timing.get('receiveHeadersEnd')
            wait_time = (receive_headers_end - send_end) * 1000 if (send_end is not None and receive_headers_end is not None) else None
            
            receive_time = (end_time_seconds - receive_headers_end) * 1000 if (receive_headers_end is not None and end_time_seconds) else None
            
            # Calculate compression ratio
            transfer_size = request.get('transferSize', 0)
            resource_size = request.get('resourceSize', 0)
            compression_ratio = (resource_size / transfer_size) if transfer_size > 0 else None
            
            # Extract initiator info
            initiator = request.get('initiator', {})
            initiator_type = initiator.get('type') if isinstance(initiator, dict) else None
            initiator_url = initiator.get('url') if isinstance(initiator, dict) else None
            
            # Create NetworkRequest record (waterfall chart data)
            # Mapping: Google JSON field -> Model field
            network_request = NetworkRequest.objects.create(
                performance_analysis=performance_analysis,
                audit_report=audit_report,  # Direct link to audit report
                # Basic Info: networkRequests[].url -> url
                url=request.get('url', ''),
                # Basic Info: networkRequests[].resourceType -> resource_type
                resource_type=request.get('resourceType', 'other'),
                # Basic Info: networkRequests[].mimeType -> mime_type
                mime_type=request.get('mimeType'),
                # Size: networkRequests[].transferSize -> transfer_size
                transfer_size=transfer_size,
                # Size: networkRequests[].resourceSize -> resource_size
                resource_size=resource_size,
                # Size: Calculated -> compression_ratio
                compression_ratio=compression_ratio,
                # Status: networkRequests[].statusCode -> status_code
                status_code=request.get('statusCode'),
                # Status: networkRequests[].protocol -> protocol
                protocol=request.get('protocol'),
                # Timing: networkRequests[].startTime OR timing.startTime -> start_time (ms)
                start_time=start_time,
                # Timing: networkRequests[].endTime OR timing.endTime -> end_time (ms)
                end_time=end_time,
                # Timing: Calculated -> duration (ms)
                duration=duration,
                # Timing: timing.dnsEnd - timing.dnsStart -> dns_time (ms)
                dns_time=dns_time,
                # Timing: timing.sslEnd - timing.sslStart -> ssl_time (ms)
                ssl_time=ssl_time,
                # Timing: timing.connectEnd - timing.connectStart -> connect_time (ms)
                connect_time=connect_time,
                # Timing: timing.sendEnd - timing.sendStart -> send_time (ms)
                send_time=send_time,
                # Timing: timing.receiveHeadersEnd - timing.sendEnd -> wait_time (ms)
                wait_time=wait_time,
                # Timing: timing.endTime - timing.receiveHeadersEnd -> receive_time (ms)
                receive_time=receive_time,
                # Priority: networkRequests[].priority -> priority
                priority=request.get('priority'),
                # Priority: networkRequests[].renderBlockingStatus -> render_blocking_status
                render_blocking_status=request.get('renderBlockingStatus'),
                # Initiator: networkRequests[].initiator.type -> initiator_type
                initiator_type=initiator_type,
                # Initiator: networkRequests[].initiator.url -> initiator_url
                initiator_url=initiator_url,
                # Cache: networkRequests[].fromCache -> from_cache
                from_cache=request.get('fromCache', False),
                # Cache: networkRequests[].fromServiceWorker -> from_service_worker
                from_service_worker=request.get('fromServiceWorker', False),
                # Ordering: sequence index -> sequence
                sequence=idx
            )
            network_requests.append(network_request)
        except Exception as e:
            print(f"[ParseNetworkRequests] [ERROR] Error parsing request {idx}: {e}")
            import traceback
            print(f"[ParseNetworkRequests] Request data: {str(request)[:300]}")
            print(traceback.format_exc())
            continue
    
    print(f"[ParseNetworkRequests] [OK] Successfully created {len(network_requests)} NetworkRequest records")
    return network_requests

