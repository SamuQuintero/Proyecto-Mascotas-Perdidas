# -*- coding: utf-8 -*-
"""Lee las fuentes reales del proyecto (Excel del equipo, esquema de Prisma,
rutas, package.json, git y pruebas) para que el informe no dependa de cifras
escritas a mano."""

import glob
import json
import os
import re
import subprocess

import openpyxl

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EXCEL_EQUIPO = os.path.join(os.path.dirname(__file__), "datos", "Product Backlog del equipo.xlsx")

from contenido_hu import COMPLETADAS_DESPUES, HU_EXTRA, SPRINTS  # noqa: E402


def _limpiar(t):
    return (t or "").replace('"', "").strip()


def cargar_backlog():
    """Devuelve {n: {rol, quiero, para, valor, urgencia, complejidad}} (HU 1-27)."""
    wb = openpyxl.load_workbook(EXCEL_EQUIPO, data_only=True)
    ws = wb["Historias de usuario"]
    hus = {}
    for fila in ws.iter_rows(min_row=2, values_only=True):
        if fila[0] is None:
            continue
        n = int(fila[0])
        partes = [_limpiar(x) for x in str(fila[1]).split("\n") if x.strip()]
        rol = re.sub(r"^Como\s+", "", partes[0], flags=re.I)
        quiero = re.sub(r"^Quiero\s+", "", partes[1], flags=re.I) if len(partes) > 1 else ""
        para = re.sub(r"^Para\s+", "", partes[2], flags=re.I) if len(partes) > 2 else ""
        hus[n] = dict(rol=rol, quiero=quiero, para=para, valor=int(fila[2]), urgencia=int(fila[3]),
                      complejidad=int(fila[5]))
    # Redacción: errata evidente de la hoja («la rasa el tipo»).
    if 4 in hus:
        hus[4]["quiero"] = hus[4]["quiero"].replace("la rasa el tipo", "la raza y el tipo")
    for n, d in HU_EXTRA.items():
        hus.setdefault(n, dict(d))
    for n, h in hus.items():
        h["prioridad"] = h["valor"] * h["urgencia"]
    return hus


def cargar_icpe():
    wb = openpyxl.load_workbook(EXCEL_EQUIPO, data_only=False)
    return wb  # solo para consulta puntual; ver datos_icpe()


def datos_icpe():
    ruta = os.path.join(os.path.dirname(__file__), "datos", "Metrica ICPE del equipo.xlsx")
    wb = openpyxl.load_workbook(ruta, data_only=True)
    ws = wb.active
    filas = []
    for r in ws.iter_rows(min_row=3, max_row=10, values_only=True):
        if r[0]:
            filas.append((str(r[0]).strip(), r[1], r[2], r[3]))
    n = len(filas)
    iap = sum(f[1] for f in filas) / (5 * n)
    iab = sum(f[2] for f in filas) / (5 * n)
    ipa = sum(f[3] for f in filas) / (5 * n)
    return filas, iap, iab, ipa, (iap + iab + ipa) / 3


def estado_sprint(n, hus):
    """Calcula, para el sprint n, qué se planeó y qué se completó dentro del sprint."""
    plan = SPRINTS[n]["hus"]
    completadas = []
    trasladadas = []
    for h in plan:
        destino = COMPLETADAS_DESPUES.get(h)
        # Una HU planeada en el sprint n, completada en otro: no cuenta en n
        # salvo que n sea el sprint en que se completó.
        if destino is None:
            completadas.append(h)
        elif destino[0] == n:
            completadas.append(h)
        else:
            trasladadas.append(h)
    # En el Sprint 4 se completan las trasladadas de otros sprints que cerraron aquí.
    puntos = lambda lst: sum(hus[x]["complejidad"] for x in lst)
    return dict(plan=plan, completadas=completadas, trasladadas=trasladadas,
                pts_plan=puntos(plan), pts_hechos=puntos(completadas))


