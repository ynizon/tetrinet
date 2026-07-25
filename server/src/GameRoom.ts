import { Server } from 'socket.io';
import { Player } from './Player';
import { Board, RoomState, RoomSummary, SpecialType, TeamColor, ServerToClientEvents, ClientToServerEvents } from './types';
import { TetrisEngine } from './TetrisEngine';

export class GameRoom {
    id: string;
    name: string;
    players: Map<string, Player>;
    hostId: string;
    gameStarted: boolean;
    maxPlayers: number = 6;

    constructor(id: string, name: string, hostId: string) {
        this.id = id;
        this.name = name;
        this.players = new Map();
        this.hostId = hostId;
        this.gameStarted = false;
    }

    /**
     * Adds a player to the room.
     */
    addPlayer(player: Player): boolean {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }
        this.players.set(player.id, player);
        return true;
    }

    /**
     * Removes a player from the room.
     */
    removePlayer(playerId: string): void {
        this.players.delete(playerId);
        if (this.hostId === playerId && this.players.size > 0) {
            this.hostId = Array.from(this.players.keys())[0];
        }
    }

    /**
     * Starts the game for all players in the room.
     */
    startGame(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
        if (this.players.size < 1) return;
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
    handleBoardUpdate(playerId: string, data: { board: Board, score: number, level: number, lines: number }, io: Server<ClientToServerEvents, ServerToClientEvents>): void {
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
    handleLinesCleared(playerId: string, count: number, board: Board, io: Server<ClientToServerEvents, ServerToClientEvents>): void {
        const player = this.players.get(playerId);
        if (!player) return;

        let garbageLines = 0;
        if (count === 2) garbageLines = 1;
        else if (count === 3) garbageLines = 2;
        else if (count >= 4) garbageLines = 4;

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
    handleSpecialUsed(playerId: string, special: SpecialType, targetId: string | null, io: Server<ClientToServerEvents, ServerToClientEvents>): void {
        const player = this.players.get(playerId);
        if (!player) return;

        if (special === 'switchField' && targetId) {
            // Cannot target oneself with switchField
            if (targetId === playerId) return;

            const target = this.players.get(targetId);
            if (target && target.isAlive) {
                // Duplicate current player board and target board into temporary variables (deep copy)
                const tempPlayerBoard = JSON.parse(JSON.stringify(player.board));
                const tempTargetBoard = JSON.parse(JSON.stringify(target.board));

                // Exchange boards using the temporary copies
                player.board = tempTargetBoard;
                target.board = tempPlayerBoard;
                
                // Helper function to calculate board filled height / percentage
                const getBoardFilledRows = (b: Board): number => {
                    let filledCount = 0;
                    for (let r = 0; r < b.length; r++) {
                        if (b[r].some(cell => cell !== 0)) {
                            filledCount++;
                        }
                    }
                    return filledCount;
                };

                const maxAllowedRows = Math.floor(TetrisEngine.ROWS * 0.75); // 75% of 22 = 16 rows

                // Check if player's new board exceeds 75% height threshold
                if (getBoardFilledRows(player.board) > maxAllowedRows) {
                    player.die();
                    io.to(this.id).emit('player_lost', player.id);
                }

                // Check if target's new board exceeds 75% height threshold
                if (getBoardFilledRows(target.board) > maxAllowedRows) {
                    target.die();
                    io.to(this.id).emit('player_lost', target.id);
                }

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

                // Broadcast chat notification for switchField
                const specialName = '🔄 Switch Field';
                io.to(this.id).emit('chat_message', {
                    playerName: '⚡ System',
                    message: `${player.name} a échangé son terrain avec ${target.name} !`,
                    timestamp: Date.now()
                });

                this.checkGameOver(io);
            }
        } else if (targetId) {
            const target = this.players.get(targetId);
            if (target && target.isAlive) {
                target.receiveSpecial(special, TetrisEngine);
                io.to(targetId).emit('receive_special', {
                    special,
                    senderId: player.id,
                    senderName: player.name
                });



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
     * Handles setting a player's team.
     */
    setPlayerTeam(playerId: string, team: TeamColor, io: Server<ClientToServerEvents, ServerToClientEvents>): void {
        const player = this.players.get(playerId);
        if (player) {
            player.team = team;
            io.to(this.id).emit('player_team_updated', { playerId, team });
        }
    }

    /**
     * Handles player losing.
     */
    handlePlayerLost(playerId: string, io: Server<ClientToServerEvents, ServerToClientEvents>): void {
        const player = this.players.get(playerId);
        if (player) {
            player.die();
            io.to(this.id).emit('player_lost', playerId);
            this.checkGameOver(io);
        }
    }

    /**
     * Checks if all remaining alive players belong to the same team or solo player.
     */
    checkGameOver(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
        if (!this.gameStarted) return;
        
        const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);

        if (alivePlayers.length === 0) {
            this.gameStarted = false;
            io.to(this.id).emit('game_over', { winner: null });
            for (const p of this.players.values()) p.reset();
            return;
        }

        // Check if all alive players belong to the exact same team
        // (Note: 'none' team means solo mode for that player, which is unique to them unless they are on a colored team)
        const firstTeam = alivePlayers[0].team;
        let isTeamVictory = false;

        if (firstTeam !== 'none') {
            // All alive players are on the same colored team (e.g. 'red', 'blue', etc.)
            isTeamVictory = alivePlayers.every(p => p.team === firstTeam);
        } else {
            // Solo mode: victory if only 1 player remains alive overall
            isTeamVictory = (alivePlayers.length === 1);
        }

        // Check if victory condition met (and total room size > 1)
        if (isTeamVictory && this.players.size > 1) {
            this.gameStarted = false;
            const winningTeam = firstTeam !== 'none' ? firstTeam : undefined;
            const winnerId = alivePlayers.length === 1 ? alivePlayers[0].id : null;
            
            io.to(this.id).emit('game_over', { 
                winner: winnerId, 
                winnerTeam: winningTeam 
            });

            for (const p of this.players.values()) {
                p.reset();
            }
        }
    }

    /**
     * Gets the full state of the room.
     */
    getState(): RoomState {
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
    getSummary(): RoomSummary {
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
    isEmpty(): boolean {
        return this.players.size === 0;
    }
}
