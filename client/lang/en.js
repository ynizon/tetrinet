/**
 * English translations for TetriNET
 */
const LANG_EN = {
  // Page title
  pageTitle: 'TitreNET',

  // Sound controls
  soundToggleTitle: 'Enable / Disable sound',
  soundToggleTitleMuted: 'Enable sound',
  soundToggleTitleUnmuted: 'Disable sound',
  labelMusic: '🎵 Music',
  labelSfx: '🔊 Sound Effects',

  // Lobby screen
  lobbyTitle: 'TetriNET',
  labelPlayerName: 'Player Name:',
  placeholderPlayerName: 'Enter your name',
  labelRoomId: 'Room ID (optional):',
  placeholderRoomId: 'Leave empty to create',
  labelTeam: 'Team:',
  teamSolo: 'Solo (No team)',
  teamRed: '🔴 Red Team',
  teamBlue: '🔵 Blue Team',
  teamGreen: '🟢 Green Team',
  teamYellow: '🟡 Yellow Team',
  btnJoinRoom: 'Join / Create Room',
  availableRooms: 'Available Rooms',
  noRooms: 'No rooms yet. Create one!',
  roomStatusInProgress: '🔴 In Progress',
  roomStatusOpen: '🟢 Open',

  // Waiting room
  waitingRoomTitle: 'Waiting Room',
  roomIdPrefix: 'Room ID: ',
  labelPlayers: 'Players',
  labelMyTeam: 'My Team:',
  btnStartGame: 'Start Game',
  btnLeaveRoom: 'Leave Room',
  placeholderChat: 'Type a message...',
  btnSend: 'Send',
  badgeHost: 'HOST',
  badgeYou: 'YOU',

  // Team labels (waiting list)
  teamLabelSolo: 'Solo',
  teamLabelRed: '🔴 Red',
  teamLabelBlue: '🔵 Blue',
  teamLabelGreen: '🟢 Green',
  teamLabelYellow: '🟡 Yellow',

  // Game screen
  statScore: 'SCORE',
  statLevel: 'LEVEL',
  statLines: 'LINES',
  statNext: 'NEXT',
  statSpecials: 'SPECIALS',
  noSpecials: 'No specials',
  eliminated: 'ELIMINATED',
  out: 'OUT',
  placeholderChatGame: 'Chat...',

  // Game over screen
  gameOverTitle: 'GAME OVER',
  finalScores: 'Final Scores',
  btnPlayAgain: 'Play Again',
  btnBackLobby: 'Back to Lobby',
  wins: 'WINS!',
  drawNoWinner: 'Draw - No Winner',
  pts: 'pts',
  line: 'line',
  lines: 'lines',

  // Team labels (game over)
  teamWinRed: '🔴 Red Team',
  teamWinBlue: '🔵 Blue Team',
  teamWinGreen: '🟢 Green Team',
  teamWinYellow: '🟡 Yellow Team',

  // Notifications / in-game messages
  failedToJoinRoom: 'Failed to join room',
  playerJoinedRoom: '{name} joined the room',
  garbageLine: '+{count} garbage line!',
  garbageLines: '+{count} garbage lines!',
  receivedSpecial: '{sender} sent you: {special}!',
  playerEliminated: '{name} was eliminated!',
  noPlayerAssigned: 'No player assigned to key [{key}]!',
  targetPlayerDead: 'Target player is dead or unavailable!',
  cannotSwitchSelf: "Cannot use Switch Field on yourself!",
  usedOnSelf: 'Used on self: {special}',
  sentSpecial: 'Sent {special} to target!',
  defaultSender: 'a player',
  countdown_GO: 'GO!',

  // Help modal
  helpToggleTitle: 'Help — Special blocks',
  helpTitle: 'Special Blocks',
  helpSubtitle: 'Each special block is marked with a letter on the board. Here\'s what they do:',
  helpTip: 'Collect specials by clearing lines, then use number keys (1-6) to target opponents!',
  helpDescAddLine: 'Adds a garbage line to the target\'s board.',
  helpDescClearLine: 'Clears the bottom line of your board.',
  helpDescNuke: 'Completely clears the target\'s board.',
  helpDescRandomClear: 'Randomly removes 10 blocks from the target\'s board.',
  helpDescSwitchField: 'Swaps your board with the target\'s board.',
  helpDescClearSpecials: 'Removes all special blocks from the target\'s board.',
  helpDescBlockBomb: 'Explodes blocks around special blocks on the target\'s board.',
  helpDescBlockQuake: 'Randomly shifts every row of the target\'s board left or right.',
  helpDescBlockGravity: 'Drops all floating blocks down on your board.',
  helpTypePositive: 'Positive',
  helpTypeNegative: 'Negative',
  helpTypeNeutral: 'Neutral',

  // Pause
  btnPause: '⏸ PAUSE',
  btnResume: '▶ RESUME',
  pauseLabel: 'PAUSED',
  pausedBy: 'Paused by {name}',
  gameResumed: 'Game resumed by {name}',
};
