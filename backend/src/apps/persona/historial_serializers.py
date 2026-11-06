from rest_framework import serializers

from src.apps.solicitud.models import Solicitud, SolicitudComentario


class BusquedaHistorialSerializer(serializers.Serializer):
    nombre = serializers.CharField(required=False, allow_blank=True, max_length=64)
    apellido = serializers.CharField(required=False, allow_blank=True, max_length=64)
    dni = serializers.RegexField(r"^[0-9]{7,9}$", required=False)
    legajo = serializers.IntegerField(required=False, min_value=1, max_value=2147483647)

    def validate(self, attrs):
        if not any(attrs.values()):
            raise serializers.ValidationError("Ingrese nombre, apellido, DNI o número de legajo para buscar.")
        for campo in ("nombre", "apellido"):
            if attrs.get(campo) and len(attrs[campo]) < 2:
                raise serializers.ValidationError({campo: "Ingrese al menos 2 caracteres."})
        return attrs


class NinoHistorialSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nombre = serializers.CharField()
    apellido = serializers.CharField()
    dni = serializers.CharField()
    sexo = serializers.CharField()
    fecha_nacimiento = serializers.DateField()
    legajo = serializers.IntegerField(allow_null=True)
    carpeta = serializers.IntegerField(allow_null=True)
    validado = serializers.BooleanField()


class IntervencionHistorialSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = SolicitudComentario
        fields = ["id", "comentario", "usuario_nombre", "fecha_hora_creacion", "fecha_hora_ultmod"]


class SolicitudHistorialSerializer(serializers.ModelSerializer):
    motivo = serializers.CharField(source="motivo.nombre", read_only=True)
    equipo = serializers.CharField(source="equipo.nombre", read_only=True)
    comentarios = IntervencionHistorialSerializer(many=True, read_only=True)

    class Meta:
        model = Solicitud
        fields = [
            "id", "motivo", "equipo", "validado", "rechazado", "descripcion", "descripcion_extra",
            "motivo_rechazo", "fecha_hora_creacion", "fecha_hora_entrada", "fecha_hora_admision", "comentarios",
        ]
