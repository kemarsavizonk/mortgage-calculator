  const menuToggle = document.querySelector('.menu-toggle');
  const menuPanel = document.querySelector('.menu-panel');

  function closeMenu(){
    menuPanel.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
  }

  menuToggle.addEventListener('click', event => {
    event.stopPropagation();
    const willOpen = menuPanel.hidden;
    menuPanel.hidden = !willOpen;
    menuToggle.setAttribute('aria-expanded', String(willOpen));
    menuToggle.setAttribute('aria-label', willOpen ? 'Close navigation menu' : 'Open navigation menu');
    if(willOpen) menuPanel.querySelector('a').focus();
  });

  document.addEventListener('click', event => {
    if(!event.target.closest('.site-menu')) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if(event.key === 'Escape' && !menuPanel.hidden){
      closeMenu();
      menuToggle.focus();
    }
  });
