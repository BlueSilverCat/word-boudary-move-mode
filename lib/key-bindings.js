"use babel";

import { isUndefined } from "./temp";

class KeyBindings {
  constructor({ source = "", keyBindings = null, priority = 0 } = {}) {
    this.source = source;
    this.keyBindings = keyBindings;
    this.priority = priority;
    this.pathKeyBindings = "";

    this.filter = this.getFilterKeyBindings();
  }

  addKeyBindings() {
    atom.keymaps.add(this.source, this.keyBindings, this.priority);
  }

  deleteKeyBindings() {
    atom.keymaps.keyBindings = atom.keymaps.keyBindings.filter(this.filter);
  }

  setKeyBindings(keyBindings, toggle) {
    KeyBindings.checkKeyBindings(keyBindings);
    this.keyBindings = keyBindings;
    if (toggle === true) {
      this.changeKeyBindings();
    }
  }

  changeKeyBindings() {
    this.deleteKeyBindings();
    this.addKeyBindings();
  }

  static checkKeyBindings(keyBindings) {
    let num = 0;
    let notFound = [];

    for (const { selector, values } of keyBindings) {
      try {
        document.querySelector(selector);
      } catch (err) {
        console.log(err);
        const error = new Error("Invalid CSS selector");
        // error.keyBindingsError = err;
        return error;
      }
      for (const { key, command } of values) {
        console.log(key, command);
        const result = atom.commands.findCommands(command); // activateされるまで有るか分からない
        if (isUndefined(result) === true) {
          num += 1;
          notFound.push(command);
        }
      }
    }
    console.log(num, notFound);
    return true;
  }

  getFilterKeyBindings() {
    return (v) => {
      return v.source !== this.source;
    };
  }
}

export {
  KeyBindings,
};
