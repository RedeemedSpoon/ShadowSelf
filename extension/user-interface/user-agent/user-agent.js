import {read, store} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const selectMenus = document.querySelectorAll('.custom-select');
  const checkbox = document.querySelector('input[type="checkbox"]');
  const list = ['device', 'os', 'browser'];

  selectMenus.forEach(giveReactivity);
  list.forEach(addListener);

  list.forEach(async (id) => {
    if (id === 'device') {
      const select = document.querySelector(`#${id} .selected-value`);
      const value = await read('agent-os');
      if (!value) return;

      if (['Windows', 'macOS', 'Linux', 'ChromeOS'].includes(value)) {
        select.textContent = 'Laptop';
      } else if (['iPadOS', 'FireOS'].includes(value)) {
        select.textContent = 'Tablet';
      } else {
        select.textContent = 'Phone';
      }

      select.dispatchEvent(new Event('modified'));
      return;
    }

    const value = await read(`agent-${id}`);
    if (!value) return;

    const select = document.querySelector(`#${id} .selected-value`);
    select.textContent = value;

    select.dispatchEvent(new Event('modified'));
  });

  checkbox.addEventListener('change', async () => {
    if (checkbox.checked) selectMenus.forEach((select) => select.classList.add('disabled'));
    else selectMenus.forEach((select) => select.classList.remove('disabled'));

    await store('actualAgent', checkbox.checked);
    chrome.runtime.sendMessage({type: 'userAgent'});
  });

  checkbox.checked = await read('actualAgent');
  checkbox.dispatchEvent(new Event('change'));
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
