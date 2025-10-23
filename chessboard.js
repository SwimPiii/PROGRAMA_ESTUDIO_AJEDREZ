// Símbolos Unicode grandes para piezas
const PIECES = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
// Helpers de coordenadas
const filesIdxMap = { a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7 };
const fileToCol = (f) => filesIdxMap[f];
const rankToRowIdx = (r) => [8,7,6,5,4,3,2,1].indexOf(Number(r));
const idxToCoord = (r,c) => 'abcdefgh'[c] + String([8,7,6,5,4,3,2,1][r]);
function fenToBoard(fen) {
    const rows = fen.split('/');
    let boardArr = [];
    for (let r = 0; r < 8; r++) {
        let row = [];
        let fenRow = rows[r];
        for (let i = 0; i < fenRow.length; i++) {
            const c = fenRow[i];
            if (c >= '1' && c <= '8') {
                for (let j = 0; j < parseInt(c); j++) row.push('');
            } else {
                row.push(c);
            }
        }
        boardArr.push(row);
    }
    return boardArr;
}
// Convierte matriz de tablero en FEN (solo piezas, sin metadatos)
function boardToFEN(arr) {
    return arr.map(row => {
        let str = '';
        let empty = 0;
        for (let c of row) {
            if (!c) empty++;
            else {
                if (empty) str += empty;
                str += c;
                empty = 0;
            }
        }
        if (empty) str += empty;
        return str;
    }).join('/');
}
function getBoard() { return document.getElementById('chessboard'); }
const files = ['a','b','c','d','e','f','g','h'];
const ranks = [8,7,6,5,4,3,2,1];
const blackBottomCheckbox = document.getElementById('black-bottom');
const toggleLog = document.getElementById('toggle-log');
const toggleAnalysis = document.getElementById('toggle-analysis');
// UI adicionales
const analysisBox = document.getElementById('analysis-box');
const btnAnalysis = document.getElementById('btn-analysis');
const scoreEl = document.getElementById('score');
const modalOverlay = document.getElementById('modal-overlay');
const modalText = document.getElementById('modal-text');
const modalAccept = document.getElementById('modal-accept');
const modalNext = document.getElementById('modal-next');

// Puntuación
let score = 1000;
function setScore(v) { score = v; if (scoreEl) scoreEl.textContent = String(score); }
setScore(score);
// Forzamos estilo clásico (cburnett) siempre
function applyPieceStyle() {
    const boardEl = getBoard();
    if (!boardEl) return;
    boardEl.classList.remove('style-circulos','style-svg','style-unicode','style-flat','style-tiles','style-letters');
    boardEl.classList.add('style-cburnett');
}
function getOrientation() { return blackBottomCheckbox && blackBottomCheckbox.checked ? 'b' : 'w'; }
// Estado del motor real de chess.js
let chess = null;
function ensureChessInit() {
    if (!chess && typeof Chess === 'function') {
        chess = new Chess();
        if (typeof logDebug === 'function') logDebug('chess.js inicializado correctamente.');
    }
}
// Si el bridge ESM ya cargó, inicializa; si no, espera evento
ensureChessInit();
window.addEventListener('ChessReady', () => {
    const fenPrev = chess ? chess.fen() : null;
    chess = new Chess();
    if (fenPrev) {
        try { chess.load(fenPrev); } catch (_) {}
    }
    if (typeof logDebug === 'function') logDebug('chess.js (ESM) disponible. Motor real activado.');
    renderBoard();
});
// Si el bridge ESM carga después, cambia a chess.js real
// (Eliminado segundo listener duplicado)
function renderBoard() {
    const boardEl = getBoard();
    if (!boardEl) { try { logDebug('Tablero no encontrado en DOM aún.'); } catch(_) {} return; }
    boardEl.innerHTML = '';
    applyPieceStyle();
    const fen = chess ? chess.fen().split(' ')[0] : START_FEN;
    const position = fenToBoard(fen);
    const side = getOrientation();
    const rowOrder = side === 'w' ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
    const colOrder = side === 'w' ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
    for (const rIdx of rowOrder) {
        for (const cIdx of colOrder) {
            const square = document.createElement('div');
            square.className = 'square ' + ((rIdx+cIdx)%2 === 0 ? 'light' : 'dark');
            square.dataset.coord = files[cIdx] + ranks[rIdx];
            const piece = position[rIdx][cIdx];
            if (piece) {
                const pieceSpan = document.createElement('span');
                pieceSpan.className = 'piece';
                {
                    const map = { K:'wK', Q:'wQ', R:'wR', B:'wB', N:'wN', P:'wP', k:'bK', q:'bQ', r:'bR', b:'bB', n:'bN', p:'bP' };
                    const fn = map[piece] ? map[piece] + '.svg' : null;
                    if (fn) {
                        const img = document.createElement('img');
                        img.alt = piece;
                        img.src = 'assets/cburnett/' + fn;
                        img.onerror = () => {
                            // Fallback si el archivo no existe
                            pieceSpan.innerHTML = '';
                            if (PIECES[piece]) {
                                pieceSpan.textContent = PIECES[piece];
                            }
                        };
                        pieceSpan.appendChild(img);
                    }
                }
                if (pieceSpan.innerHTML || pieceSpan.textContent) {
                    // Sin draggable para evitar drag & drop nativo
                    pieceSpan.dataset.piece = piece;
                    pieceSpan.dataset.from = files[cIdx] + ranks[rIdx];
                    square.appendChild(pieceSpan);
                }
            }
            // Eliminado drag & drop, solo click
            boardEl.appendChild(square);
        }
    }
    // Render de coordenadas externas
    const filesEl = document.getElementById('board-files');
    const ranksEl = document.getElementById('board-ranks');
    if (filesEl) {
        filesEl.innerHTML = '';
        const filesOrder = side === 'w' ? files : [...files].reverse();
        for (const f of filesOrder) {
            const sp = document.createElement('span'); sp.textContent = f; filesEl.appendChild(sp);
        }
    }
    if (ranksEl) {
        ranksEl.innerHTML = '';
        const ranksOrder = side === 'w' ? ranks : [...ranks].reverse();
        for (const r of ranksOrder) {
            const sp = document.createElement('span'); sp.textContent = r; ranksEl.appendChild(sp);
        }
    }
}
// Render inmediato y también tras DOMContentLoaded por si acaso
renderBoard();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderBoard(), { once: true });
}

