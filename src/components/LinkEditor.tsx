import { useState } from 'react';
import { Input } from './ui/Input';
import { Switch } from './ui/Switch';
import { slugify, type CustomPage, type TileLink } from '../data/siteData';

const LABEL: Record<TileLink['type'], string> = { none: 'None', external: 'External', internal: 'Page' };
const TYPE_FROM_LABEL: Record<string, TileLink['type']> = { None: 'none', External: 'external', Page: 'internal' };

let datalistCounter = 0;

export function LinkEditor({
  value,
  onChange,
  pages,
}: {
  value: TileLink;
  onChange: (link: TileLink) => void;
  /** Existing custom pages, offered as autocomplete suggestions for the "Page" link type. */
  pages?: CustomPage[];
}) {
  const listId = useState(() => `pages-${++datalistCounter}`)[0];
  const matched = pages?.find((p) => p.slug === value.slug);

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
            list={pages ? listId : undefined}
            value={value.slug ?? ''}
            onChange={(e) => onChange({ type: 'internal', slug: slugify(e.target.value) })}
          />
          {pages && (
            <datalist id={listId}>
              {pages.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </datalist>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {`/mywork/${value.slug || '…'}`}
            {pages && !matched && value.slug && ' — new page, will be created on save'}
          </span>
        </div>
      )}
    </div>
  );
}
