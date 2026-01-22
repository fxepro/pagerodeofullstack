"""
API views for Security Tools management
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from typing import Dict
import logging
import shutil
import requests
from users.permission_classes import HasFeaturePermission
from .models import SecurityTool
from .serializers import SecurityToolSerializer
from .tool_checker import check_tool_installation

logger = logging.getLogger(__name__)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def tools_list(request):
    """List all security tools or update a tool"""
    try:
        if request.method == 'GET':
            tools = SecurityTool.objects.all().order_by('name')
            
            # Check actual installation status for each tool
            tools_data = []
            for tool in tools:
                # Check actual installation
                check_result = check_tool_installation(
                    tool.name,
                    tool.tool_type,
                    tool.executable_path
                )
                
                # Update tool status based on check
                if check_result['installed']:
                    if tool.status != check_result['status']:
                        tool.status = check_result['status']
                        tool.save(update_fields=['status'])
                    if check_result.get('path') and not tool.executable_path:
                        tool.executable_path = check_result['path']
                        tool.save(update_fields=['executable_path'])
                
                serializer = SecurityToolSerializer(tool)
                tool_data = serializer.data
                
                # Add real-time status info
                tool_data['actual_status'] = {
                    'installed': check_result['installed'],
                    'status': check_result['status'],
                    'message': check_result['message'],
                    'version': check_result.get('version'),
                    'path': check_result.get('path')
                }
                
                tools_data.append(tool_data)
            
            return Response(tools_data)
        
        elif request.method in ['PUT', 'PATCH']:
            # This would be for bulk update - not implemented yet
            return Response({'error': 'Bulk update not supported'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"[SecurityTools] Error in tools_list: {str(e)}", exc_info=True)
        import traceback
        traceback.print_exc()
        # Return empty list if table doesn't exist yet
        return Response([], status=status.HTTP_200_OK)


@api_view(['GET', 'PUT', 'PATCH', 'POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def tool_detail(request, pk):
    """Get, update, or test a specific security tool"""
    try:
        tool = SecurityTool.objects.get(pk=pk)
    except SecurityTool.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = SecurityToolSerializer(tool)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        if not request.user.has_perm('security_monitoring.edit'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SecurityToolSerializer(tool, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'POST':
        # Test tool
        if request.data.get('action') == 'test':
            # Test if tool is available/working
            test_result = test_security_tool(tool)
            tool.last_tested = timezone.now()
            tool.test_result = test_result.get('message', '')
            if test_result.get('success'):
                tool.status = 'configured' if tool.tool_type != 'builtin' else 'available'
            else:
                tool.status = 'error'
            tool.save()
            
            serializer = SecurityToolSerializer(tool)
            return Response({
                'tool': serializer.data,
                'test_result': test_result
            })
        
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


def test_security_tool(tool: SecurityTool) -> Dict:
    """
    Test if a security tool is available and working
    
    Args:
        tool: SecurityTool instance to test
        
    Returns:
        Dict with test results
    """
    if tool.tool_type == 'builtin':
        return {
            'success': True,
            'message': 'Built-in tool is always available'
        }
    
    elif tool.tool_type == 'external':
        executable = tool.executable_path or tool.name.lower()
        
        # Check if executable exists in PATH
        if shutil.which(executable):
            return {
                'success': True,
                'message': f'{tool.name} is installed and available in PATH'
            }
        else:
            return {
                'success': False,
                'message': f'{tool.name} not found in PATH. Install it or set executable_path.'
            }
    
    elif tool.tool_type == 'api':
        # Test API connection
        try:
            if tool.api_url:
                response = requests.get(tool.api_url, timeout=5)
                if response.status_code in [200, 401, 403]:  # 401/403 means API exists
                    return {
                        'success': True,
                        'message': f'API endpoint is reachable'
                    }
                else:
                    return {
                        'success': False,
                        'message': f'API returned status {response.status_code}'
                    }
            else:
                return {
                    'success': False,
                    'message': 'API URL not configured'
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'API test failed: {str(e)}'
            }
    
    return {
        'success': False,
        'message': 'Unknown tool type'
    }

