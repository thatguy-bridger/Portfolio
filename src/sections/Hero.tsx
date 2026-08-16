import { HeroCanvas } from '../components/HeroCanvas';
import { Button } from '../components/ui/Button';
import { Editable } from '../components/Editable';
import { useReveal } from '../design-system/useReveal';
import type { SiteData } from '../data/siteData';

export function Hero({
  hero,
  editable = false,
  onChange,
}: {
  hero: SiteData['hero'];
  editable?: boolean;
  onChange?: (hero: SiteData['hero']) => void;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  function patch(field: keyof SiteData['hero'], value: string) {
    onChange?.({ ...hero, [field]: value });
  }

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
        <Editable
          editable={editable}
          value={hero.eyebrow}
          onCommit={(v) => patch('eyebrow', v)}
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--accent-primary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        />
        <h1
          style={{
            fontSize: 'clamp(40px, 7vw, 76px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: 'var(--text-heading)',
          }}
        >
          <Editable editable={editable} as="span" value={hero.headlineStart} onCommit={(v) => patch('headlineStart', v)} />{' '}
          <Editable
            editable={editable}
            as="span"
            value={hero.headlineHighlight}
            onCommit={(v) => patch('headlineHighlight', v)}
            style={{
              background: 'linear-gradient(90deg, var(--accent-primary), var(--purple-400))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: editable ? undefined : 'transparent',
              WebkitTextFillColor: editable ? undefined : 'transparent',
            }}
          />{' '}
          <Editable editable={editable} as="span" value={hero.headlineEnd} onCommit={(v) => patch('headlineEnd', v)} />
        </h1>
        <Editable
          editable={editable}
          as="p"
          multiline
          value={hero.subtitle}
          onCommit={(v) => patch('subtitle', v)}
          style={{ fontSize: 18, color: 'var(--text-body)', margin: '20px auto 0', maxWidth: 520, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
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
