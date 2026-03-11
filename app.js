// Simple CSV parser that handles quoted fields
function parseCSV(text){
  const rows=[];
  let cur="", row=[], inQuotes=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(inQuotes){
      if(ch==='"'){
        if(text[i+1]==='"'){ cur+='"'; i++; } else { inQuotes=false; }
      } else { cur+=ch; }
    } else {
      if(ch==='"'){ inQuotes=true; }
      else if(ch===','){ row.push(cur); cur=""; }
      else if(ch==='\n' || ch==='\r'){
        if(cur!=="" || row.length>0){ row.push(cur); cur=""; }
        if(row.length>0) { rows.push(row); row=[]; }
        // skip extra \n in CRLF
        if(ch==='\r' && text[i+1]==='\n') i++;
      } else { cur+=ch; }
    }
  }
  if(cur!=="" || row.length>0){ row.push(cur); rows.push(row); }
  return rows;
}

const state={cards:[], idx:0};

function loadFromText(csvText){
  const rows=parseCSV(csvText).filter(r=>r.some(c=>c.trim()!=""));
  if(rows.length===0) return;
  const header=rows[0].map(h=>h.trim().toLowerCase());
  const termIdx=header.indexOf('term')>=0?header.indexOf('term'):0;
  const defIdx=header.indexOf('definition')>=0?header.indexOf('definition'):1;
  const assocIdx=header.indexOf('associations')>=0?header.indexOf('associations'):2;
  const data=rows.slice(1).map(r=>({
    term:(r[termIdx]||'').trim(),
    definition:(r[defIdx]||'').trim(),
    associations:((r[assocIdx]||'').split(/;|,/) .map(s=>s.trim()).filter(Boolean))
  })).filter(c=>c.term||c.definition);
  state.cards=data;
  state.idx=0;
  render();
}

function render(){
  const progress=document.getElementById('progress');
  const cardEl=document.getElementById('card');
  const front=document.getElementById('cardFront');
  const back=document.getElementById('cardBack');
  const assocList=document.getElementById('associationsList');
  if(state.cards.length===0){ front.textContent='No cards loaded. Use the file input or replace cards.csv.'; back.textContent=''; assocList.innerHTML=''; progress.textContent='0/0'; return; }
  const cur=state.cards[state.idx];
  front.textContent=cur.term || '—';
  back.innerHTML=(cur.definition||'—').replace(/\n/g,'<br>');
  assocList.innerHTML='';
  cur.associations.forEach(a=>{ const li=document.createElement('li'); li.textContent=a; assocList.appendChild(li); });
  progress.textContent=`${state.idx+1}/${state.cards.length}`;
  cardEl.classList.remove('is-flipped');
}

function next(){ if(state.cards.length===0) return; state.idx=(state.idx+1)%state.cards.length; render(); }
function prev(){ if(state.cards.length===0) return; state.idx=(state.idx-1+state.cards.length)%state.cards.length; render(); }
function shuffle(){ for(let i=state.cards.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [state.cards[i],state.cards[j]]=[state.cards[j],state.cards[i]];} state.idx=0; render(); }

document.addEventListener('DOMContentLoaded',()=>{
  const shuffleBtn=document.getElementById('shuffleBtn');
  const prevBtn=document.getElementById('prevBtn');
  const nextBtn=document.getElementById('nextBtn');
  const card=document.getElementById('card');
  // No file upload available; load bundled CSV

  shuffleBtn.addEventListener('click',shuffle);
  prevBtn.addEventListener('click',prev);
  nextBtn.addEventListener('click',next);

  card.addEventListener('click',()=> card.classList.toggle('is-flipped'));

  // Load bundled CSV
  fetch('cards.csv').then(r=>{ if(!r.ok) throw new Error('no default'); return r.text(); }).then(txt=>loadFromText(txt)).catch(()=>render());

  // Load palette and render swatches
  function renderPalette(palette){
    const container=document.getElementById('palette');
    const targetSelect=document.getElementById('paletteTarget');
    if(!container) return;
    container.innerHTML='';
    (palette.swatches||[]).forEach(v=>{
      const btn=document.createElement('button');
      btn.className='swatch';
      if(v.trim().startsWith('linear-gradient')) btn.classList.add('gradient');
      btn.style.background=v;
      btn.title=v;
      btn.type='button';
      btn.addEventListener('click',()=>{
        const target=targetSelect?targetSelect.value:'card';
        if(target==='body'){
          document.documentElement.style.setProperty('--bg', v);
          try{ localStorage.setItem('flashcard.palette.body', v); }catch(e){}
        } else {
          document.documentElement.style.setProperty('--card-front', v);
          document.documentElement.style.setProperty('--card-back', v);
          try{ localStorage.setItem('flashcard.palette.card', v); }catch(e){}
        }
      });
      container.appendChild(btn);
    });
  }

  fetch('palette.json').then(r=>{ if(!r.ok) throw new Error('no palette'); return r.json(); }).then(p=>{
    renderPalette(p);
    // apply saved prefs if present
    try{
      const savedBody=localStorage.getItem('flashcard.palette.body');
      const savedCard=localStorage.getItem('flashcard.palette.card');
      if(savedBody) document.documentElement.style.setProperty('--bg', savedBody);
      if(savedCard) { document.documentElement.style.setProperty('--card-front', savedCard); document.documentElement.style.setProperty('--card-back', savedCard); }
    }catch(e){}
  }).catch(()=>{/* no palette available */});
});
