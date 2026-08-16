import { Modal } from './ui/Modal';
import { TileElements } from './TileElements';
import { LinkEditor } from './LinkEditor';
import type { CustomPage, SiteTile } from '../data/siteData';

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
}: {
  open: boolean;
  onClose: () => void;
  tile: SiteTile;
  onChangeTile: (patch: Partial<SiteTile>) => void;
  pages: CustomPage[];
}) {
  return (
    <Modal open={open} title="Edit card" onClose={onClose}>
      <Section label="Card content">
        <TileElements elements={tile.elements} editable onChange={(elements) => onChangeTile({ elements })} />
      </Section>

      <Section label="Link">
        <LinkEditor value={tile.link} onChange={(link) => onChangeTile({ link })} pages={pages} />
      </Section>
    </Modal>
  );
}
