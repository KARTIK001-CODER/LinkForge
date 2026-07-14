const fs = require('fs');
const path = require('path');

const files = [
  './apps/frontend/src/features/links/api/useToggleFavorite.ts',
  './apps/frontend/src/features/links/api/useRestoreLink.ts',
  './apps/frontend/src/features/links/api/useEditLink.ts',
  './apps/frontend/src/features/links/api/useDeleteLink.ts',
  './apps/frontend/src/features/links/api/useArchiveLink.ts',
  './apps/frontend/src/features/collections/api/useDeleteCollection.ts',
  './apps/frontend/src/features/links/components/TrafficManager.tsx',
  './apps/frontend/src/features/links/components/RulesManager.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('fetch(')) {
    console.log('Refactoring ' + file);
    
    if (!content.includes('import axios from')) {
      content = "import axios from 'axios';\n" + content;
    }

    // Replace basic GET
    content = content.replace(/const res = await fetch\(([^,]+)\);/g, 'const res = await axios.get($1);');
    
    // TrafficManager POST / DELETE
    content = content.replace(/await fetch\(([^,]+),\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]*\},\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\)/g, 'await axios.post($1, $2)');
    content = content.replace(/await fetch\(([^,]+),\s*\{\s*method:\s*'DELETE'\s*\}\)/g, 'await axios.delete($1)');

    // RulesManager POST / DELETE
    content = content.replace(/const res = await fetch\(([^,]+),\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]*\},\s*body:\s*JSON\.stringify\(([^)]+)\)\s*\}\);/g, 'const res = await axios.post($1, $2);');
    content = content.replace(/const res = await fetch\(([^,]+),\s*\{\s*method:\s*'DELETE'\s*\}\);/g, 'const res = await axios.delete($1);');

    // useToggleFavorite (POST)
    content = content.replace(/const response = await fetch\(([^,]+),\s*\{\s*method:\s*'POST'\s*\}\);/g, 'const response = await axios.post($1);');

    // useRestoreLink, useArchiveLink (POST)
    content = content.replace(/const response = await fetch\(([^,]+),\s*\{\s*method:\s*'POST'\s*\}\);/g, 'const response = await axios.post($1);');
    
    // useEditLink (PATCH)
    content = content.replace(/const response = await fetch\(([^,]+),\s*\{\s*method:\s*'PATCH',\s*headers:\s*\{[^}]*\},\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\);/g, 'const response = await axios.patch($1, $2);');

    // useDeleteLink, useDeleteCollection (DELETE)
    content = content.replace(/const response = await fetch\(([^,]+),\s*\{\s*method:\s*'DELETE'\s*\}\);/g, 'const response = await axios.delete($1);');

    // Remove response.ok check and json
    content = content.replace(/if \(!res(?:ponse)?\.ok\) \{[\s\S]*?throw new Error\([^)]+\);[\s\S]*?\}/g, '');
    content = content.replace(/return res(?:ponse)?\.json\(\);/g, 'return response.data;');
    content = content.replace(/return await res\.json\(\);/g, 'return res.data;');

    fs.writeFileSync(file, content, 'utf8');
  }
}
