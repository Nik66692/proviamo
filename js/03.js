function buildLayoutPresetUI(){
  const host = $('#layoutPresets');
  host.innerHTML = '';
  Object.entries(LAYOUTS).forEach(([key,preset])=>{
    const button = document.createElement('button');
    button.type='button';
    button.className='preset-card';
    button.dataset.layout = key;
    button.innerHTML = `<strong>${preset.label}</strong><span>${preset.desc}</span>`;
    button.addEventListener('click',()=>applyLayoutPreset(key));
    host.append(button);
  });
}

function buildFontControls(){
  const host = $('#fontControls');
  host.innerHTML = '';
  FONT_SECTIONS.forEach(([key,label])=>{
    const card = document.createElement('div');
    card.className = 'font-card';
    card.innerHTML = `
      <div class="font-title"><strong>${label}</strong><label class="toggle-mini"><input type="checkbox" data-path="typography.${key}.uppercase"><span>ABC</span></label></div>
      <div class="grid">
        <label>Famiglia<select data-path="typography.${key}.font">${FONT_OPTIONS.map(([labelName,value])=>`<option value="${value}">${labelName}</option>`).join('')}</select></label>
        <label>Dimensione<input type="number" min=".6" max="16" step=".1" data-path="typography.${key}.size"></label>
        <label>Peso<select data-path="typography.${key}.weight"><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option><option value="800">800</option><option value="900">900</option></select></label>
      </div>
      <div class="grid two">
        <label>Tracking<input type="number" min="-.1" max=".5" step=".01" data-path="typography.${key}.tracking"></label>
        <label>Allineamento<select data-path="typography.${key}.align"><option value="left">Sinistra</option><option value="center">Centro</option><option value="right">Destra</option></select></label>
      </div>`;
    host.append(card);
  });
}

function buildResourceEditor(){
  const host = $('#resourceEditor');
  host.innerHTML = '';
  state.system.resources.forEach((resource,index)=>{
    const row = document.createElement('div');
    row.className = 'resource-row';
    row.innerHTML = `
      <label class="toggle-mini"><input type="checkbox" data-path="system.resources.${index}.enabled"></label>
      <label>Nome<input data-path="system.resources.${index}.name"></label>
      <label>Simbolo<input data-path="system.resources.${index}.symbol" maxlength="3"></label>
      <label>Colore<input type="color" data-path="system.resources.${index}.color"></label>`;
    host.append(row);
  });
}
function buildStatsEditor(){
  const host = $('#statsEditor');
  host.innerHTML = '';
  state.system.stats.forEach((stat,index)=>{
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
      <label class="toggle-mini"><input type="checkbox" data-path="system.stats.${index}.enabled"></label>
      <label>Label<input data-path="system.stats.${index}.label"></label>
      <label>Valore<input data-path="system.stats.${index}.value"></label>
      <span></span>`;
    host.append(row);
  });
}

function bindControls(){
  $$('[data-path]').forEach(input=>{
    if(input.dataset.bound) return;
    input.dataset.bound = 'true';
    input.addEventListener('focus',()=>{ input.dataset.before = JSON.stringify(state); },{passive:true});
    input.addEventListener('input',()=>{
      const path = input.dataset.path;
      setPath(state,path,parseInputValue(input));
      state.updatedAt = new Date().toISOString();
      updateOutputs();
      scheduleRender();
      queueDraftSave();
    });
    input.addEventListener('change',()=>{
      if(input.dataset.before){
        const previous = JSON.parse(input.dataset.before);
        if(JSON.stringify(previous) !== JSON.stringify(state)){
          history.push(previous);
          if(history.length > 40) history.shift();
          future = [];
        }
        delete input.dataset.before;
      }
      if(input.dataset.path === 'layout.sizePreset') scheduleRender();
      if(input.dataset.path.endsWith('.font')) document.fonts.ready.then(scheduleRender);
    });
  });
}

function hydrateControls(){
  $$('[data-path]').forEach(input=>{
    const value = getPath(state,input.dataset.path);
    if(input.type === 'checkbox') input.checked = Boolean(value);
    else if(value !== undefined && value !== null) input.value = value;
  });
  $$('.preset-card').forEach(node=>node.classList.toggle('active',node.dataset.layout === state.layout.preset));
  $('.custom-size-row').style.display = state.layout.sizePreset === 'custom' ? 'grid' : 'none';
  $('#activeLayoutName').textContent = LAYOUTS[state.layout.preset]?.label || 'Custom';
  updateOutputs();
}

function updateOutputs(){
  $$('[data-output]').forEach(output=>{
    const path = output.dataset.output;
    const value = getPath(state,path);
    const suffix = path.includes('Opacity') || ['art.brightness','art.contrast','art.saturation','art.zoom'].includes(path) ? '%' :
      path === 'art.blur' ? 'px' : path.startsWith('geometry.') ? '%' : '';
    output.textContent = `${value}${suffix}`;
  });
}

function scheduleRender(){
  if(renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(()=>{
    renderQueued = false;
    renderPreview();
  });
}
