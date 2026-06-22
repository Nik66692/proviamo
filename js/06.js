'use strict';

function queueDraftSave(){
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    try{
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      setStatus(`Bozza salvata ${new Date().toLocaleTimeString()}`);
    }catch(_error){
      setStatus('Autosave non riuscito');
    }
  }, 250);
}

function restoreDraft(){
  try{
    const raw = localStorage.getItem(DRAFT_KEY);
    if(raw) state = normalizeImportedCard(JSON.parse(raw));
  }catch(error){
    toast(`Bozza ignorata: ${error.message}`, 'error');
    localStorage.removeItem(DRAFT_KEY);
  }
}

async function saveCurrentCard(){
  try{
    state.updatedAt = new Date().toISOString();
    if(!state.createdAt) state.createdAt = state.updatedAt;
    await storePut(STORE_CARDS, normalizeImportedCard(state));
    setStatus('Carta salvata in libreria');
    toast('Carta salvata', 'success');
    await refreshLibrary();
    queueDraftSave();
  }catch(error){
    toast(`Salvataggio fallito: ${error.message}`, 'error');
  }
}

async function assignNextCollector(){
  const setCode = (state.meta.setCode || '').trim();
  const nums = cachedLibrary
    .filter(card => (card.meta.setCode || '').trim() === setCode)
    .map(card => parseInt(card.meta.collectorNumber, 10))
    .filter(Number.isFinite);
  snapshot();
  state.meta.collectorNumber = String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
  hydrateControls();
  scheduleRender();
  queueDraftSave();
}

function newCard(){
  if(!confirm('Creare una nuova carta? La bozza attuale resta salvata in autosave.')) return;
  snapshot();
  const keepProject = deepClone(state.project);
  state = deepClone(DEFAULT_STATE);
  state.id = uid();
  state.project = keepProject;
  hydrateControls();
  loadArt();
  scheduleRender();
  queueDraftSave();
}

function createRenderCanvas(card, scale = 1){
  const [w, h] = getDimensions(card);
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.round(w * scale);
  offscreen.height = Math.round(h * scale);
  return offscreen;
}

async function renderCardToCanvas(card, image, options = {}){
  const scale = Number(options.scale) || 1;
  const offscreen = createRenderCanvas(card, scale);
  const offscreenCtx = offscreen.getContext('2d', { alpha: true });
  renderCardToContext(offscreenCtx, card, image, {
    scale,
    transparent: Boolean(options.transparent),
    guides: Boolean(options.guides)
  });
  return offscreen;
}

async function exportPng(){
  try{
    const scale = Number($('#exportScale').value) || 1;
    const transparent = $('#exportBackground').value === 'transparent';
    const guides = Boolean($('#exportGuides').checked);
    const offscreen = await renderCardToCanvas(state, artImage, { scale, transparent, guides });
    offscreen.toBlob(blob => {
      if(blob) downloadBlob(blob, `${safeFileName(state.content.name)}-${scale}x.png`);
    }, 'image/png');
  }catch(error){
    toast(`Export PNG fallito: ${error.message}`, 'error');
  }
}

function exportCardJson(){
  try{
    downloadText(JSON.stringify(normalizeImportedCard(state), null, 2), `${safeFileName(state.content.name)}.card.json`);
  }catch(error){
    toast(`Export JSON fallito: ${error.message}`, 'error');
  }
}

async function importCardFile(file){
  try{
    const card = normalizeImportedCard(JSON.parse(await readFileAsText(file)));
    snapshot();
    state = card;
    hydrateControls();
    loadArt();
    scheduleRender();
    queueDraftSave();
    toast('Carta importata', 'success');
  }catch(error){
    toast(`Import carta fallito: ${error.message}`, 'error');
  }
}

async function exportProject(){
  try{
    const project = {
      version: 1,
      exportedAt: new Date().toISOString(),
      cards: await storeAll(STORE_CARDS),
      templates: await storeAll(STORE_TEMPLATES),
      draft: normalizeImportedCard(state)
    };
    downloadText(JSON.stringify(project, null, 2), `${safeFileName(state.project.gameName)}-backup.json`);
  }catch(error){
    toast(`Backup fallito: ${error.message}`, 'error');
  }
}

async function importProjectFile(file){
  try{
    const backup = normalizeBackup(JSON.parse(await readFileAsText(file)));
    for(const card of backup.cards) await storePut(STORE_CARDS, card);
    for(const template of backup.templates) await storePut(STORE_TEMPLATES, template);
    if(backup.draft){
      snapshot();
      state = backup.draft;
      hydrateControls();
      loadArt();
      queueDraftSave();
    }
    await refreshLibrary();
    scheduleRender();
    toast('Progetto ripristinato', 'success');
  }catch(error){
    toast(`Import progetto fallito: ${error.message}`, 'error');
  }
}

async function exportSheet(){
  try{
    const sheet = document.createElement('canvas');
    sheet.width = 2480;
    sheet.height = 3508;
    const sheetCtx = sheet.getContext('2d');
    sheetCtx.fillStyle = '#fff';
    sheetCtx.fillRect(0, 0, sheet.width, sheet.height);

    const source = $('#sheetMode').value === 'library' ? filteredLibraryCards().slice(0, 9) : Array(9).fill(state);
    const margin = 90;
    const gap = 28;
    const cellW = (sheet.width - margin * 2 - gap * 2) / 3;
    const cellH = (sheet.height - margin * 2 - gap * 2) / 3;

    for(let index = 0; index < source.length; index++){
      const card = normalizeImportedCard(source[index]);
      const image = await loadImageFromSrc(card.art.src);
      const cardCanvas = await renderCardToCanvas(card, image, { scale: 1, transparent: false, guides: false });
      const fit = containRect(cardCanvas.width, cardCanvas.height, {
        x: margin + (index % 3) * (cellW + gap),
        y: margin + Math.floor(index / 3) * (cellH + gap),
        w: cellW,
        h: cellH
      });
      sheetCtx.drawImage(cardCanvas, fit.x, fit.y, fit.w, fit.h);
      if($('#sheetMarks').value === 'on') drawCutMarks(sheetCtx, fit);
    }

    sheet.toBlob(blob => {
      if(blob) downloadBlob(blob, `${safeFileName(state.project.gameName)}-a4-sheet.png`);
    }, 'image/png');
  }catch(error){
    toast(`Export A4 fallito: ${error.message}`, 'error');
  }finally{
    hydrateControls();
    scheduleRender();
  }
}

function containRect(sourceW, sourceH, box){
  const scale = Math.min(box.w / sourceW, box.h / sourceH);
  const w = sourceW * scale;
  const h = sourceH * scale;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

function drawCutMarks(ctx, rect){
  const len = 24;
  const gap = 10;
  ctx.save();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  const corners = [
    [rect.x, rect.y, -1, -1],
    [rect.x + rect.w, rect.y, 1, -1],
    [rect.x, rect.y + rect.h, -1, 1],
    [rect.x + rect.w, rect.y + rect.h, 1, 1]
  ];
  corners.forEach(([x, y, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(x + sx * gap, y);
    ctx.lineTo(x + sx * (gap + len), y);
    ctx.moveTo(x, y + sy * gap);
    ctx.lineTo(x, y + sy * (gap + len));
    ctx.stroke();
  });
  ctx.restore();
}
