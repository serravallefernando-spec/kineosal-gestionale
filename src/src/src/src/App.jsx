import { useState, useMemo, Fragment } from "react";

const B = {
  teal:"#2DC6C6", tealDark:"#1A9898", tealDeep:"#0F6B6B",
  tealLight:"#E0F7F7", tealBg:"#F2FBFB",
  purple:"#9B4CB8", purpleLight:"#F0E6F6",
  pink:"#D63A82", pinkLight:"#FCE8F1",
  green:"#3DB89A", greenLight:"#E0F5F0",
  text:"#1A2F2F", muted:"#5A8080", border:"#D0ECEC", white:"#FFFFFF",
};
const SV = {
  grotta:{ label:"Grotta del Sale", color:B.teal,   light:B.tealLight,   emoji:"🧂" },
  anthea:{ label:"Anthea",          color:B.purple, light:B.purpleLight, emoji:"🌸" },
  vacuum:{ label:"Vacuum",          color:B.pink,   light:B.pinkLight,   emoji:"💪" },
  fisio: { label:"Fisioterapia",    color:B.green,  light:B.greenLight,  emoji:"🩺" },
};
const ST = {
  confirmed:{ label:"Confermato",    icon:"✅" },
  pending:  { label:"Da confermare", icon:"⚠️" },
  cancelled:{ label:"Disdetto",      icon:"❌" },
  moved:    { label:"Spostato",      icon:"🔄" },
};
const BT = {
  ferie:   { label:"Ferie",    icon:"🏖️", color:"#0EA5E9", light:"#E0F2FE", stripe:"rgba(14,165,233,0.13)" },
  malattia:{ label:"Malattia", icon:"🤒", color:"#EF4444", light:"#FEE2E2", stripe:"rgba(239,68,68,0.13)" },
  assenza: { label:"Assenza",  icon:"📵", color:"#F59E0B", light:"#FEF3C7", stripe:"rgba(245,158,11,0.13)" },
};
const STAFF = {
  all:     { name:"Tutto il team", icon:"👥" },
  titolare:{ name:"Titolare",      icon:"👑" },
  dip1:    { name:"Dipendente 1",  icon:"👩" },
  dip2:    { name:"Dipendente 2",  icon:"👩‍🦱" },
};
const DAYS_S = ["Lun","Mar","Mer","Gio","Ven","Sab"];
const DAYS_F = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
const DURS   = [15,20,30,45,60,90,120];
const SLOT_H = 56;
const TIMES  = [];
for(let h=8; h<=19; h++){ TIMES.push(`${h}:00`); TIMES.push(`${h}:30`); }
TIMES.push("20:00");

function toDateStr(d){ return d.toISOString().split("T")[0]; }
function todayStr(){ return toDateStr(new Date()); }
function dayName(s){ const d=new Date(s+"T12:00:00"); return DAYS_F[d.getDay()===0?6:d.getDay()-1]; }
function tIdx(t){ const [h,m]=t.split(":").map(Number); return (h-8)*2+(m>=30?1:0); }
function blockAt(blocks,di,time,wd){
  if(!wd?.[di]) return null;
  const ds=toDateStr(wd[di]);
  return blocks.find(b=>{
    if(b.date!==ds) return false;
    if(b.timeFrom===null) return true;
    const ti=tIdx(time); return ti>=tIdx(b.timeFrom)&&ti<tIdx(b.timeTo);
  })||null;
}
function blockStart(b,t){ return b.timeFrom===null ? t===TIMES[0] : b.timeFrom===t; }
function initDay(di){ const t=new Date(),dow=t.getDay(),m=new Date(t); m.setDate(t.getDate()-(dow===0?6:dow-1)+di); return toDateStr(m); }
function doneApts(apts,cn,svc){ return apts.filter(a=>a.client===cn&&a.service===svc&&a.status!=="cancelled").length; }

let UID=10, BID=5, PID=10;

const INIT_APTS = [
  {id:1,day:0,time:"9:00", dur:60,client:"Maria Rossi",  phone:"3331234567",service:"grotta",status:"confirmed",notes:"Prima seduta"},
  {id:2,day:1,time:"10:30",dur:30,client:"Laura Bianchi",phone:"3387654321",service:"anthea",status:"pending",  notes:""},
  {id:3,day:2,time:"14:00",dur:90,client:"Sofia Verdi",  phone:"3459876543",service:"vacuum",status:"confirmed",notes:"Avvisare giorno prima"},
  {id:4,day:3,time:"11:00",dur:45,client:"Anna Neri",    phone:"3301112233",service:"fisio", status:"moved",    notes:"Spostata da martedì"},
  {id:5,day:4,time:"9:30", dur:30,client:"Giulia Russo", phone:"3421234567",service:"grotta",status:"cancelled",notes:"Ha disdetto"},
  {id:6,day:0,time:"11:00",dur:60,client:"Laura Bianchi",phone:"3387654321",service:"fisio", status:"confirmed",notes:""},
  {id:7,day:2,time:"9:00", dur:30,client:"Maria Rossi",  phone:"3331234567",service:"anthea",status:"confirmed",notes:""},
  {id:8,day:5,time:"10:00",dur:60,client:"Anna Neri",    phone:"3301112233",service:"vacuum",status:"confirmed",notes:"Seconda seduta"},
];
const INIT_BLOCKS = [
  {id:1,date:initDay(5),type:"ferie",  timeFrom:null,   timeTo:null,   note:"Sabato chiuso",staff:"all"},
  {id:2,date:initDay(1),type:"assenza",timeFrom:"14:00",timeTo:"18:00",note:"Visita medica", staff:"dip1"},
];
const INIT_PKGS = [
  {id:1,clientName:"Maria Rossi",  service:"grotta",purchased:10},
  {id:2,clientName:"Maria Rossi",  service:"anthea",purchased:5},
  {id:3,clientName:"Laura Bianchi",service:"anthea",purchased:8},
  {id:4,clientName:"Laura Bianchi",service:"fisio", purchased:6},
  {id:5,clientName:"Anna Neri",    service:"vacuum",purchased:4},
];

