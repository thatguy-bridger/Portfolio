import { Link } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { TileElements } from './TileElements';
import { LinkEditor } from './LinkEditor';
import { PageBlocks } from './PageBlocks';
import { newPageId, type CustomPage, type SiteTile } from '../data/siteData';

function upsertPage(pages: CustomPage[], slug: string, patch: Partial<CustomPage>): CustomPage[] {
  const idx = pages.findIndex((p) => p.slug === slug);
  if (idx === -1) return [...pages, { id: newPageId(), slug, title: slug, blocks: [], ...patch }];
  return pages.map((p, i) => (i === idx ? { ...p, ...patch } : p));
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-body)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </span>
      {children}
    </div>
  );
}

export function EditCardModal({
  open,
  onClose,
  tile,
  onChangeTile,
  pages,
  onChangePages,
}: {
  open: boolean;
  onClose: () => void;
  tile: SiteTile;
  onChangeTile: (patch: Partial<SiteTile>) => void;
  pages: CustomPage[];
  onChangePages: (pages: CustomPage[]) => void;
}) {
  const slug = tile.link.type === 'internal' ? tile.link.slug : undefined;
  const page = slug ? pages.find((p) => p.slug === slug) : null;

  return (
    <Modal open={open} title="Edit card" onClose={onClose} size={slug ? 'lg' : 'md'}>
      <Section label="Card content">
        <TileElements elements={tile.elements} editable onChange={(elements) => onChangeTile({ elements })} />
      </Section>

      <Section label="Link">
        <LinkEditor value={tile.link} onChange={(link) => onChangeTile({ link })} pages={pages} />
      </Section>

      {slug && (
        <Section label="Page content">
          <Input
            label="Page title"
            value={page?.title ?? slug}
            onChange={(e) => onChangePages(upsertPage(pages, slug, { title: e.target.value }))}
          />
          <PageBlocks
            blocks={page?.blocks ?? []}
            editable
            pages={pages}
            onChange={(blocks) => onChangePages(upsertPage(pages, slug, { blocks }))}
          />
          <Link to={`/mywork/${slug}`} target="_blank" style={{ fontSize: 12, color: 'var(--accent-primary)', display: 'inline-block', marginTop: 12 }}>
            Preview page ↗
          </Link>
        </Section>
      )}
    </Modal>
  );
}
