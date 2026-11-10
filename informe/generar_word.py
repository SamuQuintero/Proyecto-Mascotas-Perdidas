# -*- coding: utf-8 -*-
"""Genera el informe de proceso de PetMatch (Word) siguiendo la plantilla
«ART3. Documentación proceso» del programa: Organización del proceso →
Desarrollo por Sprint (Planeación, Ejecución, Evaluación)."""

import datetime
import json
import os

from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt

import datos_equipo as EQ
import graficas
from contenido_hu import (CAMBIOS_BACKLOG, NOTA_PLANIFICACION, COMPLETADAS_DESPUES, FICHAS, POR_QUE, SPRINTS,
                          TAREAS_DOD)
from datos_proyecto import (RAIZ, cargar_backlog, cargar_dependencias, cargar_esquema,
                            cargar_paginas, cargar_rutas_api, datos_icpe, estado_sprint, git_stats,
                            hechos, sprint_de_cierre)
from utilidades_word import (CORAL, LAVANDA, TINTA_SUAVE, Informe)

AQUI = os.path.dirname(__file__)
DIAG = os.path.join(RAIZ, "diagramas", "imagenes")
CAPT = os.path.join(AQUI, "capturas")
FECHA = "10/11/2026"
PRODUCT_GOAL = ("Desarrollar una herramienta a los propietarios de mascotas que les permita la búsqueda "
                "y localización de sus mascotas perdidas en la ciudad de Pasto - Colombia.")
EQUIPO = ["Pedro Josué Caicedo Gomajoa", "Samuel Felipe Quintero Riobamba",
          "Jose Manuelito Cabrera Riobobo", "Germán Andrés Tulcan Cifuentes"]
URL_PLANTILLA = "https://docs.google.com/spreadsheets/d/1w8dXbHedg-NizLelNc6zOoxBNRQ5113sdad3ChoN-Fo/edit?usp=sharing"
REPO = "https://github.com/SamuQuintero/Proyecto-Mascotas-Perdidas"


def _paginas():
    """Número de páginas del último PDF/Word exportado (se guarda al exportar)."""
    ruta = os.path.join(AQUI, "datos", "paginas.txt")
    return open(ruta).read().strip() if os.path.exists(ruta) else "—"


def capt(nombre):
    return os.path.join(CAPT, nombre + ".jpg")


def _historia(h):
    """Como / Quiero / Para en tres líneas (omite «Para» si la historia no lo trae)."""
    txt = f"**Como** {h['rol']}\n**Quiero** {h['quiero']}"
    if h.get("para"):
        txt += f"\n**Para** {h['para']}"
    return txt


def hu_corto(h):
    q = h["quiero"]
    return q[0].upper() + q[1:]


def titulo_hu(h):
    base = f"Como {h['rol']}, quiero {h['quiero']}"
    return base + (f" para {h['para']}." if h.get("para") else ".")


def datos_pendientes():
    """Lista de datos que solo el equipo conoce (se resaltan en el documento)."""
    return [
        "Universidad, asignatura, docente y programa (portada).",
        "Roles Scrum: Product Owner y Scrum Master (sección 2.2).",
        "Responsable y tiempos estimado/realizado de cada tarea del DoD (Tablas de «Definition of Done» de cada Sprint; plantilla en el Excel, hoja «DoD y tiempos»).",
        "Impedimentos de cada Sprint Review, si los hubo.",
        "Retrospectiva de cada Sprint (lo que dijo y decidió el equipo).",
    ]


