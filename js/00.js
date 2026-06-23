'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const deepClone = value => structuredClone(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const FONT_OPTIONS = [
  ['Orbitron','Orbitron'],['Oxanium','Oxanium'],['Chakra Petch','Chakra Petch'],['Exo 2','Exo 2'],
  ['Rajdhani','Rajdhani'],['Audiowide','Audiowide'],['Russo One','Russo One'],['Unbounded','Unbounded'],
  ['Black Ops One','Black Ops One'],['Bebas Neue','Bebas Neue'],['Oswald','Oswald'],['Barlow Condensed','Barlow Condensed'],
  ['Share Tech Mono','Share Tech Mono'],['IBM Plex Mono','IBM Plex Mono'],['Space Mono','Space Mono'],['Special Elite','Special Elite'],
  ['Cinzel','Cinzel'],['Cormorant Garamond','Cormorant Garamond'],['Playfair Display','Playfair Display'],
  ['Libre Baskerville','Libre Baskerville'],['Impact','Impact'],['Arial Narrow','Arial Narrow'],
  ['Georgia','Georgia'],['Trebuchet MS','Trebuchet MS'],['Verdana','Verdana'],['Courier New','Courier New'],
  ['Times New Roman','Times New Roman'],['Palatino','Palatino Linotype'],['Copperplate','Copperplate'],['Gill Sans','Gill Sans']
];

const FONT_SECTIONS = [
  ['title','Titolo'],['subtitle','Sottotitolo'],['type','Type line'],['rules','Testo regole'],
  ['flavor','Flavor'],['stats','Statistiche'],['footer','Footer']
];

const SIZE_PRESETS = {
  standard:[750,1050], poker:[750,1050], tarot:[750,1250], square:[1000,1000], landscape:[1050,750]
};

const LAYOUTS = {
  cyber:{
    label:'Cyber Dossier',desc:'Full-art, HUD, dossier e segretezza',
    size:'standard',frame:'dossier',
    geometry:{padding:4,titleY:5.4,titleH:12.7,artY:6.5,artH:58,typeY:66.2,rulesY:71.3,rulesH:17.5,footerY:91.5,footerH:6.4,costX:67,costY:5.4,costW:28,costH:12.7},
    flags:{fullArt:true,showTitlePanel:true,showTypePanel:true,showRulesPanel:true,showFooter:true,showStats:true,showCost:true,showWatermark:true}
  },
  classic:{
    label:'Classic TCG',desc:'Frame tradizionale, art centrale, rules box ampio',
    size:'standard',frame:'classic',
    geometry:{padding:4.5,titleY:3.8,titleH:8,artY:12.5,artH:46,typeY:59.8,rulesY:64.5,rulesH:26.5,footerY:92.5,footerH:5.2,costX:77,costY:3.9,costW:18,costH:8},
    flags:{fullArt:false,showTitlePanel:true,showTypePanel:true,showRulesPanel:true,showFooter:true,showStats:true,showCost:true,showWatermark:true}
  },
  cinematic:{
    label:'Full Art Cinematic',desc:'Art dominante, pannelli flottanti e testo basso',
    size:'standard',frame:'minimal',
    geometry:{padding:3,titleY:4,titleH:10,artY:0,artH:100,typeY:68,rulesY:72.5,rulesH:18.5,footerY:92.5,footerH:5,costX:76,costY:4,costW:20,costH:10},
    flags:{fullArt:true,showTitlePanel:true,showTypePanel:true,showRulesPanel:true,showFooter:true,showStats:true,showCost:true,showWatermark:false}
  },
  minimal:{
    label:'Minimal Frameless',desc:'Pulito, moderno, molto spazio all’immagine',
    size:'standard',frame:'minimal',
    geometry:{padding:4,titleY:6,titleH:9,artY:0,artH:100,typeY:71,rulesY:75,rulesH:16,footerY:93,footerH:4.5,costX:79,costY:6,costW:16,costH:9},
    flags:{fullArt:true,showTitlePanel:false,showTypePanel:false,showRulesPanel:false,showFooter:true,showStats:true,showCost:true,showWatermark:false}
  },
  split:{
    label:'Split Intel',desc:'Artwork a sinistra, dossier testuale a destra',
    size:'landscape',frame:'tech',
    geometry:{padding:3,titleY:5,titleH:11,artY:0,artH:100,typeY:23,rulesY:30,rulesH:48,footerY:90,footerH:6,costX:83,costY:5,costW:13,costH:11},
    flags:{fullArt:false,showTitlePanel:true,showTypePanel:true,showRulesPanel:true,showFooter:true,showStats:true,showCost:true,showWatermark:true}
  },
  blueprint:{
    label:'Artifact Blueprint',desc:'Scheda tecnica, reticolo e callout industriali',
    size:'standard',frame:'tech',
    geometry:{padding:4,titleY:4,titleH:11,artY:16,artH:43,typeY:60.5,rulesY:65,rulesH:25,footerY:92,footerH:5.5,costX:72,costY:4,costW:24,costH:11},
    flags:{fullArt:false,showTitlePanel:true,showTypePanel:true,showRulesPanel:true,showFooter:true,showStats:true,showCost:true,showWatermark:true}
  },
  propaganda:{
    label:'Propaganda Poster',desc:'Titolo enorme, poster politico, testo editoriale',
    size:'tarot',frame:'propaganda',
    geometry:{padding:4,titleY:5,titleH:16,artY:0,artH:100,typeY:66,rulesY:71,rulesH:18,footerY:92,footerH:5,costX:77,costY:23,costW:19,costH:9},
    flags:{fullArt:true,showTitlePanel:false,showTypePanel:true,showRulesPanel:true,showFooter:true,showStats:false,showCost:true,showWatermark:true}
  },
  ritual:{
    label:'Omega Ritual',desc:'Cerchi, sigilli, simmetria e atmosfera occulta',
    size:'standard',frame:'ritual',
    geometry:{padding:5,titleY:5,titleH:11,artY:14,artH:49,typeY:64.5,rulesY:69,rulesH:20.5,footerY:92,footerH:5.5,costX:74,costY:5,costW:22,costH:11},
    flags:{fullArt:true,showTitlePanel:true,showTypePanel:true,showRulesPanel:true,showFooter:true,showStats:true,showCost:true,showWatermark:true}
  },
  token:{
    label:'Token Showcase',desc:'Nome, artwork e statistiche: testo ridotto',
    size:'standard',frame:'classic',
    geometry:{padding:4,titleY:4,titleH:10,artY:10,artH:74,typeY:85,rulesY:88,rulesH:0,footerY:93,footerH:4.5,costX:77,costY:4,costW:19,costH:10},
    flags:{fullArt:false,showTitlePanel:true,showTypePanel:true,showRulesPanel:false,showFooter:true,showStats:true,showCost:false,showWatermark:false}
  },
  landscape:{
    label:'Landscape Event',desc:'Formato orizzontale per luoghi ed eventi',
    size:'landscape',frame:'dossier',
    geometry:{padding:3,titleY:5,titleH:12,artY:0,artH:100,typeY:65,rulesY:70,rulesH:18,footerY:91.5,footerH:5,costX:82,costY:5,costW:14,costH:12},
    flags:{fullArt:true,showTitlePanel:true,showTypePanel:true,showRulesPanel:true,showFooter:true,showStats:false,showCost:true,showWatermark:true}
  }
};

