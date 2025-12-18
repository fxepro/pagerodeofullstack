"""
Stripe API Service Module

Handles all Stripe API interactions for subscriptions and payments.
"""

import os
import stripe
import logging
from typing import Dict, Optional, Any, List
from django.conf import settings

logger = logging.getLogger(__name__)


class StripeService:
    """Service class for Stripe API interactions"""
    
    def __init__(self):
        # Get Stripe keys from environment variables
        # Standard naming: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
        # Alternative naming: STRIPE_PUBLIC_KEY for publishable key
        self.secret_key = os.getenv('STRIPE_SECRET_KEY')
        self.publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY') or os.getenv('STRIPE_PUBLIC_KEY')
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        self.mode = os.getenv('STRIPE_MODE', 'test')  # 'test' or 'live'
        
        if not self.secret_key:
            logger.warning("Stripe secret key not configured")
        else:
            # Set Stripe API key
            stripe.api_key = self.secret_key
        
        if not self.publishable_key:
            logger.warning("Stripe publishable key not configured")
    
    def create_checkout_session(self,
                                price_id: str,
                                customer_email: Optional[str] = None,
                                success_url: str = '',
                                cancel_url: str = '',
                                mode: str = 'subscription',
                                metadata: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
        """
        Create a Stripe Checkout session
        
        Args:
            price_id: Stripe Price ID (e.g., 'price_1234567890')
            customer_email: Customer email address
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment is canceled
            mode: 'subscription' for recurring, 'payment' for one-time
            metadata: Additional metadata to attach to the session
        
        Returns:
            Checkout session object or None if error
        """
        if not self.secret_key:
            logger.error("Stripe secret key not configured")
            return None
        
        try:
            session_params = {
                'payment_method_types': ['card'],
                'mode': mode,
                'line_items': [{
                    'price': price_id,
                    'quantity': 1,
                }],
                'success_url': success_url,
                'cancel_url': cancel_url,
            }
            
            if customer_email:
                session_params['customer_email'] = customer_email
            
            if metadata:
                session_params['metadata'] = metadata
            
            session = stripe.checkout.Session.create(**session_params)
            logger.info(f"Created Stripe checkout session: {session.id}")
            return session.to_dict()
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error creating checkout session: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating checkout session: {str(e)}")
            return None
    
    def create_subscription(self,
                           customer_id: Optional[str] = None,
                           customer_email: Optional[str] = None,
                           price_id: str = '',
                           metadata: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
        """
        Create a Stripe subscription directly (without Checkout)
        
        Args:
            customer_id: Existing Stripe customer ID (optional)
            customer_email: Customer email (creates customer if customer_id not provided)
            price_id: Stripe Price ID
            metadata: Additional metadata
        
        Returns:
            Subscription object or None if error
        """
        if not self.secret_key:
            logger.error("Stripe secret key not configured")
            return None
        
        try:
            # Create or retrieve customer
            if not customer_id and customer_email:
                customer = stripe.Customer.create(email=customer_email)
                customer_id = customer.id
            
            if not customer_id:
                logger.error("Either customer_id or customer_email must be provided")
                return None
            
            # Create subscription
            subscription_params = {
                'customer': customer_id,
                'items': [{
                    'price': price_id,
                }],
            }
            
            if metadata:
                subscription_params['metadata'] = metadata
            
            subscription = stripe.Subscription.create(**subscription_params)
            logger.info(f"Created Stripe subscription: {subscription.id}")
            return subscription.to_dict()
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error creating subscription: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating subscription: {str(e)}")
            return None
    
    def get_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve subscription details"""
        if not self.secret_key:
            logger.error("Stripe secret key not configured")
            return None
        
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return subscription.to_dict()
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error retrieving subscription: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error retrieving subscription: {str(e)}")
            return None
    
    def cancel_subscription(self, subscription_id: str, immediately: bool = False) -> Optional[Dict[str, Any]]:
        """
        Cancel a Stripe subscription
        
        Args:
            subscription_id: Stripe subscription ID
            immediately: If True, cancel immediately. If False, cancel at period end
        
        Returns:
            Updated subscription object or None if error
        """
        if not self.secret_key:
            logger.error("Stripe secret key not configured")
            return None
        
        try:
            if immediately:
                subscription = stripe.Subscription.delete(subscription_id)
            else:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            logger.info(f"Cancelled Stripe subscription: {subscription_id}")
            return subscription.to_dict()
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error cancelling subscription: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error cancelling subscription: {str(e)}")
            return None
    
    def update_subscription(self,
                           subscription_id: str,
                           new_price_id: Optional[str] = None,
                           metadata: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
        """
        Update a Stripe subscription (e.g., change plan)
        
        Args:
            subscription_id: Stripe subscription ID
            new_price_id: New Stripe Price ID to switch to
            metadata: Updated metadata
        
        Returns:
            Updated subscription object or None if error
        """
        if not self.secret_key:
            logger.error("Stripe secret key not configured")
            return None
        
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            update_params = {}
            
            if new_price_id:
                # Get current subscription item
                subscription_item_id = subscription['items']['data'][0].id
                # Update the price
                stripe.SubscriptionItem.modify(
                    subscription_item_id,
                    price=new_price_id
                )
            
            if metadata:
                update_params['metadata'] = metadata
            
            if update_params:
                subscription = stripe.Subscription.modify(subscription_id, **update_params)
            
            logger.info(f"Updated Stripe subscription: {subscription_id}")
            return subscription.to_dict()
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error updating subscription: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error updating subscription: {str(e)}")
            return None
    
    def get_checkout_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve checkout session details"""
        if not self.secret_key:
            logger.error("Stripe secret key not configured")
            return None
        
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            return session.to_dict()
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error retrieving checkout session: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error retrieving checkout session: {str(e)}")
            return None
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> Optional[Dict[str, Any]]:
        """
        Verify Stripe webhook signature
        
        Args:
            payload: Raw webhook payload (bytes)
            signature: Stripe signature from request headers
        
        Returns:
            Event object if valid, None if invalid
        """
        if not self.webhook_secret:
            logger.warning("Stripe webhook secret not configured, skipping signature verification")
            return None
        
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                self.webhook_secret
            )
            return event
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {str(e)}")
            return None
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error verifying webhook: {str(e)}")
            return None
    
    def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve customer details"""
        if not self.secret_key:
            logger.error("Stripe secret key not configured")
            return None
        
        try:
            customer = stripe.Customer.retrieve(customer_id)
            return customer.to_dict()
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error retrieving customer: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error retrieving customer: {str(e)}")
            return None
    
    def create_customer(self, email: str, metadata: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
        """Create a new Stripe customer"""
        if not self.secret_key:
            logger.error("Stripe secret key not configured")
            return None
        
        try:
            customer_params = {'email': email}
            if metadata:
                customer_params['metadata'] = metadata
            
            customer = stripe.Customer.create(**customer_params)
            logger.info(f"Created Stripe customer: {customer.id}")
            return customer.to_dict()
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error creating customer: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating customer: {str(e)}")
            return None
    
    def list_products(self, limit: int = 100) -> Optional[List[Dict[str, Any]]]:
        """List all Stripe products"""
        if not self.secret_key:
            logger.error("Stripe secret key not configured")
            return None
        
        try:
            products = stripe.Product.list(limit=limit, active=True)
            return [product.to_dict() for product in products.data]
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error listing products: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error listing products: {str(e)}")
            return None
    
    def list_prices(self, limit: int = 100, product_id: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
        """List all Stripe prices, optionally filtered by product"""
        if not self.secret_key:
            logger.error("Stripe secret key not configured")
            return None
        
        try:
            params = {'limit': limit, 'active': True}
            if product_id:
                params['product'] = product_id
            
            prices = stripe.Price.list(**params)
            return [price.to_dict() for price in prices.data]
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error listing prices: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error listing prices: {str(e)}")
            return None
    
    def is_configured(self) -> bool:
        """Check if Stripe is configured (has secret key)"""
        return bool(self.secret_key)

