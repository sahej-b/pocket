const dropZone = document.getElementById('dropZone');
const fileGrid = document.getElementById('fileGrid');

const dbName = 'LocalFileStore';
let db;

window.onload = () => {
  initDB().then(loadFiles);
};

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = (e) => {
      db = e.target.result;
      db.createObjectStore('files', { keyPath: 'id' });
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };
    request.onerror = () => reject();
  });
}

function saveFile(file, dataURL) {
  const id = Date.now().toString();
  const fileRecord = {
    id,
    name: file.name,
    type: file.type,
    data: dataURL,
  };
  const tx = db.transaction('files', 'readwrite');
  const store = tx.objectStore('files');
  store.put(fileRecord);
  tx.oncomplete = () => loadFiles();
}

function loadFiles() {
  fileGrid.innerHTML = '';
  const tx = db.transaction('files', 'readonly');
  const store = tx.objectStore('files');
  const request = store.getAll();

  request.onsuccess = () => {
    const files = request.result.sort((a, b) => b.id - a.id);
    files.forEach(displayFile);
  };
}

function deleteFile(id) {
  const tx = db.transaction('files', 'readwrite');
  const store = tx.objectStore('files');
  store.delete(id);
  tx.oncomplete = () => loadFiles();
}

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.background = '#eef';
});

dropZone.addEventListener('dragleave', () => {
  dropZone.style.background = '#fff';
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.background = '#fff';
  const files = Array.from(e.dataTransfer.files);
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      saveFile(file, reader.result);
    };
    reader.readAsDataURL(file);
  });
});

function displayFile(file) {
  const card = document.createElement('div');
  card.className = 'file-card';

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = file.data;
    img.className = 'file-preview';
    card.appendChild(img);
  } else {
    const icon = document.createElement('div');
    icon.className = 'file-icon';
    icon.textContent = '📄';
    card.appendChild(icon);
  }

  const name = document.createElement('div');
  name.textContent = file.name;
  card.appendChild(name);

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.onclick = () => copyToClipboard(file);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = () => deleteFile(file.id);

  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);
  card.appendChild(actions);

  fileGrid.appendChild(card);
}

function copyToClipboard(file) {
  if (file.type.startsWith('image/')) {
    fetch(file.data)
      .then(res => res.blob())
      .then(blob => navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]));
  } else {
    const blob = new Blob([atob(file.data.split(',')[1])], { type: file.type });
    navigator.clipboard.write([new ClipboardItem({ [file.type]: blob })]);
  }
}