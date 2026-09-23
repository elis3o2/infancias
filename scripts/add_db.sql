INSERT INTO vinculo (nombre, adolescente) VALUES
('Padre/Madre', false),
('Hermano/a', false),
('Tio/a', false),
('Abuelo/a', false),
('Vecino/a', false),
('Sobrino/a', false),
('Otro', false),
('Hermano/a', true),
('Medio hermano/a', true),
('Hermanastro/a', true),
('Primo', true);


INSERT INTO tipo_institucion (nombre) VALUES
('Educativa'),
('De Salud'),
('Judicial'),
('Otra');


INSERT INTO motivo_solicitud (nombre) VALUES
("Abuso Sexual hacia las Infancias"),
("Adulto Responsable detenido"),
("Ausencia de Adulto Responsable"),
("Conductas sexuales inapropiadas entre niñxs"),
("Consumo Problemático del niñe"),
("Desvinculo (Protocolo de desvinculo provincial - hospitales)"),
("Educación"),
("Grooming"),
("Identidad"),
("Negligencia"),
("Negligencia por Consumo Problematico de adulto"),
("Negligencia por sit. de violencia de genero"),
("Negligencia por salud mental adulto"),
("Niños en situación de calle"),
("Niñxs o adolescentes en situación penal"),
("Pornografia Infantil"),
("Prostitucion Infantil"),
("Salud"),
("Salud Mental del niñe"),
("Trabajo Infantil"),
("Violencia"),
("Trata de Personas"),
("Violencia de Género"),
("Maltrato Infantil");



INSERT INTO equipo(nombre) VALUES
("Entrada"),
("Admisión"),
("Territorial");

ALTER TABLE solicitud
ADD CONSTRAINT fk_solicitud_usuario
FOREIGN KEY (id_usuario_admision)
REFERENCES src_usuario(id);


ALTER TABLE solicitud
ADD CONSTRAINT fk_solicitud_usuario_ent
FOREIGN KEY (id_usuario_entrada)
REFERENCES src_usuario(id);



ALTER TABLE solicitud_comentario
ADD CONSTRAINT fk_solicitud_comentario
FOREIGN KEY (id_usuario)
REFERENCES src_usuario(id);