import {
  PCM_PLAYER_OUTPUT_CHANNEL_COUNT,
  PCM_PLAYER_PROCESSOR_NAME,
  PCM_PLAYER_STOP_MESSAGE,
  type PcmPlayerOptions
} from './pcmPlayer';

/*
 * Types.
 */

type ProcessorConstructionOptions = {
  processorOptions: PcmPlayerOptions;
};

type AudioWorkletProcessorBase = {
  readonly port: MessagePort;
};

type AudioWorkletProcessorConstructor = new (
  options: ProcessorConstructionOptions
) => AudioWorkletProcessorBase;

/*
 * Globals.
 */

// `lib.dom` does not declare the AudioWorklet scope, so declare the parts this processor uses.
declare const AudioWorkletProcessor: AudioWorkletProcessorConstructor;
declare const sampleRate: number;
declare function registerProcessor(name: string, processor: AudioWorkletProcessorConstructor): void;

/*
 * Constants.
 */

/** Ring capacity in frames: roughly 0.68 s of headroom at 48 kHz. */
const RING_CAPACITY_FRAMES = 1 << 15;

/** Frames buffered before output starts, so IPC jitter does not chop the signal. */
const PREBUFFER_FRAMES = 2048;

/** Buffered frames above which older audio is dropped rather than adding latency. */
const MAX_BUFFERED_FRAMES = RING_CAPACITY_FRAMES / 2;

/*
 * Processor.
 */

/**
 * Plays interleaved `f32` chunks pushed over the node's port.
 *
 * The Web Audio API only resamples through `decodeAudioData` and `MediaStream` sources, so a
 * worklet has to deliver frames at the context rate itself. This processor keeps a fractional read
 * cursor over its ring buffer and linearly interpolates, which is the cheapest correct option for
 * driving a visualizer's FFT. On underrun it emits silence and refills before resuming.
 */
class PcmPlayerProcessor extends AudioWorkletProcessor {
  /** One planar ring per output channel. */
  private readonly ring: Float32Array[];
  private readonly captureChannelCount: number;
  /** Capture frames consumed per output frame. */
  private readonly frameStep: number;

  /** Total frames written. A double counts frames exactly for far longer than any session. */
  private writeFrames = 0;
  /** Fractional read cursor in the same frame space as `writeFrames`. */
  private readFrames = 0;
  private isFilling = true;
  private isStopped = false;

  constructor(options: ProcessorConstructionOptions) {
    super(options);

    const {captureSampleRate, captureChannelCount} = options.processorOptions;
    this.captureChannelCount = captureChannelCount;
    this.frameStep = captureSampleRate / sampleRate;
    this.ring = Array.from(
      {length: PCM_PLAYER_OUTPUT_CHANNEL_COUNT},
      () => new Float32Array(RING_CAPACITY_FRAMES)
    );

    this.port.onmessage = event => this.handleMessage(event.data);
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.isStopped) {
      return false;
    }

    // The node is always built with one output of `PCM_PLAYER_OUTPUT_CHANNEL_COUNT` channels.
    const output = outputs[0];
    const frameCount = output[0].length;

    if (!this.checkIsPlayable()) {
      writeSilence(output, 0, frameCount);
      return true;
    }

    this.readFrames = this.render(output, frameCount);

    return true;
  }

  /** True once enough audio is buffered to start reading, latching the refill state. */
  private checkIsPlayable(): boolean {
    if (!this.isFilling) {
      return true;
    }
    if (this.writeFrames - this.readFrames < PREBUFFER_FRAMES) {
      return false;
    }

    this.isFilling = false;
    return true;
  }

  /** Resamples buffered frames into `output` and reports where the read cursor ended up. */
  private render(output: Float32Array[], frameCount: number): number {
    let cursor = this.readFrames;

    for (let frame = 0; frame < frameCount; frame++) {
      const base = Math.floor(cursor);
      // Interpolating into `base + 1` needs that frame to already be written.
      if (base + 1 >= this.writeFrames) {
        writeSilence(output, frame, frameCount);
        // Underrun: resynchronize on fresh audio instead of replaying the tail.
        this.isFilling = true;
        return this.writeFrames;
      }

      this.writeFrame(output, frame, base, cursor - base);
      cursor += this.frameStep;
    }

    return cursor;
  }

  /** Writes one linearly interpolated frame from the ring into every output channel. */
  private writeFrame(output: Float32Array[], frame: number, base: number, fraction: number): void {
    // Modulo rather than a bit mask: the cursors outgrow 32-bit bitwise math within a day.
    const index = base % RING_CAPACITY_FRAMES;
    const nextIndex = (base + 1) % RING_CAPACITY_FRAMES;

    for (let channel = 0; channel < output.length; channel++) {
      const ring = this.ring[Math.min(channel, this.ring.length - 1)];
      const current = ring[index];
      output[channel][frame] = current + (ring[nextIndex] - current) * fraction;
    }
  }

  private handleMessage(data: Float32Array | string): void {
    if (data === PCM_PLAYER_STOP_MESSAGE) {
      this.isStopped = true;
      return;
    }
    if (typeof data === 'string') {
      return;
    }

    this.write(data);
  }

  private write(samples: Float32Array): void {
    const channelCount = this.captureChannelCount;
    const frames = Math.floor(samples.length / channelCount);

    for (let frame = 0; frame < frames; frame++) {
      const index = (this.writeFrames + frame) % RING_CAPACITY_FRAMES;
      const base = frame * channelCount;
      for (let channel = 0; channel < this.ring.length; channel++) {
        // Mono captures feed every output. Capture channels past the output count are dropped.
        const source = Math.min(channel, channelCount - 1);
        this.ring[channel][index] = samples[base + source];
      }
    }
    this.writeFrames += frames;

    // Keep latency bounded when the reader falls behind: jump to the newest prebuffered audio.
    if (this.writeFrames - this.readFrames > MAX_BUFFERED_FRAMES) {
      this.readFrames = this.writeFrames - PREBUFFER_FRAMES;
    }
  }
}

registerProcessor(PCM_PLAYER_PROCESSOR_NAME, PcmPlayerProcessor);

/*
 * Helpers.
 */

function writeSilence(output: Float32Array[], from: number, to: number): void {
  for (let channel = 0; channel < output.length; channel++) {
    output[channel].fill(0, from, to);
  }
}
