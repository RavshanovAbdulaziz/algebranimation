"""
Algebranimation — Manim video-darslar.

Render:  ./render.ps1                (videolarni web/public/videos ga ko'chiradi)
yoki:    uv run manim -qm --media_dir %TEMP%/am scenes.py MatritsaAlmashtirish Determinant XosVektor

Eslatmalar:
* LaTeX o'rnatilmagan bo'lsa ham ishlashi uchun faqat Text ishlatilgan (MathTex emas).
* LinearTransformationScene o'rniga o'zimizning LT sahnamiz: Manim 0.22 da u
  play() dan keyin yiqiladi va matnlarni ham "egib" yuboradi. Bu yerda almashtirish
  ValueTracker orqali boshqariladi: faqat to'r, vektorlar va shakllar o'zgaradi.
* Ranglar veb-sayt bilan bir xil: î — yashil, ĵ — qizil, v — sariq, natija — ko'k.
"""
import numpy as np
from manim import *

I_COL = GREEN_C
J_COL = RED_C
V_COL = YELLOW
RES = BLUE_C


def label(text, size=28, color=WHITE):
    t = Text(text, font_size=size, color=color)
    t.add_background_rectangle(opacity=0.8, buff=0.12)
    t.set_z_index(10)
    return t


def matrix_text(a, b, c, d):
    """Ustunlari rangli 2x2 matritsa (LaTeX'siz)."""
    col1 = VGroup(Text(str(a), font_size=30, color=I_COL), Text(str(c), font_size=30, color=I_COL)).arrange(DOWN, buff=0.25)
    col2 = VGroup(Text(str(b), font_size=30, color=J_COL), Text(str(d), font_size=30, color=J_COL)).arrange(DOWN, buff=0.25)
    body = VGroup(col1, col2).arrange(RIGHT, buff=0.5)
    lb = Line(UP, DOWN).set_height(body.height + 0.3).next_to(body, LEFT, buff=0.15)
    rb = Line(UP, DOWN).set_height(body.height + 0.3).next_to(body, RIGHT, buff=0.15)
    g = VGroup(lb, body, rb)
    g.add_background_rectangle(opacity=0.85, buff=0.15)
    g.set_z_index(10)
    return g


ORANGE_C = "#ff9f43"
MUTED = GREY_B


def pt(x, y):
    return np.array([x, y, 0.0])


def fnum(x):
    """Sonni chiroyli yozish: 2.0 -> 2, -0.5 -> −0.5"""
    r = round(x, 2)
    if abs(r) < 1e-9:
        r = 0.0
    s = f"{r:g}"
    return s.replace("-", "−")


def lin(terms, c=0.0):
    """Daftardagidek chiziqli ifoda: lin([(1,'x'),(-2,'y')], 1) -> 'x − 2y + 1'"""
    s = ""
    for v, name in list(terms) + [(c, "")]:
        if abs(v) < 1e-9:
            continue
        a = abs(v)
        coef = "" if (name and abs(a - 1) < 1e-9) else fnum(a)
        s += (" − " if v < 0 else " + ") if s else ("−" if v < 0 else "")
        s += coef + name
    return s or "0"


def mat_grid(rows, size=30, col_colors=None, h_buff=0.55, v_buff=0.38):
    """Ixtiyoriy o'lchamli matritsa (LaTeX'siz). grid.cells[i][j] — alohida elementlar."""
    cells = []
    for i, r in enumerate(rows):
        row = []
        for j, x in enumerate(r):
            col = col_colors[j] if col_colors else WHITE
            row.append(Text(x if isinstance(x, str) else fnum(x), font_size=size, color=col))
        cells.append(row)
    m, n = len(rows), len(rows[0])
    body = VGroup(*[c for r in cells for c in r])
    w = max(c.width for c in body) + h_buff
    h = max(c.height for c in body) + v_buff
    for i in range(m):
        for j in range(n):
            cells[i][j].move_to(pt(j * w, -i * h))
    body.move_to(ORIGIN)
    lb = Line(UP, DOWN).set_height(body.height + 0.35).next_to(body, LEFT, buff=0.18)
    rb = Line(UP, DOWN).set_height(body.height + 0.35).next_to(body, RIGHT, buff=0.18)
    g = VGroup(lb, body, rb)
    g.cells = cells
    g.cell_w, g.cell_h = w, h
    g.set_z_index(10)
    return g