// Estado quiz (tras posición aleatoria + análisis 10s)
let quizActive = false; // si está esperando la jugada del usuario
let quizMoves = null;   // array de { idx:1..3, san: 'e4', score: {type:'cp'|'mate', value:number} }
let quizPendingAnalysis = false; // evita mover antes de que termine el análisis de 10s
// --- TIMER ---
let timerValue = 120; // segundos por ejercicio
let timerCurrent = 0;
let timerInterval = null;

const timerEl = document.getElementById('timer');
const timerInput = document.getElementById('timer-input');
function updateTimerDisplay() {
    if (timerEl) {
        const min = String(Math.floor(timerCurrent/60)).padStart(2,'0');
        const sec = String(timerCurrent%60).padStart(2,'0');
        timerEl.textContent = `${min}:${sec}`;
    }
}
function startTimer() {
    stopTimer();
    timerCurrent = timerValue;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timerCurrent--;
        updateTimerDisplay();
        if (timerCurrent <= 0) {
            stopTimer();
            setScore(score - 20);
            showModal('¡Tiempo agotado! -20 puntos');
            quizActive = false; quizMoves = null;
        }
    }, 1000);
}
function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}
function resetTimer() {
    stopTimer();
    timerCurrent = timerValue;
    updateTimerDisplay();
}
function updateTimerFromInput() {
    let v = parseInt(timerInput.value);
    if (isNaN(v) || v < 5) v = 30;
    timerValue = v;
    timerCurrent = v;
    timerInput.value = v;
    updateTimerDisplay();
}
if (timerInput) {
    timerInput.addEventListener('change', updateTimerFromInput);
    timerInput.addEventListener('input', updateTimerFromInput);
    // Forzar valor inicial seguro en todos los navegadores
    let v = parseInt(timerInput.value);
    if (isNaN(v) || v < 5) v = 30;
    timerInput.value = v;
    timerValue = v;
    timerCurrent = v;
    updateTimerDisplay();
}
resetTimer();

function showModal(text) {
    if (!modalOverlay || !modalText) return;
    modalText.textContent = text;
    modalOverlay.style.display = 'flex';
    modalOverlay.classList.remove('hidden');
}
if (modalAccept && modalOverlay) {
    modalAccept.addEventListener('click', () => { modalOverlay.classList.add('hidden'); modalOverlay.style.display = 'none'; });
}
if (modalNext && modalOverlay) {
    modalNext.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        modalOverlay.style.display = 'none';
        // Disparar siguiente posición aleatoria
        const btn = document.getElementById('btn-random');
        if (btn) btn.click();
    });
}

let selectedFrom = null;
function clearSelection() {
    const prev = document.querySelector('.square.selected');
    if (prev) prev.classList.remove('selected');
}
// Desactivar el log de depuración; reservamos el panel para mostrar solo la partida completa
function logDebug(msg) { /* intencionalmente vacío */ }

function setGameLog(text) {
    const logBox = document.getElementById('debug-log');
    if (logBox) {
        logBox.value = (text || '').trim();
        logBox.scrollTop = 0;
    }
}

