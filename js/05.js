'use strict';

const DRAW = {
  ctx: null,
  state: null,
  image: null,
  scale: 1,
  transparent: false,
  guides: false
};

function pctRect(_g, w, h, x = 0, y = 0, rw = 100, rh = 100){
  return { x: w * x / 100, y: h * y / 100, w: w * rw / 100, h: h * rh / 100 };
}

function rectFromGeom(w, h, card = state){
  const p = card.geometry.padding;
  return {
    title: pctRect(card.geometry, w, h, p, card.geometry.titleY, 100 - p * 2, card.geometry.titleH),
    art: pctRect(card.geometry, w, h, p, card.geometry.artY, 100 - p * 2, card.geometry.artH),
    type: pctRect(card.geometry, w, h, p, card.geometry.typeY, 100 - p * 2, 4.2),
    rules: pctRect(card.geometry, w, h, p, card.geometry.rulesY, 100 - p * 2, card.geometry.rulesH),
    footer: pctRect(card.geometry, w, h, p, card.geometry.footerY, 100 - p * 2, card.geometry.footerH),
    cost: pctRect(card.geometry, w, h, card.geometry.costX || 75, card.geometry.costY || 4, card.geometry.costW || 20, card.geometry.costH || 9)
  };
}

function alignX(rect, align, pad = 0){
  if(align === 'center') return rect.x + rect.w / 2;
  if(align === 'right') return rect.x + rect.w - pad;
  return rect.x + pad;
}

function textValue(key, value, card = DRAW.state || state){
  return card.typography[key]?.uppercase ? String(value || '').toUpperCase() : String(value || '');
}

function fontSpec(key, px, card = DRAW.state || state){
  const t = card.typography[key];
  return `${Number(t.weight) || 500} ${Math.max(7, px)}px ${t.font}, sans-serif`;
}

function setFont(key, px){
  const card = DRAW.state;
  const t = card.typography[key];
  DRAW.ctx.font = fontSpec(key, px, card);
  DRAW.ctx.textAlign = t.align || card.layout.globalAlign || 'left';
  DRAW.ctx.textBaseline = 'top';
  DRAW.ctx.fillStyle = card.visual.textColor;
}

function drawTrackedText(text, x, y, key, px){
  const { ctx, state: card } = DRAW;
  const tracking = (card.typography[key].tracking || 0) * px;
  if(!tracking){
    ctx.fillText(text, x, y);
    return;
  }
  const align = ctx.textAlign;
  const width = measureTrackedText(text, key, px);
  let cursor = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  ctx.textAlign = 'left';
  [...text].forEach(char => {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + tracking;
  });
  ctx.textAlign = align;
}

function measureTrackedText(text, key, px){
  const { ctx, state: card } = DRAW;
  ctx.save();
  ctx.font = fontSpec(key, px, card);
  const tracking = (card.typography[key].tracking || 0) * px;
  const chars = [...String(text)];
  const base = chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0);
  ctx.restore();
  return base + Math.max(0, chars.length - 1) * tracking;
}

function fitLine(text, rect, key, maxPx, minPx){
  let size = maxPx;
  while(size > minPx){
    if(measureTrackedText(text, key, size) <= rect.w) break;
    size -= 1;
  }
  return size;
}

function roundRectPath(ctx, rect, radius){
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, Math.max(0, radius));
}

function panel(rect, alpha = DRAW.state.visual.panelOpacity / 100, variant = 'default'){
  const { ctx, state: card } = DRAW;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = card.visual.panelColor;
  if(variant === 'slant'){
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.h * .25, rect.y);
    ctx.lineTo(rect.x + rect.w, rect.y);
    ctx.lineTo(rect.x + rect.w - rect.h * .25, rect.y + rect.h);
    ctx.lineTo(rect.x, rect.y + rect.h);
    ctx.closePath();
  }else if(variant === 'cut'){
    const c = Math.min(rect.w, rect.h) * .16;
    ctx.beginPath();
    ctx.moveTo(rect.x + c, rect.y);
    ctx.lineTo(rect.x + rect.w, rect.y);
    ctx.lineTo(rect.x + rect.w, rect.y + rect.h - c);
    ctx.lineTo(rect.x + rect.w - c, rect.y + rect.h);
    ctx.lineTo(rect.x, rect.y + rect.h);
    ctx.lineTo(rect.x, rect.y + c);
    ctx.closePath();
  }else{
    roundRectPath(ctx, rect, Math.min(rect.w, rect.h) * card.visual.radius / 100);
  }
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = card.visual.accent1;
  ctx.lineWidth = Math.max(1, card.visual.borderWidth * 2);
  ctx.stroke();
  ctx.restore();
}

