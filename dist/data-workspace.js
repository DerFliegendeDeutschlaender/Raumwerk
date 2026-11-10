import {columnLabel,parseRange,rangeLabel,convertSelection,validateDatasets} from './data-core.js';
import {XlsxReader,errorText} from './xlsx-reader.js';
const $=s=>document.querySelector(s);
const STORE='raumwerk-v2-data';
export class DataWorkspace{
  constructor({onImport,onChange,onOpen,onDelete,onBeforeDelete,toast}){
    this.onDelete=onDelete;this.onBeforeDelete=onBeforeDelete;
    this.onImport=onImport;this.onChange=onChange;this.onOpen=onOpen;this.toast=toast;this.datasets=[];this.revision=0;this.sheet=null;this.selection=null;this.page=0;this.source='';this.sheetName='';this.dragging=false;this.anchor=null;this.readId=0;this.saveChain=Promise.resolve();
    $('#data-button').onclick=$('#data-add').onclick=()=>this.open();
    $('#xlsx-open').onclick=()=>$('#xlsx-file').click();$('#xlsx-file').onchange=e=>{const file=e.target.files[0];if(file)this.openFile(file);e.target.value='';};
    $('#xlsx-sheet').onchange=()=>{this.source=this.fileName;this.readSheet($('#xlsx-sheet').value);};
    $('#range-apply').onclick=()=>this.applyRange();$('#xlsx-range').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();this.applyRange();}};
    for(const id of ['axis-x','axis-y','axis-z','xlsx-header','number-format','skip-invalid'])$('#'+id).onchange=()=>{if(id==='xlsx-header')this.axisOptions();this.summary();};
    $('#data-name').oninput=()=>this.summary();
    $('#data-commit').onclick=()=>this.commit();
    $('#data-delete-cancel').onclick=()=>$('#data-delete-dialog').close();
    $('#data-delete-confirm').onclick=()=>this.confirmDelete();
    $('#data-delete-dialog').addEventListener('cancel',e=>{if(this.deleting)e.preventDefault();});
    $('#data-delete-dialog').addEventListener('click',e=>{if(this.deleting)e.stopImmediatePropagation();},true);
    $('#data-prev').onclick=()=>{this.page=Math.max(0,this.page-1);this.renderTable();};$('#data-next').onclick=()=>{if(this.sheet)this.page=Math.min(this.pages()-1,this.page+1);this.renderTable();};
    $('#xlsx-table-wrap').addEventListener('pointerdown',e=>{const cell=e.target.closest('td[data-row]');if(!cell||e.button!==0)return;e.preventDefault();this.dragging=true;this.anchor=e.shiftKey&&this.anchor?this.anchor:{r:Number(cell.dataset.row),c:Number(cell.dataset.col)};this.selectTo(Number(cell.dataset.row),Number(cell.dataset.col));});
    $('#xlsx-table-wrap').addEventListener('pointerover',e=>{const cell=e.target.closest('td[data-row]');if(cell&&this.dragging)this.selectTo(Number(cell.dataset.row),Number(cell.dataset.col));});
    document.addEventListener('pointerup',()=>{if(this.dragging){this.dragging=false;this.axisOptions();this.summary();}});
    $('#xlsx-table-wrap').addEventListener('click',e=>{const cell=e.target.closest('td[data-row]');if(cell&&e.shiftKey&&this.anchor){this.selectTo(Number(cell.dataset.row),Number(cell.dataset.col));this.axisOptions();this.summary();}});
    this.renderList();
  }
  async restore(){try{this.db=await new Promise((resolve,reject)=>{const request=indexedDB.open(STORE,1);request.onupgradeneeded=()=>request.result.createObjectStore('state');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});const saved=await new Promise((resolve,reject)=>{const req=this.db.transaction('state').objectStore('state').get('datasets');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});if(saved)this.datasets=validateDatasets(saved);this.revision++;this.renderList();}catch{this.toast('Daten können hier nicht dauerhaft gespeichert werden. Bitte Projekte als Datei exportieren.');}}
  storeSnapshot(snapshot){this.saveChain=this.saveChain.catch(()=>{}).then(()=>new Promise((resolve,reject)=>{if(!this.db){reject(new Error('Browserspeicher nicht verfügbar'));return;}const tx=this.db.transaction('state','readwrite');tx.objectStore('state').put(snapshot,'datasets');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}));return this.saveChain;}
  persist(){return this.storeSnapshot(this.export()).catch(()=>this.toast('Datenspeicher nicht verfügbar oder voll. Bitte das Projekt als Datei speichern.'));}
  requestDelete(name){
    const dataset=this.datasets.find(d=>d.name===name);if(!dataset)return;
    this.onOpen();this.deleteName=name;
    $('#data-delete-name').textContent=name;
    $('#data-delete-details').textContent=`${dataset.values.length.toLocaleString('de-DE')} Punkte · ${dataset.source || 'importierte Tabelle'}`;
    $('#data-delete-error').textContent='';$('#data-delete-dialog').showModal();$('#data-delete-cancel').focus();
  }
  async removeDataset(name){
    const dataset=this.datasets.find(d=>d.name===name);if(!dataset)return false;
    const remaining=this.datasets.filter(d=>d.name!==name);
    // Do not report success until IndexedDB has committed the deletion.
    await this.onBeforeDelete?.(name);
    await this.storeSnapshot(structuredClone(remaining));
    this.datasets=remaining;this.revision++;
    if(this.source===dataset.source)this.clearPreview();
    this.renderList();this.onDelete?.(name);this.onChange();return true;
  }
  async confirmDelete(){
    if(this.deleting)return;this.deleting=true;
    $('#data-delete-confirm').disabled=$('#data-delete-cancel').disabled=true;
    $('#data-delete-error').textContent='';
    try{await this.removeDataset(this.deleteName);$('#data-delete-dialog').close();$('#data-add').focus();this.toast(`Datensatz „${this.deleteName}“ gelöscht.`);}
    catch{ $('#data-delete-error').textContent='Löschen konnte nicht gespeichert werden. Der Datensatz bleibt erhalten. Bitte erneut versuchen.'; }
    finally{this.deleting=false;$('#data-delete-confirm').disabled=$('#data-delete-cancel').disabled=false;}
  }
  clearPreview(){
    this.readId++;this.sheetReadId=(this.sheetReadId||0)+1;this.reader?.close();this.reader=null;
    this.sheet=this.selection=this.result=this.anchor=null;this.dragging=false;this.page=0;this.source=this.fileName=this.sheetName='';
    $('#xlsx-table').replaceChildren();$('#xlsx-sheet').replaceChildren();$('#xlsx-sheet').hidden=true;
    for(const axis of ['x','y','z'])$('#axis-'+axis).replaceChildren();
    $('#xlsx-open').disabled=false;$('#xlsx-file').value='';$('#data-workbench').hidden=true;$('#data-empty').hidden=false;
    $('#data-file-label').textContent='Lokal lesen · keine Dateiübertragung';$('#data-python-preview').textContent='';$('#data-page-label').textContent='';
    $('#xlsx-range').value='';$('#data-name').value='messung';$('#data-commit').disabled=true;this.message('Öffne eine XLSX-Datei oder eine gespeicherte Datenauswahl.');
  }
  export(){return structuredClone(this.datasets);}
  numeric(){return this.datasets.map(d=>({name:d.name,values:d.values}));}
  replace(list){this.datasets=validateDatasets(list);this.revision++;this.renderList();this.persist();}
  open(name){this.onOpen();$('#data-dialog').showModal();if(name){const d=this.datasets.find(d=>d.name===name);if(d){this.source=d.source;this.sheetName=d.sheetName;this.sheet=d.preview||{rows:d.values,r0:0,c0:0,r1:d.values.length-1,c1:d.dimensions-1};this.selection={r0:this.sheet.r0,r1:this.sheet.r1,c0:this.sheet.c0,c1:this.sheet.c1};this.page=0;$('#xlsx-header').checked=d.hasHeader;$('#number-format').value=d.numberFormat||'auto';$('#data-name').value=this.uniqueName(d.name+'_kopie');$('#data-file-label').textContent=d.source+' · gespeicherte Auswahl';$('#xlsx-sheet').hidden=true;$('#data-empty').hidden=true;$('#data-workbench').hidden=false;this.renderTable();this.axisOptions();if(d.columns)for(const axis of ['x','y','z'])$('#axis-'+axis).value=String(d.columns[axis]);this.summary();}}}
  uniqueName(base='messung'){const cleaned=String(base).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_]/g,'_').replace(/^[^a-zA-Z_]/,'_').slice(0,40)||'messung';let name=cleaned,index=2;while(this.datasets.some(d=>d.name===name))name=cleaned+'_'+index++;return name;}
  async openFile(file){
    if(!/\.xlsx$/i.test(file.name)){this.message('Bitte eine XLSX-Datei auswählen.',true);return;}if(file.size>20*1024*1024){this.message('Die XLSX-Datei darf höchstens 20 MB groß sein.',true);return;}
    this.reader?.close();this.readId++;const id=this.readId;this.fileName=file.name;this.source=file.name;this.sheet=null;this.selection=null;$('#xlsx-sheet').hidden=true;$('#xlsx-open').disabled=true;$('#data-workbench').hidden=true;$('#data-empty').hidden=true;this.message('Arbeitsmappe wird lokal gelesen …');
    this.reader=new XlsxReader({onStatus:message=>{if(id===this.readId)this.message(message);}});
    try{const sheets=await this.reader.open(file);if(id!==this.readId)return;const select=$('#xlsx-sheet');select.replaceChildren();for(const sheet of sheets){const option=document.createElement('option');option.value=option.textContent=sheet.name;select.append(option);}if(!sheets.length)throw new Error('Die Datei enthält keine Arbeitsblätter.');select.hidden=false;await this.readSheet(select.value);}
    catch(error){if(id===this.readId)this.message('Excel-Datei konnte nicht gelesen werden: '+errorText(error,'Bitte die Datei erneut auswählen oder die Seite neu laden.'),true);}
    finally{if(id===this.readId)$('#xlsx-open').disabled=false;}
  }
  async readSheet(name){
    if(!name||!this.reader)return;const id=this.readId,viewId=this.sheetReadId=(this.sheetReadId||0)+1;this.message('Arbeitsblatt wird vorbereitet …');$('#data-workbench').hidden=true;
    try{const data=await this.reader.sheet(name);if(id!==this.readId||viewId!==this.sheetReadId)return;this.sheet=data;this.sheetName=data.name;this.source=this.fileName;this.selection={r0:data.r0,r1:data.r1,c0:data.c0,c1:data.c1};this.page=0;$('#xlsx-header').checked=true;$('#data-name').value=this.uniqueName(this.fileName.replace(/\.xlsx$/i,''));$('#data-file-label').textContent=this.fileName;$('#data-workbench').hidden=false;this.renderTable();this.axisOptions();this.summary();if(data.uncached)this.message(data.uncached+' Formeln ohne gespeicherten Ergebniswert. Solche Zellen gelten als leer.',true);}
    catch(error){if(id===this.readId&&viewId===this.sheetReadId)this.message('Arbeitsblatt konnte nicht gelesen werden: '+errorText(error),true);}
  }
  applyRange(){try{this.selection=parseRange($('#xlsx-range').value,this.sheet);this.page=Math.floor((this.selection.r0-this.sheet.r0)/this.pageSize());this.renderTable();this.axisOptions();this.summary();}catch(error){this.message(error.message,true);}}
  selectTo(r,c){this.selection={r0:Math.min(this.anchor.r,r),r1:Math.max(this.anchor.r,r),c0:Math.min(this.anchor.c,c),c1:Math.max(this.anchor.c,c)};$('#xlsx-range').value=rangeLabel(this.selection);this.paintSelection();}
  pageSize(){return this.sheet?Math.min(100,Math.max(20,Math.floor(8000/(this.sheet.c1-this.sheet.c0+1)))):100;}
  pages(){return this.sheet?Math.ceil((this.sheet.r1-this.sheet.r0+1)/this.pageSize()):1;}
  renderTable(){if(!this.sheet)return;const table=$('#xlsx-table');table.replaceChildren();const head=document.createElement('thead'),hr=document.createElement('tr');hr.append(document.createElement('th'));for(let c=this.sheet.c0;c<=this.sheet.c1;c++){const th=document.createElement('th');th.scope='col';th.textContent=columnLabel(c);hr.append(th);}head.append(hr);table.append(head);const body=document.createElement('tbody'),start=this.sheet.r0+this.page*this.pageSize(),end=Math.min(this.sheet.r1,start+this.pageSize()-1);for(let r=start;r<=end;r++){const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=r+1;tr.append(th);for(let c=this.sheet.c0;c<=this.sheet.c1;c++){const td=document.createElement('td');td.dataset.row=r;td.dataset.col=c;td.textContent=String(this.sheet.rows[r-this.sheet.r0]?.[c-this.sheet.c0]??'');td.title=columnLabel(c)+(r+1);tr.append(td);}body.append(tr);}table.append(body);$('#xlsx-range').value=rangeLabel(this.selection);$('#data-page-label').textContent=`Zeilen ${start+1}–${end+1} von ${this.sheet.r1+1} · Seite ${this.page+1}/${this.pages()}`;$('#data-prev').disabled=this.page===0;$('#data-next').disabled=this.page>=this.pages()-1;this.paintSelection();}
  paintSelection(){const s=this.selection;if(!s)return;$('#xlsx-table').querySelectorAll('td').forEach(cell=>{const r=Number(cell.dataset.row),c=Number(cell.dataset.col);cell.classList.toggle('selected-cell',r>=s.r0&&r<=s.r1&&c>=s.c0&&c<=s.c1);});}
  axisOptions(){if(!this.selection)return;const old=['axis-x','axis-y','axis-z'].map(id=>$('#'+id).value);for(const [i,id]of ['axis-x','axis-y','axis-z'].entries()){const select=$('#'+id);select.replaceChildren();if(i===2){const o=document.createElement('option');o.value='';o.textContent='Keine · 2D';select.append(o);}for(let c=this.selection.c0;c<=this.selection.c1;c++){const option=document.createElement('option');option.value=c;const label=$('#xlsx-header').checked?String(this.sheet.rows[this.selection.r0-this.sheet.r0]?.[c-this.sheet.c0]||''):'';option.textContent=columnLabel(c)+(label?' · '+label.slice(0,60):'');select.append(option);}const fallback=this.selection.c0+i;select.value=old[i]!==''&&Number(old[i])>=this.selection.c0&&Number(old[i])<=this.selection.c1?old[i]:fallback<=this.selection.c1?String(fallback):'';}}
  options(){return{x:$('#axis-x').value,y:$('#axis-y').value,z:$('#axis-z').value,header:$('#xlsx-header').checked,locale:$('#number-format').value};}
  summary(){
    $('#data-commit').disabled=true;if(!this.sheet||!this.selection)return;
    try{parseRange(rangeLabel(this.selection),this.sheet);const result=convertSelection(this.sheet,this.selection,this.options());this.result=result;const skip=$('#skip-invalid').checked;const name=$('#data-name').value;
      if(!/^[_a-zA-Z][_a-zA-Z0-9]{0,47}$/.test(name))throw new Error('Datensatzname: Buchstaben, Ziffern und _, beginnend mit Buchstabe oder _.');
      if(this.datasets.some(d=>d.name===name))throw new Error('Dieser Datensatzname existiert bereits. Bitte einen neuen Namen wählen.');
      let text=`${result.values.length.toLocaleString('de-DE')} gültige ${result.dimensions}D-Punkte`;
      if(result.invalid.length)text+=` · ${result.invalid.length} ungültige Zeilen (${result.invalid.slice(0,5).join(', ')}${result.invalid.length>5?' …':''})`;
      if(result.blank)text+=` · ${result.blank} leere Zeilen`;
      this.message(text,result.invalid.length>0&&!skip);
      $('#data-commit').disabled=!result.values.length||(!skip&&result.invalid.length>0);
      $('#data-python-preview').textContent=`punkte = data(${JSON.stringify(name)})\nscatter(punkte, name=${JSON.stringify(name)})\n# NumPy-Array: (${result.values.length}, ${result.dimensions})`;
    }catch(error){this.result=null;this.message(error.message,true);}
  }
  message(text,error=false){$('#data-message').textContent=text;$('#data-message').classList.toggle('error',error);}
  commit(){this.summary();if($('#data-commit').disabled||!this.result)return;const s=this.selection;const preview={r0:s.r0,c0:s.c0,rows:[]};for(let r=s.r0;r<=s.r1;r++)preview.rows.push(Array.from({length:s.c1-s.c0+1},(_,i)=>this.sheet.rows[r-this.sheet.r0]?.[s.c0+i-this.sheet.c0]??''));
    try{const opts=this.options();const d={name:$('#data-name').value,...this.result,source:this.source,sheetName:this.sheetName,range:rangeLabel(s),preview,hasHeader:opts.header,numberFormat:opts.locale,columns:{x:Number(opts.x),y:Number(opts.y),z:opts.z===''?'':Number(opts.z)}};this.datasets=validateDatasets([...this.datasets,d]);this.revision++;this.persist();this.renderList();this.onImport(d.name,$('#data-insert-code').checked,d.dimensions);this.onChange();$('#data-dialog').close();this.toast(`${d.values.length} Punkte als „${d.name}“ übernommen.`);}catch(error){this.message(error.message,true);}
  }
  renderList(){const root=$('#dataset-list');root.replaceChildren();$('#dataset-count').textContent=this.datasets.length;if(!this.datasets.length){const p=document.createElement('p');p.className='muted';p.textContent='Excel-Tabelle laden und eigene Messdaten zeichnen.';root.append(p);return;}for(const d of this.datasets){const row=document.createElement('div');row.className='dataset-row';const b=document.createElement('button');b.className='dataset-open';b.title='Gespeicherte Tabelle öffnen';const title=document.createElement('strong');title.textContent=d.name;const info=document.createElement('span');info.textContent=`${d.values.length.toLocaleString('de-DE')} × ${d.dimensions} · NumPy`;b.append(title,info);b.onclick=()=>this.open(d.name);const remove=document.createElement('button');remove.className='icon-button dataset-delete';remove.setAttribute('aria-label','Datensatz '+d.name+' löschen');remove.title='Datensatz löschen';remove.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';remove.onclick=()=>this.requestDelete(d.name);row.append(b,remove);root.append(row);}}
}
