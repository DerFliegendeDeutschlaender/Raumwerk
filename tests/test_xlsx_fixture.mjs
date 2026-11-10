import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {convertSelection} from '../dist/data-core.js';
const require=createRequire(import.meta.url),XLSX=require('../dist/vendor/xlsx.full.min.js');
const workbook=XLSX.read(fs.readFileSync(new URL('../dist/demo-messdaten.xlsx',import.meta.url)),{type:'buffer'});
test('Independent XLSX reader verifies the exported two-sheet fixture',()=>{
  assert.deepEqual(workbook.SheetNames,['Helix','Deutsche Textzahlen']);
  const ws=workbook.Sheets.Helix,rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:'',blankrows:true});
  assert.equal(rows.length,242);assert.deepEqual(rows[1].slice(0,3),[2,0,-2]);
  const result=convertSelection({r0:0,c0:0,rows},{r0:0,r1:241,c0:0,c1:3},{x:0,y:1,z:2,header:true,locale:'auto'});
  assert.equal(result.values.length,241);assert.equal(result.invalid.length,0);assert.equal(result.headers[2],'Z (Modelllänge)');
});
test('German text-number worksheet converts without treating text as zero',()=>{
  const rows=XLSX.utils.sheet_to_json(workbook.Sheets['Deutsche Textzahlen'],{header:1,raw:true,defval:''});
  const result=convertSelection({r0:0,c0:0,rows},{r0:0,r1:4,c0:0,c1:2},{x:0,y:1,z:2,header:true,locale:'de'});
  assert.deepEqual(result.values[0],[0,1.5,2]);assert.equal(result.values.length,4);
});
