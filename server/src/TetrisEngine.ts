import { Board, SpecialType, TetrominoType } from './types';

export class TetrisEngine {
    static readonly ROWS = 22;
    static readonly COLS = 12;

    static readonly SHAPES: Record<TetrominoType, number[][]> = {
        I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        O: [[2,2], [2,2]],
        T: [[0,3,0], [3,3,3], [0,0,0]],
        S: [[0,4,4], [4,4,0], [0,0,0]],
        Z: [[5,5,0], [0,5,5], [0,0,0]],
        J: [[6,0,0], [6,6,6], [0,0,0]],
        L: [[0,0,7], [7,7,7], [0,0,0]]
    };

    /**
     * Creates an empty board.
     * @returns A 22x12 array filled with 0s.
     */
    static createEmptyBoard(): Board {
        return Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(0));
    }

    /**
     * Gets a random piece based on a seeded RNG.
     * @param rng A function returning a number between 0 and 1.
     * @returns An object with the piece type, shape, and color.
     */
    static getRandomPiece(rng: () => number): { type: TetrominoType, shape: number[][], color: number } {
        const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const type = types[Math.floor(rng() * types.length)];
        const shape = this.SHAPES[type];
        // The color is the non-zero element in the shape matrix
        let color = 1;
        for (const row of shape) {
            for (const cell of row) {
                if (cell > 0) {
                    color = cell;
                    break;
                }
            }
        }
        return { type, shape, color };
    }

    /**
     * Checks if a piece can be placed on the board at the given row and col.
     */
    static canPlace(board: Board, shape: number[][], row: number, col: number): boolean {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    const boardRow = row + r;
                    const boardCol = col + c;
                    
                    if (boardRow < 0 || boardRow >= this.ROWS || boardCol < 0 || boardCol >= this.COLS) {
                        return false;
                    }
                    if (board[boardRow][boardCol] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * Places a piece on the board and returns a new board.
     */
    static placePiece(board: Board, shape: number[][], row: number, col: number, color: number): Board {
        const newBoard = board.map(r => [...r]);
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    const boardRow = row + r;
                    const boardCol = col + c;
                    if (boardRow >= 0 && boardRow < this.ROWS && boardCol >= 0 && boardCol < this.COLS) {
                        newBoard[boardRow][boardCol] = color;
                    }
                }
            }
        }
        return newBoard;
    }

    /**
     * Rotates a piece 90 degrees clockwise.
     */
    static rotatePiece(shape: number[][]): number[][] {
        const N = shape.length;
        const newShape = Array.from({ length: N }, () => Array(N).fill(0));
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                newShape[c][N - 1 - r] = shape[r][c];
            }
        }
        return newShape;
    }

    /**
     * Clears full lines from the board.
     */
    static clearLines(board: Board): { newBoard: Board, linesCleared: number } {
        const newBoard = board.filter(row => !row.every(cell => cell !== 0));
        const linesCleared = this.ROWS - newBoard.length;
        for (let i = 0; i < linesCleared; i++) {
            newBoard.unshift(Array(this.COLS).fill(0));
        }
        return { newBoard, linesCleared };
    }

    /**
     * Adds garbage lines at the bottom of the board.
     */
    static addGarbageLines(board: Board, count: number): Board {
        if (count <= 0) return board.map(r => [...r]);
        const newBoard = board.slice(count);
        for (let i = 0; i < count; i++) {
            const hole = Math.floor(Math.random() * this.COLS);
            const row = Array(this.COLS).fill(8); // 8 represents a generic garbage block
            row[hole] = 0;
            newBoard.push(row);
        }
        return newBoard;
    }

    /**
     * Checks if the game is over (blocks in the top row).
     */
    static isGameOver(board: Board): boolean {
        return board[0].some(cell => cell !== 0);
    }

    /**
     * Calculates the score based on lines cleared and current level.
     */
    static calculateScore(linesCleared: number, level: number): number {
        const base = [0, 40, 100, 300, 1200];
        if (linesCleared < 0 || linesCleared > 4) return 0;
        return base[linesCleared] * (level + 1);
    }

    /**
     * Calculates where a piece will drop.
     */
    static getDropPosition(board: Board, shape: number[][], col: number): number {
        let dropRow = 0;
        while (this.canPlace(board, shape, dropRow + 1, col)) {
            dropRow++;
        }
        return dropRow;
    }

    /**
     * Applies a special block effect to the board.
     */
    static applySpecial(board: Board, special: SpecialType): Board {
        let newBoard = board.map(r => [...r]);
        
        switch (special) {
            case 'addLine':
                newBoard = this.addGarbageLines(newBoard, 1);
                break;
            case 'clearLine':
                newBoard.pop();
                newBoard.unshift(Array(this.COLS).fill(0));
                break;
            case 'nuke':
                newBoard = this.createEmptyBoard();
                break;
            case 'randomClear':
                for (let r = 0; r < this.ROWS; r++) {
                    for (let c = 0; c < this.COLS; c++) {
                        if (newBoard[r][c] !== 0 && Math.random() < 0.2) {
                            newBoard[r][c] = 0;
                        }
                    }
                }
                break;
            case 'clearSpecials':
                for (let r = 0; r < this.ROWS; r++) {
                    for (let c = 0; c < this.COLS; c++) {
                        if (newBoard[r][c] >= 10) { // specials are 10-18
                            newBoard[r][c] = 0; // or change to normal color
                        }
                    }
                }
                break;
            case 'blockBomb':
                break;
            case 'blockQuake':
                newBoard = newBoard.map(row => {
                    const shift = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                    if (shift === 0) return [...row];
                    const newRow = Array(this.COLS).fill(0);
                    for (let c = 0; c < this.COLS; c++) {
                        const nc = c + shift;
                        if (nc >= 0 && nc < this.COLS) {
                            newRow[nc] = row[c];
                        }
                    }
                    return newRow;
                });
                break;
            case 'blockGravity':
                for (let c = 0; c < this.COLS; c++) {
                    const colCells: number[] = [];
                    for (let r = 0; r < this.ROWS; r++) {
                        if (newBoard[r][c] !== 0) {
                            colCells.push(newBoard[r][c]);
                        }
                    }
                    let writeR = this.ROWS - 1;
                    for (let i = colCells.length - 1; i >= 0; i--) {
                        newBoard[writeR][c] = colCells[i];
                        writeR--;
                    }
                    while (writeR >= 0) {
                        newBoard[writeR][c] = 0;
                        writeR--;
                    }
                }

                const clearedRows: number[] = [];
                for (let r = 0; r < this.ROWS; r++) {
                    if (newBoard[r].every(cell => cell !== 0)) {
                        clearedRows.push(r);
                    }
                }
                if (clearedRows.length > 0) {
                    const filteredBoard = newBoard.filter((_, idx) => !clearedRows.includes(idx));
                    while (filteredBoard.length < this.ROWS) {
                        filteredBoard.unshift(Array(this.COLS).fill(0));
                    }
                    newBoard = filteredBoard;
                }
                break;
            case 'switchField':
                break;
        }
        
        return newBoard;
    }
}
