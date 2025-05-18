import addStoryView from '../view/addStoryView.js';
import { postStory } from '../model/api.js';
import { addLocalStory, getAllLocalStories, clearLocalStories } from '../model/indexedDB.js';

const addStoryPresenter = {
  async init(container) {
    container.innerHTML = '';
    addStoryView.render();
    addStoryView.bindSubmit(this.handleSubmit.bind(this));

    this._boundSyncHandler = this.syncOfflineStories.bind(this);

    this.insertSyncButton();

    window.addEventListener('online', this._boundSyncHandler);

    if (navigator.onLine) {
      this.syncOfflineStories();
    }
  },

  insertSyncButton() {
    const storyListContainer = document.querySelector("#story-list") || document.querySelector(".container");
    if (storyListContainer && !document.querySelector(".sync-button")) {
      const syncButton = document.createElement("button");
      syncButton.textContent = "🔄 Sinkronkan Cerita Offline";
      syncButton.classList.add("sync-button");
      syncButton.addEventListener("click", () => {
        this.syncOfflineStories();
      });
      storyListContainer.appendChild(syncButton);
    }
  },

  async handleSubmit({ description, imageBlob, lat, lon }) {
    if (!description || !imageBlob || lat === null || lon === null) {
      alert('Pastikan semua data diisi, foto diambil, dan lokasi dipilih.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Silakan login terlebih dahulu.');
      window.location.hash = '#/login';
      return;
    }

    const storyData = {
      id: Date.now().toString(),
      description,
      imageBlob,
      lat,
      lon,
      createdAt: new Date().toISOString()
    };

    if (!navigator.onLine) {
      await addLocalStory(storyData);
      alert('Anda sedang offline. Cerita disimpan dan akan dikirim saat online.');
      window.location.hash = '#/stories';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('description', storyData.description);
      formData.append('lat', storyData.lat);
      formData.append('lon', storyData.lon);
      formData.append('photo', storyData.imageBlob, 'image.jpg');

      await postStory(token, formData);

      alert('✅ Cerita berhasil dikirim!');
      window.location.hash = '#/stories';
    } catch (err) {
      console.error(err);
      await addLocalStory(storyData);
      alert('❌ Gagal mengirim cerita. Disimpan secara lokal dan akan dikirim saat online.');
      window.location.hash = '#/stories';
    }
  },

  async syncOfflineStories() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const localStories = await getAllLocalStories();

  if (localStories.length === 0) return;

  let successCount = 0;

  for (const story of localStories) {
    try {
      const formData = new FormData();
      formData.append('description', story.description);
      formData.append('lat', story.lat);
      formData.append('lon', story.lon);
      formData.append('photo', story.imageBlob, 'image.jpg');

      await postStory(token, formData);
      successCount++;
    } catch (err) {
      console.error("Gagal sinkronisasi cerita:", err.message);
    }
  }

  if (successCount > 0) {
    await clearLocalStories();
    alert(`✅ ${successCount} cerita offline berhasil disinkronkan.`);
  }
},
  takeScreenshot() {
    const target = document.querySelector('.container');
    if (!target) return;

    html2canvas(target).then(canvas => {
      const link = document.createElement('a');
      link.download = 'screenshot.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  },

  destroy() {
    addStoryView.destroy();
    window.removeEventListener('online', this._boundSyncHandler);
  }
};

export default addStoryPresenter;