# API_RNP / Identidad

La función nueva es `src.apps.api_externa.services.consultar_identidad`.
Sigue disponible como función independiente, pero ahora `consultar_digitalizacion`
la usa como respaldo cuando Digitalización falla o devuelve identidad incompleta.
No reemplaza Ciudadano ni HCF, no crea personas y no agrega una ruta pública.

Digitalización conserva prioridad. Un 404 explícito no activa el respaldo; una
identidad válida sin HC tampoco. Ante error HTTP, red, JSON inválido, falta de
configuración o datos incompletos, se consulta Identidad y se devuelve el mismo
formato habitual de identidad, con HC/HCF de SISROS cuando su vinculación está
validada. Se comprueba que DNI y sexo coincidan.
Para sexo X el respaldo solicita `renaper` y `sisros`, nunca PUCO.

El respaldo revisa `persona.estado` y `persona.datos.requiere_revision`, tanto con
HTTP 200 como con 207. Solo usa la identidad si el bloque está `ok`, tiene los cinco
datos obligatorios y `requiere_revision` es `false`. Un bloque SISROS `sin_datos`
no invalida esa identidad. Una respuesta parcial que no permita verificar a la
persona se informa como error de servicio, no como persona inexistente. Una revisión requerida devuelve 409;
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

Además se toman `sisros.datos.numero_hci` como `hc` y
`sisros.datos.numero_hcf` como `hcf`. Se aceptan únicamente enteros positivos y
solo si `sisros.estado` es `ok`, `sisros.match.estado` es `VALIDADO_EXACTO` y
`sisros.match.vinculado` es `true`. No se buscan nombres alternativos ni se usan
los números de una respuesta incompleta de Digitalización. Nombre, apellido,
documento, sexo y nacimiento siguen saliendo exclusivamente de `persona.datos`.

La consulta de respaldo ya incluye `sisros`; no es necesario omitir `secciones`.
Los números se normalizan a texto, igual que la HC de Digitalización. Si no hay
HC válida se devuelve `hc: null`; si no hay HCF válida no se agrega ese dato. Los
dos números son independientes: la HCF nunca se utiliza como HC individual.

Cuando hay HC, la consulta de personas la utiliza para consultar API_HCF y
completar los integrantes e indicadores de salud, como con Digitalización. Si
API_HCF no aporta una HCF, se conserva la recibida de SISROS. El frontend muestra
ambos números como datos de solo lectura y los incluye en la persona enviada al
validar. Si no hay HC, sigue indicando «Sin historia clínica». Los indicadores
no disponibles siguen sin informarse: no se inventan valores negativos. No se
crean personas automáticamente por recibir la respuesta.

La consulta de integrantes usa **GET `API_HCF?hci=<HC individual>`**, sin proxy,
con la cabecera `HCF_PPVV_API_KEY`. `API_HCF` debe apuntar a `/hcf`; puede estar
configurada con o sin `?hci=`. Si la URL ya incluye `hci`, se reemplaza por el
número consultado, sin duplicar el parámetro ni enviar la HCF como número de
entrada. La respuesta conserva el contrato `HCFResponse` (`hcf` y `resultados`).

- 401/403: `IdentidadHTTPError`, clave inválida o secciones no autorizadas.
- 404 de API_RNP: la función de transporte conserva `IdentidadHTTPError`, pero el
  respaldo de Digitalización lo convierte en una consulta sin identidad validada
  (`ciudadano: null`). La consulta de personas continúa con los demás registros y
  la pantalla muestra **Persona no validada**, sin error técnico global ni
  reintentos de esa persona al continuar. No se rechaza automáticamente ni se
  afirma que no exista. El intento cuenta para la cuota; los límites 429, la
  revisión 409 y los demás errores conservan su tratamiento específico.
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
(también después de terminar), máximo **2 por minuto y 48** en cualquier ventana
de 24 horas. Esta última regla es conservadora respecto de un día calendario.
Una llamada anticipada a `consultar_identidad` devuelve `IdentidadLimiteExcedido`
con el tiempo de espera. El respaldo de Digitalización puede esperar una sola vez
hasta 3 segundos si la consulta aún no fue enviada por el intervalo **local**;
esto permite las dos primeras consultas consecutivas del mismo formulario si hay
cupo disponible. No reintenta respuestas 429 del proveedor, esperas mayores ni
errores de red. Los intentos fallidos cuentan, incluidos los HTTP 404.

Si un familiar aparece varias veces en la misma búsqueda, se consulta una sola
vez por DNI y sexo. Se conservan todos los registros e identificadores del
formulario. Esta reutilización es solo en memoria durante esa búsqueda, no entre
peticiones ni entre usuarios. Las personas ya existentes se resuelven localmente.
La tercera identidad distinta que necesite API_RNP dentro del minuto se frena
con 429 y `Retry-After`; no se deja un worker esperando un minuto o un día.
La búsqueda por lote no devuelve resultados parciales si una consulta falla.
Por eso la pantalla de validación consulta una identidad por petición (agrupando
sus apariciones como adolescente/familiar), y conserva cada resultado exitoso
en memoria. Ante un límite o un error, muestra lo obtenido y permite **Continuar
búsqueda** solo con los pendientes, sin repetir los éxitos ni rechazar a quienes
todavía no fueron consultados. No hay reintento automático: esperar el tiempo
indicado antes de continuar. Al salir o recargar la pantalla esos resultados se
pierden; no se guardan datos de personas en archivos ni en almacenamiento del
navegador. **Actualizar datos**, una vez completada la búsqueda, comienza una
consulta nueva y requiere volver a confirmar las identidades.

Todos los procesos usan el mismo archivo persistente y un bloqueo de archivo en
Linux. No se agregan tablas ni archivos `.db`. El estado contiene solo marcas de
tiempo; no DNI, claves ni respuestas. Reiniciar Gunicorn conserva la cuota. No
borrar el estado para resolver un límite, ni guardar este archivo en estáticos.
Los archivos anteriores se respetan aunque superen los nuevos límites: se espera
hasta que expiren suficientes consultas para volver a estar dentro de la cuota.
Los archivos de estado y certificados quedan fuera de Git.

El control cubre **este servidor y este archivo compartido**. Si la misma clave
se usa desde la terminal, otros servidores o aplicaciones, hace falta coordinar
ese consumo con este contador (las consultas directas no quedan registradas aquí).
Para varias instancias de la aplicación hace falta un contador compartido
entre ellas antes de habilitar ese uso; no copiar el archivo como si fuera una
cuota nueva. Si el estado es inválido o no puede guardarse, no se consulta la API.

Al subir los cambios al servidor y completar la configuración, reiniciar
`gunicorn-infancias.service`. Para la búsqueda progresiva también hay que volver
a compilar el frontend y recopilar sus archivos estáticos, siguiendo
[la guía de despliegue](despliegue.md). Las pruebas locales usan respuestas simuladas; no
verifican que el método, certificado o clave sean aceptados por el proveedor real.