// Normaliza una valoración del motor a la perspectiva del jugador que acaba de mover.
// Como el análisis post-movimiento se hace con el rival al turno, invertimos el signo.
function normalizeToPlayerPerspective(score) {
    if (!score || typeof score.value !== 'number' || !score.type) return score;
    const out = { type: score.type, value: score.value };
    if (out.type === 'cp') out.value = -out.value;
    else if (out.type === 'mate') out.value = -out.value;
    return out;
}
document.addEventListener('click', async function(e) {
    const squareElem = e.target.closest('#chessboard .square');
    if (!squareElem) return;
    const coord = squareElem.dataset.coord;
    const dbStatus = document.getElementById('db-status');
    logDebug('Click en casilla: ' + coord);
    if (!selectedFrom) {
        // Selecciona origen si hay pieza propia
        const pieceElem = squareElem.querySelector('.piece');
        if (pieceElem) {
            selectedFrom = coord;
            clearSelection();
            squareElem.classList.add('selected');
            dbStatus.textContent = 'Selecciona destino para mover la pieza.';
            dbStatus.style.color = '#2196f3';
            logDebug('Seleccionada pieza en ' + coord);
        }
    } else {
        // Intentar mover
        if (quizPendingAnalysis) {
            dbStatus.textContent = 'Espera a que termine el análisis…';
            dbStatus.style.color = '#f44336';
            clearSelection();
            selectedFrom = null;
            return;
        }
        if (!chess && typeof Chess === 'function') {
            chess = new Chess();
            logDebug('chess.js inicializado en el click.');
        }
        if (!chess) {
            dbStatus.textContent = 'Error: chess.js no está inicializado.';
            dbStatus.style.color = '#f44336';
            logDebug('Error: chess.js no está inicializado.');
        } else {
            const move = chess.move({ from: selectedFrom, to: coord, promotion: 'q' });
            if (move) {
                renderBoard();
                dbStatus.textContent = 'Movimiento realizado.';
                dbStatus.style.color = '#4caf50';
                logDebug('Movimiento realizado: ' + selectedFrom + ' -> ' + coord);
                const playedSAN = move.san;
                // Si está activo el quiz, evaluar jugada con el motor y comparar valoración
                if (quizActive && Array.isArray(quizMoves) && quizMoves.length) {
                    try {
                        // Si la jugada del usuario coincide con la mejor jugada (SAN), usar directamente el score de la PV principal
                        let userScore = null;
                        let usedPV = null;
                        if (quizMoves && quizMoves[0] && quizMoves[0].san === playedSAN) {
                            userScore = quizMoves[0].score;
                            usedPV = quizMoves[0];
                        } else {
                            // Buscar si coincide con alguna de las otras PV
                            const found = quizMoves.find(e => e.san === playedSAN);
                            if (found) {
                                userScore = found.score;
                                usedPV = found;
                            } else {
                                // Si no coincide, analizar la jugada sobre el FEN base
                                let fenBase = (quizMoves && quizMoves.fen) ? quizMoves.fen : null;
                                let fenUser = chess.fen();
                                if (fenBase) {
                                    const tmpChess = new Chess(fenBase);
                                    tmpChess.move(playedSAN);
                                    const res = await analyzeWithStockfishStreaming(10000, 1, null, tmpChess.fen());
                                    userScore = (res && res[0] && res[0].score) ? res[0].score : null;
                                } else {
                                    const res = await analyzeWithStockfishStreaming(10000, 1, null, fenUser);
                                    userScore = (res && res[0] && res[0].score) ? res[0].score : null;
                                }
                                userScore = normalizeToPlayerPerspective(userScore);
                            }
                        }
                        if (analysisBox && userScore) {
                            const normStr = userScore.type === 'cp' ? (userScore.value/100).toFixed(2) : ('#' + userScore.value);
                            const line = `Tu jugada: ${playedSAN} | ${normStr}`;
                            analysisBox.value = (analysisBox.value ? analysisBox.value + '\n\n' : '') + line;
                        }
                        // Comparar solo contra la mejor línea con tolerancia ±0.5 (50cp)
                        let ok = false;
                        const EVAL_TOLERANCE_CP = 50;
                        if (userScore && quizMoves && quizMoves[0] && quizMoves[0].score) {
                            const sTop = quizMoves[0].score;
                            if (sTop.type === 'cp' && userScore.type === 'cp') {
                                if (Math.abs(sTop.value - userScore.value) <= EVAL_TOLERANCE_CP) ok = true;
                            } else if (sTop.type === 'mate' && userScore.type === 'mate') {
                                const sameSign = (sTop.value === 0 && userScore.value === 0) || (sTop.value > 0 && userScore.value > 0) || (sTop.value < 0 && userScore.value < 0);
                                if (sameSign) ok = true;
                            }
                        }
                        if (ok) {
                            setScore(score + 10);
                            showModal('Correcto!');
                        } else {
                            setScore(score - 10);
                            const alts = quizMoves.map(e => e.san).join(', ');
                            showModal(`Incorrecto!\nLa mejor era: ${alts}`);
                        }
                    } catch (_) {
                        setScore(score - 10);
                        const alts = quizMoves.map(e => e.san).join(', ');
                        showModal(`Incorrecto!\nLa mejor era: ${alts}`);
                    } finally {
                        quizActive = false; quizMoves = null;
                        stopTimer();
                    }
 
                }
            } else {
                dbStatus.textContent = 'Movimiento ilegal.';
                dbStatus.style.color = '#f44336';
                logDebug('Movimiento ilegal: ' + selectedFrom + ' -> ' + coord);
            }
        }
        clearSelection();
        selectedFrom = null;
    }
});

