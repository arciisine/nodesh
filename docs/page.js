/* eslint-disable no-undef */
function init() {
  const nav = document.querySelector('.left-nav');
  const content = document.querySelector('.content');
  /** @type {HTMLInputElement} */ const search = nav.querySelector('input[type=search]');
  /** @type {Array<HTMLAnchorElement>} */let elements;

  search.onkeypress = function () {
    search.dispatchEvent(new Event('change'));
  };


  search.oninput = search.onchange = function () {
    if (!elements) {
      elements = [...nav.querySelectorAll('a')];
    }
    const patt = new RegExp((search.value || '.').replace(/[$]/g, '[$]'), 'i');
    for (const el of elements) {
      el.classList.toggle('subdue', !patt.test(el.innerText));
    }
  };

  window.onhashchange = function (ev) {
    const id = window.location.hash.replace('$', '\\$');
    nav.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    nav.querySelectorAll(`a[href="${id}"]`).forEach(el => el.classList.add('active'));
    content.scrollTop = document.querySelector(id).offsetTop - 70;
  };
}

setTimeout(() => document.body.onload = init, 1);