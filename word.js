/* =========================================================
   Simple Word Finding — word page script
   Fetches definitions from the Free Dictionary API and
   generates an AI example sentence via Google Gemini 2.5 Flash.
   ========================================================= */

// AI examples are generated via a Netlify Function (netlify/functions/generate-example.js)
// so the Gemini API key stays server-side. Set GEMINI_API_KEY in Netlify's
// Site settings → Environment variables — nothing to configure here.
const AI_EXAMPLE_ENDPOINT = '/.netlify/functions/generate-example';

(function () {
  const wordCard = document.getElementById('wordCard');
  if (!wordCard) return; // not on word page

  const loadingState = document.getElementById('loadingState');
  const notFoundState = document.getElementById('notFoundState');
  const notFoundWord = document.getElementById('notFoundWord');
  const wordTitle = document.getElementById('wordTitle');
  const phoneticEl = document.getElementById('phonetic');
  const variantsBox = document.getElementById('variantsBox');
  const variantsList = document.getElementById('variantsList');
  const meaningsContainer = document.getElementById('meaningsContainer');
  const pageTitle = document.getElementById('pageTitle');
  const generateAiBtn = document.getElementById('generateAiBtn');
  const aiExampleBox = document.getElementById('aiExample');

  const params = new URLSearchParams(location.search);
  const word = (params.get('word') || '').trim().toLowerCase();

  if (!word) {
    location.href = 'index.html';
    return;
  }

  pageTitle.textContent = `${word} · Simple Word Finding`;

  fetchDefinition(word);

  async function fetchDefinition(w) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      renderWord(data[0]);
    } catch (err) {
      showNotFound(w);
    }
  }

  function showNotFound(w) {
    loadingState.hidden = true;
    notFoundState.hidden = false;
    notFoundWord.textContent = w;
  }

  function renderWord(entry) {
    loadingState.hidden = true;
    wordCard.hidden = false;

    wordTitle.textContent = entry.word;

    // Phonetic
    const phonetic = entry.phonetic || (entry.phonetics || []).map(p => p.text).find(Boolean);
    phoneticEl.textContent = phonetic || '';

    // Spelling variants (American / British / Australian)
    const variants = getSpellingVariants(entry.word);
    if (variants) {
      variantsBox.hidden = false;
      variantsList.innerHTML = '';
      const labels = { american: 'American', british: 'British', australian: 'Australian' };
      ['american', 'british', 'australian'].forEach((key) => {
        if (variants[key]) {
          const chip = document.createElement('span');
          chip.className = 'variant-chip';
          chip.innerHTML = `${labels[key]}: <b>${escapeHtml(variants[key])}</b>`;
          variantsList.appendChild(chip);
        }
      });
      if (variants._note) {
        const note = document.createElement('span');
        note.className = 'variant-chip';
        note.textContent = variants._note;
        variantsList.appendChild(note);
      }
    }

    // Meanings (part of speech, definitions, examples, synonyms)
    meaningsContainer.innerHTML = '';
    (entry.meanings || []).forEach((meaning) => {
      const block = document.createElement('div');
      block.className = 'meaning-block';

      const pos = document.createElement('span');
      pos.className = 'pos-tag';
      pos.textContent = meaning.partOfSpeech || 'unknown';
      block.appendChild(pos);

      (meaning.definitions || []).slice(0, 4).forEach((def, i) => {
        const item = document.createElement('div');
        item.className = 'definition-item';

        const p = document.createElement('p');
        p.className = 'def-text';
        p.textContent = `${i + 1}. ${def.definition}`;
        item.appendChild(p);

        if (def.example) {
          const ex = document.createElement('p');
          ex.className = 'example';
          ex.textContent = `“${def.example}”`;
          item.appendChild(ex);
        }
        block.appendChild(item);
      });

      const allSynonyms = new Set(meaning.synonyms || []);
      (meaning.definitions || []).forEach((d) => (d.synonyms || []).forEach((s) => allSynonyms.add(s)));
      if (allSynonyms.size) {
        const syn = document.createElement('p');
        syn.className = 'synonyms';
        syn.textContent = 'Synonyms: ' + Array.from(allSynonyms).slice(0, 8).join(', ');
        block.appendChild(syn);
      }

      meaningsContainer.appendChild(block);
    });

    // Wire up AI example button
    generateAiBtn.addEventListener('click', () => generateAiExample(entry));
  }

  async function generateAiExample(entry) {
    generateAiBtn.disabled = true;
    generateAiBtn.textContent = 'Generating…';

    const partOfSpeech = entry.meanings?.[0]?.partOfSpeech || '';
    const definition = entry.meanings?.[0]?.definitions?.[0]?.definition || '';

    try {
      const res = await fetch(AI_EXAMPLE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: entry.word, partOfSpeech, definition }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      const sentence = data.sentence || 'Could not generate an example right now.';

      aiExampleBox.innerHTML = '';
      const box = document.createElement('div');
      box.className = 'ai-example-text';
      box.textContent = sentence;
      aiExampleBox.appendChild(box);

      const retryBtn = document.createElement('button');
      retryBtn.className = 'ai-btn';
      retryBtn.style.marginTop = '10px';
      retryBtn.textContent = 'Generate another';
      retryBtn.addEventListener('click', () => generateAiExample(entry));
      aiExampleBox.appendChild(retryBtn);
    } catch (err) {
      aiExampleBox.innerHTML = '';
      const errBox = document.createElement('p');
      errBox.className = 'ai-example-text';
      errBox.textContent = 'Sorry, the AI example could not be generated. Please try again.';
      aiExampleBox.appendChild(errBox);

      const retryBtn = document.createElement('button');
      retryBtn.className = 'ai-btn';
      retryBtn.style.marginTop = '10px';
      retryBtn.textContent = 'Try again';
      retryBtn.addEventListener('click', () => generateAiExample(entry));
      aiExampleBox.appendChild(retryBtn);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
