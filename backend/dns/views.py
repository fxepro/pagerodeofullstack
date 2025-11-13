from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DNSServerConfig

@api_view(['GET'])
def get_dns_servers(request):
    """Get list of active DNS servers"""
    servers = DNSServerConfig.objects.filter(is_active=True).values(
        'id', 'name', 'server_ip', 'location', 'order'
    )
    return Response({
        'servers': list(servers),
        'count': len(servers)
    })

