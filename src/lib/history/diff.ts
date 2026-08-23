// Field-level diff over two `PageSection[]` snapshots (the exact shape
// stored in pages.draft_blocks / pages.published_blocks / a
// revision_history row's `blocks` column — see 0001_init.sql,
// 0003_publish_history.sql). Deliberately hand-written over this specific
// shape rather than a general JSON-diff library: sections and blocks are
// matched by their stable `id` (not array index, which would misreport a
// mere reorder as a delete+add of every block after the moved one), and the
// output groups changes the way a human editing this content thinks about
// them — "this block's heading changed", not "path $[2].props.heading".
//
// Data-integrity note (see the color-clear-crashed-a-save bug this rewrite
// is explicitly trying not to repeat): a snapshot loaded out of Postgres
// jsonb can have `null`, a missing key, or (never from Postgres, but a
// defensive habit worth keeping) `undefined` for the same "not set" idea.
// `fieldsEqual`/`describeChange` below treat missing-key and `undefined` as
// the same value as an explicit `null` for comparison purposes — so
// "prop went from unset to unset" never renders as a phantom change — while
// still rendering a real null/undefined/'' distinctly in the before/after
// labels (formatFieldValue), so a genuine "cleared to empty" edit is still
// visible to the person reading the diff.

import type { CanvasBlock, PageSection } from '../blocks/types';

export interface FieldChange {
  key: string;
  before: unknown;
  after: unknown;
}

export interface BlockDiffEntry {
  id: string;
  kind: 'added' | 'removed' | 'changed';
  /** block type of the "after" state (or "before" state for a removal) */
  type: string;
  sectionId: string;
  sectionName: string;
  /** only present for kind === 'changed' — always non-empty when present */
  changes?: FieldChange[];
}

export interface SectionDiffEntry {
  id: string;
  kind: 'added' | 'removed' | 'changed' | 'unchanged';
  name: string;
  /** section-level (background/backgroundImage/minHeight/paddingY/name) field changes, when kind === 'changed' */
  changes?: FieldChange[];
}

export interface PageBlocksDiff {
  sections: SectionDiffEntry[];
  blocks: BlockDiffEntry[];
  /** true if anything at all differs — lets a caller render "No changes" instead of two empty lists */
  hasChanges: boolean;
}

/** Missing key, `undefined`, and `null` are all "nothing set" for comparison purposes — see file header. */
function normalizeForCompare(value: unknown): unknown {
  return value === undefined || value === null ? null : value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (na === nb) return true;
  if (typeof na !== typeof nb) return false;
  if (typeof na === 'object') {
    // Arrays/objects (e.g. a columns block's slot list) — deep-ish compare
    // via JSON serialization. Good enough here: everything in a block's
    // props/position is itself JSON-safe by construction (it round-trips
    // through Postgres jsonb), so this can't hit a value JSON.stringify
    // mishandles (a function, a Date, a cyclic ref, `undefined` nested
    // inside an object — the last of those JSON.stringify just drops,
    // which for a diff is the right behavior anyway: a dropped key already
    // reads as "not set" per normalizeForCompare above).
    try {
      return JSON.stringify(na) === JSON.stringify(nb);
    } catch {
      return false;
    }
  }
  return false;
}

/** Diffs two plain key/value bags (a block's `props`, or a section's own background/height/padding fields) and returns only the keys that actually differ. */
function diffFields(before: Record<string, unknown> | undefined, after: Record<string, unknown> | undefined): FieldChange[] {
  const b = before ?? {};
  const a = after ?? {};
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  const changes: FieldChange[] = [];
  for (const key of keys) {
    if (!valuesEqual(b[key], a[key])) changes.push({ key, before: b[key], after: a[key] });
  }
  return changes;
}

function diffPosition(before: CanvasBlock['position'] | undefined, after: CanvasBlock['position'] | undefined): FieldChange[] {
  if (!before || !after) return [];
  const changes: FieldChange[] = [];
  for (const axis of ['x', 'y', 'w', 'h'] as const) {
    if (before[axis] !== after[axis]) changes.push({ key: `position.${axis}`, before: before[axis], after: after[axis] });
  }
  return changes;
}

/** Every top-level block across every section, tagged with which section it lives in — the flat shape the block-level diff pass works over. */
function flattenBlocks(sections: PageSection[]): Array<{ block: CanvasBlock; sectionId: string; sectionName: string }> {
  const out: Array<{ block: CanvasBlock; sectionId: string; sectionName: string }> = [];
  for (const section of sections) {
    for (const block of section.blocks ?? []) out.push({ block, sectionId: section.id, sectionName: section.name });
  }
  return out;
}

const SECTION_META_KEYS = ['name', 'background', 'backgroundImage', 'minHeight', 'paddingY'] as const;

