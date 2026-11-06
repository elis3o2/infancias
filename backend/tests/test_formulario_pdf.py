from io import BytesIO
from unittest.mock import patch

import pdfplumber
from django.apps import apps
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection, transaction
from django.test import TestCase

from src.apps.domicilio.models import Provincia, Departamento, Domicilio, TipoInstitucion, Institucion
from src.apps.persona.models import Vinculo
from src.apps.solicitud.copia_formulario import CopiaFormulario, SeccionFormulario, capturar_formulario
from src.apps.solicitud.formulario_pdf import generar_formulario_pdf
from src.apps.solicitud.models import MotivoSolicitud, Solicitud
from src.apps.solicitud.serializers import SolicitudCreateSerializer
from src.apps.solicitud.services import crear_solicitud
from src.models import Equipo


class FormularioPdfTests(TestCase):
    @classmethod
    def setUpClass(cls):
        if connection.vendor != "sqlite" or "memory" not in connection.settings_dict["NAME"]:
            raise RuntimeError("Estas pruebas solo pueden usar SQLite en memoria.")
        cls.modelos = [modelo for modelo in apps.get_models() if not modelo._meta.managed]
        with connection.schema_editor() as editor:
            for modelo in cls.modelos:
                editor.create_model(modelo)
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        with connection.schema_editor() as editor:
            for modelo in reversed(cls.modelos):
                editor.delete_model(modelo)

    def setUp(self):
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("No debe haber HTTP real"))
        red.start()
        self.addCleanup(red.stop)
        envio = patch("src.apps.solicitud.services.enviar_correo")
        self.correo = envio.start()
        self.addCleanup(envio.stop)
        Equipo.objects.create(id=1, nombre="Entrada")
        provincia = Provincia.objects.create(nombre="Santa Fe")
        self.departamento = Departamento.objects.create(nombre="Rosario", provincia=provincia)
        domicilio = Domicilio.objects.create(nombre="Dirección de institución", departamento=self.departamento)
        tipo = TipoInstitucion.objects.create(nombre="Escuela")
        self.institucion = Institucion.objects.create(nombre="Escuela de prueba", tipo=tipo, domicilio=domicilio)
        self.motivo = MotivoSolicitud.objects.create(nombre="Consulta de prueba")
        self.familiar = Vinculo.objects.create(nombre="Madre", adolescente=False)
        self.hermano = Vinculo.objects.create(nombre="Hermano", adolescente=True)

    def _datos(self):
        return {
            "id_motivo": self.motivo.pk, "id_institucion": self.institucion.pk,
            "correo": "destino@example.test", "telefono": "3411234567", "descripcion": "Descripción <literal> & líneas\nSegunda línea.",
            "adolescentes": [{
                "id_temp": "primero", "nombre": "María", "apellido": "Niñez", "dni": "50000001", "sexo": "F",
                "fecha_nacimiento": "2012-02-18", "escolarizado": True,
                "domicilio": {"nombre": "Calle de prueba 100", "id_departamento": self.departamento.pk, "observaciones": "Piso 2"},
                "familiares": [{"nombre": "Ana", "apellido": "Referencia", "dni": "30000001", "sexo": "F", "id_vinculo": self.familiar.pk,
                    "telefono": "3417654321", "domicilio": {"nombre": "Otra dirección 200", "id_departamento": self.departamento.pk}}],
                "referencias_instituciones_data": [{"id": self.institucion.pk}],
            }, {
                "id_temp": "segundo", "nombre": "José", "apellido": "Niñez", "dni": "50000002", "sexo": "M", "fecha_nacimiento": "2013-01-01",
                "domicilio": {"nombre": "Calle de prueba 100", "id_departamento": self.departamento.pk}, "familiares": [],
            }],
            "relaciones_adolescentes": [{"id_temp1": "primero", "id_temp2": "segundo", "id_vinculo": self.hermano.pk}],
        }

    def _crear(self, datos=None, archivos=None):
        serializer = SolicitudCreateSerializer(data=datos or self._datos())
        serializer.is_valid(raise_exception=True)
        return crear_solicitud(serializer.validated_data, archivos)

    def _texto(self, contenido):
        with pdfplumber.open(BytesIO(contenido)) as pdf:
            return "\n".join(pagina.extract_text() for pagina in pdf.pages)

    def test_confirmacion_adjunta_pdf_completo_solo_despues_del_commit(self):
        with self.captureOnCommitCallbacks(execute=True):
            solicitud = self._crear(archivos=[SimpleUploadedFile("documento.txt", b"No reenviar contenido", content_type="text/plain")])
            self.correo.assert_not_called()
        self.correo.assert_called_once()
        llamada = self.correo.call_args.kwargs
        self.assertEqual(llamada["to_emails"], ["destino@example.test"])
        self.assertIn("copia del formulario", llamada["body"])
        adjunto, = llamada["attachments"]
        self.assertEqual(adjunto.name, f"solicitud-{solicitud.pk}.pdf")
        self.assertEqual(adjunto.content_type, "application/pdf")
        contenido = adjunto.read()
        self.assertTrue(contenido.startswith(b"%PDF-"))
        texto = self._texto(contenido)
        for campo in ("María Niñez", "José Niñez", "50000001", "30000001", "18-02-2012", "Escolarizado: Sí", "Ana Referencia",
                      "Madre", "Hermano", "Otra dirección 200", "Piso 2", "Rosario, Santa Fe", "Escuela de prueba", "Instituciones de referencia",
                      "destino@example.test", "3411234567", "3417654321", "Descripción <literal> & líneas", "Segunda línea.", "documento.txt"):
            with self.subTest(campo=campo):
                self.assertIn(campo, texto)
        self.assertNotIn("No reenviar contenido", texto)

    def test_copia_no_cambia_si_se_editan_los_datos_antes_del_envio(self):
        with self.captureOnCommitCallbacks(execute=True):
            solicitud = self._crear()
            solicitud.adolescentes.update(nombre="Modificado posteriormente")
        texto = self._texto(self.correo.call_args.kwargs["attachments"][0].read())
        self.assertIn("María Niñez", texto)
        self.assertNotIn("Modificado posteriormente", texto)

    def test_sin_correo_no_genera_pdf_ni_intenta_enviar(self):
        serializer = SolicitudCreateSerializer(data=self._datos())
        serializer.is_valid(raise_exception=True)
        # El formulario exige correo; el servicio conserva compatibilidad con altas sin él.
        serializer.validated_data["correo"] = ""
        with patch("src.apps.solicitud.services.generar_formulario_pdf") as pdf, self.captureOnCommitCallbacks(execute=True):
            crear_solicitud(serializer.validated_data)
        self.correo.assert_not_called()
        pdf.assert_not_called()

    def test_rollback_no_envia_confirmacion(self):
        with self.captureOnCommitCallbacks(execute=True):
            with self.assertRaises(ValueError), transaction.atomic():
                self._crear()
                raise ValueError("Cancelar operación")
        self.correo.assert_not_called()
        self.assertFalse(Solicitud.objects.exists())

    def test_fallo_de_pdf_o_correo_no_revierte_solicitud(self):
        with patch("src.apps.solicitud.services.generar_formulario_pdf", side_effect=RuntimeError("Fallo simulado")), \
                self.assertLogs("src.apps.solicitud.services", level="ERROR"), self.captureOnCommitCallbacks(execute=True):
            solicitud = self._crear()
        self.assertTrue(Solicitud.objects.filter(pk=solicitud.pk).exists())
        self.correo.assert_not_called()
        self.correo.side_effect = RuntimeError("Correo no disponible")
        with self.assertLogs("src.apps.solicitud.services", level="ERROR"), self.captureOnCommitCallbacks(execute=True):
            otra = self._crear()
        self.assertTrue(Solicitud.objects.filter(pk=otra.pk).exists())

    def test_pdf_largo_pagina_sin_truncar_y_escapa_texto(self):
        datos = CopiaFormulario(123, "06-10-2026 10:00", tuple(
            SeccionFormulario(f"Apartado {i}", (("Texto", "Línea <literal> & caracteres españoles: á é í ó ú ñ. " * 25),))
            for i in range(12)
        ) + (SeccionFormulario("Final", (("Marcador", "FIN DEL FORMULARIO"),)),))
        contenido = generar_formulario_pdf(datos)
        with pdfplumber.open(BytesIO(contenido)) as pdf:
            self.assertGreater(len(pdf.pages), 1)
            for numero, pagina in enumerate(pdf.pages, 1):
                self.assertIn(f"Página {numero}", pagina.extract_text())
            self.assertIn("FIN DEL FORMULARIO", pdf.pages[-1].extract_text())

    def test_instantanea_no_contiene_informacion_de_validacion(self):
        solicitud = self._crear()
        copia = capturar_formulario(solicitud)
        self.assertRegex(copia.fecha, r"^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$")
        texto = str(copia)
        self.assertNotIn("discapacidades", texto)
        self.assertNotIn("historia_clinica", texto)

    def test_api_correo_envia_pdf_como_archivo_multipart(self):
        from src.apps.api_externa import services as api

        contenido = generar_formulario_pdf(CopiaFormulario(123, "06-10-2026", ()))
        adjunto = SimpleUploadedFile("solicitud-123.pdf", contenido, content_type="application/pdf")
        with patch.object(api.requests, "Session") as session_class, \
                patch.object(api, "_url_configurada", return_value="https://correo.example.test/"), \
                patch.object(api, "config", return_value="origen@example.test"):
            session = session_class.return_value.__enter__.return_value
            session.post.return_value.json.return_value = {"ok": True}
            api.enviar_correo("Confirmación", "Copia adjunta", ["destino@example.test"], [adjunto])
        enviado = session.post.call_args.kwargs
        self.assertIn(("to_emails", "destino@example.test"), enviado["data"])
        self.assertEqual(enviado["files"], [("attachment", ("solicitud-123.pdf", contenido, "application/pdf"))])
        self.assertFalse(session.trust_env)
