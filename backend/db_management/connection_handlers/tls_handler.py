"""
TLS/SSL Connection Handler
Handles TLS/SSL secured database connections
"""
import ssl
import tempfile
import os
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class TLSConnectionHandler:
    """Handles TLS/SSL secured database connections"""
    
    @staticmethod
    def create_ssl_context(
        ssl_mode: str,
        ca_cert: Optional[str] = None,
        client_cert: Optional[str] = None,
        client_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create SSL context based on configuration
        Returns connection parameters for database drivers
        
        Args:
            ssl_mode: SSL mode (disable, allow, prefer, require, verify-ca, verify-full)
            ca_cert: CA certificate content (PEM format)
            client_cert: Client certificate content (PEM format)
            client_key: Client private key content (PEM format)
        
        Returns:
            Dictionary with SSL connection parameters
        """
        ssl_params = {}
        temp_files = []  # Track temp files for cleanup
        
        # Map SSL mode to driver-specific parameters
        if ssl_mode == 'disable':
            ssl_params['sslmode'] = 'disable'
        elif ssl_mode == 'allow':
            ssl_params['sslmode'] = 'allow'
        elif ssl_mode == 'prefer':
            ssl_params['sslmode'] = 'prefer'
        elif ssl_mode == 'require':
            ssl_params['sslmode'] = 'require'
        elif ssl_mode == 'verify-ca':
            ssl_params['sslmode'] = 'verify-ca'
        elif ssl_mode == 'verify-full':
            ssl_params['sslmode'] = 'verify-full'
        else:
            # Default to prefer if unknown mode
            ssl_params['sslmode'] = 'prefer'
        
        # Handle CA certificate
        if ca_cert:
            try:
                with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.pem') as f:
                    f.write(ca_cert)
                    ssl_params['sslrootcert'] = f.name
                    temp_files.append(f.name)
            except Exception as e:
                logger.error(f"Error writing CA certificate: {e}")
                raise
        
        # Handle client certificate
        if client_cert:
            try:
                with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.pem') as f:
                    f.write(client_cert)
                    ssl_params['sslcert'] = f.name
                    temp_files.append(f.name)
            except Exception as e:
                logger.error(f"Error writing client certificate: {e}")
                raise
        
        # Handle client private key
        if client_key:
            try:
                with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.pem') as f:
                    f.write(client_key)
                    ssl_params['sslkey'] = f.name
                    temp_files.append(f.name)
            except Exception as e:
                logger.error(f"Error writing client key: {e}")
                raise
        
        # Store temp files list for cleanup
        ssl_params['_temp_files'] = temp_files
        
        return ssl_params
    
    @staticmethod
    def cleanup_temp_files(ssl_params: Dict[str, Any]):
        """
        Clean up temporary certificate files
        
        Args:
            ssl_params: SSL parameters dictionary with _temp_files list
        """
        temp_files = ssl_params.get('_temp_files', [])
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.unlink(temp_file)
            except Exception as e:
                logger.warning(f"Error cleaning up temp file {temp_file}: {e}")
    
    @staticmethod
    def get_ssl_context_for_python(
        ssl_mode: str,
        ca_cert: Optional[str] = None,
        client_cert: Optional[str] = None,
        client_key: Optional[str] = None
    ) -> ssl.SSLContext:
        """
        Create Python ssl.SSLContext for database drivers that use it directly
        
        Args:
            ssl_mode: SSL mode
            ca_cert: CA certificate content
            client_cert: Client certificate content
            client_key: Client private key content
        
        Returns:
            ssl.SSLContext object
        """
        context = ssl.create_default_context()
        
        # Configure verification based on mode
        if ssl_mode in ['verify-ca', 'verify-full']:
            context.check_hostname = (ssl_mode == 'verify-full')
            context.verify_mode = ssl.CERT_REQUIRED
        elif ssl_mode == 'require':
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE  # Require SSL but don't verify cert
        else:
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
        
        # Load CA certificate
        if ca_cert:
            try:
                with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.pem') as f:
                    f.write(ca_cert)
                    context.load_verify_locations(f.name)
                    os.unlink(f.name)  # Clean up immediately
            except Exception as e:
                logger.error(f"Error loading CA certificate: {e}")
                raise
        
        # Load client certificate and key
        if client_cert and client_key:
            try:
                with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.pem') as cert_file:
                    cert_file.write(client_cert)
                    cert_file.flush()
                    
                    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.pem') as key_file:
                        key_file.write(client_key)
                        key_file.flush()
                        
                        context.load_cert_chain(cert_file.name, key_file.name)
                        
                        # Clean up
                        os.unlink(cert_file.name)
                        os.unlink(key_file.name)
            except Exception as e:
                logger.error(f"Error loading client certificate/key: {e}")
                raise
        
        return context

