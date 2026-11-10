"""One-time, checked migration of the copied v1 UI. Never touches ../raumwerk."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
def edit(name, before, after):
    p = ROOT / name
    s = p.read_text(encoding='utf-8')
    if before not in s:
        raise RuntimeError(f'Migration target not found: {name}: {before[:60]}')
    p.write_text(s.replace(before, after), encoding='utf-8')

edit('dist/index.html', '<title>Raumwerk — Dein Mathelabor</title>', '<title>Raumwerk 2.0 — Python, Geometrie & Daten</title>')
edit('dist/index.html', '<link rel="stylesheet" href="./style.css">', '''<link rel="stylesheet" href="./style.css"><link rel="stylesheet" href="./v2.css">
  <script>try{const p=localStorage.getItem('raumwerk-v2-theme')||'system';document.documentElement.dataset.theme=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;}catch{document.documentElement.dataset.theme='light';}</script>''')
edit('dist/index.html', '<span class="version">LAB 01</span>', '<span class="version">2.0</span>')
edit('dist/index.html', 'value="Wellen im Raum"', 'value="Quarzkristall"')
edit('dist/index.html', '<span class="rail-version">α 1.0</span>', '<span class="rail-version">2.0</span>')
edit('dist/index.html', '<div class="rail-spacer"></div>', '''<button class="rail-button" id="data-button" title="Excel-Daten importieren" aria-label="Excel-Daten importieren" data-icon="table"></button><div class="rail-spacer"></div><button class="rail-button" id="theme-button" title="Dunkelmodus einschalten" aria-label="Dunkelmodus einschalten" data-icon="moon"></button>''')
edit('dist/index.html', '    <div class="sidebar-top"><span class="eyebrow">DEIN ARBEITSRAUM</span><h1>Ideen werden sichtbar.</h1><p>Eine Formel. Unendlich viele Perspektiven.</p></div>\n', '')
edit('dist/index.html', '    <section class="parameters-section">', '''    <section class="datasets-section"><div class="section-heading"><h2>Daten <span id="dataset-count" class="count">0</span></h2><button id="data-add" class="icon-button" aria-label="Excel-Datensatz hinzufügen" title="Excel-Datensatz hinzufügen" data-icon="plus"></button></div><div id="dataset-list"></div></section>
    <section class="parameters-section">''')
edit('dist/index.html', '<div class="settings-content"><label>Raster anzeigen', '''<div class="settings-content"><label>Farbschema <select id="theme-select" aria-label="Farbschema"><option value="system">System</option><option value="light">Hell</option><option value="dark">Dunkel</option></select></label><label>Raster anzeigen''')
edit('dist/index.html', '<h3>Berechnungen</h3>', '''<h3>Excel-Daten & Punktwolken</h3><code>punkte = data("messung")</code><code>scatter(punkte, name="Messpunkte", color="#67c6b1", size=5)</code><code>print(punkte.shape, punkte.mean(axis=0))</code><p>Das Tabellen-Symbol öffnet den XLSX-Import: Arbeitsblatt wählen, einen Bereich mit der Maus oder als <code>A1:D100</code> markieren und X/Y/Z zuordnen. Ohne Z entsteht ein N×2-Array, mit Z ein N×3-Array. <code>datasets</code> ist ein Wörterbuch aller übernommenen NumPy-Arrays. Daten bleiben pro Ausführung veränderbar; das nächste Ausführen beginnt wieder mit den importierten Ausgangswerten.</p><p>Datensätze werden im Browserspeicher und in exportierten Raumwerk-2.0-Projektdateien gespeichert. Excel-Dateien bleiben beim Import im Browser. Formeln werden nicht neu berechnet; es werden die in der XLSX gespeicherten Ergebniswerte gelesen. Textzahlen können mit deutschem oder englischem Dezimalformat interpretiert werden. Leere und ungültige Zeilen werden vor der Übernahme gezählt. Unterstützt: 20 MB pro XLSX, 50.000 Punkte pro Datensatz, 200.000 Punkte pro Projekt. Koordinaten müssen endlich und im Bereich ±10⁷ liegen.</p><h3>Berechnungen</h3>''')
dialog = '''
<dialog id="data-dialog" aria-labelledby="data-dialog-title">
  <div class="dialog-heading"><div><span class="eyebrow">EXCEL → NUMPY → GEOMETRIE</span><h2 id="data-dialog-title">Deine Tabelle wird zur Punktwolke.</h2></div><button class="icon-button close-dialog" aria-label="Schließen" data-icon="close"></button></div>
  <div class="data-file-bar"><button id="xlsx-open" class="button primary" data-icon="folder">XLSX-Datei öffnen</button><span id="data-file-label">Lokal lesen · keine Dateiübertragung</span><select id="xlsx-sheet" aria-label="Excel-Arbeitsblatt" hidden></select><button id="data-demo" class="button quiet">Beispieltabelle</button></div>
  <div id="data-empty" class="data-empty"><span>▦</span><h3>Platz für deine Messdaten.</h3><p>Öffne eine XLSX-Datei, markiere einen Bereich und wähle die Koordinatenspalten.</p><p>Mehrere Arbeitsblätter · 2D und 3D · NumPy-Zugriff</p></div>
  <div id="data-workbench" hidden>
    <div class="data-grid-pane"><div class="data-range-bar"><label for="xlsx-range">Bereich</label><input id="xlsx-range" aria-label="Excel-Zellbereich" value="A1:C10" spellcheck="false"><button id="range-apply" class="button">Markieren</button><span>Ziehen oder Shift + Klick</span></div>
      <div id="xlsx-table-wrap" class="xlsx-table-wrap" tabindex="0" aria-label="Excel-Tabellenvorschau"><table id="xlsx-table" aria-label="Excel-Zellen"></table></div><div class="data-pagination"><span id="data-page-label"></span><button id="data-prev" class="button quiet" aria-label="Vorherige Tabellenzeilen">←</button><button id="data-next" class="button quiet" aria-label="Nächste Tabellenzeilen">→</button></div>
    </div>
    <aside class="data-mapping"><h3>Koordinaten zuordnen</h3><label class="checkbox-label"><input id="xlsx-header" type="checkbox" checked>Erste markierte Zeile ist Überschrift</label><label>X-Achse<select id="axis-x" aria-label="X-Koordinatenspalte"></select></label><label>Y-Achse<select id="axis-y" aria-label="Y-Koordinatenspalte"></select></label><label>Z-Achse<select id="axis-z" aria-label="Z-Koordinatenspalte"></select></label><label>Textzahlen<select id="number-format" aria-label="Zahlenformat"><option value="auto">Automatisch</option><option value="de">Deutsch: 1.234,56</option><option value="en">Englisch: 1,234.56</option></select></label><label>Datensatzname<input id="data-name" aria-label="Datensatzname" value="messung" maxlength="48" spellcheck="false"></label><label class="checkbox-label"><input id="skip-invalid" type="checkbox" checked>Ungültige Zeilen überspringen</label><label class="checkbox-label"><input id="data-insert-code" type="checkbox" checked>Punktwolke zum Python-Code hinzufügen</label><pre id="data-python-preview"></pre><button id="data-commit" class="button primary" disabled>Punkte übernehmen</button></aside>
  </div><div id="data-message" class="data-message" role="status">Dateien werden nur lokal im Browser verarbeitet. Gespeicherte Excel-Formelergebnisse werden übernommen.</div>
</dialog>
<input type="file" id="xlsx-file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
'''
edit('dist/index.html', '<input type="file" id="project-file"', dialog+'<input type="file" id="project-file"')

edit('dist/app.js', "import {examples} from './examples.js';", "import {examples as baseExamples} from './examples.js';\nimport {newExamples} from './examples-v2.js';\nimport {DataWorkspace} from './data-workspace.js';\nconst examples=[...newExamples,...baseExamples];")
edit('dist/app.js', 'const icons={layers:', '''const icons={table:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18M3 15h18"/>',moon:'<path d="M20 14A9 9 0 0 1 10 3a9 9 0 1 0 10 11Z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',layers:''')
edit('dist/app.js', 'let scene,worker,timer,', 'let scene,dataWorkspace,sentDataRevision=-1,worker,timer,')
edit('dist/app.js', 'plot|surface|point|curve|vector|segment|polygon|param|print|integrate|derivative|sin|cos|sqrt|exp', 'plot|surface|point|scatter|data|curve|vector|segment|polygon|param|print|integrate|derivative|sin|cos|sqrt|exp')
edit('dist/app.js', 'function dispatch(request){state.request=', '''function dispatch(request){if(dataWorkspace&&sentDataRevision!==dataWorkspace.revision){worker.postMessage({type:'datasets',datasets:dataWorkspace.numeric()});sentDataRevision=dataWorkspace.revision;}state.request=''' )
edit('dist/app.js', 'function createWorker(autoRun=true){', 'function createWorker(autoRun=true){\n  sentDataRevision=-1;')
edit('dist/app.js', "if(request.reason==='example'){scene.fit();scheduleSave();}", "if(request.reason==='example'||request.reason==='data'){scene.fit();scheduleSave();}")
edit('dist/app.js', "function projectData(){return{format:'raumwerk',version:1,", "function projectData(includeDatasets=true){return{format:'raumwerk',version:2,...(includeDatasets?{datasets:dataWorkspace?.export()||[]}:{}),")
edit('dist/app.js', "localStorage.setItem('raumwerk-project-v1',JSON.stringify(projectData()))", "localStorage.setItem('raumwerk-project-v2',JSON.stringify(projectData(false)))")
edit('dist/app.js', "'raumwerk-project-v1'", "'raumwerk-project-v2'")
edit('dist/app.js', "'raumwerk-draft-v1'", "'raumwerk-draft-v2'")
edit('dist/app.js', "data.version!==1", "![1,2].includes(data.version)")
edit('dist/app.js', 'Keine gültige Raumwerk-Projektdatei (Version 1).', 'Keine gültige Raumwerk-Projektdatei (Version 1 oder 2).')
edit('dist/app.js', "throw new Error('Ungültige Parameterwerte.');play(false);", "throw new Error('Ungültige Parameterwerte.');if(Array.isArray(data.datasets))dataWorkspace.replace(data.datasets);else if(data.version===1)dataWorkspace.replace([]);play(false);")
edit('dist/app.js', "file.size>2e6", "file.size>64e6")
edit('dist/app.js', 'höchstens 2 MB', 'höchstens 64 MB')
edit('dist/app.js', "else if(type==='geometry')", "else if(type==='quartz')content='<path d=\"m150 4 53 29v46l-53 23-53-23V33Z\" fill=\"#a9c7e2\" fill-opacity=\".4\" stroke=\"#83b9d1\"/><path d=\"m150 4-19 34v43l19 21 18-26V35Z\" fill=\"#aa9eda\" fill-opacity=\".4\" stroke=\"#958bcb\"/><path d=\"m97 33 34 5 37-3 35-2M97 79l34 2 37-5 35 3\" fill=\"none\" stroke=\"#87a6b8\"/>';\n  else if(type==='geometry')")
edit('dist/app.js', "if(type==='lissajous'){", "if(type==='quantum'){x=65+(u+6)*15;y=70-45*Math.sin((u+6)*Math.PI/12)**2;}else if(type==='lissajous'){")
edit('dist/app.js', "  let saved;try{saved=", '''  dataWorkspace=new DataWorkspace({toast,onOpen:()=>play(false),onChange:scheduleSave,onImport:(name,insert,dimensions)=>{if(insert){const code='\\n# Excel-Datensatz: '+name+'\\nimport numpy as np\\npunkte = data('+JSON.stringify(name)+')\\nscatter(punkte, name='+JSON.stringify(name)+', color="#67c6b1", size=5)\\nprint("Datensatz '+name+':", punkte.shape)\\n';editor.value+=code;updateEditor();setView(dimensions===3?'3d':'2d');run('data');}else{consoleLog('Datensatz '+name+' ist über data('+JSON.stringify(name)+') verfügbar.');}scheduleSave();}});
  await dataWorkspace.restore();applyTheme();
  let saved;try{saved=''' )
edit('dist/app.js', "datasets:state", "datasets:state") if False else None
edit('dist/app.js', "params:{...state.params}};}};", "params:{...state.params},datasets:dataWorkspace?.datasets.map(d=>({name:d.name,rows:d.values.length,dimensions:d.dimensions})),version:2};}};")
theme = '''
let themePreference;try{themePreference=localStorage.getItem('raumwerk-v2-theme')||'system';}catch{themePreference='system';}
const themeMedia=matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){const dark=themePreference==='dark'||(themePreference==='system'&&themeMedia.matches);document.documentElement.dataset.theme=dark?'dark':'light';scene?.setTheme(dark);$('#theme-button').innerHTML=icon(dark?'sun':'moon');$('#theme-button').setAttribute('aria-label',dark?'Hellmodus einschalten':'Dunkelmodus einschalten');$('#theme-button').title=dark?'Hellmodus einschalten':'Dunkelmodus einschalten';$('#theme-select').value=themePreference;document.querySelector('meta[name="theme-color"]').content=dark?'#17212b':'#146451';}
function chooseTheme(value){themePreference=value;try{localStorage.setItem('raumwerk-v2-theme',value);}catch{}applyTheme();}
$('#theme-button').onclick=()=>chooseTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');$('#theme-select').onchange=e=>chooseTheme(e.target.value);themeMedia.addEventListener('change',()=>{if(themePreference==='system')applyTheme();});
$('#data-demo').onclick=async()=>{try{const r=await fetch('./demo-messdaten.xlsx');if(!r.ok)throw new Error('Beispieltabelle konnte nicht geladen werden.');dataWorkspace.openFile(new File([await r.blob()],'demo-messdaten.xlsx'));}catch(e){toast(e.message);}};
'''
edit('dist/app.js', 'try{\n  scene=new MathScene', theme+'\ntry{\n  scene=new MathScene')
edit('serve.py', 'default=8766', 'default=8767')
edit('serve.py', "print(f'Raumwerk: {url}'", "print(f'Raumwerk 2.0: {url}'")
(ROOT/'Start-Raumwerk.cmd').rename(ROOT/'Start-Raumwerk-2.0.cmd')
print('Version 2.0 UI migrated.')
