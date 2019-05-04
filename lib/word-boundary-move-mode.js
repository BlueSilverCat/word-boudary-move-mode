"use babel";

import { CompositeDisposable } from "atom";
import { WBMM } from "./wbmm-class";
import { isExist, read, parser } from "./read-cson";
import { setEventListener, disposeEventListeners, Key } from "./temp";
import config from "./wbmm-config.json";

export default {
  "name": "word-boundary-move-mode",
  "shortName": "wbmm",
  "config": config,

  activate() {
    this.editor = null;
    this.wbmm = new WBMM();
    this.subscriptions = null;

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add("atom-workspace", {
      "wbmm:toggle": (evt) => { return this.toggle(evt); },
      "wbmm:toggle-auto-select": (evt) => { return this.toggleAutoSelect(evt); },
      "wbmm:settings": (evt) => { this.settings(evt); },
    }));
    this.subscriptions.add(atom.commands.add("atom-text-editor", {
      "wbmm:jump-right": (evt) => { return this.wbmm.jumpRight(evt); },
      "wbmm:jump-left": (evt) => { return this.wbmm.jumpLeft(evt); },
      "wbmm:normal-right": (evt) => { return this.wbmm.normalRight(evt, false); },
      "wbmm:normal-left": (evt) => { return this.wbmm.normalLeft(evt, false); },
      "wbmm:select-right": (evt) => { return this.wbmm.selectRight(evt); },
      "wbmm:select-left": (evt) => { return this.wbmm.selectLeft(evt); },
      "wbmm:select-normal-right": (evt) => { return this.wbmm.normalRight(evt, true); },
      "wbmm:select-normal-left": (evt) => { return this.wbmm.normalLeft(evt, true); },
    }));

    const getConfigs = this.getFuncGetConfigs();
    getConfigs();
    this.onDidChangeConfigs(getConfigs);
    this.wbmm.setCursor(atom.workspace.getActiveTextEditor());
    this.onDidChangeActiveTextEditor(this.wbmm.setCursor);

    this.getKeyBindings();
    this.watch();
  },

  async getKeyBindings() {
    if (this.wbmm.pathKeyBindings !== "") {
      isExist(this.wbmm.pathKeyBindings)
        .then(read)
        .then(parser)
        .then(this.wbmm.setKeyBindings)
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
      this.wbmm.pathKeyBindings = atom.config.get(`${this.name}.pathKeyBindings`);
      this.wbmm.subwordBoundary = atom.config.get(`${this.name}.subwordBoundary`);
      this.wbmm.autoSelect = atom.config.get(`${this.name}.autoSelect`);
    };
  },

  setConfigs() {
    atom.config.set(`${this.name}.pathKeyBindings`, this.wbmm.pathKeyBindings);
    atom.config.set(`${this.name}.subwordBoundary`, this.wbmm.subwordBoundary);
    atom.config.set(`${this.name}.autoSelect`, this.wbmm.autoSelect);
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
    WBMM.deleteKeyBindings();
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
    this.wbmm.toggle();
  },

  toggleAutoSelect(_evt) {
    if (this.wbmm.toggleState === false) {
      this.wbmm.toggle();
    }
    this.wbmm.autoSelect = !this.wbmm.autoSelect;
    this.setConfigs();
  },

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
