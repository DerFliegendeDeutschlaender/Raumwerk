import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'outputs','demo');await fs.mkdir(out,{recursive:true});
const wb=Workbook.create();
const sheet=wb.worksheets.add('Helix');
const rows=[['X (Modelllänge)','Y (Modelllänge)','Z (Modelllänge)','Datentyp']];
for(let i=0;i<=240;i++){const u=4*Math.PI*i/240;rows.push([2*Math.cos(u),2*Math.sin(u),u/3-2,'Synthetische Beispieldaten']);}
sheet.getRange('A1:D242').values=rows;
const text=wb.worksheets.add('Deutsche Textzahlen');
text.getRange('A1:C5').values=[['X als Text','Y als Text','Z als Text'],['0,0','1,5','2,0'],['1,0','2,5','3,0'],['2,0','3,5','4,0'],['3,0','4,5','5,0']];
for(const [s,end]of [[sheet,242],[text,5]]){s.showGridLines=false;s.getRange(`A1:D${end}`).format.font={name:'Arial',size:10};s.getRange(`A1:D${end}`).format.rowHeight=21;s.getRange('A1:D1').format.fill='#234d46';s.getRange('A1:D1').format.font={name:'Arial',size:10,bold:true,color:'#ffffff'};s.getRange('A1:C1').format.horizontalAlignment='center';s.getRange(`A2:C${end}`).setNumberFormat('0.0000');s.getRange('A1:C1').format.columnWidth=23;s.getRange('D1').format.columnWidth=33;s.freezePanes.freezeRows(1);}
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'Helix!A1:D4',include:'values,formulas',tableMaxRows:4,tableMaxCols:4,maxChars:1600})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!',options:{useRegex:true,maxResults:10},maxChars:1000})).ndjson);
for(const name of ['Helix','Deutsche Textzahlen']){const image=await wb.render({sheetName:name,range:name==='Helix'?'A1:D9':'A1:C5',scale:1.5,format:'png'});await fs.writeFile(path.join(out,name+'.png'),new Uint8Array(await image.arrayBuffer()));}
const file=await SpreadsheetFile.exportXlsx(wb);await file.save(path.join(out,'demo-messdaten.xlsx'));await fs.copyFile(path.join(out,'demo-messdaten.xlsx'),path.join(root,'dist','demo-messdaten.xlsx'));console.log('XLSX demo exported.');
