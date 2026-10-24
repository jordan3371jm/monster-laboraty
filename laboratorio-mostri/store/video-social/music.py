# Traccia originale stile EDM/chiptune generata da zero (nessun diritto di terzi)
import numpy as np,sys,wave
SR=44100
def env(n,a=0.002,d=0.1):
    t=np.arange(n)/SR;e=np.minimum(1,t/a)*np.exp(-t/d);return e
def kick(n):
    t=np.arange(n)/SR;f=50+120*np.exp(-t*35);ph=2*np.pi*np.cumsum(f)/SR;return np.sin(ph)*np.exp(-t*7)*1.0
def snare(n,rng):
    t=np.arange(n)/SR;return (rng.standard_normal(n)*0.6*np.exp(-t*18)+np.sin(2*np.pi*190*t)*0.4*np.exp(-t*25))
def hat(n,rng):
    x=rng.standard_normal(n);x=np.diff(x,prepend=0);t=np.arange(n)/SR;return x*np.exp(-t*60)*0.25
def sq(f,n,duty=.5):
    t=np.arange(n)/SR;return np.where((t*f)%1<duty,1.0,-1.0)
def saw(f,n):
    t=np.arange(n)/SR;return 2*((t*f)%1)-1
def make(bpm,root,seed,secs,out,drop_bar=2):
    rng=np.random.default_rng(seed);beat=60/bpm;N=int(secs*SR);mix=np.zeros(N);bass=np.zeros(N);lead=np.zeros(N)
    step=beat/4;nsteps=int(secs/step)
    prog=[0,-4,-2,-5] # i VI VII v (minore epico)
    scale=[0,3,5,7,10,12,15,17]
    arp=[0,2,4,7,4,2,5,7,0,4,7,9,7,4,2,1]
    duck=np.ones(N)
    for s in range(nsteps):
        i=int(s*step*SR);bar=s//16;pos=s%16;chord=prog[bar%4]
        drop=bar>=drop_bar
        L=min(int(step*SR*4),N-i)
        if L<=0:break
        # batteria
        if drop and pos%4==0:
            k=kick(min(int(.35*SR),N-i));mix[i:i+len(k)]+=k*0.9
            dl=min(int(beat*SR),N-i);t=np.arange(dl)/SR;duck[i:i+dl]=np.minimum(duck[i:i+dl],0.35+0.65*np.minimum(1,t/(beat*.6)))
        if not drop and pos%8==0 and bar==drop_bar-1 and pos>=8:
            pass
        if drop and pos in(4,12):
            sn=snare(min(int(.25*SR),N-i),rng);mix[i:i+len(sn)]+=sn*0.55
        if pos%2==1 or (drop and True):
            h=hat(min(int(.06*SR),N-i),rng);mix[i:i+len(h)]+=h*(0.6 if pos%2 else 0.3)
        # build: rullata che accelera nell'ultima battuta prima del drop
        if bar==drop_bar-1:
            if pos%(4 if pos<8 else (2 if pos<12 else 1))==0:
                sn=snare(min(int(.15*SR),N-i),rng);mix[i:i+len(sn)]+=sn*0.35*(0.4+pos/16)
        # basso (ottavi in levare)
        if drop and pos%2==0:
            f=55*2**((root+chord)/12);n=min(int(step*2*SR),N-i)
            b=(saw(f,n)*0.6+np.sin(2*np.pi*f*np.arange(n)/SR)*0.8)*env(n,0.003,0.18);bass[i:i+n]+=b*0.5
        # arpeggio chiptune
        note=scale[arp[pos]%len(scale)]+(12 if arp[pos]>=len(scale) else 0)
        f=440*2**((root+chord+note-9)/12);n=min(int(step*SR*0.95),N-i)
        lead[i:i+n]+=sq(f,n,.25 if bar%2 else .5)*env(n,0.002,0.09)*(0.16 if drop else 0.11)
    # riser prima del drop
    rs=int((drop_bar-1)*16*step*SR);re=int(drop_bar*16*step*SR)
    if re<=N and rs<re:
        n=re-rs;t=np.arange(n)/SR;f=200+1800*(t/t[-1])**2;r=np.sin(2*np.pi*np.cumsum(f)/SR)*0.08*(t/t[-1])+rng.standard_normal(n)*0.05*(t/t[-1])**2
        mix[rs:re]+=r
    y=mix+(bass+lead)*duck
    # fade out finale
    fo=int(0.6*SR);y[-fo:]*=np.linspace(1,0,fo)
    y=np.tanh(y*1.4);y=y/np.max(np.abs(y))*0.92
    st=np.stack([y,np.roll(y,int(0.008*SR))*0.9+y*0.1],1)
    with wave.open(out,'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((st*32767).astype('<i2').tobytes())
if __name__=='__main__':
    bpm,root,seed,secs,out,db=float(sys.argv[1]),int(sys.argv[2]),int(sys.argv[3]),float(sys.argv[4]),sys.argv[5],int(sys.argv[6])
    make(bpm,root,seed,secs,out,db)
