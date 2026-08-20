from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import (Carpeta, Legajo, Persona, Adolescente, Relacion, Familiar, 
    Vinculo, Hermano, PersonaDomicilio, PersonaTelefono, AdolescenteInstitucion)
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.serializers import (DomicilioSerializer, InstitucionSerializer, ReferenciaInstitucionInputSerializer)

class CarpetaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Carpeta
        fields = "__all__"


class LegajoSerializer(serializers.ModelSerializer):
    carpeta = CarpetaSerializer(read_only=True)

    class Meta:
        model = Legajo
        fields = "__all__"


class CarpetaInputSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    id_insert = serializers.IntegerField(required=False, allow_null=True)
    letra = serializers.CharField(required=False, allow_blank=True)


class LegajoInputSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    id_insert = serializers.IntegerField(required=False, allow_null=True)
    letra = serializers.CharField(required=False, allow_blank=True)
    carpeta_id = serializers.IntegerField(required=False, allow_null=True)


class PersonaSerializer(serializers.ModelSerializer):
    legajo = LegajoSerializer(read_only=True)

    class Meta:
        model = Persona
        fields = "__all__"


class HermanoSerializer(serializers.ModelSerializer):
    persona = PersonaSerializer(read_only=True)

    class Meta:
        model = Hermano
        fields = "__all__"


class VinculoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vinculo
        fields = "__all__"


class FamiliarSerializer(serializers.ModelSerializer):
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=Vinculo.objects.all(),
        source="vinculo",
        write_only=True,
        required=False,
    )

    vinculo = VinculoSerializer(read_only=True)
    persona = PersonaSerializer(read_only=True)

    class Meta:
        model = Familiar
        fields = "__all__"




class RelacionCreateSerializer(serializers.ModelSerializer):
    id_persona1 = serializers.PrimaryKeyRelatedField(
        queryset=Persona.objects.all(),
        source="persona_1",
        write_only=True,
    )
    id_persona2 = serializers.PrimaryKeyRelatedField(
        queryset=Persona.objects.all(),
        source="persona_2",
        write_only=True,
    )
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=Vinculo.objects.all(),
        source="vinculo",
        write_only=True,
    )
    
    class Meta:
        model = Rela


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
    familiares_validados = serializers.SerializerMethodField()
    adolescente_validado = serializers.SerializerMethodField()
    hermanos = serializer.SerializerMethodField()
    hermanos_validados = serializers.SerializerMethodField()
    referencias_instituciones = serializers.SerializerMethodField()

    class Meta:
        model = Adolescente
        fields = [
            "id",
            "domicilio",
            "domicilio_observaciones"
            "familiares",
            "familiares_validados",
            "escolarizado",
            "adolescente_validado",
            "hermano",
            "hermanos_validados",
            "referencias_instituciones",
        ]

    def get_adolescente_validado(self, obj):

        if obj.adolescente_validado is None:
            return None

        return PersonaSerializer(
            obj.personsa
        ).data

    def get_hermanos(self, obj):

        if obj.adolescente_validado is None:
            return []


        hermanos = Hermano.objects.filter(
            adolescente=obj,
            persona=null
        )

        return HermanoValidadoSerializer(
            hermanos,
            many=True,
        ).data


    def get_hermanos_validados(self, obj):

        if obj.adolescente_validado is None:
            return []

        legajos = Legajo.objects.filter(
            carpeta=obj.persona.legajo.carpeta,
            legajo__not="C"
        )

        hermanos = Persona.objects.filter(
            legajo__in=legajos,
            not=obj.persona
        )

        return HermanoValidadoSerializer(
            hermanos,
            many=True,
        ).data

    def get_familiares(self, obj):

        familiares = Familiar.objects.filter(
            adolescente=obj,
            persona=null
        )

        return FamiliarSerializer(
            familiares,
            many=True
        ).data

    def get_familiares_validados(self, obj):

        legajos = Legajo.objects.filter(
            carpeta=obj.persona.legajo.carpeta,
            letra="C"
        )

        familiares = Persona.objects.filter(
            legajo=legajos,
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


class PersonaRelacionSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)

    # Si referencia un Familiar/Hermano ya cargado
    id_familiar = serializers.IntegerField(required=False, allow_null=True)
    id_hermano = serializers.IntegerField(required=False, allow_null=True)
    dni = serializers.CharField(max_length=10)
    sexo = serializers.CharField(max_length=1)
    nombre = serializers.CharField(max_length=64)
    apellido = serializers.CharField(max_length=64)
    fecha_nacimiento = serializers.DateField()
    id_vinculo = serializers.IntegerField(required=False)
    legajo = LegajoInputSerializer(required=False, allow_null=True)
    telefono = serializers.CharField(max_length=16, required=False, allow_null=True, allow_blank=True)
    domicilio = DomicilioSerializer(required=False, allow_null=True)


