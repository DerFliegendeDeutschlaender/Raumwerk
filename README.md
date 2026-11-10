# Raumwerk 2.0

Raumwerk ist ein interaktives Mathelabor für Menschen, die mathematische Zusammenhänge mit Python erkunden und visualisieren möchten. Funktionen, geometrische Objekte und Animationen lassen sich direkt im Browser programmieren und in einer gemeinsamen 2D-/3D-Ansicht darstellen. NumPy, SymPy und ein Excel-Datenimport ergänzen die Möglichkeiten.

Die Idee entstand aus meinen Erfahrungen im Studium: Ich habe GeoGebra gerne genutzt, mir bei komplexeren Aufgaben aber einen direkteren Zugang über Python gewünscht. Eigene Funktionen schreiben, Berechnungen nachvollziehbar aufbauen und daraus interaktive Grafiken und Animationen erzeugen – dafür habe ich Raumwerk konzipiert.

Raumwerk richtet sich besonders an Studierende und technisch Interessierte mit Python-Kenntnissen. Das Projekt wird unter GPLv3 veröffentlicht und kann gemeinschaftlich weiterentwickelt werden.

GeoGebra war eine Inspiration für das Projekt. Raumwerk ist ein eigenständiges Projekt ohne offizielle Verbindung zu GeoGebra.
-----------------------------------------------------------------------------------------------
Raumwerk is an interactive math lab for people who want to explore and visualize mathematical concepts using Python. Write functions, create geometric objects, and build animations directly in your browser, with a shared 2D/3D view. NumPy, SymPy, and Excel data import extend its capabilities.

The idea grew out of my experience at university. I enjoyed using GeoGebra, but for more complex tasks, I wanted a more direct way to work with Python. Writing custom functions, structuring calculations clearly, and turning them into interactive plots and animations became the motivation behind Raumwerk.

Raumwerk is aimed particularly at students and technically curious users with Python experience. The project is released under GPLv3 and welcomes community contributions.

GeoGebra was an inspiration for this project. Raumwerk is an independent project with no official affiliation with GeoGebra.

## Lizenz

Der eigene Anwendungscode von Raumwerk 2.0 steht unter der **GNU General Public
License, Version 3** (SPDX: `GPL-3.0-only`). Der vollständige, unveränderte
Lizenztext steht in [LICENSE](LICENSE); eine Kopie liegt auch in
[dist/LICENSE](dist/LICENSE) für die Auslieferung der Browser-App.

Copyright (C) 2026 Peter Göbel

Raumwerk 2.0 is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, version 3 of the License.

Raumwerk 2.0 is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
Raumwerk 2.0. If not, see <https://www.gnu.org/licenses/>.

Eingebundene Bibliotheken und andere Fremdkomponenten behalten ihre eigenen
Lizenzen und Copyright-Hinweise. Die Zuordnung und Originaltexte stehen in
[Bibliotheken und Lizenzhinweise](dist/THIRD_PARTY_NOTICES.md).

## Lokal starten

Start-Raumwerk-2.0.cmd doppelklicken. Python 3 dient als lokaler Dateiserver, der eingegebene Code läuft mit Pyodide im Browser. Adresse: http://127.0.0.1:8767. Alternativ: python serve.py. Strg+C beendet den Server. Die alte Version behält Port 8766. Die gehostete Variante braucht keine lokale Installation. Direkter Aufruf über file:// wird wegen der Worker nicht unterstützt.

## Neu in 2.0

- Der große Einleitungstext im linken Bereich ist entfernt.
- Dunkelmodus, Hellmodus und automatische Systemauswahl. Sonnen-/Mondsymbol links oder Farbschema in den Einstellungen. Die Auswahl wird separat für 2.0 gespeichert.
- Vier zusätzliche Beispiele: idealisierter Quarzkristall, Schrödinger im 1D-Potentialtopf, stationärer 2D-Quantenzustand und Fourier-Reihe. Alle sechs bisherigen Beispiele bleiben verfügbar.
- XLSX-Import mit Arbeitsblattauswahl, Tabellenvorschau, Bereichsmarkierung, Achsenzuordnung und dauerhaft gespeicherten NumPy-Datensätzen.
- Effiziente Punktwolken und zusammenhängende Polyeder.

## Excel-Daten importieren

