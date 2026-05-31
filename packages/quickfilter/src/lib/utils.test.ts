import { describe, it, expect } from 'vitest';
import { buildQuickFilterConditions, parseWhereClauseToFilterValues } from './utils';
import type { FilterDetaild } from '../filters/types/filters-type';

describe('buildQuickFilterConditions with dotted paths', () => {
  const fields: FilterDetaild[] = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'meta.category',
      label: 'Category',
      type: 'select',
      path: 'meta.category',
      options: [
        { label: 'Blog', value: 'blog' },
        { label: 'Landing', value: 'landing' },
      ],
    },
    {
      name: 'tags.label',
      label: 'Tag',
      type: 'select',
      path: 'tags.label',
      options: [
        { label: 'Featured', value: 'featured' },
        { label: 'New', value: 'new' },
      ],
    },
    { name: 'settings.isActive', label: 'Active', type: 'checkbox', path: 'settings.isActive' },
  ];

  it('produces dotted-path key for group sub-field (select)', () => {
    const values = { 'meta.category': { selectedValues: ['blog'] } };
    const conditions = buildQuickFilterConditions(values, fields, 'en');
    expect(conditions).toEqual([{ 'meta.category': { equals: 'blog' } }]);
  });

  it('produces dotted-path key for array sub-field (select)', () => {
    const values = { 'tags.label': { selectedValues: ['featured', 'new'] } };
    const conditions = buildQuickFilterConditions(values, fields, 'en');
    expect(conditions).toEqual([{ 'tags.label': { in: ['featured', 'new'] } }]);
  });

  it('produces dotted-path key for nested checkbox', () => {
    const values = { 'settings.isActive': 'checked' };
    const conditions = buildQuickFilterConditions(values, fields, 'en');
    expect(conditions).toEqual([{ 'settings.isActive': { equals: 'true' } }]);
  });

  it('produces simple key for flat field (backward compat)', () => {
    const values = { status: { selectedValues: ['draft'] } };
    const conditions = buildQuickFilterConditions(values, fields, 'en');
    expect(conditions).toEqual([{ status: { equals: 'draft' } }]);
  });

  it('handles mixed flat and dotted fields in one call', () => {
    const values = {
      status: { selectedValues: ['published'] },
      'meta.category': { selectedValues: ['landing'] },
    };
    const conditions = buildQuickFilterConditions(values, fields, 'en');
    expect(conditions).toContainEqual({ status: { equals: 'published' } });
    expect(conditions).toContainEqual({ 'meta.category': { equals: 'landing' } });
  });
});

describe('parseWhereClauseToFilterValues with dotted paths', () => {
  const fields: FilterDetaild[] = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [{ label: 'Draft', value: 'draft' }],
    },
    {
      name: 'meta.category',
      label: 'Category',
      type: 'select',
      path: 'meta.category',
      options: [{ label: 'Blog', value: 'blog' }],
    },
    {
      name: 'tags.label',
      label: 'Tag',
      type: 'select',
      path: 'tags.label',
      options: [{ label: 'Featured', value: 'featured' }],
    },
    { name: 'settings.isActive', label: 'Active', type: 'checkbox', path: 'settings.isActive' },
  ];

  it('parses dotted-path key for group sub-field', () => {
    const where = { 'meta.category': { equals: 'blog' } };
    const result = parseWhereClauseToFilterValues(where, fields, 'en');
    expect(result['meta.category']).toEqual({ selectedValues: ['blog'] });
  });

  it('parses dotted-path key for array sub-field (in operator)', () => {
    const where = { 'tags.label': { in: ['featured', 'new'] } };
    const result = parseWhereClauseToFilterValues(where, fields, 'en');
    expect(result['tags.label']).toEqual({ selectedValues: ['featured', 'new'] });
  });

  it('parses dotted-path key for nested checkbox', () => {
    const where = { 'settings.isActive': { equals: 'true' } };
    const result = parseWhereClauseToFilterValues(where, fields, 'en');
    expect(result['settings.isActive']).toBe('checked');
  });

  it('parses flat field key (backward compat)', () => {
    const where = { status: { equals: 'draft' } };
    const result = parseWhereClauseToFilterValues(where, fields, 'en');
    expect(result['status']).toEqual({ selectedValues: ['draft'] });
  });

  it('parses mixed flat and dotted keys in AND clause', () => {
    const where = {
      and: [{ status: { equals: 'draft' } }, { 'meta.category': { equals: 'blog' } }],
    };
    const result = parseWhereClauseToFilterValues(where, fields, 'en');
    expect(result['status']).toEqual({ selectedValues: ['draft'] });
    expect(result['meta.category']).toEqual({ selectedValues: ['blog'] });
  });

  it('round-trips: build then parse produces equivalent values', () => {
    const originalValues = {
      status: { selectedValues: ['draft'] },
      'meta.category': { selectedValues: ['blog'] },
      'tags.label': { selectedValues: ['featured'] },
      'settings.isActive': 'checked' as const,
    };

    const conditions = buildQuickFilterConditions(originalValues, fields, 'en');
    const where = conditions.length === 1 ? conditions[0] : { and: conditions };
    const parsed = parseWhereClauseToFilterValues(where, fields, 'en');

    expect(parsed['status']).toEqual({ selectedValues: ['draft'] });
    expect(parsed['meta.category']).toEqual({ selectedValues: ['blog'] });
    expect(parsed['tags.label']).toEqual({ selectedValues: ['featured'] });
    expect(parsed['settings.isActive']).toBe('checked');
  });
});
