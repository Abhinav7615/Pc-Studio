from pathlib import Path

path = Path('components/ConsumerChatPanel.tsx')
text = path.read_text(encoding='utf-8')
marker = '            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">'
idx = text.find(marker)
print('idx', idx)
if idx == -1:
    raise SystemExit('Marker not found')
new_text = text[:idx] + '      </div>\n    </div>\n  );\n}\n'
path.write_text(new_text, encoding='utf-8')
print('rewritten', path)