1. Tabellen-Symbol links anklicken und XLSX-Datei öffnen. Beispieltabelle lädt eine synthetische Helix und ein zweites Blatt mit deutschen Textzahlen.
2. Arbeitsblatt wählen. Einen rechteckigen Bereich durch Ziehen, Startklick und anschließenden Shift-Klick oder als Zelladresse wie B2:D100 markieren. Die Vorschau ist bei großen Tabellen seitenweise. Bereiche über mehrere Seiten per Adresse auswählen.
3. Erste markierte Zeile ist Überschrift bei Bedarf aktivieren. X und Y zuordnen. Für 3D zusätzlich Z wählen; ohne Z entsteht ein N×2-Array. Jede Achse benötigt eine eigene Spalte im ausgewählten Bereich.
4. Für als Text gespeicherte Zahlen das Dezimalformat wählen. Echte Excel-Zahlen bleiben numerisch unverändert. Automatisch behandelt ein einzelnes Komma als Dezimalzeichen. Bei mehrdeutigen Tausendertrennzeichen Deutsch oder Englisch ausdrücklich wählen.
5. Einen eindeutigen Namen, zum Beispiel messung, vergeben. Die Vorschau zählt gültige Punkte sowie leere und ungültige Zeilen. Ohne die Option Ungültige Zeilen überspringen blockieren ungültige Werte die Übernahme.
6. Punkte übernehmen speichert den Datensatz. Mit aktivierter Code-Option werden Zugriff und Punktwolke an den bestehenden Code angehängt und ausgeführt. Ohne diese Option bleibt der Code unverändert.

```python
import numpy as np
punkte = data("messung")
print(punkte.shape)           # (N, 2) oder (N, 3)
print(punkte.mean(axis=0))
scatter(punkte, name="Messpunkte", color="#67c6b1", size=5)
auswahl = punkte[punkte[:, 0] > 0]
scatter(auswahl, name="X größer null")
```

datasets enthält alle übernommenen Arrays als Wörterbuch. Jede Ausführung beginnt mit frischen Kopien der importierten Ausgangswerte. Python-Änderungen überschreiben den gespeicherten Datensatz nicht. Datenkarten links öffnen die gespeicherte Tabellenauswahl wieder. Die vollständige ursprüngliche Arbeitsmappe bleibt nur während der Sitzung geöffnet; importierte Auswahlen bleiben gespeichert.

XLSX-Dateien werden lokal in einem Browser-Worker verarbeitet und nicht an einen Anwendungsserver hochgeladen. Ab Fehlerkorrektur 2.0.1 verwendet der Leser einen Modul-Worker mit bestätigtem Start. Wenn dieser nicht startet oder ausfällt, liest derselbe lokale Parser die Datei im Kompatibilitätsmodus in der Seite; dabei kann die Oberfläche bei großen Dateien kurz beschäftigt sein. Fehler ohne Browser-Fehlertext erscheinen mit einer verständlichen Meldung statt „undefined“. Formeln werden nicht neu berechnet: gelesen werden ihre gespeicherten Ergebniswerte. Fehlende Formel-Ergebnisse gelten als leer. Datumszellen sind Excel-Seriennummern; automatische Datumsachsen gibt es nicht.

Grenzen: 20 MB je XLSX, 50.001 Zeilen und 128 Spalten sowie maximal 1 Million Zellen pro Arbeitsblatt. Bis zu 200.000 ausgewählte Zellen, 50.000 Punkte pro Datensatz, 20 Datensätze und insgesamt 200.000 Punkte pro Projekt. Koordinaten müssen endlich sein und zwischen −10⁷ und 10⁷ liegen.

## Speichern

### Importdaten löschen (2.0.2)

Links unter **Daten** den Papierkorb neben einem Datensatz anklicken und **Datensatz löschen** bestätigen. **Abbrechen** behält die Daten. Die Löschung entfernt genau diesen Datensatz mit seiner Vorschautabelle aus dem lokalen Browserspeicher und aus dem automatischen Entwurf. Andere Datensätze, Python-Code und die ursprüngliche XLSX-Datei bleiben erhalten. Bei einem Speicherfehler bleibt der Datensatz in der Liste und eine Fehlermeldung erscheint.

Beim Löschen werden Animation, Python-Laufzeit, Konsole und aktuelle Zeichnung zurückgesetzt, damit dort keine Kopien der gelöschten Daten verbleiben. Der Code wird nicht automatisch erneut ausgeführt. Verweise wie `data("messung")` vor dem nächsten Ausführen anpassen. Bereits exportierte Projektdateien und Sicherheitskopien auf der Festplatte bleiben unverändert; ihr späterer Import kann enthaltene Daten wiederherstellen. Mehrere aus derselben XLSX importierte Auswahlen lassen sich einzeln löschen.

Code, Parameter und Kamera werden in einem eigenen 2.0-Schlüssel im localStorage gespeichert. Datensätze samt Vorschautabellen und Zuordnung liegen in IndexedDB dieses Browsers und dieser Webadresse. Probleme mit dem Browserspeicher werden gemeldet. Für eine unabhängige Sicherung Projekt speichern verwenden: 2.0-JSON-Dateien enthalten auch die Daten. Der Import akzeptiert 1.0 und 2.0, maximal 64 MB. Beim Öffnen eines 1.0-Projekts in 2.0 wird die aktuelle Datensatzliste geleert. Die alte App bleibt unverändert und unterstützt die neuen Datenbefehle nicht. Originale XLSX-Dateien bleiben unverändert.

