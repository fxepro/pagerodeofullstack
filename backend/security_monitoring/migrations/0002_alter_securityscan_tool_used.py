# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('security_monitoring', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='securityscan',
            name='tool_used',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]

