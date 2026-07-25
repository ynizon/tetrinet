class GameManager {
  constructor(socketClient, renderer, nextPieceRenderer, ui) {
    this.socket = socketClient;
    this.renderer = renderer;
    this.nextPieceRenderer = nextPieceRenderer;
    this.ui = ui;
    
    this.reset();
  }

  reset() {
    this.board = TetrisEngine.createEmptyBoard();
    this.currentPiece = null;
    this.nextPiece = null;
    this.score = 0;
    this.level = 0;
    this.lines = 0;
    this.isAlive = true;
    this.gameStarted = false;
    this.specials = [];          // queue of SpecialType strings
    this.linesSinceSpecial = 0; // lines accumulated toward next special
    this.dropTimer = null;
    this.lastTime = 0;
    this.dropAccumulator = 0;
    // introduce lock delay handling
    this.lockDelay = 200; // milliseconds
    this.lockTimer = null;
    // TetriNET targeting: ordered list of [myId, opp1, opp2, ...]
    this.myId = null;
    // Track alive players (including self)
    // this.alivePlayers = new Set();
    // this.alivePlayers.add(this.myId);
  }

  startGame(seed, startLevel) {
    this.reset();
    this.rng = TetrisEngine.createRNG(seed);
    this.level = startLevel;
    this.gameStarted = true;
    
    SoundManager.startMusic();

    this.nextPiece = this.generatePiece();
    this.spawnPiece();
    
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  generatePiece() {
    const types = Object.keys(TetrisEngine.PIECES);
    const type = types[Math.floor(this.rng() * types.length)];
    const def = TetrisEngine.PIECES[type];
    return {
      type: type,
      rotIndex: 0,
      shape: def.shapes[0],
      row: 0,
      col: Math.floor((CONFIG.BOARD_WIDTH - def.shapes[0][0].length) / 2)
    };
  }

  spawnPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.generatePiece();
    this.ui.updateDisplays(this.score, this.level, this.lines);
    
    if (!TetrisEngine.canPlace(this.board, this.currentPiece.shape, this.currentPiece.row, this.currentPiece.col)) {
      this.gameOver();
    }
  }

  movePiece(dc) {
    if (!this.isAlive) return;
    if (TetrisEngine.canPlace(this.board, this.currentPiece.shape, this.currentPiece.row, this.currentPiece.col + dc)) {
      this.currentPiece.col += dc;
      this.clearLockTimer();
      SoundManager.play('move');
    }
  }

  dropPiece() {
    if (!this.isAlive) return;
    if (TetrisEngine.canPlace(this.board, this.currentPiece.shape, this.currentPiece.row + 1, this.currentPiece.col)) {
      this.currentPiece.row++;
      this.clearLockTimer(); // resetting lock timer on descent
    } else {
      // start lock delay if not already started
      if (!this.lockTimer) {
        this.lockTimer = setTimeout(() => {
          this.lockPiece();
          this.lockTimer = null;
        }, this.lockDelay);
      }
    }
  }

  hardDrop() {
    if (!this.isAlive) return;
    this.currentPiece.row = TetrisEngine.getDropRow(this.board, this.currentPiece.shape, this.currentPiece.row, this.currentPiece.col);
    this.lockPiece();
  }

  rotatePiece() {
    if (!this.isAlive) return;
    const def = TetrisEngine.PIECES[this.currentPiece.type];
    const newRot = (this.currentPiece.rotIndex + 1) % def.shapes.length;
    const newShape = def.shapes[newRot];
    if (TetrisEngine.canPlace(this.board, newShape, this.currentPiece.row, this.currentPiece.col)) {
      this.currentPiece.rotIndex = newRot;
      this.currentPiece.shape = newShape;
      this.clearLockTimer();
      SoundManager.play('rotate');
    }
  }

  lockPiece() {
    this.board = TetrisEngine.placePiece(this.board, this.currentPiece.shape, this.currentPiece.row, this.currentPiece.col, TetrisEngine.PIECES[this.currentPiece.type].color);
    SoundManager.play('drop');
    
    const result = TetrisEngine.clearLines(this.board);
    this.board = result.newBoard;

    if (result.linesCleared > 0) {
      SoundManager.play('clear');
      this.lines += result.linesCleared;
      this.score += TetrisEngine.calculateScore(result.linesCleared, this.level);
      this.level = Math.floor(this.lines / 10);

      // Collect special blocks ONLY from cleared lines that contain special blocks
      if (result.specialsFound && result.specialsFound.length > 0) {
        result.specialsFound.forEach(cellVal => {
          const sName = CONFIG.LETTER_TO_SPECIAL[cellVal];
          if (sName && this.specials.length < CONFIG.MAX_SPECIALS) {
            this.specials.push(sName);
          }
        });
      }

      // Every 3 lines cleared, convert a normal block on the board into a special block
      this.linesSinceSpecial += result.linesCleared;
      while (this.linesSinceSpecial >= CONFIG.LINES_PER_SPECIAL) {
        this.linesSinceSpecial -= CONFIG.LINES_PER_SPECIAL;
        this.board = TetrisEngine.spawnSpecialBlock(this.board);
      }

      this.ui.updateSpecialsQueue(this.specials, this.targetOrder, this.myId,
        (targetIndex) => this.useSpecialOnTarget(targetIndex));

      this.socket.sendLinesCleared({ count: result.linesCleared, board: this.board, score: this.score });
    }

    this.socket.sendBoardUpdate({ board: this.board, score: this.score, level: this.level, lines: this.lines });
    this.ui.updateDisplays(this.score, this.level, this.lines);
    if (this.isAlive) this.spawnPiece();
    this.clearLockTimer();
  }

  // Clears any pending lock delay timer
  clearLockTimer() {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
  }

  loop(time) {
    if (!this.isAlive) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.dropAccumulator += deltaTime;
    
    const dropInterval = CONFIG.GRAVITY[Math.min(this.level, 9)];
    if (this.dropAccumulator > dropInterval) {
      this.dropPiece();
      this.dropAccumulator = 0;
    }
    
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    this.renderer.clear();
    this.renderer.drawGridLines();
    this.renderer.drawBoard(this.board);
    
    if (this.currentPiece) {
      const ghostRow = TetrisEngine.getDropRow(this.board, this.currentPiece.shape, this.currentPiece.row, this.currentPiece.col);
      this.renderer.drawGhostPiece(this.currentPiece.shape, ghostRow, this.currentPiece.col);
      this.renderer.drawPiece(this.currentPiece.shape, this.currentPiece.row, this.currentPiece.col);
    }
    
    if (this.nextPiece) {
      this.nextPieceRenderer.drawNextPiece(this.nextPiece.shape);
    }
  }

  /**
   * TetriNET targeting: press 1-6 to use first special on target.
   * targetIndex 0 = yourself, 1-5 = opponents (in slot order)
   */
  useSpecialOnTarget(targetIndex) {
    if (!this.gameStarted || this.specials.length === 0) return;

    // targetIndex is 0 for self (key 1), or 1..5 for opponents (keys 2..6)
    // If targetOrder has only 1 player (solo), targetIndex 0 is myId.
    let targetId = this.targetOrder[targetIndex];
    
    // Fallback: if single player or targetOrder is incomplete, index 0 is always oneself
    if (targetIndex === 0) {
      targetId = this.myId;
    }

    if (!targetId && targetIndex > 0) {
      // If there are opponents but less than targetIndex (e.g. 2 players total, opponent is at index 1 = key 2)
      // Show informative error
      this.ui.showNotification(`No player assigned to key [${targetIndex + 1}]!`, 'warning');
      return;
    }

    // Guard: ensure target is alive before consuming special
    if (targetIndex > 0 && (!this.alivePlayers || !this.alivePlayers.has(targetId))) {
      this.ui.showNotification(`Target player is dead or unavailable!`, 'warning');
      return;
    }

    const special = this.specials[0]; // peek first special
    const specialDef = CONFIG.SPECIALS[special];
    const specialName = specialDef ? specialDef.name : special;
    const specialType = specialDef ? specialDef.type : 'neutral';

    this.specials.shift(); // consume first special
    SoundManager.play('special');

    if (targetIndex === 0 || targetId === this.myId) {
      // Self-target (positive/neutral only)
      this.board = TetrisEngine.applySpecial(this.board, special);
      this.socket.sendBoardUpdate({ board: this.board, score: this.score, level: this.level, lines: this.lines });
      this.ui.showNotification(`Utilisé sur soi : ${specialName}`, 'info');
    } else {
      // Opponent target
      this.socket.useSpecial({ special, targetId });
      const notifType = specialType === 'negative' ? 'warning' : 'success';
      this.ui.showNotification(`Envoyé ${specialName} à la cible !`, notifType);
    }

    // Refresh the specials display
    this.ui.updateSpecialsQueue(this.specials, this.targetOrder, this.myId,
      (ti) => this.useSpecialOnTarget(ti));
  }

  handleKeyDown(e) {
    if (!this.gameStarted || !this.isAlive) return;

    const key = e.key;
    const code = e.code || '';

    if (key === 'ArrowLeft')  this.movePiece(-1);
    else if (key === 'ArrowRight') this.movePiece(1);
    else if (key === 'ArrowDown')  this.dropPiece();
    else if (key === 'ArrowUp')    this.rotatePiece();
    else if (key === ' ')          this.hardDrop();
    // Support standard 1-6 keys, Digit1-6, Numpad1-6, and AZERTY (&, é, ", ', (, -)
    else if (key === '1' || key === '&' || code === 'Digit1' || code === 'Numpad1') this.useSpecialOnTarget(0);
    else if (key === '2' || key === 'é' || code === 'Digit2' || code === 'Numpad2') this.useSpecialOnTarget(1);
    else if (key === '3' || key === '"' || code === 'Digit3' || code === 'Numpad3') this.useSpecialOnTarget(2);
    else if (key === '4' || key === "'" || code === 'Digit4' || code === 'Numpad4') this.useSpecialOnTarget(3);
    else if (key === '5' || key === '(' || code === 'Digit5' || code === 'Numpad5') this.useSpecialOnTarget(4);
    else if (key === '6' || key === '-' || code === 'Digit6' || code === 'Numpad6') this.useSpecialOnTarget(5);
  }

  addGarbage(lines) {
    this.board = TetrisEngine.addGarbageLines(this.board, lines);
  }

  stopLoop() {
    this.isAlive = false;
    this.gameStarted = false;
    SoundManager.stopMusic();
  }

  gameOver() {
    this.isAlive = false;
    SoundManager.stopMusic();
    SoundManager.play('gameover');
    this.socket.sendPlayerLost(this.board);
    this.ui.showDeadOverlay();
  }
}
