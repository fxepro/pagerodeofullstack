"""
SQL query validator - ensures read-only operations
"""
import re
from typing import Tuple

# Maximum query length
MAX_QUERY_LENGTH = 10000

# Forbidden SQL keywords (write operations)
FORBIDDEN_KEYWORDS = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE',
    'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 'MERGE', 'REPLACE'
]

# Allowed SQL keywords (read operations)
ALLOWED_KEYWORDS = [
    'SELECT', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN', 'WITH'
]


def validate_query(query: str) -> Tuple[bool, str]:
    """
    Validate SQL query for read-only operations
    
    Returns:
        (is_valid: bool, error_message: str)
    """
    if not query or not query.strip():
        return False, "Query cannot be empty"
    
    # Check length
    if len(query) > MAX_QUERY_LENGTH:
        return False, f"Query exceeds maximum length of {MAX_QUERY_LENGTH} characters"
    
    # Normalize query - remove comments and extra whitespace
    normalized = re.sub(r'--.*?$', '', query, flags=re.MULTILINE)
    normalized = re.sub(r'/\*.*?\*/', '', normalized, flags=re.DOTALL)
    normalized = ' '.join(normalized.split())
    normalized_upper = normalized.upper()
    
    # Check for forbidden keywords
    for keyword in FORBIDDEN_KEYWORDS:
        # Use word boundaries to avoid false positives
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, normalized_upper):
            return False, f"Forbidden keyword detected: {keyword}. Only read-only operations are allowed."
    
    # For SELECT queries, ensure they start with SELECT or WITH
    if not any(normalized_upper.strip().startswith(kw) for kw in ALLOWED_KEYWORDS):
        return False, "Query must start with a read-only operation (SELECT, SHOW, DESCRIBE, EXPLAIN, or WITH)"
    
    # Additional safety: check for semicolons that might indicate multiple statements
    # Allow single semicolon at the end
    semicolon_count = normalized.count(';')
    if semicolon_count > 1:
        return False, "Multiple statements are not allowed. Only single queries are permitted."
    
    return True, ""


def sanitize_query(query: str) -> str:
    """Remove comments and normalize whitespace"""
    # Remove SQL comments
    query = re.sub(r'--.*?$', '', query, flags=re.MULTILINE)
    query = re.sub(r'/\*.*?\*/', '', query, flags=re.DOTALL)
    # Normalize whitespace
    query = ' '.join(query.split())
    return query.strip()

