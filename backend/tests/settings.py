"""Configuración de pruebas sin acceso a la base ni a servicios reales.

Ejecutar: python manage.py test tests --settings=tests.settings
"""

SECRET_KEY = "solo-para-pruebas-locales"
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "rest_framework",
    "src",
]
AUTH_USER_MODEL = "src.Usuario"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
        "TEST": {"NAME": ":memory:"},
    }
}
MIGRATION_MODULES = {"src": None}
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"
USE_TZ = False
TIME_ZONE = "America/Argentina/Buenos_Aires"
ROOT_URLCONF = "tests.settings"
urlpatterns = []
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
