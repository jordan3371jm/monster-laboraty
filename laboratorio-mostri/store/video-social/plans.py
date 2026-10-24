import random,sys
sys.path.insert(0,'/tmp/claude-0/-home-user-monster-laboraty/a80ef336-cf4a-504f-bcd0-3feb86f8b0b7/scratchpad/edit')
from edit import render,STK
def rain(n,beat,dur,seed):
    r=random.Random(seed);return [(r.randrange(len(STK)),r.randint(160,920),r.randint(500,1500),r.uniform(0,dur*beat*0.8)) for _ in range(n)]
E='/tmp/claude-0/-home-user-monster-laboraty/a80ef336-cf4a-504f-bcd0-3feb86f8b0b7/scratchpad/edit/'
which=sys.argv[1]
if which=='1':
    b=60/140;P=[
     dict(src='ART',beats=4,z0=1.0,z1=1.4,text="POV:|you can't stop merging",tsize=92,ty=420,ttilt=-3),
     dict(src='M',start=0,speed=2.5,zoom=1.55,dy=470,beats=8,fx={'punch','flash','rgb','beatflash'},stk=rain(5,b,8,1)),
     dict(src='M',start=7,speed=3,zoom=1.55,dy=470,beats=4,fx={'punch','shake'},text='WAIT FOR IT...',tsize=120,ty=330),
     dict(src='M',start=13,speed=1,zoom=1.55,dy=470,beats=2,fx={'stutter','shake','rgb'}),
     dict(src='M',start=14.5,speed=1.5,zoom=1.55,dy=470,beats=4,fx={'zoomin','shake','rgb','flash'},text='LEVEL 12?!',tsize=170,ty=360),
     dict(src='G',start=0,speed=3,beats=8,fx={'punch','tilt','sat'},text='AND IT NEVER|STOPS',tsize=115,ty=330,stk=rain(7,b,8,2)),
     dict(src='B',start=2,speed=1.5,beats=4,fx={'red','shake','punch'},text='BOSS FIGHT!',tsize=150,ty=330,ttilt=4),
     dict(src='COVER',beats=8,fx={'beatflash'},text='PLAY FREE NOW',tsize=120,ty=1590,ttilt=0)]
    render(P,140,E+'m1.wav',E+'fb-edit-1.mp4',1)
if which=='2':
    b=60/150;P=[
     dict(src='G',start=0,speed=1,beats=4,fx={'zoomin'},text='My monsters were|too weak...',tsize=105,ty=380,ttilt=-2),
     dict(src='G',start=3,speed=4,beats=6,fx={'punch','flash','sat'},text='SO I MERGED THEM',tsize=110,ty=330,stk=rain(6,b,6,3)),
     dict(src='M',start=5,speed=3,zoom=1.55,dy=470,beats=6,fx={'punch','rgb','tilt'},stk=rain(4,b,6,4)),
     dict(src='B',start=1.4,speed=1.2,beats=8,fx={'red','shake','punch','flash'},text='BOSS FIGHT!!',tsize=160,ty=330),
     dict(src='B',start=4,speed=1,beats=2,fx={'stutter','shake','rgb'},text='CRITICAL!',tsize=170,ty=330,ttilt=6),
     dict(src='B',start=6,speed=1.5,beats=6,fx={'red','shake','punch'},stk=rain(6,b,6,5),text='GG EZ',tsize=170,ty=330,tdelay=1.0),
     dict(src='COVER',beats=8,fx={'beatflash'},text='PLAY FREE NOW',tsize=120,ty=1590,ttilt=0)]
    render(P,150,E+'m2.wav',E+'fb-edit-2.mp4',2)
if which=='3':
    b=60/128;P=[
     dict(src='ART',beats=4,z0=1.45,z1=1.0,text='MERGE|SPEEDRUN',tsize=150,ty=420,ttilt=3),
     dict(src='G',start=0,speed=4,beats=8,fx={'punch','beatflash','sat'},fcol=(255,214,74),text='x10 MERGES',tsize=150,ty=330,tdelay=0.6),
     dict(src='M',start=0,speed=4,zoom=1.55,dy=470,beats=8,fx={'punch','tilt','rgb'},stk=rain(10,b,8,6),text='SO SATISFYING',tsize=130,ty=330),
     dict(src='M',start=13,speed=1,zoom=1.55,dy=470,beats=2,fx={'stutter','shake','rgb'}),
     dict(src='B',start=3,speed=2,beats=6,fx={'red','shake','punch','flash'},text='BOOM!',tsize=200,ty=360,ttilt=-5),
     dict(src='COVER',beats=10,fx={'beatflash'},text='PLAY FREE NOW',tsize=120,ty=1590,ttilt=0)]
    render(P,128,E+'m3.wav',E+'fb-edit-3.mp4',3)
