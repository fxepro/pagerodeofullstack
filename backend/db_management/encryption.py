"""
Password encryption service for database connections
"""
from django.conf import settings
import base64
import hashlib

# Lazy import - only import when needed
_Fernet = None


def _get_fernet():
    """Lazy import of Fernet to avoid import errors at module load time"""
    global _Fernet
    if _Fernet is None:
        try:
            from cryptography.fernet import Fernet
            _Fernet = Fernet
        except ImportError as e:
            error_msg = (
                "cryptography is required for database password encryption. "
                "Install it with: pip install cryptography. "
                f"Original error: {str(e)}"
            )
            raise ImportError(error_msg) from e
    return _Fernet


def get_encryption_key():
    """Generate encryption key from Django SECRET_KEY"""
    secret_key = settings.SECRET_KEY.encode('utf-8')
    # Use SHA256 to get a 32-byte key, then base64 encode for Fernet
    key = hashlib.sha256(secret_key).digest()
    return base64.urlsafe_b64encode(key)


def encrypt_password(password: str) -> str:
    """Encrypt a password using Fernet"""
    if not password:
        return ""
    Fernet = _get_fernet()
    key = get_encryption_key()
    f = Fernet(key)
    encrypted = f.encrypt(password.encode('utf-8'))
    return encrypted.decode('utf-8')


def decrypt_password(encrypted_password: str) -> str:
    """Decrypt a password using Fernet"""
    if not encrypted_password:
        return ""
    try:
        Fernet = _get_fernet()
        key = get_encryption_key()
        f = Fernet(key)
        decrypted = f.decrypt(encrypted_password.encode('utf-8'))
        return decrypted.decode('utf-8')
    except ImportError as e:
        raise ImportError(
            "cryptography is required for database password encryption. "
            "Install it with: pip install cryptography"
        )
    except Exception as e:
        raise ValueError(f"Failed to decrypt password: {str(e)}")

