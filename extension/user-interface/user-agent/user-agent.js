import {read, store} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const selectMenus = document.querySelectorAll('.custom-select');
  const checkbox = document.querySelector('input[type="checkbox"]');
  const list = ['device', 'os', 'browser'];

  selectMenus.forEach(giveReactivity);
  list.forEach(addListener);

  list.forEach(async (id) => {
    const value = await read(`agent-${id}`);
    if (!value) return;

    const select = document.querySelector(`#${id} .selected-value`);
    select.textContent = value;

    select.dispatchEvent(new Event('modified'));
  });

  checkbox.checked = await read('actualAgent');
  checkbox.addEventListener('change', async () => {
    if (checkbox.checked) selectMenus.forEach((select) => select.classList.add('disabled'));
    else selectMenus.forEach((select) => select.classList.remove('disabled'));

    await store('actualAgent', checkbox.checked);
    chrome.runtime.sendMessage({type: 'userAgent'});
  });
});

function giveReactivity(select) {
  const display = select.querySelector('.selected-value');
  const list = select.querySelector('ul');

  select.onclick = (e) => {
    if (select.classList.contains('disabled')) return;
    if (!list.contains(e.target) || e.target.tagName === 'LI') {
      select.classList.toggle('open');
    }
  };

  list.querySelectorAll('li').forEach((li) => {
    li.onclick = () => {
      display.textContent = li.textContent;
      display.dispatchEvent(new Event('modified'));
    };
  });

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.custom-select.open').forEach((select) => {
      if (!select.contains(e.target)) {
        select.classList.remove('open');
      }
    });
  });
}

function addListener(id) {
  const select = document.querySelector(`#${id} .selected-value`);
  select.addEventListener('modified', async () => {
    if (id === 'device') {
      const oses = document.querySelectorAll(`#os li`);
      const devices = select.textContent.toLowerCase();

      oses.forEach((os) => {
        os.classList.remove('hidden');
        if (!os.classList.contains(devices)) {
          os.classList.add('hidden');
        }
      });

      const selectValue = document.querySelector(`#os .selected-value`);
      const firstResult = document.querySelector(`#os .${devices}`);

      selectValue.textContent = firstResult.textContent;
      selectValue.dispatchEvent(new Event('modified'));
      return;
    }

    await store(`agent-${id}`, select.textContent);
    chrome.runtime.sendMessage({type: 'userAgent'});
  });
}
