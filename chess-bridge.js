// Puente ESM -> Global: importa Chess del módulo ESM y lo expone en window
import { Chess } from './chess.min.js';
window.Chess = Chess;
// Notificar disponibilidad
try {
	window.dispatchEvent(new Event('ChessReady'));
} catch (_) {
	// fallback para navegadores sin Event constructor
	var evt;
	try { evt = document.createEvent('Event'); evt.initEvent('ChessReady', true, true); window.dispatchEvent(evt); } catch (e) {}
}
