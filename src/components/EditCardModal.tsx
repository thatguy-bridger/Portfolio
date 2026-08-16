import { Link } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { TileElements } from './TileElements';
import { LinkEditor } from './LinkEditor';
import type { ProjectPage, SiteTile } from '../data/siteData';

function upsertPage(pages: ProjectPage[], slug: string, patch: Partial<ProjectPage>): ProjectPage[] {
  const idx = pages.findIndex((p) => p.slug === slug);
  if (idx === -1) return [...pages, { slug, title: slug, elements: [], ...patch }];
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
  projectPages,
  onChangeProjectPages,
}: {
  open: boolean;
  onClose: () => void;
  tile: SiteTile;
  onChangeTile: (patch: Partial<SiteTile>) => void;
  projectPages: ProjectPage[];
  onChangeProjectPages: (pages: ProjectPage[]) => void;
}) {
  const slug = tile.link.type === 'internal' ? tile.link.slug : undefined;
  const page = slug ? (projectPages.find((p) => p.slug === slug) ?? { slug, title: tile.title, elements: [] }) : null;

  return (
    <Modal open={open} title="Edit card" onClose={onClose}>
      <Section label="Card content">
        <TileElements elements={tile.elements} editable onChange={(elements) => onChangeTile({ elements })} />
      </Section>

      <Section label="Link">
        <LinkEditor value={tile.link} onChange={(link) => onChangeTile({ link })} />
      </Section>

      {page && slug && (
        <Section label="Page content">
          <Input label="Page title" value={page.title} onChange={(e) => onChangeProjectPages(upsertPage(projectPages, slug, { title: e.target.value }))} />
          <TileElements
            elements={page.elements}
            editable
            onChange={(elements) => onChangeProjectPages(upsertPage(projectPages, slug, { elements }))}
          />
          <Link to={`/mywork/${slug}`} target="_blank" style={{ fontSize: 12, color: 'var(--accent-primary)' }}>
            Preview page ↗
          </Link>
        </Section>
      )}
    </Modal>
  );
}
