"""Fetch the pinned browser runtime and optional NumPy/SymPy wheels from jsDelivr."""
from pathlib import Path
from urllib.request import urlopen
from concurrent.futures import ThreadPoolExecutor
import json

BASE = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/'
ROOT = Path(__file__).resolve().parent / 'dist' / 'vendor' / 'pyodide'
ROOT.mkdir(parents=True, exist_ok=True)

def fetch(name):
    target = ROOT / name
    if target.is_file() and target.stat().st_size:
        return name
    with urlopen(BASE + name, timeout=90) as response:
        data = response.read()
    temp = target.with_name(target.name + '.part')
    temp.write_bytes(data)
    temp.replace(target)
    print(f'{name}: {len(data):,} bytes', flush=True)
    return name

fetch('pyodide-lock.json')
lock = json.loads((ROOT / 'pyodide-lock.json').read_text(encoding='utf-8'))
needed = set()
def add_package(name):
    if name in needed: return
    needed.add(name)
    for dependency in lock['packages'][name].get('depends', []):
        add_package(dependency)

for name in ['numpy', 'sympy', 'micropip']:
    add_package(name)
files = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip']
files += [lock['packages'][name]['file_name'] for name in sorted(needed)]
with ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(fetch, files))
print('Browser runtime ready.', flush=True)
