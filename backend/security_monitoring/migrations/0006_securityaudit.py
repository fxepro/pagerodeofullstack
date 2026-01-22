# Generated migration

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('security_monitoring', '0005_alter_securitytool_category'),
    ]

    operations = [
        migrations.CreateModel(
            name='SecurityAudit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('target_url', models.URLField(max_length=500)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('running', 'Running'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('total_scans', models.IntegerField(default=0)),
                ('completed_scans', models.IntegerField(default=0)),
                ('failed_scans', models.IntegerField(default=0)),
                ('total_findings', models.IntegerField(default=0)),
                ('critical_findings', models.IntegerField(default=0)),
                ('high_findings', models.IntegerField(default=0)),
                ('medium_findings', models.IntegerField(default=0)),
                ('low_findings', models.IntegerField(default=0)),
                ('informational_findings', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='security_audits', to='auth.user')),
            ],
            options={
                'ordering': ['-created_at'],
                'verbose_name': 'Security Audit',
                'verbose_name_plural': 'Security Audits',
            },
        ),
        migrations.AddField(
            model_name='securityscan',
            name='audit',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='scans', to='security_monitoring.securityaudit'),
        ),
    ]

