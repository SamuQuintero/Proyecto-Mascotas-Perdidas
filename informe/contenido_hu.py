# -*- coding: utf-8 -*-
"""Contenido del informe que no sale del Excel: sprints, fichas de las historias
de usuario (criterios de aceptación, archivos y pruebas) y tareas del DoD.

Todo lo que aparece aquí describe lo que el código HACE hoy (se puede verificar
en los archivos citados). Lo que solo el equipo sabe (responsables, horas,
retrospectivas) NO está aquí: queda en blanco para completarse.
"""

# ----------------------------------------------------------------- Sprints
# Calendario real del equipo (dos semanas por sprint).
SPRINTS = {
    1: dict(inicio="08/09/2026", fin="21/09/2026",
            meta="Permitir registrar y almacenar reportes de mascotas perdidas y "
                 "encontradas, incluyendo información básica, fotografía y ubicación.",
            hus=[1, 2, 3, 5, 13]),
    2: dict(inicio="22/09/2026", fin="05/10/2026",
            meta="Facilitar la gestión de los reportes ya publicados: encontrarlos con "
                 "filtros, corregirlos, ordenarlos, difundirlos y cerrarlos cuando la "
                 "mascota reaparece.",
            hus=[6, 12, 21, 25, 26, 27]),
    3: dict(inicio="06/10/2026", fin="19/10/2026",
            meta="Avisar al dueño cuando aparece una mascota que puede ser la suya y "
                 "darle una placa con código QR para prevenir pérdidas.",
            hus=[4, 7, 8, 9]),
    4: dict(inicio="20/10/2026", fin="02/11/2026",
            meta="Ampliar la plataforma a toda la comunidad: cuentas de ciudadano, "
                 "veterinaria y refugio, difusión sostenida de los casos e indicadores "
                 "para el equipo administrador.",
            hus=[10, 11, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 21, 26, 27]),
}

# HU que se planearon en un sprint pero se completaron después.
# {hu: (sprint donde se completó o 'cierre', nota)}
COMPLETADAS_DESPUES = {
    21: (4, "Trasladada del Sprint 2 al Sprint 4."),
    26: ("cierre", "Trasladada del Sprint 2; completada en el cierre del proyecto (09/11/2026)."),
    27: ("cierre", "Trasladada del Sprint 2; completada en el cierre del proyecto (09/11/2026)."),
}

# Por qué va cada historia en su sprint (S1 y S2: textos del Excel del equipo).
POR_QUE = {
    1: "Núcleo del producto", 2: "Núcleo del producto", 3: "Núcleo del producto",
    5: "Complementa HU-2", 13: "Habilitador técnico de HU-1/2/5",
    6: "Hace más fácil encontrar reportes entre las mascotas ya registradas",
    12: "Permite actualizar el estado de una mascota encontrada",
    21: "Permite difundir los reportes existentes y aumentar su alcance",
    25: "Permite corregir o actualizar la información de los reportes",
    26: "Permite retirar reportes que ya no sean necesarios",
    27: "Facilita consultar primero los reportes más recientes",
    4: "Mayor prioridad pendiente (72): el dueño se entera en las primeras horas",
    7: "Complementa HU-4 con la cercanía al lugar de la pérdida",
    8: "Prevención: el dueño registra a su mascota antes de perderla",
    9: "Cierra el ciclo de HU-8: quien encuentra la placa ve el contacto",
    10: "Extiende HU-4 a mascotas que aún no se han reportado como perdidas",
    11: "Permite coordinar la entrega sin exponer teléfono ni dirección",
    14: "Listado único de todas las zonas (cubierto por el listado global)",
    15: "Evita reportes duplicados del mismo animal",
    16: "Primera historia que introduce cuentas: base para HU-17, 18, 19 y 20",
    17: "Rol de veterinaria sobre la base de cuentas de HU-16",
    18: "Conecta a quien encuentra un animal con refugios y veterinarias",
    19: "Mantiene vivos los casos que llevan días sin coincidencias",
    20: "Rol de refugio: cierra la brecha con los animales bajo resguardo",
    22: "Medición para el equipo administrador (requiere los datos de los demás)",
    23: "Mantiene la identificación al día (requiere cuentas de HU-16)",
    24: "Afina la coincidencia en gatos sobre el motor de HU-4",
}

