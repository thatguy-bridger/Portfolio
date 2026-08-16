import { Badge } from '../components/ui/Badge';
import { useReveal } from '../design-system/useReveal';

const SKILLS: Array<{ label: string; color: 'indigo' | 'purple' | 'orange' | 'pink' | 'green' }> = [
  { label: 'Product design', color: 'indigo' },
  { label: 'Design systems', color: 'purple' },
  { label: 'Prototyping', color: 'orange' },
  { label: 'Front-end', color: 'green' },
  { label: 'Brand', color: 'pink' },
];

export function About() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section id="about" style={{ padding: '120px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div
        ref={ref}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: 48,
          alignItems: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(16px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <div
          style={{
            aspectRatio: '1',
            borderRadius: 'var(--radius-2xl)',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--purple-600))',
            opacity: 0.85,
          }}
        />
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>About</h2>
          <p style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 20, fontFamily: 'var(--font-body)' }}>
            I'm a product designer who ships. Ten years across fintech, travel, and creative tools — I care most
            about the gap between a good idea and a good product, and closing it fast without losing the craft.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SKILLS.map((s) => (
              <Badge key={s.label} color={s.color}>
                {s.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
