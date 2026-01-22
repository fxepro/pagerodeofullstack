"""
Database operations for schemas, tables, columns, etc.
"""
from .db_clients import get_database_client
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


def get_schemas(engine: str, connection_params: Dict[str, Any]) -> List[str]:
    """Get list of schemas/databases"""
    client = get_database_client(engine, connection_params)
    
    try:
        client.connect()
        
        if engine == 'postgresql':
            query = "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast') ORDER BY schema_name"
        elif engine == 'mysql':
            query = "SHOW DATABASES"
        elif engine == 'sqlite':
            # SQLite doesn't have schemas, return empty list
            return []
        else:
            raise ValueError(f"Unsupported engine: {engine}")
        
        rows, columns = client.execute_query(query)
        
        if engine == 'mysql':
            return [row[0] for row in rows]
        else:
            return [row[0] for row in rows]
    
    finally:
        client.close()


def get_tables(engine: str, connection_params: Dict[str, Any], schema: str = None) -> List[Dict[str, Any]]:
    """Get list of tables in a schema"""
    client = get_database_client(engine, connection_params)
    
    try:
        client.connect()
        
        if engine == 'postgresql':
            if schema:
                query = f"""
                    SELECT table_name, table_type 
                    FROM information_schema.tables 
                    WHERE table_schema = '{schema}' 
                    ORDER BY table_name
                """
            else:
                query = """
                    SELECT table_name, table_type 
                    FROM information_schema.tables 
                    WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
                    ORDER BY table_schema, table_name
                """
        elif engine == 'mysql':
            if schema:
                query = f"SHOW TABLES FROM `{schema}`"
            else:
                query = "SHOW TABLES"
        elif engine == 'sqlite':
            query = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        else:
            raise ValueError(f"Unsupported engine: {engine}")
        
        rows, columns = client.execute_query(query)
        
        if engine == 'postgresql':
            return [{'name': row[0], 'type': row[1]} for row in rows]
        elif engine == 'mysql':
            table_name_col = columns[0] if columns else 'Tables_in_' + (schema or connection_params.get('database', ''))
            return [{'name': row[0], 'type': 'BASE TABLE'} for row in rows]
        elif engine == 'sqlite':
            return [{'name': row[0], 'type': 'table'} for row in rows]
    
    finally:
        client.close()


def get_columns(engine: str, connection_params: Dict[str, Any], table: str, schema: str = None) -> List[Dict[str, Any]]:
    """Get list of columns for a table"""
    client = get_database_client(engine, connection_params)
    
    try:
        client.connect()
        
        if engine == 'postgresql':
            if schema:
                query = f"""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_schema = '{schema}' AND table_name = '{table}'
                    ORDER BY ordinal_position
                """
            else:
                query = f"""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = '{table}'
                    ORDER BY table_schema, ordinal_position
                """
        elif engine == 'mysql':
            if schema:
                query = f"DESCRIBE `{schema}`.`{table}`"
            else:
                query = f"DESCRIBE `{table}`"
        elif engine == 'sqlite':
            query = f"PRAGMA table_info({table})"
        else:
            raise ValueError(f"Unsupported engine: {engine}")
        
        rows, columns = client.execute_query(query)
        
        if engine == 'postgresql':
            return [
                {
                    'name': row[0],
                    'type': row[1],
                    'nullable': row[2] == 'YES',
                    'default': row[3]
                }
                for row in rows
            ]
        elif engine == 'mysql':
            return [
                {
                    'name': row[0],
                    'type': row[1],
                    'nullable': row[2] == 'YES',
                    'default': row[3]
                }
                for row in rows
            ]
        elif engine == 'sqlite':
            return [
                {
                    'name': row[1],
                    'type': row[2],
                    'nullable': not row[3],  # SQLite uses 0/1 for NOT NULL
                    'default': row[4]
                }
                for row in rows
            ]
    
    finally:
        client.close()


def preview_table(engine: str, connection_params: Dict[str, Any], table: str, schema: str = None, limit: int = 100) -> tuple:
    """Preview table data, returns (rows, columns)"""
    client = get_database_client(engine, connection_params)
    
    try:
        client.connect()
        
        if engine == 'postgresql':
            if schema:
                query = f'SELECT * FROM "{schema}"."{table}" LIMIT {limit}'
            else:
                query = f'SELECT * FROM "{table}" LIMIT {limit}'
        elif engine == 'mysql':
            if schema:
                query = f'SELECT * FROM `{schema}`.`{table}` LIMIT {limit}'
            else:
                query = f'SELECT * FROM `{table}` LIMIT {limit}'
        elif engine == 'sqlite':
            query = f'SELECT * FROM "{table}" LIMIT {limit}'
        else:
            raise ValueError(f"Unsupported engine: {engine}")
        
        return client.execute_query(query, limit=limit)
    
    finally:
        client.close()

