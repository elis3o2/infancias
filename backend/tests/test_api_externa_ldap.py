from unittest import TestCase
from unittest.mock import patch

import requests

from src.apps.api_externa.services import Ldap as services


class AutenticarLdapTests(TestCase):
    def setUp(self):
        self.configuracion = {
            "LDAP_API_URL": "https://ldap.example.test/login/",
            "LDAP_API_KEY": "clave-api-de-prueba",
        }
        parche = patch.object(services, "config", side_effect=lambda nombre: self.configuracion[nombre])
        parche.start()
        self.addCleanup(parche.stop)
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("No se permite HTTP real"))
        red.start()
        self.addCleanup(red.stop)

    def test_login_true_y_false_sin_proxy_y_con_parametros_correctos(self):
        for login in (True, False):
            with self.subTest(login=login), patch.object(services.requests, "Session") as session_class:
                session = session_class.return_value.__enter__.return_value
                session.get.return_value.status_code = 200
                session.get.return_value.json.return_value = {"Login": login}
                self.assertIs(services.autenticar_ldap("usuario-prueba", "contraseña-prueba"), login)
                self.assertFalse(session.trust_env)
                session.get.assert_called_once_with(
                    self.configuracion["LDAP_API_URL"],
                    params={"user": "usuario-prueba", "password": "contraseña-prueba"},
                    headers={"LDAP_API_KEY": "clave-api-de-prueba"},
                    timeout=5,
                )
                session.get.return_value.raise_for_status.assert_called_once_with()
                session_class.return_value.__exit__.assert_called_once()

    def test_no_acepta_alias_strings_numeros_o_campos_ausentes(self):
        for data in ({}, {"login": True}, {"Login": "True"}, {"Login": "False"},
                     {"Login": 1}, {"Login": 0}, {"Login": None}, [], None):
            with self.subTest(data=data), patch.object(services.requests, "Session") as session_class:
                session = session_class.return_value.__enter__.return_value
                session.get.return_value.json.return_value = data
                self.assertIs(services.autenticar_ldap("usuario-prueba", "contraseña-prueba"), False)

    def test_fallos_de_conexion_http_y_json_no_autentican_ni_exponen_credenciales(self):
        for fallo in ("conexion", "timeout", "http", "json"):
            with self.subTest(fallo=fallo), patch.object(services.requests, "Session") as session_class:
                session = session_class.return_value.__enter__.return_value
                respuesta = session.get.return_value
                respuesta.status_code = 200
                if fallo == "conexion":
                    session.get.side_effect = requests.ConnectionError("password=contraseña-prueba")
                elif fallo == "timeout":
                    session.get.side_effect = requests.Timeout()
                elif fallo == "http":
                    respuesta.status_code = 500
                    respuesta.raise_for_status.side_effect = requests.HTTPError()
                else:
                    respuesta.json.side_effect = ValueError()
                with self.assertLogs(services.logger, level="WARNING") as registros:
                    self.assertIs(services.autenticar_ldap("usuario-prueba", "contraseña-prueba"), False)
                self.assertNotIn("contraseña-prueba", " ".join(registros.output))

    def test_url_invalida_no_autentica(self):
        self.configuracion["LDAP_API_URL"] = ""
        with patch.object(services.requests, "Session") as session_class:
            session = session_class.return_value.__enter__.return_value
            session.get.side_effect = requests.exceptions.MissingSchema()
            with self.assertLogs(services.logger, level="WARNING"):
                self.assertIs(services.autenticar_ldap("usuario-prueba", "contraseña-prueba"), False)
