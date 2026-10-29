import { TodoListPage } from "../../pages/todomvc/todo-list.page";
import { expect, test as base } from "./data.fixture";

/** todomvc's Page Objects — one fixture per page its tests open, built on `page`. */
export const test = base.extend<{ todoListPage: TodoListPage }>({
  todoListPage: async ({ page }, use) => {
    await use(new TodoListPage(page));
  },
});

export { expect };
