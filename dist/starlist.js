var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to2, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to2, key) && key !== except)
        __defProp(to2, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to2;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array4, tail) {
    let t = tail || new Empty();
    for (let i = array4.length - 1; i >= 0; --i) {
      t = new NonEmpty(array4[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  countLength() {
    let current = this;
    let length5 = 0;
    while (current) {
      current = current.tail;
      length5++;
    }
    return length5 - 1;
  }
};
function prepend(element, tail) {
  return new NonEmpty(element, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var List$Empty = () => new Empty();
var List$isEmpty = (value) => value instanceof Empty;
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var List$NonEmpty = (head, tail) => new NonEmpty(head, tail);
var List$isNonEmpty = (value) => value instanceof NonEmpty;
var List$NonEmpty$first = (value) => value.head;
var List$NonEmpty$rest = (value) => value.tail;
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index5) {
    if (index5 < 0 || index5 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index5);
  }
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.byteAt()` or `BitArray.rawBuffer` instead.
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    bitArrayPrintDeprecationWarning(
      "buffer",
      "Use BitArray.byteAt() or BitArray.rawBuffer instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.bitSize` or `BitArray.byteSize` instead.
   *
   * @returns {number}
   */
  get length() {
    bitArrayPrintDeprecationWarning(
      "length",
      "Use BitArray.bitSize or BitArray.byteSize instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index5) {
  if (bitOffset === 0) {
    return buffer[index5] ?? 0;
  } else {
    const a = buffer[index5] << bitOffset & 255;
    const b = buffer[index5 + 1] >> 8 - bitOffset;
    return a | b;
  }
}
var UtfCodepoint = class {
  constructor(value) {
    this.value = value;
  }
};
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name, message) {
  if (isBitArrayDeprecationMessagePrinted[name]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name} property used in JavaScript FFI code. ${message}.`
  );
  isBitArrayDeprecationMessagePrinted[name] = true;
}
function toBitArray(segments) {
  if (segments.length === 0) {
    return new BitArray(new Uint8Array());
  }
  if (segments.length === 1) {
    const segment = segments[0];
    if (segment instanceof BitArray) {
      return segment;
    }
    if (segment instanceof Uint8Array) {
      return new BitArray(segment);
    }
    return new BitArray(new Uint8Array(
      /** @type {number[]} */
      segments
    ));
  }
  let bitSize = 0;
  let areAllSegmentsNumbers = true;
  for (const segment of segments) {
    if (segment instanceof BitArray) {
      bitSize += segment.bitSize;
      areAllSegmentsNumbers = false;
    } else if (segment instanceof Uint8Array) {
      bitSize += segment.byteLength * 8;
      areAllSegmentsNumbers = false;
    } else {
      bitSize += 8;
    }
  }
  if (areAllSegmentsNumbers) {
    return new BitArray(new Uint8Array(
      /** @type {number[]} */
      segments
    ));
  }
  const buffer = new Uint8Array(Math.trunc((bitSize + 7) / 8));
  let cursor = 0;
  for (let segment of segments) {
    const isCursorByteAligned = cursor % 8 === 0;
    if (segment instanceof BitArray) {
      if (isCursorByteAligned && segment.bitOffset === 0) {
        buffer.set(segment.rawBuffer, cursor / 8);
        cursor += segment.bitSize;
        const trailingBitsCount = segment.bitSize % 8;
        if (trailingBitsCount !== 0) {
          const lastByteIndex = Math.trunc(cursor / 8);
          buffer[lastByteIndex] >>= 8 - trailingBitsCount;
          buffer[lastByteIndex] <<= 8 - trailingBitsCount;
        }
      } else {
        appendUnalignedBits(
          segment.rawBuffer,
          segment.bitSize,
          segment.bitOffset
        );
      }
    } else if (segment instanceof Uint8Array) {
      if (isCursorByteAligned) {
        buffer.set(segment, cursor / 8);
        cursor += segment.byteLength * 8;
      } else {
        appendUnalignedBits(segment, segment.byteLength * 8, 0);
      }
    } else {
      if (isCursorByteAligned) {
        buffer[cursor / 8] = segment;
        cursor += 8;
      } else {
        appendUnalignedBits(new Uint8Array([segment]), 8, 0);
      }
    }
  }
  function appendUnalignedBits(unalignedBits, size3, offset) {
    if (size3 === 0) {
      return;
    }
    const byteSize = Math.trunc(size3 + 7 / 8);
    const highBitsCount = cursor % 8;
    const lowBitsCount = 8 - highBitsCount;
    let byteIndex = Math.trunc(cursor / 8);
    for (let i = 0; i < byteSize; i++) {
      let byte = bitArrayByteAt(unalignedBits, offset, i);
      if (size3 < 8) {
        byte >>= 8 - size3;
        byte <<= 8 - size3;
      }
      buffer[byteIndex] |= byte >> highBitsCount;
      let appendedBitsCount = size3 - Math.max(0, size3 - lowBitsCount);
      size3 -= appendedBitsCount;
      cursor += appendedBitsCount;
      if (size3 === 0) {
        break;
      }
      buffer[++byteIndex] = byte << lowBitsCount;
      appendedBitsCount = size3 - Math.max(0, size3 - highBitsCount);
      size3 -= appendedBitsCount;
      cursor += appendedBitsCount;
    }
  }
  return new BitArray(buffer, bitSize);
}
function sizedInt(value, size3, isBigEndian) {
  if (size3 <= 0) {
    return new Uint8Array();
  }
  if (size3 === 8) {
    return new Uint8Array([value]);
  }
  if (size3 < 8) {
    value <<= 8 - size3;
    return new BitArray(new Uint8Array([value]), size3);
  }
  const buffer = new Uint8Array(Math.trunc((size3 + 7) / 8));
  const trailingBitsCount = size3 % 8;
  const unusedBitsCount = 8 - trailingBitsCount;
  if (size3 <= 32) {
    if (isBigEndian) {
      let i = buffer.length - 1;
      if (trailingBitsCount) {
        buffer[i--] = value << unusedBitsCount & 255;
        value >>= trailingBitsCount;
      }
      for (; i >= 0; i--) {
        buffer[i] = value;
        value >>= 8;
      }
    } else {
      let i = 0;
      const wholeByteCount = Math.trunc(size3 / 8);
      for (; i < wholeByteCount; i++) {
        buffer[i] = value;
        value >>= 8;
      }
      if (trailingBitsCount) {
        buffer[i] = value << unusedBitsCount;
      }
    }
  } else {
    const bigTrailingBitsCount = BigInt(trailingBitsCount);
    const bigUnusedBitsCount = BigInt(unusedBitsCount);
    let bigValue = BigInt(value);
    if (isBigEndian) {
      let i = buffer.length - 1;
      if (trailingBitsCount) {
        buffer[i--] = Number(bigValue << bigUnusedBitsCount);
        bigValue >>= bigTrailingBitsCount;
      }
      for (; i >= 0; i--) {
        buffer[i] = Number(bigValue);
        bigValue >>= 8n;
      }
    } else {
      let i = 0;
      const wholeByteCount = Math.trunc(size3 / 8);
      for (; i < wholeByteCount; i++) {
        buffer[i] = Number(bigValue);
        bigValue >>= 8n;
      }
      if (trailingBitsCount) {
        buffer[i] = Number(bigValue << bigUnusedBitsCount);
      }
    }
  }
  if (trailingBitsCount) {
    return new BitArray(buffer, size3);
  }
  return buffer;
}
var utf8Encoder;
function stringBits(string4) {
  utf8Encoder ??= new TextEncoder();
  return utf8Encoder.encode(string4);
}
var Result = class _Result extends CustomType {
  static isResult(data2) {
    return data2 instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  isOk() {
    return true;
  }
};
var Result$Ok = (value) => new Ok(value);
var Result$isOk = (value) => value instanceof Ok;
var Error2 = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  isOk() {
    return false;
  }
};
var Result$Error = (detail) => new Error2(detail);
var Result$isError = (value) => value instanceof Error2;
function isEqual(x, y) {
  let values3 = [x, y];
  while (values3.length) {
    let a = values3.pop();
    let b = values3.pop();
    if (a === b) continue;
    if (!isObject(a) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get6] = getters(a);
    const ka = keys2(a);
    const kb = keys2(b);
    if (ka.length !== kb.length) return false;
    for (let k of ka) {
      values3.push(get6(a, k), get6(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c)) return false;
  return a.constructor === b.constructor;
}
function remainderInt(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a % b;
  }
}
function divideInt(a, b) {
  return Math.trunc(divideFloat(a, b));
}
function divideFloat(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a / b;
  }
}
function makeError(variant, file, module2, line, fn, message, extra) {
  let error2 = new globalThis.Error(message);
  error2.gleam_error = variant;
  error2.file = file;
  error2.module = module2;
  error2.line = line;
  error2.function = fn;
  error2.fn = fn;
  for (let k in extra) error2[k] = extra[k];
  return error2;
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash2 = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash2);
  return hash2;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash2 = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash2 = Math.imul(31, hash2) + s.charCodeAt(i) | 0;
  }
  return hash2;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var Dict = class {
  constructor(size3, root) {
    this.size = size3;
    this.root = root;
  }
};
var bits = 5;
var mask = (1 << bits) - 1;
var noElementMarker = Symbol();
var generationKey = Symbol();
var emptyNode = /* @__PURE__ */ newNode(0);
var emptyDict = /* @__PURE__ */ new Dict(0, emptyNode);
var errorNil = /* @__PURE__ */ Result$Error(void 0);
function makeNode(generation, datamap, nodemap, data2) {
  return {
    // A node is a high-arity (32 in practice) hybrid tree node.
    // Hybrid means that it stores data directly as well as pointers to child nodes.
    //
    // Each node contains 2 bitmaps:
    // - The datamap has a bit set if that slot in the node contains direct data
    // - The nodemap has a bit set if that slot in the node contains another node.
    //
    // Both are exclusive to on another, so datamap & nodemap == 0.
    //
    // Every key/hash value directly correlates to a specific bit by using a trie
    // suffix (least significant bits first) encoding.
    // For example, if the last 5 bits of the hash are 1101, the bit to check for
    // that value is the 13th bit.
    datamap,
    nodemap,
    // The slots itself are stored in a single contiguous array that contains
    // both direct k/v-pairs and child nodes.
    //
    // The direct children come first, followed by the child nodes in _reverse order_:
    //
    //              7654321
    //     datamap: 1000100
    //     nodemap:   10011
    //     data: [key3, value3, key7, value7, child5, child2, child1]
    //            ------------------------->  <---------------------
    //                     datamap                    nodemap
    //
    // Every `1` bit in the datamap corresponds to a pair of [key, value] entries,
    // and every `1` bit in the nodemap corresponds to a child node entry.
    //
    // Children are stored in reverse order to avoid having to store or calculate an
    // "offset" value to skip over the direct children.
    data: data2,
    // The generation is used to track which nodes need to be copied during transient updates.
    // Using a symbol here makes `isEqual` ignore this field.
    [generationKey]: generation
  };
}
function newNode(generation) {
  return makeNode(generation, 0, 0, []);
}
function copyNode(node, generation) {
  if (node[generationKey] === generation) {
    return node;
  }
  const newData = node.data.slice(0);
  return makeNode(generation, node.datamap, node.nodemap, newData);
}
function copyAndSet(node, generation, idx, val) {
  if (node.data[idx] === val) {
    return node;
  }
  node = copyNode(node, generation);
  node.data[idx] = val;
  return node;
}
function copyAndInsertPair(node, generation, bit, idx, key, val) {
  const data2 = node.data;
  const length5 = data2.length;
  const newData = new Array(length5 + 2);
  let readIndex = 0;
  let writeIndex = 0;
  while (readIndex < idx) newData[writeIndex++] = data2[readIndex++];
  newData[writeIndex++] = key;
  newData[writeIndex++] = val;
  while (readIndex < length5) newData[writeIndex++] = data2[readIndex++];
  return makeNode(generation, node.datamap | bit, node.nodemap, newData);
}
function make() {
  return emptyDict;
}
function size(dict2) {
  return dict2.size;
}
function get(dict2, key) {
  const result = lookup(dict2.root, key, getHash(key));
  return result !== noElementMarker ? Result$Ok(result) : errorNil;
}
function lookup(node, key, hash2) {
  for (let shift = 0; shift < 32; shift += bits) {
    const data2 = node.data;
    const bit = hashbit(hash2, shift);
    if (node.nodemap & bit) {
      node = data2[data2.length - 1 - index(node.nodemap, bit)];
    } else if (node.datamap & bit) {
      const dataidx = Math.imul(index(node.datamap, bit), 2);
      return isEqual(key, data2[dataidx]) ? data2[dataidx + 1] : noElementMarker;
    } else {
      return noElementMarker;
    }
  }
  const overflow = node.data;
  for (let i = 0; i < overflow.length; i += 2) {
    if (isEqual(key, overflow[i])) {
      return overflow[i + 1];
    }
  }
  return noElementMarker;
}
function toTransient(dict2) {
  return {
    generation: nextGeneration(dict2),
    root: dict2.root,
    size: dict2.size,
    dict: dict2
  };
}
function fromTransient(transient) {
  if (transient.root === transient.dict.root) {
    return transient.dict;
  }
  return new Dict(transient.size, transient.root);
}
function nextGeneration(dict2) {
  const root = dict2.root;
  if (root[generationKey] < Number.MAX_SAFE_INTEGER) {
    return root[generationKey] + 1;
  }
  const queue = [root];
  while (queue.length) {
    const node = queue.pop();
    node[generationKey] = 0;
    const nodeStart = data.length - popcount(node.nodemap);
    for (let i = nodeStart; i < node.data.length; ++i) {
      queue.push(node.data[i]);
    }
  }
  return 1;
}
var globalTransient = /* @__PURE__ */ toTransient(emptyDict);
function insert(dict2, key, value) {
  globalTransient.generation = nextGeneration(dict2);
  globalTransient.size = dict2.size;
  const hash2 = getHash(key);
  const root = insertIntoNode(globalTransient, dict2.root, key, value, hash2, 0);
  if (root === dict2.root) {
    return dict2;
  }
  return new Dict(globalTransient.size, root);
}
function destructiveTransientInsert(key, value, transient) {
  const hash2 = getHash(key);
  transient.root = insertIntoNode(transient, transient.root, key, value, hash2, 0);
  return transient;
}
function insertIntoNode(transient, node, key, value, hash2, shift) {
  const data2 = node.data;
  const generation = transient.generation;
  if (shift > 32) {
    for (let i = 0; i < data2.length; i += 2) {
      if (isEqual(key, data2[i])) {
        return copyAndSet(node, generation, i + 1, value);
      }
    }
    transient.size += 1;
    return copyAndInsertPair(node, generation, 0, data2.length, key, value);
  }
  const bit = hashbit(hash2, shift);
  if (node.nodemap & bit) {
    const nodeidx2 = data2.length - 1 - index(node.nodemap, bit);
    let child2 = data2[nodeidx2];
    child2 = insertIntoNode(transient, child2, key, value, hash2, shift + bits);
    return copyAndSet(node, generation, nodeidx2, child2);
  }
  const dataidx = Math.imul(index(node.datamap, bit), 2);
  if ((node.datamap & bit) === 0) {
    transient.size += 1;
    return copyAndInsertPair(node, generation, bit, dataidx, key, value);
  }
  if (isEqual(key, data2[dataidx])) {
    return copyAndSet(node, generation, dataidx + 1, value);
  }
  const childShift = shift + bits;
  let child = emptyNode;
  child = insertIntoNode(transient, child, key, value, hash2, childShift);
  const key2 = data2[dataidx];
  const value2 = data2[dataidx + 1];
  const hash22 = getHash(key2);
  child = insertIntoNode(transient, child, key2, value2, hash22, childShift);
  transient.size -= 1;
  const length5 = data2.length;
  const nodeidx = length5 - 1 - index(node.nodemap, bit);
  const newData = new Array(length5 - 1);
  let readIndex = 0;
  let writeIndex = 0;
  while (readIndex < dataidx) newData[writeIndex++] = data2[readIndex++];
  readIndex += 2;
  while (readIndex <= nodeidx) newData[writeIndex++] = data2[readIndex++];
  newData[writeIndex++] = child;
  while (readIndex < length5) newData[writeIndex++] = data2[readIndex++];
  return makeNode(generation, node.datamap ^ bit, node.nodemap | bit, newData);
}
function map(dict2, fun) {
  const generation = nextGeneration(dict2);
  const root = copyNode(dict2.root, generation);
  const queue = [root];
  while (queue.length) {
    const node = queue.pop();
    const data2 = node.data;
    const edgesStart = data2.length - popcount(node.nodemap);
    for (let i = 0; i < edgesStart; i += 2) {
      data2[i + 1] = fun(data2[i], data2[i + 1]);
    }
    for (let i = edgesStart; i < data2.length; ++i) {
      data2[i] = copyNode(data2[i], generation);
      queue.push(data2[i]);
    }
  }
  return new Dict(dict2.size, root);
}
function fold(dict2, state, fun) {
  const queue = [dict2.root];
  while (queue.length) {
    const node = queue.pop();
    const data2 = node.data;
    const edgesStart = data2.length - popcount(node.nodemap);
    for (let i = 0; i < edgesStart; i += 2) {
      state = fun(state, data2[i], data2[i + 1]);
    }
    for (let i = edgesStart; i < data2.length; ++i) {
      queue.push(data2[i]);
    }
  }
  return state;
}
function popcount(n) {
  n -= n >>> 1 & 1431655765;
  n = (n & 858993459) + (n >>> 2 & 858993459);
  return Math.imul(n + (n >>> 4) & 252645135, 16843009) >>> 24;
}
function index(bitmap, bit) {
  return popcount(bitmap & bit - 1);
}
function hashbit(hash2, shift) {
  return 1 << (hash2 >>> shift & mask);
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a = option[0];
    return new Ok(a);
  } else {
    return new Error2(e);
  }
}
function from_result(result) {
  if (result instanceof Ok) {
    let a = result[0];
    return new Some(a);
  } else {
    return new None();
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}
function lazy_unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$();
  }
}
function map2(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return new Some(fun(x));
  } else {
    return option;
  }
}
function then$(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return fun(x);
  } else {
    return option;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function is_empty(dict2) {
  return size(dict2) === 0;
}
function from_list_loop(loop$transient, loop$list) {
  while (true) {
    let transient = loop$transient;
    let list3 = loop$list;
    if (list3 instanceof Empty) {
      return fromTransient(transient);
    } else {
      let rest = list3.tail;
      let key = list3.head[0];
      let value = list3.head[1];
      loop$transient = destructiveTransientInsert(key, value, transient);
      loop$list = rest;
    }
  }
}
function from_list(list3) {
  return from_list_loop(toTransient(make()), list3);
}
function keys(dict2) {
  return fold(
    dict2,
    toList([]),
    (acc, key, _) => {
      return prepend(key, acc);
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function random(max) {
  let _pipe = random_uniform() * identity(max);
  let _pipe$1 = floor(_pipe);
  return round(_pipe$1);
}

// build/dev/javascript/gleam_stdlib/gleam/string_tree.mjs
function new$() {
  return concat(toList([]));
}
function append(tree, second) {
  return add(tree, identity(second));
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function is_empty2(str) {
  return str === "";
}
function replace(string4, pattern, substitute) {
  let _pipe = string4;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
}
function compare(a, b) {
  let $ = a === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = less_than(a, b);
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}
function slice(string4, idx, len) {
  let $ = len <= 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = string_length(string4) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return string_grapheme_slice(string4, translated_idx, len);
      }
    } else {
      return string_grapheme_slice(string4, idx, len);
    }
  }
}
function drop_end(string4, num_graphemes) {
  let $ = num_graphemes <= 0;
  if ($) {
    return string4;
  } else {
    return slice(string4, 0, string_length(string4) - num_graphemes);
  }
}
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string4 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string4;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function join_loop(loop$strings, loop$separator, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let separator = loop$separator;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string4 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$separator = separator;
      loop$accumulator = accumulator + separator + string4;
    }
  }
}
function join(strings, separator) {
  if (strings instanceof Empty) {
    return "";
  } else {
    let first$1 = strings.head;
    let rest = strings.tail;
    return join_loop(rest, separator, first$1);
  }
}
function trim(string4) {
  let _pipe = string4;
  let _pipe$1 = trim_start(_pipe);
  return trim_end(_pipe$1);
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map3(_pipe$2, identity);
  }
}
function inspect2(term) {
  let _pipe = term;
  let _pipe$1 = inspect(_pipe);
  return identity(_pipe$1);
}
function drop_start(string4, num_graphemes) {
  let $ = num_graphemes <= 0;
  if ($) {
    return string4;
  } else {
    let prefix = string_grapheme_slice(string4, 0, num_graphemes);
    let prefix_size = byte_size(prefix);
    return string_byte_slice(
      string4,
      prefix_size,
      byte_size(string4) - prefix_size
    );
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path2) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path2;
  }
};
var DecodeError$DecodeError = (expected, found, path2) => new DecodeError(expected, found, path2);
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
var dynamic = /* @__PURE__ */ new Decoder(decode_dynamic);
var bool = /* @__PURE__ */ new Decoder(decode_bool);
var int2 = /* @__PURE__ */ new Decoder(decode_int);
var float2 = /* @__PURE__ */ new Decoder(decode_float);
var string2 = /* @__PURE__ */ new Decoder(decode_string);
function run(data2, decoder) {
  let $ = decoder.function(data2);
  let maybe_invalid_data;
  let errors;
  maybe_invalid_data = $[0];
  errors = $[1];
  if (errors instanceof Empty) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error2(errors);
  }
}
function success(data2) {
  return new Decoder((_) => {
    return [data2, toList([])];
  });
}
function decode_dynamic(data2) {
  return [data2, toList([])];
}
function map4(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data2;
      let errors;
      data2 = $[0];
      errors = $[1];
      return [transformer(data2), errors];
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data2 = loop$data;
    let failure = loop$failure;
    let decoders = loop$decoders;
    if (decoders instanceof Empty) {
      return failure;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data2);
      let layer;
      let errors;
      layer = $;
      errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        loop$data = data2;
        loop$failure = failure;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first.function(dynamic_data);
      let layer;
      let errors;
      layer = $;
      errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function optional(inner) {
  return new Decoder(
    (data2) => {
      let $ = is_null(data2);
      if ($) {
        return [new None(), toList([])];
      } else {
        let $1 = inner.function(data2);
        let data$1;
        let errors;
        data$1 = $1[0];
        errors = $1[1];
        return [new Some(data$1), errors];
      }
    }
  );
}
function decode_error(expected, found) {
  return toList([
    new DecodeError(expected, classify_dynamic(found), toList([]))
  ]);
}
function run_dynamic_function(data2, name, f) {
  let $ = f(data2);
  if ($ instanceof Ok) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let placeholder = $[0];
    return [
      placeholder,
      toList([new DecodeError(name, classify_dynamic(data2), toList([]))])
    ];
  }
}
function decode_bool(data2) {
  let $ = isEqual(identity(true), data2);
  if ($) {
    return [true, toList([])];
  } else {
    let $1 = isEqual(identity(false), data2);
    if ($1) {
      return [false, toList([])];
    } else {
      return [false, decode_error("Bool", data2)];
    }
  }
}
function decode_int(data2) {
  return run_dynamic_function(data2, "Int", int);
}
function decode_float(data2) {
  return run_dynamic_function(data2, "Float", float);
}
function decode_string(data2) {
  return run_dynamic_function(data2, "String", string);
}
function path_segment_to_string(key) {
  let decoder = one_of(
    string2,
    toList([
      (() => {
        let _pipe = int2;
        return map4(_pipe, to_string);
      })(),
      (() => {
        let _pipe = float2;
        return map4(_pipe, float_to_string);
      })()
    ])
  );
  let $ = run(key, decoder);
  if ($ instanceof Ok) {
    let key$1 = $[0];
    return key$1;
  } else {
    return "<" + classify_dynamic(key) + ">";
  }
}
function list2(inner) {
  return new Decoder(
    (data2) => {
      return list(
        data2,
        inner.function,
        (p, k) => {
          return push_path(p, toList([k]));
        },
        0,
        toList([])
      );
    }
  );
}
function push_path(layer, path2) {
  let path$1 = map3(
    path2,
    (key) => {
      let _pipe = key;
      let _pipe$1 = identity(_pipe);
      return path_segment_to_string(_pipe$1);
    }
  );
  let errors = map3(
    layer[1],
    (error2) => {
      return new DecodeError(
        error2.expected,
        error2.found,
        append3(path$1, error2.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path2 = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data2 = loop$data;
    let handle_miss = loop$handle_miss;
    if (path2 instanceof Empty) {
      let _pipe = data2;
      let _pipe$1 = inner(_pipe);
      return push_path(_pipe$1, reverse(position));
    } else {
      let key = path2.head;
      let path$1 = path2.tail;
      let $ = index2(data2, key);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof Some) {
          let data$1 = $1[0];
          loop$path = path$1;
          loop$position = prepend(key, position);
          loop$inner = inner;
          loop$data = data$1;
          loop$handle_miss = handle_miss;
        } else {
          return handle_miss(data2, prepend(key, position));
        }
      } else {
        let kind = $[0];
        let $1 = inner(data2);
        let default$;
        default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError(kind, classify_dynamic(data2), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next2) {
  return new Decoder(
    (data2) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data2,
        (data3, position) => {
          let $12 = field_decoder.function(data3);
          let default$;
          default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError("Field", "Nothing", toList([]))])
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out;
      let errors1;
      out = $[0];
      errors1 = $[1];
      let $1 = next2(out).function(data2);
      let out$1;
      let errors2;
      out$1 = $1[0];
      errors2 = $1[1];
      return [out$1, append3(errors1, errors2)];
    }
  );
}
function field(field_name, field_decoder, next2) {
  return subfield(toList([field_name]), field_decoder, next2);
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
function identity(x) {
  return x;
}
function parse_int(value) {
  if (/^[-+]?(\d+)$/.test(value)) {
    return Result$Ok(parseInt(value));
  } else {
    return Result$Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function string_replace(string4, target, substitute) {
  return string4.replaceAll(target, substitute);
}
function string_length(string4) {
  if (string4 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string4.match(/./gsu).length;
  }
}
function graphemes(string4) {
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    return arrayToList(Array.from(iterator).map((item) => item.segment));
  } else {
    return arrayToList(string4.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string4) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string4)[Symbol.iterator]();
  }
}
function pop_codeunit(str) {
  return [str.charCodeAt(0) | 0, str.slice(1)];
}
function lowercase(string4) {
  return string4.toLowerCase();
}
function uppercase(string4) {
  return string4.toUpperCase();
}
function less_than(a, b) {
  return a < b;
}
function add(a, b) {
  return a + b;
}
function split(xs, pattern) {
  return arrayToList(xs.split(pattern));
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
function string_byte_slice(string4, index5, length5) {
  return string4.slice(index5, index5 + length5);
}
function string_grapheme_slice(string4, idx, len) {
  if (len <= 0 || idx >= string4.length) {
    return "";
  }
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    while (idx-- > 0) {
      iterator.next();
    }
    let result = "";
    while (len-- > 0) {
      const v = iterator.next().value;
      if (v === void 0) {
        break;
      }
      result += v.segment;
    }
    return result;
  } else {
    return string4.match(/./gsu).slice(idx, idx + len).join("");
  }
}
function string_codeunit_slice(str, from2, length5) {
  return str.slice(from2, from2 + length5);
}
function contains_string(haystack, needle) {
  return haystack.indexOf(needle) >= 0;
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
function ends_with(haystack, needle) {
  return haystack.endsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function trim_start(string4) {
  return string4.replace(trim_start_regex, "");
}
function trim_end(string4) {
  return string4.replace(trim_end_regex, "");
}
function bit_array_from_string(string4) {
  return toBitArray([stringBits(string4)]);
}
function console_log(term) {
  console.log(term);
}
function bit_array_to_string(bit_array2) {
  if (bit_array2.bitSize % 8 !== 0) {
    return Result$Error(Nil);
  }
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    if (bit_array2.bitOffset === 0) {
      return Result$Ok(decoder.decode(bit_array2.rawBuffer));
    } else {
      const buffer = new Uint8Array(bit_array2.byteSize);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = bit_array2.byteAt(i);
      }
      return Result$Ok(decoder.decode(buffer));
    }
  } catch {
    return Result$Error(Nil);
  }
}
function ceiling(float3) {
  return Math.ceil(float3);
}
function floor(float3) {
  return Math.floor(float3);
}
function round2(float3) {
  return Math.round(float3);
}
function truncate(float3) {
  return Math.trunc(float3);
}
function power2(base, exponent) {
  return Math.pow(base, exponent);
}
function random_uniform() {
  const random_uniform_result = Math.random();
  if (random_uniform_result === 1) {
    return random_uniform();
  }
  return random_uniform_result;
}
function classify_dynamic(data2) {
  if (typeof data2 === "string") {
    return "String";
  } else if (typeof data2 === "boolean") {
    return "Bool";
  } else if (isResult(data2)) {
    return "Result";
  } else if (isList(data2)) {
    return "List";
  } else if (data2 instanceof BitArray) {
    return "BitArray";
  } else if (data2 instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data2)) {
    return "Int";
  } else if (Array.isArray(data2)) {
    return `Array`;
  } else if (typeof data2 === "number") {
    return "Float";
  } else if (data2 === null) {
    return "Nil";
  } else if (data2 === void 0) {
    return "Nil";
  } else {
    const type = typeof data2;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function byte_size(string4) {
  return new TextEncoder().encode(string4).length;
}
var MIN_I32 = -(2 ** 31);
var MAX_I32 = 2 ** 31 - 1;
var U32 = 2 ** 32;
var MAX_SAFE = Number.MAX_SAFE_INTEGER;
var MIN_SAFE = Number.MIN_SAFE_INTEGER;
function inspect(v) {
  return new Inspector().inspect(v);
}
function float_to_string(float3) {
  const string4 = float3.toString().replace("+", "");
  if (string4.indexOf(".") >= 0) {
    return string4;
  } else {
    const index5 = string4.indexOf("e");
    if (index5 >= 0) {
      return string4.slice(0, index5) + ".0" + string4.slice(index5);
    } else {
      return string4 + ".0";
    }
  }
}
var Inspector = class {
  #references = /* @__PURE__ */ new Set();
  inspect(v) {
    const t = typeof v;
    if (v === true) return "True";
    if (v === false) return "False";
    if (v === null) return "//js(null)";
    if (v === void 0) return "Nil";
    if (t === "string") return this.#string(v);
    if (t === "bigint" || Number.isInteger(v)) return v.toString();
    if (t === "number") return float_to_string(v);
    if (v instanceof UtfCodepoint) return this.#utfCodepoint(v);
    if (v instanceof BitArray) return this.#bit_array(v);
    if (v instanceof RegExp) return `//js(${v})`;
    if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error) return `//js(${v.toString()})`;
    if (v instanceof Function) {
      const args = [];
      for (const i of Array(v.length).keys())
        args.push(String.fromCharCode(i + 97));
      return `//fn(${args.join(", ")}) { ... }`;
    }
    if (this.#references.size === this.#references.add(v).size) {
      return "//js(circular reference)";
    }
    let printed;
    if (Array.isArray(v)) {
      printed = `#(${v.map((v2) => this.inspect(v2)).join(", ")})`;
    } else if (isList(v)) {
      printed = this.#list(v);
    } else if (v instanceof CustomType) {
      printed = this.#customType(v);
    } else if (v instanceof Dict) {
      printed = this.#dict(v);
    } else if (v instanceof Set) {
      return `//js(Set(${[...v].map((v2) => this.inspect(v2)).join(", ")}))`;
    } else {
      printed = this.#object(v);
    }
    this.#references.delete(v);
    return printed;
  }
  #object(v) {
    const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body = props.length ? " " + props.join(", ") + " " : "";
    const head = name === "Object" ? "" : name + " ";
    return `//js(${head}{${body}})`;
  }
  #dict(map10) {
    let body = "dict.from_list([";
    let first = true;
    body = fold(map10, body, (body2, key, value) => {
      if (!first) body2 = body2 + ", ";
      first = false;
      return body2 + "#(" + this.inspect(key) + ", " + this.inspect(value) + ")";
    });
    return body + "])";
  }
  #customType(record) {
    const props = Object.keys(record).map((label) => {
      const value = this.inspect(record[label]);
      return isNaN(parseInt(label)) ? `${label}: ${value}` : value;
    }).join(", ");
    return props ? `${record.constructor.name}(${props})` : record.constructor.name;
  }
  #list(list3) {
    if (List$isEmpty(list3)) {
      return "[]";
    }
    let char_out = 'charlist.from_string("';
    let list_out = "[";
    let current = list3;
    while (List$isNonEmpty(current)) {
      let element = current.head;
      current = current.tail;
      if (list_out !== "[") {
        list_out += ", ";
      }
      list_out += this.inspect(element);
      if (char_out) {
        if (Number.isInteger(element) && element >= 32 && element <= 126) {
          char_out += String.fromCharCode(element);
        } else {
          char_out = null;
        }
      }
    }
    if (char_out) {
      return char_out + '")';
    } else {
      return list_out + "]";
    }
  }
  #string(str) {
    let new_str = '"';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      switch (char) {
        case "\n":
          new_str += "\\n";
          break;
        case "\r":
          new_str += "\\r";
          break;
        case "	":
          new_str += "\\t";
          break;
        case "\f":
          new_str += "\\f";
          break;
        case "\\":
          new_str += "\\\\";
          break;
        case '"':
          new_str += '\\"';
          break;
        default:
          if (char < " " || char > "~" && char < "\xA0") {
            new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
          } else {
            new_str += char;
          }
      }
    }
    new_str += '"';
    return new_str;
  }
  #utfCodepoint(codepoint2) {
    return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
  }
  #bit_array(bits2) {
    if (bits2.bitSize === 0) {
      return "<<>>";
    }
    let acc = "<<";
    for (let i = 0; i < bits2.byteSize - 1; i++) {
      acc += bits2.byteAt(i).toString();
      acc += ", ";
    }
    if (bits2.byteSize * 8 === bits2.bitSize) {
      acc += bits2.byteAt(bits2.byteSize - 1).toString();
    } else {
      const trailingBitsCount = bits2.bitSize % 8;
      acc += bits2.byteAt(bits2.byteSize - 1) >> 8 - trailingBitsCount;
      acc += `:size(${trailingBitsCount})`;
    }
    acc += ">>";
    return acc;
  }
};
function index2(data2, key) {
  if (data2 instanceof Dict) {
    const result = get(data2, key);
    return Result$Ok(result.isOk() ? new Some(result[0]) : new None());
  }
  if (data2 instanceof WeakMap || data2 instanceof Map) {
    const token4 = {};
    const entry = data2.get(key, token4);
    if (entry === token4) return Result$Ok(new None());
    return Result$Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key);
  if (key_is_int && key >= 0 && key < 8 && isList(data2)) {
    let i = 0;
    for (const value of data2) {
      if (i === key) return Result$Ok(new Some(value));
      i++;
    }
    return Result$Error("Indexable");
  }
  if (key_is_int && Array.isArray(data2) || data2 && typeof data2 === "object" || data2 && Object.getPrototypeOf(data2) === Object.prototype) {
    if (key in data2) return Result$Ok(new Some(data2[key]));
    return Result$Ok(new None());
  }
  return Result$Error(key_is_int ? "Indexable" : "Dict");
}
function list(data2, decode2, pushPath, index5, emptyList) {
  if (!(isList(data2) || Array.isArray(data2))) {
    const error2 = DecodeError$DecodeError("List", classify_dynamic(data2), emptyList);
    return [emptyList, arrayToList([error2])];
  }
  const decoded = [];
  for (const element of data2) {
    const layer = decode2(element);
    const [out, errors] = layer;
    if (List$isNonEmpty(errors)) {
      const [_, errors2] = pushPath(layer, index5.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index5++;
  }
  return [arrayToList(decoded), emptyList];
}
function float(data2) {
  if (typeof data2 === "number") return Result$Ok(data2);
  return Result$Error(0);
}
function int(data2) {
  if (Number.isInteger(data2)) return Result$Ok(data2);
  return Result$Error(0);
}
function string(data2) {
  if (typeof data2 === "string") return Result$Ok(data2);
  return Result$Error("");
}
function is_null(data2) {
  return data2 === null || data2 === void 0;
}
function arrayToList(array4) {
  let list3 = List$Empty();
  let i = array4.length;
  while (i--) {
    list3 = List$NonEmpty(array4[i], list3);
  }
  return list3;
}
function isList(data2) {
  return List$isEmpty(data2) || List$isNonEmpty(data2);
}
function isResult(data2) {
  return Result$isOk(data2) || Result$isError(data2);
}

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function power(base, exponent) {
  let fractional = ceiling(exponent) - exponent > 0;
  let $ = base < 0 && fractional || base === 0 && exponent < 0;
  if ($) {
    return new Error2(void 0);
  } else {
    return new Ok(power2(base, exponent));
  }
}
function negate(x) {
  return -1 * x;
}
function round(x) {
  let $ = x >= 0;
  if ($) {
    return round2(x);
  } else {
    return 0 - round2(negate(x));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Continue = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Stop = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function length_loop(loop$list, loop$count) {
  while (true) {
    let list3 = loop$list;
    let count = loop$count;
    if (list3 instanceof Empty) {
      return count;
    } else {
      let list$1 = list3.tail;
      loop$list = list$1;
      loop$count = count + 1;
    }
  }
}
function length2(list3) {
  return length_loop(list3, 0);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list3) {
  return reverse_and_prepend(list3, toList([]));
}
function is_empty3(list3) {
  return isEqual(list3, toList([]));
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list3 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      let _block;
      let $ = fun(first$1);
      if ($) {
        _block = prepend(first$1, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list3, predicate) {
  return filter_loop(list3, predicate, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list3 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map3(list3, fun) {
  return map_loop(list3, fun, toList([]));
}
function try_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list3 instanceof Empty) {
      return new Ok(reverse(acc));
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        let first$2 = $[0];
        loop$list = rest$1;
        loop$fun = fun;
        loop$acc = prepend(first$2, acc);
      } else {
        return $;
      }
    }
  }
}
function try_map(list3, fun) {
  return try_map_loop(list3, fun, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first = loop$first;
    let second = loop$second;
    if (first instanceof Empty) {
      return second;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append3(first, second) {
  return append_loop(reverse(first), second);
}
function prepend2(list3, item) {
  return prepend(item, list3);
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists instanceof Empty) {
      return reverse(acc);
    } else {
      let list3 = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list3, acc);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, toList([]));
}
function flat_map(list3, fun) {
  return flatten(map3(list3, fun));
}
function fold2(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list3 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list3 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function try_fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list3 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list3 instanceof Empty) {
      return new Ok(initial);
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      let $ = fun(initial, first$1);
      if ($ instanceof Ok) {
        let result = $[0];
        loop$list = rest$1;
        loop$initial = result;
        loop$fun = fun;
      } else {
        return $;
      }
    }
  }
}
function fold_until(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list3 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list3 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      let $ = fun(initial, first$1);
      if ($ instanceof Continue) {
        let next_accumulator = $[0];
        loop$list = rest$1;
        loop$initial = next_accumulator;
        loop$fun = fun;
      } else {
        let b = $[0];
        return b;
      }
    }
  }
}
function find(loop$list, loop$is_desired) {
  while (true) {
    let list3 = loop$list;
    let is_desired = loop$is_desired;
    if (list3 instanceof Empty) {
      return new Error2(void 0);
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      let $ = is_desired(first$1);
      if ($) {
        return new Ok(first$1);
      } else {
        loop$list = rest$1;
        loop$is_desired = is_desired;
      }
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let compare4 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list3 instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list3.head;
      let rest$1 = list3.tail;
      let $ = compare4(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next2 = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare4(new$1, next2);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending();
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending();
            } else {
              _block$1 = new Descending();
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare4;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next2;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next2);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next2);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list3 = list22;
      return reverse_and_prepend(list3, acc);
    } else if (list22 instanceof Empty) {
      let list3 = list1;
      return reverse_and_prepend(list3, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence2 = sequences2.head;
        return reverse(prepend(reverse(sequence2), acc));
      } else {
        let ascending1 = sequences2.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(
          ascending1,
          ascending2,
          compare4,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list3 = list22;
      return reverse_and_prepend(list3, acc);
    } else if (list22 instanceof Empty) {
      let list3 = list1;
      return reverse_and_prepend(list3, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence2 = sequences2.head;
        return reverse(prepend(reverse(sequence2), acc));
      } else {
        let descending1 = sequences2.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(
          descending1,
          descending2,
          compare4,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2 instanceof Empty) {
      return sequences2;
    } else if (direction instanceof Ascending) {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence2 = sequences2.head;
        return sequence2;
      } else {
        let sequences$1 = merge_ascending_pairs(sequences2, compare4, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Descending();
        loop$compare = compare4;
      }
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence2 = sequences2.head;
        return reverse(sequence2);
      } else {
        let sequences$1 = merge_descending_pairs(sequences2, compare4, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Ascending();
        loop$compare = compare4;
      }
    }
  }
}
function sort(list3, compare4) {
  if (list3 instanceof Empty) {
    return list3;
  } else {
    let $ = list3.tail;
    if ($ instanceof Empty) {
      return list3;
    } else {
      let x = list3.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare4(x, y);
      if ($1 instanceof Lt) {
        _block = new Ascending();
      } else if ($1 instanceof Eq) {
        _block = new Ascending();
      } else {
        _block = new Descending();
      }
      let direction = _block;
      let sequences$1 = sequences(
        rest$1,
        compare4,
        toList([x]),
        direction,
        y,
        toList([])
      );
      return merge_all(sequences$1, new Ascending(), compare4);
    }
  }
}
function key_set_loop(loop$list, loop$key, loop$value, loop$inspected) {
  while (true) {
    let list3 = loop$list;
    let key = loop$key;
    let value = loop$value;
    let inspected = loop$inspected;
    if (list3 instanceof Empty) {
      return reverse(prepend([key, value], inspected));
    } else {
      let k = list3.head[0];
      if (isEqual(k, key)) {
        let rest$1 = list3.tail;
        return reverse_and_prepend(inspected, prepend([k, value], rest$1));
      } else {
        let first$1 = list3.head;
        let rest$1 = list3.tail;
        loop$list = rest$1;
        loop$key = key;
        loop$value = value;
        loop$inspected = prepend(first$1, inspected);
      }
    }
  }
}
function key_set(list3, key, value) {
  return key_set_loop(list3, key, value, toList([]));
}
function drop_while(loop$list, loop$predicate) {
  while (true) {
    let list3 = loop$list;
    let predicate = loop$predicate;
    if (list3 instanceof Empty) {
      return list3;
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      let $ = predicate(first$1);
      if ($) {
        loop$list = rest$1;
        loop$predicate = predicate;
      } else {
        return prepend(first$1, rest$1);
      }
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function is_ok(result) {
  if (result instanceof Ok) {
    return true;
  } else {
    return false;
  }
}
function map5(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    return result;
  }
}
function map_error(result, fun) {
  if (result instanceof Ok) {
    return result;
  } else {
    let error2 = result[0];
    return new Error2(fun(error2));
  }
}
function try$(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return fun(x);
  } else {
    return result;
  }
}
function unwrap2(result, default$) {
  if (result instanceof Ok) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}
function replace_error(result, error2) {
  if (result instanceof Ok) {
    return result;
  } else {
    return new Error2(error2);
  }
}

// build/dev/javascript/filepath/filepath.mjs
function remove_trailing_slash(path2) {
  let $ = ends_with(path2, "/");
  if ($) {
    return drop_end(path2, 1);
  } else {
    return path2;
  }
}
function get_directory_name(loop$path, loop$acc, loop$segment) {
  while (true) {
    let path2 = loop$path;
    let acc = loop$acc;
    let segment = loop$segment;
    if (path2 instanceof Empty) {
      return acc;
    } else {
      let $ = path2.head;
      if ($ === "/") {
        let rest = path2.tail;
        loop$path = rest;
        loop$acc = acc + segment;
        loop$segment = "/";
      } else {
        let first = $;
        let rest = path2.tail;
        loop$path = rest;
        loop$acc = acc;
        loop$segment = segment + first;
      }
    }
  }
}
function directory_name(path2) {
  let path$1 = remove_trailing_slash(path2);
  if (path$1.startsWith("/")) {
    let rest = path$1.slice(1);
    return get_directory_name(graphemes(rest), "/", "");
  } else {
    return get_directory_name(graphemes(path$1), "", "");
  }
}

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value) {
    return value instanceof Promise ? new _PromiseLayer(value) : value;
  }
  static unwrap(value) {
    return value instanceof _PromiseLayer ? value.promise : value;
  }
};
function resolve(value) {
  return Promise.resolve(PromiseLayer.wrap(value));
}
function then_await(promise, fn) {
  return promise.then((value) => fn(PromiseLayer.unwrap(value)));
}
function map_promise(promise, fn) {
  return promise.then(
    (value) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value)))
  );
}
function wait(delay) {
  return new Promise((resolve3) => {
    globalThis.setTimeout(resolve3, delay);
  });
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function try_await(promise, callback) {
  let _pipe = promise;
  return then_await(
    _pipe,
    (result) => {
      if (result instanceof Ok) {
        let a = result[0];
        return callback(a);
      } else {
        let e = result[0];
        return resolve(new Error2(e));
      }
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
var token = void 0;
function contains(set2, member) {
  let _pipe = set2.dict;
  let _pipe$1 = get(_pipe, member);
  return is_ok(_pipe$1);
}
function from_list2(members) {
  let dict2 = fold2(
    members,
    make(),
    (m, k) => {
      return insert(m, k, token);
    }
  );
  return new Set2(dict2);
}

// build/dev/javascript/simplifile/simplifile_js.mjs
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_process = __toESM(require("node:process"), 1);
function readBits(filepath) {
  return gleamResult(() => {
    const contents = import_node_fs.default.readFileSync(import_node_path.default.normalize(filepath));
    return new BitArray(new Uint8Array(contents));
  });
}
function writeBits(filepath, contents) {
  return gleamResult(
    () => import_node_fs.default.writeFileSync(import_node_path.default.normalize(filepath), toUint8Array(contents))
  );
}
function toUint8Array(contents) {
  if (contents.bitSize % 8 !== 0) {
    throw new Error2(new Einval());
  }
  let buffer = contents.rawBuffer;
  if (contents.bitOffset !== 0) {
    buffer = new Uint8Array(contents.byteSize);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = contents.byteAt(i);
    }
  }
  return buffer;
}
function createDirAll(filepath) {
  return gleamResult(() => {
    import_node_fs.default.mkdirSync(import_node_path.default.normalize(filepath), { recursive: true });
  });
}
function currentDirectory() {
  return gleamResult(() => import_node_process.default.cwd());
}
function gleamResult(op) {
  try {
    const val = op();
    return new Ok(val);
  } catch (e) {
    return new Error2(cast_error(e.code));
  }
}
function cast_error(error_code) {
  switch (error_code) {
    case "EACCES":
      return new Eacces();
    case "EAGAIN":
      return new Eagain();
    case "EBADF":
      return new Ebadf();
    case "EBADMSG":
      return new Ebadmsg();
    case "EBUSY":
      return new Ebusy();
    case "EDEADLK":
      return new Edeadlk();
    case "EDEADLOCK":
      return new Edeadlock();
    case "EDQUOT":
      return new Edquot();
    case "EEXIST":
      return new Eexist();
    case "EFAULT":
      return new Efault();
    case "EFBIG":
      return new Efbig();
    case "EFTYPE":
      return new Eftype();
    case "EINTR":
      return new Eintr();
    case "EINVAL":
      return new Einval();
    case "EIO":
      return new Eio();
    case "EISDIR":
      return new Eisdir();
    case "ELOOP":
      return new Eloop();
    case "EMFILE":
      return new Emfile();
    case "EMLINK":
      return new Emlink();
    case "EMULTIHOP":
      return new Emultihop();
    case "ENAMETOOLONG":
      return new Enametoolong();
    case "ENFILE":
      return new Enfile();
    case "ENOBUFS":
      return new Enobufs();
    case "ENODEV":
      return new Enodev();
    case "ENOLCK":
      return new Enolck();
    case "ENOLINK":
      return new Enolink();
    case "ENOENT":
      return new Enoent();
    case "ENOMEM":
      return new Enomem();
    case "ENOSPC":
      return new Enospc();
    case "ENOSR":
      return new Enosr();
    case "ENOSTR":
      return new Enostr();
    case "ENOSYS":
      return new Enosys();
    case "ENOBLK":
      return new Enotblk();
    case "ENOTDIR":
      return new Enotdir();
    case "ENOTSUP":
      return new Enotsup();
    case "ENXIO":
      return new Enxio();
    case "EOPNOTSUPP":
      return new Eopnotsupp();
    case "EOVERFLOW":
      return new Eoverflow();
    case "EPERM":
      return new Eperm();
    case "EPIPE":
      return new Epipe();
    case "ERANGE":
      return new Erange();
    case "EROFS":
      return new Erofs();
    case "ESPIPE":
      return new Espipe();
    case "ESRCH":
      return new Esrch();
    case "ESTALE":
      return new Estale();
    case "ETXTBSY":
      return new Etxtbsy();
    case "EXDEV":
      return new Exdev();
    case "NOTUTF8":
      return new NotUtf8();
    default:
      return new Unknown(error_code);
  }
}

// build/dev/javascript/simplifile/simplifile.mjs
var Eacces = class extends CustomType {
};
var Eagain = class extends CustomType {
};
var Ebadf = class extends CustomType {
};
var Ebadmsg = class extends CustomType {
};
var Ebusy = class extends CustomType {
};
var Edeadlk = class extends CustomType {
};
var Edeadlock = class extends CustomType {
};
var Edquot = class extends CustomType {
};
var Eexist = class extends CustomType {
};
var Efault = class extends CustomType {
};
var Efbig = class extends CustomType {
};
var Eftype = class extends CustomType {
};
var Eintr = class extends CustomType {
};
var Einval = class extends CustomType {
};
var Eio = class extends CustomType {
};
var Eisdir = class extends CustomType {
};
var Eloop = class extends CustomType {
};
var Emfile = class extends CustomType {
};
var Emlink = class extends CustomType {
};
var Emultihop = class extends CustomType {
};
var Enametoolong = class extends CustomType {
};
var Enfile = class extends CustomType {
};
var Enobufs = class extends CustomType {
};
var Enodev = class extends CustomType {
};
var Enolck = class extends CustomType {
};
var Enolink = class extends CustomType {
};
var Enoent = class extends CustomType {
};
var Enomem = class extends CustomType {
};
var Enospc = class extends CustomType {
};
var Enosr = class extends CustomType {
};
var Enostr = class extends CustomType {
};
var Enosys = class extends CustomType {
};
var Enotblk = class extends CustomType {
};
var Enotdir = class extends CustomType {
};
var Enotsup = class extends CustomType {
};
var Enxio = class extends CustomType {
};
var Eopnotsupp = class extends CustomType {
};
var Eoverflow = class extends CustomType {
};
var Eperm = class extends CustomType {
};
var Epipe = class extends CustomType {
};
var Erange = class extends CustomType {
};
var Erofs = class extends CustomType {
};
var Espipe = class extends CustomType {
};
var Esrch = class extends CustomType {
};
var Estale = class extends CustomType {
};
var Etxtbsy = class extends CustomType {
};
var Exdev = class extends CustomType {
};
var NotUtf8 = class extends CustomType {
};
var Unknown = class extends CustomType {
  constructor(inner) {
    super();
    this.inner = inner;
  }
};
function read(filepath) {
  let $ = readBits(filepath);
  if ($ instanceof Ok) {
    let bits2 = $[0];
    let $1 = bit_array_to_string(bits2);
    if ($1 instanceof Ok) {
      return $1;
    } else {
      return new Error2(new NotUtf8());
    }
  } else {
    return $;
  }
}
function write(filepath, contents) {
  let _pipe = contents;
  let _pipe$1 = bit_array_from_string(_pipe);
  return writeBits(filepath, _pipe$1);
}
function create_directory_all(dirpath) {
  return createDirAll(dirpath + "/");
}

// build/dev/javascript/envoy/envoy_ffi.mjs
function get2(key) {
  let value;
  if (globalThis.Deno) {
    value = Deno.env.get(key);
  } else if (globalThis.process) {
    value = process.env[key];
  }
  if (value === void 0) {
    return Result$Error(void 0);
  } else {
    return Result$Ok(value);
  }
}

// build/dev/javascript/gleam_time/gleam/time/duration.mjs
var Duration = class extends CustomType {
  constructor(seconds2, nanoseconds2) {
    super();
    this.seconds = seconds2;
    this.nanoseconds = nanoseconds2;
  }
};
var empty = /* @__PURE__ */ new Duration(0, 0);
function normalise(duration) {
  let multiplier = 1e9;
  let nanoseconds$1 = remainderInt(duration.nanoseconds, multiplier);
  let overflow = duration.nanoseconds - nanoseconds$1;
  let seconds$1 = duration.seconds + divideInt(overflow, multiplier);
  let $ = nanoseconds$1 >= 0;
  if ($) {
    return new Duration(seconds$1, nanoseconds$1);
  } else {
    return new Duration(seconds$1 - 1, multiplier + nanoseconds$1);
  }
}
function add2(left, right) {
  let _pipe = new Duration(
    left.seconds + right.seconds,
    left.nanoseconds + right.nanoseconds
  );
  return normalise(_pipe);
}
function seconds(amount) {
  return new Duration(amount, 0);
}
function minutes(amount) {
  return seconds(amount * 60);
}
function hours(amount) {
  return seconds(amount * 60 * 60);
}

// build/dev/javascript/gleam_time/gleam/time/calendar.mjs
var Date2 = class extends CustomType {
  constructor(year, month, day) {
    super();
    this.year = year;
    this.month = month;
    this.day = day;
  }
};
var TimeOfDay = class extends CustomType {
  constructor(hours2, minutes2, seconds2, nanoseconds2) {
    super();
    this.hours = hours2;
    this.minutes = minutes2;
    this.seconds = seconds2;
    this.nanoseconds = nanoseconds2;
  }
};
var January = class extends CustomType {
};
var February = class extends CustomType {
};
var March = class extends CustomType {
};
var April = class extends CustomType {
};
var May = class extends CustomType {
};
var June = class extends CustomType {
};
var July = class extends CustomType {
};
var August = class extends CustomType {
};
var September = class extends CustomType {
};
var October = class extends CustomType {
};
var November = class extends CustomType {
};
var December = class extends CustomType {
};
var utc_offset = empty;

// build/dev/javascript/youid/youid/uuid.mjs
var Uuid = class extends CustomType {
  constructor(value) {
    super();
    this.value = value;
  }
};
var nil = /* @__PURE__ */ new Uuid(
  /* @__PURE__ */ toBitArray([sizedInt(0, 128, true)])
);

// build/dev/javascript/starlist/actions/core_ffi.mjs
function setExitCode(value) {
  if (ExitCode$isFailure(value)) {
    process.exitCode = 1;
  } else if (ExitCode$isSuccess(value)) {
    process.exitCode = 0;
  } else if (typeof value == "number") {
    process.exitCode = value;
  }
}

// build/dev/javascript/starlist/actions/core.mjs
var InputOptions = class extends CustomType {
  constructor(required, trim_whitespace) {
    super();
    this.required = required;
    this.trim_whitespace = trim_whitespace;
  }
};
var Failure = class extends CustomType {
};
var ExitCode$isFailure = (value) => value instanceof Failure;
var Success = class extends CustomType {
};
var ExitCode$isSuccess = (value) => value instanceof Success;
var Title = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var File = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var StartLine = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var EndLine = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var StartColumn = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var default_input_options = /* @__PURE__ */ new InputOptions(false, true);
function get_input_with_options(name, opts) {
  let _block;
  {
    let _block$12;
    let _pipe = name;
    let _pipe$1 = replace(_pipe, " ", "_");
    _block$12 = uppercase(_pipe$1);
    let name_ = _block$12;
    let _pipe$2 = get2("INPUT_" + name_);
    _block = unwrap2(_pipe$2, "");
  }
  let value = _block;
  let _block$1;
  let $ = opts.trim_whitespace;
  if ($) {
    _block$1 = trim(value);
  } else {
    _block$1 = value;
  }
  let trimmed_value = _block$1;
  let $1 = opts.required;
  let $2 = trimmed_value === "";
  if ($1 && $2) {
    return new Error2("Input required and not supplied: " + name);
  } else {
    return new Ok(trimmed_value);
  }
}
function info(message) {
  return console_log(message);
}
function annotation_to_command_properties(props) {
  let $ = is_empty3(props);
  if ($) {
    return new None();
  } else {
    let _pipe = props;
    let _pipe$1 = fold2(
      _pipe,
      make(),
      (acc, property) => {
        if (property instanceof Title) {
          let value = property[0];
          return insert(acc, "title", value);
        } else if (property instanceof File) {
          let value = property[0];
          return insert(acc, "file", value);
        } else if (property instanceof StartLine) {
          let value = property[0];
          return insert(acc, "startLine", to_string(value));
        } else if (property instanceof EndLine) {
          let value = property[0];
          return insert(acc, "endLine", to_string(value));
        } else if (property instanceof StartColumn) {
          let value = property[0];
          return insert(acc, "startColumn", to_string(value));
        } else {
          let value = property[0];
          return insert(acc, "endColumn", to_string(value));
        }
      }
    );
    return new Some(_pipe$1);
  }
}
function escape_data(value) {
  let _pipe = value;
  let _pipe$1 = replace(_pipe, "%", "%25");
  let _pipe$2 = replace(_pipe$1, "\r", "%0D");
  return replace(_pipe$2, "\n", "%0A");
}
function escape_property(value) {
  let _pipe = value;
  let _pipe$1 = escape_data(_pipe);
  let _pipe$2 = replace(_pipe$1, ":", "%3A");
  return replace(_pipe$2, ",", "%2C");
}
function command_properties_to_string(props) {
  let $ = is_empty(props);
  if ($) {
    return "";
  } else {
    let _block;
    let _pipe = props;
    let _pipe$1 = fold(
      _pipe,
      toList([]),
      (acc, k, v) => {
        return prepend(k + "=" + escape_property(v), acc);
      }
    );
    _block = join(_pipe$1, ",");
    let values3 = _block;
    return " " + values3;
  }
}
function issue_command(command2, message, props) {
  let _block;
  let _pipe = props;
  let _pipe$1 = unwrap(_pipe, make());
  _block = command_properties_to_string(_pipe$1);
  let properties = _block;
  return console_log(
    "::" + command2 + "::" + properties + escape_data(message)
  );
}
function set_secret(secret) {
  let $ = get2("GITHUB_ACTIONS");
  if ($ instanceof Ok) {
    let $1 = $[0];
    if ($1 === "true") {
      return issue_command("add-mask", secret, new None());
    } else {
      return issue_command("add-mask", "not-in-github-actions", new None());
    }
  } else {
    return issue_command("add-mask", "not-in-github-actions", new None());
  }
}
function log_issue_with_properties(command2, message, props) {
  return issue_command(
    command2,
    message,
    annotation_to_command_properties(props)
  );
}
function error(message) {
  return log_issue_with_properties("error", message, toList([]));
}
function warning(message) {
  return log_issue_with_properties("warning", message, toList([]));
}
function issue(command2, message) {
  return issue_command(command2, message, new None());
}
function start_group(name) {
  return issue("group", name);
}
function end_group() {
  return issue("endgroup", "");
}
function debug(message) {
  return issue("debug", message);
}
function set_failed(message) {
  setExitCode(new Failure());
  return error(message);
}
function get_input(name) {
  let _pipe = name;
  let _pipe$1 = get_input_with_options(_pipe, default_input_options);
  return unwrap2(_pipe$1, "");
}

// build/dev/javascript/tom/tom.mjs
var FILEPATH = "src/tom.gleam";
var Int = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Float = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Infinity2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Nan = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Bool = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var String2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Date3 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Time = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DateTime = class extends CustomType {
  constructor(date, time, offset) {
    super();
    this.date = date;
    this.time = time;
    this.offset = offset;
  }
};
var Array2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ArrayOfTables = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Table = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var InlineTable = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Local = class extends CustomType {
};
var Offset = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Positive = class extends CustomType {
};
var Negative = class extends CustomType {
};
var Unexpected = class extends CustomType {
  constructor(got, expected) {
    super();
    this.got = got;
    this.expected = expected;
  }
};
var KeyAlreadyInUse = class extends CustomType {
  constructor(key) {
    super();
    this.key = key;
  }
};
var NotFound = class extends CustomType {
  constructor(key) {
    super();
    this.key = key;
  }
};
var WrongType = class extends CustomType {
  constructor(key, expected, got) {
    super();
    this.key = key;
    this.expected = expected;
    this.got = got;
  }
};
function classify(toml) {
  if (toml instanceof Int) {
    return "Int";
  } else if (toml instanceof Float) {
    return "Float";
  } else if (toml instanceof Infinity2) {
    let $ = toml[0];
    if ($ instanceof Positive) {
      return "Infinity";
    } else {
      return "Negative Infinity";
    }
  } else if (toml instanceof Nan) {
    let $ = toml[0];
    if ($ instanceof Positive) {
      return "NaN";
    } else {
      return "Negative NaN";
    }
  } else if (toml instanceof Bool) {
    return "Bool";
  } else if (toml instanceof String2) {
    return "String";
  } else if (toml instanceof Date3) {
    return "Date";
  } else if (toml instanceof Time) {
    return "Time";
  } else if (toml instanceof DateTime) {
    return "DateTime";
  } else if (toml instanceof Array2) {
    return "Array";
  } else if (toml instanceof ArrayOfTables) {
    return "Array";
  } else if (toml instanceof Table) {
    return "Table";
  } else {
    return "Table";
  }
}
function push_key(result, key) {
  if (result instanceof Ok) {
    return result;
  } else {
    let $ = result[0];
    if ($ instanceof NotFound) {
      let path2 = $.key;
      return new Error2(new NotFound(prepend(key, path2)));
    } else {
      let path2 = $.key;
      let expected = $.expected;
      let got = $.got;
      return new Error2(new WrongType(prepend(key, path2), expected, got));
    }
  }
}
function get3(toml, key) {
  if (key instanceof Empty) {
    return new Error2(new NotFound(toList([])));
  } else {
    let $ = key.tail;
    if ($ instanceof Empty) {
      let k = key.head;
      return replace_error(
        get(toml, k),
        new NotFound(toList([k]))
      );
    } else {
      let k = key.head;
      let key$1 = $;
      let $1 = get(toml, k);
      if ($1 instanceof Ok) {
        let $2 = $1[0];
        if ($2 instanceof Table) {
          let t = $2[0];
          return push_key(get3(t, key$1), k);
        } else if ($2 instanceof InlineTable) {
          let t = $2[0];
          return push_key(get3(t, key$1), k);
        } else {
          let other = $2;
          return new Error2(new WrongType(toList([k]), "Table", classify(other)));
        }
      } else {
        return new Error2(new NotFound(toList([k])));
      }
    }
  }
}
function get_int(toml, key) {
  let $ = get3(toml, key);
  if ($ instanceof Ok) {
    let $1 = $[0];
    if ($1 instanceof Int) {
      let i = $1[0];
      return new Ok(i);
    } else {
      let other = $1;
      return new Error2(new WrongType(key, "Int", classify(other)));
    }
  } else {
    return $;
  }
}
function get_string(toml, key) {
  let $ = get3(toml, key);
  if ($ instanceof Ok) {
    let $1 = $[0];
    if ($1 instanceof String2) {
      let i = $1[0];
      return new Ok(i);
    } else {
      let other = $1;
      return new Error2(new WrongType(key, "String", classify(other)));
    }
  } else {
    return $;
  }
}
function merge(table, key, old, new$7) {
  if (old instanceof ArrayOfTables && new$7 instanceof ArrayOfTables) {
    let tables = old[0];
    let new$1 = new$7[0];
    return new Ok(
      insert(table, key, new ArrayOfTables(append3(new$1, tables)))
    );
  } else {
    return new Error2(toList([key]));
  }
}
function insert_loop(table, key, value) {
  if (key instanceof Empty) {
    throw makeError(
      "panic",
      FILEPATH,
      "tom",
      529,
      "insert_loop",
      "unreachable",
      {}
    );
  } else {
    let $ = key.tail;
    if ($ instanceof Empty) {
      let k = key.head;
      let $1 = get(table, k);
      if ($1 instanceof Ok) {
        let old = $1[0];
        return merge(table, k, old, value);
      } else {
        return new Ok(insert(table, k, value));
      }
    } else {
      let k = key.head;
      let key$1 = $;
      let $1 = get(table, k);
      if ($1 instanceof Ok) {
        let $2 = $1[0];
        if ($2 instanceof ArrayOfTables) {
          let $3 = $2[0];
          if ($3 instanceof Empty) {
            return new Error2(toList([k]));
          } else {
            let inner = $3.head;
            let rest = $3.tail;
            let $4 = insert_loop(inner, key$1, value);
            if ($4 instanceof Ok) {
              let inner$1 = $4[0];
              return new Ok(
                insert(
                  table,
                  k,
                  new ArrayOfTables(prepend(inner$1, rest))
                )
              );
            } else {
              let path2 = $4[0];
              return new Error2(prepend(k, path2));
            }
          }
        } else if ($2 instanceof Table) {
          let inner = $2[0];
          let $3 = insert_loop(inner, key$1, value);
          if ($3 instanceof Ok) {
            let inner$1 = $3[0];
            return new Ok(insert(table, k, new Table(inner$1)));
          } else {
            let path2 = $3[0];
            return new Error2(prepend(k, path2));
          }
        } else {
          return new Error2(toList([k]));
        }
      } else {
        let $2 = insert_loop(make(), key$1, value);
        if ($2 instanceof Ok) {
          let inner = $2[0];
          return new Ok(insert(table, k, new Table(inner)));
        } else {
          let path2 = $2[0];
          return new Error2(prepend(k, path2));
        }
      }
    }
  }
}
function insert2(table, key, value) {
  let $ = insert_loop(table, key, value);
  if ($ instanceof Ok) {
    return $;
  } else {
    let path2 = $[0];
    return new Error2(new KeyAlreadyInUse(path2));
  }
}
function expect_end_of_line(input, next2) {
  if (input instanceof Empty) {
    return new Error2(new Unexpected("EOF", "\n"));
  } else {
    let $ = input.head;
    if ($ === "\n") {
      let input$1 = input.tail;
      return next2(input$1);
    } else if ($ === "\r\n") {
      let input$1 = input.tail;
      return next2(input$1);
    } else {
      let g = $;
      return new Error2(new Unexpected(g, "\n"));
    }
  }
}
function parse_key_quoted(loop$input, loop$close, loop$name) {
  while (true) {
    let input = loop$input;
    let close = loop$close;
    let name = loop$name;
    if (input instanceof Empty) {
      return new Error2(new Unexpected("EOF", close));
    } else {
      let g = input.head;
      if (g === close) {
        let input$1 = input.tail;
        return new Ok([name, input$1]);
      } else {
        let g2 = input.head;
        let input$1 = input.tail;
        loop$input = input$1;
        loop$close = close;
        loop$name = name + g2;
      }
    }
  }
}
function parse_key_bare(loop$input, loop$name) {
  while (true) {
    let input = loop$input;
    let name = loop$name;
    if (input instanceof Empty) {
      return new Error2(new Unexpected("EOF", "key"));
    } else {
      let $ = input.head;
      if ($ === " " && name !== "") {
        let input$1 = input.tail;
        return new Ok([name, input$1]);
      } else if ($ === "=" && name !== "") {
        return new Ok([name, input]);
      } else if ($ === "." && name !== "") {
        return new Ok([name, input]);
      } else if ($ === "]") {
        if (name !== "") {
          return new Ok([name, input]);
        } else {
          return new Error2(new Unexpected("]", "key"));
        }
      } else if ($ === ",") {
        if (name !== "") {
          return new Error2(new Unexpected(",", "="));
        } else {
          return new Error2(new Unexpected(",", "key"));
        }
      } else if ($ === "\n") {
        if (name !== "") {
          return new Error2(new Unexpected("\n", "="));
        } else {
          return new Error2(new Unexpected("\n", "key"));
        }
      } else if ($ === "\r\n") {
        if (name !== "") {
          return new Error2(new Unexpected("\r\n", "="));
        } else {
          return new Error2(new Unexpected("\r\n", "key"));
        }
      } else {
        let g = $;
        let input$1 = input.tail;
        loop$input = input$1;
        loop$name = name + g;
      }
    }
  }
}
function skip_line_whitespace(input) {
  return drop_while(input, (g) => {
    return g === " " || g === "	";
  });
}
function parse_key_segment(input) {
  let input$1 = skip_line_whitespace(input);
  if (input$1 instanceof Empty) {
    return parse_key_bare(input$1, "");
  } else {
    let $ = input$1.head;
    if ($ === "=") {
      return new Error2(new Unexpected("=", "Key"));
    } else if ($ === "\n") {
      return new Error2(new Unexpected("\n", "Key"));
    } else if ($ === "\r\n") {
      return new Error2(new Unexpected("\r\n", "Key"));
    } else if ($ === "[") {
      return new Error2(new Unexpected("[", "Key"));
    } else if ($ === '"') {
      let input$2 = input$1.tail;
      return parse_key_quoted(input$2, '"', "");
    } else if ($ === "'") {
      let input$2 = input$1.tail;
      return parse_key_quoted(input$2, "'", "");
    } else {
      return parse_key_bare(input$1, "");
    }
  }
}
function skip_whitespace(loop$input) {
  while (true) {
    let input = loop$input;
    if (input instanceof Empty) {
      return input;
    } else {
      let $ = input.head;
      if ($ === " ") {
        let input$1 = input.tail;
        loop$input = input$1;
      } else if ($ === "	") {
        let input$1 = input.tail;
        loop$input = input$1;
      } else if ($ === "\n") {
        let input$1 = input.tail;
        loop$input = input$1;
      } else if ($ === "\r\n") {
        let input$1 = input.tail;
        loop$input = input$1;
      } else {
        return input;
      }
    }
  }
}
function drop_comments(loop$input, loop$acc, loop$in_string) {
  while (true) {
    let input = loop$input;
    let acc = loop$acc;
    let in_string = loop$in_string;
    if (input instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = input.tail;
      if ($ instanceof Empty) {
        let $1 = input.head;
        if ($1 === '"') {
          let input$1 = $;
          loop$input = input$1;
          loop$acc = prepend('"', acc);
          loop$in_string = !in_string;
        } else if ($1 === "#") {
          if (in_string) {
            let input$1 = $;
            loop$input = input$1;
            loop$acc = prepend("#", acc);
            loop$in_string = in_string;
          } else if (!in_string) {
            let input$1 = $;
            let _pipe = input$1;
            let _pipe$1 = drop_while(_pipe, (g) => {
              return g !== "\n";
            });
            loop$input = _pipe$1;
            loop$acc = acc;
            loop$in_string = in_string;
          } else {
            let g = $1;
            let input$1 = $;
            loop$input = input$1;
            loop$acc = prepend(g, acc);
            loop$in_string = in_string;
          }
        } else {
          let g = $1;
          let input$1 = $;
          loop$input = input$1;
          loop$acc = prepend(g, acc);
          loop$in_string = in_string;
        }
      } else {
        let $1 = input.head;
        if ($1 === "\\") {
          let $2 = $.head;
          if ($2 === '"' && in_string) {
            let input$1 = $.tail;
            loop$input = input$1;
            loop$acc = prepend('"', prepend("\\", acc));
            loop$in_string = in_string;
          } else {
            let g = $1;
            let input$1 = $;
            loop$input = input$1;
            loop$acc = prepend(g, acc);
            loop$in_string = in_string;
          }
        } else if ($1 === '"') {
          let input$1 = $;
          loop$input = input$1;
          loop$acc = prepend('"', acc);
          loop$in_string = !in_string;
        } else if ($1 === "'") {
          let $2 = $.tail;
          if ($2 instanceof Empty) {
            let g = $1;
            let input$1 = $;
            loop$input = input$1;
            loop$acc = prepend(g, acc);
            loop$in_string = in_string;
          } else {
            let $3 = $.head;
            if ($3 === "'") {
              let $4 = $2.head;
              if ($4 === "'") {
                let input$1 = $2.tail;
                loop$input = input$1;
                loop$acc = prepend(
                  "'",
                  prepend("'", prepend("'", acc))
                );
                loop$in_string = !in_string;
              } else {
                let g = $1;
                let input$1 = $;
                loop$input = input$1;
                loop$acc = prepend(g, acc);
                loop$in_string = in_string;
              }
            } else {
              let g = $1;
              let input$1 = $;
              loop$input = input$1;
              loop$acc = prepend(g, acc);
              loop$in_string = in_string;
            }
          }
        } else if ($1 === "#") {
          if (in_string) {
            let input$1 = $;
            loop$input = input$1;
            loop$acc = prepend("#", acc);
            loop$in_string = in_string;
          } else if (!in_string) {
            let input$1 = $;
            let _pipe = input$1;
            let _pipe$1 = drop_while(_pipe, (g) => {
              return g !== "\n";
            });
            loop$input = _pipe$1;
            loop$acc = acc;
            loop$in_string = in_string;
          } else {
            let g = $1;
            let input$1 = $;
            loop$input = input$1;
            loop$acc = prepend(g, acc);
            loop$in_string = in_string;
          }
        } else {
          let g = $1;
          let input$1 = $;
          loop$input = input$1;
          loop$acc = prepend(g, acc);
          loop$in_string = in_string;
        }
      }
    }
  }
}
function do$(result, next2) {
  if (result instanceof Ok) {
    let a = result[0][0];
    let input = result[0][1];
    return next2(a, input);
  } else {
    return result;
  }
}
function parse_key(input, segments) {
  return do$(
    parse_key_segment(input),
    (segment, input2) => {
      let segments$1 = prepend(segment, segments);
      let input$1 = skip_line_whitespace(input2);
      if (input$1 instanceof Empty) {
        return new Ok([reverse(segments$1), input$1]);
      } else {
        let $ = input$1.head;
        if ($ === ".") {
          let input$2 = input$1.tail;
          return parse_key(input$2, segments$1);
        } else {
          return new Ok([reverse(segments$1), input$1]);
        }
      }
    }
  );
}
function expect(input, expected, next2) {
  if (input instanceof Empty) {
    return new Error2(new Unexpected("EOF", expected));
  } else {
    let g = input.head;
    if (g === expected) {
      let input$1 = input.tail;
      return next2(input$1);
    } else {
      let g2 = input.head;
      return new Error2(new Unexpected(g2, expected));
    }
  }
}
function parse_table_header(input) {
  let input$1 = skip_line_whitespace(input);
  return do$(
    parse_key(input$1, toList([])),
    (key, input2) => {
      return expect(
        input2,
        "]",
        (input3) => {
          let input$12 = skip_line_whitespace(input3);
          return expect_end_of_line(
            input$12,
            (input4) => {
              return new Ok([key, input4]);
            }
          );
        }
      );
    }
  );
}
function parse_hex(loop$input, loop$number, loop$sign) {
  while (true) {
    let input = loop$input;
    let number = loop$number;
    let sign = loop$sign;
    if (input instanceof Empty) {
      let input$1 = input;
      let _block;
      if (sign instanceof Positive) {
        _block = number;
      } else {
        _block = -number;
      }
      let number$1 = _block;
      return new Ok([new Int(number$1), input$1]);
    } else {
      let $ = input.head;
      if ($ === "_") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number;
        loop$sign = sign;
      } else if ($ === "0") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 0;
        loop$sign = sign;
      } else if ($ === "1") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 1;
        loop$sign = sign;
      } else if ($ === "2") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 2;
        loop$sign = sign;
      } else if ($ === "3") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 3;
        loop$sign = sign;
      } else if ($ === "4") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 4;
        loop$sign = sign;
      } else if ($ === "5") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 5;
        loop$sign = sign;
      } else if ($ === "6") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 6;
        loop$sign = sign;
      } else if ($ === "7") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 7;
        loop$sign = sign;
      } else if ($ === "8") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 8;
        loop$sign = sign;
      } else if ($ === "9") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 9;
        loop$sign = sign;
      } else if ($ === "a") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 10;
        loop$sign = sign;
      } else if ($ === "b") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 11;
        loop$sign = sign;
      } else if ($ === "c") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 12;
        loop$sign = sign;
      } else if ($ === "d") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 13;
        loop$sign = sign;
      } else if ($ === "e") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 14;
        loop$sign = sign;
      } else if ($ === "f") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 15;
        loop$sign = sign;
      } else if ($ === "A") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 10;
        loop$sign = sign;
      } else if ($ === "B") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 11;
        loop$sign = sign;
      } else if ($ === "C") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 12;
        loop$sign = sign;
      } else if ($ === "D") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 13;
        loop$sign = sign;
      } else if ($ === "E") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 14;
        loop$sign = sign;
      } else if ($ === "F") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 16 + 15;
        loop$sign = sign;
      } else {
        let input$1 = input;
        let _block;
        if (sign instanceof Positive) {
          _block = number;
        } else {
          _block = -number;
        }
        let number$1 = _block;
        return new Ok([new Int(number$1), input$1]);
      }
    }
  }
}
function parse_octal(loop$input, loop$number, loop$sign) {
  while (true) {
    let input = loop$input;
    let number = loop$number;
    let sign = loop$sign;
    if (input instanceof Empty) {
      let input$1 = input;
      let _block;
      if (sign instanceof Positive) {
        _block = number;
      } else {
        _block = -number;
      }
      let number$1 = _block;
      return new Ok([new Int(number$1), input$1]);
    } else {
      let $ = input.head;
      if ($ === "_") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number;
        loop$sign = sign;
      } else if ($ === "0") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 8 + 0;
        loop$sign = sign;
      } else if ($ === "1") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 8 + 1;
        loop$sign = sign;
      } else if ($ === "2") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 8 + 2;
        loop$sign = sign;
      } else if ($ === "3") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 8 + 3;
        loop$sign = sign;
      } else if ($ === "4") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 8 + 4;
        loop$sign = sign;
      } else if ($ === "5") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 8 + 5;
        loop$sign = sign;
      } else if ($ === "6") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 8 + 6;
        loop$sign = sign;
      } else if ($ === "7") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 8 + 7;
        loop$sign = sign;
      } else {
        let input$1 = input;
        let _block;
        if (sign instanceof Positive) {
          _block = number;
        } else {
          _block = -number;
        }
        let number$1 = _block;
        return new Ok([new Int(number$1), input$1]);
      }
    }
  }
}
function parse_binary(loop$input, loop$number, loop$sign) {
  while (true) {
    let input = loop$input;
    let number = loop$number;
    let sign = loop$sign;
    if (input instanceof Empty) {
      let input$1 = input;
      let _block;
      if (sign instanceof Positive) {
        _block = number;
      } else {
        _block = -number;
      }
      let number$1 = _block;
      return new Ok([new Int(number$1), input$1]);
    } else {
      let $ = input.head;
      if ($ === "_") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number;
        loop$sign = sign;
      } else if ($ === "0") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 2 + 0;
        loop$sign = sign;
      } else if ($ === "1") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 2 + 1;
        loop$sign = sign;
      } else {
        let input$1 = input;
        let _block;
        if (sign instanceof Positive) {
          _block = number;
        } else {
          _block = -number;
        }
        let number$1 = _block;
        return new Ok([new Int(number$1), input$1]);
      }
    }
  }
}
function parse_exponent(loop$input, loop$n, loop$n_sign, loop$ex, loop$ex_sign) {
  while (true) {
    let input = loop$input;
    let n = loop$n;
    let n_sign = loop$n_sign;
    let ex = loop$ex;
    let ex_sign = loop$ex_sign;
    if (input instanceof Empty) {
      let input$1 = input;
      let _block;
      if (n_sign instanceof Positive) {
        _block = n;
      } else {
        _block = n * -1;
      }
      let number = _block;
      let exponent = identity(
        (() => {
          if (ex_sign instanceof Positive) {
            return ex;
          } else {
            return -ex;
          }
        })()
      );
      let _block$1;
      let $ = power(10, exponent);
      if ($ instanceof Ok) {
        let multiplier2 = $[0];
        _block$1 = multiplier2;
      } else {
        _block$1 = 1;
      }
      let multiplier = _block$1;
      return new Ok([new Float(number * multiplier), input$1]);
    } else {
      let $ = input.head;
      if ($ === "_") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex;
        loop$ex_sign = ex_sign;
      } else if ($ === "0") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex * 10;
        loop$ex_sign = ex_sign;
      } else if ($ === "1") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex * 10 + 1;
        loop$ex_sign = ex_sign;
      } else if ($ === "2") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex * 10 + 2;
        loop$ex_sign = ex_sign;
      } else if ($ === "3") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex * 10 + 3;
        loop$ex_sign = ex_sign;
      } else if ($ === "4") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex * 10 + 4;
        loop$ex_sign = ex_sign;
      } else if ($ === "5") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex * 10 + 5;
        loop$ex_sign = ex_sign;
      } else if ($ === "6") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex * 10 + 6;
        loop$ex_sign = ex_sign;
      } else if ($ === "7") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex * 10 + 7;
        loop$ex_sign = ex_sign;
      } else if ($ === "8") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex * 10 + 8;
        loop$ex_sign = ex_sign;
      } else if ($ === "9") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$n = n;
        loop$n_sign = n_sign;
        loop$ex = ex * 10 + 9;
        loop$ex_sign = ex_sign;
      } else {
        let input$1 = input;
        let _block;
        if (n_sign instanceof Positive) {
          _block = n;
        } else {
          _block = n * -1;
        }
        let number = _block;
        let exponent = identity(
          (() => {
            if (ex_sign instanceof Positive) {
              return ex;
            } else {
              return -ex;
            }
          })()
        );
        let _block$1;
        let $1 = power(10, exponent);
        if ($1 instanceof Ok) {
          let multiplier2 = $1[0];
          _block$1 = multiplier2;
        } else {
          _block$1 = 1;
        }
        let multiplier = _block$1;
        return new Ok([new Float(number * multiplier), input$1]);
      }
    }
  }
}
function parse_float2(loop$input, loop$number, loop$sign, loop$unit) {
  while (true) {
    let input = loop$input;
    let number = loop$number;
    let sign = loop$sign;
    let unit = loop$unit;
    if (input instanceof Empty) {
      let input$1 = input;
      let _block;
      if (sign instanceof Positive) {
        _block = number;
      } else {
        _block = number * -1;
      }
      let number$1 = _block;
      return new Ok([new Float(number$1), input$1]);
    } else {
      let $ = input.head;
      if ($ === "_") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number;
        loop$sign = sign;
        loop$unit = unit;
      } else if ($ === "0") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number;
        loop$sign = sign;
        loop$unit = unit * 0.1;
      } else if ($ === "1") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number + 1 * unit;
        loop$sign = sign;
        loop$unit = unit * 0.1;
      } else if ($ === "2") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number + 2 * unit;
        loop$sign = sign;
        loop$unit = unit * 0.1;
      } else if ($ === "3") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number + 3 * unit;
        loop$sign = sign;
        loop$unit = unit * 0.1;
      } else if ($ === "4") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number + 4 * unit;
        loop$sign = sign;
        loop$unit = unit * 0.1;
      } else if ($ === "5") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number + 5 * unit;
        loop$sign = sign;
        loop$unit = unit * 0.1;
      } else if ($ === "6") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number + 6 * unit;
        loop$sign = sign;
        loop$unit = unit * 0.1;
      } else if ($ === "7") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number + 7 * unit;
        loop$sign = sign;
        loop$unit = unit * 0.1;
      } else if ($ === "8") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number + 8 * unit;
        loop$sign = sign;
        loop$unit = unit * 0.1;
      } else if ($ === "9") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number + 9 * unit;
        loop$sign = sign;
        loop$unit = unit * 0.1;
      } else if ($ === "e") {
        let $1 = input.tail;
        if ($1 instanceof Empty) {
          let input$1 = $1;
          return parse_exponent(input$1, number, sign, 0, new Positive());
        } else {
          let $2 = $1.head;
          if ($2 === "+") {
            let input$1 = $1.tail;
            return parse_exponent(input$1, number, sign, 0, new Positive());
          } else if ($2 === "-") {
            let input$1 = $1.tail;
            return parse_exponent(input$1, number, sign, 0, new Negative());
          } else {
            let input$1 = $1;
            return parse_exponent(input$1, number, sign, 0, new Positive());
          }
        }
      } else if ($ === "E") {
        let $1 = input.tail;
        if ($1 instanceof Empty) {
          let input$1 = $1;
          return parse_exponent(input$1, number, sign, 0, new Positive());
        } else {
          let $2 = $1.head;
          if ($2 === "+") {
            let input$1 = $1.tail;
            return parse_exponent(input$1, number, sign, 0, new Positive());
          } else if ($2 === "-") {
            let input$1 = $1.tail;
            return parse_exponent(input$1, number, sign, 0, new Negative());
          } else {
            let input$1 = $1;
            return parse_exponent(input$1, number, sign, 0, new Positive());
          }
        }
      } else {
        let input$1 = input;
        let _block;
        if (sign instanceof Positive) {
          _block = number;
        } else {
          _block = number * -1;
        }
        let number$1 = _block;
        return new Ok([new Float(number$1), input$1]);
      }
    }
  }
}
function parse_string(loop$input, loop$string) {
  while (true) {
    let input = loop$input;
    let string4 = loop$string;
    if (input instanceof Empty) {
      return new Error2(new Unexpected("EOF", '"'));
    } else {
      let $ = input.head;
      if ($ === '"') {
        let input$1 = input.tail;
        return new Ok([new String2(string4), input$1]);
      } else if ($ === "\\") {
        let $1 = input.tail;
        if ($1 instanceof Empty) {
          let g = $;
          let input$1 = $1;
          loop$input = input$1;
          loop$string = string4 + g;
        } else {
          let $2 = $1.head;
          if ($2 === "t") {
            let input$1 = $1.tail;
            loop$input = input$1;
            loop$string = string4 + "	";
          } else if ($2 === "e") {
            let input$1 = $1.tail;
            loop$input = input$1;
            loop$string = string4 + "\x1B";
          } else if ($2 === "b") {
            let input$1 = $1.tail;
            loop$input = input$1;
            loop$string = string4 + "\b";
          } else if ($2 === "n") {
            let input$1 = $1.tail;
            loop$input = input$1;
            loop$string = string4 + "\n";
          } else if ($2 === "r") {
            let input$1 = $1.tail;
            loop$input = input$1;
            loop$string = string4 + "\r";
          } else if ($2 === "f") {
            let input$1 = $1.tail;
            loop$input = input$1;
            loop$string = string4 + "\f";
          } else if ($2 === '"') {
            let input$1 = $1.tail;
            loop$input = input$1;
            loop$string = string4 + '"';
          } else if ($2 === "\\") {
            let input$1 = $1.tail;
            loop$input = input$1;
            loop$string = string4 + "\\";
          } else {
            let g = $;
            let input$1 = $1;
            loop$input = input$1;
            loop$string = string4 + g;
          }
        }
      } else if ($ === "\n") {
        return new Error2(new Unexpected("\n", '"'));
      } else if ($ === "\r\n") {
        return new Error2(new Unexpected("\r\n", '"'));
      } else {
        let g = $;
        let input$1 = input.tail;
        loop$input = input$1;
        loop$string = string4 + g;
      }
    }
  }
}
function parse_multi_line_string(loop$input, loop$string) {
  while (true) {
    let input = loop$input;
    let string4 = loop$string;
    if (input instanceof Empty) {
      return new Error2(new Unexpected("EOF", '"'));
    } else {
      let $ = input.tail;
      if ($ instanceof Empty) {
        let $1 = input.head;
        if ($1 === "\r\n") {
          if (string4 === "") {
            let input$1 = $;
            loop$input = input$1;
            loop$string = string4;
          } else if (string4 === "") {
            let input$1 = $;
            loop$input = input$1;
            loop$string = string4;
          } else {
            let g = $1;
            let input$1 = $;
            loop$input = input$1;
            loop$string = string4 + g;
          }
        } else if ($1 === "\n" && string4 === "") {
          let input$1 = $;
          loop$input = input$1;
          loop$string = string4;
        } else {
          let g = $1;
          let input$1 = $;
          loop$input = input$1;
          loop$string = string4 + g;
        }
      } else {
        let $1 = $.tail;
        if ($1 instanceof Empty) {
          let $2 = input.head;
          if ($2 === "\\") {
            let $3 = $.head;
            if ($3 === "\n") {
              let input$1 = $1;
              loop$input = skip_whitespace(input$1);
              loop$string = string4;
            } else if ($3 === "\r\n") {
              let input$1 = $1;
              loop$input = skip_whitespace(input$1);
              loop$string = string4;
            } else if ($3 === "t") {
              let input$1 = $1;
              loop$input = input$1;
              loop$string = string4 + "	";
            } else if ($3 === "n") {
              let input$1 = $1;
              loop$input = input$1;
              loop$string = string4 + "\n";
            } else if ($3 === "r") {
              let input$1 = $1;
              loop$input = input$1;
              loop$string = string4 + "\r";
            } else if ($3 === '"') {
              let input$1 = $1;
              loop$input = input$1;
              loop$string = string4 + '"';
            } else if ($3 === "\\") {
              let input$1 = $1;
              loop$input = input$1;
              loop$string = string4 + "\\";
            } else {
              let g = $2;
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4 + g;
            }
          } else if ($2 === "\r\n") {
            if (string4 === "") {
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4;
            } else if (string4 === "") {
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4;
            } else {
              let g = $2;
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4 + g;
            }
          } else if ($2 === "\n" && string4 === "") {
            let input$1 = $;
            loop$input = input$1;
            loop$string = string4;
          } else {
            let g = $2;
            let input$1 = $;
            loop$input = input$1;
            loop$string = string4 + g;
          }
        } else {
          let $2 = input.head;
          if ($2 === '"') {
            let $3 = $.head;
            if ($3 === '"') {
              let $4 = $1.head;
              if ($4 === '"') {
                let input$1 = $1.tail;
                return new Ok([new String2(string4), input$1]);
              } else {
                let g = $2;
                let input$1 = $;
                loop$input = input$1;
                loop$string = string4 + g;
              }
            } else {
              let g = $2;
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4 + g;
            }
          } else if ($2 === "\\") {
            let $3 = $.head;
            if ($3 === "\n") {
              let input$1 = $1;
              loop$input = skip_whitespace(input$1);
              loop$string = string4;
            } else if ($3 === "\r\n") {
              let input$1 = $1;
              loop$input = skip_whitespace(input$1);
              loop$string = string4;
            } else if ($3 === "t") {
              let input$1 = $1;
              loop$input = input$1;
              loop$string = string4 + "	";
            } else if ($3 === "n") {
              let input$1 = $1;
              loop$input = input$1;
              loop$string = string4 + "\n";
            } else if ($3 === "r") {
              let input$1 = $1;
              loop$input = input$1;
              loop$string = string4 + "\r";
            } else if ($3 === '"') {
              let input$1 = $1;
              loop$input = input$1;
              loop$string = string4 + '"';
            } else if ($3 === "\\") {
              let input$1 = $1;
              loop$input = input$1;
              loop$string = string4 + "\\";
            } else {
              let g = $2;
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4 + g;
            }
          } else if ($2 === "\r\n") {
            if (string4 === "") {
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4;
            } else if (string4 === "") {
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4;
            } else {
              let g = $2;
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4 + g;
            }
          } else if ($2 === "\n" && string4 === "") {
            let input$1 = $;
            loop$input = input$1;
            loop$string = string4;
          } else {
            let g = $2;
            let input$1 = $;
            loop$input = input$1;
            loop$string = string4 + g;
          }
        }
      }
    }
  }
}
function parse_multi_line_literal_string(loop$input, loop$string) {
  while (true) {
    let input = loop$input;
    let string4 = loop$string;
    if (input instanceof Empty) {
      return new Error2(new Unexpected("EOF", '"'));
    } else {
      let $ = input.tail;
      if ($ instanceof Empty) {
        let $1 = input.head;
        if ($1 === "\n" && string4 === "") {
          let input$1 = $;
          loop$input = input$1;
          loop$string = string4;
        } else if ($1 === "\r\n" && string4 === "") {
          let input$1 = $;
          loop$input = input$1;
          loop$string = string4;
        } else {
          let g = $1;
          let input$1 = $;
          loop$input = input$1;
          loop$string = string4 + g;
        }
      } else {
        let $1 = $.tail;
        if ($1 instanceof Empty) {
          let $2 = input.head;
          if ($2 === "\n" && string4 === "") {
            let input$1 = $;
            loop$input = input$1;
            loop$string = string4;
          } else if ($2 === "\r\n" && string4 === "") {
            let input$1 = $;
            loop$input = input$1;
            loop$string = string4;
          } else {
            let g = $2;
            let input$1 = $;
            loop$input = input$1;
            loop$string = string4 + g;
          }
        } else {
          let $2 = $1.tail;
          if ($2 instanceof Empty) {
            let $3 = input.head;
            if ($3 === "'") {
              let $4 = $.head;
              if ($4 === "'") {
                let $5 = $1.head;
                if ($5 === "'") {
                  let input$1 = $2;
                  return new Ok([new String2(string4), input$1]);
                } else {
                  let g = $3;
                  let input$1 = $;
                  loop$input = input$1;
                  loop$string = string4 + g;
                }
              } else {
                let g = $3;
                let input$1 = $;
                loop$input = input$1;
                loop$string = string4 + g;
              }
            } else if ($3 === "\n" && string4 === "") {
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4;
            } else if ($3 === "\r\n" && string4 === "") {
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4;
            } else {
              let g = $3;
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4 + g;
            }
          } else {
            let $3 = input.head;
            if ($3 === "'") {
              let $4 = $.head;
              if ($4 === "'") {
                let $5 = $1.head;
                if ($5 === "'") {
                  let $6 = $2.head;
                  if ($6 === "'") {
                    return new Error2(new Unexpected("''''", "'''"));
                  } else {
                    let input$1 = $2;
                    return new Ok([new String2(string4), input$1]);
                  }
                } else {
                  let g = $3;
                  let input$1 = $;
                  loop$input = input$1;
                  loop$string = string4 + g;
                }
              } else {
                let g = $3;
                let input$1 = $;
                loop$input = input$1;
                loop$string = string4 + g;
              }
            } else if ($3 === "\n" && string4 === "") {
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4;
            } else if ($3 === "\r\n" && string4 === "") {
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4;
            } else {
              let g = $3;
              let input$1 = $;
              loop$input = input$1;
              loop$string = string4 + g;
            }
          }
        }
      }
    }
  }
}
function parse_literal_string(loop$input, loop$string) {
  while (true) {
    let input = loop$input;
    let string4 = loop$string;
    if (input instanceof Empty) {
      return new Error2(new Unexpected("EOF", '"'));
    } else {
      let $ = input.head;
      if ($ === "\n") {
        return new Error2(new Unexpected("\n", "'"));
      } else if ($ === "\r\n") {
        return new Error2(new Unexpected("\r\n", "'"));
      } else if ($ === "'") {
        let input$1 = input.tail;
        return new Ok([new String2(string4), input$1]);
      } else {
        let g = $;
        let input$1 = input.tail;
        loop$input = input$1;
        loop$string = string4 + g;
      }
    }
  }
}
function parse_time_ns(loop$input, loop$seconds, loop$ns, loop$digits_count) {
  while (true) {
    let input = loop$input;
    let seconds2 = loop$seconds;
    let ns = loop$ns;
    let digits_count = loop$digits_count;
    if (input instanceof Empty) {
      let exponent = identity(9 - digits_count);
      let $ = power(10, exponent);
      let multiplier;
      if ($ instanceof Ok) {
        multiplier = $[0];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "tom",
          1202,
          "parse_time_ns",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $,
            start: 37203,
            end: 37258,
            pattern_start: 37214,
            pattern_end: 37228
          }
        );
      }
      return new Ok([[seconds2, ns * truncate(multiplier)], input]);
    } else {
      let $ = input.head;
      if ($ === "0" && digits_count < 9) {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$seconds = seconds2;
        loop$ns = ns * 10 + 0;
        loop$digits_count = digits_count + 1;
      } else if ($ === "1" && digits_count < 9) {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$seconds = seconds2;
        loop$ns = ns * 10 + 1;
        loop$digits_count = digits_count + 1;
      } else if ($ === "2" && digits_count < 9) {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$seconds = seconds2;
        loop$ns = ns * 10 + 2;
        loop$digits_count = digits_count + 1;
      } else if ($ === "3" && digits_count < 9) {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$seconds = seconds2;
        loop$ns = ns * 10 + 3;
        loop$digits_count = digits_count + 1;
      } else if ($ === "4" && digits_count < 9) {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$seconds = seconds2;
        loop$ns = ns * 10 + 4;
        loop$digits_count = digits_count + 1;
      } else if ($ === "5" && digits_count < 9) {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$seconds = seconds2;
        loop$ns = ns * 10 + 5;
        loop$digits_count = digits_count + 1;
      } else if ($ === "6" && digits_count < 9) {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$seconds = seconds2;
        loop$ns = ns * 10 + 6;
        loop$digits_count = digits_count + 1;
      } else if ($ === "7" && digits_count < 9) {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$seconds = seconds2;
        loop$ns = ns * 10 + 7;
        loop$digits_count = digits_count + 1;
      } else if ($ === "8" && digits_count < 9) {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$seconds = seconds2;
        loop$ns = ns * 10 + 8;
        loop$digits_count = digits_count + 1;
      } else if ($ === "9" && digits_count < 9) {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$seconds = seconds2;
        loop$ns = ns * 10 + 9;
        loop$digits_count = digits_count + 1;
      } else {
        let exponent = identity(9 - digits_count);
        let $1 = power(10, exponent);
        let multiplier;
        if ($1 instanceof Ok) {
          multiplier = $1[0];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "tom",
            1202,
            "parse_time_ns",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $1,
              start: 37203,
              end: 37258,
              pattern_start: 37214,
              pattern_end: 37228
            }
          );
        }
        return new Ok([[seconds2, ns * truncate(multiplier)], input]);
      }
    }
  }
}
function parse_number_under_60(input, expected) {
  if (input instanceof Empty) {
    return new Error2(new Unexpected("EOF", expected));
  } else {
    let $ = input.tail;
    if ($ instanceof Empty) {
      let g = input.head;
      return new Error2(new Unexpected(g, expected));
    } else {
      let $1 = input.head;
      if ($1 === "0") {
        let $2 = $.head;
        if ($2 === "0") {
          let input$1 = $.tail;
          return new Ok([0, input$1]);
        } else if ($2 === "1") {
          let input$1 = $.tail;
          return new Ok([1, input$1]);
        } else if ($2 === "2") {
          let input$1 = $.tail;
          return new Ok([2, input$1]);
        } else if ($2 === "3") {
          let input$1 = $.tail;
          return new Ok([3, input$1]);
        } else if ($2 === "4") {
          let input$1 = $.tail;
          return new Ok([4, input$1]);
        } else if ($2 === "5") {
          let input$1 = $.tail;
          return new Ok([5, input$1]);
        } else if ($2 === "6") {
          let input$1 = $.tail;
          return new Ok([6, input$1]);
        } else if ($2 === "7") {
          let input$1 = $.tail;
          return new Ok([7, input$1]);
        } else if ($2 === "8") {
          let input$1 = $.tail;
          return new Ok([8, input$1]);
        } else if ($2 === "9") {
          let input$1 = $.tail;
          return new Ok([9, input$1]);
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, expected));
        }
      } else if ($1 === "1") {
        let $2 = $.head;
        if ($2 === "0") {
          let input$1 = $.tail;
          return new Ok([10, input$1]);
        } else if ($2 === "1") {
          let input$1 = $.tail;
          return new Ok([11, input$1]);
        } else if ($2 === "2") {
          let input$1 = $.tail;
          return new Ok([12, input$1]);
        } else if ($2 === "3") {
          let input$1 = $.tail;
          return new Ok([13, input$1]);
        } else if ($2 === "4") {
          let input$1 = $.tail;
          return new Ok([14, input$1]);
        } else if ($2 === "5") {
          let input$1 = $.tail;
          return new Ok([15, input$1]);
        } else if ($2 === "6") {
          let input$1 = $.tail;
          return new Ok([16, input$1]);
        } else if ($2 === "7") {
          let input$1 = $.tail;
          return new Ok([17, input$1]);
        } else if ($2 === "8") {
          let input$1 = $.tail;
          return new Ok([18, input$1]);
        } else if ($2 === "9") {
          let input$1 = $.tail;
          return new Ok([19, input$1]);
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, expected));
        }
      } else if ($1 === "2") {
        let $2 = $.head;
        if ($2 === "0") {
          let input$1 = $.tail;
          return new Ok([20, input$1]);
        } else if ($2 === "1") {
          let input$1 = $.tail;
          return new Ok([21, input$1]);
        } else if ($2 === "2") {
          let input$1 = $.tail;
          return new Ok([22, input$1]);
        } else if ($2 === "3") {
          let input$1 = $.tail;
          return new Ok([23, input$1]);
        } else if ($2 === "4") {
          let input$1 = $.tail;
          return new Ok([24, input$1]);
        } else if ($2 === "5") {
          let input$1 = $.tail;
          return new Ok([25, input$1]);
        } else if ($2 === "6") {
          let input$1 = $.tail;
          return new Ok([26, input$1]);
        } else if ($2 === "7") {
          let input$1 = $.tail;
          return new Ok([27, input$1]);
        } else if ($2 === "8") {
          let input$1 = $.tail;
          return new Ok([28, input$1]);
        } else if ($2 === "9") {
          let input$1 = $.tail;
          return new Ok([29, input$1]);
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, expected));
        }
      } else if ($1 === "3") {
        let $2 = $.head;
        if ($2 === "0") {
          let input$1 = $.tail;
          return new Ok([30, input$1]);
        } else if ($2 === "1") {
          let input$1 = $.tail;
          return new Ok([31, input$1]);
        } else if ($2 === "2") {
          let input$1 = $.tail;
          return new Ok([32, input$1]);
        } else if ($2 === "3") {
          let input$1 = $.tail;
          return new Ok([33, input$1]);
        } else if ($2 === "4") {
          let input$1 = $.tail;
          return new Ok([34, input$1]);
        } else if ($2 === "5") {
          let input$1 = $.tail;
          return new Ok([35, input$1]);
        } else if ($2 === "6") {
          let input$1 = $.tail;
          return new Ok([36, input$1]);
        } else if ($2 === "7") {
          let input$1 = $.tail;
          return new Ok([37, input$1]);
        } else if ($2 === "8") {
          let input$1 = $.tail;
          return new Ok([38, input$1]);
        } else if ($2 === "9") {
          let input$1 = $.tail;
          return new Ok([39, input$1]);
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, expected));
        }
      } else if ($1 === "4") {
        let $2 = $.head;
        if ($2 === "0") {
          let input$1 = $.tail;
          return new Ok([40, input$1]);
        } else if ($2 === "1") {
          let input$1 = $.tail;
          return new Ok([41, input$1]);
        } else if ($2 === "2") {
          let input$1 = $.tail;
          return new Ok([42, input$1]);
        } else if ($2 === "3") {
          let input$1 = $.tail;
          return new Ok([43, input$1]);
        } else if ($2 === "4") {
          let input$1 = $.tail;
          return new Ok([44, input$1]);
        } else if ($2 === "5") {
          let input$1 = $.tail;
          return new Ok([45, input$1]);
        } else if ($2 === "6") {
          let input$1 = $.tail;
          return new Ok([46, input$1]);
        } else if ($2 === "7") {
          let input$1 = $.tail;
          return new Ok([47, input$1]);
        } else if ($2 === "8") {
          let input$1 = $.tail;
          return new Ok([48, input$1]);
        } else if ($2 === "9") {
          let input$1 = $.tail;
          return new Ok([49, input$1]);
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, expected));
        }
      } else if ($1 === "5") {
        let $2 = $.head;
        if ($2 === "0") {
          let input$1 = $.tail;
          return new Ok([50, input$1]);
        } else if ($2 === "1") {
          let input$1 = $.tail;
          return new Ok([51, input$1]);
        } else if ($2 === "2") {
          let input$1 = $.tail;
          return new Ok([52, input$1]);
        } else if ($2 === "3") {
          let input$1 = $.tail;
          return new Ok([53, input$1]);
        } else if ($2 === "4") {
          let input$1 = $.tail;
          return new Ok([54, input$1]);
        } else if ($2 === "5") {
          let input$1 = $.tail;
          return new Ok([55, input$1]);
        } else if ($2 === "6") {
          let input$1 = $.tail;
          return new Ok([56, input$1]);
        } else if ($2 === "7") {
          let input$1 = $.tail;
          return new Ok([57, input$1]);
        } else if ($2 === "8") {
          let input$1 = $.tail;
          return new Ok([58, input$1]);
        } else if ($2 === "9") {
          let input$1 = $.tail;
          return new Ok([59, input$1]);
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, expected));
        }
      } else {
        let g = $1;
        return new Error2(new Unexpected(g, expected));
      }
    }
  }
}
function parse_hour_minute(input) {
  return do$(
    (() => {
      if (input instanceof Empty) {
        return new Error2(new Unexpected("EOF", "time"));
      } else {
        let $ = input.tail;
        if ($ instanceof Empty) {
          let g = input.head;
          return new Error2(new Unexpected(g, "time"));
        } else {
          let $1 = $.tail;
          if ($1 instanceof Empty) {
            let g = input.head;
            return new Error2(new Unexpected(g, "time"));
          } else {
            let $2 = input.head;
            if ($2 === "0") {
              let $3 = $.head;
              if ($3 === "0") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([0, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "1") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([1, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "2") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([2, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "3") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([3, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "4") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([4, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "5") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([5, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "6") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([6, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "7") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([7, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "8") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([8, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "9") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([9, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else {
                let g = $2;
                return new Error2(new Unexpected(g, "time"));
              }
            } else if ($2 === "1") {
              let $3 = $.head;
              if ($3 === "0") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([10, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "1") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([11, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "2") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([12, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "3") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([13, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "4") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([14, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "5") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([15, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "6") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([16, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "7") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([17, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "8") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([18, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "9") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([19, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else {
                let g = $2;
                return new Error2(new Unexpected(g, "time"));
              }
            } else if ($2 === "2") {
              let $3 = $.head;
              if ($3 === "0") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([20, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "1") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([21, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "2") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([22, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else if ($3 === "3") {
                let $4 = $1.head;
                if ($4 === ":") {
                  let input$1 = $1.tail;
                  return new Ok([23, input$1]);
                } else {
                  let g = $2;
                  return new Error2(new Unexpected(g, "time"));
                }
              } else {
                let g = $2;
                return new Error2(new Unexpected(g, "time"));
              }
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "time"));
            }
          }
        }
      }
    })(),
    (hours2, input2) => {
      return do$(
        parse_number_under_60(input2, "minutes"),
        (minutes2, input3) => {
          return new Ok([[hours2, minutes2], input3]);
        }
      );
    }
  );
}
function parse_time_s_ns(input) {
  if (input instanceof Empty) {
    return new Ok([[0, 0], input]);
  } else {
    let $ = input.head;
    if ($ === ":") {
      let input$1 = input.tail;
      return do$(
        parse_number_under_60(input$1, "seconds"),
        (seconds2, input2) => {
          if (input2 instanceof Empty) {
            return new Ok([[seconds2, 0], input2]);
          } else {
            let $1 = input2.head;
            if ($1 === ".") {
              let input$12 = input2.tail;
              return parse_time_ns(input$12, seconds2, 0, 0);
            } else {
              return new Ok([[seconds2, 0], input2]);
            }
          }
        }
      );
    } else {
      return new Ok([[0, 0], input]);
    }
  }
}
function parse_time_minute(input, hours2) {
  return do$(
    parse_number_under_60(input, "minutes"),
    (minutes2, input2) => {
      return do$(
        parse_time_s_ns(input2),
        (_use0, input3) => {
          let seconds2;
          let ns;
          seconds2 = _use0[0];
          ns = _use0[1];
          let time = new TimeOfDay(hours2, minutes2, seconds2, ns);
          return new Ok([new Time(time), input3]);
        }
      );
    }
  );
}
function parse_time_value(input) {
  return do$(
    parse_hour_minute(input),
    (_use0, input2) => {
      let hours2;
      let minutes2;
      hours2 = _use0[0];
      minutes2 = _use0[1];
      return do$(
        parse_time_s_ns(input2),
        (_use02, input3) => {
          let seconds2;
          let ns;
          seconds2 = _use02[0];
          ns = _use02[1];
          let time = new TimeOfDay(hours2, minutes2, seconds2, ns);
          return new Ok([time, input3]);
        }
      );
    }
  );
}
function parse_offset_hours(input, sign) {
  return do$(
    parse_hour_minute(input),
    (_use0, input2) => {
      let hours2;
      let minutes2;
      hours2 = _use0[0];
      minutes2 = _use0[1];
      let _block;
      if (sign instanceof Positive) {
        _block = add2(
          hours(hours2),
          minutes(minutes2)
        );
      } else {
        _block = add2(
          hours(-hours2),
          minutes(-minutes2)
        );
      }
      let duration = _block;
      return new Ok([new Offset(duration), input2]);
    }
  );
}
function parse_offset(input) {
  if (input instanceof Empty) {
    return new Ok([new Local(), input]);
  } else {
    let $ = input.head;
    if ($ === "Z") {
      let input$1 = input.tail;
      return new Ok([new Offset(utc_offset), input$1]);
    } else if ($ === "+") {
      let input$1 = input.tail;
      return parse_offset_hours(input$1, new Positive());
    } else if ($ === "-") {
      let input$1 = input.tail;
      return parse_offset_hours(input$1, new Negative());
    } else {
      return new Ok([new Local(), input]);
    }
  }
}
function parse_date_end(input, year, month, day) {
  let date = new Date2(year, month, day);
  if (input instanceof Empty) {
    return new Ok([new Date3(date), input]);
  } else {
    let $ = input.head;
    if ($ === " ") {
      let input$1 = input.tail;
      return do$(
        parse_time_value(input$1),
        (time, input2) => {
          return do$(
            parse_offset(input2),
            (offset, input3) => {
              return new Ok([new DateTime(date, time, offset), input3]);
            }
          );
        }
      );
    } else if ($ === "T") {
      let input$1 = input.tail;
      return do$(
        parse_time_value(input$1),
        (time, input2) => {
          return do$(
            parse_offset(input2),
            (offset, input3) => {
              return new Ok([new DateTime(date, time, offset), input3]);
            }
          );
        }
      );
    } else {
      return new Ok([new Date3(date), input]);
    }
  }
}
function parse_date_day(input, year, month) {
  if (input instanceof Empty) {
    return new Error2(new Unexpected("EOF", "date day"));
  } else {
    let $ = input.tail;
    if ($ instanceof Empty) {
      let g = input.head;
      return new Error2(new Unexpected(g, "date day"));
    } else {
      let $1 = input.head;
      if ($1 === "0") {
        let $2 = $.head;
        if ($2 === "1") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 1);
        } else if ($2 === "2") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 2);
        } else if ($2 === "3") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 3);
        } else if ($2 === "4") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 4);
        } else if ($2 === "5") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 5);
        } else if ($2 === "6") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 6);
        } else if ($2 === "7") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 7);
        } else if ($2 === "8") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 8);
        } else if ($2 === "9") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 9);
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, "date day"));
        }
      } else if ($1 === "1") {
        let $2 = $.head;
        if ($2 === "0") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 10);
        } else if ($2 === "1") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 11);
        } else if ($2 === "2") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 12);
        } else if ($2 === "3") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 13);
        } else if ($2 === "4") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 14);
        } else if ($2 === "5") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 15);
        } else if ($2 === "6") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 16);
        } else if ($2 === "7") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 17);
        } else if ($2 === "8") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 18);
        } else if ($2 === "9") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 19);
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, "date day"));
        }
      } else if ($1 === "2") {
        let $2 = $.head;
        if ($2 === "0") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 20);
        } else if ($2 === "1") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 21);
        } else if ($2 === "2") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 22);
        } else if ($2 === "3") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 23);
        } else if ($2 === "4") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 24);
        } else if ($2 === "5") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 25);
        } else if ($2 === "6") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 26);
        } else if ($2 === "7") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 27);
        } else if ($2 === "8") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 28);
        } else if ($2 === "9") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 29);
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, "date day"));
        }
      } else if ($1 === "3") {
        let $2 = $.head;
        if ($2 === "0") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 30);
        } else if ($2 === "1") {
          let input$1 = $.tail;
          return parse_date_end(input$1, year, month, 31);
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, "date day"));
        }
      } else {
        let g = $1;
        return new Error2(new Unexpected(g, "date day"));
      }
    }
  }
}
function parse_date(input, year) {
  if (input instanceof Empty) {
    return new Error2(new Unexpected("EOF", "date month"));
  } else {
    let $ = input.tail;
    if ($ instanceof Empty) {
      let g = input.head;
      return new Error2(new Unexpected(g, "date month"));
    } else {
      let $1 = $.tail;
      if ($1 instanceof Empty) {
        let g = input.head;
        return new Error2(new Unexpected(g, "date month"));
      } else {
        let $2 = input.head;
        if ($2 === "0") {
          let $3 = $.head;
          if ($3 === "1") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new January());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else if ($3 === "2") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new February());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else if ($3 === "3") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new March());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else if ($3 === "4") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new April());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else if ($3 === "5") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new May());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else if ($3 === "6") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new June());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else if ($3 === "7") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new July());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else if ($3 === "8") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new August());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else if ($3 === "9") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new September());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else {
            let g = $2;
            return new Error2(new Unexpected(g, "date month"));
          }
        } else if ($2 === "1") {
          let $3 = $.head;
          if ($3 === "0") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new October());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else if ($3 === "1") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new November());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else if ($3 === "2") {
            let $4 = $1.head;
            if ($4 === "-") {
              let input$1 = $1.tail;
              return parse_date_day(input$1, year, new December());
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "date month"));
            }
          } else {
            let g = $2;
            return new Error2(new Unexpected(g, "date month"));
          }
        } else {
          let g = $2;
          return new Error2(new Unexpected(g, "date month"));
        }
      }
    }
  }
}
function parse_number(loop$input, loop$number, loop$sign) {
  while (true) {
    let input = loop$input;
    let number = loop$number;
    let sign = loop$sign;
    if (input instanceof Empty) {
      let input$1 = input;
      let _block;
      if (sign instanceof Positive) {
        _block = number;
      } else {
        _block = -number;
      }
      let number$1 = _block;
      return new Ok([new Int(number$1), input$1]);
    } else {
      let $ = input.head;
      if ($ === "_") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number;
        loop$sign = sign;
      } else if ($ === "0") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 10 + 0;
        loop$sign = sign;
      } else if ($ === "1") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 10 + 1;
        loop$sign = sign;
      } else if ($ === "2") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 10 + 2;
        loop$sign = sign;
      } else if ($ === "3") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 10 + 3;
        loop$sign = sign;
      } else if ($ === "4") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 10 + 4;
        loop$sign = sign;
      } else if ($ === "5") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 10 + 5;
        loop$sign = sign;
      } else if ($ === "6") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 10 + 6;
        loop$sign = sign;
      } else if ($ === "7") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 10 + 7;
        loop$sign = sign;
      } else if ($ === "8") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 10 + 8;
        loop$sign = sign;
      } else if ($ === "9") {
        let input$1 = input.tail;
        loop$input = input$1;
        loop$number = number * 10 + 9;
        loop$sign = sign;
      } else if ($ === "-") {
        let input$1 = input.tail;
        return parse_date(input$1, number);
      } else if ($ === ":" && number < 24) {
        let input$1 = input.tail;
        return parse_time_minute(input$1, number);
      } else if ($ === ".") {
        let input$1 = input.tail;
        return parse_float2(input$1, identity(number), sign, 0.1);
      } else if ($ === "e") {
        let $1 = input.tail;
        if ($1 instanceof Empty) {
          let input$1 = $1;
          return parse_exponent(
            input$1,
            identity(number),
            sign,
            0,
            new Positive()
          );
        } else {
          let $2 = $1.head;
          if ($2 === "+") {
            let input$1 = $1.tail;
            return parse_exponent(
              input$1,
              identity(number),
              sign,
              0,
              new Positive()
            );
          } else if ($2 === "-") {
            let input$1 = $1.tail;
            return parse_exponent(
              input$1,
              identity(number),
              sign,
              0,
              new Negative()
            );
          } else {
            let input$1 = $1;
            return parse_exponent(
              input$1,
              identity(number),
              sign,
              0,
              new Positive()
            );
          }
        }
      } else if ($ === "E") {
        let $1 = input.tail;
        if ($1 instanceof Empty) {
          let input$1 = $1;
          return parse_exponent(
            input$1,
            identity(number),
            sign,
            0,
            new Positive()
          );
        } else {
          let $2 = $1.head;
          if ($2 === "+") {
            let input$1 = $1.tail;
            return parse_exponent(
              input$1,
              identity(number),
              sign,
              0,
              new Positive()
            );
          } else if ($2 === "-") {
            let input$1 = $1.tail;
            return parse_exponent(
              input$1,
              identity(number),
              sign,
              0,
              new Negative()
            );
          } else {
            let input$1 = $1;
            return parse_exponent(
              input$1,
              identity(number),
              sign,
              0,
              new Positive()
            );
          }
        }
      } else {
        let input$1 = input;
        let _block;
        if (sign instanceof Positive) {
          _block = number;
        } else {
          _block = -number;
        }
        let number$1 = _block;
        return new Ok([new Int(number$1), input$1]);
      }
    }
  }
}
function reverse_arrays_of_tables(toml) {
  if (toml instanceof ArrayOfTables) {
    let tables = toml[0];
    return new ArrayOfTables(reverse_arrays_of_tables_array(tables, toList([])));
  } else if (toml instanceof Table) {
    let table = toml[0];
    return new Table(reverse_arrays_of_tables_table(table));
  } else {
    return toml;
  }
}
function reverse_arrays_of_tables_array(loop$array, loop$acc) {
  while (true) {
    let array4 = loop$array;
    let acc = loop$acc;
    if (array4 instanceof Empty) {
      return acc;
    } else {
      let first = array4.head;
      let rest = array4.tail;
      let first$1 = reverse_arrays_of_tables_table(first);
      loop$array = rest;
      loop$acc = prepend(first$1, acc);
    }
  }
}
function reverse_arrays_of_tables_table(table) {
  return map(
    table,
    (_, v) => {
      return reverse_arrays_of_tables(v);
    }
  );
}
function parse_inline_table_property(input, properties) {
  let input$1 = skip_whitespace(input);
  return do$(
    parse_key(input$1, toList([])),
    (key, input2) => {
      let input$12 = skip_line_whitespace(input2);
      return expect(
        input$12,
        "=",
        (input3) => {
          let input$13 = skip_line_whitespace(input3);
          return do$(
            parse_value(input$13),
            (value, input4) => {
              let $ = insert2(properties, key, value);
              if ($ instanceof Ok) {
                let properties$1 = $[0];
                return new Ok([properties$1, input4]);
              } else {
                return $;
              }
            }
          );
        }
      );
    }
  );
}
function parse_value(input) {
  if (input instanceof Empty) {
    return new Error2(new Unexpected("EOF", "value"));
  } else {
    let $ = input.tail;
    if ($ instanceof Empty) {
      let $1 = input.head;
      if ($1 === "[") {
        let input$1 = $;
        return parse_array(input$1, toList([]));
      } else if ($1 === "{") {
        let input$1 = $;
        return parse_inline_table(input$1, make());
      } else if ($1 === "+") {
        let input$1 = $;
        return parse_number(input$1, 0, new Positive());
      } else if ($1 === "-") {
        let input$1 = $;
        return parse_number(input$1, 0, new Negative());
      } else if ($1 === "0") {
        return parse_number(input, 0, new Positive());
      } else if ($1 === "1") {
        return parse_number(input, 0, new Positive());
      } else if ($1 === "2") {
        return parse_number(input, 0, new Positive());
      } else if ($1 === "3") {
        return parse_number(input, 0, new Positive());
      } else if ($1 === "4") {
        return parse_number(input, 0, new Positive());
      } else if ($1 === "5") {
        return parse_number(input, 0, new Positive());
      } else if ($1 === "6") {
        return parse_number(input, 0, new Positive());
      } else if ($1 === "7") {
        return parse_number(input, 0, new Positive());
      } else if ($1 === "8") {
        return parse_number(input, 0, new Positive());
      } else if ($1 === "9") {
        return parse_number(input, 0, new Positive());
      } else if ($1 === '"') {
        let input$1 = $;
        return parse_string(input$1, "");
      } else if ($1 === "'") {
        let input$1 = $;
        return parse_literal_string(input$1, "");
      } else {
        let g = $1;
        return new Error2(new Unexpected(g, "value"));
      }
    } else {
      let $1 = $.tail;
      if ($1 instanceof Empty) {
        let $2 = input.head;
        if ($2 === "[") {
          let input$1 = $;
          return parse_array(input$1, toList([]));
        } else if ($2 === "{") {
          let input$1 = $;
          return parse_inline_table(input$1, make());
        } else if ($2 === "0") {
          let $3 = $.head;
          if ($3 === "x") {
            let input$1 = $1;
            return parse_hex(input$1, 0, new Positive());
          } else if ($3 === "o") {
            let input$1 = $1;
            return parse_octal(input$1, 0, new Positive());
          } else if ($3 === "b") {
            let input$1 = $1;
            return parse_binary(input$1, 0, new Positive());
          } else {
            return parse_number(input, 0, new Positive());
          }
        } else if ($2 === "+") {
          let input$1 = $;
          return parse_number(input$1, 0, new Positive());
        } else if ($2 === "-") {
          let input$1 = $;
          return parse_number(input$1, 0, new Negative());
        } else if ($2 === "1") {
          return parse_number(input, 0, new Positive());
        } else if ($2 === "2") {
          return parse_number(input, 0, new Positive());
        } else if ($2 === "3") {
          return parse_number(input, 0, new Positive());
        } else if ($2 === "4") {
          return parse_number(input, 0, new Positive());
        } else if ($2 === "5") {
          return parse_number(input, 0, new Positive());
        } else if ($2 === "6") {
          return parse_number(input, 0, new Positive());
        } else if ($2 === "7") {
          return parse_number(input, 0, new Positive());
        } else if ($2 === "8") {
          return parse_number(input, 0, new Positive());
        } else if ($2 === "9") {
          return parse_number(input, 0, new Positive());
        } else if ($2 === '"') {
          let input$1 = $;
          return parse_string(input$1, "");
        } else if ($2 === "'") {
          let input$1 = $;
          return parse_literal_string(input$1, "");
        } else {
          let g = $2;
          return new Error2(new Unexpected(g, "value"));
        }
      } else {
        let $2 = $1.tail;
        if ($2 instanceof Empty) {
          let $3 = input.head;
          if ($3 === "n") {
            let $4 = $.head;
            if ($4 === "a") {
              let $5 = $1.head;
              if ($5 === "n") {
                let input$1 = $2;
                return new Ok([new Nan(new Positive()), input$1]);
              } else {
                let g = $3;
                return new Error2(new Unexpected(g, "value"));
              }
            } else {
              let g = $3;
              return new Error2(new Unexpected(g, "value"));
            }
          } else if ($3 === "i") {
            let $4 = $.head;
            if ($4 === "n") {
              let $5 = $1.head;
              if ($5 === "f") {
                let input$1 = $2;
                return new Ok([new Infinity2(new Positive()), input$1]);
              } else {
                let g = $3;
                return new Error2(new Unexpected(g, "value"));
              }
            } else {
              let g = $3;
              return new Error2(new Unexpected(g, "value"));
            }
          } else if ($3 === "[") {
            let input$1 = $;
            return parse_array(input$1, toList([]));
          } else if ($3 === "{") {
            let input$1 = $;
            return parse_inline_table(input$1, make());
          } else if ($3 === "0") {
            let $4 = $.head;
            if ($4 === "x") {
              let input$1 = $1;
              return parse_hex(input$1, 0, new Positive());
            } else if ($4 === "o") {
              let input$1 = $1;
              return parse_octal(input$1, 0, new Positive());
            } else if ($4 === "b") {
              let input$1 = $1;
              return parse_binary(input$1, 0, new Positive());
            } else {
              return parse_number(input, 0, new Positive());
            }
          } else if ($3 === "+") {
            let $4 = $.head;
            if ($4 === "0") {
              let $5 = $1.head;
              if ($5 === "x") {
                let input$1 = $2;
                return parse_hex(input$1, 0, new Positive());
              } else if ($5 === "o") {
                let input$1 = $2;
                return parse_octal(input$1, 0, new Positive());
              } else if ($5 === "b") {
                let input$1 = $2;
                return parse_binary(input$1, 0, new Positive());
              } else {
                let input$1 = $;
                return parse_number(input$1, 0, new Positive());
              }
            } else {
              let input$1 = $;
              return parse_number(input$1, 0, new Positive());
            }
          } else if ($3 === "-") {
            let $4 = $.head;
            if ($4 === "0") {
              let $5 = $1.head;
              if ($5 === "x") {
                let input$1 = $2;
                return parse_hex(input$1, 0, new Negative());
              } else if ($5 === "o") {
                let input$1 = $2;
                return parse_octal(input$1, 0, new Negative());
              } else if ($5 === "b") {
                let input$1 = $2;
                return parse_binary(input$1, 0, new Negative());
              } else {
                let input$1 = $;
                return parse_number(input$1, 0, new Negative());
              }
            } else {
              let input$1 = $;
              return parse_number(input$1, 0, new Negative());
            }
          } else if ($3 === "1") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "2") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "3") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "4") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "5") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "6") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "7") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "8") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "9") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === '"') {
            let $4 = $.head;
            if ($4 === '"') {
              let $5 = $1.head;
              if ($5 === '"') {
                let input$1 = $2;
                return parse_multi_line_string(input$1, "");
              } else {
                let input$1 = $;
                return parse_string(input$1, "");
              }
            } else {
              let input$1 = $;
              return parse_string(input$1, "");
            }
          } else if ($3 === "'") {
            let $4 = $.head;
            if ($4 === "'") {
              let $5 = $1.head;
              if ($5 === "'") {
                let input$1 = $2;
                return parse_multi_line_literal_string(input$1, "");
              } else {
                let input$1 = $;
                return parse_literal_string(input$1, "");
              }
            } else {
              let input$1 = $;
              return parse_literal_string(input$1, "");
            }
          } else {
            let g = $3;
            return new Error2(new Unexpected(g, "value"));
          }
        } else {
          let $3 = input.head;
          if ($3 === "t") {
            let $4 = $.head;
            if ($4 === "r") {
              let $5 = $1.head;
              if ($5 === "u") {
                let $6 = $2.head;
                if ($6 === "e") {
                  let input$1 = $2.tail;
                  return new Ok([new Bool(true), input$1]);
                } else {
                  let g = $3;
                  return new Error2(new Unexpected(g, "value"));
                }
              } else {
                let g = $3;
                return new Error2(new Unexpected(g, "value"));
              }
            } else {
              let g = $3;
              return new Error2(new Unexpected(g, "value"));
            }
          } else if ($3 === "f") {
            let $4 = $2.tail;
            if ($4 instanceof Empty) {
              let g = $3;
              return new Error2(new Unexpected(g, "value"));
            } else {
              let $5 = $.head;
              if ($5 === "a") {
                let $6 = $1.head;
                if ($6 === "l") {
                  let $7 = $2.head;
                  if ($7 === "s") {
                    let $8 = $4.head;
                    if ($8 === "e") {
                      let input$1 = $4.tail;
                      return new Ok([new Bool(false), input$1]);
                    } else {
                      let g = $3;
                      return new Error2(new Unexpected(g, "value"));
                    }
                  } else {
                    let g = $3;
                    return new Error2(new Unexpected(g, "value"));
                  }
                } else {
                  let g = $3;
                  return new Error2(new Unexpected(g, "value"));
                }
              } else {
                let g = $3;
                return new Error2(new Unexpected(g, "value"));
              }
            }
          } else if ($3 === "n") {
            let $4 = $.head;
            if ($4 === "a") {
              let $5 = $1.head;
              if ($5 === "n") {
                let input$1 = $2;
                return new Ok([new Nan(new Positive()), input$1]);
              } else {
                let g = $3;
                return new Error2(new Unexpected(g, "value"));
              }
            } else {
              let g = $3;
              return new Error2(new Unexpected(g, "value"));
            }
          } else if ($3 === "+") {
            let $4 = $.head;
            if ($4 === "n") {
              let $5 = $1.head;
              if ($5 === "a") {
                let $6 = $2.head;
                if ($6 === "n") {
                  let input$1 = $2.tail;
                  return new Ok([new Nan(new Positive()), input$1]);
                } else {
                  let input$1 = $;
                  return parse_number(input$1, 0, new Positive());
                }
              } else {
                let input$1 = $;
                return parse_number(input$1, 0, new Positive());
              }
            } else if ($4 === "i") {
              let $5 = $1.head;
              if ($5 === "n") {
                let $6 = $2.head;
                if ($6 === "f") {
                  let input$1 = $2.tail;
                  return new Ok([new Infinity2(new Positive()), input$1]);
                } else {
                  let input$1 = $;
                  return parse_number(input$1, 0, new Positive());
                }
              } else {
                let input$1 = $;
                return parse_number(input$1, 0, new Positive());
              }
            } else if ($4 === "0") {
              let $5 = $1.head;
              if ($5 === "x") {
                let input$1 = $2;
                return parse_hex(input$1, 0, new Positive());
              } else if ($5 === "o") {
                let input$1 = $2;
                return parse_octal(input$1, 0, new Positive());
              } else if ($5 === "b") {
                let input$1 = $2;
                return parse_binary(input$1, 0, new Positive());
              } else {
                let input$1 = $;
                return parse_number(input$1, 0, new Positive());
              }
            } else {
              let input$1 = $;
              return parse_number(input$1, 0, new Positive());
            }
          } else if ($3 === "-") {
            let $4 = $.head;
            if ($4 === "n") {
              let $5 = $1.head;
              if ($5 === "a") {
                let $6 = $2.head;
                if ($6 === "n") {
                  let input$1 = $2.tail;
                  return new Ok([new Nan(new Negative()), input$1]);
                } else {
                  let input$1 = $;
                  return parse_number(input$1, 0, new Negative());
                }
              } else {
                let input$1 = $;
                return parse_number(input$1, 0, new Negative());
              }
            } else if ($4 === "i") {
              let $5 = $1.head;
              if ($5 === "n") {
                let $6 = $2.head;
                if ($6 === "f") {
                  let input$1 = $2.tail;
                  return new Ok([new Infinity2(new Negative()), input$1]);
                } else {
                  let input$1 = $;
                  return parse_number(input$1, 0, new Negative());
                }
              } else {
                let input$1 = $;
                return parse_number(input$1, 0, new Negative());
              }
            } else if ($4 === "0") {
              let $5 = $1.head;
              if ($5 === "x") {
                let input$1 = $2;
                return parse_hex(input$1, 0, new Negative());
              } else if ($5 === "o") {
                let input$1 = $2;
                return parse_octal(input$1, 0, new Negative());
              } else if ($5 === "b") {
                let input$1 = $2;
                return parse_binary(input$1, 0, new Negative());
              } else {
                let input$1 = $;
                return parse_number(input$1, 0, new Negative());
              }
            } else {
              let input$1 = $;
              return parse_number(input$1, 0, new Negative());
            }
          } else if ($3 === "i") {
            let $4 = $.head;
            if ($4 === "n") {
              let $5 = $1.head;
              if ($5 === "f") {
                let input$1 = $2;
                return new Ok([new Infinity2(new Positive()), input$1]);
              } else {
                let g = $3;
                return new Error2(new Unexpected(g, "value"));
              }
            } else {
              let g = $3;
              return new Error2(new Unexpected(g, "value"));
            }
          } else if ($3 === "[") {
            let input$1 = $;
            return parse_array(input$1, toList([]));
          } else if ($3 === "{") {
            let input$1 = $;
            return parse_inline_table(input$1, make());
          } else if ($3 === "0") {
            let $4 = $.head;
            if ($4 === "x") {
              let input$1 = $1;
              return parse_hex(input$1, 0, new Positive());
            } else if ($4 === "o") {
              let input$1 = $1;
              return parse_octal(input$1, 0, new Positive());
            } else if ($4 === "b") {
              let input$1 = $1;
              return parse_binary(input$1, 0, new Positive());
            } else {
              return parse_number(input, 0, new Positive());
            }
          } else if ($3 === "1") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "2") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "3") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "4") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "5") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "6") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "7") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "8") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === "9") {
            return parse_number(input, 0, new Positive());
          } else if ($3 === '"') {
            let $4 = $.head;
            if ($4 === '"') {
              let $5 = $1.head;
              if ($5 === '"') {
                let input$1 = $2;
                return parse_multi_line_string(input$1, "");
              } else {
                let input$1 = $;
                return parse_string(input$1, "");
              }
            } else {
              let input$1 = $;
              return parse_string(input$1, "");
            }
          } else if ($3 === "'") {
            let $4 = $.head;
            if ($4 === "'") {
              let $5 = $1.head;
              if ($5 === "'") {
                let input$1 = $2;
                return parse_multi_line_literal_string(input$1, "");
              } else {
                let input$1 = $;
                return parse_literal_string(input$1, "");
              }
            } else {
              let input$1 = $;
              return parse_literal_string(input$1, "");
            }
          } else {
            let g = $3;
            return new Error2(new Unexpected(g, "value"));
          }
        }
      }
    }
  }
}
function parse_inline_table(loop$input, loop$properties) {
  while (true) {
    let input = loop$input;
    let properties = loop$properties;
    let input$1 = skip_whitespace(input);
    if (input$1 instanceof Empty) {
      let $ = parse_inline_table_property(input$1, properties);
      if ($ instanceof Ok) {
        let properties$1 = $[0][0];
        let input$2 = $[0][1];
        let input$3 = skip_whitespace(input$2);
        if (input$3 instanceof Empty) {
          return new Error2(new Unexpected("EOF", "}"));
        } else {
          let $1 = input$3.head;
          if ($1 === "}") {
            let input$4 = input$3.tail;
            return new Ok([new InlineTable(properties$1), input$4]);
          } else if ($1 === ",") {
            let input$4 = input$3.tail;
            let input$5 = skip_whitespace(input$4);
            loop$input = input$5;
            loop$properties = properties$1;
          } else {
            let g = $1;
            return new Error2(new Unexpected(g, "}"));
          }
        }
      } else {
        return $;
      }
    } else {
      let $ = input$1.head;
      if ($ === "}") {
        let input$2 = input$1.tail;
        return new Ok([new InlineTable(properties), input$2]);
      } else {
        let $1 = parse_inline_table_property(input$1, properties);
        if ($1 instanceof Ok) {
          let properties$1 = $1[0][0];
          let input$2 = $1[0][1];
          let input$3 = skip_whitespace(input$2);
          if (input$3 instanceof Empty) {
            return new Error2(new Unexpected("EOF", "}"));
          } else {
            let $2 = input$3.head;
            if ($2 === "}") {
              let input$4 = input$3.tail;
              return new Ok([new InlineTable(properties$1), input$4]);
            } else if ($2 === ",") {
              let input$4 = input$3.tail;
              let input$5 = skip_whitespace(input$4);
              loop$input = input$5;
              loop$properties = properties$1;
            } else {
              let g = $2;
              return new Error2(new Unexpected(g, "}"));
            }
          }
        } else {
          return $1;
        }
      }
    }
  }
}
function parse_key_value(input, toml) {
  return do$(
    parse_key(input, toList([])),
    (key, input2) => {
      let input$1 = skip_line_whitespace(input2);
      return expect(
        input$1,
        "=",
        (input3) => {
          let input$12 = skip_line_whitespace(input3);
          return do$(
            parse_value(input$12),
            (value, input4) => {
              let $ = insert2(toml, key, value);
              if ($ instanceof Ok) {
                let toml$1 = $[0];
                return new Ok([toml$1, input4]);
              } else {
                return $;
              }
            }
          );
        }
      );
    }
  );
}
function parse_table(loop$input, loop$toml) {
  while (true) {
    let input = loop$input;
    let toml = loop$toml;
    let input$1 = skip_whitespace(input);
    if (input$1 instanceof Empty) {
      return new Ok([toml, input$1]);
    } else {
      let $ = input$1.head;
      if ($ === "[") {
        return new Ok([toml, input$1]);
      } else {
        let $1 = parse_key_value(input$1, toml);
        if ($1 instanceof Ok) {
          let toml$1 = $1[0][0];
          let input$2 = $1[0][1];
          let $2 = skip_line_whitespace(input$2);
          if ($2 instanceof Empty) {
            return new Ok([toml$1, toList([])]);
          } else {
            let $3 = $2.head;
            if ($3 === "\n") {
              let in$ = $2.tail;
              loop$input = in$;
              loop$toml = toml$1;
            } else if ($3 === "\r\n") {
              let in$ = $2.tail;
              loop$input = in$;
              loop$toml = toml$1;
            } else {
              let g = $3;
              return new Error2(new Unexpected(g, "\n"));
            }
          }
        } else {
          return $1;
        }
      }
    }
  }
}
function parse_array_of_tables(input) {
  let input$1 = skip_line_whitespace(input);
  return do$(
    parse_key(input$1, toList([])),
    (key, input2) => {
      return expect(
        input2,
        "]",
        (input3) => {
          return expect(
            input3,
            "]",
            (input4) => {
              return do$(
                parse_table(input4, make()),
                (table, input5) => {
                  return new Ok([[key, table], input5]);
                }
              );
            }
          );
        }
      );
    }
  );
}
function parse_table_and_header(input) {
  return do$(
    parse_table_header(input),
    (key, input2) => {
      return do$(
        parse_table(input2, make()),
        (table, input3) => {
          return new Ok([[key, table], input3]);
        }
      );
    }
  );
}
function parse_tables(loop$input, loop$toml) {
  while (true) {
    let input = loop$input;
    let toml = loop$toml;
    if (input instanceof Empty) {
      return new Ok(toml);
    } else {
      let $ = input.tail;
      if ($ instanceof Empty) {
        let $1 = input.head;
        if ($1 === "[") {
          let input$1 = $;
          let $2 = parse_table_and_header(input$1);
          if ($2 instanceof Ok) {
            let input$2 = $2[0][1];
            let key = $2[0][0][0];
            let table = $2[0][0][1];
            let $3 = insert2(toml, key, new Table(table));
            if ($3 instanceof Ok) {
              let toml$1 = $3[0];
              loop$input = input$2;
              loop$toml = toml$1;
            } else {
              return $3;
            }
          } else {
            return $2;
          }
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, "["));
        }
      } else {
        let $1 = input.head;
        if ($1 === "[") {
          let $2 = $.head;
          if ($2 === "[") {
            let input$1 = $.tail;
            let $3 = parse_array_of_tables(input$1);
            if ($3 instanceof Ok) {
              let input$2 = $3[0][1];
              let key = $3[0][0][0];
              let table = $3[0][0][1];
              let $4 = insert2(toml, key, new ArrayOfTables(toList([table])));
              if ($4 instanceof Ok) {
                let toml$1 = $4[0];
                loop$input = input$2;
                loop$toml = toml$1;
              } else {
                return $4;
              }
            } else {
              return $3;
            }
          } else {
            let input$1 = $;
            let $3 = parse_table_and_header(input$1);
            if ($3 instanceof Ok) {
              let input$2 = $3[0][1];
              let key = $3[0][0][0];
              let table = $3[0][0][1];
              let $4 = insert2(toml, key, new Table(table));
              if ($4 instanceof Ok) {
                let toml$1 = $4[0];
                loop$input = input$2;
                loop$toml = toml$1;
              } else {
                return $4;
              }
            } else {
              return $3;
            }
          }
        } else {
          let g = $1;
          return new Error2(new Unexpected(g, "["));
        }
      }
    }
  }
}
function parse(input) {
  let input$1 = graphemes(input);
  let input$2 = drop_comments(input$1, toList([]), false);
  let input$3 = skip_whitespace(input$2);
  return do$(
    parse_table(input$3, make()),
    (toml, input2) => {
      let $ = parse_tables(input2, toml);
      if ($ instanceof Ok) {
        let toml$1 = $[0];
        return new Ok(reverse_arrays_of_tables_table(toml$1));
      } else {
        return $;
      }
    }
  );
}
function parse_array(input, elements) {
  let input$1 = skip_whitespace(input);
  if (input$1 instanceof Empty) {
    return do$(
      parse_value(input$1),
      (element, input2) => {
        let elements$1 = prepend(element, elements);
        let input$12 = skip_whitespace(input2);
        if (input$12 instanceof Empty) {
          return new Error2(new Unexpected("EOF", "]"));
        } else {
          let $ = input$12.head;
          if ($ === "]") {
            let input$2 = input$12.tail;
            return new Ok([new Array2(reverse(elements$1)), input$2]);
          } else if ($ === ",") {
            let input$2 = input$12.tail;
            let input$3 = skip_whitespace(input$2);
            return parse_array(input$3, elements$1);
          } else {
            let g = $;
            return new Error2(new Unexpected(g, "]"));
          }
        }
      }
    );
  } else {
    let $ = input$1.head;
    if ($ === "]") {
      let input$2 = input$1.tail;
      return new Ok([new Array2(reverse(elements)), input$2]);
    } else {
      return do$(
        parse_value(input$1),
        (element, input2) => {
          let elements$1 = prepend(element, elements);
          let input$12 = skip_whitespace(input2);
          if (input$12 instanceof Empty) {
            return new Error2(new Unexpected("EOF", "]"));
          } else {
            let $1 = input$12.head;
            if ($1 === "]") {
              let input$2 = input$12.tail;
              return new Ok([new Array2(reverse(elements$1)), input$2]);
            } else if ($1 === ",") {
              let input$2 = input$12.tail;
              let input$3 = skip_whitespace(input$2);
              return parse_array(input$3, elements$1);
            } else {
              let g = $1;
              return new Error2(new Unexpected(g, "]"));
            }
          }
        }
      );
    }
  }
}

