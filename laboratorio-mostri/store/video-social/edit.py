# Montaggio "pazzo" a tempo di musica: zoom a ogni battuta, tremolio, flash, RGB split, scritte che saltano, mostri-adesivi
import sys,os,glob,math,random,subprocess
from PIL import Image,ImageDraw,ImageFont,ImageChops,ImageEnhance,ImageFilter
SP='/tmp/claude-0/-home-user-monster-laboraty/a80ef336-cf4a-504f-bcd0-3feb86f8b0b7/scratchpad'
M='/home/user/monster-laboraty/laboratorio-mostri/public/m'
F=SP+'/lilita.ttf';W,H,FPS=1080,1920,30
def src(d):
    L=open(f'{SP}/{d}/list.txt').read().split('\n');fr=[];t=0
    for i,l in enumerate(L):
        if l.startswith('file '):
            fr.append((l[6:-1],t))
        elif l.startswith('duration '):t+=float(l[9:])
    return fr
SRC={'M':src('fb3-merge'),'B':src('fb-boss'),'G':src('fb3-grow')}
cache={}
def get(s,t):
    fr=SRC[s];t=t%(fr[-1][1]-0.05);lo,hi=0,len(fr)-1
    while lo<hi:
        mid=(lo+hi+1)//2
        if fr[mid][1]<=t:lo=mid
        else:hi=mid-1
    p=fr[lo][0]
    if p not in cache:
        if len(cache)>60:cache.pop(next(iter(cache)))
        cache[p]=Image.open(p).convert('RGB')
    return cache[p]
ART=Image.open(SP+'/kv/up-v.png').convert('RGB').resize((1536,2752),Image.LANCZOS)
COVER=Image.open(SP+'/kv/fb-cover.png').convert('RGB')
STK=[Image.open(f).convert('RGBA') for f in sorted(glob.glob(M+'/*.webp'))]
def place(img,zoom=1.0,dx=0,dy=0,rot=0):
    zoom=max(zoom,1.0)*(1.04 if (dx or dy) else 1.0);w,h=img.size;cw,ch=w/zoom,h/zoom
    x0=min(max(0,(w-cw)/2-dx*w/W/zoom),w-cw);y0=min(max(0,(h-ch)/2-dy*h/H/zoom),h-ch)
    out=img.resize((W,H),Image.BILINEAR,box=(x0,y0,x0+cw,y0+ch))
    if rot:out=out.rotate(rot,resample=Image.BILINEAR,expand=False,fillcolor=(10,5,25))
    return out
def text(img,s,size,y,t,col=(255,255,255),stroke=(30,0,60),tilt=0,pop=True):
    sc=1.0 if not pop else (0.3+1.2*min(1,t/0.12) if t<0.12 else 1.15-0.15*min(1,(t-0.12)/0.15))
    f=ImageFont.truetype(F,max(8,int(size*sc)));lines=s.split('|')
    lay=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(lay);lh=int(size*sc*1.08)
    for k,l in enumerate(lines):
        w=d.textlength(l,font=f);c=col if k==0 or len(lines)==1 else (255,214,74)
        d.text(((W-w)/2,y+k*lh-lh*len(lines)/2),l,font=f,fill=c,stroke_width=max(2,int(size*sc*0.09)),stroke_fill=stroke)
    if tilt:lay=lay.rotate(tilt,resample=Image.BICUBIC,center=(W/2,y))
    img.paste(lay,(0,0),lay);return img
def flash(img,a,col=(255,255,255)):
    return Image.blend(img,Image.new('RGB',img.size,col),max(0,min(1,a))) if a>0 else img
def rgb(img,o):
    if o<1:return img
    r,g,b=img.split();r=ImageChops.offset(r,int(o),0);b=ImageChops.offset(b,-int(o),0);return Image.merge('RGB',(r,g,b))
def sticker(img,i,x,y,t,size=260):
    s=STK[i%len(STK)];sc=min(1,t/0.1)*(1+0.15*math.sin(t*20)*math.exp(-t*4));sz=max(10,int(size*sc))
    st=s.resize((sz,sz),Image.LANCZOS).rotate(15*math.sin(t*9),expand=True,resample=Image.BICUBIC)
    img.paste(st,(int(x-st.width/2),int(y-st.height/2)),st);return img
def render(plan,bpm,audio,out,seed):
    random.seed(seed);beat=60/bpm;tmp=out+'.frames';os.makedirs(tmp,exist_ok=True)
    total=sum(p['beats'] for p in plan)*beat;n=int(total*FPS);fi=0;t0=0
    for p in plan:
        dur=p['beats']*beat;fx=p.get('fx',set())
        while fi<n and fi/FPS<t0+dur:
            tl=fi/FPS-t0;tb=(fi/FPS)%beat # tempo nel segmento e nella battuta
            # sorgente
            if p['src']=='ART':
                z=p.get('z0',1.0)+(p.get('z1',1.3)-p.get('z0',1.0))*tl/dur;base=place(ART,z)
            elif p['src']=='COVER':
                z=1.0+0.08*math.exp(-tb*8);base=place(COVER,z)
            else:
                st=p['start']+tl*p.get('speed',1)
                if 'stutter' in fx:st=p['start']+(tl%(beat/2))*p.get('speed',1)
                base=get(p['src'],st)
                z=p.get('zoom',1.0)
                if 'punch' in fx:z*=1+0.22*math.exp(-tb*9)
                if 'zoomin' in fx:z*=1+0.35*tl/dur
                dx=dy=rot=0
                if 'shake' in fx:a=28*math.exp(-tb*7);dx=random.uniform(-a,a);dy=random.uniform(-a,a);rot=random.uniform(-2.5,2.5)*math.exp(-tb*7)
                if 'tilt' in fx:rot+=6*math.sin(fi/FPS*math.pi*2/(beat*2))
                base=place(base,z,dx+p.get('dx',0),dy+p.get('dy',0),rot)
            img=base
            if 'rgb' in fx:img=rgb(img,18*math.exp(-tb*6))
            if 'flash' in fx and tl<0.18:img=flash(img,0.85*(1-tl/0.18))
            if 'beatflash' in fx:img=flash(img,0.35*math.exp(-tb*14),p.get('fcol',(255,255,255)))
            if 'red' in fx:img=flash(img,0.28*math.exp(-tb*8),(255,30,40))
            if 'sat' in fx:img=ImageEnhance.Color(img).enhance(1.35)
            for k,(si,x,y,ts) in enumerate(p.get('stk',[])):
                if tl>=ts:img=sticker(img,si,x,y,tl-ts)
            if p.get('text'):
                tt=tl-p.get('tdelay',0)
                if tt>=0:img=text(img,p['text'],p.get('tsize',120),p.get('ty',360),tt,tilt=p.get('ttilt',random.choice([-4,4]) if 'ttilt' not in p else p['ttilt']))
            img.save(f'{tmp}/{fi:05d}.jpg',quality=90);fi+=1
        t0+=dur
    subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate',str(FPS),'-i',f'{tmp}/%05d.jpg','-i',audio,'-c:v','libx264','-preset','slow','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',out],check=True)
    print(out,round(total,2),'s')