class LT(Scene):
    """Chiziqli almashtirish sahnasi: to'r + vektorlar + shakllar bitta matritsa bilan harakatlanadi.

    Joylashuv qoidasi (barcha videolarda bir xil, ko'z adashmasligi uchun):
      tepada — sarlavha, chap yuqorida — formulalar paneli, o'ng yuqorida — matritsa,
      pastda — BITTA izoh (yangisi chiqqanda eskisi almashtiriladi).
    """

    # ---- matn joylashuvi ----
    def title(self, text):
        t = label(text, 32).to_edge(UP, buff=0.25)
        self.add(t)
        return t

    def cap(self, text, color=WHITE, wait=1.6, size=28):
        """Pastki izohni almashtirish."""
        new = label(text, size, color).to_edge(DOWN, buff=0.3)
        old = getattr(self, "_cap", None)
        if old is not None:
            self.play(FadeOut(old, shift=DOWN * 0.2), FadeIn(new, shift=UP * 0.2), run_time=0.6)
        else:
            self.play(FadeIn(new, shift=UP * 0.2), run_time=0.6)
        self._cap = new
        if wait:
            self.wait(wait)
        return new

    def panel(self, lines, color=WHITE, size=26):
        """Chap yuqori panel (formulalar). Har chaqiriqda yangilanadi."""
        pairs = [(l, None) if isinstance(l, str) else l for l in lines]
        items = VGroup(*[Text(s, font_size=size, color=c if c is not None else color) for s, c in pairs])
        items.arrange(DOWN, aligned_edge=LEFT, buff=0.18)
        items.add_background_rectangle(opacity=0.82, buff=0.15)
        items.to_corner(UL).shift(DOWN * 0.75)
        items.set_z_index(10)
        old = getattr(self, "_panel", None)
        if old is not None:
            self.play(FadeOut(old), FadeIn(items), run_time=0.5)
        else:
            self.play(FadeIn(items), run_time=0.5)
        self._panel = items
        return items

    def plain(self):
        """Faqat oddiy koordinata to'ri (almashtirishsiz sahnalar uchun)."""
        self.add(NumberPlane(background_line_style={"stroke_opacity": 0.35, "stroke_color": BLUE_E},
                             axis_config={"stroke_opacity": 0.6}).set_z_index(-2))
        self.prev = np.eye(2)
        self.next = np.eye(2)
        self.t = ValueTracker(1)

    def to(self, M, run_time=2.5):
        """Hozirgi holatdan ABSOLYUT M matritsaga o'tish (masalan, E ga qaytish)."""
        self.prev = self.cur()
        self.next = np.array(M, dtype=float)
        self.t.set_value(0)
        self.play(self.t.animate.set_value(1), run_time=run_time, rate_func=smooth)

    def setup_plane(self, basis=True):
        self.add(NumberPlane(background_line_style={"stroke_opacity": 0.25, "stroke_color": GREY}, axis_config={"stroke_opacity": 0.3}).set_z_index(-2))
        self.base = NumberPlane(x_range=[-16, 16], y_range=[-12, 12], background_line_style={"stroke_color": BLUE_D, "stroke_width": 2})
        self.prev = np.eye(2)
        self.next = np.eye(2)
        self.t = ValueTracker(1)
        self.plane = always_redraw(lambda: self.base.copy().apply_matrix(self.cur()).set_z_index(-1))
        self.add(self.plane)
        if basis:
            self.vec([1, 0], I_COL, animate=False)
            self.vec([0, 1], J_COL, animate=False)

    def cur(self):
        a = self.t.get_value()
        return (1 - a) * self.prev + a * self.next

    def img(self, p):
        x = self.cur() @ np.array(p[:2], dtype=float)
        return np.array([x[0], x[1], 0.0])

    def arrow(self, a, b, color, width=6):
        return Arrow(a, b, buff=0, color=color, stroke_width=width, max_tip_length_to_length_ratio=0.25)

    def vec(self, coords, color, animate=True):
        if animate:
            self.play(GrowArrow(self.arrow(ORIGIN, self.img(coords), color)), run_time=0.8)
            self.remove(self.mobjects[-1])
        v = always_redraw(lambda: self.arrow(ORIGIN, self.img(coords), color).set_z_index(2))
        self.add(v)
        return v

    def shape(self, pts, color, opacity=0.35):
        return always_redraw(lambda: Polygon(*[self.img(p) for p in pts], color=color, fill_color=color,
                                             fill_opacity=opacity, stroke_width=2).set_z_index(1))

    def apply(self, M, run_time=3):
        self.prev = self.cur()
        self.next = np.array(M, dtype=float) @ self.prev
        self.t.set_value(0)
        self.play(self.t.animate.set_value(1), run_time=run_time, rate_func=smooth)


class MatritsaAlmashtirish(LT):
    def construct(self):
        self.setup_plane()
        self.add(label("Matritsa = tekislikni o'zgartiruvchi harakat", 32).to_edge(UP))
        self.wait(0.5)

        self.vec([2, 1], V_COL)
        t1 = label("v = 2·î + 1·ĵ", 30, V_COL).to_corner(UL).shift(DOWN * 0.8)
        self.play(FadeIn(t1))
        p1 = always_redraw(lambda: self.arrow(ORIGIN, self.img([2, 0]), I_COL, 4).set_opacity(0.7).set_z_index(1))
        p2 = always_redraw(lambda: self.arrow(self.img([2, 0]), self.img([2, 1]), J_COL, 4).set_opacity(0.7).set_z_index(1))
        self.add(p1)
        self.wait(0.4)
        self.add(p2)
        self.wait(0.8)

        m = matrix_text(1, -1, 0.5, 1.5).to_corner(UR).shift(DOWN * 0.8)
        t2 = label("Faqat î va ĵ ni kuzating", 26).next_to(m, DOWN).to_edge(RIGHT)
        self.play(FadeIn(m), FadeIn(t2))

        self.apply([[1, -1], [0.5, 1.5]])
        self.wait(0.5)

        t3 = label("î → 1-ustun (yashil),  ĵ → 2-ustun (qizil)", 28).to_edge(DOWN)
        self.play(FadeIn(t3))
        self.wait(1)
        t4 = label("Av = 2·(yangi î) + 1·(yangi ĵ) = (1, 2.5)", 28, V_COL).next_to(t3, UP)
        self.play(FadeIn(t4))
        self.wait(3)


class Determinant(LT):
    def construct(self):
        self.setup_plane()
        self.add(label("Determinant = yuza necha marta o'zgaradi", 32).to_edge(UP))
        self.add(self.shape([[0, 0], [1, 0], [1, 1], [0, 1]], YELLOW))
        area = label("Yuza: 1", 30, YELLOW).to_corner(UL).shift(DOWN * 0.8)
        self.play(FadeIn(area))
        self.wait(0.5)

        m = matrix_text(3, 1, 0, 2).to_corner(UR).shift(DOWN * 0.8)
        self.play(FadeIn(m))
        self.apply([[3, 1], [0, 2]])

        area2 = label("Yuza: 6", 30, YELLOW).move_to(area, aligned_edge=LEFT)
        self.play(ReplacementTransform(area, area2))
        f = label("det = 3·2 − 1·0 = 6", 30).to_edge(DOWN)
        self.play(FadeIn(f))
        self.wait(2)

        f2 = label("Endi tekislikni chiziqqa yassilaymiz…", 28).next_to(f, UP)
        self.play(FadeIn(f2))
        # [[1,0],[1/3,0]] · [[3,1],[0,2]] = [[3,1],[1,1/3]]: ustunlar (3,1) va (1,1/3) bir chiziqda, det = 0
        self.apply([[1, 0], [1 / 3, 0]])
        area3 = label("Yuza: 0", 30, YELLOW).move_to(area2, aligned_edge=LEFT)
        self.play(ReplacementTransform(area2, area3))
        f3 = label("det = 0  ⇔  ustunlar chiziqli bog'liq  ⇔  teskari matritsa yo'q", 26, RED_B).move_to(f2)
        self.play(ReplacementTransform(f2, f3))
        self.wait(3)


