import os
import sys
import django

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..', 'backend'))
sys.path.append(BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()


user = User.objects.create_user(
    username='jdoe',
    password='superuser123',
    email='jdoe@example.com',
    first_name='John',
    last_name='Doe',
)

