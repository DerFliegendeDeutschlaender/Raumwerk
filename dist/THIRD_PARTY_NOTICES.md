# Bibliotheken, Lizenztexte und Quellcode

Stand: 10. November 2026. Diese Übersicht dokumentiert die Fremdkomponenten
dieser Raumwerk-Version. Maßgeblich sind die unverändert beigefügten Originaltexte.
Der eigene Raumwerk-Anwendungscode steht unter GPL-3.0-only; siehe
[GPLv3-Lizenztext](LICENSE) und die Lizenzangabe in der Projekt-README.
Die hier dokumentierten Fremdkomponenten behalten ihre jeweiligen Lizenzen.

## Verwendete Komponenten

| Komponente | Version | Lizenz | Originaltexte |
| --- | --- | --- | --- |
| Three.js einschließlich OrbitControls | 0.180.0 | MIT | [Lizenz](vendor/THREE-LICENSE.txt) |
| Pyodide | 314.0.7 | **MPL-2.0** | [Lizenz](vendor/pyodide/PYODIDE-LICENSE.txt) |
| CPython in der Pyodide-Laufzeit | 3.14.2 | PSF-2.0 einschließlich historischer Lizenztexte | [Lizenz](vendor/licenses/cpython/LICENSE.txt) |
| Emscripten-Laufzeit | 5.0.3 | MIT oder NCSA; zusätzliche musl-Hinweise | [Lizenz](vendor/licenses/emscripten/LICENSE.txt), [musl](vendor/licenses/emscripten/musl-COPYRIGHT.txt) |
| micropip | 0.11.1 | MPL-2.0 | [Lizenz](vendor/licenses/micropip/micropip-0.11.1.dist-info/licenses/LICENSE) |
| mpmath | 1.4.1 | BSD-3-Clause | [Lizenz](vendor/licenses/mpmath/mpmath-1.4.1.dist-info/licenses/LICENSE) |
| numpy | 2.4.6 | BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0 | [Lizenz](vendor/licenses/numpy/numpy-2.4.6.dist-info/licenses/LICENSE.txt) |
| sympy | 1.14.0 | BSD-3-Clause (with bundled MIT notices) | [Lizenz](vendor/licenses/sympy/sympy-1.14.0.dist-info/licenses/LICENSE) |
| SheetJS Community Edition (xlsx.mjs und xlsx.full.min.js) | 0.20.3 | Apache-2.0 | [Lizenz](vendor/SHEETJS-LICENSE.txt) |
| DM Sans (extern über Google Fonts) | nicht lokal gebündelt | SIL Open Font License 1.1 | [Lizenz](vendor/licenses/fonts/DM-Sans-OFL.txt) |
| JetBrains Mono (extern über Google Fonts) | nicht lokal gebündelt | SIL Open Font License 1.1 | [Lizenz](vendor/licenses/fonts/JetBrains-Mono-OFL.txt) |

## Ergänzende Hinweise aus den Paketen

Die Lizenz- und Autorenhinweise wurden bytegetreu aus den tatsächlich mitgelieferten
Wheel-Archiven kopiert. Die Wheel-Dateien wurden gegen die SHA-256-Werte in
`vendor/pyodide/pyodide-lock.json` geprüft. Die Archive selbst bleiben unverändert.

- NumPy enthält zusätzliche Hinweise, unter anderem zu 0BSD, MIT, Zlib, CC0,
  BSD und NCSA sowie die Lizenzdatei von Highway. Die obige Lizenzangabe übernimmt
  den Ausdruck aus der Paketmetadatei; die Originaltexte zu Unterkomponenten sind
  zusätzlich unter `vendor/licenses/numpy/` enthalten.
- SymPy enthält auch Hinweise zu Diofant, multipledispatch, PyDy und latex2sympy.
  Der vollständige Paketlizenztext und die AUTHORS-Datei liegen unter
  `vendor/licenses/sympy/`.
- micropip enthält eine Kopie von packaging mit Apache-2.0/BSD-Doppellizenz
  und einem MIT-Hinweis für den von Hatch übernommenen Lizenzparser. Die Texte
  und der unveränderte Parser mit seinem Copyright-Kopf liegen unter
  `vendor/licenses/micropip/`.
- DM Sans und JetBrains Mono werden extern geladen; Schriftdateien sind nicht
  Teil dieses Projekts. Die beigefügten OFL-Dateien dokumentieren die derzeitigen
  Upstream-Lizenzen. Google Fonts kann die ausgelieferten Schriftversionen ändern.

Die Datei [manifest.json](vendor/licenses/manifest.json) enthält die genaue Liste
der kopierten Texte, ihre Herkunft und ihre SHA-256-Prüfsummen.

## Quellcode der MPL-Komponenten

Pyodide und micropip sind unter der Mozilla Public License 2.0 lizenziert.
Der Quellcode der verwendeten Versionen ist hier erhältlich:

- [Pyodide 314.0.7](https://github.com/pyodide/pyodide/tree/314.0.7)
  ([Quellarchiv](https://github.com/pyodide/pyodide/archive/refs/tags/314.0.7.tar.gz)).
- [micropip 0.11.1](https://github.com/pyodide/micropip/tree/0.11.1)
  ([Quellarchiv](https://github.com/pyodide/micropip/archive/refs/tags/0.11.1.tar.gz)).

Die Rechte am MPL-Quellcode und die Verfügbarkeit unter MPL-2.0 bleiben bestehen;
eine eigene Lizenz des Raumwerk-Anwendungscodes darf sie nicht einschränken.
Bei Änderungen an MPL-Dateien müssen auch die entsprechenden geänderten Quellen
unter MPL-2.0 verfügbar sein. Diese Lizenzkorrektur verändert keine Bibliotheksdatei.

Weitere versionierte Quellen: [CPython 3.14.2](https://github.com/python/cpython/tree/v3.14.2),
[Emscripten 5.0.3](https://github.com/emscripten-core/emscripten/tree/5.0.3),
[Three.js r180](https://github.com/mrdoob/three.js/tree/r180).

## Bei Weitergabe beibehalten

Diese Übersicht, die vorhandenen Lizenzdateien unter `vendor/` und alle Dateien
unter `vendor/licenses/` gehören zur Weitergabe der gebündelten Bibliotheken.
Die Originalhinweise innerhalb der JavaScript-Dateien und Wheel-Archive bleiben
erhalten. Nach einem Bibliotheksupdate sind Versionen, Quellen und Lizenztexte
erneut mit den tatsächlich ausgelieferten Dateien abzugleichen.

## SheetJS-Hinweis

Die offiziellen Lizenzhinweise verlangen folgende Namensnennung.
Die Originalhinweise in den ausgelieferten SheetJS-Dateien bleiben erhalten.

```text
SheetJS Community Edition -- https://sheetjs.com/
Copyright (C) 2012-present   SheetJS LLC
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

Quelle: https://docs.sheetjs.com/docs/miscellany/license/
