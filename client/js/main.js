/**
 * main.js - TetriNET entry point
 * Wires together SocketClient, UI, GameManager, and Renderer
 */
document.addEventListener('DOMContentLoaded', () => {
  // Apply i18n translations to all data-i18n DOM elements
  I18N.applyTranslations();

  const socket = new SocketClient(CONFIG.SERVER_URL);
  const ui = new UI();

  // Canvas elements
  const mainCanvas = document.getElementById('canvas-main-board');
  const nextCanvas = document.getElementById('canvas-next-piece');
  const renderer = new Renderer(mainCanvas, CONFIG.CELL_SIZE);
  const nextRenderer = new Renderer(nextCanvas, CONFIG.CELL_SIZE);

  // State
  let gameManager = null;
  let myId = null;
  let myName = localStorage.getItem('tetrinet_player_name') || 'Guest';
  let roomState = null;

  // Restore saved player name into the input field
  const nameInput = document.getElementById('input-player-name');
  if (nameInput) {
    nameInput.value = myName;
    nameInput.addEventListener('change', () => {
      const val = nameInput.value.trim();
      if (val) {
        localStorage.setItem('tetrinet_player_name', val);
      }
    });
  }

  // Opponent renderers keyed by playerId
  const opponentRenderers = new Map();

  // ─────────────────────────────────────────────
  // LOBBY
  // ─────────────────────────────────────────────
  socket.requestRooms(rooms => ui.updateRoomsList(rooms, joinRoomById));

  document.getElementById('btn-join-room').addEventListener('click', () => {
    const inputVal = document.getElementById('input-player-name').value.trim();
    myName = inputVal || 'Guest';
    if (inputVal) {
      localStorage.setItem('tetrinet_player_name', inputVal);
    }
    const teamSelect = document.getElementById('select-team-lobby');
    const selectedTeam = teamSelect ? teamSelect.value : 'none';
    const roomId = document.getElementById('input-room-id').value.trim() ||
      Math.random().toString(36).substring(2, 8).toUpperCase();
    joinRoomById(roomId, selectedTeam);
  });

  function joinRoomById(roomId, team = 'none') {
    socket.joinRoom(roomId, myName, team, (ok, err) => {
      if (!ok) ui.showNotification(err || I18N.t('failedToJoinRoom'), 'error');
    });
  }

  const selectTeamWaiting = document.getElementById('select-team-waiting');
  if (selectTeamWaiting) {
    selectTeamWaiting.addEventListener('change', (e) => {
      socket.setTeam(e.target.value);
    });
  }

  socket.on('player_team_updated', (data) => {
    if (roomState) {
      const p = roomState.players.find(player => player.id === data.playerId);
      if (p) {
        p.team = data.team;
        ui.updatePlayersList(roomState.players, roomState.hostId, myId);
      }
    }
  });

  // ─────────────────────────────────────────────
  // WAITING ROOM
  // ─────────────────────────────────────────────
  socket.on('room_joined', (data) => {
    myId = data.playerId;
    roomState = data.room;
    document.getElementById('waiting-room-id').textContent = I18N.t('roomIdPrefix') + data.room.id;
    ui.updatePlayersList(data.room.players, data.room.hostId, myId);
    ui.showStartButton(data.room.hostId === myId);
    ui.showScreen('waiting');
  });

  socket.on('player_joined', (player) => {
    if (roomState) {
      // Avoid duplicates
      const exists = roomState.players.find(p => p.id === player.id);
      if (!exists) roomState.players.push(player);
      ui.updatePlayersList(roomState.players, roomState.hostId, myId);
    }
    ui.showNotification(I18N.t('playerJoinedRoom', { name: player.name }), 'info');
  });

  socket.on('player_left', (playerId) => {
    if (roomState) {
      roomState.players = roomState.players.filter(p => p.id !== playerId);
      ui.updatePlayersList(roomState.players, roomState.hostId, myId);
    }
    // Remove opponent board if in game
    if (opponentRenderers.has(playerId)) {
      ui.removeOpponentBoard(playerId);
      opponentRenderers.delete(playerId);
    }
  });

  document.getElementById('btn-start-game').addEventListener('click', () => {
    socket.startGame();
  });

  document.getElementById('btn-leave-room').addEventListener('click', () => {
    socket.leaveRoom();
    ui.showScreen('lobby');
    socket.requestRooms(rooms => ui.updateRoomsList(rooms, joinRoomById));
  });

  // ─────────────────────────────────────────────
  // GAME START
  // ─────────────────────────────────────────────
  socket.on('game_started', (data) => {
    // Setup opponent boards for all other players
    opponentRenderers.clear();
    document.getElementById('opponent-boards').innerHTML = '';

    const playersList = data.players || roomState?.players || [];

    // Build target order: slot 0 = me (Key 1), slots 1-5 = opponents in room order (Keys 2..6)
    const targetOrder = [myId];
    playersList.forEach(p => {
      if (p.id !== myId) {
        targetOrder.push(p.id);
        const shortcutKey = targetOrder.length; // 2 for first opponent, 3 for second, etc.
        const canvas = ui.createOpponentBoard(p.id, p.name, shortcutKey);
        opponentRenderers.set(p.id, new Renderer(canvas, CONFIG.OPPONENT_CELL_SIZE));
      }
    });

    ui.hideDeadOverlay();
    ui.updatePauseOverlay(false);
    ui.showScreen('game');

    gameManager = new GameManager(socket, renderer, nextRenderer, ui);
    gameManager.myId = myId;
    gameManager.targetOrder = targetOrder;
    gameManager.alivePlayers = new Set(targetOrder);
    ui.updateSpecialsQueue([], targetOrder, myId, (ti) => gameManager.useSpecialOnTarget(ti));
    gameManager.startGame(data.seed, data.startLevel);
  });

  // ─────────────────────────────────────────────
  // PAUSE HANDLER
  // ─────────────────────────────────────────────
  socket.on('game_paused', (data) => {
    if (gameManager) {
      gameManager.setPaused(data.paused);
    }
    ui.updatePauseOverlay(data.paused, data.playerName);

    const msgKey = data.paused ? 'pausedBy' : 'gameResumed';
    ui.showNotification(I18N.t(msgKey, { name: data.playerName }), data.paused ? 'warning' : 'success');
  });

  const btnPause = document.getElementById('btn-pause');
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      socket.togglePause();
    });
  }

  // ─────────────────────────────────────────────
  // OPPONENT BOARD UPDATES
  // ─────────────────────────────────────────────
  socket.on('board_update', (data) => {
    if (roomState) {
      const p = roomState.players.find(player => player.id === data.playerId);
      if (p) {
        p.score = data.score || 0;
        p.lines = data.lines || 0;
      }
    }

    // If the board update is for ourselves (e.g. after a switchField), update local game state
    if (data.playerId === myId) {
      if (gameManager && gameManager.isAlive) {
        gameManager.board = data.board;
      }
      return;
    }

    if (!opponentRenderers.has(data.playerId)) {
      // Late-join: create the board dynamically
      const canvas = ui.createOpponentBoard(data.playerId, data.playerId);
      opponentRenderers.set(data.playerId, new Renderer(canvas, CONFIG.OPPONENT_CELL_SIZE));
    }

    const oRenderer = opponentRenderers.get(data.playerId);
    oRenderer.clear();
    oRenderer.drawBoard(data.board);

    // Highlight opponent wrapper if their board contains Block Bombs (cell value 16)
    const wrapper = document.getElementById(`opponent-wrapper-${data.playerId}`);
    if (wrapper) {
      const hasBomb = data.board.some(row => row.some(cell => cell === 16));
      wrapper.classList.toggle('has-bomb', hasBomb);
    }
  });

  // ─────────────────────────────────────────────
  // SPECIALS & GARBAGE
  // ─────────────────────────────────────────────
  socket.on('receive_garbage', (lines) => {
    if (gameManager && gameManager.isAlive) {
      gameManager.addGarbage(lines);
      SoundManager.play('garbage');
      const msg = lines > 1
        ? I18N.t('garbageLines', { count: lines })
        : I18N.t('garbageLine', { count: lines });
      ui.showNotification(msg, 'warning');
    }
  });

  socket.on('receive_special', (data) => {
    const special = typeof data === 'object' && data.special ? data.special : data;
    const senderName = typeof data === 'object' && data.senderName ? data.senderName : I18N.t('defaultSender');
    if (gameManager && gameManager.isAlive) {
      const board = TetrisEngine.applySpecial(gameManager.board, special);
      gameManager.board = board;
      socket.sendBoardUpdate({ board: gameManager.board, score: gameManager.score, level: gameManager.level, lines: gameManager.lines });
      SoundManager.play('special');
      const specialDef = CONFIG.SPECIALS[special];
      const specialName = specialDef ? specialDef.name : special;
      ui.showNotification(I18N.t('receivedSpecial', { sender: senderName, special: specialName }), 'warning');
    }
  });

  // ─────────────────────────────────────────────
  // PLAYER LOST / GAME OVER
  // ─────────────────────────────────────────────
  socket.on('player_lost', (playerId) => {
    if (gameManager && gameManager.alivePlayers) {
      gameManager.alivePlayers.delete(playerId);
    }

    if (playerId === myId) return; // handled locally by gameManager.gameOver()

    const oRenderer = opponentRenderers.get(playerId);
    if (oRenderer) oRenderer.drawDeadOverlay();

    const playerName = roomState?.players.find(p => p.id === playerId)?.name || playerId;
    ui.showNotification(I18N.t('playerEliminated', { name: playerName }), 'info');
  });

  socket.on('game_over', (data) => {
    let finalScores = [];
    if (roomState) {
      finalScores = roomState.players.map(p => {
        let scoreVal = p.score || 0;
        let linesVal = p.lines || 0;
        if (p.id === myId && gameManager) {
          scoreVal = gameManager.score;
          linesVal = gameManager.lines;
        }
        return {
          name: p.name,
          score: scoreVal || linesVal, // fallback to lines if score is 0
          lines: linesVal
        };
      });
    } else if (gameManager) {
      finalScores = [{ name: myName, score: gameManager.score || gameManager.lines, lines: gameManager.lines }];
    }

    if (gameManager) {
      gameManager.stopLoop();
      gameManager = null;
    }

    finalScores.sort((a, b) => b.score - a.score);

    const winnerName = data.winner
      ? (roomState?.players.find(p => p.id === data.winner)?.name || data.winner)
      : null;

    const isHost = roomState ? roomState.hostId === myId : true;
    ui.showGameOver(winnerName, finalScores, data.winnerTeam);
    ui.showStartButton(isHost);

    const btnPlayAgain = document.getElementById('btn-play-again');
    if (btnPlayAgain) {
      btnPlayAgain.classList.toggle('hidden', !isHost);
    }
  });

  document.getElementById('btn-play-again').addEventListener('click', () => {
    socket.startGame();
  });

  document.getElementById('btn-back-lobby').addEventListener('click', () => {
    if (roomState) {
      ui.showScreen('waiting');
    } else {
      ui.showScreen('lobby');
    }
  });

  // ─────────────────────────────────────────────
  // CHAT
  // ─────────────────────────────────────────────
  socket.on('chat_message', (data) => {
    ui.addChatMessage('waiting-chat-messages', data.playerName, data.message, data.timestamp);
    ui.addChatMessage('game-chat-messages', data.playerName, data.message, data.timestamp);
  });

  document.getElementById('btn-waiting-chat').addEventListener('click', sendWaitingChat);
  document.getElementById('waiting-chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendWaitingChat();
  });

  function sendWaitingChat() {
    const input = document.getElementById('waiting-chat-input');
    const msg = input.value.trim();
    if (msg) { socket.sendChat(msg); input.value = ''; }
  }

  document.getElementById('game-chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const input = document.getElementById('game-chat-input');
      const msg = input.value.trim();
      if (msg) { socket.sendChat(msg); input.value = ''; }
    }
  });

  // ─────────────────────────────────────────────
  // GAME OVER SCREEN BUTTONS
  // ─────────────────────────────────────────────
  document.getElementById('btn-back-lobby').addEventListener('click', () => {
    ui.showScreen('lobby');
    socket.requestRooms(rooms => ui.updateRoomsList(rooms, joinRoomById));
  });

  // ─────────────────────────────────────────────
  // MUTE / SOUND TOGGLE & VOLUME SLIDERS
  // ─────────────────────────────────────────────
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  if (btnToggleSound) {
    btnToggleSound.addEventListener('click', () => {
      const isMuted = SoundManager.toggleMute();
      btnToggleSound.textContent = isMuted ? '🔇' : '🔊';
      btnToggleSound.title = isMuted ? I18N.t('soundToggleTitleMuted') : I18N.t('soundToggleTitleUnmuted');
    });
  }

  const sliderMusic = document.getElementById('slider-music-volume');
  if (sliderMusic) {
    sliderMusic.addEventListener('input', (e) => {
      SoundManager.setMusicVolume(e.target.value);
    });
  }

  const sliderSfx = document.getElementById('slider-sfx-volume');
  if (sliderSfx) {
    sliderSfx.addEventListener('input', (e) => {
      SoundManager.setSfxVolume(e.target.value);
    });
  }

  // ─────────────────────────────────────────────
  // HELP MODAL
  // ─────────────────────────────────────────────
  const btnHelp = document.getElementById('btn-help');
  const helpOverlay = document.getElementById('help-modal-overlay');
  const btnCloseHelp = document.getElementById('btn-close-help');

  // Map of special keys → i18n description keys
  const SPECIAL_DESC_KEYS = {
    addLine:       'helpDescAddLine',
    clearLine:     'helpDescClearLine',
    nuke:          'helpDescNuke',
    randomClear:   'helpDescRandomClear',
    switchField:   'helpDescSwitchField',
    clearSpecials: 'helpDescClearSpecials',
    blockBomb:     'helpDescBlockBomb',
    blockQuake:    'helpDescBlockQuake',
    blockGravity:  'helpDescBlockGravity',
  };

  // Map of special keys → their numeric color code (for letter lookup & color)
  const SPECIAL_TO_CODE = {};
  for (const [code, name] of Object.entries(CONFIG.LETTER_TO_SPECIAL)) {
    SPECIAL_TO_CODE[name] = Number(code);
  }

  function buildHelpGrid() {
    const grid = document.getElementById('help-specials-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const [specialKey, specialDef] of Object.entries(CONFIG.SPECIALS)) {
      const code = SPECIAL_TO_CODE[specialKey];
      const letter = CONFIG.SPECIAL_LETTERS[code] || '?';
      const color = CONFIG.COLORS[code] || '#888';
      const descKey = SPECIAL_DESC_KEYS[specialKey];
      const desc = descKey ? I18N.t(descKey) : '';
      const typeKey = `helpType${specialDef.type.charAt(0).toUpperCase() + specialDef.type.slice(1)}`;
      const typeLabel = I18N.t(typeKey);

      const card = document.createElement('div');
      card.className = 'help-card';

      card.innerHTML = `
        <div class="help-letter-block" style="background:${color}; color:#000;">${letter}</div>
        <div class="help-card-info">
          <div class="help-card-name">${specialDef.name}</div>
          <div class="help-card-desc">${desc}</div>
          <span class="help-card-type help-card-type--${specialDef.type}">${typeLabel}</span>
        </div>
      `;

      grid.appendChild(card);
    }
  }

  function openHelp() {
    buildHelpGrid();
    helpOverlay.classList.remove('hidden');
  }

  function closeHelp() {
    helpOverlay.classList.add('hidden');
  }

  if (btnHelp) {
    btnHelp.addEventListener('click', openHelp);
  }
  if (btnCloseHelp) {
    btnCloseHelp.addEventListener('click', closeHelp);
  }
  if (helpOverlay) {
    helpOverlay.addEventListener('click', (e) => {
      if (e.target === helpOverlay) closeHelp();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && helpOverlay && !helpOverlay.classList.contains('hidden')) {
      closeHelp();
    }
  });

  // ─────────────────────────────────────────────
  // KEYBOARD (game controls)
  // ─────────────────────────────────────────────
   document.addEventListener('keydown', (e) => {
    // Don't trigger game controls if typing in chat
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    if (gameManager) {
      if (e.key === 'p' || e.key === 'P') {
        socket.togglePause();
        e.preventDefault();
        return;
      }
      gameManager.handleKeyDown(e);
      // Prevent browser default actions (scrolling, Firefox quick-find on ', ", etc.)
      const preventKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ',
        '0', '1', '2', '3', '4', '5', '6', 'à', '&', 'é', '"', "'", '(', '-'];
      const preventCodes = ['Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6',
        'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6',
        'Space', 'KeyP'];
      if (preventKeys.includes(e.key) || preventCodes.includes(e.code)) {
        e.preventDefault();
      }
    }
  });

  // ─────────────────────────────────────────────
  // ERROR HANDLING
  // ─────────────────────────────────────────────
  socket.on('error', (msg) => {
    ui.showNotification(msg, 'error');
  });
});
