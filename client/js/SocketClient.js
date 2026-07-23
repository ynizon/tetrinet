class SocketClient {
  constructor(serverUrl) {
    this.socket = io(serverUrl);
    this.handlers = {};
    
    // Listen to all required events
    [
      'room_joined', 'rooms_list', 'player_joined', 'player_left',
      'game_started', 'board_update', 'receive_garbage', 'receive_special',
      'player_lost', 'game_over', 'chat_message', 'error'
    ].forEach(event => {
      this.socket.on(event, (data) => {
        if (this.handlers[event]) this.handlers[event](data);
      });
    });
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  joinRoom(roomId, playerName, callback) {
    this.socket.emit('join_room', { roomId, playerName }, callback);
  }

  startGame() {
    this.socket.emit('start_game');
  }

  sendBoardUpdate(data) {
    this.socket.emit('board_update', data);
  }

  sendLinesCleared(data) {
    this.socket.emit('lines_cleared', data);
  }

  useSpecial(data, targetId) {
    if (typeof data === 'object' && data !== null) {
      this.socket.emit('use_special', data);
    } else {
      this.socket.emit('use_special', { special: data, targetId });
    }
  }

  sendPlayerLost(board) {
    this.socket.emit('player_lost', { board });
  }

  sendChat(message) {
    this.socket.emit('chat_message', message);
  }

  requestRooms(callback) {
    this.socket.emit('request_rooms', callback);
  }
}
