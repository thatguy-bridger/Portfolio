import { useState } from 'react';
import { Input } from './ui/Input';
import { Switch } from './ui/Switch';
import { sanitizePath, type CustomPage, type TileLink } from '../data/siteData';

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
  const matched = pages?.find((p) => p.path === value.path);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Switch
        options={['None', 'External', 'Page']}
        value={LABEL[value.type]}
        onChange={(label) => {
          const type = TYPE_FROM_LABEL[label];
          onChange(type === 'none' ? { type } : type === 'external' ? { type, url: value.url ?? '' } : { type, path: value.path ?? '' });
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
            label="Page path"
            placeholder="school/clubs/justserve"
            list={pages ? listId : undefined}
            value={value.path ?? ''}
            onChange={(e) => onChange({ type: 'internal', path: sanitizePath(e.target.value) })}
          />
          {pages && (
            <datalist id={listId}>
              {pages.map((p) => (
                <option key={p.id} value={p.path}>
                  {p.title}
                </option>
              ))}
            </datalist>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {`/${value.path || '…'}`}
            {pages && !matched && value.path && ' — not created yet, add it from the Pages tab'}
          </span>
        </div>
      )}
    </div>
  );
}
