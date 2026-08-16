import { Badge, type BadgeColor } from '../components/ui/Badge';
import { Editable } from '../components/Editable';
import { useReveal } from '../design-system/useReveal';
import type { SiteData, SiteSkill } from '../data/siteData';

const COLOR_CYCLE: BadgeColor[] = ['indigo', 'purple', 'orange', 'pink', 'green', 'red'];

export function About({
  about,
  editable = false,
  onChange,
}: {
  about: SiteData['about'];
  editable?: boolean;
  onChange?: (about: SiteData['about']) => void;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  function removeSkill(index: number) {
    onChange?.({ ...about, skills: about.skills.filter((_, i) => i !== index) });
  }

  function addSkill() {
    const color = COLOR_CYCLE[about.skills.length % COLOR_CYCLE.length];
    const skill: SiteSkill = { label: 'New skill', color };
    onChange?.({ ...about, skills: [...about.skills, skill] });
  }

  function renameSkill(index: number, label: string) {
    onChange?.({ ...about, skills: about.skills.map((s, i) => (i === index ? { ...s, label } : s)) });
  }

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
          <Editable
            editable={editable}
            as="p"
            multiline
            value={about.text}
            onCommit={(v) => onChange?.({ ...about, text: v })}
            style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 20, fontFamily: 'var(--font-body)' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {about.skills.map((s, i) => (
              <span key={`${s.label}-${i}`} style={{ position: 'relative', display: 'inline-flex' }}>
                {editable ? (
                  <Editable
                    editable
                    value={s.label}
                    onCommit={(v) => renameSkill(i, v)}
                    style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 'var(--radius-pill)', background: `var(--${s.color}-500)`, color: '#fff' }}
                  />
                ) : (
                  <Badge color={s.color}>{s.label}</Badge>
                )}
                {editable && (
                  <button
                    onClick={() => removeSkill(i)}
                    title="Remove"
                    style={{ marginLeft: 2, border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
            {editable && (
              <button
                onClick={addSkill}
                style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 'var(--radius-pill)', border: '1px dashed var(--border-strong)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                + Add
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
