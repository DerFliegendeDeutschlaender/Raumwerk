// Spreadsheet-independent conversion rules, shared by the UI and regression tests.
export function columnLabel(index){let s='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
export function columnIndex(label){return [...label.toUpperCase()].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;}
export function parseRange(text,bounds){
  const m=String(text).replaceAll('$','').trim().toUpperCase().match(/^([A-Z]+)([1-9]\d*)(?::([A-Z]+)([1-9]\d*))?$/);
  if(!m)throw new Error('Bereich als A1:C100 angeben.');
  const a={r:Number(m[2])-1,c:columnIndex(m[1])},b={r:Number(m[4]||m[2])-1,c:columnIndex(m[3]||m[1])};
  const range={r0:Math.min(a.r,b.r),r1:Math.max(a.r,b.r),c0:Math.min(a.c,b.c),c1:Math.max(a.c,b.c)};
  if(bounds&&(range.r0<bounds.r0||range.r1>bounds.r1||range.c0<bounds.c0||range.c1>bounds.c1))throw new Error('Der Bereich liegt außerhalb der angezeigten Tabelle.');
  if((range.r1-range.r0+1)*(range.c1-range.c0+1)>200000)throw new Error('Bitte höchstens 200.000 Zellen auf einmal auswählen.');
  return range;
}
export function rangeLabel(s){return `${columnLabel(s.c0)}${s.r0+1}:${columnLabel(s.c1)}${s.r1+1}`;}
export function parseNumber(value,locale='auto'){
  if(typeof value==='number')return Number.isFinite(value)&&Math.abs(value)<=1e7?value:null;
  if(typeof value!=='string'||!value.trim())return null;
  let s=value.trim().replace(/[\u00a0\u202f ]/g,'').replace(/\u2212/g,'-');
  if(locale==='de')s=s.replaceAll('.','').replace(',','.');
  else if(locale==='en')s=s.replaceAll(',','');
  else if(s.includes(',')&&s.includes('.')){if(s.lastIndexOf(',')>s.lastIndexOf('.'))s=s.replaceAll('.','').replace(',','.');else s=s.replaceAll(',','');}
  else if(s.includes(','))s=s.replace(',','.');
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(s))return null;
  const n=Number(s);return Number.isFinite(n)&&Math.abs(n)<=1e7?n:null;
}
export function convertSelection(sheet,selection,options){
  const cols=[Number(options.x),Number(options.y)];if(options.z!==''&&options.z!==null&&options.z!==undefined)cols.push(Number(options.z));
  if(cols.some(c=>!Number.isInteger(c)||c<selection.c0||c>selection.c1))throw new Error('X, Y und Z müssen im markierten Bereich liegen.');
  if(new Set(cols).size!==cols.length)throw new Error('Bitte für jede Achse eine andere Spalte wählen.');
  const values=[],invalid=[],sourceRows=[];let blank=0;
  const get=(r,c)=>sheet.rows[r-sheet.r0]?.[c-sheet.c0]??'';
  const first=selection.r0+(options.header?1:0);
  for(let r=first;r<=selection.r1;r++){
    const raw=cols.map(c=>get(r,c));if(raw.every(v=>v===''||v===null||v===undefined)){blank++;continue;}
    const point=raw.map(v=>parseNumber(v,options.locale));
    if(point.some(v=>v===null)){invalid.push(r+1);continue;}
    values.push(point);sourceRows.push(r+1);
  }
  if(values.length>50000)throw new Error('Maximal 50.000 Punkte je Datensatz. Bitte den Bereich verkleinern.');
  const headers=cols.map(c=>options.header?String(get(selection.r0,c)||columnLabel(c)):columnLabel(c));
  return {values,headers,sourceRows,invalid,blank,dimensions:cols.length};
}
export function validateDatasets(list){
  if(!Array.isArray(list)||list.length>20)throw new Error('Höchstens 20 Datensätze pro Projekt.');
  const names=new Set();let total=0;
  return list.map(d=>{
    if(typeof d.name!=='string'||!/^[_a-zA-Z][_a-zA-Z0-9]{0,47}$/.test(d.name)||names.has(d.name))throw new Error('Ungültiger oder doppelter Datensatzname.');
    names.add(d.name);
    if(!Array.isArray(d.values)||!d.values.length||d.values.length>50000)throw new Error('Ein Datensatz braucht 1 bis 50.000 Punkte.');
    const dim=d.values[0]?.length;if(dim!==2&&dim!==3)throw new Error('Daten brauchen zwei oder drei Spalten.');
    for(const row of d.values)if(!Array.isArray(row)||row.length!==dim||row.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>1e7))throw new Error('Ungültige Datenkoordinaten.');
    total+=d.values.length;if(total>200000)throw new Error('Maximal 200.000 Punkte pro Projekt.');
    const result={name:d.name,values:d.values.map(r=>[...r]),headers:Array.from({length:dim},(_,i)=>String(d.headers?.[i]||['X','Y','Z'][i])),source:String(d.source||'Projektdatei'),sheetName:String(d.sheetName||''),range:String(d.range||''),dimensions:dim,hasHeader:d.hasHeader===true,numberFormat:['auto','de','en'].includes(d.numberFormat)?d.numberFormat:'auto'};
    if(d.columns&&Number.isInteger(d.columns.x)&&Number.isInteger(d.columns.y)&&(d.columns.z===''||Number.isInteger(d.columns.z)))result.columns={x:d.columns.x,y:d.columns.y,z:d.columns.z};
    if(Array.isArray(d.sourceRows)&&d.sourceRows.length===d.values.length&&d.sourceRows.every(n=>Number.isInteger(n)&&n>=1))result.sourceRows=[...d.sourceRows];
    if(d.preview&&Array.isArray(d.preview.rows)&&d.preview.rows.length<=50001){
      let cells=0;const rows=d.preview.rows.map(row=>{if(!Array.isArray(row)||row.length>128)throw new Error('Ungültige Tabellenvorschau.');cells+=row.length;return row.map(v=>typeof v==='number'&&Number.isFinite(v)?v:String(v??'').slice(0,1000));});
      if(cells>200000)throw new Error('Tabellenvorschau zu groß.');
      const r0=Number.isInteger(d.preview.r0)&&d.preview.r0>=0?d.preview.r0:0,c0=Number.isInteger(d.preview.c0)&&d.preview.c0>=0?d.preview.c0:0;
      result.preview={rows,r0,c0,r1:r0+rows.length-1,c1:c0+Math.max(...rows.map(r=>r.length),1)-1};
    }
    return result;
  });
}