function drawTexture(w, h){
  const { ctx, state: card } = DRAW;
  if(card.visual.texture === 'none') return;
  ctx.save();
  if(card.visual.texture === 'scanlines'){
    ctx.globalAlpha = .16;
    ctx.strokeStyle = card.visual.accent1;
    for(let y = 0; y < h; y += 8){
      ctx.beginPath();
      ctx.moveTo(0, y + .5);
      ctx.lineTo(w, y + .5);
      ctx.stroke();
    }
  }else if(card.visual.texture === 'dots'){
    ctx.globalAlpha = .13;
    ctx.fillStyle = card.visual.accent2;
    for(let y = 8; y < h; y += 22){
      for(let x = 8; x < w; x += 22){
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }else if(card.visual.texture === 'paper'){
    ctx.globalAlpha = .08;
    for(let i = 0; i < 260; i++){
      ctx.fillStyle = i % 2 ? '#ffffff' : '#000000';
      ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 7 + 1, 1);
    }
  }else if(card.visual.texture === 'noise'){
    ctx.globalAlpha = .12;
    for(let i = 0; i < 1600; i++){
      const shade = Math.random() > .5 ? 255 : 0;
      ctx.fillStyle = `rgb(${shade} ${shade} ${shade})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
  }else{
    ctx.globalAlpha = .14;
    ctx.strokeStyle = card.visual.accent1;
    for(let x = 0; x < w; x += 40){
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for(let y = 0; y < h; y += 40){
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBackground(w, h){
  const { ctx, state: card } = DRAW;
  ctx.clearRect(0, 0, w, h);
  if(DRAW.transparent) return;
  if(!DRAW.transparent){
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, card.visual.bg1);
    gradient.addColorStop(1, card.visual.bg2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }
  drawTexture(w, h);
}

function drawFrame(w, h, rects){
  const { ctx, state: card } = DRAW;
  ctx.save();
  ctx.strokeStyle = card.visual.accent1;
  ctx.lineWidth = Math.max(2, card.visual.borderWidth * w / 100);
  if(card.visual.frameStyle === 'minimal'){
    ctx.globalAlpha = .7;
    ctx.strokeRect(w * .04, h * .04, w * .92, h * .92);
  }else if(card.visual.frameStyle === 'tech'){
    ctx.strokeRect(10, 10, w - 20, h - 20);
    for(let i = 0; i < 6; i++){
      ctx.beginPath();
      ctx.moveTo(w * .08, h * (.16 + i * .12));
      ctx.lineTo(w * .22, h * (.16 + i * .12));
      ctx.stroke();
    }
  }else if(card.visual.frameStyle === 'industrial' || card.visual.frameStyle === 'hazard'){
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = card.visual.accent2;
    for(let x = 18; x < w - 40; x += 36){
      ctx.fillRect(x, 18, 18, 8);
      ctx.fillRect(x, h - 26, 18, 8);
    }
    if(card.visual.frameStyle === 'hazard') drawHazardStripes(w, h);
  }else if(card.visual.frameStyle === 'ritual'){
    ctx.beginPath();
    ctx.arc(w / 2, h * .42, Math.min(w, h) * .31, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h * .42, Math.min(w, h) * .23, 0, Math.PI * 2);
    ctx.stroke();
  }else if(card.visual.frameStyle === 'propaganda'){
    ctx.fillStyle = card.visual.accent2;
    ctx.fillRect(0, 0, w, h * .055);
    ctx.fillRect(0, h * .82, w, h * .05);
  }else if(card.visual.frameStyle === 'classic'){
    ctx.strokeRect(w * .035, h * .03, w * .93, h * .94);
    ctx.strokeRect(w * .055, h * .05, w * .89, h * .90);
  }else{
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.strokeRect(w * .04, h * .04, w * .92, h * .92);
  }
  ctx.restore();
}

function drawHazardStripes(w, h){
  const { ctx, state: card } = DRAW;
  ctx.save();
  ctx.fillStyle = card.visual.accent2;
  ctx.globalAlpha = .5;
  for(let x = -h; x < w; x += 42){
    ctx.beginPath();
    ctx.moveTo(x, h * .84);
    ctx.lineTo(x + 20, h * .84);
    ctx.lineTo(x + h * .16 + 20, h);
    ctx.lineTo(x + h * .16, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawArt(rect){
  const { ctx, state: card, image } = DRAW;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = `brightness(${card.art.brightness}%) contrast(${card.art.contrast}%) saturate(${card.art.saturation}%) blur(${card.art.blur}px)`;
  ctx.globalCompositeOperation = card.art.blend || 'source-over';
  if(image){
    const fit = fittedImageRect(image, rect, card);
    ctx.drawImage(image, fit.x, fit.y, fit.w, fit.h);
  }else{
    drawFallbackArt(rect);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.globalAlpha = card.visual.overlayOpacity / 100;
  ctx.fillStyle = card.visual.bg2;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function fittedImageRect(image, rect, card){
  if(card.art.fit === 'stretch'){
    return { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
  }
  const imageRatio = image.width / image.height;
  const rectRatio = rect.w / rect.h;
  let w;
  let h;
  if(card.art.fit === 'contain'){
    if(imageRatio > rectRatio){ w = rect.w; h = w / imageRatio; }
    else{ h = rect.h; w = h * imageRatio; }
  }else if(imageRatio > rectRatio){
    h = rect.h;
    w = h * imageRatio;
  }else{
    w = rect.w;
    h = w / imageRatio;
  }
  w *= card.art.zoom / 100;
  h *= card.art.zoom / 100;
  return {
    x: rect.x + (rect.w - w) / 2 + card.art.x / 100 * rect.w,
    y: rect.y + (rect.h - h) / 2 + card.art.y / 100 * rect.h,
    w,
    h
  };
}

function drawFallbackArt(rect){
  const { ctx, state: card } = DRAW;
  const gradient = ctx.createRadialGradient(rect.x + rect.w / 2, rect.y + rect.h / 2, 10, rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) / 1.3);
  gradient.addColorStop(0, card.visual.accent1);
  gradient.addColorStop(1, card.visual.bg2);
  ctx.fillStyle = gradient;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = .42;
  ctx.fillStyle = card.visual.accent2;
  ctx.font = `900 ${Math.min(rect.w, rect.h) / 3}px Orbitron`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.visual.fallbackGlyph, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function drawWatermark(w, h){
  const { ctx, state: card } = DRAW;
  if(!card.layout.showWatermark) return;
  ctx.save();
  ctx.globalAlpha = .13;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-.35);
  ctx.font = `900 ${w / 7}px Orbitron`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = card.visual.accent1;
  ctx.fillText(card.visual.watermark, 0, 0);
  ctx.restore();
}

function drawWrapped(text, rect, key, px, lineH = 1.18){
  const { ctx } = DRAW;
  ctx.save();
  setFont(key, px);
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if(measureTrackedText(test, key, px) > rect.w && line){
      lines.push(line);
      line = word;
    }else{
      line = test;
    }
  });
  if(line) lines.push(line);
  const lineHeight = px * lineH;
  const align = DRAW.state.typography[key].align || DRAW.state.layout.globalAlign || 'left';
  ctx.textAlign = align;
  let y = rect.y;
  for(const currentLine of lines){
    if(y + lineHeight > rect.y + rect.h) break;
    drawTrackedText(currentLine, alignX(rect, align), y, key, px);
    y += lineHeight;
  }
  ctx.restore();
}

function drawResources(rect){
  const { ctx, state: card } = DRAW;
  const enabled = card.system.resources.filter(resource => resource.enabled);
  if(!enabled.length) return;
  const gap = 6;
  const size = Math.min(rect.h * .42, rect.w / (enabled.length + 1));
  let x = rect.x + 8;
  enabled.forEach(resource => {
    ctx.fillStyle = resource.color;
    ctx.beginPath();
    ctx.arc(x + size / 2, rect.y + rect.h - size / 2 - 4, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#07111b';
    ctx.font = `900 ${size * .55}px Orbitron`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(resource.symbol, x + size / 2, rect.y + rect.h - size / 2 - 4);
    x += size + gap;
  });
}

function drawCost(rect){
  const { ctx, state: card } = DRAW;
  if(!card.layout.showCost) return;
  panel(rect, .86, card.visual.frameStyle === 'tech' ? 'cut' : 'default');
  ctx.fillStyle = card.visual.textColor;
  ctx.font = `900 ${rect.h * .36}px Orbitron`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const value = card.system.genericCost || card.system.resources.filter(resource => resource.enabled).map(resource => resource.symbol).join('');
  ctx.fillText(value, rect.x + rect.w / 2, rect.y + rect.h * .42);
  ctx.font = `700 ${rect.h * .13}px Rajdhani`;
  ctx.fillText(card.system.costLabel, rect.x + rect.w / 2, rect.y + rect.h * .76);
}

function drawStats(w, h){
  const { ctx, state: card } = DRAW;
  if(!card.layout.showStats) return;
  const stats = card.system.stats.filter(stat => stat.enabled);
  if(!stats.length) return;
  const y = card.visual.frameStyle === 'minimal' ? h * .79 : h * .84;
  const spacing = w / (stats.length + 1);
  stats.forEach((stat, index) => {
    const x = spacing * (index + 1);
    const radius = w * .047;
    ctx.fillStyle = card.visual.panelColor;
    ctx.globalAlpha = .9;
    ctx.beginPath();
    if(card.visual.frameStyle === 'industrial' || card.visual.frameStyle === 'hazard') ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
    else ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = card.visual.accent2;
    ctx.stroke();
    setFont('stats', w * card.typography.stats.size / 100);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawTrackedText(stat.value, x, y - radius * .2, 'stats', w * card.typography.stats.size / 100);
    ctx.font = `700 ${Math.max(8, w * .018)}px ${card.typography.stats.font}`;
    ctx.fillText(stat.label, x, y + radius * 1.2);
  });
}

function drawGuides(w, h){
  const { ctx } = DRAW;
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = 'rgba(255,255,255,.65)';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * .035, h * .035, w * .93, h * .93);
  ctx.strokeStyle = 'rgba(255,210,80,.8)';
  ctx.strokeRect(w * .07, h * .07, w * .86, h * .86);
  ctx.restore();
}

function splitIntelRects(w, h){
  return {
    art: { x: 0, y: 0, w: w * .52, h },
    title: { x: w * .55, y: h * .06, w: w * .40, h: h * .13 },
    type: { x: w * .55, y: h * .23, w: w * .40, h: h * .065 },
    rules: { x: w * .55, y: h * .32, w: w * .40, h: h * .44 },
    footer: { x: w * .55, y: h * .88, w: w * .40, h: h * .07 },
    cost: { x: w * .84, y: h * .06, w: w * .11, h: h * .12 }
  };
}

function layoutRects(w, h, card){
  if(card.layout.preset === 'split') return splitIntelRects(w, h);
  return rectFromGeom(w, h, card);
}

function panelVariant(card){
  if(card.visual.frameStyle === 'tech' || card.layout.preset === 'split') return 'cut';
  if(card.visual.frameStyle === 'industrial' || card.visual.frameStyle === 'hazard' || card.visual.frameStyle === 'propaganda') return 'slant';
  return 'default';
}

function drawTitle(rect){
  const card = DRAW.state;
  const title = textValue('title', card.content.name, card);
  const subtitle = textValue('subtitle', card.content.subtitle, card);
  const align = card.typography.title.align || card.layout.globalAlign;
  const titleSize = Math.min(rect.h * .56, rect.w * card.typography.title.size / 100);
  const px = fitLine(title, { ...rect, w: rect.w - 20 }, 'title', titleSize, 10);
  setFont('title', px);
  DRAW.ctx.textAlign = align;
  drawTrackedText(title, alignX(rect, align, 12), rect.y + rect.h * .13, 'title', px);
  const subAlign = card.typography.subtitle.align || card.layout.globalAlign;
  const subPx = Math.max(8, rect.w * card.typography.subtitle.size / 100);
  setFont('subtitle', subPx);
  DRAW.ctx.textAlign = subAlign;
  drawTrackedText(subtitle, alignX(rect, subAlign, 12), rect.y + rect.h * .66, 'subtitle', subPx);
}

function drawType(rect){
  const card = DRAW.state;
  const text = textValue('type', card.content.typeLine, card);
  const align = card.typography.type.align || card.layout.globalAlign;
  const px = fitLine(text, { ...rect, w: rect.w - 20 }, 'type', Math.max(9, rect.w * card.typography.type.size / 100), 8);
  setFont('type', px);
  DRAW.ctx.textAlign = align;
  drawTrackedText(text, alignX(rect, align, 10), rect.y + rect.h * .22, 'type', px);
}

function drawRules(rect){
  const card = DRAW.state;
  drawWrapped(textValue('rules', card.content.rules, card), {
    x: rect.x + 14,
    y: rect.y + 14,
    w: rect.w - 28,
    h: rect.h * .62
  }, 'rules', Math.max(9, rect.w * card.typography.rules.size / 100));
  drawWrapped(textValue('flavor', card.content.flavor, card), {
    x: rect.x + 14,
    y: rect.y + rect.h * .70,
    w: rect.w - 28,
    h: rect.h * .24
  }, 'flavor', Math.max(8, rect.w * card.typography.flavor.size / 100));
}

function renderCardToContext(targetCtx, card, image, options = {}){
  const [w, h] = getDimensions(card);
  DRAW.ctx = targetCtx;
  DRAW.state = card;
  DRAW.image = image;
  DRAW.scale = options.scale || 1;
  DRAW.transparent = Boolean(options.transparent);
  DRAW.guides = Boolean(options.guides);
  targetCtx.setTransform(DRAW.scale, 0, 0, DRAW.scale, 0, 0);
  drawBackground(w, h);
  const rects = layoutRects(w, h, card);
  const artRect = card.layout.fullArt ? pctRect(null, w, h, 0, 0, 100, 100) : rects.art;
  drawArt(artRect);
  drawFrame(w, h, rects);
  drawWatermark(w, h);
  if(!card.layout.fullArt && card.layout.preset !== 'split'){
    targetCtx.strokeStyle = card.visual.accent1;
    targetCtx.strokeRect(rects.art.x, rects.art.y, rects.art.w, rects.art.h);
  }
  const variant = panelVariant(card);
  if(card.layout.showTitlePanel) panel(rects.title, .82, variant);
  drawTitle(rects.title);
  drawCost(rects.cost);
  if(card.layout.showTypePanel) panel(rects.type, .78, variant);
  drawType(rects.type);
  if(card.layout.showRulesPanel && rects.rules.h > 0){
    panel(rects.rules, .82, variant);
    drawRules(rects.rules);
  }
  if(card.layout.showFooter) panel(rects.footer, .62, variant);
  drawResources(rects.footer);
  if(card.layout.showFooter){
    setFont('footer', Math.max(7, rects.footer.w * card.typography.footer.size / 100));
    const footerText = `${card.meta.setCode} ${card.meta.collectorNumber} · ${card.meta.rarity} · ${card.meta.archiveCode} · ${card.meta.footer}`;
    const align = card.typography.footer.align || card.layout.globalAlign;
    targetCtx.textAlign = align;
    drawTrackedText(footerText, alignX(rects.footer, align, 10), rects.footer.y + rects.footer.h * .32, 'footer', Math.max(7, rects.footer.w * card.typography.footer.size / 100));
  }
  drawStats(w, h);
  if(options.guides) drawGuides(w, h);
}

function renderPreview(){
  const [w, h] = getDimensions(state);
  canvas.width = w;
  canvas.height = h;
  $('#canvasDimensions').textContent = `${w}×${h}`;
  renderCardToContext(ctx, state, artImage, {
    scale: 1,
    transparent: false,
    guides: Boolean($('#previewGuides')?.checked)
  });
  updateZoom();
}

function updateZoom(){
  const wrap = $('#canvasWrap');
  if(!wrap) return;
  if(previewMode === 'fit'){
    const scroller = $('#canvasScroller');
    const sx = (scroller.clientWidth - 60) / canvas.width;
    const sy = (scroller.clientHeight - 60) / canvas.height;
    wrap.style.transform = `scale(${Math.min(1, sx, sy)})`;
  }else{
    wrap.style.transform = `scale(${Number(previewMode) / 100})`;
  }
}

function loadImageFromSrc(src){
  return new Promise(resolve => {
    if(!src){
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function loadArt(){
  artImage = null;
  if(!state.art.src){
    scheduleRender();
    return;
  }
  loadImageFromSrc(state.art.src).then(image => {
    artImage = image;
    if(!image) toast('Artwork non caricabile: verrà usato lo sfondo fallback.', 'error');
    scheduleRender();
  }).catch(error => toast(error.message, 'error'));
}
