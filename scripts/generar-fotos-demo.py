# -*- coding: utf-8 -*-
"""Genera las ilustraciones de mascotas de los datos de demostración
(prisma/demo-fotos/*.jpg). No son fotos reales: son dibujos planos, para que
la demostración y las capturas del informe no usen imágenes de terceros.

Uso: python scripts/generar-fotos-demo.py
"""

import math
import os

from PIL import Image, ImageDraw, ImageFilter

SALIDA = os.path.join(os.path.dirname(__file__), "..", "prisma", "demo-fotos")
W, H = 960, 720
S = 2  # supermuestreo para bordes suaves


def fondo(c1, c2):
    img = Image.new("RGB", (W * S, H * S), c1)
    d = ImageDraw.Draw(img)
    for y in range(H * S):
        t = y / (H * S)
        c = tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))
        d.line([(0, y), (W * S, y)], fill=c)
    # luz suave
    luz = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(luz)
    ld.ellipse([W * S * 0.1, H * S * 0.55, W * S * 0.9, H * S * 1.25], fill=(255, 255, 255, 70))
    luz = luz.filter(ImageFilter.GaussianBlur(60 * S))
    img.paste(luz, (0, 0), luz)
    return img


def perro(nombre, base, oreja, mancha=None, fondo_c=((255, 226, 205), (255, 190, 160)), lengua=True, collar=(235, 80, 41)):
    img = fondo(*fondo_c)
    d = ImageDraw.Draw(img)
    cx, cy = W * S // 2, int(H * S * 0.52)
    # cuerpo
    d.ellipse([cx - 250 * S, cy + 90 * S, cx + 250 * S, cy + 420 * S], fill=base)
    # orejas caídas
    for lado in (-1, 1):
        d.ellipse([cx + lado * 175 * S - 70 * S, cy - 190 * S, cx + lado * 175 * S + 70 * S, cy + 50 * S], fill=oreja)
    # cabeza
    d.ellipse([cx - 175 * S, cy - 200 * S, cx + 175 * S, cy + 150 * S], fill=base)
    if mancha:
        d.ellipse([cx - 175 * S, cy - 200 * S, cx - 20 * S, cy - 20 * S], fill=mancha)
    # hocico
    d.ellipse([cx - 95 * S, cy - 20 * S, cx + 95 * S, cy + 130 * S], fill=(255, 244, 232))
    # ojos
    for lado in (-1, 1):
        ex = cx + lado * 70 * S
        d.ellipse([ex - 22 * S, cy - 75 * S, ex + 22 * S, cy - 31 * S], fill=(40, 30, 40))
        d.ellipse([ex - 8 * S + 6 * S, cy - 68 * S, ex + 4 * S + 6 * S, cy - 56 * S], fill=(255, 255, 255))
    # nariz y boca
    d.ellipse([cx - 32 * S, cy + 5 * S, cx + 32 * S, cy + 48 * S], fill=(40, 30, 40))
    d.line([cx, cy + 48 * S, cx, cy + 78 * S], fill=(40, 30, 40), width=6 * S)
    d.arc([cx - 50 * S, cy + 50 * S, cx, cy + 105 * S], 0, 150, fill=(40, 30, 40), width=6 * S)
    d.arc([cx, cy + 50 * S, cx + 50 * S, cy + 105 * S], 30, 180, fill=(40, 30, 40), width=6 * S)
    if lengua:
        d.ellipse([cx - 22 * S, cy + 82 * S, cx + 22 * S, cy + 140 * S], fill=(255, 120, 130))
    # collar
    d.rounded_rectangle([cx - 150 * S, cy + 145 * S, cx + 150 * S, cy + 185 * S], radius=20 * S, fill=collar)
    d.ellipse([cx - 22 * S, cy + 170 * S, cx + 22 * S, cy + 214 * S], fill=(255, 196, 46))
    guardar(img, nombre)


