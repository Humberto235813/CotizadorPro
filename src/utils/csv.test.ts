import { describe, it, expect } from 'vitest';
import { parseCSV } from './csv';

describe('parseCSV', () => {
  it('parses basic CSV', () => {
    const csv = 'name,email\nJuan,juan@test.com\nMaria,maria@test.com';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Juan');
    expect(result[0].email).toBe('juan@test.com');
    expect(result[1].name).toBe('Maria');
  });

  it('handles quoted fields with commas', () => {
    const csv = 'name,address\nJuan,"Av. Reforma 123, CDMX"';
    const result = parseCSV(csv);
    expect(result[0].address).toBe('Av. Reforma 123, CDMX');
  });

  it('returns empty array for empty input', () => {
    expect(parseCSV('')).toEqual([]);
    expect(parseCSV('headers_only')).toEqual([]);
  });

  it('handles CRLF line endings', () => {
    const csv = 'name,email\r\nJuan,j@t.com\r\n';
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Juan');
  });
});