if (blackBottomCheckbox) {
    blackBottomCheckbox.addEventListener('change', () => {
        renderBoard();
    });
}
// Toggles de visibilidad
function applyVisibility() {
    const logSec = document.getElementById('log-section');
    const anaSec = document.getElementById('analysis-section');
    if (logSec && toggleLog) logSec.style.display = toggleLog.checked ? '' : 'none';
    if (anaSec && toggleAnalysis) anaSec.style.display = toggleAnalysis.checked ? '' : 'none';
}
if (toggleLog) toggleLog.addEventListener('change', applyVisibility);
if (toggleAnalysis) toggleAnalysis.addEventListener('change', applyVisibility);
applyVisibility();
// Eliminado listener de selector de estilos (no existe)

// --- Integración del temporizador con el flujo de ejercicios ---
// Se integra dentro del handler del botón "Posición aleatoria" más abajo.

// --- CARGA Y GESTIÓN DE BASE DE DATOS PGN ---
const btnDb = document.getElementById('btn-db');
const dbFile = document.getElementById('db-file');
const dbStatus = document.getElementById('db-status');
let partidasPGN = [];
btnDb.addEventListener('click', () => {
    dbFile.click();
});
dbFile.addEventListener('change', (e) => {
    if (dbFile.files.length > 0) {
        const file = dbFile.files[0];
        const reader = new FileReader();
        reader.onload = function(ev) {
            const pgnText = ev.target.result;
            partidasPGN = parsePGNDatabase(pgnText);
            dbStatus.textContent = `Base de datos cargada: ${partidasPGN.length} partidas`;
            dbStatus.style.color = partidasPGN.length ? '#4caf50' : '#f44336';
            logDebug(`Base de datos cargada (${partidasPGN.length} partidas)`);
        };
        reader.readAsText(file);
    } else {
        dbStatus.textContent = '';
        partidasPGN = [];
    }
});