const IS = { width:"100%",padding:"9px 12px",borderRadius:10,border:`1.5px solid ${B.border}`,fontSize:14,marginBottom:12,boxSizing:"border-box",fontFamily:"inherit",color:B.text,outline:"none" };
const LS = { display:"block",fontSize:11,fontWeight:700,color:B.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.6 };

function wa(phone,msg){ window.open(`https://wa.me/39${phone}?text=${encodeURIComponent(msg)}`,"_blank"); }

function Logo({ size=44 }){
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="white" opacity="0.95"/>
      <defs>
        <linearGradient id="lg1" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#9B4CB8"/>
          <stop offset="100%" stopColor="#D63A82"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="20" r="7.5" fill="url(#lg1)"/>
      <path d="M42 30 Q28 20 25 13" stroke="url(#lg1)" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M58 30 Q72 20 75 13" stroke="url(#lg1)" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M44 28 C44 28 50 42 50 52 C50 42 56 28 56 28 Z" fill="url(#lg1)"/>
      <ellipse cx="50" cy="70" rx="23" ry="13" fill="url(#lg1)"/>
    </svg>
  );
}

function AptCard({ apt, onClick }){
  const s = SV[apt.service];
  return (
    <div onClick={onClick} style={{background:s.light,borderLeft:`3px solid ${s.color}`,borderRadius:6,padding:"3px 6px",cursor:"pointer",marginBottom:2,opacity:apt.status==="cancelled"?.4:1,textDecoration:apt.status==="cancelled"?"line-through":"none",overflow:"hidden"}}>
      <div style={{fontWeight:700,color:s.color,fontSize:10,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ST[apt.status].icon} {apt.client}</div>
      <div style={{color:B.muted,fontSize:9}}>{s.emoji} {apt.dur}min</div>
    </div>
  );
}

function PkgBar({ pkg, apts, onClick }){
  const s    = SV[pkg.service];
  const done = doneApts(apts, pkg.clientName, pkg.service);
  const pct  = Math.min(100, Math.round((done/pkg.purchased)*100));
  const rem  = pkg.purchased - done;
  const over = rem < 0;
  const warn = !over && rem <= 2;
  const barC    = over ? "#EF4444" : warn ? "#F59E0B" : s.color;
  const borderC = (over||warn) ? B.pink : B.border;
  return (
    <div onClick={onClick} style={{cursor:"pointer",marginBottom:10,padding:"10px 12px",background:B.white,borderRadius:12,border:`1.5px solid ${borderC}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:12,fontWeight:700,color:s.color}}>{s.emoji} {s.label}</span>
        <span style={{fontSize:12,fontWeight:800,color:over?"#EF4444":warn?"#F59E0B":B.text}}>{done} / {pkg.purchased} sedute</span>
      </div>
      <div style={{height:7,background:B.tealLight,borderRadius:4,overflow:"hidden",marginBottom:6}}>
        <div style={{height:"100%",width:`${pct}%`,background:barC,borderRadius:4}}/>
      </div>
      <div style={{fontSize:10,fontWeight:700,color:over?"#EF4444":warn?"#F59E0B":B.muted}}>
        {over ? `⚠️ Superate di ${-rem}` : warn ? `⚡ Ultime ${rem} sedute rimaste` : `${rem} sedute rimanenti`}
      </div>
    </div>
  );
}

function NotifPanel({ notifs, phones, onClose }){
  return (
    <div style={{position:"absolute",top:"calc(100% + 10px)",right:0,width:320,background:B.white,borderRadius:16,boxShadow:"0 8px 40px rgba(45,198,198,.25)",zIndex:300,overflow:"hidden",border:`1px solid ${B.border}`}}>
      <div style={{padding:"12px 16px",background:`linear-gradient(135deg,${B.tealDark},${B.teal})`,color:"white",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontWeight:700,fontSize:14}}>🔔 Notifiche ({notifs.length})</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,.8)",fontSize:18,cursor:"pointer"}}>✕</button>
      </div>
      {notifs.length === 0
        ? <div style={{padding:24,textAlign:"center",color:B.muted,fontSize:13}}>✅ Tutti i pacchetti sono ok!</div>
        : <div style={{maxHeight:360,overflowY:"auto"}}>
            {notifs.map((n,i) => {
              const s     = SV[n.pkg.service];
              const phone = phones[n.pkg.clientName]||"";
              const text  = n.remaining===0 ? "Pacchetto esaurito" : `Solo ${n.remaining} sedute rimaste`;
              const msg   = `Ciao ${n.pkg.clientName}! 👋 Il tuo pacchetto *${s.label}* ${n.remaining===0?"è esaurito":`ha solo ${n.remaining} sedute rimaste`}. Vuoi rinnovarlo? 💙 Kineosal`;
              const bg    = n.remaining===0 ? "#FEE2E2" : "#FFF7ED";
              return (
                <div key={i} style={{padding:"12px 16px",borderBottom:`1px solid ${B.border}`,background:bg}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:B.text}}>{n.remaining===0?"🔴":"🟠"} {n.pkg.clientName}</div>
                      <div style={{fontSize:12,color:s.color,marginTop:2}}>{s.emoji} {s.label}</div>
                      <div style={{fontSize:11,color:B.muted,marginTop:2}}>{text}</div>
                    </div>
                    {phone && <button onClick={()=>wa(phone,msg)} style={{padding:"6px 10px",borderRadius:8,background:"#25D366",color:"white",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,flexShrink:0}}>💬 WA</button>}
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}

function PkgModal({ data, clientName, apts, onSave, onDelete, onClose }){
  const [f, setF] = useState(data);
  const set  = (k,v) => setF(p=>({...p,[k]:v}));
  const s    = SV[f.service];
  const done = doneApts(apts, clientName, f.service);
  const rem  = f.purchased - done;
  const statCards = [
    { label:"Effettuate",  val:done,        bg:s.light,       color:s.color },
    { label:"Acquistate",  val:f.purchased, bg:B.tealLight,   color:B.teal  },
    { label:rem<0?"Superate":"Rimanenti", val:Math.abs(rem),
      bg:rem<0?"#FEE2E2":rem<=2?"#FEF3C7":B.greenLight,
      color:rem<0?"#EF4444":rem<=2?"#F59E0B":B.green },
  ];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,40,40,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:B.white,borderRadius:20,padding:24,width:"100%",maxWidth:380,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(45,198,198,.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h2 style={{margin:0,fontSize:18,color:B.text}}>📦 {data.id ? "Modifica Pacchetto" : "Nuovo Pacchetto"}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:B.muted}}>✕</button>
        </div>
        <div style={{background:B.tealLight,borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>👤</span>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:B.text}}>{clientName}</div>
            <div style={{fontSize:11,color:B.muted}}>Cliente</div>
          </div>
        </div>
        <label style={LS}>Trattamento</label>
        <select value={f.service} onChange={e=>set("service",e.target.value)} style={IS}>
          {Object.entries(SV).map(([k,sv]) => <option key={k} value={k}>{sv.emoji} {sv.label}</option>)}
        </select>
        <label style={LS}>Sedute acquistate</label>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button onClick={()=>set("purchased",Math.max(1,f.purchased-1))} style={{width:38,height:38,borderRadius:10,border:`1.5px solid ${B.border}`,background:B.white,fontSize:20,cursor:"pointer",color:B.teal,fontWeight:800}}>−</button>
          <input type="number" min="1" value={f.purchased} onChange={e=>set("purchased",Math.max(1,+e.target.value||1))} style={{...IS,marginBottom:0,textAlign:"center",fontWeight:800,fontSize:22,width:80,color:B.teal}}/>
          <button onClick={()=>set("purchased",f.purchased+1)} style={{width:38,height:38,borderRadius:10,border:`1.5px solid ${B.border}`,background:B.white,fontSize:20,cursor:"pointer",color:B.teal,fontWeight:800}}>+</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
          {statCards.map(c => (
            <div key={c.label} style={{background:c.bg,borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:c.color}}>{c.val}</div>
              <div style={{fontSize:10,fontWeight:700,color:c.color}}>{c.label}</div>
            </div>
          ))}
        </div>
        <div style={{height:8,background:B.tealLight,borderRadius:4,overflow:"hidden",marginBottom:18}}>
          <div style={{height:"100%",width:`${Math.min(100,Math.round((done/f.purchased)*100))}%`,background:rem<0?"#EF4444":rem<=2?"#F59E0B":s.color,borderRadius:4}}/>
        </div>
        <button onClick={()=>onSave({...f,clientName})} style={{width:"100%",padding:"13px 0",borderRadius:12,background:`linear-gradient(135deg,${B.tealDark},${B.teal})`,color:"white",border:"none",cursor:"pointer",fontWeight:700,fontSize:15}}>
          💾 {data.id ? "Salva modifiche" : "Aggiungi pacchetto"}
        </button>
        {data.id && (
          <button onClick={()=>onDelete(data.id)} style={{width:"100%",marginTop:8,padding:"11px 0",borderRadius:12,background:"#FEF2F2",color:"#EF4444",border:"1px solid #FECACA",cursor:"pointer",fontWeight:700,fontSize:13}}>
            🗑️ Rimuovi pacchetto
          </button>
        )}
      </div>
    </div>
  );
}

function AptModal({ data, mode, onSave, onDelete, onClose }){
  const [f, setF] = useState(data);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  function sendWA(){
    const msg = `Ciao ${f.client}! 👋 Ti ricordiamo l'appuntamento per *${SV[f.service].label}* — *${DAYS_F[f.day]}* alle *${f.time}* (${f.dur} min). A presto! 💙 Kineosal`;
    wa(f.phone, msg);
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,40,40,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:B.white,borderRadius:20,padding:24,width:"100%",maxWidth:380,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(45,198,198,.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h2 style={{margin:0,fontSize:18,color:B.text}}>{mode==="add" ? "➕ Nuovo Appuntamento" : "✏️ Modifica"}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:B.muted}}>✕</button>
        </div>
        <label style={LS}>Nome cliente</label>
        <input value={f.client} onChange={e=>set("client",e.target.value)} style={IS} placeholder="Es. Maria Rossi"/>
        <label style={LS}>Telefono (senza +39)</label>
        <input value={f.phone} onChange={e=>set("phone",e.target.value)} style={IS} placeholder="Es. 3331234567"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={LS}>Giorno</label>
            <select value={f.day} onChange={e=>set("day",+e.target.value)} style={IS}>
              {DAYS_F.map((d,i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={LS}>Orario</label>
            <select value={f.time} onChange={e=>set("time",e.target.value)} style={IS}>
              {TIMES.slice(0,-1).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <label style={LS}>Durata</label>
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {DURS.map(d => (
            <button key={d} onClick={()=>set("dur",d)} style={{padding:"5px 12px",borderRadius:20,border:`2px solid ${f.dur===d?B.teal:B.border}`,background:f.dur===d?B.tealLight:B.white,color:f.dur===d?B.teal:B.muted,fontWeight:f.dur===d?800:500,fontSize:12,cursor:"pointer"}}>
              {d}min
            </button>
          ))}
        </div>
        <label style={LS}>Servizio</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {Object.entries(SV).map(([k,s]) => (
            <button key={k} onClick={()=>set("service",k)} style={{padding:"9px 6px",borderRadius:10,border:`2px solid ${f.service===k?s.color:B.border}`,background:f.service===k?s.light:B.white,color:f.service===k?s.color:B.muted,fontWeight:f.service===k?800:500,fontSize:12,cursor:"pointer"}}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
        <label style={LS}>Stato</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {Object.entries(ST).map(([k,s]) => (
            <button key={k} onClick={()=>set("status",k)} style={{padding:"9px 6px",borderRadius:10,border:`2px solid ${f.status===k?B.teal:B.border}`,background:f.status===k?B.tealLight:B.white,color:f.status===k?B.teal:B.muted,fontWeight:f.status===k?800:500,fontSize:12,cursor:"pointer"}}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
        <label style={LS}>Note</label>
        <textarea value={f.notes} onChange={e=>set("notes",e.target.value)} style={{...IS,height:56,resize:"vertical"}} placeholder="Note aggiuntive..."/>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button onClick={sendWA} style={{flex:1,padding:"12px 0",borderRadius:12,background:"#25D366",color:"white",border:"none",cursor:"pointer",fontWeight:700,fontSize:13}}>💬 WA</button>
          <button onClick={()=>onSave(f)} style={{flex:2,padding:"12px 0",borderRadius:12,background:`linear-gradient(135deg,${B.tealDark},${B.teal})`,color:"white",border:"none",cursor:"pointer",fontWeight:700,fontSize:13}}>💾 Salva</button>
        </div>
        {mode==="edit" && (
          <button onClick={()=>onDelete(f.id)} style={{width:"100%",marginTop:8,padding:"11px 0",borderRadius:12,background:"#FEF2F2",color:"#EF4444",border:"1px solid #FECACA",cursor:"pointer",fontWeight:700,fontSize:13}}>
            🗑️ Elimina appuntamento
          </button>
        )}
      </div>
    </div>
  );
}

function BlockModal({ data, onSave, onDelete, onClose }){
  const [f, setF] = useState(data);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const fullDay = f.timeFrom === null;
  const bt = BT[f.type];
  const maxDate = () => { const d=new Date(); d.setMonth(d.getMonth()+6); return toDateStr(d); };
  const dateLabel = f.date ? `${dayName(f.date)} ${new Date(f.date+"T12:00:00").toLocaleDateString("it-IT",{day:"2-digit",month:"long",year:"numeric"})}` : "-";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,40,40,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:B.white,borderRadius:20,padding:24,width:"100%",maxWidth:370,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(45,198,198,.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h2 style={{margin:0,fontSize:18,color:B.text}}>{data.id ? "✏️ Modifica Blocco" : "🚫 Nuovo Blocco"}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:B.muted}}>✕</button>
        </div>
        <label style={LS}>Tipo</label>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {Object.entries(BT).map(([k,t]) => (
            <button key={k} onClick={()=>set("type",k)} style={{flex:1,padding:"10px 4px",borderRadius:12,border:`2px solid ${f.type===k?t.color:B.border}`,background:f.type===k?t.light:B.white,color:f.type===k?t.color:B.muted,fontWeight:f.type===k?800:500,fontSize:12,cursor:"pointer",textAlign:"center",lineHeight:1.6}}>
              <div style={{fontSize:20}}>{t.icon}</div>{t.label}
            </button>
          ))}
        </div>
        <label style={LS}>Riguarda</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {Object.entries(STAFF).map(([k,s]) => (
            <button key={k} onClick={()=>set("staff",k)} style={{padding:"9px 8px",borderRadius:10,border:`2px solid ${f.staff===k?B.teal:B.border}`,background:f.staff===k?B.tealLight:B.white,color:f.staff===k?B.teal:B.muted,fontWeight:f.staff===k?800:500,fontSize:12,cursor:"pointer",textAlign:"center"}}>
              {s.icon} {s.name}
            </button>
          ))}
        </div>
        <label style={LS}>Data</label>
        <input type="date" value={f.date} min={todayStr()} max={maxDate()} onChange={e=>set("date",e.target.value)} style={IS}/>
        {f.date && <div style={{marginTop:-8,marginBottom:12,fontSize:12,color:B.teal,fontWeight:700}}>📅 {dateLabel}</div>}
        <label style={LS}>Estensione</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          <button onClick={()=>setF(p=>({...p,timeFrom:null,timeTo:null}))} style={{padding:"10px",borderRadius:10,border:`2px solid ${fullDay?B.teal:B.border}`,background:fullDay?B.tealLight:B.white,color:fullDay?B.teal:B.muted,fontWeight:fullDay?800:500,fontSize:13,cursor:"pointer"}}>
            📅 Giornata intera
          </button>
          <button onClick={()=>setF(p=>({...p,timeFrom:p.timeFrom??"9:00",timeTo:p.timeTo??"13:00"}))} style={{padding:"10px",borderRadius:10,border:`2px solid ${!fullDay?B.teal:B.border}`,background:!fullDay?B.tealLight:B.white,color:!fullDay?B.teal:B.muted,fontWeight:!fullDay?800:500,fontSize:13,cursor:"pointer"}}>
            🕐 Fascia oraria
          </button>
        </div>
        {!fullDay && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={LS}>Dalle</label>
              <select value={f.timeFrom} onChange={e=>set("timeFrom",e.target.value)} style={IS}>
                {TIMES.slice(0,-1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={LS}>Alle</label>
              <select value={f.timeTo} onChange={e=>set("timeTo",e.target.value)} style={IS}>
                {TIMES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}
        <label style={LS}>Note</label>
        <input value={f.note} onChange={e=>set("note",e.target.value)} style={IS} placeholder="Es. Ferie estive..."/>
        <button onClick={()=>onSave(f)} style={{width:"100%",padding:"13px 0",borderRadius:12,background:bt.color,color:"white",border:"none",cursor:"pointer",fontWeight:700,fontSize:15,marginTop:4}}>
          {bt.icon} {data.id ? "Salva modifiche" : "Aggiungi blocco"}
        </button>
        {data.id && (
          <button onClick={()=>onDelete(data.id)} style={{width:"100%",marginTop:8,padding:"11px 0",borderRadius:12,background:"#FEF2F2",color:"#EF4444",border:"1px solid #FECACA",cursor:"pointer",fontWeight:700,fontSize:13}}>
            🗑️ Rimuovi blocco
          </button>
        )}
      </div>
    </div>
  );
}

function DayView({ apts, blocks, dayIdx, weekDates, onOpenApt, onAddApt, onOpenBlock }){
  const dayApts   = apts.filter(a=>a.day===dayIdx).sort((a,b)=>tIdx(a.time)-tIdx(b.time));
  const ds        = weekDates[dayIdx] ? toDateStr(weekDates[dayIdx]) : "";
  const dayBlocks = blocks.filter(b=>b.date===ds);
  const totalH    = (TIMES.length-1)*SLOT_H;

  function handleClick(e){
    const rect = e.currentTarget.getBoundingClientRect();
    const idx  = Math.floor((e.clientY-rect.top)/SLOT_H);
    const time = TIMES[Math.min(idx, TIMES.length-2)];
    const blk  = blockAt(blocks, dayIdx, time, weekDates);
    if(blk) onOpenBlock(blk); else onAddApt(dayIdx, time);
  }

  return (
    <div style={{padding:16}}>
      {dayBlocks.length > 0 && (
        <div style={{maxWidth:560,margin:"0 auto 10px",display:"flex",gap:8,flexWrap:"wrap"}}>
          {dayBlocks.map(b => {
            const bt = BT[b.type];
            return (
              <div key={b.id} onClick={()=>onOpenBlock(b)} style={{padding:"6px 14px",borderRadius:20,background:bt.light,border:`1.5px solid ${bt.color}`,color:bt.color,fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                {bt.icon} {bt.label}
                {b.staff&&b.staff!=="all" && <span style={{opacity:.8}}>· {STAFF[b.staff].icon} {STAFF[b.staff].name}</span>}
                {b.note && <span style={{opacity:.7}}>· {b.note}</span>}
                {b.timeFrom && <span style={{opacity:.6}}>({b.timeFrom}–{b.timeTo})</span>}
                <span style={{opacity:.4}}>✕</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{background:B.white,borderRadius:16,boxShadow:`0 4px 20px rgba(45,198,198,.15)`,overflow:"hidden",maxWidth:560,margin:"0 auto",border:`1px solid ${B.border}`}}>
        <div style={{background:`linear-gradient(135deg,${B.tealDark},${B.teal})`,padding:"14px 16px",textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:700,color:"white"}}>{DAYS_F[dayIdx]}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.8)"}}>{weekDates[dayIdx]?.toLocaleDateString("it-IT",{day:"2-digit",month:"long",year:"numeric"})}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"52px 1fr"}}>
          <div style={{background:B.tealBg,borderRight:`1px solid ${B.border}`}}>
            {TIMES.slice(0,-1).map(t => (
              <div key={t} style={{height:SLOT_H,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:8,paddingTop:6,fontSize:10,color:B.muted,fontWeight:700,borderTop:`1px solid ${B.border}`}}>{t}</div>
            ))}
          </div>
          <div style={{position:"relative",height:totalH,cursor:"pointer"}} onClick={handleClick}>
            {TIMES.slice(0,-1).map((_,i) => (
              <div key={i} style={{position:"absolute",top:i*SLOT_H,left:0,right:0,height:SLOT_H,borderTop:`1px solid ${i%2===0?B.border:B.tealBg}`}}/>
            ))}
            {dayBlocks.map(b => {
              const bt  = BT[b.type];
              const top = (b.timeFrom===null ? 0 : tIdx(b.timeFrom))*SLOT_H;
              const bot = (b.timeTo===null   ? TIMES.length-1 : tIdx(b.timeTo))*SLOT_H;
              const h   = Math.max(bot-top-2, SLOT_H-4);
              return (
                <div key={b.id} onClick={e=>{e.stopPropagation();onOpenBlock(b);}} style={{position:"absolute",top:top+1,left:4,right:4,height:h,background:`repeating-linear-gradient(45deg,${bt.stripe},${bt.stripe} 7px,${bt.light} 7px,${bt.light} 16px)`,border:`2px solid ${bt.color}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",zIndex:2}}>
                  <div style={{fontWeight:800,color:bt.color,fontSize:14}}>{bt.icon} {bt.label}</div>
                  {b.staff&&b.staff!=="all" && (
                    <div style={{marginTop:4,display:"inline-flex",alignItems:"center",gap:3,background:"rgba(255,255,255,.6)",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700,color:bt.color,border:`1px solid ${bt.color}`}}>
                      {STAFF[b.staff].icon} {STAFF[b.staff].name}
                    </div>
                  )}
                  {b.note && <div style={{color:bt.color,fontSize:12,opacity:.8,marginTop:4}}>{b.note}</div>}
                </div>
              );
            })}
            {dayApts.map(apt => {
              const s = SV[apt.service];
              return (
                <div key={apt.id} onClick={e=>{e.stopPropagation();onOpenApt(apt);}} style={{position:"absolute",top:tIdx(apt.time)*SLOT_H+2,left:4,right:4,height:(apt.dur/30)*SLOT_H-4,background:s.light,borderLeft:`4px solid ${s.color}`,borderRadius:10,padding:"7px 9px",cursor:"pointer",zIndex:3,opacity:apt.status==="cancelled"?.4:1,textDecoration:apt.status==="cancelled"?"line-through":"none",overflow:"hidden",boxShadow:`0 2px 8px ${s.color}33`}}>
                  <div style={{fontWeight:800,color:s.color,fontSize:12}}>{ST[apt.status].icon} {apt.client}</div>
                  <div style={{color:B.text,fontSize:11,marginTop:1}}>{s.emoji} {s.label}</div>
                  {apt.dur>=45 && <div style={{color:B.muted,fontSize:10,marginTop:1}}>⏱ {apt.time} · {apt.dur}min</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientsView({ apts, packages, onWA, onNew, onAddPkg, onEditPkg }){
  const [q, setQ] = useState("");
  const clients = useMemo(() => {
    const m = {};
    apts.forEach(a => {
      if(!m[a.client]) m[a.client]={name:a.client,phone:a.phone,apts:[],svcs:new Set()};
      m[a.client].apts.push(a);
      m[a.client].svcs.add(a.service);
    });
    return Object.values(m)
      .filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [apts, q]);

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Cerca cliente..." style={{...IS,marginBottom:0,flex:1}}/>
        <span style={{fontSize:12,color:B.muted,whiteSpace:"nowrap"}}>{clients.length} clienti</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {clients.map(c => {
          const active     = c.apts.filter(a=>a.status!=="cancelled");
          const totalMin   = active.reduce((s,a)=>s+a.dur, 0);
          const clientPkgs = packages.filter(p=>p.clientName===c.name);
          const alerts     = clientPkgs.filter(p => (p.purchased - doneApts(apts,c.name,p.service)) <= 2);
          return (
            <div key={c.name} style={{background:B.white,borderRadius:16,padding:16,boxShadow:`0 2px 12px rgba(45,198,198,.12)`,border:`1px solid ${B.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:800,fontSize:15,color:B.text,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    👤 {c.name}
                    {alerts.length > 0 && <span style={{background:B.pinkLight,color:B.pink,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>⚡ {alerts.length} avviso</span>}
                  </div>
                  <div style={{fontSize:12,color:B.muted,marginTop:2}}>📱 {c.phone}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>onWA(c.phone,c.name)} style={{padding:"7px 12px",borderRadius:10,background:"#dcfce7",color:"#16a34a",border:"none",cursor:"pointer",fontWeight:700,fontSize:12}}>💬 WA</button>
                  <button onClick={()=>onNew(c)} style={{padding:"7px 12px",borderRadius:10,background:B.tealLight,color:B.teal,border:"none",cursor:"pointer",fontWeight:700,fontSize:12}}>➕ Apt.</button>
                </div>
              </div>
              <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
                {[...c.svcs].map(sv => (
                  <span key={sv} style={{padding:"3px 10px",borderRadius:20,background:SV[sv].light,color:SV[sv].color,fontSize:11,fontWeight:700}}>{SV[sv].emoji} {SV[sv].label}</span>
                ))}
              </div>
              <div style={{marginTop:8,display:"flex",gap:16,fontSize:12,color:B.muted,flexWrap:"wrap"}}>
                <span>📅 {active.length} appuntamenti</span>
                <span>⏱ {Math.floor(totalMin/60)}h {totalMin%60>0?`${totalMin%60}min`:""} totali</span>
              </div>
              {clientPkgs.length > 0 && (
                <div style={{marginTop:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>📦 Pacchetti sedute</div>
                  {clientPkgs.map(pkg => <PkgBar key={pkg.id} pkg={pkg} apts={apts} onClick={()=>onEditPkg(pkg,c.name)}/>)}
                </div>
              )}
              <button onClick={()=>onAddPkg(c.name)} style={{marginTop:8,width:"100%",padding:"9px 0",borderRadius:10,background:B.tealBg,color:B.teal,border:`1.5px dashed ${B.teal}`,cursor:"pointer",fontWeight:700,fontSize:12}}>
                📦 {clientPkgs.length>0 ? "Aggiungi altro pacchetto" : "Aggiungi pacchetto sedute"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ apts, blocks, weekDates, filter, onOpenApt, onAddApt, onOpenBlock, onDayClick }){
  const todayS    = new Date().toDateString();
  const slotApts  = (di,t) => apts.filter(a=>a.day===di&&a.time===t&&(filter==="all"||a.service===filter));
  return (
    <div style={{overflowX:"auto",padding:16}}>
      <div style={{display:"grid",gridTemplateColumns:"52px repeat(6,1fr)",minWidth:640,background:B.white,borderRadius:16,boxShadow:`0 4px 20px rgba(45,198,198,.15)`,overflow:"hidden",border:`1px solid ${B.border}`}}>
        <div style={{background:B.tealBg,borderBottom:`2px solid ${B.border}`}}/>
        {DAYS_S.map((d,i) => {
          const dt    = weekDates[i];
          const isT   = dt.toDateString()===todayS;
          const fdBlk = blocks.find(b=>b.date===toDateStr(dt)&&b.timeFrom===null);
          const bt    = fdBlk ? BT[fdBlk.type] : null;
          return (
            <div key={d} style={{background:bt?bt.light:B.tealBg,padding:"10px 4px",textAlign:"center",borderLeft:`1px solid ${B.border}`,borderBottom:`2px solid ${B.border}`,cursor:"pointer"}} onClick={()=>onDayClick(i)}>
              <div style={{fontSize:10,color:bt?bt.color:B.muted,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>{bt?`${bt.icon} ${bt.label}`:d}</div>
              <div style={{fontSize:17,fontWeight:800,color:isT?B.white:bt?bt.color:B.text,background:isT?B.teal:"transparent",borderRadius:"50%",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",margin:"3px auto 0",boxShadow:isT?`0 2px 8px ${B.teal}88`:"none"}}>
                {dt.getDate()}
              </div>
              {fdBlk && <div style={{fontSize:9,color:bt.color,marginTop:3,fontWeight:700,opacity:.8}}>{fdBlk.staff&&fdBlk.staff!=="all"?`${STAFF[fdBlk.staff].icon} ${STAFF[fdBlk.staff].name}`:fdBlk.note||""}</div>}
            </div>
          );
        })}
        {TIMES.slice(0,-1).map(time => (
          <Fragment key={time}>
            <div style={{padding:"0 6px",fontSize:10,color:B.muted,borderTop:`1px solid ${B.tealBg}`,display:"flex",alignItems:"center",justifyContent:"flex-end",background:B.tealBg,minHeight:52,fontWeight:700}}>
              {time}
            </div>
            {DAYS_S.map((_,di) => {
              const blk     = blockAt(blocks,di,time,weekDates);
              const items   = blk ? [] : slotApts(di,time);
              const bt      = blk ? BT[blk.type] : null;
              const showLbl = blk && blockStart(blk,time);
              return (
                <div key={di} onClick={()=>blk?onOpenBlock(blk):onAddApt(di,time)} style={{borderLeft:`1px solid ${B.border}`,borderTop:`1px solid ${B.tealBg}`,minHeight:52,padding:3,cursor:"pointer",background:blk?`repeating-linear-gradient(45deg,${bt.stripe},${bt.stripe} 5px,${bt.light} 5px,${bt.light} 13px)`:B.white}} onMouseEnter={e=>e.currentTarget.style.filter="brightness(.97)"} onMouseLeave={e=>e.currentTarget.style.filter="none"}>
                  {showLbl && (
                    <div style={{background:bt.light,border:`1px solid ${bt.color}`,borderRadius:5,padding:"2px 5px",fontSize:9,color:bt.color,fontWeight:700,marginBottom:2}}>
                      {bt.icon} {bt.label}{blk.staff&&blk.staff!=="all"?` · ${STAFF[blk.staff].icon} ${STAFF[blk.staff].name}`:""}
                    </div>
                  )}
                  {items.map(apt => (
                    <AptCard key={apt.id} apt={apt} onClick={e=>{e.stopPropagation();onOpenApt(apt);}}/>
                  ))}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
      <div style={{padding:"8px 0 4px",display:"flex",gap:12,flexWrap:"wrap"}}>
        {Object.entries(ST).map(([k,s]) => <span key={k} style={{fontSize:11,color:B.muted}}>{s.icon} {s.label}</span>)}
        {Object.entries(BT).map(([k,t]) => <span key={k} style={{fontSize:11,color:t.color}}>{t.icon} {t.label}</span>)}
      </div>
    </div>
  );
}

export default function App(){
  const [apts,     setApts]     = useState(INIT_APTS);
  const [blocks,   setBlocks]   = useState(INIT_BLOCKS);
  const [packages, setPkgs]     = useState(INIT_PKGS);
  const [modal,    setModal]    = useState(null);
  const [view,     setView]     = useState("week");
  const [filter,   setFilter]   = useState("all");
  const [week,     setWeek]     = useState(0);
  const [selDay,   setSelDay]   = useState(() => Math.max(0,(new Date().getDay()||7)-1));
  const [showNotif,setShowNotif]= useState(false);

  const weekDates = useMemo(() => {
    const today = new Date(), dow = today.getDay();
    const mon   = new Date(today);
    mon.setDate(today.getDate() - (dow===0?6:dow-1) + week*7);
    return DAYS_S.map((_,i) => { const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
  }, [week]);

  const notifs = useMemo(() => {
    const n = [];
    packages.forEach(pkg => {
      const rem = pkg.purchased - doneApts(apts, pkg.clientName, pkg.service);
      if(rem <= 2) n.push({ pkg, remaining:rem });
    });
    return n;
  }, [packages, apts]);

  const phones = useMemo(() => {
    const m = {};
    apts.forEach(a => { if(!m[a.client]) m[a.client]=a.phone; });
    return m;
  }, [apts]);

  function saveApt(f)  { if(modal.mode==="add") setApts(p=>[...p,{...f,id:UID++}]); else setApts(p=>p.map(a=>a.id===f.id?f:a)); setModal(null); }
  function delApt(id)  { setApts(p=>p.filter(a=>a.id!==id)); setModal(null); }
  function saveBlock(f){ if(modal.mode==="add") setBlocks(p=>[...p,{...f,id:BID++}]); else setBlocks(p=>p.map(b=>b.id===f.id?f:b)); setModal(null); }
  function delBlock(id){ setBlocks(p=>p.filter(b=>b.id!==id)); setModal(null); }
  function savePkg(f)  { if(modal.mode==="add") setPkgs(p=>[...p,{...f,id:PID++}]); else setPkgs(p=>p.map(x=>x.id===f.id?f:x)); setModal(null); }
  function delPkg(id)  { setPkgs(p=>p.filter(x=>x.id!==id)); setModal(null); }

  function openAptAdd(day,time){ setModal({type:"apt",mode:"add",data:{day,time,dur:60,client:"",phone:"",service:"grotta",status:"confirmed",notes:""}}); }
  function openBlockAdd(di){ const date=weekDates[di]?toDateStr(weekDates[di]):todayStr(); setModal({type:"block",mode:"add",data:{date,type:"ferie",timeFrom:null,timeTo:null,note:"",staff:"all"}}); }

  return (
    <div style={{fontFamily:"-apple-system,'Segoe UI',sans-serif",minHeight:"100vh",background:B.tealBg}} onClick={()=>showNotif&&setShowNotif(false)}>

      <div style={{background:`linear-gradient(135deg,${B.tealDeep},${B.tealDark} 40%,${B.teal})`,color:"white",padding:"16px 20px",boxShadow:`0 4px 20px rgba(45,198,198,.4)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Logo size={46}/>
            <div>
              <div style={{fontSize:22,fontWeight:900,letterSpacing:2,lineHeight:1}}>KINEOSAL</div>
              <div style={{fontSize:10,opacity:.7,letterSpacing:2,marginTop:2}}>SALUTE & BENESSERE</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            {view!=="clients" && (
              <>
                <button onClick={()=>setWeek(w=>w-1)} style={{background:"rgba(255,255,255,.15)",border:"none",color:"white",padding:"7px 13px",borderRadius:8,cursor:"pointer",fontWeight:700}}>◀</button>
                <span style={{fontSize:13,fontWeight:700}}>{weekDates[0].toLocaleDateString("it-IT",{day:"2-digit",month:"short"})} – {weekDates[5].toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"})}</span>
                <button onClick={()=>setWeek(w=>w+1)} style={{background:"rgba(255,255,255,.15)",border:"none",color:"white",padding:"7px 13px",borderRadius:8,cursor:"pointer",fontWeight:700}}>▶</button>
                <button onClick={()=>setWeek(0)} style={{background:"rgba(255,255,255,.25)",border:"none",color:"white",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13}}>Oggi</button>
              </>
            )}
            <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setShowNotif(v=>!v)} style={{background:notifs.length>0?"rgba(214,58,130,.8)":"rgba(255,255,255,.15)",border:"none",color:"white",padding:"7px 13px",borderRadius:8,cursor:"pointer",fontSize:16,position:"relative",fontWeight:700}}>
                🔔
                {notifs.length>0 && <span style={{position:"absolute",top:-4,right:-4,background:"white",color:B.pink,borderRadius:"50%",width:17,height:17,fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{notifs.length}</span>}
              </button>
              {showNotif && <NotifPanel notifs={notifs} phones={phones} onClose={()=>setShowNotif(false)}/>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
          {[
            {icon:"📅", v:`${apts.filter(a=>a.status!=="cancelled").length} attivi`},
            {icon:"👤", v:`${[...new Set(apts.map(a=>a.client))].length} clienti`},
            {icon:"📦", v:`${packages.length} pacchetti`},
            {icon:"🔔", v:`${notifs.length} avvisi`},
          ].map(s => (
            <span key={s.v} style={{fontSize:12,background:"rgba(255,255,255,.15)",padding:"5px 14px",borderRadius:20,fontWeight:600}}>{s.icon} {s.v}</span>
          ))}
        </div>
      </div>

      <div style={{background:B.white,padding:"12px 16px",borderBottom:`1px solid ${B.border}`,boxShadow:`0 2px 8px rgba(45,198,198,.08)`}}>
        <div style={{display:"flex",gap:4,marginBottom:view!=="clients"?12:0,flexWrap:"wrap",alignItems:"center"}}>
          {[["week","📅 Settimana"],["day","📆 Giorno"],["clients","👥 Clienti"]].map(([v,lbl]) => (
            <button key={v} onClick={()=>setView(v)} style={{padding:"8px 18px",borderRadius:10,border:"none",background:view===v?B.teal:"transparent",color:view===v?B.white:B.muted,fontWeight:700,cursor:"pointer",fontSize:13,boxShadow:view===v?`0 2px 12px ${B.teal}55`:"none"}}>
              {lbl}
            </button>
          ))}
          {view!=="clients" && (
            <button onClick={()=>openBlockAdd(selDay)} style={{marginLeft:"auto",padding:"8px 14px",borderRadius:10,background:B.pinkLight,color:B.pink,border:`1.5px solid ${B.pink}`,cursor:"pointer",fontWeight:700,fontSize:12}}>
              🚫 Blocca slot
            </button>
          )}
        </div>
        {view!=="clients" && (
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            <button onClick={()=>setFilter("all")} style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${filter==="all"?B.teal:B.border}`,background:filter==="all"?B.teal:B.white,color:filter==="all"?B.white:B.muted,cursor:"pointer",fontSize:11,fontWeight:700}}>Tutti</button>
            {Object.entries(SV).map(([k,s]) => (
              <button key={k} onClick={()=>setFilter(k)} style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${filter===k?s.color:B.border}`,background:filter===k?s.color:B.white,color:filter===k?B.white:B.muted,cursor:"pointer",fontSize:11,fontWeight:700}}>
                {s.emoji} {s.label}
              </button>
            ))}
            {view==="day" && (
              <div style={{marginLeft:"auto",display:"flex",gap:4,flexWrap:"wrap"}}>
                {DAYS_S.map((d,i) => (
                  <button key={d} onClick={()=>setSelDay(i)} style={{padding:"5px 10px",borderRadius:8,border:"none",background:selDay===i?B.teal:B.tealBg,color:selDay===i?B.white:B.muted,cursor:"pointer",fontSize:11,fontWeight:700,lineHeight:1.4,textAlign:"center"}}>
                    {d}<br/><span style={{fontSize:10,opacity:.7}}>{weekDates[i]?.getDate()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {view==="week" && (
        <WeekView
          apts={apts} blocks={blocks} weekDates={weekDates} filter={filter}
          onOpenApt={apt=>setModal({type:"apt",mode:"edit",data:{...apt}})}
          onAddApt={openAptAdd}
          onOpenBlock={b=>setModal({type:"block",mode:"edit",data:{...b}})}
          onDayClick={i=>{setSelDay(i);setView("day");}}
        />
      )}
      {view==="day" && (
        <DayView
          apts={apts.filter(a=>filter==="all"||a.service===filter)}
          blocks={blocks} dayIdx={selDay} weekDates={weekDates}
          onOpenApt={apt=>setModal({type:"apt",mode:"edit",data:{...apt}})}
          onAddApt={openAptAdd}
          onOpenBlock={b=>setModal({type:"block",mode:"edit",data:{...b}})}
        />
      )}
      {view==="clients" && (
        <ClientsView
          apts={apts} packages={packages}
          onWA={(phone,name)=>wa(phone,`Ciao ${name}! 👋 Siamo Kineosal. A presto! 💙`)}
          onNew={c=>setModal({type:"apt",mode:"add",data:{day:0,time:"9:00",dur:60,client:c.name,phone:c.phone,service:"grotta",status:"confirmed",notes:""}})}
          onAddPkg={name=>setModal({type:"pkg",mode:"add",data:{clientName:name,service:"grotta",purchased:10}})}
          onEditPkg={(pkg,name)=>setModal({type:"pkg",mode:"edit",data:{...pkg,clientName:name}})}
        />
      )}

      {modal?.type==="apt"   && <AptModal   data={modal.data} mode={modal.mode} onSave={saveApt}   onDelete={delApt}   onClose={()=>setModal(null)}/>}
      {modal?.type==="block" && <BlockModal data={modal.data}                   onSave={saveBlock} onDelete={delBlock} onClose={()=>setModal(null)}/>}
      {modal?.type==="pkg"   && <PkgModal   data={modal.data} clientName={modal.data.clientName} apts={apts} onSave={savePkg} onDelete={delPkg} onClose={()=>setModal(null)}/>}
    </div>
  );
}
