import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from '../dist/vendor/xlsx.mjs';
import {XlsxReader,errorText} from '../dist/xlsx-reader.js';
import {openWorkbook,listSheets,readWorksheet} from '../dist/xlsx-parser.js';
import {convertSelection} from '../dist/data-core.js';

// Synthetic data with the same two-column/nine-record structure as the report.
// No user workbook or user values are included in the test fixture or deployment.
const rows=[['X','Y'],...Array.from({length:9},(_,i)=>[i,i*i])];
const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(rows),'Messwerte');
const file=new Blob([XLSX.write(book,{type:'array',bookType:'xlsx'})]);
const parser={openWorkbook,listSheets,readWorksheet};
function fakeWorker({startupError=false,sheetError=false,parserError=false}={}){
  const worker={terminated:false,terminate(){this.terminated=true;},postMessage(message){queueMicrotask(()=>{if(message.type==='open')this.onmessage?.({data:parserError?{id:message.id,type:'error',error:'Ungültige Excel-Datei'}:{id:message.id,type:'opened',sheets:[{name:'Messwerte',ref:'A1:B10'}]}});else if(sheetError)this.onerror?.(new Event('error'));else this.onmessage?.({data:{id:message.id,type:'sheet',...readWorksheet(book,'Messwerte')}});});}};
  queueMicrotask(()=>startupError?worker.onerror?.(new Event('error')):worker.onmessage?.({data:{type:'ready'}}));return worker;
}
test('Real ESM parser reads two columns and nine numeric points',async()=>{
  const workbook=openWorkbook(await file.arrayBuffer()),sheet=readWorksheet(workbook,'Messwerte');
  const result=convertSelection(sheet,{r0:0,r1:9,c0:0,c1:1},{x:0,y:1,z:'',header:true,locale:'auto'});
  assert.equal(result.values.length,9);assert.equal(result.dimensions,2);assert.equal(result.invalid.length,0);assert.deepEqual(result.values[0],[0,0]);
});
test('Normal worker startup and sheet reading use the acknowledged protocol',async()=>{
  const reader=new XlsxReader({workerFactory:()=>fakeWorker(),parserLoader:()=>{throw new Error('Unexpected fallback');}});
  assert.equal((await reader.open(file))[0].name,'Messwerte');assert.equal((await reader.sheet('Messwerte')).rows.length,10);assert.equal(reader.mode,'worker');reader.close();
});
test('An error Event without message automatically falls back and never says undefined',async()=>{
  const statuses=[];const reader=new XlsxReader({workerFactory:()=>fakeWorker({startupError:true}),parserLoader:async()=>parser,onStatus:m=>statuses.push(m)});
  assert.equal((await reader.open(file))[0].name,'Messwerte');assert.equal((await reader.sheet('Messwerte')).rows.length,10);assert.equal(reader.mode,'compatibility');assert.match(statuses[0],/Kompatibilitätsmodus/);assert.doesNotMatch(errorText(new Event('error')),/undefined/);reader.close();
});
test('A worker failure after opening reopens the same file for the selected sheet',async()=>{
  const reader=new XlsxReader({workerFactory:()=>fakeWorker({sheetError:true}),parserLoader:async()=>parser});
  await reader.open(file);const sheet=await reader.sheet('Messwerte');assert.deepEqual(sheet.rows,rows);assert.equal(reader.mode,'compatibility');reader.close();
});
test('File parsing errors stay visible rather than being disguised as startup failures',async()=>{
  let fallbacks=0;const reader=new XlsxReader({workerFactory:()=>fakeWorker({parserError:true}),parserLoader:async()=>{fallbacks++;return parser;}});
  await assert.rejects(reader.open(file),/Ungültige Excel-Datei/);assert.equal(fallbacks,0);reader.close();
});
test('A silent startup times out to the compatibility reader; closing cancels without fallback',async()=>{
  const silent=()=>({terminate(){},postMessage(){}});let loaded=0;
  const reader=new XlsxReader({workerFactory:silent,parserLoader:async()=>parser,startupTimeout:5});await reader.open(file);assert.equal(reader.mode,'compatibility');reader.close();
  const cancelled=new XlsxReader({workerFactory:silent,parserLoader:async()=>{loaded++;return parser;}});const opening=cancelled.open(file);cancelled.close();await assert.rejects(opening,/abgebrochen/);assert.equal(loaded,0);
});
