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
      // state.todos[1] = { value: 'Sleep' };
      // state.todos = state.todos;
      console.log(state.todos);
    };

    const removeTodo = () => {
      state.todos.splice(state.todos.length - 1, 1);
      state.todos = state.todos;
      console.log(state.todos);
    };

    return { state, test, addTodo, removeTodo };
  },
})