(() => {
  const MyApp = Webc.getModule('my-app');

  const App = new MyApp({
    components: {
      Topbar: Webc.getComponent('top-bar'),
      Content: Webc.getComponent('body-content')
    }
  });

  document.body.insertBefore(App, document.body.firstChild);
})();