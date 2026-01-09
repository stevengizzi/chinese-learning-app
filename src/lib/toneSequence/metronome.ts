/**
 * Metronome implementation using Web Audio API
 * Provides a continuous beat with adjustable BPM
 */

export class Metronome {
  private audioContext: AudioContext | null = null;
  private nextBeatTime: number = 0;
  private isPlaying: boolean = false;
  private bpm: number = 120;
  private scheduleIntervalId: number | null = null;
  private readonly scheduleAheadTime = 0.1; // Schedule beats 100ms ahead
  private readonly beatFrequency = 800; // Hz for the click sound
  private readonly beatDuration = 0.05; // 50ms click

  constructor(bpm: number = 120) {
    this.bpm = bpm;
  }

  /**
   * Start the metronome
   */
  start(): void {
    if (this.isPlaying) return;

    // Create audio context
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    this.isPlaying = true;
    this.nextBeatTime = this.audioContext.currentTime;

    // Schedule beats at regular intervals
    this.scheduleIntervalId = window.setInterval(() => {
      this.scheduleBeat();
    }, 25); // Check every 25ms
  }

  /**
   * Stop the metronome
   */
  stop(): void {
    this.isPlaying = false;

    if (this.scheduleIntervalId !== null) {
      clearInterval(this.scheduleIntervalId);
      this.scheduleIntervalId = null;
    }
  }

  /**
   * Set BPM (takes effect immediately)
   */
  setBPM(bpm: number): void {
    if (bpm < 60 || bpm > 200) {
      throw new Error('BPM must be between 60 and 200');
    }
    this.bpm = bpm;
  }

  /**
   * Get current BPM
   */
  getBPM(): number {
    return this.bpm;
  }

  /**
   * Check if metronome is playing
   */
  isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Schedule the next beat if it's within the schedule window
   */
  private scheduleBeat(): void {
    if (!this.audioContext || !this.isPlaying) return;

    const currentTime = this.audioContext.currentTime;

    // Schedule beats that fall within the schedule window
    while (this.nextBeatTime < currentTime + this.scheduleAheadTime) {
      this.playBeat(this.nextBeatTime);

      // Calculate next beat time (60 seconds / BPM = seconds per beat)
      const secondsPerBeat = 60.0 / this.bpm;
      this.nextBeatTime += secondsPerBeat;
    }
  }

  /**
   * Play a single beat at the specified time
   */
  private playBeat(time: number): void {
    if (!this.audioContext) return;

    // Create oscillator for the click sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = this.beatFrequency;
    oscillator.type = 'sine';

    // Envelope: quick attack and decay for a "click" sound
    gainNode.gain.setValueAtTime(0.3, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + this.beatDuration);

    oscillator.start(time);
    oscillator.stop(time + this.beatDuration);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
