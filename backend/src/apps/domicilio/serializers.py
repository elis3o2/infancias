from rest_framework import serializers
from .models import (Provincia, Departamento, Distrito, Vecinal, Barrio, SeccionalPolicial, IdentidadBarrial, Localidad,
                    Domicilio, DomicilioValidado, TipoInstitucion, Institucion)


class ProvinciaSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Provincia
        fields = "__all__"


class DepartamentoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Departamento
        fields = "__all__"


class DistritoSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Distrito
        fields = "__all__"


class VecinalSeializer(serializers.ModelSerializer):
    
    class Meta:
        model = Vecinal
        fields = "__all__"


class BarrioSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Barrio
        fields = "__all__"


class SeccionalPolicialSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = SeccionalPolicial
        fields = "__all__"


class IdentidadBarrialSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = IdentidadBarrial
        fields = "__all__"


class LocalidadSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Localidad
        fields = "__all__"


        
class DomicilioValidadoSerializer(serializers.ModelSerializer):
    distrito = DistritoSerializer()
    vecinal  = VecinalSeializer()
    barrio   = BarrioSerializer()
    seccional_policial = SeccionalPolicialSerializer()
    identidad_barrial = IdentidadBarrialSerializer()
    localidad = LocalidadSerializer()

    class Meta:
        model = DomicilioValidado
        fields = "__all__"

    def create(self, validated_data):

        relaciones = {
            "distrito": Distrito,
            "vecinal": Vecinal,
            "barrio": Barrio,
            "seccional_policial": SeccionalPolicial,
            "identidad_barrial": IdentidadBarrial,
            "localidad": Localidad,
        }

        for campo, modelo in relaciones.items():

            data = validated_data.pop(campo, None)

            if data is not None:
                objeto, _ = modelo.objects.get_or_create(
                    id=data["id"],
                    defaults={
                        "nombre": data["nombre"],
                    },
                )

                validated_data[campo] = objeto

        return DomicilioValidado.objects.create(
            **validated_data
        )
        

class DomicilioSerializer(serializers.ModelSerializer):
    departamento = DepartamentoSerializer(read_only=True)

    id_departamento = serializers.PrimaryKeyRelatedField(
        queryset=Departamento.objects.all(),
        source="departamento",
        write_only=True,
        required=True,
    )

    domicilio_validado = DomicilioValidadoSerializer(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Domicilio
        fields = "__all__"

    def create(self, validated_data):
        domicilio_validado_data = validated_data.pop(
            "domicilio_validado",
            None,
        )

        domicilio_validado = None

        if domicilio_validado_data is not None:
            domicilio_validado, _ = DomicilioValidado.objects.get_or_create(
                codigo_calle=domicilio_validado_data["codigo_calle"],
                altura=domicilio_validado_data["altura"],
                bis=domicilio_validado_data["bis"],
                defaults=domicilio_validado_data,
            )

        return Domicilio.objects.create(
            domicilio_validado=domicilio_validado,
            **validated_data,
        )


class TipoInstitucionSerializer(serializers.ModelSerializer):

    class Meta:
        model = TipoInstitucion
        fields = "__all__"


class InstitucionSerializer(serializers.ModelSerializer):
    tipo = TipoInstitucionSerializer(read_only=True)

    id_tipo = serializers.PrimaryKeyRelatedField(
        queryset=TipoInstitucion.objects.all(),
        source="tipo",
        write_only=True,
        required=True,
    )

    domicilio = DomicilioSerializer()

    class Meta:
        model = Institucion
        fields = "__all__"

    def create(self, validated_data):

        domicilio_data = validated_data.pop("domicilio")
        domicilio = DomicilioSerializer().create(domicilio_data)

        return Institucion.objects.create(
            domicilio=domicilio,
            **validated_data,
        )


class ReferenciaInstitucionInputSerializer(serializers.Serializer):
    id = serializers.PrimaryKeyRelatedField(
        queryset=Institucion.objects.all(),
        required=False,
    )

    nombre = serializers.CharField(
        required=False,
    )

    id_tipo = serializers.PrimaryKeyRelatedField(
        queryset=TipoInstitucion.objects.all(),
        source="tipo",
        required=False,
    )

    domicilio = DomicilioSerializer(
        required=False,
    )