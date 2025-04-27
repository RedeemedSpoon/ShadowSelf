document.addEventListener('DOMContentLoaded', async () => {
  addSelectionOption();
});

function addSelectionOption() {
  document.querySelectorAll('.custom-select').forEach((select) => {
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
      };
    });
  });

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.custom-select.open').forEach((select) => {
      if (!select.contains(e.target)) {
        select.classList.remove('open');
      }
    });
  });
}
