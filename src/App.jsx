import { useState, useRef, useEffect } from 'react'
import { supabase } from './supabaseClient'

const COLORS = { bu:"#5B8DEF", dd:"#F472B6", accent:"#FF8C61", purple:"#A78BFA", green:"#6ECC8E" };

const RANKS = [
  { level:1, name:"Newcomer",    emoji:"🌱", color:"#6ECC8E", xpRequired:0,    xpNext:100  },
  { level:2, name:"Explorer",    emoji:"🧭", color:"#5B8DEF", xpRequired:100,  xpNext:250  },
  { level:3, name:"Connector",   emoji:"🤝", color:"#FF8C61", xpRequired:250,  xpNext:500  },
  { level:4, name:"Adventurer",  emoji:"⚡", color:"#A78BFA", xpRequired:500,  xpNext:900  },
  { level:5, name:"Trailblazer", emoji:"🔥", color:"#F472B6", xpRequired:900,  xpNext:1400 },
  { level:6, name:"Luminary",    emoji:"✨", color:"#FFD166", xpRequired:1400, xpNext:2100 },
  { level:7, name:"Legend",      emoji:"👑", color:"#FF6B6B", xpRequired:2100, xpNext:3000 },
];

const TASKS = [
  { id:1, title:"Try a new café nearby",        people:3, distance:"0.4 mi", emoji:"☕", xp:20,  desc:"Grab a coffee at a spot you've never been to." },
  { id:2, title:"Board game night",             people:5, distance:"1.2 mi", emoji:"🎲", xp:50,  desc:"Host or join a board game session with people in your area." },
  { id:3, title:"Sunset walk at the park",      people:2, distance:"0.8 mi", emoji:"🌅", xp:30,  desc:"Take a walk and enjoy the sunset." },
  { id:4, title:"Cook a new recipe together",   people:4, distance:"2.1 mi", emoji:"🍜", xp:60,  desc:"Cook something new with someone nearby." },
  { id:5, title:"Volunteer at a local shelter", people:6, distance:"3.0 mi", emoji:"🏠", xp:120, desc:"Spend a few hours volunteering." },
  { id:6, title:"Outdoor hiking trail",         people:4, distance:"5.2 mi", emoji:"🥾", xp:100, desc:"Hit a trail with others." },
];

const FEED_POSTS = [
  { id:1, user:"Maya",   initials:"M", color:COLORS.dd,     time:"5m ago",  content:"Just did the sunset walk with two strangers — we ended up talking for 2 hours. Buddy really changed my week.", likes:42, task:"Sunset walk",     level:4 },
  { id:2, user:"Jordan", initials:"J", color:COLORS.bu,     time:"22m ago", content:"BU helped me figure out I actually like hiking. Did my first trail today solo and it was everything.",           likes:88, task:null,              level:6 },
  { id:3, user:"Priya",  initials:"P", color:COLORS.purple, time:"1h ago",  content:"Board game night was so fun. Met three new people, one of them is my new bestie fr.",                           likes:61, task:"Board game night", level:3 },
];

const NEARBY = [
  { id:1, name:"Alex",  initials:"AL", color:"#34D399",     interests:["Hiking","Music"],   distance:"~0.3 mi", level:5, status:"Up for anything today" },
  { id:2, name:"Sam",   initials:"SM", color:COLORS.accent, interests:["Gaming","Coding"],  distance:"~0.6 mi", level:2, status:"Looking for a task buddy" },
  { id:3, name:"Nora",  initials:"NR", color:COLORS.purple, interests:["Art","Reading"],    distance:"~1.0 mi", level:7, status:"Free this evening" },
  { id:4, name:"Chris", initials:"CR", color:"#60A5FA",     interests:["Fitness","Travel"], distance:"~1.4 mi", level:3, status:"Want to try something new" },
];

const INTERESTS = [
  { id:"hiking",label:"Hiking",emoji:"🥾" },{ id:"gaming",label:"Gaming",emoji:"🎮" },
  { id:"cooking",label:"Cooking",emoji:"🍳" },{ id:"music",label:"Music",emoji:"🎵" },
  { id:"art",label:"Art",emoji:"🎨" },{ id:"reading",label:"Reading",emoji:"📚" },
  { id:"fitness",label:"Fitness",emoji:"💪" },{ id:"movies",label:"Movies",emoji:"🎬" },
  { id:"travel",label:"Travel",emoji:"✈️" },{ id:"photography",label:"Photos",emoji:"📷" },
  { id:"coding",label:"Coding",emoji:"💻" },{ id:"yoga",label:"Yoga",emoji:"🧘" },
];

const FRIENDS_INIT = [
  { id:1, name:"Maya",   initials:"M",  color:COLORS.dd,     level:4, status:"online" },
  { id:2, name:"Jordan", initials:"J",  color:COLORS.bu,     level:6, status:"on a task" },
  { id:3, name:"Priya",  initials:"P",  color:COLORS.purple, level:3, status:"offline" },
];
const REQS_INIT = [
  { id:10, name:"Alex",  initials:"AL", color:"#34D399", level:5 },
  { id:11, name:"Chris", initials:"CR", color:"#60A5FA", level:3 },
];

function getRank(xp) { let r=RANKS[0]; for(const k of RANKS){if(xp>=k.xpRequired)r=k;} return r; }

function getPct(xp, rank) {
  const range = rank.xpNext - rank.xpRequired;
  if (range <= 0) return 100;
  return Math.min(100, Math.round(((xp - rank.xpRequired) / range) * 100));
}

function timeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
.R{font-family:'Nunito',sans-serif;--bu:#5B8DEF;--dd:#F472B6;--accent:#FF8C61;--bg:#F7F4FF;--card:#FFF;--border:rgba(91,141,239,0.12);--tp:#1a1625;--ts:#6b6580;--tt:#9d97b8;}
.R *::-webkit-scrollbar{display:none;}.R *{-ms-overflow-style:none;scrollbar-width:none;}
.R input{font-family:'Nunito',sans-serif;outline:none;border:1.5px solid var(--border);background:var(--card);color:var(--tp);padding:12px 16px;border-radius:14px;font-size:15px;width:100%;}
.R input:focus{border-color:var(--bu);}.R input::placeholder{color:var(--tt);}
.R button{cursor:pointer;font-family:'Nunito',sans-serif;}
.fi{animation:fi .3s ease both;}@keyframes fi{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.fl{animation:fl 3s ease-in-out infinite;}@keyframes fl{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
.pr{animation:pr 2s ease-in-out infinite;}@keyframes pr{0%,100%{box-shadow:0 0 0 0 rgba(91,141,239,.3);}50%{box-shadow:0 0 0 8px rgba(91,141,239,0);}}
.xf{transition:width .8s cubic-bezier(.34,1.56,.64,1);}
.xp{animation:xp .45s cubic-bezier(.34,1.56,.64,1) both;}@keyframes xp{from{transform:translateX(-50%) scale(.6);opacity:0;}to{transform:translateX(-50%) scale(1);opacity:1;}}
.se{animation:se .3s cubic-bezier(.34,1.1,.64,1) both;}@keyframes se{from{transform:translateY(100%);}to{transform:translateY(0);}}
.mb{animation:mb .2s ease both;}@keyframes mb{from{opacity:0;}to{opacity:1;}}
.si{animation:si .28s cubic-bezier(.34,1.1,.64,1) both;}@keyframes si{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);}}
@keyframes db{0%,80%,100%{transform:scale(.7);opacity:.5;}40%{transform:scale(1);opacity:1;}}
`;

function Logo({size=32}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
        <div style={{width:size*.7,height:size*.7,borderRadius:"50%",background:COLORS.bu,position:"absolute",top:0,left:0}}/>
        <div style={{width:size*.7,height:size*.7,borderRadius:"50%",background:COLORS.dd,position:"absolute",bottom:0,right:0,opacity:.9}}/>
      </div>
      <span style={{fontSize:size*.7,fontWeight:700,fontFamily:"'Sora',sans-serif",color:"var(--tp)",letterSpacing:-1}}>buddy</span>
    </div>
  );
}

function Av({initials,color,size=38,level}){
  const rank=level?getRank(RANKS[Math.max(0,level-1)].xpRequired):null;
  return(
    <div style={{position:"relative",flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",border:`2px solid ${rank?rank.color+"70":color+"44"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.32,fontWeight:700,color,fontFamily:"'Sora',sans-serif"}}>{initials}</div>
      {rank&&<div style={{position:"absolute",bottom:-3,right:-3,width:size*.42,height:size*.42,borderRadius:"50%",background:rank.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.21,border:"1.5px solid white"}}>{rank.emoji}</div>}
    </div>
  );
}

