CREATE DATABASE IF NOT EXISTS infancias;

USE infancias;

CREATE TABLE domicilio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    calle VARCHAR(256) NOT NULL,
    codigo_calle INT NULL,
    altura INT NOT NULL,
    bis BOOLEAN NOT NULL,
    letra CHAR(1) NULL,
    piso INT NULL,
    depto VARCHAR(10) NULL,
    monoblock INT NULL,
    barrio VARCHAR(128) NULL,
    vecinal VARCHAR(128) NULL,
    distrito VARCHAR(16) NULL,
    seccional_policial VARCHAR(32) NULL,
    localidad VARCHAR(128) NOT NULL,
    coordenada_x VARCHAR(32) NULL,
    coordenada_y VARCHAR(32) NULL,
    fraccion_censal VARCHAR(32) NULL,
    radio_censal VARCHAR(32) NULL
);



CREATE TABLE IF NOT EXISTS persona (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(8) NOT NULL,
    nombre VARCHAR(32) NOT NULL,
    apellido VARCHAR(32) NOT NULL,
    id_domicilio INT NOT NULL,
    id_localidad INT NOT NULL,
    telefono VARCHAR(16) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    FOREIGN KEY (id_domicilio) REFERENCES domicilio (id)
);

CREATE TABLE IF NOT EXISTS tipo_efector (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(16) NOT NULL
);

CREATE TABLE IF NOT EXISTS efector (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(128) NOT NULL,
    id_domicilio INT NOT NULL,
    id_tipo INT NOT NULL,
    FOREIGN KEY (id_domicilio) REFERENCES domicilio (id),
    FOREIGN KEY (id_tipo) REFERENCES tipo_efector (id)
);

CREATE TABLE IF NOT EXISTS escolaridad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS ccb (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32)
);


CREATE TABLE IF NOT EXISTS obra_social (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS menor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    escolaridad_actual BOOLEAN NOT NULL,
    id_escolaridad INT NOT NULL,
    id_efector_ref INT NULL,
    id_ccb_ref INT NULL,
    id_obra_social INT NULL,
    FOREIGN KEY (id_escolaridad) REFERENCES escolaridad (id),
    FOREIGN KEY (id_efector_ref) REFERENCES efector (id),
    FOREIGN KEY (id_ccb_ref) REFERENCES ccb (id),
    FOREIGN KEY (id_obra_social) REFERENCES obra_social (id)
);

CREATE TABLE IF NOT EXISTS instruccion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS ocupacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);


CREATE TABLE IF NOT EXISTS tipo_relacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS relacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_menor INT NOT NULL,
    id_familiar INT NOT NULL,
    id_tipo INT NOT NULL,
    convive BOOLEAN NOT NULL,
    id_instruccion INT NOT NULL,
    id_ocupacion INT NOT NULL,
    FOREIGN KEY (id_instruccion) REFERENCES instruccion (id),
    FOREIGN KEY (id_ocupacion) REFERENCES ocupacion (id)
);


CREATE TABLE IF NOT EXISTS tenencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS material (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS habitat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_domicilio INT NOT NULL,
    exclusividad_terreno BOOLEAN NOT NULL,
    exclusividad_vivienda BOOLEAN NOT NULL,
    id_tenencia INT NOT NULL,
    id_material_pared INT NULL,
    id_material_techo INT NULL,
    id_material_piso INT NULL,
    agua_corriente BOOLEAN NOT NULL,
    instalacion_electrica BOOLEAN NOT NULL,
    FOREIGN KEY (id_domicilio) REFERENCES domicilio (id),
    FOREIGN KEY (id_tenencia) REFERENCES tenencia (id),
    FOREIGN KEY (id_material_pared) REFERENCES material (id),    
    FOREIGN KEY (id_material_techo) REFERENCES material (id),
    FOREIGN KEY (id_material_piso) REFERENCES material (id)    
);

CREATE TABLE IF NOT EXISTS  comedor(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS tuc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS auh (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS pension_contributiva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS pension_no_contributiva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS programa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);


CREATE TABLE IF NOT EXISTS grupo_familiar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_comedor INT NOT NULL,
    id_tuc INT NOT NULL,
    id_auh INT NOT NULL,
    id_pension_cont INT NOT NULL,
    id_pension_no_cont INT NOT NULL,
    id_programa INT NOT NULL,
    obra_social BOOLEAN NOT NULL,
    FOREIGN KEY (id_comedor) REFERENCES comedor(id),
    FOREIGN KEY (id_tuc) REFERENCES tuc (id),
    FOREIGN KEY (id_pension_cont) REFERENCES pension_contributiva(id),
    FOREIGN KEY (id_pension_no_cont) REFERENCES pension_no_contributiva (id),
    FOREIGN KEY (id_programa) REFERENCES programa (id)
);


CREATE TABLE IF NOT EXISTS institucion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL,
    id_domicilio INT NOT NULL,
    FOREIGN KEY (id_domicilio) REFERENCES domicilio (id)
);


CREATE TABLE IF NOT EXISTS atencion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_institucion INT NOT NULL,
    fecha_hora_creacion DATETIME NOT NULL,   
    id_menor INT NOT NULL,
    id_habitat INT NOT NULL,
    id_grupo_familiar INT NOT NULL,
    FOREIGN KEY (id_institucion) REFERENCES institucion(id),
    FOREIGN KEY (id_menor) REFERENCES menor(id),
    FOREIGN KEY (id_habitat) REFERENCES habitat (id),
    FOREIGN KEY (id_grupo_familiar) REFERENCES grupo_familiar (id)
);


CREATE TABLE IF NOT EXISTS atencion_relacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_relacion INT NOT NULL,
    id_atencion INT NOT NULL,
    FOREIGN KEY (id_relacion) REFERENCES relacion (id),
    FOREIGN KEY (id_atencion) REFERENCES atencion (id)
);