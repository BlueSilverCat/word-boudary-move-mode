"use babel";

import fs from "fs";
import cson from "cson-parser";

function isExist(path = "") {
  console.log("isExist", path);
  return new Promise((resolve, reject) => {
    fs.access(path, fs.constants.F_OK, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(path);
      }
    });
  });
}

function read(path = "") {
  console.log("read", path);
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf-8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function parser(data) {
  console.log("parser", data);
  let result = null;
  try {
    result = cson.parse(data);
  } catch (err) {
    throw err;
  }
  return result;
}

/*
function parser(data) {
  console.log("parser", data);
  return new Promise((resolve, reject) => {
    try {
      resolve(json5.parse(data));
    } catch (err) {
      console.log("parser ng");
      reject(err);
    }
  });
}
//*/

export {
  isExist,
  read,
  parser,
};
