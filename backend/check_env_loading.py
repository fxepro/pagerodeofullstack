"""
Quick script to verify .env file is being loaded correctly
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Get the backend directory (same as BASE_DIR in settings.py)
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / '.env'

print(f"Looking for .env file at: {env_path}")
print(f"File exists: {env_path.exists()}")

if env_path.exists():
    print(f"\n.env file found! Loading...")
    load_dotenv(dotenv_path=env_path)
    
    # Check the variables
    frontend_url = os.getenv("FRONTEND_URL")
    next_public_app_url = os.getenv("NEXT_PUBLIC_APP_URL")
    next_public_api_url = os.getenv("NEXT_PUBLIC_API_BASE_URL")
    
    print(f"\n✅ Environment variables loaded:")
    print(f"  FRONTEND_URL: {frontend_url}")
    print(f"  NEXT_PUBLIC_APP_URL: {next_public_app_url}")
    print(f"  NEXT_PUBLIC_API_BASE_URL: {next_public_api_url}")
    
    if frontend_url is None:
        print("\n⚠️  WARNING: FRONTEND_URL is None!")
        print("   Make sure your .env file contains:")
        print("   FRONTEND_URL=https://pagerodeo.com")
    else:
        print(f"\n✅ SUCCESS: FRONTEND_URL is set to: {frontend_url}")
else:
    print(f"\n❌ ERROR: .env file not found at {env_path}")
    print("   Please create a .env file in the backend/ directory")
    print("   You can copy env.example: cp env.example .env")

