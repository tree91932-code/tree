from pathlib import Path
root = Path(__file__).resolve().parents[1]
sources = ['manifest.js','data.js','main.js','honors-order.js','mobile-pages.js','text-editor.js']
bundle = '\n;\n'.join('// '+name+'\n'+(root/'js'/name).read_text(encoding='utf-8') for name in sources)
(root/'js/site.js').write_text(bundle,encoding='utf-8')
