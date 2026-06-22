'use strict';
function bindAppEvents(){
  $$('.tab').forEach(tab=>tab.addEventListener('click',()=>{$$('.tab,.tab-panel').forEach(n=>n.classList.remove('active'));tab.classList.add('active');$(`#tab-${tab.dataset.tab}`).classList.add('active');activeTab=tab.dataset.tab;}));
  $$('.view-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.view-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');previewMode=btn.dataset.zoom;updateZoom();}));
  $('#undoBtn').onclick=undo;$('#redoBtn').onclick=redo;$('#newCardBtn').onclick=newCard;$('#saveCardBtn').onclick=saveCurrentCard;$('#saveLibraryBtn').onclick=saveCurrentCard;$('#nextCollectorBtn').onclick=assignNextCollector;
  $('#fillDemoBtn').onclick=()=>{snapshot();Object.assign(state.content,{name:'PROJECT BLUE BOOK',subtitle:'Disinformation Archive',typeLine:'Agenda — Public Record · Debunk',rules:'Quando peschi una carta Paranormale, puoi rivelarla. Se lo fai, crea una pedina Testimone 1/1 e archivia un documento dal cimitero avversario.\n\nLe carte con Segretezza inferiore non possono neutralizzare questa agenda.',flavor:'La verità è più utile quando nessuno sa dove cercarla.',keywords:'Archivio, Testimone, Debunk',tags:'agenda, controllo, archivio'});hydrateControls();scheduleRender();queueDraftSave();};
  $('#resetGeometryBtn').onclick = () => {
    const preset = LAYOUTS[state.layout.preset];
    if(!preset) return;
    snapshot();
    state.geometry = deepClone(preset.geometry);
    hydrateControls();
    scheduleRender();
    queueDraftSave();
  };
  $('#applyCustomFontBtn').onclick=()=>{const key=$('#customFontTarget').value, val=$('#customFontInput').value.trim();if(val){snapshot();state.typography[key].font=val;hydrateControls();scheduleRender();queueDraftSave();}};
  $('#artFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;snapshot();state.art.src = normalizeImageDataUrl(await readFileAsDataURL(file));
    state.art.name = normalizeString(file.name, '', 120);
    loadArt();
    queueDraftSave();};
  $('#removeArtBtn').onclick=()=>{snapshot();state.art.src='';state.art.name='';loadArt();queueDraftSave();};
  $('#centerArtBtn').onclick=()=>{snapshot();state.art.x=0;state.art.y=0;state.art.zoom=100;hydrateControls();scheduleRender();queueDraftSave();};
  $('#duplicateCardBtn').onclick = () => duplicateCardToLibrary(state);
  $('#saveTemplateBtn').onclick=async()=>{const name=prompt('Nome template',LAYOUTS[state.layout.preset]?.label||'Template');if(name){await storePut(STORE_TEMPLATES,templateFromState(name));refreshLibrary();toast('Template salvato','success');}};
  $('#librarySearch').oninput=renderLibrary;
  $('#exportPngBtn').onclick = exportPng;
  $('#exportJsonBtn').onclick = exportCardJson;
  $('#exportProjectBtn').onclick = exportProject;
  $('#exportSheetBtn').onclick = exportSheet;
  $('#importCardFile').onchange = e => { if(e.target.files[0]) importCardFile(e.target.files[0]); };
  $('#importProjectFile').onchange = e => { if(e.target.files[0]) importProjectFile(e.target.files[0]); };
  $('#previewGuides').onchange=scheduleRender;window.addEventListener('resize',updateZoom);
  document.addEventListener('keydown',e=>{const mod=e.ctrlKey||e.metaKey;if(!mod)return;if(e.key.toLowerCase()==='s'){e.preventDefault();saveCurrentCard();}if(e.key.toLowerCase()==='z'){e.preventDefault();undo();}if(e.key.toLowerCase()==='y'){e.preventDefault();redo();}if(e.key.toLowerCase()==='e'){e.preventDefault();exportPng();}});
}
