// The Contact Form block (Phase 4) — the one block type with real client
// behavior of its own (a submission round-trip to /api/contact) rather than
// just editable text/image fields, so unlike simpleBlocks.tsx's stateless
// functions this one owns local state (the draft values + submit status).
//
// editable=true (inside CanvasEditor) renders the same markup but with the
// inputs disabled — an admin can click-to-edit the heading/subheading same
// as any other inline field, but the form itself is inert so building a page
// never accidentally fires a real submission against /api/contact.
import { useState } from 'react';
import { type BlockComponentProps, str } from './types';
import { EditableText } from './fields/EditableText';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ContactFormBlockView({ props, editable, onFieldChange }: BlockComponentProps) {
  const heading = str(props, 'heading', 'Get in touch');
  const subheading = str(props, 'subheading');
  const submitLabel = str(props, 'submitLabel', 'Send message');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editable) return; // inert on the canvas — see file header
    setFieldError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFieldError('Please fill in every field.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError('That email address doesn’t look right.');
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setFieldError(typeof body.error === 'string' ? body.error : 'Something went wrong — please try again.');
        setStatus('error');
        return;
      }
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setFieldError('Network error — please try again.');
      setStatus('error');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-default)',
    background: 'var(--surface-card)',
    color: 'var(--text-heading)',
    fontSize: 14,
    fontFamily: 'inherit',
  };

  if (status === 'success' && !editable) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8, textAlign: 'center', padding: 16 }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>Thanks — message sent.</p>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>I'll get back to you soon.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
      <EditableText
        value={heading}
        onCommit={(v) => onFieldChange('heading', v)}
        placeholder="Get in touch"
        as="h3"
        style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-heading)' }}
      />
      {(editable || subheading) && (
        <EditableText value={subheading} onCommit={(v) => onFieldChange('subheading', v)} placeholder="Subheading (optional)" style={{ fontSize: 14, color: 'var(--text-muted)' }} />
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={editable} style={inputStyle} autoComplete="name" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={editable} style={inputStyle} autoComplete="email" />
        <textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} disabled={editable} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        {fieldError && !editable && (
          <p role="alert" style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{fieldError}</p>
        )}
        <button
          type="submit"
          disabled={editable || status === 'submitting'}
          style={{
            alignSelf: 'flex-start',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            padding: '10px 22px',
            fontSize: 14,
            fontWeight: 600,
            cursor: editable ? 'default' : 'pointer',
            background: 'var(--accent-gradient)',
            color: '#fff',
            boxShadow: 'var(--shadow-sm)',
            opacity: status === 'submitting' ? 0.7 : 1,
          }}
        >
          {status === 'submitting' ? 'Sending…' : submitLabel || 'Send message'}
        </button>
      </form>
    </div>
  );
}
