/**
 * Safely exports an array of objects to a CSV file in the browser.
 * Handles commas, quotes, and special characters.
 */
export function exportToCsv(data: Array<Record<string, string | number | boolean>>, filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Header row
  csvRows.push(headers.join(","));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      const stringified = val === null || val === undefined ? "" : String(val);
      
      // Escape double quotes and wrap in quotes if there's a comma or quote
      const escaped = stringified.replace(/"/g, '""');
      if (escaped.includes(",") || escaped.includes('"') || escaped.includes("\n") || escaped.includes("\r")) {
        return `"${escaped}"`;
      }
      return escaped;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  
  // Browser trigger
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
