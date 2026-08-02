/**
 * French translations for TetriNET
 */
const LANG_FR = {
  // Page title
  pageTitle: 'TitreNET',

  // Sound controls
  soundToggleTitle: 'Activer / Désactiver le son',
  soundToggleTitleMuted: 'Activer le son',
  soundToggleTitleUnmuted: 'Désactiver le son',
  labelMusic: '🎵 Musique',
  labelSfx: '🔊 Effets Sonores',

  // Lobby screen
  lobbyTitle: 'TetriNET',
  labelPlayerName: 'Nom du joueur :',
  placeholderPlayerName: 'Entrez votre nom',
  labelRoomId: 'ID de la salle (optionnel) :',
  placeholderRoomId: 'Laisser vide pour créer',
  labelTeam: 'Équipe :',
  teamSolo: 'Solo (Pas d\'équipe)',
  teamRed: '🔴 Équipe Rouge',
  teamBlue: '🔵 Équipe Bleue',
  teamGreen: '🟢 Équipe Verte',
  teamYellow: '🟡 Équipe Jaune',
  btnJoinRoom: 'Rejoindre / Créer une salle',
  availableRooms: 'Salles disponibles',
  noRooms: 'Aucune salle. Créez-en une !',
  roomStatusInProgress: '🔴 En cours',
  roomStatusOpen: '🟢 Ouverte',

  // Waiting room
  waitingRoomTitle: 'Salle d\'attente',
  roomIdPrefix: 'Salle : ',
  labelPlayers: 'Joueurs',
  labelMyTeam: 'Mon Équipe :',
  btnStartGame: 'Lancer la partie',
  btnLeaveRoom: 'Quitter la salle',
  placeholderChat: 'Écrire un message...',
  btnSend: 'Envoyer',
  badgeHost: 'HÔTE',
  badgeYou: 'VOUS',

  // Team labels (waiting list)
  teamLabelSolo: 'Solo',
  teamLabelRed: '🔴 Rouge',
  teamLabelBlue: '🔵 Bleue',
  teamLabelGreen: '🟢 Verte',
  teamLabelYellow: '🟡 Jaune',

  // Game screen
  statScore: 'SCORE',
  statLevel: 'NIVEAU',
  statLines: 'LIGNES',
  statNext: 'SUIVANT',
  statSpecials: 'SPÉCIAUX',
  noSpecials: 'Aucun spécial',
  eliminated: 'ÉLIMINÉ',
  out: 'OUT',
  placeholderChatGame: 'Chat...',

  // Game over screen
  gameOverTitle: 'FIN DE PARTIE',
  finalScores: 'Scores finaux',
  btnPlayAgain: 'Rejouer',
  btnBackLobby: 'Retour au lobby',
  wins: 'GAGNE !',
  drawNoWinner: 'Égalité - Aucun gagnant',
  pts: 'pts',
  line: 'ligne',
  lines: 'lignes',

  // Team labels (game over)
  teamWinRed: '🔴 Équipe Rouge',
  teamWinBlue: '🔵 Équipe Bleue',
  teamWinGreen: '🟢 Équipe Verte',
  teamWinYellow: '🟡 Équipe Jaune',

  // Notifications / in-game messages
  failedToJoinRoom: 'Impossible de rejoindre la salle',
  playerJoinedRoom: '{name} a rejoint la salle',
  garbageLine: '+{count} ligne de déchets !',
  garbageLines: '+{count} lignes de déchets !',
  receivedSpecial: '{sender} vous a envoyé : {special} !',
  playerEliminated: '{name} a été éliminé !',
  noPlayerAssigned: 'Aucun joueur assigné à la touche [{key}] !',
  targetPlayerDead: 'Le joueur cible est mort ou indisponible !',
  cannotSwitchSelf: 'Impossible de s\'envoyer un Switch Field sur soi-même !',
  usedOnSelf: 'Utilisé sur soi : {special}',
  sentSpecial: 'Envoyé {special} à la cible !',
  defaultSender: 'un joueur',
  countdown_GO: 'GO !',

  // Help modal
  helpToggleTitle: 'Aide — Blocs spéciaux',
  helpTitle: 'Blocs Spéciaux',
  helpSubtitle: 'Chaque bloc spécial est marqué d\'une lettre sur le plateau. Voici leurs effets :',
  helpTip: 'Collectez des spéciaux en nettoyant des lignes, puis utilisez les touches 1-6 pour cibler vos adversaires !',
  helpDescAddLine: 'Ajoute une ligne de déchets au plateau de la cible.',
  helpDescClearLine: 'Supprime la ligne du bas de votre plateau.',
  helpDescNuke: 'Nettoie complètement le plateau de la cible.',
  helpDescRandomClear: 'Supprime aléatoirement 10 blocs du plateau de la cible.',
  helpDescSwitchField: 'Échange votre plateau avec celui de la cible.',
  helpDescClearSpecials: 'Supprime tous les blocs spéciaux du plateau de la cible.',
  helpDescBlockBomb: 'Fait exploser les blocs autour des blocs spéciaux de la cible.',
  helpDescBlockQuake: 'Décale aléatoirement chaque ligne du plateau de la cible.',
  helpDescBlockGravity: 'Fait tomber tous les blocs flottants sur votre plateau.',
  helpTypePositive: 'Positif',
  helpTypeNegative: 'Négatif',
  helpTypeNeutral: 'Neutre',

  // Pause
  btnPause: '⏸ PAUSE',
  btnResume: '▶ REPRENDRE',
  pauseLabel: 'PAUSE',
  pausedBy: 'Partie mise en pause par {name}',
  gameResumed: 'Partie reprise par {name}',
};
