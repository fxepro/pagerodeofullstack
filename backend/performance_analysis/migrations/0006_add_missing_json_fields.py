# Generated manually for complete JSON field mapping

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('performance_analysis', '0005_networkrequest_audit_report_and_more'),
    ]

    operations = [
        # NetworkRequest: Add mime_type field
        migrations.AddField(
            model_name='networkrequest',
            name='mime_type',
            field=models.CharField(blank=True, help_text='MIME type (e.g., application/javascript)', max_length=100, null=True),
        ),
        # ResourceBreakdown: Add missing fields
        migrations.AddField(
            model_name='resourcebreakdown',
            name='mime_type',
            field=models.CharField(blank=True, help_text='MIME type (e.g., application/javascript)', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='resourcebreakdown',
            name='wasted_bytes',
            field=models.IntegerField(blank=True, help_text='Wasted bytes (from unused-css/js audits)', null=True),
        ),
        migrations.AddField(
            model_name='resourcebreakdown',
            name='wasted_ms',
            field=models.FloatField(blank=True, help_text='Wasted milliseconds', null=True),
        ),
        migrations.AddField(
            model_name='resourcebreakdown',
            name='cache_lifetime',
            field=models.IntegerField(blank=True, help_text='Cache lifetime in seconds', null=True),
        ),
        # PerformanceTimelineEvent: Add pid and tid fields
        migrations.AddField(
            model_name='performancetimelineevent',
            name='pid',
            field=models.IntegerField(blank=True, help_text='Process ID', null=True),
        ),
        migrations.AddField(
            model_name='performancetimelineevent',
            name='tid',
            field=models.IntegerField(blank=True, help_text='Thread ID', null=True),
        ),
    ]

