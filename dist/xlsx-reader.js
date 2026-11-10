// Prefer an isolated module worker. If the browser cannot start it, keep the
// selected file local and use the same parser in the page as a compatibility path.
export function errorText(error,fallback='Das Excel-Lesemodul konnte nicht geladen werden.'){
  const candidates=[error?.message,error?.error?.message,typeof error==='string'?error:null];
  return candidates.find(s=>typeof s==='string'&&s.trim()&&s!=='undefined'&&s!=='null')?.trim()||fallback;
}

export class XlsxReader{
  constructor({onStatus=()=>{},workerFactory=()=>new Worker(new URL('./xlsx-worker.js?v=2.0.1',import.meta.url),{type:'module',name:'raumwerk-xlsx'}),parserLoader=()=>import('./xlsx-parser.js'),startupTimeout=12000,requestTimeout=30000}={}){
    this.onStatus=onStatus;this.workerFactory=workerFactory;this.parserLoader=parserLoader;this.startupTimeout=startupTimeout;this.requestTimeout=requestTimeout;this.pending=new Map();this.sequence=0;this.mode='worker';this.closed=false;
  }
  close(){this.closed=true;this.worker?.terminate();this.fail(new Error('Excel-Import abgebrochen.'));}
  fail(error){this.workerError=error;clearTimeout(this.ready?.timer);this.ready?.reject(error);for(const request of this.pending.values()){clearTimeout(request.timer);request.reject(error);}this.pending.clear();}
  start(){
    return new Promise((resolve,reject)=>{
      this.ready={resolve:()=>{clearTimeout(this.ready.timer);resolve();},reject};
      this.ready.timer=setTimeout(()=>this.fail(new Error('Das Excel-Lesemodul antwortet beim Start nicht.')),this.startupTimeout);
      try{
        this.worker=this.workerFactory();
        this.worker.onmessage=({data})=>{
          if(data.type==='ready'){this.ready.resolve();return;}
          if(data.type==='init-error'){this.fail(new Error(errorText(data.error)));return;}
          const request=this.pending.get(data.id);if(!request)return;this.pending.delete(data.id);clearTimeout(request.timer);
          if(data.type==='error'){const error=new Error(errorText(data.error,'Die Excel-Datei konnte nicht verarbeitet werden.'));error.parserError=true;request.reject(error);}else request.resolve(data);
        };
        this.worker.onerror=event=>{event.preventDefault?.();this.fail(new Error(errorText(event,'Der Browser konnte den Excel-Import-Worker nicht ausführen.')));};
        this.worker.onmessageerror=()=>this.fail(new Error('Die Excel-Daten konnten nicht an das Lesemodul übergeben werden.'));
      }catch(error){this.fail(new Error(errorText(error)));}
    });
  }
  request(type,payload={},transfer=[]){
    if(this.closed)return Promise.reject(new Error('Excel-Import abgebrochen.'));
    if(this.workerError)return Promise.reject(this.workerError);
    return new Promise((resolve,reject)=>{const id=++this.sequence;const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Das Excel-Lesemodul antwortet nicht.'));},this.requestTimeout);this.pending.set(id,{resolve,reject,timer});try{this.worker.postMessage({type,id,...payload},transfer);}catch(error){clearTimeout(timer);this.pending.delete(id);reject(error);}});
  }
  async compatibility(){
    if(this.closed)throw new Error('Excel-Import abgebrochen.');
    this.worker?.terminate();this.mode='compatibility';this.onStatus('Excel-Lesemodul wird im Kompatibilitätsmodus gestartet …');
    try{this.parser=await this.parserLoader();const buffer=await this.file.arrayBuffer();if(this.closed)throw new Error('Excel-Import abgebrochen.');this.workbook=this.parser.openWorkbook(buffer);}
    catch(error){throw new Error('Excel-Datei konnte nicht gelesen werden: '+errorText(error,'Das lokale Excel-Lesemodul ist nicht verfügbar. Bitte die Seite neu laden.'));}
  }
  async open(file){
    this.file=file;
    try{await this.start();const buffer=await file.arrayBuffer();const result=await this.request('open',{buffer},[buffer]);return result.sheets;}
    catch(error){if(this.closed||error.parserError)throw error;await this.compatibility();return this.parser.listSheets(this.workbook);}
  }
  async sheet(name){
    if(this.closed)throw new Error('Excel-Import abgebrochen.');
    if(this.mode==='compatibility')return this.parser.readWorksheet(this.workbook,name);
    try{return await this.request('sheet',{name});}
    catch(error){if(this.closed||error.parserError)throw error;await this.compatibility();return this.parser.readWorksheet(this.workbook,name);}
  }
}
