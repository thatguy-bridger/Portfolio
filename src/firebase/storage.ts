import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseStorage } from './client';
import { compressImageToBlob } from '../design-system/image';

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
