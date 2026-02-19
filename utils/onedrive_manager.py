"""
OneDrive/SharePoint Document Manager
Phase 3, Sprint 5, Task 5.3: Policy Document Auto-Filing
Created: December 1, 2025

This module handles automatic organization of policy documents
in the client's OneDrive or SharePoint account.

IMPORTANT: This is a STANDALONE module that can be removed easily.
If this feature doesn't work out, simply:
1. Delete this file
2. Remove the "📁 Documents" page from commission_app.py
3. Drop the policy_documents table

Dependencies:
- msal: Microsoft Authentication Library (pip install msal)
- pypdf: PDF text extraction (pip install pypdf)
- requests: HTTP client (already installed)
"""

import os
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import json

# Microsoft Authentication
try:
    from msal import ConfidentialClientApplication
    MSAL_AVAILABLE = True
except ImportError:
    MSAL_AVAILABLE = False
    print("Warning: msal not installed. Run: pip install msal")

# PDF Processing
try:
    from pypdf import PdfReader
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False
    print("Warning: pypdf not installed. Run: pip install pypdf")

import requests


class OneDriveDocumentManager:
    """
    Manages policy documents in client's OneDrive/SharePoint.

    Features:
    - Upload documents with automatic organization
    - Extract metadata from PDFs (policy number, client name, dates)
    - Create folder structure automatically
    - Search and retrieve documents
    - Generate shareable links

    Architecture:
    - Documents stored in client's OneDrive (zero cost for us)
    - Metadata indexed in our database for fast search
    - Easy rollback: just delete this module
    """

    def __init__(self, tenant_id: str = None, client_id: str = None,
                 client_secret: str = None, use_delegated_auth: bool = False):
        """
        Initialize OneDrive manager.

        Args:
            tenant_id: Microsoft 365 tenant ID (from Azure AD)
            client_id: Application (client) ID from Azure app registration
            client_secret: Client secret from Azure app registration
            use_delegated_auth: If True, use delegated (user) auth instead of app-only

        Setup Instructions:
        1. Go to https://portal.azure.com
        2. Navigate to "Azure Active Directory" > "App registrations"
        3. Click "New registration"
        4. Name: "AMS Document Manager"
        5. Redirect URI: https://login.microsoftonline.com/common/oauth2/nativeclient
        6. After creation, note the "Application (client) ID" and "Directory (tenant) ID"
        7. Go to "Certificates & secrets" > "New client secret"
        8. Copy the secret value (only shown once!)
        9. Go to "API permissions" > "Add a permission" > "Microsoft Graph"
        10. Add: Files.ReadWrite.All, Sites.ReadWrite.All (Application permissions)
        11. Click "Grant admin consent"

        Store credentials in environment variables:
        - MICROSOFT_TENANT_ID
        - MICROSOFT_CLIENT_ID
        - MICROSOFT_CLIENT_SECRET
        """
        self.tenant_id = tenant_id or os.getenv('MICROSOFT_TENANT_ID')
        self.client_id = client_id or os.getenv('MICROSOFT_CLIENT_ID')
        self.client_secret = client_secret or os.getenv('MICROSOFT_CLIENT_SECRET')
        self.use_delegated_auth = use_delegated_auth

        self.access_token = None
        self.token_expires_at = None

        # Check if credentials are configured
        if not all([self.tenant_id, self.client_id, self.client_secret]):
            print("⚠️ OneDrive credentials not configured. Set environment variables:")
            print("   - MICROSOFT_TENANT_ID")
            print("   - MICROSOFT_CLIENT_ID")
            print("   - MICROSOFT_CLIENT_SECRET")

    def is_configured(self) -> bool:
        """Check if OneDrive integration is properly configured."""
        return all([
            MSAL_AVAILABLE,
            PYPDF_AVAILABLE,
            self.tenant_id,
            self.client_id,
            self.client_secret
        ])

    def authenticate(self) -> bool:
        """
        Authenticate with Microsoft Graph API.

        Returns:
            True if authentication successful, False otherwise
        """
        if not MSAL_AVAILABLE:
            print("Error: msal library not installed")
            return False

        try:
            authority = f"https://login.microsoftonline.com/{self.tenant_id}"

            app = ConfidentialClientApplication(
                self.client_id,
                authority=authority,
                client_credential=self.client_secret
            )

            # Get token for Microsoft Graph API
            scopes = ["https://graph.microsoft.com/.default"]

            result = app.acquire_token_for_client(scopes=scopes)

            if "access_token" in result:
                self.access_token = result["access_token"]
                # Token typically expires in 3600 seconds (1 hour)
                self.token_expires_at = datetime.now().timestamp() + 3600
                return True
            else:
                error = result.get("error_description", result.get("error", "Unknown error"))
                print(f"Authentication failed: {error}")
                return False

        except Exception as e:
            print(f"Authentication error: {e}")
            return False

    def _ensure_authenticated(self):
        """Ensure we have a valid access token."""
        if not self.access_token or (self.token_expires_at and
                                     datetime.now().timestamp() >= self.token_expires_at - 300):
            # Token expired or about to expire (5 min buffer)
            if not self.authenticate():
                raise Exception("Failed to authenticate with Microsoft Graph API")

    def upload_document(self, file_path: str, client_name: str,
                       policy_number: str, carrier: str,
                       doc_type: str) -> Dict:
        """
        Upload a document to OneDrive with automatic organization.

        Args:
            file_path: Local path to the file to upload
            client_name: Client name (e.g., "Smith, John")
            policy_number: Policy number
            carrier: Insurance carrier name
            doc_type: Document type (declaration, endorsement, correspondence, etc.)

        Returns:
            Dictionary with OneDrive file info:
            - id: OneDrive file ID
            - name: Filename
            - webUrl: URL to open in browser
            - downloadUrl: Direct download URL
            - folder_path: Full OneDrive path
            - size: File size in bytes
            - created: Creation timestamp

        Raises:
            Exception if upload fails
        """
        self._ensure_authenticated()

        # Extract metadata from PDF if it's a PDF
        metadata = {}
        if file_path.lower().endswith('.pdf'):
            metadata = self.extract_pdf_metadata(file_path)

        # Build folder path
        folder_path = self._build_folder_path(client_name, policy_number, carrier, doc_type)

        # Generate standardized filename
        filename = self._generate_filename(metadata, doc_type, file_path)

        # Full OneDrive path
        full_path = f"{folder_path}/{filename}"

        # Upload to OneDrive
        upload_url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{full_path}:/content"

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/octet-stream"
        }

        with open(file_path, 'rb') as f:
            file_content = f.read()
            response = requests.put(upload_url, headers=headers, data=file_content)

        if response.status_code in [200, 201]:
            file_info = response.json()

            return {
                'id': file_info.get('id'),
                'name': file_info.get('name'),
                'webUrl': file_info.get('webUrl'),
                'downloadUrl': file_info.get('@microsoft.graph.downloadUrl'),
                'folder_path': folder_path,
                'size': file_info.get('size'),
                'created': file_info.get('createdDateTime'),
                'metadata': metadata
            }
        else:
            raise Exception(f"Upload failed: {response.status_code} - {response.text}")

    def extract_pdf_metadata(self, file_path: str) -> Dict:
        """
        Extract metadata from a PDF file.

        Extracts:
        - Policy number (various patterns)
        - Client/insured name
        - Dates (effective, expiration)
        - Carrier name (if mentioned)

        Args:
            file_path: Path to PDF file

        Returns:
            Dictionary with extracted metadata
        """
        if not PYPDF_AVAILABLE:
            return {'error': 'pypdf not installed'}

        try:
            reader = PdfReader(file_path)

            # Extract text from all pages
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"

            # Extract policy number
            policy_number = self._extract_policy_number(text)

            # Extract client name
            client_name = self._extract_client_name(text)

            # Extract dates
            dates = self._extract_dates(text)

            # Extract carrier (look for common carrier names)
            carrier = self._extract_carrier(text)

            return {
                'policy_number': policy_number,
                'client_name': client_name,
                'effective_date': dates.get('effective'),
                'expiration_date': dates.get('expiration'),
                'carrier': carrier,
                'text_preview': text[:500] if text else None  # First 500 chars
            }

        except Exception as e:
            return {'error': str(e)}

    def _extract_policy_number(self, text: str) -> Optional[str]:
        """Extract policy number from text using various patterns."""
        patterns = [
            r'Policy\s*(?:Number|#|No\.?)?\s*[:\-]?\s*([A-Z0-9]{6,20})',
            r'Policy\s+ID\s*[:\-]?\s*([A-Z0-9]{6,20})',
            r'Pol\s*#?\s*[:\-]?\s*([A-Z0-9]{6,20})',
            r'\bPolicy:\s*([A-Z0-9]{6,20})',
            r'\b([A-Z]{2,4}\d{6,10})\b'  # Common format: ABC1234567
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return None

    def _extract_client_name(self, text: str) -> Optional[str]:
        """Extract client/insured name from text."""
        patterns = [
            r'(?:Named\s+)?Insured[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})',
            r'Policyholder[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})',
            r'Name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})'
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return None

    def _extract_dates(self, text: str) -> Dict[str, Optional[str]]:
        """Extract effective and expiration dates."""
        dates = {'effective': None, 'expiration': None}

        # Look for effective date
        eff_patterns = [
            r'Effective\s+Date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
            r'Eff\.\s+Date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        ]

        for pattern in eff_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                dates['effective'] = match.group(1)
                break

        # Look for expiration date
        exp_patterns = [
            r'Expiration\s+Date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
            r'Exp\.\s+Date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        ]

        for pattern in exp_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                dates['expiration'] = match.group(1)
                break

        return dates

    def _extract_carrier(self, text: str) -> Optional[str]:
        """Extract carrier name from text."""
        # Common carriers
        carriers = [
            'Progressive', 'State Farm', 'Geico', 'Allstate', 'Farmers',
            'USAA', 'Liberty Mutual', 'Nationwide', 'Travelers', 'American Family',
            'Auto-Owners', 'Erie', 'Safeco', 'MetLife', 'Hartford'
        ]

        text_lower = text.lower()
        for carrier in carriers:
            if carrier.lower() in text_lower:
                return carrier

        return None

    def _build_folder_path(self, client_name: str, policy_number: str,
                          carrier: str, doc_type: str) -> str:
        """Build OneDrive folder path for document."""
        # Sanitize names for filesystem
        safe_client = self._sanitize_filename(client_name)
        safe_carrier = self._sanitize_filename(carrier)
        safe_policy = self._sanitize_filename(policy_number)

        # Policy folder name
        policy_folder = f"{safe_policy}_{safe_carrier}"

        # Document type folder
        doc_folder = self._get_doc_type_folder(doc_type)

        # Full path
        return f"AMS Documents/Clients/{safe_client}/{policy_folder}/{doc_folder}"

    def _sanitize_filename(self, name: str) -> str:
        """Sanitize name for filesystem (remove invalid characters)."""
        # Replace invalid characters with dash
        invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
        sanitized = name
        for char in invalid_chars:
            sanitized = sanitized.replace(char, '-')

        # Remove multiple consecutive dashes
        sanitized = re.sub(r'-+', '-', sanitized)

        return sanitized.strip('-')

    def _get_doc_type_folder(self, doc_type: str) -> str:
        """Map document type to folder name."""
        mapping = {
            'declaration': '01_Declarations',
            'dec page': '01_Declarations',
            'declarations': '01_Declarations',
            'endorsement': '02_Endorsements',
            'endorsements': '02_Endorsements',
            'correspondence': '03_Correspondence',
            'email': '03_Correspondence',
            'letter': '03_Correspondence',
            'claim': '04_Claims',
            'claims': '04_Claims',
            'application': '05_Applications',
            'app': '05_Applications',
            'quote': '06_Quotes',
            'quotes': '06_Quotes',
            'certificate': '07_Certificates',
            'coi': '07_Certificates',
            'other': '99_Other'
        }

        doc_type_lower = doc_type.lower().strip()
        return mapping.get(doc_type_lower, '99_Other')

    def _generate_filename(self, metadata: Dict, doc_type: str,
                          original_path: str) -> str:
        """Generate standardized filename for document."""
        # Get file extension
        ext = os.path.splitext(original_path)[1]

        # Use extracted date if available, otherwise use today
        date_str = datetime.now().strftime('%Y-%m-%d')
        if metadata.get('effective_date'):
            try:
                # Try to parse and reformat date
                date_str = metadata['effective_date'].replace('/', '-')
            except:
                pass

        # Clean doc type for filename
        doc_type_clean = doc_type.replace(' ', '_')

        # Generate filename: YYYY-MM-DD_DocumentType.ext
        return f"{date_str}_{doc_type_clean}{ext}"

    def search_documents(self, query: str = None, client_name: str = None,
                        policy_number: str = None, doc_type: str = None,
                        limit: int = 100) -> List[Dict]:
        """
        Search for documents in OneDrive.

        Note: This searches the local database index, not OneDrive directly.
        The database is populated when documents are uploaded.

        Args:
            query: Free text search query
            client_name: Filter by client name
            policy_number: Filter by policy number
            doc_type: Filter by document type
            limit: Maximum results to return

        Returns:
            List of document records from database
        """
        # This would query the policy_documents table in Supabase
        # Implementation depends on database helper functions
        pass

    def get_download_url(self, file_id: str) -> Optional[str]:
        """
        Get a direct download URL for a file.

        Args:
            file_id: OneDrive file ID

        Returns:
            Direct download URL (temporary, expires after ~1 hour)
        """
        self._ensure_authenticated()

        url = f"https://graph.microsoft.com/v1.0/me/drive/items/{file_id}"

        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            file_info = response.json()
            return file_info.get('@microsoft.graph.downloadUrl')

        return None

    def create_share_link(self, file_id: str, link_type: str = 'view') -> Optional[str]:
        """
        Create a shareable link for a file.

        Args:
            file_id: OneDrive file ID
            link_type: 'view' or 'edit'

        Returns:
            Shareable link URL
        """
        self._ensure_authenticated()

        url = f"https://graph.microsoft.com/v1.0/me/drive/items/{file_id}/createLink"

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        data = {
            "type": link_type,
            "scope": "organization"  # Only people in the organization can access
        }

        response = requests.post(url, headers=headers, json=data)

        if response.status_code == 200:
            result = response.json()
            return result.get('link', {}).get('webUrl')

        return None


# =============================================================================
# Database Integration Functions
# =============================================================================

def index_document_in_database(supabase, document_info: Dict,
                               agency_id: str, uploaded_by_user_id: str) -> bool:
    """
    Store document reference in database for fast search.

    Args:
        supabase: Supabase client
        document_info: Document info from upload_document()
        agency_id: Agency ID
        uploaded_by_user_id: User ID who uploaded the document

    Returns:
        True if successful
    """
    try:
        metadata = document_info.get('metadata', {})

        record = {
            'agency_id': agency_id,
            'onedrive_file_id': document_info['id'],
            'onedrive_path': document_info['folder_path'] + '/' + document_info['name'],
            'onedrive_web_url': document_info['webUrl'],
            'onedrive_download_url': document_info.get('downloadUrl'),
            'client_name': metadata.get('client_name'),
            'policy_number': metadata.get('policy_number'),
            'carrier': metadata.get('carrier'),
            'document_type': document_info.get('doc_type'),
            'document_date': metadata.get('effective_date'),
            'extracted_text': metadata.get('text_preview'),
            'file_size_bytes': document_info.get('size'),
            'uploaded_by_user_id': uploaded_by_user_id
        }

        result = supabase.table('policy_documents').insert(record).execute()

        return bool(result.data)

    except Exception as e:
        print(f"Error indexing document: {e}")
        return False


def search_documents_in_database(supabase, agency_id: str,
                                 query: str = None, client_name: str = None,
                                 policy_number: str = None, doc_type: str = None,
                                 limit: int = 100) -> List[Dict]:
    """
    Search for documents in database.

    Args:
        supabase: Supabase client
        agency_id: Agency ID
        query: Free text search
        client_name: Filter by client
        policy_number: Filter by policy
        doc_type: Filter by document type
        limit: Maximum results

    Returns:
        List of document records
    """
    try:
        # Start with agency filter
        query_builder = supabase.table('policy_documents').select('*').eq('agency_id', agency_id)

        # Apply filters
        if client_name:
            query_builder = query_builder.ilike('client_name', f'%{client_name}%')

        if policy_number:
            query_builder = query_builder.ilike('policy_number', f'%{policy_number}%')

        if doc_type:
            query_builder = query_builder.eq('document_type', doc_type)

        # Order by upload date descending
        query_builder = query_builder.order('uploaded_at', desc=True)

        # Limit results
        query_builder = query_builder.limit(limit)

        result = query_builder.execute()

        return result.data if result.data else []

    except Exception as e:
        print(f"Error searching documents: {e}")
        return []


# =============================================================================
# Utility Functions
# =============================================================================

def check_onedrive_available() -> Tuple[bool, str]:
    """
    Check if OneDrive integration is available and configured.

    Returns:
        Tuple of (is_available, message)
    """
    if not MSAL_AVAILABLE:
        return False, "Microsoft Authentication Library (msal) not installed. Run: pip install msal"

    if not PYPDF_AVAILABLE:
        return False, "PDF library (pypdf) not installed. Run: pip install pypdf"

    tenant_id = os.getenv('MICROSOFT_TENANT_ID')
    client_id = os.getenv('MICROSOFT_CLIENT_ID')
    client_secret = os.getenv('MICROSOFT_CLIENT_SECRET')

    if not all([tenant_id, client_id, client_secret]):
        return False, "OneDrive credentials not configured. Set environment variables: MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET"

    return True, "OneDrive integration is configured and ready"


if __name__ == "__main__":
    # Test OneDrive availability
    available, message = check_onedrive_available()
    print(f"OneDrive Integration: {message}")

    if available:
        print("\n✅ Ready to use OneDrive document management!")
        print("\nExample usage:")
        print("""
from utils.onedrive_manager import OneDriveDocumentManager

# Initialize
manager = OneDriveDocumentManager()

# Upload a document
result = manager.upload_document(
    file_path='sample_dec_page.pdf',
    client_name='Smith, John',
    policy_number='AUTO12345',
    carrier='Progressive',
    doc_type='declaration'
)

print(f"Uploaded to: {result['webUrl']}")
        """)
