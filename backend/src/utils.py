import requests
from decouple import config


def enviar_correo(
    subject: str,
    body: str,
    to_emails: list[str],
    attachments: list = None
):
    data = [
        ("from_email", config("FROM_EMAIL")),
        ("subject", subject),
        ("body", body),
    ]

    print("EMAIL:", to_emails)

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
                        getattr(
                            archivo,
                            "content_type",
                            "application/octet-stream"
                        ),
                    ),
                )
            )

    with requests.Session() as session:
        session.trust_env = False

        response = session.post(
            config("EMAIL_API"),
            data=data,
            files=files,
            timeout=30,
        )

    print("EMAIL API STATUS:", response.status_code)
    print("EMAIL API RESPONSE:", response.text)

    response.raise_for_status()

    try:
        result = response.json()
    except ValueError:
        raise RuntimeError(
            f"EMAIL_API devolvió una respuesta no JSON: {response.text}"
        )

    if "error" in result:
        raise RuntimeError(
            f"EMAIL_API devolvió un error: {result['error']}"
        )

    return response