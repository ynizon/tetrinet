"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const TetrisEngine_1 = require("./TetrisEngine");
class GameRoom {
    constructor(id, name, hostId) {
        this.maxPlayers = 6;
        this.id = id;
        this.name = name;
        this.players = new Map();
        this.hostId = hostId;
        this.gameStarted = false;
    }
    /**
     * Adds a player to the room.
     */
    addPlayer(player) {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }
        this.players.set(player.id, player);
        return true;
    }
    /**
     * Removes a player from the room.
     */
    removePlayer(playerId) {
        this.players.delete(playerId);
        if (this.hostId === playerId && this.players.size > 0) {
            this.hostId = Array.from(this.players.keys())[0];
        }
    }
    /**
     * Starts the game for all players in the room.
     */
    startGame(io) {
        if (this.players.size < 1)
            return;
        this.gameStarted = true;
        for (const player of this.players.values()) {
            player.reset();
        }
        const seed = Math.floor(Math.random() * 1000000);
        const roomState = this.getState();
        io.to(this.id).emit('game_started', { seed, startLevel: 0 });
    }
    /**
     * Handles a board update from a player.
     */
    handleBoardUpdate(playerId, data, io) {
        const player = this.players.get(playerId);
        if (player) {
            player.updateBoard(data.board, data.score, data.level, data.lines);
            io.to(this.id).emit('board_update', {
                playerId,
                board: data.board,
                score: data.score,
                level: data.level,
                lines: data.lines
            });
        }
    }
    /**
     * Handles lines cleared, calculating garbage for other players.
     */
    handleLinesCleared(playerId, count, board, io) {
        const player = this.players.get(playerId);
        if (!player)
            return;
        let garbageLines = 0;
        if (count === 2)
            garbageLines = 1;
        else if (count === 3)
            garbageLines = 2;
        else if (count >= 4)
            garbageLines = 4;
        if (garbageLines > 0) {
            for (const otherId of this.players.keys()) {
                if (otherId !== playerId && this.players.get(otherId)?.isAlive) {
                    io.to(otherId).emit('receive_garbage', garbageLines);
                }
            }
        }
    }
    /**
     * Handles when a special is used.
     */
    handleSpecialUsed(playerId, special, targetId, io) {
        const player = this.players.get(playerId);
        if (!player)
            return;
        if (special === 'switchField' && targetId) {
            const target = this.players.get(targetId);
            if (target && target.isAlive) {
                // Duplicate current player board and target board into temporary variables (deep copy)
                const tempPlayerBoard = JSON.parse(JSON.stringify(player.board));
                const tempTargetBoard = JSON.parse(JSON.stringify(target.board));
                // Exchange boards using the temporary copies
                player.board = tempTargetBoard;
                target.board = tempPlayerBoard;
                io.to(this.id).emit('board_update', {
                    playerId: player.id,
                    board: player.board,
                    score: player.score,
                    level: player.level,
                    lines: player.lines
                });
                io.to(this.id).emit('board_update', {
                    playerId: target.id,
                    board: target.board,
                    score: target.score,
                    level: target.level,
                    lines: target.lines
                });
            }
        }
        else if (targetId) {
            const target = this.players.get(targetId);
            if (target && target.isAlive) {
                target.receiveSpecial(special, TetrisEngine_1.TetrisEngine);
                io.to(targetId).emit('receive_special', special);
                // Also broadcast the target's new board to everyone in the room immediately
                io.to(this.id).emit('board_update', {
                    playerId: target.id,
                    board: target.board,
                    score: target.score,
                    level: target.level,
                    lines: target.lines
                });
            }
        }
    }
    /**
     * Handles player losing.
     */
    handlePlayerLost(playerId, io) {
        const player = this.players.get(playerId);
        if (player) {
            player.die();
            io.to(this.id).emit('player_lost', playerId);
            this.checkGameOver(io);
        }
    }
    /**
     * Checks if only one or no players are left alive.
     */
    checkGameOver(io) {
        if (!this.gameStarted)
            return;
        let aliveCount = 0;
        let lastAliveId = null;
        for (const [id, player] of this.players.entries()) {
            if (player.isAlive) {
                aliveCount++;
                lastAliveId = id;
            }
        }
        if (aliveCount <= 1 && this.players.size > 1) {
            this.gameStarted = false;
            io.to(this.id).emit('game_over', { winner: lastAliveId });
            // Reset all players for a fresh game, including clearing stored specials
            for (const p of this.players.values()) {
                p.reset();
            }
        }
        else if (aliveCount === 0 && this.players.size === 1) {
            this.gameStarted = false;
            io.to(this.id).emit('game_over', { winner: null });
            // Reset the sole player as well
            for (const p of this.players.values()) {
                p.reset();
            }
        }
    }
    /**
     * Gets the full state of the room.
     */
    getState() {
        return {
            id: this.id,
            name: this.name,
            players: Array.from(this.players.values()).map(p => p.getState()),
            gameStarted: this.gameStarted,
            hostId: this.hostId
        };
    }
    /**
     * Gets a summary of the room for listing.
     */
    getSummary() {
        return {
            id: this.id,
            name: this.name,
            playerCount: this.players.size,
            maxPlayers: this.maxPlayers,
            gameStarted: this.gameStarted
        };
    }
    /**
     * Checks if the room is empty.
     */
    isEmpty() {
        return this.players.size === 0;
    }
}
exports.GameRoom = GameRoom;
