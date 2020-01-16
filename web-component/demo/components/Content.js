(() => {
  const Content = Webc.getModule('body-content');

  new Content({
    data: {
      msg: 'Hello World'
    }
  });
})();