import os
from pathlib import Path
from dotenv import load_dotenv

# =========================================================
# BASE
# =========================================================
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv()

# =========================================================
# SECURITY
# =========================================================
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-change-me"
)

DEBUG = os.getenv(
    "DEBUG",
    "False"
).lower() == "true"

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",

    ".onrender.com",
    "farm-management-ydg3.onrender.com",

    ".vercel.app",
]

# =========================================================
# APPS
# =========================================================
INSTALLED_APPS = [

    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third party
    "corsheaders",

    "rest_framework",

    # KEEP THIS
    "rest_framework.authtoken",

    "django_filters",

    "drf_spectacular",

    "whitenoise.runserver_nostatic",

    # Local
    "accounts",
    "flock",
    "finance",
    "sales",
    "dashboard",
    "products",
    "inventory",
    "ai",
]

AUTH_USER_MODEL = "accounts.User"

# =========================================================
# MIDDLEWARE
# =========================================================
MIDDLEWARE = [

    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",

    "whitenoise.middleware.WhiteNoiseMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"

# =========================================================
# DATABASE
# =========================================================
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:

    import dj_database_url

    DATABASES = {
        "default": dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=True,
        )
    }

else:

    DATABASES = {
        "default": {
            "ENGINE":
                "django.db.backends.sqlite3",

            "NAME":
                BASE_DIR / "db.sqlite3",
        }
    }

# =========================================================
# TEMPLATES
# =========================================================
TEMPLATES = [
    {
        "BACKEND":
        "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {
            "context_processors": [

                "django.template.context_processors.debug",

                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

# =========================================================
# REST FRAMEWORK
# =========================================================
REST_FRAMEWORK = {

    # IMPORTANT FIX
    "DEFAULT_AUTHENTICATION_CLASSES": (

        "rest_framework.authentication.TokenAuthentication",

    ),

    "DEFAULT_PERMISSION_CLASSES": (

        "rest_framework.permissions.IsAuthenticated",

    ),

    "DEFAULT_FILTER_BACKENDS": (

        "django_filters.rest_framework.DjangoFilterBackend",

    ),

    "DEFAULT_SCHEMA_CLASS":

        "drf_spectacular.openapi.AutoSchema",
}

# =========================================================
# STATIC
# =========================================================
STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)

# =========================================================
# MEDIA
# =========================================================
MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"

# =========================================================
# CORS
# =========================================================
from corsheaders.defaults import default_headers


CORS_ALLOWED_ORIGINS = [

    "http://localhost:5173",

    "http://127.0.0.1:5173",

    "https://farm-management-pi.vercel.app",

]

CORS_ALLOW_CREDENTIALS = True


CORS_ALLOW_HEADERS = list(
    default_headers
) + [

    "x-farm-id",

]

# =========================================================
# CSRF
# =========================================================
CSRF_TRUSTED_ORIGINS = [

    "http://localhost:5173",

    "https://farm-management-pi.vercel.app",
]

# =========================================================
# RENDER
# =========================================================
USE_X_FORWARDED_HOST = True

SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

# =========================================================
# PRODUCTION SECURITY
# =========================================================
if not DEBUG:

    SECURE_SSL_REDIRECT = True

    SESSION_COOKIE_SECURE = True

    CSRF_COOKIE_SECURE = True

# =========================================================
# INTERNATIONAL
# =========================================================
LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

DEFAULT_AUTO_FIELD = (
    "django.db.models.BigAutoField"
)

# =========================================================
# CACHE
# =========================================================
CACHES = {
    "default": {
        "BACKEND":
        "django.core.cache.backends.locmem.LocMemCache",
    }
}

# =========================================================
# LOGGING
# =========================================================
LOGGING = {

    "version": 1,

    "disable_existing_loggers": False,

    "handlers": {

        "console": {

            "class":
            "logging.StreamHandler",

        }

    },

    "root": {

        "handlers":
        ["console"],

        "level":
        "INFO",
    },
}