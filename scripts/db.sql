CREATE DATABASE IF NOT EXISTS infancias;

USE infancias;


CREATE TABLE IF NOT EXISTS domicilio_validado (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    coordenada_x REAL NULL,
    coordenada_y REAL NULL,
    fraccion_censal VARCHAR(32) NULL,
    radio_censal VARCHAR(32) NULL
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
    id_domicilio_validado INT NULL,
    id_departamento INT NOT NULL,
    FOREIGN KEY (id_domicilio_validado) REFERENCES domicilio_validado(id),
    FOREIGN KEY (id_departamento) REFERENCES departamento(id)
);


CREATE TABLE IF NOT EXISTS tipo_institucion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL,
    educacion BOOLEAN,
    territorial BOOLEAN
);

CREATE TABLE IF NOT EXISTS institucion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(128) NOT NULL,
    id_domicilio INT NOT NULL,
    id_tipo INT NOT NULL,
    telefono VARCHAR(16) NOT NULL,
    correo VARCHAR(32) NOT NULL,
    FOREIGN KEY (id_domicilio) REFERENCES domicilio (id),
    FOREIGN KEY (id_tipo) REFERENCES tipo_institucion (id)
);


CREATE TABLE IF NOT EXISTS solicitante (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(10) NULL,
    nombre VARCHAR(32) NOT NULL,
    apellido VARCHAR(32) NOT NULL
);


CREATE TABLE IF NOT EXISTS adolescente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(9) NOT NULL,
    sexo  CHAR NOT NULL,
    nombre VARCHAR(32) NOT NULL,
    apellido VARCHAR(32) NOT NULL,
    id_domicilio INT NULL,
    fecha_nacimiento DATE NOT NULL,
    escolarizado BOOLEAN NOT NULL,
    FOREIGN KEY (id_domicilio) REFERENCES domicilio (id)
);


CREATE TABLE IF NOT EXISTS adolescente_validado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(9) NOT NULL,
    sexo  CHAR NOT NULL,
    nombre VARCHAR(32) NOT NULL,
    apellido VARCHAR(32) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    id_adolescente INT NOT NULL,
    FOREIGN KEY (id_adolescente) REFERENCES adolescente(id)
);


CREATE TABLE IF NOT EXISTS hermano (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(9) NOT NULL,
    sexo  CHAR NOT NULL,
    nombre VARCHAR(32) NOT NULL,
    apellido VARCHAR(32) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    id_adolescente INT NOT NULL,
    FOREIGN KEY (id_adolescente) REFERENCES adolescente(id)
);


CREATE TABLE IF NOT EXISTS hermano_validado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(9) NOT NULL,
    sexo  CHAR NOT NULL,
    nombre VARCHAR(32) NOT NULL,
    apellido VARCHAR(32) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    id_hermano INT NOT NULL,
    FOREIGN KEY (id_hermano) REFERENCES hermano(id)
);


CREATE TABLE IF NOT EXISTS vinculo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);


CREATE TABLE IF NOT EXISTS familiar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL,
    apellido VARCHAR(32) NOT NULL,
    id_adolescente INT NOT NULL,
    id_vinculo INT NOT NULL,
    telefono VARCHAR(16) NULL,
    FOREIGN KEY (id_adolescente) REFERENCES adolescente (id),
    FOREIGN KEY (id_vinculo) REFERENCES vinculo (id)
);


CREATE TABLE IF NOT EXISTS motivo_solicitud (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(64) NOT NULL
);


CREATE TABLE IF NOT EXISTS prioridad_solicitud (
    id INT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS derivacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL
);


CREATE TABLE IF NOT EXISTS solicitud (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_institucion INT NOT NULL,
    correo VARCHAR(32) NOT NULL,
    telefono VARCHAR(32) NOT NULL,
    id_solicitante INT NOT NULL,
    id_adolescente INT NOT NULL,
    id_motivo INT NOT NULL,
    id_prioridad INT NOT NULL,
    descripcion VARCHAR(256) NULL,
    fecha_hora_creacion DATETIME NOT NULL,
    fecha_hora_modificacion DATETIME NULL,
    validado BOOLEAN DEFAULT false,
    rechazado BOOLEAN DEFAULT false,
    motivo_rechazo VARCHAR(256) NULL,
    id_derivacion INT NULL,
    FOREIGN KEY (id_institucion) REFERENCES institucion(id),
    FOREIGN KEY (id_solicitante) REFERENCES solicitante(id),
    FOREIGN KEY (id_adolescente) REFERENCES adolescente(id),
    FOREIGN KEY (id_motivo) REFERENCES motivo_solicitud(id),
    FOREIGN KEY (id_prioridad) REFERENCES prioridad_solicitud(id),
    FOREIGN KEY (id_derivacion) REFERENCES derivacion(id)
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
    id_adolescente INT NOT NULL,
    id_institucion INT NOT NULL,
    FOREIGN KEY (id_adolescente) REFERENCES adolescente(id),
    FOREIGN KEY (id_institucion) REFERENCES institucion(id)    
);
