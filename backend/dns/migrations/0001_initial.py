from django.db import migrations, models


def seed_dns_servers(apps, schema_editor):
    """Seed initial DNS server configurations"""
    DNSServerConfig = apps.get_model('dns', 'DNSServerConfig')
    
    dns_servers = [
        {
            'name': 'Google DNS',
            'server_ip': '8.8.8.8',
            'is_active': True,
            'order': 1,
            'location': 'Global'
        },
        {
            'name': 'Google DNS Secondary',
            'server_ip': '8.8.4.4',
            'is_active': True,
            'order': 2,
            'location': 'Global'
        },
        {
            'name': 'Cloudflare DNS',
            'server_ip': '1.1.1.1',
            'is_active': True,
            'order': 3,
            'location': 'Global'
        },
        {
            'name': 'Cloudflare DNS Secondary',
            'server_ip': '1.0.0.1',
            'is_active': True,
            'order': 4,
            'location': 'Global'
        },
        {
            'name': 'Quad9 DNS',
            'server_ip': '9.9.9.9',
            'is_active': True,
            'order': 5,
            'location': 'Global'
        },
        {
            'name': 'Quad9 Secondary',
            'server_ip': '149.112.112.112',
            'is_active': True,
            'order': 6,
            'location': 'Global'
        },
        {
            'name': 'OpenDNS',
            'server_ip': '208.67.222.222',
            'is_active': True,
            'order': 7,
            'location': 'United States'
        },
        {
            'name': 'OpenDNS Secondary',
            'server_ip': '208.67.220.220',
            'is_active': True,
            'order': 8,
            'location': 'United States'
        },
        {
            'name': 'Level3',
            'server_ip': '4.2.2.1',
            'is_active': True,
            'order': 9,
            'location': 'United States'
        },
        {
            'name': 'Level3 Secondary',
            'server_ip': '4.2.2.2',
            'is_active': True,
            'order': 10,
            'location': 'United States'
        },
        {
            'name': 'Comodo Secure DNS',
            'server_ip': '8.26.56.26',
            'is_active': True,
            'order': 11,
            'location': 'United States'
        },
        {
            'name': 'Comodo Secondary',
            'server_ip': '8.20.247.20',
            'is_active': True,
            'order': 12,
            'location': 'United States'
        },
        {
            'name': 'Verisign DNS',
            'server_ip': '64.6.64.6',
            'is_active': True,
            'order': 13,
            'location': 'United States'
        },
        {
            'name': 'Verisign Secondary',
            'server_ip': '64.6.65.6',
            'is_active': True,
            'order': 14,
            'location': 'United States'
        },
        {
            'name': 'DNS.Watch',
            'server_ip': '84.200.69.80',
            'is_active': True,
            'order': 15,
            'location': 'Germany'
        },
        {
            'name': 'DNS.Watch Secondary',
            'server_ip': '84.200.70.40',
            'is_active': True,
            'order': 16,
            'location': 'Germany'
        },
    ]
    
    for server_data in dns_servers:
        DNSServerConfig.objects.create(**server_data)


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='DNSServerConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Provider name (e.g., Google DNS)', max_length=100)),
                ('server_ip', models.GenericIPAddressField(help_text='DNS server IP address')),
                ('is_active', models.BooleanField(default=True, help_text='Enable/disable this DNS server')),
                ('order', models.IntegerField(default=0, help_text='Display order (lower numbers first)')),
                ('location', models.CharField(blank=True, help_text='Geographic location', max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'DNS Server',
                'verbose_name_plural': 'DNS Servers',
                'db_table': 'dns_server_config',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.RunPython(seed_dns_servers),
    ]

