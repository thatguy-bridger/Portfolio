import { useEffect, useState } from 'react';
import { subscribeMessages, type ContactMessage } from '../firebase/messages';

/** Live-subscribes to the contact-form inbox — shared by the Builder topbar badge and the Inbox page so there's only one Firestore listener. */
export function useMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeMessages((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { messages, loading, unreadCount: messages.filter((m) => !m.read).length };
}
