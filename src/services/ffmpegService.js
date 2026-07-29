import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance = null;
let loadPromise = null;

export const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes > 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
};

/**
 * Initializes FFmpeg singleton.
 *
 * Key insight: @ffmpeg/ffmpeg v0.12 spawns an internal Web Worker of type "module".
 * That worker tries to dynamically `import()` the coreURL we pass.
 * For that dynamic import to succeed inside the worker, the URL must point to a
 * valid ES module that exports `createFFmpegCore` as its default export.
 *
 * The @ffmpeg/core ESM build (`dist/esm/ffmpeg-core.js`) satisfies this requirement.
 * We use `toBlobURL` to download it from a CDN and convert it to a same-origin
 * blob URL, which avoids CORS/COEP issues while keeping the module structure intact.
 */
export async function getFFmpeg(onStatusUpdate, onLog, onProgress) {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    onStatusUpdate?.({ status: 'loading', text: 'Iniciando descarga del motor...', pct: 5 });

    const ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
      onLog?.(message);
    });

    ffmpeg.on('progress', ({ progress }) => {
      onProgress?.(Math.min(100, Math.max(0, Math.round(progress * 100))));
    });

    // Use the ESM build from unpkg CDN — this is what the worker can `import()`.
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    try {
      onStatusUpdate?.({ status: 'loading', text: 'Descargando ffmpeg-core.js...', pct: 15 });
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');

      onStatusUpdate?.({ status: 'loading', text: 'Descargando ffmpeg-core.wasm (~32 MB)...', pct: 40 });
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

      onStatusUpdate?.({ status: 'loading', text: 'Inicializando motor WebAssembly...', pct: 85 });

      await ffmpeg.load({
        coreURL,
        wasmURL,
      });

      ffmpegInstance = ffmpeg;
      onStatusUpdate?.({ status: 'ready', text: 'Motor listo', pct: 100 });
      return ffmpeg;
    } catch (err) {
      console.error('Error al cargar FFmpeg WASM:', err);
      onStatusUpdate?.({
        status: 'error',
        text: 'Error al cargar · clic para reintentar',
        pct: 0,
        error: err.message,
      });
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

/**
 * Runs compression on a video file with specified parameters.
 */
export async function compressVideo({ file, settings, onLog, onProgress, onStatus }) {
  onStatus?.('Preparando motor...');
  const ffmpeg = await getFFmpeg();

  // Determine file extension
  const extMatch = file.name.match(/\.[a-zA-Z0-9]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '.mp4';
  const inputName = `input_${Date.now()}${ext}`;
  const outputName = `output_${Date.now()}.mp4`;

  onStatus?.('Cargando video en memoria del navegador...');
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Build FFmpeg command arguments
  const args = ['-i', inputName];

  // Video Codec & Quality
  args.push('-c:v', 'libx264');
  args.push('-crf', String(settings.crf));
  args.push('-preset', settings.presetSpeed || 'veryfast');
  args.push('-pix_fmt', 'yuv420p');

  // Resolution Scaling
  if (settings.width && settings.width > 0) {
    args.push('-vf', `scale='min(${settings.width},iw)':-2`);
  }

  // Target FPS if specified
  if (settings.fps && settings.fps > 0) {
    args.push('-r', String(settings.fps));
  }

  // Audio Codec & Bitrate
  if (settings.muteAudio) {
    args.push('-an');
  } else {
    args.push('-c:a', 'aac');
    args.push('-b:a', settings.audioBitrate || '128k');
  }

  // Fast start for web streaming
  args.push('-movflags', '+faststart');
  args.push(outputName);

  onStatus?.('Comprimiendo video con FFmpeg...');
  await ffmpeg.exec(args);

  onStatus?.('Generando archivo final...');
  const data = await ffmpeg.readFile(outputName);
  const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });

  // Cleanup temporary files in WASM memory
  try {
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch (e) {
    console.warn('Non-critical cleanup warning:', e);
  }

  return compressedBlob;
}
