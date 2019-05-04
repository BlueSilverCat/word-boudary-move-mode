"use babel";

export function setEventListener(element, eventType, func, useCapture) {
  element.addEventListener(eventType, func, useCapture);
  return [element, eventType, func, useCapture];
}

export function disposeEventListeners(eventListeners) {
  for (let i = 0; i < eventListeners.length; i++) {
    if (Object.prototype.toString.call(eventListeners[i][0]) === "[object Array]") {
      disposeEventListeners(eventListeners[i]);
    } else {
      eventListeners[i][0].removeEventListener(eventListeners[i][1], eventListeners[i][2], eventListeners[i][3]);
    }
  }
}

export class Key {
  constructor({
    altKey = false,
    charCode = -1,
    code = "",
    ctrlKey = false,
    isComposing = false,
    key = "",
    keyCode = -1,
    location = -1,
    metaKey = false,
    repeat = false,
    shiftKey = false,
    type = "",
  }) {
    this.altKey = altKey; // Boolean
    this.charCode = charCode; // Number deprecated
    this.code = code; // DomString
    this.ctrlKey = ctrlKey; // Boolean
    this.isComposing = isComposing; // Boolean
    this.key = key; // DomString
    this.keyCode = keyCode; // Number deprecated
    this.location = location; // Number
    this.metaKey = metaKey; // Number
    this.repeat = repeat; // Boolean
    this.shiftKey = shiftKey; // Boolean
    this.type = type;
  }

  toString() {
    let ret = "";
    ret += `type: ${this.type}, `;
    ret += `code: ${this.code}, `;
    ret += `key: ${this.key}, `;
    ret += `\ncharCode: ${this.charCode}, `;
    ret += `keyCode: ${this.keyCode}, `;
    ret += `\naltKey: ${this.altKey}, `;
    ret += `ctrlKey: ${this.ctrlKey}, `;
    ret += `shiftKey: ${this.shiftKey}, `;
    ret += `\nisComposing: ${this.isComposing}, `;
    ret += `location: ${this.location}, `;
    ret += `metaKey: ${this.metaKey}, `;
    ret += `repeat: ${this.repeat4}`;
    return ret;
  }

  static checkSpecialKey(obj) {
    let ret = 0;
    if (obj.altKey === true) {
      ret += 1;
    }
    if (obj.ctrlKey === true) {
      ret += 2;
    }
    if (obj.shiftKey === true) {
      ret += 4;
    }
    return ret;
  }

  isSame({
    altKey = false,
    charCode = -1,
    code = "",
    ctrlKey = false,
    isComposing = false,
    key = "",
    keyCode = -1,
    location = -1,
    metaKey = false,
    repeat = false,
    shiftKey = false,
    type = "",
  }) {
    if (
      this.altKey !== altKey || // Boolean
      this.charCode !== charCode || // Number deprecated
      this.code !== code || // DomString
      this.ctrlKey !== ctrlKey || // Boolean
      this.isComposing !== isComposing || // Boolean
      this.key !== key || // DomString
      this.keyCode !== keyCode || // Number deprecated
      this.location !== location || // Number
      this.metaKey !== metaKey || // Number
      this.repeat !== repeat || // Boolean
      this.shiftKey !== shiftKey || // Boolean
      this.type !== type
    ) {
      return false;
    }
    return true;
  }

  static compare(a, b) {
    if (a.keyCode < b.keyCode) {
      return -1;
    }
    if (a.keyCode > b.keyCode) {
      return 1;
    }
    if (Key.checkSpecialKey(a) < Key.checkSpecialKey(b)) {
      return -1;
    }
    if (Key.checkSpecialKey(a) > Key.checkSpecialKey(b)) {
      return 1;
    }
    return 0;
  }
}
