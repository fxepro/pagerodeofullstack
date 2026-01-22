# Generated manually for Security Monitoring app

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SecurityScan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('scan_type', models.CharField(choices=[('dns_discovery', 'DNS/Subdomain Discovery'), ('port_scan', 'Port & Service Discovery'), ('vulnerability_scan', 'External Network / Host Vulnerability Scan'), ('dast', 'DAST (Automated Web App Scanning)'), ('misconfiguration_scan', 'Web-server Misconfiguration Scan'), ('ssl_check', 'TLS / SSL Configuration & Cert Checks'), ('cms_scan', 'CMS / Platform-specific Remote Scans'), ('sql_injection', 'SQL Injection / Targeted Exploit Checks'), ('headers_check', 'HTTP Security Headers & Basic Hardening Checks'), ('continuous_monitoring', 'Automated External Monitoring / Continuous Scanning'), ('manual_pentest', 'Manual Pentest Tools (Proxy & Manual Testing)')], max_length=50)),
                ('target_url', models.URLField(max_length=500)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('running', 'Running'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('scheduled_at', models.DateTimeField(blank=True, null=True)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('tool_used', models.CharField(max_length=100)),
                ('scan_config', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='security_scans', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Security Scan',
                'verbose_name_plural': 'Security Scans',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SecurityFinding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('severity', models.CharField(choices=[('critical', 'Critical'), ('high', 'High'), ('medium', 'Medium'), ('low', 'Low'), ('informational', 'Informational')], max_length=20)),
                ('status', models.CharField(choices=[('new', 'New'), ('confirmed', 'Confirmed'), ('false_positive', 'False Positive'), ('mitigated', 'Mitigated'), ('resolved', 'Resolved')], default='new', max_length=20)),
                ('cve_id', models.CharField(blank=True, max_length=50)),
                ('cvss_score', models.DecimalField(blank=True, decimal_places=1, max_digits=3, null=True)),
                ('affected_url', models.URLField(blank=True, max_length=500)),
                ('evidence', models.JSONField(default=dict)),
                ('remediation', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_findings', to=settings.AUTH_USER_MODEL)),
                ('scan', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='findings', to='security_monitoring.securityscan')),
            ],
            options={
                'verbose_name': 'Security Finding',
                'verbose_name_plural': 'Security Findings',
                'ordering': ['-severity', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SecurityScanSchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('scan_type', models.CharField(choices=[('dns_discovery', 'DNS/Subdomain Discovery'), ('port_scan', 'Port & Service Discovery'), ('vulnerability_scan', 'External Network / Host Vulnerability Scan'), ('dast', 'DAST (Automated Web App Scanning)'), ('misconfiguration_scan', 'Web-server Misconfiguration Scan'), ('ssl_check', 'TLS / SSL Configuration & Cert Checks'), ('cms_scan', 'CMS / Platform-specific Remote Scans'), ('sql_injection', 'SQL Injection / Targeted Exploit Checks'), ('headers_check', 'HTTP Security Headers & Basic Hardening Checks'), ('continuous_monitoring', 'Automated External Monitoring / Continuous Scanning'), ('manual_pentest', 'Manual Pentest Tools (Proxy & Manual Testing)')], max_length=50)),
                ('target_url', models.URLField(max_length=500)),
                ('frequency', models.CharField(choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('on_demand', 'On Demand')], max_length=20)),
                ('enabled', models.BooleanField(default=True)),
                ('tool_used', models.CharField(max_length=100)),
                ('scan_config', models.JSONField(default=dict)),
                ('last_run', models.DateTimeField(blank=True, null=True)),
                ('next_run', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='security_schedules', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Security Scan Schedule',
                'verbose_name_plural': 'Security Scan Schedules',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='securityscan',
            index=models.Index(fields=['status', '-created_at'], name='sec_scan_status_idx'),
        ),
        migrations.AddIndex(
            model_name='securityscan',
            index=models.Index(fields=['scan_type', '-created_at'], name='sec_scan_type_idx'),
        ),
        migrations.AddIndex(
            model_name='securityscan',
            index=models.Index(fields=['target_url', '-created_at'], name='sec_scan_target_idx'),
        ),
        migrations.AddIndex(
            model_name='securityfinding',
            index=models.Index(fields=['severity', '-created_at'], name='sec_find_severity_idx'),
        ),
        migrations.AddIndex(
            model_name='securityfinding',
            index=models.Index(fields=['status', '-created_at'], name='sec_find_status_idx'),
        ),
        migrations.AddIndex(
            model_name='securityfinding',
            index=models.Index(fields=['scan', '-created_at'], name='sec_find_scan_idx'),
        ),
    ]

