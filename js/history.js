// js/history.js
function onFirebaseReady(cb){
  if (window.auth && window.db) return cb();
  window.addEventListener('firebaseReady', ()=> cb());
}

onFirebaseReady(()=>{
  auth.onAuthStateChanged(async user=>{
    if (!user) location.href='index.html';
    window.currentUser = user;

    // load lost
    async function loadLost(){
      const container = document.getElementById('lostList');
      if(!container) return;
      container.innerHTML = 'Loading...';
      const q = await db.collection('reports')
        .where('uid','==', user.uid)
        .where('type','==','lost')
        .orderBy('createdAt','desc')
        .get();
      container.innerHTML = '';
      if(q.empty) container.innerHTML = '<div class="p-3 bg-white/5 rounded">No lost reports yet</div>';
      q.forEach(doc=>{
        const r = doc.data();
        const el = document.createElement('div');
        el.className = 'p-3 bg-white/5 rounded flex justify-between';
        el.innerHTML = `
          <div>
            <div class="font-semibold">${r.title || '(no title)'}</div>
            <div class="text-xs opacity-80">${r.location?.placeName||''} • ${r.dateTime||''}</div>
            <div class="text-sm mt-2">${r.description || ''}</div>
          </div>
          <div class="text-right space-y-2">
            <div class="text-xs">${r.status || 'pending'}</div>
            <button onclick="cancelReport('${doc.id}')" class="px-2 py-1 bg-red-600 rounded text-sm">Cancel</button>
            <button onclick="deleteReport('${doc.id}')" class="px-2 py-1 bg-gray-600 rounded text-sm">Delete</button>
          </div>
        `;
        container.appendChild(el);
      });
    }

    // load found
    async function loadFound(){
      const container = document.getElementById('foundList');
      if(!container) return;
      container.innerHTML = 'Loading...';
      const q = await db.collection('reports')
        .where('uid','==', user.uid)
        .where('type','==','found')
        .orderBy('createdAt','desc')
        .get();
      container.innerHTML = '';
      if(q.empty) container.innerHTML = '<div class="p-3 bg-white/5 rounded">No found reports yet</div>';
      q.forEach(doc=>{
        const r = doc.data();
        const el = document.createElement('div');
        el.className = 'p-3 bg-white/5 rounded flex justify-between';
        el.innerHTML = `
          <div>
            <div class="font-semibold">${r.title || '(no title)'}</div>
            <div class="text-xs opacity-80">${r.location?.placeName||''} • ${r.dateTime||''}</div>
            <div class="text-sm mt-2">${r.description || ''}</div>
          </div>
          <div class="text-right space-y-2">
            <div class="text-xs">${r.status || 'pending'}</div>
            <button onclick="markCompleted('${doc.id}')" class="px-2 py-1 bg-green-600 rounded text-sm">Mark Returned</button>
            <button onclick="deleteReport('${doc.id}')" class="px-2 py-1 bg-gray-600 rounded text-sm">Delete</button>
          </div>
        `;
        container.appendChild(el);
      });
    }

    window.deleteReport = async (id) => {
      if (!confirm('Delete this report?')) return;
      await db.collection('reports').doc(id).delete();
      loadLost(); loadFound();
    };

    window.cancelReport = async (id) => {
      await db.collection('reports').doc(id).update({ status: 'cancelled' });
      loadLost();
    };

    window.markCompleted = async (id) => {
      await db.collection('reports').doc(id).update({ status: 'found' });
      loadFound();
    };

    // initial load calls
    loadLost(); loadFound();
  });
});


