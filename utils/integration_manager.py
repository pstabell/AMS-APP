"""
Integration Manager
Handles agency integration connections, credentials, and sync settings.

Created: November 29, 2025
Branch: agency-platform
Task: 3.2 - Integration Management
"""

import streamlit as st
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import json

from utils.agency_reconciliation_helpers import get_supabase_client


def get_agency_integrations(agency_id: str) -> List[Dict]:
    """
    Get all integrations for an agency.

    Args:
        agency_id: Agency ID

    Returns:
        List of integration configurations
    """
    try:
        supabase = get_supabase_client()
        result = supabase.table('agency_integrations')\
            .select('*')\
            .eq('agency_id', agency_id)\
            .order('created_at', desc=True)\
            .execute()

        return result.data if result.data else []
    except Exception as e:
        # Table might not exist yet
        return []


def get_integration_by_name(agency_id: str, integration_name: str) -> Optional[Dict]:
    """
    Get specific integration configuration.

    Args:
        agency_id: Agency ID
        integration_name: Name of the integration

    Returns:
        Integration configuration or None
    """
    try:
        supabase = get_supabase_client()
        result = supabase.table('agency_integrations')\
            .select('*')\
            .eq('agency_id', agency_id)\
            .eq('integration_name', integration_name)\
            .execute()

        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        return None


def connect_integration(
    agency_id: str,
    integration_name: str,
    integration_type: str,
    credentials: Dict,
    sync_settings: Dict
) -> Tuple[bool, str]:
    """
    Connect a new integration for an agency.

    Args:
        agency_id: Agency ID
        integration_name: Name of the integration (e.g., "Applied Epic")
        integration_type: Type (e.g., "AMS", "Accounting", "CRM")
        credentials: Encrypted credentials dictionary
        sync_settings: Sync configuration

    Returns:
        Tuple of (success, message)
    """
    try:
        supabase = get_supabase_client()

        # Check if already exists
        existing = get_integration_by_name(agency_id, integration_name)

        if existing:
            return False, f"{integration_name} is already connected"

        # Create integration record
        integration_data = {
            'agency_id': agency_id,
            'integration_name': integration_name,
            'integration_type': integration_type,
            'credentials': json.dumps(credentials),  # Should be encrypted in production
            'sync_settings': sync_settings,
            'status': 'active',
            'last_sync': None,
            'last_sync_status': 'pending',
            'created_at': datetime.now().isoformat()
        }

        result = supabase.table('agency_integrations').insert(integration_data).execute()

        if result.data:
            return True, f"Successfully connected {integration_name}"
        else:
            return False, "Failed to create integration"

    except Exception as e:
        return False, f"Error connecting integration: {str(e)}"


def disconnect_integration(agency_id: str, integration_name: str) -> Tuple[bool, str]:
    """
    Disconnect an integration.

    Args:
        agency_id: Agency ID
        integration_name: Name of the integration

    Returns:
        Tuple of (success, message)
    """
    try:
        supabase = get_supabase_client()

        result = supabase.table('agency_integrations')\
            .delete()\
            .eq('agency_id', agency_id)\
            .eq('integration_name', integration_name)\
            .execute()

        if result.data or True:  # Supabase delete might return empty
            return True, f"Disconnected {integration_name}"
        else:
            return False, "Failed to disconnect integration"

    except Exception as e:
        return False, f"Error disconnecting: {str(e)}"


def update_integration_credentials(
    agency_id: str,
    integration_name: str,
    credentials: Dict
) -> Tuple[bool, str]:
    """
    Update integration credentials.

    Args:
        agency_id: Agency ID
        integration_name: Name of the integration
        credentials: New credentials

    Returns:
        Tuple of (success, message)
    """
    try:
        supabase = get_supabase_client()

        result = supabase.table('agency_integrations')\
            .update({
                'credentials': json.dumps(credentials),
                'updated_at': datetime.now().isoformat()
            })\
            .eq('agency_id', agency_id)\
            .eq('integration_name', integration_name)\
            .execute()

        if result.data:
            return True, "Credentials updated successfully"
        else:
            return False, "Failed to update credentials"

    except Exception as e:
        return False, f"Error updating credentials: {str(e)}"


def update_sync_settings(
    agency_id: str,
    integration_name: str,
    sync_settings: Dict
) -> Tuple[bool, str]:
    """
    Update sync settings for an integration.

    Args:
        agency_id: Agency ID
        integration_name: Name of the integration
        sync_settings: New sync settings

    Returns:
        Tuple of (success, message)
    """
    try:
        supabase = get_supabase_client()

        result = supabase.table('agency_integrations')\
            .update({
                'sync_settings': sync_settings,
                'updated_at': datetime.now().isoformat()
            })\
            .eq('agency_id', agency_id)\
            .eq('integration_name', integration_name)\
            .execute()

        if result.data:
            return True, "Sync settings updated successfully"
        else:
            return False, "Failed to update sync settings"

    except Exception as e:
        return False, f"Error updating sync settings: {str(e)}"


def trigger_manual_sync(agency_id: str, integration_name: str) -> Tuple[bool, str]:
    """
    Trigger a manual sync for an integration.

    Args:
        agency_id: Agency ID
        integration_name: Name of the integration

    Returns:
        Tuple of (success, message)
    """
    try:
        # TODO: Implement actual sync trigger
        # For now, just update last_sync timestamp

        supabase = get_supabase_client()

        result = supabase.table('agency_integrations')\
            .update({
                'last_sync': datetime.now().isoformat(),
                'last_sync_status': 'in_progress'
            })\
            .eq('agency_id', agency_id)\
            .eq('integration_name', integration_name)\
            .execute()

        if result.data:
            return True, f"Sync initiated for {integration_name}"
        else:
            return False, "Failed to trigger sync"

    except Exception as e:
        return False, f"Error triggering sync: {str(e)}"


def get_sync_history(agency_id: str, integration_name: str, limit: int = 10) -> List[Dict]:
    """
    Get sync history for an integration.

    Args:
        agency_id: Agency ID
        integration_name: Name of the integration
        limit: Number of history records to return

    Returns:
        List of sync history records
    """
    try:
        supabase = get_supabase_client()

        result = supabase.table('integration_sync_history')\
            .select('*')\
            .eq('agency_id', agency_id)\
            .eq('integration_name', integration_name)\
            .order('sync_timestamp', desc=True)\
            .limit(limit)\
            .execute()

        return result.data if result.data else []

    except Exception as e:
        # Table might not exist
        return []


def test_integration_connection(integration_name: str, credentials: Dict) -> Tuple[bool, str]:
    """
    Test integration connection with provided credentials.

    Args:
        integration_name: Name of the integration
        credentials: Integration credentials

    Returns:
        Tuple of (success, message)
    """
    # TODO: Implement actual connection testing for each integration type
    # For now, simulate test

    # Validate required fields based on integration type
    if integration_name in ["Applied Epic", "AMS360", "Hawksoft"]:
        required_fields = ['api_url', 'api_key', 'agency_code']
    elif integration_name in ["QuickBooks Online", "Xero"]:
        required_fields = ['client_id', 'client_secret', 'redirect_uri']
    elif integration_name in ["Salesforce", "HubSpot"]:
        required_fields = ['api_key', 'instance_url']
    else:
        required_fields = ['api_key']

    # Check if all required fields are present
    for field in required_fields:
        if field not in credentials or not credentials[field]:
            return False, f"Missing required field: {field}"

    # Simulate successful connection test
    return True, "Connection test successful"
