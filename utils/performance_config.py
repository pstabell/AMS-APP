"""
Performance Configuration
Sprint 6, Task 6.1: Performance Optimization
Settings and utilities for optimizing application performance
"""

import streamlit as st
from functools import wraps
import time

# =============================================================================
# STREAMLIT CACHING CONFIGURATION
# =============================================================================

# Cache TTL settings (in seconds)
CACHE_TTL = {
    'agent_performance': 300,  # 5 minutes
    'leaderboard': 180,  # 3 minutes
    'notifications': 60,  # 1 minute
    'badges': 600,  # 10 minutes
    'commission_statements': 300,  # 5 minutes
    'renewal_pipeline': 180,  # 3 minutes
    'agency_stats': 600,  # 10 minutes
}

# Query optimization settings
MAX_RESULTS_PER_PAGE = 100
DEFAULT_PAGINATION_SIZE = 25

# Database connection pooling
DB_POOL_SIZE = 5
DB_POOL_TIMEOUT = 30

# =============================================================================
# PERFORMANCE MONITORING
# =============================================================================

def performance_monitor(func):
    """
    Decorator to monitor function execution time.

    Usage:
        @performance_monitor
        def slow_function():
            # expensive operation
            pass
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time

        # Log slow operations (>2 seconds)
        if execution_time > 2.0:
            print(f"⚠️ SLOW OPERATION: {func.__name__} took {execution_time:.2f}s")

        return result
    return wrapper


# =============================================================================
# LAZY LOADING UTILITIES
# =============================================================================

def lazy_load_data(data_loader_func, placeholder_text="Loading..."):
    """
    Lazy load data with a loading indicator.

    Args:
        data_loader_func: Function that loads data
        placeholder_text: Text to show while loading

    Returns:
        Loaded data
    """
    with st.spinner(placeholder_text):
        return data_loader_func()


# =============================================================================
# QUERY OPTIMIZATION HINTS
# =============================================================================

OPTIMIZED_QUERIES = {
    'agent_performance': """
        SELECT
            agent_id,
            SUM(premium) as total_premium,
            SUM(commission) as total_commission,
            COUNT(*) as policy_count
        FROM policies
        WHERE agent_id = %s AND effective_date >= %s
        GROUP BY agent_id
    """,
    'leaderboard_rankings': """
        SELECT
            agent_id,
            full_name,
            SUM(premium) as total_premium
        FROM policies p
        JOIN agents a ON p.agent_id = a.id
        WHERE p.effective_date >= %s
        GROUP BY agent_id, full_name
        ORDER BY total_premium DESC
        LIMIT %s
    """,
}

# =============================================================================
# BATCH OPERATIONS
# =============================================================================

def batch_process(items, batch_size=50, processor_func=None):
    """
    Process items in batches to avoid overwhelming the database.

    Args:
        items: List of items to process
        batch_size: Number of items per batch
        processor_func: Function to process each batch

    Returns:
        List of results
    """
    results = []
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        if processor_func:
            batch_results = processor_func(batch)
            results.extend(batch_results)
    return results


# =============================================================================
# STREAMLIT-SPECIFIC OPTIMIZATIONS
# =============================================================================

def optimize_dataframe_display(df, max_rows=1000):
    """
    Optimize large dataframe display in Streamlit.

    Args:
        df: Pandas dataframe
        max_rows: Maximum rows to display

    Returns:
        Optimized dataframe
    """
    if len(df) > max_rows:
        st.warning(f"Showing first {max_rows} of {len(df)} rows for performance")
        return df.head(max_rows)
    return df


def configure_streamlit_performance():
    """
    Configure Streamlit for optimal performance.
    Call this at the start of your app.
    """
    # Set page config for performance
    st.set_page_config(
        page_title="Agency AMS Platform",
        page_icon="📊",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    # Disable file watcher for production
    # This prevents unnecessary reloads
    # Note: This is set via config.toml in production


# =============================================================================
# CACHE WARMING
# =============================================================================

def warm_cache(agent_id, agency_id):
    """
    Pre-load commonly accessed data into cache.

    Args:
        agent_id: Agent UUID
        agency_id: Agency UUID
    """
    from utils.agent_data_helpers import (
        get_agent_performance_metrics,
        get_agent_ranking,
        get_unread_notification_count
    )

    # Pre-load frequently accessed data
    try:
        get_agent_performance_metrics(agent_id)
        get_agent_ranking(agent_id)
        get_unread_notification_count(agent_id)
    except Exception as e:
        print(f"Cache warming failed: {e}")