class XosVektor(LT):
    def construct(self):
        self.setup_plane(basis=False)
        self.add(label("Xos vektor: o'z chizig'idan chiqmaydigan vektor", 32).to_edge(UP))

        e1 = Line(LEFT * 8, RIGHT * 8, color=RES, stroke_width=3).set_opacity(0.8)
        e2 = Line(np.array([5, -5, 0]), np.array([-5, 5, 0]), color=RES, stroke_width=3).set_opacity(0.8)
        other = DashedVMobject(Line(np.array([-5, -5, 0]), np.array([5, 5, 0]), color=GREY_B, stroke_width=2))
        self.play(Create(e1), Create(e2), Create(other))

        self.vec([1, 0], RES)
        self.vec([-1, 1], RES)
        self.vec([1, 1], V_COL)

        m = matrix_text(3, 1, 0, 2).to_corner(UR).shift(DOWN * 0.8)
        hint = label("Ko'k vektorlar o'z chizig'ida qoladimi?", 28).to_edge(DOWN)
        self.play(FadeIn(m), FadeIn(hint))

        self.apply([[3, 1], [0, 2]], run_time=3.5)
        self.wait(0.5)

        r1 = label("Av₁ = 3·v₁   (λ₁ = 3)", 28, RES).to_corner(UL).shift(DOWN * 0.8)
        r2 = label("Av₂ = 2·v₂   (λ₂ = 2)", 28, RES).next_to(r1, DOWN, aligned_edge=LEFT)
        r3 = label("sariq vektor chizig'idan chiqib ketdi — xos emas", 26, V_COL).next_to(r2, DOWN, aligned_edge=LEFT)
        for r in (r1, r2, r3):
            self.play(FadeIn(r))
            self.wait(0.6)
        f = label("λ ni topish:  det(A − λE) = (3 − λ)(2 − λ) = 0", 28).move_to(hint)
        self.play(ReplacementTransform(hint, f))
        self.wait(3)


# =====================================================================
#  VEKTORLAR
# =====================================================================

class VektorNima(LT):
    def construct(self):
        self.plain()
        self.title("Vektor = ikki son = strelka")
        self.cap("v = (3, 2): boshdan 3 qadam o'ngga, 2 qadam yuqoriga", wait=0.6)
        h = self.arrow(ORIGIN, pt(3, 0), I_COL, 5)
        self.play(GrowArrow(h), run_time=1.2)
        u = self.arrow(pt(3, 0), pt(3, 2), J_COL, 5)
        self.play(GrowArrow(u), run_time=1)
        v = self.arrow(ORIGIN, pt(3, 2), V_COL)
        self.play(GrowArrow(v), run_time=1)
        self.panel([("x = 3 — gorizontal qadam", I_COL), ("y = 2 — vertikal qadam", J_COL)])
        self.cap("Uzunlik — Pifagor: |v| = √(3² + 2²) = √13 ≈ 3.61", wait=2.2)
        self.play(FadeOut(h), FadeOut(u))
        v2 = v.copy()
        self.play(v2.animate.shift(pt(-6.5, -2.6)), run_time=1.5)
        v3 = v.copy()
        self.play(v3.animate.shift(pt(1.2, -2.8)), run_time=1.2)
        self.cap("Ko'chirilgan strelkalar — o'sha vektor: yo'nalish va uzunlik bir xil", wait=2)
        self.play(v2.animate.set_opacity(0.3), v3.animate.set_opacity(0.3))
        self.cap("Odatda boshdan chizamiz — shunda uchi aynan (x, y) nuqtada", RES, wait=2.5)


class VektorAmallar(LT):
    def construct(self):
        self.plain()
        self.title("Qo'shish va songa ko'paytirish")
        a, b = pt(3, 1), pt(1, 2)
        A = self.arrow(ORIGIN, a, V_COL)
        B = self.arrow(ORIGIN, b, PINK)
        self.play(GrowArrow(A), GrowArrow(B))
        self.panel([("a = (3, 1)", V_COL), ("b = (1, 2)", PINK)])
        self.cap("a + b: avval a bo'yicha yur, keyin u yerdan b bo'yicha", wait=0.5)
        self.play(B.animate.shift(a), run_time=1.6)
        S = self.arrow(ORIGIN, a + b, RES, 7)
        self.play(GrowArrow(S))
        self.panel([("a = (3, 1)", V_COL), ("b = (1, 2)", PINK), ("a + b = (3+1, 1+2) = (4, 3)", RES)])
        self.cap("Teskari tartib (avval b, keyin a) — o'sha nuqta: a + b = b + a", wait=0.3)
        B2 = self.arrow(ORIGIN, b, PINK).set_opacity(0.45)
        A2 = self.arrow(b, a + b, V_COL).set_opacity(0.45)
        self.play(GrowArrow(B2))
        self.play(GrowArrow(A2))
        par = Polygon(ORIGIN, a, a + b, b, stroke_width=0, fill_color=RES, fill_opacity=0.14)
        self.play(FadeIn(par))
        self.wait(1.5)
        self.play(*[FadeOut(m) for m in (A, B, S, B2, A2, par)])

        # songa ko'paytirish
        k = ValueTracker(1)
        v = pt(2, 1)
        guide = DashedLine(pt(-7.5, -3.75), pt(7.5, 3.75), color=MUTED, stroke_width=2)
        self.play(Create(guide))
        kv = always_redraw(lambda: self.arrow(ORIGIN, v * k.get_value(), RES, 8).set_opacity(0.9))
        base = self.arrow(ORIGIN, v, V_COL, 4).set_z_index(3)
        klab = always_redraw(lambda: label(f"k = {fnum(k.get_value())}", 30, RES).to_corner(UR).shift(DOWN * 0.8))
        self.add(kv, base, klab)
        self.panel([("v = (2, 1)", V_COL), ("k·v — v ni k marta cho'zish", RES)])
        self.cap("k > 1 — cho'ziladi", wait=0.1)
        self.play(k.animate.set_value(2.5), run_time=2)
        self.cap("0 < k < 1 — qisqaradi", wait=0.1)
        self.play(k.animate.set_value(0.5), run_time=1.5)
        self.cap("k < 0 — teskari tomonga o'giriladi", ORANGE_C, wait=0.1)
        self.play(k.animate.set_value(-1.5), run_time=2)
        self.cap("Hamma k·v bitta to'g'ri chiziqda yotadi (punktir)", wait=2.5)


