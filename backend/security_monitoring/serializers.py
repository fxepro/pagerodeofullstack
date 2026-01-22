"""
Serializers for Security Monitoring
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import SecurityAudit, SecurityScan, SecurityFinding, SecurityScanSchedule, SecurityTool


class UserSerializer(serializers.ModelSerializer):
    """Simple user serializer for created_by fields"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class SecurityFindingSerializer(serializers.ModelSerializer):
    scan_type = serializers.SerializerMethodField()
    scan_target = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SecurityFinding
        fields = [
            'id', 'scan', 'scan_type', 'scan_target', 'title', 'description',
            'severity', 'status', 'cve_id', 'cvss_score', 'affected_url',
            'evidence', 'remediation', 'assigned_to', 'assigned_to_name',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_scan_type(self, obj):
        if obj.scan:
            return obj.scan.scan_type
        return None
    
    def get_scan_target(self, obj):
        if obj.scan:
            return obj.scan.target_url
        return None
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return None


class SecurityScanSerializer(serializers.ModelSerializer):
    findings_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SecurityScan
        fields = [
            'id', 'scan_type', 'target_url', 'status', 'scheduled_at',
            'started_at', 'completed_at', 'tool_used', 'scan_config',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'findings_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'findings_count']
    
    def get_findings_count(self, obj):
        return obj.findings.count()
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


class SecurityScanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new scans"""
    scan_config = serializers.JSONField(default=dict, required=False, allow_null=True)
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    tool_used = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = SecurityScan
        fields = [
            'scan_type', 'target_url', 'tool_used', 'scan_config',
            'scheduled_at'
        ]
    
    def validate_scan_config(self, value):
        """Ensure scan_config is a dict"""
        if value is None:
            return {}
        if not isinstance(value, dict):
            return {}
        return value
    
    def validate_tool_used(self, value):
        """Ensure tool_used is not empty if provided"""
        if value is None:
            return ''
        if value and value.strip():
            return value.strip()
        return ''
    
    def validate_scheduled_at(self, value):
        """Handle scheduled_at - can be None"""
        return value
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        # Ensure scan_config has a default value
        if 'scan_config' not in validated_data or not validated_data['scan_config']:
            validated_data['scan_config'] = {}
        # Ensure tool_used has a default value
        if 'tool_used' not in validated_data or not validated_data['tool_used']:
            validated_data['tool_used'] = 'Manual'
        # Remove scheduled_at if it's None (let model handle default)
        if 'scheduled_at' in validated_data and validated_data['scheduled_at'] is None:
            # Keep it as None - model allows null
            pass
        return super().create(validated_data)


class SecurityScanScheduleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SecurityScanSchedule
        fields = [
            'id', 'scan_type', 'target_url', 'frequency', 'enabled',
            'tool_used', 'scan_config', 'last_run', 'next_run',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


class SecurityToolSerializer(serializers.ModelSerializer):
    """Serializer for Security Tools"""
    class Meta:
        model = SecurityTool
        fields = [
            'id', 'name', 'tool_type', 'category', 'status', 'description',
            'installation_instructions', 'command_template', 'executable_path',
            'api_key', 'api_url', 'configuration', 'supported_scan_types',
            'documentation_url', 'is_active', 'last_tested', 'test_result',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SecurityAuditSerializer(serializers.ModelSerializer):
    """Serializer for Security Audits"""
    scans_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SecurityAudit
        fields = [
            'id', 'target_url', 'status', 'started_at', 'completed_at',
            'total_scans', 'completed_scans', 'failed_scans',
            'total_findings', 'critical_findings', 'high_findings',
            'medium_findings', 'low_findings', 'informational_findings',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'scans_count'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'scans_count',
            'total_scans', 'completed_scans', 'failed_scans',
            'total_findings', 'critical_findings', 'high_findings',
            'medium_findings', 'low_findings', 'informational_findings'
        ]
    
    def get_scans_count(self, obj):
        return obj.scans.count()
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


class SecurityAuditCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new security audits"""
    scan_types = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text='List of scan types to run. Use ["all"] to run all available scans.'
    )
    
    class Meta:
        model = SecurityAudit
        fields = ['target_url', 'scan_types']
    
    def validate_scan_types(self, value):
        """Validate scan types"""
        if not value:
            return ['all']  # Default to all scans
        
        if 'all' in value:
            return ['all']
        
        # Validate scan types
        valid_types = [choice[0] for choice in SecurityScan.SCAN_TYPES]
        invalid_types = [st for st in value if st not in valid_types]
        if invalid_types:
            raise serializers.ValidationError(f"Invalid scan types: {invalid_types}")
        
        return value
