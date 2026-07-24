/**
 * main.js - TetriNET entry point
 * Wires together SocketClient, UI, GameManager, and Renderer
 */
document.addEventListener('DOMContentLoaded', () => {
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
    const roomId = document.getElementById('input-room-id').value.trim() ||
      Math.random().toString(36).substring(2, 8).toUpperCase();
    joinRoomById(roomId);
  });

  function joinRoomById(roomId) {
    socket.joinRoom(roomId, myName, (ok, err) => {
      if (!ok) ui.showNotification(err || 'Failed to join room', 'error');
    });
  }

  // ─────────────────────────────────────────────
  // WAITING ROOM
  // ─────────────────────────────────────────────
  socket.on('room_joined', (data) => {
    myId = data.playerId;
    roomState = data.room;
    document.getElementById('waiting-room-id').textContent = 'Room ID: ' + data.room.id;
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
    ui.showNotification(`${player.name} joined the room`, 'info');
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
    ui.showScreen('game');

    gameManager = new GameManager(socket, renderer, nextRenderer, ui);
    gameManager.myId = myId;
    gameManager.targetOrder = targetOrder;
    gameManager.alivePlayers = new Set(targetOrder);
    gameManager.startGame(data.seed, data.startLevel);
  });

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
  });

  // ─────────────────────────────────────────────
  // SPECIALS & GARBAGE
  // ─────────────────────────────────────────────
  socket.on('receive_garbage', (lines) => {
    if (gameManager && gameManager.isAlive) {
      gameManager.addGarbage(lines);
      SoundManager.play('garbage');
      ui.showNotification(`+${lines} garbage line${lines > 1 ? 's' : ''}!`, 'warning');
    }
  });

  socket.on('receive_special', (special) => {
    if (gameManager && gameManager.isAlive) {
      const board = TetrisEngine.applySpecial(gameManager.board, special);
      gameManager.board = board;
      socket.sendBoardUpdate({ board: gameManager.board, score: gameManager.score, level: gameManager.level, lines: gameManager.lines });
      SoundManager.play('special');
      const specialDef = CONFIG.SPECIALS[special];
      const specialName = specialDef ? specialDef.name : special;
      ui.showNotification(`Pouvoir reçu : ${specialName} !`, 'warning');
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
    ui.showNotification(`${playerName} was eliminated!`, 'info');
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

    ui.showGameOver(winnerName, finalScores);
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
  // MUTE / SOUND TOGGLE BUTTON
  // ─────────────────────────────────────────────
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  if (btnToggleSound) {
    btnToggleSound.addEventListener('click', () => {
      const isMuted = SoundManager.toggleMute();
      btnToggleSound.textContent = isMuted ? '🔇' : '🔊';
      btnToggleSound.title = isMuted ? 'Activer le son' : 'Désactiver le son';
    });
  }

  // ─────────────────────────────────────────────
  // KEYBOARD (game controls)
  // ─────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    // Don't trigger game controls if typing in chat
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    if (gameManager) {
      gameManager.handleKeyDown(e);
      // Prevent arrow keys and space from scrolling the page
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', '1', '2', '3', '4', '5', '6'].includes(e.key)) {
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
