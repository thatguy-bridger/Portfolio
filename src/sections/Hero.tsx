import { HeroCanvas } from '../components/HeroCanvas';
import { Button } from '../components/ui/Button';
import { useReveal } from '../design-system/useReveal';

export function Hero() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '0 24px',
      }}
    >
      <HeroCanvas />
      <div
        ref={ref}
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 780,
          textAlign: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.8s var(--ease-standard), transform 0.8s var(--ease-standard)',
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--accent-primary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Product Designer
        </div>
        <h1
          style={{
            fontSize: 'clamp(40px, 7vw, 76px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: 'var(--text-heading)',
          }}
        >
          Designing calm,{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, var(--accent-primary), var(--purple-400))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            useful
          </span>{' '}
          software.
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-body)', margin: '20px auto 0', maxWidth: 520, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
          I partner with startups to turn fuzzy ideas into shipped products — from first sketch to design system.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
          <Button variant="primary" size="lg" onClick={() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' })}>
            See my work
          </Button>
          <Button variant="ghost" size="lg" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
            Get in touch
          </Button>
        </div>
      </div>
    </section>
  );
}