def gato(nombre, base, rayas=None, ojos=(60, 180, 120), fondo_c=((226, 232, 255), (190, 200, 250)), manchas=None):
    img = fondo(*fondo_c)
    d = ImageDraw.Draw(img)
    cx, cy = W * S // 2, int(H * S * 0.52)
    d.ellipse([cx - 230 * S, cy + 100 * S, cx + 230 * S, cy + 430 * S], fill=base)
    # cola
    d.arc([cx + 120 * S, cy + 80 * S, cx + 420 * S, cy + 420 * S], 250, 90, fill=base, width=60 * S)
    # orejas
    for lado in (-1, 1):
        d.polygon([(cx + lado * 60 * S, cy - 190 * S), (cx + lado * 190 * S, cy - 330 * S), (cx + lado * 175 * S, cy - 90 * S)], fill=base)
        d.polygon([(cx + lado * 90 * S, cy - 175 * S), (cx + lado * 170 * S, cy - 280 * S), (cx + lado * 160 * S, cy - 110 * S)], fill=(255, 190, 200))
    d.ellipse([cx - 185 * S, cy - 230 * S, cx + 185 * S, cy + 150 * S], fill=base)
    if rayas:
        for k in (-1, 0, 1):
            d.polygon([(cx + k * 40 * S - 14 * S, cy - 228 * S), (cx + k * 40 * S + 14 * S, cy - 228 * S), (cx + k * 40 * S, cy - 140 * S)], fill=rayas)
        for lado in (-1, 1):
            for j in range(3):
                y = cy - 40 * S + j * 36 * S
                d.line([cx + lado * 160 * S, y, cx + lado * 118 * S, y + 8 * S], fill=rayas, width=9 * S)
    if manchas:
        d.ellipse([cx - 185 * S, cy - 230 * S, cx - 30 * S, cy - 40 * S], fill=manchas)
    # ojos
    for lado in (-1, 1):
        ex = cx + lado * 78 * S
        d.ellipse([ex - 34 * S, cy - 80 * S, ex + 34 * S, cy - 4 * S], fill=ojos)
        d.ellipse([ex - 9 * S, cy - 74 * S, ex + 9 * S, cy - 10 * S], fill=(30, 25, 40))
        d.ellipse([ex - 20 * S + 14 * S, cy - 68 * S, ex - 8 * S + 14 * S, cy - 56 * S], fill=(255, 255, 255))
    d.polygon([(cx - 20 * S, cy + 14 * S), (cx + 20 * S, cy + 14 * S), (cx, cy + 42 * S)], fill=(255, 150, 165))
    d.line([cx, cy + 42 * S, cx, cy + 62 * S], fill=(70, 50, 60), width=5 * S)
    d.arc([cx - 40 * S, cy + 40 * S, cx, cy + 84 * S], 0, 160, fill=(70, 50, 60), width=5 * S)
    d.arc([cx, cy + 40 * S, cx + 40 * S, cy + 84 * S], 20, 180, fill=(70, 50, 60), width=5 * S)
    for lado in (-1, 1):  # bigotes
        for dy in (-10, 10):
            d.line([cx + lado * 70 * S, cy + 30 * S + dy * S, cx + lado * 200 * S, cy + 15 * S + dy * 3 * S], fill=(255, 255, 255), width=4 * S)
    guardar(img, nombre)


def guardar(img, nombre):
    os.makedirs(SALIDA, exist_ok=True)
    img = img.resize((W, H), Image.LANCZOS)
    img.save(os.path.join(SALIDA, nombre + ".jpg"), quality=88)


if __name__ == "__main__":
    perro("perro-cafe", (176, 112, 66), (120, 72, 40), fondo_c=((255, 232, 212), (255, 196, 160)))
    perro("perro-negro", (52, 48, 58), (30, 28, 36), fondo_c=((230, 226, 255), (196, 188, 245)), collar=(20, 173, 132))
    perro("perro-dorado", (226, 178, 90), (196, 146, 60), fondo_c=((255, 244, 214), (255, 222, 150)))
    perro("perro-manchado", (250, 246, 240), (150, 102, 66), mancha=(150, 102, 66), fondo_c=((208, 247, 232), (163, 237, 212)), collar=(125, 92, 246))
    gato("gato-gris", (150, 152, 166), rayas=(96, 98, 112), ojos=(80, 190, 120))
    gato("gato-naranja", (240, 148, 70), rayas=(200, 100, 40), ojos=(230, 190, 50), fondo_c=((255, 236, 214), (255, 206, 168)))
    gato("gato-negro", (44, 42, 52), ojos=(240, 200, 60), fondo_c=((234, 228, 255), (200, 190, 246)))
    gato("gato-carey", (240, 236, 228), ojos=(70, 150, 200), manchas=(214, 128, 56), fondo_c=((255, 240, 236), (255, 214, 200)))
    print("Ilustraciones generadas en", os.path.abspath(SALIDA))
