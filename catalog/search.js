(() => {
  const form = document.querySelector('[data-catalog-search]');
  if (!form) return;
  const panel = form.closest('.search-section');
  const input = form.elements.namedItem('q');
  const status = panel.querySelector('[role="status"]');
  const list = panel.querySelector('.results');
  const categoryResults = panel.querySelector('.result-categories');
  const more = panel.querySelector('[data-more]');
  const indexRoot = new URL(form.dataset.index, location.href);
  let loading, matches = [], shown = 0, sequence = 0;
  const normalize = value => String(value ?? '').toLowerCase().normalize('NFKC').replace(/ё/g,'е').replace(/[\u2010-\u2015\u2212]/g,'-').replace(/(\d)[.,](?=\d)/g,'$1.').replace(/\s+/g,' ').trim();
  const compact = value => value.replace(/[^\p{L}\p{N}.]+/gu,'');
  const collator = new Intl.PluralRules('ru');
  const noun = (n, forms) => forms[collator.select(n)] ?? forms.many;
  async function read(url) {
    const response = await fetch(url,{credentials:'same-origin'});
    if (!response.ok) throw new Error('http ' + response.status);
    return response.json();
  }
  async function buildIndex() {
    const {groups, chunks} = await read(indexRoot);
    const rows = new Array(chunks.length);
    let next = 0;
    async function fetchChunks() {
      while (next < chunks.length) {
        const i = next++;
        const chunk = await read(new URL(chunks[i],indexRoot));
        rows[i] = chunk.map(([name,sku,brand,group,page,anchor,skuArchive]) => {
          const [groupName,slug] = groups[group];
          const line = normalize([name,sku,brand,groupName].join(' '));
          return {name,sku,brand,groupName,skuArchive,line,code:compact(line),slug,page,anchor};
        });
      }
    }
    await Promise.all(Array.from({length:Math.min(4,chunks.length)},fetchChunks));
    return {items:rows.flat(),groups:groups.map(([name,path]) => ({name,line:normalize(name),href:new URL(path+'/',indexRoot)}))};
  }
  function renderMore() {
    const end = Math.min(shown + 35,matches.length);
    const fragment = document.createDocumentFragment();
    for (const result of matches.slice(shown,end)) {
      const row = document.createElement('li'); row.className='part-row';
      const info = document.createElement('div');
      const page = result.page === 1 ? '' : 'page-' + result.page + '.html';
      const title = document.createElement('a');
      title.className = 'part-title';
      title.href = new URL(result.slug + '/' + page + '#' + result.anchor, indexRoot);
      title.textContent = result.name;
      const meta = document.createElement('span'); meta.className='part-meta';
      for (const label of [result.groupName,result.sku ? (result.skuArchive ? 'Артикул по прайсу от '+result.skuArchive+' · ' : 'Артикул ') + result.sku : '',result.brand]) {
        if (!label) continue;
        const text = document.createElement('span'); text.textContent=label; meta.append(text);
      }
      info.append(title,meta); row.append(info); fragment.append(row);
    }
    list.append(fragment); shown=end; more.hidden=shown>=matches.length;
  }
  async function search() {
    const request=++sequence;
    matches=[]; shown=0; list.replaceChildren(); categoryResults.replaceChildren(); categoryResults.hidden=true; more.hidden=true;
    const query=normalize(input.value);
    if (!query) { status.textContent=''; return; }
    status.textContent='Поиск по разделу…';
    try {
      if (!loading) loading=buildIndex().catch(error => { loading=undefined; throw error; });
      const index=await loading;
      if (request!==sequence) return;
      const tokens=query.split(' ');
      const categories=index.groups.filter(group=>tokens.every(term=>group.line.includes(term)));
      for (const category of categories) {
        const link=document.createElement('a');link.href=category.href;link.textContent=category.name;categoryResults.append(link);
      }
      categoryResults.hidden=!categories.length;
      const terms = tokens.map(text => ({text,code:compact(text)}));
      matches = index.items.filter(row => terms.every(({text,code}) =>
        row.line.includes(text) || (code && row.code.includes(code))
      ));
      const count=matches.length;
      const totals=[];
      if(categories.length)totals.push(categories.length.toLocaleString('ru-RU')+' '+noun(categories.length,{one:'категория',few:'категории',many:'категорий'}));
      if(count)totals.push(count.toLocaleString('ru-RU')+' '+noun(count,{one:'позиция',few:'позиции',many:'позиций'}));
      status.textContent=totals.length ? 'В результатах '+totals.join(' и ')+'.' : 'По этому запросу позиций нет. Попробуйте другое название или артикул.';
      renderMore();
    } catch {
      if (request===sequence) status.textContent='Не удалось загрузить поиск. Повторите попытку или выберите категорию ниже.';
    }
  }
  form.addEventListener('submit',event => {
    event.preventDefault();
    const url=new URL(location.href);
    if (input.value.trim()) url.searchParams.set('q',input.value.trim()); else url.searchParams.delete('q');
    if (url.href!==location.href) history.pushState(null,'',url);
    search();
  });
  function readQuery(){
    input.value=new URL(location.href).searchParams.get('q') ?? '';
    search();
  }
  window.addEventListener('popstate',readQuery);
  input.addEventListener('input',() => { if (!input.value.trim()) { ++sequence;list.replaceChildren();categoryResults.replaceChildren();categoryResults.hidden=true;more.hidden=true;status.textContent='';} });
  more.addEventListener('click',renderMore);
  panel.hidden=false;
  readQuery();
})();
