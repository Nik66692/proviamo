let state = deepClone(DEFAULT_STATE);
let history = [];
let future = [];
let artImage = null;
let renderQueued = false;
let previewMode = 'fit';
let cachedLibrary = [];
let templates = [];
let activeTab = 'content';
let autosaveTimer = null;

const canvas = $('#cardCanvas');
const ctx = canvas.getContext('2d', { alpha:true });

function getPath(object, path){
  return path.split('.').reduce((value,key)=>value?.[key], object);
}
function setPath(object, path, value){
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((value,key)=>value[key], object);
  target[last] = value;
}
function parseInputValue(input){
  if(input.type === 'checkbox') return input.checked;
  if(input.type === 'number' || input.type === 'range') return Number(input.value);
  return input.value;
}
function snapshot(){
  history.push(deepClone(state));
  if(history.length > 40) history.shift();
  future = [];
}
function undo(){
  if(!history.length) return;
  future.push(deepClone(state));
  state = history.pop();
  hydrateControls();
  loadArt();
  scheduleRender();
  queueDraftSave();
}
function redo(){
  if(!future.length) return;
  history.push(deepClone(state));
  state = future.pop();
  hydrateControls();
  loadArt();
  scheduleRender();
  queueDraftSave();
}
function toast(message,type=''){
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  $('#toastContainer').append(node);
  setTimeout(()=>node.remove(),3200);
}
function setStatus(message){
  $('#saveStatus').textContent = message;
}

function getDimensions(cardState = state){
  const preset = cardState.layout.sizePreset;
  if(preset === 'custom') return [
    clamp(Number(cardState.layout.customWidth)||750,500,2400),
    clamp(Number(cardState.layout.customHeight)||1050,500,3000)
  ];
  return SIZE_PRESETS[preset] || SIZE_PRESETS.standard;
}

function applyLayoutPreset(key, pushHistory = true){
  const preset = LAYOUTS[key];
  if(!preset) return;
  if(pushHistory) snapshot();
  state.layout.preset = key;
  state.layout.sizePreset = preset.size;
  state.visual.frameStyle = preset.frame;
  state.geometry = deepClone(preset.geometry);
  Object.assign(state.layout,preset.flags);
  if(key === 'propaganda'){
    state.typography.title.font = 'Bebas Neue';
    state.typography.title.size = 8;
    state.typography.rules.font = 'Libre Baskerville';
  } else if(key === 'ritual'){
    state.typography.title.font = 'Cinzel';
    state.typography.rules.font = 'Cormorant Garamond';
  } else if(key === 'blueprint'){
    state.typography.title.font = 'Oxanium';
    state.typography.rules.font = 'Share Tech Mono';
  } else if(key === 'classic'){
    state.typography.title.font = 'Cinzel';
    state.typography.rules.font = 'Libre Baskerville';
  }
  hydrateControls();
  scheduleRender();
  queueDraftSave();
}

