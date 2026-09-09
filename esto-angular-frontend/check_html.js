const fs = require('fs');
const content = fs.readFileSync('c:\\esto-platform\\esto-angular-frontend\\src\\app\\pages\\admin\\messages\\admin-messages.component.ts', 'utf8');
const templateMatch = content.match(/template:\s*`([\s\S]*?)`/);
if (!templateMatch) {
  console.log("No template found");
  process.exit(1);
}
const html = templateMatch[1];
const stack = [];
const lines = html.split('\n');
const selfClosing = ['img', 'input', 'br', 'hr', 'path', 'circle'];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const regex = /<\/?([a-zA-Z0-9-]+)[^>]*>/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    
    if (selfClosing.includes(tagName)) continue;
    
    // Check if it ends with "/>"
    if (fullTag.endsWith('/>')) continue;
    
    if (fullTag.startsWith('</')) {
      if (stack.length === 0) {
        console.log(`Error at line ${i + 1}: Unexpected </${tagName}>, stack is empty`);
        continue;
      }
      const last = stack.pop();
      if (last.tagName !== tagName) {
        console.log(`Error at line ${i + 1}: Expected </${last.tagName}> to close tag from line ${last.line}, but found </${tagName}>`);
        console.log(line);
      }
    } else {
      stack.push({tagName, line: i + 1});
    }
  }
}
if (stack.length > 0) {
  console.log("Unclosed tags remaining:");
  console.log(stack);
} else {
  console.log("All tags balanced!");
}
