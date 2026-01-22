"""Test database driver installation"""
import sys

def test_drivers():
    results = {}
    
    # PostgreSQL
    try:
        import psycopg2
        results['PostgreSQL (psycopg2)'] = f"[OK] {psycopg2.__version__}"
    except ImportError as e:
        results['PostgreSQL (psycopg2)'] = f"[FAIL] {str(e)}"
    
    # MySQL
    try:
        import mysql.connector
        results['MySQL'] = f"[OK] {mysql.connector.__version__}"
    except ImportError as e:
        results['MySQL'] = f"[FAIL] {str(e)}"
    
    # SQL Server
    try:
        import pymssql
        results['SQL Server (pymssql)'] = f"[OK] {pymssql.__version__}"
    except ImportError as e:
        results['SQL Server (pymssql)'] = f"[FAIL] {str(e)}"
    
    # Oracle
    try:
        import oracledb
        results['Oracle (oracledb)'] = f"[OK] {oracledb.__version__}"
    except ImportError as e:
        results['Oracle (oracledb)'] = f"[FAIL] {str(e)}"
    
    # MongoDB
    try:
        import pymongo
        results['MongoDB (pymongo)'] = f"[OK] {pymongo.__version__}"
    except ImportError as e:
        results['MongoDB (pymongo)'] = f"[FAIL] {str(e)}"
    
    # Redis
    try:
        import redis
        results['Redis'] = f"[OK] {redis.__version__}"
    except ImportError as e:
        results['Redis'] = f"[FAIL] {str(e)}"
    
    # Cryptography (TLS/SSL)
    try:
        import cryptography
        results['Cryptography (TLS/SSL)'] = f"[OK] {cryptography.__version__}"
    except ImportError as e:
        results['Cryptography (TLS/SSL)'] = f"[FAIL] {str(e)}"
    
    # Print results
    print("\n" + "="*50)
    print("Database Driver Installation Status")
    print("="*50)
    for driver, status in results.items():
        print(f"{driver:30} {status}")
    print("="*50 + "\n")
    
    # Check if all required are installed
    required = ['PostgreSQL (psycopg2)', 'MySQL', 'Cryptography (TLS/SSL)']
    optional = ['SQL Server (pymssql)', 'Oracle (oracledb)', 'MongoDB (pymongo)', 'Redis']
    
    all_required = all('[OK]' in results.get(driver, '') for driver in required)
    installed_optional = sum('[OK]' in results.get(driver, '') for driver in optional)
    
    if all_required:
        print("[OK] All required drivers installed!")
    else:
        print("[FAIL] Some required drivers are missing!")
    
    print(f"Optional drivers installed: {installed_optional}/{len(optional)}")
    
    return all_required

if __name__ == '__main__':
    success = test_drivers()
    sys.exit(0 if success else 1)

