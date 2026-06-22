'use strict';

const DB_NAME='m12-tcg-studio';
const DB_VERSION=1;
const STORE_CARDS='cards';
const STORE_TEMPLATES='templates';
const DRAFT_KEY='m12-current-draft';
let dbPromise=null;

function openDb(){
  if(dbPromise) return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB non disponibile'));return;}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(STORE_CARDS)){
        const cards=db.createObjectStore(STORE_CARDS,{keyPath:'id'});
        cards.createIndex('updatedAt','updatedAt');
      }
      if(!db.objectStoreNames.contains(STORE_TEMPLATES)) db.createObjectStore(STORE_TEMPLATES,{keyPath:'id'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
  return dbPromise;
}
function txStore(name,mode='readonly'){
  return openDb().then(db=>db.transaction(name,mode).objectStore(name));
}
function storePut(name,value){return txStore(name,'readwrite').then(store=>new Promise((res,rej)=>{const r=store.put(value);r.onsuccess=()=>res(value);r.onerror=()=>rej(r.error);}));}
function storeDelete(name,id){return txStore(name,'readwrite').then(store=>new Promise((res,rej)=>{const r=store.delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);}));}
function storeAll(name){return txStore(name).then(store=>new Promise((res,rej)=>{const r=store.getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);}));}

function safeFileName(name){return String(name||'majestic-12-card').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-_]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80)||'majestic-12-card';}
function downloadBlob(blob,filename){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
function downloadText(text,filename,type='application/json'){downloadBlob(new Blob([text],{type}),filename);}
function readFileAsText(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsText(file);});}
function readFileAsDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(file);});}

function normalizeImportedCard(raw){
  if(!raw || typeof raw!=='object') throw new Error('JSON carta non valido');
  const card=deepClone(DEFAULT_STATE);
  const allowed=['version','id','project','content','meta','layout','geometry','visual','art','typography','system','createdAt','updatedAt'];
  allowed.forEach(k=>{ if(raw[k]!==undefined) card[k]=raw[k]; });
  card.id=String(card.id||uid());
  card.version=1;
  if(!Array.isArray(card.system?.resources) || card.system.resources.length>6) throw new Error('Risorse non valide');
  if(!Array.isArray(card.system?.stats) || card.system.stats.length>4) throw new Error('Statistiche non valide');
  card.content.name=String(card.content.name||'Carta senza nome').slice(0,120);
  return card;
}
function templateFromState(name){return {id:uid(),name:name||`${LAYOUTS[state.layout.preset]?.label||'Template'} ${new Date().toLocaleString()}`,createdAt:new Date().toISOString(),layout:deepClone(state.layout),geometry:deepClone(state.geometry),visual:deepClone(state.visual),typography:deepClone(state.typography),system:deepClone(state.system)};}
function applyTemplate(template){snapshot();['layout','geometry','visual','typography','system'].forEach(k=>state[k]=deepClone(template[k]));hydrateControls();loadArt();scheduleRender();queueDraftSave();toast('Template applicato','success');}

async function refreshLibrary(){
  try{cachedLibrary=(await storeAll(STORE_CARDS)).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));templates=(await storeAll(STORE_TEMPLATES)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));renderLibrary();renderTemplates();}
  catch(err){toast(err.message,'error');}
}
function renderLibrary(){
  const host=$('#libraryList'), q=($('#librarySearch')?.value||'').toLowerCase();
  const items=cachedLibrary.filter(c=>[c.content?.name,c.content?.typeLine,c.meta?.setCode,c.content?.tags].join(' ').toLowerCase().includes(q));
  $('#libraryCount').textContent=items.length;
  host.innerHTML=items.length?'':'<div class="empty-state">Nessuna carta salvata.</div>';
  items.forEach(card=>{
    const node=document.createElement('div');node.className='library-item';
    node.innerHTML=`<div class="library-thumb">${card.art?.src?`<img alt="" src="${card.art.src}">`:'M12'}</div><div class="library-copy"><strong>${card.content?.name||'Senza nome'}</strong><span>${card.meta?.setCode||'SET'} #${card.meta?.collectorNumber||'—'} · ${card.meta?.rarity||''}</span></div><div class="item-actions"><button data-act="load">Carica</button><button data-act="dup">Duplica</button><button class="danger" data-act="del">Elimina</button></div>`;
    node.querySelector('[data-act=load]').onclick=()=>{snapshot();state=normalizeImportedCard(card);hydrateControls();loadArt();scheduleRender();queueDraftSave();};
    node.querySelector('[data-act=dup]').onclick=async()=>{const copy=deepClone(card);copy.id=uid();copy.content.name=`${copy.content.name} copia`;copy.meta.collectorNumber='';copy.createdAt=copy.updatedAt=new Date().toISOString();await storePut(STORE_CARDS,copy);refreshLibrary();toast('Carta duplicata','success');};
    node.querySelector('[data-act=del]').onclick=async()=>{if(confirm('Eliminare questa carta?')){await storeDelete(STORE_CARDS,card.id);refreshLibrary();}};
    host.append(node);
  });
}
function renderTemplates(){
  const host=$('#templateList');host.innerHTML=templates.length?'':'<div class="empty-state">Nessun template salvato.</div>';
  templates.forEach(t=>{const node=document.createElement('div');node.className='template-item';node.innerHTML=`<div class="library-thumb">TPL</div><div class="template-copy"><strong>${t.name}</strong><span>${t.layout?.preset||'custom'} · ${new Date(t.createdAt).toLocaleDateString()}</span></div><div class="item-actions"><button data-act="apply">Applica</button><button class="danger" data-act="del">Elimina</button></div>`;node.querySelector('[data-act=apply]').onclick=()=>applyTemplate(t);node.querySelector('[data-act=del]').onclick=async()=>{await storeDelete(STORE_TEMPLATES,t.id);refreshLibrary();};host.append(node);});
}
