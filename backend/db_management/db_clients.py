"""
Database client factory for different database engines
"""
import psycopg2
from psycopg2 import pool
try:
    import mysql.connector
except ImportError:
    mysql = None
import sqlite3
from typing import Optional, Dict, Any
import logging

# New database drivers
try:
    import pymssql
except ImportError:
    pymssql = None

try:
    import oracledb
except ImportError:
    oracledb = None

try:
    import pymongo
    from pymongo import MongoClient
except ImportError:
    pymongo = None
    MongoClient = None

try:
    import redis
except ImportError:
    redis = None

from .connection_handlers.tls_handler import TLSConnectionHandler

logger = logging.getLogger(__name__)


class DatabaseClient:
    """Base database client interface"""
    
    def __init__(self, connection_params: Dict[str, Any]):
        self.connection_params = connection_params
        self.connection = None
        self.connection_timeout = connection_params.get('connection_timeout', 10)
        self.query_timeout = connection_params.get('query_timeout', 30)
        self.ssl_params = None
        
        # Handle TLS/SSL if configured
        if connection_params.get('use_ssl', False):
            try:
                self.ssl_params = TLSConnectionHandler.create_ssl_context(
                    ssl_mode=connection_params.get('ssl_mode', 'prefer'),
                    ca_cert=connection_params.get('ssl_ca_cert'),
                    client_cert=connection_params.get('ssl_client_cert'),
                    client_key=connection_params.get('ssl_client_key')
                )
            except Exception as e:
                logger.error(f"Error creating SSL context: {e}")
                raise
    
    def connect(self):
        """Establish database connection"""
        raise NotImplementedError
    
    def close(self):
        """Close database connection"""
        # Clean up SSL temp files if any
        if self.ssl_params:
            try:
                TLSConnectionHandler.cleanup_temp_files(self.ssl_params)
            except Exception as e:
                logger.warning(f"Error cleaning up SSL temp files: {e}")
        
        if self.connection:
            try:
                self.connection.close()
            except Exception as e:
                logger.error(f"Error closing connection: {e}")
            finally:
                self.connection = None
    
    def execute_query(self, query: str, limit: int = 1000) -> tuple:
        """
        Execute a query and return (rows, columns)
        Returns tuple of (list of rows, list of column names)
        """
        raise NotImplementedError
    
    def test_connection(self) -> tuple:
        """Test connection, returns (success: bool, message: str)"""
        try:
            self.connect()
            return True, "Connection successful"
        except Exception as e:
            return False, str(e)
        finally:
            self.close()
    
    def __enter__(self):
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class PostgreSQLClient(DatabaseClient):
    """PostgreSQL database client"""
    
    def connect(self):
        try:
            conn_params = {
                'host': self.connection_params['host'],
                'port': self.connection_params.get('port', 5432),
                'database': self.connection_params['database'],
                'user': self.connection_params['username'],
                'password': self.connection_params['password'],
                'connect_timeout': self.connection_timeout
            }
            
            # Add SSL parameters if configured
            if self.ssl_params:
                # Remove internal temp_files tracking
                ssl_conn_params = {k: v for k, v in self.ssl_params.items() if k != '_temp_files'}
                conn_params.update(ssl_conn_params)
            
            self.connection = psycopg2.connect(**conn_params)
        except Exception as e:
            logger.error(f"PostgreSQL connection error: {e}")
            raise
    
    def execute_query(self, query: str, limit: int = 1000) -> tuple:
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor()
        try:
            # Add LIMIT if not present and it's a SELECT query
            if query.strip().upper().startswith('SELECT') and 'LIMIT' not in query.upper():
                query = f"{query.rstrip(';')} LIMIT {limit}"
            
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            return rows, columns
        finally:
            cursor.close()


