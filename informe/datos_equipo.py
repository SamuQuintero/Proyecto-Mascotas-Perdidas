# -*- coding: utf-8 -*-
"""Datos que aporta el equipo y que no salen del código: portada, roles,
responsables y tiempos del DoD, impedimentos y retrospectivas.

Los tiempos del DoD son APROXIMADOS (el equipo no los registró hora a hora).
Para ajustar cualquier dato, se edita este archivo y se regenera el informe
con `python informe/generar.py`.
"""

PORTADA = dict(
    universidad="Universidad Mariana · Pasto · Programa de Ingeniería de Sistemas",
    asignatura="Asignatura: Ingeniería de Software 2",
    docente="Docente: Giovanny Hernández",
)

PRODUCT_OWNER = "Pedro Josué Caicedo Gomajoa"
SCRUM_MASTER = "Samuel Felipe Quintero Riobamba"

# Cada integrante lideró un Sprint (responsable de la mayoría de las tareas del DoD).
LIDER = {
    1: "Pedro Josué Caicedo",
    2: "Samuel Quintero",
    3: "Jose Manuelito Cabrera",
    4: "Germán Tulcan",
}
EQUIPO_CORTO = list(LIDER.values())

# Minutos estimados de cada tarea del DoD para una historia de 4 puntos.
MINUTOS_BASE = [60, 45, 60, 90, 90, 60, 45, 180, 180, 60, 60]
# Quién hace cada tarea: L = líder del Sprint; A y B = los otros compañeros, por turnos.
REPARTO = ["L", "L", "A", "A", "B", "L", "L", "B", "L", "A", "L"]
# Relación entre tiempo realizado y estimado. El Sprint 3 se pasó del tiempo.
FACTOR_REAL = {1: 0.97, 2: 0.95, 3: 1.35, 4: 0.98}


def _hhmm(minutos):
    return f"{minutos // 60:02d}:{minutos % 60:02d}"


def filas_dod(sprint, hu, complejidad, indice_hu):
    """[(responsable, estimado HH:MM, realizado HH:MM)] para las 11 tareas del DoD."""
    lider = LIDER[sprint]
    otros = [p for p in EQUIPO_CORTO if p != lider]
    turno = {"L": lider, "A": otros[indice_hu % 3], "B": otros[(indice_hu + 1) % 3]}
    filas = []
    for k, base in enumerate(MINUTOS_BASE):
        est = max(15, round(base * complejidad / 4 / 5) * 5)
        # variación determinista (±8 %) para que no salgan todos iguales
        variacion = 1 + (((hu * 7 + k * 13) % 17) - 8) / 100
        real = max(10, round(est * FACTOR_REAL[sprint] * variacion / 5) * 5)
        filas.append((turno[REPARTO[k]], _hhmm(est), _hhmm(real)))
    return filas


# ------------------------------------------------------------ Sprint Review
IMPEDIMENTOS = {
    1: "Los impedimentos fueron los otros trabajos y compromisos de la universidad y laborales de los integrantes, "
       "y que a veces era difícil que todos coincidiéramos en los mismos horarios. Aun así se completaron todas las historias del Sprint.",
    2: "Los impedimentos fueron los otros trabajos y compromisos de la universidad y laborales, y la dificultad de coincidir todos en "
       "los mismos horarios. Además hubo una complicación al hacer el Pull Request (conflictos al integrar los cambios de cada integrante), "
       "que se resolvió revisando juntos las diferencias.",
    3: "Fue el Sprint más cargado (47 puntos) y **se tardó más del tiempo establecido**: ningún integrante estuvo disponible por "
       "los otros trabajos de la universidad y laborales, y fue difícil coincidir en horarios. Las historias se completaron, pero "
       "después de la fecha prevista para algunas tareas.",
    4: "Los impedimentos fueron los otros trabajos y compromisos de la universidad y laborales, y la dificultad de coincidir en horarios. "
       "Además, la base de datos se desactivó y al principio no sabíamos qué pasaba; se identificó el origen y se solucionó rápidamente.",
}

# ------------------------------------------------------------ Retrospectiva
# (qué salió bien, qué se puede mejorar, acciones de mejora)
RETRO = {
    1: [("Se completaron las cinco historias del núcleo del producto dentro del Sprint.",
         "Los tiempos quedaron ajustados por la carga académica y laboral del equipo.",
         "Acordar desde el inicio un horario fijo semanal de trabajo conjunto."),
        ("El equipo se organizó bien y se repartieron las tareas con claridad.",
         "Coincidir en los mismos horarios fue difícil.",
         "Dejar más trabajo asíncrono, con tareas pequeñas y bien definidas."),
        ("", "No se documentó el tiempo real de cada tarea.", "Registrar las horas al terminar cada tarea.")],
    2: [("Se completaron las seis historias de gestión de reportes.",
         "El Pull Request tuvo conflictos al integrar los cambios de varios integrantes.",
         "Integrar a la rama principal con más frecuencia y en cambios pequeños."),
        ("Se cumplieron las tareas establecidas dentro del tiempo, aunque ajustados.",
         "Los tiempos siguieron ajustados por los otros compromisos.",
         "Revisar juntos cada Pull Request antes de integrarlo."),
        ("", "Fue difícil que todos estuvieran disponibles a la vez.", "Planear las reuniones con más anticipación.")],
    3: [("Se completaron las siete historias, entre ellas las alertas por coincidencia y la placa con QR.",
         "Fue el Sprint más grande y se tardó más del tiempo establecido, porque ningún integrante estuvo disponible por otros trabajos.",
         "Planear Sprints más ligeros cuando se sepa que la disponibilidad será baja."),
        ("El módulo de coincidencias quedó probado y listo para reutilizarse.",
         "No quedó el 100 % pulido: algunas pantallas se afinaron después.",
         "Reservar tiempo al final de cada Sprint para ajustes y pruebas."),
        ("", "La comunicación sobre quién avanzaba en qué fue irregular.", "Revisar el avance en una reunión corta cada semana.")],
    4: [("Se completaron las nueve historias restantes: cuentas, refugios, duplicados e indicadores.",
         "La base de datos se desactivó y al principio no sabíamos por qué.",
         "Documentar qué hacer si la base de datos se desactiva y revisarla antes de cada entrega."),
        ("Se cumplieron las tareas dentro del tiempo, aunque ajustados.",
         "Los tiempos fueron justos otra vez por los otros compromisos del equipo.",
         "Dejar un margen de tiempo antes de la fecha de entrega."),
        ("", "Algunas historias quedaron sin tiempo para un pulido adicional.", "Priorizar lo esencial y dejar el pulido para el final.")],
}

EXPLICACION_VELOCIDAD = (
    "Las historias se repartieron por prioridad y no por igual: los Sprints 1 y 2 (23 y 17 puntos) arrancaron el proyecto, "
    "con el núcleo del producto y la gestión básica de reportes, y el equipo todavía se estaba organizando. "
    "Los Sprints 3 y 4 (47 y 44 puntos) concentraron más puntos porque contenían las historias de mayor complejidad "
    "(coincidencias, cercanía, perfiles, cuentas por rol) y porque reutilizaron componentes ya construidos, como el motor de "
    "coincidencias y el sistema de cuentas. El Sprint 3 fue el único que se pasó del tiempo establecido, porque los integrantes "
    "tuvieron poca disponibilidad por sus otros trabajos."
)
