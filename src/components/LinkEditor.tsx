import { Input } from './ui/Input';
import { Switch } from './ui/Switch';
import { slugify, type TileLink } from '../data/siteData';

const LABEL: Record<TileLink['type'], string> = { none: 'None', external: 'External', internal: 'Page' };
const TYPE_FROM_LABEL: Record<string, TileLink['type']> = { None: 'none', External: 'external', Page: 'internal' };

export function LinkEditor({ value, onChange }: { value: TileLink; onChange: (link: TileLink) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Switch
        options={['None', 'External', 'Page']}
        value={LABEL[value.type]}
        onChange={(label) => {
          const type = TYPE_FROM_LABEL[label];
          onChange(type === 'none' ? { type } : type === 'external' ? { type, url: value.url ?? '' } : { type, slug: value.slug ?? '' });
        }}
      />
      {value.type === 'external' && (
        <Input
          label="URL"
          placeholder="https://…"
          value={value.url ?? ''}
          onChange={(e) => onChange({ type: 'external', url: e.target.value })}
        />
      )}
      {value.type === 'internal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Input
            label="Page URL name"
            placeholder="woodworking"
            value={value.slug ?? ''}
            onChange={(e) => onChange({ type: 'internal', slug: slugify(e.target.value) })}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            portfolio.bridgerjones.com/mywork/{value.slug || '…'}
          </span>
        </div>
      )}
    </div>
  );
}
