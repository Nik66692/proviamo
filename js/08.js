function openDB(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('majestic12-tcg-studio',1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains('cards')) db.createObjectStore('cards',{keyPath:'id'});
      if(!db.objectStoreNames.contains('misc')) db.createObjectStore('misc',{keyPath:'key'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function idbAction(storeName,mode,action){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,mode);const store=tx.objectStore(storeName);
    const request=action(store);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    tx.oncomplete=()=>db.close();
  });
}
const db = {
  getCards:()=>idbAction('cards','readonly',store=>store.getAll()),
  putCard:card=>idbAction('cards','readwrite',store=>store.put(card)),
  deleteCard:id=>idbAction('cards','readwrite',store=>store.delete(id)),
  getMisc:key=>idbAction('misc','readonly',store=>store.get(key)),
  putMisc:(key,value)=>idbAction('misc','readwrite',store=>store.put({key,value}))
};

async function saveCurrentCard(){
  state.updatedAt=new Date().toISOString();
  if(!state.createdAt)state.createdAt=state.updatedAt;
  try{
    const thumb=await stateThumbnail(state);
    const record={...deepClone(state),thumbnail:thumb};
    await db.putCard(record);
    cachedLibrary=await db.getCards();
    renderLibrary();queueDraftSave();setStatus('Carta salvata');toast('Carta salvata nella libreria','success');
  }catch(error){console.error(error);toast('Salvataggio fallito: spazio locale insufficiente?','error');}
}
async function deleteCard(id){
  await db.deleteCard(id);
  cachedLibrary=await db.getCards();renderLibrary();toast('Carta eliminata');
}
async function loadCard(card){
  snapshot();state=deepClone(card);delete state.thumbnail;
  hydrateControls();loadArt();queueDraftSave();switchTab('content');toast('Carta caricata','success');
}
function matchesSearch(card,q){
  if(!q)return true;
  return [card.content?.name,card.content?.typeLine,card.meta?.setCode,card.content?.tags,card.meta?.cardKind]
    .some(value=>String(value||'').toLowerCase().includes(q));
}
function renderLibrary(){
  const host=$('#libraryList');host.innerHTML='';
  const q=$('#librarySearch').value.trim().toLowerCase();
  const cards=[...cachedLibrary].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).filter(card=>matchesSearch(card,q));
  $('#libraryCount').textContent=cards.length;
  if(!cards.length){host.innerHTML='<div class="empty-state">Nessuna carta trovata. Salva la prima carta per iniziare il set.</div>';return;}
  cards.forEach(card=>{
    const row=document.createElement('div');row.className='library-item';
    row.innerHTML=`<div class="library-thumb">${card.thumbnail?`<img src="${card.thumbnail}" alt="">`:escapeHtml(card.meta?.setCode||'CARD')}</div>
      <div class="library-copy"><strong>${escapeHtml(card.content?.name||'Senza nome')}</strong>
      <span>${escapeHtml(card.meta?.setCode||'SET')} ${escapeHtml(card.meta?.collectorNumber||'')} · ${escapeHtml(card.meta?.rarity||'')}</span></div>
      <div class="item-actions"><button data-action="load">Apri</button><button data-action="copy">Duplica</button><button class="danger" data-action="delete">Elimina</button></div>`;
    $('[data-action="load"]',row).addEventListener('click',()=>loadCard(card));
    $('[data-action="copy"]',row).addEventListener('click',async()=>{
      const copy=deepClone(card);copy.id=uid();copy.content.name=`${copy.content.name} — Copy`;copy.meta.collectorNumber=await nextCollectorNumber(copy.meta.setCode);delete copy.thumbnail;
      state=copy;hydrateControls();loadArt();await saveCurrentCard();
    });
    $('[data-action="delete"]',row).addEventListener('click',()=>{if(confirm(`Eliminare "${card.content?.name}"?`))deleteCard(card.id);});
    host.append(row);
  });
}
async function nextCollectorNumber(setCode=state.meta.setCode){
  const cards=await db.getCards();
  const max=cards.filter(card=>card.meta?.setCode===setCode)
    .map(card=>parseInt(card.meta?.collectorNumber,10)).filter(Number.isFinite)
    .reduce((a,b)=>Math.max(a,b),0);
  return String(max+1).padStart(3,'0');
}
async function assignNextCollector(){
  snapshot();state.meta.collectorNumber=await nextCollectorNumber();hydrateControls();scheduleRender();queueDraftSave();
}
function newCard(){
  snapshot();
  const keepProject=deepClone(state.project);
  const keepVisual=stripForTemplate(state);
  state=deepClone(DEFAULT_STATE);state.id=uid();state.project=keepProject;
  state.layout=keepVisual.layout;state.geometry=keepVisual.geometry;state.visual=keepVisual.visual;state.typography=keepVisual.typography;
  state.system={...state.system,...keepVisual.system};state.content.name='Nuova carta';state.meta.collectorNumber='001';state.art.src='';
  buildResourceEditor();buildStatsEditor();bindControls();hydrateControls();loadArt();queueDraftSave();
}
async function duplicateCurrent(){
  snapshot();state.id=uid();state.content.name=`${state.content.name} — Copy`;state.meta.collectorNumber=await nextCollectorNumber();state.createdAt=new Date().toISOString();hydrateControls();scheduleRender();queueDraftSave();
}

function queueDraftSave(){
  clearTimeout(autosaveTimer);
  setStatus('Modifiche locali…');
  autosaveTimer=setTimeout(async()=>{
    try{await db.putMisc('draft',deepClone(state));setStatus('Bozza salvata automaticamente');}
    catch(error){console.warn(error);setStatus('Bozza non salvata');}
  },550);
}
async function restoreDraft(){
  try{
    const draft=await db.getMisc('draft');
    if(draft?.value){
      state={...deepClone(DEFAULT_STATE),...draft.value};
      state.layout={...deepClone(DEFAULT_STATE.layout),...draft.value.layout};
      state.geometry={...deepClone(DEFAULT_STATE.geometry),...draft.value.geometry};
      state.visual={...deepClone(DEFAULT_STATE.visual),...draft.value.visual};
      state.typography={...deepClone(DEFAULT_STATE.typography),...draft.value.typography};
      state.system={...deepClone(DEFAULT_STATE.system),...draft.value.system};
    }
  }catch(error){console.warn('Draft restore failed',error);}
}

async function exportProject(){
  const cards=await db.getCards();
  const payload={kind:'majestic12-tcg-project',version:1,exportedAt:new Date().toISOString(),current:state,cards,templates};
  downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`${safeFilename(state.project.gameName)}_project.json`);
}
async function importProject(file){
  const payload=JSON.parse(await file.text());
  if(payload.kind!=='majestic12-tcg-project'||!Array.isArray(payload.cards)) throw new Error('Backup progetto non valido');
  for(const card of payload.cards) await db.putCard(card);
  templates=Array.isArray(payload.templates)?payload.templates:[];
  localStorage.setItem('m12-templates',JSON.stringify(templates));
  if(payload.current)state=payload.current;
  cachedLibrary=await db.getCards();
  buildResourceEditor();buildStatsEditor();bindControls();hydrateControls();loadArt();renderLibrary();renderTemplates();queueDraftSave();
  toast('Progetto importato','success');
}
