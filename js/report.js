// js/report.js
// Assumes firebase.js has run and exposed `firebase`, `auth`, `db`, `storage` variables
// Example: window.firebase = firebase; window.auth = firebase.auth(); window.db = firebase.firestore(); window.storage = firebase.storage();

(function () {
  // UI refs
  const reportForm = document.getElementById('reportForm');
  const reportType = document.getElementById('reportType');
  const itemName = document.getElementById('itemName');
  const itemDesc = document.getElementById('itemDesc');
  const placeInput = document.getElementById('placeInput');
  const mapEl = document.getElementById('map');
  const imagesInput = document.getElementById('reportImages');
  const thumbs = document.getElementById('thumbs');
  const voiceBtn = document.getElementById('voiceBtn');
  const ocrBtn = document.getElementById('ocrBtn');
  const aiGenBtn = document.getElementById('aiGenBtn');
  const reportDate = document.getElementById('reportDate');
  const submitBtn = document.getElementById('submitBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const reportSuccess = document.getElementById('reportSuccess');
  const reportError = document.getElementById('reportError');
  const contactPhone = document.getElementById('contactPhone');

  // Google maps
  let map, marker, pickedLocation = null;
  function initMap() {
    map = new google.maps.Map(mapEl, { center: { lat: 10.786, lng: 78.708 }, zoom: 7 });
    marker = new google.maps.Marker({ map });

    const autocomplete = new google.maps.places.Autocomplete(placeInput, {});
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      const loc = place.geometry.location;
      map.setCenter(loc);
      map.setZoom(14);
      marker.setPosition(loc);
      pickedLocation = { lat: loc.lat(), lng: loc.lng(), placeName: place.formatted_address || place.name };
    });

    // allow clicking map to set marker
    map.addListener('click', (e) => {
      marker.setPosition(e.latLng);
      map.panTo(e.latLng);
      pickedLocation = { lat: e.latLng.lat(), lng: e.latLng.lng(), placeName: '' };
    });
  }
  initMap();

  // thumbnails
  let selectedFiles = [];
  imagesInput.addEventListener('change', (ev) => {
    selectedFiles = Array.from(ev.target.files);
    thumbs.innerHTML = '';
    selectedFiles.forEach(f => {
      const url = URL.createObjectURL(f);
      const img = document.createElement('img'); img.src = url; img.className = 'thumb';
      thumbs.appendChild(img);
    });
  });

  // Voice->text (Web Speech API)
  let recognizing = false;
  let recognition = null;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new ctor();
    recognition.lang = 'en-IN'; // try en-IN; user can change
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ');
      // append recognized text to description
      itemDesc.value = (itemDesc.value ? itemDesc.value + ' ' : '') + text;
    };
    recognition.onend = () => { recognizing = false; voiceBtn.textContent = '🎙 Voice to Text'; };
  } else {
    voiceBtn.disabled = true;
    voiceBtn.title = "SpeechRecognition not supported in this browser";
  }

  voiceBtn.addEventListener('click', () => {
    if (!recognition) return alert('Voice recognition not supported on this browser.');
    if (!recognizing) {
      recognition.start();
      recognizing = true;
      voiceBtn.textContent = '⏳ Listening... Click to stop';
    } else {
      recognition.stop();
      recognizing = false;
      voiceBtn.textContent = '🎙 Voice to Text';
    }
  });

  // OCR button - Tesseract.js
  ocrBtn.addEventListener('click', async () => {
    if (!selectedFiles.length) return alert('Please upload or capture an image first.');
    reportError.classList.add('hidden');
    reportSuccess.classList.add('hidden');
    ocrBtn.textContent = 'Reading...';
    try {
      const file = selectedFiles[0];
      const { data } = await Tesseract.recognize(file, 'eng', { logger: m => console.log(m) });
      const text = data?.text?.trim() || '';
      itemDesc.value = (itemDesc.value ? itemDesc.value + '\n' : '') + text;
    } catch (err) {
      console.error(err);
      reportError.textContent = 'OCR failed: ' + err.message; reportError.classList.remove('hidden');
    } finally {
      ocrBtn.textContent = '🔎 Image OCR';
    }
  });

  // AI generation - calls server function /generate
  // NOTE: client must call your cloud function endpoint at /generate (deployed in Firebase functions)
  aiGenBtn.addEventListener('click', async () => {
    reportError.classList.add('hidden');
    reportSuccess.classList.add('hidden');
    aiGenBtn.textContent = 'Generating...';
    try {
      // prepare payload: text from OCR + itemName + maybe an image base64 (we will send text only to keep small)
      const payload = {
        name: itemName.value || '',
        desc: itemDesc.value || '',
        phone: contactPhone.value || '',
      };
      const res = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`AI generation failed: ${txt || res.statusText}`);
      }
      const json = await res.json();
      if (json?.description) {
        itemDesc.value = json.description + (itemDesc.value ? '\n' + itemDesc.value : '');
      } else {
        throw new Error('No description returned from server');
      }
    } catch (err) {
      console.error(err);
      reportError.textContent = err.message; reportError.classList.remove('hidden');
    } finally {
      aiGenBtn.textContent = '✨ Generate Description with AI';
    }
  });

  // similarity helper (very simple: token overlap)
  function similarityScore(aStr, bStr) {
    if (!aStr || !bStr) return 0;
    const a = new Set(aStr.toLowerCase().split(/\W+/).filter(Boolean));
    const b = new Set(bStr.toLowerCase().split(/\W+/).filter(Boolean));
    if (!a.size || !b.size) return 0;
    let inter = 0;
    a.forEach(t => { if (b.has(t)) inter++; });
    return inter / Math.max(a.size, b.size);
  }

  // Submit form → upload images → add Firestore doc → optionally call matching logic and notify
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    reportError.classList.add('hidden');
    reportSuccess.classList.add('hidden');

    const user = auth.currentUser;
    if (!user) {
      reportError.textContent = 'Please login first.'; reportError.classList.remove('hidden'); submitBtn.disabled = false; return;
    }

    try {
      const type = reportType.value;
      const name = itemName.value.trim();
      const desc = itemDesc.value.trim();
      const datetime = reportDate.value || null;
      const phone = contactPhone.value.trim();

      // create doc (empty images array for now)
      const docRef = await db.collection('reports').add({
        uid: user.uid,
        type, title: name, description: desc,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        dateTime: datetime ? new Date(datetime) : null,
        location: pickedLocation || null,
        images: [],
        status: 'pending',
        phone,
        notifiedUsers: [],
        viewsCount: 0,
      });

      // upload images (if any)
      const urls = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const f = selectedFiles[i];
        const path = `reports/${docRef.id}/${Date.now()}_${i}_${f.name}`;
        const snap = await storage.ref(path).put(f);
        const url = await snap.ref.getDownloadURL();
        urls.push(url);
      }
      if (urls.length) await docRef.update({ images: urls });

      // run a quick similarity search: find reports of opposite type within same city or within list
      // We'll query simple candidates: same placeName or within uid == not user
      const candidatesQ = db.collection('reports')
        .where('type','!=', type)  // find opposite (lost vs found)
        .where('status','==','pending')
        .limit(50);

      const snapshot = await candidatesQ.get();
      const matches = [];
      snapshot.forEach(doc => {
        const r = doc.data();
        // don't match own doc
        if (r.uid === user.uid) return;
        // simple heuristic: location placeName or description overlap
        let score = similarityScore(name + ' ' + desc, (r.title||'') + ' ' + (r.description||''));
        if (pickedLocation && r.location && pickedLocation.placeName && r.location.placeName) {
          // if both have placeName and contain same substrings -> bump score
          if ((pickedLocation.placeName + '').toLowerCase().includes((r.location.placeName||'').toLowerCase())
            || (r.location.placeName + '').toLowerCase().includes((pickedLocation.placeName||'').toLowerCase())) {
            score += 0.4;
          }
        }
        if (score >= 0.4) matches.push({ id: doc.id, score, data: r });
      });

      // if matches found: create chat doc & update both reports matchedReportId
      if (matches.length) {
        // choose top match
        matches.sort((a,b)=>b.score-a.score);
        const best = matches[0];
        await docRef.update({ matchedReportId: best.id });
        await db.collection('reports').doc(best.id).update({ matchedReportId: docRef.id });
        // create chat
        const chatRef = await db.collection('chats').add({
          members: [user.uid, best.data.uid],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          reportPair: { lost: type === 'lost' ? docRef.id : best.id, found: type === 'found' ? docRef.id : best.id }
        });
      }

      // Show success
      reportSuccess.classList.remove('hidden');
      // redirect after small delay
      setTimeout(()=> location.href = 'history-lost.html', 700);

    } catch (err) {
      console.error(err);
      reportError.textContent = err.message || 'Submit failed'; reportError.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener('click', ()=> location.href='dashboard.html');

  // Expose for debugging
  window._catchy = { similarityScore, initMap };

})();