# --------------------------------------------------- Tareas del DoD (plantilla)
TAREAS_DOD = [
    "Especificar la HU",
    "Identificar escenarios de prueba",
    "Diseñar casos de prueba",
    "Crear casos de prueba",
    "Elaborar el prototipo de la interfaz",
    "Diseñar Back-end",
    "Diseñar bases de datos",
    "Codificar Front-end",
    "Codificar Back-end",
    "Ejecutar casos de prueba",
    "Realizar ajustes con base en las pruebas",
]

# ------------------------------------------------------- Fichas de las historias
# criterios: Dado / Cuando / Entonces (comportamiento verificable).
# front/back/bd/pruebas: dónde está en el repositorio.
FICHAS = {
    1: dict(
        criterios=[
            "Dado un visitante en «Perdí mi mascota», cuando completa especie, color, tamaño, zona, fecha y hora, foto y al menos un teléfono o correo y publica, entonces el reporte se guarda y se abre su página con el aviso de éxito.",
            "Dado un formulario con la foto o un dato obligatorio faltante, cuando intenta publicar, entonces cada campo muestra su mensaje y no se guarda nada.",
            "Dado que la fecha y hora elegidas están en el futuro, cuando intenta publicar, entonces el sistema lo rechaza.",
            "Dado un archivo que no es JPG, PNG o WEBP o que pesa más de 5 MB, cuando lo sube, entonces se rechaza con un mensaje en el campo de la foto.",
        ],
        front=["components/FormularioReporte.tsx", "app/perdida/nuevo/page.tsx"],
        back=["app/api/reportes/route.ts", "servicios/servicioReportes.ts", "lib/validacion.ts", "lib/almacenamiento.ts"],
        bd=["Reporte"], pruebas=["validacion.test.ts", "almacenamiento.test.ts", "servicioReportes.test.ts"]),
    2: dict(
        criterios=[
            "Dado un visitante sin cuenta, cuando abre «Encontré una», entonces puede publicar sin iniciar sesión.",
            "Dado un hallazgo, cuando marca «reporte anónimo», entonces no se guardan sus datos de contacto aunque los haya escrito.",
            "Dado un hallazgo, cuando el contacto no se llena, entonces igualmente se publica (el contacto es opcional en hallazgos).",
        ],
        front=["app/encontrada/nuevo/page.tsx", "components/FormularioReporte.tsx"],
        back=["app/api/reportes/route.ts", "lib/reportes.ts"],
        bd=["Reporte (reportanteAnonimo)"], pruebas=["validacion.test.ts", "servicioReportes.test.ts"]),
    3: dict(
        criterios=[
            "Dado el formulario, cuando la persona toca el mapa (centrado en Pasto), entonces queda marcado el punto y se guardan latitud y longitud.",
            "Dado un formulario sin punto marcado, cuando intenta publicar, entonces se le pide seleccionar un punto en el mapa.",
            "Dado un reporte publicado, cuando se abre su detalle, entonces se ve el mapa con el punto y la fecha y hora del suceso en hora de Colombia.",
        ],
        front=["components/MapaSelector.tsx", "components/MapaVisor.tsx"],
        back=["lib/formato.ts", "lib/validacion.ts"],
        bd=["Reporte (latitud, longitud, fecha)"], pruebas=["formato.test.ts", "validacion.test.ts"]),
    4: dict(
        criterios=[
            "Dado un reporte propio abierto, cuando se publica uno del tipo contrario con la misma especie, un color en común y puntaje de parecido ≥ 60, entonces aparece como coincidencia en la campana y en el detalle.",
            "Dado un hallazgo muy anterior a la pérdida (más de un día), cuando se compara, entonces se descarta por fecha.",
            "Dado «café» en un reporte y «marrón» en otro, cuando se comparan, entonces cuentan como el mismo color (familias de color).",
        ],
        front=["components/CampanaAlertas.tsx", "components/PanelAlertas.tsx"],
        back=["lib/coincidencias/", "lib/alertas.ts", "app/api/alertas/route.ts"],
        bd=["Reporte"], pruebas=["coincidencias.test.ts", "puntuacion.test.ts", "colores.test.ts"]),
    5: dict(
        criterios=[
            "Dado un hallazgo publicado, cuando se abre el listado de reportes, entonces aparece junto a las pérdidas, diferenciado por tipo.",
            "Dado el listado, cuando se elige la pestaña «Encontradas» o «Perdidas», entonces se muestran solo ese tipo.",
        ],
        front=["app/reportes/page.tsx", "components/TarjetaReporte.tsx"],
        back=["lib/busqueda.ts", "lib/cache.ts"],
        bd=["Reporte (tipo)"], pruebas=["filtros.test.ts"]),
    6: dict(
        criterios=[
            "Dado el listado, cuando se filtra por zona, especie, color, tamaño o rango de fechas, entonces solo aparecen los reportes que cumplen.",
            "Dado un filtro de zona «fatima», cuando existe «Fátima», entonces coincide (sin distinguir tildes ni mayúsculas).",
            "Dado un filtro de color «marrón», cuando existe un reporte «Café con blanco», entonces coincide por familia de color.",
            "Dado un filtro aplicado, cuando se comparte o recarga la URL, entonces se conserva el mismo filtro.",
        ],
        front=["components/FiltrosReportes.tsx", "app/reportes/page.tsx"],
        back=["lib/filtros.ts", "lib/texto.ts"],
        bd=["Reporte (índices por tipo, estado, fecha, especie)"], pruebas=["filtros.test.ts", "texto.test.ts", "colores.test.ts"]),
    7: dict(
        criterios=[
            "Dado un reporte propio, cuando se publica un hallazgo a 2 km o menos del lugar de la pérdida, entonces se genera un aviso de cercanía aunque no se parezca.",
            "Dado un aviso, cuando se abre el detalle, entonces se ve un mapa con el radio de 2 km y la distancia calculada (haversine).",
        ],
        front=["components/MapaCercania.tsx", "components/PanelAlertas.tsx"],
        back=["lib/coincidencias/geo.ts", "lib/coincidencias/reportes.ts"],
        bd=["Reporte"], pruebas=["coincidencias.test.ts"]),
    8: dict(
        criterios=[
            "Dado un visitante, cuando completa el perfil de su mascota (nombre, especie, color, tamaño, foto y contacto), entonces se crea el perfil y se muestra su placa con un código QR.",
            "Dado la placa, cuando se pulsa imprimir, entonces se imprime solo la placa (sin menús ni fondo).",
            "Dado un perfil creado desde un dispositivo, cuando se abre «Placa QR», entonces el dispositivo lista sus mascotas.",
        ],
        front=["components/FormularioMascota.tsx", "app/mascotas/[id]/placa/page.tsx", "components/MisMascotas.tsx"],
        back=["app/api/mascotas/route.ts", "servicios/servicioMascotas.ts", "lib/mascotas.ts"],
        bd=["Mascota"], pruebas=["servicioMascotasResguardo.test.ts", "validacion.test.ts"]),
    9: dict(
        criterios=[
            "Dado la placa en el collar, cuando se escanea el QR, entonces se abre el perfil público de la mascota.",
            "Dado el perfil, cuando se abre desde el celular, entonces hay botones para llamar y escribir por WhatsApp al dueño.",
        ],
        front=["app/mascotas/[id]/page.tsx"],
        back=["lib/contacto.ts"],
        bd=["Mascota"], pruebas=["(verificado en la prueba de humo del aplicativo)"]),
    10: dict(
        criterios=[
            "Dado una mascota con perfil QR creada desde este dispositivo, cuando alguien publica un hallazgo con su especie, un color en común y puntaje ≥ 55, entonces la campana avisa al dueño.",
            "Dado un hallazgo con otro color, cuando se compara, entonces no hay aviso (el color en común es obligatorio).",
        ],
        front=["components/CampanaAlertas.tsx", "lib/dispositivo.ts"],
        back=["lib/coincidencias/mascotas.ts", "app/api/alertas-mascotas/route.ts"],
        bd=["Mascota"], pruebas=["coincidencias.test.ts", "felinos.test.ts"]),
    11: dict(
        criterios=[
            "Dado la página pública de un reporte, cuando una persona escribe un mensaje con un nombre libre, entonces queda en el hilo visible para todos.",
            "Dado el hilo, cuando se lee, entonces no se expone teléfono ni dirección: solo texto.",
        ],
        front=["components/MensajesReporte.tsx"],
        back=["app/api/reportes/[id]/mensajes/route.ts"],
        bd=["Mensaje"], pruebas=["(verificado en la prueba de humo del aplicativo)"]),
    12: dict(
        criterios=[
            "Dado un reporte abierto, cuando el administrador o su dueño pulsa «¡Ya apareció!» y confirma, entonces el caso pasa a REENCONTRADA y se muestra el banner de celebración.",
            "Dado un caso cerrado, cuando el dueño intenta reabrirlo, entonces se rechaza; solo el administrador puede reabrirlo.",
            "Dado un caso reencontrado, cuando se calculan alertas, entonces deja de generarlas y de ser candidato de otras comparaciones.",
        ],
        front=["components/AccionesAdmin.tsx", "components/BotonYaAparecio.tsx"],
        back=["app/api/reportes/[id]/estado/route.ts", "servicios/servicioReportes.ts", "lib/propiedad.ts"],
        bd=["Reporte (estado, reencontradaEn)"], pruebas=["servicioReportes.test.ts", "renovacion.test.ts"]),
    13: dict(
        criterios=[
            "Dado cualquiera de los dos formularios (perdida o encontrada), cuando se abren, entonces piden siempre los mismos datos mínimos: especie, raza, color, tamaño, collar, zona y fecha.",
            "Dado el mismo esquema de validación (Zod) en navegador y servidor, cuando los datos son inválidos, entonces ambos muestran el mismo mensaje.",
        ],
        front=["components/FormularioReporte.tsx", "components/CamposFormulario.tsx"],
        back=["lib/validacion.ts"],
        bd=["Reporte"], pruebas=["validacion.test.ts"]),
    14: dict(
        criterios=[
            "Dado cualquier visitante, cuando abre «Reportes», entonces ve en un solo listado los reportes de todos los barrios y zonas, con filtros.",
        ],
        front=["app/reportes/page.tsx"],
        back=["lib/busqueda.ts", "lib/cache.ts"],
        bd=["Reporte"], pruebas=["filtros.test.ts"]),
    15: dict(
        criterios=[
            "Dado un hallazgo en preparación, cuando existe otro del mismo tipo a 1 km o menos, con color en común y publicado en los últimos 5 días, entonces se advierte con tarjetas del posible duplicado antes de publicar.",
            "Dado la advertencia, cuando la persona decide que no es el mismo animal, entonces puede publicar de todos modos.",
        ],
        front=["components/FormularioReporte.tsx"],
        back=["lib/coincidencias/duplicados.ts", "app/api/reportes/duplicados/route.ts"],
        bd=["Reporte"], pruebas=["coincidencias.test.ts"]),
    16: dict(
        criterios=[
            "Dado un visitante, cuando se registra como ciudadano con correo y contraseña (≥ 6 caracteres), entonces se crea la cuenta y queda con sesión iniciada.",
            "Dado un ciudadano, cuando marca un punto en el mapa y un radio de 1 a 50 km, entonces recibe avisos de las mascotas perdidas dentro de ese radio, en la campana y en su panel.",
            "Dado la suscripción activa, cuando la desactiva, entonces deja de recibir avisos sin borrar su cuenta.",
        ],
        front=["app/cuenta/", "components/ControlSuscripcion.tsx", "components/FormularioRegistro.tsx"],
        back=["app/api/cuenta/", "lib/sesionUsuario.ts", "lib/contrasenas.ts", "lib/cuenta.ts"],
        bd=["Usuario (avisoLatitud, avisoLongitud, avisoRadioKm)"], pruebas=["sesionUsuario.test.ts", "contrasenas.test.ts", "validacionCuenta.test.ts"]),
    17: dict(
        criterios=[
            "Dado una cuenta de veterinaria, cuando inicia sesión, entonces ve todos los reportes en modo solo lectura (sin editar ni cerrar los de otros).",
            "Dado una mascota con perfil QR, cuando la veterinaria agrega una vacuna (nombre y fecha), entonces queda en el carnet y es visible en el perfil público.",
            "Dado una vacuna mal registrada, cuando la veterinaria la borra, entonces desaparece del carnet.",
        ],
        front=["app/veterinaria/page.tsx", "components/PanelVacunas.tsx", "components/FilaMascotaVacunas.tsx"],
        back=["app/api/mascotas/[id]/vacunas/route.ts", "lib/validacionVacuna.ts"],
        bd=["Vacuna", "Usuario (rol VETERINARIA, nombreClinica)"], pruebas=["validacionVacuna.test.ts", "validacionCuenta.test.ts"]),
    18: dict(
        criterios=[
            "Dado una veterinaria o refugio que activa «Recibimos mascotas encontradas» con teléfono y ubicación, cuando alguien abre «Dónde acudir», entonces aparece en el directorio.",
            "Dado el directorio, cuando la persona comparte su ubicación, entonces se ordenan del más cercano al más lejano con la distancia.",
            "Dado un lugar del directorio, cuando se pulsa, entonces se puede llamar, escribir por WhatsApp o abrir «cómo llegar».",
        ],
        front=["app/donde-acudir/page.tsx", "components/ListaEstablecimientos.tsx", "components/PerfilEstablecimiento.tsx"],
        back=["lib/establecimientos.ts", "app/api/cuenta/establecimiento/route.ts"],
        bd=["Usuario (telefono, direccion, latitud, longitud, recibeEncontradas)"], pruebas=["establecimientos.test.ts", "validacionCuenta.test.ts"]),
    19: dict(
        criterios=[
            "Dado el dueño de un reporte abierto, cuando pulsa «Sigue perdida: volver a difundir» pasadas 24 horas desde la última difusión, entonces el reporte sube en el listado y reaparece en los avisos de cercanía.",
            "Dado un reporte renovado hace menos de un día, cuando el dueño intenta renovarlo otra vez, entonces se rechaza.",
            "Dado un reporte de pérdida sin renovar durante 7 días, cuando su dueño abre la campana, entonces aparece «¿Sigue perdida?».",
        ],
        front=["components/BotonRenovar.tsx", "components/CampanaAlertas.tsx"],
        back=["lib/renovacion.ts", "app/api/reportes/[id]/renovar/route.ts", "app/api/cuenta/recordatorios/route.ts"],
        bd=["Reporte (renovadoEn, renovaciones)"], pruebas=["renovacion.test.ts", "servicioReportes.test.ts"]),
    20: dict(
        criterios=[
            "Dado una cuenta de refugio, cuando publica un animal con foto y «en resguardo desde», entonces aparece en el listado público de animales en resguardo.",
            "Dado el listado público, cuando se filtra por especie o color, entonces se muestran los que coinciden.",
            "Dado una pérdida abierta, cuando un animal en resguardo se parece (≥ 55) y ingresó después de la pérdida, entonces el dueño ve «Podría estar en un refugio».",
            "Dado un animal entregado, cuando el refugio lo marca, entonces sale del listado público.",
        ],
        front=["app/refugio/page.tsx", "app/resguardo/page.tsx", "components/FormularioResguardo.tsx"],
        back=["servicios/servicioResguardo.ts", "app/api/resguardo/", "lib/coincidencias/resguardo.ts"],
        bd=["AnimalResguardo", "Usuario (rol REFUGIO, nombreRefugio)"], pruebas=["resguardo.test.ts", "servicioMascotasResguardo.test.ts", "renovacion.test.ts"]),
    21: dict(
        criterios=[
            "Dado el detalle de un reporte abierto, cuando se pulsa WhatsApp, Facebook o X, entonces se abre la red con el texto y el enlace al reporte.",
            "Dado «Copiar enlace», cuando se pulsa, entonces el enlace queda en el portapapeles y se confirma.",
            "Dado el enlace pegado en una red, cuando se previsualiza, entonces muestra la foto, el título y la descripción del reporte (Open Graph).",
        ],
        front=["components/BotonesCompartir.tsx", "app/reportes/[id]/page.tsx (generateMetadata)"],
        back=["lib/compartir.ts"],
        bd=["—"], pruebas=["compartir.test.ts"]),
    22: dict(
        criterios=[
            "Dado el administrador, cuando abre «Indicadores», entonces ve por especie las pérdidas, hallazgos, reunificaciones, tasa de reunificación, pérdidas con coincidencia y tiempo promedio.",
            "Dado dos especies con pérdidas, cuando se calcula la brecha, entonces se muestra la diferencia en puntos porcentuales entre perros y gatos.",
            "Dado el filtro de periodo (30, 90, 365 días o todo), cuando cambia, entonces se recalculan todos los indicadores, la serie por mes y las zonas.",
        ],
        front=["app/admin/indicadores/page.tsx"],
        back=["lib/indicadores.ts"],
        bd=["Reporte"], pruebas=["indicadores.test.ts"]),
    23: dict(
        criterios=[
            "Dado el dueño (cuenta con la que se publicó), cuando edita el contacto o cambia la foto de su reporte o de su placa, entonces los cambios se guardan y la foto anterior se elimina.",
            "Dado un reporte o placa ajenos, cuando alguien intenta editarlos, entonces se rechaza (401 sin sesión, 403 con otra cuenta).",
        ],
        front=["app/reportes/[id]/editar/page.tsx", "app/mascotas/[id]/editar/page.tsx", "app/cuenta/page.tsx"],
        back=["servicios/servicioMascotas.ts", "servicios/servicioReportes.ts", "lib/propiedad.ts"],
        bd=["Reporte.usuarioId", "Mascota.usuarioId"], pruebas=["servicioReportes.test.ts", "servicioMascotasResguardo.test.ts", "renovacion.test.ts"]),
    24: dict(
        criterios=[
            "Dado un gato, cuando se registra, entonces se piden patrón y largo del pelaje, color de ojos y si es de interior (opcionales).",
            "Dado dos gatos con el mismo patrón y color de ojos, cuando se comparan, entonces el puntaje sube; si se contradicen, baja.",
            "Dado un animal que no es gato, cuando se guarda, entonces las señas felinas no se almacenan.",
        ],
        front=["components/CamposFelinos.tsx"],
        back=["lib/felinos.ts", "lib/coincidencias/criterios.ts"],
        bd=["Reporte y Mascota (patronPelaje, largoPelaje, colorOjos, esDeInterior)"], pruebas=["felinos.test.ts"]),
    25: dict(
        criterios=[
            "Dado el administrador o el dueño de un reporte, cuando abre «Editar» y cambia datos o foto, entonces el reporte muestra la información actualizada.",
            "Dado la edición, cuando se cambia el tipo, entonces el tipo no cambia (se conserva el original).",
        ],
        front=["app/reportes/[id]/editar/page.tsx", "components/FormularioReporte.tsx"],
        back=["app/api/reportes/[id]/route.ts", "servicios/servicioReportes.ts"],
        bd=["Reporte"], pruebas=["servicioReportes.test.ts"]),
    26: dict(
        criterios=[
            "Dado el dueño o el administrador, cuando pulsa «Eliminar este reporte» y confirma, entonces el reporte desaparece junto con su foto y su chat.",
            "Dado otra persona o un visitante, cuando intenta eliminarlo, entonces se rechaza (403 o 401) y no se borra nada.",
        ],
        front=["components/BotonEliminarReporte.tsx"],
        back=["app/api/reportes/[id]/route.ts (DELETE)", "servicios/servicioReportes.ts"],
        bd=["Reporte (Mensaje se borra en cascada)"], pruebas=["servicioReportes.test.ts"]),
    27: dict(
        criterios=[
            "Dado el listado de reportes, cuando se elige un orden, entonces se ordena por fecha de publicación o por fecha del suceso, de más reciente a más antiguo o al revés.",
            "Dado el orden por defecto, cuando no se elige ninguno, entonces se muestran primero los publicados o renovados más recientemente.",
            "Dado un orden elegido, cuando se cambian otros filtros, entonces el orden se conserva en la URL.",
        ],
        front=["app/reportes/page.tsx"],
        back=["lib/filtros.ts (construirOrden)", "lib/cache.ts"],
        bd=["Reporte"], pruebas=["filtros.test.ts"]),
}

