# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('security_monitoring', '0003_securitytool'),
    ]

    operations = [
        migrations.AddField(
            model_name='securitytool',
            name='category',
            field=models.CharField(choices=[('site_audit', 'Site Audit'), ('security', 'Security'), ('api', 'API'), ('performance', 'Performance')], default='security', max_length=20),
        ),
    ]

