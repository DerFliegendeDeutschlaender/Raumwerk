import test from 'node:test';
import assert from 'node:assert/strict';
import {columnLabel,columnIndex,parseRange,rangeLabel,parseNumber,convertSelection,validateDatasets} from '../dist/data-core.js';

test('Excel addresses support reversed ranges and absolute notation',()=>{
  assert.equal(columnLabel(26),'AA');assert.equal(columnIndex('AZ'),51);
  const r=parseRange('$C$4:$A$2');assert.deepEqual(r,{r0:1,r1:3,c0:0,c1:2});assert.equal(rangeLabel(r),'A2:C4');
  assert.throws(()=>parseRange('A0:C2'));assert.throws(()=>parseRange('A1:Z9',{r0:0,r1:3,c0:0,c1:2}));
});
test('Numbers preserve zero, support text locales and reject partial numbers',()=>{
  assert.equal(parseNumber(0),0);assert.equal(parseNumber('1.234,50','de'),1234.5);assert.equal(parseNumber('1,234.50','en'),1234.5);assert.equal(parseNumber('−2,5e-3'),-.0025);
  for(const value of ['',true,null,'2 kg','1,2,3',Infinity,'NaN'])assert.equal(parseNumber(value),null);
});
const sheet={r0:2,c0:1,r1:6,c1:4,rows:[['X','Y','Z','Info'],[0,1,2,'a'],['2,5',3,4,'b'],['fehlt',2,3,'c'],['','','','d']]};
test('Selected columns and headers produce 2D/3D arrays, with honest invalid counts',()=>{
  const range={r0:2,r1:6,c0:1,c1:4};const opts={x:1,y:2,z:3,header:true,locale:'auto'};
  const result=convertSelection(sheet,range,opts);assert.deepEqual(result.values,[[0,1,2],[2.5,3,4]]);assert.deepEqual(result.invalid,[6]);assert.equal(result.blank,1);assert.deepEqual(result.sourceRows,[4,5]);
  assert.deepEqual(convertSelection(sheet,range,{...opts,z:''}).values,[[0,1],[2.5,3]]);
  assert.throws(()=>convertSelection(sheet,range,{...opts,z:1}));
});
test('Project datasets reject malformed or duplicate entries and round trip numeric arrays',()=>{
  const d={name:'messung',values:[[0,1,2],[3,4,5]],headers:['x','y','z'],hasHeader:true,columns:{x:2,y:0,z:1},numberFormat:'de',sourceRows:[2,3]};
  assert.deepEqual(validateDatasets([d])[0].values,d.values);
  assert.deepEqual(validateDatasets([d])[0].columns,d.columns);assert.equal(validateDatasets([d])[0].hasHeader,true);assert.equal(validateDatasets([d])[0].numberFormat,'de');assert.deepEqual(validateDatasets([d])[0].sourceRows,[2,3]);
  assert.throws(()=>validateDatasets([d,d]));assert.throws(()=>validateDatasets([{...d,values:[[1,2],[3,4,5]]}]));assert.throws(()=>validateDatasets([{...d,values:[[NaN,1]]}]));
});
