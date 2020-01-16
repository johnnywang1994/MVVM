## Component.js



### Introduction

This is a practical library, created to combined WebComponent API with MVVM.

Including Custom element API, Shadow root API.(Template API is not)

By creating a web component instance first, we can easily create a component later when we need,

Also, it's easy to put a created component into another component module.



### Documentation

Webc is the component creater which let us create a component module without any real data.



#### Beginning

So the first thing is to create one module:

```javascript
const MyButton = new Webc('my-button', {
  html: '<button>Confirm</button>'
});
```

By passing `html` property into the second options, it's stored as a string template for later using.

And it will return a Custom Element Class which ready for us to create custom element.

Now if we want to create a real web component to use, we can write as:

```javascript
const Btn = new MyButton();

// append to body
document.body.appendChild(Btn);
```

The `Btn` is now a vanilla JS DOM node, we can control it whatever we want.



#### Literal Template

In the background, `Webc` will create a tiny MVVM system inside the Class,

We can write things like `{{ msg }}` inside `html`, then provide the `data` property when creating the 

component, here is the demo:

```javascript
const MyButton = new Webc('my-button', {
  html: '<button>{{ text }}</button>'
});

const Btn = new MyButton({
  data: {
    text: 'Button'
  }
});
```

`Webc` will compile the `html` once Class has been called, and the data inside is interactive bined with

the view, when data changed, view changed too.

We can get the entire MVVM data in `$vm` property in `Btn`

```javascript
// we change data
Btn.$vm.text = 'New Button Text';

// --> View changed(if Btn had been appended into somewhere)
```



#### Event Binding

Event Binding is also easy in Webc html, use `w-on` attribute API, we can add all types of event to the 

target node DOM as below:

```javascript
const MyButton = new Webc('my-button', {
  html: '<button w-on:click="clickHandler">{{ text }}</button>'
});
```

Then pass `methods` when creating component:

```javascript
const Btn = new MyButton({
  data: {
    text: 'Button'
  },
  methods: {
    clickHandler(event) {
      console.log('Hello');
      console.log(this); // target to Btn.$vm
      console.log(event); // vanilla event object
    }
  }
});
```



#### Text, HTML render

If you would like to render a text node or html into somewhere. Just use `w-text`, `w-html`:

```javascript
const MyTopic = new Webc('my-topic', {
  html: `
    <div>
      <p w-text="myText"></p>
      <p w-html="myHTML"></p>
    </div>
  `
});

const Topic = new MyTopic({
  data: {
    myText: 'This is a topic content',
    myHTML: 'This is a HTML<br>content'
  }
});
```



#### Toggle Display

Use `w-show` to define whether node to be shown or not.

```javascript
const MyTopic = new Webc('my-topic', {
  html: `
    <div>
      <p w-show="showContent"></p>
    </div>
  `
});

const Topic = new MyTopic({
  data: {
    showContent: false
  }
});
```



#### Replace Node

Use `w-replace` can replace the target node, be noted that is will break the node's interactive effect.

This directive is created for replacing component inside another one:

```javascript
const BaseContent = new Webc('my-content', {
  html: '<p>Some content here</p>'
});

const BaseApp = new Webc('my-app', {
  html: `
    <div id="app">
      <h3>Title</h3>
      <span w-replace="myContent"></span>
    </div>
  `
});

const App = new BaseApp({
  components: {
    myContent: new BaseContent()
  }
});
```

This will replace `<span w-replace="myContent"></span>` into `<my-content><p>Some content here</p></my-content>`

And data inside that component will also be interactive to any changes.

You can put component into `components` or `data`, we recommend you putting in components for better reading purpose.



#### Component Alias

It could be terrible to write `w-replace` directives when using multiple components together,

we can use `<% Btn %>` for an alias, it will automatically be compiled into `<span w-replace="Btn"></span>`

and then replaced by system in the background.

```javascript
const BaseApp = new Webc('my-app', {
  html: `
    <div id="app">
      <h3>Title</h3>
      <% myContent %>
    </div>
  `
});
```



#### Shadow Root

When app growing bigger, CSS will also become a huge monster, avoiding CSS naming conflict is also a work,

we can use `shadow` property to tell the Component whether to use open Shadow root.

```javascript
const Topic = new MyTopic({
  shadow: true, // create #shadow-root(open)
  data: {
    showContent: false
  }
});
```

By adding shadow root, styles inside the component will become scoped in itself.



#### External Style

We can insert a `<link>` element inside the component by easily adding `stylesheet` property, 

and give the path to that CSS file.

```javascript
const Topic = new MyTopic({
  shadow: true,
  stylesheet: './style.css', // will insert <link> tag before the content
  data: {
    showContent: false
  }
});
```



#### Customize

Use `customize` as a function to do things right before mounting nodes to element root.

```javascript
const btn = new MyButton({
  shadow: true,
  customize() {
    console.log(this); // the component DOM instance
  }
});
```