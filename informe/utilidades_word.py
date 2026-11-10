# -*- coding: utf-8 -*-
"""Utilidades para armar el informe en Word con python-docx: estilos con la
paleta de PetMatch, tablas, figuras con leyenda, índice y numeración."""

import os
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

# Paleta de la aplicación
TINTA = RGBColor(0x1C, 0x18, 0x29)
TINTA_SUAVE = RGBColor(0x4F, 0x48, 0x67)
LAVANDA = RGBColor(0x46, 0x29, 0x9A)
LAVANDA_CLARO = RGBColor(0x68, 0x41, 0xE3)
CORAL = RGBColor(0xEB, 0x50, 0x29)
MENTA = RGBColor(0x0A, 0x8C, 0x6B)
BLANCO = RGBColor(0xFF, 0xFF, 0xFF)

HEX_ENCABEZADO = "46299A"
HEX_ZEBRA = "F5F2FF"
HEX_BORDE = "C9C4D8"
HEX_ALERTA = "FFF3CC"


def _sombrear(celda, hex_color):
    pr = celda._tc.get_or_add_tcPr()
    for viejo in pr.findall(qn("w:shd")):
        pr.remove(viejo)
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    pr.append(shd)


def _bordes_tabla(tabla, hex_color=HEX_BORDE):
    tbl = tabla._tbl
    pr = tbl.tblPr
    bordes = OxmlElement("w:tblBorders")
    for lado in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{lado}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), hex_color)
        bordes.append(el)
    pr.append(bordes)


def _margen_celdas(tabla, arriba=40, abajo=40, lados=70):
    pr = tabla._tbl.tblPr
    m = OxmlElement("w:tblCellMar")
    for lado, v in (("top", arriba), ("left", lados), ("bottom", abajo), ("right", lados)):
        el = OxmlElement(f"w:{lado}")
        el.set(qn("w:w"), str(v))
        el.set(qn("w:type"), "dxa")
        m.append(el)
    pr.append(m)


def _repetir_encabezado(fila):
    pr = fila._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    pr.append(el)


def _no_partir_fila(fila):
    pr = fila._tr.get_or_add_trPr()
    el = OxmlElement("w:cantSplit")
    el.set(qn("w:val"), "true")
    pr.append(el)


def _campo(parrafo, instruccion, texto_previo="1"):
    """Inserta un campo de Word (PAGE, NUMPAGES, TOC...)."""
    run = parrafo.add_run()
    for tipo in ("begin", None, "separate", "texto", "end"):
        if tipo == "texto":
            t = OxmlElement("w:t")
            t.text = texto_previo
            run._r.append(t)
            continue
        if tipo is None:
            ins = OxmlElement("w:instrText")
            ins.set(qn("xml:space"), "preserve")
            ins.text = f" {instruccion} "
            run._r.append(ins)
            continue
        fc = OxmlElement("w:fldChar")
        fc.set(qn("w:fldCharType"), tipo)
        run._r.append(fc)
    return run


