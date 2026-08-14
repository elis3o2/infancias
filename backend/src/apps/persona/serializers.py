from rest_framework import serializers
from .models import (Adolescente, Solicitante, Familiar, Vinculo, Hermano, AdolescenteValidado, HermanoValidado, AdolescenteInstitucion)
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.serializers import (DomicilioSerializer, InstitucionSerializer, ReferenciaInstitucionInputSerializer)
from django.db import transaction

class HermanoValidadoSerializer(serializers.ModelSerializer):

    id_hermano = serializers.PrimaryKeyRelatedField(
        queryset=Hermano.objects.all(),
        source="hermano",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = HermanoValidado
        fields = (
            "id",
            "id_hermano",
            "dni",
            "sexo",
            "nombre",
            "apellido",
            "fecha_nacimiento",
        )

class HermanoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Hermano
        fields = "__all__"
        extra_kwargs = {
            "adolescente": {"required": False}
        }


class VinculoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vinculo
        fields = '__all__'


class FamiliarSerializer(serializers.ModelSerializer):
    
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=Vinculo.objects.all(),
        source="vinculo",
        write_only=True,
    )
    
    vinculo = VinculoSerializer(read_only=True)

    class Meta:
        model = Familiar
        fields = "__all__"
        extra_kwargs = {
            "adolescente": {"required": False}
        }


class AdolescenteValidadoSerializer(serializers.ModelSerializer):

    class Meta:
        model = AdolescenteValidado
        fields = (
            "id",
            "dni",
            "sexo",
            "nombre",
            "apellido",
            "fecha_nacimiento",
        )




class AdolescenteCreateSerializer(serializers.ModelSerializer):

    domicilio  = DomicilioSerializer()
    hermanos   = HermanoSerializer(many=True, required=False, write_only=True)
    familiares = FamiliarSerializer(many=True, required=False, write_only=True)
    referencias_instituciones_data = ReferenciaInstitucionInputSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Adolescente
        fields = [
            "dni",
            "sexo",
            "nombre",
            "apellido",
            "fecha_nacimiento",
            "escolarizado",
            "domicilio",
            "hermanos",
            "familiares",
            "referencias_instituciones_data",
        ]


    @transaction.atomic 
    def create(self, validated_data):
        domicilio_data = validated_data.pop("domicilio", None)
        hermanos_data = validated_data.pop("hermanos", [])
        familiares_data = validated_data.pop("familiares", [])
        referencias_data = validated_data.pop("referencias_instituciones_data", [])
        
        domicilio = None 
        if domicilio_data:
            domicilio = DomicilioSerializer().create( domicilio_data )
        
        adolescente = Adolescente.objects.create( domicilio=domicilio, **validated_data)
        for hermano_data in hermanos_data:
            Hermano.objects.create( adolescente=adolescente, **hermano_data)
            
        for familiar_data in familiares_data:
            Familiar.objects.create( adolescente=adolescente, **familiar_data)
            
        for referencia_data in referencias_data: 
            institucion = referencia_data.pop("id", None) 
            if institucion is None:
                institucion = (InstitucionSerializer().create(referencia_data))
                
            AdolescenteInstitucion.objects.create( adolescente=adolescente, institucion=institucion)
                
        return adolescente

class AdolescenteReadSerializer(serializers.ModelSerializer):

    domicilio = DomicilioSerializer()
    hermanos = HermanoSerializer(many=True, required=False)
    familiares = FamiliarSerializer(many=True, required=False)
    referencias_instituciones = InstitucionSerializer(many=True, read_only=True)

    class Meta:
        model = Adolescente
        fields = [
            "id",
            "dni",
            "sexo",
            "nombre",
            "apellido",
            "domicilio",
            "fecha_nacimiento",
            "escolarizado",
            "hermanos",
            "familiares",
            "referencias_instituciones",
        ]


class AdolescenteValReadSerializer(serializers.ModelSerializer):

    domicilio = DomicilioSerializer(source="domicilio_extra")
    familiares = serializers.SerializerMethodField()
    adolescente_validado = serializers.SerializerMethodField()
    hermanos_validados = serializers.SerializerMethodField()
    referencias_instituciones = serializers.SerializerMethodField()

    class Meta:
        model = Adolescente
        fields = [
            "id",
            "domicilio",
            "familiares",
            "escolarizado_extra",
            "adolescente_validado",
            "hermanos_validados",
            "referencias_instituciones",
        ]

    def get_adolescente_validado(self, obj):

        if obj.adolescente_validado is None:
            return None

        return AdolescenteValidadoSerializer(
            obj.adolescente_validado
        ).data

    def get_hermanos_validados(self, obj):

        if obj.adolescente_validado is None:
            return []

        hermanos = HermanoValidado.objects.filter(
            adolescente=obj.adolescente_validado
        )

        return HermanoValidadoSerializer(
            hermanos,
            many=True,
        ).data

    def get_familiares(self, obj):

        familiares = Familiar.objects.filter(
            adolescente=obj,
            valido=True
        )

        return FamiliarSerializer(
            familiares,
            many=True
        ).data

    def get_referencias_instituciones(self, obj):

        referencias = AdolescenteInstitucion.objects.filter(
            adolescente=obj,
            valido=True
        )

        instituciones = [
            referencia.institucion
            for referencia in referencias
        ]

        return InstitucionSerializer(
            instituciones,
            many=True
        ).data


