-- Preparado para revision; NO ejecutado desde esta tarea.
-- Aplicacion manual sobre la base seleccionada, con respaldo y sin escrituras
-- concurrentes. MySQL 8.0.16+ / MariaDB 10.2.1+; DDL tiene commits implicitos.
-- Precondiciones: backend/docs/solicitudes_adolescentes.md.
-- No borra datos ni asigna IDs por nombre; conserva tablas/columnas historicas.
-- No crea otro catalogo, adolescente.id_institucion ni una tabla tripartita.

DELIMITER //

DROP PROCEDURE IF EXISTS migrar_adolescentes_infancias//
CREATE PROCEDURE migrar_adolescentes_infancias()
BEGIN
    DECLARE base_actual VARCHAR(64);
    DECLARE referencias_anteriores BOOLEAN DEFAULT FALSE;
    DECLARE referencias_con_adolescente BOOLEAN DEFAULT FALSE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET base_actual = DATABASE();
    IF base_actual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Seleccione la base de infancias antes de ejecutar el script.';
    END IF;
    IF (SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = base_actual
        AND TABLE_NAME IN ('vinculo', 'solicitud', 'adolescente', 'familiar', 'institucion')) <> 5 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Faltan tablas base. Este script migra una instalacion existente.';
    END IF;

    -- No se infiere la categoria: Hermano/a puede existir en ambas.
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'vinculo'
        AND COLUMN_NAME = 'adolescente') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Precondicion: crear y clasificar vinculo.adolescente segun la documentacion.';
    END IF;
    IF EXISTS (SELECT 1 FROM vinculo WHERE adolescente IS NULL OR adolescente NOT IN (0, 1)) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Clasifique todos los vinculos con adolescente=0 o 1 antes de continuar.';
    END IF;
    IF EXISTS (SELECT 1 FROM familiar f LEFT JOIN vinculo v ON v.id = f.id_vinculo
        WHERE f.id_vinculo IS NOT NULL AND (v.id IS NULL OR v.adolescente <> 0)) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hay familiares con vinculos inexistentes o de adolescentes. Revise su mapping.';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'relacion_adolescente') THEN
        -- Una FK al catalogo viejo requiere revisar el mapping fuera de este
        -- script; iguales IDs en dos catalogos no son prueba de equivalencia.
        IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'relacion_adolescente'
            AND COLUMN_NAME = 'id_vinculo' AND REFERENCED_TABLE_NAME = 'vinculo'
            AND REFERENCED_COLUMN_NAME = 'id')
            OR EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'relacion_adolescente'
            AND COLUMN_NAME = 'id_vinculo' AND REFERENCED_TABLE_NAME <> 'vinculo') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mapee los vinculos antiguos y ajuste la FK de relacion_adolescente a vinculo. No se infieren IDs.';
        END IF;
        IF EXISTS (SELECT 1 FROM relacion_adolescente r
            LEFT JOIN adolescente a1 ON a1.id = r.id_adolescente1
            LEFT JOIN adolescente a2 ON a2.id = r.id_adolescente2
            LEFT JOIN vinculo v ON v.id = r.id_vinculo
            WHERE a1.id IS NULL OR a2.id IS NULL OR v.id IS NULL
            OR a1.id = a2.id OR a1.id_solicitud <> a2.id_solicitud OR v.adolescente <> 1) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hay relaciones adolescentes invalidas. Revisarlas antes de migrar.';
        END IF;
        IF EXISTS (SELECT 1 FROM relacion_adolescente
            GROUP BY id_adolescente1, id_adolescente2, id_vinculo HAVING COUNT(*) > 1) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hay relaciones adolescentes duplicadas. No se borran automaticamente.';
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'familiar' AND COLUMN_NAME = 'id_adolescente') THEN
        IF EXISTS (SELECT 1 FROM familiar f LEFT JOIN adolescente a ON a.id = f.id_adolescente
            WHERE f.id_adolescente IS NOT NULL AND (a.id IS NULL OR a.id_solicitud <> f.id_solicitud)) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hay familiares con adolescente inexistente o de otra solicitud.';
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'adolescente_institucion') THEN
        IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'adolescente_institucion'
            AND COLUMN_NAME = 'id_solicitud') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'adolescente_institucion debe contener solo el par adolescente/institucion. Revise el esquema legado.';
        END IF;
        IF EXISTS (SELECT 1 FROM adolescente_institucion r
            LEFT JOIN adolescente a ON a.id = r.id_adolescente
            LEFT JOIN institucion i ON i.id = r.id_institucion
            WHERE a.id IS NULL OR i.id IS NULL) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hay referencias sin adolescente o institucion valida. Asignarlas manualmente antes de migrar.';
        END IF;
        IF EXISTS (SELECT 1 FROM adolescente_institucion
            GROUP BY id_adolescente, id_institucion HAVING COUNT(*) > 1) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hay referencias duplicadas. Debe revisarlas; el script no elimina registros.';
        END IF;
    END IF;

    SET referencias_anteriores = EXISTS (SELECT 1 FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'solicitud_institucion');
    SET referencias_con_adolescente = EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'solicitud_institucion'
        AND COLUMN_NAME = 'id_adolescente');
    IF referencias_anteriores AND referencias_con_adolescente THEN
        IF EXISTS (SELECT 1 FROM solicitud_institucion r
            LEFT JOIN adolescente a ON a.id = r.id_adolescente
            LEFT JOIN institucion i ON i.id = r.id_institucion
            WHERE r.id_adolescente IS NOT NULL
            AND (a.id IS NULL OR i.id IS NULL OR a.id_solicitud <> r.id_solicitud)) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hay referencias historicas con adolescente inexistente o de otra solicitud.';
        END IF;
    END IF;

    -- La institucion solicitante queda en solicitud; no se copia a adolescentes.
    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'vinculo'
        AND COLUMN_NAME = 'adolescente' AND IS_NULLABLE = 'YES') THEN
        ALTER TABLE vinculo MODIFY COLUMN adolescente BOOLEAN NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'solicitud'
        AND COLUMN_NAME = 'id_institucion' AND IS_NULLABLE = 'NO') THEN
        ALTER TABLE solicitud MODIFY COLUMN id_institucion INT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'familiar' AND COLUMN_NAME = 'id_adolescente') THEN
        ALTER TABLE familiar ADD COLUMN id_adolescente INT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'familiar'
        AND COLUMN_NAME = 'id_adolescente' AND REFERENCED_TABLE_NAME = 'adolescente'
        AND REFERENCED_COLUMN_NAME = 'id') THEN
        ALTER TABLE familiar ADD CONSTRAINT fk_familiar_adolescente
            FOREIGN KEY (id_adolescente) REFERENCES adolescente(id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'familiar'
        AND COLUMN_NAME = 'id_vinculo' AND IS_NULLABLE = 'NO') THEN
        ALTER TABLE familiar MODIFY COLUMN id_vinculo INT NULL;
    END IF;

    CREATE TABLE IF NOT EXISTS adolescente_institucion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_adolescente INT NOT NULL,
        id_institucion INT NOT NULL,
        CONSTRAINT fk_ai_adolescente FOREIGN KEY (id_adolescente) REFERENCES adolescente(id),
        CONSTRAINT fk_ai_institucion FOREIGN KEY (id_institucion) REFERENCES institucion(id),
        CONSTRAINT adolescente_institucion_unica UNIQUE (id_adolescente, id_institucion)
    );
    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'adolescente_institucion'
        AND COLUMN_NAME = 'id_adolescente' AND IS_NULLABLE = 'YES') THEN
        ALTER TABLE adolescente_institucion MODIFY COLUMN id_adolescente INT NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = base_actual AND TABLE_NAME = 'adolescente_institucion'
        AND CONSTRAINT_NAME = 'adolescente_institucion_unica') THEN
        ALTER TABLE adolescente_institucion ADD CONSTRAINT adolescente_institucion_unica
            UNIQUE (id_adolescente, id_institucion);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'adolescente_institucion'
        AND COLUMN_NAME = 'id_adolescente' AND REFERENCED_TABLE_NAME = 'adolescente'
        AND REFERENCED_COLUMN_NAME = 'id') THEN
        ALTER TABLE adolescente_institucion ADD CONSTRAINT fk_ai_adolescente
            FOREIGN KEY (id_adolescente) REFERENCES adolescente(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = base_actual AND TABLE_NAME = 'adolescente_institucion'
        AND COLUMN_NAME = 'id_institucion' AND REFERENCED_TABLE_NAME = 'institucion'
        AND REFERENCED_COLUMN_NAME = 'id') THEN
        ALTER TABLE adolescente_institucion ADD CONSTRAINT fk_ai_institucion
            FOREIGN KEY (id_institucion) REFERENCES institucion(id);
    END IF;

    CREATE TABLE IF NOT EXISTS relacion_adolescente (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_adolescente1 INT NOT NULL,
        id_adolescente2 INT NOT NULL,
        id_vinculo INT NOT NULL,
        FOREIGN KEY (id_adolescente1) REFERENCES adolescente(id),
        FOREIGN KEY (id_adolescente2) REFERENCES adolescente(id),
        FOREIGN KEY (id_vinculo) REFERENCES vinculo(id),
        CONSTRAINT relacion_adolescente_unica UNIQUE (id_adolescente1, id_adolescente2, id_vinculo),
        CONSTRAINT chk_ra_adolescentes_distintos CHECK (id_adolescente1 <> id_adolescente2)
    );
    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = base_actual AND TABLE_NAME = 'relacion_adolescente'
        AND CONSTRAINT_NAME = 'relacion_adolescente_unica') THEN
        ALTER TABLE relacion_adolescente ADD CONSTRAINT relacion_adolescente_unica
            UNIQUE (id_adolescente1, id_adolescente2, id_vinculo);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = base_actual AND TABLE_NAME = 'relacion_adolescente'
        AND CONSTRAINT_NAME IN ('relacion_adolescente_distintos', 'chk_ra_adolescentes_distintos')
        AND CONSTRAINT_TYPE = 'CHECK') THEN
        ALTER TABLE relacion_adolescente ADD CONSTRAINT chk_ra_adolescentes_distintos
            CHECK (id_adolescente1 <> id_adolescente2);
    END IF;

    START TRANSACTION;
    IF referencias_anteriores AND referencias_con_adolescente THEN
        -- Se copian solo pares explicitos; el origen permanece intacto.
        INSERT INTO adolescente_institucion (id_adolescente, id_institucion)
        SELECT DISTINCT r.id_adolescente, r.id_institucion
        FROM solicitud_institucion r
        WHERE r.id_adolescente IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM adolescente_institucion destino
            WHERE destino.id_adolescente = r.id_adolescente
                AND destino.id_institucion = r.id_institucion
        );
    END IF;
    COMMIT;

    -- Pendientes: nunca asignar al primero ni duplicar en todos. Incluso una
    -- solicitud con un adolescente requiere confirmar el dato historico.
    SELECT 'Familiar pendiente de asociacion manual' AS pendiente,
        id, id_solicitud, nombre, apellido
    FROM familiar WHERE id_adolescente IS NULL;
    IF referencias_anteriores THEN
        IF referencias_con_adolescente THEN
            SELECT 'Referencia historica NO migrada; requiere asociacion manual' AS pendiente,
                id, id_solicitud, id_institucion
            FROM solicitud_institucion WHERE id_adolescente IS NULL;
        ELSE
            SELECT 'Referencia historica NO migrada; requiere asociacion manual' AS pendiente,
                id, id_solicitud, id_institucion
            FROM solicitud_institucion;
        END IF;
    END IF;
END//

CALL migrar_adolescentes_infancias()//
DROP PROCEDURE migrar_adolescentes_infancias//

DELIMITER ;
