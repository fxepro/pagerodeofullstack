"""
URL routing for Affiliates app
"""
from django.urls import path
from . import views

urlpatterns = [
    # Affiliate endpoints
    path('affiliates/', views.affiliates_list, name='affiliates-list'),
    path('affiliates/<int:pk>/', views.affiliate_detail, name='affiliate-detail'),
    path('affiliates/<int:pk>/approve/', views.approve_affiliate, name='approve-affiliate'),
    path('affiliates/<int:pk>/suspend/', views.suspend_affiliate, name='suspend-affiliate'),
    path('affiliates/<int:pk>/reject/', views.reject_affiliate, name='reject-affiliate'),
    path('affiliates/generate-code/', views.generate_affiliate_code, name='generate-affiliate-code'),
    path('affiliates/apply/', views.affiliate_apply, name='affiliate-apply'),  # Public sign-up
    
    # Referral endpoints
    path('referrals/', views.referrals_list, name='referrals-list'),
    path('referrals/track/', views.track_referral, name='track-referral'),
    
    # Commission endpoints
    path('commissions/', views.commissions_list, name='commissions-list'),
    path('commissions/<int:pk>/approve/', views.approve_commission, name='approve-commission'),
    
    # Payout endpoints
    path('payouts/', views.payouts_list, name='payouts-list'),
    path('payouts/<int:pk>/process/', views.process_payout, name='process-payout'),
    
    # Statistics
    path('stats/', views.affiliate_stats, name='affiliate-stats'),
]