def sprint_de_cierre(hu):
    """Sprint en el que realmente se completó una HU (o 'cierre')."""
    if hu in COMPLETADAS_DESPUES:
        return COMPLETADAS_DESPUES[hu][0]
    for n, s in SPRINTS.items():
        if hu in s["hus"]:
            return n
    return None


# ------------------------------------------------------------------ Prisma
def cargar_esquema():
    txt = open(os.path.join(RAIZ, "prisma", "schema.prisma"), encoding="utf-8").read()
    enums = {}
    for m in re.finditer(r"enum\s+(\w+)\s*\{([^}]*)\}", txt):
        vals = [l.strip() for l in m.group(2).split("\n") if l.strip() and not l.strip().startswith("//")]
        enums[m.group(1)] = vals
    modelos = {}
    for m in re.finditer(r"model\s+(\w+)\s*\{(.*?)\n\}", txt, flags=re.S):
        campos, indices = [], []
        for linea in m.group(2).split("\n"):
            s = linea.strip()
            if not s or s.startswith("//"):
                continue
            if s.startswith("@@index"):
                indices.append(re.search(r"\[(.*?)\]", s).group(1))
                continue
            if s.startswith("@@"):
                continue
            partes = s.split("//")[0].split()
            if len(partes) < 2:
                continue
            nombre, tipo, resto = partes[0], partes[1], " ".join(partes[2:])
            campos.append(dict(nombre=nombre, tipo=tipo, resto=resto))
        modelos[m.group(1)] = dict(campos=campos, indices=indices)
    return enums, modelos


# ------------------------------------------------------------- Rutas y páginas
def cargar_rutas_api():
    rutas = []
    base = os.path.join(RAIZ, "src", "app", "api")
    for f in sorted(glob.glob(os.path.join(base, "**", "route.ts"), recursive=True)):
        rel = os.path.relpath(os.path.dirname(f), os.path.join(RAIZ, "src", "app")).replace("\\", "/")
        url = "/" + rel
        txt = open(f, encoding="utf-8").read()
        metodos = re.findall(r"export async function (GET|POST|PATCH|PUT|DELETE)", txt)
        rutas.append((url, ", ".join(metodos)))
    return rutas


def cargar_paginas():
    paginas = []
    base = os.path.join(RAIZ, "src", "app")
    for f in sorted(glob.glob(os.path.join(base, "**", "page.tsx"), recursive=True)):
        rel = os.path.relpath(os.path.dirname(f), base).replace("\\", "/")
        paginas.append("/" if rel == "." else "/" + rel)
    return paginas


def _version_instalada(nombre, declarada):
    """Versión realmente instalada (node_modules); si no se puede leer, la declarada."""
    ruta = os.path.join(RAIZ, "node_modules", *nombre.split("/"), "package.json")
    try:
        return json.load(open(ruta, encoding="utf-8"))["version"]
    except (OSError, KeyError, ValueError):
        return declarada.lstrip("^~")


def cargar_dependencias():
    pj = json.load(open(os.path.join(RAIZ, "package.json"), encoding="utf-8"))
    deps = {k: _version_instalada(k, v) for k, v in pj.get("dependencies", {}).items()}
    dev = {k: _version_instalada(k, v) for k, v in pj.get("devDependencies", {}).items()}
    return deps, dev, pj.get("scripts", {})


def hechos():
    return json.load(open(os.path.join(os.path.dirname(__file__), "datos", "hechos.json"), encoding="utf-8"))


def git_stats():
    def run(*args):
        return subprocess.run(["git", *args], cwd=RAIZ, capture_output=True, text=True, encoding="utf-8").stdout
    autores = {}
    for l in run("log", "--all", "--format=%an").splitlines():
        autores[l] = autores.get(l, 0) + 1
    total = int(run("rev-list", "--all", "--count").strip() or 0)
    return autores, total