// build/dev/javascript/starlist/starlist/internal/errors.mjs
var ConfigError = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var GitHubApiError = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var FileError = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var TemplateError = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var MarkdownError = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var GitError = class extends CustomType {
  constructor(command2, exit_code, message) {
    super();
    this.command = command2;
    this.exit_code = exit_code;
    this.message = message;
  }
};
var SecurityError = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var VersionMismatchError = class extends CustomType {
  constructor(expected, found) {
    super();
    this.expected = expected;
    this.found = found;
  }
};

// build/dev/javascript/starlist/starlist/config.mjs
var Config = class extends CustomType {
  constructor(token4, fetch2, render4, git2) {
    super();
    this.token = token4;
    this.fetch = fetch2;
    this.render = render4;
    this.git = git2;
  }
};
var Api = class extends CustomType {
};
var File2 = class extends CustomType {
};
var Fetch = class extends CustomType {
  constructor(source, max_stars) {
    super();
    this.source = source;
    this.max_stars = max_stars;
  }
};
var Render = class extends CustomType {
  constructor(date_time, filename2, partition_filename, group2, partition2, template, index_template) {
    super();
    this.date_time = date_time;
    this.filename = filename2;
    this.partition_filename = partition_filename;
    this.group = group2;
    this.partition = partition2;
    this.template = template;
    this.index_template = index_template;
  }
};
var Git = class extends CustomType {
  constructor(commit_message, pull2, committer) {
    super();
    this.commit_message = commit_message;
    this.pull = pull2;
    this.committer = committer;
  }
};
var IsoDateTime = class extends CustomType {
  constructor(time_zone) {
    super();
    this.time_zone = time_zone;
  }
};
var LocaleDateTime = class extends CustomType {
  constructor(locale, time_zone, date_style, time_style) {
    super();
    this.locale = locale;
    this.time_zone = time_zone;
    this.date_style = date_style;
    this.time_style = time_style;
  }
};
var GroupByLanguage = class extends CustomType {
};
var GroupByTopic = class extends CustomType {
};
var GroupByLicence = class extends CustomType {
};
var PartitionOff = class extends CustomType {
};
var PartitionByLanguage = class extends CustomType {
};
var PartitionByTopic = class extends CustomType {
};
var PartitionByYear = class extends CustomType {
};
var PartitionByYearMonth = class extends CustomType {
};
function default_render() {
  return new Render(
    new IsoDateTime("UTC"),
    "README.md",
    "stars/{key}.md",
    new GroupByLanguage(),
    new PartitionOff(),
    "templates/TEMPLATE.md.glemp",
    "templates/INDEX.md.glemp"
  );
}
function default_git() {
  return new Git(
    "chore(updates): updated entries in files",
    new None(),
    new None()
  );
}
function decode_fetch(toml) {
  return new Fetch(
    (() => {
      let $ = get_string(toml, toList(["fetch", "source"]));
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 === "file") {
          return new File2();
        } else {
          return new Api();
        }
      } else {
        return new Api();
      }
    })(),
    (() => {
      let $ = get_int(toml, toList(["fetch", "max_stars"]));
      if ($ instanceof Ok) {
        let n = $[0];
        return new Some(n);
      } else {
        return new None();
      }
    })()
  );
}
function decode_group(toml) {
  let $ = get_string(toml, toList(["render", "group"]));
  if ($ instanceof Ok) {
    let $1 = $[0];
    if ($1 === "language") {
      return new GroupByLanguage();
    } else if ($1 === "topic") {
      return new GroupByTopic();
    } else if ($1 === "licence") {
      return new GroupByLicence();
    } else if ($1 === "license") {
      return new GroupByLicence();
    } else {
      return new GroupByLanguage();
    }
  } else {
    return new GroupByLanguage();
  }
}
function decode_partition(toml) {
  let $ = get_string(toml, toList(["render", "partition"]));
  if ($ instanceof Ok) {
    let $1 = $[0];
    if ($1 === "language") {
      return new PartitionByLanguage();
    } else if ($1 === "topic") {
      return new PartitionByTopic();
    } else if ($1 === "year") {
      return new PartitionByYear();
    } else if ($1 === "year-month") {
      return new PartitionByYearMonth();
    } else if ($1 === "off") {
      return new PartitionOff();
    } else {
      return new PartitionOff();
    }
  } else {
    return new PartitionOff();
  }
}
function decode_committer(toml) {
  let $ = get_string(toml, toList(["git", "committer", "name"]));
  let $1 = get_string(toml, toList(["git", "committer", "email"]));
  if ($ instanceof Ok && $1 instanceof Ok) {
    let name = $[0];
    let email = $1[0];
    return new Some([name, email]);
  } else {
    return new None();
  }
}
function toml_string(toml, key, default$) {
  let $ = get_string(toml, key);
  if ($ instanceof Ok) {
    let v = $[0];
    return v;
  } else {
    return default$;
  }
}
function decode_git(toml) {
  let base = default_git();
  return new Git(
    toml_string(toml, toList(["git", "commit_message"]), base.commit_message),
    (() => {
      let $ = get_string(toml, toList(["git", "pull"]));
      if ($ instanceof Ok) {
        let v = $[0];
        return new Some(v);
      } else {
        return new None();
      }
    })(),
    decode_committer(toml)
  );
}
function decode_date_time(toml) {
  let time_zone = toml_string(
    toml,
    toList(["render", "date_time", "time_zone"]),
    "UTC"
  );
  let $ = get_string(toml, toList(["render", "date_time", "locale"]));
  if ($ instanceof Ok) {
    let locale = $[0];
    return new LocaleDateTime(
      locale,
      time_zone,
      toml_string(toml, toList(["render", "date_time", "date_style"]), "short"),
      toml_string(toml, toList(["render", "date_time", "time_style"]), "short")
    );
  } else {
    return new IsoDateTime(time_zone);
  }
}
function decode_render(toml) {
  let base = default_render();
  return new Render(
    decode_date_time(toml),
    toml_string(toml, toList(["render", "output"]), base.filename),
    toml_string(
      toml,
      toList(["render", "partition_output"]),
      base.partition_filename
    ),
    decode_group(toml),
    decode_partition(toml),
    toml_string(toml, toList(["render", "template"]), base.template),
    toml_string(toml, toList(["render", "index_template"]), base.index_template)
  );
}
function parse_error_string(error2) {
  if (error2 instanceof Unexpected) {
    let got = error2.got;
    let expected = error2.expected;
    return "unexpected '" + got + "', expected " + expected;
  } else {
    let key = error2.key;
    return "duplicate key: " + join(key, ".");
  }
}
function parse_toml(input) {
  let $ = is_empty2(trim(input));
  if ($) {
    return new Ok(make());
  } else {
    let $1 = parse(input);
    if ($1 instanceof Ok) {
      return $1;
    } else {
      let e = $1[0];
      return new Error2(
        new ConfigError("Invalid TOML: " + parse_error_string(e))
      );
    }
  }
}
function is_absolute(path2) {
  return starts_with(path2, "/");
}
function collapse_segments(loop$acc, loop$segments) {
  while (true) {
    let acc = loop$acc;
    let segments = loop$segments;
    if (segments instanceof Empty) {
      return new Ok(reverse(acc));
    } else {
      let $ = segments.head;
      if ($ === ".") {
        let rest = segments.tail;
        loop$acc = acc;
        loop$segments = rest;
      } else if ($ === "") {
        let rest = segments.tail;
        loop$acc = acc;
        loop$segments = rest;
      } else if ($ === "..") {
        let rest = segments.tail;
        if (acc instanceof Empty) {
          return new Error2(void 0);
        } else {
          let tail = acc.tail;
          loop$acc = tail;
          loop$segments = rest;
        }
      } else {
        let seg = $;
        let rest = segments.tail;
        loop$acc = prepend(seg, acc);
        loop$segments = rest;
      }
    }
  }
}
function normalize(path2) {
  let _block;
  let $1 = starts_with(path2, "/");
  if ($1) {
    _block = ["/", drop_start(path2, 1)];
  } else {
    _block = ["", path2];
  }
  let $ = _block;
  let prefix;
  let to_split;
  prefix = $[0];
  to_split = $[1];
  let _block$1;
  let _pipe = split2(to_split, "/");
  _block$1 = ((_capture) => {
    return collapse_segments(toList([]), _capture);
  })(
    _pipe
  );
  let segments = _block$1;
  if (segments instanceof Ok) {
    let parts = segments[0];
    return new Ok(prefix + join(parts, "/"));
  } else {
    return segments;
  }
}
function validate_path(path2, repo_root, label) {
  let _block;
  let $ = is_absolute(path2);
  if ($) {
    _block = path2;
  } else {
    _block = repo_root + "/" + path2;
  }
  let resolved = _block;
  let $1 = normalize(resolved);
  if ($1 instanceof Ok) {
    let expanded = $1[0];
    let $2 = starts_with(expanded, repo_root);
    if ($2) {
      return new Ok(expanded);
    } else {
      return new Error2(
        new SecurityError(
          label + " path '" + path2 + "' resolves outside repository root"
        )
      );
    }
  } else {
    return new Error2(
      new SecurityError(
        label + " path '" + path2 + "' contains invalid traversal"
      )
    );
  }
}

