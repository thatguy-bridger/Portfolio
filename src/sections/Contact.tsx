import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Editable } from '../components/Editable';
import { ContactForm } from '../components/ContactForm';
import { useReveal } from '../design-system/useReveal';
import type { SiteData } from '../data/siteData';

export function Contact({
  contact,
  editable = false,
  onChange,
}: {
  contact: SiteData['contact'];
  editable?: boolean;
  onChange?: (contact: SiteData['contact']) => void;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [showForm, setShowForm] = useState(false);

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
        <Editable
          editable={editable}
          as="h2"
          value={contact.heading}
          onCommit={(v) => onChange?.({ ...contact, heading: v })}
          style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12 }}
        />
        <Editable
          editable={editable}
          as="p"
          multiline
          value={contact.subtext}
          onCommit={(v) => onChange?.({ ...contact, subtext: v })}
          style={{ fontSize: 16, color: 'var(--text-body)', marginBottom: 28, fontFamily: 'var(--font-body)' }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Editable
            editable={editable}
            value={contact.email}
            onCommit={(v) => onChange?.({ ...contact, email: v })}
            style={{
              fontSize: 15,
              fontWeight: 600,
              padding: '11px 22px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-heading)',
            }}
          />
          {!editable && !showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Say hello
            </Button>
          )}
        </div>
        {!editable && showForm && <ContactForm />}
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
          <span>© {new Date().getFullYear()}</span>
          <span>Built with Portfolio Builder</span>
        </footer>
      </div>
    </section>
  );
}
