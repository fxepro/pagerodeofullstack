from django.urls import path
from .paypal_views import (
    create_paypal_subscription,
    confirm_paypal_subscription,
    paypal_webhook,
    get_paypal_status,
    get_paypal_products,
    get_subscription_plans_with_paypal,
    get_paypal_integration_details,
)
from .coinbase_views import (
    create_coinbase_charge,
    confirm_coinbase_charge,
    coinbase_webhook,
)
from .stripe_views import (
    create_stripe_checkout,
    stripe_checkout_success,
    stripe_webhook,
    cancel_stripe_subscription,
    get_stripe_subscription,
    get_stripe_status,
    get_stripe_products,
    get_subscription_plans_with_stripe,
)
from .payment_provider_views import (
    get_payment_providers,
    get_payment_provider,
    update_payment_provider,
    test_payment_provider,
)
from .views import (
    payment_methods,
    payment_method_detail,
    user_subscriptions,
    subscription_detail,
    billing_history,
    billing_summary,
    billing_transaction_detail,
)

urlpatterns = [
    # PayPal payment endpoints
    path('api/payments/paypal/create-subscription', create_paypal_subscription, name='create_paypal_subscription'),
    path('api/payments/paypal/confirm', confirm_paypal_subscription, name='confirm_paypal_subscription'),
    path('api/payments/paypal/webhook/', paypal_webhook, name='paypal_webhook'),
    path('api/payments/paypal/status', get_paypal_status, name='get_paypal_status'),
    path('api/payments/paypal/products', get_paypal_products, name='get_paypal_products'),
    path('api/payments/paypal/plans', get_subscription_plans_with_paypal, name='get_subscription_plans_with_paypal'),
    path('api/payments/paypal/integration-details', get_paypal_integration_details, name='get_paypal_integration_details'),

    # Coinbase payment endpoints
    path('api/payments/coinbase/create-charge', create_coinbase_charge, name='create_coinbase_charge'),
    path('api/payments/coinbase/confirm', confirm_coinbase_charge, name='confirm_coinbase_charge'),
    path('api/payments/coinbase/webhook/', coinbase_webhook, name='coinbase_webhook'),

    # Stripe payment endpoints
    path('api/payments/stripe/create-checkout/', create_stripe_checkout, name='create_stripe_checkout'),
    path('api/payments/stripe/success', stripe_checkout_success, name='stripe_checkout_success'),
    path('api/payments/stripe/webhook/', stripe_webhook, name='stripe_webhook'),
    path('api/payments/stripe/cancel-subscription', cancel_stripe_subscription, name='cancel_stripe_subscription'),
    path('api/payments/stripe/subscription/<str:subscription_id>/', get_stripe_subscription, name='get_stripe_subscription'),
    path('api/payments/stripe/status', get_stripe_status, name='get_stripe_status'),
    path('api/payments/stripe/products', get_stripe_products, name='get_stripe_products'),
    path('api/payments/stripe/plans', get_subscription_plans_with_stripe, name='get_subscription_plans_with_stripe'),

    # Payment provider configuration endpoints
    path('api/payments/providers/', get_payment_providers, name='get_payment_providers'),
    path('api/payments/providers/<str:provider_id>/', get_payment_provider, name='get_payment_provider'),
    path('api/payments/providers/<str:provider_id>/update/', update_payment_provider, name='update_payment_provider'),
    path('api/payments/providers/<str:provider_id>/test/', test_payment_provider, name='test_payment_provider'),

    # User financial profile endpoints
    path('api/profile/payment-methods/', payment_methods, name='payment_methods'),
    path('api/profile/payment-methods/<int:method_id>/', payment_method_detail, name='payment_method_detail'),
    path('api/profile/subscriptions/', user_subscriptions, name='user_subscriptions'),
    path('api/profile/subscriptions/<int:subscription_id>/', subscription_detail, name='subscription_detail'),
    path('api/profile/billing-history/', billing_history, name='billing_history'),
    path('api/profile/billing-history/<int:transaction_id>/', billing_transaction_detail, name='billing_transaction_detail'),
    path('api/profile/billing-summary/', billing_summary, name='billing_summary'),
]

