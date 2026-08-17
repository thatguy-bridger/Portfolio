import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from './client';

const MESSAGES_COLLECTION = 'messages';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt?: Timestamp;
}

/** Submitted by a visitor from the public Contact form — no auth required, validated by firestore.rules. */
export async function submitContactMessage(input: { name: string; email: string; message: string }): Promise<void> {
  await addDoc(collection(getFirebaseDb(), MESSAGES_COLLECTION), {
    name: input.name.slice(0, 120),
    email: input.email.slice(0, 200),
    message: input.message.slice(0, 4000),
    read: false,
    createdAt: serverTimestamp(),
  });
}

/** Owner-only inbox feed, newest first. */
export function subscribeMessages(onChange: (messages: ContactMessage[]) => void) {
  const q = query(collection(getFirebaseDb(), MESSAGES_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ContactMessage, 'id'>) })));
  });
}

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), MESSAGES_COLLECTION, id), { read });
}

export async function deleteMessage(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), MESSAGES_COLLECTION, id));
}
