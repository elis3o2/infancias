# Solicitudes por adolescente

## Creación

`POST /api/solicitud/solicitud/`

Los IDs del ejemplo representan registros de los respectivos catálogos.
Cada `id_temp` identifica un adolescente únicamente dentro del envío. Las
relaciones se guardan con los IDs reales resultantes de la creación.

```json
{
  "motivo": 1,
  "correo": "contacto@example.test",
  "telefono": "3410000000",
  "adolescentes": [
    {
      "id_temp": "adolescente-1",
      "id_institucion": 1,
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
      "id_institucion": 1,
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
    {"id_temp1": "adolescente-1", "id_temp2": "adolescente-2", "id_vinculo": 1}
  ]
}
```

- `id_motivo` se admite como alternativa a `motivo`.
- Cada adolescente recibe `id_institucion` o `institucion` con `nombre`,
  `id_tipo` y `domicilio`. Las referencias admiten `{id}` o esos mismos datos.
- `descripcion`, `escolarizado`, familiares, referencias y relaciones son opcionales.
- Los familiares pueden crearse sin documento, sexo, teléfono, domicilio ni
  vínculo; en validación se completan DNI, sexo y vínculo obligatoriamente.
- Familiares e instituciones en la raíz de creación se rechazan para evitar
  que un cliente antiguo pierda datos silenciosamente.
- El catálogo se consulta en `GET /api/persona/vinculo-adolescente/`.
  Los vínculos entre adolescentes son independientes del catálogo `vinculo`.

## Validación

`PUT /api/solicitud/solicitud/<id>/validar/`

Los IDs deben ser los devueltos al crear la solicitud.

```json
{
  "adolescentes": [
    {
      "id": 10,
      "salud": {"hcf": 123, "discapacidades": false},
      "familiares": [
        {
          "id": 20,
          "dni": "30000001",
          "sexo": "F",
          "vinculo": 1,
          "salud": {},
          "telefono": "3410000000"
        }
      ],
      "legajo": {"id_insert": 456, "carpeta_id": 789}
    },
    {"id": 11, "salud": {}, "familiares": [], "legajo": null}
  ],
  "descripcion_extra": "Observaciones de la validación"
}
```

`salud` admite `hcf`, `discapacidades`, `consumos_problematicos`,
`intentos_de_suicidio`, `problemas_socioambientales` y `violencias`.
Los campos omitidos conservan el valor de una persona existente; en personas
nuevas los indicadores omitidos se inicializan en `false`.

En un familiar, `id_vinculo` es una alternativa a `vinculo`. Sin `id`, se busca
un familiar del adolescente por DNI y sexo; si no existe, se agrega uno nuevo.
Si un familiar ya cargado no tiene DNI/sexo, se debe enviar su `id`.
Todos los adolescentes y familiares cargados deben incluirse. Un familiar no
puede validarse bajo otro adolescente.

Las funciones reciben los objetos resueltos por el servicio de solicitud:

```python
validar_adolescente(adolescente, datos_salud)
validar_familiar(familiar, datos, persona_adolescente)
```

Ambas buscan primero la persona por DNI y sexo. Sólo cuando no existe consultan
Ciudadano. La fecha recibida se convierte a `date`. Una consulta fallida o una
identidad que no coincide interrumpe la validación, sin crear personas parciales.

Los legajos se resuelven al final. Cada adolescente tiene un legajo y todos
comparten carpeta. Los números recibidos usan letra `A`; los registros locales
usan `B`. Los familiares nuevos se crean sin legajo. No se quita el legajo de
una persona existente que también actúe como adolescente.
Si se encuentran carpetas distintas, se devuelve un error y se revierte toda
la operación. No se mueven legajos automáticamente.

## Base de datos y clientes

Los modelos son `managed=False`. Para instalaciones existentes se preparó
`scripts/migracion_adolescentes.sql`; no lo ejecuta Django ni se aplicó durante
este cambio. `scripts/db.sql` incluye las nuevas columnas y tablas.
El catálogo `vinculo_adolescente` debe cargarse con los vínculos de la institución.

La migración conserva las columnas históricas de solicitud. Para familiares y
referencias anteriores, sólo asigna automáticamente un adolescente si la
solicitud tiene exactamente uno. Los casos restantes se listan para revisión;
la validación no admite familiares históricos sin adolescente asignado.

La lectura incluye familiares y referencias bajo cada adolescente y conserva
los agregados históricos en la solicitud. El frontend envía creación y validación
con este contrato. Al agregar adolescentes después del primero, solicita el
vínculo con uno cargado previamente; los familiares se asignan al adolescente
elegido. La validación muestra cada grupo por separado y no permite confirmar
si hay identidades pendientes, rechazadas o familiares históricos sin asignar.

Pruebas del contrato frontend con datos simulados y sin peticiones reales:

```sh
cd frontend
npm run test:solicitud
```

Pruebas aisladas (SQLite en memoria y proveedores simulados):

```sh
python manage.py test tests --settings=tests.settings
```
