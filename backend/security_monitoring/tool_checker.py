"""
Utility functions to check actual installation status of security tools
"""
import os
import shutil
import subprocess
import requests
from pathlib import Path
from typing import Dict, Optional
from django.conf import settings

# Get project root (assuming this is in backend/)
PROJECT_ROOT = Path(settings.BASE_DIR).parent if hasattr(settings, 'BASE_DIR') else Path(__file__).parent.parent.parent
TOOLS_DIR = PROJECT_ROOT / "tools"


def check_tool_installation(tool_name: str, tool_type: str, executable_path: Optional[str] = None) -> Dict:
    """
    Check if a security tool is actually installed and available
    
    Args:
        tool_name: Name of the tool
        tool_type: Type of tool (builtin, external, api)
        executable_path: Optional explicit path to executable
        
    Returns:
        Dict with status information
    """
    if tool_type == 'builtin':
        return {
            'installed': True,
            'status': 'available',
            'message': 'Built-in tool is always available',
            'version': None,
            'path': None
        }
    
    elif tool_type == 'external':
        # Check explicit path first
        if executable_path and os.path.exists(executable_path):
            try:
                version = get_tool_version(executable_path, tool_name)
                return {
                    'installed': True,
                    'status': 'configured',
                    'message': f'{tool_name} found at specified path',
                    'version': version,
                    'path': executable_path
                }
            except Exception as e:
                return {
                    'installed': True,
                    'status': 'error',
                    'message': f'{tool_name} found but error checking version: {str(e)}',
                    'version': None,
                    'path': executable_path
                }
        
        # Check project tools directory
        tool_paths = {
            'nmap': TOOLS_DIR / 'nmap' / 'nmap.exe',
            'amass': TOOLS_DIR / 'amass' / 'amass.exe',
            'nikto': TOOLS_DIR / 'nikto' / 'program' / 'nikto.pl',
            'zap': TOOLS_DIR / 'zap',
            'sqlmap': TOOLS_DIR / 'sqlmap' / 'sqlmap.py',
            'owaspzap': TOOLS_DIR / 'zap',
        }
        
        tool_key = tool_name.lower().replace(' ', '').replace('(', '').replace(')', '').replace('owasp', '').replace('zap', 'zap')
        if 'nmap' in tool_key:
            tool_key = 'nmap'
        elif 'amass' in tool_key:
            tool_key = 'amass'
        elif 'nikto' in tool_key:
            tool_key = 'nikto'
        elif 'zap' in tool_key:
            tool_key = 'zap'
        elif 'sqlmap' in tool_key:
            tool_key = 'sqlmap'
        
        if tool_key in tool_paths:
            tool_path = tool_paths[tool_key]
            if tool_path.exists():
                try:
                    version = get_tool_version(str(tool_path), tool_name)
                    return {
                        'installed': True,
                        'status': 'configured',
                        'message': f'{tool_name} found in project tools',
                        'version': version,
                        'path': str(tool_path)
                    }
                except Exception as e:
                    return {
                        'installed': True,
                        'status': 'configured',
                        'message': f'{tool_name} found in project tools',
                        'version': None,
                        'path': str(tool_path)
                    }
        
        # Check PATH
        executable = executable_path or tool_name.lower()
        if shutil.which(executable):
            try:
                version = get_tool_version(executable, tool_name)
                return {
                    'installed': True,
                    'status': 'configured',
                    'message': f'{tool_name} found in PATH',
                    'version': version,
                    'path': shutil.which(executable)
                }
            except Exception as e:
                return {
                    'installed': True,
                    'status': 'configured',
                    'message': f'{tool_name} found in PATH',
                    'version': None,
                    'path': shutil.which(executable)
                }
        
        return {
            'installed': False,
            'status': 'not_installed',
            'message': f'{tool_name} not found. Install it or set executable_path.',
            'version': None,
            'path': None
        }
    
    elif tool_type == 'api':
        # For API tools, check if endpoint is reachable
        # This would need to be configured per tool
        return {
            'installed': True,  # Assume API tools are always "available"
            'status': 'available',
            'message': 'API tool - check configuration',
            'version': None,
            'path': None
        }
    
    return {
        'installed': False,
        'status': 'unknown',
        'message': 'Unknown tool type',
        'version': None,
        'path': None
    }


def get_tool_version(executable: str, tool_name: str) -> Optional[str]:
    """Get version string from a tool executable"""
    try:
        tool_lower = tool_name.lower()
        
        if 'nmap' in tool_lower:
            result = subprocess.run([executable, '--version'], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'Nmap version' in line:
                        return line.strip()
        
        elif 'amass' in tool_lower:
            result = subprocess.run([executable], capture_output=True, text=True, timeout=5)
            if result.returncode == 0 or result.returncode == 1:  # Amass shows version in banner
                for line in result.stdout.split('\n'):
                    if 'v' in line and any(char.isdigit() for char in line):
                        # Extract version like "v5.0.0"
                        import re
                        version_match = re.search(r'v\d+\.\d+\.\d+', line)
                        if version_match:
                            return version_match.group()
        
        elif 'nikto' in tool_lower:
            # Nikto requires perl
            perl_exe = shutil.which('perl')
            if perl_exe:
                result = subprocess.run([perl_exe, executable, '-Version'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    return result.stdout.strip().split('\n')[0] if result.stdout else None
        
        elif 'zap' in tool_lower:
            # Check if ZAP API is accessible
            try:
                response = requests.get('http://localhost:8080/JSON/core/view/version/', timeout=2)
                if response.status_code == 200:
                    data = response.json()
                    return f"ZAP {data.get('version', 'unknown')}"
            except:
                pass
        
        # Generic version check
        result = subprocess.run([executable, '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return result.stdout.strip().split('\n')[0] if result.stdout else None
        
    except Exception as e:
        pass
    
    return None

