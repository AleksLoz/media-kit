/* ══ CURSOR ══ */
const cur=document.getElementById('cur'),ring=document.getElementById('cur-r');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px';});
(function loop(){rx+=(mx-rx)*.11;ry+=(my-ry)*.11;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop);})();
document.querySelectorAll('a,button,.pkg,.plat,.vid-card,.polaroid,.pie-card').forEach(el=>{
  el.addEventListener('mouseenter',()=>document.body.classList.add('hov'));
  el.addEventListener('mouseleave',()=>document.body.classList.remove('hov'));
});

/* ══ NAV ══ */
window.addEventListener('scroll',()=>document.getElementById('nav').classList.toggle('sc',window.scrollY>36));

/* ══ SCROLL REVEAL ══ */
const revObs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting)x.target.classList.add('on');});},{threshold:0.1});
document.querySelectorAll('.rv').forEach(el=>revObs.observe(el));

/* ══ COUNT UP (stats bar) ══ */
const cObs=new IntersectionObserver(e=>{
  e.forEach(x=>{
    if(!x.isIntersecting)return;cObs.unobserve(x.target);
    x.target.querySelectorAll('[data-count]').forEach(n=>{
      const t=parseFloat(n.dataset.count),s=n.dataset.sfx||'',dec=t%1!==0;
      let v=0,step=t/48;
      const id=setInterval(()=>{v+=step;if(v>=t){v=t;clearInterval(id);}n.textContent=(dec?v.toFixed(1):Math.floor(v))+s;},25);
    });
  });
},{threshold:0.6});
document.querySelectorAll('.stats-bar').forEach(el=>cObs.observe(el));

