"""Raumwerk's small geometry API; user programs get a fresh namespace each run."""
import math as _math
import json as _json

_objects = []
_parameters = []
_palette = ['#8870c9', '#2a997f', '#dca35d', '#5e91bb', '#d17f94']
datasets = {name: array.copy() for name, array in globals().get('_dataset_arrays', {}).items()}

def data(name):
    """Get an imported dataset as a NumPy array in the current execution."""
    if name not in datasets:
        available = ', '.join(datasets) or 'keine'
        raise KeyError(f'Datensatz {name!r} fehlt. Verfügbar: {available}. XLSX-Datei über das Tabellen-Symbol importieren.')
    return datasets[name]

def scatter(points, *, name=None, color=None, size=5):
    """Efficient 2D/3D point cloud: one render object for up to 50,000 rows."""
    positions = []
    for index, p in enumerate(points):
        if index >= 50000:
            raise ValueError('scatter unterstützt höchstens 50.000 Punkte je Objekt.')
        positions.extend(_pos(p))
    size = _finite(size)
    if not 1 <= size <= 30:
        raise ValueError('Die Punktgröße muss zwischen 1 und 30 Pixeln liegen.')
    return _style('scatter', name or 'Punktwolke', color, positions=positions,
                  size=size, description=f'{len(positions)//3} Datenpunkte')

def _finite(v):
    v = float(v)
    if not _math.isfinite(v) or abs(v) > 1e7:
        raise ValueError('Koordinaten müssen endlich sein und zwischen -10⁷ und 10⁷ liegen.')
    return v

def _pos(v):
    v = list(v)
    if len(v) not in (2, 3):
        raise ValueError('Ein Punkt braucht zwei oder drei Koordinaten.')
    return [_finite(c) for c in v] + ([0.0] if len(v) == 2 else [])

def _style(kind, name, color, **kw):
    if len(_objects) >= 80:
        raise ValueError('Maximal 80 Objekte pro Szene.')
    result = dict(kind=kind, name=str(name or f'{kind} {len(_objects)+1}'),
                  color=str(color or _palette[len(_objects) % len(_palette)]), **kw)
    _objects.append(result)
    return result

def param(name, default=1.0, min=0.0, max=5.0, step=0.01):
    name = str(name)
    lo, hi, step = _finite(min), _finite(max), _finite(step)
    if lo >= hi or step <= 0:
        raise ValueError('Parameter brauchen min < max und step > 0.')
    value = _finite(_param_values.get(name, default))
    value = lo if value < lo else hi if value > hi else value
    if any(p['name'] == name for p in _parameters):
        raise ValueError(f'Parametername {name!r} ist doppelt vergeben.')
    _parameters.append(dict(name=name, value=value, min=lo, max=hi, step=step))
    return value

def plot(f, xrange=(-6, 6), *, name=None, color=None, samples=360):
    samples = int(samples)
    if not 2 <= samples <= 10000:
        raise ValueError('samples muss zwischen 2 und 10000 liegen.')
    a, b = map(_finite, xrange)
    paths, path = [], []
    for i in range(samples):
        x = a + (b-a)*i/(samples-1)
        try:
            p = [x, _finite(f(x)), 0.0]
            if path and abs(p[1]-path[-1][1]) > 50:
                paths.append(path); path = []
            path.append(p)
        except (ValueError, ZeroDivisionError, OverflowError):
            if path: paths.append(path)
            path = []
    if path: paths.append(path)
    return _style('plot', name or 'Funktionsgraph', color, paths=paths, description='y = f(x)', samples=samples)

def curve(f, trange=(0, 2*_math.pi), *, name=None, color=None, samples=500):
    samples = int(samples)
    if not 2 <= samples <= 10000:
        raise ValueError('samples muss zwischen 2 und 10000 liegen.')
    a, b = map(_finite, trange)
    paths, path = [], []
    for i in range(samples):
        try:
            path.append(_pos(f(a+(b-a)*i/(samples-1))))
        except (ValueError, ZeroDivisionError, OverflowError):
            if path: paths.append(path)
            path = []
    if path: paths.append(path)
    return _style('curve', name or 'Raumkurve', color, paths=paths, description='r(u) = (x, y, z)', samples=samples)

def surface(f, xrange=(-5,5), yrange=(-5,5), *, name=None, color=None, resolution=48, opacity=0.85, wireframe=False):
    n = int(resolution)
    if not 4 <= n <= 160:
        raise ValueError('resolution muss zwischen 4 und 160 liegen.')
    a, b = map(_finite, xrange)
    c, d = map(_finite, yrange)
    positions = []
    for j in range(n+1):
        y = c+(d-c)*j/n
        for i in range(n+1):
            x = a+(b-a)*i/n
            try: z = _finite(f(x,y))
            except (ValueError, ZeroDivisionError, OverflowError): z = None
            positions.extend([x,y,z])
    return _style('surface', name or 'Funktionsfläche', color, positions=positions, resolution=n,
                  opacity=float(opacity), wireframe=bool(wireframe), description='z = f(x, y)')

def point(position, *, name=None, color=None, size=0.09):
    return _style('point', name or 'Punkt', color, position=_pos(position), size=abs(_finite(size)), description='P = '+str(tuple(round(float(v), 2) for v in position)))

def vector(start, end, *, name=None, color=None):
    return _style('vector', name or 'Vektor', color, start=_pos(start), end=_pos(end), description='A → B')

def segment(start, end, *, name=None, color=None):
    return _style('segment', name or 'Strecke', color, paths=[[_pos(start),_pos(end)]], description='A — B')

def polygon(vertices, *, name=None, color=None, opacity=0.5):
    points = [_pos(v) for v in vertices]
    if not 3 <= len(points) <= 1000:
        raise ValueError('Ein Polygon braucht 3 bis 1000 Punkte.')
    return _style('polygon', name or 'Polygon', color, vertices=points, opacity=float(opacity), description=f'{len(points)} Eckpunkte')

def polyhedron(vertices, faces, *, name=None, color=None, opacity=0.7):
    points = [_pos(v) for v in vertices]
    face_list = [list(f) for f in faces]
    if not 4 <= len(points) <= 5000 or not 4 <= len(face_list) <= 5000:
        raise ValueError('Ein Polyeder braucht 4 bis 5000 Eckpunkte und Flächen.')
    for face in face_list:
        if len(face) < 3 or any(not isinstance(i, int) or i < 0 or i >= len(points) for i in face):
            raise ValueError('Flächen brauchen mindestens drei gültige Eckpunktindizes.')
    return _style('polyhedron', name or 'Polyeder', color, vertices=points, faces=face_list,
                  opacity=float(opacity), description=f'{len(points)} Ecken · {len(face_list)} Flächen')

def derivative(f, x, h=1e-5):
    if h <= 0: raise ValueError('h muss positiv sein.')
    return (f(x+h)-f(x-h))/(2*h)

def integrate(f, a, b, n=1000):
    n = int(n)
    if not 2 <= n <= 100000: raise ValueError('n muss zwischen 2 und 100000 liegen.')
    if n % 2: n += 1
    h = (b-a)/n
    return h/3*(f(a)+f(b)+4*sum(f(a+i*h) for i in range(1,n,2))+2*sum(f(a+i*h) for i in range(2,n,2)))

from math import *