class MySQLClient(DatabaseClient):
    """MySQL database client"""
    
    def connect(self):
        if mysql is None:
            raise ImportError("mysql-connector-python is not installed. Install it with: pip install mysql-connector-python")
        try:
            conn_params = {
                'host': self.connection_params['host'],
                'port': self.connection_params.get('port', 3306),
                'database': self.connection_params['database'],
                'user': self.connection_params['username'],
                'password': self.connection_params['password'],
                'connection_timeout': self.connection_timeout
            }
            
            # Add SSL parameters if configured
            if self.ssl_params:
                ssl_mode = self.ssl_params.get('sslmode', 'prefer')
                if ssl_mode != 'disable':
                    conn_params['ssl_disabled'] = False
                    if self.ssl_params.get('sslrootcert'):
                        conn_params['ssl_ca'] = self.ssl_params['sslrootcert']
                    if self.ssl_params.get('sslcert'):
                        conn_params['ssl_cert'] = self.ssl_params['sslcert']
                    if self.ssl_params.get('sslkey'):
                        conn_params['ssl_key'] = self.ssl_params['sslkey']
                else:
                    conn_params['ssl_disabled'] = True
            
            self.connection = mysql.connector.connect(**conn_params)
        except Exception as e:
            logger.error(f"MySQL connection error: {e}")
            raise
    
    def execute_query(self, query: str, limit: int = 1000) -> tuple:
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor(dictionary=False)
        try:
            # Add LIMIT if not present and it's a SELECT query
            if query.strip().upper().startswith('SELECT') and 'LIMIT' not in query.upper():
                query = f"{query.rstrip(';')} LIMIT {limit}"
            
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            return rows, columns
        finally:
            cursor.close()


