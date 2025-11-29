"""
Parsing functions to extract data from Monitor analysis full_results JSON
"""

from .models import MonitorAnalysis


def parse_monitor_data(monitor_analysis: MonitorAnalysis) -> None:
    """
    Parse data from MonitorAnalysis.full_results and populate table columns.
    
    Args:
        monitor_analysis: MonitorAnalysis instance to parse data for
    """
    full_results = monitor_analysis.full_results
    
    if not full_results:
        print("[ParseMonitor] No full_results to parse")
        return
    
    if not isinstance(full_results, dict):
        print(f"[ParseMonitor] full_results is not a dict: {type(full_results)}")
        return
    
    print(f"[ParseMonitor] Parsing Monitor data for MonitorAnalysis {monitor_analysis.id}")
    
    update_fields = []
    
    # Extract status
    if 'status' in full_results:
        status_value = full_results['status']
        if status_value not in ['up', 'down', 'checking']:
            if status_value in ['online', 'ok', 'success']:
                status_value = 'up'
            elif status_value in ['offline', 'error', 'failed']:
                status_value = 'down'
            else:
                status_value = 'checking'
        if monitor_analysis.status != status_value:
            monitor_analysis.status = status_value
            update_fields.append('status')
    
    if 'statusCode' in full_results and monitor_analysis.status_code != full_results['statusCode']:
        monitor_analysis.status_code = full_results.get('statusCode')
        update_fields.append('status_code')
    
    if 'status_code' in full_results and monitor_analysis.status_code != full_results['status_code']:
        monitor_analysis.status_code = full_results.get('status_code')
        update_fields.append('status_code')
    
    # Extract response time
    response_time = full_results.get('responseTime') or full_results.get('response_time')
    if response_time and monitor_analysis.response_time != response_time:
        monitor_analysis.response_time = response_time
        update_fields.append('response_time')
    
    # Extract SSL info
    ssl_info = full_results.get('ssl') or {}
    if ssl_info:
        if 'valid' in ssl_info and monitor_analysis.ssl_valid != ssl_info['valid']:
            monitor_analysis.ssl_valid = ssl_info.get('valid')
            update_fields.append('ssl_valid')
        
        if 'expiresIn' in ssl_info and monitor_analysis.ssl_expires_in != ssl_info['expiresIn']:
            monitor_analysis.ssl_expires_in = ssl_info.get('expiresIn')
            update_fields.append('ssl_expires_in')
        elif 'expires_in' in ssl_info and monitor_analysis.ssl_expires_in != ssl_info['expires_in']:
            monitor_analysis.ssl_expires_in = ssl_info.get('expires_in')
            update_fields.append('ssl_expires_in')
        
        if 'issuer' in ssl_info and monitor_analysis.ssl_issuer != ssl_info['issuer']:
            monitor_analysis.ssl_issuer = ssl_info.get('issuer', '')
            update_fields.append('ssl_issuer')
    
    # Extract headers
    headers = full_results.get('headers') or {}
    if headers:
        if 'server' in headers and monitor_analysis.server != headers['server']:
            monitor_analysis.server = headers.get('server', '')
            update_fields.append('server')
        
        content_type = headers.get('contentType') or headers.get('content_type')
        if content_type and monitor_analysis.content_type != content_type:
            monitor_analysis.content_type = content_type
            update_fields.append('content_type')
    
    # Extract error message
    error = full_results.get('error') or full_results.get('error_message')
    if error and monitor_analysis.error_message != error:
        monitor_analysis.error_message = error
        update_fields.append('error_message')
    
    # Extract uptime statistics
    if 'uptimePercentage' in full_results and monitor_analysis.uptime_percentage != full_results['uptimePercentage']:
        monitor_analysis.uptime_percentage = full_results.get('uptimePercentage')
        update_fields.append('uptime_percentage')
    elif 'uptime_percentage' in full_results and monitor_analysis.uptime_percentage != full_results['uptime_percentage']:
        monitor_analysis.uptime_percentage = full_results.get('uptime_percentage')
        update_fields.append('uptime_percentage')
    
    if 'totalChecks' in full_results and monitor_analysis.total_checks != full_results['totalChecks']:
        monitor_analysis.total_checks = full_results.get('totalChecks')
        update_fields.append('total_checks')
    elif 'total_checks' in full_results and monitor_analysis.total_checks != full_results['total_checks']:
        monitor_analysis.total_checks = full_results.get('total_checks')
        update_fields.append('total_checks')
    
    if 'successfulChecks' in full_results and monitor_analysis.successful_checks != full_results['successfulChecks']:
        monitor_analysis.successful_checks = full_results.get('successfulChecks')
        update_fields.append('successful_checks')
    elif 'successful_checks' in full_results and monitor_analysis.successful_checks != full_results['successful_checks']:
        monitor_analysis.successful_checks = full_results.get('successful_checks')
        update_fields.append('successful_checks')
    
    if 'failedChecks' in full_results and monitor_analysis.failed_checks != full_results['failedChecks']:
        monitor_analysis.failed_checks = full_results.get('failedChecks')
        update_fields.append('failed_checks')
    elif 'failed_checks' in full_results and monitor_analysis.failed_checks != full_results['failed_checks']:
        monitor_analysis.failed_checks = full_results.get('failed_checks')
        update_fields.append('failed_checks')
    
    # Extract response time statistics
    if 'avgResponseTime' in full_results and monitor_analysis.avg_response_time != full_results['avgResponseTime']:
        monitor_analysis.avg_response_time = full_results.get('avgResponseTime')
        update_fields.append('avg_response_time')
    elif 'avg_response_time' in full_results and monitor_analysis.avg_response_time != full_results['avg_response_time']:
        monitor_analysis.avg_response_time = full_results.get('avg_response_time')
        update_fields.append('avg_response_time')
    
    if 'minResponseTime' in full_results and monitor_analysis.min_response_time != full_results['minResponseTime']:
        monitor_analysis.min_response_time = full_results.get('minResponseTime')
        update_fields.append('min_response_time')
    elif 'min_response_time' in full_results and monitor_analysis.min_response_time != full_results['min_response_time']:
        monitor_analysis.min_response_time = full_results.get('min_response_time')
        update_fields.append('min_response_time')
    
    if 'maxResponseTime' in full_results and monitor_analysis.max_response_time != full_results['maxResponseTime']:
        monitor_analysis.max_response_time = full_results.get('maxResponseTime')
        update_fields.append('max_response_time')
    elif 'max_response_time' in full_results and monitor_analysis.max_response_time != full_results['max_response_time']:
        monitor_analysis.max_response_time = full_results.get('max_response_time')
        update_fields.append('max_response_time')
    
    # Extract health score
    health_score = full_results.get('healthScore') or full_results.get('health_score')
    if health_score and monitor_analysis.health_score != health_score:
        monitor_analysis.health_score = health_score
        update_fields.append('health_score')
    
    # Extract issues and recommendations
    if 'issues' in full_results:
        issues = full_results['issues']
        if isinstance(issues, list) and monitor_analysis.issues != issues:
            monitor_analysis.issues = issues
            update_fields.append('issues')
    
    if 'recommendations' in full_results:
        recommendations = full_results['recommendations']
        if isinstance(recommendations, list) and monitor_analysis.recommendations != recommendations:
            monitor_analysis.recommendations = recommendations
            update_fields.append('recommendations')
    
    if update_fields:
        monitor_analysis.save(update_fields=update_fields)
        print(f"[ParseMonitor] [OK] Updated {len(update_fields)} fields: {', '.join(update_fields)}")
    else:
        print("[ParseMonitor] [OK] No fields to update (data already parsed or missing)")

