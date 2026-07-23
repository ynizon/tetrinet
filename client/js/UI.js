/**
 * UI.js - Manages all screen transitions and DOM updates for TetriNET
 */
class UI {
  constructor() {
    this.screens = {
      lobby: document.getElementById('screen-lobby'),
      waiting: document.getElementById('screen-waiting'),
      game: document.getElementById('screen-game'),
      gameover: document.getElementById('screen-gameover'),
    };
  }

  /** Show a specific screen, hide all others */
  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    if (this.screens[name]) this.screens[name].classList.add('active');
  }

  // ─────────────────────────────────────────────
  // LOBBY
  // ─────────────────────────────────────────────

  /**
   * Render the list of available rooms.
   * @param {Array} rooms - Array of RoomSummary objects
   * @param {Function} onJoin - Callback when a room is clicked
   */
  updateRoomsList(rooms, onJoin) {
    const list = document.getElementById('room-list');
    list.innerHTML = '';
    if (rooms.length === 0) {
      list.innerHTML = '<li class="no-rooms">No rooms yet. Create one!</li>';
      return;
    }
    rooms.forEach(room => {
      const li = document.createElement('li');
      li.className = 'room-item' + (room.gameStarted ? ' room-started' : '');
      li.innerHTML = `
        <span class="room-name">${room.id}</span>
        <span class="room-players">${room.playerCount}/${room.maxPlayers}</span>
        <span class="room-status">${room.gameStarted ? '🔴 In Progress' : '🟢 Open'}</span>
      `;
      if (!room.gameStarted && onJoin) {
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
          document.getElementById('input-room-id').value = room.id;
          onJoin(room.id);
        });
      }
      list.appendChild(li);
    });
  }

  // ─────────────────────────────────────────────
  // WAITING ROOM
  // ─────────────────────────────────────────────

  /** Render the player list in the waiting room */
  updatePlayersList(players, hostId, myId) {
    const list = document.getElementById('waiting-player-list');
    list.innerHTML = '';
    players.forEach(p => {
      const li = document.createElement('li');
      const badges = [];
      if (p.id === hostId) badges.push('<span class="badge host-badge">HOST</span>');
      if (p.id === myId) badges.push('<span class="badge you-badge">YOU</span>');
      li.innerHTML = `<span class="player-dot"></span><span class="player-name">${p.name}</span>${badges.join('')}`;
      list.appendChild(li);
    });
  }

  /** Show or hide the Start Game button based on host status */
  showStartButton(isHost) {
    const btn = document.getElementById('btn-start-game');
    btn.classList.toggle('hidden', !isHost);
  }

  /**
   * Append a chat message to a container.
   * @param {string} containerId
   * @param {string} name
   * @param {string} msg
   * @param {number} timestamp
   */
  addChatMessage(containerId, name, msg, timestamp) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const p = document.createElement('p');
    const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    p.innerHTML = `<span class="chat-time">[${time}]</span> <span class="chat-name">${this._escape(name)}:</span> <span class="chat-msg">${this._escape(msg)}</span>`;
    container.appendChild(p);
    container.scrollTop = container.scrollHeight;
  }

  // ─────────────────────────────────────────────
  // GAME
  // ─────────────────────────────────────────────

  /** Update the score/level/lines display */
  updateDisplays(score, level, lines) {
    const el = (id) => document.getElementById(id);
    if (el('game-score')) el('game-score').textContent = score.toLocaleString();
    if (el('game-level')) el('game-level').textContent = level;
    if (el('game-lines')) el('game-lines').textContent = lines;
  }

  /**
   * Create a canvas element for an opponent and append it to the opponent boards container.
   * @param {string} playerId
   * @param {string} playerName
   * @param shortcutKey
   * @returns {HTMLCanvasElement}
   */
  createOpponentBoard(playerId, playerName, shortcutKey = null) {
    const container = document.getElementById('opponent-boards');
    const wrapper = document.createElement('div');
    wrapper.className = 'opponent-board-wrapper';
    wrapper.id = `opponent-wrapper-${playerId}`;

    const nameEl = document.createElement('div');
    nameEl.className = 'opponent-name';
    if (shortcutKey) {
      nameEl.innerHTML = `<span class="key-shortcut">[${shortcutKey}]</span> ${this._escape(playerName)}`;
    } else {
      nameEl.textContent = playerName;
    }

    const canvas = document.createElement('canvas');
    canvas.id = `canvas-opponent-${playerId}`;
    canvas.width = CONFIG.BOARD_WIDTH * CONFIG.OPPONENT_CELL_SIZE;
    canvas.height = CONFIG.BOARD_HEIGHT * CONFIG.OPPONENT_CELL_SIZE;

    wrapper.appendChild(nameEl);
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);
    return canvas;
  }

  /** Remove an opponent board from the DOM */
  removeOpponentBoard(playerId) {
    const wrapper = document.getElementById(`opponent-wrapper-${playerId}`);
    if (wrapper) wrapper.remove();
  }

  /**
   * Render the specials queue.
   * In TetriNET style: the FIRST special is what you'll use.
   * Press 1 = self, 2-6 = opponents (in their slot order).
   * @param {string[]} specials - queue of special names
   * @param {string[]} targetOrder - [myId, opp1Id, opp2Id, ...]
   * @param {string} myId
   * @param {Function} onTarget - callback(targetIndex 0-5)
   */
  updateSpecialsQueue(specials, targetOrder, myId, onTarget) {
    const container = document.getElementById('specials-queue');
    container.innerHTML = '';

    if (specials.length === 0) {
      container.innerHTML = '<span style="color:#444;font-size:0.7rem;">No specials</span>';
      return;
    }

    // Show all specials in queue (first = active)
    specials.forEach((special, i) => {
      const btn = document.createElement('div');
      const specialDef = CONFIG.SPECIALS[special];
      const specialType = specialDef ? specialDef.type : 'neutral';
      const specialName = specialDef ? specialDef.name : special;
      btn.className = 'special-slot special--' + specialType + (i === 0 ? ' special-active' : '');
      btn.title = specialName;
      btn.innerHTML = `<span class="special-letter">${this._specialLetter(special)}</span>`;
      container.appendChild(btn);
    });

    // Target hint line
    if (specials.length > 0) {
      const firstDef = CONFIG.SPECIALS[specials[0]];
      const firstName = firstDef ? firstDef.name : specials[0];
      const firstType = firstDef ? firstDef.type : 'neutral';
      const hint = document.createElement('div');
      hint.className = 'target-hint target-hint--' + firstType;
      hint.textContent = `▶ ${firstName}`;
      container.appendChild(hint);
    }
  }

  /** Get the letter code for a special name */
  _specialLetter(specialName) {
    const map = {
      addLine: 'A', clearLine: 'C', nuke: 'N', randomClear: 'R',
      switchField: 'S', clearSpecials: 'B', blockBomb: 'O',
      blockQuake: 'Q', blockGravity: 'G',
    };
    return map[specialName] || '?';
  }

  showDeadOverlay() {
    const el = document.getElementById('main-dead-overlay');
    if (el) el.classList.remove('hidden');
  }

  hideDeadOverlay() {
    const el = document.getElementById('main-dead-overlay');
    if (el) el.classList.add('hidden');
  }

  // ─────────────────────────────────────────────
  // GAME OVER
  // ─────────────────────────────────────────────

  /**
   * Display the game over screen.
   * @param {string|null} winnerName
   * @param {Array} scores - [{name, score}]
   */
  showGameOver(winnerName, scores) {
    this.showScreen('gameover');
    const winEl = document.getElementById('gameover-winner');
    if (winnerName) {
      winEl.innerHTML = `🏆 <span class="winner-name">${this._escape(winnerName)}</span> WINS!`;
    } else {
      winEl.textContent = 'Draw - No Winner';
    }

    const scoreList = document.getElementById('gameover-scores');
    scoreList.innerHTML = '';
    scores.forEach((s, i) => {
      const li = document.createElement('li');
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const linesText = s.lines !== undefined ? ` (${s.lines} line${s.lines > 1 ? 's' : ''})` : '';
      li.innerHTML = `<span class="medal">${medal}</span> <span>${this._escape(s.name)}</span> <span class="final-score">${(s.score || 0).toLocaleString()} pts${linesText}</span>`;
      scoreList.appendChild(li);
    });
  }

  // ─────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────

  /**
   * Show a temporary notification popup.
   * @param {string} message
   * @param {'info'|'warning'|'error'|'success'} type
   */
  showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const div = document.createElement('div');
    div.className = `notification notification-${type}`;
    div.textContent = message;
    container.appendChild(div);
    // Trigger animation
    requestAnimationFrame(() => div.classList.add('show'));
    setTimeout(() => {
      div.classList.remove('show');
      setTimeout(() => div.remove(), 1400);
    }, 2600);
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  _escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  _specialIcon(special) {
    const icons = {
      addLine: '➕', clearLine: '🧹', nuke: '💥',
      randomClear: '🎲', switchField: '🔄', clearSpecials: '🛡️',
      blockBomb: '💣', blockQuake: '🌊', blockGravity: '⬇️',
    };
    return icons[special] || '⚡';
  }
}
