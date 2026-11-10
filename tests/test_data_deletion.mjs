import test from 'node:test';
import assert from 'node:assert/strict';
import {DataWorkspace} from '../dist/data-workspace.js';

function workspace(){
  const events=[],data=Object.create(DataWorkspace.prototype);
  Object.assign(data,{datasets:[{name:'entfernen',source:'demo.xlsx',values:[[1,2]]},{name:'behalten',source:'demo.xlsx',values:[[3,4]]}],revision:4,source:'demo.xlsx',saveChain:Promise.resolve(),renderList(){events.push('render');},clearPreview(){events.push('preview');},onBeforeDelete(name){events.push('draft:'+name);},onDelete(name){events.push('python:'+name);},onChange(){events.push('change');}});
  return{data,events};
}

test('Deletion waits for durable storage, removes only the target and invalidates runtime copies',async()=>{
  const {data,events}=workspace();let complete,snapshot;
  data.storeSnapshot=value=>{snapshot=value;return new Promise(resolve=>{complete=resolve;});};
  const deleting=data.removeDataset('entfernen');await Promise.resolve();
  assert.deepEqual(data.datasets.map(d=>d.name),['entfernen','behalten']);assert.equal(data.revision,4);
  assert.deepEqual(snapshot.map(d=>d.name),['behalten']);complete();assert.equal(await deleting,true);
  assert.deepEqual(data.export().map(d=>d.name),['behalten']);assert.equal(data.revision,5);
  assert.deepEqual(events,['draft:entfernen','preview','render','python:entfernen','change']);
});

test('Failed storage leaves the dataset and active preview/runtime intact',async()=>{
  const {data,events}=workspace();data.storeSnapshot=async()=>{throw new Error('Quota or transaction failure');};
  await assert.rejects(data.removeDataset('entfernen'),/transaction failure/);
  assert.deepEqual(data.datasets.map(d=>d.name),['entfernen','behalten']);assert.equal(data.revision,4);
  assert.deepEqual(events,['draft:entfernen']);
});

test('Failure to remove an automatic draft prevents a misleading successful deletion',async()=>{
  const {data,events}=workspace();data.onBeforeDelete=()=>{throw new Error('Storage unavailable');};
  data.storeSnapshot=()=>{throw new Error('Should not write');};
  await assert.rejects(data.removeDataset('entfernen'),/Storage unavailable/);
  assert.equal(data.datasets.length,2);assert.deepEqual(events,[]);
});

test('Missing dataset is a no-op, and another workbook preview stays open',async()=>{
  const {data,events}=workspace();data.source='other.xlsx';data.storeSnapshot=async()=>{};
  assert.equal(await data.removeDataset('absent'),false);assert.deepEqual(events,[]);
  await data.removeDataset('entfernen');assert.ok(!events.includes('preview'));
});

test('Queued IndexedDB writes cannot restore a dataset after its deletion',async()=>{
  const {data}=workspace();let stored;const transactions=[];
  data.db={transaction(){const tx={objectStore:()=>({put(value){tx.value=value;}})};transactions.push(tx);return tx;}};
  const before=data.storeSnapshot(data.export()),after=data.removeDataset('entfernen');
  await new Promise(resolve=>setImmediate(resolve));assert.equal(transactions.length,1);
  stored=transactions[0].value;transactions[0].oncomplete();await before;
  await new Promise(resolve=>setImmediate(resolve));assert.equal(transactions.length,2);
  stored=transactions[1].value;transactions[1].oncomplete();await after;
  assert.deepEqual(stored.map(d=>d.name),['behalten']);
});
