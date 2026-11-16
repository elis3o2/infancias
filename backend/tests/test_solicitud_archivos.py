"""Reglas de adjuntos sin base de datos, archivos reales ni servicios externos."""
from types import SimpleNamespace

from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError

from src.apps.solicitud.services import validar_archivos


class SolicitudArchivosTests(SimpleTestCase):
    @staticmethod
    def archivo(nombre="prueba.pdf", tipo="application/pdf", tamano=100):
        return SimpleNamespace(name=nombre, content_type=tipo, size=tamano)

    def test_acepta_formatos_permitidos_y_tipo_generico(self):
        validar_archivos([])
        validar_archivos([
            self.archivo(), self.archivo("prueba.JPG", "image/jpeg"),
            self.archivo("prueba.png", "application/octet-stream"),
        ])

    def test_rechaza_tipo_extension_cantidad_y_tamanos_invalidos(self):
        casos = [
            [self.archivo("archivo.exe")], [self.archivo(tipo="text/html")],
            [self.archivo()] * 6, [self.archivo(tamano=10 * 1024 * 1024 + 1)],
            [self.archivo(tamano=8 * 1024 * 1024)] * 4,
        ]
        for archivos in casos:
            with self.subTest(archivos=archivos), self.assertRaises(ValidationError):
                validar_archivos(archivos)
