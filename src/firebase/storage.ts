import { getDownloadURL, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { getFirebaseStorage } from './client';
import { compressImageToBlob } from '../design-system/image';
import { MODEL_FORMATS, type Model3DFormat } from '../data/siteData';

function newFileId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface UploadedImage {
  url: string;
  width: number;
  height: number;
}

/** Compresses and uploads an image file, returning its public download URL and natural pixel size. */
export async function uploadImage(file: File): Promise<UploadedImage> {
  const { blob, width, height } = await compressImageToBlob(file);
  const path = `uploads/${newFileId()}.jpg`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(storageRef);
  return { url, width, height };
}

const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.ogg'];

export interface UploadedVideo {
  url: string;
  fileName: string;
}

/** Uploads a video file as-is and reports progress, since these can be very large. */
export function uploadVideo(file: File, onProgress?: (pct: number) => void): Promise<UploadedVideo> {
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  if (!VIDEO_EXTENSIONS.includes(ext)) {
    return Promise.reject(new Error(`Unsupported file type — use one of: ${VIDEO_EXTENSIONS.join(', ')}`));
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return Promise.reject(new Error('That file is over the 200MB limit.'));
  }
  const path = `videos/${newFileId()}${ext}`;
  const storageRef = ref(getFirebaseStorage(), path);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'video/mp4' });
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(storageRef);
        resolve({ url, fileName: file.name });
      },
    );
  });
}

const MAX_MODEL_BYTES = 50 * 1024 * 1024;

export interface UploadedModel {
  url: string;
  format: Model3DFormat;
  fileName: string;
}

/** Uploads a 3D model file as-is (no client-side conversion) and reports progress, since these can be much larger than a photo. */
export function uploadModel(file: File, onProgress?: (pct: number) => void): Promise<UploadedModel> {
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}` as Model3DFormat;
  if (!MODEL_FORMATS.includes(ext)) {
    return Promise.reject(new Error(`Unsupported file type — use one of: ${MODEL_FORMATS.join(', ')}`));
  }
  if (file.size > MAX_MODEL_BYTES) {
    return Promise.reject(new Error('That file is over the 50MB limit.'));
  }
  const path = `models/${newFileId()}${ext}`;
  const storageRef = ref(getFirebaseStorage(), path);
  const task = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(storageRef);
        resolve({ url, format: ext, fileName: file.name });
      },
    );
  });
}