// --- PARSEADOR SIMPLE DE PGN ---
function parsePGNDatabase(pgnText) {
    // Divide por doble salto de línea entre partidas
    const rawGames = pgnText.split(/\n\s*\n(?=\[Event )/);
    return rawGames.map(raw => {
        // Extrae cabeceras
        const headers = {};
        raw.replace(/\[(\w+) "([^"]*)"\]/g, (m, key, val) => { headers[key] = val; });
        // Extrae notación PGN (todo lo que no son cabeceras)
        const moves = raw.replace(/\[.*?\]\s*/gs, '').trim();
        return { headers, moves, raw };
    }).filter(g => g.moves.length > 0);
}

// --- BOTÓN POSICIÓN ALEATORIA CON INTERVALO ---
const btnRandom = document.getElementById('btn-random');
const intervalInput = document.getElementById('interval');
function tokenizePGNMoves(pgnMoves) {
    if (!pgnMoves) return [];
    let txt = pgnMoves;
    // Eliminar comentarios {...} y NAGs $n
    txt = txt.replace(/\{[^}]*\}/g, ' ');
    txt = txt.replace(/\$\d+/g, ' ');
    // Eliminar comentarios de paréntesis simples (una capa)
    for (let i=0;i<3;i++) txt = txt.replace(/\([^()]*\)/g, ' ');
    // Eliminar números de jugada y '...'
    txt = txt.replace(/\d+\.(\.\.)?/g, ' ');
    txt = txt.replace(/\.\.\./g, ' ');
    // Normalizar espacios
    txt = txt.replace(/\s+/g,' ').trim();
    // Dividir
    let tokens = txt.split(' ');
    // Filtrar resultados y vacíos
    const invalid = new Set(['', '1-0','0-1','1/2-1/2','*']);
    tokens = tokens.filter(t => !invalid.has(t));
    return tokens;
}
function isSanLike(token) {
    if (!token) return false;
    if (/^(O-O(-O)?|0-0(-0)?)$/i.test(token)) return true;
    // SAN básica: opcional pieza KQRBN, opcional desambiguación [a-h1-8], opcional 'x', destino [a-h][1-8], opcional =Q/R/B/N, opcional +# y anotaciones
    return /^[KQRBN]?[a-h1-8]?x?[a-h][1-8](=[QRBN])?[+#]?(!|\?)*$/.test(token);
}
btnRandom.addEventListener('click', async () => {
    // Arranca el temporizador del ejercicio
    resetTimer();
    setTimeout(() => startTimer(), 400);
    if (!partidasPGN.length) {
        dbStatus.textContent = 'No hay base de datos cargada.';
        dbStatus.style.color = '#f44336';
        logDebug('No hay base de datos cargada.');
        return;
    }
    // Procesa intervalo (numeración de jugadas completas, no plies)
    let intervalo = intervalInput.value.trim();
    let fullStart = null, fullEnd = null; // ej. 20-25 son jugadas 20..25
    if (/^\d+\s*-\s*\d+$/.test(intervalo)) {
        const partes = intervalo.split('-').map(x => parseInt(x.trim(), 10));
        fullStart = Math.max(1, partes[0] || 1);
        fullEnd = Math.max(fullStart, partes[1] || partes[0] || 1);
    }
    // Asegurar chess.js real
    ensureChessInit();
    if (!chess || typeof chess.load_pgn !== 'function') {
        dbStatus.textContent = 'Error: chess.js no está disponible aún.';
        dbStatus.style.color = '#f44336';
        logDebug('Error: chess.js no está disponible. Espera a que cargue el módulo.');
        return;
    }
    // Seleccionar partida que cumpla el intervalo (si existe)
    let partida = null;
    let movs = [];
    let attempts = 0;
    const maxAttempts = 500;
    while (attempts++ < maxAttempts) {
        const idx = Math.floor(Math.random() * partidasPGN.length);
        const cand = partidasPGN[idx];
        const tokens = tokenizePGNMoves(cand.moves);
        if (!tokens.length) continue;
        if (fullStart && fullEnd) {
            const maxFullAvailable = Math.ceil(tokens.length / 2);
            if (fullStart > maxFullAvailable) { continue; }
            const chosenFull = fullStart + Math.floor(Math.random() * (fullEnd - fullStart + 1));
            if (chosenFull > maxFullAvailable) { continue; }
            // Aceptamos esta partida; aplicamos hasta el ply objetivo
            chess.reset(); chess.load_pgn(cand.raw);
            movs = tokens;
            const side = getOrientation();
            const targetPly = side === 'b' ? (chosenFull * 2 - 2) : (chosenFull * 2 - 1);
            // reconstruir desde inicial para mayor robustez
            chess.reset();
            for (let i = 0; i <= targetPly && i < movs.length; i++) {
                const tok = movs[i];
                if (!isSanLike(tok)) continue;
                try { chess.move(tok, { sloppy: true }); } catch (_) {}
            }
            partida = cand;
            break;
        } else {
            // Sin intervalo: aceptar directamente; dejamos posición inicial o podríamos escoger una aleatoria
            chess.reset(); chess.load_pgn(cand.raw);
            partida = cand;
            movs = tokens;
            break;
        }
    }
    if (!partida) {
        // No se encontró partida que cumpla el intervalo
        dbStatus.textContent = 'No se encontró una partida que cumpla el intervalo.';
        dbStatus.style.color = '#f44336';
        renderBoard();
        return;
    }
    // Mostrar solo la partida completa en el panel derecho
    setGameLog(partida.raw);
    // No mostrar mensajes de estado adicionales
    renderBoard();

    // Tras fijar la posición final, lanzar análisis de 10s con top-3 y activar quiz
    try {
        quizPendingAnalysis = true;
        if (analysisBox) analysisBox.value = 'Analizando…';
    // Ajustar lado a mover: establecerlo explícitamente según orientación
        const fen = chess.fen();
        const parts = fen.split(' ');
    parts[1] = (getOrientation() === 'b') ? 'b' : 'w';
        const forcedFen = parts.join(' ');
    const results = await analyzeWithStockfishStreaming(10000, 3, updateAnalysisBox, forcedFen);
    // Guardar top-3 para comparación y el FEN base para análisis posterior
    quizMoves = results;
    if (quizMoves) quizMoves.fen = forcedFen;
        quizActive = true;
        quizPendingAnalysis = false;
    dbStatus.textContent = 'Elige tu movimiento';
        dbStatus.style.color = '#ffcc00';
    } catch (e) {
        quizPendingAnalysis = false;
        logDebug('Stockfish no disponible: ' + (e && e.message ? e.message : e));
    }
});

// --- Integración Stockfish (Web Worker) ---
let sfWorker = null;
let sfBusy = false;
let sfReady = false;
let currentAnalysis = null; // para cancelar
function waitForUciOk(worker, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        let done = false;
        const to = setTimeout(() => {
            if (done) return; done = true; try { worker.removeEventListener('message', onMsg); } catch (_) {}
            reject(new Error('Timeout esperando uciok'));
        }, timeoutMs);
        const onMsg = (e) => {
            const d = typeof e.data === 'string' ? e.data : (e.data && e.data.data ? e.data.data : '');
            if (typeof d === 'string' && d.includes('uciok')) {
                if (done) return; done = true; clearTimeout(to);
                try { worker.removeEventListener('message', onMsg); } catch (_) {}
                resolve();
            } else if (typeof d === 'string' && d.startsWith('stockfish-bootstrap:failed')) {
                // Señal de que bootstrap no pudo cargar
                if (done) return; done = true; clearTimeout(to);
                try { worker.removeEventListener('message', onMsg); } catch (_) {}
                reject(new Error('bootstrap-failed'));
            }
        };
        worker.addEventListener('message', onMsg);
        try { worker.postMessage('uci'); } catch (e) { clearTimeout(to); try { worker.removeEventListener('message', onMsg); } catch (_) {}; reject(e); }
    });
}
async function ensureStockfishReady() {
    if (sfWorker && sfReady) return sfWorker;
    // 1) Intento directo local principal
    try {
        sfWorker = new Worker('engine/stockfish.js');
        await waitForUciOk(sfWorker, 3000);
        sfReady = true; return sfWorker;
    } catch (_) {
        try { sfWorker && sfWorker.terminate && sfWorker.terminate(); } catch (e) {}
        sfWorker = null;
    }
    // 2) Bootstrap (carga local o CDN vía importScripts)
    try {
        sfWorker = new Worker('engine/stockfish-bootstrap.js');
        await waitForUciOk(sfWorker, 4000);
        sfReady = true; return sfWorker;
    } catch (e) {
        try { sfWorker && sfWorker.terminate && sfWorker.terminate(); } catch (ee) {}
        sfWorker = null;
    }
    // 3) Fetch + Blob desde CDNs
    const cdns = [
        'https://cdn.jsdelivr.net/npm/stockfish@16/stockfish.js',
        'https://cdn.jsdelivr.net/npm/stockfish/stockfish.js',
        'https://unpkg.com/stockfish/stockfish.js'
    ];
    for (const url of cdns) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const code = await res.text();
            const blob = new Blob([code], { type: 'application/javascript' });
            sfWorker = new Worker(URL.createObjectURL(blob));
            await waitForUciOk(sfWorker, 4000);
            sfReady = true; return sfWorker;
        } catch (_) {
            try { sfWorker && sfWorker.terminate && sfWorker.terminate(); } catch (ee) {}
            sfWorker = null;
        }
    }
    throw new Error('No se pudo cargar Stockfish');
}
function uciMoveListFromChess(ch) {
    // Construye la lista de movimientos en UCI desde el historial SAN del objeto chess
    const tmp = new Chess();
    const hist = ch.history({ verbose: true });
    const moves = [];
    for (const m of hist) {
        // Intentar obtener UCI desde verbose move
        const uci = (m.from && m.to ? (m.from + m.to + (m.promotion || '')) : null);
        if (uci) moves.push(uci);
        tmp.move(m.san, { sloppy: true });
    }
    return moves;
}
function parseScoreCpOrMate(tokens) {
    // tokens: array de palabras de una línea info de UCI
    const si = tokens.indexOf('score');
    if (si >= 0 && si + 2 < tokens.length) {
        const type = tokens[si + 1];
        const val = parseInt(tokens[si + 2], 10);
        if (type === 'cp') return { type: 'cp', value: val };
        if (type === 'mate') return { type: 'mate', value: val };
    }
    return null;
}
async function analyzeWithStockfish(ms = 5000, multiPV = 3) {
    if (!chess) throw new Error('Chess no inicializado');
    const w = await ensureStockfishReady();
    if (!w) throw new Error('Stockfish no disponible');
    if (sfBusy) { logDebug('Motor ocupado, espera…'); return; }
    sfBusy = true;
    const lines = new Map(); // pvIndex -> { score, pv, depth }
    const best = [];
    return new Promise((resolve, reject) => {
        const onMsg = (e) => {
            const data = e.data;
            if (typeof data === 'string') {
                // Algunas builds envían texto directo
                if (data.startsWith('stockfish-bootstrap:')) {
                    logDebug(data);
                } else {
                    handleText(data);
                }
            } else if (data && typeof data === 'object') {
                // Otras builds usan objetos { type: 'stdout', data: '...' }
                if (typeof data.data === 'string') {
                    handleText(data.data);
                } else if (data.type === 'log' && data.data) {
                    logDebug(String(data.data));
                }
            }
        };
        function handleText(text) {
            const linesTxt = text.split(/\r?\n/).filter(Boolean);
            for (const L of linesTxt) {
                if (L.startsWith('info ')) {
                    const t = L.split(/\s+/);
                    const mpvi = t.indexOf('multipv');
                    const pvIdx = (mpvi >= 0 && mpvi + 1 < t.length) ? parseInt(t[mpvi + 1], 10) : 1;
                    const sc = parseScoreCpOrMate(t);
                    const pvi = t.indexOf('pv');
                    const pvMoves = (pvi >= 0) ? t.slice(pvi + 1) : [];
                    const di = t.indexOf('depth');
                    const depth = (di >= 0 && di + 1 < t.length) ? parseInt(t[di + 1], 10) : undefined;
                    if (sc && pvMoves.length) {
                        lines.set(pvIdx, { score: sc, pv: pvMoves, depth });
                    }
                } else if (L.startsWith('bestmove')) {
                    // Termina búsqueda
                    finish();
                } else if (L.startsWith('uciok')) {
                    // listo tras uci
                } else if (L.startsWith('readyok')) {
                    // listo tras isready
                }
            }
        }
        let finished = false;
        function finish() {
            if (finished) return; finished = true;
            try {
                w.removeEventListener('message', onMsg);
            } catch (_) {}
            sfBusy = false;
            if (lines.size === 0) {
                logDebug('Sin líneas de análisis disponibles.');
                resolve();
                return;
            }
            // Ordena por multipv 1..N
            const out = [];
            for (let i = 1; i <= multiPV; i++) {
                if (!lines.has(i)) continue;
                const L = lines.get(i);
                out.push({ idx: i, ...L });
            }
            if (!out.length) {
                resolve();
                return;
            }
            // Convertir primer movimiento de la PV a SAN para más legibilidad
            const sanified = [];
            for (const entry of out) {
                const tmp = new Chess(chess.fen());
                let firstMoveSan = null;
                if (entry.pv && entry.pv.length) {
                    const uci0 = entry.pv[0];
                    const from = uci0.slice(0,2), to = uci0.slice(2,4);
                    const promo = uci0.length > 4 ? uci0.slice(4,5) : undefined;
                    try {
                        const m = tmp.move({ from, to, promotion: promo });
                        if (m) firstMoveSan = m.san;
                    } catch (_) {}
                }
                sanified.push({ ...entry, firstSan: firstMoveSan });
            }
            // Log amigable: solo el primer movimiento de cada línea
            logDebug('--- Análisis Stockfish (MultiPV=' + multiPV + ', 10s) ---');
            for (const e of sanified) {
                const scoreTxt = e.score.type === 'cp' ? (e.score.value/100).toFixed(2) : ('#' + e.score.value);
                const first = e.firstSan || e.pv[0] || '?';
                logDebug(`#${e.idx} depth ${e.depth || '?'} score ${scoreTxt} | ${first}`);
            }
            resolve();
        }

    w.addEventListener('message', onMsg);
        // Secuencia UCI más robusta: esperar readyok antes de go
        const fen = chess.fen();
        const seq = [
            'uci',
            // Esperaremos uciok antes de opciones
            'setoption name MultiPV value ' + multiPV,
            'ucinewgame',
            'isready',
            'position fen ' + fen,
            'isready',
            'go movetime ' + ms
        ];
        let step = 0;
        function pump() {
            if (step >= seq.length) return;
            const cmd = seq[step++];
            w.postMessage(cmd);
            if (cmd === 'uci') {
                const uciListener = (ev) => {
                    const d = typeof ev.data === 'string' ? ev.data : (ev.data && ev.data.data ? ev.data.data : '');
                    if (typeof d === 'string' && d.includes('uciok')) {
                        w.removeEventListener('message', uciListener);
                        setTimeout(pump, 0);
                    }
                };
                w.addEventListener('message', uciListener);
                return;
            } else if (cmd === 'isready') {
                const readyListener = (ev) => {
                    const d = typeof ev.data === 'string' ? ev.data : (ev.data && ev.data.data ? ev.data.data : '');
                    if (d.includes('readyok')) {
                        w.removeEventListener('message', readyListener);
                        // siguiente comando
                        setTimeout(pump, 0);
                    }
                };
                w.addEventListener('message', readyListener);
                return;
            } else {
                setTimeout(pump, 0);
            }
        }
        pump();
        // Garantizar finalización aunque algún build no envíe bestmove
        const guard = setTimeout(() => finish(), ms + 2500);
    });
}

