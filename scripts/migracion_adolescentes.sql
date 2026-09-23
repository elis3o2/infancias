-- Ejecutar sobre la base de infancias ya seleccionada, con una copia de seguridad.
-- Los modelos son managed=False: migrate de Django no modifica estas tablas.
-- MySQL 8.0.16+ o MariaDB 10.2.1+ para que CHECK se aplique en la base.
-- El DDL realiza commits implícitos. Este script se puede volver a ejecutar.
-- No elimina registros ni columnas históricas, ni inventa vínculos del catálogo.

DELIMITER //

DROP PROCEDURE IF EXISTS migrar_adolescentes_infancias//
CREATE PROCEDURE migrar_adolescentes_infancias()
BEGIN
    DECLARE base_actual VARCHAR(64);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET base_actual = DATABASE();
    IF base_actual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Seleccione la base de infancias antes de ejecutar este script.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'solicitud'
            AND COLUMN_NAME = 'id_institucion' AND IS_NULLABLE = 'NO'
    ) THEN
        ALTER TABLE solicitud MODIFY COLUMN id_institucion INT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'adolescente'
            AND COLUMN_NAME = 'id_institucion'
    ) THEN
        ALTER TABLE adolescente ADD COLUMN id_institucion INT NULL;
    ELSEIF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'adolescente'
            AND COLUMN_NAME = 'id_institucion' AND IS_NULLABLE = 'NO'
    ) THEN
        ALTER TABLE adolescente MODIFY COLUMN id_institucion INT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'adolescente'
            AND COLUMN_NAME = 'id_institucion'
            AND REFERENCED_TABLE_NAME = 'institucion'
            AND REFERENCED_COLUMN_NAME = 'id'
    ) THEN
        ALTER TABLE adolescente ADD CONSTRAINT fk_adolescente_institucion
            FOREIGN KEY (id_institucion) REFERENCES institucion(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'familiar'
            AND COLUMN_NAME = 'id_adolescente'
    ) THEN
        ALTER TABLE familiar ADD COLUMN id_adolescente INT NULL;
    ELSEIF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'familiar'
            AND COLUMN_NAME = 'id_adolescente' AND IS_NULLABLE = 'NO'
    ) THEN
        ALTER TABLE familiar MODIFY COLUMN id_adolescente INT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'familiar'
            AND COLUMN_NAME = 'id_adolescente'
            AND REFERENCED_TABLE_NAME = 'adolescente'
            AND REFERENCED_COLUMN_NAME = 'id'
    ) THEN
        ALTER TABLE familiar ADD CONSTRAINT fk_familiar_adolescente
            FOREIGN KEY (id_adolescente) REFERENCES adolescente(id);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'familiar'
            AND COLUMN_NAME = 'id_vinculo' AND IS_NULLABLE = 'NO'
    ) THEN
        ALTER TABLE familiar MODIFY COLUMN id_vinculo INT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'solicitud_institucion'
            AND COLUMN_NAME = 'id_adolescente'
    ) THEN
        ALTER TABLE solicitud_institucion ADD COLUMN id_adolescente INT NULL;
    ELSEIF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'solicitud_institucion'
            AND COLUMN_NAME = 'id_adolescente' AND IS_NULLABLE = 'NO'
    ) THEN
        ALTER TABLE solicitud_institucion MODIFY COLUMN id_adolescente INT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'solicitud_institucion'
            AND COLUMN_NAME = 'id_adolescente'
            AND REFERENCED_TABLE_NAME = 'adolescente'
            AND REFERENCED_COLUMN_NAME = 'id'
    ) THEN
        ALTER TABLE solicitud_institucion ADD CONSTRAINT fk_referencia_adolescente
            FOREIGN KEY (id_adolescente) REFERENCES adolescente(id);
    END IF;

    CREATE TABLE IF NOT EXISTS vinculo_adolescente (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(64) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS relacion_adolescente (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_adolescente1 INT NOT NULL,
        id_adolescente2 INT NOT NULL,
        id_vinculo INT NOT NULL,
        FOREIGN KEY (id_adolescente1) REFERENCES adolescente(id),
        FOREIGN KEY (id_adolescente2) REFERENCES adolescente(id),
        FOREIGN KEY (id_vinculo) REFERENCES vinculo_adolescente(id)
    );

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = base_actual AND TABLE_NAME = 'relacion_adolescente'
            AND CONSTRAINT_NAME = 'relacion_adolescente_unica'
    ) THEN
        ALTER TABLE relacion_adolescente ADD CONSTRAINT relacion_adolescente_unica
            UNIQUE (id_adolescente1, id_adolescente2, id_vinculo);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = base_actual AND TABLE_NAME = 'relacion_adolescente'
            AND CONSTRAINT_NAME = 'relacion_adolescente_distintos'
    ) THEN
        ALTER TABLE relacion_adolescente ADD CONSTRAINT relacion_adolescente_distintos
            CHECK (id_adolescente1 <> id_adolescente2);
    END IF;

    START TRANSACTION;

    UPDATE adolescente a
    JOIN solicitud s ON s.id = a.id_solicitud
    SET a.id_institucion = s.id_institucion
    WHERE a.id_institucion IS NULL AND s.id_institucion IS NOT NULL;

    -- Una solicitud antigua no permite saber a cuál adolescente pertenece cada
    -- familiar o referencia si tiene varios. Esos registros quedan pendientes.
    UPDATE familiar f
    JOIN (
        SELECT id_solicitud, MIN(id) AS id_adolescente
        FROM adolescente
        GROUP BY id_solicitud
        HAVING COUNT(*) = 1
    ) a ON a.id_solicitud = f.id_solicitud
    SET f.id_adolescente = a.id_adolescente
    WHERE f.id_adolescente IS NULL;

    UPDATE solicitud_institucion r
    JOIN (
        SELECT id_solicitud, MIN(id) AS id_adolescente
        FROM adolescente
        GROUP BY id_solicitud
        HAVING COUNT(*) = 1
    ) a ON a.id_solicitud = r.id_solicitud
    SET r.id_adolescente = a.id_adolescente
    WHERE r.id_adolescente IS NULL;

    COMMIT;
END//

CALL migrar_adolescentes_infancias()//
DROP PROCEDURE migrar_adolescentes_infancias//

DELIMITER ;

-- Revisar manualmente estos IDs; el script no duplica ni borra sus datos.
SELECT 'familiar' AS tabla, f.id AS id_registro, f.id_solicitud,
    COALESCE(a.cantidad, 0) AS cantidad_adolescentes
FROM familiar f
LEFT JOIN (
    SELECT id_solicitud, COUNT(*) AS cantidad
    FROM adolescente GROUP BY id_solicitud
) a ON a.id_solicitud = f.id_solicitud
WHERE f.id_adolescente IS NULL;

SELECT 'solicitud_institucion' AS tabla, r.id AS id_registro, r.id_solicitud,
    COALESCE(a.cantidad, 0) AS cantidad_adolescentes
FROM solicitud_institucion r
LEFT JOIN (
    SELECT id_solicitud, COUNT(*) AS cantidad
    FROM adolescente GROUP BY id_solicitud
) a ON a.id_solicitud = r.id_solicitud
WHERE r.id_adolescente IS NULL;
