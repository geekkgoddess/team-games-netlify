// Sound Effects using Web Audio API (no external files needed)

const getAudioContext = () => {
  if (!window.audioContext) {
    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window.audioContext;
};

export const playTimerBuzz = () => {
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  } catch (e) {
    console.log('Audio context not available');
  }
};

export const playCountdown = (number) => {
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1000 + number * 100;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } catch (e) {
    console.log('Audio context not available');
  }
};

export const playApplause = () => {
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    const duration = 2;

    for (let i = 0; i < 5; i++) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = 100 + Math.random() * 400;
      osc.type = 'sine';
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    }
  } catch (e) {
    console.log('Audio context not available');
  }
};

export const playCorrectChime = () => {
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = freq;
      osc.type = 'sine';

      const startTime = now + index * 0.1;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  } catch (e) {
    console.log('Audio context not available');
  }
};
