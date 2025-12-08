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

