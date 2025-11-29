"""
Parsing functions to extract data from SSL analysis full_results JSON
"""

from .models import SSLAnalysis
from datetime import datetime


def parse_ssl_data(ssl_analysis: SSLAnalysis) -> None:
    """
    Parse data from SSLAnalysis.full_results and populate table columns.
    
    Args:
        ssl_analysis: SSLAnalysis instance to parse data for
    """
    full_results = ssl_analysis.full_results
    
    if not full_results:
        print("[ParseSSL] No full_results to parse")
        return
    
    if not isinstance(full_results, dict):
        print(f"[ParseSSL] full_results is not a dict: {type(full_results)}")
        return
    
    print(f"[ParseSSL] Parsing SSL data for SSLAnalysis {ssl_analysis.id}")
    print(f"[ParseSSL] full_results type: {type(full_results)}")
    if isinstance(full_results, dict):
        print(f"[ParseSSL] full_results keys: {list(full_results.keys())[:30]}")
        # Show sample values for debugging
        for key in list(full_results.keys())[:10]:
            value = full_results[key]
            print(f"[ParseSSL]   {key}: {type(value).__name__} = {str(value)[:100]}")
    else:
        print(f"[ParseSSL] full_results is not a dict: {full_results}")
    
    update_fields = []
    
    # Helper function to get value with camelCase/snake_case fallback
    def get_value(key_snake, key_camel=None):
        if key_camel is None:
            # Convert snake_case to camelCase
            key_camel = ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(key_snake.split('_')))
            key_camel = key_camel[0].lower() + key_camel[1:] if key_camel else key_camel
        value = full_results.get(key_snake) or full_results.get(key_camel)
        if value is not None:
            print(f"[ParseSSL] Found {key_snake} (or {key_camel}): {type(value).__name__} = {str(value)[:50]}")
        return value
    
    # Extract basic fields (handle both camelCase and snake_case)
    is_valid = get_value('is_valid', 'isValid')
    if is_valid is not None and ssl_analysis.is_valid != is_valid:
        ssl_analysis.is_valid = is_valid
        update_fields.append('is_valid')
    
    expires_at = get_value('expires_at', 'expiresAt')
    if expires_at:
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            except:
                expires_at = None
        if expires_at and ssl_analysis.expires_at != expires_at:
            ssl_analysis.expires_at = expires_at
            update_fields.append('expires_at')
    
    days_until_expiry = get_value('days_until_expiry', 'daysUntilExpiry')
    if days_until_expiry is not None and ssl_analysis.days_until_expiry != days_until_expiry:
        ssl_analysis.days_until_expiry = days_until_expiry
        update_fields.append('days_until_expiry')
    
    issuer = get_value('issuer')
    if issuer and ssl_analysis.issuer != issuer:
        ssl_analysis.issuer = issuer
        update_fields.append('issuer')
    
    subject = get_value('subject')
    if subject and ssl_analysis.subject != subject:
        ssl_analysis.subject = subject
        update_fields.append('subject')
    
    serial_number = get_value('serial_number', 'serialNumber')
    if serial_number and ssl_analysis.serial_number != serial_number:
        ssl_analysis.serial_number = serial_number
        update_fields.append('serial_number')
    
    root_ca_valid = get_value('root_ca_valid', 'rootCAValid')
    if root_ca_valid is not None and ssl_analysis.root_ca_valid != root_ca_valid:
        ssl_analysis.root_ca_valid = root_ca_valid
        update_fields.append('root_ca_valid')
    
    intermediate_valid = get_value('intermediate_valid', 'intermediateValid')
    if intermediate_valid is not None and ssl_analysis.intermediate_valid != intermediate_valid:
        ssl_analysis.intermediate_valid = intermediate_valid
        update_fields.append('intermediate_valid')
    
    certificate_valid = get_value('certificate_valid', 'certificateValid')
    if certificate_valid is not None and ssl_analysis.certificate_valid != certificate_valid:
        ssl_analysis.certificate_valid = certificate_valid
        update_fields.append('certificate_valid')
    
    protocol = get_value('protocol')
    if protocol and ssl_analysis.protocol != protocol:
        ssl_analysis.protocol = protocol
        update_fields.append('protocol')
    
    cipher_suite = get_value('cipher_suite', 'cipherSuite')
    if cipher_suite and ssl_analysis.cipher_suite != cipher_suite:
        ssl_analysis.cipher_suite = cipher_suite
        update_fields.append('cipher_suite')
    
    cert_chain = get_value('certificate_chain', 'certificateChain')
    if cert_chain and isinstance(cert_chain, list) and ssl_analysis.certificate_chain != cert_chain:
        ssl_analysis.certificate_chain = cert_chain
        update_fields.append('certificate_chain')
    
    san_domains = get_value('san_domains', 'sanDomains')
    if san_domains and isinstance(san_domains, list) and ssl_analysis.san_domains != san_domains:
        ssl_analysis.san_domains = san_domains
        update_fields.append('san_domains')
    
    ssl_health_score = get_value('ssl_health_score', 'healthScore') or get_value('ssl_health_score', 'sslHealthScore')
    if ssl_health_score is not None and ssl_analysis.ssl_health_score != ssl_health_score:
        ssl_analysis.ssl_health_score = ssl_health_score
        update_fields.append('ssl_health_score')
    
    issues = get_value('issues')
    if issues and isinstance(issues, list) and ssl_analysis.issues != issues:
        ssl_analysis.issues = issues
        update_fields.append('issues')
    
    recommendations = get_value('recommendations')
    if recommendations and isinstance(recommendations, list) and ssl_analysis.recommendations != recommendations:
        ssl_analysis.recommendations = recommendations
        update_fields.append('recommendations')
    
    if update_fields:
        ssl_analysis.save(update_fields=update_fields)
        print(f"[ParseSSL] [OK] Updated {len(update_fields)} fields: {', '.join(update_fields)}")
    else:
        print("[ParseSSL] [WARNING] No fields to update")
        print("[ParseSSL] Current model values:")
        print(f"  is_valid: {ssl_analysis.is_valid}")
        print(f"  expires_at: {ssl_analysis.expires_at}")
        print(f"  issuer: {ssl_analysis.issuer[:50] if ssl_analysis.issuer else None}")
        print(f"  protocol: {ssl_analysis.protocol}")
        print(f"  ssl_health_score: {ssl_analysis.ssl_health_score}")
        print("[ParseSSL] This might mean:")
        print("  1. Data was already set correctly from view")
        print("  2. Data is missing from full_results")
        print("  3. Data format doesn't match expected keys")

