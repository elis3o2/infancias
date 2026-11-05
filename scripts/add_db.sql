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
("Educación"),
("Grooming"),
("Identidad"),
("Sustitución de la identidad"),
("Cuidadores adultos sin marco legal"),
("Ausencia de Adulto Responsable"),
("Ausencia de cuidados parentales por Consumo Problemático de adulto"),
("Ausencia de cuidados parentales por Salud Mental de adulto"),
("Niño/a o Adolescente víctima de violencia de género y/o violencia intrafamiliar"),
("Niño/a o Adolescente víctima de Violencia Sexual"),
("Niño/a o Adolescente víctima de Pornografía Infantil"),
("Niño/a o Adolescente víctima de Prostitución Infantil"),
("Niño/a o Adolescente víctima de Maltrato Infantil"),
("Maltrato físico"),
("Niño/a o Adolescente víctima de Maltrato Infantil"),
("Maltrato psicológico"),
("Niñxs o adolescentes en situación penal"),
("Bebé con tóxicos positivos"),
("Ausencia o falta de adherencia a tratamientos de salud de niños/as o adolescentes"),
("Conviviente con enfermedades infecto-contagiosas sin tratamientos"),
("Ausencia y/o dificultades en el abordaje de Salud Mental del niño/a  o adolescente"),
("Consumo Problemático de sustancias del niño/a o adolescente"),
("Explotación Infantil");


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