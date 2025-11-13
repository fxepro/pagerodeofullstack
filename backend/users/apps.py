from django.apps import AppConfig
from django.db.models.signals import post_migrate

def create_roles(sender, **kwargs):
    from django.contrib.auth.models import Group
    roles = ['Admin', 'Director', 'Manager', 'Analyst', 'Viewer']
    for role in roles:
        Group.objects.get_or_create(name=role)

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        post_migrate.connect(create_roles, sender=self)