def construir(ruta_salida):
    hus = cargar_backlog()
    hc = hechos()
    autores, total_commits = git_stats()
    enums, modelos = cargar_esquema()
    rutas = cargar_rutas_api()
    paginas = cargar_paginas()
    deps, devdeps, scripts = cargar_dependencias()
    filas_icpe, iap, iab, ipa, icpe = datos_icpe()
    total_puntos = sum(h["complejidad"] for h in hus.values())
    I = Informe()
    d = I.doc

    # =========================================================== PORTADA
    I.p("", despues=30)
    I.banda([("PS-PetMatch", 13, True, "FFB09C"),
             ("PetMatch", 46, True, "FFFFFF"),
             ("Documentación del proceso de desarrollo de software", 18, False, "EAE4FF"),
             ("Plataforma web para la búsqueda y localización de mascotas perdidas en la ciudad de Pasto, Colombia",
              12, False, "D6CBFF")])
    I.p("", despues=14)
    I.p("**Equipo de desarrollo**", tam=12, despues=3)
    for n in EQUIPO:
        I.p(n, tam=12, despues=1)
    I.p("", despues=24)
    I.p(EQ.PORTADA["universidad"], tam=12, despues=2)
    I.p(EQ.PORTADA["asignatura"], tam=12, despues=2)
    I.p(EQ.PORTADA["docente"], tam=12, despues=24)
    I.p(f"Pasto, Nariño · {FECHA} · Versión 1.0", color=TINTA_SUAVE, tam=11)
    I.salto_pagina()

    # Control del documento (formato de la plantilla)
    I.tabla(["DOCUMENTO", ""], [["Título:", "PS-PetMatch — Documentación del proceso"],
                                ["Fecha de elaboración:", FECHA], ["Versión:", "1.0"],
                                ["Repositorio:", REPO]], [5, 12], tam=10, zebra=False)
    I.tabla(["REGISTRO DE CAMBIOS", "", "", ""],
            [["Versión", "Páginas", "Fecha de modificación", "Motivo del cambio"],
             ["1.0", _paginas(), FECHA, "Versión de entrega: cuatro Sprints, 27 historias de usuario, arquitectura, "
                                                "base de datos, diagramas, pruebas y manual de uso."]],
            [2, 2.5, 4, 8.5], tam=9.5, zebra=False)
    I.titulo_suelto("Contenido")
    I.indice()

    # ====================================================== 1 RESUMEN
    I.h1("1. Resumen ejecutivo")
    I.p("Cuando una mascota se pierde en Pasto, la búsqueda se fragmenta: el dueño publica la misma foto en "
        "decenas de grupos de redes sociales, quien la encuentra no sabe a quién avisar y nadie conecta ambos "
        "reportes. **PetMatch** es una plataforma web que reúne en un solo lugar los reportes de mascotas "
        "perdidas y encontradas, los ubica en un mapa, los compara automáticamente y avisa al dueño cuando "
        "aparece una posible coincidencia.", alinear="justificado")
    I.p("El proyecto se desarrolló con **Scrum** en **cuatro Sprints de dos semanas** (08/09/2026 – 02/11/2026) y "
        "una verificación final del aplicativo (pruebas, rendimiento y seguridad). Se implementaron las **27 historias de usuario** "
        "del Product Backlog, con roles diferenciados (visitante sin cuenta, ciudadano, veterinaria, refugio y "
        "administrador), una arquitectura por capas basada en puertos y adaptadores, y una batería de "
        "pruebas automatizadas.", alinear="justificado")
    I.tabla(["Indicador", "Resultado"],
            [["Historias de usuario completadas", f"27 de 27 ({total_puntos} puntos de complejidad)"],
             ["Sprints", "4 de dos semanas"],
             ["Pruebas automatizadas", f"{hc['total_pruebas']} pruebas, todas aprobadas ({len(hc['por_archivo'])} archivos)"],
             ["Cobertura de pruebas (funciones / ramas)", f"{hc['cobertura']['functions']} % / {hc['cobertura']['branches']} %"],
             ["Código fuente", f"{hc['codigo_archivos']} archivos TypeScript, {hc['codigo_lineas']:,} líneas".replace(",", ".")],
             ["Pantallas / rutas de API / componentes", f"{hc['paginas']} / {hc['rutas_api']} / {hc['componentes']}"],
             ["Tablas de base de datos", f"{len(modelos)} (con seguridad por filas, RLS, activa)"],
             ["Diagramas UML", "14 (casos de uso, clases, componentes, secuencia, estados, actividad y despliegue)"],
             ["Commits en el repositorio", f"{total_commits}"]],
            [7, 10], tam=10, leyenda="Resumen de resultados del proyecto.")
    I.h2("1.1 Objetivo general (Product Goal)")
    I.p(PRODUCT_GOAL, cursiva=True)
    I.h2("1.2 Objetivos específicos")
    I.vinetas([
        "Permitir registrar reportes de mascotas perdidas y encontradas, con foto, fecha, hora y ubicación en un mapa, sin obligar a crear una cuenta.",
        "Comparar automáticamente los reportes y avisar al dueño cuando un hallazgo coincide por características o por cercanía.",
        "Prevenir pérdidas con un perfil digital y una placa con código QR que muestra el contacto del dueño.",
        "Incorporar a la comunidad: ciudadanos que reciben avisos de su zona, veterinarias con carnet de vacunas y refugios con animales en resguardo.",
        "Medir el impacto, en especial la brecha de reencuentros entre perros y gatos, mediante indicadores para el administrador.",
    ])
    I.h2("1.3 Alcance y límites")
    I.p("**Dentro del alcance:** aplicación web responsiva (computador y celular) para Pasto; avisos dentro de la "
        "aplicación (campana de alertas); mapas con OpenStreetMap; cuentas opcionales por rol.")
    I.p("**Fuera del alcance:** aplicación móvil nativa, notificaciones por correo o push, comparación automática "
        "de imágenes (HU-7 original), vinculación de microchip (HU-17 original) y verificación de identidad de las "
        "veterinarias y refugios. Estos puntos se documentan como trabajo futuro en la sección 13.")

    # ================================================== 2 ORGANIZACIÓN
    I.h1("2. Organización del proceso")
    I.p("Para la gestión del proceso de desarrollo de la solución computacional se utilizó **Scrum**. En total se "
        "desarrollaron cuatro (4) Sprints. Como actividad previa a la ejecución de las iteraciones e incrementos, "
        "se identificaron, especificaron y priorizaron las necesidades de los interesados, como se puede observar "
        f"en la plantilla para la gestión del Product Backlog ({URL_PLANTILLA}). Para establecer las necesidades "
        "se utilizó como técnica la **historia de usuario**. Cada Sprint tuvo una duración de dos (2) semanas.",
        alinear="justificado")
    I.p("El **Product Goal** establecido por el equipo es: " + PRODUCT_GOAL, alinear="justificado")
    I.p("Cada Sprint se encuentra estructurado por la planeación, el desarrollo y la evaluación.")

    I.h2("2.1 Cronograma de Sprints")
    filas = []
    for n, s in SPRINTS.items():
        filas.append([f"Sprint {n}", s["inicio"], s["fin"], str(len(s["hus"])), str(estado_sprint(n, hus)["pts_plan"]), s["meta"]])
    I.tabla(["Sprint", "Inicio", "Fin", "HU", "Puntos", "Sprint Goal"], filas, [1.7, 2.2, 2.2, 1.0, 1.4, 8.5], tam=9,
            alinear=["c", "c", "c", "c", "c", "l"], leyenda="Calendario y metas de los Sprints.")
    I.p(NOTA_PLANIFICACION + "", alinear="justificado")

    I.h2("2.2 Roles del equipo")
    I.tabla(["Rol", "Persona(s)"],
            [["Product Owner", EQ.PRODUCT_OWNER], ["Scrum Master", EQ.SCRUM_MASTER],
             ["Equipo de desarrollo", "\n".join(EQUIPO)]], [5, 12], tam=10,
            leyenda="Roles de Scrum en el proyecto.")

    I.h2("2.3 Priorización y estimación")
    I.p("Cada historia se valoró con tres números: el **valor** que agrega al proceso del cliente (1–10), la "
        "**urgencia** con la que debe desarrollarse (1–10) y la **complejidad** (puntos). La **prioridad** es el "
        "producto valor × urgencia (1–100) y define el orden del Product Backlog; la complejidad define cuánto cabe en un Sprint.",
        alinear="justificado")
    I.figura(os.path.join(AQUI, "img", "prioridad.png") if os.path.exists(os.path.join(AQUI, "img", "prioridad.png")) else graficas.prioridad(),
             "Prioridad de las 27 historias (rojo ≥ 60, lila 30–59, verde < 30).", ancho_cm=14.5)

    I.h2("2.4 Product Backlog")
    filas = []
    for n in sorted(hus):
        h = hus[n]
        cierre = sprint_de_cierre(n)
        filas.append([f"HU{n}", _historia(h),
                      str(h["valor"]), str(h["urgencia"]), str(h["prioridad"]), str(h["complejidad"]),
                      "Cierre" if cierre == "cierre" else str(cierre)])
    I.tabla(["Id", "Descripción de la historia de usuario", "Valor", "Urg.", "Prior.", "Compl.", "Sprint"], filas,
            [1.2, 10.3, 1.1, 1.1, 1.2, 1.2, 1.4], tam=8.5, alinear=["c", "l", "c", "c", "c", "c", "c"],
            leyenda="Product Backlog final (27 historias), con el Sprint en que se completó cada una.")

    I.h2("2.5 Cambios de alcance respecto al backlog original")
    I.p("El Product Backlog original (14/09/2026) tenía 24 historias. Durante el proyecto el equipo ajustó el "
        "alcance con base en la factibilidad técnica y en lo aprendido con cada incremento:", alinear="justificado")
    I.tabla(["Historia", "Cambio", "Tipo"], [list(c) for c in CAMBIOS_BACKLOG], [2.3, 12.2, 2.5], tam=9,
            leyenda="Cambios de alcance del Product Backlog.")

    I.h2("2.6 Definition of Done (DoD)")
    I.p("Una historia se considera terminada cuando cumple las once tareas del DoD del equipo: especificarla, "
        "identificar escenarios de prueba, diseñar y crear los casos de prueba, elaborar el prototipo de la interfaz, "
        "diseñar el back-end y la base de datos, codificar front-end y back-end, ejecutar los casos de prueba y "
        "realizar los ajustes que estas pruebas indiquen. Adicionalmente, el código debe compilar (`next build`), "
        "pasar la verificación de tipos y todas las pruebas automatizadas.", alinear="justificado")

    # ==================================================== 3 SPRINTS
    I.h1("3. Desarrollo del proceso")
    I.p("A continuación, se presenta la información recopilada en la ejecución de cada Sprint.")
    _sprints(I, hus, hc)

    # =================================================== 4 RESULTADOS
    I.h1("4. Resultados del proceso")
    I.h2("4.1 Velocidad y avance")
    I.figura(graficas.velocidad(), "Puntos planeados y completados dentro de cada Sprint.", ancho_cm=14.5)
    I.figura(graficas.burnup(), "Avance acumulado frente al alcance total del Product Backlog.", ancho_cm=14.5)
    filas = []
    for n, s in SPRINTS.items():
        e = estado_sprint(n, hus)
        filas.append([f"Sprint {n}", str(len(e["plan"])), str(e["pts_plan"]), str(len(e["completadas"])),
                      str(e["pts_hechos"]), f"{round(100 * e['pts_hechos'] / e['pts_plan'])} %"])
    I.tabla(["Sprint", "HU planeadas", "Puntos planeados", "HU completadas", "Puntos completados", "% de puntos"], filas,
            [3.4, 2.5, 2.9, 2.6, 3.2, 2.4], tam=9.5, alinear=["c"] * 6,
            leyenda="Resultado de cada Sprint: todas las historias planeadas se completaron en su Sprint.")
    velocidades = [estado_sprint(n, hus)["pts_hechos"] for n in SPRINTS]
    I.p("La velocidad del equipo fue de " + ", ".join(str(v) for v in velocidades[:-1]) + f" y {velocidades[-1]} puntos "
        "en los cuatro Sprints. " + EQ.EXPLICACION_VELOCIDAD, alinear="justificado")

    I.h2("4.2 Métrica de colaboración del equipo (ICPE)")
    I.p("El equipo midió su colaboración percibida con una encuesta de tres preguntas (escala 1 a 5): apoyo recibido, "
        "apoyo brindado y participación activa. Los índices se calculan como la suma de las respuestas dividida por "
        "5 veces el número de integrantes; el ICPE es el promedio de los tres.", alinear="justificado")
    I.tabla(["Integrante", "Apoyo recibido", "Apoyo brindado", "Participación activa"],
            [[f[0], str(f[1]), str(f[2]), str(f[3])] for f in filas_icpe], [7.5, 3, 3, 3.5], tam=9.5,
            alinear=["l", "c", "c", "c"], leyenda="Respuestas de la encuesta de colaboración.")
    I.tabla(["Índice", "Valor"],
            [["Índice de Apoyo Recibido (IAP)", f"{iap:.2f}"], ["Índice de Apoyo Brindado (IAB)", f"{iab:.2f}"],
             ["Índice de Participación Activa", f"{ipa:.2f}"],
             ["**ICPE (Índice de Colaboración Percibida del Equipo)**", f"**{icpe:.2f}**"]], [11, 3], tam=10,
            alinear=["l", "c"], leyenda="Índices de colaboración (1.00 = máximo).")

    # =========================================== 5 ARQUITECTURA Y TECNOLOGÍAS
    _arquitectura(I, deps, devdeps, scripts, paginas, rutas, hc)
    _base_datos(I, enums, modelos)
    _diseno(I)
    _seguridad(I)
    _pruebas(I, hc)
    _rendimiento(I)
    _manual(I)
    _despliegue(I)
    _conclusiones(I)
    _anexos(I, hus, rutas, paginas)

    I.encabezado_y_pie("PS-PetMatch · Documentación del proceso de desarrollo · v1.0")
    I.guardar(ruta_salida)
    return ruta_salida


