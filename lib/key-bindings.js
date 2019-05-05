"use babel";

import { CompositeDisposable } from "atom";
import { Key } from "./temp";

class KeyBindings {
  constructor({
    source = "",
    keyBindings = null,
    priority = 0,
  } = {}) {
    this.source = source;
    this.priority = priority;
    this.pathKeyBindings = "";
    this.toggle = false;

    this.keyBindings = this.checkKeyBindings(keyBindings);
    this.filterKeyBindings = this.getFilterKeyBindings();
    this.resolver = KeyBindings.getFuncResolver();
    this.filterCustomKeystrokeResovlers = KeyBindings.getFilterCustomKeystrokeResovlers();

    this.subscriptions = new CompositeDisposable();
  }

  dispose() {
    this.subscriptions.dispose();
    atom.keymaps.customKeystrokeResolvers = atom.keymaps.customKeystrokeResolvers.filter(this.filterCustomKeystrokeResovlers);
    console.log(this.subscriptions);
    console.log(atom.keymaps.customKeystrokeResolvers);
  }

  deleteKeyBindings() {
    atom.keymaps.keyBindings = atom.keymaps.keyBindings.filter(this.filterKeyBindings);
    this.dispose();
    this.toggle = false;
  }

  // add or change
  addKeyBindings() {
    this.deleteKeyBindings(); // 重複を避けるために一度消す
    atom.keymaps.keyBindings.concat(this.keyBindings);
    this.addCustomKeystrokeResolver();
    this.toggle = true;
  }

  setKeyBindings(keyBindings, show = false) {
    this.keyBindings = this.checkKeyBindings(keyBindings);
    if (show === true) {
      this.showKeybindings();
    }
    if (this.toggle === true) {
      this.addKeyBindings(show);
    }
  }

  checkKeyBindings(keyBindings) {
    // css selectorは、ユーザが自由に追加できる関係上、文法の検査しかできない
    // key についても custorm resolver を追加できる関係上、文法の検査しかできない
    // command も activate されてから追加されるかもしれないので文法の検査しかできない
    return atom.keymaps.build(this.source, keyBindings, this.priority);
  }

  getFilterKeyBindings() {
    return (v) => {
      return v.source !== this.source;
    };
  }

  static getFilterCustomKeystrokeResovlers() {
    return (v) => {
      return v.name !== "keyBindingsResolver";
    };
  }

  showKeybindings() {
    const { string, num } = this.toStringKeyBindings();
    atom.notifications.addInfo(`Number of Valid Key Bindings are ${num}:<br>`, {
      "detail": `${string}`,
      "dismissable": true,
    });
  }

  toCsonKeyBindings() {
    const result = {};
    for (const { selector, keystrokes, command } of this.keyBindings) {
      if (Object.prototype.hasOwnProperty.call(result, selector) === false) {
        result[selector] = {};
      }
      result[selector][keystrokes] = command;
    }
    return result;
  }

  toStringKeyBindings() {
    const cson = this.toCsonKeyBindings();
    let string = "";
    let num = 0;

    /*
    string = Object.keys(cson).reduce((acc1, v1) => {
      return Object.keys(cson[v1]).reduce((acc2, v2) => {
        num += 1;
        return `${acc2}  ${v2}: ${cson[v1][v2]}\n`;
      }, `${acc1}${v1}: \n`);
    }, "");
    //*/

    for (const selector of Object.keys(cson)) {
      string += `${selector}: \n`;
      for (const keystrokes of Object.keys(cson[selector])) {
        num += 1;
        string += `  ${keystrokes}: ${cson[selector][keystrokes]}\n`;
      }
    }
    return { string, num };
  }

  addCustomKeystrokeResolver() {
    atom.keymaps.addKeystrokeResolver(this.resolver);
    console.log(atom.keymaps);
  }

  static getFuncResolver() {
    return function keyBindingsResolver({ keystroke, event, _layoutName, _keymap }) {
      // console.log(keystroke);
      // console.log(event);
      // console.log(layoutName);
      // console.log(keymap);
      const key = new Key(event);
      let result = key.getResolveString();
      console.log(key.getPrintString());
      if (result === "") {
        return keystroke;
      }
      if (keystroke.startsWith("^") && keystroke !== "^") {
        result = `^${result}`;
      }
      console.log([result, keystroke]);
      return result;
    };
  }
}

export {
  KeyBindings,
};
