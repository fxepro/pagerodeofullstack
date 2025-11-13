# Generated migration for audit_reports app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid
from django.contrib.postgres.fields import ArrayField


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditReport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier for this report', primary_key=True, serialize=False)),
                ('url', models.URLField(help_text='URL that was audited', max_length=500)),
                ('tools_selected', ArrayField(base_field=models.CharField(max_length=50), help_text='List of audit tools that were run', size=None)),
                ('audit_data', models.JSONField(blank=True, help_text='Complete audit results data', null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('generating', 'Generating'), ('ready', 'Ready'), ('failed', 'Failed')], default='pending', help_text='Current status of report generation', max_length=20)),
                ('pdf_url', models.CharField(blank=True, help_text='Relative URL to generated PDF file', max_length=500, null=True)),
                ('file_size_bytes', models.BigIntegerField(blank=True, help_text='Size of generated PDF in bytes', null=True)),
                ('error_message', models.TextField(blank=True, help_text='Error message if generation failed', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='When the report was requested')),
                ('completed_at', models.DateTimeField(blank=True, help_text='When PDF generation completed', null=True)),
                ('expires_at', models.DateTimeField(blank=True, help_text='When this report will be automatically deleted', null=True)),
                ('user', models.ForeignKey(help_text='User who requested this report', on_delete=django.db.models.deletion.CASCADE, related_name='audit_reports', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Audit Report',
                'verbose_name_plural': 'Audit Reports',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='auditreport',
            index=models.Index(fields=['user', '-created_at'], name='audit_repor_user_id_a1b2c3_idx'),
        ),
        migrations.AddIndex(
            model_name='auditreport',
            index=models.Index(fields=['status'], name='audit_repor_status_d4e5f6_idx'),
        ),
    ]

