"""
Django settings for smartsupply project.
Think of this file as your application.yml from Spring Boot.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file (like Spring Boot reads application.yml)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# SECRET_KEY is like your JWT_SECRET — used for signing cookies/tokens
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-change-me")

# DEBUG=True shows detailed errors (like Spring Boot's spring.devtools)
DEBUG = os.getenv("DEBUG", "True") == "True"

# Which hosts can access this server (like CORS allowedOrigins)
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]


# INSTALLED_APPS = like listing your @Component/@Service classes for Spring to scan
# Django needs to know which "apps" (modules) are active
INSTALLED_APPS = [
    "django.contrib.admin",  # Free admin panel (no Spring equivalent!)
    "django.contrib.auth",  # Built-in User model + auth (like Spring Security)
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",  # Django REST Framework (like @RestController)
    "inventory",  # Our app — like your com.smartsupply package
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "smartsupply.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "smartsupply.wsgi.application"


# Database — like spring.datasource in application.yml
# Using SQLite for development (file-based, no server needed!)
# For production, switch to PostgreSQL like your Java backend uses.
#
# PostgreSQL config (uncomment when Docker is running):
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": "smartsupply_django_db",
#         "USER": "smartsupply",
#         "PASSWORD": os.getenv("DB_PASSWORD", ""),
#         "HOST": "localhost",
#         "PORT": "5432",
#     }
# }
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"

# Default primary key type — like using @Id @GeneratedValue in JPA
# BigAutoField = auto-incrementing big integer (like BIGSERIAL in PostgreSQL)
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework settings — like configuring your @RestController defaults
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,  # Same as your Spring Data default
}
