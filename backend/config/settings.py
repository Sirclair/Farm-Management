import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# --------------------------------------------------
# Base Setup
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv()

# --------------------------------------------------
# Security & Environment
# --------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-change-me")
DEBUG = os.getenv("DEBUG", "True") == "True"

ALLOWED_HOSTS = ["*"]

# --------------------------------------------------
# Installed Apps
# --------------------------------------------------
INSTALLED_APPS = [
    # Local apps
    "accounts",
    "flock",
    "finance",
    "sales",
    "dashboard",
    "products",
    "inventory",
    "ai",
    # Django core
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "whitenoise.runserver_nostatic",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
]

# --------------------------------------------------
# Middleware
# --------------------------------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # MUST be first
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# --------------------------------------------------
# URLs / WSGI / Auth
# --------------------------------------------------
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
AUTH_USER_MODEL = "accounts.User"

# Change these to your actual live URLs
FRONTEND_URL = "http://localhost:5173"
DEFAULT_FROM_EMAIL = "Zonke Farms <noreply@zonkefarms.com>"
PASSWORD_RESET_TIMEOUT = 259200  # 3 days in seconds

# For testing emails in the console (terminal) instead of sending real ones:
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# --------------------------------------------------
# Database (SQLite fallback for PythonAnywhere)
# --------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    import dj_database_url

    DATABASES = {
        "default": dj_database_url.config(default=DATABASE_URL, conn_max_age=600)
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# --------------------------------------------------
# Templates
# --------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# --------------------------------------------------
# REST Framework & JWT
# --------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --------------------------------------------------
# Static & Media Files
# --------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# --------------------------------------------------
# CORS / CSRF for React frontend
# --------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://farm-management-omega-ten.vercel.app",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "origin",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",  # Add this for local development
    "http://127.0.0.1:5173",  # Add this for local development
    "https://farm-management-omega-ten.vercel.app",
    "https://clair.pythonanywhere.com",
    "https://farm-management-8o37.onrender.com",
]

import os

USE_REDIS = os.environ.get("USE_REDIS", "False") == "True"

if USE_REDIS:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": "redis://127.0.0.1:6379/1",
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            },
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }

# --------------------------------------------------
# Production Security
# --------------------------------------------------
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# --------------------------------------------------
# Internationalization
# --------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
