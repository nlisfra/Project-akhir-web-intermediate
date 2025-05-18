import updateView from '../view/updateView.js';
import { getStoryById, updateStory } from '../model/indexedDB.js';

const updateStoryPresenter = {
  async init(container, storyId) {
    try {
      const story = await getStoryById(storyId);
      if (!story) {
        container.innerHTML = `<p>Data cerita tidak ditemukan.</p>`;
        return;
      }

      updateView.render(container, story, async (updatedData) => {
        try {
          await updateStory(storyId, updatedData);
          alert('Cerita berhasil diupdate!');
          window.location.hash = '#/stories';
        } catch (error) {
          alert('Gagal mengupdate cerita.');
          console.error(error);
        }
      });
    } catch (error) {
      container.innerHTML = `<p>Terjadi kesalahan saat memuat cerita.</p>`;
      console.error(error);
    }
  },

  destroy() {
  }
};

export default updateStoryPresenter;