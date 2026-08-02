import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { ClientToServerEvents, ServerToClientEvents } from './types';
import { GameRoom } from './GameRoom';
import { Player } from './Player';

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Serve static files from ../client
app.use(express.static(path.join(__dirname, '../../client')));
app.use(cors());

const PORT = process.env.PORT || 3000;
const rooms = new Map<string, GameRoom>();

io.on('connection', (socket) => {
    console.log(`[${new Date().toISOString()}] User connected: ${socket.id}`);

    let currentRoomId: string | null = null;

    socket.on('join_room', (data, callback) => {
        const { roomId, playerName, team } = data;
        
        let room = rooms.get(roomId);
        if (!room) {
            room = new GameRoom(roomId, `Room ${roomId}`, socket.id);
            rooms.set(roomId, room);
        }

        if (room.gameStarted) {
            return callback(false, 'Game already in progress');
        }

        const player = new Player(socket.id, playerName);
        if (team) player.team = team;
        if (!room.addPlayer(player)) {
            return callback(false, 'Room is full');
        }

        socket.join(roomId);
        currentRoomId = roomId;

        socket.to(roomId).emit('player_joined', player.getState());
        callback(true);
        socket.emit('room_joined', { room: room.getState(), playerId: socket.id });

        console.log(`[${new Date().toISOString()}] ${playerName} joined room ${roomId} (Team: ${player.team})`);
    });

    socket.on('set_team', (team) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room && !room.gameStarted) {
            room.setPlayerTeam(socket.id, team, io);
        }
    });

    socket.on('start_game', () => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room && room.hostId === socket.id) {
            room.startGame(io);
            console.log(`[${new Date().toISOString()}] Game started in room ${currentRoomId}`);
        }
    });

    socket.on('board_update', (data) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            room.handleBoardUpdate(socket.id, data, io);
        }
    });

    socket.on('lines_cleared', (data) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            room.handleLinesCleared(socket.id, data.count, data.board, io);
        }
    });

    socket.on('use_special', (data) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            room.handleSpecialUsed(socket.id, data.special, data.targetId, io);
        }
    });

    socket.on('player_lost', (data) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            room.handlePlayerLost(socket.id, io);
        }
    });

    socket.on('toggle_pause', () => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            room.togglePause(socket.id, io);
        }
    });

    socket.on('chat_message', (message) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            const player = room.players.get(socket.id);
            if (player) {
                io.to(currentRoomId).emit('chat_message', {
                    playerName: player.name,
                    message,
                    timestamp: Date.now()
                });
            }
        }
    });

    socket.on('request_rooms', (callback) => {
        const roomList = Array.from(rooms.values()).map(r => r.getSummary());
        callback(roomList);
    });

    socket.on('disconnect', () => {
        console.log(`[${new Date().toISOString()}] User disconnected: ${socket.id}`);
        if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
                room.removePlayer(socket.id);
                socket.to(currentRoomId).emit('player_left', socket.id);
                
                if (room.isEmpty()) {
                    rooms.delete(currentRoomId);
                    console.log(`[${new Date().toISOString()}] Room ${currentRoomId} deleted`);
                } else {
                    room.checkGameOver(io);
                }
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] TetriNET Server running on port ${PORT}`);
});
