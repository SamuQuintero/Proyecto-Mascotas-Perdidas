# -*- coding: utf-8 -*-
"""Gráficas del informe (matplotlib) con la paleta de PetMatch."""

import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

from contenido_hu import SPRINTS  # noqa: E402
from datos_proyecto import cargar_backlog, estado_sprint  # noqa: E402

CORAL, LAVANDA, MENTA, TINTA, GRIS = "#FF6B45", "#6841E3", "#14AD84", "#1C1829", "#C9C4D8"
DIR = os.path.join(os.path.dirname(__file__), "img")


def _estilo():
    plt.rcParams.update({
        "font.family": "DejaVu Sans", "font.size": 10, "axes.edgecolor": GRIS,
        "axes.labelcolor": TINTA, "xtick.color": TINTA, "ytick.color": TINTA,
        "axes.spines.top": False, "axes.spines.right": False,
    })


def velocidad():
    """Puntos planeados vs completados dentro de cada sprint."""
    _estilo()
    os.makedirs(DIR, exist_ok=True)
    hus = cargar_backlog()
    etiquetas = [f"Sprint {n}" for n in SPRINTS]
    plan = [estado_sprint(n, hus)["pts_plan"] for n in SPRINTS]
    hechos = [estado_sprint(n, hus)["pts_hechos"] for n in SPRINTS]
    x = range(len(etiquetas))
    fig, ax = plt.subplots(figsize=(7.2, 3.6), dpi=170)
    ax.bar([i - 0.2 for i in x], plan, 0.4, label="Puntos planeados", color=GRIS)
    ax.bar([i + 0.2 for i in x], hechos, 0.4, label="Puntos completados en el sprint", color=LAVANDA)
    for i, (p, h) in enumerate(zip(plan, hechos)):
        ax.text(i - 0.2, p + 1, str(p), ha="center", fontsize=9)
        ax.text(i + 0.2, h + 1, str(h), ha="center", fontsize=9, color=LAVANDA, fontweight="bold")
    ax.set_xticks(list(x))
    ax.set_xticklabels(etiquetas)
    ax.set_ylabel("Puntos de complejidad")
    ax.set_title("Velocidad por sprint", fontweight="bold", color=TINTA)
    ax.legend(frameon=False, loc="upper left")
    ax.set_ylim(0, max(plan) * 1.18)
    fig.tight_layout()
    ruta = os.path.join(DIR, "velocidad.png")
    fig.savefig(ruta)
    plt.close(fig)
    return ruta


def burnup():
    """Puntos completados acumulados frente al total del backlog."""
    _estilo()
    hus = cargar_backlog()
    total = sum(h["complejidad"] for h in hus.values())
    acumulado, suma = [0], 0
    for n in SPRINTS:
        suma += estado_sprint(n, hus)["pts_hechos"]
        acumulado.append(suma)
    etiquetas = ["Inicio", "S1", "S2", "S3", "S4"]
    fig, ax = plt.subplots(figsize=(7.2, 3.6), dpi=170)
    ax.plot(etiquetas, acumulado, marker="o", color=MENTA, linewidth=2.6, label="Puntos completados (acumulado)")
    ax.axhline(total, color=CORAL, linestyle="--", linewidth=1.6, label=f"Alcance total: {total} puntos")
    for i, v in enumerate(acumulado):
        ax.text(i, v + 3, str(v), ha="center", fontsize=9)
    ax.set_ylabel("Puntos de complejidad")
    ax.set_title("Avance acumulado del producto (burn-up)", fontweight="bold", color=TINTA)
    ax.legend(frameon=False, loc="lower right")
    ax.set_ylim(0, total * 1.15)
    fig.tight_layout()
    ruta = os.path.join(DIR, "burnup.png")
    fig.savefig(ruta)
    plt.close(fig)
    return ruta


def prioridad():
    """Distribución de las 27 historias por prioridad (valor × urgencia)."""
    _estilo()
    hus = cargar_backlog()
    orden = sorted(hus, key=lambda n: -hus[n]["prioridad"])
    fig, ax = plt.subplots(figsize=(7.2, 4.4), dpi=170)
    colores = [CORAL if hus[n]["prioridad"] >= 60 else LAVANDA if hus[n]["prioridad"] >= 30 else MENTA for n in orden]
    ax.barh([f"HU-{n}" for n in orden][::-1], [hus[n]["prioridad"] for n in orden][::-1], color=colores[::-1])
    ax.set_xlabel("Prioridad = valor × urgencia")
    ax.set_title("Priorización del Product Backlog", fontweight="bold", color=TINTA)
    ax.tick_params(axis="y", labelsize=7.5)
    fig.tight_layout()
    ruta = os.path.join(DIR, "prioridad.png")
    fig.savefig(ruta)
    plt.close(fig)
    return ruta


if __name__ == "__main__":
    print(velocidad(), burnup(), prioridad())