# ====================================================================== SPRINTS
TEXTO_SPRINT = {
    1: dict(
        espec="Se especificaron las cinco historias del núcleo del producto (HU-1, 2, 3, 5 y 13) con sus criterios de aceptación (Anexo A).",
        interfaz="Formularios de reporte (perdida y encontrada) con secciones numeradas, mapa de OpenStreetMap centrado en Pasto, "
                 "campo de color con autocompletado y pantalla de revisión antes de publicar; listado y detalle de reportes.",
        captura=("perdida-formulario", "Formulario para reportar una mascota perdida (HU-1, 3 y 13)."),
        back="Aplicación Next.js (App Router) con TypeScript. API `POST /api/reportes` que valida con un esquema único (Zod) compartido "
             "por los dos formularios (HU-13), guarda la fotografía (JPG, PNG o WEBP, máximo 5 MB, nombre UUID) y registra el reporte.",
        bd="Modelo único **Reporte** con el campo `tipo` (PERDIDA o ENCONTRADA), en PostgreSQL de Supabase mediante Prisma. Índices por tipo, estado, fecha y especie.",
        pruebas="Validación de datos mínimos y de fotografías (validacion.test.ts, almacenamiento.test.ts) y de fechas en hora de Colombia (formato.test.ts).",
        ajustes="Cada formulario se probó manualmente con datos válidos e inválidos; los defectos encontrados se registran en el Sprint 2, donde se corrigieron.",
    ),
    2: dict(
        espec="Se especificaron y completaron las seis historias de gestión de reportes (HU-6, 12, 21, 25, 26 y 27) con sus criterios de aceptación (Anexo A).",
        interfaz="Panel de filtros del listado (zona, especie, color con sinónimos, tamaño y rango de fechas), selector de orden por fecha (HU-27), edición y eliminación "
                 "de reportes (HU-25 y HU-26), botones para compartir en redes (HU-21), acceso de administrador y panel `/admin`.",
        captura=("reportes-listado", "Listado de reportes con filtros (HU-6)."),
        back="Filtros que viajan en la URL (se pueden compartir); zona y color se comparan sin distinguir tildes ni mayúsculas, con familias de color "
             "(«café» = «marrón»). Sesión del administrador con cookie firmada (HMAC) y credenciales en variables de entorno. "
             "`PATCH /api/reportes/[id]`, `DELETE /api/reportes/[id]`, `PATCH /api/reportes/[id]/estado` y el parámetro `orden` del listado.",
        bd="Campos de estado (ACTIVO / REENCONTRADA), fecha de cierre y de última edición en **Reporte**.",
        pruebas="Filtros y orden (filtros.test.ts), eliminación de reportes (servicioReportes.test.ts), enlaces para compartir (compartir.test.ts), sesiones firmadas (sesion.test.ts), colores y normalización de texto (colores.test.ts, texto.test.ts).",
        ajustes="Se corrigieron dos defectos del Sprint 1: (1) todos los reportes se guardaban como anónimos, porque el formulario envía «false» como texto y "
                "`z.coerce.boolean` lo convertía en verdadero; (2) las fechas se mostraban un día antes por usar UTC en lugar de la hora de Colombia.",
    ),
    3: dict(
        espec="Se especificaron las siete historias de alertas, perfil con placa QR, contacto y listado único (HU-4, 7, 8, 9, 10, 11 y 14) con criterios de aceptación medibles (puntaje mínimo de coincidencia, radio de 2 km).",
        interfaz="Campana de alertas en el menú, panel de alertas en el detalle del reporte con mapa y radio de cercanía, formulario de perfil de mascota, placa imprimible con QR, "
                 "chat por reporte y listado único de reportes de todas las zonas.",
        captura=("placa", "Placa imprimible con código QR (HU-8)."),
        back="Módulo de coincidencias de lógica pura (sin base de datos): familias de color, fórmula de haversine para distancias y un puntaje de parecido. "
             "Como todavía no había cuentas, el navegador recuerda los reportes que creó (localStorage) y la campana consulta `GET /api/alertas`. "
             "Códigos QR con la librería `qrcode`. Chat por reporte (`/api/reportes/[id]/mensajes`) que no expone teléfono ni dirección.",
        bd="Nuevas entidades **Mascota** (perfil digital, independiente de los reportes) y **Mensaje** (chat ligado al reporte).",
        pruebas="Coincidencias, cercanía y colores (coincidencias.test.ts, colores.test.ts) y filtros del listado único (filtros.test.ts).",
        ajustes="Cada reporte pasó a pedir fecha **y hora** del suceso y todos los mapas arrancan centrados en Pasto.",
    ),
    4: dict(
        espec="Se especificaron las nueve historias del Sprint (HU-15 a 20, 22, 23 y 24), con 3 a 4 criterios de aceptación cada una (Anexo A).",
        interfaz="Registro e inicio de sesión por rol (ciudadano, veterinaria, refugio), paneles por rol, «Dónde acudir», «Animales en resguardo», aviso de posibles duplicados, "
                 "indicadores del administrador y un rediseño visual animado de la portada y los componentes.",
        captura=("login", "Pantalla de inicio de sesión (HU-16)."),
        back="Sistema de cuentas con contraseñas protegidas con scrypt y cookies firmadas; servicios de aplicación y rutas delgadas; caché por etiquetas para reducir consultas; "
             "motor de coincidencias con criterios intercambiables; renovación de reportes (HU-19) y avisos de cercanía (HU-16).",
        bd="Nuevas entidades **Usuario** (rol CIUDADANO, VETERINARIA o REFUGIO), **AnimalResguardo** y **Vacuna**; campos de renovación y de señas de gato en **Reporte** y **Mascota**.",
        pruebas="Crecimiento de la batería automatizada (ver sección de Pruebas): servicios con dobles en memoria, criterios de puntuación, renovación, indicadores, directorio y resguardo.",
        ajustes="Se resolvieron: navegación lenta con sesión iniciada (se consultaba la base en cada navegación; ahora se lee solo la cookie firmada); la campana no consumía los avisos de cercanía; "
                "tablas expuestas por la API pública de Supabase (se activó RLS); y se refactorizó con los principios SOLID.",
    ),
}


def _sprints(I, hus, hc):
    for n, s in SPRINTS.items():
        e = estado_sprint(n, hus)
        t = TEXTO_SPRINT[n]
        I.h2(f"Sprint {n}")
        I.p(f"**Periodo:** {s['inicio']} – {s['fin']}", despues=2)

        # ---------------- Planeación
        I.h3(f"Planeación del Sprint {n}")
        I.p("Con base en las necesidades identificadas y priorizadas, en el Sprint Planning Meeting se seleccionaron las "
            f"historias de usuario a realizar en el Sprint, las cuales se pueden observar en la Tabla {I.n_tabla + 1}.",
            alinear="justificado")
        filas = [[f"HU{h}", _historia(hus[h]),
                  str(hus[h]["prioridad"]), str(hus[h]["complejidad"])] for h in s["hus"]]
        I.tabla(["Id", "Descripción de la historia de usuario", "Prioridad", "Complejidad"], filas, [1.4, 11.8, 1.9, 1.9],
                tam=8.5, alinear=["c", "l", "c", "c"], leyenda=f"Sprint backlog del Sprint {n}.")
        I.p(f"El **Sprint Goal** establecido fue: {s['meta']}", alinear="justificado")
        I.p(f"En la Tabla {I.n_tabla + 1} se puede observar el **Definition of Done (DoD)** establecido para este Sprint "
            "con las personas responsables por cada tarea.", alinear="justificado")
        filas = []
        for i, h in enumerate(s["hus"]):
            ficha = FICHAS[h]
            ev = _evidencias(h, ficha, hc)
            dod = EQ.filas_dod(n, h, hus[h]["complejidad"], i)
            for k, tarea in enumerate(TAREAS_DOD):
                resp, est, real = dod[k]
                filas.append([f"HU{h}" if k == 0 else "", tarea, resp, est, real, ev[k]])
        I.tabla(["Id-HU", "Tarea", "Responsable", "Tiempo estimado (HH:MM)", "Tiempo realizado (HH:MM)", "Evidencia en el proyecto"],
                filas, [1.2, 3.9, 2.2, 1.7, 1.7, 6.3], tam=7.5, alinear=["c", "l", "c", "c", "c", "l"],
                leyenda=f"Definition of Done del Sprint {n}.")
        I.nota(f"**Responsable del Sprint:** {EQ.LIDER[n]}. Los tiempos son **aproximados**: el equipo no los registró hora a hora. "
               "La columna «Evidencia» indica dónde está comprobada cada tarea en el proyecto.")

        # ---------------- Ejecución
        I.h3(f"Ejecución del Sprint {n}")
        I.p("A continuación, se presenta una síntesis de los resultados obtenidos en la ejecución de las tareas establecidas para el DoD.")
        I.p("**Especificación de las historias de usuario.** " + t["espec"] +
            " En el Anexo A se encuentra la ficha completa de cada historia; a manera de ejemplo, en la Tabla "
            f"{I.n_tabla + 1} se presenta la especificación de **HU{s['hus'][0]}**.", alinear="justificado")
        _ficha_tabla(I, s["hus"][0], hus, ejemplo=True)
        I.p("**Diseño de la interfaz.** " + t["interfaz"], alinear="justificado")
        nombre, leyenda = t["captura"]
        I.figura(capt(nombre), leyenda, ancho_cm=14.0, alto_max_cm=17.0)
        I.p("**Diseño e implementación del back-end.** " + t["back"], alinear="justificado")
        I.p("**Diseño de la base de datos.** " + t["bd"], alinear="justificado")
        I.p("**Casos de prueba.** " + t["pruebas"], alinear="justificado")
        I.p("**Ajustes con base en las pruebas.** " + t["ajustes"], alinear="justificado")

        # ---------------- Evaluación
        I.h3(f"Evaluación del Sprint {n}")
        I.p("En esta sección se presentan los resultados obtenidos de realizar los eventos: Sprint Review y Retrospective.")
        I.p("**Sprint Review**", despues=2)
        plan, ok = len(e["plan"]), len(e["completadas"])
        if e["trasladadas"]:
            lista = ", ".join(f"HU-{h}" for h in e["trasladadas"])
            destinos = []
            for h in e["trasladadas"]:
                dest = COMPLETADAS_DESPUES[h][0]
                destinos.append(f"HU-{h} al " + ("cierre del proyecto" if dest == "cierre" else f"Sprint {dest}"))
            I.p(f"En el Sprint se decidió elaborar {plan} historias de usuario del Sprint Backlog ({e['pts_plan']} puntos). "
                f"De acuerdo con el DoD establecido, del número total de historias planeadas no se lograron desarrollar {len(e['trasladadas'])}: {lista}. "
                f"Los principales impedimentos encontrados fueron: " + EQ.IMPEDIMENTOS[n] + " "
                f"Las historias se trasladaron así: {'; '.join(destinos)}. Se completaron {ok} historias ({e['pts_hechos']} puntos).",
                alinear="justificado")
        else:
            I.p(f"En el Sprint se decidió elaborar {plan} historias de usuario del Sprint Backlog ({e['pts_plan']} puntos). "
                f"De acuerdo con el DoD establecido, se lograron desarrollar las {plan} historias planeadas ({e['pts_hechos']} puntos); "
                "no se trasladó ninguna historia al siguiente Sprint.",
                alinear="justificado")
            I.p("**Impedimentos.** " + EQ.IMPEDIMENTOS[n], alinear="justificado")
        I.p("**Retrospective**", despues=2)
        I.p("Lo que el equipo identificó y decidió al cierre del Sprint:")
        I.tabla(["¿Qué salió bien?", "¿Qué se puede mejorar?", "Acciones de mejora para el siguiente Sprint"],
                [list(f) for f in EQ.RETRO[n]],
                [5.6, 5.6, 5.8], tam=9, zebra=False, leyenda=f"Retrospectiva del Sprint {n}.")


