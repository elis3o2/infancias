# Solicitudes por adolescente

## Creación

`POST /api/solicitud/solicitud/`

Los IDs del ejemplo representan registros de los respectivos catálogos.
Cada `id_temp` identifica un adolescente únicamente dentro del envío. Las
relaciones se guardan con los IDs reales resultantes de la creación.

```json
{
  "id_motivo": 1,
  "id_institucion": 1,
  "correo": "contacto@example.test",
  "telefono": "3410000000",
  "adolescentes": [
    {
      "id_temp": "adolescente-1",
      "nombre": "Nombre",
      "apellido": "Apellido",
      "fecha_nacimiento": "2010-02-18",
      "dni": "50000001",
      "sexo": "M",
      "domicilio": {"nombre": "Domicilio declarado", "id_departamento": 1},
      "familiares": [
        {"nombre": "Familiar", "apellido": "Apellido", "dni": "30000001", "sexo": "F"}
      ],
      "referencias_instituciones_data": [{"id": 2}]
    },
    {
      "id_temp": "adolescente-2",
      "nombre": "Otro nombre",
      "apellido": "Apellido",
      "fecha_nacimiento": "2012-03-01",
      "dni": "50000002",
      "sexo": "M",
      "domicilio": {"nombre": "Domicilio declarado", "id_departamento": 1},
      "familiares": [],
      "referencias_instituciones_data": []
    }
  ],
  "relaciones_adolescentes": [
    {"id_temp1": "adolescente-1", "id_temp2": "adolescente-2", "id_vinculo": 8}
  ]
}
```

- `id_motivo` es obligatorio.
- La institución solicitante pertenece a **Solicitud**: en la raíz se envía
  `id_institucion` existente o `institucion` con `nombre`, `id_tipo` y `domicilio`,
  nunca ambos. Es obligatoria al crear; el modelo permite nulos para conservar
  solicitudes históricas.
- El adolescente no tiene una institución solicitante propia. Sus instituciones
  de referencia se envían en `referencias_instituciones_data`, como `{id}`
  existente o `{nombre, id_tipo, domicilio}` nuevo. Una referencia puede estar
  asociada a varios adolescentes mediante `AdolescenteInstitucion`.
- `descripcion`, `escolarizado`, familiares, referencias y relaciones son opcionales.
- Los familiares pueden crearse sin documento, sexo, teléfono, domicilio ni
  vínculo; en validación se completan DNI, sexo y vínculo obligatoriamente.
- Familiares y referencias deben enviarse bajo cada adolescente. La institución
  solicitante sí se envía en la raíz.
- Hay un único catálogo `vinculo` con el booleano obligatorio `adolescente`:
  `GET /api/persona/vinculo/` devuelve los familiares (`false`) y
  `GET /api/persona/vinculo/adolescente/` los vínculos entre adolescentes (`true`).
  Los IDs de ambas categorías pertenecen a esa misma tabla; las validaciones
  rechazan un vínculo de la categoría equivocada. El `id_vinculo` del ejemplo
  de creación debe ser de tipo adolescente; el de familiar, de tipo familiar.

Para reutilizar una institución de referencia nueva en varios adolescentes del
mismo envío, cada uno incluye el objeto completo con el mismo `id_temp`:

```json
{
  "referencias_instituciones_data": [{
    "id_temp": "referencia-escuela-1",
    "nombre": "Escuela de referencia",
    "id_tipo": 1,
    "domicilio": {"nombre": "Domicilio institucional", "id_departamento": 1}
  }]
}
```

Ese `id_temp` se usa sólo durante la creación de la solicitud; no es un ID de
base de datos. Se guarda una institución y un par adolescente/institución por
cada asociación. Para una institución ya existente basta repetir su `{id}`.
Si se repite un `id_temp` con datos distintos, el envío se rechaza sin crear registros.

## Validación

`PUT /api/solicitud/solicitud/<id>/validar/`

Los IDs deben ser los devueltos al crear la solicitud.

