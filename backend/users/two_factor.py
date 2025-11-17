"""
Two-Factor Authentication utilities using TOTP (Time-based One-Time Password)
"""
import pyotp
import qrcode
import io
import base64
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
import secrets
import json
from typing import List, Tuple

def generate_secret(username: str, issuer_name: str = "PageRodeo") -> Tuple[str, str]:
    """
    Generate a TOTP secret for a user
    
    Args:
        username: User's username for the OTP URI
        issuer_name: Name of the service (default: PageRodeo)
    
    Returns:
        Tuple of (secret_key, provisioning_uri)
    """
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    
    # Create provisioning URI for QR code
    provisioning_uri = totp.provisioning_uri(
        name=username,
        issuer_name=issuer_name
    )
    
    return secret, provisioning_uri


def generate_qr_code(provisioning_uri: str) -> str:
    """
    Generate a QR code image as base64 string from provisioning URI
    
    Args:
        provisioning_uri: TOTP provisioning URI
    
    Returns:
        Base64 encoded PNG image string
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    
    return f"data:image/png;base64,{img_base64}"


def verify_totp(secret: str, token: str, window: int = 1) -> bool:
    """
    Verify a TOTP token against a secret
    
    Args:
        secret: TOTP secret key
        token: Token code to verify (6 digits)
        window: Time window for token validation (default: 1)
    
    Returns:
        True if token is valid, False otherwise
    """
    try:
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=window)
    except Exception:
        return False


def generate_backup_codes(count: int = 10) -> List[str]:
    """
    Generate backup codes for 2FA recovery
    
    Args:
        count: Number of backup codes to generate (default: 10)
    
    Returns:
        List of backup code strings
    """
    codes = []
    for _ in range(count):
        # Generate 8-character alphanumeric codes
        code = secrets.token_hex(4).upper()  # 8 characters
        codes.append(code)
    return codes


def encrypt_secret(secret: str) -> str:
    """
    Encrypt a TOTP secret before storing in database
    
    Note: For TOTP to work, we need the actual secret. Since Django's make_password
    is one-way, we'll use a simple encryption. In production, use Fernet or similar.
    
    For now, we'll store it with a simple encoding. In production, use proper encryption.
    
    Args:
        secret: Plain text TOTP secret
    
    Returns:
        Encrypted/encoded secret
    """
    # Simple encoding - in production use Fernet or similar
    # For now, we'll use base64 encoding. In production, use proper encryption!
    import base64
    encoded = base64.b64encode(secret.encode()).decode()
    return encoded


def decrypt_secret(encrypted_secret: str) -> str:
    """
    Decrypt a TOTP secret from database
    
    Args:
        encrypted_secret: Encrypted secret from database
    
    Returns:
        Plain text secret
    """
    # Reverse the encoding
    import base64
    try:
        decoded = base64.b64decode(encrypted_secret.encode()).decode()
        return decoded
    except Exception:
        # Fallback if not encoded (for backward compatibility)
        return encrypted_secret


def encrypt_backup_codes(codes: List[str]) -> List[str]:
    """
    Encrypt backup codes before storing in database
    
    Args:
        codes: List of plain backup codes
    
    Returns:
        List of encrypted backup codes
    """
    return [make_password(code) for code in codes]


def verify_backup_code(encrypted_codes: List[str], code: str) -> Tuple[bool, List[str]]:
    """
    Verify a backup code and remove it from the list if valid
    
    Args:
        encrypted_codes: List of encrypted backup codes
        code: Plain backup code to verify
    
    Returns:
        Tuple of (is_valid, updated_encrypted_codes_list)
    """
    updated_codes = []
    code_found = False
    
    for encrypted_code in encrypted_codes:
        if not code_found and check_password(code, encrypted_code):
            code_found = True
            # Don't add this code back - it's been used
            continue
        updated_codes.append(encrypted_code)
    
    return code_found, updated_codes

