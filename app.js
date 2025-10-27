(function(){
    // quick DOM helpers (just using native APIs)
    const $  = (sel, ctx=document) => ctx.querySelector(sel);
    const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  
    // small helpers
    const fmt  = (n) => isNaN(+n) ? '—' : (+n).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2});
    const uid  = () => Math.random().toString(36).slice(2,10);
    const toISO = d => new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
    const esc = (s) => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
    const parseISO = (d) => { const t=new Date(d); return isNaN(t)?null:t; };
  
    // storage + demo data
    const STORAGE_KEY = 'stashmate_items_v1';
    const seed = [
      { id: uid(), name:'Pokémon: Turtwig Holo', category:'Cards',  condition:'NM',     qty:2, cost:8.5, price:25, source:'Local show', acquired:'2025-09-28', status:'Listed' },
      { id: uid(), name:'Funko Pop #18',         category:'Figures', condition:'Boxed', qty:1, cost:12,  price:28, source:'Target',     acquired:'2025-10-02', status:'In Stock' },
      { id: uid(), name:'Yu-Gi-Oh! Blue-Eyes',   category:'Cards',  condition:'LP',     qty:1, cost:40,  price:85, source:'Online',     acquired:'2025-10-10', status:'Sold', soldOn:'2025-10-10' },
    ];
  
    // app state
    let rows = load();
    let sortBy = 'acquired:desc';
    let editingId = null; // id of the row we are editing (null = new)
  
    // table + inputs
    const tbody = $('#itemsTable tbody');
    const searchInput = $('#searchInput');
    const sortSelect = $('#sortSelect');
    const resultCount = $('#resultCount');
    const kpiCost = $('#kpiCost');
    const kpiPotential = $('#kpiPotential');
    const kpiTotalMade = $('#kpiTotalMade');
    const kpiCount = $('#kpiCount');
  
    // modal bits
    const modalBack  = $('#modalBack');
    const modalTitle = $('#modalTitle');
    const soldOnWrap = $('#soldOnWrap');
    const chartCanvas = $('#earningsChart');
    const rangeSelect = $('#rangeSelect');
    const rangeAnchor = $('#rangeAnchor');
  
    const f = {
      name: $('#f_name'),
      category: $('#f_category'),
      condition: $('#f_condition'),
      qty: $('#f_qty'),
      cost: $('#f_cost'),
      price: $('#f_price'),
      source: $('#f_source'),
      acquired: $('#f_acquired'),
      status: $('#f_status'),
      soldOn: $('#f_soldOn'),
    };
    const profitPreview = $('#profitPreview');
  
    // default the time anchor to today so ranges make sense
    if (rangeAnchor) rangeAnchor.value = toISO(new Date());
  
    // boot
    sortSelect.value = sortBy;
    render();
  
    // listeners (pretty standard UI wiring)
    $('#addBtn').onclick       = () => openForm();
    $('#closeModal').onclick   = closeForm;
    $('#cancelBtn').onclick    = closeForm; // if you cancel, we drop edits
    $('#saveBtn').onclick      = saveItem;
    $('#exportCsvBtn').onclick = exportCSV;
    searchInput.oninput        = render;
    sortSelect.onchange        = () => { sortBy = sortSelect.value; render(); };
    if (rangeSelect) rangeSelect.onchange = render;
    if (rangeAnchor) rangeAnchor.oninput = render;
    Object.values(f).forEach(el => el && (el.oninput = updateProfitPreview));
    if (f.status) f.status.onchange = () => toggleSoldOn(f.status.value === 'Sold');
  
    // click off the modal to close (nice-to-have)
    modalBack.addEventListener('click', (e) => { if (e.target === modalBack) closeForm(); });
  
    // --- storage helpers ---
    function load(){
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : seed;
      } catch { return seed; }
    }
    function save(){
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); } catch{}
    }
  
    // status badge (purely visual)
    function badge(s){
      const cls = s==='Sold' ? 'b-green' : s==='Listed' ? 'b-blue' : s==='In Stock' ? 'b-zinc' : 'b-amber';
      return `<span class="badge ${cls}">${esc(s)}</span>`;
    }
  
    // --- time range logic for KPIs + chart ---
    function getRange(){
      if (!rangeSelect || !rangeAnchor) return {start:null, end:null}; // all-time
      const mode = rangeSelect.value;
      const anchor = parseISO(rangeAnchor.value) || new Date();
      let start, end;
  
      if (mode === 'all') return {start:null, end:null};
      if (mode === 'day'){
        start = new Date(anchor); start.setHours(0,0,0,0);
        end   = new Date(anchor); end.setHours(23,59,59,999);
      } else if (mode === 'week'){
        const d = new Date(anchor);
        const dow = (d.getDay()+6)%7; // Monday=0 (I prefer Monday weeks)
        start = new Date(d); start.setDate(d.getDate()-dow); start.setHours(0,0,0,0);
        end   = new Date(start); end.setDate(start.getDate()+6); end.setHours(23,59,59,999);
      } else if (mode === 'month'){
        start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        end   = new Date(anchor.getFullYear(), anchor.getMonth()+1, 0); end.setHours(23,59,59,999);
      } else if (mode === 'year'){
        start = new Date(anchor.getFullYear(), 0, 1);
        end   = new Date(anchor.getFullYear(),11,31,23,59,59,999);
      }
      return {start, end};
    }
    function inRange(dateStr){
      const {start, end} = getRange();
      if (!start || !end) return true;
      const d = parseISO(dateStr);
      if (!d) return false;
      return d >= start && d <= end;
    }
  
    // --- main render ---
    function render(){
      // search + sort
      const q = (searchInput.value||'').trim().toLowerCase();
      let list = rows.filter(r => [r.name,r.category,r.condition,r.source,r.status].join(' ').toLowerCase().includes(q));
      const [key,dir] = sortBy.split(':');
      list.sort((a,b)=>{
        const A=a[key], B=b[key];
        if (key==='acquired') return (new Date(A)-new Date(B))*(dir==='asc'?1:-1);
        if (typeof A==='number' && typeof B==='number') return (A-B)*(dir==='asc'?1:-1);
        return String(A).localeCompare(String(B))*(dir==='asc'?1:-1);
      });
  
      // table rows
      tbody.innerHTML = '';
      list.forEach(r => {
        const profit = (Number(r.price) - Number(r.cost)) * Number(r.qty || 1);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${esc(r.name)}</td>
          <td>${esc(r.category)}</td>
          <td>${esc(r.condition)}</td>
          <td>${r.qty}</td>
          <td>${fmt(r.cost)}</td>
          <td>${fmt(r.price)}</td>
          <td style="${profit>=0 ? 'color:#7bf7a1' : 'color:#ff9aa5'}">${fmt(profit)}</td>
          <td>${esc(r.source || '')}</td>
          <td>${esc(r.acquired || '')}</td>
          <td>${badge(r.status)}</td>
          <td>
            <button class="btn" data-edit="${r.id}" type="button">Edit</button>
            <button class="btn danger" data-del="${r.id}" type="button">Delete</button>
          </td>`;
        tbody.appendChild(tr);
      });
      if (list.length===0){
        const tr=document.createElement('tr'), td=document.createElement('td');
        td.colSpan=11; td.style.textAlign='center'; td.style.padding='24px'; td.className='muted'; td.textContent='No results.';
        tr.appendChild(td); tbody.appendChild(tr);
      }
      $$('[data-edit]').forEach(b => b.onclick = () => openForm(b.getAttribute('data-edit')));
      $$('[data-del]').forEach(b => b.onclick = () => removeItem(b.getAttribute('data-del')));
  
      // --- KPIs ---
      const totalCount = rows.reduce((s,r)=> s + Number(r.qty||0), 0);
  
      // value of inventory still on hand
      const inventoryValue = rows
        .filter(r => r.status !== 'Sold')
        .reduce((s,r)=> s + Number(r.cost)*Number(r.qty||1), 0);
  
      // potential profit if unsold items sell at list price (fees ignored for now)
      const potentialProfit = rows
        .filter(r => r.status !== 'Sold')
        .reduce((s,r)=> s + (Number(r.price)-Number(r.cost)) * Number(r.qty||1), 0);
  
      // total made (sold) in selected time range (uses soldOn, falls back to acquired if missing)
      const soldInRange = rows.filter(r => r.status === 'Sold' && inRange(r.soldOn || r.acquired));
      const totalMade = soldInRange.reduce((s,r)=> s + Number(r.price)*Number(r.qty||1), 0);
  
      // push numbers to the UI
      if (kpiCount)     kpiCount.textContent     = totalCount;
      if (kpiCost)      kpiCost.textContent      = fmt(inventoryValue);
      if (kpiPotential) kpiPotential.textContent = fmt(potentialProfit);
      if (kpiTotalMade) kpiTotalMade.textContent = fmt(totalMade);
  
      resultCount.textContent = list.length + (list.length===1 ? ' result' : ' results');
  
      // keep the chart size fixed (we only change the internal buffer)
      drawEarningsChart(buildDailySeries(soldInRange));
    }
  
    // turn sold rows into daily totals for the mini chart
    function buildDailySeries(soldRows){
      const {start, end} = getRange();
      let from = start, to = end;
      if (!from || !to){
        // all time: pick bounds from data
        const dates = soldRows.map(r => parseISO(r.soldOn || r.acquired)).filter(Boolean).sort((a,b)=>a-b);
        if (dates.length === 0) return [];
        from = new Date(dates[0]); from.setHours(0,0,0,0);
        to   = new Date(dates[dates.length-1]); to.setHours(23,59,59,999);
      }
  
      // init days
      const days = {};
      const cursor = new Date(from);
      while (cursor <= to){
        days[toISO(cursor)] = 0;
        cursor.setDate(cursor.getDate()+1);
      }
  
      // add up revenue per day
      soldRows.forEach(r=>{
        const d = toISO(parseISO(r.soldOn || r.acquired));
        if (d in days) days[d] += Number(r.price)*Number(r.qty||1);
      });
      return Object.entries(days).map(([date,value])=>({date,value}));
    }
  
    // tiny canvas line chart (no libs)
    function drawEarningsChart(data){
      const c = chartCanvas; if (!c) return;
  
      const dpr = window.devicePixelRatio || 1;
      const ctx = c.getContext('2d');
  
      // NOTE: we only set width/height of the backing buffer; CSS size stays fixed
      const cssW = c.clientWidth || 600;
      const cssH = c.clientHeight || 180;
  
      c.width  = Math.max(1, Math.floor(cssW * dpr));
      c.height = Math.max(1, Math.floor(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
      // clear
      ctx.clearRect(0, 0, cssW, cssH);
  
      if (!data || data.length === 0){
        ctx.fillStyle = '#9aa0a6';
        ctx.font = '12px system-ui';
        ctx.fillText('No sold revenue in range', 10, 20);
        return;
      }
  
      const padL=36, padR=10, padT=10, padB=24;
      const w = cssW - padL - padR;
      const h = cssH - padT - padB;
      const maxY = Math.max(1, Math.ceil(Math.max(...data.map(d=>d.value))*1.1));
  
      // axes
      ctx.strokeStyle='#2a2a30'; ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(padL, padT); ctx.lineTo(padL, padT+h); ctx.lineTo(padL+w, padT+h);
      ctx.stroke();
  
      // y grid + labels (just 4 ticks to keep it clean)
      ctx.fillStyle='#9aa0a6'; ctx.font='10px system-ui';
      for (let i=0;i<=4;i++){
        const yVal = (maxY*i/4);
        const y = padT + h - (yVal/maxY)*h;
        ctx.strokeStyle='#1a1a1e'; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL+w, y); ctx.stroke();
        ctx.fillText(fmt(yVal).replace('$','$ '), 4, y+3);
      }
  
      // x labels (first / middle / last)
      const n = data.length;
      const xAt = i => padL + (i/(n-1))*w;
      ctx.fillStyle='#9aa0a6';
      [0, Math.floor((n-1)/2), n-1].forEach(i=>{
        if (i<0 || i>=n) return;
        const x = xAt(i);
        ctx.fillText(data[i].date, x-24, padT+h+16);
      });
  
      // line + dots
      ctx.strokeStyle='#22c55e'; ctx.lineWidth=2;
      ctx.beginPath();
      data.forEach((d,i)=>{
        const x = xAt(i);
        const y = padT + h - (d.value/maxY)*h;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.stroke();
  
      ctx.fillStyle='#22c55e';
      data.forEach((d,i)=>{
        const x = xAt(i);
        const y = padT + h - (d.value/maxY)*h;
        ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2); ctx.fill();
      });
    }
  
    // --- modal + CRUD ---
    function openForm(id){
      editingId = id || null;
      if (editingId){
        const r = rows.find(x => x.id === editingId);
        modalTitle.textContent = 'Edit Item';
        f.name.value = r.name; f.category.value = r.category; f.condition.value = r.condition;
        f.qty.value = r.qty;   f.cost.value = r.cost;         f.price.value = r.price;
        f.source.value = r.source || ''; f.acquired.value = r.acquired || '';
        f.status.value = r.status; if (f.soldOn) f.soldOn.value = r.soldOn || '';
        toggleSoldOn(f.status.value === 'Sold');
      } else {
        modalTitle.textContent = 'New Item';
        f.name.value=''; f.category.value='Cards'; f.condition.value='NM'; f.qty.value=1;
        f.cost.value=0; f.price.value=0; f.source.value='';
        f.acquired.value = toISO(new Date());
        f.status.value = 'In Stock';
        if (f.soldOn) f.soldOn.value = '';
        toggleSoldOn(false);
      }
      updateProfitPreview();
      modalBack.style.display = 'flex';
    }
    function closeForm(){ modalBack.style.display = 'none'; editingId = null; }
    function toggleSoldOn(show){ if (soldOnWrap) soldOnWrap.style.display = show ? '' : 'none'; }
  
    function updateProfitPreview(){
      const qty = Number(f.qty.value || 1);
      const profit = (Number(f.price.value || 0) - Number(f.cost.value || 0)) * qty;
      if (profitPreview) profitPreview.textContent = `Profit preview: ${fmt(profit)} (not incl. fees)`;
    }
  
    function saveItem(){
      // tiny validation
      if (!f.name.value.trim()) return alert('Name is required');
      if (!f.acquired.value)    return alert('Acquired date is required');
  
      // build the row from form values
      const item = {
        id: editingId || uid(),
        name: f.name.value.trim(),
        category: f.category.value,
        condition: f.condition.value,
        qty: Number(f.qty.value || 1),
        cost: Number(f.cost.value || 0),
        price: Number(f.price.value || 0),
        source: f.source.value.trim(),
        acquired: f.acquired.value,
        status: f.status.value,
        soldOn: f.soldOn ? (f.soldOn.value || undefined) : undefined,
      };
  
      // if marked Sold but no soldOn provided, just stamp today for convenience
      if (item.status === 'Sold' && !item.soldOn) item.soldOn = toISO(new Date());
      if (item.status !== 'Sold') item.soldOn = undefined; // keep unsold clean
  
      const i = rows.findIndex(r => r.id === item.id);
      if (i >= 0) rows[i] = item; else rows.push(item);
  
      save();
      closeForm();
      render();
    }
  
    function removeItem(id){
      if (!confirm('Delete this item?')) return;
      rows = rows.filter(r => r.id !== id);
      save();
      render();
    }
  
    // --- CSV export of everything ---
    function exportCSV(){
      const headers = ["id","name","category","condition","qty","cost","price","source","acquired","status","soldOn"];
      const csv = [headers.join(',')]
        .concat(rows.map(r=> headers.map(h=> String(r[h]??'').replaceAll(',', ' ')).join(',')))
        .join('\n');
  
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `stashmate_${toISO(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  })();