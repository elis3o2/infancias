# Organización del backend por responsabilidades

Se sigue el criterio usado en `/home/imusaprueba/mensajes`: cada módulo oculta
una decisión que puede cambiar de forma independiente. No se divide solamente
por etapas del proceso ni por cantidad de líneas.

## Estructura

Las aplicaciones conservan `models.py`, `serializers.py`, `views.py` y `urls.py`
como puntos de integración con Django. Los antiguos `services.py` se reemplazan
por paquetes `services/`, con una interfaz pública explícita en `__init__.py`.

Cada aplicación tiene **un único `views.py` y un único `serializers.py`**.
Las vistas y serializers de historial están en los archivos de `persona`;
los de reportes y altas de Admisión, en los de `solicitud`. No se crean variantes
como `historial_views.py` o `admision_serializers.py`. La separación por
responsabilidades se mantiene en los servicios, no duplicando estos archivos.

| Aplicación | Módulos de servicios | Decisiones que encapsulan |
| --- | --- | --- |
| `persona` | `Persona`, `Contacto`, `ReglasNNyA`, `ReglasFamiliar`, `ReferenciasInstitucion`, `CarpetaLegajo`, `Consulta`, `HistoriaClinica` | Identidad y salud locales, contactos, reglas de adolescentes y familiares, referencias compartidas, numeración, antecedentes y agrupación HC/HCF. |
| `solicitud` | `Creacion`, `Validacion`, `Estados`, `Notificaciones` | Creación del formulario, validación completa, rechazo/derivación y avisos posteriores a la confirmación de la transacción. |
| `domicilio` | `Domicilio`, `Institucion`, `Geografia` | Persistencia y reutilización de domicilios, alta institucional y traducción de referencias geográficas externas a modelos locales. |
| `api_externa` | `Ciudadano`, `Digitalizacion`, `HistoriaClinica`, `Geografia`, `Correo`, `Ldap` | Contrato y transporte de cada proveedor, incluida la política de respaldo de Digitalización. |

Los archivos ya especializados (`admision.py`, `comentarios.py`, `reportes.py`,
`historial.py`, `copia_formulario.py`, etc.) conservan su ubicación y
responsabilidad. Los módulos `identidad*` siguen separando configuración,
límites, transporte, tipos y normalización de Identidad/RNP. No se duplican ni
se mezclan esas decisiones con Digitalización.

## Cómo importar

Desde otra aplicación o desde una vista, usar la interfaz pública:

```python
from src.apps.persona.services import validar_adolescente
from src.apps.solicitud.services import validar_solicitud
from src.apps.api_externa.services import consultar_digitalizacion
```

Dentro de un mismo paquete, importar directamente el módulo responsable:

```python
from .Contacto import actualizar_domicilio
from .Persona import buscar_persona
```

No importar la propia fachada desde sus implementaciones: evita ciclos y hace
visibles las dependencias. `__init__.py` solo publica operaciones; no contiene
lógica, consultas ni configuración. Los auxiliares con `_` son internos y no
forman parte de `__all__`.

Las vistas adaptan HTTP; los serializers validan la estructura recibida; los
servicios aplican reglas y coordinan operaciones. Los servicios no importan
vistas ni serializers. URLs, credenciales, proxies y transporte HTTP pertenecen
a `api_externa`, no a las aplicaciones de dominio. `api_externa` desconoce las
reglas y modelos de solicitudes, personas y domicilios.

## Dónde hacer cambios futuros

- Cambia la numeración o la regla de carpeta compartida: `persona/services/CarpetaLegajo.py`.
- Cambia el vínculo o la validación de un familiar: `persona/services/ReglasFamiliar.py`.
- Cambia el contrato de Digitalización: `api_externa/services/Digitalizacion.py`.
- Cambian las reglas de agrupación HC/HCF: `persona/services/HistoriaClinica.py`.
  Si cambia la respuesta HTTP del proveedor HCF, corresponde a
  `api_externa/services/HistoriaClinica.py`.
- Cambia el contenido de los avisos: `solicitud/services/Notificaciones.py`.
  Si cambia el proveedor de correo, corresponde a `api_externa/services/Correo.py`.

Antes de agregar una función a un archivo, identificar qué decisión esconde.
Crear otro módulo cuando esa decisión sea independiente; no crear un archivo
genérico `helpers` para reunir responsabilidades distintas.

## Compatibilidad y pruebas

Esta reorganización conserva los cuerpos de las funciones, sus firmas, las
transacciones y los callbacks posteriores al commit. No modifica modelos,
tablas, archivos de base de datos, URLs, formatos JSON ni el frontend. Los
imports públicos `src.apps.<app>.services` siguen funcionando.

Las pruebas que simulan dependencias internas ahora las sustituyen en el módulo
que las utiliza; no en la fachada que reexporta una función.

Desde `backend/`:

```bash
PYTHONDONTWRITEBYTECODE=1 ../env/bin/python manage.py test tests --settings=tests.settings
```

La configuración de pruebas utiliza SQLite en memoria, sin tocar archivos `.db`.
`test_arquitectura_servicios.py` verifica los contratos públicos, las
importaciones y los límites de dependencias.

Antes de reorganizar ya fallaban dos subcasos de
`test_creacion_rechaza_referencias_temporales_invalidas_y_campos_globales`:
el serializer ignora `familiares` y `referencias_instituciones_data` recibidos a
nivel de solicitud, mientras la prueba espera que los rechace. Esa diferencia
de comportamiento no se cambia como parte de la reorganización.

## Despliegue

Los cambios son locales. Al actualizar el servidor, incluir los paquetes nuevos
y la eliminación de los cuatro `services.py` anteriores, y reiniciar Gunicorn.
No se requieren migraciones ni recompilar el frontend por esta reorganización.
