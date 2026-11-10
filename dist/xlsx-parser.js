import * as XLSX from './vendor/xlsx.mjs';

export function openWorkbook(buffer){
  return XLSX.read(buffer,{type:'array',cellDates:false,cellFormula:true,cellHTML:false,cellStyles:false});
}
export function listSheets(workbook){
  return workbook.SheetNames.map(name=>({name,ref:workbook.Sheets[name]['!ref']||'A1'}));
}
export function readWorksheet(workbook,name){
  const ws=workbook?.Sheets[name];if(!ws)throw new Error('Arbeitsblatt nicht gefunden.');
  const range=XLSX.utils.decode_range(ws['!ref']||'A1'),nr=range.e.r-range.s.r+1,nc=range.e.c-range.s.c+1;
  if(nr>50001||nc>128||nr*nc>1000000)throw new Error('Dieses Blatt ist zu groß. Bitte in Excel auf höchstens 50.001 Zeilen, 128 Spalten und 1 Million Zellen verkleinern.');
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,range,raw:true,defval:'',blankrows:true});
  let uncached=0;for(const key of Object.keys(ws))if(key[0]!=='!'&&ws[key].f&&ws[key].v===undefined)uncached++;
  return {name,rows,r0:range.s.r,c0:range.s.c,r1:range.e.r,c1:range.e.c,uncached};
}
