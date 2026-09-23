CREATE DATABASE IF NOT EXISTS infancias;

USE infancias;


CREATE TABLE IF NOT EXISTS distrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(16) NOT NULL
);


CREATE TABLE IF NOT EXISTS vecinal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);


CREATE TABLE IF NOT EXISTS barrio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);


CREATE TABLE IF NOT EXISTS seccional_policial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);


CREATE TABLE IF NOT EXISTS identidad_barrial(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL 
);


CREATE TABLE IF NOT EXISTS domicilio_validado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_calle INT NULL,
    altura INT NOT NULL,
    bis BOOLEAN NOT NULL,
    letra CHAR NULL,
    nombreInterseccion VARCHAR(64) NULL,
    codigoInterseccion INT NULL,
    coordenada_x REAL NULL,
    coordenada_y REAL NULL,
    id_distrito INT NULL,
    id_vecinal INT NULL,
    id_barrio INT NULL,
    id_seccional_policial INT NULL,
    fraccion_censal INT NULL,
    radio_censal INT NULL,
    zona_notificacion INT NULL,
    id_identidad_barrial INT NULL,
    localidad VARCHAR(32) NULL,
    puntoX REAL NULL,
    puntoY REAL NULL,
    latitud REAL NULL,
    longitud REAL NULL,
    FOREIGN KEY (id_distrito) REFERENCES distrito(id),
    FOREIGN KEY (id_vecinal) REFERENCES vecinal(id),
    FOREIGN KEY (id_barrio) REFERENCES barrio(id),
    FOREIGN KEY (id_seccional_policial) REFERENCES seccional_policial(id),
    FOREIGN KEY (id_identidad_barrial) REFERENCES identidad_barrial(id)
);


CREATE TABLE IF NOT EXISTS provincia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);


CREATE TABLE IF NOT EXISTS departamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL,
    id_provincia INT NOT NULL,
    FOREIGN KEY (id_provincia) REFERENCES provincia(id)
);


CREATE TABLE IF NOT EXISTS domicilio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(128) NOT NULL,
    observaciones VARCHAR(256) NULL,
    id_domicilio_validado INT NULL,
    id_departamento INT NOT NULL,
    FOREIGN KEY (id_domicilio_validado) REFERENCES domicilio_validado(id),
    FOREIGN KEY (id_departamento) REFERENCES departamento(id)
);


CREATE TABLE IF NOT EXISTS tipo_institucion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL
);


CREATE TABLE IF NOT EXISTS institucion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(128) NOT NULL,
    id_domicilio INT NOT NULL,
    id_tipo INT NOT NULL,
    FOREIGN KEY (id_domicilio) REFERENCES domicilio (id),
    FOREIGN KEY (id_tipo) REFERENCES tipo_institucion (id)
);


CREATE TABLE IF NOT EXISTS carpeta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_insert INT NULL,
    letra CHAR NOT NULL
);


CREATE TABLE IF NOT EXISTS legajo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_insert INT NULL,
    id_carpeta INT NOT NULL,
    letra CHAR NOT NULL,
    FOREIGN KEY (id_carpeta) REFERENCES carpeta(id)
);


CREATE TABLE IF NOT EXISTS persona (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(9) NOT NULL,
    sexo  CHAR NOT NULL,
    nombre VARCHAR(32) NOT NULL,
    apellido VARCHAR(32) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    id_legajo INT NULL,
    hcf INT NULL,
    discapacidades BOOLEAN NOT NULL DEFAULT false,
    consumos_problematicos BOOLEAN NOT NULL DEFAULT false,
    intentos_de_suicidio BOOLEAN NOT NULL DEFAULT false,
    problemas_socioambientales BOOLEAN NOT NULL DEFAULT false,
    violencias BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY (id_legajo) REFERENCES legajo(id)
);


CREATE TABLE IF NOT EXISTS vinculo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL,
    adolescente BOOLEAN NOT NULL
);


CREATE TABLE IF NOT EXISTS relacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_persona_1 INT NOT NULL,
    id_persona_2 INT NOT NULL,
    id_vinculo INT NOT NULL,
    FOREIGN KEY (id_persona_1) REFERENCES persona(id),
    FOREIGN KEY (id_persona_2) REFERENCES persona(id),
    FOREIGN KEY (id_vinculo) REFERENCES vinculo (id),
    CONSTRAINT relacion_adolescente_unica
        UNIQUE (id_persona_1, id_persona_2, id_vinculo),
    CONSTRAINT relacion_adolescente_distintos
        CHECK (id_persona_1 <> id_persona_2)
);


