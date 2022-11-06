import { FILTER } from "../constants/filter";
import { EventEmitter } from "../module/EventEmitter";
import { TodoListModel } from "../model/TodoListModel";
import { View } from "../view/View";

export class Controller {
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
