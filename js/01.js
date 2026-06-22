const DEFAULT_STATE = {
  version:1,
  id:uid(),
  project:{gameName:'MAJESTIC-12',rulesVersion:'ALPHA 0.1',authorNote:'CUSTOM PLAYTEST'},
  content:{
    name:'MK ULTRA',subtitle:'Behavioral Control Program',
    typeLine:'Operazione — Black Project · Protocollo',
    rules:'Quando MK ULTRA entra nel campo, scegli un avversario. Fino al tuo prossimo turno, le sue carte Masse & Media costano 1 sigillo addizionale per essere giocate.',
    flavor:'L’esperimento non è finito. È solo diventato scalabile.',
    keywords:'Controllo, Esperimento',tags:'black project, controllo, engine'
  },
  meta:{
    setCode:'ILLUM',collectorNumber:'001',rarity:'Rare',cardKind:'Operazione',secrecy:'Classified',
    archiveCode:'CON-0001',footer:'MAJESTIC-12 · CUSTOM PLAYTEST'
  },
  layout:{
    preset:'cyber',sizePreset:'standard',customWidth:750,customHeight:1050,globalAlign:'left',
    fullArt:true,showTitlePanel:true,showTypePanel:true,showRulesPanel:true,showFooter:true,showStats:true,showCost:true,showWatermark:true
  },
  geometry:deepClone(LAYOUTS.cyber.geometry),
  visual:{
    frameStyle:'dossier',texture:'grid',bg1:'#06101a',bg2:'#08040f',accent1:'#35c2ff',accent2:'#d9af3f',
    panelColor:'#07111b',textColor:'#f3fbff',mutedColor:'#94b5c9',radius:2,borderWidth:1.1,
    panelOpacity:78,overlayOpacity:18,fallbackGlyph:'Ψ',watermark:'CLASSIFIED'
  },
  art:{src:'',name:'',fit:'cover',blend:'source-over',zoom:100,x:0,y:0,brightness:100,contrast:100,saturation:100,blur:0},
  typography:{
    title:{font:'Orbitron',size:5.3,weight:900,tracking:.01,align:'left',uppercase:true},
    subtitle:{font:'Rajdhani',size:1.8,weight:600,tracking:.08,align:'left',uppercase:true},
    type:{font:'Rajdhani',size:2.35,weight:700,tracking:.06,align:'left',uppercase:true},
    rules:{font:'IBM Plex Mono',size:2.15,weight:500,tracking:0,align:'left',uppercase:false},
    flavor:{font:'Cormorant Garamond',size:2.1,weight:500,tracking:.01,align:'left',uppercase:false},
    stats:{font:'Orbitron',size:3.8,weight:900,tracking:0,align:'center',uppercase:true},
    footer:{font:'IBM Plex Mono',size:1.25,weight:600,tracking:.08,align:'left',uppercase:true}
  },
  system:{
    genericCost:'',costLabel:'SIGILLI',
    resources:[
      {enabled:true,name:'Masse & Media',symbol:'◉',color:'#19d79c'},
      {enabled:true,name:'Politica',symbol:'◆',color:'#ff5c67'},
      {enabled:true,name:'Tecnologia',symbol:'⌬',color:'#35c2ff'},
      {enabled:false,name:'Economia',symbol:'$',color:'#d9af3f'},
      {enabled:false,name:'Militare',symbol:'▣',color:'#77815f'},
      {enabled:false,name:'Paranormale',symbol:'✦',color:'#8b6cff'}
    ],
    stats:[
      {enabled:true,label:'REACH',value:'6'},
      {enabled:true,label:'COVER',value:'3'},
      {enabled:false,label:'POWER',value:'0'},
      {enabled:false,label:'SHIELD',value:'0'}
    ]
  },
  createdAt:new Date().toISOString(),
  updatedAt:new Date().toISOString()
};

