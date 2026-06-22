'use strict';

window.M12Test = {
  safeFileName,
  normalizeImportedCard,
  normalizeTemplate,
  normalizeBackup,
  getDimensions,
  LAYOUTS,
  FONT_OPTIONS,
  renderCardToCanvas,
  loadImageFromSrc,
  filteredLibraryCards,
  storePut,
  storeAll,
  STORE_CARDS,
  STORE_TEMPLATES
};

function init(){
  restoreDraft();
  buildLayoutPresetUI();
  buildFontControls();
  buildResourceEditor();
  buildStatsEditor();
  bindControls();
  bindAppEvents();
  hydrateControls();
  loadArt();
  refreshLibrary();
  scheduleRender();
  queueDraftSave();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
