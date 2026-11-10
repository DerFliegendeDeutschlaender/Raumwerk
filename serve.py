"""Raumwerk lokal starten: python serve.py"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import webbrowser

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8767)
parser.add_argument('--no-browser', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent / 'dist'

class Handler(SimpleHTTPRequestHandler):
    # Windows registry mappings may incorrectly classify .mjs as text/plain.
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.mjs': 'text/javascript', '.js': 'text/javascript',
                      '.wasm': 'application/wasm', '.whl': 'application/octet-stream'}
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(root), **kw)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

url = f'http://127.0.0.1:{args.port}'
server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
print(f'Raumwerk 2.0: {url}', flush=True)
print('Zum Beenden: Strg+C', flush=True)
if not args.no_browser:
    webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
