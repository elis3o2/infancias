# Copia del formulario en el correo de confirmación

Al crear una solicitud, el correo de confirmación adjunta `solicitud-<id>.pdf`.
El PDF contiene los datos declarados: contacto, problemática y descripción,
institución solicitante, niños y adolescentes, domicilios, escolarización,
familiares y sus vínculos, instituciones de referencia y relaciones entre niños.
Se enumeran los nombres de los archivos cargados, sin reenviar su contenido.

La instantánea se captura al crear la solicitud, antes de cualquier validación.
Se envía únicamente al correo informado, después de confirmar la transacción.
El archivo se genera en memoria; no se crean tablas, migraciones ni archivos `.db`.
Los demás avisos por validación, rechazo o derivación no adjuntan esta copia.

ReportLab está declarado en `scripts/requirements.txt`. En otros entornos se
deben instalar las dependencias actualizadas antes de desplegar el backend.

Como en los avisos existentes, un fallo del proveedor de correo no revierte
la solicitud. Si falla la generación del PDF, no se envía una confirmación sin
el adjunto: se registra el error. No hay reintentos automáticos ni una cola de
correos persistida.

Pruebas con base en memoria y correo simulado:

```sh
python manage.py test tests.test_formulario_pdf --settings=tests.settings
```
