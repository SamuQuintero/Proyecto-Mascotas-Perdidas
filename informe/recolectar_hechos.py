# -*- coding: utf-8 -*-
"""Mide el proyecto y guarda informe/datos/hechos.json: número de pruebas por
archivo, cobertura y tamaño del código. Lo usa el informe, para que las cifras
salgan del código y no estén escritas a mano.

Uso: python informe/recolectar_hechos.py
"""

import json
import os
import subprocess
import sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SALIDA = os.path.join(os.path.dirname(__file__), "datos", "hechos.json")
SRC = os.path.join(RAIZ, "src")


def ejecutar_pruebas():
    informe = os.path.join(RAIZ, "coverage", "resultado.json")
    os.makedirs(os.path.dirname(informe), exist_ok=True)
    subprocess.run(
        "npx vitest run --coverage --coverage.reporter=json-summary --coverage.include=src/lib/** "
        "--coverage.include=src/servicios/** --coverage.exclude=**/*.test.ts "
        f"--reporter=json --outputFile=\"{informe}\"",
        cwd=RAIZ, shell=True, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    datos = json.load(open(informe, encoding="utf-8"))
    por_archivo = {}
    for r in datos["testResults"]:
        nombre = os.path.relpath(r["name"], RAIZ).replace(os.sep, "/")
        por_archivo[nombre] = len(r["assertionResults"])
    fallidas = datos["numFailedTests"]
    if fallidas:
        sys.exit(f"Hay {fallidas} pruebas fallidas: no se actualiza hechos.json.")
    resumen = json.load(open(os.path.join(RAIZ, "coverage", "coverage-summary.json"), encoding="utf-8"))["total"]
    cobertura = {k: round(resumen[k]["pct"], 2) for k in ("lines", "statements", "functions", "branches")}
    return dict(sorted(por_archivo.items())), cobertura, datos["numTotalTests"]


def lineas(ruta):
    with open(ruta, encoding="utf-8") as f:
        return sum(1 for _ in f)


def recorrer():
    codigo, pruebas = [], []
    for base, _, archivos in os.walk(SRC):
        for a in archivos:
            if a.endswith((".ts", ".tsx")):
                (pruebas if a.endswith(".test.ts") else codigo).append(os.path.join(base, a))
    return codigo, pruebas


def main():
    por_archivo, cobertura, total = ejecutar_pruebas()
    codigo, pruebas = recorrer()
    paginas = sum(1 for f in codigo if os.path.basename(f) == "page.tsx")
    rutas = sum(1 for f in codigo if os.path.basename(f) == "route.ts" and os.sep + "api" + os.sep in f)
    componentes = sum(1 for f in codigo if os.path.dirname(f) == os.path.join(SRC, "components"))
    hechos = dict(
        por_archivo=por_archivo, cobertura=cobertura, total_pruebas=total,
        codigo_archivos=len(codigo), codigo_lineas=sum(lineas(f) for f in codigo),
        pruebas_archivos=len(pruebas), pruebas_lineas=sum(lineas(f) for f in pruebas),
        paginas=paginas, rutas_api=rutas, componentes=componentes,
    )
    with open(SALIDA, "w", encoding="utf-8") as f:
        json.dump(hechos, f, ensure_ascii=False, indent=1)
    print(f"{total} pruebas · cobertura {cobertura} · {hechos['codigo_archivos']} archivos / {hechos['codigo_lineas']} líneas")


if __name__ == "__main__":
    main()