class AdolescenteWriteSerializer(serializers.ModelSerializer):

    id_domicilio = serializers.IntegerField(required=False)
    domicilio_extra = DomicilioSerializer(required=False)
    familiares = FamiliarSerializer(many=True, required=False)
    ids_familiares = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
    )

    referencias_instituciones = ReferenciaInstitucionInputSerializer(many=True, required=False)

    ids_referencias_instituciones = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
    )

    adolescente_validado = AdolescenteValidadoSerializer()

    hermanos_validados = HermanoValidadoSerializer(many=True, required=False)

    class Meta:
        model = Adolescente

        fields = [
            "id",
            "id_domicilio",
            "domicilio_extra",
            "familiares",
            "ids_familiares",
            "referencias_instituciones",
            "ids_referencias_instituciones",
            "escolarizado_extra",
            "adolescente_validado",
            "hermanos_validados",
        ]

    @transaction.atomic
    def update(self, instance, validated_data):

        adolescente_validado_data = validated_data.pop("adolescente_validado", None)

        hermanos_validados_data = validated_data.pop("hermanos_validados", [])

        familiares_data = validated_data.pop("familiares",[])

        referencias_data = validated_data.pop("referencias_instituciones",[])

        ids_familiares = validated_data.pop("ids_familiares",[])

        ids_referencias = validated_data.pop("ids_referencias_instituciones",[])

        id_domicilio = validated_data.pop("id_domicilio",None)

        domicilio_extra_data = validated_data.pop("domicilio_extra",None)


        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if domicilio_extra_data:
            domicilio_extra = DomicilioSerializer().create(
                domicilio_extra_data
            )
            instance.domicilio_extra = domicilio_extra

        elif id_domicilio:
            instance.domicilio_extra_id = id_domicilio

        else:
            instance.domicilio_extra = instance.domicilio

        # =====================================
        # Adolescente validado
        # =====================================

        adolescente_validado = (instance.adolescente_validado)

        if adolescente_validado_data:

            if adolescente_validado:

                for attr, value in adolescente_validado_data.items():
                    setattr(
                        adolescente_validado,
                        attr,
                        value
                    )

                adolescente_validado.save()

            else:

                adolescente_validado = (
                    AdolescenteValidado.objects.create(
                        **adolescente_validado_data
                    )
                )

                instance.adolescente_validado = (
                    adolescente_validado
                )

        instance.save()

        # =====================================
        # Hermanos validados
        # =====================================

        if adolescente_validado:

            for hermano_data in hermanos_validados_data:

                hermano_id = hermano_data.pop("id_hermano",None)

                if hermano_id:
                    hermano = Hermano.objects.get(
                        id=hermano_id,
                        adolescente=instance
                    )

                    hermano_data["hermano"] = hermano

                HermanoValidado.objects.create(
                    adolescente=adolescente_validado,
                    **hermano_data
                )

        # =====================================
        # Familiares nuevos
        # =====================================

        for familiar_data in familiares_data:

            Familiar.objects.create(
                adolescente=instance,
                valido=True,
                extra=True,
                **familiar_data
            )

        # =====================================
        # Referencias nuevas
        # =====================================

        for referencia_data in referencias_data:

            institucion = referencia_data.pop("id", None)
            if institucion is None:

                institucion = (
                    InstitucionSerializer().create(
                        referencia_data
                    )
                )

            AdolescenteInstitucion.objects.create(
                adolescente=instance,
                institucion=institucion,
                valido=True,
                extra=True
            )

        # =====================================
        # Validar familiares existentes
        # =====================================

        if ids_familiares:

            Familiar.objects.filter(
                id__in=ids_familiares,
                adolescente=instance,
            ).update(
                valido=True
            )

        # =====================================
        # Validar referencias existentes
        # =====================================

        if ids_referencias:

            AdolescenteInstitucion.objects.filter(
                id__in=ids_referencias,
                adolescente=instance,
            ).update(
                valido=True
            )

        return instance

class SolicitanteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Solicitante
        fields = '__all__'