/* ══ PIE CHARTS ══ */
const RUST='#7A2020',RUST2='#9B3A2A',RUST3='#B55A3A',SAND='#C8A882',TAN='#B89A7A',LIGHT='#DDD5C8';
const charts=[
  {id:'pie1',tt:'tt1',data:[
    {label:'Denmark 🇩🇰',pct:23,color:RUST},
    {label:'Germany 🇩🇪',pct:10.4,color:RUST2},
    {label:'Sweden 🇸🇪',pct:6.9,color:RUST3},
    {label:'United States 🇺🇸',pct:6.9,color:SAND},
    {label:'Netherlands 🇳🇱',pct:6.0,color:TAN},
    {label:'United Kingdom 🇬🇧',pct:5,color:'#C4855A'},
    {label:'Other',pct:41.8,color:LIGHT},
  ]},
  {id:'pie2',tt:'tt2',data:[
    {label:'18–24',pct:14,color:RUST},
    {label:'25–34',pct:38,color:RUST2},
    {label:'35–44',pct:28,color:RUST3},
    {label:'45–54',pct:13,color:SAND},
    {label:'55+',pct:7,color:LIGHT},
  ]}
];
charts.forEach(cfg=>{
  const canvas=document.getElementById(cfg.id),tt=document.getElementById(cfg.tt),leg=document.getElementById('leg'+cfg.id.slice(-1));
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,cx=W/2,cy=H/2,R=W/2-6,IR=W/2-22;
  let progress=0,done=false,hovIdx=-1;
  leg.innerHTML='';
  cfg.data.forEach((d,i)=>{
    const item=document.createElement('div');item.className='leg-item';
    item.innerHTML=`<div class="leg-dot" style="background:${d.color}"></div><span class="leg-label">${d.label}</span><span class="leg-pct">${d.pct}%</span>`;
    item.addEventListener('mouseenter',()=>{hovIdx=i;draw(1);});item.addEventListener('mouseleave',()=>{hovIdx=-1;draw(1);});
    leg.appendChild(item);
  });
  function draw(prog){
    ctx.clearRect(0,0,W,H);let angle=-Math.PI/2;
    const total=cfg.data.reduce((s,d)=>s+d.pct,0);
    cfg.data.forEach((d,i)=>{
      const slice=(d.pct/total)*Math.PI*2*prog,bump=hovIdx===i?4:0,midA=angle+slice/2;
      ctx.save();ctx.translate(Math.cos(midA)*bump,Math.sin(midA)*bump);
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,angle,angle+slice);ctx.closePath();ctx.fillStyle=d.color;ctx.fill();ctx.restore();angle+=slice;
    });
    ctx.beginPath();ctx.arc(cx,cy,IR-1,0,Math.PI*2);ctx.fillStyle='#FAF7F2';ctx.fill();
    if(hovIdx>=0&&prog===1){const d=cfg.data[hovIdx];ctx.fillStyle=RUST;ctx.font=`700 17px 'Playfair Display',serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(d.pct+'%',cx,cy);}
  }
  new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting&&!done){done=true;const id=setInterval(()=>{progress+=0.03;if(progress>=1){progress=1;clearInterval(id);}draw(progress);},16);}});},{threshold:0.3}).observe(canvas);
  canvas.addEventListener('mousemove',e=>{
    const r=canvas.getBoundingClientRect(),x=e.clientX-r.left-cx,y=e.clientY-r.top-cy,dist=Math.sqrt(x*x+y*y);
    if(dist<IR||dist>R){hovIdx=-1;tt.style.opacity=0;draw(1);return;}
    let ang=Math.atan2(y,x)+Math.PI/2;if(ang<0)ang+=Math.PI*2;
    const total=cfg.data.reduce((s,d)=>s+d.pct,0);let a=0,found=-1;
    cfg.data.forEach((d,i)=>{const s=(d.pct/total)*Math.PI*2;if(ang>=a&&ang<a+s)found=i;a+=s;});
    hovIdx=found;
    if(found>=0){const d=cfg.data[found];tt.textContent=`${d.label}: ${d.pct}%`;tt.style.opacity=1;tt.style.left=(e.clientX-r.left+10)+'px';tt.style.top=(e.clientY-r.top-28)+'px';}
    else tt.style.opacity=0;
    draw(1);
  });
  canvas.addEventListener('mouseleave',()=>{hovIdx=-1;tt.style.opacity=0;draw(1);});
});

/* ══════════════════════════════════════
   VIDEO — scroll autoplay (muted, no sound)
══════════════════════════════════════ */
let _vidReady=false;setTimeout(()=>{_vidReady=true;},1500);
const videoObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    const v=e.target;
    if(e.isIntersecting){v.play().catch(()=>{});}
    else if(_vidReady){v.pause();}
  });
},{threshold:0.1});

function observeVideo(v){
  v.setAttribute('muted','');v.setAttribute('playsinline','');
  v.muted=true;v.loop=true;v.playsInline=true;
  videoObs.observe(v);
}
// observe any videos already on page
document.querySelectorAll('video').forEach(observeVideo);

/* ══════════════════════════════════════
   EDITOR
══════════════════════════════════════ */
let editMode=false;

// elements to make editable — broad selector covering all visible text
const EDITABLE_SEL=[
  'h1','h2','h3','h4',
  '.hero-badge','.hero-pill','.h-sub-l','.h-sub-r','.h-stat-n','.h-stat-l',
  '.hs-n','.hs-l',
  '.s-hand','.s-head','.s-body p',
  '.s-eyebrow','.s-title','.s-title em',
  '.pie-card-title','.pie-card-sub',
  '.niche-eyebrow','.niche-title','.niche-title em',
  '.bq-t','.bq-a',
  '.vid-desc','.vid-views',
  '.plat-n','.plat-h','.plat-num','.plat-sub',
  '.sc-n','.sc-l','.stat-card .sc-n','.stat-card .sc-l',
  '.pkg-tag','.pkg-name','.pkg-price','.pkg-ideal','.li-text',
  '.utype','.usub','.uprice',
  '.c-hand','.c-title','.c-sub','.c-btn','.handle span',
  'footer p',
].join(',');

function toggleEdit(){
  if(!editMode){
    // show login overlay instead of prompt
    const ov=document.getElementById('login-overlay');
    ov.style.display='flex';
    setTimeout(()=>document.getElementById('login-pw').focus(),80);
    return;
  }
  // already in edit mode → exit
  editMode=false;
  document.body.classList.toggle('edit-on',false);

  document.querySelectorAll(EDITABLE_SEL).forEach(el=>{
    el.contentEditable=editMode?'true':'false';
    // prevent link navigation while editing
    if(el.closest('a')) el.closest('a').style.pointerEvents=editMode?'none':'';
  });
  // also make hero h1 directly editable (strip anim wrappers for edit)
  const h1=document.getElementById('hero-h1');
  if(editMode){
    h1.classList.remove('animate');
    h1.contentEditable='true';
  } else {
    h1.contentEditable='false';
  }
}

function doLogin(){
  const pw=document.getElementById('login-pw').value;
  const err=document.getElementById('login-err');
  if(pw!=='byggeligt2024'){
    err.textContent='Incorrect password. Try again.';
    document.getElementById('login-pw').value='';
    document.getElementById('login-pw').focus();
    return;
  }
  closeLogin();
  // activate edit mode
  editMode=true;
  document.body.classList.add('edit-on');
  document.querySelectorAll(EDITABLE_SEL).forEach(el=>{
    el.contentEditable='true';
    if(el.closest('a')) el.closest('a').style.pointerEvents='none';
  });
  const h1=document.getElementById('hero-h1');
  h1.classList.remove('animate');
  h1.contentEditable='true';
}
function closeLogin(){
  const ov=document.getElementById('login-overlay');
  ov.style.display='none';
  document.getElementById('login-pw').value='';
  document.getElementById('login-err').textContent='';
}

function hideEl(id){
  document.getElementById(id).style.display='none';
}

/* ── Editable links ── */
document.querySelectorAll('.editable-link').forEach(a=>{
  a.addEventListener('click',function(e){
    if(!editMode)return;
    e.preventDefault();
    const cur=this.href||'';
    const url=prompt('Edit link URL:',cur);
    if(url!==null&&url.trim()!=='')this.href=url.trim();
  });
});

/* ── Photo upload ── */
let _photoCb=null;
document.getElementById('photo-input').addEventListener('change',function(){
  if(!this.files[0]||!_photoCb)return;
  const reader=new FileReader();
  reader.onload=e=>_photoCb(e.target.result);
  reader.readAsDataURL(this.files[0]);
  this.value='';
});
function uploadPhoto(imgId,phId){
  if(!editMode)return;
  _photoCb=src=>{
    const img=document.getElementById(imgId);
    const ph=document.getElementById(phId);
    img.src=src;img.style.display='block';
    if(ph)ph.style.display='none';
  };
  document.getElementById('photo-input').click();
}



/* ── Video upload ── */
let _vidTarget=null;
// Sequential GitHub upload queue — ensures each video's git commit lands before the next starts
let _uploadChain=Promise.resolve();
document.getElementById('video-input').addEventListener('change',function(){
  if(!this.files[0]||!_vidTarget)return;
  const file=this.files[0];
  const target=_vidTarget;
  const overlay=target.querySelector('.vid-upload-overlay');
  const placeholder=target.querySelector('.vid-placeholder');
  this.value='';_vidTarget=null;

  // Show immediately via blob URL
  const blobUrl=URL.createObjectURL(file);
  const vid=document.createElement('video');
  vid.src=blobUrl;
  vid.muted=true;vid.loop=true;vid.playsInline=true;
  vid.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0';
  const wrap=document.createElement('div');
  wrap.className='vid-preview vid-blob';
  wrap.style.cssText='width:100%;aspect-ratio:9/16;position:relative;overflow:hidden;border-radius:10px 10px 0 0;background:#000;';
  wrap.appendChild(vid);
  const removeBtn=document.createElement('button');
  removeBtn.className='vid-remove-btn';
  removeBtn.textContent='✕ Remove';
  wrap.appendChild(removeBtn);
  removeBtn.onclick=function(e){
    e.stopPropagation();
    wrap.remove();
    delete target.dataset.src;
    if(overlay)overlay.style.display='';
    if(placeholder){placeholder.style.display='';placeholder.style.removeProperty('display');}
    const ph=target.querySelector('.vid-placeholder');
    if(ph)ph.style.display='';
  };
  const oldPrev=target.querySelector('.vid-preview');
  if(oldPrev)oldPrev.remove();
  if(placeholder)placeholder.style.display='none';
  if(overlay)overlay.style.display='none';
  target.insertBefore(wrap,placeholder||target.firstChild);
  observeVideo(vid);

  // Upload sequentially — each upload+save waits for the previous to finish.
  // The file streams DIRECTLY from the browser to Vercel Blob storage (no
  // base64, no serverless body limit), then we record the returned URL in
  // data-src and persist index.html.
  const ext=file.name.split('.').pop()||'mp4';
  const pathname='video_'+Date.now()+'.'+ext;
  _uploadChain=_uploadChain.then(async()=>{
    try{
      if(typeof window.vercelBlobUpload!=='function'){
        throw new Error('Uploader still loading — try again in a moment.');
      }
      const blob=await window.vercelBlobUpload(pathname,file,{
        access:'public',
        handleUploadUrl:'/api/upload-video',
        contentType:file.type||'video/mp4',
      });
      wrap.classList.remove('vid-blob');
      target.dataset.src=blob.url;
      await saveHTMLCore();
    }catch(err){
      console.warn('Upload or save failed:',err);
      // Surface the failure instead of silently dropping the video
      wrap.remove();
      delete target.dataset.src;
      if(overlay)overlay.style.display='';
      if(placeholder){placeholder.style.display='';placeholder.style.removeProperty('display');}
      const ph=target.querySelector('.vid-placeholder');
      if(ph)ph.style.display='';
      alert('Video upload failed: '+((err&&err.message)?err.message:err));
    }
  });
});
function uploadVideo(overlayBtn){
  if(!editMode)return;
  _vidTarget=overlayBtn.closest('.vid-card');
  document.getElementById('video-input').click();
}

/* ── Add list item ── */
function addListItem(btn){
  const ul=btn.previousElementSibling;
  if(!ul||ul.tagName!=='UL')return;
  const li=document.createElement('li');
  li.innerHTML=`<span class="pkg-ck">✓</span><span class="li-text" contenteditable="true">New item</span><button class="li-del" onclick="this.closest('li').remove()">×</button>`;
  ul.appendChild(li);
  // focus new item
  const span=li.querySelector('.li-text');
  span.focus();
  // select all text
  const range=document.createRange();range.selectNodeContents(span);
  const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
}

/* ── Collab form ── */
function step(id,dir){
  const el=document.getElementById(id);
  let v=parseInt(el.textContent)||0;
  v=Math.max(0,v+dir);
  el.textContent=v;
}
function stepBy(id,by,dir){
  const el=document.getElementById(id);
  let v=parseInt(el.textContent)||0;
  v=Math.max(0,v+(by*dir));
  el.textContent=v;
}
function selectUR(btn){
  document.querySelectorAll('#ur-group .ur-pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}
/* ── Video URL / preview ── */
function getGDriveId(url){
  // Handles: /file/d/ID/view, /file/d/ID/edit, open?id=ID, uc?id=ID
  const m=url.match(/\/file\/d\/([^\/\?&]+)/)||url.match(/[?&]id=([^&]+)/);
  return m?m[1]:null;
}

function normalizeVideoUrl(url){
  // Dropbox: make it a direct streaming link
  if(url.includes('dropbox.com')){
    url=url.replace('www.dropbox.com','dl.dropboxusercontent.com')
           .replace(/[?&]dl=\d/,'');
    if(!url.includes('dl.dropboxusercontent.com'))
      url=url.replace('dropbox.com','dl.dropboxusercontent.com');
  }
  return url;
}

function isVideoUrl(url){
  return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url) ||
         url.includes('dropbox.com') ||
         url.includes('dl.dropboxusercontent.com') ||
         url.includes('cloudinary.com') ||
         url.includes('amazonaws.com') ||
         url.includes('bunnycdn.com');
}

function setVidLink(btn){
  if(!editMode)return;
  const card=btn.closest('.vid-card');
  const current=card.dataset.href||'';
  const url=prompt('Paste a video link — Google Drive, Dropbox, or any direct .mp4 URL:',current);
  if(url===null)return;
  if(!url.trim()){
    card.removeAttribute('data-href');
    card.classList.remove('has-link');
    const prev=card.querySelector('.vid-preview');
    if(prev)prev.remove();
    const ph=card.querySelector('.vid-placeholder');
    if(ph)ph.style.display='';
    return;
  }
  card.dataset.href=url.trim();
  card.classList.add('has-link');
  applyVidPreview(card,url.trim());
}

function applyVidPreview(card,url){
  const old=card.querySelector('.vid-preview');
  if(old)old.remove();
  const ph=card.querySelector('.vid-placeholder');

  const wrapper=document.createElement('div');
  wrapper.className='vid-preview';
  wrapper.style.cssText='width:100%;aspect-ratio:9/16;position:relative;overflow:hidden;border-radius:10px 10px 0 0;background:#000;';

  const gdId=getGDriveId(url);

  if(gdId){
    // Google Drive — use the preview iframe which streams the video
    // Use direct streaming URL — gives us a clean <video> element (no controls, covers card)
    // confirm=t bypasses Google's virus-scan warning page for larger files
    const vid=document.createElement('video');
    vid.src=`https://drive.google.com/uc?export=download&id=${gdId}&confirm=t`;
    vid.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
    wrapper.appendChild(vid);
    observeVideo(vid); // muted + loop + plays on scroll via IntersectionObserver
  } else if(isVideoUrl(url)){
    // Direct video URL — autoplay muted loop via IntersectionObserver
    const vid=document.createElement('video');
    vid.src=normalizeVideoUrl(url);
    vid.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
    wrapper.appendChild(vid);
    observeVideo(vid);
  } else {
    wrapper.style.background='linear-gradient(135deg,#1A0F0A,#3A2010)';
    const fb=document.createElement('div');
    fb.style.cssText='position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:8px;';
    fb.innerHTML='<div style="font-size:32px;opacity:.3">▶</div><div style="font-size:9px;letter-spacing:.12em;text-transform:uppercase;opacity:.4;font-family:var(--sans)">Paste a video URL</div>';
    wrapper.appendChild(fb);
  }

  // No edit/change/delete controls on video previews — videos are locked once set

  if(ph)ph.style.display='none';
  card.insertBefore(wrapper,ph||card.firstChild);
}

// On page load, restore previews for cards that have data-href
(function(){
  document.querySelectorAll('.vid-card[data-href]').forEach(card=>{
    applyVidPreview(card,card.dataset.href);
    card.classList.add('has-link');
  });
  // Restore permanently uploaded videos (data-src = GitHub URL)
  document.querySelectorAll('.vid-card[data-src]').forEach(card=>{
    const ph=card.querySelector('.vid-placeholder');
    const vid=document.createElement('video');
    vid.setAttribute('muted','');vid.setAttribute('autoplay','');vid.setAttribute('playsinline','');vid.setAttribute('loop','');
    vid.muted=true;vid.loop=true;vid.playsInline=true;vid.autoplay=true;
    vid.preload='auto';
    vid.src=card.dataset.src;
    vid.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0';
    const wrap=document.createElement('div');
    wrap.className='vid-preview';
    wrap.style.cssText='width:100%;aspect-ratio:9/16;position:relative;overflow:hidden;border-radius:10px 10px 0 0;background:#000;';
    wrap.appendChild(vid);
    // Edit-mode remove button
    const removeBtn=document.createElement('button');
    removeBtn.className='vid-remove-btn';
    removeBtn.textContent='✕ Remove';
    wrap.appendChild(removeBtn);
    removeBtn.onclick=function(e){
      e.stopPropagation();
      wrap.remove();
      delete card.dataset.src;
      const ov=card.querySelector('.vid-upload-overlay');
      if(ov)ov.style.display='';
      const ph2=card.querySelector('.vid-placeholder');
      if(ph2)ph2.style.display='';
    };
    if(ph)ph.style.display='none';
    card.insertBefore(wrap,ph||card.firstChild);
    observeVideo(vid);
    vid.load();
    vid.addEventListener('canplay',()=>vid.play().catch(()=>{}),{once:true});
  });
  // Video cards do NOT open links on click — videos just play silently
})();

// Strip transient runtime state from a cloned <html> before persisting, so the
// editor never bakes live UI state into the saved file. Without this, an
// auto-save can capture: the custom cursor's coordinates, scroll-reveal ".on"
// classes, the scrolled-nav ".sc" class, a mid-save "Saving…" button, a dropped
// hero animation, and session-only blob video previews.
function sanitizeClone(clone){
  const body=clone.querySelector('body');
  if(body)body.classList.remove('edit-on','hov');
  // custom cursor — drop baked-in x/y coordinates
  clone.querySelectorAll('#cur,#cur-r').forEach(el=>el.removeAttribute('style'));
  // scrolled-nav state (re-added on scroll)
  clone.querySelectorAll('nav.sc').forEach(n=>n.classList.remove('sc'));
  // scroll-reveal state (re-added by the IntersectionObserver on load)
  clone.querySelectorAll('.rv.on').forEach(el=>el.classList.remove('on'));
  // preserve the hero load animation (edit mode strips it)
  const h1=clone.querySelector('#hero-h1');
  if(h1)h1.classList.add('animate');
  // reset the editor save button if it was mid-save when cloned
  clone.querySelectorAll('.et-save').forEach(b=>{b.textContent='Save changes';b.removeAttribute('disabled');b.style.removeProperty('min-width');});
  // editing affordances
  clone.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
  clone.querySelectorAll('a[style]').forEach(a=>a.style.removeProperty('pointer-events'));
  // session-only video previews (blob/data URLs) — restore placeholders
  clone.querySelectorAll('.vid-preview.vid-blob').forEach(wrap=>wrap.remove());
  clone.querySelectorAll('video').forEach(vid=>{
    if(vid.src&&(vid.src.startsWith('data:')||vid.src.startsWith('blob:'))){
      const p=document.createElement('div');p.className='vid-placeholder';p.innerHTML='<div class="vid-icon">▶</div><div class="vid-hint">Reel / TikTok</div>';vid.replaceWith(p);
    }
  });
  clone.querySelectorAll('.vid-preview').forEach(prev=>prev.remove());
  clone.querySelectorAll('.vid-placeholder').forEach(ph=>{ph.style.display='';});
  return clone;
}

// Headless save — no UI button dependency, safe to call from upload chain
async function saveHTMLCore(){
  const clone=sanitizeClone(document.documentElement.cloneNode(true));
  const html='<!DOCTYPE html>\n'+clone.outerHTML;
  const res=await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:html})});
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error||'Save failed');}
}