class Kombinatsiya(LT):
    def construct(self):
        self.plain()
        self.title("Chiziqli kombinatsiya va qobiq (span)")
        v, w0, w1 = np.array([2.0, 1.0]), np.array([-1.0, 1.5]), np.array([1.0, 0.5])
        ws = ValueTracker(0)

        def W():
            s = ws.get_value()
            return (1 - s) * w0 + s * w1

        al, be = ValueTracker(1.0), ValueTracker(1.0)
        V = self.arrow(ORIGIN, pt(*v), V_COL).set_z_index(3)
        Wa = always_redraw(lambda: self.arrow(ORIGIN, pt(*W()), PINK).set_z_index(3))
        self.play(GrowArrow(V))
        self.add(Wa)
        self.panel([("v = (2, 1)", V_COL), ("w = (−1, 1.5)", PINK), ("α·v + β·w — chiziqli kombinatsiya", RES)])

        def R():
            return al.get_value() * v + be.get_value() * W()

        part1 = always_redraw(lambda: self.arrow(ORIGIN, pt(*(al.get_value() * v)), V_COL, 3).set_opacity(0.55))
        part2 = always_redraw(lambda: self.arrow(pt(*(al.get_value() * v)), pt(*R()), PINK, 3).set_opacity(0.55))
        res = always_redraw(lambda: self.arrow(ORIGIN, pt(*R()), RES, 6))
        ab = always_redraw(lambda: label(f"α = {fnum(al.get_value())},  β = {fnum(be.get_value())}", 28, RES).to_corner(UR).shift(DOWN * 0.8))
        self.add(part1, part2, res, ab)
        self.cap("α va β o'zgarsa, natija (ko'k) tekislik bo'ylab yuradi", wait=0.2)
        self.play(al.animate.set_value(-1), be.animate.set_value(1.5), run_time=2)
        self.play(al.animate.set_value(1.5), be.animate.set_value(-1), run_time=2)
        self.play(al.animate.set_value(0.5), be.animate.set_value(0.8), run_time=1.5)
        self.play(FadeOut(part1), FadeOut(part2), FadeOut(res), FadeOut(ab))

        rng = np.random.default_rng(3)
        coefs = rng.uniform(-3, 3, size=(260, 2))
        dots = VGroup(*[Dot(radius=0.045, color=RES) for _ in coefs])

        def upd(g):
            for d, (a, b) in zip(g, coefs):
                d.move_to(pt(*(a * v + b * W())))

        upd(dots)
        self.cap("Barcha mumkin bo'lgan α·v + β·w nuqtalari — qobiq (span)", wait=0.1)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in dots], lag_ratio=0.01), run_time=3)
        dots.add_updater(upd)
        self.cap("v va w har xil yo'nalishda → qobiq BUTUN tekislik", I_COL, wait=1.8)
        self.cap("Endi w ni v chizig'iga buramiz…", wait=0.1)
        self.play(ws.animate.set_value(1), run_time=3)
        self.panel([("v = (2, 1)", V_COL), ("w = (1, 0.5) = 0.5·v", PINK)])
        self.cap("w = 0.5·v → qobiq faqat CHIZIQ: w yangi yo'nalish bermadi", ORANGE_C, wait=3)


class ChiziqliBoglik(LT):
    def construct(self):
        self.plain()
        self.title("Chiziqli bog'liqlik: ortiqcha vektor")
        v, w, u = np.array([2.0, 1.0]), np.array([-1.0, 1.5]), np.array([2.0, 3.0])
        V = self.arrow(ORIGIN, pt(*v), V_COL)
        W = self.arrow(ORIGIN, pt(*w), PINK)
        U = self.arrow(ORIGIN, pt(*u), PURPLE_B)
        self.play(GrowArrow(V), GrowArrow(W))
        self.play(GrowArrow(U))
        base = [("v = (2, 1)", V_COL), ("w = (−1, 1.5)", PINK), ("u = (2, 3)", PURPLE_B)]
        self.panel(base)
        self.cap("Tekislikda uchta vektor. u yangi yo'nalish beradimi?", wait=1.2)
        p1 = self.arrow(ORIGIN, pt(*(1.5 * v)), V_COL, 7)
        self.cap("1.5·v …", V_COL, wait=0.1)
        self.play(GrowArrow(p1), run_time=1.3)
        p2 = self.arrow(pt(*(1.5 * v)), pt(*u), PINK, 7)
        self.cap("… + w — aynan u ga yetdik!", PINK, wait=0.1)
        self.play(GrowArrow(p2), run_time=1.3)
        self.panel(base + [("u = 1.5·v + w", RES)])
        self.wait(1)
        self.play(U.animate.set_opacity(0.25))
        back = self.arrow(pt(*u), ORIGIN, PURPLE_B, 7)
        self.cap("−u bilan boshga qaytamiz: yo'l yopildi", PURPLE_B, wait=0.1)
        self.play(GrowArrow(back), run_time=1.3)
        tri = Polygon(ORIGIN, pt(*(1.5 * v)), pt(*u), stroke_width=0, fill_color=PURPLE_B, fill_opacity=0.2)
        self.play(FadeIn(tri))
        self.panel(base + [("1.5·v + w − u = 0", RES), ("koeffitsiyentlar nolmas → BOG'LIQ", ORANGE_C)])
        self.cap("Erkli vektorlarda yopiq yo'l faqat 0·v + 0·w = 0", wait=2.2)
        self.cap("Tekislikda ko'pi bilan 2 ta erkli vektor → tekislik 2 o'lchovli", RES, wait=2.5)


class SkalyarKopaytma(LT):
    def construct(self):
        self.plain()
        self.title("Skalyar ko'paytma = |a| × soya")
        L = 2.5
        th = ValueTracker(50)

        def b():
            t = np.radians(th.get_value())
            return np.array([L * np.cos(t), L * np.sin(t)])

        A = self.arrow(ORIGIN, pt(3, 0), V_COL).set_z_index(3)
        B = always_redraw(lambda: self.arrow(ORIGIN, pt(*b()), PINK).set_z_index(3))
        arc = always_redraw(lambda: Arc(radius=0.6, start_angle=0, angle=np.radians(th.get_value()), color=WHITE, stroke_width=3))
        drop = always_redraw(lambda: DashedLine(pt(*b()), pt(b()[0], 0), color=WHITE, stroke_width=2))
        shadow = always_redraw(lambda: Line(ORIGIN, pt(b()[0] + 1e-4, 0), stroke_width=14,
                                            color=RES if b()[0] >= 0 else ORANGE_C).set_opacity(0.85).set_z_index(4))

        def info():
            x = b()[0]
            col = RES if x > 0.02 else (ORANGE_C if x < -0.02 else WHITE)
            return label(f"a·b = 3 × ({fnum(x)}) = {fnum(3 * x)}", 30, col).to_corner(UR).shift(DOWN * 0.8)

        self.play(GrowArrow(A))
        self.add(B, arc)
        self.panel([("a = (3, 0)", V_COL), ("|b| = 2.5", PINK)])
        self.cap("b ga tepadan yorug'lik tushiramiz — a chizig'idagi soyasi", wait=0.2)
        self.play(FadeIn(drop))
        self.add(shadow, always_redraw(info))
        self.wait(1)
        self.panel([("a·b = a₁b₁ + a₂b₂", WHITE), ("     = |a|·|b|·cos θ", WHITE), ("     = |a| × soya", RES)])
        self.cap("Burchak o'tkir → soya a tomonda → a·b > 0", RES, wait=0.2)
        self.play(th.animate.set_value(90), run_time=2.5)
        self.cap("θ = 90° → soya yo'q → a·b = 0 (perpendikulyar)", WHITE, wait=1.2)
        self.play(th.animate.set_value(140), run_time=2.5)
        self.cap("Burchak o'tmas → soya teskari tomonda → a·b < 0", ORANGE_C, wait=1.8)
        self.play(th.animate.set_value(50), run_time=2)
        self.cap("Ikki formula — bitta son: sonlar ↔ strelkalar tarjimasi", wait=2.5)


