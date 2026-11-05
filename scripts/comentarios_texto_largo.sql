-- Ejecutar manualmente sobre la base MySQL del proyecto, con respaldo previo.
-- Conserva los comentarios existentes; quita el límite VARCHAR(256).
ALTER TABLE solicitud_comentario MODIFY COLUMN comentario LONGTEXT NOT NULL;
