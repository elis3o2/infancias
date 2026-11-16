# Organización de solicitud

Referencia: `/home/imusaprueba/mensajes/backend`, especialmente sus módulos de
turnos, mensajería e incorporación de prestaciones. Se mantiene un único
`views.py`, un único `serializers.py` y servicios pequeños con una interfaz pública.

La separación sigue las decisiones que pueden cambiar, no las etapas de una
petición HTTP. Cada módulo concentra el conocimiento que los demás no necesitan.

| Módulo | Conocimiento que encapsula |
| --- | --- |
| `Acceso` | Visibilidad por equipo y quién puede seguir solicitudes, agregar personas y registrar situaciones. |
| `Consultas` | Filtros, relaciones y optimizaciones de lectura. |
| `Formulario` | Coherencia de identificadores temporales, vínculos y referencias compartidas. |
| `Creacion`, `Validacion`, `Estados` | Transacciones y cambios de estado de la solicitud. |
| `Admision` | Incorporación de personas a una solicitud validada. |
| `Comentarios` | Autoría, fechas y actualización de comentarios. |
| `ArchivoReglas` | Formatos, límites, almacenamiento y acceso a adjuntos. |
| `Reporte`, `Estadisticas` | Consultas, agrupaciones e indicadores de reportes. |
| `CopiaSolicitud` | Instantánea declarada y representación de la copia adjunta. |
| `Notificaciones` | Contenido de avisos y envío únicamente después del commit. |

## Límites

- `views.py` recibe HTTP, valida entradas y construye respuestas. No implementa
  consultas, reglas de archivos, correos ni agregaciones.
- `serializers.py` define el contrato de entrada y salida. Delega las consultas
  y reglas compartidas en servicios; no crea personas ni modifica solicitudes.
- `services/__init__.py` expone operaciones, no constantes internas ni funciones
  de generación de PDF. Los servicios se importan directamente entre sí para
  evitar dependencias circulares.
- `clases.py` define los contratos internos de copia y reporte, sin cambios al
  esquema de base de datos. `models.py` conserva las tablas existentes.
- `permissions.py` adapta las reglas de acceso a DRF. Las vistas que antes usaban
  `IsOperationalUser` usan ahora `IsAuthenticated`, por decisión del usuario;
  las acciones de solicitudes conservan `SolicitudPermission` y sus restricciones.

## Compatibilidad

Se conservan las rutas y los campos de respuesta, la paginación de reportes, las
solicitudes rechazadas como grupo virtual y los datos de persona ya validada.
El PDF mantiene su contenido y se genera en memoria. Los avisos no se envían si
la transacción se revierte. No se crean migraciones ni archivos `.db`.

Los campos antiguos `familiares` y `referencias_instituciones_data` en la raíz
del formulario devuelven 400 en vez de ser ignorados. Deben enviarse dentro de
cada adolescente. Rechazo, derivación y fechas de listado validan sus entradas
antes de ejecutar el caso de uso.

Las pruebas de arquitectura comprueban la interfaz pública, la separación de
consultas y la ausencia de dependencias desde servicios hacia vistas o serializers.
