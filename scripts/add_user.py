import os
import sys
import django

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(
    os.path.join(SCRIPT_DIR, "..", "backend")
)

sys.path.append(BACKEND_DIR)

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "core.settings"
)

django.setup()

from django.contrib.auth import get_user_model


User = get_user_model()


usuarios = [
    {
        "username": "entrada",
        "password": "entrada",
        "email": "entrada@example.com",
        "first_name": "Entrada",
        "equipo_id": 1,
    },
    {
        "username": "admision",
        "password": "admision",
        "email": "admision@example.com",
        "first_name": "Admision",
        "equipo_id": 2,
    },
    {
        "username": "territorial",
        "password": "territorial",
        "email": "territorial@example.com",
        "first_name": "Territorial",
        "equipo_id": 3,
    },
]


for datos in usuarios:

    user, created = User.objects.get_or_create(
        username=datos["username"],
        defaults={
            "email": datos["email"],
            "first_name": datos["first_name"],
            "equipo_id": datos["equipo_id"],
        },
    )

    # Actualizar datos del usuario
    user.email = datos["email"]
    user.first_name = datos["first_name"]
    user.equipo_id = datos["equipo_id"]

    # Establecer contraseña
    user.set_password(datos["password"])

    user.save()

    accion = "creado" if created else "actualizado"

    print(
        f"Usuario {accion}: "
        f"{user.username} "
        f"(equipo_id={user.equipo_id})"
    )