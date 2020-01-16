(() => {
  const MyTopbar = Webc.getModule('top-bar');

  new MyTopbar({
    name: 'top-bar',
    shadow: true,
    stylesheet: './css/topbar.css'
  });
})();