class ToGriChiziq(LT):
    def construct(self):
        self.plain()
        self.title("To'g'ri chiziq: nuqta + yo'nalish")
        M0, s, n = np.array([-2.0, 0.0]), np.array([2.0, 1.0]), np.array([1.0, -2.0])
        dot0 = Dot(pt(*M0), color=V_COL, radius=0.1).set_z_index(5)
        self.play(FadeIn(dot0, scale=2))
        self.cap("M₀(−2, 0) — chiziqdagi bitta nuqta", V_COL, wait=0.8)
        S = self.arrow(pt(*M0), pt(*(M0 + s)), ORANGE_C, 6).set_z_index(4)
        self.play(GrowArrow(S))
        self.cap("s = (2, 1) — yo'naltiruvchi vektor", ORANGE_C, wait=0.8)

        t = ValueTracker(0)
        P = always_redraw(lambda: Dot(pt(*(M0 + t.get_value() * s)), color=WHITE, radius=0.1).set_z_index(5))
        trail = always_redraw(lambda: Line(pt(*M0), pt(*(M0 + (t.get_value() + 1e-4) * s)), color=RES, stroke_width=5))
        tl = always_redraw(lambda: label(f"t = {fnum(t.get_value())}", 28).to_corner(UR).shift(DOWN * 0.8))
        self.add(trail, P, tl)
        self.panel(["Parametrik tenglama:", ("x = −2 + 2t", RES), ("y = t", RES)])
        self.cap("r = r₀ + t·s: t o'zgarsa, nuqta chiziq bo'ylab yuradi", wait=0.2)
        self.play(t.animate.set_value(2.5), run_time=2.5)
        self.play(t.animate.set_value(-2), run_time=2.5)
        ln = Line(pt(*(M0 - 3 * s)), pt(*(M0 + 4.5 * s)), color=RES, stroke_width=4)
        self.play(FadeOut(trail), FadeOut(P), FadeOut(tl), Create(ln), run_time=1.2)

        N = self.arrow(pt(*M0), pt(*(M0 + 0.75 * n)), PINK, 6).set_z_index(4)
        self.play(GrowArrow(N))
        self.cap("n = (1, −2) — normal vektor: n·s = 2 − 2 = 0, ya'ni perpendikulyar", PINK, wait=2)
        self.panel([
            ("Umumiy:  x − 2y + 2 = 0", WHITE), ("   (x, y oldidagi sonlar — n)", PINK),
            ("Burchak koeff.:  y = 0.5x + 1", WHITE),
            ("Kesmalarda:  x/(−2) + y/1 = 1", WHITE),
            ("Parametrik:  x = −2 + 2t,  y = t", WHITE),
        ], size=24)
        self.play(FadeIn(Dot(pt(0, 1), color=RES, radius=0.1).set_z_index(5), scale=2))
        self.cap("Bitta chiziq — bir nechta yozuv. Hammasi M₀, s va n dan kelib chiqadi", wait=3)


# =====================================================================
#  MATRITSALAR
# =====================================================================

SUB = str.maketrans("0123456789", "₀₁₂₃₄₅₆₇₈₉")


def p_(x):
    """Ko'paytuvchi: manfiy bo'lsa qavsda."""
    return f"({fnum(x)})" if x < 0 else fnum(x)


class SatrniUstunga(LT):
    def construct(self):
        self.title("Matritsalarni ko'paytirish: satrni ustunga")
        A = [[2, -1, 3], [0, 4, 1]]
        B = [[1, 2], [3, -1], [0, 5]]
        C = [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(2)] for i in range(2)]
        gA, gB, gC = mat_grid(A, 32), mat_grid(B, 32), mat_grid(C, 32, col_colors=[RES, RES])
        gB.move_to(pt(2.6, 1.3))
        gA.move_to(pt(-1.6, -1.4))
        gC.move_to(pt(gB.get_center()[0], gA.get_center()[1]))
        for c in gC.cells:
            for x in c:
                x.set_opacity(0)
        lA = Text("A  (2×3)", font_size=24, color=MUTED).next_to(gA, LEFT, buff=0.35)
        lB = Text("B  (3×2)", font_size=24, color=MUTED).next_to(gB, UP, buff=0.2)
        lC = Text("AB  (2×2)", font_size=24, color=MUTED).next_to(gC, RIGHT, buff=0.35)
        self.play(FadeIn(gA), FadeIn(gB), FadeIn(lA), FadeIn(lB))
        self.play(FadeIn(gC), FadeIn(lC))
        self.cap("A ning ustunlari soni = B ning satrlari soni (3 = 3) → ko'paytirish mumkin", wait=1.5)

        for i in range(2):
            for j in range(2):
                slow = i == 0 and j == 0
                rr = SurroundingRectangle(VGroup(*gA.cells[i]), color=YELLOW, buff=0.12, corner_radius=0.08)
                cr = SurroundingRectangle(VGroup(*[gB.cells[k][j] for k in range(3)]), color=RED_C, buff=0.12, corner_radius=0.08)
                cell = SurroundingRectangle(gC.cells[i][j], color=RES, buff=0.12, corner_radius=0.08)
                self.play(Create(rr), Create(cr), Create(cell), run_time=0.6 if slow else 0.4)
                terms = [f"{p_(A[i][k])}·{p_(B[k][j])}" for k in range(3)]
                name = f"c{i + 1}{j + 1}".translate(SUB)
                if slow:
                    self.cap(f"{name}: A ning {i + 1}-satri × B ning {j + 1}-ustuni", wait=0.6)
                    for k in range(3):
                        self.play(Indicate(gA.cells[i][k], color=YELLOW), Indicate(gB.cells[k][j], color=RED_C), run_time=0.7)
                    self.cap(f"{name} = " + " + ".join(terms) + f" = {fnum(C[i][j])}", RES, wait=0.4)
                else:
                    self.cap(f"{name} = " + " + ".join(terms) + f" = {fnum(C[i][j])}", RES, wait=0.2, size=26)
                self.play(gC.cells[i][j].animate.set_opacity(1), run_time=0.5)
                self.wait(0.5 if slow else 0.3)
                self.play(FadeOut(rr), FadeOut(cr), FadeOut(cell), run_time=0.3)
        self.cap("Har bir element — satr va ustunning skalyar ko'paytmasi", wait=3)


