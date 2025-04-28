document.addEventListener('DOMContentLoaded', async () => {
  const selectMenus = document.querySelectorAll('.custom-select');
  selectMenus.forEach(giveReactivity);

  ['device', 'os', 'browser'].forEach((id) => {
    const select = document.querySelector(`#${id} .selected-value`);
    select.addEventListener('modified', () => {
      // Change user agent
    });
  });

  const checkbox = document.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) selectMenus.forEach((select) => select.classList.add('disabled'));
    else selectMenus.forEach((select) => select.classList.remove('disabled'));
    // Toggle actual user agent
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
