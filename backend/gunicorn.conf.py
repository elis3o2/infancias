"""Ejecutar desde backend: gunicorn --config gunicorn.conf.py"""

import os

wsgi_app = "core.wsgi:application"
raw_env = ["DJANGO_SETTINGS_MODULE=core.settings_production"]
bind = "127.0.0.1:8001"
worker_class = "gthread"
workers = int(os.environ.get("GUNICORN_WORKERS", "2"))
threads = int(os.environ.get("GUNICORN_THREADS", "4"))
timeout = 120
graceful_timeout = 30
forwarded_allow_ips = "127.0.0.1"
secure_scheme_headers = {"X-FORWARDED-PROTO": "https"}
errorlog = "-"
# No registrar query strings: contienen documentos y otros datos personales.
accesslog = None
capture_output = True
