// Bootstrap de Stockfish para Web Worker
// Intenta cargar un build local; si falla, recurre a CDN.
(function() {
  function tryImport(srcs, idx) {
    if (idx >= srcs.length) {
      try { self.postMessage('stockfish-bootstrap:failed'); } catch (e) {}
      return;
    }
    try {
      importScripts(srcs[idx]);
      try { self.postMessage('stockfish-bootstrap:loaded:' + srcs[idx]); } catch (e) {}
    } catch (e) {
      tryImport(srcs, idx + 1);
    }
  }
  // Orden de prueba: builds locales (relativos al propio worker) luego CDNs
  tryImport([
    './stockfish.js',           // build local principal (recom.)
    './stockfish.wasm.js',      // alternativo WASM JS local
    './stockfish.engine.js',    // nombre alternativo JS local
    // CDNs (varias opciones por compatibilidad)
    'https://cdn.jsdelivr.net/npm/stockfish@16/stockfish.js',
    'https://cdn.jsdelivr.net/npm/stockfish/stockfish.js',
    'https://unpkg.com/stockfish/stockfish.js'
  ], 0);
})();