// build/dev/javascript/starlist/starlist/internal/action/config.mjs
var bot_name = "github-actions[bot]";
var bot_email = "41898282+github-actions[bot]@users.noreply.github.com";
function require_token(next2) {
  let $ = get_input_with_options(
    "token",
    new InputOptions(true, true)
  );
  if ($ instanceof Ok) {
    let t = $[0];
    set_secret(t);
    return next2(t);
  } else {
    let msg = $[0];
    return new Error2(new ConfigError("Missing token: " + msg));
  }
}
function read_toml(next2) {
  let config_input = get_input("config");
  let config_file = get_input("config_file");
  let $ = is_empty2(trim(config_input));
  let $1 = is_empty2(trim(config_file));
  if ($) {
    if ($1) {
      return next2(make());
    } else {
      let $2 = read(config_file);
      if ($2 instanceof Ok) {
        let content = $2[0];
        let $3 = parse_toml(content);
        if ($3 instanceof Ok) {
          let toml = $3[0];
          return next2(toml);
        } else {
          return $3;
        }
      } else {
        return new Error2(
          new FileError("Cannot read config file: " + config_file)
        );
      }
    }
  } else if ($1) {
    let $2 = parse_toml(config_input);
    if ($2 instanceof Ok) {
      let toml = $2[0];
      return next2(toml);
    } else {
      return $2;
    }
  } else {
    return new Error2(
      new ConfigError("Cannot specify both 'config' and 'config_file'")
    );
  }
}
function apply_action_git_defaults(git2) {
  return new Git(
    git2.commit_message,
    (() => {
      let $ = git2.pull;
      if ($ instanceof None) {
        return new Some("");
      } else {
        return $;
      }
    })(),
    (() => {
      let $ = git2.committer;
      if ($ instanceof None) {
        return new Some([bot_name, bot_email]);
      } else {
        return $;
      }
    })()
  );
}
function resolve2() {
  return require_token(
    (token4) => {
      return read_toml(
        (toml) => {
          let fetch2 = decode_fetch(toml);
          let render4 = decode_render(toml);
          let git2 = apply_action_git_defaults(decode_git(toml));
          return new Ok(new Config(new Some(token4), fetch2, render4, git2));
        }
      );
    }
  );
}

