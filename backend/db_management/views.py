"""
API Views for Database Management
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from django.utils import timezone
import time
import logging

from .models import DatabaseConnection, DatabaseActivityLog, DatabasePerformanceMetrics
from .serializers import (
    DatabaseConnectionSerializer, DatabaseConnectionListSerializer,
    DatabaseActivityLogSerializer, DatabasePerformanceMetricsSerializer
)
# Lazy import to avoid import errors at module load time
def _get_decrypt_password():
    """Lazy import of decrypt_password function"""
    from .encryption import decrypt_password
    return decrypt_password
from .db_clients import get_database_client
from .db_operations import get_schemas, get_tables, get_columns, preview_table
from .query_validator import validate_query

logger = logging.getLogger(__name__)


def build_connection_params(connection):
    """
    Build connection parameters dictionary from DatabaseConnection model
    Includes TLS/SSL settings and advanced configuration
    """
    decrypt_password = _get_decrypt_password()
    password = decrypt_password(connection.encrypted_password)
    
    # Decrypt SSL client key if present
    ssl_client_key = None
    if connection.ssl_client_key:
        try:
            ssl_client_key = decrypt_password(connection.ssl_client_key)
        except Exception as e:
            logger.warning(f"Error decrypting SSL client key: {e}")
    
    return {
        'host': connection.host,
        'port': connection.port,
        'database': connection.database,
        'username': connection.username,
        'password': password,
        # TLS/SSL settings
        'use_ssl': connection.use_ssl,
        'ssl_mode': connection.ssl_mode,
        'ssl_ca_cert': connection.ssl_ca_cert,
        'ssl_client_cert': connection.ssl_client_cert,
        'ssl_client_key': ssl_client_key,
        # Advanced settings
        'connection_timeout': connection.connection_timeout,
        'query_timeout': connection.query_timeout,
    }


def log_activity(connection, user, action, query=None, execution_time=None, 
                 rows_affected=None, success=True, error_message=None, ip_address=None):
    """Helper to log database activity"""
    DatabaseActivityLog.objects.create(
        connection=connection,
        user=user,
        action=action,
        query=query,
        execution_time=execution_time,
        rows_affected=rows_affected,
        success=success,
        error_message=error_message,
        ip_address=ip_address
    )


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def database_connections_list(request):
    """List all database connections or create a new one"""
    # Check if user is admin (IsAdminUser already checks is_staff, but we'll add explicit check for clarity)
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required. You must be a staff member.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        if request.method == 'GET':
            try:
                connections = DatabaseConnection.objects.all()
                serializer = DatabaseConnectionListSerializer(connections, many=True)
                return Response(serializer.data)
            except Exception as e:
                logger.error(f"Error in GET database_connections_list: {str(e)}", exc_info=True)
                return Response(
                    {'error': str(e), 'detail': 'Failed to retrieve database connections'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        elif request.method == 'POST':
            try:
                logger.info(f"Creating database connection with data: {request.data}")
                serializer = DatabaseConnectionSerializer(data=request.data, context={'request': request})
                if serializer.is_valid():
                    try:
                        connection = serializer.save()
                        # Log activity (don't fail if logging fails)
                        try:
                            log_activity(
                                connection=connection,
                                user=request.user,
                                action='connect',
                                ip_address=request.META.get('REMOTE_ADDR')
                            )
                        except Exception as log_error:
                            logger.warning(f"Failed to log activity: {str(log_error)}")
                        
                        return Response(DatabaseConnectionSerializer(connection).data, status=status.HTTP_201_CREATED)
                    except serializers.ValidationError as ve:
                        # Re-raise validation errors as 400 (not 500)
                        logger.warning(f"Validation error saving connection: {ve.detail}")
                        return Response(ve.detail, status=status.HTTP_400_BAD_REQUEST)
                    except Exception as save_error:
                        logger.error(f"Error saving database connection: {str(save_error)}", exc_info=True)
                        import traceback
                        logger.error(traceback.format_exc())
                        return Response(
                            {'error': str(save_error), 'detail': 'Failed to save database connection to database'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                else:
                    logger.warning(f"Serializer validation failed: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Error in POST database_connections_list: {str(e)}", exc_info=True)
                import traceback
                logger.error(traceback.format_exc())
                return Response(
                    {'error': str(e), 'detail': 'Failed to create database connection', 'traceback': traceback.format_exc() if logger.level <= 10 else None},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
    except Exception as e:
        logger.error(f"Unexpected error in database_connections_list: {str(e)}", exc_info=True)
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {'error': str(e), 'detail': 'An unexpected error occurred while processing the request'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def database_connection_detail(request, pk):
    """Get, update, or delete a database connection"""
    connection = get_object_or_404(DatabaseConnection, pk=pk)
    
    if request.method == 'GET':
        serializer = DatabaseConnectionSerializer(connection)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = DatabaseConnectionSerializer(connection, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        connection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def test_connection(request, pk):
    """Test a database connection"""
    connection = get_object_or_404(DatabaseConnection, pk=pk)
    
    try:
        connection_params = build_connection_params(connection)
        client = get_database_client(connection.engine, connection_params)
        success, message = client.test_connection()
        
        # Update connection status
        if success:
            connection.connection_status = 'connected'
            connection.last_connected_at = timezone.now()
            connection.last_error = None
        else:
            connection.connection_status = 'error'
            connection.last_error = message
        connection.save(update_fields=['connection_status', 'last_connected_at', 'last_error'])
        
        log_activity(
            connection=connection,
            user=request.user,
            action='connect',
            success=success,
            error_message=None if success else message,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'success': success, 'message': message})
    
    except Exception as e:
        log_activity(
            connection=connection,
            user=request.user,
            action='error',
            success=False,
            error_message=str(e),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_schemas(request, pk):
    """List schemas for a database connection"""
    connection = get_object_or_404(DatabaseConnection, pk=pk)
    
    try:
        connection_params = build_connection_params(connection)
        start_time = time.time()
        schemas = get_schemas(connection.engine, connection_params)
        execution_time = time.time() - start_time
        
        log_activity(
            connection=connection,
            user=request.user,
            action='schema_list',
            execution_time=execution_time,
            rows_affected=len(schemas),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'schemas': schemas})
    
    except Exception as e:
        log_activity(
            connection=connection,
            user=request.user,
            action='error',
            success=False,
            error_message=str(e),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_tables(request, pk):
    """List tables for a database connection"""
    connection = get_object_or_404(DatabaseConnection, pk=pk)
    schema = request.GET.get('schema', None)
    
    try:
        decrypt_password = _get_decrypt_password()
        password = decrypt_password(connection.encrypted_password)
        connection_params = {
            'host': connection.host,
            'port': connection.port,
            'database': connection.database,
            'username': connection.username,
            'password': password
        }
        
        start_time = time.time()
        tables = get_tables(connection.engine, connection_params, schema)
        execution_time = time.time() - start_time
        
        log_activity(
            connection=connection,
            user=request.user,
            action='table_list',
            execution_time=execution_time,
            rows_affected=len(tables),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'tables': tables})
    
    except Exception as e:
        log_activity(
            connection=connection,
            user=request.user,
            action='error',
            success=False,
            error_message=str(e),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_columns(request, pk, table):
    """List columns for a table"""
    connection = get_object_or_404(DatabaseConnection, pk=pk)
    schema = request.GET.get('schema', None)
    
    try:
        decrypt_password = _get_decrypt_password()
        password = decrypt_password(connection.encrypted_password)
        connection_params = {
            'host': connection.host,
            'port': connection.port,
            'database': connection.database,
            'username': connection.username,
            'password': password
        }
        
        start_time = time.time()
        columns = get_columns(connection.engine, connection_params, table, schema)
        execution_time = time.time() - start_time
        
        log_activity(
            connection=connection,
            user=request.user,
            action='column_list',
            execution_time=execution_time,
            rows_affected=len(columns),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'columns': columns})
    
    except Exception as e:
        log_activity(
            connection=connection,
            user=request.user,
            action='error',
            success=False,
            error_message=str(e),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def preview_table_data(request, pk, table):
    """Preview table data"""
    connection = get_object_or_404(DatabaseConnection, pk=pk)
    schema = request.GET.get('schema', None)
    limit = int(request.GET.get('limit', 100))
    
    try:
        decrypt_password = _get_decrypt_password()
        password = decrypt_password(connection.encrypted_password)
        connection_params = {
            'host': connection.host,
            'port': connection.port,
            'database': connection.database,
            'username': connection.username,
            'password': password
        }
        
        start_time = time.time()
        rows, columns = preview_table(connection.engine, connection_params, table, schema, limit)
        execution_time = time.time() - start_time
        
        # Convert rows to list of dicts
        data = [dict(zip(columns, row)) for row in rows]
        
        log_activity(
            connection=connection,
            user=request.user,
            action='preview',
            execution_time=execution_time,
            rows_affected=len(data),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'columns': columns, 'rows': data, 'count': len(data)})
    
    except Exception as e:
        log_activity(
            connection=connection,
            user=request.user,
            action='error',
            success=False,
            error_message=str(e),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def execute_query(request, pk):
    """Execute a safe read-only query"""
    connection = get_object_or_404(DatabaseConnection, pk=pk)
    query = request.data.get('query', '').strip()
    
    if not query:
        return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate query
    is_valid, error_message = validate_query(query)
    if not is_valid:
        log_activity(
            connection=connection,
            user=request.user,
            action='error',
            query=query,
            success=False,
            error_message=error_message,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        connection_params = build_connection_params(connection)
        client = get_database_client(connection.engine, connection_params)
        start_time = time.time()
        
        with client:
            rows, columns = client.execute_query(query, limit=1000)
            execution_time = time.time() - start_time
        
        # Convert rows to list of dicts
        data = [dict(zip(columns, row)) for row in rows]
        
        log_activity(
            connection=connection,
            user=request.user,
            action='query',
            query=query,
            execution_time=execution_time,
            rows_affected=len(data),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({
            'columns': columns,
            'rows': data,
            'count': len(data),
            'execution_time': round(execution_time, 4)
        })
    
    except Exception as e:
        log_activity(
            connection=connection,
            user=request.user,
            action='error',
            query=query,
            success=False,
            error_message=str(e),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def activity_logs(request, pk):
    """Get activity logs for a connection"""
    connection = get_object_or_404(DatabaseConnection, pk=pk)
    logs = DatabaseActivityLog.objects.filter(connection=connection).order_by('-created_at')[:100]
    serializer = DatabaseActivityLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def performance_metrics(request, pk):
    """Get or collect performance metrics"""
    connection = get_object_or_404(DatabaseConnection, pk=pk)
    
    if request.method == 'GET':
        metrics = DatabasePerformanceMetrics.objects.filter(connection=connection).order_by('-collected_at')[:10]
        serializer = DatabasePerformanceMetricsSerializer(metrics, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Collect new metrics (simplified - would need actual database-specific queries)
        # For now, create a placeholder metric
        metric = DatabasePerformanceMetrics.objects.create(
            connection=connection,
            total_connections=0,
            active_connections=0,
            table_count=None,
            index_count=None
        )
        serializer = DatabasePerformanceMetricsSerializer(metric)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
