/** The todo list as the screen shows it: the titles listed, the completed ones among them, and the counter. */
export function shownTodoList(list: { todos: string[]; completed?: string[]; left: number }): { todos: string[]; completed: string[]; left: string } {
  const counter = list.left === 1 ? "1 item left" : `${list.left} items left`;
  return { todos: list.todos, completed: list.completed ?? [], left: list.todos.length === 0 && list.left === 0 ? "" : counter };
}
