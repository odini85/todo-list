import { FILTER } from "../constants/filter";
import { TodoModel } from "./TodoModel";

export class TodoListModel {
  constructor(emitter) {
    this._map = new Map();
    this._emitter = emitter;
    this.filter = FILTER.ALL;
  }
  static _id = 0;
  static createId() {
    return TodoListModel._id++;
  }
  setFilter(nextFilter) {
    this.filter = nextFilter;
    this._emitter.notify("model:filter", nextFilter);
  }
  getList(filter = FILTER.ALL) {
    let returnValue = [];
    this._map.forEach((todo, key) => {
      switch (true) {
        case filter === FILTER.ACTIVE && !todo.completed: {
          returnValue.push(todo);
          break;
        }
        case filter === FILTER.COMPLETED && todo.completed: {
          returnValue.push(todo);
          break;
        }
        case filter === FILTER.ALL: {
          returnValue.push(todo);
          break;
        }
      }
    });

    return returnValue;
  }
  getCompletedList() {
    return [...this._map].filter(([, todo]) => {
      return todo.completed;
    });
  }
  get(id) {
    return this._map.get(id);
  }
  add(name) {
    const id = TodoListModel.createId();
    const defaultFilter = FILTER.ALL;
    const todo = new TodoModel(id, name, defaultFilter);
    this._map.set(id, todo);
    this._emitter.notify("model:add");
    return todo;
  }
  delete(id) {
    if (!this._map.has(id)) {
      return false;
    }

    this._map.delete(id);
    this._emitter.notify("model:destroy");

    if (this._map.size === 0) {
      this._emitter.notify("model:empty");
    }

    return true;
  }
  toggleAll(isCompleted) {
    this._map.forEach((todo) => {
      todo.completed = isCompleted;
    });
    this._emitter.notify("model:toggle-all");
  }
  toggle(id) {
    if (!this._map.has(id)) {
      return false;
    }

    const todo = this._map.get(id);
    todo.completed = !todo.completed;

    this._emitter.notify("model:toggle");

    return true;
  }
}
