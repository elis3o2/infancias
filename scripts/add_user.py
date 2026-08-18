import os
import sys
import django

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "backend"))

sys.path.append(BACKEND_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group


User = get_user_model()


# Crear o recuperar usuario
user, created = User.objects.get_or_create(
    username="jdoe",
    defaults={
        "email": "jdoe@example.com",
        "first_name": "John",
        "last_name": "Doe",
    },
)

# Si el usuario fue creado, establecer contraseña
if created:
    user.set_password("superuser123")
    user.save()


# Crear grupos y agregar el usuario
for group_name in ["admision", "guardia", "entrada"]:
    group, _ = Group.objects.get_or_create(name=group_name)
    user.groups.add(group)


print(f"Usuario: {user.username}")
print("Grupos asignados:")

for group in user.groups.all():
    print(f" - {group.name}")
    



user, created = User.objects.get_or_create(
    username="entrada",
    defaults={
        "email": "entrada@example.com",
        "first_name": "Entrada"
    },
)
if created:
    user.set_password("entrada")
    user.save()
group, _ = Group.objects.get_or_create(name="entrada")
user.groups.add(group)




user, created = User.objects.get_or_create(
    username="admision",
    defaults={
        "email": "admision@example.com",
        "first_name": "Admision"
    },
)
if created:
    user.set_password("admision")
    user.save()
group, _ = Group.objects.get_or_create(name="admision")
user.groups.add(group)





user, created = User.objects.get_or_create(
    username="guardia",
    defaults={
        "email": "guardia@example.com",
        "first_name": "Guardia"
    },
)
if created:
    user.set_password("guardia")
    user.save()
group, _ = Group.objects.get_or_create(name="guardia")
user.groups.add(group)