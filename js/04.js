'use strict';

const DB_NAME = 'm12-tcg-studio';
const DB_VERSION = 1;
const STORE_CARDS = 'cards';
const STORE_TEMPLATES = 'templates';
const DRAFT_KEY = 'm12-current-draft';
const VALID_IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i;
const TEXT_LIMITS = {
  name: 120,
  subtitle: 160,
  typeLine: 180,
  rules: 1800,
  flavor: 700,
  keywords: 240,
  tags: 240,
  default: 180
};
let dbPromise = null;

const ENUMS = {
  rarity: ['Common', 'Uncommon', 'Rare', 'Mythic', 'Promo', 'Token'],
  cardKind: ['Gruppo / Fazione', 'Asset', 'Operazione', 'Protocollo', 'Agenda', 'Anomalia', 'Convergenza', 'Influenza', 'Personaggio', 'Luogo', 'Evento', 'Equipaggiamento', 'Token'],
  secrecy: ['Public Record', 'Restricted', 'Classified', 'Top Secret', 'Black File', 'Omega Clearance'],
  sizePreset: ['standard', 'poker', 'tarot', 'square', 'landscape', 'custom'],
  globalAlign: ['left', 'center', 'right'],
  frameStyle: ['dossier', 'classic', 'tech', 'ritual', 'industrial', 'minimal', 'hazard', 'propaganda'],
  texture: ['grid', 'scanlines', 'dots', 'paper', 'noise', 'none'],
  fit: ['cover', 'contain', 'stretch'],
  blend: ['source-over', 'multiply', 'screen', 'overlay', 'soft-light', 'luminosity'],
  fontAlign: ['left', 'center', 'right']
};

function openDb(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if(!('indexedDB' in window)){
      reject(new Error('IndexedDB non disponibile in questo browser.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(STORE_CARDS)){
        const cards = db.createObjectStore(STORE_CARDS, { keyPath: 'id' });
        cards.createIndex('updatedAt', 'updatedAt');
      }
      if(!db.objectStoreNames.contains(STORE_TEMPLATES)){
        db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Apertura IndexedDB fallita.'));
  });
  return dbPromise;
}

function requestToPromise(request){
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Operazione IndexedDB fallita.'));
  });
}

async function txStore(name, mode = 'readonly'){
  const db = await openDb();
  return db.transaction(name, mode).objectStore(name);
}

async function storePut(name, value){
  const store = await txStore(name, 'readwrite');
  await requestToPromise(store.put(value));
  return value;
}

async function storeDelete(name, id){
  const store = await txStore(name, 'readwrite');
  await requestToPromise(store.delete(id));
}

async function storeAll(name){
  const store = await txStore(name);
  return (await requestToPromise(store.getAll())) || [];
}

function safeFileName(name){
  return String(name || 'majestic-12-card')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'majestic-12-card';
}

function downloadBlob(blob, filename){
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 500);
}

function downloadText(text, filename, type = 'application/json'){
  downloadBlob(new Blob([text], { type }), filename);
}

function readFileAsText(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Lettura file fallita.'));
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Lettura immagine fallita.'));
    reader.readAsDataURL(file);
  });
}

function isPlainObject(value){
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeString(value, fallback = '', max = TEXT_LIMITS.default){
  if(value === undefined || value === null) return fallback;
  return String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, max);
}

function normalizeNumber(value, fallback, min, max){
  const number = Number(value);
  if(!Number.isFinite(number)) return fallback;
  return clamp(number, min, max);
}