class SQLiteClient(DatabaseClient):
    """SQLite database client"""
    
    def connect(self):
        try:
            # SQLite uses file path as database name
            db_path = self.connection_params.get('database') or self.connection_params.get('host')
            self.connection = sqlite3.connect(db_path, timeout=10)
            self.connection.row_factory = sqlite3.Row
        except Exception as e:
            logger.error(f"SQLite connection error: {e}")
            raise
    
    def execute_query(self, query: str, limit: int = 1000) -> tuple:
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor()
        try:
            # Add LIMIT if not present and it's a SELECT query
            if query.strip().upper().startswith('SELECT') and 'LIMIT' not in query.upper():
                query = f"{query.rstrip(';')} LIMIT {limit}"
            
            cursor.execute(query)
            columns = [col[0] for col in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            # Convert Row objects to tuples
            rows = [tuple(row) for row in rows]
            return rows, columns
        finally:
            cursor.close()


class SQLServerClient(DatabaseClient):
    """SQL Server database client using pymssql"""
    
    def connect(self):
        if pymssql is None:
            raise ImportError("pymssql is not installed. Install it with: pip install pymssql")
        try:
            self.connection = pymssql.connect(
                server=self.connection_params['host'],
                port=self.connection_params.get('port', 1433),
                database=self.connection_params['database'],
                user=self.connection_params['username'],
                password=self.connection_params['password'],
                timeout=self.connection_timeout
            )
        except Exception as e:
            logger.error(f"SQL Server connection error: {e}")
            raise
    
    def execute_query(self, query: str, limit: int = 1000) -> tuple:
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor()
        try:
            # Add TOP clause for SQL Server if it's a SELECT query
            if query.strip().upper().startswith('SELECT') and 'TOP' not in query.upper() and 'LIMIT' not in query.upper():
                query = f"{query.rstrip(';')} TOP {limit}"
            
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            return rows, columns
        finally:
            cursor.close()


class OracleClient(DatabaseClient):
    """Oracle database client using oracledb (thin mode - no Instant Client needed)"""
    
    def connect(self):
        if oracledb is None:
            raise ImportError("oracledb is not installed. Install it with: pip install oracledb")
        try:
            # Use thin mode by default (no Instant Client needed)
            # Thin mode is the default, so we don't need to call init_oracle_client()
            
            # Try to use service_name first, then database name
            service_name = self.connection_params.get('service_name') or self.connection_params.get('database')
            
            if service_name:
                dsn = oracledb.makedsn(
                    host=self.connection_params['host'],
                    port=self.connection_params.get('port', 1521),
                    service_name=service_name
                )
            else:
                # Fallback to simple connection string
                dsn = f"{self.connection_params['host']}:{self.connection_params.get('port', 1521)}/{self.connection_params.get('database', '')}"
            
            self.connection = oracledb.connect(
                user=self.connection_params['username'],
                password=self.connection_params['password'],
                dsn=dsn
            )
        except Exception as e:
            logger.error(f"Oracle connection error: {e}")
            raise
    
    def execute_query(self, query: str, limit: int = 1000) -> tuple:
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor()
        try:
            # Add ROWNUM limit for Oracle if it's a SELECT query
            if query.strip().upper().startswith('SELECT') and 'ROWNUM' not in query.upper():
                # Wrap query with ROWNUM limit
                query = f"SELECT * FROM ({query.rstrip(';')}) WHERE ROWNUM <= {limit}"
            
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            return rows, columns
        finally:
            cursor.close()


class MongoDBClient(DatabaseClient):
    """MongoDB database client"""
    
    def connect(self):
        if pymongo is None or MongoClient is None:
            raise ImportError("pymongo is not installed. Install it with: pip install pymongo")
        try:
            conn_string = f"mongodb://{self.connection_params['username']}:{self.connection_params['password']}@{self.connection_params['host']}:{self.connection_params.get('port', 27017)}/{self.connection_params.get('database', 'admin')}"
            
            self.connection = MongoClient(
                conn_string,
                serverSelectionTimeoutMS=self.connection_timeout * 1000
            )
            # Test connection
            self.connection.admin.command('ping')
        except Exception as e:
            logger.error(f"MongoDB connection error: {e}")
            raise
    
    def execute_query(self, query: str, limit: int = 1000) -> tuple:
        """
        Execute MongoDB query (simplified - expects JSON-like query string)
        Note: MongoDB queries are different from SQL
        """
        if not self.connection:
            self.connect()
        
        # For MongoDB, we'd need to parse the query differently
        # This is a simplified implementation
        db = self.connection[self.connection_params.get('database', 'admin')]
        # This would need proper MongoDB query parsing
        # For now, return empty result
        return [], []
    
    def close(self):
        if self.connection:
            try:
                self.connection.close()
            except Exception as e:
                logger.error(f"Error closing MongoDB connection: {e}")
            finally:
                self.connection = None


class RedisClient(DatabaseClient):
    """Redis database client"""
    
    def connect(self):
        if redis is None:
            raise ImportError("redis is not installed. Install it with: pip install redis")
        try:
            self.connection = redis.Redis(
                host=self.connection_params['host'],
                port=self.connection_params.get('port', 6379),
                db=int(self.connection_params.get('database', 0)),
                password=self.connection_params.get('password') or None,
                socket_connect_timeout=self.connection_timeout,
                decode_responses=True
            )
            # Test connection
            self.connection.ping()
        except Exception as e:
            logger.error(f"Redis connection error: {e}")
            raise
    
    def execute_query(self, query: str, limit: int = 1000) -> tuple:
        """
        Execute Redis command
        Note: Redis uses commands, not SQL queries
        """
        if not self.connection:
            self.connect()
        
        # Parse Redis command (simplified)
        parts = query.strip().split()
        if not parts:
            return [], []
        
        command = parts[0].upper()
        args = parts[1:]
        
        try:
            result = self.connection.execute_command(command, *args)
            # Convert result to rows/columns format
            if isinstance(result, list):
                return result[:limit], ['value']
            else:
                return [[result]], ['value']
        except Exception as e:
            logger.error(f"Redis command error: {e}")
            raise


def get_database_client(engine: str, connection_params: Dict[str, Any]) -> DatabaseClient:
    """Factory function to get appropriate database client"""
    clients = {
        'postgresql': PostgreSQLClient,
        'mysql': MySQLClient,
        'sqlite': SQLiteClient,
        'mssql': SQLServerClient,
        'oracle': OracleClient,
        'mongodb': MongoDBClient,
        'redis': RedisClient,
    }
    
    client_class = clients.get(engine.lower())
    if not client_class:
        raise ValueError(f"Unsupported database engine: {engine}")
    
    return client_class(connection_params)