def labeled_mat(name, rows, col_colors=None):
    g = mat_grid(rows, 28, col_colors=col_colors)
    t = Text(name + " =", font_size=28)
    grp = VGroup(t, g).arrange(RIGHT, buff=0.25)
    grp.add_background_rectangle(opacity=0.85, buff=0.15)
    grp.set_z_index(10)
    return grp


class Kompozitsiya(LT):
    def construct(self):
        self.setup_plane()
        self.title("Ko'paytma = ikki harakatni ketma-ket bajarish")
        unit = [[0, 0], [1, 0], [1, 1], [0, 1]]
        self.add(self.shape(unit, YELLOW, 0.3))
        R = np.array([[0, -1], [1, 0]])
        S = np.array([[1, 1], [0, 1]])
        self.panel([("A — 90° ga burish", WHITE), ("B — siljitish (shear)", WHITE)])
        self.cap("Avval A (burish)…", wait=0.1)
        self.apply(R, 2)
        self.cap("…keyin B (siljitish). Natija matritsasi: BA", wait=0.1)
        self.apply(S, 2)
        BA = S @ R
        ghost = DashedVMobject(Polygon(*[pt(*(BA @ np.array(p))) for p in unit], color=YELLOW, stroke_width=4)).set_z_index(6)
        self.add(ghost)
        mBA = labeled_mat("BA", BA.tolist(), [I_COL, J_COL]).to_corner(UR).shift(DOWN * 0.8)
        self.play(FadeIn(mBA))
        self.wait(1)
        self.cap("Endi boshiga qaytib, tartibni almashtiramiz", wait=0.1)
        self.to(np.eye(2), 1.8)
        self.cap("Avval B (siljitish)…", wait=0.1)
        self.apply(S, 2)
        self.cap("…keyin A (burish). Natija: AB", wait=0.1)
        self.apply(R, 2)
        mAB = labeled_mat("AB", (R @ S).tolist(), [I_COL, J_COL]).next_to(mBA, DOWN, buff=0.2, aligned_edge=RIGHT)
        self.play(FadeIn(mAB))
        self.cap("Kvadrat boshqa joyga tushdi (punktir — BA natijasi): AB ≠ BA", ORANGE_C, wait=3)


class Sarrus(LT):
    def construct(self):
        self.title("3-tartibli determinant: Sarrus usuli")
        A = [[2, 6, 2], [1, 5, 4], [3, 1, 0]]
        ext = [r + r[:2] for r in A]
        g = mat_grid(ext, 34)
        g.move_to(pt(-2.6, 0.2))
        for r in g.cells:
            for x in r[3:]:
                x.set_opacity(0.45)
        sep_x = (g.cells[0][2].get_center()[0] + g.cells[0][3].get_center()[0]) / 2
        sep = Line(pt(sep_x, g.get_top()[1]), pt(sep_x, g.get_bottom()[1]), color=MUTED, stroke_width=2)
        main = VGroup(*[c for r in g.cells for c in r[:3]])
        self.play(FadeIn(g[0]), FadeIn(VGroup(*[c for r in g.cells for c in r[:3]])), FadeIn(g[2]))
        self.cap("1- va 2-ustunlarni o'ng tomonga qayta yozamiz", wait=0.2)
        self.play(FadeIn(VGroup(*[c for r in g.cells for c in r[3:]]), shift=LEFT * 0.3), Create(sep))
        self.wait(0.6)

        diags = [([(0, 0), (1, 1), (2, 2)], 1), ([(0, 1), (1, 2), (2, 3)], 1), ([(0, 2), (1, 3), (2, 4)], 1),
                 ([(0, 2), (1, 1), (2, 0)], -1), ([(0, 3), (1, 2), (2, 1)], -1), ([(0, 4), (1, 3), (2, 2)], -1)]
        lst = VGroup()
        total = 0
        for idx, (cells, sign) in enumerate(diags):
            if idx == 0:
                self.cap("Bosh diagonalga parallel 3 ta diagonal — '+' ishora bilan", RES, wait=0.3)
            if idx == 3:
                self.cap("Yordamchi diagonalga parallel 3 tasi — '−' ishora bilan", ORANGE_C, wait=0.3)
            col = RES if sign > 0 else ORANGE_C
            a, b = g.cells[cells[0][0]][cells[0][1]], g.cells[cells[2][0]][cells[2][1]]
            line = Line(a.get_center(), b.get_center(), color=col, stroke_width=10).set_opacity(0.45).set_z_index(5)
            vals = [ext[i][j] for i, j in cells]
            prod = sign * vals[0] * vals[1] * vals[2]
            total += prod
            row = Text(f"{'+' if sign > 0 else '−'} {'·'.join(p_(v) for v in vals)} = {fnum(prod)}", font_size=28, color=col)
            if len(lst):
                row.next_to(lst[-1], DOWN, aligned_edge=LEFT, buff=0.18)
            else:
                row.move_to(pt(3.6, 2.0))
            self.play(Create(line), run_time=0.6)
            self.play(FadeIn(row, shift=LEFT * 0.2), run_time=0.5)
            lst.add(row)
            self.wait(0.4)
            self.play(line.animate.set_opacity(0.12), run_time=0.3)
        res = Text(f"Δ = {fnum(total)}", font_size=34, color=YELLOW).next_to(lst, DOWN, buff=0.35, aligned_edge=LEFT)
        self.play(Write(res))
        self.cap("Δ = 0 + 72 + 2 − 30 − 8 − 0 = 36", YELLOW, wait=1.8)
        self.cap("Ma'nosi: 3 ta ustun-vektordan yasalgan parallelepiped hajmi", wait=3)


