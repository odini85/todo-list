const FILTER = {
  ALL: "ALL",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
};

const VIEW_FILTER = {
  "#/": FILTER.ALL,
  "#/active": FILTER.ACTIVE,
  "#/completed": FILTER.COMPLETED,
};

class TodoListModel {
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

class TodoModel {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.completed = false;
  }
}

class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  notify(name, ...args) {
    if (!this._events.has(name)) {
      return;
    }

    this._events.get(name).forEach((handler) => {
      handler(...args);
    });
  }
  on(name, handler) {
    if (!this._events.get(name)) {
      this._events.set(name, []);
    }

    this._events.get(name).push(handler);
  }
  remove(name, removeHandler) {
    if (!this._events.get(name)) {
      return false;
    }

    const newHandlers = this._events.get(name).filter((handler) => {
      return handler == removeHandler;
    });

    if (newHandlers.length === 0) {
      this._events.delete(name);
    } else {
      this._events.set(name, newHandlers);
    }

    return true;
  }
}

class View {
  constructor(rootEl, emitter) {
    this._rootEl = rootEl;
    this._emitter = emitter;
    this._bindEvent();
  }

  _bindEvent() {
    this._rootEl
      .querySelector(".new-todo")
      .addEventListener("keyup", this._newHandler);
    this._rootEl
      .querySelector(".toggle-all")
      .addEventListener("click", this._toggleAllClickHandler);
    this._rootEl
      .querySelector(".todo-list")
      .addEventListener("click", this._listClickHandler);
    this._rootEl
      .querySelector(".footer")
      .addEventListener("click", this._footerClickHandler);
  }

  _newHandler = (e) => {
    if (e.key.toLowerCase() !== "enter") {
      return;
    }

    const value = e.target.value.trim();
    if (!value) {
      return;
    }

    this._emitter.notify("view:new", value);
    e.target.value = "";
  };

  _toggleAllClickHandler = (e) => {
    this._emitter.notify("view:toggle-all-checked", e.target.checked);
  };

  _listClickHandler = (e) => {
    const tagName = e.target.tagName.toLowerCase();
    const id = Number(e.target.dataset.id);
    switch (tagName) {
      // toggle
      case "input": {
        this._emitter.notify("view:toggle", id);
        return;
      }
      // destroy
      case "button": {
        this._emitter.notify("view:destroy", id);
        return;
      }
    }
  };

  _footerClickHandler = (e) => {
    const tagName = e.target.tagName.toLowerCase();
    const isATag = tagName === "a";

    e.preventDefault();

    const href = e.target.getAttribute("href")?.replace("#/", "");
    switch (true) {
      case isATag && href === "": {
        this._emitter.notify("view:filter", FILTER.ALL);
        return;
      }
      case isATag && href === "active": {
        this._emitter.notify("view:filter", FILTER.ACTIVE);
        return;
      }
      case isATag && href === "completed": {
        this._emitter.notify("view:filter", FILTER.COMPLETED);
        return;
      }
    }
  };

  allCheck(checked) {
    this._rootEl.querySelector(".toggle-all").checked = checked;
  }

  render(todoListModel) {
    const currentFilter = todoListModel.filter;
    const filteredList = todoListModel.getList(currentFilter);

    // countEl
    const countEl = this._rootEl.querySelector(".todo-count strong");
    countEl.textContent = filteredList.length;

    // list
    const listHTML = filteredList
      .map((todo) => {
        return `
          <li ${todo.completed ? 'class="completed"' : ""}>
            <div class="view">
              <input class="toggle" type="checkbox" data-id="${todo.id}" ${
          todo.completed ? "checked" : ""
        }>
              <label>${todo.name}</label>
              <button class="destroy" data-id="${todo.id}"></button>
            </div>
          </li>
        `;
      })
      .join("");
    this._rootEl.querySelector(".todo-list").innerHTML = listHTML;

    // footer
    this._rootEl.querySelectorAll(".filters a").forEach((aEl) => {
      if (VIEW_FILTER[aEl.getAttribute("href")] === currentFilter) {
        aEl.classList.add("selected");
      } else {
        aEl.classList.remove("selected");
      }
    });
  }
}

class Controller {
  constructor(rootEl) {
    const emitter = new EventEmitter();
    this._model = new TodoListModel(emitter);
    this._view = new View(rootEl, emitter);

    emitter.on("view:new", (name) => {
      this._model.add(name);
    });
    emitter.on("model:add", () => {
      this._view.render(this._model);
      this._view.allCheck(false);
    });
    emitter.on("view:toggle-all-checked", (isShowAll) => {
      this._model.toggleAll(isShowAll);
    });
    emitter.on("model:toggle-all", () => {
      this._view.render(this._model);
    });
    emitter.on("view:toggle", (id) => {
      this._model.toggle(id);
    });
    emitter.on("model:toggle", () => {
      this._view.render(this._model);
      this.validateAllCheck();
    });
    emitter.on("view:destroy", (id) => {
      this._model.delete(id);
    });
    emitter.on("model:destroy", () => {
      this._view.render(this._model);
      this.validateAllCheck();
    });
    emitter.on("view:filter", (nextFilter) => {
      this._model.setFilter(nextFilter);
      this.validateAllCheck();
    });
    emitter.on("model:filter", () => {
      this._view.render(this._model);
    });
    emitter.on("model:empty", () => {
      this._view.allCheck(false);
    });
  }
  validateAllCheck() {
    const filteredList = this._model.getList(this._model.filter);
    switch (this._model.filter) {
      case FILTER.ALL: {
        const completedList = this._model.getCompletedList();
        const isChecked = filteredList.length === completedList.length;
        this._view.allCheck(isChecked);
        break;
      }
      case FILTER.COMPLETED: {
        if (filteredList.length > 0) {
          this._view.allCheck(true);
        }
        break;
      }
    }

    if (filteredList.length === 0) {
      this._view.allCheck(false);
    }
  }
}

const controller = new Controller(document.querySelector("#uid_app"));
