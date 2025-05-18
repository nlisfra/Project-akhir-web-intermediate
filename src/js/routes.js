import loginPresenter from './presenter/loginPresenter.js';
import registerPresenter from './presenter/registerPresenter.js';
import storyPresenter from './presenter/ceritaPresenter.js';
import addStoryPresenter from './presenter/addStoryPresenter.js';
import updateStoryPresenter from './presenter/updateStoryPresenter.js';
import notFoundView from './view/notFoundView.js';

const routes = {
  '#/login': loginPresenter,
  '#/register': registerPresenter,
  '#/stories': storyPresenter,
  '#/add': addStoryPresenter,
  // route dinamis update story akan ditangani secara manual di router()
};

let currentPresenter = null;

async function router() {
  const container = document.getElementById('app');

  if (currentPresenter && typeof currentPresenter.destroy === 'function') {
    currentPresenter.destroy();
  }

  const hash = window.location.hash || '#/login';

  if (hash.startsWith('#/update/')) {
    const storyId = hash.split('/')[2];
    currentPresenter = updateStoryPresenter;
    await currentPresenter.init(container, storyId);
    return;
  }

  const presenter = routes[hash];
  if (presenter && typeof presenter.init === 'function') {
    currentPresenter = presenter;
    await presenter.init(container);
  } else {
    container.innerHTML = '';
    notFoundView.render();
  }
}
function initRoutes() {
  window.addEventListener('hashchange', router);
  window.addEventListener('DOMContentLoaded', router);
}

export { initRoutes, router };