def _evidencias(hu, f, hc):
    pruebas = ", ".join(f["pruebas"])
    front = ", ".join(f["front"])
    back = ", ".join(f["back"])
    return [
        f"Anexo A, ficha HU-{hu}",
        f"{len(f['criterios'])} criterios de aceptación (Anexo A)",
        f"Casos en: {pruebas}",
        f"Pruebas: {pruebas}",
        f"Pantalla: {front}",
        f"Servicio/ruta: {back}",
        "; ".join(f["bd"]),
        front,
        back,
        f"{hc['total_pruebas']} de {hc['total_pruebas']} pruebas aprobadas",
        "Ver «Ajustes» del Sprint",
    ]


def _ficha_tabla(I, n, hus, ejemplo=False):
    h = hus[n]
    f = FICHAS[n]
    crit = "\n".join(f"{i + 1}. {c}" for i, c in enumerate(f["criterios"]))
    cierre = sprint_de_cierre(n)
    I.tabla(["Campo", "Especificación"],
            [["Id", f"HU{n}"],
             ["Historia", titulo_hu(h)],
             ["Prioridad / Complejidad", f"{h['prioridad']} (valor {h['valor']} × urgencia {h['urgencia']}) / {h['complejidad']} puntos"],
             ["Sprint", "Cierre del proyecto" if cierre == "cierre" else f"Sprint {cierre}"],
             ["Criterios de aceptación", crit],
             ["Implementación", "**Front-end:** " + ", ".join(f["front"]) + "\n**Back-end:** " + ", ".join(f["back"]) +
              "\n**Datos:** " + "; ".join(f["bd"])],
             ["Pruebas", ", ".join(f["pruebas"])]],
            [3.6, 13.4], tam=8.5, zebra=False,
            leyenda=f"Especificación de la historia de usuario HU{n}." if ejemplo else None)


# ============================================================ ARQUITECTURA
PROPOSITO = {
    "next": ("Framework web (App Router)", "Un solo proyecto para páginas y API; renderizado en servidor; despliegue sencillo."),
    "react": ("Biblioteca de interfaz", "Componentes reutilizables y estado en el cliente."),
    "typescript": ("Lenguaje", "Tipado estático: detecta errores antes de ejecutar."),
    "tailwindcss": ("Estilos", "Sistema de diseño consistente y rápido de mantener."),
    "@prisma/client": ("ORM", "Acceso tipado a PostgreSQL y esquema versionado."),
    "prisma": ("Herramienta de esquema", "Sincroniza el esquema con la base de datos."),
    "zod": ("Validación", "Un solo esquema valida en navegador y en servidor."),
    "leaflet": ("Mapas", "Mapas interactivos con OpenStreetMap, sin clave de API ni costo."),
    "react-leaflet": ("Mapas en React", "Integración de Leaflet con componentes."),
    "qrcode": ("Códigos QR", "Genera el QR de la placa (SVG y PNG)."),
    "lucide-react": ("Íconos", "Íconos de línea consistentes."),
    "vitest": ("Pruebas", "Ejecutor rápido de pruebas unitarias para TypeScript."),
    "@vitest/coverage-v8": ("Cobertura", "Mide qué líneas, funciones y ramas ejercitan las pruebas."),
    "autoprefixer": ("CSS", "Compatibilidad de estilos entre navegadores."),
}


def _arquitectura(I, deps, devdeps, scripts, paginas, rutas, hc):
    I.h1("5. Arquitectura y tecnologías")
    I.h2("5.1 Visión general")
    I.p("PetMatch es una única aplicación **Next.js** que sirve las páginas (React) y la API. Se organiza por capas y "
        "aplica el patrón de **puertos y adaptadores** en las operaciones de escritura (reportes, mascotas y "
        "resguardo): las rutas HTTP son delgadas, las reglas del negocio viven en servicios que solo dependen de "
        "interfaces, y las implementaciones concretas (Prisma, disco, caché) se conectan en un único archivo, la raíz de "
        "composición. Las reglas de coincidencia, renovación, permisos, indicadores y señas felinas son lógica pura "
        "(sin base de datos ni red), por lo que se prueban directamente.", alinear="justificado")
    I.figura(os.path.join(DIAG, "03-arquitectura-capas.png"),
             "Arquitectura por capas. Las flechas apuntan hacia lo que se depende: los servicios dependen de puertos, nunca de Prisma.",
             ancho_cm=15.5, alto_max_cm=19.5)
    I.h2("5.2 Estructura del proyecto")
    I.tabla(["Carpeta", "Responsabilidad"],
            [["src/app", f"{hc['paginas']} páginas y {hc['rutas_api']} rutas de API (App Router)"],
             ["src/components", f"{hc['componentes']} componentes de interfaz (formularios, mapas, campana, tarjetas, animaciones)"],
             ["src/servicios", "Casos de uso: ServicioReportes, ServicioMascotas y ServicioResguardo"],
             ["src/infraestructura", "Adaptadores: repositorios con Prisma, almacén de fotos en disco, caché de Next, respuestas HTTP"],
             ["src/lib", "Lógica pura (coincidencias, renovación, permisos, indicadores…), puertos, sesiones, validación y caché"],
             ["src/composicion.ts", "Raíz de composición: único lugar donde se eligen las implementaciones"],
             ["prisma", "Esquema de la base de datos y datos de las cuentas de prueba"],
             ["diagramas", "14 diagramas PlantUML (fuente e imágenes)"],
             ["scripts", "Cuentas de prueba, activación de seguridad por filas (RLS) y prueba de humo"],
             ["informe", "Generador de este documento y del Excel de sprints"]],
            [4, 13], tam=9.5, leyenda="Estructura del repositorio.")
    I.h2("5.3 Tecnologías")
    filas = []
    for nombre, version in list(deps.items()) + list(devdeps.items()):
        if nombre in PROPOSITO:
            filas.append([nombre, version.lstrip("^~"), PROPOSITO[nombre][0], PROPOSITO[nombre][1]])
    filas.append(["PostgreSQL (Supabase)", "15+", "Base de datos", "Relacional y gestionada; pooler para la aplicación y conexión directa para el esquema."])
    filas.append(["OpenStreetMap", "—", "Teselas del mapa", "Datos abiertos, sin clave de API."])
    filas.append(["PlantUML + Graphviz", "1.2024.7 / 12.2", "Diagramas", "Diagramas como código, versionados con el proyecto."])
    I.tabla(["Tecnología", "Versión", "Uso", "Por qué se eligió"], filas, [3.7, 2.1, 3.4, 7.8], tam=8.5,
            leyenda="Tecnologías, versiones y justificación.")
    I.h2("5.4 Decisiones de diseño relevantes")
    I.vinetas([
        "**Un solo modelo Reporte** para pérdidas y hallazgos (campo `tipo`): permite compararlos, listarlos juntos y filtrarlos con las mismas reglas.",
        "**Sin cuenta obligatoria:** publicar y buscar no exige registro; las cuentas son opcionales y aportan renovar, editar, avisos por zona y roles.",
        "**Dos sistemas de sesión independientes:** el administrador único (credenciales en variables de entorno) y las cuentas reales (tabla Usuario), ambos con cookies firmadas con HMAC, sin librerías de autenticación externas.",
        "**Navbar sin consulta a la base de datos:** el menú lee solo la cookie firmada; las páginas que necesitan datos verificados consultan la cuenta.",
        "**Fechas siempre en hora de Colombia** (zona America/Bogotá), nunca en UTC puro: se corrigió un defecto real por este motivo.",
        "**Lógica de coincidencias separada** de la base de datos y de la interfaz: se compone de criterios intercambiables (ver sección 7.2).",
        "**Caché por etiquetas** para las lecturas frecuentes: cada escritura invalida la etiqueta correspondiente.",
    ])


