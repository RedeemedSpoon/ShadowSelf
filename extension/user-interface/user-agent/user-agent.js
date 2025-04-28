document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.custom-select').forEach(giveReactivity);

  ['device', 'os', 'browser'].forEach((id) => {
    const select = document.querySelector(`#${id} .selected-value`);
    select.addEventListener('modified', () => {
      // Change user agent
    });
  });

  const checkbox = document.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', () => {
    // Toggle actual user agent
  });
});

function giveReactivity(select) {
  const display = select.querySelector('.selected-value');
  const list = select.querySelector('ul');

  select.onclick = (e) => {
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
