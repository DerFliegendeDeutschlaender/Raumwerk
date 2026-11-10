export const examples = [
{id:'wave',title:'Wellen im Raum',tag:'3D · FLÄCHEN · ANIMATION',description:'Eine radiale Welle, ein bewegter Punkt und deine ersten Live-Parameter.',view:'3d',visual:'wave',code:`# Eine Idee, drei Dimensionen.
# Ändere den Code. Sieh, was passiert.
from math import sin, cos, sqrt, exp

# Diese Werte werden zu Schiebereglern.
a = param("Amplitude", 1.8, min=0, max=3)
k = param("Frequenz", 1.4, min=0.2, max=3)

def welle(x, y):
    r = sqrt(x**2 + y**2)
    return a * sin(k*r - t) * exp(-0.12*r)

surface(welle, (-5, 5), (-5, 5),
        name="Wellenfläche", color="#9178cb")

curve(lambda u: (u, 0, welle(u, 0)),
      (-5, 5), name="Querschnitt",
      color="#288a72")

x = 2.5 * cos(t)
y = 2.5 * sin(t)
point((x, y, welle(x, y)),
      name="Wellenreiter", color="#d39b4f")

print(f"Amplitude: {a:.2f}")
print(f"z(0, 0) = {welle(0, 0):.3f}")
`},
{id:'functions',title:'Sinus & seine Tangente',tag:'2D · ANALYSIS · PYTHON',description:'Eigene Funktionen, Ableitung und Integral auf einer gemeinsamen Zeichenfläche.',view:'2d',visual:'sine',code:`# Dein Python-Funktionsplotter.
from math import sin, cos, pi

a = param("Amplitude", 1.5, min=0.1, max=3)
x0 = param("Tangentenpunkt", 1, min=-5, max=5)

def f(x):
    return a * sin(x - t)

m = derivative(f, x0)
plot(f, (-6, 6), name="Sinus", color="#8870c9")
plot(lambda x: f(x0) + m*(x-x0),
     (x0-2, x0+2), name="Tangente",
     color="#2a997f")
point((x0, f(x0)), name="Berührpunkt",
      color="#dca35d")

print(f"f'({x0:.2f}) = {m:.4f}")
print(f"Integral von 0 bis π: {integrate(f, 0, pi):.5f}")
`},
{id:'helix',title:'Die Doppelhelix',tag:'3D · PARAMETRISCHE KURVEN',description:'Raumkurven und Verbindungsstrecken. Drehe sie, ändere sie, animiere sie.',view:'3d',visual:'helix',code:`from math import sin, cos, pi

r = param("Radius", 1.5, min=0.3, max=3)
h = param("Steigung", 0.3, min=0.1, max=0.6)

def helix(u, phase=0):
    return (r*cos(u+t+phase),
            r*sin(u+t+phase), h*u-3)

curve(lambda u: helix(u), (0, 6*pi),
      name="Helix A", color="#8870c9")
curve(lambda u: helix(u, pi), (0, 6*pi),
      name="Helix B", color="#2a997f")

for i in range(25):
    u = 6*pi*i/24
    segment(helix(u), helix(u, pi),
            name=f"Brücke {i+1}", color="#c8bea4")

print(f"Höhe: {6*pi*h:.2f}")
`},
{id:'lissajous',title:'Lissajous-Figuren',tag:'2D / 3D · SCHWINGUNGEN',description:'Überlagerte Schwingungen zwischen Ordnung und komplexen Mustern.',view:'3d',visual:'lissajous',code:`from math import sin, cos, pi

a = param("Frequenz X", 3, min=1, max=7, step=1)
b = param("Frequenz Y", 2, min=1, max=7, step=1)
c = param("Tiefe", 1.5, min=0, max=3)

def bahn(u):
    return (3*sin(a*u + t),
            3*sin(b*u), c*cos(u))

curve(bahn, (0, 2*pi), name="Lissajous",
      color="#8870c9", samples=1200)
point(bahn(t), name="Oszillator",
      color="#dca35d", size=0.13)

print("Tiefe auf 0 setzen → ebene Figur")
`},
{id:'symbolic',title:'Exakt rechnen mit SymPy',tag:'CAS · SYMBOLISCHE MATHEMATIK',description:'Ableiten, integrieren, Gleichungen lösen – und das Ergebnis direkt zeichnen.',view:'2d',visual:'parabola',code:`# SymPy wird beim ersten Mal nachgeladen.
import sympy as sp

x = sp.symbols("x")
f = x**3 - 3*x
df = sp.diff(f, x)
F = sp.integrate(f, x)

print("f(x) =", f)
print("f'(x) =", df)
print("Stammfunktion:", F)
print("Nullstellen:", sp.solve(f, x))

fn = sp.lambdify(x, f, "math")
dn = sp.lambdify(x, df, "math")
plot(fn, (-2.3, 2.3), name="f(x)", color="#8870c9")
plot(dn, (-2.3, 2.3), name="f′(x)", color="#2a997f")
for i, root in enumerate(sp.solve(f, x)):
    point((float(root), 0), name=f"Nullstelle {i+1}")
`},
{id:'geometry',title:'Geometrie mit Python',tag:'3D · VEKTOREN · GEOMETRIE',description:'Baue aus Punkten, Vektoren und Flächen eigene räumliche Konstruktionen.',view:'3d',visual:'geometry',code:`from math import sin, cos

h = param("Höhe", 3, min=0, max=5)
A, B, C = (-3, -2, 0), (3, -2, 0), (0, 3, 0)
S = (sin(t), cos(t), h)

polygon([A, B, C], name="Grundfläche", color="#b6c79b")
polygon([A, B, S], name="Seite 1", color="#8870c9")
polygon([B, C, S], name="Seite 2", color="#2a997f")
polygon([C, A, S], name="Seite 3", color="#b2a0da")
for p, n in [(A,"A"), (B,"B"), (C,"C"), (S,"Spitze")]:
    point(p, name=n, color="#dca35d")
vector((0,0,0), S, name="Höhenvektor", color="#356b57")

print(f"Volumen = {15*h/3:.2f}")
`}
];
