import { getStories } from "../model/api.js";
import storyView from "../view/storyView.js";
import { getAllLocalStories } from '../model/indexedDB.js';

const storyPresenter = {
  async init(container) {
    container.innerHTML = "";

    const authToken = localStorage.getItem("token");
    if (!authToken) {
      alert("Silakan login terlebih dahulu.");
      window.location.hash = "#/login";
      return;
    }

    try {
      if (navigator.onLine) {
        const storyList = await getStories(authToken);
        storyView.render(storyList);
      } else {
        // Ambil dari local DB saat offline
        const localStories = await getAllLocalStories();
        storyView.render(localStories);
      }
    } catch (err) {
      storyView.renderError(`Gagal memuat data cerita: ${err.message}`);
    }
  },

  destroy() {},
};

export default storyPresenter;