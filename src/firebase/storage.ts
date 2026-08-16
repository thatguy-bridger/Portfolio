import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseStorage } from './client';
import { compressImageToBlob } from '../design-system/image';

function newFileId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Compresses and uploads an image file, returning its public download URL. */
export async function uploadImage(file: File): Promise<string> {
  const blob = await compressImageToBlob(file);
  const path = `uploads/${newFileId()}.jpg`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}