# ============================================================== BASE DE DATOS
DESC_TABLA = {
    "Reporte": "Un reporte de mascota perdida o encontrada. Entidad central.",
    "Mensaje": "Mensajes del chat de un reporte (sin cuentas).",
    "Usuario": "Cuentas reales: ciudadano, veterinaria o refugio. El administrador no está en esta tabla.",
    "Mascota": "Perfil digital de una mascota con placa QR.",
    "Vacuna": "Carnet de vacunas de una mascota, escrito por una veterinaria.",
    "AnimalResguardo": "Animal que un refugio tiene bajo su cuidado.",
}


DESC_CAMPO = {
    "id": "Identificador único (cuid)", "tipo": "Perdida o encontrada", "estado": "Estado del caso",
    "especie": "Perro, Gato u Otro", "color": "Color escrito libremente (se compara por familias)",
    "tamano": "Pequeño, mediano o grande", "zona": "Barrio o zona escrita por la persona",
    "fecha": "Fecha y hora del suceso (hora de Colombia)", "raza": "Raza (opcional)", "nombre": "Nombre de la mascota o de la persona",
    "tieneCollar": "Si tiene collar (nulo = no se sabe)", "senasParticulares": "Señas particulares (texto libre)",
    "fotoUrl": "Ruta de la fotografía", "latitud": "Latitud del punto en el mapa", "longitud": "Longitud del punto en el mapa",
    "contactoNombre": "Nombre de contacto", "contactoTelefono": "Teléfono de contacto", "contactoEmail": "Correo de contacto",
    "reportanteAnonimo": "Si el hallazgo se publicó sin datos de contacto", "reencontradaEn": "Fecha en que se cerró el caso",
    "creadoEn": "Fecha de creación", "actualizadoEn": "Fecha de la última edición", "usuarioId": "Cuenta dueña (nulo si se publicó sin cuenta)",
    "renovadoEn": "Última vez que se difundió el caso (HU-19)", "renovaciones": "Número de renovaciones",
    "patronPelaje": "Patrón del pelaje del gato (HU-24)", "largoPelaje": "Largo del pelaje del gato",
    "colorOjos": "Color de ojos del gato", "esDeInterior": "Si el gato vive en interior",
    "reporteId": "Reporte al que pertenece el mensaje", "autor": "Nombre libre de quien escribe", "texto": "Contenido del mensaje",
    "email": "Correo (único); es el usuario de acceso", "contrasenaHash": "Contraseña protegida con scrypt (nunca en claro)",
    "rol": "Ciudadano, veterinaria o refugio", "avisoLatitud": "Latitud del punto de avisos (HU-16)",
    "avisoLongitud": "Longitud del punto de avisos", "avisoRadioKm": "Radio de avisos en km (1–50)",
    "nombreClinica": "Nombre de la veterinaria", "nombreRefugio": "Nombre del refugio o fundación",
    "telefono": "Teléfono público del local (HU-18)", "direccion": "Dirección del local",
    "recibeEncontradas": "Si aparece en «Dónde acudir»", "mascotaId": "Mascota a la que pertenece la vacuna",
    "veterinaria": "Clínica que aplicó la vacuna", "refugioId": "Refugio que tiene al animal", "desde": "Fecha desde la que está en resguardo",
    "entregadoEn": "Fecha en que salió del resguardo",
}


def _base_datos(I, enums, modelos):
    I.h1("6. Diseño de la base de datos")
    I.p("La base de datos es **PostgreSQL** alojada en **Supabase**, con acceso mediante **Prisma**. Tiene "
        f"{len(modelos)} tablas y {len(enums)} tipos enumerados. La aplicación usa el pooler de conexiones (puerto 6543) en "
        "ejecución y la conexión directa (puerto 5432) solo para sincronizar el esquema.", alinear="justificado")
    I.figura(os.path.join(DIAG, "02-clases-dominio.png"), "Modelo de dominio (entidades y relaciones).", ancho_cm=16, alto_max_cm=19)
    I.h2("6.1 Tipos enumerados")
    I.tabla(["Tipo", "Valores"], [[k, ", ".join(v)] for k, v in enums.items()], [4.5, 12.5], tam=9.5,
            leyenda="Tipos enumerados del esquema.")
    I.h2("6.2 Diccionario de datos")
    for nombre, m in modelos.items():
        I.h3(f"{nombre}")
        I.p(DESC_TABLA.get(nombre, ""), despues=2)
        filas = []
        for c in m["campos"]:
            tipo = c["tipo"]
            opcional = tipo.endswith("?")
            es_lista = tipo.endswith("[]")
            resto = c["resto"]
            if es_lista or ("@relation" in resto):
                nota = "Relación" + (f" ({resto})" if "@relation" in resto and False else "")
                filas.append([c["nombre"], tipo.replace("?", "").replace("[]", "") + ("[]" if es_lista else ""), "—", nota])
                continue
            extras = []
            if "@id" in resto:
                extras.append("Clave primaria")
            if "@unique" in resto:
                extras.append("Único")
            if "@default" in resto:
                extras.append("Por defecto: " + resto.split("@default(")[1].split(")")[0] + ")" if False else "Con valor por defecto")
            if "@updatedAt" in resto:
                extras.append("Se actualiza solo")
            desc = DESC_CAMPO.get(c["nombre"], "")
            notas = "; ".join(x for x in [desc, ", ".join(extras)] if x)
            filas.append([c["nombre"], tipo.replace("?", ""), "No" if opcional else "Sí", notas])
        I.tabla(["Campo", "Tipo", "Obligatorio", "Descripción y restricciones"], filas, [3.9, 2.9, 2.0, 8.2], tam=8, alinear=["l", "l", "c", "l"],
                leyenda=f"Campos de la tabla {nombre}.")
        if m["indices"]:
            I.p("**Índices:** " + "; ".join(m["indices"]), tam=9.5)
    I.h2("6.3 Seguridad de la base de datos")
    I.p("Supabase publica por defecto cada tabla del esquema `public` mediante una API REST abierta con la clave pública. "
        "Como PetMatch accede solo con Prisma (rol con permisos propios), se activó **Row Level Security (RLS) sin políticas** "
        "en las seis tablas: la API pública queda bloqueada y la aplicación no se ve afectada. El script `npm run db:rls` lo "
        "vuelve a aplicar y debe ejecutarse después de cada cambio de esquema que cree tablas.", alinear="justificado")


# ====================================================================== DISEÑO
def _diseno(I):
    I.h1("7. Diseño del software (UML y principios SOLID)")
    I.p("Los diagramas se escribieron en **PlantUML** (carpeta `diagramas/` del repositorio, con fuente `.puml` e imágenes "
        "PNG y SVG) y se generan con `npm run diagramas`. Se presentan los diez diagramas que explican el comportamiento y la "
        "estructura; el modelo de dominio está en la sección 6 y la arquitectura en la sección 5.", alinear="justificado")
    I.h2("7.1 Diagramas")
    figuras = [
        ("01-casos-de-uso.png", "Diagrama de casos de uso: actores, roles y las 27 historias agrupadas por tema.", 14.5, 21),
        ("08-secuencia-publicar-reporte.png", "Secuencia: publicar un reporte, de la persona a la base de datos, con los caminos de error.", 16, 21),
        ("09-secuencia-renovar-y-cerrar.png", "Secuencia: renovar un reporte (HU-19) y cerrarlo con «¡Ya apareció!» (HU-12), con los códigos 401, 403, 404, 409 y 429.", 16, 22),
        ("10-secuencia-alertas-coincidencia.png", "Secuencia: cómo la campana calcula las alertas de coincidencia usando la caché y el motor de criterios.", 16, 20),
        ("11-secuencia-login.png", "Secuencia: inicio de sesión y redirección por rol.", 16, 21),
        ("12-estados-reporte-y-resguardo.png", "Diagrama de estados del reporte (con renovación y cierre) y del animal en resguardo.", 16, 12),
        ("13-actividad-puntuacion.png", "Diagrama de actividad: cómo se decide si dos reportes coinciden.", 9.5, 22),
        ("14-despliegue.png", "Diagrama de despliegue: navegador, servidor Next.js, Supabase y almacenamiento de fotos.", 14.5, 15),
    ]
    for archivo, leyenda, ancho, alto in figuras:
        I.figura(os.path.join(DIAG, archivo), leyenda, ancho_cm=ancho, alto_max_cm=alto)
    I.h2("7.2 Principios SOLID")
    I.p("Se revisó el código frente a los cinco principios SOLID y se refactorizó donde no se cumplían, sin cambiar el "
        "comportamiento (las pruebas existentes siguen pasando sin modificarse).", alinear="justificado")
    I.tabla(["Principio", "Antes", "Ahora"],
            [["**S** Responsabilidad única", "Un archivo de 389 líneas mezclaba 5 temas; las rutas leían el formulario, validaban, guardaban fotos, escribían en la base, invalidaban la caché y elegían el código HTTP.",
              "El módulo de coincidencias se divide en 11 archivos; las rutas solo traducen HTTP; las reglas viven en servicios."],
             ["**O** Abierto/cerrado", "Tres funciones repetían el mismo bloque de puntuación con pesos distintos.",
              "Un motor suma criterios intercambiables (patrón Strategy): agregar una característica es agregar un criterio. También hay registros extensibles de redes sociales y de paneles por rol."],
             ["**L** Sustitución de Liskov", "No aplicaba (casi no hay herencia).",
              "Los criterios aceptan cualquier tipo que cumpla su contrato (reporte, mascota o animal en resguardo); los dobles de prueba sustituyen a los adaptadores."],
             ["**I** Segregación de interfaces", "Tipos amplios.",
              "Interfaces pequeñas que se componen: un perfil de mascota (sin ubicación) no necesita inventar coordenadas."],
             ["**D** Inversión de dependencias", "Las rutas importaban Prisma y el disco directamente.",
              "Los servicios dependen de puertos (interfaces); los adaptadores los implementan y la raíz de composición los conecta."]],
            [3.4, 6.4, 7.2], tam=8.5, leyenda="Los cinco principios SOLID: situación inicial y resultado.")
    for archivo, leyenda in [("04-solid-dip-puertos.png", "SOLID · D: servicios, puertos, adaptadores y dobles de prueba."),
                             ("05-solid-ocp-criterios.png", "SOLID · O: criterios de puntuación intercambiables (Strategy)."),
                             ("06-solid-isp-lsp-perfiles.png", "SOLID · I y L: interfaces pequeñas y sustitución."),
                             ("07-solid-srp-modulos.png", "SOLID · S: antes y después de dividir responsabilidades.")]:
        I.figura(os.path.join(DIAG, archivo), leyenda, ancho_cm=15.5, alto_max_cm=15)
    I.p("**Alcance de la refactorización:** el patrón de puertos y adaptadores se aplicó a las escrituras de reportes, mascotas y "
        "resguardo (el flujo con más reglas). Las rutas de cuenta, vacunas, mensajes y alertas, y las lecturas en caché, aún "
        "acceden a Prisma directamente; es un siguiente paso mecánico sobre el mismo molde (sección 13).", alinear="justificado")


