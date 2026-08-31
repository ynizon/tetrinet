class Renderer {
  constructor(canvas, cellSize) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = cellSize;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBoard(board) {
    for (let r = 0; r < CONFIG.BOARD_HEIGHT; r++) {
      for (let c = 0; c < CONFIG.BOARD_WIDTH; c++) {
        if (board[r][c] !== 0) {
          this.drawCell(r, c, board[r][c]);
        }
      }
    }
  }

  drawPiece(shape, row, col) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          this.drawCell(row + r, col + c, shape[r][c]);
        }
      }
    }
  }

  drawGhostPiece(shape, ghostRow, col) {
    this.ctx.globalAlpha = 0.3;
    this.drawPiece(shape, ghostRow, col);
    this.ctx.globalAlpha = 1.0;
  }

  drawNextPiece(shape) {
    this.clear();
    const offsetR = (4 - shape.length) / 2;
    const offsetC = (4 - shape[0].length) / 2;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          this.drawCell(r + offsetR, c + offsetC, shape[r][c]);
        }
      }
    }
  }

  drawCell(row, col, colorValue) {
    if (row < 0) return; // don't draw above board
    const x = col * this.cellSize;
    const y = row * this.cellSize;
    const s = this.cellSize;
    const color = CONFIG.COLORS[colorValue] || '#888';

    // === Fill ===
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x + 1, y + 1, s - 2, s - 2);

    // === 3D bevel ===
    // Top/Left highlight
    this.ctx.fillStyle = 'rgba(255,255,255,0.35)';
    this.ctx.fillRect(x + 1, y + 1, s - 2, 2);
    this.ctx.fillRect(x + 1, y + 1, 2, s - 2);
    // Bottom/Right shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.45)';
    this.ctx.fillRect(x + 1, y + s - 3, s - 2, 2);
    this.ctx.fillRect(x + s - 3, y + 1, 2, s - 2);

    // === Icon for special blocks ===
    const letter = CONFIG.SPECIAL_LETTERS && CONFIG.SPECIAL_LETTERS[colorValue];
    if (letter && s >= 10) {
      const fontSize = Math.max(8, Math.floor(s * 0.45));
      this.ctx.font = `${fontSize}px sans-serif`;
      this.ctx.fillStyle = '#000';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      // Shadow for readability
      this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
      this.ctx.shadowBlur = 2;
      this.ctx.fillText(letter, x + s / 2, y + s / 2);
      this.ctx.shadowBlur = 0;
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'alphabetic';
    }
  }

  drawGridLines() {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= CONFIG.BOARD_WIDTH; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.cellSize, 0);
      this.ctx.lineTo(i * this.cellSize, CONFIG.BOARD_HEIGHT * this.cellSize);
      this.ctx.stroke();
    }
    for (let i = 0; i <= CONFIG.BOARD_HEIGHT; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.cellSize);
      this.ctx.lineTo(CONFIG.BOARD_WIDTH * this.cellSize, i * this.cellSize);
      this.ctx.stroke();
    }
  }
  drawDeadOverlay() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#ff3355';
    this.ctx.font = `bold ${this.cellSize}px Orbitron, monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('☠', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.font = `bold ${Math.max(8, this.cellSize * 0.5)}px Inter, sans-serif`;
    this.ctx.fillText(I18N.t('out'), this.canvas.width / 2, this.canvas.height / 2 + this.cellSize);
    this.ctx.textAlign = 'left';
  }
}