# =====================================================================
#  TENGLAMALAR SISTEMASI
# =====================================================================

def line_abc(a, b, c, color, width=5):
    """ax + by = c chizig'i (kadr chegarasidan tashqarigacha)."""
    if abs(b) >= abs(a):
        p, q = pt(-9, (c + 9 * a) / b), pt(9, (c - 9 * a) / b)
    else:
        p, q = pt((c + 6 * b) / a, -6), pt((c - 6 * b) / a, 6)
    return Line(p, q, color=color, stroke_width=width)


class TenglamalarSistemasi(LT):
    def construct(self):
        self.plain()
        self.title("Tenglamalar sistemasi: ikki xil ko'rinish")
        self.panel([("2x + y = 5", V_COL), ("x − y = 1", PINK)])
        L1 = line_abc(2, 1, 5, V_COL)
        L2 = line_abc(1, -1, 1, PINK)
        self.cap("1-ko'rinish: har bir tenglama — to'g'ri chiziq", wait=0.1)
        self.play(Create(L1), run_time=1.2)
        self.play(Create(L2), run_time=1.2)
        X = Dot(pt(2, 1), color=WHITE, radius=0.11).set_z_index(5)
        self.play(FadeIn(X, scale=2.5))
        self.cap("Yechim — ikkala chiziqda yotgan nuqta: (2, 1)", wait=2)

        self.play(FadeOut(L1), FadeOut(L2), FadeOut(X))
        self.panel([("x·(2, 1) + y·(1, −1) = (5, 1)", WHITE), ("a₁ = (2, 1)", I_COL), ("a₂ = (1, −1)", J_COL), ("b = (5, 1)", RES)])
        a1, a2, b = pt(2, 1), pt(1, -1), pt(5, 1)
        A1 = self.arrow(ORIGIN, a1, I_COL)
        A2 = self.arrow(ORIGIN, a2, J_COL)
        Bv = self.arrow(ORIGIN, b, RES)
        self.cap("2-ko'rinish: b ni ustunlarning kombinatsiyasi qilib yozish", wait=0.1)
        self.play(GrowArrow(A1), GrowArrow(A2))
        self.play(GrowArrow(Bv))
        self.wait(0.6)
        s1 = self.arrow(ORIGIN, 2 * a1, I_COL, 8).set_opacity(0.75)
        self.cap("x = 2: a₁ ni 2 marta olamiz…", I_COL, wait=0.1)
        self.play(GrowArrow(s1), run_time=1.3)
        s2 = self.arrow(2 * a1, 2 * a1 + a2, J_COL, 8).set_opacity(0.75)
        self.cap("…y = 1: a₂ ni qo'shamiz — aynan b ga yetdik!", J_COL, wait=0.1)
        self.play(GrowArrow(s2), run_time=1.3)
        self.wait(0.8)
        self.cap("Ikkala ko'rinish ham bir xil javob beradi: x = 2, y = 1", RES, wait=3)


