"""
Test script for PayPal integration

Run this to test the PayPal endpoints:
    python manage.py shell < test_paypal_integration.py
    OR
    python test_paypal_integration.py
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import SubscriptionPlan, PaymentProviderConfig
from users.paypal_service import PayPalService


def test_paypal_service():
    """Test PayPal service initialization and token retrieval"""
    print("\n🧪 Testing PayPal Service...")
    
    service = PayPalService()
    
    # Check credentials
    if not service.client_id or not service.client_secret:
        print("❌ PayPal credentials not configured in .env")
        print("   Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET")
        return False
    
    print(f"✓ PayPal Service initialized")
    print(f"  Mode: {service.mode}")
    print(f"  Base URL: {service.base_url}")
    
    # Test access token
    token = service.get_access_token()
    if token:
        print(f"✓ Successfully obtained access token")
        return True
    else:
        print("❌ Failed to obtain access token")
        return False


def test_subscription_plans():
    """Test that subscription plans are seeded"""
    print("\n🧪 Testing Subscription Plans...")
    
    plans = SubscriptionPlan.objects.all()
    
    if plans.count() == 0:
        print("❌ No subscription plans found")
        print("   Run: python manage.py seed_subscription_plans")
        return False
    
    print(f"✓ Found {plans.count()} subscription plans:")
    for plan in plans:
        monthly_id = plan.paypal_plan_id_monthly or "Not set"
        annual_id = plan.paypal_plan_id_annual or "Not set"
        print(f"  - {plan.plan_name}: ${plan.price_monthly}/mo")
        print(f"    Monthly Plan ID: {monthly_id}")
        print(f"    Annual Plan ID: {annual_id}")
    
    return True


def test_webhook_config():
    """Test webhook configuration"""
    print("\n🧪 Testing Webhook Configuration...")
    
    webhook_id = os.getenv('PAYPAL_WEBHOOK_ID')
    
    if not webhook_id:
        print("⚠️  PAYPAL_WEBHOOK_ID not set in .env")
        print("   This is needed for webhook signature verification")
        return False
    
    print(f"✓ Webhook ID configured: {webhook_id[:20]}...")
    return True


def main():
    """Run all tests"""
    print("=" * 60)
    print("PayPal Integration Test Suite")
    print("=" * 60)
    
    results = []
    
    # Test 1: Subscription Plans
    results.append(("Subscription Plans", test_subscription_plans()))
    
    # Test 2: PayPal Service
    results.append(("PayPal Service", test_paypal_service()))
    
    # Test 3: Webhook Config
    results.append(("Webhook Config", test_webhook_config()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n✅ All tests passed! Integration is ready.")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
    
    return all_passed


if __name__ == '__main__':
    main()

