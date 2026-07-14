const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./apps/frontend/src/features');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('fetch(')) {
    console.log('Refactoring ' + file);
    
    if (!content.includes('import axios from')) {
      content = "import axios from 'axios';\n" + content;
    }

    // Replace basic GET requests
    content = content.replace(/const response = await fetch\(([^,]+)\);/g, 'const response = await axios.get($1);');
    
    // Replace advanced fetch options: method, headers, body
    content = content.replace(/const response = await fetch\(([^,]+),\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]*\},\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\);/g, 'const response = await axios.post($1, $2);');
    content = content.replace(/const response = await fetch\(([^,]+),\s*\{\s*method:\s*'PUT',\s*headers:\s*\{[^}]*\},\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\);/g, 'const response = await axios.put($1, $2);');
    content = content.replace(/const response = await fetch\(([^,]+),\s*\{\s*method:\s*'DELETE',\s*headers:\s*\{[^}]*\},\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\);/g, 'const response = await axios.delete($1, { data: $2 });');
    content = content.replace(/const response = await fetch\(([^,]+),\s*\{\s*method:\s*'DELETE'\s*\}\);/g, 'const response = await axios.delete($1);');
    
    // Replace response.ok check and response.json()
    content = content.replace(/if \(!response\.ok\) \{[\s\S]*?throw new Error\([^)]+\);[\s\S]*?\}/g, '');
    content = content.replace(/return response\.json\(\);/g, 'return response.data;');
    content = content.replace(/return await response\.json\(\);/g, 'return response.data;');

    fs.writeFileSync(file, content, 'utf8');
  }
}