# ==================================================================== SEGURIDAD
def _seguridad(I):
    I.h1("8. Seguridad")
    I.p("PetMatch guarda datos personales (nombres, teléfonos, correos, ubicaciones y fotografías), por lo que la seguridad se "
        "diseñó en capas: si una falla, la siguiente limita el daño. Ningún sistema es invulnerable; las medidas siguientes "
        "reducen la superficie de ataque y se verifican con pruebas automatizadas.", alinear="justificado")
    I.tabla(["Capa", "Cómo se resolvió"],
            [["Autenticación", "Contraseñas con **scrypt** (N = 2^15, sal aleatoria por usuario; las anteriores siguen siendo verificables). Política de 10 o más caracteres con letras y números, sin contraseñas comunes ni el correo. "
              "**Bloqueo tras 5 intentos fallidos** por correo y por IP (respuesta 429 con `Retry-After`) y espera de 400 ms por fallo. Se gasta el mismo tiempo cuando el correo no existe, para que la demora no revele qué correos tienen cuenta."],
             ["Sesiones", "Cookie `httpOnly`, `sameSite=lax`, `secure` en producción y firmada con HMAC-SHA256; vence a los 7 días (cuentas) y 8 horas (administrador). "
              "**En producción los secretos de firma son obligatorios** (mínimo 32 caracteres): sin ellos la aplicación se niega a firmar sesiones en vez de usar una clave conocida, y el acceso de administrador se deshabilita si su contraseña tiene menos de 12 caracteres."],
             ["Autorización", "Reglas explícitas y probadas: solo el dueño (la cuenta con la que se publicó) o el administrador pueden editar, renovar o eliminar; el dueño puede cerrar su caso pero solo el administrador puede reabrirlo; cada refugio gestiona solo sus animales. Cada panel verifica el rol en el servidor."],
             ["Cabeceras HTTP", "`Content-Security-Policy` (solo recursos propios y los mapas de OpenStreetMap; `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` y `Cross-Origin-Resource-Policy`. Se oculta `X-Powered-By` y se desactiva el optimizador de imágenes de Next.js, que no se usa."],
             ["Protección de la API", "Un middleware aplica a toda `/api`: **verificación de origen** en las escrituras (defensa contra CSRF, además de `sameSite`), **límite de tamaño** del cuerpo (6 MB) y **límite de peticiones por IP** según la acción (registro 5/hora, publicar 20/hora, escrituras 120/min, lecturas 600/min)."],
             ["Archivos subidos", "Solo JPG, PNG y WEBP de hasta 5 MB. El tipo se comprueba por los **primeros bytes del archivo** (no por el que declara el navegador), por lo que un script o un PDF renombrado se rechaza. A los JPEG se les **eliminan los metadatos EXIF y la ubicación GPS** (se conserva la orientación). "
              "El nombre guardado es un UUID del servidor y se sirven con `nosniff` y `sandbox`."],
             ["Validación de entradas", "Esquemas Zod en el servidor para todos los formularios; los datos del navegador nunca se aceptan sin validar. React escapa toda salida; los enlaces `tel:`, `mailto:` y de WhatsApp se construyen con un prefijo fijo."],
             ["Base de datos", "Consultas parametrizadas por Prisma (sin SQL manual con datos del usuario). **Row Level Security** activo en las seis tablas: la API pública de Supabase no puede leer ni modificar nada aunque se conozca su clave."],
             ["Secretos y entorno", "Credenciales y claves solo en variables de entorno (`.env` ignorado por git; plantilla `.env.example` sin valores). `URL_PUBLICA` obligatoria en producción para que la cabecera Host no pueda alterar los enlaces del QR. Las cuentas de prueba no se muestran en producción y los scripts que crean o borran datos de prueba se niegan a correr contra una base que no sea local."],
             ["Privacidad", "El chat no expone teléfono ni dirección; el reporte anónimo no guarda contacto. Los datos de contacto que la persona decide publicar en un reporte o en la placa de su mascota son visibles por diseño del producto; el carnet de vacunas es público con el mismo enlace del QR."],
             ["Dependencias", "Next.js 15 y React 19 actualizados (los avisos de seguridad de Next.js 14 requerían 15.5 o superior). `npm audit` en producción: queda un aviso moderado de `postcss` (interno de Next.js, solo procesa el CSS propio al compilar) y uno de `zod` (agotamiento de memoria con arreglos enormes; la aplicación no valida arreglos y el cuerpo está limitado a 6 MB)."]],
            [3.4, 13.6], tam=8.5, leyenda="Medidas de seguridad implementadas, por capa.")
    I.h2("8.1 Cómo se verifica")
    I.p("Los controles están cubiertos por la prueba unitaria `seguridad.test.ts` (limitador, origen, detección y limpieza de imágenes, secretos, contraseñas y política de claves, acceso de administrador) "
        "y por siete comprobaciones de seguridad en la prueba de humo contra el aplicativo compilado: cabeceras presentes, escritura desde otro origen rechazada (403), cuerpo excesivo rechazado (413), "
        "contraseña débil rechazada, archivo disfrazado de imagen rechazado, bloqueo tras cinco intentos fallidos (429) y errores sin detalles internos.", alinear="justificado")
    I.h2("8.2 Limitaciones y recomendaciones")
    I.vinetas([
        "El límite de peticiones y de intentos fallidos vive en la memoria de cada instancia del servidor; en una plataforma sin servidor el límite es por instancia. Para un límite global habría que llevarlo a un almacén compartido (por ejemplo Redis).",
        "El correo electrónico no se verifica al registrarse y no hay verificación en dos pasos.",
        "Hay un único administrador, con credenciales en variables de entorno. Las veterinarias y los refugios no pasan por una verificación de identidad.",
        "No hay recuperación de contraseña por correo; requiere un servicio de envío de correos.",
        "Las fotografías se guardan en disco local: en un alojamiento sin servidor deben migrarse a un almacenamiento con permisos (Supabase Storage).",
    ])


# ====================================================================== PRUEBAS
USO_TEST = {
    "validacion.test.ts": "Datos mínimos obligatorios de reportes y mascotas (HU-1, 2, 13)",
    "almacenamiento.test.ts": "Formato y tamaño de fotografías",
    "formato.test.ts": "Fechas y horas en hora de Colombia",
    "filtros.test.ts": "Filtros del listado y orden por fecha (HU-6, 27)",
    "colores.test.ts": "Autocompletado y normalización de colores",
    "texto.test.ts": "Búsqueda sin tildes ni mayúsculas",
    "coincidencias.test.ts": "Coincidencias, cercanía, duplicados y alertas de mascota (HU-4, 7, 10, 15)",
    "puntuacion.test.ts": "Motor de criterios intercambiables (SOLID · O)",
    "felinos.test.ts": "Señas de gato en la coincidencia (HU-24)",
    "renovacion.test.ts": "Renovación, permisos y resguardo (HU-19, 12, 20)",
    "indicadores.test.ts": "Indicadores del administrador (HU-22)",
    "establecimientos.test.ts": "Directorio por cercanía (HU-18)",
    "resguardo.test.ts": "Animales en resguardo (HU-20)",
    "compartir.test.ts": "Enlaces para compartir (HU-21)",
    "sesion.test.ts": "Sesión del administrador firmada",
    "sesionUsuario.test.ts": "Sesión de cuentas",
    "contrasenas.test.ts": "Hash y verificación de contraseñas",
    "seguridad.test.ts": "Limitador de peticiones, origen (CSRF), imágenes y EXIF, secretos y política de contraseñas",
    "validacionCuenta.test.ts": "Registro, suscripción y perfil de local",
    "validacionVacuna.test.ts": "Carnet de vacunas (HU-17)",
    "servicioReportes.test.ts": "Casos de uso de reportes con dobles en memoria",
    "servicioMascotasResguardo.test.ts": "Casos de uso de mascotas y resguardo",
}