class AdolescenteWriteSerializer(serializers.ModelSerializer):

    adolescente_validado = PersonaRelacionSerializer(required=True)
    hermanos_validados = PersonaRelacionSerializer(many=True, required=False)

    familiares_validados = PersonaRelacionSerializer(many=True, required=False)

    class Meta:
        model = Adolescente
        fields = [
            "id",
            "adolescente_validado",
            "hermanos_validados",
            "familiares_validados",
        ]

    @transaction.atomic
    def update(self, instance, validated_data):

        adolescente_data = validated_data.pop("adolescente_validado")

        hermanos_data = validated_data.pop("hermanos_validados",[])

        familiares_data = validated_data.pop("familiares_validados", [])

        # ==================================================
        # 1. VALIDAR ADOLESCENTE
        # ==================================================

        persona_adolescente = self._validar_adolescente(
            instance=instance,
            data=adolescente_data,
        )

        # ==================================================
        # 2. VALIDAR HERMANOS
        # ==================================================

        for hermano_data in hermanos_data:

            self._validar_hermano(
                adolescente=instance,
                persona_adolescente=persona_adolescente,
                data=hermano_data,
            )

        # ==================================================
        # 3. VALIDAR FAMILIARES
        # ==================================================

        for familiar_data in familiares_data:

            self._validar_familiar(
                adolescente=instance,
                persona_adolescente=persona_adolescente,
                data=familiar_data,
            )

        return instance


    def _validar_adolescente(self, instance, data):

        data = data.copy()

        legajo_data = data.pop("legajo", None)

        dni = data.get("dni")
        sexo = data.get("sexo")

        # =====================================================
        # Buscar Persona existente por DNI + sexo
        # =====================================================
        persona = Persona.objects.filter(
            dni=dni,
            sexo=sexo,
        ).first()

        # =====================================================
        # Resolver Legajo
        # =====================================================
        legajo = self._resolver_legajo(
            legajo_data=legajo_data,
        )
        
        # =====================================================
        # Si Persona ya existe
        # =====================================================
        if persona is not None:

            # Actualizar datos de Persona
            for campo, valor in data.items():
                setattr(
                    persona,
                    campo,
                    valor,
                )
            # Actualizar Legajo
            persona.legajo = legajo
            persona.save()

        # =====================================================
        # Si Persona no existe
        # =====================================================

        else:

            try:
                persona = Persona.objects.create(
                    legajo=legajo,
                    **data,
                )

            except Exception as exc:
                raise serializers.ValidationError({
                    "adolescente_validado": (
                        f"No se pudo crear la Persona: {exc}"
                    )
                })

        # =====================================================
        # Asociar Persona al Adolescente
        # =====================================================

        if instance.persona_id != persona.id:

            instance.persona = persona
            instance.save(
                update_fields=["persona"]
            )

        # =====================================================
        # Registrar domicilio
        # =====================================================

        if instance.domicilio_id is not None:

            ultimo_domicilio = (
                PersonaDomicilio.objects.filter(persona=persona)
                .order_by("-fecha_carga")
                .first()
            )

            # Solo generar una nueva entrada si cambió
            # el domicilio
            if (ultimo_domicilio is None
                or ultimo_domicilio.domicilio_id
                != instance.domicilio_id):
                
                PersonaDomicilio.objects.create(
                    persona=persona,
                    domicilio_id=instance.domicilio_id,
                    fecha_carga=timezone.now(),
                )

        return persona
    
    def _validar_hermano(self, *, adolescente, persona_adolescente, data):

        data = data.copy()

        hermano_id = data.pop("id_hermano", None)

        legajo_data = data.pop("legajo", None)

        # ---------------------------------------------
        # Crear Persona
        # ----------------------------------------------

        legajo = self._resolver_legajo(
            legajo_data=legajo_data,
            carpeta_adolescente=adolescente.persona.legajo.carpeta,
        )

        try:
            persona_hermano = Persona.objects.create(
                legajo=legajo,
                **data,
            )

        except Exception as exc:
            raise serializers.ValidationError({
                "hermanos_validados": (
                    f"No se pudo crear la Persona del hermano: {exc}"
                )
            })

        # ----------------------------------------------
        # Asociar Hermano si existe
        # ----------------------------------------------

        if hermano_id is not None:

            hermano = Hermano.objects.filter(
                pk=hermano_id,
                adolescente=adolescente,
            ).update(persona=persona_hermano)

        # ----------------------------------------------
        # Crear relación
        # ----------------------------------------------

        Relacion.objects.create(
            persona_1=persona_adolescente,
            persona_2=persona_hermano,
            vinculo_id=1, # id de vinculo de Hermano
        )

        return persona_hermano

    def _validar_familiar(self, *, adolescente, persona_adolescente, data):

    data = data.copy()

    familiar_id = data.pop("id_familiar", None)

    # ==================================================
    # FAMILIAR EXISTENTE
    # ==================================================

    if familiar_id is not None:

        familiar = Familiar.objects.filter(
            pk=familiar_id,
            adolescente=adolescente,
        ).first()

        if familiar is None:
            raise serializers.ValidationError({
                "familiares_validados": (
                    f"El familiar {familiar_id} "
                    "no pertenece al adolescente."
                )
            })

        if familiar.persona is not None:
            raise serializers.ValidationError({
                "familiares_validados": (
                    f"El familiar {familiar_id} "
                    "ya está validado."
                )
            })

        # Los datos salen de Familiar
        persona_data = {
            "dni": familiar.dni,
            "sexo": familiar.sexo,
            "nombre": familiar.nombre,
            "apellido": familiar.apellido,
        }

        vinculo = familiar.vinculo

        telefono = familiar.telefono

        # El domicilio de Familiar es texto.
        # Acá hay que convertirlo a Domicilio según
        # la nueva estructura que definiste.
        domicilio_data = None

    # ==================================================
    # FAMILIAR NUEVO
    # ==================================================

    else:
        vinculo_id = data.pop("id_vinculo", None)

        if vinculo_id is None:
            raise serializers.ValidationError({
                "familiares_validados": (
                    "El familiar nuevo debe tener id_vinculo."
                )
            })

        vinculo = Vinculo.objects.filter(
            pk=vinculo_id
        ).first()

        if vinculo is None:
            raise serializers.ValidationError({
                "familiares_validados": (
                    f"El vínculo {vinculo_id} no existe."
                )
            })

        telefono = data.pop("telefono", None)

        domicilio_data = data.pop("domicilio", None)

        # No permitimos que el cliente mande legajo
        data.pop("legajo", None)

        # El Familiar tiene más campos que Persona.
        data.pop("id", None)
        
        data.pop("adolescente", None)
        data.pop("persona", None,)

        persona_data = data

        familiar = Familiar.objects.create(
            adolescente=adolescente,
            vinculo=vinculo,
            nombre=persona_data["nombre"],
            apellido=persona_data["apellido"],
            dni=persona_data.get("dni"),
            sexo=persona_data.get("sexo"),
            telefono=telefono,
        )

    # ==================================================
    # CREAR LEGAJO C
    # ==================================================

    carpeta = (
        persona_adolescente
        .legajo
        .carpeta
    )

    legajo = Legajo.objects.create(
        carpeta=carpeta,
        id_insert=None,
        letra="C",
    )

    # ==================================================
    # CREAR PERSONA
    # ==================================================

    try:

        persona = Persona.objects.create(
            legajo=legajo,
            dni=persona_data.get("dni"),
            sexo=persona_data.get("sexo"),
            nombre=persona_data["nombre"],
            apellido=persona_data["apellido"],
            fecha_nacimiento=persona_data.get(
                "fecha_nacimiento"
            ),
        )

    except Exception as exc:

        raise serializers.ValidationError({
            "familiares_validados": (
                f"No se pudo crear la Persona "
                f"del familiar: {exc}"
            )
        })

    # ==================================================
    # ASOCIAR FAMILIAR
    # ==================================================

    if familiar.persona is not None:
        raise serializers.ValidationError({
            "familiares_validados": (
                "El familiar ya tiene una Persona asociada."
            )
        })

    familiar.persona = persona

    familiar.save(
        update_fields=["persona"]
    )

    # ==================================================
    # RELACIÓN
    # ==================================================

    Relacion.objects.create(
        persona_1=persona_adolescente,
        persona_2=persona,
        vinculo=vinculo,
    )

    # ==================================================
    # DOMICILIO
    # ==================================================

    if domicilio_data is not None:

        domicilio = DomicilioSerializer().create(
            domicilio_data
        )

        PersonaDomicilio.objects.create(
            persona=persona,
            domicilio=domicilio,
            fecha_carga=timezone.now(),
        )

    # ==================================================
    # TELÉFONO
    # ==================================================

    if telefono:

        PersonaTelefono.objects.create(
            persona=persona,
            telefono=telefono,
            fecha_carga=timezone.now(),
        )

    return persona
    
    def _resolver_legajo(self, *, legajo_data=None, carpeta_data=None, carpeta_adolescente=None, familiar=False):
        """
    Reglas:

    Adolescente:
        - puede recibir id_insert de legajo
        - puede recibir id_insert de carpeta
        - puede recibir ambos
        - puede no recibir ninguno

    Hermano:
        - puede recibir id_insert de legajo
        - usa siempre la carpeta del adolescente

    Familiar:
        - siempre legajo nuevo
        - letra C
        - id_insert NULL
        - usa siempre la carpeta del adolescente
    """

    # =====================================================
    # FAMILIAR
    # =====================================================

    if familiar:

        if carpeta_adolescente is None:
            raise serializers.ValidationError(
                "No se puede crear el legajo del familiar "
                "sin la carpeta del adolescente."
            )

        return Legajo.objects.create(
            carpeta=carpeta_adolescente,
            id_insert=None,
            letra="C",
        )

    # =====================================================
    # HERMANO
    # =====================================================

    if carpeta_adolescente is not None:

        id_insert_legajo = None

        if legajo_data:
            id_insert_legajo = legajo_data.get("id_insert")

        # Legajo nuevo para el hermano
        if id_insert_legajo is None:
            return Legajo.objects.create(
                carpeta=carpeta_adolescente,
                id_insert=None,
                letra="B",
            )

        # Legajo externo
        legajo, _ = Legajo.objects.get_or_create(
            id_insert=id_insert_legajo,
            letra="A",
            defaults={
                "carpeta": carpeta_adolescente,
            },
        )

        return legajo

    # =====================================================
    # ADOLESCENTE
    # =====================================================

    id_insert_carpeta = None
    id_insert_legajo = None

    if carpeta_data:
        id_insert_carpeta = carpeta_data.get("id_insert")

    if legajo_data:
        id_insert_legajo = legajo_data.get("id_insert")

    # -----------------------------------------------------
    # Resolver carpeta
    # -----------------------------------------------------

    if id_insert_carpeta is not None:

        carpeta, _ = Carpeta.objects.get_or_create(
            id_insert=id_insert_carpeta,
            letra="A",
        )

    else:

        carpeta = Carpeta.objects.create(
            id_insert=None,
            letra="B",
        )

    # -----------------------------------------------------
    # Resolver legajo
    # -----------------------------------------------------

    if id_insert_legajo is not None:

        legajo, _ = Legajo.objects.get_or_create(
            id_insert=id_insert_legajo,
            letra="A",
            defaults={
                "carpeta": carpeta,
            },
        )

    else:

        legajo = Legajo.objects.create(
            carpeta=carpeta,
            id_insert=None,
            letra="B",
        )

    return legajo