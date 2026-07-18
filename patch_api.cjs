const fs = require('fs');

let apiCode = fs.readFileSync('src/api.ts', 'utf-8');

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

apiCode = apiCode.replace(/export async function fetchSheetData[\s\S]*?if \(!rows \|\| rows\.length === 0\) return \[\];\n  \/\/ Parse headers/, newFetchSheetData);

const newFetchLogs = `export async function fetchLogs(spreadsheetId: string) {
  const res = await fetch(\`/api/sheets/\${spreadsheetId}/logs\`);
  
  let text = '';
  try {
    text = await res.text();
  } catch(e) {
    throw new Error('Failed to read response body');
  }

  if (!res.ok) {
    let errorMsg = 'Failed to fetch logs';
    try {
      const error = JSON.parse(text);
      errorMsg = error.error || errorMsg;
    } catch(e) {
      console.error('Raw error response:', text);
      errorMsg = \`Server error (\${res.status}): \${text.substring(0, 100)}\`;
    }
    throw new Error(errorMsg);
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON, raw response:', text);
    throw new Error('Invalid JSON response from server');
  }
}`;

apiCode = apiCode.replace(/export async function fetchLogs[\s\S]*?return rows;\n\}/, newFetchLogs);

const newAppendLog = `export async function appendLog(spreadsheetId: string, action: string, product: Product) {
  const res = await fetch(\`/api/sheets/\${spreadsheetId}/logs\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      code: product.code,
      name: product.name,
      price: product.sellingPrice,
    }),
  });

  let text = '';
  try {
    text = await res.text();
  } catch(e) {
    throw new Error('Failed to read response body');
  }

  if (!res.ok) {
    let errorMsg = 'Failed to append log';
    try {
      const error = JSON.parse(text);
      errorMsg = error.error || errorMsg;
    } catch(e) {
      console.error('Raw error response:', text);
      errorMsg = \`Server error (\${res.status}): \${text.substring(0, 100)}\`;
    }
    throw new Error(errorMsg);
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON, raw response:', text);
    throw new Error('Invalid JSON response from server');
  }
}`;

apiCode = apiCode.replace(/export async function appendLog[\s\S]*?return res\.json\(\);\n\}/, newAppendLog);

fs.writeFileSync('src/api.ts', apiCode);
