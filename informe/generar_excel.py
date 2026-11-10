# -*- coding: utf-8 -*-
"""Genera el Excel consolidado: Product Backlog final (27 HU), planificación y
resultado de cada sprint, plantilla de tiempos del DoD y la métrica ICPE."""

import os

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

import datos_equipo as EQ
from contenido_hu import COMPLETADAS_DESPUES, POR_QUE, SPRINTS, TAREAS_DOD
from datos_proyecto import cargar_backlog, datos_icpe, estado_sprint, sprint_de_cierre

LAVANDA = "46299A"
ZEBRA = "F5F2FF"
AMARILLO = "FFF3CC"
fino = Side(style="thin", color="C9C4D8")
BORDE = Border(left=fino, right=fino, top=fino, bottom=fino)


def _encabezado(ws, fila, titulos, anchos):
    for i, t in enumerate(titulos, 1):
        c = ws.cell(row=fila, column=i, value=t)
        c.font = Font(bold=True, color="FFFFFF", name="Calibri", size=11)
        c.fill = PatternFill("solid", fgColor=LAVANDA)
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BORDE
        ws.column_dimensions[get_column_letter(i)].width = anchos[i - 1]
    ws.row_dimensions[fila].height = 32
    ws.freeze_panes = ws.cell(row=fila + 1, column=1)


def _estilo_fila(ws, fila, ncols, zebra=False, centradas=()):
    for i in range(1, ncols + 1):
        c = ws.cell(row=fila, column=i)
        c.border = BORDE
        c.font = Font(name="Calibri", size=10)
        c.alignment = Alignment(
            vertical="top", wrap_text=True, horizontal="center" if i in centradas else "left"
        )
        if zebra:
            c.fill = PatternFill("solid", fgColor=ZEBRA)