function RankPill({level,small}){
  const r=getRank(RANKS[Math.max(0,level-1)].xpRequired);
  return(<span style={{display:"inline-flex",alignItems:"center",gap:3,background:r.color+"20",color:r.color,border:`1px solid ${r.color}50`,borderRadius:20,padding:small?"1px 7px":"2px 9px",fontSize:small?10:11,fontWeight:700,lineHeight:1.6}}>{r.emoji} {r.name}</span>);
}

function XPBar({xp,rank,small}){
  const pct=getPct(xp,rank), nxt=RANKS[rank.level]||null, maxed=rank.level===7, h=small?5:10;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:small?4:6}}>
        <span style={{fontSize:small?10:12,color:"var(--ts)",fontWeight:600}}>{maxed?"MAX 👑":`${xp} / ${rank.xpNext} XP`}</span>
        {!maxed&&nxt&&<span style={{fontSize:small?10:11,color:"var(--tt)"}}>→ {nxt.emoji} {nxt.name}</span>}
      </div>
      <div style={{height:h,borderRadius:h,background:"rgba(91,141,239,.1)",overflow:"hidden"}}>
        <div className="xf" style={{height:"100%",width:`${pct}%`,borderRadius:h,background:maxed?"linear-gradient(90deg,#FFD166,#FF6B6B,#F472B6)":`linear-gradient(90deg,${rank.color},${rank.color}bb)`}}/>
      </div>
    </div>
  );
}

function Mascot({name,color,speaking}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7}}>
      <div className={speaking?"pr fl":"fl"} style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${color}30,${color}60)`,border:`2.5px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color,fontFamily:"'Sora',sans-serif",animationDelay:name==="DD"?"0.5s":"0s",filter:speaking?`drop-shadow(0 0 10px ${color}99)`:"none"}}>{name}</div>
      <span style={{fontSize:11,fontWeight:600,color,background:color+"18",borderRadius:20,padding:"2px 10px"}}>{name}</span>
    </div>
  );
}

