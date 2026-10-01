// Web Audio API Synthesizer for rich, responsive, zero-asset game sound effects
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('lumosity_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('lumosity_muted', this.muted);
    return this.muted;
  }

  // Soft tactile UI click
  playTap() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Crisp organic bubble pop for raindrops, pearls and targets
  playBubble() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(1150, now + 0.08);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Crisp harmonious chime for correct answer
  playCorrect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Dual tone (root + major third)
    [587.33, 739.99].forEach((freq, i) => { // D5, F#5
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.2);

      gain.gain.setValueAtTime(0.12, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.03);
      osc.stop(now + 0.3);
    });
  }

  // Soft low buzz for incorrect answer
  playWrong() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Multiplier Combo Sound (arpeggio based on streak)
  playCombo(multiplier = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const baseFrequencies = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6
    const noteCount = Math.min(Math.max(multiplier, 1), 5);
    const now = this.ctx.currentTime;

    for (let i = 0; i < noteCount; i++) {
      const freq = baseFrequencies[i];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.09, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.19);
    }
  }

  // Countdown Pip (3, 2, 1)
  playCountdown() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Go / Start Sound
  playStart() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // A5 to D6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Level Up / Win Round Fanfare
  playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  // Game session finished sound
  playFinish() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [587.33, 440, 523.25]; // D5, A4, C5 gentle chime
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.1;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch (e) {
      console.warn('Audio playFinish warning:', e);
    }
  }

  // Final Victory / Workout Finished
  playVictory() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + (idx === 3 ? 0.6 : 0.25));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + (idx === 3 ? 0.65 : 0.26));
      });
    } catch (e) {
      console.warn('Audio playVictory warning:', e);
    }
  }

  // --- NEURO-FOCUS BINAURAL SOUNDSCAPE GENERATOR ---
  // Client-side synthesized Alpha (10Hz) & Gamma (40Hz) binaural beats + soothing warm drone
  startBinaural(mode = 'alpha', volume = 0.25) {
    this.init();
    if (!this.ctx) return;
    this.stopBinaural(); // stop previous if running

    try {
      const now = this.ctx.currentTime;
      this.binauralVolume = volume;
      this.binauralMode = mode;

      this.binauralMasterGain = this.ctx.createGain();
      this.binauralMasterGain.gain.setValueAtTime(0.01, now);
      this.binauralMasterGain.gain.linearRampToValueAtTime(volume, now + 1.2);
      this.binauralMasterGain.connect(this.ctx.destination);

      if (mode === 'flow') {
        // Soothing warm pink/brown noise for masking distractions
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.95 * b1 + white * 0.1;
          b2 = 0.85 * b2 + white * 0.25;
          output[i] = (b0 + b1 + b2) * 0.18;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        whiteNoise.connect(filter);
        filter.connect(this.binauralMasterGain);
        whiteNoise.start(now);
        this.binauralNodes = [whiteNoise, filter];
      } else {
        // Binaural Beat: Left Ear f0, Right Ear f0 + delta
        const baseFreq = mode === 'gamma' ? 220 : 196; // 196Hz (G3) for alpha, 220Hz (A3) for gamma
        const beatDelta = mode === 'gamma' ? 40 : 10;   // 40Hz Gamma (Cognitive binding) or 10Hz Alpha (Relaxed alertness)

        // Left channel (baseFreq)
        const oscL = this.ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(baseFreq, now);

        const panL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        if (panL) panL.pan.setValueAtTime(-0.85, now);

        // Right channel (baseFreq + beatDelta)
        const oscR = this.ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(baseFreq + beatDelta, now);

        const panR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        if (panR) panR.pan.setValueAtTime(0.85, now);

        // Warm harmonic sub-pad drone (55Hz / 110Hz) for musical depth
        const droneOsc = this.ctx.createOscillator();
        droneOsc.type = 'triangle';
        droneOsc.frequency.setValueAtTime(baseFreq / 2, now);
        const droneGain = this.ctx.createGain();
        droneGain.gain.setValueAtTime(0.15, now);

        const droneFilter = this.ctx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.setValueAtTime(180, now);

        // Connect everything
        if (panL && panR) {
          oscL.connect(panL);
          panL.connect(this.binauralMasterGain);

          oscR.connect(panR);
          panR.connect(this.binauralMasterGain);
        } else {
          oscL.connect(this.binauralMasterGain);
          oscR.connect(this.binauralMasterGain);
        }

        droneOsc.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(this.binauralMasterGain);

        oscL.start(now);
        oscR.start(now);
        droneOsc.start(now);

        this.binauralNodes = [oscL, oscR, droneOsc];
      }

      this.binauralActive = true;
    } catch (err) {
      console.warn('Could not start binaural soundscape:', err);
    }
  }

  stopBinaural() {
    if (!this.ctx || !this.binauralActive) return;
    try {
      const now = this.ctx.currentTime;
      if (this.binauralMasterGain) {
        this.binauralMasterGain.gain.linearRampToValueAtTime(0.001, now + 0.6);
      }
      setTimeout(() => {
        if (this.binauralNodes) {
          this.binauralNodes.forEach(node => {
            try {
              if (node.stop) node.stop();
              if (node.disconnect) node.disconnect();
            } catch (e) {}
          });
          this.binauralNodes = [];
        }
        if (this.binauralMasterGain) {
          try { this.binauralMasterGain.disconnect(); } catch (e) {}
          this.binauralMasterGain = null;
        }
        this.binauralActive = false;
      }, 700);
    } catch (err) {
      this.binauralActive = false;
    }
  }

  isBinauralActive() {
    return !!this.binauralActive;
  }

  getBinauralMode() {
    return this.binauralMode || 'alpha';
  }

  setBinauralVolume(vol) {
    this.binauralVolume = vol;
    if (this.ctx && this.binauralMasterGain && this.binauralActive) {
      this.binauralMasterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }
}

export const sound = new SoundEngine();
