"""
PayPal API Service Module

Handles all PayPal API interactions for subscriptions and payments.
"""

import os
import base64
import requests
import logging
from typing import Dict, Optional, Any
from django.conf import settings

logger = logging.getLogger(__name__)


class PayPalService:
    """Service class for PayPal API interactions"""
    
    def __init__(self):
        self.client_id = os.getenv('PAYPAL_CLIENT_ID')
        self.client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
        self.mode = os.getenv('PAYPAL_MODE', 'sandbox')
        
        if self.mode == 'sandbox':
            self.base_url = 'https://api-m.sandbox.paypal.com'
        else:
            self.base_url = 'https://api-m.paypal.com'
        
        self.access_token = None
    
    def get_access_token(self) -> Optional[str]:
        """Get PayPal OAuth access token"""
        if self.access_token:
            return self.access_token
        
        if not self.client_id or not self.client_secret:
            logger.error("PayPal credentials not configured")
            return None
        
        url = f'{self.base_url}/v1/oauth2/token'
        
        auth_string = f'{self.client_id}:{self.client_secret}'
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        
        data = 'grant_type=client_credentials'
        
        try:
            response = requests.post(url, headers=headers, data=data, timeout=10)
            response.raise_for_status()
            
            self.access_token = response.json()['access_token']
            logger.info("Successfully obtained PayPal access token")
            return self.access_token
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get PayPal access token: {str(e)}")
            return None
    
    def create_subscription(self, plan_id: str, return_url: str, cancel_url: str) -> Optional[Dict[str, Any]]:
        """Create a PayPal subscription"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        url = f'{self.base_url}/v1/billing/subscriptions'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        }
        
        payload = {
            'plan_id': plan_id,
            'application_context': {
                'brand_name': 'Pagerodeo',
                'locale': 'en-US',
                'shipping_preference': 'NO_SHIPPING',
                'user_action': 'SUBSCRIBE_NOW',
                'payment_method': {
                    'payer_selected': 'PAYPAL',
                    'payee_preferred': 'IMMEDIATE_PAYMENT_REQUIRED'
                },
                'return_url': return_url,
                'cancel_url': cancel_url
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Created PayPal subscription: {data.get('id')}")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create PayPal subscription: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            return None
    
    def get_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription details from PayPal"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        url = f'{self.base_url}/v1/billing/subscriptions/{subscription_id}'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get PayPal subscription: {str(e)}")
            return None
    
    def cancel_subscription(self, subscription_id: str, reason: str = '') -> bool:
        """Cancel a PayPal subscription"""
        access_token = self.get_access_token()
        if not access_token:
            return False
        
        url = f'{self.base_url}/v1/billing/subscriptions/{subscription_id}/cancel'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        payload = {
            'reason': reason or 'User requested cancellation'
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            
            logger.info(f"Cancelled PayPal subscription: {subscription_id}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to cancel PayPal subscription: {str(e)}")
            return False
    
    def verify_webhook_signature(self, headers: Dict[str, str], body: str, webhook_id: str) -> bool:
        """Verify PayPal webhook signature"""
        access_token = self.get_access_token()
        if not access_token:
            return False
        
        url = f'{self.base_url}/v1/notifications/verify-webhook-signature'
        
        auth_header = headers.get('PAYPAL-AUTH-ALGO', '')
        cert_url = headers.get('PAYPAL-CERT-URL', '')
        transmission_id = headers.get('PAYPAL-TRANSMISSION-ID', '')
        transmission_sig = headers.get('PAYPAL-TRANSMISSION-SIG', '')
        transmission_time = headers.get('PAYPAL-TRANSMISSION-TIME', '')
        
        if not all([auth_header, cert_url, transmission_id, transmission_sig, transmission_time]):
            logger.warning("Missing PayPal webhook signature headers")
            return False
        
        payload = {
            'auth_algo': auth_header,
            'cert_url': cert_url,
            'transmission_id': transmission_id,
            'transmission_sig': transmission_sig,
            'transmission_time': transmission_time,
            'webhook_id': webhook_id,
            'webhook_event': body
        }
        
        headers_request = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.post(url, headers=headers_request, json=payload, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            verification_status = result.get('verification_status', '')
            
            if verification_status == 'SUCCESS':
                logger.info("PayPal webhook signature verified successfully")
                return True
            else:
                logger.warning(f"PayPal webhook signature verification failed: {verification_status}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to verify PayPal webhook signature: {str(e)}")
            return False
    
    def is_configured(self) -> bool:
        """Check if PayPal is configured (has client ID and secret)"""
        return bool(self.client_id and self.client_secret)
    
    def list_products(self, page_size: int = 20, page: int = 1) -> Optional[Dict[str, Any]]:
        """List all PayPal products"""
        access_token = self.get_access_token()
        if not access_token:
            logger.warning("Cannot list PayPal products: No access token")
            return None
        
        url = f'{self.base_url}/v1/catalogs/products'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        params = {
            'page_size': page_size,
            'page': page,
        }
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"PayPal API HTTP error listing products: {e.response.status_code} - {e.response.text}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to list PayPal products: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error listing PayPal products: {str(e)}")
            return None
    
    def list_plans(self, product_id: Optional[str] = None, page_size: int = 20, page: int = 1) -> Optional[Dict[str, Any]]:
        """List all PayPal billing plans"""
        access_token = self.get_access_token()
        if not access_token:
            logger.warning("Cannot list PayPal plans: No access token")
            return None
        
        url = f'{self.base_url}/v1/billing/plans'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        params = {
            'page_size': page_size,
            'page': page,
        }
        
        if product_id:
            params['product_id'] = product_id
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"PayPal API HTTP error listing plans: {e.response.status_code} - {e.response.text}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to list PayPal plans: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error listing PayPal plans: {str(e)}")
            return None
    
    def get_plan(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific PayPal billing plan"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        url = f'{self.base_url}/v1/billing/plans/{plan_id}'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get PayPal plan: {str(e)}")
            return None
    
    def get_account_info(self) -> Optional[Dict[str, Any]]:
        """Get PayPal merchant account information"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        url = f'{self.base_url}/v1/identity/oauth2/userinfo'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        params = {
            'schema': 'paypalv1.1'
        }
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"PayPal API HTTP error getting account info: {e.response.status_code} - {e.response.text}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get PayPal account info: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting PayPal account info: {str(e)}")
            return None
    
    def list_transactions(self, start_date: Optional[str] = None, end_date: Optional[str] = None, page_size: int = 20, page: int = 1) -> Optional[Dict[str, Any]]:
        """List PayPal transactions/orders"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        url = f'{self.base_url}/v2/reporting/transactions'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        params = {
            'page_size': page_size,
            'page': page,
        }
        
        if start_date:
            params['start_date'] = start_date
        if end_date:
            params['end_date'] = end_date
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"PayPal API HTTP error listing transactions: {e.response.status_code} - {e.response.text}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to list PayPal transactions: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error listing PayPal transactions: {str(e)}")
            return None
    
    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Get PayPal order details including payment method"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        url = f'{self.base_url}/v2/checkout/orders/{order_id}'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"PayPal API HTTP error getting order: {e.response.status_code} - {e.response.text}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get PayPal order: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting PayPal order: {str(e)}")
            return None
    
    def get_merchant_integrations(self) -> Optional[Dict[str, Any]]:
        """Get merchant integrations and settings"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        # Get account info which includes merchant details
        account_info = self.get_account_info()
        if not account_info:
            return None
        
        # Try to get additional merchant details
        url = f'{self.base_url}/v1/customer/partners'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                partners_data = response.json()
            else:
                partners_data = None
        except:
            partners_data = None
        
        return {
            'account_info': account_info,
            'partners': partners_data,
            'client_id': self.client_id,
            'mode': self.mode,
        }

