# Despliegue de Infancias en Ubuntu/Debian

## Direcciones y alcance

- Público: `https://salud1.dyndns.org/casainfancias/`.
- Interno: `http://192.168.64.49:7451/casainfancias/`.
- La página de inicio siempre es `/casainfancias/buscar`: `/`, `/casainfancias` y
  `/casainfancias/` redirigen allí sin exigir inicio de sesión.
- La API publicada está en `/casainfancias/api/`; `/api/` se conserva para desarrollo.
- Gunicorn escucha solo en `127.0.0.1:8001`. Nginx recibe las conexiones externas.
- El frontend compilado usa el origen de la página, no la URL de desarrollo
  de `frontend/.env`. No requiere CORS ni una compilación por cada dirección.

Estos archivos son plantillas: todavía hay que configurar el servidor real.
No se ejecutan migraciones, cambios de esquema ni modificaciones de archivos `.db`.

### Cambio de prefijo en una instalación existente

El prefijo publicado es `/casainfancias/`, tanto por HTTPS como por la IP interna.
No cambia la carpeta `/home/rmdelfa/infancias/infancias`, el nombre del servicio
instalado ni los puertos. No alcanza con modificar la regla de Nginx: después de
actualizar el código en el servidor hay que recompilar y recopilar los estáticos:

```bash
cd /home/rmdelfa/infancias/infancias/frontend
npm run build
cd ../backend
../env/bin/python manage.py collectstatic --noinput --settings=core.settings_production
```

Luego reiniciar el servicio Gunicorn existente (por ejemplo,
`gunicorn-infancias.service` si fue instalado con ese nombre) y actualizar las
reglas de Nginx que correspondan. El proxy debe conservar `/casainfancias/` al
reenviar a `192.168.64.49:7451`. Los enlaces anteriores con `/infancias/` dejan
de ser las rutas de la aplicación; actualizar marcadores y enlaces compartidos.

## Antes de publicar

1. Ruta confirmada: `/home/rmdelfa/infancias/infancias`; usuario del servicio: `rmdelfa`.
2. HTTPS termina en el Nginx de **otro equipo**, que debe reenviar a
   `http://192.168.64.49:7451` sin eliminar `/casainfancias/`. Confirmar su IP de origen
   para reemplazar `REEMPLAZAR_IP_PROXY` en la configuración interna al habilitar el
   acceso público. Esto lo coordina el administrador del proxy; no bloquea las
   pruebas internas por IP. Solo se confía
   en `X-Forwarded-Proto: https` cuando procede de esa IP. No aceptar esta cabecera
   indiscriminadamente desde cualquier cliente de la red.
3. **Pendiente de seguridad:** el proyecto mantiene Django 5.1.7, fuera de soporte.
   Antes de exponerlo a Internet, actualizar a una versión soportada (por ejemplo,
   Django 5.2 LTS con el último parche), probar la aplicación y revisar las necesidades
   de esquema. Esta preparación no actualiza Django ni toca la base existente.
4. No publicar 7451 en Internet. HTTP no cifra documentos, datos de salud ni tokens.
   Limitarlo a la LAN/VPN y preferir HTTPS también allí cuando sea posible.
5. Confirmar acceso a MySQL y a las APIs externas desde el servidor. No copiar el
   entorno virtual local: recrearlo usando las dependencias del proyecto.

## Preparar el proyecto

Revisar primero la distribución con `cat /etc/os-release`. Los siguientes paquetes
son los habituales en Ubuntu/Debian; verificar permisos y versiones del servidor:

```bash
sudo apt update
sudo apt install python3-venv python3-dev build-essential pkg-config default-libmysqlclient-dev nginx
```

Usar una versión de Python compatible con todas las dependencias fijadas. Para
compilar el frontend, Vite requiere Node **20.19+ o 22.12+**; no asumir que el
paquete Node de la distribución cumple ese requisito.

Desde la raíz del proyecto en el servidor:

```bash
cd /home/rmdelfa/infancias/infancias
python3 -m venv env
env/bin/python -m pip install -r scripts/requirements.txt
env/bin/python -m pip check
cd frontend
npm ci
npm run build
cd ../backend
```

Conservar las variables de conexión y servicios en `backend/.env`, fuera de Git.
No agregar claves de APIs al frontend. Agregar/verificar en ese archivo:

```dotenv
ALLOWED_HOSTS=salud1.dyndns.org,192.168.64.49
```