```json
{
  "adolescentes": [
    {
      "id": 10,
      "persona": {
        "nombre": "Nombre", "apellido": "Apellido", "dni": "50000001", "sexo": "M",
        "fecha_nacimiento": "2010-02-18", "hc": 100, "hcf": 123,
        "discapacidades": false, "consumos_problematicos": false,
        "intentos_de_suicidio": false, "problemas_socioambientales": true, "violencias": false
      },
      "familiares": [
        {
          "id": 20,
          "persona": {
            "nombre": "Familiar", "apellido": "Apellido", "dni": "30000001", "sexo": "F",
            "fecha_nacimiento": "1980-01-01", "hc": 200, "hcf": 123,
            "discapacidades": false, "consumos_problematicos": false,
            "intentos_de_suicidio": false, "problemas_socioambientales": false, "violencias": false
          },
          "vinculo": 1,
          "telefono": "3410000000"
        }
      ],
      "legajo": {"id_insert": 456, "carpeta_id": 789}
    },
    {
      "id": 11,
      "persona": {
        "nombre": "Otro nombre", "apellido": "Apellido", "dni": "50000002", "sexo": "M",
        "fecha_nacimiento": "2012-03-01", "hc": null, "hcf": null
      },
      "familiares": [], "legajo": null
    }
  ],
  "descripcion_extra": "Observaciones de la validación"
}
```

Cada adolescente y familiar envía `persona` con nombre, apellido, DNI, sexo y
fecha de nacimiento (formato `YYYY-MM-DD`) obligatorios. Los datos de salud van
dentro de esa persona, no en otro objeto `salud`: `hc`, `hcf`, `discapacidades`,
`consumos_problematicos`, `intentos_de_suicidio`, `problemas_socioambientales` y `violencias`.
El frontend muestra todos estos campos como texto de solo lectura. Los datos
no recibidos se muestran como «Sin informar», sin inventar indicadores negativos.
Los campos omitidos conservan el valor de una persona existente; en personas
nuevas los indicadores omitidos se inicializan en `false`.

En un familiar, `id_vinculo` es una alternativa a `vinculo`. Sin `id`, se busca
un familiar del adolescente por DNI y sexo; si no existe, se agrega uno nuevo.
Si un familiar ya cargado no tiene DNI/sexo, se debe enviar su `id`.
Todos los adolescentes y familiares cargados deben incluirse. Un familiar no
puede validarse bajo otro adolescente.

Las funciones reciben los objetos resueltos por el servicio de solicitud:

```python
validar_adolescente(adolescente, datos_persona)
validar_familiar(familiar, datos, persona_adolescente)
```

Ambas buscan primero la persona por DNI y sexo. Si no existe, la crean con los
datos enviados y validados por el serializer, sin volver a consultar Ciudadano
ni otras APIs. La fecha se convierte a `date` en el serializer. En adolescentes,
el DNI y sexo recibidos deben coincidir con el registro de la solicitud. Una
identidad incompleta o que no coincide interrumpe la validación.

Los legajos se resuelven al final. Cada adolescente tiene un legajo y todos
comparten carpeta. Los números recibidos usan letra `A`; los registros locales
usan `B`. Los familiares nuevos se crean sin legajo. No se quita el legajo de
una persona existente que también actúe como adolescente.
Si se encuentran carpetas distintas, se devuelve un error y se revierte toda
la operación. No se mueven legajos automáticamente.

## Base de datos y migración

Los modelos son `managed=False`: `migrate` de Django no cambia estas tablas.
`scripts/migracion_adolescentes.sql` es una migración manual **preparada, no
ejecutada**. Se debe revisar y probar en una copia de la base antes de aplicarla,
con respaldo y sin escrituras concurrentes. MySQL/MariaDB hacen commits
implícitos para DDL: un error no revierte los cambios de esquema ya realizados.
No usar la opción `--force`: una precondición fallida debe detener la ejecución.