function sanitizeLinesToSummary(linesMap, multiPV, fenAtStart) {
    const out = [];
    for (let i = 1; i <= multiPV; i++) {
        if (!linesMap.has(i)) continue;
        const entry = linesMap.get(i);
        let firstSan = null;
        const tmp = new Chess(fenAtStart);
        if (entry.pv && entry.pv.length) {
            const uci0 = entry.pv[0];
            const from = uci0.slice(0,2), to = uci0.slice(2,4);
            const promo = uci0.length > 4 ? uci0.slice(4,5) : undefined;
            try { const m = tmp.move({ from, to, promotion: promo }); if (m) firstSan = m.san; } catch (_) {}
        }
        out.push({ idx: i, san: firstSan || (entry.pv && entry.pv[0]) || '?', score: entry.score, depth: entry.depth });
    }
    return out;
}

async function analyzeWithStockfishStreaming(ms = 60000, multiPV = 3, onUpdate) {
    if (!chess) throw new Error('Chess no inicializado');
    const w = await ensureStockfishReady();
    if (!w) throw new Error('Stockfish no disponible');
    if (sfBusy) throw new Error('Motor ocupado');
    sfBusy = true;
    const fen = (typeof arguments[3] === 'string' && arguments[3]) ? arguments[3] : chess.fen();
    const lines = new Map();
    return new Promise((resolve, reject) => {
        const onMsg = (e) => {
            const data = e.data;
            const handleText = (text) => {
                const linesTxt = text.split(/\r?\n/).filter(Boolean);
                for (const L of linesTxt) {
                    if (L.startsWith('info ')) {
                        const t = L.split(/\s+/);
                        const mpvi = t.indexOf('multipv');
                        const pvIdx = (mpvi >= 0 && mpvi + 1 < t.length) ? parseInt(t[mpvi + 1], 10) : 1;
                        const sc = parseScoreCpOrMate(t);
                        const pvi = t.indexOf('pv');
                        const pvMoves = (pvi >= 0) ? t.slice(pvi + 1) : [];
                        const di = t.indexOf('depth');
                        const depth = (di >= 0 && di + 1 < t.length) ? parseInt(t[di + 1], 10) : undefined;
                        if (sc && pvMoves.length) {
                            lines.set(pvIdx, { score: sc, pv: pvMoves, depth });
                        }
                    } else if (L.startsWith('bestmove')) {
                        finish();
                    }
                }
            };
            if (typeof data === 'string') {
                handleText(data);
            } else if (data && typeof data === 'object') {
                if (typeof data.data === 'string') handleText(data.data);
            }
        };
        function update() {
            if (typeof onUpdate === 'function') {
                const summary = sanitizeLinesToSummary(lines, multiPV, fen);
                onUpdate(summary);
            }
        }
        let finished = false;
        function finish() {
            if (finished) return; finished = true;
            try { w.removeEventListener('message', onMsg); } catch (_) {}
            clearInterval(intervalId);
            sfBusy = false;
            const summary = sanitizeLinesToSummary(lines, multiPV, fen);
            if (typeof onUpdate === 'function') onUpdate(summary);
            resolve(summary);
        }
        w.addEventListener('message', onMsg);
        const seq = [
            'uci',
            'setoption name MultiPV value ' + multiPV,
            'ucinewgame',
            'isready',
            'position fen ' + fen,
            'isready',
            'go movetime ' + ms
        ];
        let step = 0;
        function pump() {
            if (step >= seq.length) return;
            const cmd = seq[step++];
            w.postMessage(cmd);
            if (cmd === 'uci') {
                const uciListener = (ev) => {
                    const d = typeof ev.data === 'string' ? ev.data : (ev.data && ev.data.data ? ev.data.data : '');
                    if (typeof d === 'string' && d.includes('uciok')) {
                        w.removeEventListener('message', uciListener);
                        setTimeout(pump, 0);
                    }
                };
                w.addEventListener('message', uciListener);
                return;
            } else if (cmd === 'isready') {
                const readyListener = (ev) => {
                    const d = typeof ev.data === 'string' ? ev.data : (ev.data && ev.data.data ? ev.data.data : '');
                    if (d.includes('readyok')) {
                        w.removeEventListener('message', readyListener);
                        setTimeout(pump, 0);
                    }
                };
                w.addEventListener('message', readyListener);
                return;
            } else {
                setTimeout(pump, 0);
            }
        }
        pump();
    const intervalId = setInterval(update, 5000);
    // Primera actualización temprana a los ~500ms para evidenciar progreso
    setTimeout(update, 500);
        currentAnalysis = {
            cancel: () => { try { w.postMessage('stop'); } catch (_) {} },
            running: true
        };
        setTimeout(() => finish(), ms + 2500);
    });
}

