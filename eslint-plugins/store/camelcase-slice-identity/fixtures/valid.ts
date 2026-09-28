import { Store } from "@themislib/themis/svelte-store";
import { createAction, createAsyncAction } from "@themislib/themis/utils/store/create-action";
import { todoItemsReducer } from "./todo-items-slice";

export const addTodo = createAction("todoItems/add");
export const loadTodo = createAsyncAction("todoItems/load", "todoItems/loadSuccess", async () => ({}));

const reducers = { todoItems: todoItemsReducer };

export const store = new Store({ todos: todoItemsReducer, todoItems: todoItemsReducer });
export const secondaryStore = new Store(reducers);