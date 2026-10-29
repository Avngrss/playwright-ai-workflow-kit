import type { Locator, Page } from "@playwright/test";
import { appReady } from "../../setup/app-wide";

/** The TodoMVC page: the new-todo field, the list with its counter, the filters and Clear completed. */
export class TodoListPage {
  readonly newTodo: Locator;
  readonly todoTitles: Locator;
  readonly todos: Locator;
  readonly completedTodos: Locator;
  readonly counter: Locator;
  readonly activeFilter: Locator;
  readonly completedFilter: Locator;
  readonly selectedFilter: Locator;
  readonly clearCompletedButton: Locator;

  constructor(protected readonly page: Page) {
    this.newTodo = page.getByPlaceholder("What needs to be done?");
    this.todos = page.getByTestId("todo-item");
    this.todoTitles = page.getByTestId("todo-title");
    this.completedTodos = page.locator('[data-testid="todo-item"].completed');
    this.counter = page.getByTestId("todo-count");
    this.activeFilter = page.getByRole("link", { name: "Active" });
    this.completedFilter = page.getByRole("link", { name: "Completed" });
    this.selectedFilter = page.locator(".filters a.selected");
    this.clearCompletedButton = page.getByRole("button", { name: "Clear completed" });
  }

  /** The app lives under a path (`/todomvc/`), so the page opens relative to the address, not the host's root. */
  async open(): Promise<void> {
    await this.page.goto("./");
    await appReady(this.page);
    // The field is shown with an empty list and with todos alike — content or empty state.
    await this.newTodo.waitFor();
  }

  async add(title: string): Promise<void> {
    await this.newTodo.fill(title);
    await this.newTodo.press("Enter");
    await this.todos.filter({ hasText: title }).first().waitFor();
  }

  /** Adds the todos in order and completes the ones named — the list several cases start from. */
  async addTodos(titles: string[], { completed = [] }: { completed?: string[] } = {}): Promise<void> {
    for (const title of titles) await this.add(title);
    for (const title of completed) await this.complete(title);
  }

  /** Submits the text as it is — for an entry the app is expected to refuse. */
  async submit(text: string): Promise<void> {
    await this.newTodo.fill(text);
    await this.newTodo.press("Enter");
  }

  async complete(title: string): Promise<void> {
    await this.todos.filter({ hasText: title }).getByRole("checkbox").check();
    await this.completedTodos.filter({ hasText: title }).waitFor();
  }

  /** The address changes before the list does — the action ends when the filter is shown selected, the list with it. */
  async showActive(): Promise<void> {
    await this.activeFilter.click();
    await this.selectedFilter.filter({ hasText: "Active" }).waitFor();
  }

  async showCompleted(): Promise<void> {
    await this.completedFilter.click();
    await this.selectedFilter.filter({ hasText: "Completed" }).waitFor();
  }

  async clearCompleted(): Promise<void> {
    await this.clearCompletedButton.click();
    await this.clearCompletedButton.waitFor({ state: "hidden" });
  }

  /** The list as shown: its titles in order, the completed ones, and the counter's text ("" with no todos). */
  async read(): Promise<{ todos: string[]; completed: string[]; left: string }> {
    return {
      todos: await this.todoTitles.allTextContents(),
      completed: await this.completedTodos.getByTestId("todo-title").allTextContents(),
      left: (await this.counter.isVisible()) ? ((await this.counter.textContent()) ?? "") : "",
    };
  }
}
