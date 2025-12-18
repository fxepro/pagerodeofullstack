"""
Coinbase Commerce API Service Module

Handles all Coinbase Commerce API interactions for payments and charges.
Coinbase Commerce is used for cryptocurrency payments (one-time charges).
"""

import os
import hmac
import hashlib
import requests
import logging
from typing import Dict, Optional, Any
from django.conf import settings

logger = logging.getLogger(__name__)


class CoinbaseService:
    """Service class for Coinbase Commerce API interactions"""
    
    def __init__(self):
        self.api_key = os.getenv('COINBASE_API_KEY')
        self.webhook_secret = os.getenv('COINBASE_WEBHOOK_SECRET')
        self.mode = os.getenv('COINBASE_MODE', 'sandbox')
        
        if self.mode == 'sandbox':
            self.base_url = 'https://api.commerce.coinbase.com'
        else:
            self.base_url = 'https://api.commerce.coinbase.com'  # Same URL for production
        
        if not self.api_key:
            logger.warning("Coinbase API key not configured")
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers for Coinbase API requests"""
        if not self.api_key:
            return {}
        
        return {
            'X-CC-Api-Key': self.api_key,
            'X-CC-Version': '2018-03-22',
            'Content-Type': 'application/json',
        }
    
    def create_charge(self, 
                     amount: str, 
                     currency: str = 'USD',
                     name: str = '',
                     description: str = '',
                     metadata: Optional[Dict] = None,
                     redirect_url: Optional[str] = None,
                     cancel_url: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Create a Coinbase Commerce charge
        
        Args:
            amount: Amount as string (e.g., "10.00")
            currency: Currency code (default: USD, but Coinbase accepts crypto)
            name: Charge name
            description: Charge description
            metadata: Additional metadata dict
        
        Returns:
            Charge object from Coinbase API
        """
        if not self.api_key:
            logger.error("Coinbase API key not configured")
            return None
        
        url = f'{self.base_url}/charges'
        
        payload = {
            'name': name or 'Subscription Payment',
            'description': description or 'Payment for subscription',
            'pricing_type': 'fixed_price',
            'local_price': {
                'amount': amount,
                'currency': currency
            },
            'metadata': metadata or {}
        }
        
        # Add redirect URLs if provided
        if redirect_url:
            payload['redirect_url'] = redirect_url
        if cancel_url:
            payload['cancel_url'] = cancel_url
        
        try:
            response = requests.post(
                url, 
                headers=self.get_headers(), 
                json=payload, 
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            charge = data.get('data', {})
            logger.info(f"Created Coinbase charge: {charge.get('id')}")
            return charge
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create Coinbase charge: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    logger.error(f"Coinbase API Error Response: {error_detail}")
                except:
                    logger.error(f"Coinbase API Error Response (text): {e.response.text}")
                logger.error(f"Status Code: {e.response.status_code}")
            else:
                logger.error(f"Request failed without response: {str(e)}")
            return None
    
    def get_charge(self, charge_id: str) -> Optional[Dict[str, Any]]:
        """Get charge details from Coinbase"""
        if not self.api_key:
            return None
        
        url = f'{self.base_url}/charges/{charge_id}'
        
        try:
            response = requests.get(url, headers=self.get_headers(), timeout=10)
            response.raise_for_status()
            
            data = response.json()
            return data.get('data', {})
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get Coinbase charge: {str(e)}")
            return None
    
    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """
        Verify Coinbase webhook signature
        
        Args:
            payload: Raw request body as string
            signature: X-CC-Webhook-Signature header value
        
        Returns:
            True if signature is valid
        """
        if not self.webhook_secret:
            logger.warning("Coinbase webhook secret not configured")
            return False
        
        try:
            # Coinbase uses HMAC SHA256
            expected_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures (constant-time comparison)
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"Error verifying Coinbase webhook signature: {str(e)}")
            return False
    
    def cancel_charge(self, charge_id: str) -> bool:
        """Cancel a Coinbase charge (if still pending)"""
        if not self.api_key:
            return False
        
        url = f'{self.base_url}/charges/{charge_id}/cancel'
        
        try:
            response = requests.post(url, headers=self.get_headers(), timeout=10)
            response.raise_for_status()
            
            logger.info(f"Cancelled Coinbase charge: {charge_id}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to cancel Coinbase charge: {str(e)}")
            return False
    
    def resolve_charge(self, charge_id: str) -> bool:
        """Resolve a charge (mark as resolved manually)"""
        if not self.api_key:
            return False
        
        url = f'{self.base_url}/charges/{charge_id}/resolve'
        
        try:
            response = requests.post(url, headers=self.get_headers(), timeout=10)
            response.raise_for_status()
            
            logger.info(f"Resolved Coinbase charge: {charge_id}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to resolve Coinbase charge: {str(e)}")
            return False

