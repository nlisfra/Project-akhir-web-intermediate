const updateView = {
  render(container, story, onSubmit) {
    container.innerHTML = `
      <h2>Update Cerita</h2>
      <form id="update-story-form">
        <label>
          Nama:
          <input type="text" name="name" value="${story.name || ''}" required />
        </label>
        <br/>
        <label>
          Deskripsi:
          <textarea name="description" required>${story.description || ''}</textarea>
        </label>
        <br/>
        <label>
          Latitude:
          <input type="number" step="any" name="lat" value="${story.lat || ''}" required />
        </label>
        <br/>
        <label>
          Longitude:
          <input type="number" step="any" name="lon" value="${story.lon || ''}" required />
        </label>
        <br/>
        <label>
          URL Foto (opsional):
          <input type="url" name="photoUrl" value="${story.photoUrl || ''}" />
        </label>
        <br/>
        <button type="submit">Update Cerita</button>
        <button type="button" id="cancel-btn">Batal</button>
      </form>
    `;

    const form = container.querySelector("#update-story-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const updatedData = {
        name: formData.get("name").trim(),
        description: formData.get("description").trim(),
        lat: parseFloat(formData.get("lat")),
        lon: parseFloat(formData.get("lon")),
        photoUrl: formData.get("photoUrl").trim() || null,
      };

      onSubmit(updatedData);
    });

    container.querySelector("#cancel-btn").addEventListener("click", () => {
      window.location.hash = "#/stories";
    });
  },
};


export default updateView;