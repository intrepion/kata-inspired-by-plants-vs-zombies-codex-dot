let context: AudioContext | undefined;
let enabled = false;
export function toggleSound() {
  enabled = !enabled;
  if (enabled) {
    context ??= new AudioContext();
    void context.resume();
    tone(440);
  }
  return enabled;
}
export function tone(frequency = 660) {
  if (!enabled || !context) return;
  const osc = context.createOscillator(),
    gain = context.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    frequency * 0.7,
    context.currentTime + 0.18,
  );
  gain.gain.setValueAtTime(0.045, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.26);
}
