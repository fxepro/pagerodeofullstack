from rest_framework import serializers
from .models import Location, RunnerHealth


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = [
            'id', 'name', 'region_code', 'region_id', 'country', 'continent',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RunnerHealthSerializer(serializers.ModelSerializer):
    memory_percent = serializers.SerializerMethodField()
    time_since_last_success = serializers.SerializerMethodField()
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_region_code = serializers.CharField(source='location.region_code', read_only=True)
    
    class Meta:
        model = RunnerHealth
        fields = [
            'id', 'location', 'location_name', 'location_region_code', 'runner_id', 'region',
            'status', 'can_accept_jobs', 'cpu_load', 'memory_used_mb', 'memory_total_mb',
            'memory_percent', 'disk_free_mb', 'latency_ms', 'current_jobs_running',
            'last_lighthouse_run_sec', 'time_since_last_success', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at', 'memory_percent', 'time_since_last_success', 'location_name', 'location_region_code']
    
    def get_memory_percent(self, obj):
        if obj.memory_total_mb and obj.memory_used_mb is not None:
            return round((obj.memory_used_mb / obj.memory_total_mb) * 100, 1)
        return None
    
    def get_time_since_last_success(self, obj):
        if obj.last_lighthouse_run_sec is not None:
            return obj.last_lighthouse_run_sec
        return None

