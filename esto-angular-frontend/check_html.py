import re
import sys

def check_html():
    try:
        with open('c:\\esto-platform\\esto-angular-frontend\\src\\app\\pages\\admin\\messages\\admin-messages.component.ts', 'r', encoding='utf8') as f:
            content = f.read()
    except Exception as e:
        print("Error reading file:", e)
        return

    match = re.search(r'template:\s*`([\s\S]*?)`', content)
    if not match:
        print("No template found")
        return
    
    html = match.group(1)
    lines = html.split('\n')
    
    stack = []
    self_closing = ['img', 'input', 'br', 'hr', 'path', 'circle']
    
    for i, line in enumerate(lines):
        # find all tags <tag> or </tag>
        # regex to match <name attributes> or </name>
        tags = re.finditer(r'<\/?([a-zA-Z0-9-]+)[^>]*>', line)
        for tag_match in tags:
            full_tag = tag_match.group(0)
            tag_name = tag_match.group(1).lower()
            
            if tag_name in self_closing:
                continue
            
            if full_tag.endswith('/>'):
                continue
                
            if full_tag.startswith('</'):
                if not stack:
                    print(f"Error at line {i+1}: Unexpected </{tag_name}>, stack is empty. Line: {line}")
                    continue
                last = stack.pop()
                if last['name'] != tag_name:
                    print(f"Error at line {i+1}: Expected </{last['name']}> (from line {last['line']}), but found </{tag_name}>. Line: {line}")
            else:
                stack.append({'name': tag_name, 'line': i+1})
                
    if stack:
        print("Unclosed tags remaining:")
        for t in stack:
            print(f"<{t['name']}> at line {t['line']}")
    else:
        print("All tags balanced!")

check_html()
