import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useReveal } from '../design-system/useReveal';

export function Contact() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [email, setEmail] = useState('');

  return (
    <section id="contact" style={{ padding: '120px 24px 80px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
      <div
        ref={ref}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(16px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <h2 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12 }}>Let's work together</h2>
        <p style={{ fontSize: 16, color: 'var(--text-body)', marginBottom: 28, fontFamily: 'var(--font-body)' }}>
          Have a project in mind? Drop your email and I'll get back to you within a day.
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 420, margin: '0 auto' }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" variant="primary">
            Say hello
          </Button>
        </form>
        <footer
          style={{
            marginTop: 80,
            paddingTop: 24,
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            color: 'var(--text-muted)',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
          }}
        >
          <span>© {new Date().getFullYear()} Jane Doe</span>
          <span>Built with Portfolio Builder</span>
        </footer>
      </div>
    </section>
  );
}