def generar(ruta_salida):
    hus = cargar_backlog()
    wb = Workbook()

    # ---------------------------------------------------------- Historias
    ws = wb.active
    ws.title = "Historias de usuario"
    _encabezado(ws, 1, ["No", "Historia de usuario", "Valor para el cliente", "Urgencia", "Prioridad (V×U)",
                        "Complejidad", "Sprint", "Estado"], [6, 95, 12, 11, 13, 13, 13, 22])
    for k, n in enumerate(sorted(hus)):
        h = hus[n]
        fila = k + 2
        ws.cell(fila, 1, n)
        ws.cell(fila, 2, f"Como {h['rol']}\nQuiero {h['quiero']}\nPara {h['para']}")
        ws.cell(fila, 3, h["valor"])
        ws.cell(fila, 4, h["urgencia"])
        ws.cell(fila, 5, f"=C{fila}*D{fila}")
        ws.cell(fila, 6, h["complejidad"])
        cierre = sprint_de_cierre(n)
        ws.cell(fila, 7, "Cierre" if cierre == "cierre" else cierre)
        ws.cell(fila, 8, "Completada")
        _estilo_fila(ws, fila, 8, zebra=k % 2 == 1, centradas=(1, 3, 4, 5, 6, 7, 8))
        ws.row_dimensions[fila].height = 48
    ultima = len(hus) + 1
    ws.cell(ultima + 2, 2, "Total de puntos de complejidad").font = Font(bold=True)
    ws.cell(ultima + 2, 6, f"=SUM(F2:F{ultima})").font = Font(bold=True)
    ws.cell(ultima + 3, 2, "Historias completadas").font = Font(bold=True)
    ws.cell(ultima + 3, 6, f'=COUNTIF(H2:H{ultima},"Completada")').font = Font(bold=True)

    # -------------------------------------------------------- Planificación
    wp = wb.create_sheet("Planificación de Sprints")
    _encabezado(wp, 1, ["Sprint", "HU", "Historia (resumen)", "Prioridad", "Complejidad",
                        "Por qué va en este sprint", "Resultado"], [9, 9, 52, 11, 13, 62, 40])
    fila = 2
    for n, s in SPRINTS.items():
        for hu in s["hus"]:
            h = hus[hu]
            fila_hu = hu + 1  # la hoja de historias está ordenada por número
            wp.cell(fila, 1, n)
            wp.cell(fila, 2, f"HU-{hu}")
            wp.cell(fila, 3, h["quiero"][0].upper() + h["quiero"][1:])
            wp.cell(fila, 4, f"='Historias de usuario'!E{fila_hu}")
            wp.cell(fila, 5, f"='Historias de usuario'!F{fila_hu}")
            wp.cell(fila, 6, POR_QUE.get(hu, ""))
            destino = COMPLETADAS_DESPUES.get(hu)
            if destino is None or destino[0] == n:
                res = "Completada en el sprint"
            elif destino[0] == "cierre":
                res = "Trasladada al cierre del proyecto (completada el 09/11/2026)"
            else:
                res = f"Trasladada al Sprint {destino[0]}"
            wp.cell(fila, 7, res)
            _estilo_fila(wp, fila, 7, zebra=n % 2 == 0, centradas=(1, 2, 4, 5))
            fila += 1

    # ------------------------------------------------------------- Resumen
    wr = wb.create_sheet("Resumen por sprint")
    _encabezado(wr, 1, ["Sprint", "Inicio", "Fin", "Sprint Goal", "HU planeadas", "Puntos planeados",
                        "HU completadas en el sprint", "Puntos completados", "% de puntos"],
                [9, 12, 12, 70, 12, 13, 16, 14, 11])
    for n, s in SPRINTS.items():
        e = estado_sprint(n, hus)
        r = n + 1
        wr.cell(r, 1, n)
        wr.cell(r, 2, s["inicio"])
        wr.cell(r, 3, s["fin"])
        wr.cell(r, 4, s["meta"])
        wr.cell(r, 5, f'=COUNTIF(\'Planificación de Sprints\'!A:A,{n})')
        wr.cell(r, 6, f'=SUMIF(\'Planificación de Sprints\'!A:A,{n},\'Planificación de Sprints\'!E:E)')
        wr.cell(r, 7, f'=COUNTIFS(\'Planificación de Sprints\'!A:A,{n},\'Planificación de Sprints\'!G:G,"Completada*")')
        wr.cell(r, 8, f'=SUMIFS(\'Planificación de Sprints\'!E:E,\'Planificación de Sprints\'!A:A,{n},\'Planificación de Sprints\'!G:G,"Completada*")')
        wr.cell(r, 9, f"=H{r}/F{r}")
        wr.cell(r, 9).number_format = "0%"
        _estilo_fila(wr, r, 9, zebra=n % 2 == 0, centradas=(1, 2, 3, 5, 6, 7, 8, 9))
        wr.row_dimensions[r].height = 46
    wr.cell(7, 4, "Total").font = Font(bold=True)
    for col in "EFGH":
        wr[f"{col}7"] = f"=SUM({col}2:{col}5)"
        wr[f"{col}7"].font = Font(bold=True)
        wr[f"{col}7"].alignment = Alignment(horizontal="center")
    wr.cell(9, 1, "Nota: los Sprints 1 y 2 salen del Excel del equipo; los Sprints 3 y 4 reparten el resto de las historias "
                  "por prioridad (valor × urgencia) y dependencias. ")
    wr.cell(9, 1).font = Font(italic=True, size=9)

    # ------------------------------------------------------------ DoD tiempos
    wd = wb.create_sheet("DoD y tiempos")
    _encabezado(wd, 1, ["Sprint", "Id-HU", "Tarea", "Responsable", "Tiempo estimado (HH:MM)", "Tiempo realizado (HH:MM)"],
                [9, 9, 42, 28, 20, 20])
    fila = 2
    for n, s in SPRINTS.items():
        for i, hu in enumerate(s["hus"]):
            dod = EQ.filas_dod(n, hu, hus[hu]["complejidad"], i)
            for k, t in enumerate(TAREAS_DOD):
                wd.cell(fila, 1, n)
                wd.cell(fila, 2, f"HU{hu}")
                wd.cell(fila, 3, t)
                wd.cell(fila, 4, dod[k][0])
                wd.cell(fila, 5, dod[k][1])
                wd.cell(fila, 6, dod[k][2])
                _estilo_fila(wd, fila, 6, zebra=hu % 2 == 0, centradas=(1, 2, 5, 6))
                fila += 1
    wd.cell(fila + 1, 3, "Los tiempos son aproximados (el equipo no los registró hora a hora).").font = Font(italic=True, size=9)

    # ---------------------------------------------------------------- ICPE
    wi = wb.create_sheet("Métrica ICPE")
    filas, iap, iab, ipa, icpe = datos_icpe()
    _encabezado(wi, 1, ["Integrante", "¿Cuánto apoyo recibí de mis compañeros cuando tuve dificultades?",
                        "¿Cuánto apoyo brindé a mis compañeros durante el Sprint?",
                        "¿Qué tan activamente participé en las actividades del equipo?"], [38, 30, 30, 30])
    for k, f in enumerate(filas):
        for j, v in enumerate(f, 1):
            wi.cell(k + 2, j, v)
        _estilo_fila(wi, k + 2, 4, zebra=k % 2 == 1, centradas=(2, 3, 4))
    n = len(filas)
    ult = n + 1
    etiquetas = [("Índice de Apoyo Recibido (IAP)", f"=SUM(B2:B{ult})/(5*COUNTA(A2:A{ult}))"),
                 ("Índice de Apoyo Brindado (IAB)", f"=SUM(C2:C{ult})/(5*COUNTA(A2:A{ult}))"),
                 ("Índice de Participación Activa", f"=SUM(D2:D{ult})/(5*COUNTA(A2:A{ult}))"),
                 ("Índice de Colaboración Percibida del Equipo (ICPE)", f"=AVERAGE(B{ult + 2}:B{ult + 4})")]
    for k, (e, f) in enumerate(etiquetas):
        wi.cell(ult + 2 + k, 1, e).font = Font(bold=True)
        wi.cell(ult + 2 + k, 2, f).number_format = "0.00"

    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    wb.save(ruta_salida)
    return ruta_salida


if __name__ == "__main__":
    print(generar(os.path.join(os.path.dirname(__file__), "entrega", "PetMatch - Product Backlog y Sprints.xlsx")))
