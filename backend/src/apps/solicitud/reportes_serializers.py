from rest_framework import serializers

from .models import Solicitud


class FiltrosReporteSerializer(serializers.Serializer):
    periodo = serializers.ChoiceField(choices=["semana", "mes", "todo", "personalizado"], default="semana")
    desde = serializers.DateField(required=False)
    hasta = serializers.DateField(required=False)
    equipo = serializers.RegexField(r"^(?:[1-9][0-9]*|rechazadas)$", required=False, max_length=10)
    solicitud = serializers.IntegerField(required=False, min_value=1, max_value=2147483647)
    estado = serializers.ChoiceField(choices=["pendiente", "validada", "rechazada"], required=False)

    def validate_equipo(self, valor):
        if valor != "rechazadas" and int(valor) > 2147483647:
            raise serializers.ValidationError("El equipo no es válido.")
        return valor

    def validate(self, attrs):
        if attrs["periodo"] == "personalizado":
            if not attrs.get("desde") or not attrs.get("hasta"):
                raise serializers.ValidationError("Indique las fechas desde y hasta.")
            if attrs["desde"] > attrs["hasta"]:
                raise serializers.ValidationError("La fecha desde no puede ser posterior a hasta.")
            if attrs["hasta"].year >= 9999:
                raise serializers.ValidationError("La fecha hasta está fuera del rango permitido.")
        elif "desde" in attrs or "hasta" in attrs:
            raise serializers.ValidationError("Las fechas se usan únicamente con el período personalizado.")
        return attrs


class SolicitudReporteSerializer(serializers.ModelSerializer):
    equipo = serializers.SerializerMethodField()
    motivo = serializers.CharField(source="motivo.nombre", read_only=True)
    cantidad_adolescentes = serializers.IntegerField(read_only=True)
    cantidad_comentarios = serializers.IntegerField(read_only=True)

    def get_equipo(self, solicitud):
        return "Rechazadas" if solicitud.rechazado else solicitud.equipo.nombre

    class Meta:
        model = Solicitud
        fields = [
            "id", "equipo", "motivo", "fecha_hora_creacion", "validado", "rechazado",
            "cantidad_adolescentes", "cantidad_comentarios",
        ]
