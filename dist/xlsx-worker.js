/* Module worker: acknowledge the parser before receiving a transferable file. */
let workbook,parser;
const loading=import('./xlsx-parser.js').then(module=>{parser=module;self.postMessage({type:'ready'});}).catch(error=>{self.postMessage({type:'init-error',error:error?.message||'Excel-Lesemodul konnte nicht geladen werden.'});});
self.onmessage=async({data})=>{
  try{
    await loading;if(!parser)throw new Error('Excel-Lesemodul ist nicht bereit.');
    if(data.type==='open'){workbook=parser.openWorkbook(data.buffer);self.postMessage({type:'opened',id:data.id,sheets:parser.listSheets(workbook)});}
    else if(data.type==='sheet')self.postMessage({type:'sheet',id:data.id,...parser.readWorksheet(workbook,data.name)});
  }catch(error){self.postMessage({type:'error',id:data.id,error:error?.message||String(error)||'Excel-Datei konnte nicht verarbeitet werden.'});}
};