class Informe:
    def __init__(self):
        self.doc = Document()
        self.n_tabla = 0
        self.n_figura = 0
        self._preparar_estilos()
        self._preparar_pagina()

    # ---------------------------------------------------------------- base
    def _preparar_estilos(self):
        st = self.doc.styles
        n = st["Normal"]
        n.font.name = "Calibri"
        n.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
        n.font.size = Pt(10.5)
        n.font.color.rgb = TINTA
        n.paragraph_format.space_after = Pt(6)
        n.paragraph_format.line_spacing = 1.12

        for nombre, tam, color, antes, despues in (
            ("Heading 1", 20, LAVANDA, 18, 8),
            ("Heading 2", 14.5, LAVANDA_CLARO, 14, 5),
            ("Heading 3", 12, TINTA_SUAVE, 10, 4),
        ):
            h = st[nombre]
            h.font.name = "Calibri"
            h.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
            h.font.size = Pt(tam)
            h.font.bold = True
            h.font.color.rgb = color
            h.paragraph_format.space_before = Pt(antes)
            h.paragraph_format.space_after = Pt(despues)
            h.paragraph_format.keep_with_next = True

        for nombre in ("List Bullet", "List Number"):
            s = st[nombre]
            s.font.name = "Calibri"
            s.font.size = Pt(10.5)
            s.paragraph_format.space_after = Pt(2)

    def _preparar_pagina(self):
        s = self.doc.sections[0]
        s.page_width, s.page_height = Cm(21.59), Cm(27.94)  # carta
        s.left_margin = s.right_margin = Cm(2.3)
        s.top_margin, s.bottom_margin = Cm(2.2), Cm(2.0)

    @property
    def ancho_util(self):
        s = self.doc.sections[-1]
        return s.page_width - s.left_margin - s.right_margin

    # -------------------------------------------------------------- textos
    def titulo_suelto(self, texto):
        """Título grande que NO entra en el índice (estilo normal)."""
        par = self.doc.add_paragraph()
        r = par.add_run(texto)
        r.bold = True
        r.font.size = Pt(20)
        r.font.color.rgb = LAVANDA
        par.paragraph_format.space_after = Pt(8)
        return par

    def banda(self, lineas, alto_cm=8.0):
        """Bloque de color a todo el ancho (portada). lineas: [(texto, tam, negrita, color_hex_o_None)]."""
        t = self.doc.add_table(rows=1, cols=1)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        c = t.rows[0].cells[0]
        _sombrear(c, HEX_ENCABEZADO)
        _margen_celdas(t, 260, 260, 360)
        primero = True
        for texto, tam, negrita, color in lineas:
            par = c.paragraphs[0] if primero else c.add_paragraph()
            primero = False
            par.paragraph_format.space_after = Pt(4)
            r = par.add_run(texto)
            r.font.size = Pt(tam)
            r.bold = negrita
            r.font.color.rgb = RGBColor.from_string(color or "FFFFFF")
        self.doc.add_paragraph()

    def h1(self, texto, salto=True):
        if salto:
            self.salto_pagina()
        return self.doc.add_heading(texto, level=1)

    def h2(self, texto):
        return self.doc.add_heading(texto, level=2)

    def h3(self, texto):
        return self.doc.add_heading(texto, level=3)

    def p(self, texto="", negrita=False, cursiva=False, color=None, alinear=None, tam=None, despues=None):
        par = self.doc.add_paragraph()
        self._runs(par, texto, negrita, cursiva, color, tam)
        if alinear == "centro":
            par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif alinear == "justificado":
            par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if despues is not None:
            par.paragraph_format.space_after = Pt(despues)
        return par

    def _runs(self, par, texto, negrita=False, cursiva=False, color=None, tam=None):
        """Texto con **negrita** y [[campo a completar]] resaltado."""
        import re
        for trozo in re.split(r"(\*\*.+?\*\*|\[\[.+?\]\]|`[^`]+`)", texto):
            if not trozo:
                continue
            if trozo.startswith("`") and trozo.endswith("`"):
                r = par.add_run(trozo[1:-1])
                r.font.name = "Consolas"
                r._r.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "Consolas")
                r.font.size = Pt((tam or 10.5) - 1)
                r.font.color.rgb = LAVANDA
                r.italic = cursiva
                continue
            if trozo.startswith("**") and trozo.endswith("**"):
                r = par.add_run(trozo[2:-2])
                r.bold = True
            elif trozo.startswith("[[") and trozo.endswith("]]"):
                r = par.add_run("[" + trozo[2:-2] + "]")
                r.bold = True
                rpr = r._r.get_or_add_rPr()
                h = OxmlElement("w:highlight")
                h.set(qn("w:val"), "yellow")
                rpr.append(h)
            else:
                r = par.add_run(trozo)
                r.bold = negrita
            r.italic = cursiva
            if color is not None and not (trozo.startswith("[[")):
                r.font.color.rgb = color
            if tam:
                r.font.size = Pt(tam)

    def vinetas(self, items, estilo="List Bullet"):
        for it in items:
            par = self.doc.add_paragraph(style=estilo)
            self._runs(par, it)

    def nota(self, texto, hex_fondo=HEX_ALERTA):
        """Recuadro de una celda con fondo (nota, advertencia, dato por completar)."""
        t = self.doc.add_table(rows=1, cols=1)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        _bordes_tabla(t, "F2A60C")
        _margen_celdas(t, 80, 80, 140)
        c = t.rows[0].cells[0]
        _sombrear(c, hex_fondo)
        c.paragraphs[0].paragraph_format.space_after = Pt(0)
        self._runs(c.paragraphs[0], texto, tam=9.5)
        self.doc.add_paragraph().paragraph_format.space_after = Pt(2)

    def salto_pagina(self):
        self.doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # ------------------------------------------------------------- tablas
    def leyenda_tabla(self, texto):
        self.n_tabla += 1
        par = self.doc.add_paragraph()
        par.paragraph_format.keep_with_next = True
        par.paragraph_format.space_before = Pt(6)
        par.paragraph_format.space_after = Pt(3)
        r = par.add_run(f"Tabla {self.n_tabla}. ")
        r.bold = True
        r.font.color.rgb = LAVANDA
        r2 = par.add_run(texto)
        r2.italic = True
        return self.n_tabla

    def tabla(self, encabezado, filas, anchos_cm, tam=9, alinear=None, leyenda=None, zebra=True):
        if leyenda:
            self.leyenda_tabla(leyenda)
        t = self.doc.add_table(rows=1, cols=len(encabezado))
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        t.autofit = False
        _bordes_tabla(t)
        _margen_celdas(t)
        hdr = t.rows[0]
        _repetir_encabezado(hdr)
        fusionar = len(encabezado) > 1 and all(t == "" for t in encabezado[1:])
        for i, txt in enumerate(encabezado):
            c = hdr.cells[i]
            c.width = Cm(anchos_cm[i])
            _sombrear(c, HEX_ENCABEZADO)
            par = c.paragraphs[0]
            par.paragraph_format.space_after = Pt(0)
            r = par.add_run(txt)
            r.bold = True
            r.font.size = Pt(tam)
            r.font.color.rgb = BLANCO
            if alinear and alinear[i] == "c":
                par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        if fusionar:
            fusionada = hdr.cells[0].merge(hdr.cells[-1])
            for extra in fusionada.paragraphs[1:]:  # la fusión deja párrafos vacíos
                if not extra.text:
                    extra._element.getparent().remove(extra._element)
        for k, fila in enumerate(filas):
            row = t.add_row()
            _no_partir_fila(row)
            for i, val in enumerate(fila):
                c = row.cells[i]
                c.width = Cm(anchos_cm[i])
                if zebra and k % 2 == 1:
                    _sombrear(c, HEX_ZEBRA)
                par = c.paragraphs[0]
                par.paragraph_format.space_after = Pt(0)
                par.paragraph_format.line_spacing = 1.0
                if val == "@@":  # casilla que debe llenar el equipo
                    _sombrear(c, HEX_ALERTA)
                    continue
                lineas = str(val).split("\n")
                for j, ln in enumerate(lineas):
                    if j > 0:
                        par = c.add_paragraph()
                        par.paragraph_format.space_after = Pt(0)
                        par.paragraph_format.line_spacing = 1.0
                    self._runs(par, ln, tam=tam)
                    if alinear and alinear[i] == "c":
                        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        self.doc.add_paragraph().paragraph_format.space_after = Pt(2)
        return t

    # ------------------------------------------------------------- figuras
    def figura(self, ruta, leyenda, ancho_cm=15.5, alto_max_cm=20.0):
        from PIL import Image
        if not os.path.exists(ruta):
            self.nota(f"**Figura pendiente:** {leyenda} (archivo no disponible: {os.path.basename(ruta)}).")
            return
        w, h = Image.open(ruta).size
        ancho = ancho_cm
        alto = ancho * h / w
        if alto > alto_max_cm:
            alto = alto_max_cm
            ancho = alto * w / h
        par = self.doc.add_paragraph()
        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        par.paragraph_format.keep_with_next = True
        par.paragraph_format.space_after = Pt(2)
        par.add_run().add_picture(ruta, width=Cm(ancho))
        self.n_figura += 1
        cap = self.doc.add_paragraph()
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cap.add_run(f"Figura {self.n_figura}. ")
        r.bold = True
        r.font.color.rgb = LAVANDA
        r2 = cap.add_run(leyenda)
        r2.italic = True
        r2.font.size = Pt(9.5)

    # ---------------------------------------------------- encabezado y pie
    def encabezado_y_pie(self, texto_encabezado):
        s = self.doc.sections[0]
        s.different_first_page_header_footer = True
        h = s.header.paragraphs[0]
        h.text = ""
        r = h.add_run(texto_encabezado)
        r.font.size = Pt(8.5)
        r.font.color.rgb = TINTA_SUAVE
        h.alignment = WD_ALIGN_PARAGRAPH.LEFT
        pPr = h._p.get_or_add_pPr()
        b = OxmlElement("w:pBdr")
        bot = OxmlElement("w:bottom")
        for k, v in (("val", "single"), ("sz", "6"), ("space", "1"), ("color", "9A7FFF")):
            bot.set(qn(f"w:{k}"), v)
        b.append(bot)
        pPr.append(b)

        f = s.footer.paragraphs[0]
        f.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = f.add_run("Página ")
        r.font.size = Pt(8.5)
        _campo(f, "PAGE").font.size = Pt(8.5)
        r = f.add_run(" de ")
        r.font.size = Pt(8.5)
        _campo(f, "NUMPAGES", "1").font.size = Pt(8.5)

    def indice(self):
        par = self.doc.add_paragraph()
        _campo(par, 'TOC \\o "1-2" \\h \\z \\u',
               "Haz clic derecho aquí y elige «Actualizar campo» para generar el índice.")

    def guardar(self, ruta):
        os.makedirs(os.path.dirname(ruta), exist_ok=True)
        self.doc.save(ruta)
