'use strict';
window.M12Test={safeFileName,normalizeImportedCard,getDimensions,LAYOUTS,FONT_OPTIONS};
function init(){restoreDraft();buildLayoutPresetUI();buildFontControls();buildResourceEditor();buildStatsEditor();bindControls();bindAppEvents();hydrateControls();loadArt();refreshLibrary();scheduleRender();queueDraftSave();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
