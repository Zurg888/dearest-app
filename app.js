const STORE = 'dearly-v1';
const state = load();
let tab = state.seenWelcome ? 'home' : 'welcome';
let activeMemoryId = null;

function uid(){ return Math.random().toString(36).slice(2,10); }
function today(){ return new Date().toISOString().slice(0,10); }
function nowIso(){ return new Date().toISOString(); }
function prettyDate(d){ return new Date(d+'T12:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}); }
function esc(v){ return String(v ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function load(){
  const fallback={seenWelcome:false,security:{pinHash:null,pinSetAt:null},people:[{id:uid(),name:'Mom',relation:'Family',note:'Letters, memories, and voice notes'},{id:uid(),name:'My boys',relation:'Children',note:'Open when they need Dad'}],memories:[]};
  try{return {...fallback,...(JSON.parse(localStorage.getItem(STORE))||{}) , security:{...fallback.security,...((JSON.parse(localStorage.getItem(STORE))||{}).security||{})}}}catch{return fallback}
}
function save(){ localStorage.setItem(STORE,JSON.stringify(state)); }
function toast(msg){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.append(el); setTimeout(()=>el.remove(),1900); }
async function sha256(text){ const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('dearly-pin:'+text)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
async function ensurePin(){
  if(!state.security.pinHash){
    const pin=prompt('Create a private edit PIN. Use 4+ digits.');
    if(!pin || pin.length<4){ toast('PIN not set'); return false; }
    const confirmPin=prompt('Confirm your edit PIN.');
    if(pin!==confirmPin){ toast('PINs did not match'); return false; }
    state.security.pinHash=await sha256(pin); state.security.pinSetAt=nowIso(); save(); toast('Edit PIN protected'); return true;
  }
  const pin=prompt('Enter edit PIN');
  if(!pin) return false;
  const ok=(await sha256(pin))===state.security.pinHash;
  toast(ok?'Unlocked':'Wrong PIN');
  return ok;
}

const screen=document.querySelector('#screen');
document.addEventListener('click',async e=>{
  const navBtn=e.target.closest('[data-tab]'); if(navBtn){ tab=navBtn.dataset.tab; render(); return; }
  const action=e.target.closest('[data-action]')?.dataset.action; if(!action) return;
  if(action==='start'){ state.seenWelcome=true; save(); tab='home'; render(); }
  if(action==='add-person') addPerson();
  if(action==='open-memory'){ activeMemoryId=e.target.closest('[data-id]')?.dataset.id; tab='memory'; render(); }
  if(action==='back-timeline'){ tab='timeline'; render(); }
  if(action==='edit-memory'){ if(await ensurePin()){ tab='edit'; render(); } }
  if(action==='clear'){ if(confirm('Clear Dearly data on this device?')){ localStorage.removeItem(STORE); location.reload(); } }
});
document.querySelector('#settingsBtn').addEventListener('click',()=>{tab='settings';render();});

function render(){ document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab)); ({welcome:renderWelcome,home:renderHome,people:renderPeople,write:renderWrite,record:renderRecord,timeline:renderTimeline,memory:renderMemoryDetail,edit:renderEditMemory,settings:renderSettings}[tab]||renderHome)(); }
function renderWelcome(){ screen.innerHTML=`<section class="hero"><img class="hero-logo" src="./assets/dearly-logo.jpeg" alt="Dearly logo"><p class="eyebrow">For every someday</p><h1>Keep what matters, beautifully.</h1><p>Save letters, voice notes, photos, and memories for the people you love dearly — private by default, warm by design.</p><button class="primary" data-action="start">Begin your vault</button></section>`; }
function renderHome(){ const recent=state.memories.slice().reverse().slice(0,3); screen.innerHTML=`<section class="hero" style="min-height:300px"><img class="hero-logo" style="width:78px;height:78px" src="./assets/dearly-logo.jpeg" alt=""><p class="eyebrow">Good ${greeting()}</p><h2 class="serif">Your words, kept close.</h2><p>One letter, one voice note, one photo. Build a private family keepsake over time.</p><button class="primary" data-tab="write">Write a letter</button></section><section class="grid two" style="margin-top:14px">${quick('✎','New letter','Words for someday','write')}${quick('◉','Voice note','Save your voice','record')}${quick('◇','Memory','Photo or story','write')}${quick('⌁','Delivery','Private or later','settings')}</section><div class="section-title"><h3>Loved ones</h3><button class="small-btn" data-action="add-person">Add</button></div><div class="list">${state.people.slice(0,3).map(personRow).join('')}</div><div class="section-title"><h3>Recent keepsakes</h3><span class="pill">${state.memories.length} saved</span></div><div class="list">${recent.length?recent.map(memoryRow).join(''):'<div class="card empty">No keepsakes yet. Start with one letter.</div>'}</div>`; }
function quick(icon,title,sub,target){return `<button class="quick-card" data-tab="${target}"><div class="symbol">${icon}</div><b>${title}</b><span>${sub}</span></button>`}
function personRow(p){return `<article class="person"><div class="avatar">${esc((p.name||'D')[0])}</div><div><strong>${esc(p.name)}</strong><small>${esc(p.relation)} · ${esc(p.note||'Private keepsakes')}</small></div></article>`}
function memoryRow(m){return `<button class="memory" data-action="open-memory" data-id="${m.id}"><div class="avatar">${m.type==='voice'?'◉':'✉'}</div><div><strong>${esc(m.title)}</strong><small>${esc(m.person||'Dearly')} · ${prettyDate(m.date)} · Tap to open</small></div></button>`}
function renderPeople(){ screen.innerHTML=`<section class="card"><p class="eyebrow">Your circle</p><h2>Loved Ones</h2><p>Organize every letter, story, and voice note around the person it is meant for.</p><button class="primary" data-action="add-person">Add loved one</button></section><div class="section-title"><h3>People</h3><span class="pill">${state.people.length}</span></div><div class="list">${state.people.map(personRow).join('')}</div>`; }
function renderWrite(){ screen.innerHTML=`<section class="card"><p class="eyebrow">Protected keepsake</p><h2>New Letter</h2><p>A few honest words are enough.</p><form id="letterForm"><label>For<select name="person">${state.people.map(p=>`<option>${esc(p.name)}</option>`).join('')}</select></label><label>Title<input name="title" placeholder="Open when you need courage" required></label><label>Letter<textarea class="letter-pad" name="body" placeholder="Dear..." required></textarea></label><label>Delivery<select name="delivery"><option>Keep private</option><option>Share now</option><option>Deliver later</option></select></label><button class="primary">Save letter</button></form></section>`; document.querySelector('#letterForm').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.target);state.memories.push({id:uid(),type:'letter',person:fd.get('person'),title:fd.get('title'),body:fd.get('body'),delivery:fd.get('delivery'),date:today(),createdAt:nowIso(),updatedAt:null,editHistory:[]});save();toast('Letter saved');tab='timeline';render();}); }
function renderRecord(){ screen.innerHTML=`<section class="card"><p class="eyebrow">Voice keepsake</p><h2>Voice Note</h2><p>Prototype recorder screen. Real microphone recording comes next.</p><div class="recorder"><div class="mic">◉</div><div class="wave"><i></i><i></i><i></i><i></i><i></i></div><select id="voicePerson">${state.people.map(p=>`<option>${esc(p.name)}</option>`).join('')}</select><button class="primary" id="saveVoice">Save sample voice note</button></div></section>`; document.querySelector('#saveVoice').addEventListener('click',()=>{state.memories.push({id:uid(),type:'voice',person:document.querySelector('#voicePerson').value,title:'Voice note',date:today(),createdAt:nowIso()});save();toast('Voice note saved');tab='timeline';render();}); }
function renderTimeline(){ const items=state.memories.slice().reverse(); screen.innerHTML=`<section class="card"><p class="eyebrow">Private vault</p><h2>Timeline</h2><p>Your keepsakes by date. Tap any item to open it.</p></section>${items.length?items.map(m=>`<div class="timeline-date">${prettyDate(m.date)}</div>${memoryRow(m)}`).join(''):'<div class="card empty">No memories yet.</div>'}`; }
function activeMemory(){ return state.memories.find(m=>m.id===activeMemoryId)||state.memories[state.memories.length-1]; }
function renderMemoryDetail(){ const m=activeMemory(); if(!m){tab='timeline';return renderTimeline()} activeMemoryId=m.id; const isVoice=m.type==='voice'; screen.innerHTML=`<section class="card"><button class="small-btn" data-action="back-timeline">← Vault</button><p class="eyebrow">${esc(m.person||'Dearly')} · ${prettyDate(m.date)}</p><h2 class="serif">${esc(m.title)}</h2>${isVoice?`<div class="recorder"><div class="mic">◉</div><p>Voice playback arrives with real recording.</p></div>`:`<article class="letter-view">${esc(m.body||'').replace(/\n/g,'<br>')}</article>`}<div class="settings-row"><span class="pill privacy-pill">${state.security.pinHash?'PIN editing on':'Set PIN to edit'}</span><span class="pill">${esc(m.delivery||'Keep private')}</span></div>${!isVoice?`<div class="edit-note">Edits require the private PIN and are tracked in this prototype so a letter cannot be silently changed.</div><div class="detail-actions"><button class="primary" data-action="edit-memory">${state.security.pinHash?'Unlock & Edit':'Set PIN & Edit'}</button><button class="secondary" data-tab="write">New Letter</button></div>`:''}${m.updatedAt?`<p class="eyebrow" style="margin-top:18px">Updated ${new Date(m.updatedAt).toLocaleString()}</p>`:''}</section>`; }
function renderEditMemory(){ const m=activeMemory(); if(!m||m.type==='voice'){tab='timeline';return renderTimeline()} screen.innerHTML=`<section class="card"><p class="eyebrow">PIN unlocked</p><h2>Edit Letter</h2><p>Use this only to correct or update your own words. Dearly keeps a local edit history.</p><form id="editForm"><label>Title<input name="title" value="${esc(m.title)}" required></label><label>Letter<textarea class="letter-pad" name="body" required>${esc(m.body||'')}</textarea></label><button class="primary">Save protected edit</button><button type="button" class="secondary" data-action="back-timeline">Cancel</button></form></section>`; document.querySelector('#editForm').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.target);m.editHistory=m.editHistory||[];m.editHistory.push({title:m.title,body:m.body,editedAt:nowIso()});m.title=fd.get('title');m.body=fd.get('body');m.updatedAt=nowIso();save();toast('Protected edit saved');tab='memory';render();}); }
function renderSettings(){ screen.innerHTML=`<section class="card stack"><p class="eyebrow">Privacy & roadmap</p><h2>Heirloom Vault</h2><p>Prototype is local-first. Production needs encrypted cloud vault, account recovery, Face ID, audit trail, and legacy contacts.</p><div class="settings-row"><span class="pill privacy-pill">${state.security.pinHash?'Edit PIN set':'No edit PIN yet'}</span><span class="pill">${state.memories.length} keepsakes</span></div><button class="secondary" data-tab="write">Create keepsake</button><button class="secondary" data-action="clear">Reset this device</button></section><section class="card" style="margin-top:14px"><h3>Ideas backlog</h3><ul class="idea-list"><li>Real audio recording + transcription</li><li>Photo attachments and memory books</li><li>Scheduled delivery and legacy contacts</li><li>Family invites with read-only permissions</li><li>Encrypted cloud sync and export anytime</li></ul></section>`; }
function addPerson(){ const name=prompt('Loved one name'); if(!name)return; const relation=prompt('Relation','Family')||'Family'; state.people.push({id:uid(),name,relation,note:'Private keepsakes'});save();toast('Loved one added');render(); }
function greeting(){ const h=new Date().getHours(); return h<12?'morning':h<18?'afternoon':'evening'; }
if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').then(r=>r.update()).catch(()=>{})); }
render();