class GaussUsuli(LT):
    def construct(self):
        self.plain()
        self.title("Gauss usuli: chiziqlar yechim atrofida buriladi")
        R1, R2 = np.array([2.0, 1.0, 5.0]), np.array([1.0, -1.0, 1.0])
        states = [(R1, R2)]
        r2a = R2 - (R2[0] / R1[0]) * R1
        states.append((R1, r2a))
        r2b = r2a / r2a[1]
        states.append((R1, r2b))
        r1a = R1 - R1[1] * r2b
        states.append((r1a, r2b))
        r1b = r1a / r1a[0]
        states.append((r1b, r2b))
        ops = [
            "R₂ ← R₂ − 0.5·R₁  →  x yo'qoldi (chiziq gorizontal)",
            "R₂ ← R₂ : (−1.5)  →  y = 1",
            "R₁ ← R₁ − 1·R₂  →  y yo'qoldi (chiziq vertikal)",
            "R₁ ← R₁ : 2  →  x = 2",
        ]
        s = ValueTracker(0)

        def rows():
            v = s.get_value()
            k = min(3, int(np.floor(v)))
            f = smooth(v - k) if v < 4 else 1
            a, b = states[k], states[min(4, k + 1)]
            return (1 - f) * a[0] + f * b[0], (1 - f) * a[1] + f * b[1]

        L1 = always_redraw(lambda: line_abc(*rows()[0], V_COL))
        L2 = always_redraw(lambda: line_abc(*rows()[1], PINK))

        def eqs():
            r1, r2 = rows()
            g = VGroup(
                Text(f"{lin([(r1[0], 'x'), (r1[1], 'y')])} = {fnum(r1[2])}", font_size=28, color=V_COL),
                Text(f"{lin([(r2[0], 'x'), (r2[1], 'y')])} = {fnum(r2[2])}", font_size=28, color=PINK),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
            g.add_background_rectangle(opacity=0.85, buff=0.15)
            return g.to_corner(UL).shift(DOWN * 0.75).set_z_index(10)

        X = Dot(pt(2, 1), color=WHITE, radius=0.11).set_z_index(5)
        self.play(Create(L1), Create(L2))
        self.add(always_redraw(eqs), X)
        self.cap("Yechim (2, 1) — oq nuqta. Qator amallari uni o'zgartirmaydi", wait=1.5)
        for i, op in enumerate(ops):
            self.cap(op, wait=0.1, size=26)
            self.play(s.animate.set_value(i + 1), run_time=2.2)
            self.wait(0.6)
        self.cap("Yangi tenglama = eskilarning kombinatsiyasi → (2, 1) doim ikkala chiziqda", RES, wait=3)


class KramerQoidasi(LT):
    def construct(self):
        self.plain()
        self.title("Kramer qoidasi: yechim = yuzalar nisbati")
        a1, a2 = np.array([2.0, 0.0]), np.array([0.5, 1.5])
        x, y = 1.5, 1.0
        b = x * a1 + y * a2
        s = ValueTracker(0)

        def side():
            v = s.get_value()
            if v <= 1:
                return a1 * (1 + (x - 1) * smooth(v))
            return x * a1 + a2 * y * smooth(v - 1)

        base = Polygon(ORIGIN, pt(*a1), pt(*(a1 + a2)), pt(*a2), color=MUTED, fill_color=MUTED, fill_opacity=0.15, stroke_width=2)
        par = always_redraw(lambda: Polygon(ORIGIN, pt(*side()), pt(*(side() + a2)), pt(*a2), color=YELLOW,
                                            fill_color=YELLOW, fill_opacity=0.28, stroke_width=3))
        A1 = self.arrow(ORIGIN, pt(*a1), I_COL).set_z_index(3)
        A2 = self.arrow(ORIGIN, pt(*a2), J_COL).set_z_index(3)
        Bv = self.arrow(ORIGIN, pt(*b), RES).set_z_index(3)
        area = always_redraw(lambda: label(f"yuza = {fnum(side()[0] * a2[1] - side()[1] * a2[0])}", 30, YELLOW).to_corner(UR).shift(DOWN * 0.8))
        self.play(FadeIn(base), GrowArrow(A1), GrowArrow(A2))
        self.panel([("x·a₁ + y·a₂ = b", WHITE), ("Δ = det(a₁, a₂) = 3", MUTED)])
        self.cap("Ustunlardan yasalgan parallelogramm yuzasi — Δ = 3", wait=1.2)
        self.play(GrowArrow(Bv))
        self.cap("b = (3.5, 1.5). Endi a₁ o'rniga b qo'ysak, yuza qanday bo'ladi?", wait=1.2)
        self.add(par, area)
        self.cap("1-qadam: a₁ ni x marta cho'zamiz → yuza ham x marta o'zgaradi", YELLOW, wait=0.1)
        self.play(s.animate.set_value(1), run_time=2.2)
        self.wait(0.6)
        self.cap("2-qadam: a₂ bo'ylab suramiz → asos va balandlik bir xil, yuza o'zgarmaydi", YELLOW, wait=0.1, size=26)
        self.play(s.animate.set_value(2), run_time=2.2)
        self.panel([("x·a₁ + y·a₂ = b", WHITE), ("Δ = det(a₁, a₂) = 3", MUTED), ("Δₓ = det(b, a₂) = 4.5 = x·Δ", YELLOW),
                    ("x = Δₓ / Δ = 4.5 / 3 = 1.5", RES)])
        self.cap("Uchi aynan b ga keldi: Δₓ = x·Δ, demak x = Δₓ / Δ", RES, wait=3)


class TeskariMatritsa(LT):
    def construct(self):
        self.setup_plane()
        self.title("Teskari matritsa: A qilgan ishni bekor qilish")
        unit = [[0, 0], [1, 0], [1, 1], [0, 1]]
        self.add(self.shape(unit, YELLOW, 0.3))
        A = np.array([[1.0, 1.0], [-0.5, 1.0]])
        mA = labeled_mat("A", [[1, 1], [-0.5, 1]], [I_COL, J_COL]).to_corner(UR).shift(DOWN * 0.8)
        self.play(FadeIn(mA))
        self.cap("A tekislikni o'zgartiradi (det A = 1.5)", wait=0.1)
        self.apply(A, 2.2)
        self.wait(0.5)
        Ai = np.linalg.inv(A)
        mAi = labeled_mat("A⁻¹", [[round(v, 2) for v in r] for r in Ai.tolist()], [I_COL, J_COL]).next_to(mA, DOWN, buff=0.2, aligned_edge=RIGHT)
        self.play(FadeIn(mAi))
        self.cap("A⁻¹ — hammasini joyiga qaytaradi", RES, wait=0.1)
        self.apply(Ai, 2.2)
        self.cap("A⁻¹·A = E: 'avval A, keyin A⁻¹' = hech narsa qilmaslik", wait=2)
        self.play(FadeOut(mA), FadeOut(mAi))

        S = np.array([[1.0, 2.0], [0.5, 1.0]])
        mS = labeled_mat("A", [[1, 2], [0.5, 1]], [I_COL, J_COL]).to_corner(UR).shift(DOWN * 0.8)
        self.play(FadeIn(mS))
        ker = np.array([-2.0, 1.0]) / np.sqrt(5)
        pts = [np.array([1.0, 0.5]) + k * 0.9 * ker for k in (-2, -1, 0, 1, 2)]
        dots = [always_redraw(lambda p=p: Dot(self.img(p), color=PINK, radius=0.1).set_z_index(6)) for p in pts]
        self.add(*dots)
        self.cap("Endi det A = 0 bo'lgan matritsa. Pushti — 5 ta turli nuqta", PINK, wait=1)
        self.apply(S, 2.5)
        self.cap("Hammasi BITTA nuqtaga tushdi! Qaysi biridan kelganini bilib bo'lmaydi", ORANGE_C, wait=2.2)
        self.cap("Shuning uchun det A = 0 bo'lsa, A⁻¹ mavjud emas", ORANGE_C, wait=3)


class MatritsaRangi(LT):
    def construct(self):
        self.setup_plane()
        self.title("Rang — natija necha o'lchovli")
        A = np.array([[1.0, 1.0], [-0.5, 1.0]])
        S = np.array([[1.0, 2.0], [0.5, 1.0]])
        r = always_redraw(lambda: label(self._rank_text, 32, RES).to_corner(UR).shift(DOWN * 0.8))
        self._rank_text = "r = 2"
        self.cap("Ustunlar erkli → tekislik yana tekislikka o'tadi", wait=0.1)
        self.apply(A, 2.2)
        self.add(r)
        self.wait(1.2)
        self.to(np.eye(2), 1.5)
        self.cap("Ustunlar bog'liq (2-ustun = 2 × 1-ustun)…", wait=0.1)
        self.apply(S, 2.5)
        self._rank_text = "r = 1"
        self.cap("…butun tekislik CHIZIQQA yassilandi → rang 1", ORANGE_C, wait=1.8)
        bOff = self.arrow(ORIGIN, pt(-2, 2), RES).set_z_index(5)
        self.play(GrowArrow(bOff))
        self.panel([("Ax = b ni yechish mumkinmi?", WHITE)])
        self.cap("b chiziqdan tashqarida → hech qanday x unga yetmaydi: yechim yo'q", ORANGE_C, wait=2)
        bOn = self.arrow(ORIGIN, pt(3, 1.5), RES).set_z_index(5)
        self.play(ReplacementTransform(bOff, bOn))
        self.cap("b chiziqda → cheksiz ko'p x unga tushadi", I_COL, wait=1.8)
        self.panel([("Kroneker–Kapelli:", WHITE), ("r(A) = r(A|b) → yechim bor", I_COL), ("r(A) < r(A|b) → yechim yo'q", ORANGE_C)])
        self.cap("Rang — almashtirishning 'haqiqiy' o'lchami", wait=3)
