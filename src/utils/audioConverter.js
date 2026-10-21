/**
 * Converts any browser AudioBlob (webm, mp4, ogg) to a 16kHz mono WAV Blob
 * using the Web Audio API decoding + fast in-memory downsampling.
 * No OfflineAudioContext quirks, no FFmpeg or server libs needed.
 */
export async function blobToWav(blob) {
  const arrayBuffer = await blob.arrayBuffer();

  // Use AudioContext to decode browser audio (WebM, Opus, etc.) into PCM
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser.');
  }

  const audioCtx = new AudioContextClass();

  let audioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (e) {
    try {
      await audioCtx.close();
    } catch (_) {}
    throw new Error('Browser could not decode audio: ' + (e?.message || e));
  }

  try {
    await audioCtx.close();
  } catch (_) {}

  const inputSampleRate = audioBuffer.sampleRate;
  const targetSampleRate = 16000;
  const numChannels = 1; // mono

  // Mix down to mono
  let channelData;
  if (audioBuffer.numberOfChannels === 1) {
    channelData = audioBuffer.getChannelData(0);
  } else {
    channelData = new Float32Array(audioBuffer.length);
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const chData = audioBuffer.getChannelData(ch);
      for (let i = 0; i < audioBuffer.length; i++) {
        channelData[i] += chData[i] / audioBuffer.numberOfChannels;
      }
    }
  }

  // Downsample to 16kHz using fast linear interpolation
  const samples16k = downsampleTo16k(channelData, inputSampleRate, targetSampleRate);

  console.log(`[audioConverter] Decoded: ${audioBuffer.duration.toFixed(2)}s at ${inputSampleRate}Hz → ${samples16k.length} samples at ${targetSampleRate}Hz`);

  // Encode as standard 16-bit PCM WAV
  const wavBuffer = encodeWAV(samples16k, targetSampleRate, numChannels);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function downsampleTo16k(channelData, inputSampleRate, targetSampleRate = 16000) {
  if (inputSampleRate === targetSampleRate) return channelData;
  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(channelData.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const origIndex = i * ratio;
    const indexFloor = Math.floor(origIndex);
    const indexCeil = Math.min(indexFloor + 1, channelData.length - 1);
    const weight = origIndex - indexFloor;
    result[i] = channelData[indexFloor] * (1 - weight) + channelData[indexCeil] * weight;
  }
  return result;
}

function encodeWAV(samples, sampleRate, numChannels) {
  const bytesPerSample = 2; // 16-bit PCM
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  /* RIFF chunk */
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');

  /* fmt sub-chunk */
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);                                        // PCM chunk size
  view.setUint16(20, 1, true);                                         // PCM format (1 = linear)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
  view.setUint16(32, numChannels * bytesPerSample, true);              // block align
  view.setUint16(34, 16, true);                                        // bits per sample

  /* data sub-chunk */
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);

  /* Convert Float32 PCM → Int16 */
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return buffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
