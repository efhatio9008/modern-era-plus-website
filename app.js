(()=>{'use strict';
  document.documentElement.classList.add('has-js');
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const data = window.MEP_DATA || {assets:{},services:[]};
  const mobileBtn=$('#mobile-toggle'), mobilePanel=$('#mobile-panel');
  if(mobileBtn&&mobilePanel){
    mobileBtn.addEventListener('click',()=>{const open=mobilePanel.hidden;mobilePanel.hidden=!open;mobileBtn.setAttribute('aria-expanded',String(open));mobileBtn.setAttribute('aria-label',open?'Close navigation':'Open navigation');mobileBtn.textContent=open?'×':'☰';});
    mobilePanel.addEventListener('click',e=>{if(e.target.closest('a')){mobilePanel.hidden=true;mobileBtn.setAttribute('aria-expanded','false');mobileBtn.textContent='☰';}});
    document.addEventListener('pointerdown',e=>{
      if(!mobilePanel.hidden&&!mobilePanel.contains(e.target)&&!mobileBtn.contains(e.target)){
        mobilePanel.hidden=true;mobileBtn.setAttribute('aria-expanded','false');mobileBtn.setAttribute('aria-label','Open navigation');mobileBtn.textContent='☰';
      }
    });
  }
  // V1.2.3: Let the page scroll normally when a desktop mouse is over the
  // 3D canvas. OrbitControls otherwise consumes wheel events for zooming,
  // making scrolling appear stuck. Ctrl + wheel still zooms the 3D model;
  // drag-to-rotate and all mobile touch gestures are unchanged.
  const viewerStage=$('#viewer-canvas');
  if(viewerStage){
    const fineDesktop=()=>window.matchMedia('(min-width:901px) and (pointer:fine)').matches;
    viewerStage.addEventListener('wheel',e=>{
      if(fineDesktop()&&!e.ctrlKey)e.stopPropagation();
    },{capture:true,passive:true});
    if(fineDesktop()){
      const hint=$('.viewer-note');
      if(hint)hint.innerHTML='MOVE TO EXPLORE · <strong>DRAG TO ROTATE</strong> · CTRL + SCROLL TO ZOOM';
    }
  }
  const drop=$('#services-drop'),dropBtn=$('#services-toggle');
  if(drop&&dropBtn){
    dropBtn.addEventListener('click',()=>{const open=!drop.classList.contains('open');drop.classList.toggle('open',open);dropBtn.setAttribute('aria-expanded',String(open));});
    document.addEventListener('pointerdown',e=>{if(!drop.contains(e.target)){drop.classList.remove('open');dropBtn.setAttribute('aria-expanded','false');}});
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(mobilePanel&&!mobilePanel.hidden){mobilePanel.hidden=true;mobileBtn?.setAttribute('aria-expanded','false');if(mobileBtn)mobileBtn.textContent='☰';}if(drop){drop.classList.remove('open');dropBtn?.setAttribute('aria-expanded','false');}closeLightbox();}});
  const year=$('#year');if(year)year.textContent=new Date().getFullYear();
  $('#to-top')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
  if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const io=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target);}}},{threshold:.075,rootMargin:'0px 0px 35px 0px'});
    $$('.reveal').forEach(el=>io.observe(el));
  }else{$$('.reveal').forEach(el=>el.classList.add('visible'));}

  // Every image in the source folders is represented by a viewable image in its service/technology/company gallery.
  function imageButton(item,index,title,context){
    const btn=document.createElement('button');btn.type='button';btn.className='gallery-tile';btn.dataset.zoomSrc=item.url;btn.dataset.zoomCaption=title+' — image '+(index+1);btn.dataset.galleryContext=context;btn.setAttribute('aria-label','Open image '+(index+1)+' of '+title);
    if(item.width/item.height>1.8||item.height/item.width>1.7)btn.classList.add('contain');
    const im=document.createElement('img');im.src=item.url;im.alt=title+' — source photograph '+(index+1);im.loading='lazy';im.decoding='async';btn.append(im);return btn;
  }
  $$('[data-gallery-group]').forEach(el=>{
    const key=el.dataset.galleryGroup, arr=data.assets[key]||[], title=el.getAttribute('aria-label')||key;
    const limit=Number(el.dataset.limit)||arr.length;
    arr.slice(0,limit).forEach((item,index)=>el.append(imageButton(item,index,title,key+'-'+el.dataset.limit)));
  });
  const serviceGrid=$('#service-grid');
  if(serviceGrid){
    const filterButtons=$$('[data-service-filter]'), search=$('#service-search'), count=$('#service-count'), moreBtn=$('#service-more');let current='All',expanded=false;
    const render=()=>{
      const q=(search?.value||'').trim().toLowerCase();
      const matches=data.services.filter(s=>(current==='All'||s.group===current)&&(!q||(s.name+' '+s.summary+' '+s.group).toLowerCase().includes(q)));
      // Present a compact overview at first; a search always reveals every matching service.
      const visible=(expanded||q)?matches:matches.slice(0,6);
      serviceGrid.replaceChildren();
      for(const s of visible){
        const card=document.createElement('article');card.className='service-card';
        const a=document.createElement('a');a.href='service.html?service='+encodeURIComponent(s.slug);a.setAttribute('aria-label','View '+s.name);
        const im=document.createElement('img');im.src=s.images[0].url;im.alt=s.name+' photo';im.loading='lazy';im.decoding='async';
        const body=document.createElement('div');body.className='body';
        const idx=document.createElement('span');idx.className='index';idx.textContent=s.group.toUpperCase();
        const h=document.createElement('h3');h.textContent=s.name;
        const p=document.createElement('p');p.textContent=s.summary;
        const foot=document.createElement('div');foot.className='card-foot';
        const n=document.createElement('span');n.textContent=s.images.length+' IMAGES';
        const arr=document.createElement('span');arr.className='arr';arr.textContent='↗';foot.append(n,arr);
        body.append(idx,h,p,foot);a.append(im,body);card.append(a);serviceGrid.append(card);
      }
      if(count)count.textContent=(q||expanded||matches.length<=6?matches.length:visible.length)+' of '+matches.length+' matching categories shown';
      if(moreBtn){
        moreBtn.hidden=!!q||matches.length<=6;
        moreBtn.textContent=expanded?'Show fewer services ↑':'View all '+matches.length+' services ↓';
        moreBtn.setAttribute('aria-expanded',String(expanded));
      }
      if(!matches.length){const info=document.createElement('p');info.textContent='No matching categories. Try another keyword or choose All services.';serviceGrid.append(info);}
    };
    moreBtn?.addEventListener('click',()=>{expanded=!expanded;render();});
    filterButtons.forEach(btn=>btn.addEventListener('click',()=>{current=btn.dataset.serviceFilter;expanded=false;filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));render();}));
    search?.addEventListener('input',render);render();
  }
  if(document.body.dataset.page==='service'){
    const slug=new URLSearchParams(window.location.search).get('service');
    const service=data.services.find(s=>s.slug===slug)||data.services[0];
    if(service){
      document.title=service.name+' | Modern Era Plus Sdn. Bhd.';
      const txt=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
      txt('service-title',service.name);txt('service-intro',service.summary);txt('service-group',service.group.toUpperCase());txt('service-heading',service.name);txt('service-summary',service.summary);txt('service-description',service.detail);txt('service-photo-count',service.images.length+' ORIGINAL PHOTOS');
      const im=$('#service-hero-image');if(im){im.src=service.images[0].url;im.alt=service.name+' project image';}
      const gallery=$('#service-gallery');if(gallery)service.images.forEach((photo,index)=>gallery.append(imageButton(photo,index,service.name,service.slug)));
    }
  }
  // Lightbox: mouse, keyboard and touch-swipe controls.
  const modal=$('#lightbox'),modalImg=$('#lightbox-image'),modalMeta=$('#lightbox-meta');let photos=[],position=0,priorFocus=null,touchStart=null;
  function showPhoto(index){if(!photos.length)return;position=(index+photos.length)%photos.length;const el=photos[position];modalImg.src=el.dataset.zoomSrc;modalImg.alt=el.dataset.zoomCaption||'Project gallery image';modalMeta.textContent=(el.dataset.zoomCaption||'Project photo')+' · '+(position+1)+' / '+photos.length;}
  function openLightbox(btn){if(!modal)return;const context=btn.dataset.galleryContext||'single';photos=$$('[data-zoom-src]').filter(el=>(el.dataset.galleryContext||'single')===context);if(!photos.length)photos=[btn];priorFocus=document.activeElement;modal.hidden=false;document.body.classList.add('modal-open');showPhoto(photos.indexOf(btn));modal.querySelector('.close')?.focus();}
  function closeLightbox(){if(!modal||modal.hidden)return;modal.hidden=true;document.body.classList.remove('modal-open');modalImg.removeAttribute('src');priorFocus?.focus?.();}
  document.addEventListener('click',e=>{const btn=e.target.closest('[data-zoom-src]');if(btn){openLightbox(btn);return;}});
  if(modal){
    modal.querySelector('.close')?.addEventListener('click',closeLightbox);
    modal.querySelector('.prev')?.addEventListener('click',()=>showPhoto(position-1));
    modal.querySelector('.next')?.addEventListener('click',()=>showPhoto(position+1));
    modal.addEventListener('click',e=>{if(e.target===modal)closeLightbox();});
    modal.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0]?.clientX??null;},{passive:true});
    modal.addEventListener('touchend',e=>{if(touchStart==null)return;const diff=(e.changedTouches[0]?.clientX??touchStart)-touchStart;if(Math.abs(diff)>55)showPhoto(position+(diff<0?1:-1));touchStart=null;},{passive:true});
  }
  document.addEventListener('keydown',e=>{if(!modal||modal.hidden)return;if(e.key==='ArrowRight')showPhoto(position+1);if(e.key==='ArrowLeft')showPhoto(position-1);if(e.key==='Tab'){const focusables=[...modal.querySelectorAll('button')];const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
})();
