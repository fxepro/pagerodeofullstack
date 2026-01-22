# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('security_monitoring', '0002_alter_securityscan_tool_used'),
    ]

    operations = [
        migrations.CreateModel(
            name='SecurityTool',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('tool_type', models.CharField(choices=[('builtin', 'Built-in (Python)'), ('external', 'External Binary'), ('api', 'API Service')], max_length=20)),
                ('status', models.CharField(choices=[('available', 'Available'), ('configured', 'Configured'), ('not_installed', 'Not Installed'), ('error', 'Error')], default='not_installed', max_length=20)),
                ('description', models.TextField(help_text='Tool description and purpose')),
                ('installation_instructions', models.TextField(help_text='How to install this tool')),
                ('command_template', models.CharField(blank=True, help_text='Command template for execution', max_length=500)),
                ('executable_path', models.CharField(blank=True, help_text='Path to executable (if external)', max_length=500)),
                ('api_key', models.CharField(blank=True, help_text='API key (if API service)', max_length=500)),
                ('api_url', models.URLField(blank=True, help_text='API endpoint URL (if API service)')),
                ('configuration', models.JSONField(default=dict, help_text='Additional configuration')),
                ('supported_scan_types', models.JSONField(default=list, help_text='List of scan types this tool supports')),
                ('documentation_url', models.URLField(blank=True, help_text='Link to tool documentation')),
                ('is_active', models.BooleanField(default=False, help_text='Is this tool active and ready to use?')),
                ('last_tested', models.DateTimeField(blank=True, null=True)),
                ('test_result', models.TextField(blank=True, help_text='Result of last test')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Security Tool',
                'verbose_name_plural': 'Security Tools',
                'ordering': ['name'],
            },
        ),
    ]