El esquema conserva `solicitud.id_institucion` como solicitante,
`familiar.id_adolescente` como asociación y usa `adolescente_institucion` con
`id`, `id_adolescente`, `id_institucion`. Esta última no tiene `id_solicitud` y
el par adolescente/institución debe ser único. `relacion_adolescente.id_vinculo`
apunta a `vinculo`; no se crea otro catálogo ni `adolescente.id_institucion`.
Si existen tablas o columnas de una propuesta anterior, se conservan para
revisión, sin reutilizarlas ni borrar sus datos.

Antes de ejecutar la migración deben resolverse estas precondiciones:

1. Clasificar los vínculos existentes por sus IDs reales. Si aún no existe la
   columna, un administrador puede preparar `ALTER TABLE vinculo ADD COLUMN
   adolescente BOOLEAN NULL;`, revisar el catálogo y completar cada registro
   con `0` (familiar) o `1` (entre adolescentes). El script se detiene si falta
   la columna, quedan nulos o hay otros valores, y sólo después la hace `NOT NULL`.
   No clasifica por nombre: «Hermano/a» puede existir en ambas categorías.
2. Si `relacion_adolescente` usaba `vinculo_adolescente`, definir y revisar un
   mapping explícito de IDs viejos a IDs de `vinculo`, actualizar esas relaciones
   y reemplazar su FK por la del catálogo único. El script **bloquea ese caso**
   hasta que la FK apunte a `vinculo`; no asume equivalencia por nombre ni por
   igualdad de IDs. Conserva cualquier catálogo viejo hasta una revisión posterior.
3. Revisar asociaciones inválidas, duplicadas o sin adolescente en una tabla
   `adolescente_institucion` que ya exista. No se eliminan ni corrigen registros
   automáticamente para poder crear las restricciones.

La migración no modifica ni asigna los familiares históricos sin adolescente,
incluso si la solicitud tiene uno solo; los lista al final para revisión manual.
La validación seguirá bloqueando solicitudes con familiares sin asociar.

Si existe una antigua `solicitud_institucion`, se conserva intacta. Sólo se copian
a la tabla nueva los pares que ya tengan un `id_adolescente` explícito y válido,
sin duplicarlos al reejecutar. Las filas sin esa asociación se listan como
**referencias no migradas**: no son visibles a través del modelo nuevo hasta
resolver su destino. Se debe registrar y revisar un mapping explícito entre cada
referencia histórica y sus adolescentes, insertar los pares acordados en
`adolescente_institucion` y comprobarlos antes de habilitar la aplicación.
No se agrega `id_adolescente` a la tabla vieja ni se deduce su valor.

No ejecutar `scripts/add_db.sql` como migración sobre una instalación cargada:
sus inserciones de catálogos y sus `ALTER TABLE` no son idempotentes. Tampoco
ejecutar `scripts/db.sql` suponiendo que sus `CREATE TABLE IF NOT EXISTS`
actualizarán tablas existentes. El esquema base usa nombres de restricciones
distintos para relaciones de personas y adolescentes, y exige un adolescente
en cada referencia, sin pares duplicados. Estos ajustes no se aplican solos a
una base existente.

## Lectura y frontend

La lectura entrega institución solicitante una vez en la raíz, familiares y
referencias bajo cada adolescente, y las relaciones entre adolescentes en
`relaciones_adolescentes`. Los agregados de familiares de la raíz se conservan
por compatibilidad; las referencias ya no se consultan desde la solicitud.

El formulario solicita un vínculo con un adolescente previamente agregado y
permite elegir a qué adolescente se asocia cada familiar. Debajo de familiares,
el bloque de referencias permite
seleccionar una institución y uno o más adolescentes; sus vínculos se pueden
editar sin duplicar la institución. La validación muestra
cada grupo por separado y no permite confirmar si hay identidades pendientes,
rechazadas o familiares históricos sin asignar. Todos los adolescentes de la
solicitud deben incluirse en el envío de validación.

Pruebas del contrato frontend con datos simulados y sin peticiones reales:

```sh
cd frontend
npm run test:solicitud
```

Pruebas aisladas (SQLite en memoria y proveedores simulados):

```sh
python manage.py test tests --settings=tests.settings
```
