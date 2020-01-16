(() => {
  new Webc('my-app', {
    html: `
      <div id="app">
        <% Topbar %>
        <% Content %>
      </div>
    `
  });

  new Webc('top-bar', {
    html: `
      <div class="topbar">
        <ul>
          <li>Home</li>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </div>
    `
  });

  new Webc('body-content', {
    html: `
      <div>
        {{ msg }}
      </div>
    `
  })
})();