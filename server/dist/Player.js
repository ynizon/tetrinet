"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const TetrisEngine_1 = require("./TetrisEngine");
class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.board = TetrisEngine_1.TetrisEngine.createEmptyBoard();
        this.score = 0;
        this.level = 0;
        this.lines = 0;
        this.isAlive = true;
        this.specials = [];
        this.team = 'none';
    }
    /**
     * Gets the current state of the player.
     */
    getState() {
        return {
            id: this.id,
            name: this.name,
            board: this.board,
            score: this.score,
            level: this.level,
            lines: this.lines,
            isAlive: this.isAlive,
            specials: [...this.specials],
            team: this.team
        };
    }
    /**
     * Adds garbage lines to the player's board.
     */
    addGarbage(lines) {
        if (!this.isAlive || lines <= 0)
            return;
        this.board = TetrisEngine_1.TetrisEngine.addGarbageLines(this.board, lines);
    }
    /**
     * Applies a special effect to the player.
     */
    receiveSpecial(special, engine) {
        if (!this.isAlive)
            return;
        this.board = engine.applySpecial(this.board, special);
    }
    /**
     * Updates the player's board and stats.
     */
    updateBoard(board, score, level, lines) {
        this.board = board;
        this.score = score;
        this.level = level;
        this.lines = lines;
    }
    /**
     * Marks the player as dead.
     */
    die() {
        this.isAlive = false;
    }
    /**
     * Resets the player for a new game.
     */
    reset() {
        this.board = TetrisEngine_1.TetrisEngine.createEmptyBoard();
        this.score = 0;
        this.level = 0;
        this.lines = 0;
        this.isAlive = true;
        this.specials = [];
    }
    /**
     * Adds a special to the player's inventory queue.
     */
    addSpecialToQueue(special) {
        if (this.specials.length < 5) {
            this.specials.push(special);
        }
    }
    /**
     * Consumes the first special in the queue.
     */
    consumeSpecial() {
        return this.specials.shift() || null;
    }
}
exports.Player = Player;
