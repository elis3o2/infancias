# Registro de situaciones de Entrada y Admisión

Entrada puede registrar situaciones en las solicitudes pendientes que tiene a cargo.
Entrada y Admisión pueden agregar comentarios a las solicitudes validadas y no
rechazadas de cualquier equipo, incluso después de derivarlas y aunque no exista
un paso previo registrado por su área. El texto es libre, sin límite de caracteres en la aplicación.
Los comentarios vacíos o formados solo por espacios no se aceptan.

El modelo usa `TextField`. La tabla `solicitud_comentario` es administrada
externamente (`managed = False`): antes de usar comentarios largos, cambiar
la columna `comentario` de MySQL a `LONGTEXT NOT NULL`. El script
`scripts/comentarios_texto_largo.sql` está preparado para ese cambio manual;
no fue ejecutado. No se crean ni modifican archivos `.db`.

- Crear: `POST /api/solicitud/solicitud/<id>/comentar/`.
- Editar: `PATCH /api/solicitud/solicitud/<id>/comentarios/<comentario_id>/`.
- Ambos reciben únicamente `{"comentario": "Texto del comentario"}`.

El servidor asigna el usuario autenticado y las fechas. Solo el autor puede
editar su comentario, incluso frente a un usuario administrador. La edición
conserva la fecha de creación y actualiza la de última modificación. No se
puede cambiar de solicitud, autor ni fecha a través del cuerpo de la petición.

El detalle devuelve el historial ordenado por creación, junto con el nombre
del autor y el permiso de edición de cada comentario. La interfaz muestra el
texto como texto plano, conserva saltos de línea e indica cuándo fue editado.
Si la solicitud sale de admisión, Entrada y Admisión conservan el seguimiento.
Todas las validadas no rechazadas están disponibles en sus listados y detalles,
sin exigir fechas previas de paso por Entrada o Admisión.
Ambas áreas pueden agregar comentarios y editar los propios. El equipo receptor
mantiene el historial en solo lectura. Las rechazadas no permiten agregar ni editar.

El permiso de seguimiento no autoriza a validar, rechazar, volver a derivar ni
agregar personas a solicitudes de otros equipos. Admisión tampoco obtiene acceso
a pendientes que aún están en Entrada. No se modifica el esquema de la base de datos.

Pruebas aisladas, sin acceder a la base de datos real:

```sh
# Desde backend, con el entorno Python activado; usa SQLite en memoria.
python manage.py test tests.test_solicitud_comentarios --settings=tests.settings

# Desde frontend; solicitudes HTTP simuladas.
npm run test:comentarios
```