function VerifyModal({task,onVerify,onClose}){
  const [mode,setMode]=useState(null);
  const [done,setDone]=useState(false);
  const confirm=()=>{setDone(true);setTimeout(()=>onVerify(task),1000);};
  return(
    <div className="mb" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(26,22,37,.7)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div className="se" onClick={e=>e.stopPropagation()} style={{background:"var(--card)",borderRadius:"24px 24px 0 0",padding:"20px 20px 36px",width:"100%",maxWidth:420}}>
        <div style={{width:40,height:4,borderRadius:2,background:"var(--border)",margin:"0 auto 18px"}}/>
        {done?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <p style={{fontSize:17,fontWeight:700,color:"var(--tp)",fontFamily:"'Sora',sans-serif"}}>Verified!</p>
            <p style={{fontSize:13,color:"var(--ts)",marginTop:6}}>+{task.xp} XP incoming</p>
          </div>
        ):(
          <>
            <p style={{fontSize:16,fontWeight:700,color:"var(--tp)",fontFamily:"'Sora',sans-serif",marginBottom:4}}>Verify: {task.title}</p>
            <p style={{fontSize:13,color:"var(--ts)",marginBottom:18,lineHeight:1.6}}>{task.desc}</p>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <button onClick={()=>setMode("loc")} style={{flex:1,padding:"13px 0",borderRadius:14,border:`2px solid ${mode==="loc"?COLORS.bu:"var(--border)"}`,background:mode==="loc"?COLORS.bu+"18":"none",display:"flex",flexDirection:"column",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:mode==="loc"?COLORS.bu:"var(--ts)"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z"/></svg>
                Share Location
              </button>
              <button onClick={()=>setMode("photo")} style={{flex:1,padding:"13px 0",borderRadius:14,border:`2px solid ${mode==="photo"?COLORS.dd:"var(--border)"}`,background:mode==="photo"?COLORS.dd+"18":"none",display:"flex",flexDirection:"column",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:mode==="photo"?COLORS.dd:"var(--ts)"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                Take a Photo
              </button>
            </div>
            {mode&&<div className="fi" style={{padding:"10px 12px",borderRadius:12,background:(mode==="loc"?COLORS.bu:COLORS.dd)+"10",border:`1px solid ${(mode==="loc"?COLORS.bu:COLORS.dd)}30`,fontSize:12,color:"var(--ts)",lineHeight:1.5,marginBottom:14}}>{mode==="loc"?"📍 We'll confirm your location at the task spot.":"📸 Take or upload a photo of you doing the task."}</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={onClose} style={{flex:1,padding:"11px 0",borderRadius:14,border:"1px solid var(--border)",background:"none",fontSize:14,fontWeight:600,color:"var(--ts)"}}>Cancel</button>
              <button onClick={confirm} disabled={!mode} style={{flex:2,padding:"11px 0",borderRadius:14,border:"none",background:mode?`linear-gradient(135deg,${COLORS.bu},#7BA7F5)`:"#E8E5F5",color:mode?"white":"var(--tt)",fontSize:14,fontWeight:700}}>Verify & Earn +{task.xp} XP</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PersonModal({person,onClose,onXPGain}){
  const [invited,setInvited]=useState(null);
  return(
    <div className="mb" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(26,22,37,.7)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div className="se" onClick={e=>e.stopPropagation()} style={{background:"var(--card)",borderRadius:"24px 24px 0 0",padding:"20px 20px 36px",width:"100%",maxWidth:420,maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"var(--border)",margin:"0 auto 16px"}}/>
        <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
          <Av initials={person.initials} color={person.color} size={56} level={person.level}/>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <p style={{margin:0,fontSize:18,fontWeight:700,color:"var(--tp)",fontFamily:"'Sora',sans-serif"}}>{person.name}</p>
              <RankPill level={person.level} small/>
            </div>
            <p style={{margin:0,fontSize:12,color:"var(--ts)"}}>{person.status}</p>
            <p style={{margin:"3px 0 0",fontSize:12,color:"var(--tt)",fontWeight:600}}>📍 {person.distance} from you</p>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          {person.interests.map(i=><span key={i} style={{fontSize:12,background:COLORS.bu+"18",color:COLORS.bu,borderRadius:8,padding:"4px 10px",fontWeight:700}}>{i}</span>)}
        </div>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <button style={{flex:1,padding:"10px 0",borderRadius:12,border:`1.5px solid ${COLORS.bu}`,background:COLORS.bu+"12",fontSize:13,fontWeight:700,color:COLORS.bu}}>👋 Say hi</button>
          <button style={{flex:1,padding:"10px 0",borderRadius:12,border:`1.5px solid ${COLORS.green}`,background:COLORS.green+"12",fontSize:13,fontWeight:700,color:COLORS.green}}>➕ Add friend</button>
        </div>
        <p style={{fontSize:13,fontWeight:700,color:"var(--tp)",margin:"0 0 10px",fontFamily:"'Sora',sans-serif"}}>Invite to a task</p>
        {invited?(
          <div style={{padding:14,borderRadius:14,background:COLORS.green+"12",border:`1px solid ${COLORS.green}30`,textAlign:"center"}}>
            <p style={{margin:0,fontSize:14,fontWeight:700,color:COLORS.green}}>Invite sent!</p>
            <p style={{margin:"4px 0 0",fontSize:12,color:"var(--ts)"}}>Group XP bonus: +{Math.round(invited.xp*.5)} extra each</p>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {TASKS.map(t=>(
              <button key={t.id} onClick={()=>{setInvited(t);onXPGain(Math.round(t.xp*.25),`Invited ${person.name}`);}} style={{display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:14,border:"1px solid var(--border)",background:"none",textAlign:"left"}}>
                <span style={{fontSize:22}}>{t.emoji}</span>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:13,fontWeight:700,color:"var(--tp)"}}>{t.title}</p>
                  <p style={{margin:0,fontSize:11,color:"var(--ts)"}}>+{t.xp} XP + group bonus</p>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:COLORS.green,background:COLORS.green+"15",borderRadius:8,padding:"3px 8px"}}>Invite</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardName({onNext}){
  const [name,setName]=useState("");
  const ok=name.trim().length>0;
  return(
    <div className="fi" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:580,padding:"2rem 1.5rem",textAlign:"center"}}>
      <div className="fl" style={{marginBottom:20}}><Logo size={50}/></div>
      <div style={{width:56,height:3,borderRadius:2,background:`linear-gradient(90deg,${COLORS.bu},${COLORS.dd})`,marginBottom:24}}/>
      <h2 style={{fontSize:26,fontWeight:700,fontFamily:"'Sora',sans-serif",margin:"0 0 10px",color:"var(--tp)"}}>Hey, welcome 👋</h2>
      <p style={{fontSize:15,color:"var(--ts)",marginBottom:32,maxWidth:290,lineHeight:1.6}}>Buddy helps you find people and do things together. What's your name?</p>
      <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ok&&onNext(name.trim())} placeholder="Your first name" style={{maxWidth:320,textAlign:"center",fontSize:17,fontWeight:600}} autoFocus/>
      <button onClick={()=>ok&&onNext(name.trim())} style={{marginTop:16,width:"100%",maxWidth:320,padding:"14px 0",borderRadius:14,border:"none",background:ok?`linear-gradient(135deg,${COLORS.bu},#7BA7F5)`:"#E8E5F5",color:ok?"white":"var(--tt)",fontSize:15,fontWeight:700}}>Let's go →</button>
    </div>
  );
}

function OnboardInterests({name,onNext}){
  const [sel,setSel]=useState([]);
  const toggle=id=>setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const ok=sel.length>=3;
  return(
    <div className="fi" style={{padding:"1.75rem 1.5rem",maxWidth:480,margin:"0 auto"}}>
      <Logo size={26}/>
      <h2 style={{fontSize:21,fontWeight:700,fontFamily:"'Sora',sans-serif",margin:"18px 0 6px",color:"var(--tp)"}}>What lights you up, {name}?</h2>
      <p style={{fontSize:13.5,color:"var(--ts)",margin:"0 0 20px",lineHeight:1.6}}>Pick at least 3 — we'll match you with people and activities.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>
        {INTERESTS.map(i=>{
          const on=sel.includes(i.id);
          return(<button key={i.id} onClick={()=>toggle(i.id)} style={{padding:"13px 6px",borderRadius:16,border:`2px solid ${on?COLORS.bu:"rgba(91,141,239,.15)"}`,background:on?COLORS.bu+"22":"var(--card)",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <span style={{fontSize:22}}>{i.emoji}</span>
            <span style={{fontSize:11.5,fontWeight:on?700:500,color:on?COLORS.bu:"var(--ts)"}}>{i.label}</span>
          </button>);
        })}
      </div>
      {!ok&&<p style={{fontSize:13,color:"var(--tt)",textAlign:"center",marginBottom:10}}>{sel.length===0?"Not sure? BU and DD will help!":`${3-sel.length} more to go`}</p>}
      <button onClick={()=>onNext(sel)} style={{width:"100%",padding:"13px 0",borderRadius:14,border:"none",background:ok?`linear-gradient(135deg,${COLORS.accent},#FF6B3A)`:"#E8E5F5",color:ok?"white":"var(--tt)",fontSize:15,fontWeight:700}}>{ok?"Meet your Buddies ✨":`Choose ${3-sel.length} more`}</button>
      {!ok&&<button onClick={()=>onNext([])} style={{width:"100%",marginTop:10,padding:"10px 0",borderRadius:14,border:"none",background:"none",color:"var(--tt)",fontSize:13,fontWeight:600}}>Skip — let BU & DD guide me</button>}
    </div>
  );
}

function OnboardMascots({name,onNext}){
  const [step,setStep]=useState(0);
  const lines=[
    {who:"BU",color:COLORS.bu,text:`Hey ${name}! I'm BU. I'm here whenever you need a calm chat or a push to get outside.`},
    {who:"DD",color:COLORS.dd,text:`And I'm DD! I'm the hype one. I'll drag you out to try new things and celebrate every win.`},
    {who:"BU",color:COLORS.bu,text:`Together we'll help you meet people nearby, and you'll level up as you do more — all the way to 👑 Legend!`},
    {who:"DD",color:COLORS.dd,text:`XP for every task, every new friend, every chat. Let's get you that Legend badge. Let's GO! 🚀`},
  ];
  const cur=lines[step];
  return(
    <div className="fi" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:580,padding:"2rem 1.5rem",textAlign:"center",maxWidth:400,margin:"0 auto"}}>
      <Logo size={30}/>
      <div style={{display:"flex",gap:40,margin:"28px 0 24px"}}>
        <Mascot name="BU" color={COLORS.bu} speaking={cur.who==="BU"}/>
        <Mascot name="DD" color={COLORS.dd} speaking={cur.who==="DD"}/>
      </div>
      <div key={step} className="fi" style={{background:cur.color+"12",border:`2px solid ${cur.color}30`,borderRadius:18,padding:"18px 22px",marginBottom:24,minHeight:80,maxWidth:340}}>
        <p style={{fontSize:14.5,color:"var(--tp)",margin:0,lineHeight:1.65}}>{cur.text}</p>
      </div>
      <div style={{display:"flex",gap:7,marginBottom:22}}>
        {lines.map((_,i)=><div key={i} style={{width:i===step?22:7,height:7,borderRadius:4,background:i===step?cur.color:"rgba(91,141,239,.2)",transition:"all .25s"}}/>)}
      </div>
      <button onClick={()=>step<lines.length-1?setStep(step+1):onNext()} style={{width:"100%",maxWidth:300,padding:"13px 0",borderRadius:14,border:"none",background:`linear-gradient(135deg,${cur.color},${cur.color}cc)`,color:"white",fontSize:15,fontWeight:700}}>
        {step<lines.length-1?"Next →":"Let's go! 🎉"}
      </button>
    </div>
  );
}

function Navbar({active,setActive}){
  const tabs=[
    {id:"home",    label:"Home",    icon:on=><svg width="19" height="19" viewBox="0 0 24 24" fill={on?COLORS.bu:"none"} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
    {id:"tasks",   label:"Tasks",   icon:()=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>},
    {id:"nearby",  label:"Nearby",  icon:on=><svg width="19" height="19" viewBox="0 0 24 24" fill={on?COLORS.bu+"30":"none"} stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z"/></svg>},
    {id:"friends", label:"Friends", icon:on=><svg width="19" height="19" viewBox="0 0 24 24" fill={on?COLORS.bu+"30":"none"} stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
    {id:"profile", label:"You",     icon:()=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
  ];
  return(
    <div style={{background:"var(--card)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-around",padding:"8px 4px 12px",flexShrink:0}}>
      {tabs.map(t=>{
        const on=active===t.id;
        return(<button key={t.id} onClick={()=>setActive(t.id)} style={{background:on?COLORS.bu+"12":"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 10px",borderRadius:12,color:on?COLORS.bu:"var(--tt)"}}>
          {t.icon(on)}
          <span style={{fontSize:10,fontWeight:on?700:500}}>{t.label}</span>
        </button>);
      })}
    </div>
  );
}

function ChatPanel({chatState,setChatState,onXPGain}){
  const {activeMascot,buMsgs,ddMsgs}=chatState;
  const msgs=activeMascot==="BU"?buMsgs:ddMsgs;
  const [input,setInput]=useState("");
  const [buLoading,setBuLoading]=useState(false);
  const [ddLoading,setDdLoading]=useState(false);
  const loading=activeMascot==="BU"?buLoading:ddLoading;
  const countRef=useRef(0);
  const bottom=useRef();
  const color=activeMascot==="BU"?COLORS.bu:COLORS.dd;
  useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth"});},[msgs,buLoading,ddLoading]);

  const setMsgs=(mascot,list)=>setChatState(s=>mascot==="BU"?{...s,buMsgs:list}:{...s,ddMsgs:list});
  const getMsgs=(mascot)=>mascot==="BU"?buMsgs:ddMsgs;

  const send=async()=>{
    if(!input.trim()||loading)return;
    const txt=input.trim();
    const currentMascot=activeMascot;
    const currentMsgs=getMsgs(currentMascot);
    setInput("");
    const next=[...currentMsgs,{from:"user",text:txt}];
    setMsgs(currentMascot,next);
    if(currentMascot==="BU") setBuLoading(true);
    else setDdLoading(true);
    countRef.current+=1;
    if(countRef.current%3===0) onXPGain(10,"Chatted with "+currentMascot);
    try{
      const systemPrompt=currentMascot==="BU"
        ?"You are BU, a calm warm empathetic AI companion on the Buddy app. Buddy helps lonely people make real-world connections through local activities. Help users feel heard and gently encourage real-world social activities. Be supportive and gentle. 2-3 sentences max."
        :"You are DD, an energetic enthusiastic AI companion on the Buddy app. Buddy helps lonely people make real-world connections. Be motivating, fun, and push users to try new things. 2-3 sentences max.";
      const res=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer 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"},
        body:JSON.stringify({model:"llama-3.1-8b-instant",messages:[{role:"system",content:systemPrompt},{role:"user",content:txt}],max_tokens:150,temperature:0.8})
      });
      const data=await res.json();
      const reply=data?.choices?.[0]?.message?.content||"I'm here with you.";
      setMsgs(currentMascot,[...next,{from:currentMascot,text:reply}]);
    }catch(err){
      console.error('Chat error:',err);
      setMsgs(currentMascot,[...next,{from:currentMascot,text:currentMascot==="BU"?"I'm still here with you.":"Wifi's being weak but I'm not! Try again in a sec!"}]);
    }
    if(currentMascot==="BU") setBuLoading(false);
    else setDdLoading(false);
  };

  return(
    <div className="si" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",gap:10,background:"var(--card)",alignItems:"center",flexShrink:0}}>
        <button onClick={()=>setChatState(s=>({...s,open:false}))} style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:4,color:"var(--ts)",fontSize:13,fontWeight:600,padding:"4px 8px 4px 0"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div style={{flex:1,display:"flex",gap:8}}>
          {["BU","DD"].map(m=>{
            const c=m==="BU"?COLORS.bu:COLORS.dd, on=activeMascot===m;
            return(<button key={m} onClick={()=>setChatState(s=>({...s,activeMascot:m}))} style={{flex:1,padding:"7px 0",borderRadius:10,border:`2px solid ${on?c:"var(--border)"}`,background:on?c+"18":"none",fontSize:13,fontWeight:700,color:on?c:"var(--ts)",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:c,opacity:on?1:.35}}/>{m}
            </button>);
          })}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
            {m.from!=="user"&&<div style={{width:28,height:28,borderRadius:"50%",background:(m.from==="BU"?COLORS.bu:COLORS.dd)+"22",border:`2px solid ${(m.from==="BU"?COLORS.bu:COLORS.dd)}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:m.from==="BU"?COLORS.bu:COLORS.dd,flexShrink:0}}>{m.from}</div>}
            <div style={{maxWidth:"75%",padding:"11px 14px",borderRadius:m.from==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.from==="user"?`linear-gradient(135deg,${COLORS.bu},#7BA7F5)`:color+"18",color:m.from==="user"?"white":"var(--tp)",fontSize:13.5,lineHeight:1.6,fontWeight:500}}>{m.text}</div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:color+"22",border:`2px solid ${color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color}}>{activeMascot}</div>
            <div style={{padding:"12px 16px",borderRadius:"16px 16px 16px 4px",background:color+"18",display:"flex",gap:5}}>
              {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:color,animation:"db 1.2s ease-in-out infinite",animationDelay:`${i*.15}s`}}/>)}
            </div>
          </div>
        )}
        <div ref={bottom}/>
      </div>
      <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",display:"flex",gap:8,background:"var(--card)",alignItems:"center",flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&send()} placeholder={`Message ${activeMascot}...`} style={{flex:1,padding:"11px 15px",fontSize:14,borderRadius:14}}/>
        <button onClick={send} disabled={!input.trim()||loading} style={{width:42,height:42,borderRadius:14,border:"none",background:input.trim()&&!loading?`linear-gradient(135deg,${color},${color}cc)`:"var(--border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
        </button>
      </div>
    </div>
  );
}

function HomeScreen({name,xp,userId,onOpenChat}){
  const [liked,setLiked]=useState({});
  const [posts,setPosts]=useState(FEED_POSTS);
  const [loadingPosts,setLoadingPosts]=useState(false);
  const hour=new Date().getHours();
  const greet=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const rank=getRank(xp);
  useEffect(()=>{loadPosts();},[]);
  const loadPosts=async()=>{
    setLoadingPosts(true);
    try{
      const {data}=await supabase.from('feed_posts').select(`id,content,task_label,likes_count,created_at,profiles(name,avatar_initials,avatar_color,xp)`).order('created_at',{ascending:false}).limit(20);
      if(data&&data.length>0){
        setPosts(data.map(p=>({id:p.id,user:p.profiles?.name||'Buddy User',initials:p.profiles?.avatar_initials||'?',color:p.profiles?.avatar_color||COLORS.bu,time:timeAgo(p.created_at),content:p.content,likes:p.likes_count,task:p.task_label,level:getRank(p.profiles?.xp||0).level})));
      }
    }catch(e){console.log('Using mock feed');}
    setLoadingPosts(false);
  };
  const handleLike=async(postId)=>{
    const alreadyLiked=liked[postId];
    setLiked(l=>({...l,[postId]:!alreadyLiked}));
    if(userId){
      if(!alreadyLiked){
        await supabase.from('post_likes').insert({user_id:userId,post_id:postId});
        const post=posts.find(p=>p.id===postId);
        if(post)await supabase.from('feed_posts').update({likes_count:(post.likes||0)+1}).eq('id',postId);
      }else{
        await supabase.from('post_likes').delete().match({user_id:userId,post_id:postId});
      }
    }
  };
  return(
    <div style={{flex:1,overflowY:"auto",padding:16,minHeight:0}}>
      <div style={{marginBottom:18}}>
        <p style={{fontSize:13,color:"var(--ts)",margin:"0 0 3px",fontWeight:500}}>{greet} ✨</p>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <h2 style={{fontSize:24,fontWeight:700,fontFamily:"'Sora',sans-serif",margin:0,color:"var(--tp)"}}>{name}</h2>
          <RankPill level={rank.level}/>
        </div>
      </div>
      <button onClick={onOpenChat} style={{width:"100%",background:`linear-gradient(135deg,${COLORS.bu}12,${COLORS.dd}12)`,border:`1.5px solid ${COLORS.bu}25`,borderRadius:18,padding:"14px 16px",marginBottom:20,display:"flex",gap:12,alignItems:"center",textAlign:"left"}}>
        <div style={{display:"flex"}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:COLORS.bu+"25",border:`2px solid ${COLORS.bu}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:COLORS.bu,zIndex:1}}>BU</div>
          <div style={{width:36,height:36,borderRadius:"50%",background:COLORS.dd+"25",border:`2px solid ${COLORS.dd}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:COLORS.dd,marginLeft:-10}}>DD</div>
        </div>
        <div style={{flex:1}}>
          <p style={{margin:0,fontSize:13.5,color:"var(--tp)",fontWeight:700}}>BU & DD are here for you</p>
          <p style={{margin:0,fontSize:12,color:"var(--ts)"}}>Tap to chat or bring them into your world</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tt)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <p style={{fontSize:11,fontWeight:700,color:"var(--tt)",margin:"0 0 12px",textTransform:"uppercase",letterSpacing:1}}>Community Feed</p>
      {loadingPosts&&<p style={{textAlign:"center",color:"var(--tt)",fontSize:13,padding:"20px 0"}}>Loading posts...</p>}
      {posts.map((p,idx)=>(
        <div key={p.id} className="fi" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:18,padding:14,marginBottom:12,animationDelay:`${idx*.07}s`}}>
          {p.task&&<div style={{display:"inline-flex",gap:4,background:COLORS.accent+"18",color:COLORS.accent,fontSize:11,fontWeight:700,borderRadius:8,padding:"3px 9px",marginBottom:10}}>✓ {p.task}</div>}
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <Av initials={p.initials} color={p.color} size={36} level={p.level}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:13.5,fontWeight:700,color:"var(--tp)"}}>{p.user}</span>
                  <RankPill level={p.level} small/>
                </div>
                <span style={{fontSize:11,color:"var(--tt)"}}>{p.time}</span>
              </div>
              <p style={{fontSize:13,color:"var(--tp)",margin:"0 0 10px",lineHeight:1.6}}>{p.content}</p>
              <button onClick={()=>handleLike(p.id)} style={{background:liked[p.id]?COLORS.dd+"12":"none",border:"none",fontSize:12,color:liked[p.id]?COLORS.dd:"var(--ts)",display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:8,fontWeight:600}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill={liked[p.id]?COLORS.dd:"none"} stroke={liked[p.id]?COLORS.dd:"currentColor"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {p.likes+(liked[p.id]?1:0)}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TasksScreen({onXPGain,userId}){
  const [modes,setModes]=useState({});
  const [joined,setJoined]=useState({});
  const [done,setDone]=useState({});
  const [modal,setModal]=useState(null);
  const [invite,setInvite]=useState(null);
  const verify=async(task)=>{
    const solo=modes[task.id]==="solo";
    const earned=solo?task.xp:Math.round(task.xp*1.5);
    setDone(d=>({...d,[task.id]:{earned,solo}}));
    setJoined(j=>({...j,[task.id]:false}));
    onXPGain(earned,task.title+(solo?"":" (group bonus!)"));
    setModal(null);
    if(userId){
      await supabase.from('task_completions').insert({user_id:userId,task_id:task.id,mode:solo?'solo':'group',xp_earned:earned});
      await supabase.from('feed_posts').insert({user_id:userId,content:`Just completed "${task.title}"! ${solo?'Went solo 💪':'Did it with a buddy 🤝'} Earned ${earned} XP!`,task_label:task.title,likes_count:0});
    }
  };
  return(
    <div style={{flex:1,overflowY:"auto",padding:16,minHeight:0}}>
      <h2 style={{fontSize:21,fontWeight:700,fontFamily:"'Sora',sans-serif",margin:"0 0 4px",color:"var(--tp)"}}>Tasks near you</h2>
      <p style={{fontSize:13,color:"var(--ts)",margin:"0 0 16px"}}>Go solo or bring someone — group earns bonus XP</p>
      {TASKS.map(t=>{
        const mode=modes[t.id],isIn=joined[t.id],isDone=done[t.id],grpXP=Math.round(t.xp*1.5);
        return(
          <div key={t.id} style={{background:"var(--card)",border:`1px solid ${isDone?COLORS.green+"60":"var(--border)"}`,borderRadius:18,padding:16,marginBottom:12}}>
            <div style={{display:"flex",gap:12,marginBottom:12}}>
              <div style={{width:48,height:48,borderRadius:14,background:COLORS.bu+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{t.emoji}</div>
              <div style={{flex:1}}>
                <p style={{margin:"0 0 5px",fontSize:14,fontWeight:700,color:"var(--tp)",fontFamily:"'Sora',sans-serif"}}>{t.title}</p>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:"var(--ts)"}}>👥 {t.people} going</span>
                  <span style={{fontSize:11,color:"var(--ts)"}}>📍 {t.distance}</span>
                  <span style={{fontSize:11,color:COLORS.green,fontWeight:700}}>+{t.xp} solo</span>
                  <span style={{fontSize:11,color:COLORS.accent,fontWeight:700}}>+{grpXP} group</span>
                </div>
              </div>
            </div>
            {isDone&&<div style={{padding:"9px 0",borderRadius:12,background:COLORS.green+"18",color:COLORS.green,fontSize:13,fontWeight:700,textAlign:"center"}}>✓ {isDone.solo?"Solo":"Group"} complete · +{isDone.earned} XP</div>}
            {!isDone&&isIn&&(
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setJoined(j=>({...j,[t.id]:false}));setModes(m=>({...m,[t.id]:null}));}} style={{flex:1,padding:"9px 0",borderRadius:12,border:"1px solid var(--border)",background:"none",color:"var(--ts)",fontSize:13,fontWeight:600}}>Leave</button>
                <button onClick={()=>setModal(t)} style={{flex:2,padding:"9px 0",borderRadius:12,border:"none",background:`linear-gradient(135deg,${COLORS.bu},#7BA7F5)`,color:"white",fontSize:13,fontWeight:700}}>Verify to earn XP →</button>
              </div>
            )}
            {!isDone&&!isIn&&mode&&(
              <div>
                {mode==="group"&&<div style={{marginBottom:8,padding:"10px 12px",borderRadius:12,background:COLORS.accent+"10",border:`1px solid ${COLORS.accent}30`,fontSize:12,color:"var(--ts)",lineHeight:1.5}}>Invite a friend to earn <strong style={{color:COLORS.accent}}>+{grpXP} XP</strong> instead of {t.xp}. They get the bonus too!</div>}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setModes(m=>({...m,[t.id]:null}))} style={{flex:1,padding:"9px 0",borderRadius:12,border:"1px solid var(--border)",background:"none",color:"var(--ts)",fontSize:13,fontWeight:600}}>Back</button>
                  {mode==="group"&&<button onClick={()=>setInvite(t)} style={{flex:1,padding:"9px 0",borderRadius:12,border:"none",background:COLORS.accent+"18",color:COLORS.accent,fontSize:13,fontWeight:700}}>Invite</button>}
                  <button onClick={()=>setJoined(j=>({...j,[t.id]:true}))} style={{flex:2,padding:"9px 0",borderRadius:12,border:"none",background:mode==="group"?`linear-gradient(135deg,${COLORS.accent},#FF6B3A)`:`linear-gradient(135deg,${COLORS.bu},#7BA7F5)`,color:"white",fontSize:13,fontWeight:700}}>{mode==="solo"?"Start solo":"Start anyway"}</button>
                </div>
              </div>
            )}
            {!isDone&&!isIn&&!mode&&(
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setModes(m=>({...m,[t.id]:"solo"}))} style={{flex:1,padding:"9px 0",borderRadius:12,border:`1.5px solid ${COLORS.bu}40`,background:COLORS.bu+"10",color:COLORS.bu,fontSize:13,fontWeight:700}}>Go solo</button>
                <button onClick={()=>setModes(m=>({...m,[t.id]:"group"}))} style={{flex:1,padding:"9px 0",borderRadius:12,border:`1.5px solid ${COLORS.accent}40`,background:COLORS.accent+"10",color:COLORS.accent,fontSize:13,fontWeight:700}}>With someone</button>
              </div>
            )}
          </div>
        );
      })}
      <div style={{background:COLORS.dd+"12",border:`1.5px solid ${COLORS.dd}30`,borderRadius:18,padding:16,marginBottom:8}}>
        <div style={{display:"flex",gap:10,marginBottom:10}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:COLORS.dd+"25",border:`2px solid ${COLORS.dd}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:COLORS.dd,flexShrink:0}}>DD</div>
          <div>
            <p style={{margin:"0 0 3px",fontSize:13,fontWeight:700,color:"var(--tp)"}}>DD's pick for you today</p>
            <p style={{margin:0,fontSize:12.5,color:"var(--ts)",lineHeight:1.55}}>&quot;You haven't tried anything new this week. The café task is 5 min away — solo or bring someone!&quot;</p>
          </div>
        </div>
        <button style={{background:`linear-gradient(135deg,${COLORS.dd},#E85BA8)`,color:"white",border:"none",borderRadius:10,padding:"8px 16px",fontSize:12.5,fontWeight:700}}>Show me</button>
      </div>
      {modal&&<VerifyModal task={modal} onVerify={verify} onClose={()=>setModal(null)}/>}
      {invite&&<PersonModal person={NEARBY[0]} onClose={()=>setInvite(null)} onXPGain={onXPGain}/>}
    </div>
  );
}

function NearbyScreen({onXPGain}){
  const [sel,setSel]=useState(null);
  return(
    <div style={{flex:1,overflowY:"auto",padding:16,minHeight:0}}>
      <h2 style={{fontSize:21,fontWeight:700,fontFamily:"'Sora',sans-serif",margin:"0 0 4px",color:"var(--tp)"}}>People nearby</h2>
      <p style={{fontSize:13,color:"var(--ts)",margin:"0 0 18px"}}>Tap someone to see their profile and invite them to tasks</p>
      {NEARBY.map((p,idx)=>(
        <div key={p.id} className="fi" onClick={()=>setSel(p)} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:18,padding:"14px 16px",marginBottom:12,display:"flex",gap:12,alignItems:"center",cursor:"pointer",animationDelay:`${idx*.07}s`}}>
          <Av initials={p.initials} color={p.color} size={46} level={p.level}/>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
              <p style={{margin:0,fontSize:14.5,fontWeight:700,color:"var(--tp)"}}>{p.name}</p>
              <RankPill level={p.level} small/>
            </div>
            <p style={{margin:"0 0 4px",fontSize:12,color:"var(--ts)"}}>{p.status}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {p.interests.map(i=><span key={i} style={{fontSize:11,background:COLORS.bu+"18",color:COLORS.bu,borderRadius:7,padding:"2px 9px",fontWeight:700}}>{i}</span>)}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <span style={{fontSize:11,color:"var(--tt)",fontWeight:600}}>📍 {p.distance}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tt)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      ))}
      <div style={{background:COLORS.bu+"10",border:`1.5px solid ${COLORS.bu}25`,borderRadius:18,padding:16}}>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:COLORS.bu+"25",border:`2px solid ${COLORS.bu}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:COLORS.bu,flexShrink:0}}>BU</div>
          <p style={{margin:0,fontSize:13,color:"var(--ts)",lineHeight:1.6}}>&quot;You have 3 interests in common with Alex. They're closest to you too.&quot;</p>
        </div>
        <button onClick={()=>setSel(NEARBY[0])} style={{background:`linear-gradient(135deg,${COLORS.bu},#7BA7F5)`,color:"white",border:"none",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700}}>View Alex's profile →</button>
      </div>
      {sel&&<PersonModal person={sel} onClose={()=>setSel(null)} onXPGain={onXPGain}/>}
    </div>
  );
}

function FriendsScreen(){
  const [friends,setFriends]=useState(FRIENDS_INIT);
  const [reqs,setReqs]=useState(REQS_INIT);
  const [tab,setTab]=useState("friends");
  const [search,setSearch]=useState("");
  const accept=id=>{const r=reqs.find(x=>x.id===id);if(r){setFriends(f=>[...f,{...r,status:"new friend"}]);setReqs(q=>q.filter(x=>x.id!==id));}};
  const decline=id=>setReqs(q=>q.filter(x=>x.id!==id));
  const sc=s=>s==="online"?COLORS.green:s==="on a task"?COLORS.bu:"var(--tt)";
  return(
    <div style={{flex:1,overflowY:"auto",padding:16,minHeight:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <h2 style={{fontSize:21,fontWeight:700,fontFamily:"'Sora',sans-serif",margin:0,color:"var(--tp)"}}>Friends</h2>
        {reqs.length>0&&<span style={{fontSize:11,fontWeight:700,background:COLORS.dd,color:"white",borderRadius:20,padding:"2px 9px"}}>{reqs.length} new</span>}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["friends","requests","add"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${tab===t?COLORS.bu:"var(--border)"}`,background:tab===t?COLORS.bu+"18":"none",fontSize:12,fontWeight:700,color:tab===t?COLORS.bu:"var(--ts)",position:"relative"}}>
            {t==="friends"?"My Friends":t==="requests"?"Requests":"Add Friends"}
            {t==="requests"&&reqs.length>0&&<span style={{position:"absolute",top:-4,right:-4,width:14,height:14,borderRadius:"50%",background:COLORS.dd,fontSize:9,color:"white",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{reqs.length}</span>}
          </button>
        ))}
      </div>
      {tab==="friends"&&(
        <>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search friends..." style={{marginBottom:14,fontSize:13,padding:"10px 14px"}}/>
          {friends.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())).map(f=>(
            <div key={f.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"12px 14px",marginBottom:10,display:"flex",gap:12,alignItems:"center"}}>
              <Av initials={f.initials} color={f.color} size={42} level={f.level}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                  <p style={{margin:0,fontSize:14,fontWeight:700,color:"var(--tp)"}}>{f.name}</p>
                  <RankPill level={f.level} small/>
                </div>
                <p style={{margin:0,fontSize:11.5,fontWeight:600,color:sc(f.status)}}>● {f.status}</p>
              </div>
              <button style={{padding:"7px 13px",borderRadius:10,border:`1px solid ${COLORS.bu}30`,background:COLORS.bu+"10",color:COLORS.bu,fontSize:12,fontWeight:700}}>Invite</button>
            </div>
          ))}
        </>
      )}
      {tab==="requests"&&(
        reqs.length===0
          ?<p style={{textAlign:"center",color:"var(--tt)",fontSize:13,marginTop:20}}>No pending requests</p>
          :reqs.map(r=>(
            <div key={r.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"12px 14px",marginBottom:10,display:"flex",gap:12,alignItems:"center"}}>
              <Av initials={r.initials} color={r.color} size={42} level={r.level}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                  <p style={{margin:0,fontSize:14,fontWeight:700,color:"var(--tp)"}}>{r.name}</p>
                  <RankPill level={r.level} small/>
                </div>
                <p style={{margin:0,fontSize:11.5,color:"var(--ts)"}}>Wants to be your buddy</p>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>decline(r.id)} style={{padding:"7px 10px",borderRadius:10,border:"1px solid var(--border)",background:"none",color:"var(--ts)",fontSize:12,fontWeight:600}}>✕</button>
                <button onClick={()=>accept(r.id)} style={{padding:"7px 13px",borderRadius:10,border:"none",background:COLORS.green,color:"white",fontSize:12,fontWeight:700}}>Accept</button>
              </div>
            </div>
          ))
      )}
      {tab==="add"&&(
        <>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name..." style={{marginBottom:14,fontSize:13,padding:"10px 14px"}}/>
          <p style={{fontSize:12,color:"var(--tt)",margin:"0 0 14px"}}>People you might know</p>
          {NEARBY.filter(p=>!friends.find(f=>f.name===p.name)).map(p=>(
            <div key={p.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"12px 14px",marginBottom:10,display:"flex",gap:12,alignItems:"center"}}>
              <Av initials={p.initials} color={p.color} size={42} level={p.level}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                  <p style={{margin:0,fontSize:14,fontWeight:700,color:"var(--tp)"}}>{p.name}</p>
                  <RankPill level={p.level} small/>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {p.interests.map(i=><span key={i} style={{fontSize:10,color:COLORS.bu,background:COLORS.bu+"15",borderRadius:6,padding:"1px 7px",fontWeight:700}}>{i}</span>)}
                </div>
              </div>
              <button style={{padding:"7px 13px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${COLORS.bu},#7BA7F5)`,color:"white",fontSize:12,fontWeight:700}}>+ Add</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function ProfileScreen({name,interests,xp,onDelete}){
  const rank=getRank(xp);
  const next=RANKS[rank.level]||null;
  const disp=(interests&&interests.length>0)?interests:["hiking","music","coding"];
  const [sheet,setSheet]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const stats=[
    {icon:"✅",label:"Tasks Done",value:Math.floor(xp/30)},
    {icon:"👥",label:"Friends",value:3},
    {icon:"💬",label:"Posts",value:Math.floor(xp/50)},
    {icon:"⚡",label:"XP",value:xp},
  ];
  return(
    <div style={{flex:1,overflowY:"auto",padding:16,minHeight:0}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:14,marginBottom:18}}>
        <div style={{width:86,height:86,borderRadius:"50%",background:"linear-gradient(135deg,"+rank.color+","+rank.color+"88)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,border:"3px solid "+rank.color,boxShadow:"0 6px 24px "+rank.color+"50",position:"relative"}}>
          <span style={{fontSize:36,fontWeight:700,color:"white",fontFamily:"'Sora',sans-serif"}}>{(name||"?")[0].toUpperCase()}</span>
          <div style={{position:"absolute",bottom:-2,right:-2,width:28,height:28,borderRadius:"50%",background:rank.color,border:"2.5px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{rank.emoji}</div>
        </div>
        <h2 style={{fontSize:22,fontWeight:700,fontFamily:"'Sora',sans-serif",margin:"0 0 6px",color:"var(--tp)"}}>{name}</h2>
        <RankPill level={rank.level}/>
        <p style={{margin:"6px 0 0",fontSize:12,color:"var(--tt)",fontWeight:500}}>Buddy member · Level {rank.level}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"10px 6px",textAlign:"center"}}>
            <p style={{margin:"0 0 3px",fontSize:18}}>{s.icon}</p>
            <p style={{margin:"0 0 2px",fontSize:16,fontWeight:700,color:"var(--tp)"}}>{s.value}</p>
            <p style={{margin:0,fontSize:9.5,color:"var(--tt)",fontWeight:600,lineHeight:1.3}}>{s.label}</p>
          </div>
        ))}
      </div>
      <div onClick={()=>setSheet(true)} style={{background:"linear-gradient(135deg,"+rank.color+"14,"+rank.color+"06)",border:"2px solid "+rank.color+"40",borderRadius:20,padding:"16px 18px",marginBottom:14,cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:30}}>{rank.emoji}</span>
            <div>
              <p style={{margin:"0 0 1px",fontSize:10,fontWeight:700,color:"var(--tt)",textTransform:"uppercase",letterSpacing:1}}>Current Rank</p>
              <p style={{margin:0,fontSize:20,fontWeight:700,fontFamily:"'Sora',sans-serif",color:rank.color}}>{rank.name}</p>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{margin:0,fontSize:10,color:"var(--tt)",fontWeight:600,textTransform:"uppercase"}}>Level</p>
            <p style={{margin:0,fontSize:30,fontWeight:700,fontFamily:"'Sora',sans-serif",color:rank.color,lineHeight:1}}>{rank.level}</p>
          </div>
        </div>
        <XPBar xp={xp} rank={rank}/>
        <p style={{margin:"10px 0 0",fontSize:11,color:"var(--tt)",fontWeight:600}}>{next?(rank.xpNext-xp)+" XP to "+next.emoji+" "+next.name+" · tap to see all ranks":"You've reached the highest rank!"}</p>
      </div>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:18,padding:"14px 16px",marginBottom:14}}>
        <p style={{fontSize:13,fontWeight:700,color:"var(--tp)",margin:"0 0 10px"}}>Your interests</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {disp.map(id=>{
            const it=INTERESTS.find(i=>i.id===id)||{label:id,emoji:"✨"};
            return(<span key={id} style={{fontSize:13,background:COLORS.bu+"12",color:"var(--tp)",borderRadius:10,padding:"7px 14px",fontWeight:600,border:"1px solid "+COLORS.bu+"25"}}>{it.emoji} {it.label}</span>);
          })}
        </div>
      </div>
      <div style={{background:"linear-gradient(135deg,"+COLORS.bu+"14,"+COLORS.dd+"14)",border:"1px solid "+COLORS.bu+"22",borderRadius:18,padding:"14px 16px",display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
        <div style={{width:42,height:42,borderRadius:12,background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.bu} strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
        <div>
          <p style={{margin:"0 0 2px",fontSize:13,fontWeight:700,color:"var(--tp)"}}>AR Mode — coming soon</p>
          <p style={{margin:0,fontSize:12,color:"var(--ts)"}}>Bring BU & DD into your world through your camera</p>
        </div>
      </div>
      <div style={{marginBottom:32}}>
        {!confirmDel?(
          <button onClick={()=>setConfirmDel(true)} style={{width:"100%",padding:"12px 0",borderRadius:14,border:"1.5px solid #FF6B6B40",background:"#FF6B6B0a",color:"#FF6B6B",fontSize:13,fontWeight:700}}>Delete Account</button>
        ):(
          <div style={{background:"#FF6B6B0f",border:"1.5px solid #FF6B6B40",borderRadius:18,padding:16}}>
            <p style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:"var(--tp)",fontFamily:"'Sora',sans-serif"}}>Are you sure?</p>
            <p style={{margin:"0 0 16px",fontSize:13,color:"var(--ts)",lineHeight:1.55}}>This will permanently delete your account, XP, tasks, and friends. This cannot be undone.</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDel(false)} style={{flex:1,padding:"10px 0",borderRadius:12,border:"1px solid var(--border)",background:"none",fontSize:13,fontWeight:600,color:"var(--ts)"}}>Cancel</button>
              <button onClick={onDelete} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"#FF6B6B",color:"white",fontSize:13,fontWeight:700}}>Yes, delete</button>
            </div>
          </div>
        )}
      </div>
      {sheet&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,22,37,.65)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setSheet(false)}>
          <div className="se" style={{background:"var(--card)",borderRadius:"24px 24px 0 0",padding:"20px 18px 36px",width:"100%",maxWidth:420,maxHeight:"82vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,borderRadius:2,background:"var(--border)",margin:"0 auto 18px"}}/>
            <p style={{fontSize:17,fontWeight:700,fontFamily:"'Sora',sans-serif",color:"var(--tp)",margin:"0 0 18px"}}>All Ranks</p>
            {RANKS.map(r=>{
              const cur=r.level===rank.level,unl=xp>=r.xpRequired;
              return(
                <div key={r.level} style={{display:"flex",gap:12,padding:13,borderRadius:18,background:cur?r.color+"14":"none",border:cur?"2px solid "+r.color+"45":"2px solid transparent",marginBottom:8,opacity:unl?1:0.4}}>
                  <div style={{width:46,height:46,borderRadius:14,background:r.color+"20",border:"2px solid "+r.color+"50",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{r.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                      <span style={{fontSize:15,fontWeight:700,color:r.color}}>{r.name}</span>
                      <span style={{fontSize:10,color:"var(--tt)",fontWeight:600}}>Lv.{r.level}</span>
                      {cur&&<span style={{fontSize:10,fontWeight:700,background:r.color,color:"white",borderRadius:20,padding:"1px 9px"}}>YOU</span>}
                      {unl&&!cur&&<span style={{fontSize:10,fontWeight:700,color:r.color}}>✓</span>}
                    </div>
                    <p style={{margin:"0 0 5px",fontSize:11,color:"var(--tt)"}}>{r.xpRequired.toLocaleString()} XP required</p>
                    {cur&&<XPBar xp={xp} rank={r} small/>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function App(){
  const [screen,setScreen]=useState("name");
  const [name,setName]=useState("");
  const [ints,setInts]=useState([]);
  const [tab,setTab]=useState("home");
  const [xp,setXp]=useState(0);
  const [userId,setUserId]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [toast,setToast]=useState(null);
  const toastKeyRef=useRef(0);
  const timer=useRef(null);
  const [chatState,setChatState]=useState({
    open:false,activeMascot:"BU",
    buMsgs:[{from:"BU",text:"Hey — how are you feeling today? I'm here if you want to talk or want me to suggest something fun."}],
    ddMsgs:[{from:"DD",text:"Yo! What's good — ready to have some fun or just need to talk? I'm here either way."}],
  });
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){loadProfile(session.user.id);}
      else{setAuthLoading(false);}
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(session?.user){loadProfile(session.user.id);}
    });
    return()=>subscription.unsubscribe();
  },[]);
  const loadProfile=async(uid)=>{
    const {data}=await supabase.from('profiles').select('*').eq('id',uid).single();
    if(data){setUserId(uid);setName(data.name||'');setInts(data.interests||[]);setXp(data.xp||0);setScreen('app');}
    setAuthLoading(false);
  };
  const saveProfile=async(uid,profileName,profileInts)=>{
    await supabase.from('profiles').upsert({id:uid,name:profileName,interests:profileInts,xp:0,level:1,avatar_initials:profileName[0].toUpperCase(),avatar_color:COLORS.bu});
  };
  const signUpAndSave=async(profileName,profileInts)=>{
    const {data,error}=await supabase.auth.signInAnonymously();
    if(error){setName(profileName);setInts(profileInts);setScreen('app');return;}
    if(data.user){setUserId(data.user.id);await saveProfile(data.user.id,profileName,profileInts);setName(profileName);setInts(profileInts);setScreen('app');}
  };
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const gainXP=async(amt,reason)=>{
    const newXp=Math.min(xp+amt,2999);
    setXp(newXp);
    if(userId){await supabase.from('profiles').update({xp:newXp,level:getRank(newXp).level}).eq('id',userId);}
    clearTimeout(timer.current);
    toastKeyRef.current+=1;
    setToast({amt,reason,key:toastKeyRef.current});
    timer.current=setTimeout(()=>setToast(null),2200);
  };
  const deleteAccount=async()=>{
    if(userId){await supabase.auth.signOut();}
    setScreen("name");setName("");setInts([]);setTab("home");setXp(0);setToast(null);setUserId(null);
    setChatState({open:false,activeMascot:"BU",buMsgs:[{from:"BU",text:"Hey — how are you feeling today? I'm here if you want to talk or want me to suggest something fun."}],ddMsgs:[{from:"DD",text:"Yo! What's good — ready to have some fun or just need to talk? I'm here either way."}]});
  };
  const rank=getRank(xp);
  const chatOpen=chatState.open;
  if(authLoading){
    return(
      <div className="R" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#EDE8FB"}}>
        <style>{CSS}</style>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <Logo size={40}/>
          <p style={{color:"var(--ts)",fontSize:14,fontWeight:600}}>Loading Buddy...</p>
          <div style={{display:"flex",gap:6}}>
            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:COLORS.bu,animation:"db 1.2s ease-in-out infinite",animationDelay:`${i*.15}s`}}/>)}
          </div>
        </div>
      </div>
    );
  }
  return(
    <div className="R" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#EDE8FB",padding:20}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:420,display:"flex",flexDirection:"column",height:720,background:"var(--bg)",borderRadius:28,overflow:"hidden",boxShadow:"0 24px 80px rgba(91,141,239,.22),0 4px 20px rgba(0,0,0,.08)",position:"relative"}}>
        {toast&&screen==="app"&&(
          <div key={toast.key} className="xp" style={{position:"absolute",top:64,left:"50%",background:rank.color,color:"white",borderRadius:30,padding:"8px 20px",fontSize:13.5,fontWeight:700,zIndex:200,whiteSpace:"nowrap",pointerEvents:"none"}}>+{toast.amt} XP</div>
        )}
        {screen==="name"&&<OnboardName onNext={n=>{setName(n);setScreen("quiz");}}/>}
        {screen==="quiz"&&<OnboardInterests name={name} onNext={i=>{setInts(i);setScreen("mascots");}}/>}
        {screen==="mascots"&&<OnboardMascots name={name} onNext={()=>signUpAndSave(name,ints)}/>}
        {screen==="app"&&(
          <>
            {!chatOpen&&(
              <div style={{padding:"12px 18px 10px",background:"var(--card)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <Logo size={22}/>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11.5,fontWeight:700,color:rank.color}}>{rank.emoji} {rank.name}</span>
                    <span style={{fontSize:11,color:"var(--tt)",fontWeight:600}}>{xp} XP</span>
                  </div>
                </div>
                <XPBar xp={xp} rank={rank} small/>
              </div>
            )}
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
              {chatOpen?(
                <ChatPanel chatState={chatState} setChatState={setChatState} onXPGain={gainXP}/>
              ):(
                <>
                  {tab==="home"&&<HomeScreen name={name} xp={xp} userId={userId} onOpenChat={()=>setChatState(s=>({...s,open:true}))}/>}
                  {tab==="tasks"&&<TasksScreen onXPGain={gainXP} userId={userId}/>}
                  {tab==="nearby"&&<NearbyScreen onXPGain={gainXP}/>}
                  {tab==="friends"&&<FriendsScreen/>}
                  {tab==="profile"&&<ProfileScreen name={name} interests={ints} xp={xp} onDelete={deleteAccount}/>}
                </>
              )}
            </div>
            {!chatOpen&&<Navbar active={tab} setActive={setTab}/>}
          </>
        )}
      </div>
    </div>
  );
}

export default App