/**
 * Compares two page snapshots (`before` is the older revision, `after` the
 * newer one — pass `[]` for `before` to render an initial revision as
 * "everything added"). Never throws on a malformed/partial snapshot: any
 * non-array input is treated as an empty page rather than crashing the diff
 * render, same defensive stance as `isValidPageBlocks` (src/lib/pages.ts)
 * takes on the write side.
 */
export function diffPageBlocks(before: unknown, after: unknown): PageBlocksDiff {
  const beforeSections: PageSection[] = Array.isArray(before) ? (before as PageSection[]) : [];
  const afterSections: PageSection[] = Array.isArray(after) ? (after as PageSection[]) : [];

  const beforeById = new Map(beforeSections.map((s) => [s.id, s]));
  const afterById = new Map(afterSections.map((s) => [s.id, s]));
  const sectionIds = new Set([...beforeById.keys(), ...afterById.keys()]);

  const sections: SectionDiffEntry[] = [];
  for (const id of sectionIds) {
    const b = beforeById.get(id);
    const a = afterById.get(id);
    if (!b && a) {
      sections.push({ id, kind: 'added', name: a.name });
    } else if (b && !a) {
      sections.push({ id, kind: 'removed', name: b.name });
    } else if (b && a) {
      const metaBefore: Record<string, unknown> = {};
      const metaAfter: Record<string, unknown> = {};
      for (const key of SECTION_META_KEYS) {
        metaBefore[key] = (b as unknown as Record<string, unknown>)[key];
        metaAfter[key] = (a as unknown as Record<string, unknown>)[key];
      }
      const changes = diffFields(metaBefore, metaAfter);
      sections.push(changes.length > 0 ? { id, kind: 'changed', name: a.name, changes } : { id, kind: 'unchanged', name: a.name });
    }
  }
  // Stable, readable order: as they appear in the newer snapshot, then any
  // sections that only existed in the older one (pure removals) appended.
  sections.sort((x, y) => {
    const ai = afterSections.findIndex((s) => s.id === x.id);
    const bi = afterSections.findIndex((s) => s.id === y.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const beforeBlocks = flattenBlocks(beforeSections);
  const afterBlocks = flattenBlocks(afterSections);
  const beforeBlockById = new Map(beforeBlocks.map((x) => [x.block.id, x]));
  const afterBlockById = new Map(afterBlocks.map((x) => [x.block.id, x]));
  const blockIds = new Set([...beforeBlockById.keys(), ...afterBlockById.keys()]);

  const blocks: BlockDiffEntry[] = [];
  for (const id of blockIds) {
    const b = beforeBlockById.get(id);
    const a = afterBlockById.get(id);
    if (!b && a) {
      blocks.push({ id, kind: 'added', type: a.block.type, sectionId: a.sectionId, sectionName: a.sectionName });
    } else if (b && !a) {
      blocks.push({ id, kind: 'removed', type: b.block.type, sectionId: b.sectionId, sectionName: b.sectionName });
    } else if (b && a) {
      const propChanges = diffFields(b.block.props, a.block.props);
      const positionChanges = diffPosition(b.block.position, a.block.position);
      const otherChanges: FieldChange[] = [];
      if (b.block.type !== a.block.type) otherChanges.push({ key: 'type', before: b.block.type, after: a.block.type });
      if (!!b.block.locked !== !!a.block.locked) otherChanges.push({ key: 'locked', before: !!b.block.locked, after: !!a.block.locked });
      if (b.block.zIndex !== a.block.zIndex) otherChanges.push({ key: 'zIndex', before: b.block.zIndex, after: a.block.zIndex });
      const changes = [...otherChanges, ...positionChanges, ...propChanges];
      if (changes.length > 0) {
        blocks.push({ id, kind: 'changed', type: a.block.type, sectionId: a.sectionId, sectionName: a.sectionName, changes });
      }
    }
  }
  blocks.sort((x, y) => {
    const ai = afterBlocks.findIndex((v) => v.block.id === x.id);
    const bi = afterBlocks.findIndex((v) => v.block.id === y.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const hasChanges = sections.some((s) => s.kind !== 'unchanged') || blocks.length > 0;
  return { sections, blocks, hasChanges };
}

/** Human-readable rendering of a field value for the diff UI — never throws on undefined/null/objects. */
export function formatFieldValue(value: unknown): string {
  if (value === undefined || value === null) return '(not set)';
  if (value === '') return '(empty)';
  if (typeof value === 'string') return value.length > 80 ? `${value.slice(0, 80)}…` : value;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  try {
    const json = JSON.stringify(value);
    return json.length > 80 ? `${json.slice(0, 80)}…` : json;
  } catch {
    return String(value);
  }
}
