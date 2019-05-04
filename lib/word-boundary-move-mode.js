"use babel";

import { CompositeDisposable } from "atom";
import { Controller } from "./wbmm-controller";
import { isExist, read, parser } from "./read-cson";
import { setEventListener, disposeEventListeners, Key } from "./temp";
import config from "./wbmm-config.json";

export default {
  "name": "word-boundary-move-mode",
  "shortName": "wbmm",
  "config": config,

  activate() {
    this.editor = null;
    this.controller = new Controller();
    this.subscriptions = null;

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add("atom-workspace", {
      "wbmm:toggle": (evt) => { return this.toggle(evt); },
      "wbmm:toggle-auto-select": (evt) => { return this.toggleAutoSelect(evt); },
      "wbmm:settings": (evt) => { this.settings(evt); },
    }));
    this.subscriptions.add(atom.commands.add("atom-text-editor", {
      "wbmm:jump-right": (evt) => { return this.controller.jumpRight(evt); },
      "wbmm:jump-left": (evt) => { return this.controller.jumpLeft(evt); },
      "wbmm:normal-right": (evt) => { return this.controller.normalRight(evt, false); },
      "wbmm:normal-left": (evt) => { return this.controller.normalLeft(evt, false); },
      "wbmm:select-right": (evt) => { return this.controller.selectRight(evt); },
      "wbmm:select-left": (evt) => { return this.controller.selectLeft(evt); },
      "wbmm:select-normal-right": (evt) => { return this.controller.normalRight(evt, true); },
      "wbmm:select-normal-left": (evt) => { return this.controller.normalLeft(evt, true); },
    }));

    const getConfigs = this.getFuncGetConfigs();
    getConfigs();
    this.onDidChangeConfigs(getConfigs);
    this.controller.setCursor(atom.workspace.getActiveTextEditor());
    this.onDidChangeActiveTextEditor(this.controller.setCursor);

    this.getKeyBindings();
    this.watch();
  },

  async getKeyBindings() {
    if (this.controller.keyBindings.pathKeyBindings !== "") {
      isExist(this.controller.keyBindings.pathKeyBindings)
        .then(read)
        .then(parser)
        .then(this.controller.getFuncSetKeyBindings())
        .catch(this.getFuncNotifications());
    }
  },

  getFuncNotifications() {
    return (err) => {
      atom.notifications.addWarning(`${this.name}:<br>Cannot set keybindings.`, { "detail": `${err}`, "dismissable": true });
    };
  },

  getFuncGetConfigs() {
    return () => {
      this.controller.keyBindings.pathKeyBindings = atom.config.get(`${this.name}.pathKeyBindings`);
      this.controller.subwordBoundary = atom.config.get(`${this.name}.subwordBoundary`);
      this.controller.autoSelect = atom.config.get(`${this.name}.autoSelect`);
    };
  },

  setConfigs() {
    atom.config.set(`${this.name}.pathKeyBindings`, this.controller.keyBindings.pathKeyBindings);
    atom.config.set(`${this.name}.subwordBoundary`, this.controller.subwordBoundary);
    atom.config.set(`${this.name}.autoSelect`, this.controller.autoSelect);
  },

  onDidChangeConfigs(getConfigs) {
    // this.subscriptions.add(atom.config.onDidChange(`${this.name}.pathKeyBindings`, getConfigs));
    this.subscriptions.add(atom.config.onDidChange(`${this.name}.subwordBoundary`, getConfigs));
    this.subscriptions.add(atom.config.onDidChange(`${this.name}.autoSelect`, getConfigs));
  },

  // ActiveTextEditor を自動で取って来る
  onDidChangeActiveTextEditor(setCursor) {
    this.subscriptions.add(atom.workspace.onDidChangeActiveTextEditor(setCursor));
  },

  deactivate() {
    this.controller.keyBindings.deleteKeyBindings();
    this.subscriptions.dispose();
  },

  /*
  serialize() {
  },
  //*/

  settings(_evt) {
    atom.workspace.open(`atom://config/packages/${this.name}`);
  },

  toggle(_evt) {
    this.controller.toggle();
  },

  toggleAutoSelect(_evt) {
    if (this.controller.toggleState === false) {
      this.controller.toggle();
    }
    this.controller.autoSelect = !this.controller.autoSelect;
    this.setConfigs();
  },


  /* develop functions */

  watch() {
    // 適当
    this.editor = atom.workspace.getActiveTextEditor();
    this.element = atom.views.getView(this.editor); // hidden input?
    this.eventListeners = [];
    this.eventListeners.push(setEventListener(this.element, "keydown", this.getWatchcat(), false));
    this.eventListeners.push(setEventListener(this.element, "keypress", this.getWatchcat(), false));
    this.eventListeners.push(setEventListener(this.element, "keyup", this.getWatchcat(), false));
  },

  unwatch() {
    disposeEventListeners(this.eventListeners);
    this.eventListeners = [];
  },

  getWatchcat() {
    return (evt) => {
      const key = new Key(evt);
      console.log(key.toString());
    };
  },

};
