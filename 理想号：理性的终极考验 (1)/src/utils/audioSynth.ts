/**
 * Web Audio API Sound Synthesizer for "理想号"
 * Provides zero-latency, high-fidelity retro & sci-fi sound effects
 * without relying on external assets, ensuring full offline support.
 */

class AudioSynth {
  private ctx: AudioContext | null = null;
  private volumeNode: GainNode | null = null;
  private volume: number = 0.5; // Default volume: 50%

  constructor() {
    // Lazy initialize to bypass browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.volumeNode = this.ctx.createGain();
        this.volumeNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.volumeNode.connect(this.ctx.destination);
      }
    }
    // Resume context if suspended (browser autoplay security)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.volumeNode && this.ctx) {
      this.volumeNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Safe oscillator creator with volume control
   */
  private playTone(
    type: OscillatorType,
    freqs: number[],
    durations: number[],
    gains: number[],
    fadeOutTime: number = 0.05
  ) {
    try {
      this.initCtx();
      if (!this.ctx || !this.volumeNode) return;

      const now = this.ctx.currentTime;
      let startTime = now;

      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.volumeNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        const activeGain = gains[idx] !== undefined ? gains[idx] : 0.3;
        const duration = durations[idx] !== undefined ? durations[idx] : 0.1;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(activeGain, startTime + 0.01);
        gain.gain.setValueAtTime(activeGain, startTime + duration - fadeOutTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.volumeNode);

        osc.start(startTime);
        osc.stop(startTime + duration);

        startTime += duration * 0.8; // overlap slightly or sequence
      });
    } catch (e) {
      console.warn("AudioSynth error: ", e);
    }
  }

  /**
   * Sound when scanning, hovering or focusing options
   */
  public playHover() {
    this.playTone('sine', [600], [0.03], [0.08], 0.01);
  }

  /**
   * Crisp tactile click when a button is pressed
   */
  public playClick() {
    this.playTone('triangle', [523.25, 659.25], [0.06, 0.08], [0.25, 0.25], 0.02);
  }

  /**
   * Pleasant chime when an action succeeds or an answer is correct
   */
  public playSuccess() {
    // C Major Arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    this.playTone('sine', [523.25, 659.25, 783.99, 1046.50], [0.12, 0.12, 0.12, 0.25], [0.2, 0.2, 0.2, 0.3], 0.04);
  }

  /**
   * Deep warning buzzer when a choice has poor consequences
   */
  public playFailure() {
    // Descending discordant tone with a saw/triangle mix (using sawtooth for buzzer vibe)
    this.playTone('sawtooth', [180, 130], [0.15, 0.25], [0.18, 0.18], 0.05);
  }

  /**
   * Heavenly achievement unlocked/victory theme
   */
  public playVictory() {
    this.playTone(
      'sine',
      [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51],
      [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.15, 0.4],
      [0.15, 0.15, 0.15, 0.15, 0.18, 0.18, 0.22, 0.3],
      0.08
    );
  }
}

export const synth = new AudioSynth();
