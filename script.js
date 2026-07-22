/* =========================================================
   Simple Word Finding — shared script
   Handles: homepage word list rendering + live search
   ========================================================= */

(function () {
  const wordListEl = document.getElementById('wordList');
  if (!wordListEl) return; // not on homepage

  const searchInput = document.getElementById('searchInput');
  const emptyState = document.getElementById('emptyState');
  const emptyQuery = document.getElementById('emptyQuery');
  const resultCount = document.getElementById('resultCount');
  const wordTotal = document.getElementById('wordTotal');

  const ALL_WORDS = DICTIONARY_WORDS; // from dictionary-data.js
  wordTotal.textContent = ALL_WORDS.length.toLocaleString();

  const MAX_RENDER = 500; // render cap per pass for performance; refine search to narrow down

  function renderList(words) {
    const frag = document.createDocumentFragment();
    const toShow = words.slice(0, MAX_RENDER);

    toShow.forEach((word) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = 'word.html?word=' + encodeURIComponent(word);
      a.textContent = word;
      li.appendChild(a);
      frag.appendChild(li);
    });

    wordListEl.innerHTML = '';
    wordListEl.appendChild(frag);

    if (words.length === 0) {
      emptyState.hidden = false;
      resultCount.textContent = '';
    } else {
      emptyState.hidden = true;
      if (words.length > MAX_RENDER) {
        resultCount.textContent = `Showing ${MAX_RENDER.toLocaleString()} of ${words.length.toLocaleString()} matches — keep typing to narrow it down`;
      } else {
        resultCount.textContent = `${words.length.toLocaleString()} word${words.length === 1 ? '' : 's'}`;
      }
    }
  }

  function filterWords(query) {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_WORDS;
    return ALL_WORDS.filter((w) => w.startsWith(q)).concat(
      ALL_WORDS.filter((w) => !w.startsWith(q) && w.includes(q))
    );
  }

  let debounceTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = searchInput.value;
      const filtered = filterWords(q);
      emptyQuery.textContent = searchInput.value;
      renderList(filtered);
    }, 60);
  });

  // Initial render
  renderList(ALL_WORDS);

  // Restore focus/query from URL (?q=) for convenience when navigating back
  const params = new URLSearchParams(location.search);
  if (params.get('q')) {
    searchInput.value = params.get('q');
    renderList(filterWords(searchInput.value));
  }
})();

/* =========================================================
   Shared helper: generate common spelling variants
   (American / British / Australian) using rule-based patterns.
   Not exhaustive, but covers the most common divergences.
   ========================================================= */
function getSpellingVariants(word) {
  const w = word.toLowerCase();
  const variants = {};

  const rules = [
    // British/Australian -our  vs American -or
    { us: /or$/, ukSuffix: 'our', test: (s) => /(colou?r|flavou?r|honou?r|favou?r|behaviou?r|labou?r|neighbou?r|rumou?r|armou?r|vigou?r|humou?r|vapou?r|valou?r|endeavou?r)$/.test(s) },
  ];

  // -ize (US) vs -ise (UK/AUS)
  if (/ize$/.test(w) && w.length > 4) {
    variants.american = w;
    variants.british = w.replace(/ize$/, 'ise');
    variants.australian = variants.british;
  } else if (/ise$/.test(w) && w.length > 4 && /(realise|organise|recognise|apologise|analyse|criticise|emphasise|specialise|customise|memorise|summarise)$/.test(w) === false && /(ise)$/.test(w)) {
    // could already be UK form
  }

  // -or (US) vs -our (UK/AUS) for common set
  const ourWords = ['color','flavor','honor','favor','behavior','labor','neighbor','rumor','armor','vigor','humor','vapor','valor','endeavor','harbor','odor','parlor','rigor','savior','splendor','tumor'];
  if (ourWords.includes(w)) {
    variants.american = w;
    variants.british = w.replace(/or$/, 'our');
    variants.australian = variants.british;
  }

  // -er (US) vs -re (UK/AUS) for common set
  const reWords = ['center','theater','meter','liter','fiber','caliber','somber','luster','specter','saber'];
  if (reWords.includes(w)) {
    variants.american = w;
    variants.british = w.replace(/er$/, 're');
    variants.australian = variants.british;
  }

  // -ize/-yze verbs commonly spelled -ise/-yse in UK
  const izeWords = ['realize','organize','recognize','apologize','analyze','criticize','emphasize','specialize','customize','memorize','summarize','minimize','maximize','capitalize','characterize','civilize','digitize','fantasize','finalize','generalize','harmonize','idolize','improvise','modernize','mobilize','optimize','paralyze','prioritize','sympathize','utilize','visualize'];
  if (izeWords.includes(w)) {
    variants.american = w;
    variants.british = w.replace(/ize$/, 'ise').replace(/yze$/, 'yse');
    variants.australian = variants.british;
  }

  // -og (US) vs -ogue (UK/AUS)
  const ogWords = ['catalog','dialog','analog'];
  if (ogWords.includes(w)) {
    variants.american = w;
    variants.british = w + 'ue';
    variants.australian = variants.british;
  }

  // double consonant before -ing/-ed/-er in UK/AUS (e.g. traveling/travelling)
  const doubleLWords = ['travel','cancel','label','model','signal','fuel','quarrel','marvel','level','tunnel','jewel','counsel','channel'];
  if (doubleLWords.includes(w)) {
    variants.american = w;
    variants.british = w + 'l';
    variants.australian = variants.british;
    variants._note = 'l-doubling in inflected forms (e.g. travel\u2192travelled)';
  }

  // defense/defence, license/licence, offense/offence, pretense/pretence
  const ceSeWords = { defense: 'defence', license: 'licence', offense: 'offence', pretense: 'pretence' };
  if (ceSeWords[w]) {
    variants.american = w;
    variants.british = ceSeWords[w];
    variants.australian = ceSeWords[w];
  }

  // gray/grey
  if (w === 'gray') {
    variants.american = 'gray';
    variants.british = 'grey';
    variants.australian = 'grey';
  }

  // aluminum/aluminium
  if (w === 'aluminum') {
    variants.american = 'aluminum';
    variants.british = 'aluminium';
    variants.australian = 'aluminium';
  }

  return Object.keys(variants).length ? variants : null;
}
