# Agregar personas en admisión

En el detalle de una solicitud validada, el equipo de Admisión puede agregar
familiares o adolescentes. Ambos flujos requieren seleccionar un adolescente
de la misma solicitud y un vínculo del tipo correspondiente.

- Se consulta la persona por DNI y sexo y se envían identidad y salud juntas.
- Los datos de salud se muestran como texto, sin controles de edición.
- Al guardar se reutiliza la persona existente o se crea con los datos enviados;
  no se vuelve a consultar Ciudadano.
- Los familiares nuevos se crean sin legajo. Si la persona ya tenía uno, se conserva.
- El nuevo adolescente requiere domicilio y recibe un legajo individual en la
  carpeta compartida por los adolescentes de la solicitud.
- Si hay carpetas incompatibles, se informa el conflicto y se revierte toda el alta.
- Se rechazan adolescentes duplicados y familiares duplicados para un mismo
  adolescente. Un familiar puede vincularse con distintos adolescentes.
- Una solicitud pendiente, rechazada o derivada fuera de Admisión no admite altas.

## Contrato

`POST /api/solicitud/solicitud/{id}/familiares/`

Recibe `id_adolescente`, `id_vinculo`, `persona` completa y, opcionalmente,
`telefono` y `domicilio`.

`POST /api/solicitud/solicitud/{id}/adolescentes/`

Recibe los mismos campos; `domicilio` es obligatorio y `legajo` es opcional.
Para un legajo ya registrado no se reenvían sus números como números externos.

Ambos devuelven el detalle actualizado con HTTP 201. El campo de lectura
`puede_agregar_personas` indica si corresponde mostrar los formularios; el
servidor también verifica los permisos y el estado al guardar.

No se agregaron columnas, migraciones ni archivos de base de datos.

## Verificación

Desde `backend`, con el entorno virtual activado:

```sh
PYTHONDONTWRITEBYTECODE=1 python manage.py test tests.test_solicitud_admision tests.test_solicitud_comentarios --settings=tests.settings
```

Las pruebas usan SQLite en memoria y bloquean las consultas HTTP reales.
Desde `frontend`, ejecutar `npm run test:admision` y `npm run test:solicitud`.