# HU 25-27 no están numeradas con valor/urgencia en la hoja "Historias de usuario".
# Valor × urgencia se deduce de la prioridad que da la hoja "Planificación".
HU_EXTRA = {
    25: dict(rol="Dueño de mascota", quiero="editar mi reporte", para="corregir o actualizar su información",
             valor=8, urgencia=7, complejidad=4),
    26: dict(rol="Dueño de mascota", quiero="eliminar un reporte", para="retirar los reportes que ya no sean necesarios",
             valor=6, urgencia=5, complejidad=3),
    27: dict(rol="Dueño de mascota", quiero="ordenar los reportes por fecha", para="consultar primero los más recientes",
             valor=6, urgencia=5, complejidad=2),
}

# Cambios de alcance respecto al Product Backlog original (14/09/2026).
CAMBIOS_BACKLOG = [
    ("HU-4", "Se aclaró la redacción: la alerta se da cuando el reporte coincide con las características (raza y tipo) de la mascota.", "Redacción"),
    ("HU-7", "Antes: comparar automáticamente la foto con las de las mascotas encontradas (complejidad 10, urgencia 6). Ahora: notificar cuando existe un hallazgo cerca o en el lugar donde se perdió la mascota. La comparación de imágenes se descartó por costo y exactitud; la cercanía responde al mismo objetivo.", "Redefinida"),
    ("HU-10", "Antes: buscar a partir de una foto. Ahora: avisar al dueño si alguien reporta un hallazgo con las mismas características que su mascota registrada con perfil QR, aunque nunca haya publicado una pérdida.", "Redefinida"),
    ("HU-17", "Antes: consultar y vincular el número de microchip con el reporte. Ahora: la veterinaria consulta todos los reportes (solo lectura) y lleva el carnet de vacunas de las mascotas registradas.", "Redefinida"),
    ("HU-25, 26, 27", "Se agregaron al plan del Sprint 2 (editar, eliminar y ordenar reportes). No estaban numeradas en el backlog original.", "Agregadas"),
]
