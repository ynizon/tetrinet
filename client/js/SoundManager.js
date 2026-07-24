/**
 * SoundManager - Gère les effets sonores du jeu Tetrinet
 */
class SoundEngine {
  constructor() {
    this.muted = false;
    this.sounds = {};

    // Définition des sons du jeu et de leurs chemins
    this.soundPaths = {
      move: 'assets/audio/move.wav',           // Déplacement de pièce
      rotate: 'assets/audio/rotate.wav',       // Rotation de pièce
      drop: 'assets/audio/drop.wav',           // Chute/pose de pièce
      clear: 'assets/audio/clear.wav',         // Ligne(s) complétée(s)
      special: 'assets/audio/special.wav',     // Lancement d'un sort / pouvoir
      garbage: 'assets/audio/garbage.wav',     // Lignes grises reçues du sol
      gameover: 'assets/audio/gameover.wav'    // Fin de partie
    };

    // Musique de fond
    this.bgMusic = new Audio('assets/audio/tetris.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.5;

    this.init();
  }

  init() {
    // Préchargement de chaque effet sonore
    for (const [name, path] of Object.entries(this.soundPaths)) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.sounds[name] = audio;
    }
  }

  /**
   * Joue la musique de fond du jeu.
   */
  startMusic() {
    if (this.muted) return;
    this.bgMusic.currentTime = 0;
    this.bgMusic.play().catch(() => {
      // Ignorer l'erreur d'autoplay navigateur
    });
  }

  /**
   * Arrête la musique de fond.
   */
  stopMusic() {
    this.bgMusic.pause();
    this.bgMusic.currentTime = 0;
  }

  /**
   * Joue un son spécifié par son nom.
   * @param {string} soundName 
   */
  play(soundName) {
    if (this.muted) return;
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  /**
   * Active ou désactive le son et la musique.
   */
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.bgMusic.pause();
    } else {
      // Reprendre la musique si une partie est en cours
      if (window.gameManager && window.gameManager.gameStarted && window.gameManager.isAlive) {
        this.bgMusic.play().catch(() => {});
      }
    }
    return this.muted;
  }
}

// Instance globale SoundManager
window.SoundManager = new SoundEngine();
window.soundManager = window.SoundManager;