function updateAnalysisBox(summary) {
    if (!analysisBox) return;
    if (!summary || !summary.length) { analysisBox.value = 'Analizando…'; return; }
    const toStr = (e) => {
        const s = e.score ? (e.score.type === 'cp' ? (e.score.value/100).toFixed(2) : ('#'+e.score.value)) : '?';
        return `#${e.idx} depth ${e.depth || '?'} score ${s} | ${e.san}`;
    };
    analysisBox.value = summary.map(toStr).join('\n');
}

if (btnAnalysis) {
    btnAnalysis.addEventListener('click', async () => {
        if (currentAnalysis && currentAnalysis.running) {
            try { currentAnalysis.cancel(); } catch (_) {}
            btnAnalysis.textContent = 'Análisis';
            btnAnalysis.style.fontStyle = 'normal';
            if (currentAnalysis) currentAnalysis.running = false;
            return;
        }
        if (!chess) { logDebug('Chess no inicializado'); return; }
        if (analysisBox) { analysisBox.value = 'Analizando…'; }
        btnAnalysis.textContent = 'Analizando';
        btnAnalysis.style.fontStyle = 'italic';
        try {
            // Forzar lado a mover según orientación actual
            const fenNow = chess.fen();
            const parts = fenNow.split(' ');
            parts[1] = (getOrientation() === 'b') ? 'b' : 'w';
            const forcedFen = parts.join(' ');
            const res = await analyzeWithStockfishStreaming(60000, 3, updateAnalysisBox, forcedFen);
            if (currentAnalysis) currentAnalysis.running = false;
        } catch (e) {
            logDebug('Error análisis: ' + (e && e.message ? e.message : e));
        } finally {
            btnAnalysis.textContent = 'Análisis';
            btnAnalysis.style.fontStyle = 'normal';
            if (currentAnalysis) currentAnalysis.running = false;
        }
    });
}
