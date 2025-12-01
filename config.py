"""
Application Configuration
Feature flags and settings for easy enable/disable of features

Created: December 1, 2025
"""

# =============================================================================
# FEATURE FLAGS
# =============================================================================
# Set to False to disable features without removing code

FEATURES = {
    # Phase 2 Features (all stable)
    'agent_dashboard': True,
    'commission_tracking': True,
    'gamification': True,
    'leaderboard': True,
    'notifications': True,
    'renewal_management': True,

    # Phase 3 Features
    'ai_insights': True,  # Sprint 3 - AI & Predictive Analytics
    'onedrive_documents': True,  # Sprint 5, Task 5.3 - Document Management (NEW!)

    # Future Features (not yet implemented)
    'commission_reconciliation': False,  # Sprint 5, Task 5.2
    'white_label': False,  # Sprint 6
    'multi_language': False,  # Sprint 6
}

# =============================================================================
# ONEDRIVE/SHAREPOINT CONFIGURATION
# =============================================================================
# These are read from environment variables for security
# Set in your environment or .env file:
#   - MICROSOFT_TENANT_ID
#   - MICROSOFT_CLIENT_ID
#   - MICROSOFT_CLIENT_SECRET

ONEDRIVE_CONFIG = {
    'enabled': FEATURES['onedrive_documents'],
    'root_folder': 'AMS Documents',  # Root folder in OneDrive
    'max_file_size_mb': 100,  # Max file size for uploads
    'allowed_extensions': ['.pdf', '.docx', '.xlsx', '.jpg', '.png', '.msg'],
}

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
# Read from environment variables

DATABASE_CONFIG = {
    'supabase_url': None,  # Set via SUPABASE_URL env var
    'supabase_key': None,  # Set via SUPABASE_KEY env var
}

# =============================================================================
# AI/ML CONFIGURATION
# =============================================================================

AI_CONFIG = {
    'enabled': FEATURES['ai_insights'],
    'renewal_prediction_days_ahead': 90,  # Predict renewals 90 days out
    'churn_risk_threshold': 60,  # Alert if churn risk >= 60
    'clv_discount_rate': 0.10,  # 10% discount rate for CLV present value
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def is_feature_enabled(feature_name: str) -> bool:
    """Check if a feature is enabled."""
    return FEATURES.get(feature_name, False)


def get_onedrive_config():
    """Get OneDrive configuration."""
    return ONEDRIVE_CONFIG


def get_ai_config():
    """Get AI/ML configuration."""
    return AI_CONFIG


# =============================================================================
# EASY DISABLE INSTRUCTIONS
# =============================================================================
"""
To disable a feature:

1. Set the feature flag to False:
   FEATURES['onedrive_documents'] = False

2. Restart the Streamlit app

The feature will disappear from navigation and be inaccessible.
No code changes needed!

To completely remove a feature:
1. Delete the relevant files
2. Remove from navigation in commission_app.py
3. Drop database tables if needed
4. Commit changes to git
"""
