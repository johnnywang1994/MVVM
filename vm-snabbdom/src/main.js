import VM from './vw/viewmodel'

const test = {
  props: ['testname'],
  data() {
    return {
      msg: 'Hello Test',
    };
  },
  methods: {
    onClick() {
      console.log(this);
      this.msg = 'Hello Pig';
    }
  },
  render() {
    return <button onClick={this.$data.onClick}>{ this.$data.testname }</button>;
  },
};

const app = new VM({
  el: '#app',
  components: {
    test,
  },
  data: {
    name: 'Johnny',
    age: 33,
    msg: 'Hello Button'
  },
  computed: {
    info() {
      return this.name + ' ' + this.age;
    }
  },
  render({ c }) {
    const Test = this.$components.test;
    return (
      <div id="app">
        {c(Test, { testname: this.$data.name })}
        <span>{this.$data.info}</span>
      </div>
    );
  }
})

window.app = app;

// console.log(app);