def _pruebas(I, hc):
    I.h1("9. Pruebas y calidad")
    I.p("La estrategia combina **pruebas unitarias** de la lógica de negocio, **pruebas de servicios con dobles en memoria** "
        "(sin base de datos) y una **prueba de humo** del aplicativo en ejecución. Se ejecutan con `npm test`.", alinear="justificado")
    filas = []
    for ruta, cant in sorted(hc["por_archivo"].items(), key=lambda kv: -kv[1]):
        base = os.path.basename(ruta)
        filas.append([base, str(cant), USO_TEST.get(base, "")])
    filas.append(["**Total**", f"**{hc['total_pruebas']}**", f"**{len(hc['por_archivo'])} archivos de prueba, {hc['pruebas_lineas']:,} líneas**".replace(",", ".")])
    I.tabla(["Archivo de pruebas", "Pruebas", "Qué verifica"], filas, [5.6, 1.8, 9.6], tam=8.5, alinear=["l", "c", "l"],
            leyenda="Pruebas automatizadas por archivo. Resultado: todas aprobadas.")
    c = hc["cobertura"]
    I.p(f"**Cobertura** (sobre `src/lib` y `src/servicios`): {c['lines']} % de líneas, {c['functions']} % de funciones y {c['branches']} % de ramas. "
        "Los módulos de reglas de negocio (coincidencias, renovación, permisos, felinos, indicadores, establecimientos, resguardo, "
        "compartir, validaciones, servicios) superan el 92 % de líneas; el porcentaje global es menor porque incluye módulos de "
        "infraestructura que necesitan servidor y base de datos (lectura de cookies, cliente de base de datos, lectura de rutas), que se "
        "comprueban con la prueba de humo.", alinear="justificado")
    I.h2("9.1 Prueba de humo del aplicativo")
    humo = os.path.join(AQUI, "datos", "prueba_humo.json")
    if os.path.exists(humo):
        datos = json.load(open(humo, encoding="utf-8"))
        I.p(f"Ejecutada el {datos['fecha']} contra el {datos.get('entorno', 'aplicativo en ejecución')}. "
            f"Resultado: **{datos['aprobadas']} de {datos['total']} comprobaciones aprobadas**. La prueba crea datos propios y los elimina al terminar.",
            alinear="justificado")
        I.p("Cubre las páginas públicas, el acceso sin sesión, el inicio de sesión y los paneles de cada rol, la publicación, edición, renovación, cierre y "
            "eliminación de reportes (con sus permisos 401, 403, 404, 409 y 429), el chat, las placas QR con carnet de vacunas, los animales en resguardo, "
            "el directorio y los avisos.", alinear="justificado")
        I.tabla(["#", "Comprobación", "Resultado"], [[str(i + 1), r["nombre"], "Aprobada" if r["ok"] else "FALLÓ"] for i, r in enumerate(datos["resultados"])],
                [1, 12.5, 3.5], tam=8.5, alinear=["c", "l", "c"], leyenda="Resultado de la prueba de humo.")
    else:
        I.nota("**Pendiente:** la prueba de humo (`npm run humo`) recorre los flujos de cada rol contra el aplicativo en ejecución. "
               "Se ejecuta cuando la base de datos de Supabase esté disponible y sus resultados se insertan aquí al regenerar el informe.")


# ================================================================== RENDIMIENTO
def _rendimiento(I):
    I.h1("10. Rendimiento")
    I.p("La base de datos está en la región **ca-central-1 (Canadá)** y los usuarios están en Pasto, Colombia. Medido desde Colombia, cada "
        "consulta tarda **alrededor de 0,5 s** (una conexión fría, 1,3 s); cinco consultas en serie tardan 2,6 s. Esa latencia es la causa "
        "dominante del tiempo de respuesta, por lo que las mejoras se centraron en **hacer menos consultas**:", alinear="justificado")
    I.vinetas([
        "**Caché por etiquetas** (`unstable_cache`) para listados, portada, directorio y animales en resguardo; se invalida en cada escritura.",
        "**Consultas en paralelo** en los paneles y en el detalle del reporte.",
        "**Sesión ligera:** el menú lee solo la cookie firmada, sin consultar la base en cada navegación.",
        "**Conexión anticipada** a la base de datos al arrancar el servidor.",
        "**Campana de alertas diferida:** espera 1,5 s tras cargar la página, consulta cada 2 minutos y se pausa con la pestaña oculta.",
        "**Esqueletos de carga** (`loading.tsx`) para que la interfaz responda al instante mientras llegan los datos.",
    ])
    I.tabla(["Tipo de página", "Tiempo de respuesta medido (servidor de desarrollo, con caché caliente)"],
            [["Portada, listado, «Dónde acudir», detalle de reporte", "0,06 – 0,12 s"],
             ["Paneles con sesión (dos rondas de consultas)", "0,6 – 0,85 s"],
             ["Primera carga de una página (caché fría)", "1,1 – 2,8 s"]],
            [8, 9], tam=9.5, leyenda="Tiempos de respuesta medidos el 26/10/2026.")
    I.nota("**Recomendación para producción:** mover el proyecto de Supabase a la región de São Paulo (`sa-east-1`) reduciría cada consulta "
           "de ~0,5 s a ~0,1 s, la mejora más grande disponible. No se aplicó por decisión del equipo; queda documentada como limitación.")


# ======================================================================= MANUAL
def _manual(I):
    I.h1("11. Manual de uso por rol")
    I.p("PetMatch se usa **sin cuenta** para publicar y buscar; las cuentas aportan funciones adicionales. Esta sección resume qué puede hacer cada rol.",
        alinear="justificado")
    I.tabla(["Rol", "Cómo entra", "Qué puede hacer"],
            [["Visitante", "Sin sesión", "Publicar mascota perdida o encontrada; buscar y filtrar reportes; ordenar por fecha; chatear en un reporte; crear una placa con QR; consultar «Dónde acudir» y «Animales en resguardo»; compartir un reporte."],
             ["Ciudadano", "/cuenta/login", "Todo lo del visitante, más: renovar, editar, eliminar y cerrar sus reportes; editar sus placas; avisos de cercanía por zona y radio; recordatorios de «¿Sigue perdida?»."],
             ["Veterinaria", "/cuenta/login", "Ver todos los reportes (solo lectura); llevar el carnet de vacunas de las mascotas; aparecer en «Dónde acudir»."],
             ["Refugio", "/cuenta/login", "Publicar animales en resguardo y marcarlos como entregados; aparecer en «Dónde acudir»."],
             ["Administrador", "/admin/login", "Editar, cerrar, reabrir y eliminar cualquier reporte; ver indicadores por especie, zona y tiempo."]],
            [2.6, 3, 11.4], tam=9, leyenda="Roles y funciones.")
    pantallas = [
        ("inicio", "Portada de PetMatch."), ("inicio-2", "Portada: reportes recientes."), ("inicio-3", "Portada: cómo funciona y llamada a la acción."),
        ("perdida-formulario", "Reportar una mascota perdida: datos, foto, mapa y contacto."), ("encontrada-formulario", "Reportar una mascota encontrada."),
        ("reportes-listado", "Listado de reportes con filtros y orden por fecha (HU-6 y HU-27)."),
        ("reporte-detalle", "Detalle de un reporte: alertas, chat, compartir y contacto."),
        ("placa", "Placa imprimible con código QR (HU-8)."),
        ("perfil-mascota", "Perfil público de una mascota, al escanear el QR de su placa (HU-9)."),
        ("donde-acudir", "«Dónde acudir»: veterinarias y refugios por cercanía (HU-18)."),
        ("resguardo", "Animales en resguardo de los refugios (HU-20)."),
        ("registro", "Crear cuenta: ciudadano, veterinaria o refugio."),
        ("panel-ciudadano", "Panel del ciudadano: mis reportes, mis placas y avisos de cercanía."),
        ("panel-veterinaria", "Panel de la veterinaria: directorio y carnet de vacunas."),
        ("panel-refugio", "Panel del refugio: animales en resguardo."),
        ("admin-panel", "Panel del administrador."), ("admin-indicadores", "Indicadores: brecha entre perros y gatos (HU-22)."),
        ("movil-inicio", "Versión móvil (390 px): portada."), ("movil-reporte", "Versión móvil: detalle de un reporte."),
        ("movil-login", "Versión móvil: inicio de sesión."),
    ]
    existen = [p for p in pantallas if os.path.exists(capt(p[0]))]
    if existen:
        I.nota("Las capturas se tomaron con Microsoft Edge (escritorio 1366×900 y móvil 390×844) sobre el aplicativo compilado para producción y "
               "datos de demostración (`npm run demo`). Las fotografías de las mascotas son ilustraciones propias del proyecto, no imágenes de terceros.")
        for nombre, leyenda in existen:
            I.figura(capt(nombre), leyenda, ancho_cm=14.0, alto_max_cm=17.0)
    else:
        I.nota("**Pendiente:** las capturas de pantalla de cada rol se generan con `npm run capturas` cuando la base de datos de Supabase está disponible.")


