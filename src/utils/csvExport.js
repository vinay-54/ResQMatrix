/**
 * Converts an array of objects to a CSV string and triggers browser download.
 * @param {Object[]} data - Array of flat objects
 * @param {string}   filename - Download filename (without .csv)
 */
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows    = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? '';
      // Wrap in quotes if contains comma, newline, or quote
      const str = String(val);
      return str.includes(',') || str.includes('\n') || str.includes('"')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );

  const csv     = [headers.join(','), ...rows].join('\n');
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement('a');
  link.href     = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
