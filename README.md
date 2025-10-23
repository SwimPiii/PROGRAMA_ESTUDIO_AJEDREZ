# PROGRAMA_ESTUDIO_AJEDREZ

Visor y entrenador de ajedrez offline con análisis de Stockfish (MultiPV=3), modo test por posiciones aleatorias y puntuación.

- 100% local: sin dependencias externas.
- Motor Stockfish en Web Worker.
- Carga PGN, “Posición aleatoria” con intervalo, orientación blanca/negra abajo.
- Análisis 60s con actualizaciones cada 5s.
- Modo quiz: compara tu jugada con el Top-3 del motor y puntúa.

## Uso
- Abre `index.html` en el navegador (recomendado servir con un servidor local para evitar restricciones de Web Workers).
- En Windows con PowerShell: `python -m http.server 8000` y abre http://localhost:8000

## Notas
- Se excluye `basededatos.pgn` del repositorio por tamaño (>100MB). Usa tu propio PGN o divide el archivo en fragmentos más pequeños.
