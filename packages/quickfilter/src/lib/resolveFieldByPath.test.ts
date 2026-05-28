import { describe, it, expect } from 'vitest';
import { resolveFieldByPath } from './resolveFieldByPath';
import type { ClientField } from 'payload';

// Helper to create mock fields
const selectField = (name: string, options: string[] = ['a', 'b']): ClientField =>
  ({
    type: 'select',
    name,
    label: name,
    options: options.map((v) => ({ label: v, value: v })),
  }) as unknown as ClientField;

const dateField = (name: string): ClientField =>
  ({
    type: 'date',
    name,
    label: name,
  }) as unknown as ClientField;

const checkboxField = (name: string): ClientField =>
  ({
    type: 'checkbox',
    name,
    label: name,
  }) as unknown as ClientField;

const groupField = (name: string, fields: ClientField[]): ClientField =>
  ({
    type: 'group',
    name,
    label: name,
    fields,
  }) as unknown as ClientField;

const arrayField = (name: string, fields: ClientField[]): ClientField =>
  ({
    type: 'array',
    name,
    label: name,
    fields,
  }) as unknown as ClientField;

const blocksField = (
  name: string,
  blocks: { slug: string; fields: ClientField[] }[],
): ClientField =>
  ({
    type: 'blocks',
    name,
    label: name,
    blocks,
  }) as unknown as ClientField;

const rowField = (fields: ClientField[]): ClientField =>
  ({
    type: 'row',
    fields,
  }) as unknown as ClientField;

describe('resolveFieldByPath', () => {
  describe('group field resolution', () => {
    it('resolves a simple group.subField path', () => {
      const fields: ClientField[] = [
        groupField('address', [selectField('city', ['tel-aviv', 'jerusalem'])]),
      ];

      const result = resolveFieldByPath(fields, 'address.city');
      expect(result).not.toBeNull();
      expect(result!.field.type).toBe('select');
      expect((result!.field as any).name).toBe('city');
      expect(result!.path).toBe('address.city');
    });

    it('resolves multi-level group path (meta.seo.title)', () => {
      const fields: ClientField[] = [
        groupField('meta', [groupField('seo', [selectField('title', ['home', 'about'])])]),
      ];

      const result = resolveFieldByPath(fields, 'meta.seo.title');
      expect(result).not.toBeNull();
      expect(result!.field.type).toBe('select');
      expect((result!.field as any).name).toBe('title');
      expect(result!.path).toBe('meta.seo.title');
    });

    it('resolves a date field inside a group', () => {
      const fields: ClientField[] = [groupField('schedule', [dateField('startDate')])];

      const result = resolveFieldByPath(fields, 'schedule.startDate');
      expect(result).not.toBeNull();
      expect(result!.field.type).toBe('date');
      expect(result!.path).toBe('schedule.startDate');
    });

    it('resolves a checkbox field inside a group', () => {
      const fields: ClientField[] = [groupField('settings', [checkboxField('isActive')])];

      const result = resolveFieldByPath(fields, 'settings.isActive');
      expect(result).not.toBeNull();
      expect(result!.field.type).toBe('checkbox');
      expect(result!.path).toBe('settings.isActive');
    });
  });

  describe('array field resolution', () => {
    it('resolves items.title (without numeric index)', () => {
      const fields: ClientField[] = [arrayField('items', [selectField('title')])];

      const result = resolveFieldByPath(fields, 'items.title');
      expect(result).not.toBeNull();
      expect(result!.field.type).toBe('select');
      expect((result!.field as any).name).toBe('title');
      expect(result!.path).toBe('items.title');
    });

    it('resolves items.0.title (with numeric index) - skips the index', () => {
      const fields: ClientField[] = [arrayField('items', [selectField('title')])];

      const result = resolveFieldByPath(fields, 'items.0.title');
      expect(result).not.toBeNull();
      expect(result!.field.type).toBe('select');
      expect((result!.field as any).name).toBe('title');
      expect(result!.path).toBe('items.title');
    });

    it('resolves items.42.status (arbitrary numeric index)', () => {
      const fields: ClientField[] = [arrayField('items', [selectField('status')])];

      const result = resolveFieldByPath(fields, 'items.42.status');
      expect(result).not.toBeNull();
      expect(result!.path).toBe('items.status');
    });
  });

  describe('blocks field resolution', () => {
    it('resolves content.heading through blocks', () => {
      const fields: ClientField[] = [
        blocksField('content', [
          { slug: 'hero', fields: [selectField('heading')] as unknown as ClientField[] },
          { slug: 'text', fields: [selectField('body')] as unknown as ClientField[] },
        ]),
      ];

      const result = resolveFieldByPath(fields, 'content.heading');
      expect(result).not.toBeNull();
      expect(result!.field.type).toBe('select');
      expect((result!.field as any).name).toBe('heading');
      expect(result!.path).toBe('content.heading');
    });

    it('resolves a field that exists in a later block definition', () => {
      const fields: ClientField[] = [
        blocksField('content', [
          { slug: 'hero', fields: [selectField('heading')] as unknown as ClientField[] },
          { slug: 'cta', fields: [checkboxField('showButton')] as unknown as ClientField[] },
        ]),
      ];

      const result = resolveFieldByPath(fields, 'content.showButton');
      expect(result).not.toBeNull();
      expect(result!.field.type).toBe('checkbox');
      expect(result!.path).toBe('content.showButton');
    });
  });

  describe('layout containers (row, collapsible, tabs)', () => {
    it('resolves through a row container', () => {
      const fields: ClientField[] = [
        groupField('info', [rowField([selectField('status'), dateField('createdAt')])]),
      ];

      const result = resolveFieldByPath(fields, 'info.status');
      expect(result).not.toBeNull();
      expect(result!.field.type).toBe('select');
      expect(result!.path).toBe('info.status');
    });
  });

  describe('invalid paths', () => {
    it('returns null for empty string', () => {
      const fields: ClientField[] = [selectField('name')];
      expect(resolveFieldByPath(fields, '')).toBeNull();
    });

    it('returns null for non-existent field', () => {
      const fields: ClientField[] = [groupField('address', [selectField('city')])];
      expect(resolveFieldByPath(fields, 'address.country')).toBeNull();
    });

    it('returns null for non-existent top-level segment', () => {
      const fields: ClientField[] = [groupField('address', [selectField('city')])];
      expect(resolveFieldByPath(fields, 'nonexistent.city')).toBeNull();
    });

    it('returns null for path with only numeric segments', () => {
      const fields: ClientField[] = [arrayField('items', [selectField('title')])];
      expect(resolveFieldByPath(fields, '0.1.2')).toBeNull();
    });

    it('returns null when trying to descend into a leaf field', () => {
      const fields: ClientField[] = [groupField('address', [selectField('city')])];
      expect(resolveFieldByPath(fields, 'address.city.something')).toBeNull();
    });

    it('returns null for null/undefined fields array', () => {
      expect(resolveFieldByPath([], 'address.city')).toBeNull();
      expect(resolveFieldByPath(null as any, 'address.city')).toBeNull();
    });
  });

  describe('backward compatibility', () => {
    it('resolves a single-segment (flat) path', () => {
      const fields: ClientField[] = [selectField('status')];

      const result = resolveFieldByPath(fields, 'status');
      expect(result).not.toBeNull();
      expect(result!.field.type).toBe('select');
      expect((result!.field as any).name).toBe('status');
      expect(result!.path).toBe('status');
    });
  });
});
