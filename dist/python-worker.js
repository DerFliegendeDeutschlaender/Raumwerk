/* Python is isolated from the rendering thread; terminating this worker stops any program. */
let pyodide, api, dataCache, dataError, queue = Promise.resolve();
const CDN = new URL('./vendor/pyodide/', self.location.href).href;
async function initialize() {
  try {
    const {loadPyodide} = await import(CDN + 'pyodide.mjs?v=314.0.7');
    self.postMessage({type:'status', message:'Python-Laufzeit wird gestartet …'});
    pyodide = await loadPyodide({indexURL:CDN});
    const response = await fetch('./api.py');
    if (!response.ok) throw new Error('Die Geometrie-API konnte nicht geladen werden.');
    api = await response.text();
    self.postMessage({type:'ready', version:pyodide.runPython('import sys; sys.version.split()[0]')});
  } catch (error) {self.postMessage({type:'init-error',error:String(error)});}
}
self.onmessage = ({data}) => {
  if (data.type === 'datasets') {
    queue = queue.then(async () => {
      try {
        dataError = null;
        dataCache?.destroy(); dataCache = null;
        if (!data.datasets.length) return;
        await pyodide.loadPackage('numpy', {messageCallback:m=>self.postMessage({type:'status',message:m})});
        const raw = pyodide.toPy(Object.fromEntries(data.datasets.map(d=>[d.name,d.values])));
        pyodide.globals.set('_rw_data_raw',raw);
        try {dataCache = pyodide.runPython('import numpy as _rw_np\n{name: _rw_np.asarray(rows, dtype=float) for name, rows in _rw_data_raw.items()}');}
        finally {pyodide.globals.delete('_rw_data_raw');raw.destroy();}
      } catch(error) {dataError = String(error);}
    });
    return;
  }
  if (data.type !== 'run') return;
  queue = queue.then(async () => {
    const started = performance.now();
    let stdout='', stderr='', globals;
    pyodide.setStdout({batched:s => {if(stdout.length < 50000) stdout += s+'\n';}});
    pyodide.setStderr({batched:s => {if(stderr.length < 50000) stderr += s+'\n';}});
    try {
      if(dataError) throw new Error('Datensätze konnten nicht geladen werden: '+dataError);
      await pyodide.loadPackagesFromImports(data.code, {messageCallback:m=>self.postMessage({type:'status',message:m}),errorCallback:()=>{}});
      globals = pyodide.toPy({t:data.t, _param_values:data.params});
      if(dataCache) globals.set('_dataset_arrays',dataCache);
      await pyodide.runPythonAsync(api, {globals});
      globals.set('_user_code',data.code);
      await pyodide.runPythonAsync(`
import ast as _ast
_tree = _ast.parse(_user_code, filename='main.py', mode='exec')
_last = None
if _tree.body and isinstance(_tree.body[-1], _ast.Expr):
    _expr = _tree.body.pop()
    exec(compile(_tree, 'main.py', 'exec'), globals())
    _last = eval(compile(_ast.Expression(_expr.value), 'main.py', 'eval'), globals())
    if _last is not None and not any(_last is _o for _o in _objects): print(repr(_last))
else:
    exec(compile(_tree, 'main.py', 'exec'), globals())
`, {globals});
      const json = pyodide.runPython('_json.dumps(dict(objects=_objects, parameters=_parameters), allow_nan=False)', {globals});
      self.postMessage({type:'result',id:data.id, t:data.t, ...JSON.parse(json), stdout,stderr,ms:performance.now()-started});
    } catch(error) {
      self.postMessage({type:'error',id:data.id,error:String(error),stdout,stderr,ms:performance.now()-started});
    } finally {globals?.destroy();}
  }).catch(error => self.postMessage({type:'error',id:data.id,error:String(error)}));
};
initialize();
