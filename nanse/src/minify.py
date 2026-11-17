import re,subprocess,sys,os
src,dst=sys.argv[1],sys.argv[2]
s=open(src,encoding='utf-8').read()
import datetime
s=s.replace('@@BUILD@@',(datetime.datetime.utcnow()+datetime.timedelta(hours=9)).strftime('%m%d-%H%M'))
EB='os.environ.get('ESBUILD','esbuild')'
def run(code,args):
    r=subprocess.run([EB,*args],input=code.encode(),capture_output=True)
    if r.returncode: sys.exit(r.stderr.decode())
    return r.stdout.decode().rstrip('\n')
def js(body):
    b=body.strip()
    if b.startswith('(() => {') and b.endswith('})();'):
        inner=b[len('(() => {'):-len('})();')]
        assert inner.count('const SIM = !!globalThis.__SIM;')==1
        inner=inner.replace('const SIM = !!globalThis.__SIM;','const SIM = false;')
        out=run(inner,['--minify','--loader=js','--format=esm','--tree-shaking=true','--target=es2020','--charset=utf8','--legal-comments=none'])
        return '(()=>{'+out+'})();'
    return run(body,['--minify','--loader=js','--target=es2020','--charset=utf8'])
def f(m):
    tag,attrs,body=m.group(1),m.group(2),m.group(3)
    if tag=='script' and 'src=' in attrs: return m.group(0)
    return f'<{tag}{attrs}>'+(js(body) if tag=='script' else run(body,['--minify','--loader=css','--charset=utf8']))+f'</{tag}>'
s=re.sub(r'<(script|style)([^>]*)>(.*?)</\1>',f,s,flags=re.S)
s=re.sub(r'<!--.*?-->','',s,flags=re.S)
s=re.sub(r'>\s+<','><',s)
open(dst,'w',encoding='utf-8').write(s)