// build/dev/javascript/shellout/shellout_ffi.mjs
var import_node_child_process = require("node:child_process");
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");
var import_node_process2 = __toESM(require("node:process"), 1);
var Nil2 = void 0;
var Signals = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGQUIT: 3,
  SIGILL: 4,
  SIGTRAP: 5,
  SIGABRT: 6,
  SIGIOT: 6,
  SIGBUS: 7,
  SIGFPE: 8,
  SIGKILL: 9,
  SIGUSR1: 10,
  SIGSEGV: 11,
  SIGUSR2: 12,
  SIGPIPE: 13,
  SIGALRM: 14,
  SIGTERM: 15,
  SIGSTKFLT: 16,
  SIGCHLD: 17,
  SIGCONT: 18,
  SIGSTOP: 19,
  SIGTSTP: 20,
  SIGTTIN: 21,
  SIGTTOU: 22,
  SIGURG: 23,
  SIGXCPU: 24,
  SIGXFSZ: 25,
  SIGVTALRM: 26,
  SIGPROF: 27,
  SIGWINCH: 28,
  SIGIO: 29,
  SIGPOLL: 29,
  SIGPWR: 30,
  SIGSYS: 31,
  SIGRTMIN: 34
};
function os_command(command2, args, dir, opts, env_list) {
  let executable = os_which(command2);
  executable = Result$isOk(executable) ? executable : os_which(
    (0, import_node_path2.join)(dir, command2)
  );
  if (!Result$isOk(executable)) {
    return map_error(executable, (error2) => [1, error2]);
  }
  let getBool = (dict2, key) => Result$isOk(get(dict2, key));
  let isDeno = Boolean(globalThis.Deno?.Command);
  args = args.toArray();
  let stdin = "inherit";
  let stdout = isDeno ? "piped" : "pipe";
  let stderr = stdout;
  let spawnOpts = { cwd: dir, windowsHide: true };
  if (!isDeno && getBool(opts, CommandOpt$OverlappedStdio())) {
    stdin = stdout = "overlapped";
  }
  if (getBool(opts, CommandOpt$LetBeStderr())) {
    stderr = "inherit";
  }
  if (getBool(opts, CommandOpt$LetBeStdout())) {
    import_node_process2.default.on("SIGINT", () => Nil2);
    stdout = "inherit";
  }
  let env = {};
  for (let e of env_list) {
    env[e[0]] = e[1];
  }
  let result = {};
  if (isDeno) {
    spawnOpts = {
      ...spawnOpts,
      args,
      stdin,
      stdout,
      stderr,
      env
    };
    try {
      result = new Deno.Command(command2, spawnOpts).outputSync();
    } catch {
    }
    result.status = result.code ?? null;
  } else {
    spawnOpts.stdio = [stdin, stdout, stderr];
    if (env) {
      spawnOpts.env = { ...import_node_process2.default.env, ...env };
    }
    result = (0, import_node_child_process.spawnSync)(command2, args, spawnOpts);
  }
  if (result.error) {
    result = { status: null };
  }
  let output = "";
  try {
    output = new TextDecoder().decode(result.stdout);
  } catch {
  }
  try {
    output += new TextDecoder().decode(result.stderr);
  } catch {
  }
  let status = result.status;
  if (null === status) {
    let signal = Signals[result.signal];
    status = Nil2 !== signal ? signal : 0;
    status += 384;
  }
  if (384 === status && "" === output) {
    status = 2;
    output = `The directory "${dir}" does not exist
`;
  }
  return 0 === status ? Result$Ok(output) : Result$Error([status, output]);
}
function os_which(command2) {
  let pathexts = (import_node_process2.default.env.PATHEXT || "").split(";");
  let paths = (import_node_process2.default.env.PATH || "").replace(/"+/g, "").split(import_node_path2.delimiter).filter(Boolean).map((item) => (0, import_node_path2.join)(item, command2)).concat([command2]).flatMap((item) => pathexts.map((ext) => item + ext));
  let result = paths.map(
    (item) => (0, import_node_fs2.statSync)(item, { throwIfNoEntry: false })?.isFile() ? item : Nil2
  ).find((item) => item !== Nil2);
  return result !== Nil2 ? Result$Ok(result) : Result$Error(
    `command \`${command2}\` not found
`
  );
}

// build/dev/javascript/shellout/shellout.mjs
var LetBeStderr = class extends CustomType {
};
var CommandOpt$LetBeStderr = () => new LetBeStderr();
var LetBeStdout = class extends CustomType {
};
var CommandOpt$LetBeStdout = () => new LetBeStdout();
var OverlappedStdio = class extends CustomType {
};
var CommandOpt$OverlappedStdio = () => new OverlappedStdio();
var SetEnvironment = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function command(executable, arguments$, directory, options) {
  let environment = flat_map(
    options,
    (option) => {
      if (option instanceof SetEnvironment) {
        let env = option[0];
        return env;
      } else {
        return toList([]);
      }
    }
  );
  let _pipe = options;
  let _pipe$1 = map3(_pipe, (opt) => {
    return [opt, true];
  });
  let _pipe$2 = from_list(_pipe$1);
  return ((_capture) => {
    return os_command(executable, arguments$, directory, _capture, environment);
  })(_pipe$2);
}

// build/dev/javascript/starlist/starlist/internal/git.mjs
function git(args) {
  let $ = command("git", args, ".", toList([]));
  if ($ instanceof Ok) {
    let output = $[0];
    return new Ok(trim(output));
  } else {
    let code = $[0][0];
    let msg = $[0][1];
    return new Error2(
      new GitError(
        "git " + join(args, " "),
        code,
        trim(msg)
      )
    );
  }
}
function is_shallow() {
  let $ = git(toList(["rev-parse", "--is-shallow-repository"]));
  if ($ instanceof Ok) {
    let output = $[0];
    return new Ok(trim(output) === "true");
  } else {
    return $;
  }
}
function current_branch() {
  return git(toList(["rev-parse", "--abbrev-ref", "HEAD"]));
}
function remote_url() {
  return git(toList(["remote", "get-url", "origin"]));
}
function try$2(result, next2) {
  if (result instanceof Ok) {
    let v = result[0];
    return next2(v);
  } else {
    return result;
  }
}
function add3(paths) {
  return try$2(
    git(prepend2(paths, "add")),
    (_) => {
      return new Ok(void 0);
    }
  );
}
function commit(message) {
  return try$2(
    git(toList(["commit", "-m", message])),
    (_) => {
      return new Ok(void 0);
    }
  );
}
function push(branch2) {
  let $ = remote_url();
  if ($ instanceof Ok) {
    return try$2(
      git(toList(["push", "--follow-tags", "origin", branch2])),
      (_) => {
        return new Ok(void 0);
      }
    );
  } else {
    return new Ok(void 0);
  }
}
function pull(flags, is_shallow2) {
  let $ = remote_url();
  if ($ instanceof Ok) {
    let base = toList(["pull", "--tags"]);
    let _block;
    if (is_shallow2) {
      _block = append3(base, toList(["--unshallow"]));
    } else {
      _block = base;
    }
    let args = _block;
    let _block$1;
    let $1 = is_empty2(trim(flags));
    if ($1) {
      _block$1 = args;
    } else {
      _block$1 = append3(
        args,
        (() => {
          let _pipe = flags;
          let _pipe$1 = trim(_pipe);
          let _pipe$2 = split2(_pipe$1, " ");
          return filter(_pipe$2, (s) => {
            return !is_empty2(s);
          });
        })()
      );
    }
    let args$1 = _block$1;
    return try$2(git(args$1), (_) => {
      return new Ok(void 0);
    });
  } else {
    return new Ok(void 0);
  }
}
function config_set(key, value) {
  return try$2(
    git(toList(["config", key, value])),
    (_) => {
      return new Ok(void 0);
    }
  );
}
function set_remote_url(url) {
  return try$2(
    git(toList(["remote", "set-url", "origin", url])),
    (_) => {
      return new Ok(void 0);
    }
  );
}

// build/dev/javascript/starlist/starlist/internal/action/setup.mjs
function inject_token(url, token4) {
  let $ = starts_with(url, "https://");
  if ($) {
    let rest = drop_start(url, string_length("https://"));
    return "https://x-access-token:" + token4 + "@" + rest;
  } else {
    return url;
  }
}
function try$3(result, next2) {
  if (result instanceof Ok) {
    let v = result[0];
    return next2(v);
  } else {
    return result;
  }
}
function setup(committer, token4) {
  let name;
  let email;
  name = committer[0];
  email = committer[1];
  return try$3(
    config_set("user.name", name),
    (_) => {
      return try$3(
        config_set("user.email", email),
        (_2) => {
          return try$3(
            config_set("pull.rebase", "false"),
            (_3) => {
              let $ = remote_url();
              if ($ instanceof Ok) {
                let url = $[0];
                let injected = inject_token(url, token4);
                let $1 = is_empty2(injected);
                if ($1) {
                  return new Ok(void 0);
                } else {
                  return set_remote_url(injected);
                }
              } else {
                return new Ok(void 0);
              }
            }
          );
        }
      );
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path2, query, fragment) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path2;
    this.query = query;
    this.fragment = fragment;
  }
};
var empty2 = /* @__PURE__ */ new Uri(
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  "",
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None()
);
function is_valid_host_within_brackets_char(char) {
  return 48 >= char && char <= 57 || 65 >= char && char <= 90 || 97 >= char && char <= 122 || char === 58 || char === 46;
}
function parse_fragment(rest, pieces) {
  return new Ok(
    new Uri(
      pieces.scheme,
      pieces.userinfo,
      pieces.host,
      pieces.port,
      pieces.path,
      pieces.query,
      new Some(rest)
    )
  );
}
function parse_query_with_question_mark_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string.startsWith("#")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let query = string_codeunit_slice(original, 0, size3);
        let pieces$1 = new Uri(
          pieces.scheme,
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          new Some(query),
          pieces.fragment
        );
        return parse_fragment(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          new Some(original),
          pieces.fragment
        )
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size3 + 1;
    }
  }
}
function parse_query_with_question_mark(uri_string, pieces) {
  return parse_query_with_question_mark_loop(uri_string, uri_string, pieces, 0);
}
function parse_path_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let path2 = string_codeunit_slice(original, 0, size3);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        pieces.host,
        pieces.port,
        path2,
        pieces.query,
        pieces.fragment
      );
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let path2 = string_codeunit_slice(original, 0, size3);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        pieces.host,
        pieces.port,
        path2,
        pieces.query,
        pieces.fragment
      );
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          pieces.host,
          pieces.port,
          original,
          pieces.query,
          pieces.fragment
        )
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size3 + 1;
    }
  }
}
function parse_path(uri_string, pieces) {
  return parse_path_loop(uri_string, uri_string, pieces, 0);
}
function parse_port_loop(loop$uri_string, loop$pieces, loop$port) {
  while (true) {
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let port = loop$port;
    if (uri_string.startsWith("0")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10;
    } else if (uri_string.startsWith("1")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 1;
    } else if (uri_string.startsWith("2")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 2;
    } else if (uri_string.startsWith("3")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 3;
    } else if (uri_string.startsWith("4")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 4;
    } else if (uri_string.startsWith("5")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 5;
    } else if (uri_string.startsWith("6")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 6;
    } else if (uri_string.startsWith("7")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 7;
    } else if (uri_string.startsWith("8")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 8;
    } else if (uri_string.startsWith("9")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 9;
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        pieces.host,
        new Some(port),
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        pieces.host,
        new Some(port),
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        pieces.host,
        new Some(port),
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_path(uri_string, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          pieces.host,
          new Some(port),
          pieces.path,
          pieces.query,
          pieces.fragment
        )
      );
    } else {
      return new Error2(void 0);
    }
  }
}
function parse_port(uri_string, pieces) {
  if (uri_string.startsWith(":0")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 0);
  } else if (uri_string.startsWith(":1")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 1);
  } else if (uri_string.startsWith(":2")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 2);
  } else if (uri_string.startsWith(":3")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 3);
  } else if (uri_string.startsWith(":4")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 4);
  } else if (uri_string.startsWith(":5")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 5);
  } else if (uri_string.startsWith(":6")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 6);
  } else if (uri_string.startsWith(":7")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 7);
  } else if (uri_string.startsWith(":8")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 8);
  } else if (uri_string.startsWith(":9")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 9);
  } else if (uri_string === ":") {
    return new Ok(pieces);
  } else if (uri_string === "") {
    return new Ok(pieces);
  } else if (uri_string.startsWith("?")) {
    let rest = uri_string.slice(1);
    return parse_query_with_question_mark(rest, pieces);
  } else if (uri_string.startsWith(":?")) {
    let rest = uri_string.slice(2);
    return parse_query_with_question_mark(rest, pieces);
  } else if (uri_string.startsWith("#")) {
    let rest = uri_string.slice(1);
    return parse_fragment(rest, pieces);
  } else if (uri_string.startsWith(":#")) {
    let rest = uri_string.slice(2);
    return parse_fragment(rest, pieces);
  } else if (uri_string.startsWith("/")) {
    return parse_path(uri_string, pieces);
  } else if (uri_string.startsWith(":")) {
    let rest = uri_string.slice(1);
    if (rest.startsWith("/")) {
      return parse_path(rest, pieces);
    } else {
      return new Error2(void 0);
    }
  } else {
    return new Error2(void 0);
  }
}
function parse_host_outside_of_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(original),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        )
      );
    } else if (uri_string.startsWith(":")) {
      let host = string_codeunit_slice(original, 0, size3);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(host),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_port(uri_string, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size3);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(host),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size3);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(host),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size3);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(host),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size3 + 1;
    }
  }
}
function parse_host_within_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(uri_string),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        )
      );
    } else if (uri_string.startsWith("]")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_port(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size3 + 1);
        let pieces$1 = new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(host),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_port(rest, pieces$1);
      }
    } else if (uri_string.startsWith("/")) {
      if (size3 === 0) {
        return parse_path(uri_string, pieces);
      } else {
        let host = string_codeunit_slice(original, 0, size3);
        let pieces$1 = new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(host),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_path(uri_string, pieces$1);
      }
    } else if (uri_string.startsWith("?")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_query_with_question_mark(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size3);
        let pieces$1 = new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(host),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_query_with_question_mark(rest, pieces$1);
      }
    } else if (uri_string.startsWith("#")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size3);
        let pieces$1 = new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(host),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_fragment(rest, pieces$1);
      }
    } else {
      let $ = pop_codeunit(uri_string);
      let char;
      let rest;
      char = $[0];
      rest = $[1];
      let $1 = is_valid_host_within_brackets_char(char);
      if ($1) {
        loop$original = original;
        loop$uri_string = rest;
        loop$pieces = pieces;
        loop$size = size3 + 1;
      } else {
        return parse_host_outside_of_brackets_loop(
          original,
          original,
          pieces,
          0
        );
      }
    }
  }
}
function parse_host_within_brackets(uri_string, pieces) {
  return parse_host_within_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host_outside_of_brackets(uri_string, pieces) {
  return parse_host_outside_of_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host(uri_string, pieces) {
  if (uri_string.startsWith("[")) {
    return parse_host_within_brackets(uri_string, pieces);
  } else if (uri_string.startsWith(":")) {
    let pieces$1 = new Uri(
      pieces.scheme,
      pieces.userinfo,
      new Some(""),
      pieces.port,
      pieces.path,
      pieces.query,
      pieces.fragment
    );
    return parse_port(uri_string, pieces$1);
  } else if (uri_string === "") {
    return new Ok(
      new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(""),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      )
    );
  } else {
    return parse_host_outside_of_brackets(uri_string, pieces);
  }
}
function parse_userinfo_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string.startsWith("@")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_host(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let userinfo = string_codeunit_slice(original, 0, size3);
        let pieces$1 = new Uri(
          pieces.scheme,
          new Some(userinfo),
          pieces.host,
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_host(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("/")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("?")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("#")) {
      return parse_host(original, pieces);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size3 + 1;
    }
  }
}
function parse_authority_pieces(string4, pieces) {
  return parse_userinfo_loop(string4, string4, pieces, 0);
}
function parse_authority_with_slashes(uri_string, pieces) {
  if (uri_string === "//") {
    return new Ok(
      new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(""),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      )
    );
  } else if (uri_string.startsWith("//")) {
    let rest = uri_string.slice(2);
    return parse_authority_pieces(rest, pieces);
  } else {
    return parse_path(uri_string, pieces);
  }
}
function parse_scheme_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string.startsWith("/")) {
      if (size3 === 0) {
        return parse_authority_with_slashes(uri_string, pieces);
      } else {
        let scheme = string_codeunit_slice(original, 0, size3);
        let pieces$1 = new Uri(
          new Some(lowercase(scheme)),
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_authority_with_slashes(uri_string, pieces$1);
      }
    } else if (uri_string.startsWith("?")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_query_with_question_mark(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size3);
        let pieces$1 = new Uri(
          new Some(lowercase(scheme)),
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_query_with_question_mark(rest, pieces$1);
      }
    } else if (uri_string.startsWith("#")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size3);
        let pieces$1 = new Uri(
          new Some(lowercase(scheme)),
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_fragment(rest, pieces$1);
      }
    } else if (uri_string.startsWith(":")) {
      if (size3 === 0) {
        return new Error2(void 0);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size3);
        let pieces$1 = new Uri(
          new Some(lowercase(scheme)),
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_authority_with_slashes(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          pieces.host,
          pieces.port,
          original,
          pieces.query,
          pieces.fragment
        )
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size3 + 1;
    }
  }
}
function to_string2(uri) {
  let _block;
  let $ = uri.fragment;
  if ($ instanceof Some) {
    let fragment = $[0];
    _block = toList(["#", fragment]);
  } else {
    _block = toList([]);
  }
  let parts = _block;
  let _block$1;
  let $1 = uri.query;
  if ($1 instanceof Some) {
    let query = $1[0];
    _block$1 = prepend("?", prepend(query, parts));
  } else {
    _block$1 = parts;
  }
  let parts$1 = _block$1;
  let parts$2 = prepend(uri.path, parts$1);
  let _block$2;
  let $2 = uri.host;
  let $3 = starts_with(uri.path, "/");
  if ($2 instanceof Some && !$3) {
    let host = $2[0];
    if (host !== "") {
      _block$2 = prepend("/", parts$2);
    } else {
      _block$2 = parts$2;
    }
  } else {
    _block$2 = parts$2;
  }
  let parts$3 = _block$2;
  let _block$3;
  let $4 = uri.host;
  let $5 = uri.port;
  if ($4 instanceof Some && $5 instanceof Some) {
    let port = $5[0];
    _block$3 = prepend(":", prepend(to_string(port), parts$3));
  } else {
    _block$3 = parts$3;
  }
  let parts$4 = _block$3;
  let _block$4;
  let $6 = uri.scheme;
  let $7 = uri.userinfo;
  let $8 = uri.host;
  if ($6 instanceof Some) {
    if ($7 instanceof Some) {
      if ($8 instanceof Some) {
        let s = $6[0];
        let u = $7[0];
        let h = $8[0];
        _block$4 = prepend(
          s,
          prepend(
            "://",
            prepend(u, prepend("@", prepend(h, parts$4)))
          )
        );
      } else {
        let s = $6[0];
        _block$4 = prepend(s, prepend(":", parts$4));
      }
    } else if ($8 instanceof Some) {
      let s = $6[0];
      let h = $8[0];
      _block$4 = prepend(s, prepend("://", prepend(h, parts$4)));
    } else {
      let s = $6[0];
      _block$4 = prepend(s, prepend(":", parts$4));
    }
  } else if ($7 instanceof None && $8 instanceof Some) {
    let h = $8[0];
    _block$4 = prepend("//", prepend(h, parts$4));
  } else {
    _block$4 = parts$4;
  }
  let parts$5 = _block$4;
  return concat2(parts$5);
}
function parse2(uri_string) {
  return parse_scheme_loop(uri_string, uri_string, empty2, 0);
}