function normalizeBoolean(value, fallback = false){
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeEnum(value, allowed, fallback){
  return allowed.includes(value) ? value : fallback;
}

function normalizeColor(value, fallback){
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;
}

function normalizeImageDataUrl(value){
  if(value === undefined || value === null || value === '') return '';
  const text = String(value).trim();
  if(!VALID_IMAGE_DATA_URL.test(text)){
    throw new Error('Artwork non valido: sono ammessi solo data URL PNG, JPEG o WEBP.');
  }
  return text.replace(/\s+/g, '');
}

function mergeKnown(defaultValue, rawValue, path = ''){
  if(Array.isArray(defaultValue)) return normalizeArray(path, defaultValue, rawValue);
  if(isPlainObject(defaultValue)){
    const result = deepClone(defaultValue);
    const source = isPlainObject(rawValue) ? rawValue : {};
    Object.keys(result).forEach(key => {
      result[key] = mergeKnown(result[key], source[key], path ? `${path}.${key}` : key);
    });
    return result;
  }
  if(typeof defaultValue === 'boolean') return normalizeBoolean(rawValue, defaultValue);
  if(typeof defaultValue === 'number') return normalizeNumber(rawValue, defaultValue, numericMin(path), numericMax(path));
  return normalizeScalar(path, rawValue, defaultValue);
}

function numericMin(path){
  if(path.includes('customWidth') || path.includes('customHeight')) return 500;
  if(path.includes('Opacity') || path.startsWith('art.') || path.includes('.x') || path.includes('.y')) return path.endsWith('.x') || path.endsWith('.y') ? -100 : 0;
  if(path.includes('tracking')) return -0.1;
  if(path.includes('size')) return 0.6;
  return 0;
}

function numericMax(path){
  if(path.includes('customWidth')) return 2400;
  if(path.includes('customHeight')) return 3000;
  if(path.includes('Opacity')) return 100;
  if(path === 'art.zoom') return 400;
  if(path.startsWith('art.')) return path.endsWith('.x') || path.endsWith('.y') ? 100 : 250;
  if(path.includes('tracking')) return 0.5;
  if(path.includes('size')) return 16;
  if(path.startsWith('geometry.')) return 100;
  if(path === 'visual.radius') return 8;
  if(path === 'visual.borderWidth') return 3;
  return 9999;
}

function normalizeScalar(path, value, fallback){
  if(path === 'art.src') return normalizeImageDataUrl(value);
  if(path.endsWith('rarity')) return normalizeEnum(value, ENUMS.rarity, fallback);
  if(path.endsWith('cardKind')) return normalizeEnum(value, ENUMS.cardKind, fallback);
  if(path.endsWith('secrecy')) return normalizeEnum(value, ENUMS.secrecy, fallback);
  if(path.endsWith('sizePreset')) return normalizeEnum(value, ENUMS.sizePreset, fallback);
  if(path.endsWith('globalAlign')) return normalizeEnum(value, ENUMS.globalAlign, fallback);
  if(path.endsWith('frameStyle')) return normalizeEnum(value, ENUMS.frameStyle, fallback);
  if(path.endsWith('texture')) return normalizeEnum(value, ENUMS.texture, fallback);
  if(path.endsWith('fit')) return normalizeEnum(value, ENUMS.fit, fallback);
  if(path.endsWith('blend')) return normalizeEnum(value, ENUMS.blend, fallback);
  if(path.endsWith('align')) return normalizeEnum(value, ENUMS.fontAlign, fallback);
  if(path.endsWith('color') || path.includes('Color') || path.endsWith('bg1') || path.endsWith('bg2') || path.endsWith('accent1') || path.endsWith('accent2')){
    return normalizeColor(value, fallback);
  }
  const name = path.split('.').pop();
  return normalizeString(value, fallback, TEXT_LIMITS[name] || TEXT_LIMITS.default);
}

function normalizeArray(path, defaultArray, rawArray){
  const source = Array.isArray(rawArray) ? rawArray : [];
  if(path.endsWith('resources')){
    return defaultArray.map((item, index) => mergeKnown(item, source[index] || {}, `${path}.${index}`));
  }
  if(path.endsWith('stats')){
    return defaultArray.map((item, index) => mergeKnown(item, source[index] || {}, `${path}.${index}`));
  }
  return deepClone(defaultArray);
}

function normalizeImportedCard(raw){
  if(!isPlainObject(raw)) throw new Error('JSON carta non valido: oggetto mancante.');
  const card = mergeKnown(DEFAULT_STATE, raw);
  card.id = normalizeString(raw.id, uid(), 80) || uid();
  card.version = 1;
  card.layout.preset = LAYOUTS[raw.layout?.preset] ? raw.layout.preset : card.layout.preset;
  card.createdAt = normalizeDate(raw.createdAt, new Date().toISOString());
  card.updatedAt = normalizeDate(raw.updatedAt, new Date().toISOString());
  card.content.name = normalizeString(card.content.name, 'Carta senza nome', TEXT_LIMITS.name);
  return card;
}

function normalizeDate(value, fallback){
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function normalizeTemplate(raw){
  if(!isPlainObject(raw)) throw new Error('Template non valido: oggetto mancante.');
  const base = templateFromState('Template importato');
  const template = mergeKnown(base, raw);
  template.id = normalizeString(raw.id, uid(), 80) || uid();
  template.name = normalizeString(raw.name, 'Template importato', 100);
  template.createdAt = normalizeDate(raw.createdAt, new Date().toISOString());
  return template;
}

function normalizeBackup(raw){
  if(!isPlainObject(raw)) throw new Error('Backup progetto non valido: oggetto mancante.');
  if(!Array.isArray(raw.cards) || !Array.isArray(raw.templates)){
    throw new Error('Backup progetto non valido: cards/templates devono essere array.');
  }
  return {
    version: 1,
    cards: raw.cards.slice(0, 500).map(normalizeImportedCard),
    templates: raw.templates.slice(0, 200).map(normalizeTemplate),
    draft: raw.draft ? normalizeImportedCard(raw.draft) : null
  };
}

function templateFromState(name){
  return {
    id: uid(),
    name: normalizeString(name, `${LAYOUTS[state.layout.preset]?.label || 'Template'} ${new Date().toLocaleString()}`, 100),
    createdAt: new Date().toISOString(),
    layout: deepClone(state.layout),
    geometry: deepClone(state.geometry),
    visual: deepClone(state.visual),
    typography: deepClone(state.typography),
    system: deepClone(state.system)
  };
}

function applyTemplate(template){
  try{
    const safe = normalizeTemplate(template);
    snapshot();
    state.layout = deepClone(safe.layout);
    state.geometry = deepClone(safe.geometry);
    state.visual = deepClone(safe.visual);
    state.typography = deepClone(safe.typography);
    state.system = deepClone(safe.system);
    hydrateControls();
    loadArt();
    scheduleRender();
    queueDraftSave();
    toast('Template applicato', 'success');
  }catch(error){
    toast(error.message, 'error');
  }
}

function createText(tag, className, text){
  const node = document.createElement(tag);
  if(className) node.className = className;
  node.textContent = text;
  return node;
}

function createActionButton(label, action, danger = false){
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if(danger) button.className = 'danger';
  button.addEventListener('click', action);
  return button;
}

async function refreshLibrary(){
  try{
    cachedLibrary = (await storeAll(STORE_CARDS))
      .map(card => {
        try{ return normalizeImportedCard(card); }
        catch(_error){ return null; }
      })
      .filter(Boolean)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    templates = (await storeAll(STORE_TEMPLATES))
      .map(template => {
        try{ return normalizeTemplate(template); }
        catch(_error){ return null; }
      })
      .filter(Boolean)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    renderLibrary();
    renderTemplates();
  }catch(error){
    toast(`Libreria non disponibile: ${error.message}`, 'error');
  }
}

function filteredLibraryCards(){
  const query = ($('#librarySearch')?.value || '').toLowerCase();
  return cachedLibrary.filter(card => [
    card.content.name,
    card.content.typeLine,
    card.meta.setCode,
    card.content.tags
  ].join(' ').toLowerCase().includes(query));
}

function renderLibrary(){
  const host = $('#libraryList');
  const items = filteredLibraryCards();
  $('#libraryCount').textContent = items.length;
  host.replaceChildren();
  if(!items.length){
    host.append(createText('div', 'empty-state', 'Nessuna carta salvata.'));
    return;
  }
  items.forEach(card => host.append(createLibraryItem(card)));
}

function createLibraryItem(card){
  const node = document.createElement('div');
  node.className = 'library-item';

  const thumb = document.createElement('div');
  thumb.className = 'library-thumb';
  if(card.art.src){
    const img = document.createElement('img');
    img.alt = '';
    img.src = card.art.src;
    thumb.append(img);
  }else{
    thumb.textContent = 'M12';
  }

  const copy = document.createElement('div');
  copy.className = 'library-copy';
  copy.append(
    createText('strong', '', card.content.name || 'Senza nome'),
    createText('span', '', `${card.meta.setCode || 'SET'} #${card.meta.collectorNumber || '—'} · ${card.meta.rarity || ''}`)
  );

  const actions = document.createElement('div');
  actions.className = 'item-actions';
  actions.append(
    createActionButton('Carica', () => loadCardIntoEditor(card)),
    createActionButton('Duplica', () => duplicateCardToLibrary(card)),
    createActionButton('Elimina', () => deleteLibraryCard(card.id), true)
  );

  node.append(thumb, copy, actions);
  return node;
}

function renderTemplates(){
  const host = $('#templateList');
  host.replaceChildren();
  if(!templates.length){
    host.append(createText('div', 'empty-state', 'Nessun template salvato.'));
    return;
  }
  templates.forEach(template => {
    const node = document.createElement('div');
    node.className = 'template-item';
    node.append(createText('div', 'library-thumb', 'TPL'));

    const copy = document.createElement('div');
    copy.className = 'template-copy';
    copy.append(
      createText('strong', '', template.name),
      createText('span', '', `${template.layout.preset || 'custom'} · ${new Date(template.createdAt).toLocaleDateString()}`)
    );
    node.append(copy);

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.append(
      createActionButton('Applica', () => applyTemplate(template)),
      createActionButton('Elimina', async () => {
        await storeDelete(STORE_TEMPLATES, template.id);
        refreshLibrary();
      }, true)
    );
    node.append(actions);
    host.append(node);
  });
}

function loadCardIntoEditor(card){
  try{
    snapshot();
    state = normalizeImportedCard(card);
    hydrateControls();
    loadArt();
    scheduleRender();
    queueDraftSave();
    toast('Carta caricata', 'success');
  }catch(error){
    toast(error.message, 'error');
  }
}

function cloneCardForDuplicate(card){
  const copy = normalizeImportedCard(card);
  copy.id = uid();
  copy.meta.collectorNumber = '';
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = copy.createdAt;
  copy.content.name = normalizeString(`${copy.content.name} copia`, 'Copia', TEXT_LIMITS.name);
  return copy;
}

async function duplicateCardToLibrary(card = state){
  try{
    await storePut(STORE_CARDS, cloneCardForDuplicate(card));
    await refreshLibrary();
    toast('Carta duplicata', 'success');
  }catch(error){
    toast(`Duplicazione fallita: ${error.message}`, 'error');
  }
}

async function deleteLibraryCard(id){
  if(!confirm('Eliminare questa carta?')) return;
  try{
    await storeDelete(STORE_CARDS, id);
    await refreshLibrary();
  }catch(error){
    toast(`Eliminazione fallita: ${error.message}`, 'error');
  }
}
