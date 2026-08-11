import requests
from decouple import config

def enviar_correo( subject: str, body: str, to_emails: list[str], attachments: list = None):
    data = [
        ("from_email", config("FROM_EMAIL")),
        ("subject", subject),
        ("body", body),
    ]

    for email in to_emails:
        data.append(("to_emails", email))

    files = []

    if attachments:
        for archivo in attachments:
            files.append(
                (
                    "attachment",
                    (
                        archivo.name,
                        archivo.read(),
                        getattr(archivo, "content_type", "application/octet-stream"),
                    ),
                )
            )

    session = requests.Session()
    session.trust_env = False  # No utilizar http_proxy, https_proxy ni no_proxy

    response = session.post(
        config("EMAIL_API"),
        data=data,
        files=files,
        timeout=30,
    )

    response.raise_for_status()
    return response