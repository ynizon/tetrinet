class TetrisEngine {
  static PIECES = {
    I: { shapes: [ [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]], [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]], [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]] ], color: 1 },
    O: { shapes: [ [[2,2],[2,2]], [[2,2],[2,2]], [[2,2],[2,2]], [[2,2],[2,2]] ], color: 2 },
    T: { shapes: [ [[0,3,0],[3,3,3],[0,0,0]], [[0,3,0],[0,3,3],[0,3,0]], [[0,0,0],[3,3,3],[0,3,0]], [[0,3,0],[3,3,0],[0,3,0]] ], color: 3 },
    S: { shapes: [ [[0,4,4],[4,4,0],[0,0,0]], [[0,4,0],[0,4,4],[0,0,4]], [[0,0,0],[0,4,4],[4,4,0]], [[4,0,0],[4,4,0],[0,4,0]] ], color: 4 },
    Z: { shapes: [ [[5,5,0],[0,5,5],[0,0,0]], [[0,0,5],[0,5,5],[0,5,0]], [[0,0,0],[5,5,0],[0,5,5]], [[0,5,0],[5,5,0],[5,0,0]] ], color: 5 },
    J: { shapes: [ [[6,0,0],[6,6,6],[0,0,0]], [[0,6,6],[0,6,0],[0,6,0]], [[0,0,0],[6,6,6],[0,0,6]], [[0,6,0],[0,6,0],[6,6,0]] ], color: 6 },
    L: { shapes: [ [[0,0,7],[7,7,7],[0,0,0]], [[0,7,0],[0,7,0],[0,7,7]], [[0,0,0],[7,7,7],[7,0,0]], [[7,7,0],[0,7,0],[0,7,0]] ], color: 7 },
  };

  static createRNG(seed) {
    return function() {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  static createEmptyBoard() {
    return Array.from({ length: CONFIG.BOARD_HEIGHT }, () => Array(CONFIG.BOARD_WIDTH).fill(0));
  }

  static canPlace(board, shape, row, col) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          let newRow = row + r;
          let newCol = col + c;
          if (newCol < 0 || newCol >= CONFIG.BOARD_WIDTH || newRow >= CONFIG.BOARD_HEIGHT) return false;
          if (newRow >= 0 && board[newRow][newCol] !== 0) return false;
        }
      }
    }
    return true;
  }

  static placePiece(board, shape, row, col) {
    let newBoard = board.map(r => [...r]);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0 && row + r >= 0) {
          newBoard[row + r][col + c] = shape[r][c];
        }
      }
    }
    return newBoard;
  }

  static clearLines(board) {
    let linesCleared = 0;
    let specialsFound = [];
    let newBoard = [];
    
    for (let r = 0; r < CONFIG.BOARD_HEIGHT; r++) {
      if (board[r].every(cell => cell !== 0)) {
        linesCleared++;
        board[r].forEach(cell => {
          if (cell >= 10) specialsFound.push(cell);
        });
      } else {
        newBoard.push([...board[r]]);
      }
    }
    
    while (newBoard.length < CONFIG.BOARD_HEIGHT) {
      newBoard.unshift(Array(CONFIG.BOARD_WIDTH).fill(0));
    }
    
    return { newBoard, linesCleared, specialsFound };
  }

  static getDropRow(board, shape, row, col) {
    let r = row;
    while (this.canPlace(board, shape, r + 1, col)) {
      r++;
    }
    return r;
  }

  static addGarbageLines(board, count) {
    let newBoard = board.map(r => [...r]);
    let hole = Math.floor(Math.random() * CONFIG.BOARD_WIDTH);
    for (let i = 0; i < count; i++) {
      newBoard.shift();
      let row = Array(CONFIG.BOARD_WIDTH).fill(8); // generic garbage color
      row[hole] = 0;
      newBoard.push(row);
    }
    return newBoard;
  }

  static applySpecial(board, specialType) {
    let newBoard = board.map(r => [...r]);
    switch(specialType) {
      case 'clearLine':
        newBoard.pop();
        newBoard.unshift(Array(CONFIG.BOARD_WIDTH).fill(0));
        break;
      case 'nuke':
        return this.createEmptyBoard();
      case 'addLine':
        return this.addGarbageLines(newBoard, 1);
      case 'randomClear':
        for (let r = 0; r < CONFIG.BOARD_HEIGHT; r++) {
          for (let c = 0; c < CONFIG.BOARD_WIDTH; c++) {
            if (newBoard[r][c] !== 0 && Math.random() < 0.25) {
              newBoard[r][c] = 0;
            }
          }
        }
        break;
      case 'clearSpecials':
        for (let r = 0; r < CONFIG.BOARD_HEIGHT; r++) {
          for (let c = 0; c < CONFIG.BOARD_WIDTH; c++) {
            if (newBoard[r][c] >= 10) {
              newBoard[r][c] = 1; // convert to normal cyan block
            }
          }
        }
        break;
      case 'blockBomb':
        // Explosive block bomb: explodes any 'O' or 'N' special blocks on field or clears 3x3 area
        let bombPositions = [];
        for (let r = 0; r < CONFIG.BOARD_HEIGHT; r++) {
          for (let c = 0; c < CONFIG.BOARD_WIDTH; c++) {
            if (newBoard[r][c] === 16 || newBoard[r][c] === 15) { // N or O block
              bombPositions.push({ r, c });
            }
          }
        }
        if (bombPositions.length === 0) {
          // If no bomb block on field, pick 2 random filled blocks to explode
          let filled = [];
          for (let r = 0; r < CONFIG.BOARD_HEIGHT; r++) {
            for (let c = 0; c < CONFIG.BOARD_WIDTH; c++) {
              if (newBoard[r][c] !== 0) filled.push({ r, c });
            }
          }
          if (filled.length > 0) bombPositions.push(filled[Math.floor(Math.random() * filled.length)]);
        }
        bombPositions.forEach(b => {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              let nr = b.r + dr, nc = b.c + dc;
              if (nr >= 0 && nr < CONFIG.BOARD_HEIGHT && nc >= 0 && nc < CONFIG.BOARD_WIDTH) {
                newBoard[nr][nc] = 0;
              }
            }
          }
        });
        break;
      case 'blockQuake':
        newBoard = newBoard.map(row => {
          const shift = Math.floor(Math.random() * 3) - 1;
          if (shift === 0) return [...row];
          const newRow = Array(CONFIG.BOARD_WIDTH).fill(0);
          for (let c = 0; c < CONFIG.BOARD_WIDTH; c++) {
            const nc = c + shift;
            if (nc >= 0 && nc < CONFIG.BOARD_WIDTH) {
              newRow[nc] = row[c];
            }
          }
          return newRow;
        });
        break;
      case 'blockGravity':
        for (let c = 0; c < CONFIG.BOARD_WIDTH; c++) {
          let writeR = CONFIG.BOARD_HEIGHT - 1;
          for (let r = CONFIG.BOARD_HEIGHT - 1; r >= 0; r--) {
            if (newBoard[r][c] !== 0) {
              const val = newBoard[r][c];
              newBoard[r][c] = 0;
              newBoard[writeR][c] = val;
              writeR--;
            }
          }
        }
        break;
    }
    return newBoard;
  }

  static spawnSpecialBlock(board) {
    let newBoard = board.map(r => [...r]);
    let filledCells = [];
    for (let r = 0; r < CONFIG.BOARD_HEIGHT; r++) {
      for (let c = 0; c < CONFIG.BOARD_WIDTH; c++) {
        if (newBoard[r][c] >= 1 && newBoard[r][c] <= 8) {
          filledCells.push({ r, c });
        }
      }
    }
    if (filledCells.length > 0) {
      const target = filledCells[Math.floor(Math.random() * filledCells.length)];
      const specialCodes = Object.keys(CONFIG.SPECIAL_LETTERS).map(Number);
      const randomCode = specialCodes[Math.floor(Math.random() * specialCodes.length)];
      newBoard[target.r][target.c] = randomCode;
    }
    return newBoard;
  }

  static calculateScore(linesCleared, level) {
    const scores = [0, 100, 300, 500, 800];
    return scores[linesCleared] * (level + 1);
  }
}
