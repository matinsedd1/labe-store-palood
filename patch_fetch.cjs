const fs = require('fs');
let code = fs.readFileSync('src/api.ts', 'utf-8');

const newFetchSheetData = `export async function fetchSheetData(spreadsheetId: string): Promise<Product[]> {
  const res = await fetch(\`/api/sheets/\${spreadsheetId}\`);
  
  let text = '';
  try {
    text = await res.text();
  } catch(e) {
    throw new Error('Failed to read response body');
  }

  if (!res.ok) {
    let errorMsg = 'Failed to fetch sheet data';
    try {
      const error = JSON.parse(text);
      errorMsg = error.error || errorMsg;
    } catch(e) {
      console.error('Raw error response:', text);
      errorMsg = \`Server error (\${res.status}): \${text.substring(0, 100)}\`;
    }
    throw new Error(errorMsg);
  }
  
  let rows: string[][] = [];
  try {
    rows = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON, raw response:', text);
    throw new Error('Invalid JSON response from server');
  }

  if (!rows || rows.length === 0) return [];
  // Parse headers`;

code = code.replace(/export async function fetchSheetData[\s\S]*?if \(!rows \|\| rows\.length === 0\) return \[\];\n  \/\/ Parse headers/, newFetchSheetData);
fs.writeFileSync('src/api.ts', code);
