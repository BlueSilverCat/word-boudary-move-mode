"use babel";

const wbmmKeyBindings = {
  // "body atom-workspace atom-text-editor:not([mini]).editor": { // need higher specificity
  "body atom-workspace atom-text-editor:not([mini])": { // need higher specificity
    "right": "wbmm:jump-right",
    "left": "wbmm:jump-left",
    "alt-right": "wbmm:normal-right",
    "alt-left": "wbmm:normal-left",
    "shift-right": "wbmm:select-right",
    "shift-left": "wbmm:select-left",
    "shift-alt-right": "wbmm:select-normal-right",
    "shift-alt-left": "wbmm:select-normal-left",
  },
};

class KeyBindings {
  constructor() {
    this.keyBindings = wbmmKeyBindings;
    this.pathKeyBindings = "";
    this.setKeyBindings = this.getFuncSetKeyBindings();
  }

  addKeyBindings() {
    atom.keymaps.add("wbmm", this.keyBindings, 0);
  }

  static deleteKeyBindings() {
    atom.keymaps.keyBindings = atom.keymaps.keyBindings.filter(KeyBindings.filterKeyBindings);
  }

  getFuncSetKeyBindings() {
    return (keyBindings) => {
      this.keyBindings = keyBindings;
      // if (this.toggleState === true) {
      //  this.changeKeyBindings();
      // }
    };
  }

  changeKeyBindings() {
    KeyBindings.deleteKeyBindings();
    this.addKeyBindings();
  }

  static checkKeyBindings(_keyBindings) {
    // isSelectorValid();
  }

  static filterKeyBindings(v) {
    return v.source !== "wbmm";
  }
}

export {
  KeyBindings,
};
