"""Assemble the single-file interactive demo from generator + css + app."""
import pathlib, re, sys

here = pathlib.Path(__file__).resolve().parent
gen_src = (here.parent / 'server' / 'src' / 'generator.js').read_text()
gen_src = gen_src.replace(
    "module.exports = { buildSite, INDUSTRIES, THEMES, slugify, esc };",
    "window.OrbitGen = { buildSite: buildSite, INDUSTRIES: INDUSTRIES, THEMES: THEMES, slugify: slugify, esc: esc };"
)
if 'window.OrbitGen' not in gen_src:
    sys.exit('generator export patch failed')

# an inline <script> block ends at the first literal </script>, and the generator
# template emits script tags — escape the slash so the browser keeps parsing
gen_src = gen_src.replace('</script', '<\\/script')

css = (here / 'style.css').read_text()
app = (here / 'app.js').read_text().replace('</script', '<\\/script')
tpl = (here / 'template.html').read_text()

html = (tpl
        .replace('/*__CSS__*/', css)
        .replace('/*__GENERATOR__*/', gen_src)
        .replace('/*__APP__*/', app))

out = pathlib.Path('/scratch/output/Orbit-Website-Builder.html')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html)
print(f'wrote {out} ({len(html)/1024:.0f} KB)')
