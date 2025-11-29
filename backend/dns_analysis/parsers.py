"""
Parsing functions to extract data from DNS analysis full_results JSON
"""

from .models import DNSAnalysis


def parse_dns_data(dns_analysis: DNSAnalysis) -> None:
    """
    Parse data from DNSAnalysis.full_results and populate table columns.
    
    Args:
        dns_analysis: DNSAnalysis instance to parse data for
    """
    full_results = dns_analysis.full_results
    
    if not full_results:
        print("[ParseDNS] No full_results to parse")
        return
    
    if not isinstance(full_results, dict):
        print(f"[ParseDNS] full_results is not a dict: {type(full_results)}")
        return
    
    print(f"[ParseDNS] Parsing DNS data for DNSAnalysis {dns_analysis.id}")
    print(f"[ParseDNS] full_results keys: {list(full_results.keys())[:20] if isinstance(full_results, dict) else 'Not a dict'}")
    
    update_fields = []
    
    # Check if data is nested under 'dns' key (real API response format)
    dns_data = full_results.get('dns', {})
    has_nested_structure = bool(dns_data)
    
    if has_nested_structure:
        print(f"[ParseDNS] Found nested 'dns' structure, extracting from dns.*")
        # Extract from nested structure (real API format)
        # A records (IPv4)
        if 'ipv4' in dns_data:
            a_records = dns_data['ipv4']
            if isinstance(a_records, list) and dns_analysis.a_records != a_records:
                dns_analysis.a_records = a_records
                update_fields.append('a_records')
        
        # AAAA records (IPv6)
        if 'ipv6' in dns_data:
            aaaa_records = dns_data['ipv6']
            if isinstance(aaaa_records, list) and dns_analysis.aaaa_records != aaaa_records:
                dns_analysis.aaaa_records = aaaa_records
                update_fields.append('aaaa_records')
        
        # MX records
        if 'mx' in dns_data:
            mx_data = dns_data['mx']
            # MX records might be strings like "10 mail.example.com" or objects
            if isinstance(mx_data, list):
                # Convert string format to object format if needed
                mx_records = []
                for mx in mx_data:
                    if isinstance(mx, str):
                        # Parse "10 mail.example.com" format
                        parts = mx.split(' ', 1)
                        if len(parts) == 2:
                            mx_records.append({'priority': int(parts[0]), 'host': parts[1]})
                        else:
                            mx_records.append({'host': mx})
                    else:
                        mx_records.append(mx)
                if dns_analysis.mx_records != mx_records:
                    dns_analysis.mx_records = mx_records
                    update_fields.append('mx_records')
        
        # NS records
        if 'ns' in dns_data:
            ns_records = dns_data['ns']
            if isinstance(ns_records, list) and dns_analysis.ns_records != ns_records:
                dns_analysis.ns_records = ns_records
                update_fields.append('ns_records')
        
        # TXT records
        if 'txt' in dns_data:
            txt_records = dns_data['txt']
            if isinstance(txt_records, list) and dns_analysis.txt_records != txt_records:
                dns_analysis.txt_records = txt_records
                update_fields.append('txt_records')
        
        # CNAME records
        if 'cname' in dns_data:
            cname_records = dns_data['cname']
            if isinstance(cname_records, list) and dns_analysis.cname_records != cname_records:
                dns_analysis.cname_records = cname_records
                update_fields.append('cname_records')
        
        # SOA record
        if 'soa' in dns_data:
            soa_data = dns_data['soa']
            if isinstance(soa_data, dict) and soa_data and dns_analysis.soa_record != soa_data:
                dns_analysis.soa_record = soa_data
                update_fields.append('soa_record')
        
        # SRV records
        if 'srv' in dns_data:
            srv_records = dns_data['srv']
            if isinstance(srv_records, list) and dns_analysis.srv_records != srv_records:
                dns_analysis.srv_records = srv_records
                update_fields.append('srv_records')
        
        # PTR records (usually not in DNS queries, but check anyway)
        if 'ptr' in dns_data:
            ptr_records = dns_data['ptr']
            if isinstance(ptr_records, list) and dns_analysis.ptr_records != ptr_records:
                dns_analysis.ptr_records = ptr_records
                update_fields.append('ptr_records')
    
    else:
        # Extract from flat structure (legacy/test format)
        print(f"[ParseDNS] Using flat structure (legacy format)")
        record_fields = [
            'a_records', 'aaaa_records', 'mx_records', 'txt_records',
            'cname_records', 'ns_records', 'soa_record', 'ptr_records', 'srv_records'
        ]
        
        for field in record_fields:
            if field in full_results:
                value = full_results[field]
                current_value = getattr(dns_analysis, field)
                if value != current_value:
                    setattr(dns_analysis, field, value)
                    update_fields.append(field)
    
    # Extract response time (check both nested and flat)
    response_time = full_results.get('response_time_ms') or full_results.get('responseTime')
    if response_time and dns_analysis.response_time_ms != response_time:
        dns_analysis.response_time_ms = response_time
        update_fields.append('response_time_ms')
    
    # Extract DNS server info (check both nested and flat)
    dns_server = full_results.get('dns_server') or full_results.get('dnsServer')
    if dns_server and dns_analysis.dns_server != dns_server:
        dns_analysis.dns_server = dns_server
        update_fields.append('dns_server')
    
    dns_server_ip = full_results.get('dns_server_ip') or full_results.get('dnsServerIP')
    if dns_server_ip and dns_analysis.dns_server_ip != dns_server_ip:
        dns_analysis.dns_server_ip = dns_server_ip
        update_fields.append('dns_server_ip')
    
    # Extract health score (check both nested and flat)
    health_score = full_results.get('dns_health_score') or full_results.get('healthScore') or full_results.get('dns_health_score')
    if health_score and dns_analysis.dns_health_score != health_score:
        dns_analysis.dns_health_score = health_score
        update_fields.append('dns_health_score')
    
    # Extract issues and recommendations
    if 'issues' in full_results:
        issues = full_results['issues']
        if isinstance(issues, list) and dns_analysis.issues != issues:
            dns_analysis.issues = issues
            update_fields.append('issues')
    
    if 'recommendations' in full_results:
        recommendations = full_results['recommendations']
        if isinstance(recommendations, list) and dns_analysis.recommendations != recommendations:
            dns_analysis.recommendations = recommendations
            update_fields.append('recommendations')
    
    if update_fields:
        dns_analysis.save(update_fields=update_fields)
        print(f"[ParseDNS] [OK] Updated {len(update_fields)} fields: {', '.join(update_fields)}")
    else:
        print("[ParseDNS] [OK] No fields to update (data already parsed or missing)")

