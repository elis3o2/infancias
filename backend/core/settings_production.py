"""Producción detrás de Nginx. No cambia la configuración de desarrollo."""

from django.core.exceptions import ImproperlyConfigured

from .settings import *  # noqa: F403

DEBUG = False
ALLOWED_HOSTS = config(
    "ALLOWED_HOSTS", default="salud1.dyndns.org,192.168.64.49", cast=Csv()
)
if "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured("ALLOWED_HOSTS no puede contener * en producción.")
if len(SECRET_KEY) < 50 or len(set(SECRET_KEY)) < 5 or SECRET_KEY.startswith("django-insecure-"):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY debe ser una clave segura de al menos 50 caracteres.")

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = []  # La web y la API comparten origen.
CSRF_TRUSTED_ORIGINS = [
    "https://salud1.dyndns.org",
    "http://192.168.64.49:7451",
]
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# Se admite HTTP interno. El dominio público debe exigir HTTPS en el proxy.
# HSTS afecta todo el dominio, no solo /casainfancias/: no activarlo aquí.
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0

# Gunicorn confía en X-Forwarded-Proto únicamente desde el proxy local.
# No se acepta directamente una cabecera reenviada desde cualquier cliente.
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "django_vite"]
FRONTEND_DIST = Path(config("FRONTEND_DIST", default=str(BASE_DIR.parent / "frontend" / "dist")))
STATIC_ROOT = Path(config("STATIC_ROOT", default=str(BASE_DIR / "staticfiles")))
STATICFILES_DIRS = [FRONTEND_DIST]
TEMPLATES = [{**template, "DIRS": [FRONTEND_DIST, *template["DIRS"]]} for template in TEMPLATES]
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    # Vite ya incluye hashes en los nombres de los bundles.
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}