`DJANGO_SECRET_KEY` debe tener al menos 50 caracteres aleatorios, ser privada y no
empezar por `django-insecure-`. Producción rechaza claves claramente inseguras.
Si se reemplaza una clave existente, se invalidan los tokens/sesiones anteriores.
El usuario del servicio necesita permiso para leer `.env`; restringir su acceso
(por ejemplo, modo 600 si es su propietario). No compartir su contenido.

Desde `backend`, después de completar `.env` y compilar:

```bash
../env/bin/python manage.py collectstatic --noinput --settings=core.settings_production
../env/bin/python manage.py check --deploy --settings=core.settings_production
../env/bin/gunicorn --check-config --config gunicorn.conf.py
```

Se esperan avisos sobre no forzar HTTPS globalmente y HSTS: se admite HTTP interno,
y HSTS afectaría también al resto del dominio. El virtual host público debe exigir
HTTPS. No ignorar otros avisos. Las cookies de sesión/CSRF requieren HTTPS; el acceso
normal de la aplicación usa JWT, no esas cookies. Un futuro acceso al admin por IP
HTTP no debe resolverse desactivando la protección global de cookies.

## Servicio de Gunicorn

El archivo `scripts/infancias.service` ya usa la ruta y el usuario confirmados.
No ejecutar Gunicorn como root. Instalar una copia como
`/etc/systemd/system/infancias.service`:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now infancias
sudo systemctl status infancias --no-pager
sudo journalctl -u infancias -n 50 --no-pager
```

El servicio carga `core.settings_production`; `runserver` sigue usando la configuración
de desarrollo. Dos procesos y cuatro hilos por proceso son un punto de partida:
ajustar `GUNICORN_WORKERS`/`GUNICORN_THREADS` en el servicio según memoria, CPU y
concurrencia. Los tiempos de espera deben evaluarse con las APIs reales.

## Nginx

1. Instalar `scripts/nginx-infancias.locations.conf` como
   `/etc/nginx/snippets/infancias.locations.conf`.
2. Reemplazar `REEMPLAZAR_IP_PROXY` por la IP de origen del proxy HTTPS. Instalar
   `scripts/nginx-infancias.internal.conf` como
   `/etc/nginx/sites-available/infancias-internal` y habilitarlo en `sites-enabled`
   si no existe ya. Comprobar que `192.168.64.49` pertenece al servidor y que el puerto
   7451 está disponible antes de activar este listener.
3. Pedir al administrador del **otro equipo** que agregue el contenido de
   `scripts/nginx-infancias.public.conf` al bloque `server` HTTPS existente de
   `salud1.dyndns.org`. Debe poder conectarse a `192.168.64.49:7451`. Conservar el
   certificado y las otras aplicaciones del dominio; no sustituir el virtual host
   completo. El tráfico HTTP público debe redirigirse a HTTPS en ese proxy.
4. Validar antes de recargar:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

El proxy conserva `/casainfancias/` al reenviar; no agregar una barra final a
`proxy_pass http://127.0.0.1:8001`. WhiteNoise sirve los estáticos recopilados.
Nginx admite cuerpos de hasta 40 MB en total; revisar este límite si se necesitan
varios adjuntos grandes. No se agrega ningún directorio de archivos privados como
contenido público. No se registran accesos de esta ubicación para evitar guardar
documentos y otros datos de consulta en logs; restringir igualmente los logs de errores.

## Comprobaciones y próximas actualizaciones

```bash
curl -I http://192.168.64.49:7451/
curl -I http://192.168.64.49:7451/casainfancias/login
curl -I https://salud1.dyndns.org/casainfancias/login
```

La primera respuesta debe redirigir a `/casainfancias/buscar`; las otras deben devolver HTML
con estado 200. En un navegador, probar ambos accesos, recargar una ruta interna,
comprobar logo/estilos y verificar que las consultas van a `/casainfancias/api/` en el
mismo origen. Probar autenticación y servicios con cuentas/datos de prueba autorizados.
No asumir que una página que carga implica que MySQL, LDAP, correo y las APIs funcionan.

En cada actualización: conservar una copia de la versión anterior, instalar dependencias,
compilar, ejecutar `collectstatic`, comprobar la configuración y reiniciar `infancias`.
Las modificaciones de esquema se coordinan por separado; no ejecutar migraciones
automáticamente. Conservar los archivos estáticos de la versión anterior hasta que
los navegadores activos dejen de necesitarlos.

Referencias: [Gunicorn](https://gunicorn.org/reference/settings/),
[WhiteNoise](https://whitenoise.readthedocs.io/en/stable/django.html),
[versiones soportadas de Django](https://www.djangoproject.com/download/).
