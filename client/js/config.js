// Game configuration constants
const CONFIG = {
  BOARD_WIDTH: 12,
  BOARD_HEIGHT: 22,
  CELL_SIZE: 30,         // pixels per cell for main board
  OPPONENT_CELL_SIZE: 14, // pixels for opponent boards
  COLORS: {
    0: 'transparent',
    1: '#00f5ff',  // I - cyan
    2: '#ffd700',  // O - gold
    3: '#bf00ff',  // T - purple
    4: '#00ff88',  // S - green
    5: '#ff3355',  // Z - red
    6: '#0088ff',  // J - blue
    7: '#ff8800',  // L - orange
    10: '#ff6600', // addLine
    11: '#00ffcc', // clearLine
    12: '#ff0000', // nuke
    13: '#ff00ff', // randomClear
    14: '#ffff00', // switchField
    15: '#ffffff', // clearSpecials
    16: '#ff4444', // blockBomb
    17: '#888888', // blockQuake
    18: '#00ccff', // blockGravity
  },
  SPECIALS: {
    addLine:       { name: '➕ Add Line',        type: 'negative' },
    clearLine:     { name: '🧹 Clear Line',      type: 'positive' },
    nuke:          { name: '💥 Nuke',             type: 'positive' },
    randomClear:   { name: '🎲 Random Clear',     type: 'negative' },
    switchField:   { name: '🔄 Switch Field',     type: 'neutral'  },
    clearSpecials: { name: '🛡️ Clear Specials',   type: 'negative' },
    blockBomb:     { name: '💣 Block Bomb',        type: 'negative' },
    blockQuake:    { name: '🌊 Quake',             type: 'negative' },
    blockGravity:  { name: '⬇️ Gravity',          type: 'positive' },
  },
  // Classic TetriNET letter codes shown ON the board blocks
  SPECIAL_LETTERS: {
    10: 'A',  // Add Line
    11: 'C',  // Clear Line
    12: 'N',  // Nuke Field (Clear)
    13: 'R',  // Random Clear
    14: 'S',  // Switch Field
    15: 'B',  // Clear Specials
    16: 'O',  // Block Bomb
    17: 'Q',  // Quake
    18: 'G',  // Gravity
  },
  // Map letter → special name (for targeting display)
  LETTER_TO_SPECIAL: {
    10: 'addLine', 11: 'clearLine', 12: 'nuke', 13: 'randomClear',
    14: 'switchField', 15: 'clearSpecials', 16: 'blockBomb',
    17: 'blockQuake', 18: 'blockGravity',
  },
  GRAVITY: [800, 720, 630, 550, 470, 380, 300, 220, 130, 100], // ms per drop per level
  LOCK_DELAY: 500, // ms after landing before locking
  MAX_SPECIALS: 20,
  LINES_PER_SPECIAL: 3, // clear 3 lines to earn 1 special
  SERVER_URL: window.location.origin, // For Socket.io
};
