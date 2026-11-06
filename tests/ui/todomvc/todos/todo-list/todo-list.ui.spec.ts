import { shownTodoList } from "src/assertions/todomvc/todo-list";
import { expect, test } from "src/fixtures/todomvc/test";
import { severity } from "src/reporting/severity";

test.describe("Todos — Todo list", () => {
  test.beforeEach(async ({ todoListPage }) => {
    await todoListPage.open();
  });

  test(
    "A typed todo appears in the list and in the counter",
    { tag: ["@ui", "@regression", "@smoke"], annotation: severity.critical },
    async ({ todoListPage }) => {
      await test.step('Add the todo "buy milk" and verify the list and the counter', async () => {
        await todoListPage.add("buy milk");
        expect(await todoListPage.read(), "The todo list").toEqual(shownTodoList({ todos: ["buy milk"], left: 1 }));
      });
    },
  );

  test(
    "A completed todo leaves the items-left counter",
    { tag: ["@ui", "@regression"], annotation: severity.major },
    async ({ todoListPage }) => {
      await test.step('Setup: add "buy milk" and "walk the dog"', () => todoListPage.addTodos(["buy milk", "walk the dog"]));
      await test.step('Complete "buy milk" and verify the counter', async () => {
        await todoListPage.complete("buy milk");
        expect(await todoListPage.read(), "The todo list").toEqual(
          shownTodoList({ todos: ["buy milk", "walk the dog"], completed: ["buy milk"], left: 1 }),
        );
      });
    },
  );

  test(
    "The Active and Completed filters show only their todos",
    { tag: ["@ui", "@regression"], annotation: severity.major },
    async ({ todoListPage, listWithOneDone }) => {
      await test.step("Open Active and verify only the active todo is listed", async () => {
        await todoListPage.showActive();
        expect(await todoListPage.read(), "The Active list").toEqual(shownTodoList({ todos: [listWithOneDone.toDo], left: 1 }));
      });
      await test.step("Open Completed and verify only the completed todo is listed", async () => {
        await todoListPage.showCompleted();
        expect(await todoListPage.read(), "The Completed list").toEqual(
          shownTodoList({ todos: [listWithOneDone.done], completed: [listWithOneDone.done], left: 1 }),
        );
      });
    },
  );

  test(
    "Clear completed removes only the completed todos",
    { tag: ["@ui", "@regression"], annotation: severity.major },
    async ({ todoListPage, listWithOneDone }) => {
      await test.step("Clear completed and verify only the active todo is left", async () => {
        await todoListPage.clearCompleted();
        expect(await todoListPage.read(), "The todo list").toEqual(shownTodoList({ todos: [listWithOneDone.toDo], left: 1 }));
      });
    },
  );

  test(
    "A blank todo is not added",
    { tag: ["@ui", "@regression"], annotation: severity.minor },
    async ({ todoListPage }) => {
      await test.step("Submit a todo made only of spaces and verify the list has no todos", async () => {
        await todoListPage.submit("   ");
        expect(await todoListPage.read(), "The todo list").toEqual(shownTodoList({ todos: [], left: 0 }));
      });
    },
  );
});
