import json

from rest_framework.exceptions import ValidationError



def normalizar_campos_json(data, *campos):
    for campo in campos:
        valor = data.get(campo)

        if not isinstance(valor, str):
            continue

        try:
            data[campo] = json.loads(valor)
        except json.JSONDecodeError:
            raise ValidationError({
                campo: "El formato JSON es inválido."
            })

    return data
