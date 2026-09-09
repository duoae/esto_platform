from html.parser import HTMLParser
import sys
import re

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.self_closing = ['img', 'input', 'br', 'hr', 'path', 'circle']
        self.errors = []
        self.current_line = 0

    def handle_starttag(self, tag, attrs):
        if tag not in self.self_closing:
            self.stack.append({'tag': tag, 'line': self.getpos()[0]})

    def handle_endtag(self, tag):
        if tag in self.self_closing:
            return
        if not self.stack:
            self.errors.append(f"Line {self.getpos()[0]}: Unexpected closing tag </{tag}>, stack is empty")
            return
        
        last = self.stack.pop()
        if last['tag'] != tag:
            self.errors.append(f"Line {self.getpos()[0]}: Expected </{last['tag']}> (opened at {last['line']}) but found </{tag}>")

def check():
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
    
    # Preprocess Angular bindings to avoid breaking HTMLParser
    # E.g. [ngClass]="..." -> ngclass="..."
    html = re.sub(r'\[([^\]]+)\]=', r'\1=', html)
    html = re.sub(r'\(([^)]+)\)=', r'\1=', html)
    
    parser = MyHTMLParser()
    parser.feed(html)
    
    if parser.errors:
        for err in parser.errors:
            print(err)
    
    if parser.stack:
        print("Unclosed tags remaining:")
        for t in parser.stack:
            print(f"<{t['tag']}> at line {t['line']}")
    
    if not parser.errors and not parser.stack:
        print("Perfectly balanced!")

check()
