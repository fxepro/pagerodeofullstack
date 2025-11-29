"""
Background tasks for performance analysis processing.

Currently DISABLED - parsing runs synchronously.
Enable Celery when ready for production scaling.
"""

# Celery task for parsing detailed performance data
# DISABLED until single-site parsing is verified
# Uncomment when ready to enable background processing

# from celery import shared_task
# from .models import PerformanceAnalysis
# from .parsers import parse_detailed_data
# import logging
# 
# logger = logging.getLogger(__name__)
# 
# @shared_task(bind=True, max_retries=3)
# def parse_performance_details(self, analysis_id):
#     """
#     Background task to parse detailed performance data.
#     
#     Runs asynchronously - doesn't block HTTP request.
#     Automatically retries up to 3 times on failure.
#     
#     Args:
#         analysis_id: ID of PerformanceAnalysis to parse
#     """
#     try:
#         analysis = PerformanceAnalysis.objects.get(id=analysis_id)
#         
#         logger.info(f"[Celery] Starting parse for PerformanceAnalysis {analysis_id}")
#         parse_detailed_data(analysis)
#         logger.info(f"[Celery] Successfully parsed PerformanceAnalysis {analysis_id}")
#         
#         return {
#             'status': 'success',
#             'analysis_id': analysis_id,
#             'network_requests': analysis.network_requests.count(),
#             'resource_breakdowns': analysis.resource_breakdowns.count(),
#             'timeline_events': analysis.timeline_events.count(),
#         }
#         
#     except PerformanceAnalysis.DoesNotExist:
#         logger.error(f"[Celery] PerformanceAnalysis {analysis_id} not found")
#         raise
#         
#     except Exception as exc:
#         logger.error(f"[Celery] Error parsing PerformanceAnalysis {analysis_id}: {exc}")
#         # Retry with exponential backoff
#         raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

# For now, use synchronous parsing (see views.py)
# When ready to enable Celery:
# 1. Install: pip install celery redis
# 2. Configure Celery in core/celery.py and settings.py
# 3. Uncomment this file
# 4. Update views.py to use: parse_performance_details.delay(analysis.id)
# 5. Run: celery -A core worker --loglevel=info

