import sys

path = 'c:/esto-platform/esto-angular-frontend/src/app/pages/home/home.component.html'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "<!-- Section Processus d'Admission" in line:
        start_idx = i
    if start_idx != -1 and i > start_idx and "</section>" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    section = lines[start_idx:end_idx+1]
    del lines[start_idx:end_idx+1]
    
    footer_idx = -1
    for i, line in enumerate(lines):
        if "<!-- Footer -->" in line:
            footer_idx = i
            break
            
    if footer_idx != -1:
        lines.insert(footer_idx, '\n')
        for idx, s_line in enumerate(section):
            lines.insert(footer_idx + 1 + idx, s_line)
            
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('Moved successfully.')
else:
    print('Indices not found:', start_idx, end_idx)
