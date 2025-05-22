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

    // Minta izin notifikasi jika belum granted
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
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
      const compressedBlob = await this.compressImage(storyData.imageBlob);

      const formData = new FormData();
      formData.append('description', storyData.description);
      formData.append('lat', storyData.lat);
      formData.append('lon', storyData.lon);
      formData.append('photo', compressedBlob, 'compressed.jpg');

      await postStory(token, formData);

      alert('✅ Cerita berhasil dikirim!');
      this.showLocalNotification('Cerita Baru', {
        body: 'Cerita kamu berhasil dikirim ke server.',
        icon: '/icons/icon-192.png',
      });

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
        // Kompres gambar agar tidak terlalu besar saat upload
        const compressedBlob = await this.compressImage(story.imageBlob);

        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('lat', story.lat);
        formData.append('lon', story.lon);
        formData.append('photo', compressedBlob, 'image.jpg');

        await postStory(token, formData);
        successCount++;
      } catch (err) {
        console.error("Gagal sinkronisasi cerita:", err.message);
      }
    }

    if (successCount > 0) {
      await clearLocalStories();
      alert(`✅ ${successCount} cerita offline berhasil disinkronkan.`);

      this.showLocalNotification('Sinkronisasi Cerita', {
        body: `${successCount} cerita offline berhasil dikirim ke server.`,
        icon: '/icons/icon-192.png',
      });
    }
  },

  compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.src = URL.createObjectURL(file);
    });
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

  showLocalNotification(title, options) {
    if (!("Notification" in window)) {
      console.log("Browser tidak mendukung Notifikasi");
      return;
    }

    if (Notification.permission === "granted") {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.showNotification(title, options)
            .then(() => console.log("Notifikasi lokal dikirim lewat service worker"))
            .catch(e => console.error("Gagal kirim notifikasi lewat SW:", e));
        } else {
          try {
            new Notification(title, options);
            console.log("Notifikasi lokal dikirim lewat Notification API langsung");
          } catch (e) {
            console.error("Gagal kirim notifikasi langsung:", e);
          }
        }
      });
    } else {
      console.log("Izin notifikasi belum granted");
    }
  },

  destroy() {
    addStoryView.destroy();
    window.removeEventListener('online', this._boundSyncHandler);
  }
};

export default addStoryPresenter;