## Beispiele und Modellannahmen

Der Quarzkristall zeigt ein idealisiertes äußeres hexagonales Prisma mit zwei Spitzen. Es ist kein atomistisches SiO₂-Gitter und kein vollständiges kristallografisches Facettenmodell. α-Quarz hat trigonale Symmetrie. Hintergrund: [The Quartz Page](https://www.quartzpage.de/crs_forms.html).

Der 1D-Potentialtopf verwendet exakte Eigenfunktionen sqrt(2/L) sin(nπx/L) und Energien (nπ/L)² in reduzierten Einheiten ħ=1, 2m=1. Eine normierte Überlagerung zweier benachbarter Zustände zeigt Realteil, Imaginärteil und Dichte. t ist hier Modellzeit, obwohl die allgemeine Zeitleiste Sekunden anzeigt. Das 2D-Beispiel zeigt die stationäre Dichte eines separablen Zustands. Hintergrund: [R. Fitzpatrick, Infinite Potential Well](https://farside.ph.utexas.edu/teaching/qmech/lectures/node47.html).

## Bedienung und API

Strg+Enter ausführen, 2 für 2D/3D, F für Einpassen, Leertaste für Animation, Strg+S für Projektexport. In 2D blickt die Kamera orthografisch entlang der Z-Achse auf XY. Abbrechen beendet den Python-Worker und startet ihn neu, ohne den Code erneut auszuführen. Pro Animationsschritt wird der Code mit neuem t ausgeführt.

Die bisherigen Geometrie- und Rechenbefehle bleiben erhalten. Neu: data(name), datasets, scatter(points, name=..., color=..., size=5) mit Größe in Bildschirmpixeln und polyhedron(vertices, faces, name=..., color=..., opacity=0.7). Polyederflächen sind Listen von Eckpunktindizes und müssen eben und ohne Selbstüberschneidungen sein. Noch keine geometrischen Zwangsbedingungen oder frei verschiebbaren Konstruktionspunkte. Funktionsgraphen sind numerisch abgetastet.

## Entwicklung und Prüfungen

Buildlose ES-Module unter dist. data-core.js enthält Konvertierungsregeln, xlsx-worker.js den Leser, data-workspace.js die Datenoberfläche und den Speicher. api.py und python-worker.js binden Python an.

```text
python -m unittest discover -s tests -v
node --test tests/test_data_core.mjs tests/test_data_deletion.mjs tests/test_xlsx_fixture.mjs tests/test_xlsx_reader.mjs
```

Geprüft werden Mathematik, Datenvalidierung, Bereichsgrenzen, deutsche/englische Zahlen, 2D-/3D-Arrays, eine echte XLSX-Datei, die neuen Beispiele und Normierung/Randbedingungen im Potentialtopf. Browsertests ergänzen Darstellung, Pyodide-/NumPy-Ausführung, Auswahl, Speicherung, Projektimport/-export und Themenwechsel.

## Bibliothekslizenzen

Die vollständige Zuordnung der Fremdkomponenten, Original-Lizenztexte und Quellen
steht in [Bibliotheken und Lizenzhinweise](dist/THIRD_PARTY_NOTICES.md).

- Three.js 0.180.0 einschließlich OrbitControls: MIT.
- Pyodide 314.0.7 und micropip 0.11.1: **MPL-2.0**.
- CPython 3.14.2: PSF-2.0 einschließlich historischer Lizenztexte.
- NumPy 2.4.6: BSD-3-Clause mit zusätzlichen Lizenzen der enthaltenen Unterkomponenten.
- SymPy 1.14.0: BSD-3-Clause mit zusätzlichen Hinweisen; mpmath 1.4.1: BSD-3-Clause.
- Emscripten 5.0.3: MIT oder NCSA; zusätzliche musl-Hinweise sind beigefügt.
- SheetJS CE 0.20.3: Apache-2.0.
- Extern geladene Schriften DM Sans und JetBrains Mono: SIL Open Font License 1.1.

Die Lizenztexte und Copyright-Hinweise unter `dist/vendor/` und
`dist/vendor/licenses/` bei Weitergabe beibehalten. Für MPL-Komponenten sind
versionierte Quellcode-Bezugsstellen in der Übersicht angegeben. Die Fremdkomponenten
behalten ihre jeweiligen Lizenzen; die GPLv3-Lizenz des eigenen Raumwerk-Codes
ersetzt diese Lizenztexte und Hinweise nicht.

Python und XLSX-Import benötigen lokal kein Internet. Google Fonts verwendet bei fehlender Verbindung Systemschriften. [SheetJS-Dokumentation](https://docs.sheetjs.com/docs/getting-started/installation/standalone/), [Pyodide-Dokumentation](https://pyodide.org/en/stable/usage/quickstart.html).
