/**
 * CSV Import/Export utility for CRM data.
 * F6: Enables bulk data migration from/to Excel or other CRMs.
 */

export const exportToCSV = <T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void => {
  if (data.length === 0) return;

  const keys = columns
    ? columns.map((c) => c.key)
    : (Object.keys(data[0]) as (keyof T)[]);

  const headers = columns
    ? columns.map((c) => c.label)
    : keys.map(String);

  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      keys
        .map((key) => {
          const val = row[key];
          const str = val === null || val === undefined ? '' : String(val);
          // Escape commas, quotes, and newlines
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.replace(/^"(.*)"$/, '$1').trim());

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row;
  });
};
