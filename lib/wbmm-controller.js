"use babel";

import { KeyBindings } from "./key-bindings";

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

class Controller {
  constructor({ subwordBoundary = true, autoSelect = false } = {}) {
    this.subwordBoundary = subwordBoundary;
    this.autoSelect = autoSelect;
    this.toggleState = false;
    this.preKey = "";

    this.editor = null;
    this.cursor = null;

    this.setCursor = this.getFuncSetCursor();
    this.keyBindings = new KeyBindings({ "source": "wbmm", "keyBindings": wbmmKeyBindings });
  }

  on() {
    if (this.cursor === false) {
      this.setCursor(atom.workspace.getActiveTextEditor());
    }
    this.keyBindings.addKeyBindings();
    this.toggleState = true;
  }

  off() {
    this.keyBindings.deleteKeyBindings();
    this.toggleState = false;
  }

  toggle() {
    if (this.toggleState === false) {
      this.on();
    } else {
      this.off();
    }
  }

  getFuncSetCursor() {
    return (editor) => {
      if (typeof editor === "undefined") {
        this.editor = null;
        this.cursor = null;
        return;
      }
      this.editor = editor;
      this.cursor = this.editor.getLastCursor();
    };
  }

  // キー毎に分けた方が速い?
  jumpRight(evt) {
    if (this.cursor === null) {
      evt.abortKeyBinding();
      return;
    }
    if (this.autoSelect === false) {
      this.moveRight();
    } else {
      this.autoSelectRight();
    }
    this.preKey = "right";
  }

  moveRight() {
    if (this.subwordBoundary === true) {
      this.cursor.moveToNextSubwordBoundary();
    } else {
      this.cursor.moveToNextWordBoundary();
    }
  }

  autoSelectRight() {
    this.resetSelection();
    if (this.subwordBoundary === true) {
      this.editor.selectToNextSubwordBoundary();
    } else {
      this.editor.selectToNextWordBoundary();
    }
  }

  normalRight(evt, select = false) {
    if (this.editor === null) {
      evt.abortKeyBinding();
      return;
    }
    if (select === true) {
      this.editor.selectRight();
    } else if (this.autoSelect === false || this.resetSelection() === false) {
      this.cursor.moveRight();
    }
    this.preKey = "right";
  }

  selectRight(evt) {
    if (this.editor === null) {
      evt.abortKeyBinding();
      return;
    }

    if (this.subwordBoundary === true) {
      this.editor.selectToNextSubwordBoundary();
    } else {
      this.editor.selectToNextWordBoundary();
    }
    this.preKey = "right";
  }

  jumpLeft(evt) {
    if (this.cursor === null) {
      evt.abortKeyBinding();
      return;
    }
    if (this.autoSelect === false) {
      this.moveLeft();
    } else {
      this.autoSelectLeft();
    }
    this.preKey = "right";
  }

  moveLeft() {
    if (this.subwordBoundary === true) {
      this.cursor.moveToPreviousSubwordBoundary();
    } else {
      this.cursor.moveToPreviousWordBoundary();
    }
  }

  autoSelectLeft() {
    this.resetSelection();
    if (this.subwordBoundary === true) {
      this.editor.selectToPreviousSubwordBoundary();
    } else {
      this.editor.selectToPreviousWordBoundary();
    }
  }

  normalLeft(evt, select = false) {
    if (this.editor === null) {
      evt.abortKeyBinding();
      return;
    }
    if (select === true) {
      this.editor.selectLeft();
    } else if (this.autoSelect === false || this.resetSelection() === false) {
      this.cursor.moveLeft();
    }
    this.preKey = "right";
  }

  selectLeft(evt) {
    if (this.editor === null) {
      evt.abortKeyBinding();
      return;
    }

    if (this.subwordBoundary === true) {
      this.editor.selectToPreviousSubwordBoundary();
    } else {
      this.editor.selectToPreviousWordBoundary();
    }
    this.preKey = "right";
  }

  resetSelection() {
    if (this.editor.getSelectedBufferRange().isEmpty() === false) {
      this.editor.setSelectedBufferRange([this.cursor.getBufferPosition(), this.cursor.getBufferPosition()]);
      return true;
    }
    return false;
  }

  getFuncSetKeyBindings() {
    return (keyBindings) => {
      this.keyBindings.setKeyBindings(keyBindings, this.toggleState);
    };
  }
}

export {
  Controller,
};
