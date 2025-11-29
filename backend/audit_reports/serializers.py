"""
Serializers for audit reports and related analyses.
"""

from rest_framework import serializers
from .models import AuditReport
from performance_analysis.models import PerformanceAnalysis
from ssl_analysis.models import SSLAnalysis
from dns_analysis.models import DNSAnalysis
from sitemap_analysis.models import SitemapAnalysis
from api_analysis.models import APIAnalysis
from links_analysis.models import LinksAnalysis
from typography_analysis.models import TypographyAnalysis


class AuditReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditReport
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class AuditReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditReport
        fields = ['url', 'tools_selected', 'status']


# Analysis serializers for retrieving audit data
class PerformanceAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceAnalysis
        fields = '__all__'
        read_only_fields = ('id', 'analyzed_at')


class SSLAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = SSLAnalysis
        fields = '__all__'
        read_only_fields = ('id', 'analyzed_at')


class DNSAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = DNSAnalysis
        fields = '__all__'
        read_only_fields = ('id', 'analyzed_at')


class SitemapAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = SitemapAnalysis
        fields = '__all__'
        read_only_fields = ('id', 'analyzed_at')


class APIAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIAnalysis
        fields = '__all__'
        read_only_fields = ('id', 'analyzed_at')


class LinksAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = LinksAnalysis
        fields = '__all__'
        read_only_fields = ('id', 'analyzed_at')


class TypographyAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypographyAnalysis
        fields = '__all__'
        read_only_fields = ('id', 'analyzed_at')
