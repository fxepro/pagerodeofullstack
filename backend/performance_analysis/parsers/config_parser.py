"""
Config and environment parser for Lighthouse data.

Extracts configuration settings and environment data for test reproducibility.
"""

from ..models import PerformanceAnalysis


def parse_config_environment(performance_analysis: PerformanceAnalysis, lighthouse_result: dict) -> None:
    """
    Parse config settings and environment data from Lighthouse results.
    
    Important for test reproducibility and understanding test conditions:
    - configSettings: Throttling, emulation settings, etc.
    - environment: CPU, network, benchmarkIndex, user agent
    - requestedUrl: Original URL requested
    - finalDisplayedUrl: Final URL after redirects
    - lighthouseVersion: Version of Lighthouse used
    - runWarnings: Any warnings during the run
    
    Args:
        performance_analysis: PerformanceAnalysis instance to update
        lighthouse_result: Normalized Lighthouse result dict
    """
    if not lighthouse_result or not isinstance(lighthouse_result, dict):
        print("[ParseConfigEnvironment] No lighthouse_result or not a dict")
        return
    
    # Extract config and environment data
    config_settings = lighthouse_result.get("configSettings", {})
    environment = lighthouse_result.get("environment", {})
    requested_url = lighthouse_result.get("requestedUrl", "")
    final_displayed_url = lighthouse_result.get("finalDisplayedUrl", "")
    lighthouse_version = lighthouse_result.get("lighthouseVersion", "")
    run_warnings = lighthouse_result.get("runWarnings", [])
    
    # Store in recommendations field in a structured format
    # This allows access without requiring a model migration
    current_recommendations = performance_analysis.recommendations
    
    # Prepare config/environment data
    config_env_data = {
        "configSettings": config_settings,
        "environment": environment,
        "requestedUrl": requested_url,
        "finalDisplayedUrl": final_displayed_url,
        "lighthouseVersion": lighthouse_version,
        "runWarnings": run_warnings
    }
    
    # Update recommendations structure, preserving existing data
    if isinstance(current_recommendations, dict):
        # If it already has our structure, update config_environment but preserve other fields
        current_recommendations["config_environment"] = config_env_data
        performance_analysis.recommendations = current_recommendations
    elif isinstance(current_recommendations, list):
        # Convert to dict format
        performance_analysis.recommendations = {
            "recommendations": current_recommendations,
            "config_environment": config_env_data
        }
    else:
        # Create new structure
        performance_analysis.recommendations = {
            "recommendations": [],
            "config_environment": config_env_data
        }
    
    performance_analysis.save(update_fields=['recommendations'])
    
    # Also update URL if finalDisplayedUrl is different from requestedUrl
    if final_displayed_url and final_displayed_url != performance_analysis.url:
        # Store the original requested URL if different
        # Note: We keep performance_analysis.url as the analyzed URL
        # The finalDisplayedUrl is stored in config_environment for reference
        pass
    
    print(f"[ParseConfigEnvironment] [OK] Stored config/environment data")
    print(f"[ParseConfigEnvironment]   - Lighthouse version: {lighthouse_version}")
    print(f"[ParseConfigEnvironment]   - Requested URL: {requested_url}")
    print(f"[ParseConfigEnvironment]   - Final URL: {final_displayed_url}")
    print(f"[ParseConfigEnvironment]   - Run warnings: {len(run_warnings) if isinstance(run_warnings, list) else 0}")

