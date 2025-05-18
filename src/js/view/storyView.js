import { deleteCeritaById, getAllLocalStories } from "../model/indexedDB.js";

const storyView = {
  render(stories) {
    const container = document.createElement("div");
    container.id = "main-content";
    container.tabIndex = 0;

    const listContainer = document.createElement("ul");

    if (stories.length === 0) {
      const noStoriesMessage = document.createElement("p");
      noStoriesMessage.textContent = "Tidak ada cerita untuk ditampilkan.";
      listContainer.appendChild(noStoriesMessage);
    } else {
      stories.forEach((story, index) => {
        const storyItem = document.createElement("li");
        storyItem.classList.add("story-card");

        const mapId = `map-${index}`;
        const osmLink = (story.lat != null && story.lon != null) 
          ? `https://www.openstreetmap.org/?mlat=${story.lat}&mlon=${story.lon}#map=15/${story.lat}/${story.lon}` 
          : "#";
        const createdDate = new Date(story.createdAt).toLocaleDateString("id-ID");

        storyItem.innerHTML = `
          <div class="story-container" style="position: relative;">
            <h3>${story.name || "Tanpa Nama"}</h3>
            <p class="story-date">🕒 Dibuat pada: ${createdDate}</p>
            <div class="story-flex">
              <div class="story-left">
                ${story.photoUrl || story.imageBlob ? `
                  <img 
                    src="${story.photoUrl || URL.createObjectURL(story.imageBlob)}" 
                    alt="Foto cerita dari ${story.name || "pengguna"}" 
                    class="story-photo" 
                    style="max-width: 300px; border-radius: 8px;"
                  />
                ` : ""}
                <p><em>"${story.description || ""}"</em></p>
              </div>
              <div class="story-right">
                <div id="${mapId}" class="map-box" aria-label="Peta lokasi cerita" style="height: 250px;"></div>
                ${ (story.lat != null && story.lon != null) 
                    ? `<p><a href="${osmLink}" target="_blank" rel="noopener">📍 Lihat lokasi di OpenStreetMap</a></p>` 
                    : `<p><em>Lokasi tidak tersedia</em></p>`
                }
              </div>
            </div>

            <div class="dropdown" style="position: absolute; top: 10px; right: 10px;">
              <button class="dropdown-toggle" aria-label="Menu cerita" style="background: #fff; border: 1px solid #ccc; border-radius: 6px; width: 32px; height: 32px; font-size: 1.2em; color: #000; cursor: pointer;">⋮</button>
              <ul class="dropdown-menu" data-id="${story.id}" style="display: none; position: absolute; right: 0; margin-top: 6px; background-color: white; box-shadow: 0px 2px 6px rgba(0,0,0,0.2); border-radius: 6px; z-index: 999; list-style: none; padding: 0; min-width: 140px;">
                <li><button class="edit-btn" style="width: 100%; padding: 10px; text-align: left; background: none; border: none; cursor: pointer;">✏️ Ubah Cerita</button></li>
                <li><button class="hapus-btn" style="width: 100%; padding: 10px; text-align: left; background: none; border: none; cursor: pointer;">🗑️ Hapus Cerita</button></li>
              </ul>
            </div>
          </div>
        `;

        listContainer.appendChild(storyItem);

        if (story.lat != null && story.lon != null) {
          setTimeout(() => {
            if (L.DomUtil.get(mapId) !== null) {
              L.DomUtil.get(mapId)._leaflet_id = null;
            }

            const map = L.map(mapId).setView([story.lat, story.lon], 13);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap contributors",
            }).addTo(map);

            const marker = L.marker([story.lat, story.lon]).addTo(map);
            marker.bindPopup(`<strong>${story.name || "Pengguna"}</strong><br>${story.description || ""}`);

            map.scrollWheelZoom.disable();
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();

            storyItem.addEventListener("click", () => {
              marker.openPopup();
              map.setView([story.lat, story.lon], 13);
            });
          }, 100);
        } else {
          const mapContainer = document.getElementById(mapId);
          if (mapContainer) {
            mapContainer.textContent = "Lokasi tidak tersedia";
            mapContainer.style.display = "flex";
            mapContainer.style.alignItems = "center";
            mapContainer.style.justifyContent = "center";
            mapContainer.style.fontStyle = "italic";
            mapContainer.style.color = "#777";
          }
        }
      });
    }

    container.appendChild(listContainer);

    listContainer.addEventListener("click", async (e) => {
      const target = e.target;
      const dropdownToggle = target.closest(".dropdown-toggle");
      const editBtn = target.closest(".edit-btn");
      const hapusBtn = target.closest(".hapus-btn");

      if (dropdownToggle) {
        const dropdownMenu = dropdownToggle.nextElementSibling;
        document.querySelectorAll(".dropdown-menu").forEach((menu) => {
          if (menu !== dropdownMenu) menu.style.display = "none";
        });
        dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
        e.stopPropagation();
        return;
      }

      if (hapusBtn) {
        const storyId = hapusBtn.closest(".dropdown-menu")?.dataset?.id;
        try {
          await deleteCeritaById(storyId);
          const updatedStories = await getAllLocalStories();
          this.render(updatedStories);
        } catch (error) {
          console.error("Gagal menghapus cerita:", error);
          alert("Gagal menghapus cerita.");
        }
      }

      if (editBtn) {
        const storyId = editBtn.closest(".dropdown-menu")?.dataset?.id;
        window.location.hash = `#/update/${storyId}`;
      }
    });

    document.addEventListener("click", () => {
      document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        menu.style.display = "none";
      });
    });

    const app = document.getElementById("app");
    app.innerHTML = "";

    const skipLink = document.createElement("a");
    skipLink.href = "#main-content";
    skipLink.textContent = "Lewati ke konten utama";
    skipLink.className = "skip-link";
    skipLink.addEventListener("click", (event) => {
      event.preventDefault();
      container.focus();
    });

    app.appendChild(skipLink);
    app.appendChild(container);
  },

  renderError(message) {
    const container = document.createElement("div");
    container.id = "main-content";
    container.tabIndex = 0;

    const error = document.createElement("p");
    error.className = "error-message";
    error.textContent = message;

    container.appendChild(error);

    const app = document.getElementById("app");
    app.innerHTML = "";

    const skipLink = document.createElement("a");
    skipLink.href = "#main-content";
    skipLink.textContent = "Lewati ke konten utama";
    skipLink.className = "skip-link";
    skipLink.addEventListener("click", (event) => {
      event.preventDefault();
      container.focus();
    });

    app.appendChild(skipLink);
    app.appendChild(container);
  },
};

export default storyView;