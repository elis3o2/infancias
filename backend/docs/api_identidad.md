# API_RNP / Identidad

La función nueva es `src.apps.api_externa.services.consultar_identidad`.
Sigue disponible como función independiente, pero ahora `consultar_digitalizacion`
la usa como respaldo cuando Digitalización falla o devuelve identidad incompleta.
No reemplaza Ciudadano ni HCF, no crea personas y no agrega una ruta pública.

Digitalización conserva prioridad. Un 404 explícito no activa el respaldo; una
identidad válida sin HC tampoco. Ante error HTTP, red, JSON inválido, falta de
configuración o datos incompletos, se consulta Identidad y se devuelve el mismo
formato habitual de identidad, con `hc: null`. Se comprueba que DNI y sexo coincidan.
Para sexo X el respaldo solicita `renaper` y `sisros`, nunca PUCO.

El respaldo revisa `persona.estado` y `persona.datos.requiere_revision`, tanto con
HTTP 200 como con 207. Solo usa la identidad si el bloque está `ok`, tiene los cinco
datos obligatorios y `requiere_revision` es `false`. Un bloque SISROS `sin_datos`
no invalida esa identidad. Si la persona no pudo verificarse, se informa un error
de servicio, no que la persona no existe. Una revisión requerida devuelve 409;
un límite devuelve 429 con `Retry-After`.

## Configuración

Copiar las variables de `backend/.env.identidad.example` a **backend/.env**, sin
reemplazar las variables existentes. No guardar una clave real en el ejemplo.

```dotenv
API_RNP=https://192.168.64.50:8533/v1/consulta
IDENTIDAD_API_KEY=
API_RNP_CA_PATH=certs/app1-identidad.crt
IDENTIDAD_HTTP_METHOD=POST
IDENTIDAD_USE_PROXY=False
IDENTIDAD_RATE_LIMIT_FILE=var/identidad-limites.json
```

La clave se guarda en `IDENTIDAD_API_KEY`, no en el código. Colocar el `.crt` en
`backend/certs/app1-identidad.crt`, o cambiar `API_RNP_CA_PATH` por su ruta real.
Las variables anteriores `IDENTIDAD_API_URL` y `IDENTIDAD_CA_CERT` siguen funcionando
cuando no están definidas `API_RNP` y `API_RNP_CA_PATH`, respectivamente.
Las rutas relativas se resuelven desde `backend/`, no desde el directorio de la
terminal. El usuario del servicio debe poder leer el certificado y escribir en
la carpeta del archivo de límites. No se incluye ningún certificado ficticio.

El cliente de referencia usa POST con cuerpo JSON; es el método predeterminado.
La opción `IDENTIDAD_HTTP_METHOD=GET` se conserva para una configuración explícita.
En ambos casos se envía el mismo cuerpo JSON; si GET requiere parámetros en la URL,
se necesita ese contrato antes de adaptarlo. No se prueban distintos métodos ni se
reintenta automáticamente. La conexión es directa por defecto; el uso del proxy
del entorno solo se activa explícitamente con `IDENTIDAD_USE_PROXY=True`.

Se verifica TLS con el CA indicado, incluido el nombre/IP del servidor. Un error de
certificado requiere corregir el certificado o el nombre del servidor: nunca usar
`verify=False`. Tampoco se siguen redirecciones, para no reenviar la clave a otro
destino. Referencia: [verificación TLS de Requests](https://requests.readthedocs.io/en/latest/user/advanced/#ssl-cert-verification).

## Uso desde el backend

```python
from src.apps.api_externa.services import consultar_identidad

resultado = consultar_identidad(dni="12345678", sexo="F", secciones=["renaper", "sisros"])
codigo = resultado.codigo_http
datos = resultado.datos
```

Omitir `secciones` para F/M consulta todas las habilitadas. Para X es obligatorio
indicar secciones explícitas sin `puco`; no se elimina una sección silenciosamente.

`consultar_identidad` conserva el objeto JSON original y `resultado.parcial`
distingue HTTP 207. El adaptador `normalizar_identidad` utiliza exclusivamente:

| API_RNP (`persona.datos`) | Contrato interno |
| --- | --- |
| `nombres` | `nombre` |
| `apellido` | `apellido` |
| `dni` (texto) | `nroDocumento` (entero) |
| `sexo` | `sexo` |
| `fecha_nacimiento` | `fechaNacimiento` |

`hc` siempre es `null` para este proveedor. No se infiere de SISROS ni se mezcla
con una HC proveniente de una respuesta incompleta de Digitalización. Por ello
no se consulta HCF, no se agregan integrantes de una historia familiar y la
interfaz indica «Sin historia clínica». Los datos de salud no disponibles siguen
sin informarse: no se inventan valores negativos. No cambia el contrato del frontend
ni se crean personas automáticamente por recibir la respuesta.

- 401/403: `IdentidadHTTPError`, clave inválida o secciones no autorizadas.
- 409: `IdentidadRevisionRequerida`, revisión humana obligatoria.
- 429: `IdentidadLimiteExcedido`, con `reintentar_en` en segundos y `remoto=True`.
  Se interpreta `Retry-After` tanto en segundos como en fecha HTTP, y se bloquean
  también los demás workers durante ese período. Sin cabecera válida se esperan
  al menos 60 segundos. No hay reintento automático.
- 502/503/504: `IdentidadHTTPError`, fuente no disponible.
- Falta de configuración: `ServicioExternoNoConfigurado`, sin conexión HTTP.
- Errores TLS, red o JSON: `ServicioExternoError`; no se confunden con una persona inexistente.

## Cuota y Gunicorn

Se permite una consulta en curso, con al menos 3 segundos entre consultas
(también después de terminar), máximo 20 por minuto y 10.000 en cualquier ventana
de 24 horas. Esta última regla es conservadora respecto de un día calendario.
Una llamada anticipada a `consultar_identidad` devuelve `IdentidadLimiteExcedido`
con el tiempo de espera. El respaldo de Digitalización puede esperar una sola vez
hasta 3 segundos si la consulta aún no fue enviada por el intervalo **local**;
esto permite consultas consecutivas del mismo formulario. No reintenta respuestas
429 del proveedor, esperas mayores ni errores de red. Los intentos fallidos cuentan.

Todos los procesos usan el mismo archivo persistente y un bloqueo de archivo en
Linux. No se agregan tablas ni archivos `.db`. El estado contiene solo marcas de
tiempo; no DNI, claves ni respuestas. Reiniciar Gunicorn conserva la cuota. No
borrar el estado para resolver un límite, ni guardar este archivo en estáticos.
Los archivos de estado y certificados quedan fuera de Git.

El control cubre **este servidor y este archivo compartido**. Si la misma clave
se usa desde otros servidores o aplicaciones, hace falta un contador compartido
entre ellos antes de habilitar ese uso; no copiar el archivo como si fuera una
cuota nueva. Si el estado es inválido o no puede guardarse, no se consulta la API.

Al subir los cambios al servidor y completar la configuración, reiniciar
`gunicorn-infancias.service`. Las pruebas locales usan respuestas simuladas; no
verifican que el método, certificado o clave sean aceptados por el proveedor real.