CREATE TABLE IF NOT EXISTS persona_domicilio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    id_domicilio INT NOT NULL,
    fecha_carga DATETIME NOT NULL,
    FOREIGN KEY (id_persona) REFERENCES persona(id),
    FOREIGN KEY (id_domicilio) REFERENCES domicilio(id)
);


CREATE TABLE IF NOT EXISTS persona_telefono (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    telefono VARCHAR(16) NOT NULL,
    fecha_carga DATETIME NOT NULL,
    FOREIGN KEY (id_persona) REFERENCES persona(id)
);


CREATE TABLE IF NOT EXISTS motivo_solicitud (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);


CREATE TABLE IF NOT EXISTS prioridad_solicitud (
    id INT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL
);


CREATE TABLE IF NOT EXISTS equipo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL
);


CREATE TABLE IF NOT EXISTS solicitud (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_institucion INT NULL,
    correo VARCHAR(32) NOT NULL,
    telefono VARCHAR(32) NOT NULL,
    id_motivo INT NOT NULL,
    descripcion VARCHAR(256) NULL,
    descripcion_extra VARCHAR(256) NULL,
    fecha_hora_creacion DATETIME NOT NULL,
    fecha_hora_entrada DATETIME NULL,
    fecha_hora_admision DATETIME NULL,
    validado BOOLEAN DEFAULT false,
    rechazado BOOLEAN DEFAULT false,
    motivo_rechazo VARCHAR(256) NULL,
    id_equipo INT NULL,
    id_usuario_entrada INT NULL,
    id_usuario_admision INT NULL,
    FOREIGN KEY (id_institucion) REFERENCES institucion(id),
    FOREIGN KEY (id_motivo) REFERENCES motivo_solicitud(id),
    FOREIGN KEY (id_equipo) REFERENCES equipo(id)
);


CREATE TABLE IF NOT EXISTS adolescente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(9) NOT NULL,
    sexo  CHAR NOT NULL,
    nombre VARCHAR(32) NOT NULL,
    apellido VARCHAR(32) NOT NULL,
    id_domicilio INT NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    escolarizado BOOLEAN NULL,
    id_persona INT NULL,
    id_solicitud INT NOT NULL,
    FOREIGN KEY (id_domicilio) REFERENCES domicilio (id),
    FOREIGN KEY (id_persona) REFERENCES persona (id),
    FOREIGN KEY (id_solicitud) REFERENCES solicitud(id)
);


CREATE TABLE IF NOT EXISTS relacion_adolescente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_adolescente1 INT NOT NULL,
    id_adolescente2 INT NOT NULL,
    id_vinculo INT NOT NULL,
    FOREIGN KEY (id_adolescente1) REFERENCES adolescente(id),
    FOREIGN KEY (id_adolescente2) REFERENCES adolescente(id),
    FOREIGN KEY (id_vinculo) REFERENCES vinculo(id),
    CONSTRAINT relacion_adolescente_unica
        UNIQUE (id_adolescente1, id_adolescente2, id_vinculo),
    CONSTRAINT relacion_adolescente_distintos
        CHECK (id_adolescente1 <> id_adolescente2)
);


CREATE TABLE IF NOT EXISTS familiar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL,
    apellido VARCHAR(32) NOT NULL,
    sexo CHAR NULL,
    dni VARCHAR(9) NULL,
    id_solicitud INT NOT NULL,
    id_adolescente INT NULL,
    id_vinculo INT NULL,
    telefono VARCHAR(16) NULL,
    id_persona INT NULL,
    id_domicilio INT NULL,
    FOREIGN KEY (id_solicitud) REFERENCES solicitud(id),
    FOREIGN KEY (id_adolescente) REFERENCES adolescente(id),
    FOREIGN KEY (id_vinculo) REFERENCES vinculo (id),
    FOREIGN KEY (id_persona) REFERENCES persona (id),
    FOREIGN KEY (id_domicilio) REFERENCES domicilio(id)
);


CREATE TABLE  IF NOT EXISTS archivo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100),
    contenido LONGBLOB NOT NULL,
    FOREIGN KEY (id_solicitud) REFERENCES solicitud(id)
);


CREATE TABLE IF NOT EXISTS adolescente_institucion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_adolescente INT NULL,
    id_institucion INT NOT NULL,
    FOREIGN KEY (id_adolescente) REFERENCES adolescente(id),
    FOREIGN KEY (id_institucion) REFERENCES institucion(id)
);


CREATE TABLE IF NOT EXISTS solicitud_comentario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    comentario VARCHAR(256) NOT NULL,
    fecha_hora_creacion DATETIME NOT NULL,
    fecha_hora_ultmod DATETIME NOT NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_solicitud) REFERENCES solicitud(id)
);
