import { TodoListPage } from "../../pages/todomvc/todo-list.page";
import { expect, test as base } from "./data.fixture";

/** A list with one todo done and one still to do — the titles its tests expect. */
interface ListWithOneDone {
  done: string;
  toDo: string;
}

/** todomvc's Page Objects — one fixture per page its tests open, built on `page` — and the list two tests start from. */
export const test = base.extend<{ todoListPage: TodoListPage; listWithOneDone: ListWithOneDone }>({
  todoListPage: async ({ page }, use) => {
    await use(new TodoListPage(page));
  },
  // Added on the page the test's beforeEach opened: a test's own fixtures are set up after its hooks.
  listWithOneDone: async ({ todoListPage }, use) => {
    const list = { done: "buy milk", toDo: "walk the dog" };
    await base.step(
      `Setup: "${list.done}" done, "${list.toDo}" still to do`,
      () => todoListPage.addTodos([list.done, list.toDo], { completed: [list.done] }),
      { box: true },
    );
    await use(list);
  },
});

export { expect };
