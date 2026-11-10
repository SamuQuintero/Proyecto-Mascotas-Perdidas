# -*- coding: utf-8 -*-
"""Punto de entrada: genera el informe (Word) y el Excel de sprints.

Uso:   python informe/generar.py
Salida: informe/entrega/PetMatch - Informe del proceso.docx
        informe/entrega/PetMatch - Product Backlog y Sprints.xlsx
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import generar_excel  # noqa: E402
import generar_word  # noqa: E402

ENTREGA = os.path.join(os.path.dirname(__file__), "entrega")

if __name__ == "__main__":
    os.makedirs(ENTREGA, exist_ok=True)
    print(generar_excel.generar(os.path.join(ENTREGA, "PetMatch - Product Backlog y Sprints.xlsx")))
    print(generar_word.construir(os.path.join(ENTREGA, "PetMatch - Informe del proceso.docx")))
