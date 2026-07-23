import { Board, PlayerState, SpecialType } from './types';
import { TetrisEngine } from './TetrisEngine';

export class Player {
    id: string;
    name: string;
    board: Board;
    score: number;
    level: number;
    lines: number;
    isAlive: boolean;
    specials: SpecialType[];

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.board = TetrisEngine.createEmptyBoard();
        this.score = 0;
        this.level = 0;
        this.lines = 0;
        this.isAlive = true;
        this.specials = [];
    }

    /**
     * Gets the current state of the player.
     */
    getState(): PlayerState {
        return {
            id: this.id,
            name: this.name,
            board: this.board,
            score: this.score,
            level: this.level,
            lines: this.lines,
            isAlive: this.isAlive,
            specials: [...this.specials]
        };
    }

    /**
     * Adds garbage lines to the player's board.
     */
    addGarbage(lines: number): void {
        if (!this.isAlive || lines <= 0) return;
        this.board = TetrisEngine.addGarbageLines(this.board, lines);
    }

    /**
     * Applies a special effect to the player.
     */
    receiveSpecial(special: SpecialType, engine: typeof TetrisEngine): void {
        if (!this.isAlive) return;
        this.board = engine.applySpecial(this.board, special);
    }

    /**
     * Updates the player's board and stats.
     */
    updateBoard(board: Board, score: number, level: number, lines: number): void {
        this.board = board;
        this.score = score;
        this.level = level;
        this.lines = lines;
    }

    /**
     * Marks the player as dead.
     */
    die(): void {
        this.isAlive = false;
    }

    /**
     * Resets the player for a new game.
     */
    reset(): void {
        this.board = TetrisEngine.createEmptyBoard();
        this.score = 0;
        this.level = 0;
        this.lines = 0;
        this.isAlive = true;
        this.specials = [];
    }

    /**
     * Adds a special to the player's inventory queue.
     */
    addSpecialToQueue(special: SpecialType): void {
        if (this.specials.length < 5) {
            this.specials.push(special);
        }
    }

    /**
     * Consumes the first special in the queue.
     */
    consumeSpecial(): SpecialType | null {
        return this.specials.shift() || null;
    }
}
