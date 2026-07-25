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
          // Allow up to 3 invisible rows above top boundary (row >= -3)
          if (newCol < 0 || newCol >= CONFIG.BOARD_WIDTH || newRow >= CONFIG.BOARD_HEIGHT || newRow < -3) return false;
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
      case 'blockBomb': {
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
      }
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
      case 'blockGravity': {
        // Pull all non-zero blocks down column by column
        for (let c = 0; c < CONFIG.BOARD_WIDTH; c++) {
          const colCells = [];
          for (let r = 0; r < CONFIG.BOARD_HEIGHT; r++) {
            if (newBoard[r][c] !== 0) {
              colCells.push(newBoard[r][c]);
            }
          }
          let writeR = CONFIG.BOARD_HEIGHT - 1;
          for (let i = colCells.length - 1; i >= 0; i--) {
            newBoard[writeR][c] = colCells[i];
            writeR--;
          }
          while (writeR >= 0) {
            newBoard[writeR][c] = 0;
            writeR--;
          }
        }

        // Automatically clear any full lines resulting from gravity
        const clearedRows = [];
        for (let r = 0; r < CONFIG.BOARD_HEIGHT; r++) {
          if (newBoard[r].every(cell => cell !== 0)) {
            clearedRows.push(r);
          }
        }
        if (clearedRows.length > 0) {
          const filteredBoard = newBoard.filter((_, idx) => !clearedRows.includes(idx));
          while (filteredBoard.length < CONFIG.BOARD_HEIGHT) {
            filteredBoard.unshift(Array(CONFIG.BOARD_WIDTH).fill(0));
          }
          newBoard = filteredBoard;
        }
        break;
      }
    }
    return newBoard;
  }

    static spawnSpecialBlock(board) {
        let newBoard = board.map(r => [...r]);
        
        // Find highest row containing filled blocks (colors 1-8)
        let highestRow = -1;
        for (let r = 0; r < CONFIG.BOARD_HEIGHT; r++) {
            if (board[r].some(cell => cell >= 1 && cell <= 8)) {
                highestRow = r;
                break;
            }
        }

        if (highestRow !== -1) {
            // Pick from the top 5 filled rows starting from highestRow
            const maxRow = Math.min(CONFIG.BOARD_HEIGHT - 1, highestRow + 4);
            const candidates = [];
            for (let r = highestRow; r <= maxRow; r++) {
                for (let c = 0; c < CONFIG.BOARD_WIDTH; c++) {
                    if (newBoard[r][c] >= 1 && newBoard[r][c] <= 8) {
                        candidates.push({ r, c });
                    }
                }
            }

            if (candidates.length > 0) {
                const target = candidates[Math.floor(Math.random() * candidates.length)];
                
                // Distribution weight table matching requested frequencies:
                // 10: Add Line (16%)
                // 11: Clear Line (16%)
                // 15: Clear Special Blocks (14%)
                // 13: Random Blocks Clear (14%)
                // 17: Blockquake (14%)
                // 18: Block Gravity (10%)
                // 16: Block Bomb (10%)
                // 14: Switch Fields (3%)
                // 12: Nuke Field (3%)
                const weightedSpecials = [
                    { code: 10, weight: 16 },
                    { code: 11, weight: 16 },
                    { code: 15, weight: 14 },
                    { code: 13, weight: 14 },
                    { code: 17, weight: 14 },
                    { code: 18, weight: 10 },
                    { code: 16, weight: 10 },
                    { code: 14, weight: 3 },
                    { code: 12, weight: 3 }
                ];
                
                const totalWeight = weightedSpecials.reduce((sum, item) => sum + item.weight, 0); // 100
                let rand = Math.random() * totalWeight;
                let selectedCode = weightedSpecials[0].code;
                
                for (const item of weightedSpecials) {
                    if (rand < item.weight) {
                        selectedCode = item.code;
                        break;
                    }
                    rand -= item.weight;
                }
                
                newBoard[target.r][target.c] = selectedCode;
            }
        }

        return newBoard;
    }

    static calculateScore(linesCleared, level) {
        const base = [0, 40, 100, 300, 1200];
        if (linesCleared < 0 || linesCleared > 4) return 0;
        return base[linesCleared] * (level + 1);
    }
}
