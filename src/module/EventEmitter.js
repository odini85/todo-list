export class EventEmitter {
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
