/**
 * Exports an array of objects to a downloadable CSV file.
 * Automatically handles escaping and triggers client-side download.
 */
export function exportToCSV(filename, data, columns) {
  if (!data || !data.length) {
    alert('No data to export.');
    return;
  }

  // Determine headers
  const headers = columns
    ? columns.map((c) => c.header || c.label || c.accessorKey || c.id)
    : Object.keys(data[0]);

  const accessors = columns
    ? columns.map((c) => c.accessorKey || c.id || c.header)
    : Object.keys(data[0]);

  // Build CSV rows
  const csvRows = [];
  csvRows.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));

  data.forEach((row) => {
    const values = accessors.map((key) => {
      let val = row[key];
      if (val === null || val === undefined) val = '';
      else if (typeof val === 'object') {
        if (Array.isArray(val)) {
          val = val.join('; ');
        } else {
          val = JSON.stringify(val);
        }
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
