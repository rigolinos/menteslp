import json

with open(r'C:\Users\oooo0\.gemini\antigravity\brain\efbc58a9-1871-4369-95cb-3a812a0739e0\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if 'tool_calls' in data:
            for call in data['tool_calls']:
                name = call.get('name')
                if name == 'write_to_file':
                    args = call.get('args', {})
                    path = args.get('TargetFile', '')
                    if 'astro.config.mjs' in path or 'index.astro' in path or 'main.js' in path or 'overlays.js' in path or 'Cursor.astro' in path or 'global.css' in path or '.astro' in path or 'episodes.json' in path or 'tailwind.config' in path:
                        print(f"Found: {path}")
                        with open(path.split('\\')[-1] + '.extracted', 'w', encoding='utf-8') as out:
                            out.write(args.get('CodeContent', ''))
