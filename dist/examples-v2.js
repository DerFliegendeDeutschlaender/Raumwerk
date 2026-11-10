// Original programs; the quartz geometry is an idealized external habit, not an atomistic model.
export const newExamples=[
{id:'quartz',title:'Quarzkristall',tag:'GEOMETRIE · KRISTALLE · 3D',description:'Ein idealisiertes Quarzprisma mit sechs Seiten, Spitzen und einstellbarer Form.',view:'3d',visual:'quartz',code:`# Quarz: idealisierte äußere Kristallform.
# Kein atomistisches Gittermodell.
from math import sin, cos, pi

r = param("Radius", 1.5, min=0.4, max=3)
h = param("Prismenlänge", 4, min=1, max=6)
tip = param("Spitzenhöhe", 1.6, min=0.3, max=3)
alpha = param("Transparenz", 0.65, min=0.1, max=1)

def ring(z):
    return [(r*cos(i*pi/3 + t/5),
             r*sin(i*pi/3 + t/5), z) for i in range(6)]

ecken = ring(-h/2) + ring(h/2)
ecken += [(0, 0, h/2 + tip), (0, 0, -h/2 - tip)]
flaechen = []

for i in range(6):
    j = (i+1) % 6
    flaechen += [[i, j, j+6, i+6], [i+6, j+6, 12], [j, i, 13]]

polyhedron(ecken, flaechen, name="Quarzkristall",
           color="#9ec5df", opacity=alpha)
segment(ecken[13], ecken[12], name="c-Achse",
        color="#d8ab68")
print("Idealisiertes hexagonales Prisma")
print("α-Quarz besitzt trigonale Kristallsymmetrie.")
print("Play: Kristall um seine c-Achse drehen.")
`},
{id:'quantum-well',title:'Schrödinger im Potentialtopf',tag:'QUANTENPHYSIK · ANALYTISCHE LÖSUNG',description:'Normierte Überlagerung zweier Zustände im unendlich hohen 1D-Potentialtopf.',view:'2d',visual:'quantum',code:`# Exakte Lösung des unendlichen 1D-Potentialtopfs.
# 0 < x < L; V=0 innen, V=∞ außerhalb.
# Reduzierte Einheiten: ħ=1 und 2m=1.
# t ist hier Modellzeit, keine physikalische Sekunde.
from math import sin, cos, sqrt, pi
from cmath import exp

L = param("Topfbreite L", 6, min=3, max=9)
n = int(param("Zustand n", 1, min=1, max=5, step=1))
theta = param("Mischwinkel", 0.65, min=0, max=1.57)
phase = param("Relative Phase", 0, min=0, max=6.28)

def energie(k):
    return (k*pi/L)**2

def eigen(k, x):
    return sqrt(2/L)*sin(k*pi*x/L)

def psi(x):
    return (cos(theta)*eigen(n,x)*exp(-1j*energie(n)*t)
          + sin(theta)*eigen(n+1,x)*exp(1j*phase)
            *exp(-1j*energie(n+1)*t))

plot(lambda x: psi(x).real, (0,L), name="Re ψ",
     color="#b199ef", samples=600)
plot(lambda x: psi(x).imag, (0,L), name="Im ψ",
     color="#67c6b1", samples=600)
plot(lambda x: abs(psi(x))**2, (0,L), name="|ψ|²",
     color="#e2b66d", samples=600)
segment((0,-0.8),(0,1.1), name="Linke Wand", color="#91a1b0")
segment((L,-0.8),(L,1.1), name="Rechte Wand", color="#91a1b0")

norm = integrate(lambda x: abs(psi(x))**2, 0, L)
print(f"E_{n} = {energie(n):.5f}, E_{n+1} = {energie(n+1):.5f}")
print(f"Normierung ∫|ψ|² dx = {norm:.8f}")
print("Play zeigt die zeitabhängige Interferenz.")
`},
{id:'quantum-2d',title:'Quantenzustand in 2D',tag:'QUANTENPHYSIK · DICHTE ALS FLÄCHE',description:'Wahrscheinlichkeitsdichte eines Teilchens in einem quadratischen 2D-Potentialtopf.',view:'3d',visual:'wave',code:`# 2D-Potentialtopf: exakter stationärer Zustand.
# z zeigt die Dichte |ψ(x,y)|², keine dritte Ortsachse.
from math import sin, pi

L = param("Seitenlänge", 5, min=3, max=8)
nx = int(param("Quantenzahl X", 2, min=1, max=5, step=1))
ny = int(param("Quantenzahl Y", 3, min=1, max=5, step=1))

def dichte(x,y):
    return (2/L*sin(nx*pi*x/L)*sin(ny*pi*y/L))**2

surface(dichte, (0,L), (0,L), name="|ψ(x,y)|²",
        color="#a98cdb", resolution=80)
print(f"E = {(nx*nx+ny*ny)*pi*pi/L**2:.6f}")
print("Einheiten: ħ=1, 2m=1. ∫∫|ψ|² dx dy = 1.")
print("Stationärer Zustand: Dichte ist zeitunabhängig.")
`},
{id:'fourier',title:'Fourier-Reihe',tag:'ANALYSIS · ÜBERLAGERUNG · 2D',description:'Aus Sinusschwingungen eine Rechteckwelle aufbauen und den Gibbs-Effekt beobachten.',view:'2d',visual:'sine',code:`from math import sin, pi

N = int(param("Anzahl Terme", 7, min=1, max=30, step=1))

def fourier(x):
    return 4/pi*sum(sin((2*k+1)*(x-t))/(2*k+1)
                    for k in range(N))

plot(fourier, (-2*pi,2*pi), name="Fourier-Summe",
     color="#b199ef", samples=1200)
plot(lambda x: sin(x-t)*4/pi, (-2*pi,2*pi),
     name="Grundschwingung", color="#67c6b1")
print(f"{N} ungerade Harmonische")
print("Play verschiebt die Welle. Mehr Terme: steilere Flanken.")
`}
];
