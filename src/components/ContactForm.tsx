import { useState } from 'react';
import { Button } from './ui/Button';
import { submitContactMessage } from '../firebase/messages';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)',
  color: 'var(--text-heading)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
};

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return; // a bot filled the hidden field — silently drop
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setStatus('sending');
    try {
      await submitContactMessage({ name: name.trim(), email: email.trim(), message: message.trim() });
      setStatus('sent');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ padding: '20px 0', color: 'var(--text-body)', fontSize: 15 }}>
        Thanks — your message is on its way. I'll get back to you soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420, margin: '20px auto 0', textAlign: 'left' }}>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />
      <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
      <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
      <textarea
        placeholder="What's on your mind?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={4}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-body)' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button variant="primary" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </Button>
        {status === 'error' && <span style={{ fontSize: 13, color: 'var(--red-500)' }}>Couldn't send — try again in a moment.</span>}
      </div>
    </form>
  );
}
