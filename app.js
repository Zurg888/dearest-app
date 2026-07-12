const STORE = 'dearly-v1';
const state = load();
let tab = state.seenWelcome ? 'home' : 'welcome';

function load(){
  const fallback = {
    seenWelcome:false,
    people:[
      {id:uid(), name:'Mom', relation:'Family', note:'Letters, memories, and voice notes'},
      {id:uid(), name:'My boys', relation:'Children', note:'Open when they need Dad'}
    ],
    memories:[]
  };
  try { return {...fallback, ...(JSON.parse(localStorage.getItem(STORE))||{})}; }
  catch { return fallback; }
}
function save(){ localStorage.setItem(STORE, JSON.stringify(state)); }
function uid(){ return Math.random().toString(36).slice(2,10); }
function today(){ return new Date().toISOString().slice(0,10); }
function prettyDate(d){ return new Date(d+'T12:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}); }
function toast(msg){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.append(el); setTimeout(()=>el.remove(),1800); }

const screen = document.querySelector('#screen');
const nav = document.querySelector('.bottom-nav');

document.addEventListener('click', e => {
  const navBtn = e.target.closest('[data-tab]');
  if(navBtn){ tab = navBtn.dataset.tab; render(); return; }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if(!action) return;
  if(action === 'start'){ state.seenWelcome = true; save(); tab='home'; render(); }
  if(action === 'add-person'){ addPerson(); }
  if(action === 'clear'){ if(confirm('Clear Dearly data on this device?')){ localStorage.removeItem(STORE); location.reload(); } }
});

document.querySelector('#settingsBtn').addEventListener('click',()=>{tab='settings'; render();});

function render(){
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  if(tab==='welcome') return renderWelcome();
  if(tab==='home') return renderHome();
  if(tab==='people') return renderPeople();
  if(tab==='write') return renderWrite();
  if(tab==='record') return renderRecord();
  if(tab==='timeline') return renderTimeline();
  if(tab==='settings') return renderSettings();
}
function renderWelcome(){ screen.innerHTML = document.querySelector('#welcomeTemplate').innerHTML; }
function renderHome(){
  const recent = state.memories.slice().reverse().slice(0,3);
  screen.innerHTML = `
    <section class="hero-card" style="min-height:auto;margin-bottom:14px">
      <p class="eyebrow">Good ${greeting()}</p>
      <h2>Your words, kept close.</h2>
      <p>Write something small today. A story, a blessing, a memory, or a sentence they may need later.</p>
      <button class="primary" data-tab="write">Write a letter</button>
    </section>
    <section class="grid two">
      ${quick('✍','New letter','Save words for later','write')}
      ${quick('◉','Voice note','Record your voice','record')}
      ${quick('□','Add memory','Photo or story','write')}
      ${quick('⌁','Delivery','Keep private or share later','settings')}
    </section>
    <div class="section-title"><h3>Loved ones</h3><button class="small-btn" data-action="add-person">Add</button></div>
    <div class="list">${state.people.slice(0,3).map(personRow).join('')}</div>
    <div class="section-title"><h3>Recent keepsakes</h3><span class="pill">${state.memories.length} saved</span></div>
    <div class="list">${recent.length?recent.map(memoryRow).join(''):'<div class="card empty">No keepsakes yet. Start with one letter.</div>'}</div>`;
}
function quick(icon,title,sub,target){ return `<button class="quick-card" data-tab="${target}"><div class="symbol">${icon}</div><b>${title}</b><span>${sub}</span></button>`; }
function personRow(p){ return `<article class="person"><div class="avatar">${p.name[0]||'D'}</div><div><strong>${p.name}</strong><small>${p.relation} · ${p.note||'Private keepsakes'}</small></div></article>`; }
function memoryRow(m){ return `<article class="memory"><div class="avatar">${m.type==='voice'?'◉':'✉'}</div><div><strong>${m.title}</strong><small>${m.person||'Dearly'} · ${prettyDate(m.date)}</small></div></article>`; }
function renderPeople(){
  screen.innerHTML = `<section class="card"><h2>Loved Ones</h2><p>Organize letters, voice notes, and memories by the people you love.</p><button class="primary" data-action="add-person">Add loved one</button></section><div class="section-title"><h3>Your circle</h3><span class="pill">${state.people.length}</span></div><div class="list">${state.people.map(personRow).join('')}</div>`;
}
function renderWrite(){
  screen.innerHTML = `<section class="card"><h2>New Letter</h2><p>A few honest words are enough.</p><form id="letterForm"><label>For<select name="person">${state.people.map(p=>`<option>${p.name}</option>`).join('')}</select></label><label>Title<input name="title" placeholder="Open when you need courage" required></label><label>Letter<textarea class="letter-pad" name="body" placeholder="Dear..." required></textarea></label><label>Delivery<select name="delivery"><option>Keep private</option><option>Share now</option><option>Deliver later</option></select></label><button class="primary">Save letter</button></form></section>`;
  document.querySelector('#letterForm').addEventListener('submit', e=>{e.preventDefault(); const fd=new FormData(e.target); state.memories.push({id:uid(),type:'letter',person:fd.get('person'),title:fd.get('title'),body:fd.get('body'),delivery:fd.get('delivery'),date:today()}); save(); toast('Letter saved'); tab='timeline'; render();});
}
function renderRecord(){
  screen.innerHTML = `<section class="card"><h2>Voice Note</h2><p>Prototype recorder screen. Real microphone recording comes next.</p><div class="recorder"><div class="mic">◉</div><div class="wave"><i></i><i></i><i></i><i></i><i></i></div><select id="voicePerson">${state.people.map(p=>`<option>${p.name}</option>`).join('')}</select><button class="primary" id="saveVoice">Save sample voice note</button></div></section>`;
  document.querySelector('#saveVoice').addEventListener('click',()=>{state.memories.push({id:uid(),type:'voice',person:document.querySelector('#voicePerson').value,title:'Voice note',date:today()}); save(); toast('Voice note saved'); tab='timeline'; render();});
}
function renderTimeline(){
  const items = state.memories.slice().reverse();
  screen.innerHTML = `<section class="card"><h2>Timeline</h2><p>Your family keepsakes, saved by date.</p></section>${items.length?items.map(m=>`<div class="timeline-date">${prettyDate(m.date)}</div>${memoryRow(m)}`).join(''):'<div class="card empty">No memories yet.</div>'}`;
}
function renderSettings(){
  screen.innerHTML = `<section class="card"><h2>Heirloom Vault</h2><p>Dearly is local-first in this prototype. Your saved letters stay on this device until we add accounts and encrypted cloud sync.</p><div class="grid"><button class="secondary" data-tab="write">Create keepsake</button><button class="secondary" data-action="clear">Reset this device</button></div></section>`;
}
function addPerson(){
  const name = prompt('Loved one name');
  if(!name) return;
  const relation = prompt('Relation', 'Family') || 'Family';
  state.people.push({id:uid(), name, relation, note:'Private keepsakes'}); save(); toast('Loved one added'); render();
}
function greeting(){ const h=new Date().getHours(); return h<12?'morning':h<18?'afternoon':'evening'; }

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').then(r=>r.update()).catch(()=>{})); }
render();
