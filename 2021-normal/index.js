new View({
  el: '#app',
  setup() {
    const state = {
      msg: 'Hello Msg',
      htmlStr: '<span>Hello World</span>',
      showState: true,
      todos: [
        { value: 'Jump' },
        { value: 'Run' },
      ],
    };

    const test = () => {
      state.msg = 'wow';
      state.showState = !state.showState;
      return 'Test Message';
    };

    const addTodo = () => {
      state.todos = [...state.todos, { value: 'Sleep' }];
      // state.todos[0].value = 'Sleep';
    };

    const removeTodo = () => {
      state.todos.splice(state.todos.length - 1, 1);
      console.log(state.todos);
    };

    return { state, test, addTodo, removeTodo };
  },
})