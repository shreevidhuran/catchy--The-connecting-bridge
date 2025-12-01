// js/dashboard.js
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const userNameEl = document.getElementById('userName');
const btnLogout = document.getElementById('btnLogout');
const reportForm = document.getElementById('reportForm');
const imagesInput = document.getElementById('images');
const thumbs = document.getElementById('thumbs');
const statusEl = document.getElementById('status');
const startVoiceBtn = document.getElementById('startVoice');
const speechLang = document.getElementById('speechLang');

let currentUser = null;
let map, mapPins = [];

// Require logged-in user
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;
  userNameEl.textContent = user.displayName || user.email;
  initMap();
  loadRecentTiles();
});

btnLogout.addEventListener('click', ()=> auth.signOut().then(()=> window.location.href='index.html') );

// Map init (Leaflet)
function initMap(){
  if(map) return;
  map = L.map('map').setView([9.9252, 78.1198], 13); // center: Tamil Nadu / change as needed
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  // click to add marker
  map.on('click', (e)=>{
    const m = L.marker(e.latlng, {draggable:true}).addTo(map);
    mapPins.push({lat:e.latlng.lat, lng:e.latlng.lng});
    m.bindPopup('Pin').openPopup();
  });
}

// Thumbnail preview
imagesInput.addEventListener('change', (ev)=>{
  thumbs.innerHTML = '';
  const files = Array.from(ev.target.files).slice(0,6);
  files.forEach(file=>{
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.className = 'thumb';
    thumbs.appendChild(img);
  });
});

// Speech recognition (Web Speech API)
let recognition = null;
if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
}
startVoiceBtn.addEventListener('click', ()=>{
  if(!recognition){ alert('Voice recognition not supported in this browser. Use Chrome.'); return; }
  recognition.lang = speechLang.value || 'en-IN';
  recognition.start();
  startVoiceBtn.textContent = 'Listening...';
});
if(recognition){
  recognition.onresult = (ev) => {
    const text = ev.results[0][0].transcript;
    const desc = document.getElementById('desc');
    desc.value = (desc.value ? desc.value + '\n' : '') + text;
    startVoiceBtn.textContent = '🎤 Record voice';
  };
  recognition.onerror = (e)=> {
    startVoiceBtn.textContent = '🎤 Record voice';
    console.warn('Speech error', e);
  };
}

// Submit report: upload images to Storage, create Firestore doc
reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!currentUser) { alert('Not logged in'); return; }

  const type = document.getElementById('reportType').value;
  const title = document.getElementById('title').value.trim();
  const desc = document.getElementById('desc').value.trim();
  const files = Array.from(imagesInput.files);

  statusEl.textContent = 'Uploading...';
  try {
    // 1. upload images to Storage
    const imageURLs = [];
    for (let i=0;i<files.length;i++){
      const f = files[i];
      const path = `reports/${currentUser.uid}/${Date.now()}_${i}_${f.name}`;
      const snap = await storage.ref(path).put(f);
      const url = await snap.ref.getDownloadURL();
      imageURLs.push(url);
    }

    // 2. save Firestore doc
    const report = {
      ownerUid: currentUser.uid,
      ownerEmail: currentUser.email,
      title,
      description: desc,
      type,
      images: imageURLs,
      pins: mapPins, // array of {lat,lng}
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'open',
      views: 0,
      matchedTo: null
    };

    const docRef = await db.collection('reports').add(report);
    statusEl.textContent = 'Report saved';
    // clear form
    reportForm.reset();
    thumbs.innerHTML = '';
    mapPins = [];
    // add simple local tile to show success (could be improved)
    alert('Report submitted (id: ' + docRef.id + '). We will build matching next.');
  } catch (err){
    console.error(err);
    statusEl.textContent = 'Error: ' + err.message;
  }
});

// load recent tiles (show last few reports) - placeholder
async function loadRecentTiles(){
  const c = document.getElementById('lastItem');
  // load 3 latest reports
  const snapshot = await db.collection('reports').orderBy('createdAt','desc').limit(5).get();
  // For now we just set their titles as innerText for demo
  const list = [];
  snapshot.forEach(d=>{
    const data = d.data();
    list.push(data.title || (data.type || 'report'));
  });
  c.textContent = 'Last items: ' + (list.join(' • ') || 'none');
}