async function saveHTML(){
  const btn=document.querySelector('.et-save');
  const orig=btn?btn.textContent:'';
  if(btn){btn.textContent='Saving…';btn.disabled=true;}
  const reset=btn?setTimeout(()=>{btn.textContent=orig;btn.style.minWidth='';btn.disabled=false;},20000):null;
  const clone=sanitizeClone(document.documentElement.cloneNode(true));
  const html='<!DOCTYPE html>\n'+clone.outerHTML;
  try{
    const res=await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:html})});
    if(reset)clearTimeout(reset);
    if(res.ok){if(btn){btn.textContent='✓ Saved — deploying…';setTimeout(()=>{btn.textContent=orig;btn.disabled=false;},5000);}}
    else{let msg='Error';try{const e=await res.json();msg=e.error||'Error';}catch(_){}if(btn){btn.textContent='✗ '+msg;btn.style.minWidth='300px';setTimeout(()=>{btn.textContent=orig;btn.style.minWidth='';btn.disabled=false;},8000);}}
  }catch(e){if(reset)clearTimeout(reset);if(btn){btn.textContent='✗ '+e.message;btn.style.minWidth='300px';setTimeout(()=>{btn.textContent=orig;btn.style.minWidth='';btn.disabled=false;},8000);}}
}
function switchTab(name,btn){
  document.querySelectorAll('.cf-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.cf-panel').forEach(p=>{p.style.display='none';});
  if(btn)btn.classList.add('active');
  const panel=document.getElementById('panel-'+name);
  if(panel)panel.style.display='';
}

