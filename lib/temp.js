"use babel";

export function isUndefined(target) {
  return typeof target === "undefined";
}

export function findCommand(command) {
  atom.commands.registeredCommands.find((v) => {
    return command === v;
  });
}

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

// -を排除するとエラーは起きないが、認識されない
const lalt = "lalt";
const ralt = "ralt";
const lcmd = "lcmd";
const rcmd = "rcmd";
const lctrl = "lctrl";
const rctrl = "rctrl";
const lshift = "lshift";
const rshift = "rshift";
const numpad = "nampad";

const keyup = "keyup";
const keypress = "keypress";
const keydown = "keydown";

export class Key {
  constructor({
    altKey = false,
    charCode = -1,
    code = "",
    ctrlKey = false,
    isComposing = false,
    key = "",
    keyCode = -1,
    location = -1, // 0
    metaKey = false, // cmd or win key
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

  getPrintString() {
    let ret = "";
    ret += `type: ${this.type}, `;
    ret += `code: ${this.code}, `;
    ret += `key: ${this.key}, `;
    ret += `\ncharCode: ${this.charCode}, `;
    ret += `keyCode: ${this.keyCode}, `;
    ret += `\naltKey: ${this.altKey}, `;
    ret += `ctrlKey: ${this.ctrlKey}, `;
    ret += `shiftKey: ${this.shiftKey}, `;
    ret += `metaKey: ${this.metaKey}, `;
    ret += `\nlocation: ${this.location}, `;
    ret += `repeat: ${this.repeat}, `;
    ret += `isComposing: ${this.isComposing}`;
    return ret;
  }

  // ctrl- のようにすると-を付けると既存のmodifierとして認識されてエラーでるようだ
  getResolveString() {
    let result = "";
    result += this.solveModifiers();
    result += this.solveKey();
    return result.toLowerCase(); //
  }

  solveKey() {
    let result = this.key.toLowerCase();

    result = result.replace(/arrow/g, "");
    result = result.replace(/^control$/g, "ctrl");

    if (result === "ctrl" || result === "alt" || result === "shift") {
      result = this.solveLeftRight(result, "l", "r");
    }
    if (this.key.toLowerCase() === "meta") {
      result = this.solveLeftRight("cmd", "l", "r");
    }
    if (this.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
      result = `${numpad}${result}`;
    }
    return result;
  }

  solveLeftRight(key, left, right) {
    if (this.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
      return `${left}${key}`;
    }
    if (this.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
      return `${right}${key}`;
    }
    return `${left}${key}`;
  }

  solveModifiers() {
    let result = "";
    if (this.key.toLowerCase() !== "control") {
      result += Key.solveModifier(this.ctrlKey, this.location, lctrl, rctrl, lctrl);
    }
    if (this.key.toLowerCase() !== "alt") {
      result += Key.solveModifier(this.altKey, this.location, lalt, ralt, lalt);
    }
    if (this.key.toLowerCase() !== "shift") {
      result += Key.solveModifier(this.shiftKey, this.location, lshift, rshift, lshift);
    }
    if (this.key.toLowerCase() !== "meta") {
      result += Key.solveModifier(this.metaKey, this.location, lcmd, rcmd, lcmd);
    }
    return result;
  }

  static solveModifier(keyState, location, standard, right, left) {
    if (keyState === false) {
      return "";
    }
    const result = [];

    if (location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
      result.push(left);
    } else if (location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
      result.push(right);
    } else {
      result.push(standard);
    }
    return result.join("");
  }


  isSameAll({
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

  isSame({
    altKey = false,
    code = "",
    ctrlKey = false,
    key = "",
    location = -1,
    metaKey = false,
    shiftKey = false,
  }) {
    if (
      this.altKey !== altKey || // Boolean
      this.code !== code || // DomString
      this.ctrlKey !== ctrlKey || // Boolean
      this.key !== key || // DomString
      this.location !== location || // Number
      this.metaKey !== metaKey || // Number
      this.shiftKey !== shiftKey // Boolean
    ) {
      return false;
    }
    return true;
  }

  isSameType({
    altKey = false,
    code = "",
    ctrlKey = false,
    key = "",
    location = -1,
    metaKey = false,
    shiftKey = false,
    type = "",
  }) {
    if (this.isSame({ altKey, code, ctrlKey, key, location, metaKey, shiftKey }) !== false ||
      this.type !== type
    ) {
      return false;
    }
    return true;
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

  static compareKeys(a, b) {
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
