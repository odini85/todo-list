import { FILTER, VIEW_FILTER } from "../constants/filter";

export class View {
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
      // all
      case isATag && href === "": {
        this._emitter.notify("view:filter", FILTER.ALL);
        return;
      }
      // active
      case isATag && href === "active": {
        this._emitter.notify("view:filter", FILTER.ACTIVE);
        return;
      }
      // completed
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