function prepareCollab(e){
  if(e)e.preventDefault();
  document.getElementById('h-reels').value=document.getElementById('f-reels').textContent;
  document.getElementById('h-stories').value=document.getElementById('f-stories').textContent;
  document.getElementById('h-pics').value=document.getElementById('f-pics').textContent;
  const ur=document.querySelector('#ur-group .ur-pill.active');
  document.getElementById('h-usage').value=ur?ur.dataset.val:'None';
  const reshare=[];
  ['f-tiktok','f-youtube','f-pinterest','f-facebook'].forEach(id=>{
    const el=document.getElementById(id);
    if(el&&el.checked)reshare.push(id.replace('f-','').replace(/^\w/,c=>c.toUpperCase()));
  });
  document.getElementById('h-reshare').value=reshare.length?reshare.join(', '):'None';
  document.getElementById('h-email-val').value=document.getElementById('f-email').value;
  document.getElementById('h-msg-val').value=document.getElementById('f-msg').value;
  submitForm(document.getElementById('collab-form'));
  return false;
}
function prepareUGC(e){
  if(e)e.preventDefault();
  document.getElementById('h-uvideos').value=document.getElementById('u-videos').textContent;
  document.getElementById('h-upics').value=document.getElementById('u-pics').textContent;
  const ur=document.querySelector('#ur-group-ugc .ur-pill.active');
  document.getElementById('h-uusage').value=ur?ur.dataset.val:'None';
  document.getElementById('h-uemail-val').value=document.getElementById('u-email').value;
  document.getElementById('h-umsg-val').value=document.getElementById('u-msg').value;
  submitForm(document.getElementById('ugc-form'));
  return false;
}

// Submit a Formspree form via AJAX, then send the visitor to the thank-you page.
// AJAX (rather than a native POST) keeps the success flow on our own domain.
async function submitForm(form){
  if(!form)return;
  const btn=form.querySelector('.cf-submit');
  const orig=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='Sending…';}
  try{
    const res=await fetch(form.action,{
      method:'POST',
      body:new FormData(form),
      headers:{'Accept':'application/json'}
    });
    if(res.ok){
      window.location.href='/thank-you.html';
      return;
    }
    const data=await res.json().catch(()=>({}));
    const msg=(data.errors&&data.errors.map(x=>x.message).join(', '))
      ||'Something went wrong sending your inquiry. Please email contact@byggeligt.com directly.';
    if(btn){btn.disabled=false;btn.textContent=orig;}
    alert(msg);
  }catch(err){
    if(btn){btn.disabled=false;btn.textContent=orig;}
    alert('Network error — please email contact@byggeligt.com directly.');
  }
}