# =================================================================== DESPLIEGUE
def _despliegue(I):
    I.h1("12. Despliegue")
    I.p("La aplicación está **desplegada en producción** en https://proyecto-mascotas-perdidas.vercel.app (Vercel, despliegue "
        "automático desde la rama `main` del repositorio), con la base de datos en Supabase y las fotografías en Supabase Storage. "
        "Fecha de la verificación: 10/11/2026.", alinear="justificado")
    I.h2("12.1 Plan")
    I.vinetas([
        "**Alojamiento de la aplicación:** plataforma con soporte para Next.js 15 (por ejemplo, Vercel) o un servidor Node con `npm run build` y `npm run start`.",
        "**Base de datos:** el proyecto de Supabase existente (región `ca-central-1`, la más cercana disponible cuando se creó; su latencia se documenta en la sección de rendimiento); variables `DATABASE_URL` (pooler) y `DIRECT_URL`.",
        "**Variables de entorno:** `DATABASE_URL`, `DIRECT_URL`, `ADMIN_USUARIO`, `ADMIN_CONTRASENA`, `ADMIN_SECRETO`, `SESION_SECRETO` (ambos de 32 o más caracteres aleatorios), `ADMIN_CONTRASENA` (12 o más caracteres) y `URL_PUBLICA` (dominio https, obligatoria: la usan el QR y los enlaces al compartir). **No** definir `MOSTRAR_CUENTAS_PRUEBA`.",
        "**Fotografías:** en producción se guardan en **Supabase Storage** (bucket público `fotos`, que la aplicación crea si no existe) mediante un adaptador del puerto `AlmacenFotos`; en desarrollo siguen en `public/uploads`. Solo cambió una clase y una línea en `composicion.ts`.",
        "**Datos de prueba:** las cuentas y los datos de prueba se eliminaron de la base real antes de abrirla al público, de modo que queda lista para los registros reales; las credenciales del administrador deben ser nuevas y fuertes.",
        "**Seguridad:** ejecutar `npm run db:rls` tras sincronizar el esquema; rotar la clave pública de Supabase si estuvo expuesta.",
    ])
    I.h2("12.2 Lista de verificación")
    I.tabla(["Verificación en producción", "Resultado"],
            [["Compilación de producción en Vercel", "Aprobada (despliegue en estado Ready, menos de 1 minuto y medio)"],
             ["URL pública accesible", "Aprobada: las 7 páginas principales responden 200 en 0,2 a 1 s"],
             ["Cabeceras de seguridad y bloqueo de peticiones de otro origen", "Aprobada (CSP, HSTS, X-Frame-Options; escritura de otro origen responde 403)"],
             ["Sin cuentas ni datos de prueba visibles", "Aprobada: base de datos sin cuentas de prueba"],
             ["Inicio de sesión del administrador", "Aprobada"],
             ["Publicar un reporte con foto", "Aprobada: respuesta 201 y foto guardada en Supabase Storage"],
             ["La foto se descarga desde su URL pública", "Aprobada (200, image/png)"],
             ["Eliminar un reporte como administrador", "Aprobada"],
             ["Diagnóstico de administrador (`/api/admin/diagnostico`)", "Aprobada: base de datos y bucket de fotos en estado correcto"]],
            [8.5, 8.5], tam=9.5, leyenda="Lista de verificación del despliegue.")


# ================================================================ CONCLUSIONES
def _conclusiones(I):
    I.h1("13. Conclusiones, limitaciones y trabajo futuro")
    I.h2("13.1 Conclusiones")
    I.vinetas([
        "Se cumplió el Product Goal: PetMatch permite publicar, ubicar, comparar y reencontrar mascotas perdidas en Pasto, con 27 de 27 historias de usuario completadas.",
        "Scrum permitió ajustar el alcance con evidencia: tres historias se redefinieron (HU-7, HU-10 y HU-17) por factibilidad técnica sin perder el valor para el usuario.",
        "Separar la lógica de negocio (pura, probada) de la infraestructura facilitó cambiar de enfoque sin romper nada: la refactorización SOLID no modificó ninguna de las pruebas existentes.",
        "La latencia de la base de datos, no el código, es el principal límite de velocidad; se mitigó con caché y consultas en paralelo.",
    ])
    I.h2("13.2 Limitaciones")
    I.vinetas([
        "Los avisos son internos (campana); no hay correo ni notificaciones push. Un dueño sin sesión solo ve alertas de los reportes creados desde el mismo navegador.",
        "La coincidencia compara características (especie, color, tamaño, cercanía y señas de gato); no compara imágenes.",
        "Una foto por reporte y por mascota; fotos en disco local hasta migrar a almacenamiento en la nube.",
        "La re-difusión de reportes (HU-19) la confirma el dueño; no es automática.",
        "No hay verificación de identidad de veterinarias y refugios ni límite de intentos de inicio de sesión.",
    ])
    I.h2("13.3 Trabajo futuro")
    I.vinetas([
        "Notificaciones por correo y push, y re-difusión automática con una tarea programada.",
        "Comparación visual de fotografías mediante un modelo de reconocimiento de imágenes.",
        "Varias fotos por mascota y almacenamiento en la nube (Supabase Storage).",
        "Migrar las rutas restantes y las lecturas al patrón de puertos y adaptadores, y dividir los componentes más grandes (formulario de reporte y campana).",
        "Mover la base de datos a São Paulo; verificación de locales; aplicación móvil.",
    ])


# ===================================================================== ANEXOS
def _anexos(I, hus, rutas, paginas):
    I.h1("Anexo A. Fichas de las historias de usuario")
    I.p("Cada ficha incluye la historia, su priorización, el Sprint, los criterios de aceptación (comportamiento verificable), "
        "los archivos donde se implementa y las pruebas relacionadas. Es la trazabilidad completa entre la historia y el código.",
        alinear="justificado")
    for n in sorted(hus):
        I.h3(f"HU{n} — {hu_corto(hus[n])}")
        _ficha_tabla(I, n, hus)

    I.h1("Anexo B. Catálogo de pantallas y rutas de API")
    I.tabla(["Ruta de página"], [[p] for p in paginas], [17], tam=8.5, leyenda=f"Las {len(paginas)} pantallas de la aplicación.")
    I.tabla(["Ruta de API", "Métodos"], [[u, m] for u, m in rutas], [11, 6], tam=8.5, leyenda=f"Las {len(rutas)} rutas de la API.")

    I.h1("Anexo C. Ejecución del proyecto y cuentas de prueba")
    I.p("**Requisitos:** Node.js 18 o superior y una base de datos PostgreSQL (Supabase).", despues=2)
    I.vinetas([
        "`npm install` — instala dependencias y genera el cliente de Prisma.",
        "`cp .env.example .env` y completar las variables; `npx prisma db push` y `npm run db:rls` — crea las tablas y activa RLS.",
        "`npm run dev` — desarrollo en http://localhost:3000; `npm run build` y `npm run start` — producción.",
        "`npm test` — pruebas unitarias; `npm run cuentas:prueba` — crea las cuentas de prueba; `npm run diagramas` — regenera los diagramas.",
    ])
    I.tabla(["Rol", "Usuario", "Contraseña"],
            [["Ciudadano", "ciudadano@petmatch.test", "Prueba123"], ["Veterinaria", "veterinaria@petmatch.test", "Prueba123"],
             ["Refugio", "refugio@petmatch.test", "Prueba123"], ["Administrador", "(variables ADMIN_USUARIO y ADMIN_CONTRASENA en .env)", "—"]],
            [3, 9, 5], tam=9.5, leyenda="Cuentas de prueba para pruebas de usabilidad en un entorno local (`npm run cuentas:prueba`). No existen en producción.")

    I.h1("Anexo D. Origen de los datos del informe")
    I.p("Este documento se generó a partir del código, del repositorio y del Excel del equipo (Product Backlog y métrica ICPE). "
        "Los datos que aporta el equipo —portada, roles, responsables, impedimentos y retrospectivas— están en `informe/datos_equipo.py`. "
        "Los **tiempos del DoD son aproximados**, porque el equipo no los registró hora a hora. Para corregir cualquier dato se edita ese "
        "archivo y se regenera el informe con `python informe/generar.py`.", alinear="justificado")

    I.h1("Anexo E. Glosario")
    I.tabla(["Término", "Significado"],
            [["HU", "Historia de usuario."], ["Sprint", "Iteración de dos semanas con un objetivo (Sprint Goal)."],
             ["DoD", "Definition of Done: tareas que una historia debe cumplir para considerarse terminada."],
             ["Prioridad", "Valor × urgencia de una historia (1 a 100)."], ["Complejidad", "Estimación de esfuerzo en puntos."],
             ["RLS", "Row Level Security: seguridad por filas de PostgreSQL."], ["Puerto / Adaptador", "Interfaz que necesita la lógica / clase que la implementa con una tecnología concreta."],
             ["Haversine", "Fórmula que calcula la distancia entre dos coordenadas."], ["ICPE", "Índice de Colaboración Percibida del Equipo."]],
            [4, 13], tam=9.5, leyenda="Glosario.")