// build/dev/javascript/gleam_http/gleam/http.mjs
var Get = class extends CustomType {
};
var Post = class extends CustomType {
};
var Head = class extends CustomType {
};
var Put = class extends CustomType {
};
var Delete = class extends CustomType {
};
var Trace = class extends CustomType {
};
var Connect = class extends CustomType {
};
var Options = class extends CustomType {
};
var Patch = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method) {
  if (method instanceof Get) {
    return "GET";
  } else if (method instanceof Post) {
    return "POST";
  } else if (method instanceof Head) {
    return "HEAD";
  } else if (method instanceof Put) {
    return "PUT";
  } else if (method instanceof Delete) {
    return "DELETE";
  } else if (method instanceof Trace) {
    return "TRACE";
  } else if (method instanceof Connect) {
    return "CONNECT";
  } else if (method instanceof Options) {
    return "OPTIONS";
  } else if (method instanceof Patch) {
    return "PATCH";
  } else {
    let method$1 = method[0];
    return method$1;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase(scheme);
  if ($ === "http") {
    return new Ok(new Http());
  } else if ($ === "https") {
    return new Ok(new Https());
  } else {
    return new Error2(void 0);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
var Request = class extends CustomType {
  constructor(method, headers, body, scheme, host, port, path2, query) {
    super();
    this.method = method;
    this.headers = headers;
    this.body = body;
    this.scheme = scheme;
    this.host = host;
    this.port = port;
    this.path = path2;
    this.query = query;
  }
};
function to_uri(request) {
  return new Uri(
    new Some(scheme_to_string(request.scheme)),
    new None(),
    new Some(request.host),
    request.port,
    request.path,
    request.query,
    new None()
  );
}
function from_uri(uri) {
  return try$(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return try$(
        (() => {
          let _pipe = uri.host;
          return to_result(_pipe, void 0);
        })(),
        (host) => {
          let req = new Request(
            new Get(),
            toList([]),
            "",
            scheme,
            host,
            uri.port,
            uri.path,
            uri.query
          );
          return new Ok(req);
        }
      );
    }
  );
}
function set_header(request, key, value) {
  let headers = key_set(request.headers, lowercase(key), value);
  return new Request(
    request.method,
    headers,
    request.body,
    request.scheme,
    request.host,
    request.port,
    request.path,
    request.query
  );
}
function set_body(req, body) {
  return new Request(
    req.method,
    req.headers,
    body,
    req.scheme,
    req.host,
    req.port,
    req.path,
    req.query
  );
}
function set_method(req, method) {
  return new Request(
    method,
    req.headers,
    req.body,
    req.scheme,
    req.host,
    req.port,
    req.path,
    req.query
  );
}
function to(url) {
  let _pipe = url;
  let _pipe$1 = parse2(_pipe);
  return try$(_pipe$1, from_uri);
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
var Response = class extends CustomType {
  constructor(status, headers, body) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
};

// build/dev/javascript/gleam_fetch/gleam_fetch_ffi.mjs
async function raw_send(request) {
  try {
    return new Ok(await fetch(request));
  } catch (error2) {
    return new Error2(new NetworkError(error2.toString()));
  }
}
function from_fetch_response(response) {
  return new Response(
    response.status,
    List.fromArray([...response.headers]),
    response
  );
}
function request_common(request) {
  let url = to_string2(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  return [url, options];
}
function to_fetch_request(request) {
  let [url, options] = request_common(request);
  if (options.method !== "GET" && options.method !== "HEAD") options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList) headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_text_body(response) {
  let body;
  try {
    body = await response.body.text();
  } catch (error2) {
    return new Error2(new UnableToReadBody());
  }
  return new Ok(response.withFields({ body }));
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
var NetworkError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UnableToReadBody = class extends CustomType {
};
function send(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(
    _pipe$2,
    (resp) => {
      return resolve(new Ok(from_fetch_response(resp)));
    }
  );
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function json_to_string(json) {
  return JSON.stringify(json);
}
function object(entries) {
  return Object.fromEntries(entries);
}
function identity2(x) {
  return x;
}
function array(list3) {
  const array4 = [];
  while (List$isNonEmpty(list3)) {
    array4.push(List$NonEmpty$first(list3));
    list3 = List$NonEmpty$rest(list3);
  }
  return array4;
}
function do_null() {
  return null;
}
function decode(string4) {
  try {
    const result = JSON.parse(string4);
    return Result$Ok(result);
  } catch (err) {
    return Result$Error(getJsonDecodeError(err, string4));
  }
}
function getJsonDecodeError(stdErr, json) {
  if (isUnexpectedEndOfInput(stdErr)) return DecodeError$UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json);
    if (result) return result;
  }
  return DecodeError$UnexpectedByte("");
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[1]);
  return DecodeError$UnexpectedByte(byte);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[1]);
  return DecodeError$UnexpectedByte(byte);
}
function spidermonkeyUnexpectedByteError(err, json) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json);
  const byte = toHex(json[position]);
  return DecodeError$UnexpectedByte(byte);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[2]);
  return DecodeError$UnexpectedByte(byte);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string4) {
  if (line === 1) return column - 1;
  let currentLn = 1;
  let position = 0;
  string4.split("").find((char, idx) => {
    if (char === "\n") currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var DecodeError$UnexpectedEndOfInput = () => new UnexpectedEndOfInput();
var UnexpectedByte = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DecodeError$UnexpectedByte = ($0) => new UnexpectedByte($0);
var UnableToDecode = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function do_parse(json, decoder) {
  return try$(
    decode(json),
    (dynamic_value) => {
      let _pipe = run(dynamic_value, decoder);
      return map_error(
        _pipe,
        (var0) => {
          return new UnableToDecode(var0);
        }
      );
    }
  );
}
function parse4(json, decoder) {
  return do_parse(json, decoder);
}
function to_string3(json) {
  return json_to_string(json);
}
function string3(input) {
  return identity2(input);
}
function bool2(input) {
  return identity2(input);
}
function int3(input) {
  return identity2(input);
}
function null$() {
  return do_null();
}
function nullable(input, inner_type) {
  if (input instanceof Some) {
    let value = input[0];
    return inner_type(value);
  } else {
    return null$();
  }
}
function object2(entries) {
  return object(entries);
}
function preprocessed_array(from2) {
  return array(from2);
}
function array2(entries, inner_type) {
  let _pipe = entries;
  let _pipe$1 = map3(_pipe, inner_type);
  return preprocessed_array(_pipe$1);
}

// build/dev/javascript/squall/squall.mjs
var Client = class extends CustomType {
  constructor(endpoint, headers) {
    super();
    this.endpoint = endpoint;
    this.headers = headers;
  }
};
function new_with_auth(endpoint, token4) {
  return new Client(endpoint, toList([["Authorization", "Bearer " + token4]]));
}
function prepare_request(client, query, variables) {
  let body = object2(
    toList([["query", string3(query)], ["variables", variables]])
  );
  return try$(
    (() => {
      let _pipe = to(client.endpoint);
      return map_error(_pipe, (_) => {
        return "Invalid endpoint URL";
      });
    })(),
    (req) => {
      let _block;
      let _pipe = req;
      let _pipe$1 = set_method(_pipe, new Post());
      let _pipe$2 = set_body(_pipe$1, to_string3(body));
      _block = set_header(_pipe$2, "content-type", "application/json");
      let req$1 = _block;
      let req$2 = fold2(
        client.headers,
        req$1,
        (r, header) => {
          return set_header(r, header[0], header[1]);
        }
      );
      return new Ok(req$2);
    }
  );
}
function parse_response(body, decoder) {
  return try$(
    (() => {
      let _pipe = parse4(body, dynamic);
      return map_error(
        _pipe,
        (_) => {
          return "Failed to decode JSON response";
        }
      );
    })(),
    (json_value) => {
      let data_decoder = field(
        "data",
        decoder,
        (data2) => {
          return success(data2);
        }
      );
      let _pipe = run(json_value, data_decoder);
      return map_error(
        _pipe,
        (errors) => {
          return "Failed to decode response data: " + inspect2(errors) + ". Response body: " + body;
        }
      );
    }
  );
}

// build/dev/javascript/starlist/starlist/graphql/starred_repos.mjs
var User = class extends CustomType {
  constructor(login, starred_repositories) {
    super();
    this.login = login;
    this.starred_repositories = starred_repositories;
  }
};
var StarredRepositoryConnection = class extends CustomType {
  constructor(is_over_limit, total_count, page_info, edges) {
    super();
    this.is_over_limit = is_over_limit;
    this.total_count = total_count;
    this.page_info = page_info;
    this.edges = edges;
  }
};
var PageInfo = class extends CustomType {
  constructor(end_cursor, has_next_page) {
    super();
    this.end_cursor = end_cursor;
    this.has_next_page = has_next_page;
  }
};
var StarredRepositoryEdge = class extends CustomType {
  constructor(starred_at, node) {
    super();
    this.starred_at = starred_at;
    this.node = node;
  }
};
var Repository = class extends CustomType {
  constructor(archived_at, description, fork_count, homepage_url, url, is_fork, is_private, is_template, languages, latest_release, license_info, name_with_owner, parent, pushed_at, repository_topics, stargazer_count) {
    super();
    this.archived_at = archived_at;
    this.description = description;
    this.fork_count = fork_count;
    this.homepage_url = homepage_url;
    this.url = url;
    this.is_fork = is_fork;
    this.is_private = is_private;
    this.is_template = is_template;
    this.languages = languages;
    this.latest_release = latest_release;
    this.license_info = license_info;
    this.name_with_owner = name_with_owner;
    this.parent = parent;
    this.pushed_at = pushed_at;
    this.repository_topics = repository_topics;
    this.stargazer_count = stargazer_count;
  }
};
var LanguageConnection = class extends CustomType {
  constructor(total_count, total_size, edges) {
    super();
    this.total_count = total_count;
    this.total_size = total_size;
    this.edges = edges;
  }
};
var Release = class extends CustomType {
  constructor(name, published_at) {
    super();
    this.name = name;
    this.published_at = published_at;
  }
};
var License = class extends CustomType {
  constructor(nickname, spdx_id) {
    super();
    this.nickname = nickname;
    this.spdx_id = spdx_id;
  }
};
var ParentRepository = class extends CustomType {
  constructor(name_with_owner) {
    super();
    this.name_with_owner = name_with_owner;
  }
};
var RepositoryTopicConnection = class extends CustomType {
  constructor(total_count, nodes) {
    super();
    this.total_count = total_count;
    this.nodes = nodes;
  }
};
var LanguageEdge = class extends CustomType {
  constructor(node, size3) {
    super();
    this.node = node;
    this.size = size3;
  }
};
var RepositoryTopic = class extends CustomType {
  constructor(topic, url) {
    super();
    this.topic = topic;
    this.url = url;
  }
};
var Language = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var Topic = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var StarredReposResponse = class extends CustomType {
  constructor(viewer) {
    super();
    this.viewer = viewer;
  }
};
function page_info_decoder() {
  return field(
    "endCursor",
    optional(string2),
    (end_cursor) => {
      return field(
        "hasNextPage",
        bool,
        (has_next_page) => {
          return success(new PageInfo(end_cursor, has_next_page));
        }
      );
    }
  );
}
function release_decoder() {
  return field(
    "name",
    optional(string2),
    (name) => {
      return field(
        "publishedAt",
        optional(string2),
        (published_at) => {
          return success(new Release(name, published_at));
        }
      );
    }
  );
}
function license_decoder() {
  return field(
    "nickname",
    optional(string2),
    (nickname) => {
      return field(
        "spdxId",
        optional(string2),
        (spdx_id) => {
          return success(new License(nickname, spdx_id));
        }
      );
    }
  );
}
function parent_repository_decoder() {
  return field(
    "nameWithOwner",
    string2,
    (name_with_owner) => {
      return success(new ParentRepository(name_with_owner));
    }
  );
}
function language_decoder() {
  return field(
    "name",
    string2,
    (name) => {
      return success(new Language(name));
    }
  );
}
function language_edge_decoder() {
  return field(
    "node",
    language_decoder(),
    (node) => {
      return field(
        "size",
        int2,
        (size3) => {
          return success(new LanguageEdge(node, size3));
        }
      );
    }
  );
}
function language_connection_decoder() {
  return field(
    "totalCount",
    int2,
    (total_count) => {
      return field(
        "totalSize",
        int2,
        (total_size) => {
          return field(
            "edges",
            optional(list2(language_edge_decoder())),
            (edges) => {
              return success(
                new LanguageConnection(total_count, total_size, edges)
              );
            }
          );
        }
      );
    }
  );
}
function topic_decoder() {
  return field(
    "name",
    string2,
    (name) => {
      return success(new Topic(name));
    }
  );
}
function repository_topic_decoder() {
  return field(
    "topic",
    topic_decoder(),
    (topic) => {
      return field(
        "url",
        string2,
        (url) => {
          return success(new RepositoryTopic(topic, url));
        }
      );
    }
  );
}
function repository_topic_connection_decoder() {
  return field(
    "totalCount",
    int2,
    (total_count) => {
      return field(
        "nodes",
        optional(list2(repository_topic_decoder())),
        (nodes) => {
          return success(
            new RepositoryTopicConnection(total_count, nodes)
          );
        }
      );
    }
  );
}
function repository_decoder() {
  return field(
    "archivedAt",
    optional(string2),
    (archived_at) => {
      return field(
        "description",
        optional(string2),
        (description) => {
          return field(
            "forkCount",
            int2,
            (fork_count) => {
              return field(
                "homepageUrl",
                optional(string2),
                (homepage_url) => {
                  return field(
                    "url",
                    string2,
                    (url) => {
                      return field(
                        "isFork",
                        bool,
                        (is_fork) => {
                          return field(
                            "isPrivate",
                            bool,
                            (is_private) => {
                              return field(
                                "isTemplate",
                                bool,
                                (is_template) => {
                                  return field(
                                    "languages",
                                    optional(
                                      language_connection_decoder()
                                    ),
                                    (languages) => {
                                      return field(
                                        "latestRelease",
                                        optional(release_decoder()),
                                        (latest_release) => {
                                          return field(
                                            "licenseInfo",
                                            optional(license_decoder()),
                                            (license_info) => {
                                              return field(
                                                "nameWithOwner",
                                                string2,
                                                (name_with_owner) => {
                                                  return field(
                                                    "parent",
                                                    optional(
                                                      parent_repository_decoder()
                                                    ),
                                                    (parent) => {
                                                      return field(
                                                        "pushedAt",
                                                        optional(
                                                          string2
                                                        ),
                                                        (pushed_at) => {
                                                          return field(
                                                            "repositoryTopics",
                                                            repository_topic_connection_decoder(),
                                                            (repository_topics) => {
                                                              return field(
                                                                "stargazerCount",
                                                                int2,
                                                                (stargazer_count) => {
                                                                  return success(
                                                                    new Repository(
                                                                      archived_at,
                                                                      description,
                                                                      fork_count,
                                                                      homepage_url,
                                                                      url,
                                                                      is_fork,
                                                                      is_private,
                                                                      is_template,
                                                                      languages,
                                                                      latest_release,
                                                                      license_info,
                                                                      name_with_owner,
                                                                      parent,
                                                                      pushed_at,
                                                                      repository_topics,
                                                                      stargazer_count
                                                                    )
                                                                  );
                                                                }
                                                              );
                                                            }
                                                          );
                                                        }
                                                      );
                                                    }
                                                  );
                                                }
                                              );
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function starred_repository_edge_decoder() {
  return field(
    "starredAt",
    string2,
    (starred_at) => {
      return field(
        "node",
        repository_decoder(),
        (node) => {
          return success(new StarredRepositoryEdge(starred_at, node));
        }
      );
    }
  );
}
function starred_repository_connection_decoder() {
  return field(
    "isOverLimit",
    bool,
    (is_over_limit) => {
      return field(
        "totalCount",
        int2,
        (total_count) => {
          return field(
            "pageInfo",
            page_info_decoder(),
            (page_info) => {
              return field(
                "edges",
                optional(
                  list2(starred_repository_edge_decoder())
                ),
                (edges) => {
                  return success(
                    new StarredRepositoryConnection(
                      is_over_limit,
                      total_count,
                      page_info,
                      edges
                    )
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function user_decoder() {
  return field(
    "login",
    string2,
    (login) => {
      return field(
        "starredRepositories",
        starred_repository_connection_decoder(),
        (starred_repositories) => {
          return success(new User(login, starred_repositories));
        }
      );
    }
  );
}
function starred_repos_response_decoder() {
  return field(
    "viewer",
    user_decoder(),
    (viewer) => {
      return success(new StarredReposResponse(viewer));
    }
  );
}
function starred_repos(client, cursor) {
  return prepare_request(
    client,
    "query GetStarredRepos($cursor: String) {\n  viewer {\n    login\n\n    starredRepositories(first: 40, after: $cursor) {\n      isOverLimit\n      totalCount\n\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n\n      edges {\n        starredAt\n\n        node {\n          archivedAt\n          description\n          forkCount\n          homepageUrl\n          url\n          isFork\n          isPrivate\n          isTemplate\n\n          languages(first: 5, orderBy: { direction: DESC, field: SIZE }) {\n            totalCount\n            totalSize\n            edges {\n              node {\n                name\n              }\n              size\n            }\n          }\n\n          latestRelease {\n            name\n            publishedAt\n          }\n\n          licenseInfo {\n            nickname\n            spdxId\n          }\n\n          nameWithOwner\n          parent {\n            nameWithOwner\n          }\n          pushedAt\n\n          repositoryTopics(first: 20) {\n            totalCount\n            nodes {\n              topic {\n                name\n              }\n              url\n            }\n          }\n\n          stargazerCount\n        }\n      }\n    }\n  }\n}\n",
    object2(toList([["cursor", string3(cursor)]]))
  );
}
function parse_starred_repos_response(body) {
  return parse_response(body, starred_repos_response_decoder());
}

// build/dev/javascript/starlist/starlist/internal/star_types.mjs
var Timestamp = class extends CustomType {
  constructor(date, time) {
    super();
    this.date = date;
    this.time = time;
  }
};
var Language2 = class extends CustomType {
  constructor(name, percent) {
    super();
    this.name = name;
    this.percent = percent;
  }
};
var Topic2 = class extends CustomType {
  constructor(name, url) {
    super();
    this.name = name;
    this.url = url;
  }
};
var Release2 = class extends CustomType {
  constructor(name, published_on) {
    super();
    this.name = name;
    this.published_on = published_on;
  }
};
var StarredRepo = class extends CustomType {
  constructor(archived_on, description, forks, homepage_url, is_fork, is_private, is_template, language_count2, languages, latest_release, license, name, parent_repo, pushed_on, starred_on, stars, topic_count, topics, url) {
    super();
    this.archived_on = archived_on;
    this.description = description;
    this.forks = forks;
    this.homepage_url = homepage_url;
    this.is_fork = is_fork;
    this.is_private = is_private;
    this.is_template = is_template;
    this.language_count = language_count2;
    this.languages = languages;
    this.latest_release = latest_release;
    this.license = license;
    this.name = name;
    this.parent_repo = parent_repo;
    this.pushed_on = pushed_on;
    this.starred_on = starred_on;
    this.stars = stars;
    this.topic_count = topic_count;
    this.topics = topics;
    this.url = url;
  }
};
var PartitionContext = class extends CustomType {
  constructor(name, filename2, count, count_label) {
    super();
    this.name = name;
    this.filename = filename2;
    this.count = count;
    this.count_label = count_label;
  }
};
var TemplateVars = class extends CustomType {
  constructor(data_version2, updated_at, generated_at, login, truncated, total, fetched, stars, groups, group_count, group_description, partition2, partitions, partition_count, partition_description2) {
    super();
    this.data_version = data_version2;
    this.updated_at = updated_at;
    this.generated_at = generated_at;
    this.login = login;
    this.truncated = truncated;
    this.total = total;
    this.fetched = fetched;
    this.stars = stars;
    this.groups = groups;
    this.group_count = group_count;
    this.group_description = group_description;
    this.partition = partition2;
    this.partitions = partitions;
    this.partition_count = partition_count;
    this.partition_description = partition_description2;
  }
};
var QueryResponse = class extends CustomType {
  constructor(data_version2, login, truncated, total, fetched, stars, updated_at) {
    super();
    this.data_version = data_version2;
    this.login = login;
    this.truncated = truncated;
    this.total = total;
    this.fetched = fetched;
    this.stars = stars;
    this.updated_at = updated_at;
  }
};
var ResponseRepo = class extends CustomType {
  constructor(archived_on, description, forks, homepage_url, is_fork, is_private, is_template, language_count2, languages, latest_release, license, name, parent_repo, pushed_on, starred_on, stars, topic_count, topics, url) {
    super();
    this.archived_on = archived_on;
    this.description = description;
    this.forks = forks;
    this.homepage_url = homepage_url;
    this.is_fork = is_fork;
    this.is_private = is_private;
    this.is_template = is_template;
    this.language_count = language_count2;
    this.languages = languages;
    this.latest_release = latest_release;
    this.license = license;
    this.name = name;
    this.parent_repo = parent_repo;
    this.pushed_on = pushed_on;
    this.starred_on = starred_on;
    this.stars = stars;
    this.topic_count = topic_count;
    this.topics = topics;
    this.url = url;
  }
};
var ResponseRelease = class extends CustomType {
  constructor(name, published_on) {
    super();
    this.name = name;
    this.published_on = published_on;
  }
};
var GeneratedFile = class extends CustomType {
  constructor(filename2, data2) {
    super();
    this.filename = filename2;
    this.data = data2;
  }
};
var data_version = 2;

// build/dev/javascript/starlist/starlist/timestamp_ffi.mjs
function formatDateLocale(locale, timeZone, dateStyle, isoString) {
  const formatter = new Intl.DateTimeFormat(locale, { timeZone, dateStyle });
  return formatter.format(new Date(isoString));
}
function formatTimeLocale(locale, timeZone, timeStyle, isoString) {
  const formatter = new Intl.DateTimeFormat(locale, { timeZone, timeStyle });
  return formatter.format(new Date(isoString));
}
function formatDateIso(timeZone, isoString) {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);
  const get6 = (type) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get6("year")}-${get6("month")}-${get6("day")}`;
}
function formatTimeIso(timeZone, isoString) {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(d);
  const get6 = (type) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get6("hour")}:${get6("minute")}:${get6("second")}`;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function nowEpochSeconds() {
  return Math.floor(Date.now() / 1e3);
}

// build/dev/javascript/starlist/starlist/internal/timestamp.mjs
function now_iso() {
  return nowIso();
}
function format(cfg, iso_string) {
  if (cfg instanceof IsoDateTime) {
    let time_zone = cfg.time_zone;
    return new Timestamp(
      formatDateIso(time_zone, iso_string),
      formatTimeIso(time_zone, iso_string)
    );
  } else {
    let locale = cfg.locale;
    let time_zone = cfg.time_zone;
    let date_style = cfg.date_style;
    let time_style = cfg.time_style;
    return new Timestamp(
      formatDateLocale(locale, time_zone, date_style, iso_string),
      formatTimeLocale(locale, time_zone, time_style, iso_string)
    );
  }
}
function now(cfg) {
  return format(cfg, nowIso());
}

// build/dev/javascript/starlist/starlist/internal/github_client.mjs
var max_retries = 3;
var default_backoff_ms = 6e4;
function make_client(token4) {
  return new_with_auth("https://api.github.com/graphql", token4);
}
function get_header(headers, name) {
  let lower_name = lowercase(name);
  let _pipe = headers;
  let _pipe$1 = find(
    _pipe,
    (h) => {
      return lowercase(h[0]) === lower_name;
    }
  );
  let _pipe$2 = map5(_pipe$1, (h) => {
    return h[1];
  });
  return from_result(_pipe$2);
}
function language_count(repo) {
  let $ = repo.languages;
  if ($ instanceof Some) {
    let conn = $[0];
    return conn.total_count;
  } else {
    return 0;
  }
}
function extract_languages(repo) {
  let $ = repo.languages;
  if ($ instanceof Some) {
    let conn = $[0];
    let $1 = conn.edges;
    if ($1 instanceof Some) {
      let edges = $1[0];
      let total_size = conn.total_size;
      return map3(
        edges,
        (edge) => {
          let _block;
          let $2 = total_size > 0;
          if ($2) {
            _block = divideInt(edge.size * 100, total_size);
          } else {
            _block = 0;
          }
          let percent = _block;
          return new Language2(edge.node.name, percent);
        }
      );
    } else {
      return toList([]);
    }
  } else {
    return toList([]);
  }
}
function extract_release(repo) {
  let $ = repo.latest_release;
  if ($ instanceof Some) {
    let rel = $[0];
    let $1 = rel.published_at;
    if ($1 instanceof Some) {
      let published = $1[0];
      return new Some(new ResponseRelease(rel.name, published));
    } else {
      return $1;
    }
  } else {
    return $;
  }
}
function extract_license(repo) {
  let $ = repo.license_info;
  if ($ instanceof Some) {
    let lic = $[0];
    let $1 = lic.spdx_id;
    if ($1 instanceof Some) {
      let spdx = $1[0];
      return spdx;
    } else {
      let $2 = lic.nickname;
      if ($2 instanceof Some) {
        let nick = $2[0];
        return nick;
      } else {
        return "";
      }
    }
  } else {
    return "";
  }
}
function extract_parent(repo) {
  let $ = repo.parent;
  if ($ instanceof Some) {
    let p = $[0];
    return new Some(p.name_with_owner);
  } else {
    return $;
  }
}
function extract_topics(repo) {
  let $ = repo.repository_topics.nodes;
  if ($ instanceof Some) {
    let nodes = $[0];
    return new Some(
      map3(
        nodes,
        (rt) => {
          return new Topic2(rt.topic.name, rt.url);
        }
      )
    );
  } else {
    return $;
  }
}
function edge_to_response_repo(edge) {
  let repo = edge.node;
  return new ResponseRepo(
    repo.archived_at,
    repo.description,
    repo.fork_count,
    repo.homepage_url,
    repo.is_fork,
    repo.is_private,
    repo.is_template,
    language_count(repo),
    extract_languages(repo),
    extract_release(repo),
    extract_license(repo),
    repo.name_with_owner,
    extract_parent(repo),
    unwrap(repo.pushed_at, ""),
    edge.starred_at,
    repo.stargazer_count,
    repo.repository_topics.total_count,
    extract_topics(repo),
    repo.url
  );
}
function jitter(min_ms, max_ms) {
  return min_ms + random(max_ms - min_ms + 1);
}
function get_backoff_ms(headers) {
  let $ = get_header(headers, "retry-after");
  if ($ instanceof Some) {
    let value = $[0];
    let $1 = parse_int(value);
    if ($1 instanceof Ok) {
      let seconds2 = $1[0];
      return seconds2 * 1e3;
    } else {
      return default_backoff_ms;
    }
  } else {
    let $1 = get_header(headers, "x-ratelimit-reset");
    if ($1 instanceof Some) {
      let value = $1[0];
      let $2 = parse_int(value);
      if ($2 instanceof Ok) {
        let reset_epoch = $2[0];
        let now2 = nowEpochSeconds();
        let delta = reset_epoch - now2;
        let $3 = delta > 0;
        if ($3) {
          return delta * 1e3;
        } else {
          return default_backoff_ms;
        }
      } else {
        return default_backoff_ms;
      }
    } else {
      return default_backoff_ms;
    }
  }
}
function handle_success(client, acc, body, max_stars) {
  let $ = parse_starred_repos_response(body);
  if ($ instanceof Ok) {
    let parsed = $[0];
    let viewer = parsed.viewer;
    let conn = viewer.starred_repositories;
    let _block;
    let $1 = conn.edges;
    if ($1 instanceof Some) {
      let edges = $1[0];
      _block = append3(acc, edges);
    } else {
      _block = acc;
    }
    let new_edges = _block;
    let login = viewer.login;
    let truncated = conn.is_over_limit;
    let total = conn.total_count;
    let _block$1;
    if (max_stars instanceof Some) {
      let n = max_stars[0];
      _block$1 = length2(new_edges) >= n;
    } else {
      _block$1 = false;
    }
    let reached_limit = _block$1;
    debug(
      "Fetched page, " + to_string(length2(new_edges)) + "/" + to_string(
        total
      ) + " stars so far"
    );
    if (reached_limit) {
      return resolve(new Ok([new_edges, login, truncated, total]));
    } else {
      let $2 = conn.page_info.has_next_page;
      let $3 = conn.page_info.end_cursor;
      if ($2 && $3 instanceof Some) {
        let next_cursor = $3[0];
        let _pipe = wait(jitter(200, 500));
        return then_await(
          _pipe,
          (_) => {
            return fetch_all_pages(client, next_cursor, new_edges, 0, max_stars);
          }
        );
      } else {
        return resolve(new Ok([new_edges, login, truncated, total]));
      }
    }
  } else {
    let msg = $[0];
    return resolve(
      new Error2(new GitHubApiError("Failed to decode response: " + msg))
    );
  }
}
function fetch_all_pages(client, cursor, acc, retries, max_stars) {
  let $ = starred_repos(client, cursor);
  if ($ instanceof Ok) {
    let request = $[0];
    let _pipe = send(request);
    let _pipe$1 = try_await(_pipe, read_text_body);
    return then_await(
      _pipe$1,
      (result) => {
        if (result instanceof Ok) {
          let resp = result[0];
          return handle_response(client, cursor, acc, retries, resp, max_stars);
        } else {
          return resolve(
            new Error2(
              new GitHubApiError(
                "Network error during GitHub API request"
              )
            )
          );
        }
      }
    );
  } else {
    let msg = $[0];
    return resolve(
      new Error2(new GitHubApiError("Failed to build request: " + msg))
    );
  }
}
function handle_response(client, cursor, acc, retries, resp, max_stars) {
  let $ = resp.status;
  if ($ === 200) {
    return handle_success(client, acc, resp.body, max_stars);
  } else if ($ === 429) {
    return handle_rate_limit(client, cursor, acc, retries, resp, max_stars);
  } else if ($ === 403) {
    return handle_rate_limit(client, cursor, acc, retries, resp, max_stars);
  } else {
    let status = $;
    return resolve(
      new Error2(
        new GitHubApiError(
          "GitHub API returned status " + to_string(status) + ": " + slice(
            resp.body,
            0,
            200
          )
        )
      )
    );
  }
}
function fetch_starred_repos(token4, max_stars) {
  let client = make_client(token4);
  let _pipe = fetch_all_pages(client, "", toList([]), 0, max_stars);
  return map_promise(
    _pipe,
    (result) => {
      let _pipe$1 = result;
      return map5(
        _pipe$1,
        (acc) => {
          let edges;
          let login;
          let truncated;
          let total;
          edges = acc[0];
          login = acc[1];
          truncated = acc[2];
          total = acc[3];
          let repos = map3(edges, edge_to_response_repo);
          return new QueryResponse(
            data_version,
            login,
            truncated,
            total,
            length2(repos),
            repos,
            now_iso()
          );
        }
      );
    }
  );
}
function handle_rate_limit(client, cursor, acc, retries, resp, max_stars) {
  let $ = retries >= max_retries;
  if ($) {
    return resolve(
      new Error2(
        new GitHubApiError(
          "Rate limit exceeded after " + to_string(max_retries) + " retries"
        )
      )
    );
  } else {
    let wait_ms = get_backoff_ms(resp.headers);
    warning(
      "Rate limited (status " + to_string(resp.status) + "), waiting " + to_string(
        globalThis.Math.trunc(wait_ms / 1e3)
      ) + "s before retry " + to_string(retries + 1) + "/" + to_string(
        max_retries
      )
    );
    let _pipe = wait(wait_ms);
    return then_await(
      _pipe,
      (_) => {
        return fetch_all_pages(client, cursor, acc, retries + 1, max_stars);
      }
    );
  }
}

// build/dev/javascript/starlist/starlist/internal/partitioner.mjs
var PartitionInfo = class extends CustomType {
  constructor(key, filename2, count) {
    super();
    this.key = key;
    this.filename = filename2;
    this.count = count;
  }
};
var PartitionData = class extends CustomType {
  constructor(key, filename2, vars) {
    super();
    this.key = key;
    this.filename = filename2;
    this.vars = vars;
  }
};
var PartitionResult = class extends CustomType {
  constructor(partitions, data2) {
    super();
    this.partitions = partitions;
    this.data = data2;
  }
};
function year_from_timestamp(ts) {
  let $ = split2(ts.date, "-");
  if ($ instanceof Empty) {
    return ts.date;
  } else {
    let year = $.head;
    return year;
  }
}
function year_month_from_timestamp(ts) {
  let $ = split2(ts.date, "-");
  if ($ instanceof Empty) {
    return ts.date;
  } else {
    let $1 = $.tail;
    if ($1 instanceof Empty) {
      return ts.date;
    } else {
      let year = $.head;
      let month = $1.head;
      return year + "-" + month;
    }
  }
}
function partition_keys(repo, partition2) {
  if (partition2 instanceof PartitionOff) {
    return toList([]);
  } else if (partition2 instanceof PartitionByLanguage) {
    let $ = repo.languages;
    if ($ instanceof Empty) {
      return toList([""]);
    } else {
      let langs = $;
      return map3(langs, (l) => {
        return l.name;
      });
    }
  } else if (partition2 instanceof PartitionByTopic) {
    let $ = repo.topics;
    if ($ instanceof Some) {
      let $1 = $[0];
      if ($1 instanceof Empty) {
        return toList(["no-topics"]);
      } else {
        let topics = $1;
        return map3(topics, (t) => {
          return t.name;
        });
      }
    } else {
      return toList(["no-topics"]);
    }
  } else if (partition2 instanceof PartitionByYear) {
    return toList([year_from_timestamp(repo.starred_on)]);
  } else {
    return toList([year_month_from_timestamp(repo.starred_on)]);
  }
}
function apply_shorthands(s) {
  let _pipe = s;
  let _pipe$1 = replace(_pipe, "c++", "cpp");
  let _pipe$2 = replace(_pipe$1, "c#", "csharp");
  let _pipe$3 = replace(_pipe$2, "f#", "fsharp");
  let _pipe$4 = replace(_pipe$3, "f*", "fstar");
  let _pipe$5 = replace(_pipe$4, "q#", "qsharp");
  return replace(_pipe$5, ".net", "dotnet");
}
function collapse_hyphens(loop$s) {
  while (true) {
    let s = loop$s;
    let $ = contains_string(s, "--");
    if ($) {
      loop$s = replace(s, "--", "-");
    } else {
      return s;
    }
  }
}
function drop_leading(loop$s, loop$char) {
  while (true) {
    let s = loop$s;
    let char = loop$char;
    let $ = starts_with(s, char);
    if ($) {
      loop$s = drop_start(s, 1);
      loop$char = char;
    } else {
      return s;
    }
  }
}
function drop_trailing(loop$s, loop$char) {
  while (true) {
    let s = loop$s;
    let char = loop$char;
    let $ = ends_with(s, char);
    if ($) {
      loop$s = drop_end(s, 1);
      loop$char = char;
    } else {
      return s;
    }
  }
}
function is_alnum(c) {
  if (c === "a") {
    return true;
  } else if (c === "b") {
    return true;
  } else if (c === "c") {
    return true;
  } else if (c === "d") {
    return true;
  } else if (c === "e") {
    return true;
  } else if (c === "f") {
    return true;
  } else if (c === "g") {
    return true;
  } else if (c === "h") {
    return true;
  } else if (c === "i") {
    return true;
  } else if (c === "j") {
    return true;
  } else if (c === "k") {
    return true;
  } else if (c === "l") {
    return true;
  } else if (c === "m") {
    return true;
  } else if (c === "n") {
    return true;
  } else if (c === "o") {
    return true;
  } else if (c === "p") {
    return true;
  } else if (c === "q") {
    return true;
  } else if (c === "r") {
    return true;
  } else if (c === "s") {
    return true;
  } else if (c === "t") {
    return true;
  } else if (c === "u") {
    return true;
  } else if (c === "v") {
    return true;
  } else if (c === "w") {
    return true;
  } else if (c === "x") {
    return true;
  } else if (c === "y") {
    return true;
  } else if (c === "z") {
    return true;
  } else if (c === "0") {
    return true;
  } else if (c === "1") {
    return true;
  } else if (c === "2") {
    return true;
  } else if (c === "3") {
    return true;
  } else if (c === "4") {
    return true;
  } else if (c === "5") {
    return true;
  } else if (c === "6") {
    return true;
  } else if (c === "7") {
    return true;
  } else if (c === "8") {
    return true;
  } else if (c === "9") {
    return true;
  } else {
    return false;
  }
}
function replace_non_word(s) {
  let _pipe = s;
  let _pipe$1 = replace(_pipe, "'", "");
  let _pipe$2 = graphemes(_pipe$1);
  let _pipe$3 = map3(
    _pipe$2,
    (c) => {
      let $ = is_alnum(c) || c === "-";
      if ($) {
        return c;
      } else {
        return "-";
      }
    }
  );
  return join(_pipe$3, "");
}
function sanitize_key(key) {
  let _pipe = key;
  let _pipe$1 = lowercase(_pipe);
  let _pipe$2 = apply_shorthands(_pipe$1);
  let _pipe$3 = replace_non_word(_pipe$2);
  let _pipe$4 = collapse_hyphens(_pipe$3);
  let _pipe$5 = drop_leading(_pipe$4, "-");
  return drop_trailing(_pipe$5, "-");
}
function make_filename(pattern, key) {
  return replace(pattern, "{key}", sanitize_key(key));
}
function partition_matches_group(partition2, group2) {
  if (group2 instanceof GroupByLanguage && partition2 instanceof PartitionByLanguage) {
    return true;
  } else if (group2 instanceof GroupByTopic && partition2 instanceof PartitionByTopic) {
    return true;
  } else {
    return false;
  }
}
function upsert(acc, key, repo) {
  let _block;
  let $ = get(acc, key);
  if ($ instanceof Ok) {
    let repos = $[0];
    _block = repos;
  } else {
    _block = toList([]);
  }
  let existing = _block;
  return insert(acc, key, append3(existing, toList([repo])));
}
function bucket_stars(stars, partition2) {
  return fold2(
    stars,
    make(),
    (acc, repo) => {
      let keys2 = partition_keys(repo, partition2);
      return fold2(
        keys2,
        acc,
        (inner, key) => {
          return upsert(inner, key, repo);
        }
      );
    }
  );
}
function group_by_language(stars) {
  return fold2(
    stars,
    make(),
    (acc, repo) => {
      let _block;
      let $ = repo.languages;
      if ($ instanceof Empty) {
        _block = "";
      } else {
        let first = $.head;
        _block = first.name;
      }
      let key = _block;
      return upsert(acc, key, repo);
    }
  );
}
function group_by_topic(stars) {
  return fold2(
    stars,
    make(),
    (acc, repo) => {
      let _block;
      let $ = repo.topics;
      if ($ instanceof Some) {
        let $1 = $[0];
        if ($1 instanceof Empty) {
          _block = "no-topics";
        } else {
          let first = $1.head;
          _block = first.name;
        }
      } else {
        _block = "no-topics";
      }
      let key = _block;
      return upsert(acc, key, repo);
    }
  );
}
function group_by_licence(stars) {
  return fold2(
    stars,
    make(),
    (acc, repo) => {
      let _block;
      let $ = repo.license;
      if ($ === "") {
        _block = "Unknown license";
      } else {
        _block = $;
      }
      let key = _block;
      return upsert(acc, key, repo);
    }
  );
}
function group_stars(stars, group2) {
  if (group2 instanceof GroupByLanguage) {
    return [group_by_language(stars), "languages"];
  } else if (group2 instanceof GroupByTopic) {
    return [group_by_topic(stars), "topics"];
  } else {
    return [group_by_licence(stars), "licences"];
  }
}
function scope_vars(base, stars, group2, grouped, partition_ctx) {
  if (grouped) {
    let $ = group_stars(stars, group2);
    let groups;
    let description;
    groups = $[0];
    description = $[1];
    return new TemplateVars(
      base.data_version,
      base.updated_at,
      base.generated_at,
      base.login,
      base.truncated,
      length2(stars),
      length2(stars),
      stars,
      groups,
      size(groups),
      description,
      partition_ctx,
      base.partitions,
      base.partition_count,
      base.partition_description
    );
  } else {
    return new TemplateVars(
      base.data_version,
      base.updated_at,
      base.generated_at,
      base.login,
      base.truncated,
      length2(stars),
      length2(stars),
      stars,
      make(),
      0,
      "",
      partition_ctx,
      base.partitions,
      base.partition_count,
      base.partition_description
    );
  }
}
function dict_get(d, key) {
  let $ = get(d, key);
  if ($ instanceof Ok) {
    let v = $[0];
    return v;
  } else {
    return toList([]);
  }
}
function partition(vars, partition2, group2, partition_filename) {
  if (partition2 instanceof PartitionOff) {
    return new Error2(void 0);
  } else {
    let buckets = bucket_stars(vars.stars, partition2);
    let _block;
    let _pipe = keys(buckets);
    _block = sort(_pipe, compare);
    let sorted_keys = _block;
    let partitions = map3(
      sorted_keys,
      (key) => {
        let stars = dict_get(buckets, key);
        return new PartitionInfo(
          key,
          make_filename(partition_filename, key),
          length2(stars)
        );
      }
    );
    let grouped = !partition_matches_group(partition2, group2);
    let data2 = map3(
      sorted_keys,
      (key) => {
        let stars = dict_get(buckets, key);
        let count = length2(stars);
        let filename2 = make_filename(partition_filename, key);
        let _block$1;
        if (count === 1) {
          _block$1 = "1 repo";
        } else {
          let n = count;
          _block$1 = to_string(n) + " repos";
        }
        let count_label = _block$1;
        let ctx = new PartitionContext(
          key,
          filename2,
          count,
          count_label
        );
        let scoped = scope_vars(vars, stars, group2, grouped, new Some(ctx));
        return new PartitionData(key, filename2, scoped);
      }
    );
    return new Ok(new PartitionResult(partitions, data2));
  }
}

// build/dev/javascript/glemplate/glemplate/ast.mjs
var Text = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Dynamic = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Nodes = class extends CustomType {
  constructor(nodes) {
    super();
    this.nodes = nodes;
  }
};
var Template = class extends CustomType {
  constructor(name, nodes) {
    super();
    this.name = name;
    this.nodes = nodes;
  }
};
var Output = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var RawOutput = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var If = class extends CustomType {
  constructor($0, if_true, if_false) {
    super();
    this[0] = $0;
    this.if_true = if_true;
    this.if_false = if_false;
  }
};
var Iter = class extends CustomType {
  constructor(over, binding, nodes) {
    super();
    this.over = over;
    this.binding = binding;
    this.nodes = nodes;
  }
};
var Render2 = class extends CustomType {
  constructor(tpl, assigns_map) {
    super();
    this.tpl = tpl;
    this.assigns_map = assigns_map;
  }
};
var Assign = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var FieldAccess = class extends CustomType {
  constructor(container, field2) {
    super();
    this.container = container;
    this.field = field2;
  }
};

// build/dev/javascript/glemplate/glemplate/assigns.mjs
var String3 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Int2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Lazy = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Bool2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Dict2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var List2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function new$3() {
  return make();
}
function add_string(assigns, name, value) {
  return insert(assigns, name, new String3(value));
}
function add_int(assigns, name, value) {
  return insert(assigns, name, new Int2(value));
}
function add_bool(assigns, name, value) {
  return insert(assigns, name, new Bool2(value));
}
function add_list(assigns, name, value) {
  return insert(assigns, name, new List2(value));
}
function add_dict(assigns, name, value) {
  return insert(assigns, name, new Dict2(value));
}

// build/dev/javascript/iv/iv/internal/constants.mjs
var error_nil = /* @__PURE__ */ new Error2(void 0);

// build/dev/javascript/iv/iv_ffi.mjs
var empty3 = () => [];
var singleton = (x) => [x];
var append5 = (xs, x) => [...xs, x];
var get1 = (idx, xs) => xs[idx - 1];
var length4 = (xs) => xs.length;
var bsl = (a, b) => a << b;
var bsr = (a, b) => a >> b;

// build/dev/javascript/iv/iv/internal/vector.mjs
function fold_loop(loop$xs, loop$state, loop$idx, loop$len, loop$fun) {
  while (true) {
    let xs = loop$xs;
    let state = loop$state;
    let idx = loop$idx;
    let len = loop$len;
    let fun = loop$fun;
    let $ = idx <= len;
    if ($) {
      loop$xs = xs;
      loop$state = fun(state, get1(idx, xs));
      loop$idx = idx + 1;
      loop$len = len;
      loop$fun = fun;
    } else {
      return state;
    }
  }
}
function fold_skip_first(xs, state, fun) {
  let len = length4(xs);
  return fold_loop(xs, state, 2, len, fun);
}

// build/dev/javascript/iv/iv/internal/node.mjs
var Balanced = class extends CustomType {
  constructor(size3, children) {
    super();
    this.size = size3;
    this.children = children;
  }
};
var Unbalanced = class extends CustomType {
  constructor(sizes, children) {
    super();
    this.sizes = sizes;
    this.children = children;
  }
};
var Leaf = class extends CustomType {
  constructor(children) {
    super();
    this.children = children;
  }
};
var branch_bits = 5;
var branch_factor = 32;
function size2(node) {
  if (node instanceof Balanced) {
    let size$1 = node.size;
    return size$1;
  } else if (node instanceof Unbalanced) {
    let sizes = node.sizes;
    return get1(length4(sizes), sizes);
  } else {
    let children = node.children;
    return length4(children);
  }
}
function compute_sizes(nodes) {
  let first_size = size2(get1(1, nodes));
  return fold_skip_first(
    nodes,
    singleton(first_size),
    (sizes, node) => {
      let size$1 = get1(length4(sizes), sizes) + size2(node);
      return append5(sizes, size$1);
    }
  );
}
function find_size(loop$sizes, loop$size_idx_plus_one, loop$index) {
  while (true) {
    let sizes = loop$sizes;
    let size_idx_plus_one = loop$size_idx_plus_one;
    let index5 = loop$index;
    let $ = get1(size_idx_plus_one, sizes) > index5;
    if ($) {
      return size_idx_plus_one - 1;
    } else {
      loop$sizes = sizes;
      loop$size_idx_plus_one = size_idx_plus_one + 1;
      loop$index = index5;
    }
  }
}
function balanced(shift, nodes) {
  let len = length4(nodes);
  let last_child = get1(len, nodes);
  let max_size = bsl(1, shift);
  let size$1 = max_size * (len - 1) + size2(last_child);
  return new Balanced(size$1, nodes);
}
function branch(shift, nodes) {
  let len = length4(nodes);
  let max_size = bsl(1, shift);
  let sizes = compute_sizes(nodes);
  let _block;
  if (len === 1) {
    _block = 0;
  } else {
    _block = get1(len - 1, sizes);
  }
  let prefix_size = _block;
  let is_balanced = prefix_size === max_size * (len - 1);
  if (is_balanced) {
    let size$1 = get1(len, sizes);
    return new Balanced(size$1, nodes);
  } else {
    return new Unbalanced(sizes, nodes);
  }
}
function get4(loop$node, loop$shift, loop$index) {
  while (true) {
    let node = loop$node;
    let shift = loop$shift;
    let index5 = loop$index;
    if (node instanceof Balanced) {
      let children = node.children;
      let node_index = bsr(index5, shift);
      let index$1 = index5 - bsl(node_index, shift);
      let child = get1(node_index + 1, children);
      loop$node = child;
      loop$shift = shift - branch_bits;
      loop$index = index$1;
    } else if (node instanceof Unbalanced) {
      let sizes = node.sizes;
      let children = node.children;
      let start_search_index = bsr(index5, shift);
      let node_index = find_size(sizes, start_search_index + 1, index5);
      let _block;
      if (node_index === 0) {
        _block = index5;
      } else {
        _block = index5 - get1(node_index, sizes);
      }
      let index$1 = _block;
      let child = get1(node_index + 1, children);
      loop$node = child;
      loop$shift = shift - branch_bits;
      loop$index = index$1;
    } else {
      let children = node.children;
      return get1(index5 + 1, children);
    }
  }
}

// build/dev/javascript/iv/iv/internal/builder.mjs
var Builder = class extends CustomType {
  constructor(nodes, items, push_node, push_item) {
    super();
    this.nodes = nodes;
    this.items = items;
    this.push_node = push_node;
    this.push_item = push_item;
  }
};
function append_node(nodes, node, shift) {
  if (nodes instanceof Empty) {
    return toList([singleton(node)]);
  } else {
    let nodes$1 = nodes.head;
    let rest = nodes.tail;
    let $ = length4(nodes$1) < branch_factor;
    if ($) {
      return prepend(append5(nodes$1, node), rest);
    } else {
      let shift$1 = shift + branch_bits;
      let new_node = balanced(shift$1, nodes$1);
      return prepend(
        singleton(node),
        append_node(rest, new_node, shift$1)
      );
    }
  }
}
function new$4() {
  return new Builder(toList([]), empty3(), append_node, append5);
}
function push2(builder, item) {
  let nodes;
  let items;
  let push_node;
  let push_item;
  nodes = builder.nodes;
  items = builder.items;
  push_node = builder.push_node;
  push_item = builder.push_item;
  let $ = length4(items) === branch_factor;
  if ($) {
    let leaf = new Leaf(items);
    return new Builder(
      push_node(nodes, leaf, 0),
      singleton(item),
      push_node,
      push_item
    );
  } else {
    return new Builder(nodes, push_item(items, item), push_node, push_item);
  }
}
function compress_nodes(loop$nodes, loop$push_node, loop$shift) {
  while (true) {
    let nodes = loop$nodes;
    let push_node = loop$push_node;
    let shift = loop$shift;
    if (nodes instanceof Empty) {
      return new Error2(void 0);
    } else {
      let $ = nodes.tail;
      if ($ instanceof Empty) {
        let root = nodes.head;
        return new Ok([shift, root]);
      } else {
        let nodes$1 = nodes.head;
        let rest = $;
        let shift$1 = shift + branch_bits;
        let compressed = push_node(
          rest,
          branch(shift$1, nodes$1),
          shift$1
        );
        loop$nodes = compressed;
        loop$push_node = push_node;
        loop$shift = shift$1;
      }
    }
  }
}
function build(builder) {
  let nodes;
  let items;
  let push_node;
  nodes = builder.nodes;
  items = builder.items;
  push_node = builder.push_node;
  let items_len = length4(items);
  let _block;
  let $ = items_len > 0;
  if ($) {
    _block = push_node(nodes, new Leaf(items), 0);
  } else {
    _block = nodes;
  }
  let nodes$1 = _block;
  return compress_nodes(nodes$1, push_node, 0);
}

// build/dev/javascript/iv/iv.mjs
var Empty2 = class extends CustomType {
};
var Array3 = class extends CustomType {
  constructor(shift, root) {
    super();
    this.shift = shift;
    this.root = root;
  }
};
function array3(shift, nodes) {
  let $ = length4(nodes);
  if ($ === 0) {
    return new Empty2();
  } else if ($ === 1) {
    return new Array3(shift, get1(1, nodes));
  } else {
    let shift$1 = shift + branch_bits;
    return new Array3(shift$1, branch(shift$1, nodes));
  }
}
function from_list3(list3) {
  let $ = (() => {
    let _pipe = list3;
    let _pipe$1 = fold2(_pipe, new$4(), push2);
    return build(_pipe$1);
  })();
  if ($ instanceof Ok) {
    let shift = $[0][0];
    let nodes = $[0][1];
    return array3(shift, nodes);
  } else {
    return new Empty2();
  }
}
function get5(array4, index5) {
  if (array4 instanceof Empty2) {
    return error_nil;
  } else {
    let shift = array4.shift;
    let root = array4.root;
    let $ = 0 <= index5 && index5 < size2(root);
    if ($) {
      return new Ok(get4(root, shift, index5));
    } else {
      return error_nil;
    }
  }
}

// build/dev/javascript/gleam_regexp/gleam_regexp_ffi.mjs
function check(regex, string4) {
  regex.lastIndex = 0;
  return regex.test(string4);
}
function compile(pattern, options) {
  try {
    let flags = "gu";
    if (options.case_insensitive) flags += "i";
    if (options.multi_line) flags += "m";
    return new Ok(new RegExp(pattern, flags));
  } catch (error2) {
    const number = (error2.columnNumber || 0) | 0;
    return new Error2(new CompileError(error2.message, number));
  }
}

// build/dev/javascript/gleam_regexp/gleam/regexp.mjs
var CompileError = class extends CustomType {
  constructor(error2, byte_index) {
    super();
    this.error = error2;
    this.byte_index = byte_index;
  }
};
var Options2 = class extends CustomType {
  constructor(case_insensitive, multi_line) {
    super();
    this.case_insensitive = case_insensitive;
    this.multi_line = multi_line;
  }
};
function compile2(pattern, options) {
  return compile(pattern, options);
}
function from_string(pattern) {
  return compile2(pattern, new Options2(false, false));
}
function check2(regexp, string4) {
  return check(regexp, string4);
}

// build/dev/javascript/nibble/nibble/lexer.mjs
var FILEPATH2 = "src/nibble/lexer.gleam";
var Matcher = class extends CustomType {
  constructor(run4) {
    super();
    this.run = run4;
  }
};
var Keep = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var Skip = class extends CustomType {
};
var Drop = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var NoMatch = class extends CustomType {
};
var Token = class extends CustomType {
  constructor(span, lexeme, value) {
    super();
    this.span = span;
    this.lexeme = lexeme;
    this.value = value;
  }
};
var Span = class extends CustomType {
  constructor(row_start, col_start, row_end, col_end) {
    super();
    this.row_start = row_start;
    this.col_start = col_start;
    this.row_end = row_end;
    this.col_end = col_end;
  }
};
var NoMatchFound = class extends CustomType {
  constructor(row, col, lexeme) {
    super();
    this.row = row;
    this.col = col;
    this.lexeme = lexeme;
  }
};
var Lexer = class extends CustomType {
  constructor(matchers) {
    super();
    this.matchers = matchers;
  }
};
var State = class extends CustomType {
  constructor(source, tokens, current, row, col) {
    super();
    this.source = source;
    this.tokens = tokens;
    this.current = current;
    this.row = row;
    this.col = col;
  }
};
function advanced(matchers) {
  return new Lexer((mode) => {
    return matchers(mode);
  });
}
function keep(f) {
  return new Matcher(
    (mode, lexeme, lookahead) => {
      let _pipe = f(lexeme, lookahead);
      let _pipe$1 = map5(
        _pipe,
        (_capture) => {
          return new Keep(_capture, mode);
        }
      );
      return unwrap2(_pipe$1, new NoMatch());
    }
  );
}
function custom(f) {
  return new Matcher(f);
}
function into(matcher, f) {
  return new Matcher(
    (mode, lexeme, lookahead) => {
      let $ = matcher.run(mode, lexeme, lookahead);
      if ($ instanceof Keep) {
        let value = $[0];
        let mode$1 = $[1];
        return new Keep(value, f(mode$1));
      } else if ($ instanceof Skip) {
        return $;
      } else if ($ instanceof Drop) {
        let mode$1 = $[0];
        return new Drop(f(mode$1));
      } else {
        return $;
      }
    }
  );
}
function ignore(matcher) {
  return new Matcher(
    (mode, lexeme, lookahead) => {
      let $ = matcher.run(mode, lexeme, lookahead);
      if ($ instanceof Keep) {
        let mode$1 = $[1];
        return new Drop(mode$1);
      } else if ($ instanceof Skip) {
        return $;
      } else if ($ instanceof Drop) {
        return $;
      } else {
        return $;
      }
    }
  );
}
function token2(str, value) {
  return new Matcher(
    (mode, lexeme, _) => {
      let $ = lexeme === str;
      if ($) {
        return new Keep(value, mode);
      } else {
        return new NoMatch();
      }
    }
  );
}
function keyword(str, breaker, value) {
  let $ = from_string(breaker);
  let break$;
  if ($ instanceof Ok) {
    break$ = $[0];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH2,
      "nibble/lexer",
      334,
      "keyword",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 11137,
        end: 11187,
        pattern_start: 11148,
        pattern_end: 11157
      }
    );
  }
  return new Matcher(
    (mode, lexeme, lookahead) => {
      let $1 = lexeme === str && (lookahead === "" || check2(
        break$,
        lookahead
      ));
      if ($1) {
        return new Keep(value, mode);
      } else {
        return new NoMatch();
      }
    }
  );
}
function identifier(start, inner, reserved, to_value) {
  let $ = from_string("^" + start + inner + "*$");
  let ident;
  if ($ instanceof Ok) {
    ident = $[0];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH2,
      "nibble/lexer",
      486,
      "identifier",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 14767,
        end: 14839,
        pattern_start: 14778,
        pattern_end: 14787
      }
    );
  }
  let $1 = from_string(inner);
  let inner$1;
  if ($1 instanceof Ok) {
    inner$1 = $1[0];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH2,
      "nibble/lexer",
      487,
      "identifier",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $1,
        start: 14842,
        end: 14890,
        pattern_start: 14853,
        pattern_end: 14862
      }
    );
  }
  return new Matcher(
    (mode, lexeme, lookahead) => {
      let $2 = check2(inner$1, lookahead);
      let $3 = check2(ident, lexeme);
      if ($2) {
        if ($3) {
          return new Skip();
        } else {
          return new NoMatch();
        }
      } else if ($3) {
        let $4 = contains(reserved, lexeme);
        if ($4) {
          return new NoMatch();
        } else {
          return new Keep(to_value(lexeme), mode);
        }
      } else {
        return new NoMatch();
      }
    }
  );
}
function variable(reserved, to_value) {
  return identifier("[a-z]", "[a-zA-Z0-9_]", reserved, to_value);
}
function whitespace(token4) {
  let $ = from_string("^\\s+$");
  let whitespace$1;
  if ($ instanceof Ok) {
    whitespace$1 = $[0];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH2,
      "nibble/lexer",
      557,
      "whitespace",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 16378,
        end: 16434,
        pattern_start: 16389,
        pattern_end: 16403
      }
    );
  }
  return new Matcher(
    (mode, lexeme, _) => {
      let $1 = check2(whitespace$1, lexeme);
      if ($1) {
        return new Keep(token4, mode);
      } else {
        return new NoMatch();
      }
    }
  );
}
function do_match(mode, str, lookahead, matchers) {
  return fold_until(
    matchers,
    new NoMatch(),
    (_, matcher) => {
      let $ = matcher.run(mode, str, lookahead);
      if ($ instanceof Keep) {
        let match = $;
        return new Stop(match);
      } else if ($ instanceof Skip) {
        return new Stop(new Skip());
      } else if ($ instanceof Drop) {
        let match = $;
        return new Stop(match);
      } else {
        return new Continue(new NoMatch());
      }
    }
  );
}
function next_col(col, str) {
  if (str === "\n") {
    return 1;
  } else {
    return col + 1;
  }
}
function next_row(row, str) {
  if (str === "\n") {
    return row + 1;
  } else {
    return row;
  }
}
function do_run(loop$lexer, loop$mode, loop$state) {
  while (true) {
    let lexer = loop$lexer;
    let mode = loop$mode;
    let state = loop$state;
    let matchers = lexer.matchers(mode);
    let $ = state.source;
    let $1 = state.current;
    if ($ instanceof Empty) {
      let $2 = $1[2];
      if ($2 === "") {
        return new Ok(reverse(state.tokens));
      } else {
        let start_row = $1[0];
        let start_col = $1[1];
        let lexeme = $2;
        let $3 = do_match(mode, lexeme, "", matchers);
        if ($3 instanceof Keep) {
          let value = $3[0];
          let span = new Span(start_row, start_col, state.row, state.col);
          let token$1 = new Token(span, lexeme, value);
          return new Ok(reverse(prepend(token$1, state.tokens)));
        } else if ($3 instanceof Skip) {
          return new Error2(new NoMatchFound(start_row, start_col, lexeme));
        } else if ($3 instanceof Drop) {
          return new Ok(reverse(state.tokens));
        } else {
          return new Error2(new NoMatchFound(start_row, start_col, lexeme));
        }
      }
    } else {
      let lookahead = $.head;
      let rest = $.tail;
      let start_row = $1[0];
      let start_col = $1[1];
      let lexeme = $1[2];
      let row = next_row(state.row, lookahead);
      let col = next_col(state.col, lookahead);
      let $2 = do_match(mode, lexeme, lookahead, matchers);
      if ($2 instanceof Keep) {
        let value = $2[0];
        let mode$1 = $2[1];
        let span = new Span(start_row, start_col, state.row, state.col);
        let token$1 = new Token(span, lexeme, value);
        loop$lexer = lexer;
        loop$mode = mode$1;
        loop$state = new State(
          rest,
          prepend(token$1, state.tokens),
          [state.row, state.col, lookahead],
          row,
          col
        );
      } else if ($2 instanceof Skip) {
        loop$lexer = lexer;
        loop$mode = mode;
        loop$state = new State(
          rest,
          state.tokens,
          [start_row, start_col, lexeme + lookahead],
          row,
          col
        );
      } else if ($2 instanceof Drop) {
        let mode$1 = $2[0];
        loop$lexer = lexer;
        loop$mode = mode$1;
        loop$state = new State(
          rest,
          state.tokens,
          [state.row, state.col, lookahead],
          row,
          col
        );
      } else {
        loop$lexer = lexer;
        loop$mode = mode;
        loop$state = new State(
          rest,
          state.tokens,
          [start_row, start_col, lexeme + lookahead],
          row,
          col
        );
      }
    }
  }
}
function run_advanced(source, mode, lexer) {
  return do_run(
    lexer,
    mode,
    new State(graphemes(source), toList([]), [1, 1, ""], 1, 1)
  );
}

// build/dev/javascript/nibble/nibble.mjs
var Parser = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Cont = class extends CustomType {
  constructor($0, $1, $2) {
    super();
    this[0] = $0;
    this[1] = $1;
    this[2] = $2;
  }
};
var Fail = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var State2 = class extends CustomType {
  constructor(src, idx, pos, ctx) {
    super();
    this.src = src;
    this.idx = idx;
    this.pos = pos;
    this.ctx = ctx;
  }
};
var CanBacktrack = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Continue2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Break = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Custom = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var EndOfInput = class extends CustomType {
};
var Expected = class extends CustomType {
  constructor($0, got) {
    super();
    this[0] = $0;
    this.got = got;
  }
};
var Unexpected2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DeadEnd = class extends CustomType {
  constructor(pos, problem, context) {
    super();
    this.pos = pos;
    this.problem = problem;
    this.context = context;
  }
};
var Empty3 = class extends CustomType {
};
var Cons = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var Append = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
function runwrap(state, parser) {
  let parse6;
  parse6 = parser[0];
  return parse6(state);
}
function next(state) {
  let $ = get5(state.src, state.idx);
  if ($ instanceof Ok) {
    let span$1 = $[0].span;
    let tok = $[0].value;
    return [
      new Some(tok),
      new State2(state.src, state.idx + 1, span$1, state.ctx)
    ];
  } else {
    return [new None(), state];
  }
}
function return$(value) {
  return new Parser(
    (state) => {
      return new Cont(new CanBacktrack(false), value, state);
    }
  );
}
function succeed(value) {
  return return$(value);
}
function lazy(parser) {
  return new Parser((state) => {
    return runwrap(state, parser());
  });
}
function should_commit(a, b) {
  let a$1;
  a$1 = a[0];
  let b$1;
  b$1 = b[0];
  return new CanBacktrack(a$1 || b$1);
}
function do$2(parser, f) {
  return new Parser(
    (state) => {
      let $ = runwrap(state, parser);
      if ($ instanceof Cont) {
        let to_a = $[0];
        let a = $[1];
        let state$1 = $[2];
        let $1 = runwrap(state$1, f(a));
        if ($1 instanceof Cont) {
          let to_b = $1[0];
          let b = $1[1];
          let state$2 = $1[2];
          return new Cont(should_commit(to_a, to_b), b, state$2);
        } else {
          let to_b = $1[0];
          let bag = $1[1];
          return new Fail(should_commit(to_a, to_b), bag);
        }
      } else {
        return $;
      }
    }
  );
}
function then$2(parser, f) {
  return do$2(parser, f);
}
function map9(parser, f) {
  return do$2(parser, (a) => {
    return return$(f(a));
  });
}
function replace4(parser, b) {
  return map9(parser, (_) => {
    return b;
  });
}
function loop_help(loop$f, loop$commit, loop$loop_state, loop$state) {
  while (true) {
    let f = loop$f;
    let commit2 = loop$commit;
    let loop_state = loop$loop_state;
    let state = loop$state;
    let $ = runwrap(state, f(loop_state));
    if ($ instanceof Cont) {
      let $1 = $[1];
      if ($1 instanceof Continue2) {
        let can_backtrack = $[0];
        let next_state = $[2];
        let next_loop_state = $1[0];
        loop$f = f;
        loop$commit = should_commit(commit2, can_backtrack);
        loop$loop_state = next_loop_state;
        loop$state = next_state;
      } else {
        let can_backtrack = $[0];
        let next_state = $[2];
        let result = $1[0];
        return new Cont(
          should_commit(commit2, can_backtrack),
          result,
          next_state
        );
      }
    } else {
      let can_backtrack = $[0];
      let bag = $[1];
      return new Fail(should_commit(commit2, can_backtrack), bag);
    }
  }
}
function loop(init, step) {
  return new Parser(
    (state) => {
      return loop_help(step, new CanBacktrack(false), init, state);
    }
  );
}
function take_while(predicate) {
  return new Parser(
    (state) => {
      let $ = next(state);
      let tok;
      let next_state;
      tok = $[0];
      next_state = $[1];
      let $1 = map2(tok, predicate);
      if (tok instanceof Some && $1 instanceof Some) {
        let $2 = $1[0];
        if ($2) {
          let tok$1 = tok[0];
          return runwrap(
            next_state,
            do$2(
              take_while(predicate),
              (toks) => {
                return return$(prepend(tok$1, toks));
              }
            )
          );
        } else {
          return new Cont(new CanBacktrack(false), toList([]), state);
        }
      } else {
        return new Cont(new CanBacktrack(false), toList([]), state);
      }
    }
  );
}
function bag_from_state(state, problem) {
  return new Cons(new Empty3(), new DeadEnd(state.pos, problem, state.ctx));
}
function throw$(message) {
  return new Parser(
    (state) => {
      let error2 = new Custom(message);
      let bag = bag_from_state(state, error2);
      return new Fail(new CanBacktrack(false), bag);
    }
  );
}
function fail(message) {
  return throw$(message);
}
function token3(tok) {
  return new Parser(
    (state) => {
      let $ = next(state);
      let $1 = $[0];
      if ($1 instanceof Some) {
        let t = $1[0];
        if (isEqual(tok, t)) {
          let state$1 = $[1];
          return new Cont(new CanBacktrack(true), void 0, state$1);
        } else {
          let state$1 = $[1];
          let t2 = $1[0];
          return new Fail(
            new CanBacktrack(false),
            bag_from_state(state$1, new Expected(inspect2(tok), t2))
          );
        }
      } else {
        let state$1 = $[1];
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(state$1, new EndOfInput())
        );
      }
    }
  );
}
function eof() {
  return new Parser(
    (state) => {
      let $ = next(state);
      let $1 = $[0];
      if ($1 instanceof Some) {
        let state$1 = $[1];
        let tok = $1[0];
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(state$1, new Unexpected2(tok))
        );
      } else {
        return new Cont(new CanBacktrack(false), void 0, state);
      }
    }
  );
}
function take_if(expecting, predicate) {
  return new Parser(
    (state) => {
      let $ = next(state);
      let tok;
      let next_state;
      tok = $[0];
      next_state = $[1];
      let $1 = map2(tok, predicate);
      if (tok instanceof Some && $1 instanceof Some) {
        let $2 = $1[0];
        if ($2) {
          let tok$1 = tok[0];
          return new Cont(new CanBacktrack(false), tok$1, next_state);
        } else {
          let tok$1 = tok[0];
          return new Fail(
            new CanBacktrack(false),
            bag_from_state(next_state, new Expected(expecting, tok$1))
          );
        }
      } else {
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(next_state, new EndOfInput())
        );
      }
    }
  );
}
function any() {
  return take_if("a single token", (_) => {
    return true;
  });
}
function take_while1(expecting, predicate) {
  return do$2(
    take_if(expecting, predicate),
    (x) => {
      return do$2(
        take_while(predicate),
        (xs) => {
          return return$(prepend(x, xs));
        }
      );
    }
  );
}
function take_map(expecting, f) {
  return new Parser(
    (state) => {
      let $ = next(state);
      let tok;
      let next_state;
      tok = $[0];
      next_state = $[1];
      let $1 = then$(tok, f);
      if (tok instanceof Some) {
        if ($1 instanceof Some) {
          let a = $1[0];
          return new Cont(new CanBacktrack(false), a, next_state);
        } else {
          let tok$1 = tok[0];
          return new Fail(
            new CanBacktrack(false),
            bag_from_state(next_state, new Expected(expecting, tok$1))
          );
        }
      } else {
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(next_state, new EndOfInput())
        );
      }
    }
  );
}
function to_deadends(loop$bag, loop$acc) {
  while (true) {
    let bag = loop$bag;
    let acc = loop$acc;
    if (bag instanceof Empty3) {
      return acc;
    } else if (bag instanceof Cons) {
      let $ = bag[0];
      if ($ instanceof Empty3) {
        let deadend = bag[1];
        return prepend(deadend, acc);
      } else {
        let bag$1 = $;
        let deadend = bag[1];
        loop$bag = bag$1;
        loop$acc = prepend(deadend, acc);
      }
    } else {
      let left = bag[0];
      let right = bag[1];
      loop$bag = left;
      loop$acc = to_deadends(right, acc);
    }
  }
}
function run2(src, parser) {
  let init = new State2(from_list3(src), 0, new Span(1, 1, 1, 1), toList([]));
  let $ = runwrap(init, parser);
  if ($ instanceof Cont) {
    let a = $[1];
    return new Ok(a);
  } else {
    let bag = $[1];
    return new Error2(to_deadends(bag, toList([])));
  }
}
function add_bag_to_step(step, left) {
  if (step instanceof Cont) {
    return step;
  } else {
    let can_backtrack = step[0];
    let right = step[1];
    return new Fail(can_backtrack, new Append(left, right));
  }
}
function one_of2(parsers) {
  return new Parser(
    (state) => {
      let init = new Fail(new CanBacktrack(false), new Empty3());
      return fold_until(
        parsers,
        init,
        (result, next2) => {
          if (result instanceof Cont) {
            return new Stop(result);
          } else {
            let $ = result[0][0];
            if ($) {
              return new Stop(result);
            } else {
              let bag = result[1];
              let _pipe = runwrap(state, next2);
              let _pipe$1 = add_bag_to_step(_pipe, bag);
              return new Continue(_pipe$1);
            }
          }
        }
      );
    }
  );
}
function more(x, parser, separator) {
  return loop(
    toList([x]),
    (xs) => {
      let break$ = () => {
        return return$(new Break(reverse(xs)));
      };
      let continue$ = do$2(
        separator,
        (_) => {
          return do$2(
            parser,
            (x2) => {
              return return$(new Continue2(prepend(x2, xs)));
            }
          );
        }
      );
      return one_of2(toList([continue$, lazy(break$)]));
    }
  );
}
function sequence(parser, sep) {
  return one_of2(
    toList([
      (() => {
        let _pipe = parser;
        return then$2(
          _pipe,
          (_capture) => {
            return more(_capture, parser, sep);
          }
        );
      })(),
      return$(toList([]))
    ])
  );
}
function optional2(parser) {
  return one_of2(
    toList([
      map9(parser, (var0) => {
        return new Some(var0);
      }),
      return$(new None())
    ])
  );
}

// build/dev/javascript/glemplate/glemplate/parser.mjs
var LexerError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ParserError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Parser2 = class extends CustomType {
  constructor(lexer, parser) {
    super();
    this.lexer = lexer;
    this.parser = parser;
  }
};
var Text2 = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var TagStart = class extends CustomType {
};
var OutputTagStart = class extends CustomType {
};
var RightAngle = class extends CustomType {
};
var Percent = class extends CustomType {
};
var End = class extends CustomType {
};
var If2 = class extends CustomType {
};
var Else = class extends CustomType {
};
var For = class extends CustomType {
};
var In = class extends CustomType {
};
var Raw = class extends CustomType {
};
var Render3 = class extends CustomType {
};
var Colon = class extends CustomType {
};
var Comma = class extends CustomType {
};
var Period = class extends CustomType {
};
var Variable = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var Tag = class extends CustomType {
};
var CommentTag = class extends CustomType {
};
var Content = class extends CustomType {
};
var IfTag = class extends CustomType {
  constructor(var$, if_true) {
    super();
    this.var = var$;
    this.if_true = if_true;
  }
};
var IterTag = class extends CustomType {
  constructor(over, binding) {
    super();
    this.over = over;
    this.binding = binding;
  }
};
var State3 = class extends CustomType {
  constructor(emitted, current_text, current_nodes, current_tag, outer_state) {
    super();
    this.emitted = emitted;
    this.current_text = current_text;
    this.current_nodes = current_nodes;
    this.current_tag = current_tag;
    this.outer_state = outer_state;
  }
};
function lex(input, lexer) {
  let _pipe = run_advanced(input, new Content(), lexer);
  return map_error(
    _pipe,
    (error2) => {
      return new LexerError(
        "No match found in (" + to_string(error2.row) + ":" + to_string(
          error2.col
        ) + "), last lexeme: " + error2.lexeme
      );
    }
  );
}
function gen_lexer() {
  let right_angle = token2(">", new RightAngle());
  let percent = token2("%", new Percent());
  let end = keyword("end", "\\W", new End());
  let if_ = keyword("if", "\\W", new If2());
  let else_ = keyword("else", "\\W", new Else());
  let for$ = keyword("for", "\\W", new For());
  let in$ = keyword("in", "\\W", new In());
  let raw = keyword("raw", "\\W", new Raw());
  let render4 = keyword("render", "\\W", new Render3());
  let colon = token2(":", new Colon());
  let comma = token2(",", new Comma());
  let period = token2(".", new Period());
  let variable$1 = variable(
    from_list2(toList(["end", "if", "else", "for", "in", "raw", "render"])),
    (var0) => {
      return new Variable(var0);
    }
  );
  let whitespace2 = whitespace(void 0);
  let text = keep(
    (lexeme, lookahead) => {
      if (lookahead === "<") {
        return new Ok(new Text2(lexeme));
      } else if (lookahead === "") {
        return new Ok(new Text2(lexeme));
      } else {
        return new Error2(void 0);
      }
    }
  );
  let tag_start = custom(
    (mode, lexeme, lookahead) => {
      if (lexeme === "" && lookahead === "<") {
        return new NoMatch();
      } else if (lexeme === "<" && lookahead === "%") {
        return new NoMatch();
      } else if (lexeme === "<%") {
        if (lookahead === "!") {
          return new Skip();
        } else if (lookahead === "%") {
          return new Skip();
        } else if (lookahead === "=") {
          return new Skip();
        } else {
          return new Keep(new TagStart(), new Tag());
        }
      } else if (lexeme === "<%%") {
        return new Keep(new Text2("<%%"), mode);
      } else if (lexeme === "<%=") {
        return new Keep(new OutputTagStart(), new Tag());
      } else if (lexeme === "<%!" && lookahead === "-") {
        return new Skip();
      } else if (lexeme === "<%!-" && lookahead === "-") {
        return new Skip();
      } else if (lexeme === "<%!--") {
        return new Drop(new CommentTag());
      } else {
        return new NoMatch();
      }
    }
  );
  let comment_content = custom(
    (mode, lexeme, lookahead) => {
      if (lexeme === "" && lookahead === "-") {
        return new Skip();
      } else if (lexeme === "-" && lookahead === "-") {
        return new Skip();
      } else if (lexeme === "--" && lookahead === "%") {
        return new Skip();
      } else if (lexeme === "--%" && lookahead === ">") {
        return new Skip();
      } else if (lexeme === "--%>") {
        return new Drop(new Content());
      } else {
        return new Drop(mode);
      }
    }
  );
  let in_tag = toList([
    percent,
    end,
    if_,
    else_,
    for$,
    in$,
    raw,
    render4,
    colon,
    comma,
    period,
    variable$1
  ]);
  return advanced(
    (mode) => {
      if (mode instanceof Tag) {
        return prepend(
          (() => {
            let _pipe = right_angle;
            return into(_pipe, (_) => {
              return new Content();
            });
          })(),
          prepend(
            (() => {
              let _pipe = whitespace2;
              return ignore(_pipe);
            })(),
            in_tag
          )
        );
      } else if (mode instanceof CommentTag) {
        return toList([comment_content]);
      } else {
        return toList([tag_start, text]);
      }
    }
  );
}
function do_parse2(tokens, parser) {
  let _pipe = run2(tokens, parser);
  let _pipe$1 = map5(_pipe, (state) => {
    return state.emitted;
  });
  return map_error(
    _pipe$1,
    (deadends) => {
      return new ParserError(
        map3(
          deadends,
          (deadend) => {
            return "Dead end between (" + to_string(
              deadend.pos.row_start
            ) + ":" + to_string(deadend.pos.col_start) + ") and (" + to_string(
              deadend.pos.row_end
            ) + ":" + to_string(deadend.pos.col_end) + "): " + inspect2(
              deadend.problem
            );
          }
        )
      );
    }
  );
}
function parse5(input, parser) {
  return try$(
    lex(input, parser.lexer),
    (lexed) => {
      return do_parse2(lexed, parser.parser);
    }
  );
}
function parse_to_template(input, name, parser) {
  return try$(
    parse5(input, parser),
    (parsed) => {
      return new Ok(new Template(name, parsed));
    }
  );
}
function empty_state() {
  return new State3(
    toList([]),
    new$(),
    toList([]),
    new None(),
    new None()
  );
}
function end_tag(state) {
  return do$2(
    token3(new End()),
    (_) => {
      let outer_state = lazy_unwrap(
        state.outer_state,
        () => {
          return empty_state();
        }
      );
      let $ = state.current_tag;
      if ($ instanceof Some) {
        let $1 = $[0];
        if ($1 instanceof IfTag) {
          let var$ = $1.var;
          let if_true = $1.if_true;
          let _block;
          if (if_true instanceof Some) {
            let if_true_nodes = if_true[0];
            _block = [if_true_nodes, state];
          } else {
            _block = [
              reverse(state.current_nodes),
              new State3(
                state.emitted,
                state.current_text,
                toList([]),
                state.current_tag,
                state.outer_state
              )
            ];
          }
          let $2 = _block;
          let if_true$1;
          let state$1;
          if_true$1 = $2[0];
          state$1 = $2[1];
          let if_false = reverse(state$1.current_nodes);
          return succeed(
            new State3(
              outer_state.emitted,
              outer_state.current_text,
              prepend(
                new Dynamic(new If(var$, if_true$1, if_false)),
                outer_state.current_nodes
              ),
              outer_state.current_tag,
              outer_state.outer_state
            )
          );
        } else {
          let over = $1.over;
          let binding = $1.binding;
          return succeed(
            new State3(
              outer_state.emitted,
              outer_state.current_text,
              prepend(
                new Dynamic(
                  new Iter(
                    over,
                    binding,
                    reverse(state.current_nodes)
                  )
                ),
                outer_state.current_nodes
              ),
              outer_state.current_tag,
              outer_state.outer_state
            )
          );
        }
      } else {
        return fail("Expected `if` or `for` tag for `end` tag");
      }
    }
  );
}
function else_tag(state) {
  return do$2(
    token3(new Else()),
    (_) => {
      let $ = state.current_tag;
      if ($ instanceof Some) {
        let $1 = $[0];
        if ($1 instanceof IfTag) {
          let $2 = $1.if_true;
          if ($2 instanceof None) {
            let var$ = $1.var;
            return succeed(
              new State3(
                state.emitted,
                state.current_text,
                toList([]),
                new Some(
                  new IfTag(var$, new Some(reverse(state.current_nodes)))
                ),
                state.outer_state
              )
            );
          } else {
            return fail("Expected `if` to match `else` tag");
          }
        } else {
          return fail("Expected `if` to match `else` tag");
        }
      } else {
        return fail("Expected `if` to match `else` tag");
      }
    }
  );
}
function stringify_current_text(state) {
  return new State3(
    state.emitted,
    new$(),
    prepend(
      new Text(identity(state.current_text)),
      state.current_nodes
    ),
    state.current_tag,
    state.outer_state
  );
}
function variable_name() {
  return take_map(
    "Variable name",
    (token4) => {
      if (token4 instanceof Variable) {
        let var$ = token4.name;
        return new Some(var$);
      } else {
        return new None();
      }
    }
  );
}
function accessors() {
  return do$2(
    sequence(variable_name(), token3(new Period())),
    (accessors2) => {
      return return$(accessors2);
    }
  );
}
function variable2() {
  return do$2(
    variable_name(),
    (name) => {
      return do$2(
        one_of2(
          toList([
            do$2(
              token3(new Period()),
              (_) => {
                return do$2(
                  accessors(),
                  (accs) => {
                    return return$(accs);
                  }
                );
              }
            ),
            return$(toList([]))
          ])
        ),
        (accessors2) => {
          return return$(
            fold2(
              accessors2,
              new Assign(name),
              (acc, accessor) => {
                return new FieldAccess(acc, accessor);
              }
            )
          );
        }
      );
    }
  );
}
function output_tag(state) {
  return do$2(
    one_of2(
      toList([
        do$2(
          token3(new Raw()),
          (_) => {
            return do$2(
              variable2(),
              (var$) => {
                return succeed(
                  new State3(
                    state.emitted,
                    state.current_text,
                    prepend(
                      new Dynamic(new RawOutput(var$)),
                      state.current_nodes
                    ),
                    state.current_tag,
                    state.outer_state
                  )
                );
              }
            );
          }
        ),
        do$2(
          variable2(),
          (var$) => {
            return succeed(
              new State3(
                state.emitted,
                state.current_text,
                prepend(
                  new Dynamic(new Output(var$)),
                  state.current_nodes
                ),
                state.current_tag,
                state.outer_state
              )
            );
          }
        )
      ])
    ),
    (out) => {
      return do$2(
        token3(new Percent()),
        (_) => {
          return do$2(
            token3(new RightAngle()),
            (_2) => {
              return return$(out);
            }
          );
        }
      );
    }
  );
}
function if_tag(state) {
  return do$2(
    token3(new If2()),
    (_) => {
      return do$2(
        variable2(),
        (var$) => {
          return return$(
            (() => {
              let _record = empty_state();
              return new State3(
                _record.emitted,
                _record.current_text,
                _record.current_nodes,
                new Some(new IfTag(var$, new None())),
                new Some(state)
              );
            })()
          );
        }
      );
    }
  );
}
function for_tag(state) {
  return do$2(
    token3(new For()),
    (_) => {
      return do$2(
        variable_name(),
        (binding) => {
          return do$2(
            token3(new In()),
            (_2) => {
              return do$2(
                variable2(),
                (over) => {
                  return return$(
                    (() => {
                      let _record = empty_state();
                      return new State3(
                        _record.emitted,
                        _record.current_text,
                        _record.current_nodes,
                        new Some(new IterTag(over, binding)),
                        new Some(state)
                      );
                    })()
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function render_binding() {
  return do$2(
    variable_name(),
    (to2) => {
      return do$2(
        token3(new Colon()),
        (_) => {
          return do$2(
            variable2(),
            (from2) => {
              return return$([from2, to2]);
            }
          );
        }
      );
    }
  );
}
function stringify_token(token4) {
  if (token4 instanceof Text2) {
    let text = token4.content;
    return text;
  } else if (token4 instanceof TagStart) {
    return "<%";
  } else if (token4 instanceof OutputTagStart) {
    return "<%=";
  } else if (token4 instanceof RightAngle) {
    return ">";
  } else if (token4 instanceof Percent) {
    return "%";
  } else if (token4 instanceof End) {
    return "end";
  } else if (token4 instanceof If2) {
    return "if";
  } else if (token4 instanceof Else) {
    return "else";
  } else if (token4 instanceof For) {
    return "for";
  } else if (token4 instanceof In) {
    return "in";
  } else if (token4 instanceof Raw) {
    return "raw";
  } else if (token4 instanceof Render3) {
    return "render";
  } else if (token4 instanceof Colon) {
    return ":";
  } else if (token4 instanceof Comma) {
    return ",";
  } else if (token4 instanceof Period) {
    return ".";
  } else {
    let var_name = token4.name;
    return var_name;
  }
}
function filename() {
  return do$2(
    take_while1(
      "a filename without spaces",
      (token4) => {
        if (token4 instanceof Percent) {
          return false;
        } else if (token4 instanceof Comma) {
          return false;
        } else {
          return true;
        }
      }
    ),
    (file_name_tokens) => {
      let _pipe = fold2(
        file_name_tokens,
        new$(),
        (acc, token4) => {
          return append(acc, stringify_token(token4));
        }
      );
      let _pipe$1 = identity(_pipe);
      return return$(_pipe$1);
    }
  );
}
function render_tag(state) {
  return do$2(
    token3(new Render3()),
    (_) => {
      return do$2(
        filename(),
        (filename2) => {
          return do$2(
            optional2(token3(new Comma())),
            (maybe_comma) => {
              return do$2(
                (() => {
                  if (maybe_comma instanceof Some) {
                    return sequence(
                      render_binding(),
                      token3(new Comma())
                    );
                  } else {
                    return return$(toList([]));
                  }
                })(),
                (bindings) => {
                  return return$(
                    new State3(
                      state.emitted,
                      state.current_text,
                      prepend(
                        new Dynamic(new Render2(filename2, bindings)),
                        state.current_nodes
                      ),
                      state.current_tag,
                      state.outer_state
                    )
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function other_tag(state) {
  return do$2(
    one_of2(
      toList([
        if_tag(state),
        for_tag(state),
        render_tag(state),
        else_tag(state),
        end_tag(state)
      ])
    ),
    (tag) => {
      return do$2(
        token3(new Percent()),
        (_) => {
          return do$2(
            token3(new RightAngle()),
            (_2) => {
              return return$(tag);
            }
          );
        }
      );
    }
  );
}
function tag_parser(state) {
  let with_updated_text = stringify_current_text(state);
  return one_of2(
    toList([
      do$2(
        token3(new TagStart()),
        (_) => {
          return other_tag(with_updated_text);
        }
      ),
      do$2(
        token3(new OutputTagStart()),
        (_) => {
          return output_tag(with_updated_text);
        }
      )
    ])
  );
}
function base_parser(old_state) {
  let _pipe = loop(
    old_state,
    (state) => {
      return one_of2(
        toList([
          (() => {
            let _pipe2 = tag_parser(state);
            return map9(
              _pipe2,
              (var0) => {
                return new Continue2(var0);
              }
            );
          })(),
          (() => {
            let _pipe2 = any();
            let _pipe$1 = map9(
              _pipe2,
              (token4) => {
                return new State3(
                  state.emitted,
                  append(
                    state.current_text,
                    stringify_token(token4)
                  ),
                  state.current_nodes,
                  state.current_tag,
                  state.outer_state
                );
              }
            );
            return map9(
              _pipe$1,
              (var0) => {
                return new Continue2(var0);
              }
            );
          })(),
          (() => {
            let _pipe2 = eof();
            let _pipe$1 = replace4(_pipe2, stringify_current_text(state));
            return map9(
              _pipe$1,
              (var0) => {
                return new Break(var0);
              }
            );
          })()
        ])
      );
    }
  );
  return map9(
    _pipe,
    (state) => {
      return new State3(
        prepend(
          new Nodes(state.emitted),
          reverse(state.current_nodes)
        ),
        new$(),
        toList([]),
        state.current_tag,
        state.outer_state
      );
    }
  );
}
function new$6() {
  return new Parser2(gen_lexer(), base_parser(empty_state()));
}

// build/dev/javascript/glemplate/glemplate/renderer.mjs
var AssignNotFound = class extends CustomType {
  constructor(assign, assigns) {
    super();
    this.assign = assign;
    this.assigns = assigns;
  }
};
var AssignNotIterable = class extends CustomType {
  constructor(assign, assigns) {
    super();
    this.assign = assign;
    this.assigns = assigns;
  }
};
var AssignNotStringifiable = class extends CustomType {
  constructor(assign, assigns) {
    super();
    this.assign = assign;
    this.assigns = assigns;
  }
};
var AssignFieldNotFound = class extends CustomType {
  constructor(assign, field2, assigns) {
    super();
    this.assign = assign;
    this.field = field2;
    this.assigns = assigns;
  }
};
var AssignNotFieldAccessible = class extends CustomType {
  constructor(assign, assigns) {
    super();
    this.assign = assign;
    this.assigns = assigns;
  }
};
var ChildTemplateNotFound = class extends CustomType {
  constructor(tpl_name) {
    super();
    this.tpl_name = tpl_name;
  }
};
var StringifyError = class extends CustomType {
};
var RenderOptions = class extends CustomType {
  constructor(encoder, template_cache) {
    super();
    this.encoder = encoder;
    this.template_cache = template_cache;
  }
};
function access_field(container, field2, accessor, assigns) {
  if (container instanceof Dict2) {
    let d = container[0];
    let $ = get(d, field2);
    if ($ instanceof Ok) {
      return $;
    } else {
      return new Error2(new AssignFieldNotFound(accessor, field2, assigns));
    }
  } else {
    return new Error2(new AssignNotFieldAccessible(accessor, assigns));
  }
}
function stringify(data2) {
  if (data2 instanceof String3) {
    let s = data2[0];
    return new Ok(s);
  } else if (data2 instanceof Int2) {
    let i = data2[0];
    return new Ok(to_string(i));
  } else {
    return new Error2(new StringifyError());
  }
}
function render_output(data2, raw, var$, assigns, acc, options) {
  let str_result = stringify(data2);
  if (str_result instanceof Ok) {
    let str = str_result[0];
    let _block;
    if (raw) {
      _block = append(acc, str);
    } else {
      _block = add(acc, options.encoder(str));
    }
    let out = _block;
    return new Ok(out);
  } else {
    return new Error2(new AssignNotStringifiable(var$, assigns));
  }
}
function resolve_lazy(loop$data) {
  while (true) {
    let data2 = loop$data;
    if (data2 instanceof Lazy) {
      let lazy_fn = data2[0];
      loop$data = lazy_fn();
    } else {
      return data2;
    }
  }
}
function get_assign(assigns, var$) {
  return try$(
    (() => {
      if (var$ instanceof Assign) {
        let name = var$.name;
        let get_result = get(assigns, name);
        if (get_result instanceof Ok) {
          return get_result;
        } else {
          return new Error2(new AssignNotFound(var$, assigns));
        }
      } else {
        let container = var$.container;
        let field2 = var$.field;
        return try$(
          get_assign(assigns, container),
          (data2) => {
            return access_field(data2, field2, var$, assigns);
          }
        );
      }
    })(),
    (data2) => {
      return new Ok(resolve_lazy(data2));
    }
  );
}
function render_node(node, assigns, acc, options) {
  if (node instanceof Text) {
    let str = node[0];
    return new Ok(append(acc, str));
  } else if (node instanceof Dynamic) {
    let dynamic2 = node[0];
    return render_dynamic(dynamic2, assigns, acc, options);
  } else {
    let nodes = node.nodes;
    return render_nodes(nodes, assigns, acc, options);
  }
}
function render_dynamic(node, assigns, acc, options) {
  if (node instanceof Output) {
    let var$ = node[0];
    let _pipe = get_assign(assigns, var$);
    return try$(
      _pipe,
      (data2) => {
        return render_output(data2, false, var$, assigns, acc, options);
      }
    );
  } else if (node instanceof RawOutput) {
    let var$ = node[0];
    let _pipe = get_assign(assigns, var$);
    return try$(
      _pipe,
      (data2) => {
        return render_output(data2, true, var$, assigns, acc, options);
      }
    );
  } else if (node instanceof If) {
    let var$ = node[0];
    let if_true = node.if_true;
    let if_false = node.if_false;
    let _pipe = get_assign(assigns, var$);
    return try$(
      _pipe,
      (data2) => {
        return render_if(data2, if_true, if_false, assigns, acc, options);
      }
    );
  } else if (node instanceof Iter) {
    let over = node.over;
    let binding = node.binding;
    let nodes = node.nodes;
    let _pipe = get_assign(assigns, over);
    return try$(
      _pipe,
      (data2) => {
        return render_iter(data2, over, binding, nodes, assigns, acc, options);
      }
    );
  } else {
    let tpl = node.tpl;
    let assigns_map = node.assigns_map;
    return render_child(tpl, assigns, assigns_map, acc, options);
  }
}
function render_child(template_name, assigns, assigns_map, acc, options) {
  return try$(
    (() => {
      let _pipe = get(options.template_cache, template_name);
      return replace_error(
        _pipe,
        new ChildTemplateNotFound(template_name)
      );
    })(),
    (template) => {
      return try$(
        try_fold(
          assigns_map,
          make(),
          (acc2, mapping) => {
            let from2;
            let to2;
            from2 = mapping[0];
            to2 = mapping[1];
            return try$(
              get_assign(assigns, from2),
              (assign) => {
                return new Ok(insert(acc2, to2, assign));
              }
            );
          }
        ),
        (new_assigns) => {
          return render_nodes(template.nodes, new_assigns, acc, options);
        }
      );
    }
  );
}
function render_nodes(nodes, assigns, acc, options) {
  return try_fold(
    nodes,
    acc,
    (acc2, node) => {
      return render_node(node, assigns, acc2, options);
    }
  );
}
function render(template, assigns, opts) {
  return render_nodes(template.nodes, assigns, new$(), opts);
}
function render_if(data2, if_true, if_false, assigns, acc, options) {
  let _block;
  if (data2 instanceof String3) {
    let $ = data2[0];
    if ($ === "") {
      _block = if_false;
    } else {
      _block = if_true;
    }
  } else if (data2 instanceof Int2) {
    let $ = data2[0];
    if ($ === 0) {
      _block = if_false;
    } else {
      _block = if_true;
    }
  } else if (data2 instanceof Bool2) {
    let $ = data2[0];
    if (!$) {
      _block = if_false;
    } else {
      _block = if_true;
    }
  } else if (data2 instanceof Dict2) {
    let d = data2[0];
    let $ = !is_empty(d);
    if ($) {
      _block = if_true;
    } else {
      _block = if_false;
    }
  } else if (data2 instanceof List2) {
    let $ = data2[0];
    if ($ instanceof Empty) {
      _block = if_false;
    } else {
      _block = if_true;
    }
  } else {
    _block = if_true;
  }
  let nodes = _block;
  return render_nodes(nodes, assigns, acc, options);
}
function render_iter(data2, over, binding, nodes, assigns, acc, options) {
  if (data2 instanceof List2) {
    let items = data2[0];
    return try_fold(
      items,
      acc,
      (output, item) => {
        let new_assigns = insert(assigns, binding, item);
        return render_nodes(nodes, new_assigns, output, options);
      }
    );
  } else {
    return new Error2(new AssignNotIterable(over, assigns));
  }
}

// build/dev/javascript/glemplate/glemplate/text.mjs
function encode(str) {
  return identity(str);
}
function render2(template, assigns, template_cache) {
  return render(
    template,
    assigns,
    new RenderOptions(encode, template_cache)
  );
}

// build/dev/javascript/starlist/starlist/internal/renderer.mjs
var Template2 = class extends CustomType {
  constructor(inner) {
    super();
    this.inner = inner;
  }
};
function timestamp_to_assigns(ts) {
  let _pipe = new$3();
  let _pipe$1 = add_string(_pipe, "date", ts.date);
  return add_string(_pipe$1, "time", ts.time);
}
function language_to_assign(lang) {
  return new Dict2(
    (() => {
      let _pipe = new$3();
      let _pipe$1 = add_string(_pipe, "name", lang.name);
      return add_int(_pipe$1, "percent", lang.percent);
    })()
  );
}
function topic_to_assign(topic) {
  return new Dict2(
    (() => {
      let _pipe = new$3();
      let _pipe$1 = add_string(_pipe, "name", topic.name);
      return add_string(_pipe$1, "url", topic.url);
    })()
  );
}
function release_to_assigns(rel) {
  let _block;
  let _pipe = new$3();
  _block = add_dict(
    _pipe,
    "published_on",
    timestamp_to_assigns(rel.published_on)
  );
  let d = _block;
  let $ = rel.name;
  if ($ instanceof Some) {
    let n = $[0];
    return add_string(d, "name", n);
  } else {
    return d;
  }
}
function add_optional_string(d, key, value) {
  if (value instanceof Some) {
    let v = value[0];
    return add_string(d, key, v);
  } else {
    return add_string(d, key, "");
  }
}
function add_optional_timestamp(d, key, value) {
  if (value instanceof Some) {
    let ts = value[0];
    return add_dict(d, key, timestamp_to_assigns(ts));
  } else {
    return add_bool(d, key, false);
  }
}
function add_optional_release(d, key, value) {
  if (value instanceof Some) {
    let rel = value[0];
    return add_dict(d, key, release_to_assigns(rel));
  } else {
    return add_bool(d, key, false);
  }
}
function add_optional_topics(d, key, value) {
  if (value instanceof Some) {
    let topics = value[0];
    return add_list(d, key, map3(topics, topic_to_assign));
  } else {
    return add_bool(d, key, false);
  }
}
function add_optional_topic_links(d, key, value) {
  if (value instanceof Some) {
    let topics = value[0];
    let _block;
    let _pipe = map3(
      topics,
      (t) => {
        return "[" + t.name + "](" + t.url + ")";
      }
    );
    _block = join(_pipe, ", ");
    let links = _block;
    return add_string(d, key, links);
  } else {
    return add_bool(d, key, false);
  }
}
function starred_repo_to_assign(repo) {
  let _block;
  let _pipe = new$3();
  let _pipe$1 = add_string(_pipe, "name", repo.name);
  let _pipe$2 = add_string(_pipe$1, "url", repo.url);
  let _pipe$3 = add_string(_pipe$2, "license", repo.license);
  let _pipe$4 = add_int(_pipe$3, "forks", repo.forks);
  let _pipe$5 = add_int(_pipe$4, "stars", repo.stars);
  let _pipe$6 = add_bool(_pipe$5, "is_fork", repo.is_fork);
  let _pipe$7 = add_bool(_pipe$6, "is_private", repo.is_private);
  let _pipe$8 = add_bool(_pipe$7, "is_template", repo.is_template);
  let _pipe$9 = add_int(_pipe$8, "language_count", repo.language_count);
  let _pipe$10 = add_int(_pipe$9, "topic_count", repo.topic_count);
  let _pipe$11 = add_list(
    _pipe$10,
    "languages",
    map3(repo.languages, language_to_assign)
  );
  let _pipe$12 = add_dict(
    _pipe$11,
    "pushed_on",
    timestamp_to_assigns(repo.pushed_on)
  );
  let _pipe$13 = add_dict(
    _pipe$12,
    "starred_on",
    timestamp_to_assigns(repo.starred_on)
  );
  let _pipe$14 = add_optional_string(_pipe$13, "description", repo.description);
  let _pipe$15 = add_optional_string(
    _pipe$14,
    "homepage_url",
    repo.homepage_url
  );
  let _pipe$16 = add_optional_string(_pipe$15, "parent_repo", repo.parent_repo);
  let _pipe$17 = add_optional_timestamp(
    _pipe$16,
    "archived_on",
    repo.archived_on
  );
  let _pipe$18 = add_optional_release(
    _pipe$17,
    "latest_release",
    repo.latest_release
  );
  let _pipe$19 = add_optional_topics(_pipe$18, "topics", repo.topics);
  _block = add_optional_topic_links(_pipe$19, "topic_links", repo.topics);
  let d = _block;
  return new Dict2(d);
}
function add_partition(d, value) {
  if (value instanceof Some) {
    let ctx = value[0];
    return add_dict(
      d,
      "partition",
      (() => {
        let _pipe = new$3();
        let _pipe$1 = add_string(_pipe, "name", ctx.name);
        let _pipe$2 = add_string(_pipe$1, "filename", ctx.filename);
        let _pipe$3 = add_int(_pipe$2, "count", ctx.count);
        return add_string(_pipe$3, "count_label", ctx.count_label);
      })()
    );
  } else {
    return add_bool(d, "partition", false);
  }
}
function build_partition_list(partitions) {
  return map3(
    partitions,
    (ctx) => {
      return new Dict2(
        (() => {
          let _pipe = new$3();
          let _pipe$1 = add_string(_pipe, "name", ctx.name);
          let _pipe$2 = add_string(_pipe$1, "filename", ctx.filename);
          let _pipe$3 = add_int(_pipe$2, "count", ctx.count);
          return add_string(_pipe$3, "count_label", ctx.count_label);
        })()
      );
    }
  );
}
function is_slug_char(c) {
  if (c === "a") {
    return true;
  } else if (c === "b") {
    return true;
  } else if (c === "c") {
    return true;
  } else if (c === "d") {
    return true;
  } else if (c === "e") {
    return true;
  } else if (c === "f") {
    return true;
  } else if (c === "g") {
    return true;
  } else if (c === "h") {
    return true;
  } else if (c === "i") {
    return true;
  } else if (c === "j") {
    return true;
  } else if (c === "k") {
    return true;
  } else if (c === "l") {
    return true;
  } else if (c === "m") {
    return true;
  } else if (c === "n") {
    return true;
  } else if (c === "o") {
    return true;
  } else if (c === "p") {
    return true;
  } else if (c === "q") {
    return true;
  } else if (c === "r") {
    return true;
  } else if (c === "s") {
    return true;
  } else if (c === "t") {
    return true;
  } else if (c === "u") {
    return true;
  } else if (c === "v") {
    return true;
  } else if (c === "w") {
    return true;
  } else if (c === "x") {
    return true;
  } else if (c === "y") {
    return true;
  } else if (c === "z") {
    return true;
  } else if (c === "0") {
    return true;
  } else if (c === "1") {
    return true;
  } else if (c === "2") {
    return true;
  } else if (c === "3") {
    return true;
  } else if (c === "4") {
    return true;
  } else if (c === "5") {
    return true;
  } else if (c === "6") {
    return true;
  } else if (c === "7") {
    return true;
  } else if (c === "8") {
    return true;
  } else if (c === "9") {
    return true;
  } else if (c === "-") {
    return true;
  } else {
    return false;
  }
}
function slugify(s) {
  let _pipe = s;
  let _pipe$1 = lowercase(_pipe);
  let _pipe$2 = graphemes(_pipe$1);
  let _pipe$3 = map3(
    _pipe$2,
    (c) => {
      if (c === " ") {
        return "-";
      } else {
        let $ = is_slug_char(c);
        if ($) {
          return c;
        } else {
          return "";
        }
      }
    }
  );
  return join(_pipe$3, "");
}
function build_groups(keys2, groups) {
  return map3(
    keys2,
    (key) => {
      let _block;
      let $ = get(groups, key);
      if ($ instanceof Ok) {
        let r = $[0];
        _block = r;
      } else {
        _block = toList([]);
      }
      let repos = _block;
      let _block$1;
      if (key === "") {
        _block$1 = "Other";
      } else {
        _block$1 = key;
      }
      let name = _block$1;
      let count = length2(repos);
      let _block$2;
      if (count === 1) {
        _block$2 = "1 repo";
      } else {
        let n = count;
        _block$2 = to_string(n) + " repos";
      }
      let label = _block$2;
      return new Dict2(
        (() => {
          let _pipe = new$3();
          let _pipe$1 = add_string(_pipe, "name", name);
          let _pipe$2 = add_string(_pipe$1, "slug", slugify(name));
          let _pipe$3 = add_list(
            _pipe$2,
            "repos",
            map3(repos, starred_repo_to_assign)
          );
          let _pipe$4 = add_int(_pipe$3, "count", count);
          return add_string(_pipe$4, "count_label", label);
        })()
      );
    }
  );
}
function template_vars_to_assigns(vars) {
  let _block;
  let _pipe = keys(vars.groups);
  _block = sort(_pipe, compare);
  let sorted_keys = _block;
  let _pipe$1 = new$3();
  let _pipe$2 = add_int(_pipe$1, "data_version", vars.data_version);
  let _pipe$3 = add_dict(
    _pipe$2,
    "updated_at",
    timestamp_to_assigns(vars.updated_at)
  );
  let _pipe$4 = add_dict(
    _pipe$3,
    "generated_at",
    timestamp_to_assigns(vars.generated_at)
  );
  let _pipe$5 = add_string(_pipe$4, "login", vars.login);
  let _pipe$6 = add_bool(_pipe$5, "truncated", vars.truncated);
  let _pipe$7 = add_int(_pipe$6, "total", vars.total);
  let _pipe$8 = add_int(_pipe$7, "fetched", vars.fetched);
  let _pipe$9 = add_list(
    _pipe$8,
    "stars",
    map3(vars.stars, starred_repo_to_assign)
  );
  let _pipe$10 = add_int(_pipe$9, "group_count", vars.group_count);
  let _pipe$11 = add_string(
    _pipe$10,
    "group_description",
    vars.group_description
  );
  let _pipe$12 = add_list(
    _pipe$11,
    "groups",
    build_groups(sorted_keys, vars.groups)
  );
  let _pipe$13 = add_partition(_pipe$12, vars.partition);
  let _pipe$14 = add_list(
    _pipe$13,
    "partitions",
    build_partition_list(vars.partitions)
  );
  let _pipe$15 = add_int(
    _pipe$14,
    "partition_count",
    vars.partition_count
  );
  return add_string(
    _pipe$15,
    "partition_description",
    vars.partition_description
  );
}
function parse_error_to_string(err) {
  if (err instanceof LexerError) {
    let msg = err[0];
    return "Lexer error: " + msg;
  } else {
    let msgs = err[0];
    return "Parser errors: " + join(msgs, "; ");
  }
}
function compile3(source, name) {
  let p = new$6();
  let $ = parse_to_template(source, name, p);
  if ($ instanceof Ok) {
    let tpl = $[0];
    return new Ok(new Template2(tpl));
  } else {
    let err = $[0];
    return new Error2(
      new TemplateError(
        "Failed to compile template '" + name + "': " + parse_error_to_string(
          err
        )
      )
    );
  }
}
function var_to_string(var$) {
  if (var$ instanceof Assign) {
    let name = var$.name;
    return name;
  } else {
    let container = var$.container;
    let field2 = var$.field;
    return var_to_string(container) + "." + field2;
  }
}
function render_error_to_string(err) {
  if (err instanceof AssignNotFound) {
    let var$ = err.assign;
    return "Assign not found: " + var_to_string(var$);
  } else if (err instanceof AssignNotIterable) {
    let var$ = err.assign;
    return "Assign not iterable: " + var_to_string(var$);
  } else if (err instanceof AssignNotStringifiable) {
    let var$ = err.assign;
    return "Assign not stringifiable: " + var_to_string(var$);
  } else if (err instanceof AssignFieldNotFound) {
    let var$ = err.assign;
    let field2 = err.field;
    return "Field '" + field2 + "' not found on: " + var_to_string(var$);
  } else if (err instanceof AssignNotFieldAccessible) {
    let var$ = err.assign;
    return "Assign not field-accessible: " + var_to_string(var$);
  } else {
    let tpl_name = err.tpl_name;
    return "Child template not found: " + tpl_name;
  }
}
function render3(template, vars) {
  let a = template_vars_to_assigns(vars);
  let cache = make();
  let $ = render2(template.inner, a, cache);
  if ($ instanceof Ok) {
    let tree = $[0];
    return new Ok(identity(tree));
  } else {
    let err = $[0];
    return new Error2(
      new TemplateError(
        "Failed to render template: " + render_error_to_string(err)
      )
    );
  }
}

// build/dev/javascript/starlist/starlist/internal/resolver.mjs
function resolve_release(rel, dt) {
  return new Release2(
    rel.name,
    format(dt, rel.published_on)
  );
}
function resolve_repo(repo, dt) {
  return new StarredRepo(
    map2(
      repo.archived_on,
      (_capture) => {
        return format(dt, _capture);
      }
    ),
    repo.description,
    repo.forks,
    repo.homepage_url,
    repo.is_fork,
    repo.is_private,
    repo.is_template,
    repo.language_count,
    repo.languages,
    map2(
      repo.latest_release,
      (_capture) => {
        return resolve_release(_capture, dt);
      }
    ),
    repo.license,
    repo.name,
    repo.parent_repo,
    format(dt, repo.pushed_on),
    format(dt, repo.starred_on),
    repo.stars,
    repo.topic_count,
    repo.topics,
    repo.url
  );
}
function upsert3(acc, key, repo) {
  let _block;
  let $ = get(acc, key);
  if ($ instanceof Ok) {
    let repos = $[0];
    _block = repos;
  } else {
    _block = toList([]);
  }
  let existing = _block;
  return insert(acc, key, append3(existing, toList([repo])));
}
function group_by_language2(stars) {
  return fold2(
    stars,
    make(),
    (acc, repo) => {
      let _block;
      let $ = repo.languages;
      if ($ instanceof Empty) {
        _block = "";
      } else {
        let first = $.head;
        _block = first.name;
      }
      let key = _block;
      return upsert3(acc, key, repo);
    }
  );
}
function group_by_topic2(stars) {
  return fold2(
    stars,
    make(),
    (acc, repo) => {
      let _block;
      let $ = repo.topics;
      if ($ instanceof Some) {
        let $1 = $[0];
        if ($1 instanceof Empty) {
          _block = "no-topics";
        } else {
          let first = $1.head;
          _block = first.name;
        }
      } else {
        _block = "no-topics";
      }
      let key = _block;
      return upsert3(acc, key, repo);
    }
  );
}
function group_by_licence2(stars) {
  return fold2(
    stars,
    make(),
    (acc, repo) => {
      let _block;
      let $ = repo.license;
      if ($ === "") {
        _block = "Unknown license";
      } else {
        _block = $;
      }
      let key = _block;
      return upsert3(acc, key, repo);
    }
  );
}
function resolve_response(response, date_time, group2) {
  let stars = map3(
    response.stars,
    (_capture) => {
      return resolve_repo(_capture, date_time);
    }
  );
  let _block;
  if (group2 instanceof GroupByLanguage) {
    _block = [group_by_language2(stars), "languages"];
  } else if (group2 instanceof GroupByTopic) {
    _block = [group_by_topic2(stars), "topics"];
  } else {
    _block = [group_by_licence2(stars), "licences"];
  }
  let $ = _block;
  let groups;
  let group_description;
  groups = $[0];
  group_description = $[1];
  return new TemplateVars(
    response.data_version,
    format(date_time, response.updated_at),
    now(date_time),
    response.login,
    response.truncated,
    length2(stars),
    response.fetched,
    stars,
    groups,
    size(groups),
    group_description,
    new None(),
    toList([]),
    0,
    ""
  );
}

// build/dev/javascript/starlist/starlist/internal/star_data.mjs
function language_to_json(lang) {
  return object2(
    toList([
      ["name", string3(lang.name)],
      ["percent", int3(lang.percent)]
    ])
  );
}
function topic_to_json(topic) {
  return object2(
    toList([
      ["name", string3(topic.name)],
      ["url", string3(topic.url)]
    ])
  );
}
function response_release_to_json(rel) {
  return object2(
    toList([
      ["name", nullable(rel.name, string3)],
      ["publishedOn", string3(rel.published_on)]
    ])
  );
}
function response_repo_to_json(repo) {
  return object2(
    toList([
      ["archivedOn", nullable(repo.archived_on, string3)],
      ["description", nullable(repo.description, string3)],
      ["forks", int3(repo.forks)],
      ["homepageUrl", nullable(repo.homepage_url, string3)],
      ["isFork", bool2(repo.is_fork)],
      ["isPrivate", bool2(repo.is_private)],
      ["isTemplate", bool2(repo.is_template)],
      ["languageCount", int3(repo.language_count)],
      ["languages", array2(repo.languages, language_to_json)],
      [
        "latestRelease",
        nullable(repo.latest_release, response_release_to_json)
      ],
      ["license", string3(repo.license)],
      ["name", string3(repo.name)],
      ["parentRepo", nullable(repo.parent_repo, string3)],
      ["pushedOn", string3(repo.pushed_on)],
      ["starredOn", string3(repo.starred_on)],
      ["stars", int3(repo.stars)],
      ["topicCount", int3(repo.topic_count)],
      [
        "topics",
        nullable(
          repo.topics,
          (ts) => {
            return array2(ts, topic_to_json);
          }
        )
      ],
      ["url", string3(repo.url)]
    ])
  );
}
function query_response_to_json(response) {
  return object2(
    toList([
      ["dataVersion", int3(response.data_version)],
      ["login", string3(response.login)],
      ["truncated", bool2(response.truncated)],
      ["total", int3(response.total)],
      ["fetched", int3(response.fetched)],
      ["updatedAt", string3(response.updated_at)],
      ["stars", array2(response.stars, response_repo_to_json)]
    ])
  );
}
function validate_data_version(response) {
  let $ = response.data_version === data_version;
  if ($) {
    return new Ok(response);
  } else {
    return new Error2(
      new VersionMismatchError(
        data_version,
        response.data_version
      )
    );
  }
}
function language_decoder2() {
  return field(
    "name",
    string2,
    (name) => {
      return field(
        "percent",
        int2,
        (percent) => {
          return success(new Language2(name, percent));
        }
      );
    }
  );
}
function topic_decoder2() {
  return field(
    "name",
    string2,
    (name) => {
      return field(
        "url",
        string2,
        (url) => {
          return success(new Topic2(name, url));
        }
      );
    }
  );
}
function response_release_decoder() {
  return field(
    "name",
    optional(string2),
    (name) => {
      return field(
        "publishedOn",
        string2,
        (published_on) => {
          return success(
            new ResponseRelease(name, published_on)
          );
        }
      );
    }
  );
}
function response_repo_decoder() {
  return field(
    "archivedOn",
    optional(string2),
    (archived_on) => {
      return field(
        "description",
        optional(string2),
        (description) => {
          return field(
            "forks",
            int2,
            (forks) => {
              return field(
                "homepageUrl",
                optional(string2),
                (homepage_url) => {
                  return field(
                    "isFork",
                    bool,
                    (is_fork) => {
                      return field(
                        "isPrivate",
                        bool,
                        (is_private) => {
                          return field(
                            "isTemplate",
                            bool,
                            (is_template) => {
                              return field(
                                "languageCount",
                                int2,
                                (language_count2) => {
                                  return field(
                                    "languages",
                                    list2(language_decoder2()),
                                    (languages) => {
                                      return field(
                                        "latestRelease",
                                        optional(
                                          response_release_decoder()
                                        ),
                                        (latest_release) => {
                                          return field(
                                            "license",
                                            string2,
                                            (license) => {
                                              return field(
                                                "name",
                                                string2,
                                                (name) => {
                                                  return field(
                                                    "parentRepo",
                                                    optional(
                                                      string2
                                                    ),
                                                    (parent_repo) => {
                                                      return field(
                                                        "pushedOn",
                                                        string2,
                                                        (pushed_on) => {
                                                          return field(
                                                            "starredOn",
                                                            string2,
                                                            (starred_on) => {
                                                              return field(
                                                                "stars",
                                                                int2,
                                                                (stars) => {
                                                                  return field(
                                                                    "topicCount",
                                                                    int2,
                                                                    (topic_count) => {
                                                                      return field(
                                                                        "topics",
                                                                        optional(
                                                                          list2(
                                                                            topic_decoder2()
                                                                          )
                                                                        ),
                                                                        (topics) => {
                                                                          return field(
                                                                            "url",
                                                                            string2,
                                                                            (url) => {
                                                                              return success(
                                                                                new ResponseRepo(
                                                                                  archived_on,
                                                                                  description,
                                                                                  forks,
                                                                                  homepage_url,
                                                                                  is_fork,
                                                                                  is_private,
                                                                                  is_template,
                                                                                  language_count2,
                                                                                  languages,
                                                                                  latest_release,
                                                                                  license,
                                                                                  name,
                                                                                  parent_repo,
                                                                                  pushed_on,
                                                                                  starred_on,
                                                                                  stars,
                                                                                  topic_count,
                                                                                  topics,
                                                                                  url
                                                                                )
                                                                              );
                                                                            }
                                                                          );
                                                                        }
                                                                      );
                                                                    }
                                                                  );
                                                                }
                                                              );
                                                            }
                                                          );
                                                        }
                                                      );
                                                    }
                                                  );
                                                }
                                              );
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function query_response_decoder() {
  return field(
    "dataVersion",
    int2,
    (data_version2) => {
      return field(
        "login",
        string2,
        (login) => {
          return field(
            "truncated",
            bool,
            (truncated) => {
              return field(
                "total",
                int2,
                (total) => {
                  return field(
                    "fetched",
                    int2,
                    (fetched) => {
                      return field(
                        "updatedAt",
                        string2,
                        (updated_at) => {
                          return field(
                            "stars",
                            list2(response_repo_decoder()),
                            (stars) => {
                              return success(
                                new QueryResponse(
                                  data_version2,
                                  login,
                                  truncated,
                                  total,
                                  fetched,
                                  stars,
                                  updated_at
                                )
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function load_data_file(filename2) {
  let $ = read(filename2);
  if ($ instanceof Ok) {
    let contents = $[0];
    let $1 = parse4(contents, query_response_decoder());
    if ($1 instanceof Ok) {
      let response = $1[0];
      return validate_data_version(response);
    } else {
      return new Error2(
        new FileError(
          "Failed to decode " + filename2 + " as valid QueryResponse JSON"
        )
      );
    }
  } else {
    return new Error2(
      new FileError(
        "Cannot read " + filename2 + ": file not found or unreadable"
      )
    );
  }
}
function map_file_error(result, context) {
  if (result instanceof Ok) {
    return result;
  } else {
    let err = result[0];
    return new Error2(
      new FileError(
        "File error " + context + ": " + inspect2(err)
      )
    );
  }
}
function write_data_file(response, filename2) {
  let _block;
  let _pipe = query_response_to_json(response);
  _block = to_string3(_pipe);
  let json_string = _block;
  let _pipe$1 = write(filename2, json_string);
  return map_file_error(_pipe$1, "writing " + filename2);
}

// build/dev/javascript/starlist/starlist/process_handlers_ffi.mjs
function registerProcessHandlers(errorFn, setFailedFn) {
  process.on("unhandledRejection", (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    errorFn("Unhandled rejection: " + msg);
    setFailedFn("Unhandled rejection: " + msg);
  });
  process.on("uncaughtException", (err) => {
    const msg = err instanceof Error ? err.message : String(err);
    errorFn("Uncaught exception: " + msg);
    setFailedFn("Uncaught exception: " + msg);
  });
}

// build/dev/javascript/starlist/starlist/action.mjs
var FILEPATH3 = "src/starlist/action.gleam";
var SingleTemplate = class extends CustomType {
  constructor(data2) {
    super();
    this.data = data2;
  }
};
var MultiTemplate = class extends CustomType {
  constructor(data2, index5) {
    super();
    this.data = data2;
    this.index = index5;
  }
};
var package_name = "halostatue/starlist";
var package_version = "2.0.0";
var auto_partition_threshold = 2e3;
function setup_git(git_cfg, token4) {
  return try$(
    (() => {
      let $ = git_cfg.committer;
      if ($ instanceof Some) {
        let committer = $[0];
        return setup(committer, token4);
      } else {
        return new Ok(void 0);
      }
    })(),
    (_) => {
      let $ = git_cfg.pull;
      if ($ instanceof Some) {
        let flags = $[0];
        let _block;
        let $1 = is_shallow();
        if ($1 instanceof Ok) {
          let v = $1[0];
          _block = v;
        } else {
          _block = false;
        }
        let shallow = _block;
        return pull(flags, shallow);
      } else {
        return new Ok(void 0);
      }
    }
  );
}
function fetch_stars(fetch2, token4) {
  let $ = fetch2.source;
  if ($ instanceof Api) {
    info("Fetching stars from API...");
    return map_promise(
      fetch_starred_repos(token4, fetch2.max_stars),
      (res) => {
        return map5(
          res,
          (response) => {
            info(
              "Fetched " + to_string(response.fetched) + "/" + to_string(
                response.total
              ) + " stars"
            );
            return response;
          }
        );
      }
    );
  } else {
    info("Loading stars from data.json...");
    return resolve(
      map5(
        load_data_file("data.json"),
        (response) => {
          info(
            "Loaded " + to_string(response.fetched) + "/" + to_string(
              response.total
            ) + " stars"
          );
          return response;
        }
      )
    );
  }
}
function filter_private(response) {
  let public$ = filter(response.stars, (r) => {
    return !r.is_private;
  });
  return new QueryResponse(
    response.data_version,
    response.login,
    response.truncated,
    response.total,
    length2(public$),
    public$,
    response.updated_at
  );
}
function compile_template(path2) {
  let $ = read(path2);
  if ($ instanceof Ok) {
    let content = $[0];
    return compile3(content, path2);
  } else {
    return new Error2(new FileError("Cannot read template: " + path2));
  }
}
function compile_templates(render4) {
  return try$(
    compile_template(render4.template),
    (data_tpl) => {
      let $ = render4.partition;
      if ($ instanceof PartitionOff) {
        return new Ok(new SingleTemplate(data_tpl));
      } else {
        return try$(
          compile_template(render4.index_template),
          (index_tpl) => {
            return new Ok(new MultiTemplate(data_tpl, index_tpl));
          }
        );
      }
    }
  );
}
function try_partition(result, next2) {
  if (result instanceof Ok) {
    let pr = result[0];
    return next2(pr);
  } else {
    return new Error2(
      new ConfigError("Partition returned Off in multi-file mode")
    );
  }
}
function partition_description(p) {
  if (p instanceof PartitionOff) {
    return "";
  } else if (p instanceof PartitionByLanguage) {
    return "languages";
  } else if (p instanceof PartitionByTopic) {
    return "topics";
  } else if (p instanceof PartitionByYear) {
    return "years";
  } else {
    return "months";
  }
}
function enrich_index_vars(vars, pr, partition2) {
  let contexts = map3(
    pr.partitions,
    (p) => {
      return new PartitionContext(
        p.key,
        p.filename,
        p.count,
        (() => {
          let $ = p.count;
          if ($ === 1) {
            return "1 repo";
          } else {
            let n = $;
            return to_string(n) + " repos";
          }
        })()
      );
    }
  );
  return new TemplateVars(
    vars.data_version,
    vars.updated_at,
    vars.generated_at,
    vars.login,
    vars.truncated,
    vars.total,
    vars.fetched,
    vars.stars,
    vars.groups,
    vars.group_count,
    vars.group_description,
    vars.partition,
    contexts,
    length2(contexts),
    partition_description(partition2)
  );
}
function render_files(render4, templates, vars) {
  if (templates instanceof SingleTemplate) {
    let tpl = templates.data;
    return try$(
      render3(tpl, vars),
      (rendered) => {
        return new Ok(toList([new GeneratedFile(render4.filename, rendered)]));
      }
    );
  } else {
    let data_tpl = templates.data;
    let index_tpl = templates.index;
    return try_partition(
      partition(
        vars,
        render4.partition,
        render4.group,
        render4.partition_filename
      ),
      (pr) => {
        let index_vars = enrich_index_vars(vars, pr, render4.partition);
        return try$(
          render3(index_tpl, index_vars),
          (index_rendered) => {
            let index_file = new GeneratedFile(render4.filename, index_rendered);
            return try$(
              try_map(
                pr.data,
                (part) => {
                  return try$(
                    render3(data_tpl, part.vars),
                    (rendered) => {
                      return new Ok(new GeneratedFile(part.filename, rendered));
                    }
                  );
                }
              ),
              (data_files) => {
                return new Ok(prepend(index_file, data_files));
              }
            );
          }
        );
      }
    );
  }
}
function ensure_parent(path2) {
  let dir = directory_name(path2);
  let $ = create_directory_all(dir);
  if ($ instanceof Ok) {
    return new Ok(void 0);
  } else {
    return new Error2(new FileError("Cannot create directory: " + dir));
  }
}
function write_output_files(files) {
  let _block;
  let $ = currentDirectory();
  if ($ instanceof Ok) {
    let dir = $[0];
    _block = dir;
  } else {
    _block = ".";
  }
  let repo_root = _block;
  return try_map(
    files,
    (file) => {
      return try$(
        validate_path(file.filename, repo_root, "output"),
        (resolved) => {
          return try$(
            ensure_parent(resolved),
            (_) => {
              let $1 = write(resolved, file.data);
              if ($1 instanceof Ok) {
                return new Ok(file.filename);
              } else {
                return new Error2(
                  new FileError("Failed to write: " + file.filename)
                );
              }
            }
          );
        }
      );
    }
  );
}
function partition_to_string(p) {
  if (p instanceof PartitionOff) {
    return "off";
  } else if (p instanceof PartitionByLanguage) {
    return "language";
  } else if (p instanceof PartitionByTopic) {
    return "topic";
  } else if (p instanceof PartitionByYear) {
    return "year";
  } else {
    return "year-month";
  }
}
function group_to_string(g) {
  if (g instanceof GroupByLanguage) {
    return "language";
  } else if (g instanceof GroupByTopic) {
    return "topic";
  } else {
    return "licence";
  }
}
function date_time_to_string(dt) {
  if (dt instanceof IsoDateTime) {
    let tz = dt.time_zone;
    return "iso (tz: " + tz + ")";
  } else {
    let locale = dt.locale;
    let tz = dt.time_zone;
    let ds = dt.date_style;
    let ts = dt.time_style;
    return "locale=" + locale + " tz=" + tz + " date=" + ds + " time=" + ts;
  }
}
function log_config(cfg) {
  start_group("Configuration");
  let fetch2 = cfg.fetch;
  info(
    "fetch.source: " + (() => {
      let $ = fetch2.source;
      if ($ instanceof Api) {
        return "api";
      } else {
        return "file";
      }
    })()
  );
  info(
    "fetch.max_stars: " + (() => {
      let $ = fetch2.max_stars;
      if ($ instanceof Some) {
        let n = $[0];
        return to_string(n);
      } else {
        return "unlimited";
      }
    })()
  );
  let render4 = cfg.render;
  info("render.filename: " + render4.filename);
  info("render.template: " + render4.template);
  info("render.index_template: " + render4.index_template);
  info("render.partition: " + partition_to_string(render4.partition));
  info("render.group: " + group_to_string(render4.group));
  info("render.partition_filename: " + render4.partition_filename);
  info("render.date_time: " + date_time_to_string(render4.date_time));
  let git_cfg = cfg.git;
  info("git.commit_message: " + git_cfg.commit_message);
  info(
    "git.pull: " + (() => {
      let $ = git_cfg.pull;
      if ($ instanceof Some) {
        let $1 = $[0];
        if ($1 === "") {
          return '""';
        } else {
          let f = $1;
          return '"' + f + '"';
        }
      } else {
        return "disabled";
      }
    })()
  );
  info(
    "git.committer: " + (() => {
      let $ = git_cfg.committer;
      if ($ instanceof Some) {
        let name = $[0][0];
        let email = $[0][1];
        return name + " <" + email + ">";
      } else {
        return "not set";
      }
    })()
  );
  return end_group();
}
function error_to_string(err) {
  if (err instanceof ConfigError) {
    let msg = err.message;
    return "Configuration error: " + msg;
  } else if (err instanceof GitHubApiError) {
    let msg = err.message;
    return "GitHub API error: " + msg;
  } else if (err instanceof FileError) {
    let msg = err.message;
    return "File error: " + msg;
  } else if (err instanceof TemplateError) {
    let msg = err.message;
    return "Template error: " + msg;
  } else if (err instanceof MarkdownError) {
    let msg = err.message;
    return "Markdown error: " + msg;
  } else if (err instanceof GitError) {
    let command2 = err.command;
    let exit_code = err.exit_code;
    let message = err.message;
    return "Git error (exit " + to_string(exit_code) + ") running '" + command2 + "': " + message;
  } else if (err instanceof SecurityError) {
    let msg = err.message;
    return "Security error: " + msg;
  } else {
    let expected = err.expected;
    let found = err.found;
    return "Data version mismatch: expected " + to_string(expected) + ", found " + to_string(
      found
    );
  }
}
function try_promise(result, next2) {
  if (result instanceof Ok) {
    let v = result[0];
    return next2(v);
  } else {
    let e = result[0];
    return resolve(new Error2(e));
  }
}
function auto_partition(render4, star_count) {
  let $ = render4.partition;
  if ($ instanceof PartitionOff && star_count >= 2e3) {
    info(
      "Auto-partitioning by year (" + to_string(star_count) + " stars >= " + to_string(
        auto_partition_threshold
      ) + ")"
    );
    return new Render(
      render4.date_time,
      render4.filename,
      render4.partition_filename,
      render4.group,
      new PartitionByYear(),
      render4.template,
      render4.index_template
    );
  } else {
    return render4;
  }
}
function run3() {
  return try_promise(
    resolve2(),
    (cfg) => {
      log_config(cfg);
      let $ = cfg.token;
      let token4;
      if ($ instanceof Some) {
        token4 = $[0];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH3,
          "starlist/action",
          63,
          "run",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $,
            start: 1760,
            end: 1794,
            pattern_start: 1771,
            pattern_end: 1782
          }
        );
      }
      start_group("Git setup");
      return try_promise(
        setup_git(cfg.git, token4),
        (_) => {
          end_group();
          start_group("Fetch stars");
          return try_await(
            fetch_stars(cfg.fetch, token4),
            (response) => {
              end_group();
              let public$ = filter_private(response);
              info(
                "Writing data.json (" + to_string(public$.fetched) + " public)..."
              );
              return try_promise(
                write_data_file(public$, "data.json"),
                (_2) => {
                  return try_promise(
                    add3(toList(["data.json"])),
                    (_3) => {
                      let render4 = auto_partition(cfg.render, public$.fetched);
                      let vars = resolve_response(
                        public$,
                        render4.date_time,
                        render4.group
                      );
                      start_group("Render");
                      return try_promise(
                        compile_templates(render4),
                        (templates) => {
                          return try_promise(
                            render_files(render4, templates, vars),
                            (files) => {
                              end_group();
                              info(
                                "Writing " + to_string(
                                  length2(files)
                                ) + " output file(s)..."
                              );
                              return try_promise(
                                write_output_files(files),
                                (written) => {
                                  return try_promise(
                                    add3(written),
                                    (_4) => {
                                      start_group("Commit");
                                      let message = cfg.git.commit_message;
                                      return try_promise(
                                        commit(message),
                                        (_5) => {
                                          let _block;
                                          let $1 = current_branch();
                                          if ($1 instanceof Ok) {
                                            let b = $1[0];
                                            _block = b;
                                          } else {
                                            _block = "HEAD";
                                          }
                                          let branch2 = _block;
                                          return try_await(
                                            resolve(push(branch2)),
                                            (_6) => {
                                              end_group();
                                              return resolve(
                                                new Ok(void 0)
                                              );
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function main() {
  registerProcessHandlers(error, set_failed);
  info(package_name + " v" + package_version);
  map_promise(
    run3(),
    (res) => {
      if (res instanceof Ok) {
        info("Done.");
      } else {
        let err = res[0];
        set_failed(error_to_string(err));
      }
      return void 0;
    }
  );
  return void 0;
}

// build/dev/javascript/starlist/gleam.main.mjs
main?.();
