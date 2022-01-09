var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* toIterator(parts, clone2 = true) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else if (ArrayBuffer.isView(part)) {
      if (clone2) {
        let position = part.byteOffset;
        const end = part.byteOffset + part.byteLength;
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE);
          const chunk = part.buffer.slice(position, position + size);
          position += chunk.byteLength;
          yield new Uint8Array(chunk);
        }
      } else {
        yield part;
      }
    } else {
      let position = 0;
      while (position !== part.size) {
        const chunk = part.slice(position, Math.min(part.size, position + POOL_SIZE));
        const buffer = await chunk.arrayBuffer();
        position += buffer.byteLength;
        yield new Uint8Array(buffer);
      }
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    length += isBlob(value) ? value.size : Buffer.byteLength(String(value));
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = import_stream.default.Readable.from(body.stream());
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const error2 = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(error2);
        throw error2;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    const error_ = error2 instanceof FetchBaseError ? error2 : new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    throw error_;
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index, array) => {
    if (index % 2 === 0) {
      result.push(array.slice(index, index + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (error2) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${error2.message}`, "system", error2));
      finalize();
    });
    fixResponseChunkedTransferBadEnding(request_, (error2) => {
      response.body.destroy(error2);
    });
    if (process.version < "v14") {
      request_.on("socket", (s2) => {
        let endedWithEventsCount;
        s2.prependListener("end", () => {
          endedWithEventsCount = s2._eventsCount;
        });
        s2.prependListener("close", (hadError) => {
          if (response && endedWithEventsCount < s2._eventsCount && !hadError) {
            const error2 = new Error("Premature close");
            error2.code = "ERR_STREAM_PREMATURE_CLOSE";
            response.body.emit("error", error2);
          }
        });
      });
    }
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              headers.set("Location", locationURL);
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
          default:
            return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      if (signal) {
        response_.once("end", () => {
          signal.removeEventListener("abort", abortAndFinalize);
        });
      }
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), reject);
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
        raw.once("data", (chunk) => {
          body = (chunk[0] & 15) === 8 ? (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), reject) : (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), reject);
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), reject);
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = Buffer.from("0\r\n\r\n");
  let isChunkedTransfer = false;
  let properLastChunkReceived = false;
  let previousChunk;
  request.on("response", (response) => {
    const { headers } = response;
    isChunkedTransfer = headers["transfer-encoding"] === "chunked" && !headers["content-length"];
  });
  request.on("socket", (socket) => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error2 = new Error("Premature close");
        error2.code = "ERR_STREAM_PREMATURE_CLOSE";
        errorCallback(error2);
      }
    };
    socket.prependListener("close", onSocketClose);
    request.on("abort", () => {
      socket.removeListener("close", onSocketClose);
    });
    socket.on("data", (buf) => {
      properLastChunkReceived = Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0;
      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived = Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 && Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
      }
      previousChunk = buf;
    });
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, commonjsGlobal, src, dataUriToBuffer$1, ponyfill_es2018, POOL_SIZE$1, POOL_SIZE, _Blob, Blob2, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ponyfill_es2018 = { exports: {} };
    (function(module2, exports) {
      (function(global2, factory) {
        factory(exports);
      })(commonjsGlobal, function(exports2) {
        const SymbolPolyfill = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol : (description) => `Symbol(${description})`;
        function noop2() {
          return void 0;
        }
        function getGlobals() {
          if (typeof self !== "undefined") {
            return self;
          } else if (typeof window !== "undefined") {
            return window;
          } else if (typeof commonjsGlobal !== "undefined") {
            return commonjsGlobal;
          }
          return void 0;
        }
        const globals = getGlobals();
        function typeIsObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        const rethrowAssertionErrorRejection = noop2;
        const originalPromise = Promise;
        const originalPromiseThen = Promise.prototype.then;
        const originalPromiseResolve = Promise.resolve.bind(originalPromise);
        const originalPromiseReject = Promise.reject.bind(originalPromise);
        function newPromise(executor) {
          return new originalPromise(executor);
        }
        function promiseResolvedWith(value) {
          return originalPromiseResolve(value);
        }
        function promiseRejectedWith(reason) {
          return originalPromiseReject(reason);
        }
        function PerformPromiseThen(promise, onFulfilled, onRejected) {
          return originalPromiseThen.call(promise, onFulfilled, onRejected);
        }
        function uponPromise(promise, onFulfilled, onRejected) {
          PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), void 0, rethrowAssertionErrorRejection);
        }
        function uponFulfillment(promise, onFulfilled) {
          uponPromise(promise, onFulfilled);
        }
        function uponRejection(promise, onRejected) {
          uponPromise(promise, void 0, onRejected);
        }
        function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
          return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
        }
        function setPromiseIsHandledToTrue(promise) {
          PerformPromiseThen(promise, void 0, rethrowAssertionErrorRejection);
        }
        const queueMicrotask = (() => {
          const globalQueueMicrotask = globals && globals.queueMicrotask;
          if (typeof globalQueueMicrotask === "function") {
            return globalQueueMicrotask;
          }
          const resolvedPromise = promiseResolvedWith(void 0);
          return (fn) => PerformPromiseThen(resolvedPromise, fn);
        })();
        function reflectCall(F, V, args) {
          if (typeof F !== "function") {
            throw new TypeError("Argument is not a function");
          }
          return Function.prototype.apply.call(F, V, args);
        }
        function promiseCall(F, V, args) {
          try {
            return promiseResolvedWith(reflectCall(F, V, args));
          } catch (value) {
            return promiseRejectedWith(value);
          }
        }
        const QUEUE_MAX_ARRAY_SIZE = 16384;
        class SimpleQueue {
          constructor() {
            this._cursor = 0;
            this._size = 0;
            this._front = {
              _elements: [],
              _next: void 0
            };
            this._back = this._front;
            this._cursor = 0;
            this._size = 0;
          }
          get length() {
            return this._size;
          }
          push(element) {
            const oldBack = this._back;
            let newBack = oldBack;
            if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
              newBack = {
                _elements: [],
                _next: void 0
              };
            }
            oldBack._elements.push(element);
            if (newBack !== oldBack) {
              this._back = newBack;
              oldBack._next = newBack;
            }
            ++this._size;
          }
          shift() {
            const oldFront = this._front;
            let newFront = oldFront;
            const oldCursor = this._cursor;
            let newCursor = oldCursor + 1;
            const elements = oldFront._elements;
            const element = elements[oldCursor];
            if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
              newFront = oldFront._next;
              newCursor = 0;
            }
            --this._size;
            this._cursor = newCursor;
            if (oldFront !== newFront) {
              this._front = newFront;
            }
            elements[oldCursor] = void 0;
            return element;
          }
          forEach(callback) {
            let i = this._cursor;
            let node = this._front;
            let elements = node._elements;
            while (i !== elements.length || node._next !== void 0) {
              if (i === elements.length) {
                node = node._next;
                elements = node._elements;
                i = 0;
                if (elements.length === 0) {
                  break;
                }
              }
              callback(elements[i]);
              ++i;
            }
          }
          peek() {
            const front = this._front;
            const cursor = this._cursor;
            return front._elements[cursor];
          }
        }
        function ReadableStreamReaderGenericInitialize(reader, stream) {
          reader._ownerReadableStream = stream;
          stream._reader = reader;
          if (stream._state === "readable") {
            defaultReaderClosedPromiseInitialize(reader);
          } else if (stream._state === "closed") {
            defaultReaderClosedPromiseInitializeAsResolved(reader);
          } else {
            defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
          }
        }
        function ReadableStreamReaderGenericCancel(reader, reason) {
          const stream = reader._ownerReadableStream;
          return ReadableStreamCancel(stream, reason);
        }
        function ReadableStreamReaderGenericRelease(reader) {
          if (reader._ownerReadableStream._state === "readable") {
            defaultReaderClosedPromiseReject(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          } else {
            defaultReaderClosedPromiseResetToRejected(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          }
          reader._ownerReadableStream._reader = void 0;
          reader._ownerReadableStream = void 0;
        }
        function readerLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released reader");
        }
        function defaultReaderClosedPromiseInitialize(reader) {
          reader._closedPromise = newPromise((resolve2, reject) => {
            reader._closedPromise_resolve = resolve2;
            reader._closedPromise_reject = reject;
          });
        }
        function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseReject(reader, reason);
        }
        function defaultReaderClosedPromiseInitializeAsResolved(reader) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseResolve(reader);
        }
        function defaultReaderClosedPromiseReject(reader, reason) {
          if (reader._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(reader._closedPromise);
          reader._closedPromise_reject(reason);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        function defaultReaderClosedPromiseResetToRejected(reader, reason) {
          defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
        }
        function defaultReaderClosedPromiseResolve(reader) {
          if (reader._closedPromise_resolve === void 0) {
            return;
          }
          reader._closedPromise_resolve(void 0);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        const AbortSteps = SymbolPolyfill("[[AbortSteps]]");
        const ErrorSteps = SymbolPolyfill("[[ErrorSteps]]");
        const CancelSteps = SymbolPolyfill("[[CancelSteps]]");
        const PullSteps = SymbolPolyfill("[[PullSteps]]");
        const NumberIsFinite = Number.isFinite || function(x) {
          return typeof x === "number" && isFinite(x);
        };
        const MathTrunc = Math.trunc || function(v) {
          return v < 0 ? Math.ceil(v) : Math.floor(v);
        };
        function isDictionary(x) {
          return typeof x === "object" || typeof x === "function";
        }
        function assertDictionary(obj, context) {
          if (obj !== void 0 && !isDictionary(obj)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertFunction(x, context) {
          if (typeof x !== "function") {
            throw new TypeError(`${context} is not a function.`);
          }
        }
        function isObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        function assertObject(x, context) {
          if (!isObject(x)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertRequiredArgument(x, position, context) {
          if (x === void 0) {
            throw new TypeError(`Parameter ${position} is required in '${context}'.`);
          }
        }
        function assertRequiredField(x, field, context) {
          if (x === void 0) {
            throw new TypeError(`${field} is required in '${context}'.`);
          }
        }
        function convertUnrestrictedDouble(value) {
          return Number(value);
        }
        function censorNegativeZero(x) {
          return x === 0 ? 0 : x;
        }
        function integerPart(x) {
          return censorNegativeZero(MathTrunc(x));
        }
        function convertUnsignedLongLongWithEnforceRange(value, context) {
          const lowerBound = 0;
          const upperBound = Number.MAX_SAFE_INTEGER;
          let x = Number(value);
          x = censorNegativeZero(x);
          if (!NumberIsFinite(x)) {
            throw new TypeError(`${context} is not a finite number`);
          }
          x = integerPart(x);
          if (x < lowerBound || x > upperBound) {
            throw new TypeError(`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`);
          }
          if (!NumberIsFinite(x) || x === 0) {
            return 0;
          }
          return x;
        }
        function assertReadableStream(x, context) {
          if (!IsReadableStream(x)) {
            throw new TypeError(`${context} is not a ReadableStream.`);
          }
        }
        function AcquireReadableStreamDefaultReader(stream) {
          return new ReadableStreamDefaultReader(stream);
        }
        function ReadableStreamAddReadRequest(stream, readRequest) {
          stream._reader._readRequests.push(readRequest);
        }
        function ReadableStreamFulfillReadRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readRequest = reader._readRequests.shift();
          if (done) {
            readRequest._closeSteps();
          } else {
            readRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadRequests(stream) {
          return stream._reader._readRequests.length;
        }
        function ReadableStreamHasDefaultReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamDefaultReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamDefaultReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamDefaultReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("read"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: () => resolvePromise({ value: void 0, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamDefaultReaderRead(this, readRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamDefaultReader(this)) {
              throw defaultReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamDefaultReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultReader",
            configurable: true
          });
        }
        function IsReadableStreamDefaultReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readRequests")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultReader;
        }
        function ReadableStreamDefaultReaderRead(reader, readRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "closed") {
            readRequest._closeSteps();
          } else if (stream._state === "errored") {
            readRequest._errorSteps(stream._storedError);
          } else {
            stream._readableStreamController[PullSteps](readRequest);
          }
        }
        function defaultReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`);
        }
        const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
        }).prototype);
        class ReadableStreamAsyncIteratorImpl {
          constructor(reader, preventCancel) {
            this._ongoingPromise = void 0;
            this._isFinished = false;
            this._reader = reader;
            this._preventCancel = preventCancel;
          }
          next() {
            const nextSteps = () => this._nextSteps();
            this._ongoingPromise = this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) : nextSteps();
            return this._ongoingPromise;
          }
          return(value) {
            const returnSteps = () => this._returnSteps(value);
            return this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) : returnSteps();
          }
          _nextSteps() {
            if (this._isFinished) {
              return Promise.resolve({ value: void 0, done: true });
            }
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("iterate"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => {
                this._ongoingPromise = void 0;
                queueMicrotask(() => resolvePromise({ value: chunk, done: false }));
              },
              _closeSteps: () => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                resolvePromise({ value: void 0, done: true });
              },
              _errorSteps: (reason) => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                rejectPromise(reason);
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promise;
          }
          _returnSteps(value) {
            if (this._isFinished) {
              return Promise.resolve({ value, done: true });
            }
            this._isFinished = true;
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("finish iterating"));
            }
            if (!this._preventCancel) {
              const result = ReadableStreamReaderGenericCancel(reader, value);
              ReadableStreamReaderGenericRelease(reader);
              return transformPromiseWith(result, () => ({ value, done: true }));
            }
            ReadableStreamReaderGenericRelease(reader);
            return promiseResolvedWith({ value, done: true });
          }
        }
        const ReadableStreamAsyncIteratorPrototype = {
          next() {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("next"));
            }
            return this._asyncIteratorImpl.next();
          },
          return(value) {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("return"));
            }
            return this._asyncIteratorImpl.return(value);
          }
        };
        if (AsyncIteratorPrototype !== void 0) {
          Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
        }
        function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
          const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
          iterator._asyncIteratorImpl = impl;
          return iterator;
        }
        function IsReadableStreamAsyncIterator(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_asyncIteratorImpl")) {
            return false;
          }
          try {
            return x._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl;
          } catch (_a) {
            return false;
          }
        }
        function streamAsyncIteratorBrandCheckException(name) {
          return new TypeError(`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`);
        }
        const NumberIsNaN = Number.isNaN || function(x) {
          return x !== x;
        };
        function CreateArrayFromList(elements) {
          return elements.slice();
        }
        function CopyDataBlockBytes(dest, destOffset, src2, srcOffset, n) {
          new Uint8Array(dest).set(new Uint8Array(src2, srcOffset, n), destOffset);
        }
        function TransferArrayBuffer(O) {
          return O;
        }
        function IsDetachedBuffer(O) {
          return false;
        }
        function ArrayBufferSlice(buffer, begin, end) {
          if (buffer.slice) {
            return buffer.slice(begin, end);
          }
          const length = end - begin;
          const slice = new ArrayBuffer(length);
          CopyDataBlockBytes(slice, 0, buffer, begin, length);
          return slice;
        }
        function IsNonNegativeNumber(v) {
          if (typeof v !== "number") {
            return false;
          }
          if (NumberIsNaN(v)) {
            return false;
          }
          if (v < 0) {
            return false;
          }
          return true;
        }
        function CloneAsUint8Array(O) {
          const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength);
          return new Uint8Array(buffer);
        }
        function DequeueValue(container) {
          const pair = container._queue.shift();
          container._queueTotalSize -= pair.size;
          if (container._queueTotalSize < 0) {
            container._queueTotalSize = 0;
          }
          return pair.value;
        }
        function EnqueueValueWithSize(container, value, size) {
          if (!IsNonNegativeNumber(size) || size === Infinity) {
            throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
          }
          container._queue.push({ value, size });
          container._queueTotalSize += size;
        }
        function PeekQueueValue(container) {
          const pair = container._queue.peek();
          return pair.value;
        }
        function ResetQueue(container) {
          container._queue = new SimpleQueue();
          container._queueTotalSize = 0;
        }
        class ReadableStreamBYOBRequest {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get view() {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("view");
            }
            return this._view;
          }
          respond(bytesWritten) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respond");
            }
            assertRequiredArgument(bytesWritten, 1, "respond");
            bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, "First parameter");
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(this._view.buffer))
              ;
            ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
          }
          respondWithNewView(view) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respondWithNewView");
            }
            assertRequiredArgument(view, 1, "respondWithNewView");
            if (!ArrayBuffer.isView(view)) {
              throw new TypeError("You can only respond with array buffer views");
            }
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
          }
        }
        Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
          respond: { enumerable: true },
          respondWithNewView: { enumerable: true },
          view: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBRequest.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBRequest",
            configurable: true
          });
        }
        class ReadableByteStreamController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get byobRequest() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("byobRequest");
            }
            return ReadableByteStreamControllerGetBYOBRequest(this);
          }
          get desiredSize() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("desiredSize");
            }
            return ReadableByteStreamControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("close");
            }
            if (this._closeRequested) {
              throw new TypeError("The stream has already been closed; do not close it again!");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be closed`);
            }
            ReadableByteStreamControllerClose(this);
          }
          enqueue(chunk) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("enqueue");
            }
            assertRequiredArgument(chunk, 1, "enqueue");
            if (!ArrayBuffer.isView(chunk)) {
              throw new TypeError("chunk must be an array buffer view");
            }
            if (chunk.byteLength === 0) {
              throw new TypeError("chunk must have non-zero byteLength");
            }
            if (chunk.buffer.byteLength === 0) {
              throw new TypeError(`chunk's buffer must have non-zero byteLength`);
            }
            if (this._closeRequested) {
              throw new TypeError("stream is closed or draining");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`);
            }
            ReadableByteStreamControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("error");
            }
            ReadableByteStreamControllerError(this, e);
          }
          [CancelSteps](reason) {
            ReadableByteStreamControllerClearPendingPullIntos(this);
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableByteStreamControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableByteStream;
            if (this._queueTotalSize > 0) {
              const entry = this._queue.shift();
              this._queueTotalSize -= entry.byteLength;
              ReadableByteStreamControllerHandleQueueDrain(this);
              const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
              readRequest._chunkSteps(view);
              return;
            }
            const autoAllocateChunkSize = this._autoAllocateChunkSize;
            if (autoAllocateChunkSize !== void 0) {
              let buffer;
              try {
                buffer = new ArrayBuffer(autoAllocateChunkSize);
              } catch (bufferE) {
                readRequest._errorSteps(bufferE);
                return;
              }
              const pullIntoDescriptor = {
                buffer,
                bufferByteLength: autoAllocateChunkSize,
                byteOffset: 0,
                byteLength: autoAllocateChunkSize,
                bytesFilled: 0,
                elementSize: 1,
                viewConstructor: Uint8Array,
                readerType: "default"
              };
              this._pendingPullIntos.push(pullIntoDescriptor);
            }
            ReadableStreamAddReadRequest(stream, readRequest);
            ReadableByteStreamControllerCallPullIfNeeded(this);
          }
        }
        Object.defineProperties(ReadableByteStreamController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          byobRequest: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableByteStreamController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableByteStreamController",
            configurable: true
          });
        }
        function IsReadableByteStreamController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableByteStream")) {
            return false;
          }
          return x instanceof ReadableByteStreamController;
        }
        function IsReadableStreamBYOBRequest(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_associatedReadableByteStreamController")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBRequest;
        }
        function ReadableByteStreamControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableByteStreamControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableByteStreamControllerError(controller, e);
          });
        }
        function ReadableByteStreamControllerClearPendingPullIntos(controller) {
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          controller._pendingPullIntos = new SimpleQueue();
        }
        function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
          let done = false;
          if (stream._state === "closed") {
            done = true;
          }
          const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
          if (pullIntoDescriptor.readerType === "default") {
            ReadableStreamFulfillReadRequest(stream, filledView, done);
          } else {
            ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
          }
        }
        function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
          const bytesFilled = pullIntoDescriptor.bytesFilled;
          const elementSize = pullIntoDescriptor.elementSize;
          return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
        }
        function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
          controller._queue.push({ buffer, byteOffset, byteLength });
          controller._queueTotalSize += byteLength;
        }
        function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
          const elementSize = pullIntoDescriptor.elementSize;
          const currentAlignedBytes = pullIntoDescriptor.bytesFilled - pullIntoDescriptor.bytesFilled % elementSize;
          const maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
          const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
          const maxAlignedBytes = maxBytesFilled - maxBytesFilled % elementSize;
          let totalBytesToCopyRemaining = maxBytesToCopy;
          let ready = false;
          if (maxAlignedBytes > currentAlignedBytes) {
            totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
            ready = true;
          }
          const queue = controller._queue;
          while (totalBytesToCopyRemaining > 0) {
            const headOfQueue = queue.peek();
            const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
            const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
            if (headOfQueue.byteLength === bytesToCopy) {
              queue.shift();
            } else {
              headOfQueue.byteOffset += bytesToCopy;
              headOfQueue.byteLength -= bytesToCopy;
            }
            controller._queueTotalSize -= bytesToCopy;
            ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
            totalBytesToCopyRemaining -= bytesToCopy;
          }
          return ready;
        }
        function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
          pullIntoDescriptor.bytesFilled += size;
        }
        function ReadableByteStreamControllerHandleQueueDrain(controller) {
          if (controller._queueTotalSize === 0 && controller._closeRequested) {
            ReadableByteStreamControllerClearAlgorithms(controller);
            ReadableStreamClose(controller._controlledReadableByteStream);
          } else {
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }
        }
        function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
          if (controller._byobRequest === null) {
            return;
          }
          controller._byobRequest._associatedReadableByteStreamController = void 0;
          controller._byobRequest._view = null;
          controller._byobRequest = null;
        }
        function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
          while (controller._pendingPullIntos.length > 0) {
            if (controller._queueTotalSize === 0) {
              return;
            }
            const pullIntoDescriptor = controller._pendingPullIntos.peek();
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
          const stream = controller._controlledReadableByteStream;
          let elementSize = 1;
          if (view.constructor !== DataView) {
            elementSize = view.constructor.BYTES_PER_ELEMENT;
          }
          const ctor = view.constructor;
          const buffer = TransferArrayBuffer(view.buffer);
          const pullIntoDescriptor = {
            buffer,
            bufferByteLength: buffer.byteLength,
            byteOffset: view.byteOffset,
            byteLength: view.byteLength,
            bytesFilled: 0,
            elementSize,
            viewConstructor: ctor,
            readerType: "byob"
          };
          if (controller._pendingPullIntos.length > 0) {
            controller._pendingPullIntos.push(pullIntoDescriptor);
            ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
            return;
          }
          if (stream._state === "closed") {
            const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
            readIntoRequest._closeSteps(emptyView);
            return;
          }
          if (controller._queueTotalSize > 0) {
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
              ReadableByteStreamControllerHandleQueueDrain(controller);
              readIntoRequest._chunkSteps(filledView);
              return;
            }
            if (controller._closeRequested) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              readIntoRequest._errorSteps(e);
              return;
            }
          }
          controller._pendingPullIntos.push(pullIntoDescriptor);
          ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
          const stream = controller._controlledReadableByteStream;
          if (ReadableStreamHasBYOBReader(stream)) {
            while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
              const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
          ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
          if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
            return;
          }
          ReadableByteStreamControllerShiftPendingPullInto(controller);
          const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
          if (remainderSize > 0) {
            const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            const remainder = ArrayBufferSlice(pullIntoDescriptor.buffer, end - remainderSize, end);
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
          }
          pullIntoDescriptor.bytesFilled -= remainderSize;
          ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
          ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
        }
        function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            ReadableByteStreamControllerRespondInClosedState(controller);
          } else {
            ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerShiftPendingPullInto(controller) {
          const descriptor = controller._pendingPullIntos.shift();
          return descriptor;
        }
        function ReadableByteStreamControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return false;
          }
          if (controller._closeRequested) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableByteStreamControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
        }
        function ReadableByteStreamControllerClose(controller) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          if (controller._queueTotalSize > 0) {
            controller._closeRequested = true;
            return;
          }
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (firstPendingPullInto.bytesFilled > 0) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              throw e;
            }
          }
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamClose(stream);
        }
        function ReadableByteStreamControllerEnqueue(controller, chunk) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          const buffer = chunk.buffer;
          const byteOffset = chunk.byteOffset;
          const byteLength = chunk.byteLength;
          const transferredBuffer = TransferArrayBuffer(buffer);
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (IsDetachedBuffer(firstPendingPullInto.buffer))
              ;
            firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
          }
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          if (ReadableStreamHasDefaultReader(stream)) {
            if (ReadableStreamGetNumReadRequests(stream) === 0) {
              ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            } else {
              const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
              ReadableStreamFulfillReadRequest(stream, transferredView, false);
            }
          } else if (ReadableStreamHasBYOBReader(stream)) {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
          } else {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerError(controller, e) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return;
          }
          ReadableByteStreamControllerClearPendingPullIntos(controller);
          ResetQueue(controller);
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableByteStreamControllerGetBYOBRequest(controller) {
          if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
            const firstDescriptor = controller._pendingPullIntos.peek();
            const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
            const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
            SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
            controller._byobRequest = byobRequest;
          }
          return controller._byobRequest;
        }
        function ReadableByteStreamControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableByteStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableByteStreamControllerRespond(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (bytesWritten !== 0) {
              throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
            }
          } else {
            if (bytesWritten === 0) {
              throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
            }
            if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
              throw new RangeError("bytesWritten out of range");
            }
          }
          firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
          ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
        }
        function ReadableByteStreamControllerRespondWithNewView(controller, view) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (view.byteLength !== 0) {
              throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
            }
          } else {
            if (view.byteLength === 0) {
              throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
            }
          }
          if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
            throw new RangeError("The region specified by view does not match byobRequest");
          }
          if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
            throw new RangeError("The buffer of view has different capacity than byobRequest");
          }
          if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
            throw new RangeError("The region specified by view is larger than byobRequest");
          }
          firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
          ReadableByteStreamControllerRespondInternal(controller, view.byteLength);
        }
        function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
          controller._controlledReadableByteStream = stream;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._byobRequest = null;
          controller._queue = controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._closeRequested = false;
          controller._started = false;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          controller._autoAllocateChunkSize = autoAllocateChunkSize;
          controller._pendingPullIntos = new SimpleQueue();
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableByteStreamControllerError(controller, r);
          });
        }
        function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
          const controller = Object.create(ReadableByteStreamController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingByteSource.start !== void 0) {
            startAlgorithm = () => underlyingByteSource.start(controller);
          }
          if (underlyingByteSource.pull !== void 0) {
            pullAlgorithm = () => underlyingByteSource.pull(controller);
          }
          if (underlyingByteSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason);
          }
          const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
          if (autoAllocateChunkSize === 0) {
            throw new TypeError("autoAllocateChunkSize must be greater than 0");
          }
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
        }
        function SetUpReadableStreamBYOBRequest(request, controller, view) {
          request._associatedReadableByteStreamController = controller;
          request._view = view;
        }
        function byobRequestBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`);
        }
        function byteStreamControllerBrandCheckException(name) {
          return new TypeError(`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`);
        }
        function AcquireReadableStreamBYOBReader(stream) {
          return new ReadableStreamBYOBReader(stream);
        }
        function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
          stream._reader._readIntoRequests.push(readIntoRequest);
        }
        function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readIntoRequest = reader._readIntoRequests.shift();
          if (done) {
            readIntoRequest._closeSteps(chunk);
          } else {
            readIntoRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadIntoRequests(stream) {
          return stream._reader._readIntoRequests.length;
        }
        function ReadableStreamHasBYOBReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamBYOBReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamBYOBReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamBYOBReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            if (!IsReadableByteStreamController(stream._readableStreamController)) {
              throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readIntoRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read(view) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("read"));
            }
            if (!ArrayBuffer.isView(view)) {
              return promiseRejectedWith(new TypeError("view must be an array buffer view"));
            }
            if (view.byteLength === 0) {
              return promiseRejectedWith(new TypeError("view must have non-zero byteLength"));
            }
            if (view.buffer.byteLength === 0) {
              return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`));
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readIntoRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamBYOBReader(this)) {
              throw byobReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readIntoRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamBYOBReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBReader",
            configurable: true
          });
        }
        function IsReadableStreamBYOBReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readIntoRequests")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBReader;
        }
        function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "errored") {
            readIntoRequest._errorSteps(stream._storedError);
          } else {
            ReadableByteStreamControllerPullInto(stream._readableStreamController, view, readIntoRequest);
          }
        }
        function byobReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`);
        }
        function ExtractHighWaterMark(strategy, defaultHWM) {
          const { highWaterMark } = strategy;
          if (highWaterMark === void 0) {
            return defaultHWM;
          }
          if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
            throw new RangeError("Invalid highWaterMark");
          }
          return highWaterMark;
        }
        function ExtractSizeAlgorithm(strategy) {
          const { size } = strategy;
          if (!size) {
            return () => 1;
          }
          return size;
        }
        function convertQueuingStrategy(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          const size = init2 === null || init2 === void 0 ? void 0 : init2.size;
          return {
            highWaterMark: highWaterMark === void 0 ? void 0 : convertUnrestrictedDouble(highWaterMark),
            size: size === void 0 ? void 0 : convertQueuingStrategySize(size, `${context} has member 'size' that`)
          };
        }
        function convertQueuingStrategySize(fn, context) {
          assertFunction(fn, context);
          return (chunk) => convertUnrestrictedDouble(fn(chunk));
        }
        function convertUnderlyingSink(original, context) {
          assertDictionary(original, context);
          const abort = original === null || original === void 0 ? void 0 : original.abort;
          const close = original === null || original === void 0 ? void 0 : original.close;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          const write = original === null || original === void 0 ? void 0 : original.write;
          return {
            abort: abort === void 0 ? void 0 : convertUnderlyingSinkAbortCallback(abort, original, `${context} has member 'abort' that`),
            close: close === void 0 ? void 0 : convertUnderlyingSinkCloseCallback(close, original, `${context} has member 'close' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSinkStartCallback(start, original, `${context} has member 'start' that`),
            write: write === void 0 ? void 0 : convertUnderlyingSinkWriteCallback(write, original, `${context} has member 'write' that`),
            type
          };
        }
        function convertUnderlyingSinkAbortCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSinkCloseCallback(fn, original, context) {
          assertFunction(fn, context);
          return () => promiseCall(fn, original, []);
        }
        function convertUnderlyingSinkStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertUnderlyingSinkWriteCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        function assertWritableStream(x, context) {
          if (!IsWritableStream(x)) {
            throw new TypeError(`${context} is not a WritableStream.`);
          }
        }
        function isAbortSignal2(value) {
          if (typeof value !== "object" || value === null) {
            return false;
          }
          try {
            return typeof value.aborted === "boolean";
          } catch (_a) {
            return false;
          }
        }
        const supportsAbortController = typeof AbortController === "function";
        function createAbortController() {
          if (supportsAbortController) {
            return new AbortController();
          }
          return void 0;
        }
        class WritableStream {
          constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
            if (rawUnderlyingSink === void 0) {
              rawUnderlyingSink = null;
            } else {
              assertObject(rawUnderlyingSink, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, "First parameter");
            InitializeWritableStream(this);
            const type = underlyingSink.type;
            if (type !== void 0) {
              throw new RangeError("Invalid type is specified");
            }
            const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
            const highWaterMark = ExtractHighWaterMark(strategy, 1);
            SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
          }
          get locked() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("locked");
            }
            return IsWritableStreamLocked(this);
          }
          abort(reason = void 0) {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("abort"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot abort a stream that already has a writer"));
            }
            return WritableStreamAbort(this, reason);
          }
          close() {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("close"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot close a stream that already has a writer"));
            }
            if (WritableStreamCloseQueuedOrInFlight(this)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamClose(this);
          }
          getWriter() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("getWriter");
            }
            return AcquireWritableStreamDefaultWriter(this);
          }
        }
        Object.defineProperties(WritableStream.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          getWriter: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStream.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStream",
            configurable: true
          });
        }
        function AcquireWritableStreamDefaultWriter(stream) {
          return new WritableStreamDefaultWriter(stream);
        }
        function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(WritableStream.prototype);
          InitializeWritableStream(stream);
          const controller = Object.create(WritableStreamDefaultController.prototype);
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function InitializeWritableStream(stream) {
          stream._state = "writable";
          stream._storedError = void 0;
          stream._writer = void 0;
          stream._writableStreamController = void 0;
          stream._writeRequests = new SimpleQueue();
          stream._inFlightWriteRequest = void 0;
          stream._closeRequest = void 0;
          stream._inFlightCloseRequest = void 0;
          stream._pendingAbortRequest = void 0;
          stream._backpressure = false;
        }
        function IsWritableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_writableStreamController")) {
            return false;
          }
          return x instanceof WritableStream;
        }
        function IsWritableStreamLocked(stream) {
          if (stream._writer === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamAbort(stream, reason) {
          var _a;
          if (stream._state === "closed" || stream._state === "errored") {
            return promiseResolvedWith(void 0);
          }
          stream._writableStreamController._abortReason = reason;
          (_a = stream._writableStreamController._abortController) === null || _a === void 0 ? void 0 : _a.abort();
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseResolvedWith(void 0);
          }
          if (stream._pendingAbortRequest !== void 0) {
            return stream._pendingAbortRequest._promise;
          }
          let wasAlreadyErroring = false;
          if (state === "erroring") {
            wasAlreadyErroring = true;
            reason = void 0;
          }
          const promise = newPromise((resolve2, reject) => {
            stream._pendingAbortRequest = {
              _promise: void 0,
              _resolve: resolve2,
              _reject: reject,
              _reason: reason,
              _wasAlreadyErroring: wasAlreadyErroring
            };
          });
          stream._pendingAbortRequest._promise = promise;
          if (!wasAlreadyErroring) {
            WritableStreamStartErroring(stream, reason);
          }
          return promise;
        }
        function WritableStreamClose(stream) {
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseRejectedWith(new TypeError(`The stream (in ${state} state) is not in the writable state and cannot be closed`));
          }
          const promise = newPromise((resolve2, reject) => {
            const closeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._closeRequest = closeRequest;
          });
          const writer = stream._writer;
          if (writer !== void 0 && stream._backpressure && state === "writable") {
            defaultWriterReadyPromiseResolve(writer);
          }
          WritableStreamDefaultControllerClose(stream._writableStreamController);
          return promise;
        }
        function WritableStreamAddWriteRequest(stream) {
          const promise = newPromise((resolve2, reject) => {
            const writeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._writeRequests.push(writeRequest);
          });
          return promise;
        }
        function WritableStreamDealWithRejection(stream, error2) {
          const state = stream._state;
          if (state === "writable") {
            WritableStreamStartErroring(stream, error2);
            return;
          }
          WritableStreamFinishErroring(stream);
        }
        function WritableStreamStartErroring(stream, reason) {
          const controller = stream._writableStreamController;
          stream._state = "erroring";
          stream._storedError = reason;
          const writer = stream._writer;
          if (writer !== void 0) {
            WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
          }
          if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
            WritableStreamFinishErroring(stream);
          }
        }
        function WritableStreamFinishErroring(stream) {
          stream._state = "errored";
          stream._writableStreamController[ErrorSteps]();
          const storedError = stream._storedError;
          stream._writeRequests.forEach((writeRequest) => {
            writeRequest._reject(storedError);
          });
          stream._writeRequests = new SimpleQueue();
          if (stream._pendingAbortRequest === void 0) {
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const abortRequest = stream._pendingAbortRequest;
          stream._pendingAbortRequest = void 0;
          if (abortRequest._wasAlreadyErroring) {
            abortRequest._reject(storedError);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
          uponPromise(promise, () => {
            abortRequest._resolve();
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          }, (reason) => {
            abortRequest._reject(reason);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          });
        }
        function WritableStreamFinishInFlightWrite(stream) {
          stream._inFlightWriteRequest._resolve(void 0);
          stream._inFlightWriteRequest = void 0;
        }
        function WritableStreamFinishInFlightWriteWithError(stream, error2) {
          stream._inFlightWriteRequest._reject(error2);
          stream._inFlightWriteRequest = void 0;
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamFinishInFlightClose(stream) {
          stream._inFlightCloseRequest._resolve(void 0);
          stream._inFlightCloseRequest = void 0;
          const state = stream._state;
          if (state === "erroring") {
            stream._storedError = void 0;
            if (stream._pendingAbortRequest !== void 0) {
              stream._pendingAbortRequest._resolve();
              stream._pendingAbortRequest = void 0;
            }
          }
          stream._state = "closed";
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseResolve(writer);
          }
        }
        function WritableStreamFinishInFlightCloseWithError(stream, error2) {
          stream._inFlightCloseRequest._reject(error2);
          stream._inFlightCloseRequest = void 0;
          if (stream._pendingAbortRequest !== void 0) {
            stream._pendingAbortRequest._reject(error2);
            stream._pendingAbortRequest = void 0;
          }
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamCloseQueuedOrInFlight(stream) {
          if (stream._closeRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamHasOperationMarkedInFlight(stream) {
          if (stream._inFlightWriteRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamMarkCloseRequestInFlight(stream) {
          stream._inFlightCloseRequest = stream._closeRequest;
          stream._closeRequest = void 0;
        }
        function WritableStreamMarkFirstWriteRequestInFlight(stream) {
          stream._inFlightWriteRequest = stream._writeRequests.shift();
        }
        function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
          if (stream._closeRequest !== void 0) {
            stream._closeRequest._reject(stream._storedError);
            stream._closeRequest = void 0;
          }
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseReject(writer, stream._storedError);
          }
        }
        function WritableStreamUpdateBackpressure(stream, backpressure) {
          const writer = stream._writer;
          if (writer !== void 0 && backpressure !== stream._backpressure) {
            if (backpressure) {
              defaultWriterReadyPromiseReset(writer);
            } else {
              defaultWriterReadyPromiseResolve(writer);
            }
          }
          stream._backpressure = backpressure;
        }
        class WritableStreamDefaultWriter {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "WritableStreamDefaultWriter");
            assertWritableStream(stream, "First parameter");
            if (IsWritableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive writing by another writer");
            }
            this._ownerWritableStream = stream;
            stream._writer = this;
            const state = stream._state;
            if (state === "writable") {
              if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
                defaultWriterReadyPromiseInitialize(this);
              } else {
                defaultWriterReadyPromiseInitializeAsResolved(this);
              }
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "erroring") {
              defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "closed") {
              defaultWriterReadyPromiseInitializeAsResolved(this);
              defaultWriterClosedPromiseInitializeAsResolved(this);
            } else {
              const storedError = stream._storedError;
              defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
              defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
            }
          }
          get closed() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          get desiredSize() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("desiredSize");
            }
            if (this._ownerWritableStream === void 0) {
              throw defaultWriterLockException("desiredSize");
            }
            return WritableStreamDefaultWriterGetDesiredSize(this);
          }
          get ready() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("ready"));
            }
            return this._readyPromise;
          }
          abort(reason = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("abort"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("abort"));
            }
            return WritableStreamDefaultWriterAbort(this, reason);
          }
          close() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("close"));
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("close"));
            }
            if (WritableStreamCloseQueuedOrInFlight(stream)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamDefaultWriterClose(this);
          }
          releaseLock() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("releaseLock");
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return;
            }
            WritableStreamDefaultWriterRelease(this);
          }
          write(chunk = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("write"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("write to"));
            }
            return WritableStreamDefaultWriterWrite(this, chunk);
          }
        }
        Object.defineProperties(WritableStreamDefaultWriter.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          releaseLock: { enumerable: true },
          write: { enumerable: true },
          closed: { enumerable: true },
          desiredSize: { enumerable: true },
          ready: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultWriter.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultWriter",
            configurable: true
          });
        }
        function IsWritableStreamDefaultWriter(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_ownerWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultWriter;
        }
        function WritableStreamDefaultWriterAbort(writer, reason) {
          const stream = writer._ownerWritableStream;
          return WritableStreamAbort(stream, reason);
        }
        function WritableStreamDefaultWriterClose(writer) {
          const stream = writer._ownerWritableStream;
          return WritableStreamClose(stream);
        }
        function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          return WritableStreamDefaultWriterClose(writer);
        }
        function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error2) {
          if (writer._closedPromiseState === "pending") {
            defaultWriterClosedPromiseReject(writer, error2);
          } else {
            defaultWriterClosedPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error2) {
          if (writer._readyPromiseState === "pending") {
            defaultWriterReadyPromiseReject(writer, error2);
          } else {
            defaultWriterReadyPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterGetDesiredSize(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (state === "errored" || state === "erroring") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
        }
        function WritableStreamDefaultWriterRelease(writer) {
          const stream = writer._ownerWritableStream;
          const releasedError = new TypeError(`Writer was released and can no longer be used to monitor the stream's closedness`);
          WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
          WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
          stream._writer = void 0;
          writer._ownerWritableStream = void 0;
        }
        function WritableStreamDefaultWriterWrite(writer, chunk) {
          const stream = writer._ownerWritableStream;
          const controller = stream._writableStreamController;
          const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
          if (stream !== writer._ownerWritableStream) {
            return promiseRejectedWith(defaultWriterLockException("write to"));
          }
          const state = stream._state;
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseRejectedWith(new TypeError("The stream is closing or closed and cannot be written to"));
          }
          if (state === "erroring") {
            return promiseRejectedWith(stream._storedError);
          }
          const promise = WritableStreamAddWriteRequest(stream);
          WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
          return promise;
        }
        const closeSentinel = {};
        class WritableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get abortReason() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("abortReason");
            }
            return this._abortReason;
          }
          get signal() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("signal");
            }
            if (this._abortController === void 0) {
              throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
            }
            return this._abortController.signal;
          }
          error(e = void 0) {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("error");
            }
            const state = this._controlledWritableStream._state;
            if (state !== "writable") {
              return;
            }
            WritableStreamDefaultControllerError(this, e);
          }
          [AbortSteps](reason) {
            const result = this._abortAlgorithm(reason);
            WritableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [ErrorSteps]() {
            ResetQueue(this);
          }
        }
        Object.defineProperties(WritableStreamDefaultController.prototype, {
          error: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultController",
            configurable: true
          });
        }
        function IsWritableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultController;
        }
        function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledWritableStream = stream;
          stream._writableStreamController = controller;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._abortReason = void 0;
          controller._abortController = createAbortController();
          controller._started = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._writeAlgorithm = writeAlgorithm;
          controller._closeAlgorithm = closeAlgorithm;
          controller._abortAlgorithm = abortAlgorithm;
          const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
          WritableStreamUpdateBackpressure(stream, backpressure);
          const startResult = startAlgorithm();
          const startPromise = promiseResolvedWith(startResult);
          uponPromise(startPromise, () => {
            controller._started = true;
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (r) => {
            controller._started = true;
            WritableStreamDealWithRejection(stream, r);
          });
        }
        function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(WritableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let writeAlgorithm = () => promiseResolvedWith(void 0);
          let closeAlgorithm = () => promiseResolvedWith(void 0);
          let abortAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSink.start !== void 0) {
            startAlgorithm = () => underlyingSink.start(controller);
          }
          if (underlyingSink.write !== void 0) {
            writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller);
          }
          if (underlyingSink.close !== void 0) {
            closeAlgorithm = () => underlyingSink.close();
          }
          if (underlyingSink.abort !== void 0) {
            abortAlgorithm = (reason) => underlyingSink.abort(reason);
          }
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function WritableStreamDefaultControllerClearAlgorithms(controller) {
          controller._writeAlgorithm = void 0;
          controller._closeAlgorithm = void 0;
          controller._abortAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function WritableStreamDefaultControllerClose(controller) {
          EnqueueValueWithSize(controller, closeSentinel, 0);
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
          try {
            return controller._strategySizeAlgorithm(chunk);
          } catch (chunkSizeE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
            return 1;
          }
        }
        function WritableStreamDefaultControllerGetDesiredSize(controller) {
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
          try {
            EnqueueValueWithSize(controller, chunk, chunkSize);
          } catch (enqueueE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
            return;
          }
          const stream = controller._controlledWritableStream;
          if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === "writable") {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
            WritableStreamUpdateBackpressure(stream, backpressure);
          }
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
          const stream = controller._controlledWritableStream;
          if (!controller._started) {
            return;
          }
          if (stream._inFlightWriteRequest !== void 0) {
            return;
          }
          const state = stream._state;
          if (state === "erroring") {
            WritableStreamFinishErroring(stream);
            return;
          }
          if (controller._queue.length === 0) {
            return;
          }
          const value = PeekQueueValue(controller);
          if (value === closeSentinel) {
            WritableStreamDefaultControllerProcessClose(controller);
          } else {
            WritableStreamDefaultControllerProcessWrite(controller, value);
          }
        }
        function WritableStreamDefaultControllerErrorIfNeeded(controller, error2) {
          if (controller._controlledWritableStream._state === "writable") {
            WritableStreamDefaultControllerError(controller, error2);
          }
        }
        function WritableStreamDefaultControllerProcessClose(controller) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkCloseRequestInFlight(stream);
          DequeueValue(controller);
          const sinkClosePromise = controller._closeAlgorithm();
          WritableStreamDefaultControllerClearAlgorithms(controller);
          uponPromise(sinkClosePromise, () => {
            WritableStreamFinishInFlightClose(stream);
          }, (reason) => {
            WritableStreamFinishInFlightCloseWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkFirstWriteRequestInFlight(stream);
          const sinkWritePromise = controller._writeAlgorithm(chunk);
          uponPromise(sinkWritePromise, () => {
            WritableStreamFinishInFlightWrite(stream);
            const state = stream._state;
            DequeueValue(controller);
            if (!WritableStreamCloseQueuedOrInFlight(stream) && state === "writable") {
              const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
              WritableStreamUpdateBackpressure(stream, backpressure);
            }
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (reason) => {
            if (stream._state === "writable") {
              WritableStreamDefaultControllerClearAlgorithms(controller);
            }
            WritableStreamFinishInFlightWriteWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerGetBackpressure(controller) {
          const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
          return desiredSize <= 0;
        }
        function WritableStreamDefaultControllerError(controller, error2) {
          const stream = controller._controlledWritableStream;
          WritableStreamDefaultControllerClearAlgorithms(controller);
          WritableStreamStartErroring(stream, error2);
        }
        function streamBrandCheckException$2(name) {
          return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`);
        }
        function defaultControllerBrandCheckException$2(name) {
          return new TypeError(`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`);
        }
        function defaultWriterBrandCheckException(name) {
          return new TypeError(`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`);
        }
        function defaultWriterLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released writer");
        }
        function defaultWriterClosedPromiseInitialize(writer) {
          writer._closedPromise = newPromise((resolve2, reject) => {
            writer._closedPromise_resolve = resolve2;
            writer._closedPromise_reject = reject;
            writer._closedPromiseState = "pending";
          });
        }
        function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseReject(writer, reason);
        }
        function defaultWriterClosedPromiseInitializeAsResolved(writer) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseResolve(writer);
        }
        function defaultWriterClosedPromiseReject(writer, reason) {
          if (writer._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._closedPromise);
          writer._closedPromise_reject(reason);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "rejected";
        }
        function defaultWriterClosedPromiseResetToRejected(writer, reason) {
          defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterClosedPromiseResolve(writer) {
          if (writer._closedPromise_resolve === void 0) {
            return;
          }
          writer._closedPromise_resolve(void 0);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "resolved";
        }
        function defaultWriterReadyPromiseInitialize(writer) {
          writer._readyPromise = newPromise((resolve2, reject) => {
            writer._readyPromise_resolve = resolve2;
            writer._readyPromise_reject = reject;
          });
          writer._readyPromiseState = "pending";
        }
        function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseReject(writer, reason);
        }
        function defaultWriterReadyPromiseInitializeAsResolved(writer) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseResolve(writer);
        }
        function defaultWriterReadyPromiseReject(writer, reason) {
          if (writer._readyPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._readyPromise);
          writer._readyPromise_reject(reason);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "rejected";
        }
        function defaultWriterReadyPromiseReset(writer) {
          defaultWriterReadyPromiseInitialize(writer);
        }
        function defaultWriterReadyPromiseResetToRejected(writer, reason) {
          defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterReadyPromiseResolve(writer) {
          if (writer._readyPromise_resolve === void 0) {
            return;
          }
          writer._readyPromise_resolve(void 0);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "fulfilled";
        }
        const NativeDOMException = typeof DOMException !== "undefined" ? DOMException : void 0;
        function isDOMExceptionConstructor(ctor) {
          if (!(typeof ctor === "function" || typeof ctor === "object")) {
            return false;
          }
          try {
            new ctor();
            return true;
          } catch (_a) {
            return false;
          }
        }
        function createDOMExceptionPolyfill() {
          const ctor = function DOMException2(message, name) {
            this.message = message || "";
            this.name = name || "Error";
            if (Error.captureStackTrace) {
              Error.captureStackTrace(this, this.constructor);
            }
          };
          ctor.prototype = Object.create(Error.prototype);
          Object.defineProperty(ctor.prototype, "constructor", { value: ctor, writable: true, configurable: true });
          return ctor;
        }
        const DOMException$1 = isDOMExceptionConstructor(NativeDOMException) ? NativeDOMException : createDOMExceptionPolyfill();
        function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
          const reader = AcquireReadableStreamDefaultReader(source);
          const writer = AcquireWritableStreamDefaultWriter(dest);
          source._disturbed = true;
          let shuttingDown = false;
          let currentWrite = promiseResolvedWith(void 0);
          return newPromise((resolve2, reject) => {
            let abortAlgorithm;
            if (signal !== void 0) {
              abortAlgorithm = () => {
                const error2 = new DOMException$1("Aborted", "AbortError");
                const actions = [];
                if (!preventAbort) {
                  actions.push(() => {
                    if (dest._state === "writable") {
                      return WritableStreamAbort(dest, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                if (!preventCancel) {
                  actions.push(() => {
                    if (source._state === "readable") {
                      return ReadableStreamCancel(source, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                shutdownWithAction(() => Promise.all(actions.map((action) => action())), true, error2);
              };
              if (signal.aborted) {
                abortAlgorithm();
                return;
              }
              signal.addEventListener("abort", abortAlgorithm);
            }
            function pipeLoop() {
              return newPromise((resolveLoop, rejectLoop) => {
                function next(done) {
                  if (done) {
                    resolveLoop();
                  } else {
                    PerformPromiseThen(pipeStep(), next, rejectLoop);
                  }
                }
                next(false);
              });
            }
            function pipeStep() {
              if (shuttingDown) {
                return promiseResolvedWith(true);
              }
              return PerformPromiseThen(writer._readyPromise, () => {
                return newPromise((resolveRead, rejectRead) => {
                  ReadableStreamDefaultReaderRead(reader, {
                    _chunkSteps: (chunk) => {
                      currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), void 0, noop2);
                      resolveRead(false);
                    },
                    _closeSteps: () => resolveRead(true),
                    _errorSteps: rejectRead
                  });
                });
              });
            }
            isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
              if (!preventAbort) {
                shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesClosed(source, reader._closedPromise, () => {
              if (!preventClose) {
                shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer));
              } else {
                shutdown();
              }
            });
            if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === "closed") {
              const destClosed = new TypeError("the destination writable stream closed before all data could be piped to it");
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed);
              } else {
                shutdown(true, destClosed);
              }
            }
            setPromiseIsHandledToTrue(pipeLoop());
            function waitForWritesToFinish() {
              const oldCurrentWrite = currentWrite;
              return PerformPromiseThen(currentWrite, () => oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : void 0);
            }
            function isOrBecomesErrored(stream, promise, action) {
              if (stream._state === "errored") {
                action(stream._storedError);
              } else {
                uponRejection(promise, action);
              }
            }
            function isOrBecomesClosed(stream, promise, action) {
              if (stream._state === "closed") {
                action();
              } else {
                uponFulfillment(promise, action);
              }
            }
            function shutdownWithAction(action, originalIsError, originalError) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), doTheRest);
              } else {
                doTheRest();
              }
              function doTheRest() {
                uponPromise(action(), () => finalize(originalIsError, originalError), (newError) => finalize(true, newError));
              }
            }
            function shutdown(isError, error2) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error2));
              } else {
                finalize(isError, error2);
              }
            }
            function finalize(isError, error2) {
              WritableStreamDefaultWriterRelease(writer);
              ReadableStreamReaderGenericRelease(reader);
              if (signal !== void 0) {
                signal.removeEventListener("abort", abortAlgorithm);
              }
              if (isError) {
                reject(error2);
              } else {
                resolve2(void 0);
              }
            }
          });
        }
        class ReadableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("desiredSize");
            }
            return ReadableStreamDefaultControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("close");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits close");
            }
            ReadableStreamDefaultControllerClose(this);
          }
          enqueue(chunk = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("enqueue");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits enqueue");
            }
            return ReadableStreamDefaultControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("error");
            }
            ReadableStreamDefaultControllerError(this, e);
          }
          [CancelSteps](reason) {
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableStream;
            if (this._queue.length > 0) {
              const chunk = DequeueValue(this);
              if (this._closeRequested && this._queue.length === 0) {
                ReadableStreamDefaultControllerClearAlgorithms(this);
                ReadableStreamClose(stream);
              } else {
                ReadableStreamDefaultControllerCallPullIfNeeded(this);
              }
              readRequest._chunkSteps(chunk);
            } else {
              ReadableStreamAddReadRequest(stream, readRequest);
              ReadableStreamDefaultControllerCallPullIfNeeded(this);
            }
          }
        }
        Object.defineProperties(ReadableStreamDefaultController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultController",
            configurable: true
          });
        }
        function IsReadableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableStream")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultController;
        }
        function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableStreamDefaultControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableStreamDefaultControllerError(controller, e);
          });
        }
        function ReadableStreamDefaultControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableStream;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableStreamDefaultControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function ReadableStreamDefaultControllerClose(controller) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          controller._closeRequested = true;
          if (controller._queue.length === 0) {
            ReadableStreamDefaultControllerClearAlgorithms(controller);
            ReadableStreamClose(stream);
          }
        }
        function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            ReadableStreamFulfillReadRequest(stream, chunk, false);
          } else {
            let chunkSize;
            try {
              chunkSize = controller._strategySizeAlgorithm(chunk);
            } catch (chunkSizeE) {
              ReadableStreamDefaultControllerError(controller, chunkSizeE);
              throw chunkSizeE;
            }
            try {
              EnqueueValueWithSize(controller, chunk, chunkSize);
            } catch (enqueueE) {
              ReadableStreamDefaultControllerError(controller, enqueueE);
              throw enqueueE;
            }
          }
          ReadableStreamDefaultControllerCallPullIfNeeded(controller);
        }
        function ReadableStreamDefaultControllerError(controller, e) {
          const stream = controller._controlledReadableStream;
          if (stream._state !== "readable") {
            return;
          }
          ResetQueue(controller);
          ReadableStreamDefaultControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableStreamDefaultControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableStreamDefaultControllerHasBackpressure(controller) {
          if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
            return false;
          }
          return true;
        }
        function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
          const state = controller._controlledReadableStream._state;
          if (!controller._closeRequested && state === "readable") {
            return true;
          }
          return false;
        }
        function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledReadableStream = stream;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._started = false;
          controller._closeRequested = false;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableStreamDefaultControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableStreamDefaultControllerError(controller, r);
          });
        }
        function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSource.start !== void 0) {
            startAlgorithm = () => underlyingSource.start(controller);
          }
          if (underlyingSource.pull !== void 0) {
            pullAlgorithm = () => underlyingSource.pull(controller);
          }
          if (underlyingSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingSource.cancel(reason);
          }
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function defaultControllerBrandCheckException$1(name) {
          return new TypeError(`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`);
        }
        function ReadableStreamTee(stream, cloneForBranch2) {
          if (IsReadableByteStreamController(stream._readableStreamController)) {
            return ReadableByteStreamTee(stream);
          }
          return ReadableStreamDefaultTee(stream);
        }
        function ReadableStreamDefaultTee(stream, cloneForBranch2) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function pullAlgorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  const chunk2 = chunk;
                  if (!canceled1) {
                    ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableStreamDefaultControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableStreamDefaultControllerClose(branch2._readableStreamController);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
          }
          branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
          branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
          uponRejection(reader._closedPromise, (r) => {
            ReadableStreamDefaultControllerError(branch1._readableStreamController, r);
            ReadableStreamDefaultControllerError(branch2._readableStreamController, r);
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(void 0);
            }
          });
          return [branch1, branch2];
        }
        function ReadableByteStreamTee(stream) {
          let reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function forwardReaderError(thisReader) {
            uponRejection(thisReader._closedPromise, (r) => {
              if (thisReader !== reader) {
                return;
              }
              ReadableByteStreamControllerError(branch1._readableStreamController, r);
              ReadableByteStreamControllerError(branch2._readableStreamController, r);
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            });
          }
          function pullWithDefaultReader() {
            if (IsReadableStreamBYOBReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamDefaultReader(stream);
              forwardReaderError(reader);
            }
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  let chunk2 = chunk;
                  if (!canceled1 && !canceled2) {
                    try {
                      chunk2 = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                  }
                  if (!canceled1) {
                    ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableByteStreamControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableByteStreamControllerClose(branch2._readableStreamController);
                }
                if (branch1._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
                }
                if (branch2._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
          }
          function pullWithBYOBReader(view, forBranch2) {
            if (IsReadableStreamDefaultReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamBYOBReader(stream);
              forwardReaderError(reader);
            }
            const byobBranch = forBranch2 ? branch2 : branch1;
            const otherBranch = forBranch2 ? branch1 : branch2;
            const readIntoRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const byobCanceled = forBranch2 ? canceled2 : canceled1;
                  const otherCanceled = forBranch2 ? canceled1 : canceled2;
                  if (!otherCanceled) {
                    let clonedChunk;
                    try {
                      clonedChunk = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                    if (!byobCanceled) {
                      ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                    }
                    ReadableByteStreamControllerEnqueue(otherBranch._readableStreamController, clonedChunk);
                  } else if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                });
              },
              _closeSteps: (chunk) => {
                reading = false;
                const byobCanceled = forBranch2 ? canceled2 : canceled1;
                const otherCanceled = forBranch2 ? canceled1 : canceled2;
                if (!byobCanceled) {
                  ReadableByteStreamControllerClose(byobBranch._readableStreamController);
                }
                if (!otherCanceled) {
                  ReadableByteStreamControllerClose(otherBranch._readableStreamController);
                }
                if (chunk !== void 0) {
                  if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                  if (!otherCanceled && otherBranch._readableStreamController._pendingPullIntos.length > 0) {
                    ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
                  }
                }
                if (!byobCanceled || !otherCanceled) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamBYOBReaderRead(reader, view, readIntoRequest);
          }
          function pull1Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch1._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, false);
            }
            return promiseResolvedWith(void 0);
          }
          function pull2Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch2._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, true);
            }
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
            return;
          }
          branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
          branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
          forwardReaderError(reader);
          return [branch1, branch2];
        }
        function convertUnderlyingDefaultOrByteSource(source, context) {
          assertDictionary(source, context);
          const original = source;
          const autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
          const cancel = original === null || original === void 0 ? void 0 : original.cancel;
          const pull = original === null || original === void 0 ? void 0 : original.pull;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          return {
            autoAllocateChunkSize: autoAllocateChunkSize === void 0 ? void 0 : convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, `${context} has member 'autoAllocateChunkSize' that`),
            cancel: cancel === void 0 ? void 0 : convertUnderlyingSourceCancelCallback(cancel, original, `${context} has member 'cancel' that`),
            pull: pull === void 0 ? void 0 : convertUnderlyingSourcePullCallback(pull, original, `${context} has member 'pull' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSourceStartCallback(start, original, `${context} has member 'start' that`),
            type: type === void 0 ? void 0 : convertReadableStreamType(type, `${context} has member 'type' that`)
          };
        }
        function convertUnderlyingSourceCancelCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSourcePullCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertUnderlyingSourceStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertReadableStreamType(type, context) {
          type = `${type}`;
          if (type !== "bytes") {
            throw new TypeError(`${context} '${type}' is not a valid enumeration value for ReadableStreamType`);
          }
          return type;
        }
        function convertReaderOptions(options2, context) {
          assertDictionary(options2, context);
          const mode = options2 === null || options2 === void 0 ? void 0 : options2.mode;
          return {
            mode: mode === void 0 ? void 0 : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
          };
        }
        function convertReadableStreamReaderMode(mode, context) {
          mode = `${mode}`;
          if (mode !== "byob") {
            throw new TypeError(`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`);
          }
          return mode;
        }
        function convertIteratorOptions(options2, context) {
          assertDictionary(options2, context);
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          return { preventCancel: Boolean(preventCancel) };
        }
        function convertPipeOptions(options2, context) {
          assertDictionary(options2, context);
          const preventAbort = options2 === null || options2 === void 0 ? void 0 : options2.preventAbort;
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          const preventClose = options2 === null || options2 === void 0 ? void 0 : options2.preventClose;
          const signal = options2 === null || options2 === void 0 ? void 0 : options2.signal;
          if (signal !== void 0) {
            assertAbortSignal(signal, `${context} has member 'signal' that`);
          }
          return {
            preventAbort: Boolean(preventAbort),
            preventCancel: Boolean(preventCancel),
            preventClose: Boolean(preventClose),
            signal
          };
        }
        function assertAbortSignal(signal, context) {
          if (!isAbortSignal2(signal)) {
            throw new TypeError(`${context} is not an AbortSignal.`);
          }
        }
        function convertReadableWritablePair(pair, context) {
          assertDictionary(pair, context);
          const readable = pair === null || pair === void 0 ? void 0 : pair.readable;
          assertRequiredField(readable, "readable", "ReadableWritablePair");
          assertReadableStream(readable, `${context} has member 'readable' that`);
          const writable3 = pair === null || pair === void 0 ? void 0 : pair.writable;
          assertRequiredField(writable3, "writable", "ReadableWritablePair");
          assertWritableStream(writable3, `${context} has member 'writable' that`);
          return { readable, writable: writable3 };
        }
        class ReadableStream2 {
          constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
            if (rawUnderlyingSource === void 0) {
              rawUnderlyingSource = null;
            } else {
              assertObject(rawUnderlyingSource, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, "First parameter");
            InitializeReadableStream(this);
            if (underlyingSource.type === "bytes") {
              if (strategy.size !== void 0) {
                throw new RangeError("The strategy for a byte stream cannot have a size function");
              }
              const highWaterMark = ExtractHighWaterMark(strategy, 0);
              SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
            } else {
              const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
              const highWaterMark = ExtractHighWaterMark(strategy, 1);
              SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
            }
          }
          get locked() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("locked");
            }
            return IsReadableStreamLocked(this);
          }
          cancel(reason = void 0) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("cancel"));
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot cancel a stream that already has a reader"));
            }
            return ReadableStreamCancel(this, reason);
          }
          getReader(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("getReader");
            }
            const options2 = convertReaderOptions(rawOptions, "First parameter");
            if (options2.mode === void 0) {
              return AcquireReadableStreamDefaultReader(this);
            }
            return AcquireReadableStreamBYOBReader(this);
          }
          pipeThrough(rawTransform, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("pipeThrough");
            }
            assertRequiredArgument(rawTransform, 1, "pipeThrough");
            const transform = convertReadableWritablePair(rawTransform, "First parameter");
            const options2 = convertPipeOptions(rawOptions, "Second parameter");
            if (IsReadableStreamLocked(this)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
            }
            if (IsWritableStreamLocked(transform.writable)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
            }
            const promise = ReadableStreamPipeTo(this, transform.writable, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
            setPromiseIsHandledToTrue(promise);
            return transform.readable;
          }
          pipeTo(destination, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("pipeTo"));
            }
            if (destination === void 0) {
              return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
            }
            if (!IsWritableStream(destination)) {
              return promiseRejectedWith(new TypeError(`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`));
            }
            let options2;
            try {
              options2 = convertPipeOptions(rawOptions, "Second parameter");
            } catch (e) {
              return promiseRejectedWith(e);
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream"));
            }
            if (IsWritableStreamLocked(destination)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream"));
            }
            return ReadableStreamPipeTo(this, destination, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
          }
          tee() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("tee");
            }
            const branches = ReadableStreamTee(this);
            return CreateArrayFromList(branches);
          }
          values(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("values");
            }
            const options2 = convertIteratorOptions(rawOptions, "First parameter");
            return AcquireReadableStreamAsyncIterator(this, options2.preventCancel);
          }
        }
        Object.defineProperties(ReadableStream2.prototype, {
          cancel: { enumerable: true },
          getReader: { enumerable: true },
          pipeThrough: { enumerable: true },
          pipeTo: { enumerable: true },
          tee: { enumerable: true },
          values: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStream",
            configurable: true
          });
        }
        if (typeof SymbolPolyfill.asyncIterator === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.asyncIterator, {
            value: ReadableStream2.prototype.values,
            writable: true,
            configurable: true
          });
        }
        function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableByteStreamController.prototype);
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, 0, void 0);
          return stream;
        }
        function InitializeReadableStream(stream) {
          stream._state = "readable";
          stream._reader = void 0;
          stream._storedError = void 0;
          stream._disturbed = false;
        }
        function IsReadableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readableStreamController")) {
            return false;
          }
          return x instanceof ReadableStream2;
        }
        function IsReadableStreamLocked(stream) {
          if (stream._reader === void 0) {
            return false;
          }
          return true;
        }
        function ReadableStreamCancel(stream, reason) {
          stream._disturbed = true;
          if (stream._state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (stream._state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          ReadableStreamClose(stream);
          const reader = stream._reader;
          if (reader !== void 0 && IsReadableStreamBYOBReader(reader)) {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._closeSteps(void 0);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
          const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
          return transformPromiseWith(sourceCancelPromise, noop2);
        }
        function ReadableStreamClose(stream) {
          stream._state = "closed";
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseResolve(reader);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._closeSteps();
            });
            reader._readRequests = new SimpleQueue();
          }
        }
        function ReadableStreamError(stream, e) {
          stream._state = "errored";
          stream._storedError = e;
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseReject(reader, e);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._errorSteps(e);
            });
            reader._readRequests = new SimpleQueue();
          } else {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._errorSteps(e);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
        }
        function streamBrandCheckException$1(name) {
          return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`);
        }
        function convertQueuingStrategyInit(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          assertRequiredField(highWaterMark, "highWaterMark", "QueuingStrategyInit");
          return {
            highWaterMark: convertUnrestrictedDouble(highWaterMark)
          };
        }
        const byteLengthSizeFunction = (chunk) => {
          return chunk.byteLength;
        };
        Object.defineProperty(byteLengthSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class ByteLengthQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "ByteLengthQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._byteLengthQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("highWaterMark");
            }
            return this._byteLengthQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("size");
            }
            return byteLengthSizeFunction;
          }
        }
        Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ByteLengthQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "ByteLengthQueuingStrategy",
            configurable: true
          });
        }
        function byteLengthBrandCheckException(name) {
          return new TypeError(`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`);
        }
        function IsByteLengthQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_byteLengthQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof ByteLengthQueuingStrategy;
        }
        const countSizeFunction = () => {
          return 1;
        };
        Object.defineProperty(countSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class CountQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "CountQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._countQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("highWaterMark");
            }
            return this._countQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("size");
            }
            return countSizeFunction;
          }
        }
        Object.defineProperties(CountQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(CountQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "CountQueuingStrategy",
            configurable: true
          });
        }
        function countBrandCheckException(name) {
          return new TypeError(`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`);
        }
        function IsCountQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_countQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof CountQueuingStrategy;
        }
        function convertTransformer(original, context) {
          assertDictionary(original, context);
          const flush = original === null || original === void 0 ? void 0 : original.flush;
          const readableType = original === null || original === void 0 ? void 0 : original.readableType;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const transform = original === null || original === void 0 ? void 0 : original.transform;
          const writableType = original === null || original === void 0 ? void 0 : original.writableType;
          return {
            flush: flush === void 0 ? void 0 : convertTransformerFlushCallback(flush, original, `${context} has member 'flush' that`),
            readableType,
            start: start === void 0 ? void 0 : convertTransformerStartCallback(start, original, `${context} has member 'start' that`),
            transform: transform === void 0 ? void 0 : convertTransformerTransformCallback(transform, original, `${context} has member 'transform' that`),
            writableType
          };
        }
        function convertTransformerFlushCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertTransformerStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertTransformerTransformCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        class TransformStream {
          constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
            if (rawTransformer === void 0) {
              rawTransformer = null;
            }
            const writableStrategy = convertQueuingStrategy(rawWritableStrategy, "Second parameter");
            const readableStrategy = convertQueuingStrategy(rawReadableStrategy, "Third parameter");
            const transformer = convertTransformer(rawTransformer, "First parameter");
            if (transformer.readableType !== void 0) {
              throw new RangeError("Invalid readableType specified");
            }
            if (transformer.writableType !== void 0) {
              throw new RangeError("Invalid writableType specified");
            }
            const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
            const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
            const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
            const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
            let startPromise_resolve;
            const startPromise = newPromise((resolve2) => {
              startPromise_resolve = resolve2;
            });
            InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
            SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
            if (transformer.start !== void 0) {
              startPromise_resolve(transformer.start(this._transformStreamController));
            } else {
              startPromise_resolve(void 0);
            }
          }
          get readable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("readable");
            }
            return this._readable;
          }
          get writable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("writable");
            }
            return this._writable;
          }
        }
        Object.defineProperties(TransformStream.prototype, {
          readable: { enumerable: true },
          writable: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStream.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStream",
            configurable: true
          });
        }
        function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
          function startAlgorithm() {
            return startPromise;
          }
          function writeAlgorithm(chunk) {
            return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
          }
          function abortAlgorithm(reason) {
            return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
          }
          function closeAlgorithm() {
            return TransformStreamDefaultSinkCloseAlgorithm(stream);
          }
          stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);
          function pullAlgorithm() {
            return TransformStreamDefaultSourcePullAlgorithm(stream);
          }
          function cancelAlgorithm(reason) {
            TransformStreamErrorWritableAndUnblockWrite(stream, reason);
            return promiseResolvedWith(void 0);
          }
          stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
          stream._backpressure = void 0;
          stream._backpressureChangePromise = void 0;
          stream._backpressureChangePromise_resolve = void 0;
          TransformStreamSetBackpressure(stream, true);
          stream._transformStreamController = void 0;
        }
        function IsTransformStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_transformStreamController")) {
            return false;
          }
          return x instanceof TransformStream;
        }
        function TransformStreamError(stream, e) {
          ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e);
          TransformStreamErrorWritableAndUnblockWrite(stream, e);
        }
        function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
          TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
          WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e);
          if (stream._backpressure) {
            TransformStreamSetBackpressure(stream, false);
          }
        }
        function TransformStreamSetBackpressure(stream, backpressure) {
          if (stream._backpressureChangePromise !== void 0) {
            stream._backpressureChangePromise_resolve();
          }
          stream._backpressureChangePromise = newPromise((resolve2) => {
            stream._backpressureChangePromise_resolve = resolve2;
          });
          stream._backpressure = backpressure;
        }
        class TransformStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("desiredSize");
            }
            const readableController = this._controlledTransformStream._readable._readableStreamController;
            return ReadableStreamDefaultControllerGetDesiredSize(readableController);
          }
          enqueue(chunk = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("enqueue");
            }
            TransformStreamDefaultControllerEnqueue(this, chunk);
          }
          error(reason = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("error");
            }
            TransformStreamDefaultControllerError(this, reason);
          }
          terminate() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("terminate");
            }
            TransformStreamDefaultControllerTerminate(this);
          }
        }
        Object.defineProperties(TransformStreamDefaultController.prototype, {
          enqueue: { enumerable: true },
          error: { enumerable: true },
          terminate: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStreamDefaultController",
            configurable: true
          });
        }
        function IsTransformStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledTransformStream")) {
            return false;
          }
          return x instanceof TransformStreamDefaultController;
        }
        function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm) {
          controller._controlledTransformStream = stream;
          stream._transformStreamController = controller;
          controller._transformAlgorithm = transformAlgorithm;
          controller._flushAlgorithm = flushAlgorithm;
        }
        function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
          const controller = Object.create(TransformStreamDefaultController.prototype);
          let transformAlgorithm = (chunk) => {
            try {
              TransformStreamDefaultControllerEnqueue(controller, chunk);
              return promiseResolvedWith(void 0);
            } catch (transformResultE) {
              return promiseRejectedWith(transformResultE);
            }
          };
          let flushAlgorithm = () => promiseResolvedWith(void 0);
          if (transformer.transform !== void 0) {
            transformAlgorithm = (chunk) => transformer.transform(chunk, controller);
          }
          if (transformer.flush !== void 0) {
            flushAlgorithm = () => transformer.flush(controller);
          }
          SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm);
        }
        function TransformStreamDefaultControllerClearAlgorithms(controller) {
          controller._transformAlgorithm = void 0;
          controller._flushAlgorithm = void 0;
        }
        function TransformStreamDefaultControllerEnqueue(controller, chunk) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
            throw new TypeError("Readable side is not in a state that permits enqueue");
          }
          try {
            ReadableStreamDefaultControllerEnqueue(readableController, chunk);
          } catch (e) {
            TransformStreamErrorWritableAndUnblockWrite(stream, e);
            throw stream._readable._storedError;
          }
          const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
          if (backpressure !== stream._backpressure) {
            TransformStreamSetBackpressure(stream, true);
          }
        }
        function TransformStreamDefaultControllerError(controller, e) {
          TransformStreamError(controller._controlledTransformStream, e);
        }
        function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
          const transformPromise = controller._transformAlgorithm(chunk);
          return transformPromiseWith(transformPromise, void 0, (r) => {
            TransformStreamError(controller._controlledTransformStream, r);
            throw r;
          });
        }
        function TransformStreamDefaultControllerTerminate(controller) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          ReadableStreamDefaultControllerClose(readableController);
          const error2 = new TypeError("TransformStream terminated");
          TransformStreamErrorWritableAndUnblockWrite(stream, error2);
        }
        function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
          const controller = stream._transformStreamController;
          if (stream._backpressure) {
            const backpressureChangePromise = stream._backpressureChangePromise;
            return transformPromiseWith(backpressureChangePromise, () => {
              const writable3 = stream._writable;
              const state = writable3._state;
              if (state === "erroring") {
                throw writable3._storedError;
              }
              return TransformStreamDefaultControllerPerformTransform(controller, chunk);
            });
          }
          return TransformStreamDefaultControllerPerformTransform(controller, chunk);
        }
        function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
          TransformStreamError(stream, reason);
          return promiseResolvedWith(void 0);
        }
        function TransformStreamDefaultSinkCloseAlgorithm(stream) {
          const readable = stream._readable;
          const controller = stream._transformStreamController;
          const flushPromise = controller._flushAlgorithm();
          TransformStreamDefaultControllerClearAlgorithms(controller);
          return transformPromiseWith(flushPromise, () => {
            if (readable._state === "errored") {
              throw readable._storedError;
            }
            ReadableStreamDefaultControllerClose(readable._readableStreamController);
          }, (r) => {
            TransformStreamError(stream, r);
            throw readable._storedError;
          });
        }
        function TransformStreamDefaultSourcePullAlgorithm(stream) {
          TransformStreamSetBackpressure(stream, false);
          return stream._backpressureChangePromise;
        }
        function defaultControllerBrandCheckException(name) {
          return new TypeError(`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`);
        }
        function streamBrandCheckException(name) {
          return new TypeError(`TransformStream.prototype.${name} can only be used on a TransformStream`);
        }
        exports2.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
        exports2.CountQueuingStrategy = CountQueuingStrategy;
        exports2.ReadableByteStreamController = ReadableByteStreamController;
        exports2.ReadableStream = ReadableStream2;
        exports2.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
        exports2.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
        exports2.ReadableStreamDefaultController = ReadableStreamDefaultController;
        exports2.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
        exports2.TransformStream = TransformStream;
        exports2.TransformStreamDefaultController = TransformStreamDefaultController;
        exports2.WritableStream = WritableStream;
        exports2.WritableStreamDefaultController = WritableStreamDefaultController;
        exports2.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
        Object.defineProperty(exports2, "__esModule", { value: true });
      });
    })(ponyfill_es2018, ponyfill_es2018.exports);
    POOL_SIZE$1 = 65536;
    if (!globalThis.ReadableStream) {
      try {
        const process2 = require("node:process");
        const { emitWarning } = process2;
        try {
          process2.emitWarning = () => {
          };
          Object.assign(globalThis, require("node:stream/web"));
          process2.emitWarning = emitWarning;
        } catch (error2) {
          process2.emitWarning = emitWarning;
          throw error2;
        }
      } catch (error2) {
        Object.assign(globalThis, ponyfill_es2018.exports);
      }
    }
    try {
      const { Blob: Blob3 } = require("buffer");
      if (Blob3 && !Blob3.prototype.stream) {
        Blob3.prototype.stream = function name(params) {
          let position = 0;
          const blob = this;
          return new ReadableStream({
            type: "bytes",
            async pull(ctrl) {
              const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE$1));
              const buffer = await chunk.arrayBuffer();
              position += buffer.byteLength;
              ctrl.enqueue(new Uint8Array(buffer));
              if (position === blob.size) {
                ctrl.close();
              }
            }
          });
        };
      }
    } catch (error2) {
    }
    POOL_SIZE = 65536;
    _Blob = class Blob {
      #parts = [];
      #type = "";
      #size = 0;
      constructor(blobParts = [], options2 = {}) {
        if (typeof blobParts !== "object" || blobParts === null) {
          throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
        }
        if (typeof blobParts[Symbol.iterator] !== "function") {
          throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
        }
        if (typeof options2 !== "object" && typeof options2 !== "function") {
          throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        }
        if (options2 === null)
          options2 = {};
        const encoder = new TextEncoder();
        for (const element of blobParts) {
          let part;
          if (ArrayBuffer.isView(element)) {
            part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength));
          } else if (element instanceof ArrayBuffer) {
            part = new Uint8Array(element.slice(0));
          } else if (element instanceof Blob) {
            part = element;
          } else {
            part = encoder.encode(element);
          }
          this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size;
          this.#parts.push(part);
        }
        const type = options2.type === void 0 ? "" : String(options2.type);
        this.#type = /^[\x20-\x7E]*$/.test(type) ? type : "";
      }
      get size() {
        return this.#size;
      }
      get type() {
        return this.#type;
      }
      async text() {
        const decoder = new TextDecoder();
        let str = "";
        for await (const part of toIterator(this.#parts, false)) {
          str += decoder.decode(part, { stream: true });
        }
        str += decoder.decode();
        return str;
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of toIterator(this.#parts, false)) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        const it = toIterator(this.#parts, true);
        return new globalThis.ReadableStream({
          type: "bytes",
          async pull(ctrl) {
            const chunk = await it.next();
            chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value);
          },
          async cancel() {
            await it.return();
          }
        });
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = this.#parts;
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          if (added >= span) {
            break;
          }
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            let chunk;
            if (ArrayBuffer.isView(part)) {
              chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.byteLength;
            } else {
              chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.size;
            }
            relativeEnd -= size2;
            blobParts.push(chunk);
            relativeStart = 0;
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        blob.#size = span;
        blob.#parts = blobParts;
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.constructor === "function" && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(_Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Blob2 = _Blob;
    Blob$1 = Blob2;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && (object[NAME] === "AbortSignal" || object[NAME] === "EventTarget");
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (error_) => {
            const error2 = error_ instanceof FetchBaseError ? error_ : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, "system", error_);
            this[INTERNALS$2].error = error2;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        import_stream.default.Readable.from(body.stream()).pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const error2 = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw error2;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const error2 = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_CHAR" });
        throw error2;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback, thisArg = void 0) {
        for (const name of this.keys()) {
          Reflect.apply(callback, thisArg, [this.get(name), name, this]);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status != null ? options2.status : 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          type: "default",
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get type() {
        return this[INTERNALS$1].type;
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          type: this.type,
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      static error() {
        const response = new Response(null, { status: 0, statusText: "" });
        response[INTERNALS$1].type = "error";
        return response;
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      type: { enumerable: true },
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal != null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-netlify/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-netlify/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports) {
    init_shims();
    "use strict";
    exports.parse = parse;
    exports.serialize = serialize;
    var decode = decodeURIComponent;
    var encode = encodeURIComponent;
    var pairSplitRegExp = /; */;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(pairSplitRegExp);
      var dec = opt.decode || decode;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          continue;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      }
      return obj;
    }
    function serialize(name, val, options2) {
      var opt = options2 || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (opt.maxAge != null) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// node_modules/@lukeed/uuid/dist/index.mjs
function v4() {
  var i = 0, num, out = "";
  if (!BUFFER || IDX + 16 > 256) {
    BUFFER = Array(i = 256);
    while (i--)
      BUFFER[i] = 256 * Math.random() | 0;
    i = IDX = 0;
  }
  for (; i < 16; i++) {
    num = BUFFER[IDX + i];
    if (i == 6)
      out += HEX[num & 15 | 64];
    else if (i == 8)
      out += HEX[num & 63 | 128];
    else
      out += HEX[num];
    if (i & 1 && i > 1 && i < 11)
      out += "-";
  }
  IDX++;
  return out;
}
var IDX, HEX, BUFFER;
var init_dist = __esm({
  "node_modules/@lukeed/uuid/dist/index.mjs"() {
    init_shims();
    IDX = 256;
    HEX = [];
    while (IDX--)
      HEX[IDX] = (IDX + 256).toString(16).substring(1);
  }
});

// .svelte-kit/output/server/chunks/Scene.svelte_svelte_type_style_lang-2822b95d.js
var getStores, page;
var init_Scene_svelte_svelte_type_style_lang_2822b95d = __esm({
  ".svelte-kit/output/server/chunks/Scene.svelte_svelte_type_style_lang-2822b95d.js"() {
    init_shims();
    init_app_03b8560f();
    getStores = () => {
      const stores = getContext("__svelte__");
      return {
        page: {
          subscribe: stores.page.subscribe
        },
        navigating: {
          subscribe: stores.navigating.subscribe
        },
        get preloading() {
          console.error("stores.preloading is deprecated; use stores.navigating instead");
          return {
            subscribe: stores.navigating.subscribe
          };
        },
        session: stores.session
      };
    };
    page = {
      subscribe(fn) {
        const store = getStores().page;
        return store.subscribe(fn);
      }
    };
  }
});

// .svelte-kit/output/server/chunks/index-fa8f98f1.js
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function tick_spring(ctx, last_value, current_value, target_value) {
  if (typeof current_value === "number" || is_date(current_value)) {
    const delta = target_value - current_value;
    const velocity = (current_value - last_value) / (ctx.dt || 1 / 60);
    const spring2 = ctx.opts.stiffness * delta;
    const damper = ctx.opts.damping * velocity;
    const acceleration = (spring2 - damper) * ctx.inv_mass;
    const d = (velocity + acceleration) * ctx.dt;
    if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
      return target_value;
    } else {
      ctx.settled = false;
      return is_date(current_value) ? new Date(current_value.getTime() + d) : current_value + d;
    }
  } else if (Array.isArray(current_value)) {
    return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
  } else if (typeof current_value === "object") {
    const next_value = {};
    for (const k in current_value) {
      next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
    }
    return next_value;
  } else {
    throw new Error(`Cannot spring ${typeof current_value} values`);
  }
}
function spring(value, opts = {}) {
  const store = writable(value);
  const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
  let last_time;
  let task;
  let current_token;
  let last_value = value;
  let target_value = value;
  let inv_mass = 1;
  let inv_mass_recovery_rate = 0;
  let cancel_task = false;
  function set(new_value, opts2 = {}) {
    target_value = new_value;
    const token = current_token = {};
    if (value == null || opts2.hard || spring2.stiffness >= 1 && spring2.damping >= 1) {
      cancel_task = true;
      last_time = now();
      last_value = new_value;
      store.set(value = target_value);
      return Promise.resolve();
    } else if (opts2.soft) {
      const rate = opts2.soft === true ? 0.5 : +opts2.soft;
      inv_mass_recovery_rate = 1 / (rate * 60);
      inv_mass = 0;
    }
    if (!task) {
      last_time = now();
      cancel_task = false;
      task = loop((now2) => {
        if (cancel_task) {
          cancel_task = false;
          task = null;
          return false;
        }
        inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
        const ctx = {
          inv_mass,
          opts: spring2,
          settled: true,
          dt: (now2 - last_time) * 60 / 1e3
        };
        const next_value = tick_spring(ctx, last_value, value, target_value);
        last_time = now2;
        last_value = value;
        store.set(value = next_value);
        if (ctx.settled) {
          task = null;
        }
        return !ctx.settled;
      });
    }
    return new Promise((fulfil) => {
      task.promise.then(() => {
        if (token === current_token)
          fulfil();
      });
    });
  }
  const spring2 = {
    set,
    update: (fn, opts2) => set(fn(target_value, value), opts2),
    subscribe: store.subscribe,
    stiffness,
    damping,
    precision
  };
  return spring2;
}
function get_interpolator(a, b) {
  if (a === b || a !== a)
    return () => a;
  const type = typeof a;
  if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    throw new Error("Cannot interpolate values of different type");
  }
  if (Array.isArray(a)) {
    const arr = b.map((bi, i) => {
      return get_interpolator(a[i], bi);
    });
    return (t) => arr.map((fn) => fn(t));
  }
  if (type === "object") {
    if (!a || !b)
      throw new Error("Object cannot be null");
    if (is_date(a) && is_date(b)) {
      a = a.getTime();
      b = b.getTime();
      const delta = b - a;
      return (t) => new Date(a + t * delta);
    }
    const keys = Object.keys(b);
    const interpolators = {};
    keys.forEach((key) => {
      interpolators[key] = get_interpolator(a[key], b[key]);
    });
    return (t) => {
      const result = {};
      keys.forEach((key) => {
        result[key] = interpolators[key](t);
      });
      return result;
    };
  }
  if (type === "number") {
    const delta = b - a;
    return (t) => a + t * delta;
  }
  throw new Error(`Cannot interpolate ${type} values`);
}
function tweened(value, defaults = {}) {
  const store = writable(value);
  let task;
  let target_value = value;
  function set(new_value, opts) {
    if (value == null) {
      store.set(value = new_value);
      return Promise.resolve();
    }
    target_value = new_value;
    let previous_task = task;
    let started = false;
    let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
    if (duration === 0) {
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      store.set(value = target_value);
      return Promise.resolve();
    }
    const start = now() + delay;
    let fn;
    task = loop((now2) => {
      if (now2 < start)
        return true;
      if (!started) {
        fn = interpolate(value, new_value);
        if (typeof duration === "function")
          duration = duration(value, new_value);
        started = true;
      }
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      const elapsed = now2 - start;
      if (elapsed > duration) {
        store.set(value = new_value);
        return false;
      }
      store.set(value = fn(easing(elapsed / duration)));
      return true;
    });
    return task.promise;
  }
  return {
    set,
    update: (fn, opts) => set(fn(target_value, value), opts),
    subscribe: store.subscribe
  };
}
var subscriber_queue, scheme;
var init_index_fa8f98f1 = __esm({
  ".svelte-kit/output/server/chunks/index-fa8f98f1.js"() {
    init_shims();
    init_app_03b8560f();
    subscriber_queue = [];
    scheme = writable("dark");
    scheme.subscribe((val) => {
    });
  }
});

// node_modules/@mszu/pixi-ssr-shim/dist/index.mjs
var init_dist2 = __esm({
  "node_modules/@mszu/pixi-ssr-shim/dist/index.mjs"() {
    init_shims();
    if (typeof window === "undefined") {
      globalThis.window = {};
    }
    if (typeof self === "undefined") {
      globalThis.self = globalThis.window;
    }
    if (typeof document === "undefined") {
      if (window.document) {
        globalThis.document = window.document;
      } else {
        globalThis.document = window.document = {
          createElement: function(elementName) {
            switch (elementName) {
              case "canvas":
                return {
                  getContext: function(contextName) {
                    switch (contextName) {
                      case "webgl":
                        return {
                          getExtension: function() {
                          }
                        };
                      case "2d":
                        return {
                          fillRect: function() {
                          },
                          drawImage: function() {
                          },
                          getImageData: function() {
                          }
                        };
                    }
                  }
                };
            }
          }
        };
      }
    }
  }
});

// node_modules/ismobilejs/cjs/isMobile.js
var require_isMobile = __commonJS({
  "node_modules/ismobilejs/cjs/isMobile.js"(exports) {
    init_shims();
    "use strict";
    exports.__esModule = true;
    var appleIphone = /iPhone/i;
    var appleIpod = /iPod/i;
    var appleTablet = /iPad/i;
    var appleUniversal = /\biOS-universal(?:.+)Mac\b/i;
    var androidPhone = /\bAndroid(?:.+)Mobile\b/i;
    var androidTablet = /Android/i;
    var amazonPhone = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i;
    var amazonTablet = /Silk/i;
    var windowsPhone = /Windows Phone/i;
    var windowsTablet = /\bWindows(?:.+)ARM\b/i;
    var otherBlackBerry = /BlackBerry/i;
    var otherBlackBerry10 = /BB10/i;
    var otherOpera = /Opera Mini/i;
    var otherChrome = /\b(CriOS|Chrome)(?:.+)Mobile/i;
    var otherFirefox = /Mobile(?:.+)Firefox\b/i;
    var isAppleTabletOnIos13 = function(navigator2) {
      return typeof navigator2 !== "undefined" && navigator2.platform === "MacIntel" && typeof navigator2.maxTouchPoints === "number" && navigator2.maxTouchPoints > 1 && typeof MSStream === "undefined";
    };
    function createMatch(userAgent) {
      return function(regex) {
        return regex.test(userAgent);
      };
    }
    function isMobile(param) {
      var nav = {
        userAgent: "",
        platform: "",
        maxTouchPoints: 0
      };
      if (!param && typeof navigator !== "undefined") {
        nav = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          maxTouchPoints: navigator.maxTouchPoints || 0
        };
      } else if (typeof param === "string") {
        nav.userAgent = param;
      } else if (param && param.userAgent) {
        nav = {
          userAgent: param.userAgent,
          platform: param.platform,
          maxTouchPoints: param.maxTouchPoints || 0
        };
      }
      var userAgent = nav.userAgent;
      var tmp = userAgent.split("[FBAN");
      if (typeof tmp[1] !== "undefined") {
        userAgent = tmp[0];
      }
      tmp = userAgent.split("Twitter");
      if (typeof tmp[1] !== "undefined") {
        userAgent = tmp[0];
      }
      var match = createMatch(userAgent);
      var result = {
        apple: {
          phone: match(appleIphone) && !match(windowsPhone),
          ipod: match(appleIpod),
          tablet: !match(appleIphone) && (match(appleTablet) || isAppleTabletOnIos13(nav)) && !match(windowsPhone),
          universal: match(appleUniversal),
          device: (match(appleIphone) || match(appleIpod) || match(appleTablet) || match(appleUniversal) || isAppleTabletOnIos13(nav)) && !match(windowsPhone)
        },
        amazon: {
          phone: match(amazonPhone),
          tablet: !match(amazonPhone) && match(amazonTablet),
          device: match(amazonPhone) || match(amazonTablet)
        },
        android: {
          phone: !match(windowsPhone) && match(amazonPhone) || !match(windowsPhone) && match(androidPhone),
          tablet: !match(windowsPhone) && !match(amazonPhone) && !match(androidPhone) && (match(amazonTablet) || match(androidTablet)),
          device: !match(windowsPhone) && (match(amazonPhone) || match(amazonTablet) || match(androidPhone) || match(androidTablet)) || match(/\bokhttp\b/i)
        },
        windows: {
          phone: match(windowsPhone),
          tablet: match(windowsTablet),
          device: match(windowsPhone) || match(windowsTablet)
        },
        other: {
          blackberry: match(otherBlackBerry),
          blackberry10: match(otherBlackBerry10),
          opera: match(otherOpera),
          firefox: match(otherFirefox),
          chrome: match(otherChrome),
          device: match(otherBlackBerry) || match(otherBlackBerry10) || match(otherOpera) || match(otherFirefox) || match(otherChrome)
        },
        any: false,
        phone: false,
        tablet: false
      };
      result.any = result.apple.device || result.android.device || result.windows.device || result.other.device;
      result.phone = result.apple.phone || result.android.phone || result.windows.phone;
      result.tablet = result.apple.tablet || result.android.tablet || result.windows.tablet;
      return result;
    }
    exports["default"] = isMobile;
  }
});

// node_modules/ismobilejs/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/ismobilejs/cjs/index.js"(exports) {
    init_shims();
    "use strict";
    function __export2(m) {
      for (var p in m)
        if (!exports.hasOwnProperty(p))
          exports[p] = m[p];
    }
    exports.__esModule = true;
    __export2(require_isMobile());
    var isMobile_1 = require_isMobile();
    exports["default"] = isMobile_1["default"];
  }
});

// node_modules/@pixi/settings/dist/cjs/settings.js
var require_settings = __commonJS({
  "node_modules/@pixi/settings/dist/cjs/settings.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    var isMobileCall = _interopDefault(require_cjs());
    var isMobile = isMobileCall(self.navigator);
    function maxRecommendedTextures(max) {
      var allowMax = true;
      if (isMobile.tablet || isMobile.phone) {
        if (isMobile.apple.device) {
          var match = navigator.userAgent.match(/OS (\d+)_(\d+)?/);
          if (match) {
            var majorVersion = parseInt(match[1], 10);
            if (majorVersion < 11) {
              allowMax = false;
            }
          }
        }
        if (isMobile.android.device) {
          var match = navigator.userAgent.match(/Android\s([0-9.]*)/);
          if (match) {
            var majorVersion = parseInt(match[1], 10);
            if (majorVersion < 7) {
              allowMax = false;
            }
          }
        }
      }
      return allowMax ? max : 4;
    }
    function canUploadSameBuffer() {
      return !isMobile.apple.device;
    }
    var ENV;
    (function(ENV2) {
      ENV2[ENV2["WEBGL_LEGACY"] = 0] = "WEBGL_LEGACY";
      ENV2[ENV2["WEBGL"] = 1] = "WEBGL";
      ENV2[ENV2["WEBGL2"] = 2] = "WEBGL2";
    })(ENV || (ENV = {}));
    var RENDERER_TYPE;
    (function(RENDERER_TYPE2) {
      RENDERER_TYPE2[RENDERER_TYPE2["UNKNOWN"] = 0] = "UNKNOWN";
      RENDERER_TYPE2[RENDERER_TYPE2["WEBGL"] = 1] = "WEBGL";
      RENDERER_TYPE2[RENDERER_TYPE2["CANVAS"] = 2] = "CANVAS";
    })(RENDERER_TYPE || (RENDERER_TYPE = {}));
    var BUFFER_BITS;
    (function(BUFFER_BITS2) {
      BUFFER_BITS2[BUFFER_BITS2["COLOR"] = 16384] = "COLOR";
      BUFFER_BITS2[BUFFER_BITS2["DEPTH"] = 256] = "DEPTH";
      BUFFER_BITS2[BUFFER_BITS2["STENCIL"] = 1024] = "STENCIL";
    })(BUFFER_BITS || (BUFFER_BITS = {}));
    var BLEND_MODES;
    (function(BLEND_MODES2) {
      BLEND_MODES2[BLEND_MODES2["NORMAL"] = 0] = "NORMAL";
      BLEND_MODES2[BLEND_MODES2["ADD"] = 1] = "ADD";
      BLEND_MODES2[BLEND_MODES2["MULTIPLY"] = 2] = "MULTIPLY";
      BLEND_MODES2[BLEND_MODES2["SCREEN"] = 3] = "SCREEN";
      BLEND_MODES2[BLEND_MODES2["OVERLAY"] = 4] = "OVERLAY";
      BLEND_MODES2[BLEND_MODES2["DARKEN"] = 5] = "DARKEN";
      BLEND_MODES2[BLEND_MODES2["LIGHTEN"] = 6] = "LIGHTEN";
      BLEND_MODES2[BLEND_MODES2["COLOR_DODGE"] = 7] = "COLOR_DODGE";
      BLEND_MODES2[BLEND_MODES2["COLOR_BURN"] = 8] = "COLOR_BURN";
      BLEND_MODES2[BLEND_MODES2["HARD_LIGHT"] = 9] = "HARD_LIGHT";
      BLEND_MODES2[BLEND_MODES2["SOFT_LIGHT"] = 10] = "SOFT_LIGHT";
      BLEND_MODES2[BLEND_MODES2["DIFFERENCE"] = 11] = "DIFFERENCE";
      BLEND_MODES2[BLEND_MODES2["EXCLUSION"] = 12] = "EXCLUSION";
      BLEND_MODES2[BLEND_MODES2["HUE"] = 13] = "HUE";
      BLEND_MODES2[BLEND_MODES2["SATURATION"] = 14] = "SATURATION";
      BLEND_MODES2[BLEND_MODES2["COLOR"] = 15] = "COLOR";
      BLEND_MODES2[BLEND_MODES2["LUMINOSITY"] = 16] = "LUMINOSITY";
      BLEND_MODES2[BLEND_MODES2["NORMAL_NPM"] = 17] = "NORMAL_NPM";
      BLEND_MODES2[BLEND_MODES2["ADD_NPM"] = 18] = "ADD_NPM";
      BLEND_MODES2[BLEND_MODES2["SCREEN_NPM"] = 19] = "SCREEN_NPM";
      BLEND_MODES2[BLEND_MODES2["NONE"] = 20] = "NONE";
      BLEND_MODES2[BLEND_MODES2["SRC_OVER"] = 0] = "SRC_OVER";
      BLEND_MODES2[BLEND_MODES2["SRC_IN"] = 21] = "SRC_IN";
      BLEND_MODES2[BLEND_MODES2["SRC_OUT"] = 22] = "SRC_OUT";
      BLEND_MODES2[BLEND_MODES2["SRC_ATOP"] = 23] = "SRC_ATOP";
      BLEND_MODES2[BLEND_MODES2["DST_OVER"] = 24] = "DST_OVER";
      BLEND_MODES2[BLEND_MODES2["DST_IN"] = 25] = "DST_IN";
      BLEND_MODES2[BLEND_MODES2["DST_OUT"] = 26] = "DST_OUT";
      BLEND_MODES2[BLEND_MODES2["DST_ATOP"] = 27] = "DST_ATOP";
      BLEND_MODES2[BLEND_MODES2["ERASE"] = 26] = "ERASE";
      BLEND_MODES2[BLEND_MODES2["SUBTRACT"] = 28] = "SUBTRACT";
      BLEND_MODES2[BLEND_MODES2["XOR"] = 29] = "XOR";
    })(BLEND_MODES || (BLEND_MODES = {}));
    var DRAW_MODES;
    (function(DRAW_MODES2) {
      DRAW_MODES2[DRAW_MODES2["POINTS"] = 0] = "POINTS";
      DRAW_MODES2[DRAW_MODES2["LINES"] = 1] = "LINES";
      DRAW_MODES2[DRAW_MODES2["LINE_LOOP"] = 2] = "LINE_LOOP";
      DRAW_MODES2[DRAW_MODES2["LINE_STRIP"] = 3] = "LINE_STRIP";
      DRAW_MODES2[DRAW_MODES2["TRIANGLES"] = 4] = "TRIANGLES";
      DRAW_MODES2[DRAW_MODES2["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
      DRAW_MODES2[DRAW_MODES2["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
    })(DRAW_MODES || (DRAW_MODES = {}));
    var FORMATS;
    (function(FORMATS2) {
      FORMATS2[FORMATS2["RGBA"] = 6408] = "RGBA";
      FORMATS2[FORMATS2["RGB"] = 6407] = "RGB";
      FORMATS2[FORMATS2["RG"] = 33319] = "RG";
      FORMATS2[FORMATS2["RED"] = 6403] = "RED";
      FORMATS2[FORMATS2["RGBA_INTEGER"] = 36249] = "RGBA_INTEGER";
      FORMATS2[FORMATS2["RGB_INTEGER"] = 36248] = "RGB_INTEGER";
      FORMATS2[FORMATS2["RG_INTEGER"] = 33320] = "RG_INTEGER";
      FORMATS2[FORMATS2["RED_INTEGER"] = 36244] = "RED_INTEGER";
      FORMATS2[FORMATS2["ALPHA"] = 6406] = "ALPHA";
      FORMATS2[FORMATS2["LUMINANCE"] = 6409] = "LUMINANCE";
      FORMATS2[FORMATS2["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
      FORMATS2[FORMATS2["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
      FORMATS2[FORMATS2["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
    })(FORMATS || (FORMATS = {}));
    var TARGETS;
    (function(TARGETS2) {
      TARGETS2[TARGETS2["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
      TARGETS2[TARGETS2["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
    })(TARGETS || (TARGETS = {}));
    var TYPES;
    (function(TYPES2) {
      TYPES2[TYPES2["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
      TYPES2[TYPES2["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
      TYPES2[TYPES2["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
      TYPES2[TYPES2["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
      TYPES2[TYPES2["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
      TYPES2[TYPES2["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
      TYPES2[TYPES2["UNSIGNED_INT_10F_11F_11F_REV"] = 35899] = "UNSIGNED_INT_10F_11F_11F_REV";
      TYPES2[TYPES2["UNSIGNED_INT_2_10_10_10_REV"] = 33640] = "UNSIGNED_INT_2_10_10_10_REV";
      TYPES2[TYPES2["UNSIGNED_INT_24_8"] = 34042] = "UNSIGNED_INT_24_8";
      TYPES2[TYPES2["UNSIGNED_INT_5_9_9_9_REV"] = 35902] = "UNSIGNED_INT_5_9_9_9_REV";
      TYPES2[TYPES2["BYTE"] = 5120] = "BYTE";
      TYPES2[TYPES2["SHORT"] = 5122] = "SHORT";
      TYPES2[TYPES2["INT"] = 5124] = "INT";
      TYPES2[TYPES2["FLOAT"] = 5126] = "FLOAT";
      TYPES2[TYPES2["FLOAT_32_UNSIGNED_INT_24_8_REV"] = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV";
      TYPES2[TYPES2["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
    })(TYPES || (TYPES = {}));
    var SAMPLER_TYPES;
    (function(SAMPLER_TYPES2) {
      SAMPLER_TYPES2[SAMPLER_TYPES2["FLOAT"] = 0] = "FLOAT";
      SAMPLER_TYPES2[SAMPLER_TYPES2["INT"] = 1] = "INT";
      SAMPLER_TYPES2[SAMPLER_TYPES2["UINT"] = 2] = "UINT";
    })(SAMPLER_TYPES || (SAMPLER_TYPES = {}));
    var SCALE_MODES;
    (function(SCALE_MODES2) {
      SCALE_MODES2[SCALE_MODES2["NEAREST"] = 0] = "NEAREST";
      SCALE_MODES2[SCALE_MODES2["LINEAR"] = 1] = "LINEAR";
    })(SCALE_MODES || (SCALE_MODES = {}));
    var WRAP_MODES;
    (function(WRAP_MODES2) {
      WRAP_MODES2[WRAP_MODES2["CLAMP"] = 33071] = "CLAMP";
      WRAP_MODES2[WRAP_MODES2["REPEAT"] = 10497] = "REPEAT";
      WRAP_MODES2[WRAP_MODES2["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
    })(WRAP_MODES || (WRAP_MODES = {}));
    var MIPMAP_MODES;
    (function(MIPMAP_MODES2) {
      MIPMAP_MODES2[MIPMAP_MODES2["OFF"] = 0] = "OFF";
      MIPMAP_MODES2[MIPMAP_MODES2["POW2"] = 1] = "POW2";
      MIPMAP_MODES2[MIPMAP_MODES2["ON"] = 2] = "ON";
      MIPMAP_MODES2[MIPMAP_MODES2["ON_MANUAL"] = 3] = "ON_MANUAL";
    })(MIPMAP_MODES || (MIPMAP_MODES = {}));
    var ALPHA_MODES;
    (function(ALPHA_MODES2) {
      ALPHA_MODES2[ALPHA_MODES2["NPM"] = 0] = "NPM";
      ALPHA_MODES2[ALPHA_MODES2["UNPACK"] = 1] = "UNPACK";
      ALPHA_MODES2[ALPHA_MODES2["PMA"] = 2] = "PMA";
      ALPHA_MODES2[ALPHA_MODES2["NO_PREMULTIPLIED_ALPHA"] = 0] = "NO_PREMULTIPLIED_ALPHA";
      ALPHA_MODES2[ALPHA_MODES2["PREMULTIPLY_ON_UPLOAD"] = 1] = "PREMULTIPLY_ON_UPLOAD";
      ALPHA_MODES2[ALPHA_MODES2["PREMULTIPLY_ALPHA"] = 2] = "PREMULTIPLY_ALPHA";
      ALPHA_MODES2[ALPHA_MODES2["PREMULTIPLIED_ALPHA"] = 2] = "PREMULTIPLIED_ALPHA";
    })(ALPHA_MODES || (ALPHA_MODES = {}));
    var CLEAR_MODES;
    (function(CLEAR_MODES2) {
      CLEAR_MODES2[CLEAR_MODES2["NO"] = 0] = "NO";
      CLEAR_MODES2[CLEAR_MODES2["YES"] = 1] = "YES";
      CLEAR_MODES2[CLEAR_MODES2["AUTO"] = 2] = "AUTO";
      CLEAR_MODES2[CLEAR_MODES2["BLEND"] = 0] = "BLEND";
      CLEAR_MODES2[CLEAR_MODES2["CLEAR"] = 1] = "CLEAR";
      CLEAR_MODES2[CLEAR_MODES2["BLIT"] = 2] = "BLIT";
    })(CLEAR_MODES || (CLEAR_MODES = {}));
    var GC_MODES;
    (function(GC_MODES2) {
      GC_MODES2[GC_MODES2["AUTO"] = 0] = "AUTO";
      GC_MODES2[GC_MODES2["MANUAL"] = 1] = "MANUAL";
    })(GC_MODES || (GC_MODES = {}));
    var PRECISION;
    (function(PRECISION2) {
      PRECISION2["LOW"] = "lowp";
      PRECISION2["MEDIUM"] = "mediump";
      PRECISION2["HIGH"] = "highp";
    })(PRECISION || (PRECISION = {}));
    var MASK_TYPES;
    (function(MASK_TYPES2) {
      MASK_TYPES2[MASK_TYPES2["NONE"] = 0] = "NONE";
      MASK_TYPES2[MASK_TYPES2["SCISSOR"] = 1] = "SCISSOR";
      MASK_TYPES2[MASK_TYPES2["STENCIL"] = 2] = "STENCIL";
      MASK_TYPES2[MASK_TYPES2["SPRITE"] = 3] = "SPRITE";
    })(MASK_TYPES || (MASK_TYPES = {}));
    var MSAA_QUALITY;
    (function(MSAA_QUALITY2) {
      MSAA_QUALITY2[MSAA_QUALITY2["NONE"] = 0] = "NONE";
      MSAA_QUALITY2[MSAA_QUALITY2["LOW"] = 2] = "LOW";
      MSAA_QUALITY2[MSAA_QUALITY2["MEDIUM"] = 4] = "MEDIUM";
      MSAA_QUALITY2[MSAA_QUALITY2["HIGH"] = 8] = "HIGH";
    })(MSAA_QUALITY || (MSAA_QUALITY = {}));
    var BUFFER_TYPE;
    (function(BUFFER_TYPE2) {
      BUFFER_TYPE2[BUFFER_TYPE2["ELEMENT_ARRAY_BUFFER"] = 34963] = "ELEMENT_ARRAY_BUFFER";
      BUFFER_TYPE2[BUFFER_TYPE2["ARRAY_BUFFER"] = 34962] = "ARRAY_BUFFER";
      BUFFER_TYPE2[BUFFER_TYPE2["UNIFORM_BUFFER"] = 35345] = "UNIFORM_BUFFER";
    })(BUFFER_TYPE || (BUFFER_TYPE = {}));
    var settings = {
      MIPMAP_TEXTURES: MIPMAP_MODES.POW2,
      ANISOTROPIC_LEVEL: 0,
      RESOLUTION: 1,
      FILTER_RESOLUTION: 1,
      FILTER_MULTISAMPLE: MSAA_QUALITY.NONE,
      SPRITE_MAX_TEXTURES: maxRecommendedTextures(32),
      SPRITE_BATCH_SIZE: 4096,
      RENDER_OPTIONS: {
        view: null,
        antialias: false,
        autoDensity: false,
        backgroundColor: 0,
        backgroundAlpha: 1,
        useContextAlpha: true,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
        width: 800,
        height: 600,
        legacy: false
      },
      GC_MODE: GC_MODES.AUTO,
      GC_MAX_IDLE: 60 * 60,
      GC_MAX_CHECK_COUNT: 60 * 10,
      WRAP_MODE: WRAP_MODES.CLAMP,
      SCALE_MODE: SCALE_MODES.LINEAR,
      PRECISION_VERTEX: PRECISION.HIGH,
      PRECISION_FRAGMENT: isMobile.apple.device ? PRECISION.HIGH : PRECISION.MEDIUM,
      CAN_UPLOAD_SAME_BUFFER: canUploadSameBuffer(),
      CREATE_IMAGE_BITMAP: false,
      ROUND_PIXELS: false
    };
    exports.isMobile = isMobile;
    exports.settings = settings;
  }
});

// node_modules/@pixi/math/dist/cjs/math.js
var require_math = __commonJS({
  "node_modules/@pixi/math/dist/cjs/math.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PI_2 = Math.PI * 2;
    var RAD_TO_DEG = 180 / Math.PI;
    var DEG_TO_RAD = Math.PI / 180;
    (function(SHAPES) {
      SHAPES[SHAPES["POLY"] = 0] = "POLY";
      SHAPES[SHAPES["RECT"] = 1] = "RECT";
      SHAPES[SHAPES["CIRC"] = 2] = "CIRC";
      SHAPES[SHAPES["ELIP"] = 3] = "ELIP";
      SHAPES[SHAPES["RREC"] = 4] = "RREC";
    })(exports.SHAPES || (exports.SHAPES = {}));
    var Rectangle = function() {
      function Rectangle2(x, y, width, height) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = 0;
        }
        if (width === void 0) {
          width = 0;
        }
        if (height === void 0) {
          height = 0;
        }
        this.x = Number(x);
        this.y = Number(y);
        this.width = Number(width);
        this.height = Number(height);
        this.type = exports.SHAPES.RECT;
      }
      Object.defineProperty(Rectangle2.prototype, "left", {
        get: function() {
          return this.x;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Rectangle2.prototype, "right", {
        get: function() {
          return this.x + this.width;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Rectangle2.prototype, "top", {
        get: function() {
          return this.y;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Rectangle2.prototype, "bottom", {
        get: function() {
          return this.y + this.height;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Rectangle2, "EMPTY", {
        get: function() {
          return new Rectangle2(0, 0, 0, 0);
        },
        enumerable: false,
        configurable: true
      });
      Rectangle2.prototype.clone = function() {
        return new Rectangle2(this.x, this.y, this.width, this.height);
      };
      Rectangle2.prototype.copyFrom = function(rectangle) {
        this.x = rectangle.x;
        this.y = rectangle.y;
        this.width = rectangle.width;
        this.height = rectangle.height;
        return this;
      };
      Rectangle2.prototype.copyTo = function(rectangle) {
        rectangle.x = this.x;
        rectangle.y = this.y;
        rectangle.width = this.width;
        rectangle.height = this.height;
        return rectangle;
      };
      Rectangle2.prototype.contains = function(x, y) {
        if (this.width <= 0 || this.height <= 0) {
          return false;
        }
        if (x >= this.x && x < this.x + this.width) {
          if (y >= this.y && y < this.y + this.height) {
            return true;
          }
        }
        return false;
      };
      Rectangle2.prototype.pad = function(paddingX, paddingY) {
        if (paddingX === void 0) {
          paddingX = 0;
        }
        if (paddingY === void 0) {
          paddingY = paddingX;
        }
        this.x -= paddingX;
        this.y -= paddingY;
        this.width += paddingX * 2;
        this.height += paddingY * 2;
        return this;
      };
      Rectangle2.prototype.fit = function(rectangle) {
        var x1 = Math.max(this.x, rectangle.x);
        var x2 = Math.min(this.x + this.width, rectangle.x + rectangle.width);
        var y1 = Math.max(this.y, rectangle.y);
        var y2 = Math.min(this.y + this.height, rectangle.y + rectangle.height);
        this.x = x1;
        this.width = Math.max(x2 - x1, 0);
        this.y = y1;
        this.height = Math.max(y2 - y1, 0);
        return this;
      };
      Rectangle2.prototype.ceil = function(resolution, eps) {
        if (resolution === void 0) {
          resolution = 1;
        }
        if (eps === void 0) {
          eps = 1e-3;
        }
        var x2 = Math.ceil((this.x + this.width - eps) * resolution) / resolution;
        var y2 = Math.ceil((this.y + this.height - eps) * resolution) / resolution;
        this.x = Math.floor((this.x + eps) * resolution) / resolution;
        this.y = Math.floor((this.y + eps) * resolution) / resolution;
        this.width = x2 - this.x;
        this.height = y2 - this.y;
        return this;
      };
      Rectangle2.prototype.enlarge = function(rectangle) {
        var x1 = Math.min(this.x, rectangle.x);
        var x2 = Math.max(this.x + this.width, rectangle.x + rectangle.width);
        var y1 = Math.min(this.y, rectangle.y);
        var y2 = Math.max(this.y + this.height, rectangle.y + rectangle.height);
        this.x = x1;
        this.width = x2 - x1;
        this.y = y1;
        this.height = y2 - y1;
        return this;
      };
      Rectangle2.prototype.toString = function() {
        return "[@pixi/math:Rectangle x=" + this.x + " y=" + this.y + " width=" + this.width + " height=" + this.height + "]";
      };
      return Rectangle2;
    }();
    var Circle = function() {
      function Circle2(x, y, radius) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = 0;
        }
        if (radius === void 0) {
          radius = 0;
        }
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = exports.SHAPES.CIRC;
      }
      Circle2.prototype.clone = function() {
        return new Circle2(this.x, this.y, this.radius);
      };
      Circle2.prototype.contains = function(x, y) {
        if (this.radius <= 0) {
          return false;
        }
        var r2 = this.radius * this.radius;
        var dx = this.x - x;
        var dy = this.y - y;
        dx *= dx;
        dy *= dy;
        return dx + dy <= r2;
      };
      Circle2.prototype.getBounds = function() {
        return new Rectangle(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
      };
      Circle2.prototype.toString = function() {
        return "[@pixi/math:Circle x=" + this.x + " y=" + this.y + " radius=" + this.radius + "]";
      };
      return Circle2;
    }();
    var Ellipse = function() {
      function Ellipse2(x, y, halfWidth, halfHeight) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = 0;
        }
        if (halfWidth === void 0) {
          halfWidth = 0;
        }
        if (halfHeight === void 0) {
          halfHeight = 0;
        }
        this.x = x;
        this.y = y;
        this.width = halfWidth;
        this.height = halfHeight;
        this.type = exports.SHAPES.ELIP;
      }
      Ellipse2.prototype.clone = function() {
        return new Ellipse2(this.x, this.y, this.width, this.height);
      };
      Ellipse2.prototype.contains = function(x, y) {
        if (this.width <= 0 || this.height <= 0) {
          return false;
        }
        var normx = (x - this.x) / this.width;
        var normy = (y - this.y) / this.height;
        normx *= normx;
        normy *= normy;
        return normx + normy <= 1;
      };
      Ellipse2.prototype.getBounds = function() {
        return new Rectangle(this.x - this.width, this.y - this.height, this.width, this.height);
      };
      Ellipse2.prototype.toString = function() {
        return "[@pixi/math:Ellipse x=" + this.x + " y=" + this.y + " width=" + this.width + " height=" + this.height + "]";
      };
      return Ellipse2;
    }();
    var Polygon = function() {
      function Polygon2() {
        var arguments$1 = arguments;
        var points = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          points[_i] = arguments$1[_i];
        }
        var flat = Array.isArray(points[0]) ? points[0] : points;
        if (typeof flat[0] !== "number") {
          var p = [];
          for (var i = 0, il = flat.length; i < il; i++) {
            p.push(flat[i].x, flat[i].y);
          }
          flat = p;
        }
        this.points = flat;
        this.type = exports.SHAPES.POLY;
        this.closeStroke = true;
      }
      Polygon2.prototype.clone = function() {
        var points = this.points.slice();
        var polygon = new Polygon2(points);
        polygon.closeStroke = this.closeStroke;
        return polygon;
      };
      Polygon2.prototype.contains = function(x, y) {
        var inside = false;
        var length = this.points.length / 2;
        for (var i = 0, j = length - 1; i < length; j = i++) {
          var xi = this.points[i * 2];
          var yi = this.points[i * 2 + 1];
          var xj = this.points[j * 2];
          var yj = this.points[j * 2 + 1];
          var intersect = yi > y !== yj > y && x < (xj - xi) * ((y - yi) / (yj - yi)) + xi;
          if (intersect) {
            inside = !inside;
          }
        }
        return inside;
      };
      Polygon2.prototype.toString = function() {
        return "[@pixi/math:Polygon" + ("closeStroke=" + this.closeStroke) + ("points=" + this.points.reduce(function(pointsDesc, currentPoint) {
          return pointsDesc + ", " + currentPoint;
        }, "") + "]");
      };
      return Polygon2;
    }();
    var RoundedRectangle = function() {
      function RoundedRectangle2(x, y, width, height, radius) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = 0;
        }
        if (width === void 0) {
          width = 0;
        }
        if (height === void 0) {
          height = 0;
        }
        if (radius === void 0) {
          radius = 20;
        }
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.type = exports.SHAPES.RREC;
      }
      RoundedRectangle2.prototype.clone = function() {
        return new RoundedRectangle2(this.x, this.y, this.width, this.height, this.radius);
      };
      RoundedRectangle2.prototype.contains = function(x, y) {
        if (this.width <= 0 || this.height <= 0) {
          return false;
        }
        if (x >= this.x && x <= this.x + this.width) {
          if (y >= this.y && y <= this.y + this.height) {
            if (y >= this.y + this.radius && y <= this.y + this.height - this.radius || x >= this.x + this.radius && x <= this.x + this.width - this.radius) {
              return true;
            }
            var dx = x - (this.x + this.radius);
            var dy = y - (this.y + this.radius);
            var radius2 = this.radius * this.radius;
            if (dx * dx + dy * dy <= radius2) {
              return true;
            }
            dx = x - (this.x + this.width - this.radius);
            if (dx * dx + dy * dy <= radius2) {
              return true;
            }
            dy = y - (this.y + this.height - this.radius);
            if (dx * dx + dy * dy <= radius2) {
              return true;
            }
            dx = x - (this.x + this.radius);
            if (dx * dx + dy * dy <= radius2) {
              return true;
            }
          }
        }
        return false;
      };
      RoundedRectangle2.prototype.toString = function() {
        return "[@pixi/math:RoundedRectangle x=" + this.x + " y=" + this.y + ("width=" + this.width + " height=" + this.height + " radius=" + this.radius + "]");
      };
      return RoundedRectangle2;
    }();
    var Point = function() {
      function Point2(x, y) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = 0;
        }
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
      }
      Point2.prototype.clone = function() {
        return new Point2(this.x, this.y);
      };
      Point2.prototype.copyFrom = function(p) {
        this.set(p.x, p.y);
        return this;
      };
      Point2.prototype.copyTo = function(p) {
        p.set(this.x, this.y);
        return p;
      };
      Point2.prototype.equals = function(p) {
        return p.x === this.x && p.y === this.y;
      };
      Point2.prototype.set = function(x, y) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = x;
        }
        this.x = x;
        this.y = y;
        return this;
      };
      Point2.prototype.toString = function() {
        return "[@pixi/math:Point x=" + this.x + " y=" + this.y + "]";
      };
      return Point2;
    }();
    var ObservablePoint = function() {
      function ObservablePoint2(cb, scope, x, y) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = 0;
        }
        this._x = x;
        this._y = y;
        this.cb = cb;
        this.scope = scope;
      }
      ObservablePoint2.prototype.clone = function(cb, scope) {
        if (cb === void 0) {
          cb = this.cb;
        }
        if (scope === void 0) {
          scope = this.scope;
        }
        return new ObservablePoint2(cb, scope, this._x, this._y);
      };
      ObservablePoint2.prototype.set = function(x, y) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = x;
        }
        if (this._x !== x || this._y !== y) {
          this._x = x;
          this._y = y;
          this.cb.call(this.scope);
        }
        return this;
      };
      ObservablePoint2.prototype.copyFrom = function(p) {
        if (this._x !== p.x || this._y !== p.y) {
          this._x = p.x;
          this._y = p.y;
          this.cb.call(this.scope);
        }
        return this;
      };
      ObservablePoint2.prototype.copyTo = function(p) {
        p.set(this._x, this._y);
        return p;
      };
      ObservablePoint2.prototype.equals = function(p) {
        return p.x === this._x && p.y === this._y;
      };
      ObservablePoint2.prototype.toString = function() {
        return "[@pixi/math:ObservablePoint x=" + 0 + " y=" + 0 + " scope=" + this.scope + "]";
      };
      Object.defineProperty(ObservablePoint2.prototype, "x", {
        get: function() {
          return this._x;
        },
        set: function(value) {
          if (this._x !== value) {
            this._x = value;
            this.cb.call(this.scope);
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(ObservablePoint2.prototype, "y", {
        get: function() {
          return this._y;
        },
        set: function(value) {
          if (this._y !== value) {
            this._y = value;
            this.cb.call(this.scope);
          }
        },
        enumerable: false,
        configurable: true
      });
      return ObservablePoint2;
    }();
    var Matrix = function() {
      function Matrix2(a, b, c, d, tx, ty) {
        if (a === void 0) {
          a = 1;
        }
        if (b === void 0) {
          b = 0;
        }
        if (c === void 0) {
          c = 0;
        }
        if (d === void 0) {
          d = 1;
        }
        if (tx === void 0) {
          tx = 0;
        }
        if (ty === void 0) {
          ty = 0;
        }
        this.array = null;
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
      }
      Matrix2.prototype.fromArray = function(array) {
        this.a = array[0];
        this.b = array[1];
        this.c = array[3];
        this.d = array[4];
        this.tx = array[2];
        this.ty = array[5];
      };
      Matrix2.prototype.set = function(a, b, c, d, tx, ty) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
        return this;
      };
      Matrix2.prototype.toArray = function(transpose, out) {
        if (!this.array) {
          this.array = new Float32Array(9);
        }
        var array = out || this.array;
        if (transpose) {
          array[0] = this.a;
          array[1] = this.b;
          array[2] = 0;
          array[3] = this.c;
          array[4] = this.d;
          array[5] = 0;
          array[6] = this.tx;
          array[7] = this.ty;
          array[8] = 1;
        } else {
          array[0] = this.a;
          array[1] = this.c;
          array[2] = this.tx;
          array[3] = this.b;
          array[4] = this.d;
          array[5] = this.ty;
          array[6] = 0;
          array[7] = 0;
          array[8] = 1;
        }
        return array;
      };
      Matrix2.prototype.apply = function(pos, newPos) {
        newPos = newPos || new Point();
        var x = pos.x;
        var y = pos.y;
        newPos.x = this.a * x + this.c * y + this.tx;
        newPos.y = this.b * x + this.d * y + this.ty;
        return newPos;
      };
      Matrix2.prototype.applyInverse = function(pos, newPos) {
        newPos = newPos || new Point();
        var id = 1 / (this.a * this.d + this.c * -this.b);
        var x = pos.x;
        var y = pos.y;
        newPos.x = this.d * id * x + -this.c * id * y + (this.ty * this.c - this.tx * this.d) * id;
        newPos.y = this.a * id * y + -this.b * id * x + (-this.ty * this.a + this.tx * this.b) * id;
        return newPos;
      };
      Matrix2.prototype.translate = function(x, y) {
        this.tx += x;
        this.ty += y;
        return this;
      };
      Matrix2.prototype.scale = function(x, y) {
        this.a *= x;
        this.d *= y;
        this.c *= x;
        this.b *= y;
        this.tx *= x;
        this.ty *= y;
        return this;
      };
      Matrix2.prototype.rotate = function(angle) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var a1 = this.a;
        var c1 = this.c;
        var tx1 = this.tx;
        this.a = a1 * cos - this.b * sin;
        this.b = a1 * sin + this.b * cos;
        this.c = c1 * cos - this.d * sin;
        this.d = c1 * sin + this.d * cos;
        this.tx = tx1 * cos - this.ty * sin;
        this.ty = tx1 * sin + this.ty * cos;
        return this;
      };
      Matrix2.prototype.append = function(matrix) {
        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;
        this.a = matrix.a * a1 + matrix.b * c1;
        this.b = matrix.a * b1 + matrix.b * d1;
        this.c = matrix.c * a1 + matrix.d * c1;
        this.d = matrix.c * b1 + matrix.d * d1;
        this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx;
        this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty;
        return this;
      };
      Matrix2.prototype.setTransform = function(x, y, pivotX, pivotY, scaleX, scaleY, rotation, skewX, skewY) {
        this.a = Math.cos(rotation + skewY) * scaleX;
        this.b = Math.sin(rotation + skewY) * scaleX;
        this.c = -Math.sin(rotation - skewX) * scaleY;
        this.d = Math.cos(rotation - skewX) * scaleY;
        this.tx = x - (pivotX * this.a + pivotY * this.c);
        this.ty = y - (pivotX * this.b + pivotY * this.d);
        return this;
      };
      Matrix2.prototype.prepend = function(matrix) {
        var tx1 = this.tx;
        if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
          var a1 = this.a;
          var c1 = this.c;
          this.a = a1 * matrix.a + this.b * matrix.c;
          this.b = a1 * matrix.b + this.b * matrix.d;
          this.c = c1 * matrix.a + this.d * matrix.c;
          this.d = c1 * matrix.b + this.d * matrix.d;
        }
        this.tx = tx1 * matrix.a + this.ty * matrix.c + matrix.tx;
        this.ty = tx1 * matrix.b + this.ty * matrix.d + matrix.ty;
        return this;
      };
      Matrix2.prototype.decompose = function(transform) {
        var a = this.a;
        var b = this.b;
        var c = this.c;
        var d = this.d;
        var pivot = transform.pivot;
        var skewX = -Math.atan2(-c, d);
        var skewY = Math.atan2(b, a);
        var delta = Math.abs(skewX + skewY);
        if (delta < 1e-5 || Math.abs(PI_2 - delta) < 1e-5) {
          transform.rotation = skewY;
          transform.skew.x = transform.skew.y = 0;
        } else {
          transform.rotation = 0;
          transform.skew.x = skewX;
          transform.skew.y = skewY;
        }
        transform.scale.x = Math.sqrt(a * a + b * b);
        transform.scale.y = Math.sqrt(c * c + d * d);
        transform.position.x = this.tx + (pivot.x * a + pivot.y * c);
        transform.position.y = this.ty + (pivot.x * b + pivot.y * d);
        return transform;
      };
      Matrix2.prototype.invert = function() {
        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;
        var tx1 = this.tx;
        var n = a1 * d1 - b1 * c1;
        this.a = d1 / n;
        this.b = -b1 / n;
        this.c = -c1 / n;
        this.d = a1 / n;
        this.tx = (c1 * this.ty - d1 * tx1) / n;
        this.ty = -(a1 * this.ty - b1 * tx1) / n;
        return this;
      };
      Matrix2.prototype.identity = function() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;
        return this;
      };
      Matrix2.prototype.clone = function() {
        var matrix = new Matrix2();
        matrix.a = this.a;
        matrix.b = this.b;
        matrix.c = this.c;
        matrix.d = this.d;
        matrix.tx = this.tx;
        matrix.ty = this.ty;
        return matrix;
      };
      Matrix2.prototype.copyTo = function(matrix) {
        matrix.a = this.a;
        matrix.b = this.b;
        matrix.c = this.c;
        matrix.d = this.d;
        matrix.tx = this.tx;
        matrix.ty = this.ty;
        return matrix;
      };
      Matrix2.prototype.copyFrom = function(matrix) {
        this.a = matrix.a;
        this.b = matrix.b;
        this.c = matrix.c;
        this.d = matrix.d;
        this.tx = matrix.tx;
        this.ty = matrix.ty;
        return this;
      };
      Matrix2.prototype.toString = function() {
        return "[@pixi/math:Matrix a=" + this.a + " b=" + this.b + " c=" + this.c + " d=" + this.d + " tx=" + this.tx + " ty=" + this.ty + "]";
      };
      Object.defineProperty(Matrix2, "IDENTITY", {
        get: function() {
          return new Matrix2();
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Matrix2, "TEMP_MATRIX", {
        get: function() {
          return new Matrix2();
        },
        enumerable: false,
        configurable: true
      });
      return Matrix2;
    }();
    var ux = [1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1];
    var uy = [0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1];
    var vx = [0, -1, -1, -1, 0, 1, 1, 1, 0, 1, 1, 1, 0, -1, -1, -1];
    var vy = [1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, 1, 1, 1, 0, -1];
    var rotationCayley = [];
    var rotationMatrices = [];
    var signum = Math.sign;
    function init2() {
      for (var i = 0; i < 16; i++) {
        var row = [];
        rotationCayley.push(row);
        for (var j = 0; j < 16; j++) {
          var _ux = signum(ux[i] * ux[j] + vx[i] * uy[j]);
          var _uy = signum(uy[i] * ux[j] + vy[i] * uy[j]);
          var _vx = signum(ux[i] * vx[j] + vx[i] * vy[j]);
          var _vy = signum(uy[i] * vx[j] + vy[i] * vy[j]);
          for (var k = 0; k < 16; k++) {
            if (ux[k] === _ux && uy[k] === _uy && vx[k] === _vx && vy[k] === _vy) {
              row.push(k);
              break;
            }
          }
        }
      }
      for (var i = 0; i < 16; i++) {
        var mat = new Matrix();
        mat.set(ux[i], uy[i], vx[i], vy[i], 0, 0);
        rotationMatrices.push(mat);
      }
    }
    init2();
    var groupD8 = {
      E: 0,
      SE: 1,
      S: 2,
      SW: 3,
      W: 4,
      NW: 5,
      N: 6,
      NE: 7,
      MIRROR_VERTICAL: 8,
      MAIN_DIAGONAL: 10,
      MIRROR_HORIZONTAL: 12,
      REVERSE_DIAGONAL: 14,
      uX: function(ind) {
        return ux[ind];
      },
      uY: function(ind) {
        return uy[ind];
      },
      vX: function(ind) {
        return vx[ind];
      },
      vY: function(ind) {
        return vy[ind];
      },
      inv: function(rotation) {
        if (rotation & 8) {
          return rotation & 15;
        }
        return -rotation & 7;
      },
      add: function(rotationSecond, rotationFirst) {
        return rotationCayley[rotationSecond][rotationFirst];
      },
      sub: function(rotationSecond, rotationFirst) {
        return rotationCayley[rotationSecond][groupD8.inv(rotationFirst)];
      },
      rotate180: function(rotation) {
        return rotation ^ 4;
      },
      isVertical: function(rotation) {
        return (rotation & 3) === 2;
      },
      byDirection: function(dx, dy) {
        if (Math.abs(dx) * 2 <= Math.abs(dy)) {
          if (dy >= 0) {
            return groupD8.S;
          }
          return groupD8.N;
        } else if (Math.abs(dy) * 2 <= Math.abs(dx)) {
          if (dx > 0) {
            return groupD8.E;
          }
          return groupD8.W;
        } else if (dy > 0) {
          if (dx > 0) {
            return groupD8.SE;
          }
          return groupD8.SW;
        } else if (dx > 0) {
          return groupD8.NE;
        }
        return groupD8.NW;
      },
      matrixAppendRotationInv: function(matrix, rotation, tx, ty) {
        if (tx === void 0) {
          tx = 0;
        }
        if (ty === void 0) {
          ty = 0;
        }
        var mat = rotationMatrices[groupD8.inv(rotation)];
        mat.tx = tx;
        mat.ty = ty;
        matrix.append(mat);
      }
    };
    var Transform = function() {
      function Transform2() {
        this.worldTransform = new Matrix();
        this.localTransform = new Matrix();
        this.position = new ObservablePoint(this.onChange, this, 0, 0);
        this.scale = new ObservablePoint(this.onChange, this, 1, 1);
        this.pivot = new ObservablePoint(this.onChange, this, 0, 0);
        this.skew = new ObservablePoint(this.updateSkew, this, 0, 0);
        this._rotation = 0;
        this._cx = 1;
        this._sx = 0;
        this._cy = 0;
        this._sy = 1;
        this._localID = 0;
        this._currentLocalID = 0;
        this._worldID = 0;
        this._parentID = 0;
      }
      Transform2.prototype.onChange = function() {
        this._localID++;
      };
      Transform2.prototype.updateSkew = function() {
        this._cx = Math.cos(this._rotation + this.skew.y);
        this._sx = Math.sin(this._rotation + this.skew.y);
        this._cy = -Math.sin(this._rotation - this.skew.x);
        this._sy = Math.cos(this._rotation - this.skew.x);
        this._localID++;
      };
      Transform2.prototype.toString = function() {
        return "[@pixi/math:Transform " + ("position=(" + this.position.x + ", " + this.position.y + ") ") + ("rotation=" + this.rotation + " ") + ("scale=(" + this.scale.x + ", " + this.scale.y + ") ") + ("skew=(" + this.skew.x + ", " + this.skew.y + ") ") + "]";
      };
      Transform2.prototype.updateLocalTransform = function() {
        var lt = this.localTransform;
        if (this._localID !== this._currentLocalID) {
          lt.a = this._cx * this.scale.x;
          lt.b = this._sx * this.scale.x;
          lt.c = this._cy * this.scale.y;
          lt.d = this._sy * this.scale.y;
          lt.tx = this.position.x - (this.pivot.x * lt.a + this.pivot.y * lt.c);
          lt.ty = this.position.y - (this.pivot.x * lt.b + this.pivot.y * lt.d);
          this._currentLocalID = this._localID;
          this._parentID = -1;
        }
      };
      Transform2.prototype.updateTransform = function(parentTransform) {
        var lt = this.localTransform;
        if (this._localID !== this._currentLocalID) {
          lt.a = this._cx * this.scale.x;
          lt.b = this._sx * this.scale.x;
          lt.c = this._cy * this.scale.y;
          lt.d = this._sy * this.scale.y;
          lt.tx = this.position.x - (this.pivot.x * lt.a + this.pivot.y * lt.c);
          lt.ty = this.position.y - (this.pivot.x * lt.b + this.pivot.y * lt.d);
          this._currentLocalID = this._localID;
          this._parentID = -1;
        }
        if (this._parentID !== parentTransform._worldID) {
          var pt = parentTransform.worldTransform;
          var wt = this.worldTransform;
          wt.a = lt.a * pt.a + lt.b * pt.c;
          wt.b = lt.a * pt.b + lt.b * pt.d;
          wt.c = lt.c * pt.a + lt.d * pt.c;
          wt.d = lt.c * pt.b + lt.d * pt.d;
          wt.tx = lt.tx * pt.a + lt.ty * pt.c + pt.tx;
          wt.ty = lt.tx * pt.b + lt.ty * pt.d + pt.ty;
          this._parentID = parentTransform._worldID;
          this._worldID++;
        }
      };
      Transform2.prototype.setFromMatrix = function(matrix) {
        matrix.decompose(this);
        this._localID++;
      };
      Object.defineProperty(Transform2.prototype, "rotation", {
        get: function() {
          return this._rotation;
        },
        set: function(value) {
          if (this._rotation !== value) {
            this._rotation = value;
            this.updateSkew();
          }
        },
        enumerable: false,
        configurable: true
      });
      Transform2.IDENTITY = new Transform2();
      return Transform2;
    }();
    exports.Circle = Circle;
    exports.DEG_TO_RAD = DEG_TO_RAD;
    exports.Ellipse = Ellipse;
    exports.Matrix = Matrix;
    exports.ObservablePoint = ObservablePoint;
    exports.PI_2 = PI_2;
    exports.Point = Point;
    exports.Polygon = Polygon;
    exports.RAD_TO_DEG = RAD_TO_DEG;
    exports.Rectangle = Rectangle;
    exports.RoundedRectangle = RoundedRectangle;
    exports.Transform = Transform;
    exports.groupD8 = groupD8;
  }
});

// node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "node_modules/eventemitter3/index.js"(exports, module2) {
    init_shims();
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = Object.create(null);
      if (!new Events().__proto__)
        prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt])
        emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn)
        emitter._events[evt].push(listener);
      else
        emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0)
        emitter._events = new Events();
      else
        delete emitter._events[evt];
    }
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0)
        return names;
      for (name in events = this._events) {
        if (has.call(events, name))
          names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers)
        return [];
      if (handlers.fn)
        return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners)
        return 0;
      if (listeners.fn)
        return 1;
      return listeners.length;
    };
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt])
        return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once)
          this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once)
            this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args)
                for (j = 1, args = new Array(len - 1); j < len; j++) {
                  args[j - 1] = arguments[j];
                }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt])
        return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length)
          this._events[evt] = events.length === 1 ? events[0] : events;
        else
          clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt])
          clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
    EventEmitter.prefixed = prefix;
    EventEmitter.EventEmitter = EventEmitter;
    if (typeof module2 !== "undefined") {
      module2.exports = EventEmitter;
    }
  }
});

// node_modules/earcut/src/earcut.js
var require_earcut = __commonJS({
  "node_modules/earcut/src/earcut.js"(exports, module2) {
    init_shims();
    "use strict";
    module2.exports = earcut;
    module2.exports.default = earcut;
    function earcut(data, holeIndices, dim) {
      dim = dim || 2;
      var hasHoles = holeIndices && holeIndices.length, outerLen = hasHoles ? holeIndices[0] * dim : data.length, outerNode = linkedList(data, 0, outerLen, dim, true), triangles = [];
      if (!outerNode || outerNode.next === outerNode.prev)
        return triangles;
      var minX, minY, maxX, maxY, x, y, invSize;
      if (hasHoles)
        outerNode = eliminateHoles(data, holeIndices, outerNode, dim);
      if (data.length > 80 * dim) {
        minX = maxX = data[0];
        minY = maxY = data[1];
        for (var i = dim; i < outerLen; i += dim) {
          x = data[i];
          y = data[i + 1];
          if (x < minX)
            minX = x;
          if (y < minY)
            minY = y;
          if (x > maxX)
            maxX = x;
          if (y > maxY)
            maxY = y;
        }
        invSize = Math.max(maxX - minX, maxY - minY);
        invSize = invSize !== 0 ? 1 / invSize : 0;
      }
      earcutLinked(outerNode, triangles, dim, minX, minY, invSize);
      return triangles;
    }
    function linkedList(data, start, end, dim, clockwise) {
      var i, last;
      if (clockwise === signedArea(data, start, end, dim) > 0) {
        for (i = start; i < end; i += dim)
          last = insertNode(i, data[i], data[i + 1], last);
      } else {
        for (i = end - dim; i >= start; i -= dim)
          last = insertNode(i, data[i], data[i + 1], last);
      }
      if (last && equals(last, last.next)) {
        removeNode(last);
        last = last.next;
      }
      return last;
    }
    function filterPoints(start, end) {
      if (!start)
        return start;
      if (!end)
        end = start;
      var p = start, again;
      do {
        again = false;
        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
          removeNode(p);
          p = end = p.prev;
          if (p === p.next)
            break;
          again = true;
        } else {
          p = p.next;
        }
      } while (again || p !== end);
      return end;
    }
    function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
      if (!ear)
        return;
      if (!pass && invSize)
        indexCurve(ear, minX, minY, invSize);
      var stop = ear, prev, next;
      while (ear.prev !== ear.next) {
        prev = ear.prev;
        next = ear.next;
        if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
          triangles.push(prev.i / dim);
          triangles.push(ear.i / dim);
          triangles.push(next.i / dim);
          removeNode(ear);
          ear = next.next;
          stop = next.next;
          continue;
        }
        ear = next;
        if (ear === stop) {
          if (!pass) {
            earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);
          } else if (pass === 1) {
            ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
            earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);
          } else if (pass === 2) {
            splitEarcut(ear, triangles, dim, minX, minY, invSize);
          }
          break;
        }
      }
    }
    function isEar(ear) {
      var a = ear.prev, b = ear, c = ear.next;
      if (area(a, b, c) >= 0)
        return false;
      var p = ear.next.next;
      while (p !== ear.prev) {
        if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) && area(p.prev, p, p.next) >= 0)
          return false;
        p = p.next;
      }
      return true;
    }
    function isEarHashed(ear, minX, minY, invSize) {
      var a = ear.prev, b = ear, c = ear.next;
      if (area(a, b, c) >= 0)
        return false;
      var minTX = a.x < b.x ? a.x < c.x ? a.x : c.x : b.x < c.x ? b.x : c.x, minTY = a.y < b.y ? a.y < c.y ? a.y : c.y : b.y < c.y ? b.y : c.y, maxTX = a.x > b.x ? a.x > c.x ? a.x : c.x : b.x > c.x ? b.x : c.x, maxTY = a.y > b.y ? a.y > c.y ? a.y : c.y : b.y > c.y ? b.y : c.y;
      var minZ = zOrder(minTX, minTY, minX, minY, invSize), maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);
      var p = ear.prevZ, n = ear.nextZ;
      while (p && p.z >= minZ && n && n.z <= maxZ) {
        if (p !== ear.prev && p !== ear.next && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) && area(p.prev, p, p.next) >= 0)
          return false;
        p = p.prevZ;
        if (n !== ear.prev && n !== ear.next && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) && area(n.prev, n, n.next) >= 0)
          return false;
        n = n.nextZ;
      }
      while (p && p.z >= minZ) {
        if (p !== ear.prev && p !== ear.next && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) && area(p.prev, p, p.next) >= 0)
          return false;
        p = p.prevZ;
      }
      while (n && n.z <= maxZ) {
        if (n !== ear.prev && n !== ear.next && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) && area(n.prev, n, n.next) >= 0)
          return false;
        n = n.nextZ;
      }
      return true;
    }
    function cureLocalIntersections(start, triangles, dim) {
      var p = start;
      do {
        var a = p.prev, b = p.next.next;
        if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {
          triangles.push(a.i / dim);
          triangles.push(p.i / dim);
          triangles.push(b.i / dim);
          removeNode(p);
          removeNode(p.next);
          p = start = b;
        }
        p = p.next;
      } while (p !== start);
      return filterPoints(p);
    }
    function splitEarcut(start, triangles, dim, minX, minY, invSize) {
      var a = start;
      do {
        var b = a.next.next;
        while (b !== a.prev) {
          if (a.i !== b.i && isValidDiagonal(a, b)) {
            var c = splitPolygon(a, b);
            a = filterPoints(a, a.next);
            c = filterPoints(c, c.next);
            earcutLinked(a, triangles, dim, minX, minY, invSize);
            earcutLinked(c, triangles, dim, minX, minY, invSize);
            return;
          }
          b = b.next;
        }
        a = a.next;
      } while (a !== start);
    }
    function eliminateHoles(data, holeIndices, outerNode, dim) {
      var queue = [], i, len, start, end, list;
      for (i = 0, len = holeIndices.length; i < len; i++) {
        start = holeIndices[i] * dim;
        end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
        list = linkedList(data, start, end, dim, false);
        if (list === list.next)
          list.steiner = true;
        queue.push(getLeftmost(list));
      }
      queue.sort(compareX);
      for (i = 0; i < queue.length; i++) {
        outerNode = eliminateHole(queue[i], outerNode);
        outerNode = filterPoints(outerNode, outerNode.next);
      }
      return outerNode;
    }
    function compareX(a, b) {
      return a.x - b.x;
    }
    function eliminateHole(hole, outerNode) {
      var bridge = findHoleBridge(hole, outerNode);
      if (!bridge) {
        return outerNode;
      }
      var bridgeReverse = splitPolygon(bridge, hole);
      var filteredBridge = filterPoints(bridge, bridge.next);
      filterPoints(bridgeReverse, bridgeReverse.next);
      return outerNode === bridge ? filteredBridge : outerNode;
    }
    function findHoleBridge(hole, outerNode) {
      var p = outerNode, hx = hole.x, hy = hole.y, qx = -Infinity, m;
      do {
        if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
          var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
          if (x <= hx && x > qx) {
            qx = x;
            if (x === hx) {
              if (hy === p.y)
                return p;
              if (hy === p.next.y)
                return p.next;
            }
            m = p.x < p.next.x ? p : p.next;
          }
        }
        p = p.next;
      } while (p !== outerNode);
      if (!m)
        return null;
      if (hx === qx)
        return m;
      var stop = m, mx = m.x, my = m.y, tanMin = Infinity, tan;
      p = m;
      do {
        if (hx >= p.x && p.x >= mx && hx !== p.x && pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {
          tan = Math.abs(hy - p.y) / (hx - p.x);
          if (locallyInside(p, hole) && (tan < tanMin || tan === tanMin && (p.x > m.x || p.x === m.x && sectorContainsSector(m, p)))) {
            m = p;
            tanMin = tan;
          }
        }
        p = p.next;
      } while (p !== stop);
      return m;
    }
    function sectorContainsSector(m, p) {
      return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
    }
    function indexCurve(start, minX, minY, invSize) {
      var p = start;
      do {
        if (p.z === null)
          p.z = zOrder(p.x, p.y, minX, minY, invSize);
        p.prevZ = p.prev;
        p.nextZ = p.next;
        p = p.next;
      } while (p !== start);
      p.prevZ.nextZ = null;
      p.prevZ = null;
      sortLinked(p);
    }
    function sortLinked(list) {
      var i, p, q, e, tail, numMerges, pSize, qSize, inSize = 1;
      do {
        p = list;
        list = null;
        tail = null;
        numMerges = 0;
        while (p) {
          numMerges++;
          q = p;
          pSize = 0;
          for (i = 0; i < inSize; i++) {
            pSize++;
            q = q.nextZ;
            if (!q)
              break;
          }
          qSize = inSize;
          while (pSize > 0 || qSize > 0 && q) {
            if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
              e = p;
              p = p.nextZ;
              pSize--;
            } else {
              e = q;
              q = q.nextZ;
              qSize--;
            }
            if (tail)
              tail.nextZ = e;
            else
              list = e;
            e.prevZ = tail;
            tail = e;
          }
          p = q;
        }
        tail.nextZ = null;
        inSize *= 2;
      } while (numMerges > 1);
      return list;
    }
    function zOrder(x, y, minX, minY, invSize) {
      x = 32767 * (x - minX) * invSize;
      y = 32767 * (y - minY) * invSize;
      x = (x | x << 8) & 16711935;
      x = (x | x << 4) & 252645135;
      x = (x | x << 2) & 858993459;
      x = (x | x << 1) & 1431655765;
      y = (y | y << 8) & 16711935;
      y = (y | y << 4) & 252645135;
      y = (y | y << 2) & 858993459;
      y = (y | y << 1) & 1431655765;
      return x | y << 1;
    }
    function getLeftmost(start) {
      var p = start, leftmost = start;
      do {
        if (p.x < leftmost.x || p.x === leftmost.x && p.y < leftmost.y)
          leftmost = p;
        p = p.next;
      } while (p !== start);
      return leftmost;
    }
    function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
      return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 && (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 && (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
    }
    function isValidDiagonal(a, b) {
      return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && (area(a.prev, a, b.prev) || area(a, b.prev, b)) || equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0);
    }
    function area(p, q, r) {
      return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    }
    function equals(p1, p2) {
      return p1.x === p2.x && p1.y === p2.y;
    }
    function intersects(p1, q1, p2, q2) {
      var o1 = sign(area(p1, q1, p2));
      var o2 = sign(area(p1, q1, q2));
      var o3 = sign(area(p2, q2, p1));
      var o4 = sign(area(p2, q2, q1));
      if (o1 !== o2 && o3 !== o4)
        return true;
      if (o1 === 0 && onSegment(p1, p2, q1))
        return true;
      if (o2 === 0 && onSegment(p1, q2, q1))
        return true;
      if (o3 === 0 && onSegment(p2, p1, q2))
        return true;
      if (o4 === 0 && onSegment(p2, q1, q2))
        return true;
      return false;
    }
    function onSegment(p, q, r) {
      return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    }
    function sign(num) {
      return num > 0 ? 1 : num < 0 ? -1 : 0;
    }
    function intersectsPolygon(a, b) {
      var p = a;
      do {
        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i && intersects(p, p.next, a, b))
          return true;
        p = p.next;
      } while (p !== a);
      return false;
    }
    function locallyInside(a, b) {
      return area(a.prev, a, a.next) < 0 ? area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 : area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
    }
    function middleInside(a, b) {
      var p = a, inside = false, px = (a.x + b.x) / 2, py = (a.y + b.y) / 2;
      do {
        if (p.y > py !== p.next.y > py && p.next.y !== p.y && px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x)
          inside = !inside;
        p = p.next;
      } while (p !== a);
      return inside;
    }
    function splitPolygon(a, b) {
      var a2 = new Node(a.i, a.x, a.y), b2 = new Node(b.i, b.x, b.y), an = a.next, bp = b.prev;
      a.next = b;
      b.prev = a;
      a2.next = an;
      an.prev = a2;
      b2.next = a2;
      a2.prev = b2;
      bp.next = b2;
      b2.prev = bp;
      return b2;
    }
    function insertNode(i, x, y, last) {
      var p = new Node(i, x, y);
      if (!last) {
        p.prev = p;
        p.next = p;
      } else {
        p.next = last.next;
        p.prev = last;
        last.next.prev = p;
        last.next = p;
      }
      return p;
    }
    function removeNode(p) {
      p.next.prev = p.prev;
      p.prev.next = p.next;
      if (p.prevZ)
        p.prevZ.nextZ = p.nextZ;
      if (p.nextZ)
        p.nextZ.prevZ = p.prevZ;
    }
    function Node(i, x, y) {
      this.i = i;
      this.x = x;
      this.y = y;
      this.prev = null;
      this.next = null;
      this.z = null;
      this.prevZ = null;
      this.nextZ = null;
      this.steiner = false;
    }
    earcut.deviation = function(data, holeIndices, dim, triangles) {
      var hasHoles = holeIndices && holeIndices.length;
      var outerLen = hasHoles ? holeIndices[0] * dim : data.length;
      var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
      if (hasHoles) {
        for (var i = 0, len = holeIndices.length; i < len; i++) {
          var start = holeIndices[i] * dim;
          var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
          polygonArea -= Math.abs(signedArea(data, start, end, dim));
        }
      }
      var trianglesArea = 0;
      for (i = 0; i < triangles.length; i += 3) {
        var a = triangles[i] * dim;
        var b = triangles[i + 1] * dim;
        var c = triangles[i + 2] * dim;
        trianglesArea += Math.abs((data[a] - data[c]) * (data[b + 1] - data[a + 1]) - (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
      }
      return polygonArea === 0 && trianglesArea === 0 ? 0 : Math.abs((trianglesArea - polygonArea) / polygonArea);
    };
    function signedArea(data, start, end, dim) {
      var sum = 0;
      for (var i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
      }
      return sum;
    }
    earcut.flatten = function(data) {
      var dim = data[0][0].length, result = { vertices: [], holes: [], dimensions: dim }, holeIndex = 0;
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
          for (var d = 0; d < dim; d++)
            result.vertices.push(data[i][j][d]);
        }
        if (i > 0) {
          holeIndex += data[i - 1].length;
          result.holes.push(holeIndex);
        }
      }
      return result;
    };
  }
});

// node_modules/@pixi/constants/dist/cjs/constants.js
var require_constants = __commonJS({
  "node_modules/@pixi/constants/dist/cjs/constants.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (function(ENV) {
      ENV[ENV["WEBGL_LEGACY"] = 0] = "WEBGL_LEGACY";
      ENV[ENV["WEBGL"] = 1] = "WEBGL";
      ENV[ENV["WEBGL2"] = 2] = "WEBGL2";
    })(exports.ENV || (exports.ENV = {}));
    (function(RENDERER_TYPE) {
      RENDERER_TYPE[RENDERER_TYPE["UNKNOWN"] = 0] = "UNKNOWN";
      RENDERER_TYPE[RENDERER_TYPE["WEBGL"] = 1] = "WEBGL";
      RENDERER_TYPE[RENDERER_TYPE["CANVAS"] = 2] = "CANVAS";
    })(exports.RENDERER_TYPE || (exports.RENDERER_TYPE = {}));
    (function(BUFFER_BITS) {
      BUFFER_BITS[BUFFER_BITS["COLOR"] = 16384] = "COLOR";
      BUFFER_BITS[BUFFER_BITS["DEPTH"] = 256] = "DEPTH";
      BUFFER_BITS[BUFFER_BITS["STENCIL"] = 1024] = "STENCIL";
    })(exports.BUFFER_BITS || (exports.BUFFER_BITS = {}));
    (function(BLEND_MODES) {
      BLEND_MODES[BLEND_MODES["NORMAL"] = 0] = "NORMAL";
      BLEND_MODES[BLEND_MODES["ADD"] = 1] = "ADD";
      BLEND_MODES[BLEND_MODES["MULTIPLY"] = 2] = "MULTIPLY";
      BLEND_MODES[BLEND_MODES["SCREEN"] = 3] = "SCREEN";
      BLEND_MODES[BLEND_MODES["OVERLAY"] = 4] = "OVERLAY";
      BLEND_MODES[BLEND_MODES["DARKEN"] = 5] = "DARKEN";
      BLEND_MODES[BLEND_MODES["LIGHTEN"] = 6] = "LIGHTEN";
      BLEND_MODES[BLEND_MODES["COLOR_DODGE"] = 7] = "COLOR_DODGE";
      BLEND_MODES[BLEND_MODES["COLOR_BURN"] = 8] = "COLOR_BURN";
      BLEND_MODES[BLEND_MODES["HARD_LIGHT"] = 9] = "HARD_LIGHT";
      BLEND_MODES[BLEND_MODES["SOFT_LIGHT"] = 10] = "SOFT_LIGHT";
      BLEND_MODES[BLEND_MODES["DIFFERENCE"] = 11] = "DIFFERENCE";
      BLEND_MODES[BLEND_MODES["EXCLUSION"] = 12] = "EXCLUSION";
      BLEND_MODES[BLEND_MODES["HUE"] = 13] = "HUE";
      BLEND_MODES[BLEND_MODES["SATURATION"] = 14] = "SATURATION";
      BLEND_MODES[BLEND_MODES["COLOR"] = 15] = "COLOR";
      BLEND_MODES[BLEND_MODES["LUMINOSITY"] = 16] = "LUMINOSITY";
      BLEND_MODES[BLEND_MODES["NORMAL_NPM"] = 17] = "NORMAL_NPM";
      BLEND_MODES[BLEND_MODES["ADD_NPM"] = 18] = "ADD_NPM";
      BLEND_MODES[BLEND_MODES["SCREEN_NPM"] = 19] = "SCREEN_NPM";
      BLEND_MODES[BLEND_MODES["NONE"] = 20] = "NONE";
      BLEND_MODES[BLEND_MODES["SRC_OVER"] = 0] = "SRC_OVER";
      BLEND_MODES[BLEND_MODES["SRC_IN"] = 21] = "SRC_IN";
      BLEND_MODES[BLEND_MODES["SRC_OUT"] = 22] = "SRC_OUT";
      BLEND_MODES[BLEND_MODES["SRC_ATOP"] = 23] = "SRC_ATOP";
      BLEND_MODES[BLEND_MODES["DST_OVER"] = 24] = "DST_OVER";
      BLEND_MODES[BLEND_MODES["DST_IN"] = 25] = "DST_IN";
      BLEND_MODES[BLEND_MODES["DST_OUT"] = 26] = "DST_OUT";
      BLEND_MODES[BLEND_MODES["DST_ATOP"] = 27] = "DST_ATOP";
      BLEND_MODES[BLEND_MODES["ERASE"] = 26] = "ERASE";
      BLEND_MODES[BLEND_MODES["SUBTRACT"] = 28] = "SUBTRACT";
      BLEND_MODES[BLEND_MODES["XOR"] = 29] = "XOR";
    })(exports.BLEND_MODES || (exports.BLEND_MODES = {}));
    (function(DRAW_MODES) {
      DRAW_MODES[DRAW_MODES["POINTS"] = 0] = "POINTS";
      DRAW_MODES[DRAW_MODES["LINES"] = 1] = "LINES";
      DRAW_MODES[DRAW_MODES["LINE_LOOP"] = 2] = "LINE_LOOP";
      DRAW_MODES[DRAW_MODES["LINE_STRIP"] = 3] = "LINE_STRIP";
      DRAW_MODES[DRAW_MODES["TRIANGLES"] = 4] = "TRIANGLES";
      DRAW_MODES[DRAW_MODES["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
      DRAW_MODES[DRAW_MODES["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
    })(exports.DRAW_MODES || (exports.DRAW_MODES = {}));
    (function(FORMATS) {
      FORMATS[FORMATS["RGBA"] = 6408] = "RGBA";
      FORMATS[FORMATS["RGB"] = 6407] = "RGB";
      FORMATS[FORMATS["RG"] = 33319] = "RG";
      FORMATS[FORMATS["RED"] = 6403] = "RED";
      FORMATS[FORMATS["RGBA_INTEGER"] = 36249] = "RGBA_INTEGER";
      FORMATS[FORMATS["RGB_INTEGER"] = 36248] = "RGB_INTEGER";
      FORMATS[FORMATS["RG_INTEGER"] = 33320] = "RG_INTEGER";
      FORMATS[FORMATS["RED_INTEGER"] = 36244] = "RED_INTEGER";
      FORMATS[FORMATS["ALPHA"] = 6406] = "ALPHA";
      FORMATS[FORMATS["LUMINANCE"] = 6409] = "LUMINANCE";
      FORMATS[FORMATS["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
      FORMATS[FORMATS["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
      FORMATS[FORMATS["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
    })(exports.FORMATS || (exports.FORMATS = {}));
    (function(TARGETS) {
      TARGETS[TARGETS["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
      TARGETS[TARGETS["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
      TARGETS[TARGETS["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
      TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
      TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
      TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
      TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
      TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
      TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
    })(exports.TARGETS || (exports.TARGETS = {}));
    (function(TYPES) {
      TYPES[TYPES["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
      TYPES[TYPES["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
      TYPES[TYPES["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
      TYPES[TYPES["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
      TYPES[TYPES["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
      TYPES[TYPES["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
      TYPES[TYPES["UNSIGNED_INT_10F_11F_11F_REV"] = 35899] = "UNSIGNED_INT_10F_11F_11F_REV";
      TYPES[TYPES["UNSIGNED_INT_2_10_10_10_REV"] = 33640] = "UNSIGNED_INT_2_10_10_10_REV";
      TYPES[TYPES["UNSIGNED_INT_24_8"] = 34042] = "UNSIGNED_INT_24_8";
      TYPES[TYPES["UNSIGNED_INT_5_9_9_9_REV"] = 35902] = "UNSIGNED_INT_5_9_9_9_REV";
      TYPES[TYPES["BYTE"] = 5120] = "BYTE";
      TYPES[TYPES["SHORT"] = 5122] = "SHORT";
      TYPES[TYPES["INT"] = 5124] = "INT";
      TYPES[TYPES["FLOAT"] = 5126] = "FLOAT";
      TYPES[TYPES["FLOAT_32_UNSIGNED_INT_24_8_REV"] = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV";
      TYPES[TYPES["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
    })(exports.TYPES || (exports.TYPES = {}));
    (function(SAMPLER_TYPES) {
      SAMPLER_TYPES[SAMPLER_TYPES["FLOAT"] = 0] = "FLOAT";
      SAMPLER_TYPES[SAMPLER_TYPES["INT"] = 1] = "INT";
      SAMPLER_TYPES[SAMPLER_TYPES["UINT"] = 2] = "UINT";
    })(exports.SAMPLER_TYPES || (exports.SAMPLER_TYPES = {}));
    (function(SCALE_MODES) {
      SCALE_MODES[SCALE_MODES["NEAREST"] = 0] = "NEAREST";
      SCALE_MODES[SCALE_MODES["LINEAR"] = 1] = "LINEAR";
    })(exports.SCALE_MODES || (exports.SCALE_MODES = {}));
    (function(WRAP_MODES) {
      WRAP_MODES[WRAP_MODES["CLAMP"] = 33071] = "CLAMP";
      WRAP_MODES[WRAP_MODES["REPEAT"] = 10497] = "REPEAT";
      WRAP_MODES[WRAP_MODES["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
    })(exports.WRAP_MODES || (exports.WRAP_MODES = {}));
    (function(MIPMAP_MODES) {
      MIPMAP_MODES[MIPMAP_MODES["OFF"] = 0] = "OFF";
      MIPMAP_MODES[MIPMAP_MODES["POW2"] = 1] = "POW2";
      MIPMAP_MODES[MIPMAP_MODES["ON"] = 2] = "ON";
      MIPMAP_MODES[MIPMAP_MODES["ON_MANUAL"] = 3] = "ON_MANUAL";
    })(exports.MIPMAP_MODES || (exports.MIPMAP_MODES = {}));
    (function(ALPHA_MODES) {
      ALPHA_MODES[ALPHA_MODES["NPM"] = 0] = "NPM";
      ALPHA_MODES[ALPHA_MODES["UNPACK"] = 1] = "UNPACK";
      ALPHA_MODES[ALPHA_MODES["PMA"] = 2] = "PMA";
      ALPHA_MODES[ALPHA_MODES["NO_PREMULTIPLIED_ALPHA"] = 0] = "NO_PREMULTIPLIED_ALPHA";
      ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ON_UPLOAD"] = 1] = "PREMULTIPLY_ON_UPLOAD";
      ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ALPHA"] = 2] = "PREMULTIPLY_ALPHA";
      ALPHA_MODES[ALPHA_MODES["PREMULTIPLIED_ALPHA"] = 2] = "PREMULTIPLIED_ALPHA";
    })(exports.ALPHA_MODES || (exports.ALPHA_MODES = {}));
    (function(CLEAR_MODES) {
      CLEAR_MODES[CLEAR_MODES["NO"] = 0] = "NO";
      CLEAR_MODES[CLEAR_MODES["YES"] = 1] = "YES";
      CLEAR_MODES[CLEAR_MODES["AUTO"] = 2] = "AUTO";
      CLEAR_MODES[CLEAR_MODES["BLEND"] = 0] = "BLEND";
      CLEAR_MODES[CLEAR_MODES["CLEAR"] = 1] = "CLEAR";
      CLEAR_MODES[CLEAR_MODES["BLIT"] = 2] = "BLIT";
    })(exports.CLEAR_MODES || (exports.CLEAR_MODES = {}));
    (function(GC_MODES) {
      GC_MODES[GC_MODES["AUTO"] = 0] = "AUTO";
      GC_MODES[GC_MODES["MANUAL"] = 1] = "MANUAL";
    })(exports.GC_MODES || (exports.GC_MODES = {}));
    (function(PRECISION) {
      PRECISION["LOW"] = "lowp";
      PRECISION["MEDIUM"] = "mediump";
      PRECISION["HIGH"] = "highp";
    })(exports.PRECISION || (exports.PRECISION = {}));
    (function(MASK_TYPES) {
      MASK_TYPES[MASK_TYPES["NONE"] = 0] = "NONE";
      MASK_TYPES[MASK_TYPES["SCISSOR"] = 1] = "SCISSOR";
      MASK_TYPES[MASK_TYPES["STENCIL"] = 2] = "STENCIL";
      MASK_TYPES[MASK_TYPES["SPRITE"] = 3] = "SPRITE";
    })(exports.MASK_TYPES || (exports.MASK_TYPES = {}));
    (function(MSAA_QUALITY) {
      MSAA_QUALITY[MSAA_QUALITY["NONE"] = 0] = "NONE";
      MSAA_QUALITY[MSAA_QUALITY["LOW"] = 2] = "LOW";
      MSAA_QUALITY[MSAA_QUALITY["MEDIUM"] = 4] = "MEDIUM";
      MSAA_QUALITY[MSAA_QUALITY["HIGH"] = 8] = "HIGH";
    })(exports.MSAA_QUALITY || (exports.MSAA_QUALITY = {}));
    (function(BUFFER_TYPE) {
      BUFFER_TYPE[BUFFER_TYPE["ELEMENT_ARRAY_BUFFER"] = 34963] = "ELEMENT_ARRAY_BUFFER";
      BUFFER_TYPE[BUFFER_TYPE["ARRAY_BUFFER"] = 34962] = "ARRAY_BUFFER";
      BUFFER_TYPE[BUFFER_TYPE["UNIFORM_BUFFER"] = 35345] = "UNIFORM_BUFFER";
    })(exports.BUFFER_TYPE || (exports.BUFFER_TYPE = {}));
  }
});

// node_modules/@pixi/utils/dist/cjs/utils.js
var require_utils = __commonJS({
  "node_modules/@pixi/utils/dist/cjs/utils.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    var settings = require_settings();
    var eventemitter3 = _interopDefault(require_eventemitter3());
    var earcut = _interopDefault(require_earcut());
    var url$1 = require("url");
    var constants = require_constants();
    var url = {
      parse: url$1.parse,
      format: url$1.format,
      resolve: url$1.resolve
    };
    settings.settings.RETINA_PREFIX = /@([0-9\.]+)x/;
    settings.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;
    var saidHello = false;
    var VERSION = "6.2.0";
    function skipHello() {
      saidHello = true;
    }
    function sayHello(type) {
      var _a;
      if (saidHello) {
        return;
      }
      if (navigator.userAgent.toLowerCase().indexOf("chrome") > -1) {
        var args = [
          "\n %c %c %c PixiJS " + VERSION + " - \u2730 " + type + " \u2730  %c  %c  http://www.pixijs.com/  %c %c \u2665%c\u2665%c\u2665 \n\n",
          "background: #ff66a5; padding:5px 0;",
          "background: #ff66a5; padding:5px 0;",
          "color: #ff66a5; background: #030307; padding:5px 0;",
          "background: #ff66a5; padding:5px 0;",
          "background: #ffc3dc; padding:5px 0;",
          "background: #ff66a5; padding:5px 0;",
          "color: #ff2424; background: #fff; padding:5px 0;",
          "color: #ff2424; background: #fff; padding:5px 0;",
          "color: #ff2424; background: #fff; padding:5px 0;"
        ];
        (_a = self.console).log.apply(_a, args);
      } else if (self.console) {
        self.console.log("PixiJS " + VERSION + " - " + type + " - http://www.pixijs.com/");
      }
      saidHello = true;
    }
    var supported;
    function isWebGLSupported() {
      if (typeof supported === "undefined") {
        supported = function supported2() {
          var contextOptions = {
            stencil: true,
            failIfMajorPerformanceCaveat: settings.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT
          };
          try {
            if (!self.WebGLRenderingContext) {
              return false;
            }
            var canvas = document.createElement("canvas");
            var gl = canvas.getContext("webgl", contextOptions) || canvas.getContext("experimental-webgl", contextOptions);
            var success = !!(gl && gl.getContextAttributes().stencil);
            if (gl) {
              var loseContext = gl.getExtension("WEBGL_lose_context");
              if (loseContext) {
                loseContext.loseContext();
              }
            }
            gl = null;
            return success;
          } catch (e) {
            return false;
          }
        }();
      }
      return supported;
    }
    var aliceblue = "#f0f8ff";
    var antiquewhite = "#faebd7";
    var aqua = "#00ffff";
    var aquamarine = "#7fffd4";
    var azure = "#f0ffff";
    var beige = "#f5f5dc";
    var bisque = "#ffe4c4";
    var black = "#000000";
    var blanchedalmond = "#ffebcd";
    var blue = "#0000ff";
    var blueviolet = "#8a2be2";
    var brown = "#a52a2a";
    var burlywood = "#deb887";
    var cadetblue = "#5f9ea0";
    var chartreuse = "#7fff00";
    var chocolate = "#d2691e";
    var coral = "#ff7f50";
    var cornflowerblue = "#6495ed";
    var cornsilk = "#fff8dc";
    var crimson = "#dc143c";
    var cyan = "#00ffff";
    var darkblue = "#00008b";
    var darkcyan = "#008b8b";
    var darkgoldenrod = "#b8860b";
    var darkgray = "#a9a9a9";
    var darkgreen = "#006400";
    var darkgrey = "#a9a9a9";
    var darkkhaki = "#bdb76b";
    var darkmagenta = "#8b008b";
    var darkolivegreen = "#556b2f";
    var darkorange = "#ff8c00";
    var darkorchid = "#9932cc";
    var darkred = "#8b0000";
    var darksalmon = "#e9967a";
    var darkseagreen = "#8fbc8f";
    var darkslateblue = "#483d8b";
    var darkslategray = "#2f4f4f";
    var darkslategrey = "#2f4f4f";
    var darkturquoise = "#00ced1";
    var darkviolet = "#9400d3";
    var deeppink = "#ff1493";
    var deepskyblue = "#00bfff";
    var dimgray = "#696969";
    var dimgrey = "#696969";
    var dodgerblue = "#1e90ff";
    var firebrick = "#b22222";
    var floralwhite = "#fffaf0";
    var forestgreen = "#228b22";
    var fuchsia = "#ff00ff";
    var gainsboro = "#dcdcdc";
    var ghostwhite = "#f8f8ff";
    var goldenrod = "#daa520";
    var gold = "#ffd700";
    var gray = "#808080";
    var green = "#008000";
    var greenyellow = "#adff2f";
    var grey = "#808080";
    var honeydew = "#f0fff0";
    var hotpink = "#ff69b4";
    var indianred = "#cd5c5c";
    var indigo = "#4b0082";
    var ivory = "#fffff0";
    var khaki = "#f0e68c";
    var lavenderblush = "#fff0f5";
    var lavender = "#e6e6fa";
    var lawngreen = "#7cfc00";
    var lemonchiffon = "#fffacd";
    var lightblue = "#add8e6";
    var lightcoral = "#f08080";
    var lightcyan = "#e0ffff";
    var lightgoldenrodyellow = "#fafad2";
    var lightgray = "#d3d3d3";
    var lightgreen = "#90ee90";
    var lightgrey = "#d3d3d3";
    var lightpink = "#ffb6c1";
    var lightsalmon = "#ffa07a";
    var lightseagreen = "#20b2aa";
    var lightskyblue = "#87cefa";
    var lightslategray = "#778899";
    var lightslategrey = "#778899";
    var lightsteelblue = "#b0c4de";
    var lightyellow = "#ffffe0";
    var lime = "#00ff00";
    var limegreen = "#32cd32";
    var linen = "#faf0e6";
    var magenta = "#ff00ff";
    var maroon = "#800000";
    var mediumaquamarine = "#66cdaa";
    var mediumblue = "#0000cd";
    var mediumorchid = "#ba55d3";
    var mediumpurple = "#9370db";
    var mediumseagreen = "#3cb371";
    var mediumslateblue = "#7b68ee";
    var mediumspringgreen = "#00fa9a";
    var mediumturquoise = "#48d1cc";
    var mediumvioletred = "#c71585";
    var midnightblue = "#191970";
    var mintcream = "#f5fffa";
    var mistyrose = "#ffe4e1";
    var moccasin = "#ffe4b5";
    var navajowhite = "#ffdead";
    var navy = "#000080";
    var oldlace = "#fdf5e6";
    var olive = "#808000";
    var olivedrab = "#6b8e23";
    var orange = "#ffa500";
    var orangered = "#ff4500";
    var orchid = "#da70d6";
    var palegoldenrod = "#eee8aa";
    var palegreen = "#98fb98";
    var paleturquoise = "#afeeee";
    var palevioletred = "#db7093";
    var papayawhip = "#ffefd5";
    var peachpuff = "#ffdab9";
    var peru = "#cd853f";
    var pink = "#ffc0cb";
    var plum = "#dda0dd";
    var powderblue = "#b0e0e6";
    var purple = "#800080";
    var rebeccapurple = "#663399";
    var red = "#ff0000";
    var rosybrown = "#bc8f8f";
    var royalblue = "#4169e1";
    var saddlebrown = "#8b4513";
    var salmon = "#fa8072";
    var sandybrown = "#f4a460";
    var seagreen = "#2e8b57";
    var seashell = "#fff5ee";
    var sienna = "#a0522d";
    var silver = "#c0c0c0";
    var skyblue = "#87ceeb";
    var slateblue = "#6a5acd";
    var slategray = "#708090";
    var slategrey = "#708090";
    var snow = "#fffafa";
    var springgreen = "#00ff7f";
    var steelblue = "#4682b4";
    var tan = "#d2b48c";
    var teal = "#008080";
    var thistle = "#d8bfd8";
    var tomato = "#ff6347";
    var turquoise = "#40e0d0";
    var violet = "#ee82ee";
    var wheat = "#f5deb3";
    var white = "#ffffff";
    var whitesmoke = "#f5f5f5";
    var yellow = "#ffff00";
    var yellowgreen = "#9acd32";
    var cssColorNames = {
      aliceblue,
      antiquewhite,
      aqua,
      aquamarine,
      azure,
      beige,
      bisque,
      black,
      blanchedalmond,
      blue,
      blueviolet,
      brown,
      burlywood,
      cadetblue,
      chartreuse,
      chocolate,
      coral,
      cornflowerblue,
      cornsilk,
      crimson,
      cyan,
      darkblue,
      darkcyan,
      darkgoldenrod,
      darkgray,
      darkgreen,
      darkgrey,
      darkkhaki,
      darkmagenta,
      darkolivegreen,
      darkorange,
      darkorchid,
      darkred,
      darksalmon,
      darkseagreen,
      darkslateblue,
      darkslategray,
      darkslategrey,
      darkturquoise,
      darkviolet,
      deeppink,
      deepskyblue,
      dimgray,
      dimgrey,
      dodgerblue,
      firebrick,
      floralwhite,
      forestgreen,
      fuchsia,
      gainsboro,
      ghostwhite,
      goldenrod,
      gold,
      gray,
      green,
      greenyellow,
      grey,
      honeydew,
      hotpink,
      indianred,
      indigo,
      ivory,
      khaki,
      lavenderblush,
      lavender,
      lawngreen,
      lemonchiffon,
      lightblue,
      lightcoral,
      lightcyan,
      lightgoldenrodyellow,
      lightgray,
      lightgreen,
      lightgrey,
      lightpink,
      lightsalmon,
      lightseagreen,
      lightskyblue,
      lightslategray,
      lightslategrey,
      lightsteelblue,
      lightyellow,
      lime,
      limegreen,
      linen,
      magenta,
      maroon,
      mediumaquamarine,
      mediumblue,
      mediumorchid,
      mediumpurple,
      mediumseagreen,
      mediumslateblue,
      mediumspringgreen,
      mediumturquoise,
      mediumvioletred,
      midnightblue,
      mintcream,
      mistyrose,
      moccasin,
      navajowhite,
      navy,
      oldlace,
      olive,
      olivedrab,
      orange,
      orangered,
      orchid,
      palegoldenrod,
      palegreen,
      paleturquoise,
      palevioletred,
      papayawhip,
      peachpuff,
      peru,
      pink,
      plum,
      powderblue,
      purple,
      rebeccapurple,
      red,
      rosybrown,
      royalblue,
      saddlebrown,
      salmon,
      sandybrown,
      seagreen,
      seashell,
      sienna,
      silver,
      skyblue,
      slateblue,
      slategray,
      slategrey,
      snow,
      springgreen,
      steelblue,
      tan,
      teal,
      thistle,
      tomato,
      turquoise,
      violet,
      wheat,
      white,
      whitesmoke,
      yellow,
      yellowgreen
    };
    function hex2rgb(hex, out) {
      if (out === void 0) {
        out = [];
      }
      out[0] = (hex >> 16 & 255) / 255;
      out[1] = (hex >> 8 & 255) / 255;
      out[2] = (hex & 255) / 255;
      return out;
    }
    function hex2string(hex) {
      var hexString = hex.toString(16);
      hexString = "000000".substr(0, 6 - hexString.length) + hexString;
      return "#" + hexString;
    }
    function string2hex(string) {
      if (typeof string === "string") {
        string = cssColorNames[string.toLowerCase()] || string;
        if (string[0] === "#") {
          string = string.substr(1);
        }
      }
      return parseInt(string, 16);
    }
    function rgb2hex(rgb) {
      return (rgb[0] * 255 << 16) + (rgb[1] * 255 << 8) + (rgb[2] * 255 | 0);
    }
    function mapPremultipliedBlendModes() {
      var pm = [];
      var npm = [];
      for (var i = 0; i < 32; i++) {
        pm[i] = i;
        npm[i] = i;
      }
      pm[constants.BLEND_MODES.NORMAL_NPM] = constants.BLEND_MODES.NORMAL;
      pm[constants.BLEND_MODES.ADD_NPM] = constants.BLEND_MODES.ADD;
      pm[constants.BLEND_MODES.SCREEN_NPM] = constants.BLEND_MODES.SCREEN;
      npm[constants.BLEND_MODES.NORMAL] = constants.BLEND_MODES.NORMAL_NPM;
      npm[constants.BLEND_MODES.ADD] = constants.BLEND_MODES.ADD_NPM;
      npm[constants.BLEND_MODES.SCREEN] = constants.BLEND_MODES.SCREEN_NPM;
      var array = [];
      array.push(npm);
      array.push(pm);
      return array;
    }
    var premultiplyBlendMode = mapPremultipliedBlendModes();
    function correctBlendMode(blendMode, premultiplied) {
      return premultiplyBlendMode[premultiplied ? 1 : 0][blendMode];
    }
    function premultiplyRgba(rgb, alpha, out, premultiply) {
      out = out || new Float32Array(4);
      if (premultiply || premultiply === void 0) {
        out[0] = rgb[0] * alpha;
        out[1] = rgb[1] * alpha;
        out[2] = rgb[2] * alpha;
      } else {
        out[0] = rgb[0];
        out[1] = rgb[1];
        out[2] = rgb[2];
      }
      out[3] = alpha;
      return out;
    }
    function premultiplyTint(tint, alpha) {
      if (alpha === 1) {
        return (alpha * 255 << 24) + tint;
      }
      if (alpha === 0) {
        return 0;
      }
      var R = tint >> 16 & 255;
      var G = tint >> 8 & 255;
      var B = tint & 255;
      R = R * alpha + 0.5 | 0;
      G = G * alpha + 0.5 | 0;
      B = B * alpha + 0.5 | 0;
      return (alpha * 255 << 24) + (R << 16) + (G << 8) + B;
    }
    function premultiplyTintToRgba(tint, alpha, out, premultiply) {
      out = out || new Float32Array(4);
      out[0] = (tint >> 16 & 255) / 255;
      out[1] = (tint >> 8 & 255) / 255;
      out[2] = (tint & 255) / 255;
      if (premultiply || premultiply === void 0) {
        out[0] *= alpha;
        out[1] *= alpha;
        out[2] *= alpha;
      }
      out[3] = alpha;
      return out;
    }
    function createIndicesForQuads(size, outBuffer) {
      if (outBuffer === void 0) {
        outBuffer = null;
      }
      var totalIndices = size * 6;
      outBuffer = outBuffer || new Uint16Array(totalIndices);
      if (outBuffer.length !== totalIndices) {
        throw new Error("Out buffer length is incorrect, got " + outBuffer.length + " and expected " + totalIndices);
      }
      for (var i = 0, j = 0; i < totalIndices; i += 6, j += 4) {
        outBuffer[i + 0] = j + 0;
        outBuffer[i + 1] = j + 1;
        outBuffer[i + 2] = j + 2;
        outBuffer[i + 3] = j + 0;
        outBuffer[i + 4] = j + 2;
        outBuffer[i + 5] = j + 3;
      }
      return outBuffer;
    }
    function getBufferType(array) {
      if (array.BYTES_PER_ELEMENT === 4) {
        if (array instanceof Float32Array) {
          return "Float32Array";
        } else if (array instanceof Uint32Array) {
          return "Uint32Array";
        }
        return "Int32Array";
      } else if (array.BYTES_PER_ELEMENT === 2) {
        if (array instanceof Uint16Array) {
          return "Uint16Array";
        }
      } else if (array.BYTES_PER_ELEMENT === 1) {
        if (array instanceof Uint8Array) {
          return "Uint8Array";
        }
      }
      return null;
    }
    var map = { Float32Array, Uint32Array, Int32Array, Uint8Array };
    function interleaveTypedArrays(arrays, sizes) {
      var outSize = 0;
      var stride = 0;
      var views = {};
      for (var i = 0; i < arrays.length; i++) {
        stride += sizes[i];
        outSize += arrays[i].length;
      }
      var buffer = new ArrayBuffer(outSize * 4);
      var out = null;
      var littleOffset = 0;
      for (var i = 0; i < arrays.length; i++) {
        var size = sizes[i];
        var array = arrays[i];
        var type = getBufferType(array);
        if (!views[type]) {
          views[type] = new map[type](buffer);
        }
        out = views[type];
        for (var j = 0; j < array.length; j++) {
          var indexStart = (j / size | 0) * stride + littleOffset;
          var index = j % size;
          out[indexStart + index] = array[j];
        }
        littleOffset += size;
      }
      return new Float32Array(buffer);
    }
    function nextPow2(v) {
      v += v === 0 ? 1 : 0;
      --v;
      v |= v >>> 1;
      v |= v >>> 2;
      v |= v >>> 4;
      v |= v >>> 8;
      v |= v >>> 16;
      return v + 1;
    }
    function isPow2(v) {
      return !(v & v - 1) && !!v;
    }
    function log2(v) {
      var r = (v > 65535 ? 1 : 0) << 4;
      v >>>= r;
      var shift = (v > 255 ? 1 : 0) << 3;
      v >>>= shift;
      r |= shift;
      shift = (v > 15 ? 1 : 0) << 2;
      v >>>= shift;
      r |= shift;
      shift = (v > 3 ? 1 : 0) << 1;
      v >>>= shift;
      r |= shift;
      return r | v >> 1;
    }
    function removeItems(arr, startIdx, removeCount) {
      var length = arr.length;
      var i;
      if (startIdx >= length || removeCount === 0) {
        return;
      }
      removeCount = startIdx + removeCount > length ? length - startIdx : removeCount;
      var len = length - removeCount;
      for (i = startIdx; i < len; ++i) {
        arr[i] = arr[i + removeCount];
      }
      arr.length = len;
    }
    function sign(n) {
      if (n === 0) {
        return 0;
      }
      return n < 0 ? -1 : 1;
    }
    var nextUid = 0;
    function uid() {
      return ++nextUid;
    }
    var warnings = {};
    function deprecation(version, message, ignoreDepth) {
      if (ignoreDepth === void 0) {
        ignoreDepth = 3;
      }
      if (warnings[message]) {
        return;
      }
      var stack = new Error().stack;
      if (typeof stack === "undefined") {
        console.warn("PixiJS Deprecation Warning: ", message + "\nDeprecated since v" + version);
      } else {
        stack = stack.split("\n").splice(ignoreDepth).join("\n");
        if (console.groupCollapsed) {
          console.groupCollapsed("%cPixiJS Deprecation Warning: %c%s", "color:#614108;background:#fffbe6", "font-weight:normal;color:#614108;background:#fffbe6", message + "\nDeprecated since v" + version);
          console.warn(stack);
          console.groupEnd();
        } else {
          console.warn("PixiJS Deprecation Warning: ", message + "\nDeprecated since v" + version);
          console.warn(stack);
        }
      }
      warnings[message] = true;
    }
    var ProgramCache = {};
    var TextureCache = Object.create(null);
    var BaseTextureCache = Object.create(null);
    function destroyTextureCache() {
      var key;
      for (key in TextureCache) {
        TextureCache[key].destroy();
      }
      for (key in BaseTextureCache) {
        BaseTextureCache[key].destroy();
      }
    }
    function clearTextureCache() {
      var key;
      for (key in TextureCache) {
        delete TextureCache[key];
      }
      for (key in BaseTextureCache) {
        delete BaseTextureCache[key];
      }
    }
    var CanvasRenderTarget = function() {
      function CanvasRenderTarget2(width, height, resolution) {
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        this.resolution = resolution || settings.settings.RESOLUTION;
        this.resize(width, height);
      }
      CanvasRenderTarget2.prototype.clear = function() {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      };
      CanvasRenderTarget2.prototype.resize = function(desiredWidth, desiredHeight) {
        this.canvas.width = Math.round(desiredWidth * this.resolution);
        this.canvas.height = Math.round(desiredHeight * this.resolution);
      };
      CanvasRenderTarget2.prototype.destroy = function() {
        this.context = null;
        this.canvas = null;
      };
      Object.defineProperty(CanvasRenderTarget2.prototype, "width", {
        get: function() {
          return this.canvas.width;
        },
        set: function(val) {
          this.canvas.width = Math.round(val);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(CanvasRenderTarget2.prototype, "height", {
        get: function() {
          return this.canvas.height;
        },
        set: function(val) {
          this.canvas.height = Math.round(val);
        },
        enumerable: false,
        configurable: true
      });
      return CanvasRenderTarget2;
    }();
    function trimCanvas(canvas) {
      var width = canvas.width;
      var height = canvas.height;
      var context = canvas.getContext("2d");
      var imageData = context.getImageData(0, 0, width, height);
      var pixels = imageData.data;
      var len = pixels.length;
      var bound = {
        top: null,
        left: null,
        right: null,
        bottom: null
      };
      var data = null;
      var i;
      var x;
      var y;
      for (i = 0; i < len; i += 4) {
        if (pixels[i + 3] !== 0) {
          x = i / 4 % width;
          y = ~~(i / 4 / width);
          if (bound.top === null) {
            bound.top = y;
          }
          if (bound.left === null) {
            bound.left = x;
          } else if (x < bound.left) {
            bound.left = x;
          }
          if (bound.right === null) {
            bound.right = x + 1;
          } else if (bound.right < x) {
            bound.right = x + 1;
          }
          if (bound.bottom === null) {
            bound.bottom = y;
          } else if (bound.bottom < y) {
            bound.bottom = y;
          }
        }
      }
      if (bound.top !== null) {
        width = bound.right - bound.left;
        height = bound.bottom - bound.top + 1;
        data = context.getImageData(bound.left, bound.top, width, height);
      }
      return {
        height,
        width,
        data
      };
    }
    var DATA_URI = /^\s*data:(?:([\w-]+)\/([\w+.-]+))?(?:;charset=([\w-]+))?(?:;(base64))?,(.*)/i;
    function decomposeDataUri(dataUri) {
      var dataUriMatch = DATA_URI.exec(dataUri);
      if (dataUriMatch) {
        return {
          mediaType: dataUriMatch[1] ? dataUriMatch[1].toLowerCase() : void 0,
          subType: dataUriMatch[2] ? dataUriMatch[2].toLowerCase() : void 0,
          charset: dataUriMatch[3] ? dataUriMatch[3].toLowerCase() : void 0,
          encoding: dataUriMatch[4] ? dataUriMatch[4].toLowerCase() : void 0,
          data: dataUriMatch[5]
        };
      }
      return void 0;
    }
    var tempAnchor;
    function determineCrossOrigin(url$12, loc) {
      if (loc === void 0) {
        loc = self.location;
      }
      if (url$12.indexOf("data:") === 0) {
        return "";
      }
      loc = loc || self.location;
      if (!tempAnchor) {
        tempAnchor = document.createElement("a");
      }
      tempAnchor.href = url$12;
      var parsedUrl = url.parse(tempAnchor.href);
      var samePort = !parsedUrl.port && loc.port === "" || parsedUrl.port === loc.port;
      if (parsedUrl.hostname !== loc.hostname || !samePort || parsedUrl.protocol !== loc.protocol) {
        return "anonymous";
      }
      return "";
    }
    function getResolutionOfUrl(url2, defaultValue) {
      var resolution = settings.settings.RETINA_PREFIX.exec(url2);
      if (resolution) {
        return parseFloat(resolution[1]);
      }
      return defaultValue !== void 0 ? defaultValue : 1;
    }
    Object.defineProperty(exports, "isMobile", {
      enumerable: true,
      get: function() {
        return settings.isMobile;
      }
    });
    exports.EventEmitter = eventemitter3;
    exports.earcut = earcut;
    exports.BaseTextureCache = BaseTextureCache;
    exports.CanvasRenderTarget = CanvasRenderTarget;
    exports.DATA_URI = DATA_URI;
    exports.ProgramCache = ProgramCache;
    exports.TextureCache = TextureCache;
    exports.clearTextureCache = clearTextureCache;
    exports.correctBlendMode = correctBlendMode;
    exports.createIndicesForQuads = createIndicesForQuads;
    exports.decomposeDataUri = decomposeDataUri;
    exports.deprecation = deprecation;
    exports.destroyTextureCache = destroyTextureCache;
    exports.determineCrossOrigin = determineCrossOrigin;
    exports.getBufferType = getBufferType;
    exports.getResolutionOfUrl = getResolutionOfUrl;
    exports.hex2rgb = hex2rgb;
    exports.hex2string = hex2string;
    exports.interleaveTypedArrays = interleaveTypedArrays;
    exports.isPow2 = isPow2;
    exports.isWebGLSupported = isWebGLSupported;
    exports.log2 = log2;
    exports.nextPow2 = nextPow2;
    exports.premultiplyBlendMode = premultiplyBlendMode;
    exports.premultiplyRgba = premultiplyRgba;
    exports.premultiplyTint = premultiplyTint;
    exports.premultiplyTintToRgba = premultiplyTintToRgba;
    exports.removeItems = removeItems;
    exports.rgb2hex = rgb2hex;
    exports.sayHello = sayHello;
    exports.sign = sign;
    exports.skipHello = skipHello;
    exports.string2hex = string2hex;
    exports.trimCanvas = trimCanvas;
    exports.uid = uid;
    exports.url = url;
  }
});

// node_modules/@pixi/display/dist/cjs/display.js
var require_display = __commonJS({
  "node_modules/@pixi/display/dist/cjs/display.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var settings = require_settings();
    var math = require_math();
    var utils = require_utils();
    settings.settings.SORTABLE_CHILDREN = false;
    var Bounds = function() {
      function Bounds2() {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.rect = null;
        this.updateID = -1;
      }
      Bounds2.prototype.isEmpty = function() {
        return this.minX > this.maxX || this.minY > this.maxY;
      };
      Bounds2.prototype.clear = function() {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
      };
      Bounds2.prototype.getRectangle = function(rect) {
        if (this.minX > this.maxX || this.minY > this.maxY) {
          return math.Rectangle.EMPTY;
        }
        rect = rect || new math.Rectangle(0, 0, 1, 1);
        rect.x = this.minX;
        rect.y = this.minY;
        rect.width = this.maxX - this.minX;
        rect.height = this.maxY - this.minY;
        return rect;
      };
      Bounds2.prototype.addPoint = function(point) {
        this.minX = Math.min(this.minX, point.x);
        this.maxX = Math.max(this.maxX, point.x);
        this.minY = Math.min(this.minY, point.y);
        this.maxY = Math.max(this.maxY, point.y);
      };
      Bounds2.prototype.addPointMatrix = function(matrix, point) {
        var a = matrix.a, b = matrix.b, c = matrix.c, d = matrix.d, tx = matrix.tx, ty = matrix.ty;
        var x = a * point.x + c * point.y + tx;
        var y = b * point.x + d * point.y + ty;
        this.minX = Math.min(this.minX, x);
        this.maxX = Math.max(this.maxX, x);
        this.minY = Math.min(this.minY, y);
        this.maxY = Math.max(this.maxY, y);
      };
      Bounds2.prototype.addQuad = function(vertices) {
        var minX = this.minX;
        var minY = this.minY;
        var maxX = this.maxX;
        var maxY = this.maxY;
        var x = vertices[0];
        var y = vertices[1];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = vertices[2];
        y = vertices[3];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = vertices[4];
        y = vertices[5];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = vertices[6];
        y = vertices[7];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
      };
      Bounds2.prototype.addFrame = function(transform, x0, y0, x1, y1) {
        this.addFrameMatrix(transform.worldTransform, x0, y0, x1, y1);
      };
      Bounds2.prototype.addFrameMatrix = function(matrix, x0, y0, x1, y1) {
        var a = matrix.a;
        var b = matrix.b;
        var c = matrix.c;
        var d = matrix.d;
        var tx = matrix.tx;
        var ty = matrix.ty;
        var minX = this.minX;
        var minY = this.minY;
        var maxX = this.maxX;
        var maxY = this.maxY;
        var x = a * x0 + c * y0 + tx;
        var y = b * x0 + d * y0 + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = a * x1 + c * y0 + tx;
        y = b * x1 + d * y0 + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = a * x0 + c * y1 + tx;
        y = b * x0 + d * y1 + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        x = a * x1 + c * y1 + tx;
        y = b * x1 + d * y1 + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
      };
      Bounds2.prototype.addVertexData = function(vertexData, beginOffset, endOffset) {
        var minX = this.minX;
        var minY = this.minY;
        var maxX = this.maxX;
        var maxY = this.maxY;
        for (var i = beginOffset; i < endOffset; i += 2) {
          var x = vertexData[i];
          var y = vertexData[i + 1];
          minX = x < minX ? x : minX;
          minY = y < minY ? y : minY;
          maxX = x > maxX ? x : maxX;
          maxY = y > maxY ? y : maxY;
        }
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
      };
      Bounds2.prototype.addVertices = function(transform, vertices, beginOffset, endOffset) {
        this.addVerticesMatrix(transform.worldTransform, vertices, beginOffset, endOffset);
      };
      Bounds2.prototype.addVerticesMatrix = function(matrix, vertices, beginOffset, endOffset, padX, padY) {
        if (padX === void 0) {
          padX = 0;
        }
        if (padY === void 0) {
          padY = padX;
        }
        var a = matrix.a;
        var b = matrix.b;
        var c = matrix.c;
        var d = matrix.d;
        var tx = matrix.tx;
        var ty = matrix.ty;
        var minX = this.minX;
        var minY = this.minY;
        var maxX = this.maxX;
        var maxY = this.maxY;
        for (var i = beginOffset; i < endOffset; i += 2) {
          var rawX = vertices[i];
          var rawY = vertices[i + 1];
          var x = a * rawX + c * rawY + tx;
          var y = d * rawY + b * rawX + ty;
          minX = Math.min(minX, x - padX);
          maxX = Math.max(maxX, x + padX);
          minY = Math.min(minY, y - padY);
          maxY = Math.max(maxY, y + padY);
        }
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
      };
      Bounds2.prototype.addBounds = function(bounds) {
        var minX = this.minX;
        var minY = this.minY;
        var maxX = this.maxX;
        var maxY = this.maxY;
        this.minX = bounds.minX < minX ? bounds.minX : minX;
        this.minY = bounds.minY < minY ? bounds.minY : minY;
        this.maxX = bounds.maxX > maxX ? bounds.maxX : maxX;
        this.maxY = bounds.maxY > maxY ? bounds.maxY : maxY;
      };
      Bounds2.prototype.addBoundsMask = function(bounds, mask) {
        var _minX = bounds.minX > mask.minX ? bounds.minX : mask.minX;
        var _minY = bounds.minY > mask.minY ? bounds.minY : mask.minY;
        var _maxX = bounds.maxX < mask.maxX ? bounds.maxX : mask.maxX;
        var _maxY = bounds.maxY < mask.maxY ? bounds.maxY : mask.maxY;
        if (_minX <= _maxX && _minY <= _maxY) {
          var minX = this.minX;
          var minY = this.minY;
          var maxX = this.maxX;
          var maxY = this.maxY;
          this.minX = _minX < minX ? _minX : minX;
          this.minY = _minY < minY ? _minY : minY;
          this.maxX = _maxX > maxX ? _maxX : maxX;
          this.maxY = _maxY > maxY ? _maxY : maxY;
        }
      };
      Bounds2.prototype.addBoundsMatrix = function(bounds, matrix) {
        this.addFrameMatrix(matrix, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
      };
      Bounds2.prototype.addBoundsArea = function(bounds, area) {
        var _minX = bounds.minX > area.x ? bounds.minX : area.x;
        var _minY = bounds.minY > area.y ? bounds.minY : area.y;
        var _maxX = bounds.maxX < area.x + area.width ? bounds.maxX : area.x + area.width;
        var _maxY = bounds.maxY < area.y + area.height ? bounds.maxY : area.y + area.height;
        if (_minX <= _maxX && _minY <= _maxY) {
          var minX = this.minX;
          var minY = this.minY;
          var maxX = this.maxX;
          var maxY = this.maxY;
          this.minX = _minX < minX ? _minX : minX;
          this.minY = _minY < minY ? _minY : minY;
          this.maxX = _maxX > maxX ? _maxX : maxX;
          this.maxY = _maxY > maxY ? _maxY : maxY;
        }
      };
      Bounds2.prototype.pad = function(paddingX, paddingY) {
        if (paddingX === void 0) {
          paddingX = 0;
        }
        if (paddingY === void 0) {
          paddingY = paddingX;
        }
        if (!this.isEmpty()) {
          this.minX -= paddingX;
          this.maxX += paddingX;
          this.minY -= paddingY;
          this.maxY += paddingY;
        }
      };
      Bounds2.prototype.addFramePad = function(x0, y0, x1, y1, padX, padY) {
        x0 -= padX;
        y0 -= padY;
        x1 += padX;
        y1 += padY;
        this.minX = this.minX < x0 ? this.minX : x0;
        this.maxX = this.maxX > x1 ? this.maxX : x1;
        this.minY = this.minY < y0 ? this.minY : y0;
        this.maxY = this.maxY > y1 ? this.maxY : y1;
      };
      return Bounds2;
    }();
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2) {
          if (b2.hasOwnProperty(p)) {
            d2[p] = b2[p];
          }
        }
      };
      return extendStatics(d, b);
    };
    function __extends(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var DisplayObject = function(_super) {
      __extends(DisplayObject2, _super);
      function DisplayObject2() {
        var _this = _super.call(this) || this;
        _this.tempDisplayObjectParent = null;
        _this.transform = new math.Transform();
        _this.alpha = 1;
        _this.visible = true;
        _this.renderable = true;
        _this.parent = null;
        _this.worldAlpha = 1;
        _this._lastSortedIndex = 0;
        _this._zIndex = 0;
        _this.filterArea = null;
        _this.filters = null;
        _this._enabledFilters = null;
        _this._bounds = new Bounds();
        _this._localBounds = null;
        _this._boundsID = 0;
        _this._boundsRect = null;
        _this._localBoundsRect = null;
        _this._mask = null;
        _this._maskRefCount = 0;
        _this._destroyed = false;
        _this.isSprite = false;
        _this.isMask = false;
        return _this;
      }
      DisplayObject2.mixin = function(source) {
        var keys = Object.keys(source);
        for (var i = 0; i < keys.length; ++i) {
          var propertyName = keys[i];
          Object.defineProperty(DisplayObject2.prototype, propertyName, Object.getOwnPropertyDescriptor(source, propertyName));
        }
      };
      Object.defineProperty(DisplayObject2.prototype, "destroyed", {
        get: function() {
          return this._destroyed;
        },
        enumerable: false,
        configurable: true
      });
      DisplayObject2.prototype._recursivePostUpdateTransform = function() {
        if (this.parent) {
          this.parent._recursivePostUpdateTransform();
          this.transform.updateTransform(this.parent.transform);
        } else {
          this.transform.updateTransform(this._tempDisplayObjectParent.transform);
        }
      };
      DisplayObject2.prototype.updateTransform = function() {
        this._boundsID++;
        this.transform.updateTransform(this.parent.transform);
        this.worldAlpha = this.alpha * this.parent.worldAlpha;
      };
      DisplayObject2.prototype.getBounds = function(skipUpdate, rect) {
        if (!skipUpdate) {
          if (!this.parent) {
            this.parent = this._tempDisplayObjectParent;
            this.updateTransform();
            this.parent = null;
          } else {
            this._recursivePostUpdateTransform();
            this.updateTransform();
          }
        }
        if (this._bounds.updateID !== this._boundsID) {
          this.calculateBounds();
          this._bounds.updateID = this._boundsID;
        }
        if (!rect) {
          if (!this._boundsRect) {
            this._boundsRect = new math.Rectangle();
          }
          rect = this._boundsRect;
        }
        return this._bounds.getRectangle(rect);
      };
      DisplayObject2.prototype.getLocalBounds = function(rect) {
        if (!rect) {
          if (!this._localBoundsRect) {
            this._localBoundsRect = new math.Rectangle();
          }
          rect = this._localBoundsRect;
        }
        if (!this._localBounds) {
          this._localBounds = new Bounds();
        }
        var transformRef = this.transform;
        var parentRef = this.parent;
        this.parent = null;
        this.transform = this._tempDisplayObjectParent.transform;
        var worldBounds = this._bounds;
        var worldBoundsID = this._boundsID;
        this._bounds = this._localBounds;
        var bounds = this.getBounds(false, rect);
        this.parent = parentRef;
        this.transform = transformRef;
        this._bounds = worldBounds;
        this._bounds.updateID += this._boundsID - worldBoundsID;
        return bounds;
      };
      DisplayObject2.prototype.toGlobal = function(position, point, skipUpdate) {
        if (skipUpdate === void 0) {
          skipUpdate = false;
        }
        if (!skipUpdate) {
          this._recursivePostUpdateTransform();
          if (!this.parent) {
            this.parent = this._tempDisplayObjectParent;
            this.displayObjectUpdateTransform();
            this.parent = null;
          } else {
            this.displayObjectUpdateTransform();
          }
        }
        return this.worldTransform.apply(position, point);
      };
      DisplayObject2.prototype.toLocal = function(position, from, point, skipUpdate) {
        if (from) {
          position = from.toGlobal(position, point, skipUpdate);
        }
        if (!skipUpdate) {
          this._recursivePostUpdateTransform();
          if (!this.parent) {
            this.parent = this._tempDisplayObjectParent;
            this.displayObjectUpdateTransform();
            this.parent = null;
          } else {
            this.displayObjectUpdateTransform();
          }
        }
        return this.worldTransform.applyInverse(position, point);
      };
      DisplayObject2.prototype.setParent = function(container) {
        if (!container || !container.addChild) {
          throw new Error("setParent: Argument must be a Container");
        }
        container.addChild(this);
        return container;
      };
      DisplayObject2.prototype.setTransform = function(x, y, scaleX, scaleY, rotation, skewX, skewY, pivotX, pivotY) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = 0;
        }
        if (scaleX === void 0) {
          scaleX = 1;
        }
        if (scaleY === void 0) {
          scaleY = 1;
        }
        if (rotation === void 0) {
          rotation = 0;
        }
        if (skewX === void 0) {
          skewX = 0;
        }
        if (skewY === void 0) {
          skewY = 0;
        }
        if (pivotX === void 0) {
          pivotX = 0;
        }
        if (pivotY === void 0) {
          pivotY = 0;
        }
        this.position.x = x;
        this.position.y = y;
        this.scale.x = !scaleX ? 1 : scaleX;
        this.scale.y = !scaleY ? 1 : scaleY;
        this.rotation = rotation;
        this.skew.x = skewX;
        this.skew.y = skewY;
        this.pivot.x = pivotX;
        this.pivot.y = pivotY;
        return this;
      };
      DisplayObject2.prototype.destroy = function(_options) {
        if (this.parent) {
          this.parent.removeChild(this);
        }
        this.emit("destroyed");
        this.removeAllListeners();
        this.transform = null;
        this.parent = null;
        this._bounds = null;
        this.mask = null;
        this.filters = null;
        this.filterArea = null;
        this.hitArea = null;
        this.interactive = false;
        this.interactiveChildren = false;
        this._destroyed = true;
      };
      Object.defineProperty(DisplayObject2.prototype, "_tempDisplayObjectParent", {
        get: function() {
          if (this.tempDisplayObjectParent === null) {
            this.tempDisplayObjectParent = new TemporaryDisplayObject();
          }
          return this.tempDisplayObjectParent;
        },
        enumerable: false,
        configurable: true
      });
      DisplayObject2.prototype.enableTempParent = function() {
        var myParent = this.parent;
        this.parent = this._tempDisplayObjectParent;
        return myParent;
      };
      DisplayObject2.prototype.disableTempParent = function(cacheParent) {
        this.parent = cacheParent;
      };
      Object.defineProperty(DisplayObject2.prototype, "x", {
        get: function() {
          return this.position.x;
        },
        set: function(value) {
          this.transform.position.x = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "y", {
        get: function() {
          return this.position.y;
        },
        set: function(value) {
          this.transform.position.y = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "worldTransform", {
        get: function() {
          return this.transform.worldTransform;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "localTransform", {
        get: function() {
          return this.transform.localTransform;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "position", {
        get: function() {
          return this.transform.position;
        },
        set: function(value) {
          this.transform.position.copyFrom(value);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "scale", {
        get: function() {
          return this.transform.scale;
        },
        set: function(value) {
          this.transform.scale.copyFrom(value);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "pivot", {
        get: function() {
          return this.transform.pivot;
        },
        set: function(value) {
          this.transform.pivot.copyFrom(value);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "skew", {
        get: function() {
          return this.transform.skew;
        },
        set: function(value) {
          this.transform.skew.copyFrom(value);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "rotation", {
        get: function() {
          return this.transform.rotation;
        },
        set: function(value) {
          this.transform.rotation = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "angle", {
        get: function() {
          return this.transform.rotation * math.RAD_TO_DEG;
        },
        set: function(value) {
          this.transform.rotation = value * math.DEG_TO_RAD;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "zIndex", {
        get: function() {
          return this._zIndex;
        },
        set: function(value) {
          this._zIndex = value;
          if (this.parent) {
            this.parent.sortDirty = true;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "worldVisible", {
        get: function() {
          var item = this;
          do {
            if (!item.visible) {
              return false;
            }
            item = item.parent;
          } while (item);
          return true;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(DisplayObject2.prototype, "mask", {
        get: function() {
          return this._mask;
        },
        set: function(value) {
          if (this._mask === value) {
            return;
          }
          if (this._mask) {
            var maskObject = this._mask.maskObject || this._mask;
            maskObject._maskRefCount--;
            if (maskObject._maskRefCount === 0) {
              maskObject.renderable = true;
              maskObject.isMask = false;
            }
          }
          this._mask = value;
          if (this._mask) {
            var maskObject = this._mask.maskObject || this._mask;
            if (maskObject._maskRefCount === 0) {
              maskObject.renderable = false;
              maskObject.isMask = true;
            }
            maskObject._maskRefCount++;
          }
        },
        enumerable: false,
        configurable: true
      });
      return DisplayObject2;
    }(utils.EventEmitter);
    var TemporaryDisplayObject = function(_super) {
      __extends(TemporaryDisplayObject2, _super);
      function TemporaryDisplayObject2() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.sortDirty = null;
        return _this;
      }
      return TemporaryDisplayObject2;
    }(DisplayObject);
    DisplayObject.prototype.displayObjectUpdateTransform = DisplayObject.prototype.updateTransform;
    var ENV;
    (function(ENV2) {
      ENV2[ENV2["WEBGL_LEGACY"] = 0] = "WEBGL_LEGACY";
      ENV2[ENV2["WEBGL"] = 1] = "WEBGL";
      ENV2[ENV2["WEBGL2"] = 2] = "WEBGL2";
    })(ENV || (ENV = {}));
    var RENDERER_TYPE;
    (function(RENDERER_TYPE2) {
      RENDERER_TYPE2[RENDERER_TYPE2["UNKNOWN"] = 0] = "UNKNOWN";
      RENDERER_TYPE2[RENDERER_TYPE2["WEBGL"] = 1] = "WEBGL";
      RENDERER_TYPE2[RENDERER_TYPE2["CANVAS"] = 2] = "CANVAS";
    })(RENDERER_TYPE || (RENDERER_TYPE = {}));
    var BUFFER_BITS;
    (function(BUFFER_BITS2) {
      BUFFER_BITS2[BUFFER_BITS2["COLOR"] = 16384] = "COLOR";
      BUFFER_BITS2[BUFFER_BITS2["DEPTH"] = 256] = "DEPTH";
      BUFFER_BITS2[BUFFER_BITS2["STENCIL"] = 1024] = "STENCIL";
    })(BUFFER_BITS || (BUFFER_BITS = {}));
    var BLEND_MODES;
    (function(BLEND_MODES2) {
      BLEND_MODES2[BLEND_MODES2["NORMAL"] = 0] = "NORMAL";
      BLEND_MODES2[BLEND_MODES2["ADD"] = 1] = "ADD";
      BLEND_MODES2[BLEND_MODES2["MULTIPLY"] = 2] = "MULTIPLY";
      BLEND_MODES2[BLEND_MODES2["SCREEN"] = 3] = "SCREEN";
      BLEND_MODES2[BLEND_MODES2["OVERLAY"] = 4] = "OVERLAY";
      BLEND_MODES2[BLEND_MODES2["DARKEN"] = 5] = "DARKEN";
      BLEND_MODES2[BLEND_MODES2["LIGHTEN"] = 6] = "LIGHTEN";
      BLEND_MODES2[BLEND_MODES2["COLOR_DODGE"] = 7] = "COLOR_DODGE";
      BLEND_MODES2[BLEND_MODES2["COLOR_BURN"] = 8] = "COLOR_BURN";
      BLEND_MODES2[BLEND_MODES2["HARD_LIGHT"] = 9] = "HARD_LIGHT";
      BLEND_MODES2[BLEND_MODES2["SOFT_LIGHT"] = 10] = "SOFT_LIGHT";
      BLEND_MODES2[BLEND_MODES2["DIFFERENCE"] = 11] = "DIFFERENCE";
      BLEND_MODES2[BLEND_MODES2["EXCLUSION"] = 12] = "EXCLUSION";
      BLEND_MODES2[BLEND_MODES2["HUE"] = 13] = "HUE";
      BLEND_MODES2[BLEND_MODES2["SATURATION"] = 14] = "SATURATION";
      BLEND_MODES2[BLEND_MODES2["COLOR"] = 15] = "COLOR";
      BLEND_MODES2[BLEND_MODES2["LUMINOSITY"] = 16] = "LUMINOSITY";
      BLEND_MODES2[BLEND_MODES2["NORMAL_NPM"] = 17] = "NORMAL_NPM";
      BLEND_MODES2[BLEND_MODES2["ADD_NPM"] = 18] = "ADD_NPM";
      BLEND_MODES2[BLEND_MODES2["SCREEN_NPM"] = 19] = "SCREEN_NPM";
      BLEND_MODES2[BLEND_MODES2["NONE"] = 20] = "NONE";
      BLEND_MODES2[BLEND_MODES2["SRC_OVER"] = 0] = "SRC_OVER";
      BLEND_MODES2[BLEND_MODES2["SRC_IN"] = 21] = "SRC_IN";
      BLEND_MODES2[BLEND_MODES2["SRC_OUT"] = 22] = "SRC_OUT";
      BLEND_MODES2[BLEND_MODES2["SRC_ATOP"] = 23] = "SRC_ATOP";
      BLEND_MODES2[BLEND_MODES2["DST_OVER"] = 24] = "DST_OVER";
      BLEND_MODES2[BLEND_MODES2["DST_IN"] = 25] = "DST_IN";
      BLEND_MODES2[BLEND_MODES2["DST_OUT"] = 26] = "DST_OUT";
      BLEND_MODES2[BLEND_MODES2["DST_ATOP"] = 27] = "DST_ATOP";
      BLEND_MODES2[BLEND_MODES2["ERASE"] = 26] = "ERASE";
      BLEND_MODES2[BLEND_MODES2["SUBTRACT"] = 28] = "SUBTRACT";
      BLEND_MODES2[BLEND_MODES2["XOR"] = 29] = "XOR";
    })(BLEND_MODES || (BLEND_MODES = {}));
    var DRAW_MODES;
    (function(DRAW_MODES2) {
      DRAW_MODES2[DRAW_MODES2["POINTS"] = 0] = "POINTS";
      DRAW_MODES2[DRAW_MODES2["LINES"] = 1] = "LINES";
      DRAW_MODES2[DRAW_MODES2["LINE_LOOP"] = 2] = "LINE_LOOP";
      DRAW_MODES2[DRAW_MODES2["LINE_STRIP"] = 3] = "LINE_STRIP";
      DRAW_MODES2[DRAW_MODES2["TRIANGLES"] = 4] = "TRIANGLES";
      DRAW_MODES2[DRAW_MODES2["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
      DRAW_MODES2[DRAW_MODES2["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
    })(DRAW_MODES || (DRAW_MODES = {}));
    var FORMATS;
    (function(FORMATS2) {
      FORMATS2[FORMATS2["RGBA"] = 6408] = "RGBA";
      FORMATS2[FORMATS2["RGB"] = 6407] = "RGB";
      FORMATS2[FORMATS2["RG"] = 33319] = "RG";
      FORMATS2[FORMATS2["RED"] = 6403] = "RED";
      FORMATS2[FORMATS2["RGBA_INTEGER"] = 36249] = "RGBA_INTEGER";
      FORMATS2[FORMATS2["RGB_INTEGER"] = 36248] = "RGB_INTEGER";
      FORMATS2[FORMATS2["RG_INTEGER"] = 33320] = "RG_INTEGER";
      FORMATS2[FORMATS2["RED_INTEGER"] = 36244] = "RED_INTEGER";
      FORMATS2[FORMATS2["ALPHA"] = 6406] = "ALPHA";
      FORMATS2[FORMATS2["LUMINANCE"] = 6409] = "LUMINANCE";
      FORMATS2[FORMATS2["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
      FORMATS2[FORMATS2["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
      FORMATS2[FORMATS2["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
    })(FORMATS || (FORMATS = {}));
    var TARGETS;
    (function(TARGETS2) {
      TARGETS2[TARGETS2["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
      TARGETS2[TARGETS2["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
      TARGETS2[TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
    })(TARGETS || (TARGETS = {}));
    var TYPES;
    (function(TYPES2) {
      TYPES2[TYPES2["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
      TYPES2[TYPES2["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
      TYPES2[TYPES2["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
      TYPES2[TYPES2["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
      TYPES2[TYPES2["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
      TYPES2[TYPES2["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
      TYPES2[TYPES2["UNSIGNED_INT_10F_11F_11F_REV"] = 35899] = "UNSIGNED_INT_10F_11F_11F_REV";
      TYPES2[TYPES2["UNSIGNED_INT_2_10_10_10_REV"] = 33640] = "UNSIGNED_INT_2_10_10_10_REV";
      TYPES2[TYPES2["UNSIGNED_INT_24_8"] = 34042] = "UNSIGNED_INT_24_8";
      TYPES2[TYPES2["UNSIGNED_INT_5_9_9_9_REV"] = 35902] = "UNSIGNED_INT_5_9_9_9_REV";
      TYPES2[TYPES2["BYTE"] = 5120] = "BYTE";
      TYPES2[TYPES2["SHORT"] = 5122] = "SHORT";
      TYPES2[TYPES2["INT"] = 5124] = "INT";
      TYPES2[TYPES2["FLOAT"] = 5126] = "FLOAT";
      TYPES2[TYPES2["FLOAT_32_UNSIGNED_INT_24_8_REV"] = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV";
      TYPES2[TYPES2["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
    })(TYPES || (TYPES = {}));
    var SAMPLER_TYPES;
    (function(SAMPLER_TYPES2) {
      SAMPLER_TYPES2[SAMPLER_TYPES2["FLOAT"] = 0] = "FLOAT";
      SAMPLER_TYPES2[SAMPLER_TYPES2["INT"] = 1] = "INT";
      SAMPLER_TYPES2[SAMPLER_TYPES2["UINT"] = 2] = "UINT";
    })(SAMPLER_TYPES || (SAMPLER_TYPES = {}));
    var SCALE_MODES;
    (function(SCALE_MODES2) {
      SCALE_MODES2[SCALE_MODES2["NEAREST"] = 0] = "NEAREST";
      SCALE_MODES2[SCALE_MODES2["LINEAR"] = 1] = "LINEAR";
    })(SCALE_MODES || (SCALE_MODES = {}));
    var WRAP_MODES;
    (function(WRAP_MODES2) {
      WRAP_MODES2[WRAP_MODES2["CLAMP"] = 33071] = "CLAMP";
      WRAP_MODES2[WRAP_MODES2["REPEAT"] = 10497] = "REPEAT";
      WRAP_MODES2[WRAP_MODES2["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
    })(WRAP_MODES || (WRAP_MODES = {}));
    var MIPMAP_MODES;
    (function(MIPMAP_MODES2) {
      MIPMAP_MODES2[MIPMAP_MODES2["OFF"] = 0] = "OFF";
      MIPMAP_MODES2[MIPMAP_MODES2["POW2"] = 1] = "POW2";
      MIPMAP_MODES2[MIPMAP_MODES2["ON"] = 2] = "ON";
      MIPMAP_MODES2[MIPMAP_MODES2["ON_MANUAL"] = 3] = "ON_MANUAL";
    })(MIPMAP_MODES || (MIPMAP_MODES = {}));
    var ALPHA_MODES;
    (function(ALPHA_MODES2) {
      ALPHA_MODES2[ALPHA_MODES2["NPM"] = 0] = "NPM";
      ALPHA_MODES2[ALPHA_MODES2["UNPACK"] = 1] = "UNPACK";
      ALPHA_MODES2[ALPHA_MODES2["PMA"] = 2] = "PMA";
      ALPHA_MODES2[ALPHA_MODES2["NO_PREMULTIPLIED_ALPHA"] = 0] = "NO_PREMULTIPLIED_ALPHA";
      ALPHA_MODES2[ALPHA_MODES2["PREMULTIPLY_ON_UPLOAD"] = 1] = "PREMULTIPLY_ON_UPLOAD";
      ALPHA_MODES2[ALPHA_MODES2["PREMULTIPLY_ALPHA"] = 2] = "PREMULTIPLY_ALPHA";
      ALPHA_MODES2[ALPHA_MODES2["PREMULTIPLIED_ALPHA"] = 2] = "PREMULTIPLIED_ALPHA";
    })(ALPHA_MODES || (ALPHA_MODES = {}));
    var CLEAR_MODES;
    (function(CLEAR_MODES2) {
      CLEAR_MODES2[CLEAR_MODES2["NO"] = 0] = "NO";
      CLEAR_MODES2[CLEAR_MODES2["YES"] = 1] = "YES";
      CLEAR_MODES2[CLEAR_MODES2["AUTO"] = 2] = "AUTO";
      CLEAR_MODES2[CLEAR_MODES2["BLEND"] = 0] = "BLEND";
      CLEAR_MODES2[CLEAR_MODES2["CLEAR"] = 1] = "CLEAR";
      CLEAR_MODES2[CLEAR_MODES2["BLIT"] = 2] = "BLIT";
    })(CLEAR_MODES || (CLEAR_MODES = {}));
    var GC_MODES;
    (function(GC_MODES2) {
      GC_MODES2[GC_MODES2["AUTO"] = 0] = "AUTO";
      GC_MODES2[GC_MODES2["MANUAL"] = 1] = "MANUAL";
    })(GC_MODES || (GC_MODES = {}));
    var PRECISION;
    (function(PRECISION2) {
      PRECISION2["LOW"] = "lowp";
      PRECISION2["MEDIUM"] = "mediump";
      PRECISION2["HIGH"] = "highp";
    })(PRECISION || (PRECISION = {}));
    var MASK_TYPES;
    (function(MASK_TYPES2) {
      MASK_TYPES2[MASK_TYPES2["NONE"] = 0] = "NONE";
      MASK_TYPES2[MASK_TYPES2["SCISSOR"] = 1] = "SCISSOR";
      MASK_TYPES2[MASK_TYPES2["STENCIL"] = 2] = "STENCIL";
      MASK_TYPES2[MASK_TYPES2["SPRITE"] = 3] = "SPRITE";
    })(MASK_TYPES || (MASK_TYPES = {}));
    var MSAA_QUALITY;
    (function(MSAA_QUALITY2) {
      MSAA_QUALITY2[MSAA_QUALITY2["NONE"] = 0] = "NONE";
      MSAA_QUALITY2[MSAA_QUALITY2["LOW"] = 2] = "LOW";
      MSAA_QUALITY2[MSAA_QUALITY2["MEDIUM"] = 4] = "MEDIUM";
      MSAA_QUALITY2[MSAA_QUALITY2["HIGH"] = 8] = "HIGH";
    })(MSAA_QUALITY || (MSAA_QUALITY = {}));
    var BUFFER_TYPE;
    (function(BUFFER_TYPE2) {
      BUFFER_TYPE2[BUFFER_TYPE2["ELEMENT_ARRAY_BUFFER"] = 34963] = "ELEMENT_ARRAY_BUFFER";
      BUFFER_TYPE2[BUFFER_TYPE2["ARRAY_BUFFER"] = 34962] = "ARRAY_BUFFER";
      BUFFER_TYPE2[BUFFER_TYPE2["UNIFORM_BUFFER"] = 35345] = "UNIFORM_BUFFER";
    })(BUFFER_TYPE || (BUFFER_TYPE = {}));
    function sortChildren(a, b) {
      if (a.zIndex === b.zIndex) {
        return a._lastSortedIndex - b._lastSortedIndex;
      }
      return a.zIndex - b.zIndex;
    }
    var Container = function(_super) {
      __extends(Container2, _super);
      function Container2() {
        var _this = _super.call(this) || this;
        _this.children = [];
        _this.sortableChildren = settings.settings.SORTABLE_CHILDREN;
        _this.sortDirty = false;
        return _this;
      }
      Container2.prototype.onChildrenChange = function(_length) {
      };
      Container2.prototype.addChild = function() {
        var arguments$1 = arguments;
        var children = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          children[_i] = arguments$1[_i];
        }
        if (children.length > 1) {
          for (var i = 0; i < children.length; i++) {
            this.addChild(children[i]);
          }
        } else {
          var child = children[0];
          if (child.parent) {
            child.parent.removeChild(child);
          }
          child.parent = this;
          this.sortDirty = true;
          child.transform._parentID = -1;
          this.children.push(child);
          this._boundsID++;
          this.onChildrenChange(this.children.length - 1);
          this.emit("childAdded", child, this, this.children.length - 1);
          child.emit("added", this);
        }
        return children[0];
      };
      Container2.prototype.addChildAt = function(child, index) {
        if (index < 0 || index > this.children.length) {
          throw new Error(child + "addChildAt: The index " + index + " supplied is out of bounds " + this.children.length);
        }
        if (child.parent) {
          child.parent.removeChild(child);
        }
        child.parent = this;
        this.sortDirty = true;
        child.transform._parentID = -1;
        this.children.splice(index, 0, child);
        this._boundsID++;
        this.onChildrenChange(index);
        child.emit("added", this);
        this.emit("childAdded", child, this, index);
        return child;
      };
      Container2.prototype.swapChildren = function(child, child2) {
        if (child === child2) {
          return;
        }
        var index1 = this.getChildIndex(child);
        var index2 = this.getChildIndex(child2);
        this.children[index1] = child2;
        this.children[index2] = child;
        this.onChildrenChange(index1 < index2 ? index1 : index2);
      };
      Container2.prototype.getChildIndex = function(child) {
        var index = this.children.indexOf(child);
        if (index === -1) {
          throw new Error("The supplied DisplayObject must be a child of the caller");
        }
        return index;
      };
      Container2.prototype.setChildIndex = function(child, index) {
        if (index < 0 || index >= this.children.length) {
          throw new Error("The index " + index + " supplied is out of bounds " + this.children.length);
        }
        var currentIndex = this.getChildIndex(child);
        utils.removeItems(this.children, currentIndex, 1);
        this.children.splice(index, 0, child);
        this.onChildrenChange(index);
      };
      Container2.prototype.getChildAt = function(index) {
        if (index < 0 || index >= this.children.length) {
          throw new Error("getChildAt: Index (" + index + ") does not exist.");
        }
        return this.children[index];
      };
      Container2.prototype.removeChild = function() {
        var arguments$1 = arguments;
        var children = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          children[_i] = arguments$1[_i];
        }
        if (children.length > 1) {
          for (var i = 0; i < children.length; i++) {
            this.removeChild(children[i]);
          }
        } else {
          var child = children[0];
          var index = this.children.indexOf(child);
          if (index === -1) {
            return null;
          }
          child.parent = null;
          child.transform._parentID = -1;
          utils.removeItems(this.children, index, 1);
          this._boundsID++;
          this.onChildrenChange(index);
          child.emit("removed", this);
          this.emit("childRemoved", child, this, index);
        }
        return children[0];
      };
      Container2.prototype.removeChildAt = function(index) {
        var child = this.getChildAt(index);
        child.parent = null;
        child.transform._parentID = -1;
        utils.removeItems(this.children, index, 1);
        this._boundsID++;
        this.onChildrenChange(index);
        child.emit("removed", this);
        this.emit("childRemoved", child, this, index);
        return child;
      };
      Container2.prototype.removeChildren = function(beginIndex, endIndex) {
        if (beginIndex === void 0) {
          beginIndex = 0;
        }
        if (endIndex === void 0) {
          endIndex = this.children.length;
        }
        var begin = beginIndex;
        var end = endIndex;
        var range = end - begin;
        var removed;
        if (range > 0 && range <= end) {
          removed = this.children.splice(begin, range);
          for (var i = 0; i < removed.length; ++i) {
            removed[i].parent = null;
            if (removed[i].transform) {
              removed[i].transform._parentID = -1;
            }
          }
          this._boundsID++;
          this.onChildrenChange(beginIndex);
          for (var i = 0; i < removed.length; ++i) {
            removed[i].emit("removed", this);
            this.emit("childRemoved", removed[i], this, i);
          }
          return removed;
        } else if (range === 0 && this.children.length === 0) {
          return [];
        }
        throw new RangeError("removeChildren: numeric values are outside the acceptable range.");
      };
      Container2.prototype.sortChildren = function() {
        var sortRequired = false;
        for (var i = 0, j = this.children.length; i < j; ++i) {
          var child = this.children[i];
          child._lastSortedIndex = i;
          if (!sortRequired && child.zIndex !== 0) {
            sortRequired = true;
          }
        }
        if (sortRequired && this.children.length > 1) {
          this.children.sort(sortChildren);
        }
        this.sortDirty = false;
      };
      Container2.prototype.updateTransform = function() {
        if (this.sortableChildren && this.sortDirty) {
          this.sortChildren();
        }
        this._boundsID++;
        this.transform.updateTransform(this.parent.transform);
        this.worldAlpha = this.alpha * this.parent.worldAlpha;
        for (var i = 0, j = this.children.length; i < j; ++i) {
          var child = this.children[i];
          if (child.visible) {
            child.updateTransform();
          }
        }
      };
      Container2.prototype.calculateBounds = function() {
        this._bounds.clear();
        this._calculateBounds();
        for (var i = 0; i < this.children.length; i++) {
          var child = this.children[i];
          if (!child.visible || !child.renderable) {
            continue;
          }
          child.calculateBounds();
          if (child._mask) {
            var maskObject = child._mask.maskObject || child._mask;
            maskObject.calculateBounds();
            this._bounds.addBoundsMask(child._bounds, maskObject._bounds);
          } else if (child.filterArea) {
            this._bounds.addBoundsArea(child._bounds, child.filterArea);
          } else {
            this._bounds.addBounds(child._bounds);
          }
        }
        this._bounds.updateID = this._boundsID;
      };
      Container2.prototype.getLocalBounds = function(rect, skipChildrenUpdate) {
        if (skipChildrenUpdate === void 0) {
          skipChildrenUpdate = false;
        }
        var result = _super.prototype.getLocalBounds.call(this, rect);
        if (!skipChildrenUpdate) {
          for (var i = 0, j = this.children.length; i < j; ++i) {
            var child = this.children[i];
            if (child.visible) {
              child.updateTransform();
            }
          }
        }
        return result;
      };
      Container2.prototype._calculateBounds = function() {
      };
      Container2.prototype.render = function(renderer) {
        if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
          return;
        }
        if (this._mask || this.filters && this.filters.length) {
          this.renderAdvanced(renderer);
        } else {
          this._render(renderer);
          for (var i = 0, j = this.children.length; i < j; ++i) {
            this.children[i].render(renderer);
          }
        }
      };
      Container2.prototype.renderAdvanced = function(renderer) {
        var filters = this.filters;
        var mask = this._mask;
        if (filters) {
          if (!this._enabledFilters) {
            this._enabledFilters = [];
          }
          this._enabledFilters.length = 0;
          for (var i = 0; i < filters.length; i++) {
            if (filters[i].enabled) {
              this._enabledFilters.push(filters[i]);
            }
          }
        }
        var flush = filters && this._enabledFilters && this._enabledFilters.length || mask && (!mask.isMaskData || mask.enabled && (mask.autoDetect || mask.type !== MASK_TYPES.NONE));
        if (flush) {
          renderer.batch.flush();
        }
        if (filters && this._enabledFilters && this._enabledFilters.length) {
          renderer.filter.push(this, this._enabledFilters);
        }
        if (mask) {
          renderer.mask.push(this, this._mask);
        }
        this._render(renderer);
        for (var i = 0, j = this.children.length; i < j; i++) {
          this.children[i].render(renderer);
        }
        if (flush) {
          renderer.batch.flush();
        }
        if (mask) {
          renderer.mask.pop(this);
        }
        if (filters && this._enabledFilters && this._enabledFilters.length) {
          renderer.filter.pop();
        }
      };
      Container2.prototype._render = function(_renderer) {
      };
      Container2.prototype.destroy = function(options2) {
        _super.prototype.destroy.call(this);
        this.sortDirty = false;
        var destroyChildren = typeof options2 === "boolean" ? options2 : options2 && options2.children;
        var oldChildren = this.removeChildren(0, this.children.length);
        if (destroyChildren) {
          for (var i = 0; i < oldChildren.length; ++i) {
            oldChildren[i].destroy(options2);
          }
        }
      };
      Object.defineProperty(Container2.prototype, "width", {
        get: function() {
          return this.scale.x * this.getLocalBounds().width;
        },
        set: function(value) {
          var width = this.getLocalBounds().width;
          if (width !== 0) {
            this.scale.x = value / width;
          } else {
            this.scale.x = 1;
          }
          this._width = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Container2.prototype, "height", {
        get: function() {
          return this.scale.y * this.getLocalBounds().height;
        },
        set: function(value) {
          var height = this.getLocalBounds().height;
          if (height !== 0) {
            this.scale.y = value / height;
          } else {
            this.scale.y = 1;
          }
          this._height = value;
        },
        enumerable: false,
        configurable: true
      });
      return Container2;
    }(DisplayObject);
    Container.prototype.containerUpdateTransform = Container.prototype.updateTransform;
    exports.Bounds = Bounds;
    exports.Container = Container;
    exports.DisplayObject = DisplayObject;
    exports.TemporaryDisplayObject = TemporaryDisplayObject;
  }
});

// node_modules/@pixi/runner/dist/cjs/runner.js
var require_runner = __commonJS({
  "node_modules/@pixi/runner/dist/cjs/runner.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Runner = function() {
      function Runner2(name) {
        this.items = [];
        this._name = name;
        this._aliasCount = 0;
      }
      Runner2.prototype.emit = function(a0, a1, a2, a3, a4, a5, a6, a7) {
        if (arguments.length > 8) {
          throw new Error("max arguments reached");
        }
        var _a = this, name = _a.name, items = _a.items;
        this._aliasCount++;
        for (var i = 0, len = items.length; i < len; i++) {
          items[i][name](a0, a1, a2, a3, a4, a5, a6, a7);
        }
        if (items === this.items) {
          this._aliasCount--;
        }
        return this;
      };
      Runner2.prototype.ensureNonAliasedItems = function() {
        if (this._aliasCount > 0 && this.items.length > 1) {
          this._aliasCount = 0;
          this.items = this.items.slice(0);
        }
      };
      Runner2.prototype.add = function(item) {
        if (item[this._name]) {
          this.ensureNonAliasedItems();
          this.remove(item);
          this.items.push(item);
        }
        return this;
      };
      Runner2.prototype.remove = function(item) {
        var index = this.items.indexOf(item);
        if (index !== -1) {
          this.ensureNonAliasedItems();
          this.items.splice(index, 1);
        }
        return this;
      };
      Runner2.prototype.contains = function(item) {
        return this.items.indexOf(item) !== -1;
      };
      Runner2.prototype.removeAll = function() {
        this.ensureNonAliasedItems();
        this.items.length = 0;
        return this;
      };
      Runner2.prototype.destroy = function() {
        this.removeAll();
        this.items = null;
        this._name = null;
      };
      Object.defineProperty(Runner2.prototype, "empty", {
        get: function() {
          return this.items.length === 0;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Runner2.prototype, "name", {
        get: function() {
          return this._name;
        },
        enumerable: false,
        configurable: true
      });
      return Runner2;
    }();
    Object.defineProperties(Runner.prototype, {
      dispatch: { value: Runner.prototype.emit },
      run: { value: Runner.prototype.emit }
    });
    exports.Runner = Runner;
  }
});

// node_modules/@pixi/ticker/dist/cjs/ticker.js
var require_ticker = __commonJS({
  "node_modules/@pixi/ticker/dist/cjs/ticker.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var settings = require_settings();
    settings.settings.TARGET_FPMS = 0.06;
    (function(UPDATE_PRIORITY) {
      UPDATE_PRIORITY[UPDATE_PRIORITY["INTERACTION"] = 50] = "INTERACTION";
      UPDATE_PRIORITY[UPDATE_PRIORITY["HIGH"] = 25] = "HIGH";
      UPDATE_PRIORITY[UPDATE_PRIORITY["NORMAL"] = 0] = "NORMAL";
      UPDATE_PRIORITY[UPDATE_PRIORITY["LOW"] = -25] = "LOW";
      UPDATE_PRIORITY[UPDATE_PRIORITY["UTILITY"] = -50] = "UTILITY";
    })(exports.UPDATE_PRIORITY || (exports.UPDATE_PRIORITY = {}));
    var TickerListener = function() {
      function TickerListener2(fn, context, priority, once) {
        if (context === void 0) {
          context = null;
        }
        if (priority === void 0) {
          priority = 0;
        }
        if (once === void 0) {
          once = false;
        }
        this.next = null;
        this.previous = null;
        this._destroyed = false;
        this.fn = fn;
        this.context = context;
        this.priority = priority;
        this.once = once;
      }
      TickerListener2.prototype.match = function(fn, context) {
        if (context === void 0) {
          context = null;
        }
        return this.fn === fn && this.context === context;
      };
      TickerListener2.prototype.emit = function(deltaTime) {
        if (this.fn) {
          if (this.context) {
            this.fn.call(this.context, deltaTime);
          } else {
            this.fn(deltaTime);
          }
        }
        var redirect = this.next;
        if (this.once) {
          this.destroy(true);
        }
        if (this._destroyed) {
          this.next = null;
        }
        return redirect;
      };
      TickerListener2.prototype.connect = function(previous) {
        this.previous = previous;
        if (previous.next) {
          previous.next.previous = this;
        }
        this.next = previous.next;
        previous.next = this;
      };
      TickerListener2.prototype.destroy = function(hard) {
        if (hard === void 0) {
          hard = false;
        }
        this._destroyed = true;
        this.fn = null;
        this.context = null;
        if (this.previous) {
          this.previous.next = this.next;
        }
        if (this.next) {
          this.next.previous = this.previous;
        }
        var redirect = this.next;
        this.next = hard ? null : redirect;
        this.previous = null;
        return redirect;
      };
      return TickerListener2;
    }();
    var Ticker = function() {
      function Ticker2() {
        var _this = this;
        this.autoStart = false;
        this.deltaTime = 1;
        this.lastTime = -1;
        this.speed = 1;
        this.started = false;
        this._requestId = null;
        this._maxElapsedMS = 100;
        this._minElapsedMS = 0;
        this._protected = false;
        this._lastFrame = -1;
        this._head = new TickerListener(null, null, Infinity);
        this.deltaMS = 1 / settings.settings.TARGET_FPMS;
        this.elapsedMS = 1 / settings.settings.TARGET_FPMS;
        this._tick = function(time) {
          _this._requestId = null;
          if (_this.started) {
            _this.update(time);
            if (_this.started && _this._requestId === null && _this._head.next) {
              _this._requestId = requestAnimationFrame(_this._tick);
            }
          }
        };
      }
      Ticker2.prototype._requestIfNeeded = function() {
        if (this._requestId === null && this._head.next) {
          this.lastTime = performance.now();
          this._lastFrame = this.lastTime;
          this._requestId = requestAnimationFrame(this._tick);
        }
      };
      Ticker2.prototype._cancelIfNeeded = function() {
        if (this._requestId !== null) {
          cancelAnimationFrame(this._requestId);
          this._requestId = null;
        }
      };
      Ticker2.prototype._startIfPossible = function() {
        if (this.started) {
          this._requestIfNeeded();
        } else if (this.autoStart) {
          this.start();
        }
      };
      Ticker2.prototype.add = function(fn, context, priority) {
        if (priority === void 0) {
          priority = exports.UPDATE_PRIORITY.NORMAL;
        }
        return this._addListener(new TickerListener(fn, context, priority));
      };
      Ticker2.prototype.addOnce = function(fn, context, priority) {
        if (priority === void 0) {
          priority = exports.UPDATE_PRIORITY.NORMAL;
        }
        return this._addListener(new TickerListener(fn, context, priority, true));
      };
      Ticker2.prototype._addListener = function(listener) {
        var current = this._head.next;
        var previous = this._head;
        if (!current) {
          listener.connect(previous);
        } else {
          while (current) {
            if (listener.priority > current.priority) {
              listener.connect(previous);
              break;
            }
            previous = current;
            current = current.next;
          }
          if (!listener.previous) {
            listener.connect(previous);
          }
        }
        this._startIfPossible();
        return this;
      };
      Ticker2.prototype.remove = function(fn, context) {
        var listener = this._head.next;
        while (listener) {
          if (listener.match(fn, context)) {
            listener = listener.destroy();
          } else {
            listener = listener.next;
          }
        }
        if (!this._head.next) {
          this._cancelIfNeeded();
        }
        return this;
      };
      Object.defineProperty(Ticker2.prototype, "count", {
        get: function() {
          if (!this._head) {
            return 0;
          }
          var count = 0;
          var current = this._head;
          while (current = current.next) {
            count++;
          }
          return count;
        },
        enumerable: false,
        configurable: true
      });
      Ticker2.prototype.start = function() {
        if (!this.started) {
          this.started = true;
          this._requestIfNeeded();
        }
      };
      Ticker2.prototype.stop = function() {
        if (this.started) {
          this.started = false;
          this._cancelIfNeeded();
        }
      };
      Ticker2.prototype.destroy = function() {
        if (!this._protected) {
          this.stop();
          var listener = this._head.next;
          while (listener) {
            listener = listener.destroy(true);
          }
          this._head.destroy();
          this._head = null;
        }
      };
      Ticker2.prototype.update = function(currentTime) {
        if (currentTime === void 0) {
          currentTime = performance.now();
        }
        var elapsedMS;
        if (currentTime > this.lastTime) {
          elapsedMS = this.elapsedMS = currentTime - this.lastTime;
          if (elapsedMS > this._maxElapsedMS) {
            elapsedMS = this._maxElapsedMS;
          }
          elapsedMS *= this.speed;
          if (this._minElapsedMS) {
            var delta = currentTime - this._lastFrame | 0;
            if (delta < this._minElapsedMS) {
              return;
            }
            this._lastFrame = currentTime - delta % this._minElapsedMS;
          }
          this.deltaMS = elapsedMS;
          this.deltaTime = this.deltaMS * settings.settings.TARGET_FPMS;
          var head = this._head;
          var listener = head.next;
          while (listener) {
            listener = listener.emit(this.deltaTime);
          }
          if (!head.next) {
            this._cancelIfNeeded();
          }
        } else {
          this.deltaTime = this.deltaMS = this.elapsedMS = 0;
        }
        this.lastTime = currentTime;
      };
      Object.defineProperty(Ticker2.prototype, "FPS", {
        get: function() {
          return 1e3 / this.elapsedMS;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Ticker2.prototype, "minFPS", {
        get: function() {
          return 1e3 / this._maxElapsedMS;
        },
        set: function(fps) {
          var minFPS = Math.min(this.maxFPS, fps);
          var minFPMS = Math.min(Math.max(0, minFPS) / 1e3, settings.settings.TARGET_FPMS);
          this._maxElapsedMS = 1 / minFPMS;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Ticker2.prototype, "maxFPS", {
        get: function() {
          if (this._minElapsedMS) {
            return Math.round(1e3 / this._minElapsedMS);
          }
          return 0;
        },
        set: function(fps) {
          if (fps === 0) {
            this._minElapsedMS = 0;
          } else {
            var maxFPS = Math.max(this.minFPS, fps);
            this._minElapsedMS = 1 / (maxFPS / 1e3);
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Ticker2, "shared", {
        get: function() {
          if (!Ticker2._shared) {
            var shared = Ticker2._shared = new Ticker2();
            shared.autoStart = true;
            shared._protected = true;
          }
          return Ticker2._shared;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Ticker2, "system", {
        get: function() {
          if (!Ticker2._system) {
            var system = Ticker2._system = new Ticker2();
            system.autoStart = true;
            system._protected = true;
          }
          return Ticker2._system;
        },
        enumerable: false,
        configurable: true
      });
      return Ticker2;
    }();
    var TickerPlugin2 = function() {
      function TickerPlugin3() {
      }
      TickerPlugin3.init = function(options2) {
        var _this = this;
        options2 = Object.assign({
          autoStart: true,
          sharedTicker: false
        }, options2);
        Object.defineProperty(this, "ticker", {
          set: function(ticker) {
            if (this._ticker) {
              this._ticker.remove(this.render, this);
            }
            this._ticker = ticker;
            if (ticker) {
              ticker.add(this.render, this, exports.UPDATE_PRIORITY.LOW);
            }
          },
          get: function() {
            return this._ticker;
          }
        });
        this.stop = function() {
          _this._ticker.stop();
        };
        this.start = function() {
          _this._ticker.start();
        };
        this._ticker = null;
        this.ticker = options2.sharedTicker ? Ticker.shared : new Ticker();
        if (options2.autoStart) {
          this.start();
        }
      };
      TickerPlugin3.destroy = function() {
        if (this._ticker) {
          var oldTicker = this._ticker;
          this.ticker = null;
          oldTicker.destroy();
        }
      };
      return TickerPlugin3;
    }();
    exports.Ticker = Ticker;
    exports.TickerPlugin = TickerPlugin2;
  }
});

// node_modules/@pixi/core/dist/cjs/core.js
var require_core = __commonJS({
  "node_modules/@pixi/core/dist/cjs/core.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var settings = require_settings();
    var constants = require_constants();
    var utils = require_utils();
    var runner = require_runner();
    var ticker = require_ticker();
    var math = require_math();
    settings.settings.PREFER_ENV = utils.isMobile.any ? constants.ENV.WEBGL : constants.ENV.WEBGL2;
    settings.settings.STRICT_TEXTURE_CACHE = false;
    var INSTALLED = [];
    function autoDetectResource(source, options2) {
      if (!source) {
        return null;
      }
      var extension = "";
      if (typeof source === "string") {
        var result = /\.(\w{3,4})(?:$|\?|#)/i.exec(source);
        if (result) {
          extension = result[1].toLowerCase();
        }
      }
      for (var i = INSTALLED.length - 1; i >= 0; --i) {
        var ResourcePlugin = INSTALLED[i];
        if (ResourcePlugin.test && ResourcePlugin.test(source, extension)) {
          return new ResourcePlugin(source, options2);
        }
      }
      throw new Error("Unrecognized source type to auto-detect Resource");
    }
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2) {
          if (b2.hasOwnProperty(p)) {
            d2[p] = b2[p];
          }
        }
      };
      return extendStatics(d, b);
    };
    function __extends(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function() {
      __assign = Object.assign || function __assign2(t) {
        var arguments$1 = arguments;
        for (var s2, i = 1, n = arguments.length; i < n; i++) {
          s2 = arguments$1[i];
          for (var p in s2) {
            if (Object.prototype.hasOwnProperty.call(s2, p)) {
              t[p] = s2[p];
            }
          }
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    function __rest(s2, e) {
      var t = {};
      for (var p in s2) {
        if (Object.prototype.hasOwnProperty.call(s2, p) && e.indexOf(p) < 0) {
          t[p] = s2[p];
        }
      }
      if (s2 != null && typeof Object.getOwnPropertySymbols === "function") {
        for (var i = 0, p = Object.getOwnPropertySymbols(s2); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0) {
            t[p[i]] = s2[p[i]];
          }
        }
      }
      return t;
    }
    var Resource = function() {
      function Resource2(width, height) {
        if (width === void 0) {
          width = 0;
        }
        if (height === void 0) {
          height = 0;
        }
        this._width = width;
        this._height = height;
        this.destroyed = false;
        this.internal = false;
        this.onResize = new runner.Runner("setRealSize");
        this.onUpdate = new runner.Runner("update");
        this.onError = new runner.Runner("onError");
      }
      Resource2.prototype.bind = function(baseTexture) {
        this.onResize.add(baseTexture);
        this.onUpdate.add(baseTexture);
        this.onError.add(baseTexture);
        if (this._width || this._height) {
          this.onResize.emit(this._width, this._height);
        }
      };
      Resource2.prototype.unbind = function(baseTexture) {
        this.onResize.remove(baseTexture);
        this.onUpdate.remove(baseTexture);
        this.onError.remove(baseTexture);
      };
      Resource2.prototype.resize = function(width, height) {
        if (width !== this._width || height !== this._height) {
          this._width = width;
          this._height = height;
          this.onResize.emit(width, height);
        }
      };
      Object.defineProperty(Resource2.prototype, "valid", {
        get: function() {
          return !!this._width && !!this._height;
        },
        enumerable: false,
        configurable: true
      });
      Resource2.prototype.update = function() {
        if (!this.destroyed) {
          this.onUpdate.emit();
        }
      };
      Resource2.prototype.load = function() {
        return Promise.resolve(this);
      };
      Object.defineProperty(Resource2.prototype, "width", {
        get: function() {
          return this._width;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Resource2.prototype, "height", {
        get: function() {
          return this._height;
        },
        enumerable: false,
        configurable: true
      });
      Resource2.prototype.style = function(_renderer, _baseTexture, _glTexture) {
        return false;
      };
      Resource2.prototype.dispose = function() {
      };
      Resource2.prototype.destroy = function() {
        if (!this.destroyed) {
          this.destroyed = true;
          this.dispose();
          this.onError.removeAll();
          this.onError = null;
          this.onResize.removeAll();
          this.onResize = null;
          this.onUpdate.removeAll();
          this.onUpdate = null;
        }
      };
      Resource2.test = function(_source, _extension) {
        return false;
      };
      return Resource2;
    }();
    var BufferResource = function(_super) {
      __extends(BufferResource2, _super);
      function BufferResource2(source, options2) {
        var _this = this;
        var _a = options2 || {}, width = _a.width, height = _a.height;
        if (!width || !height) {
          throw new Error("BufferResource width or height invalid");
        }
        _this = _super.call(this, width, height) || this;
        _this.data = source;
        return _this;
      }
      BufferResource2.prototype.upload = function(renderer, baseTexture, glTexture) {
        var gl = renderer.gl;
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === constants.ALPHA_MODES.UNPACK);
        var width = baseTexture.realWidth;
        var height = baseTexture.realHeight;
        if (glTexture.width === width && glTexture.height === height) {
          gl.texSubImage2D(baseTexture.target, 0, 0, 0, width, height, baseTexture.format, glTexture.type, this.data);
        } else {
          glTexture.width = width;
          glTexture.height = height;
          gl.texImage2D(baseTexture.target, 0, glTexture.internalFormat, width, height, 0, baseTexture.format, glTexture.type, this.data);
        }
        return true;
      };
      BufferResource2.prototype.dispose = function() {
        this.data = null;
      };
      BufferResource2.test = function(source) {
        return source instanceof Float32Array || source instanceof Uint8Array || source instanceof Uint32Array;
      };
      return BufferResource2;
    }(Resource);
    var defaultBufferOptions = {
      scaleMode: constants.SCALE_MODES.NEAREST,
      format: constants.FORMATS.RGBA,
      alphaMode: constants.ALPHA_MODES.NPM
    };
    var BaseTexture = function(_super) {
      __extends(BaseTexture2, _super);
      function BaseTexture2(resource, options2) {
        if (resource === void 0) {
          resource = null;
        }
        if (options2 === void 0) {
          options2 = null;
        }
        var _this = _super.call(this) || this;
        options2 = options2 || {};
        var alphaMode = options2.alphaMode, mipmap = options2.mipmap, anisotropicLevel = options2.anisotropicLevel, scaleMode = options2.scaleMode, width = options2.width, height = options2.height, wrapMode = options2.wrapMode, format2 = options2.format, type = options2.type, target = options2.target, resolution = options2.resolution, resourceOptions = options2.resourceOptions;
        if (resource && !(resource instanceof Resource)) {
          resource = autoDetectResource(resource, resourceOptions);
          resource.internal = true;
        }
        _this.resolution = resolution || settings.settings.RESOLUTION;
        _this.width = Math.round((width || 0) * _this.resolution) / _this.resolution;
        _this.height = Math.round((height || 0) * _this.resolution) / _this.resolution;
        _this._mipmap = mipmap !== void 0 ? mipmap : settings.settings.MIPMAP_TEXTURES;
        _this.anisotropicLevel = anisotropicLevel !== void 0 ? anisotropicLevel : settings.settings.ANISOTROPIC_LEVEL;
        _this._wrapMode = wrapMode || settings.settings.WRAP_MODE;
        _this._scaleMode = scaleMode !== void 0 ? scaleMode : settings.settings.SCALE_MODE;
        _this.format = format2 || constants.FORMATS.RGBA;
        _this.type = type || constants.TYPES.UNSIGNED_BYTE;
        _this.target = target || constants.TARGETS.TEXTURE_2D;
        _this.alphaMode = alphaMode !== void 0 ? alphaMode : constants.ALPHA_MODES.UNPACK;
        _this.uid = utils.uid();
        _this.touched = 0;
        _this.isPowerOfTwo = false;
        _this._refreshPOT();
        _this._glTextures = {};
        _this.dirtyId = 0;
        _this.dirtyStyleId = 0;
        _this.cacheId = null;
        _this.valid = width > 0 && height > 0;
        _this.textureCacheIds = [];
        _this.destroyed = false;
        _this.resource = null;
        _this._batchEnabled = 0;
        _this._batchLocation = 0;
        _this.parentTextureArray = null;
        _this.setResource(resource);
        return _this;
      }
      Object.defineProperty(BaseTexture2.prototype, "realWidth", {
        get: function() {
          return Math.round(this.width * this.resolution);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(BaseTexture2.prototype, "realHeight", {
        get: function() {
          return Math.round(this.height * this.resolution);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(BaseTexture2.prototype, "mipmap", {
        get: function() {
          return this._mipmap;
        },
        set: function(value) {
          if (this._mipmap !== value) {
            this._mipmap = value;
            this.dirtyStyleId++;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(BaseTexture2.prototype, "scaleMode", {
        get: function() {
          return this._scaleMode;
        },
        set: function(value) {
          if (this._scaleMode !== value) {
            this._scaleMode = value;
            this.dirtyStyleId++;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(BaseTexture2.prototype, "wrapMode", {
        get: function() {
          return this._wrapMode;
        },
        set: function(value) {
          if (this._wrapMode !== value) {
            this._wrapMode = value;
            this.dirtyStyleId++;
          }
        },
        enumerable: false,
        configurable: true
      });
      BaseTexture2.prototype.setStyle = function(scaleMode, mipmap) {
        var dirty;
        if (scaleMode !== void 0 && scaleMode !== this.scaleMode) {
          this.scaleMode = scaleMode;
          dirty = true;
        }
        if (mipmap !== void 0 && mipmap !== this.mipmap) {
          this.mipmap = mipmap;
          dirty = true;
        }
        if (dirty) {
          this.dirtyStyleId++;
        }
        return this;
      };
      BaseTexture2.prototype.setSize = function(desiredWidth, desiredHeight, resolution) {
        resolution = resolution || this.resolution;
        return this.setRealSize(desiredWidth * resolution, desiredHeight * resolution, resolution);
      };
      BaseTexture2.prototype.setRealSize = function(realWidth, realHeight, resolution) {
        this.resolution = resolution || this.resolution;
        this.width = Math.round(realWidth) / this.resolution;
        this.height = Math.round(realHeight) / this.resolution;
        this._refreshPOT();
        this.update();
        return this;
      };
      BaseTexture2.prototype._refreshPOT = function() {
        this.isPowerOfTwo = utils.isPow2(this.realWidth) && utils.isPow2(this.realHeight);
      };
      BaseTexture2.prototype.setResolution = function(resolution) {
        var oldResolution = this.resolution;
        if (oldResolution === resolution) {
          return this;
        }
        this.resolution = resolution;
        if (this.valid) {
          this.width = Math.round(this.width * oldResolution) / resolution;
          this.height = Math.round(this.height * oldResolution) / resolution;
          this.emit("update", this);
        }
        this._refreshPOT();
        return this;
      };
      BaseTexture2.prototype.setResource = function(resource) {
        if (this.resource === resource) {
          return this;
        }
        if (this.resource) {
          throw new Error("Resource can be set only once");
        }
        resource.bind(this);
        this.resource = resource;
        return this;
      };
      BaseTexture2.prototype.update = function() {
        if (!this.valid) {
          if (this.width > 0 && this.height > 0) {
            this.valid = true;
            this.emit("loaded", this);
            this.emit("update", this);
          }
        } else {
          this.dirtyId++;
          this.dirtyStyleId++;
          this.emit("update", this);
        }
      };
      BaseTexture2.prototype.onError = function(event) {
        this.emit("error", this, event);
      };
      BaseTexture2.prototype.destroy = function() {
        if (this.resource) {
          this.resource.unbind(this);
          if (this.resource.internal) {
            this.resource.destroy();
          }
          this.resource = null;
        }
        if (this.cacheId) {
          delete utils.BaseTextureCache[this.cacheId];
          delete utils.TextureCache[this.cacheId];
          this.cacheId = null;
        }
        this.dispose();
        BaseTexture2.removeFromCache(this);
        this.textureCacheIds = null;
        this.destroyed = true;
      };
      BaseTexture2.prototype.dispose = function() {
        this.emit("dispose", this);
      };
      BaseTexture2.prototype.castToBaseTexture = function() {
        return this;
      };
      BaseTexture2.from = function(source, options2, strict) {
        if (strict === void 0) {
          strict = settings.settings.STRICT_TEXTURE_CACHE;
        }
        var isFrame = typeof source === "string";
        var cacheId = null;
        if (isFrame) {
          cacheId = source;
        } else {
          if (!source._pixiId) {
            var prefix = options2 && options2.pixiIdPrefix || "pixiid";
            source._pixiId = prefix + "_" + utils.uid();
          }
          cacheId = source._pixiId;
        }
        var baseTexture = utils.BaseTextureCache[cacheId];
        if (isFrame && strict && !baseTexture) {
          throw new Error('The cacheId "' + cacheId + '" does not exist in BaseTextureCache.');
        }
        if (!baseTexture) {
          baseTexture = new BaseTexture2(source, options2);
          baseTexture.cacheId = cacheId;
          BaseTexture2.addToCache(baseTexture, cacheId);
        }
        return baseTexture;
      };
      BaseTexture2.fromBuffer = function(buffer, width, height, options2) {
        buffer = buffer || new Float32Array(width * height * 4);
        var resource = new BufferResource(buffer, { width, height });
        var type = buffer instanceof Float32Array ? constants.TYPES.FLOAT : constants.TYPES.UNSIGNED_BYTE;
        return new BaseTexture2(resource, Object.assign(defaultBufferOptions, options2 || { width, height, type }));
      };
      BaseTexture2.addToCache = function(baseTexture, id) {
        if (id) {
          if (baseTexture.textureCacheIds.indexOf(id) === -1) {
            baseTexture.textureCacheIds.push(id);
          }
          if (utils.BaseTextureCache[id]) {
            console.warn("BaseTexture added to the cache with an id [" + id + "] that already had an entry");
          }
          utils.BaseTextureCache[id] = baseTexture;
        }
      };
      BaseTexture2.removeFromCache = function(baseTexture) {
        if (typeof baseTexture === "string") {
          var baseTextureFromCache = utils.BaseTextureCache[baseTexture];
          if (baseTextureFromCache) {
            var index = baseTextureFromCache.textureCacheIds.indexOf(baseTexture);
            if (index > -1) {
              baseTextureFromCache.textureCacheIds.splice(index, 1);
            }
            delete utils.BaseTextureCache[baseTexture];
            return baseTextureFromCache;
          }
        } else if (baseTexture && baseTexture.textureCacheIds) {
          for (var i = 0; i < baseTexture.textureCacheIds.length; ++i) {
            delete utils.BaseTextureCache[baseTexture.textureCacheIds[i]];
          }
          baseTexture.textureCacheIds.length = 0;
          return baseTexture;
        }
        return null;
      };
      BaseTexture2._globalBatch = 0;
      return BaseTexture2;
    }(utils.EventEmitter);
    var AbstractMultiResource = function(_super) {
      __extends(AbstractMultiResource2, _super);
      function AbstractMultiResource2(length, options2) {
        var _this = this;
        var _a = options2 || {}, width = _a.width, height = _a.height;
        _this = _super.call(this, width, height) || this;
        _this.items = [];
        _this.itemDirtyIds = [];
        for (var i = 0; i < length; i++) {
          var partTexture = new BaseTexture();
          _this.items.push(partTexture);
          _this.itemDirtyIds.push(-2);
        }
        _this.length = length;
        _this._load = null;
        _this.baseTexture = null;
        return _this;
      }
      AbstractMultiResource2.prototype.initFromArray = function(resources2, options2) {
        for (var i = 0; i < this.length; i++) {
          if (!resources2[i]) {
            continue;
          }
          if (resources2[i].castToBaseTexture) {
            this.addBaseTextureAt(resources2[i].castToBaseTexture(), i);
          } else if (resources2[i] instanceof Resource) {
            this.addResourceAt(resources2[i], i);
          } else {
            this.addResourceAt(autoDetectResource(resources2[i], options2), i);
          }
        }
      };
      AbstractMultiResource2.prototype.dispose = function() {
        for (var i = 0, len = this.length; i < len; i++) {
          this.items[i].destroy();
        }
        this.items = null;
        this.itemDirtyIds = null;
        this._load = null;
      };
      AbstractMultiResource2.prototype.addResourceAt = function(resource, index) {
        if (!this.items[index]) {
          throw new Error("Index " + index + " is out of bounds");
        }
        if (resource.valid && !this.valid) {
          this.resize(resource.width, resource.height);
        }
        this.items[index].setResource(resource);
        return this;
      };
      AbstractMultiResource2.prototype.bind = function(baseTexture) {
        if (this.baseTexture !== null) {
          throw new Error("Only one base texture per TextureArray is allowed");
        }
        _super.prototype.bind.call(this, baseTexture);
        for (var i = 0; i < this.length; i++) {
          this.items[i].parentTextureArray = baseTexture;
          this.items[i].on("update", baseTexture.update, baseTexture);
        }
      };
      AbstractMultiResource2.prototype.unbind = function(baseTexture) {
        _super.prototype.unbind.call(this, baseTexture);
        for (var i = 0; i < this.length; i++) {
          this.items[i].parentTextureArray = null;
          this.items[i].off("update", baseTexture.update, baseTexture);
        }
      };
      AbstractMultiResource2.prototype.load = function() {
        var _this = this;
        if (this._load) {
          return this._load;
        }
        var resources2 = this.items.map(function(item) {
          return item.resource;
        }).filter(function(item) {
          return item;
        });
        var promises = resources2.map(function(item) {
          return item.load();
        });
        this._load = Promise.all(promises).then(function() {
          var _a = _this.items[0], realWidth = _a.realWidth, realHeight = _a.realHeight;
          _this.resize(realWidth, realHeight);
          return Promise.resolve(_this);
        });
        return this._load;
      };
      return AbstractMultiResource2;
    }(Resource);
    var ArrayResource = function(_super) {
      __extends(ArrayResource2, _super);
      function ArrayResource2(source, options2) {
        var _this = this;
        var _a = options2 || {}, width = _a.width, height = _a.height;
        var urls;
        var length;
        if (Array.isArray(source)) {
          urls = source;
          length = source.length;
        } else {
          length = source;
        }
        _this = _super.call(this, length, { width, height }) || this;
        if (urls) {
          _this.initFromArray(urls, options2);
        }
        return _this;
      }
      ArrayResource2.prototype.addBaseTextureAt = function(baseTexture, index) {
        if (baseTexture.resource) {
          this.addResourceAt(baseTexture.resource, index);
        } else {
          throw new Error("ArrayResource does not support RenderTexture");
        }
        return this;
      };
      ArrayResource2.prototype.bind = function(baseTexture) {
        _super.prototype.bind.call(this, baseTexture);
        baseTexture.target = constants.TARGETS.TEXTURE_2D_ARRAY;
      };
      ArrayResource2.prototype.upload = function(renderer, texture, glTexture) {
        var _a = this, length = _a.length, itemDirtyIds = _a.itemDirtyIds, items = _a.items;
        var gl = renderer.gl;
        if (glTexture.dirtyId < 0) {
          gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, glTexture.internalFormat, this._width, this._height, length, 0, texture.format, glTexture.type, null);
        }
        for (var i = 0; i < length; i++) {
          var item = items[i];
          if (itemDirtyIds[i] < item.dirtyId) {
            itemDirtyIds[i] = item.dirtyId;
            if (item.valid) {
              gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, item.resource.width, item.resource.height, 1, texture.format, glTexture.type, item.resource.source);
            }
          }
        }
        return true;
      };
      return ArrayResource2;
    }(AbstractMultiResource);
    var BaseImageResource = function(_super) {
      __extends(BaseImageResource2, _super);
      function BaseImageResource2(source) {
        var _this = this;
        var sourceAny = source;
        var width = sourceAny.naturalWidth || sourceAny.videoWidth || sourceAny.width;
        var height = sourceAny.naturalHeight || sourceAny.videoHeight || sourceAny.height;
        _this = _super.call(this, width, height) || this;
        _this.source = source;
        _this.noSubImage = false;
        return _this;
      }
      BaseImageResource2.crossOrigin = function(element, url, crossorigin) {
        if (crossorigin === void 0 && url.indexOf("data:") !== 0) {
          element.crossOrigin = utils.determineCrossOrigin(url);
        } else if (crossorigin !== false) {
          element.crossOrigin = typeof crossorigin === "string" ? crossorigin : "anonymous";
        }
      };
      BaseImageResource2.prototype.upload = function(renderer, baseTexture, glTexture, source) {
        var gl = renderer.gl;
        var width = baseTexture.realWidth;
        var height = baseTexture.realHeight;
        source = source || this.source;
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === constants.ALPHA_MODES.UNPACK);
        if (!this.noSubImage && baseTexture.target === gl.TEXTURE_2D && glTexture.width === width && glTexture.height === height) {
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, baseTexture.format, glTexture.type, source);
        } else {
          glTexture.width = width;
          glTexture.height = height;
          gl.texImage2D(baseTexture.target, 0, glTexture.internalFormat, baseTexture.format, glTexture.type, source);
        }
        return true;
      };
      BaseImageResource2.prototype.update = function() {
        if (this.destroyed) {
          return;
        }
        var source = this.source;
        var width = source.naturalWidth || source.videoWidth || source.width;
        var height = source.naturalHeight || source.videoHeight || source.height;
        this.resize(width, height);
        _super.prototype.update.call(this);
      };
      BaseImageResource2.prototype.dispose = function() {
        this.source = null;
      };
      return BaseImageResource2;
    }(Resource);
    var CanvasResource = function(_super) {
      __extends(CanvasResource2, _super);
      function CanvasResource2(source) {
        return _super.call(this, source) || this;
      }
      CanvasResource2.test = function(source) {
        var OffscreenCanvas2 = self.OffscreenCanvas;
        if (OffscreenCanvas2 && source instanceof OffscreenCanvas2) {
          return true;
        }
        return self.HTMLCanvasElement && source instanceof HTMLCanvasElement;
      };
      return CanvasResource2;
    }(BaseImageResource);
    var CubeResource = function(_super) {
      __extends(CubeResource2, _super);
      function CubeResource2(source, options2) {
        var _this = this;
        var _a = options2 || {}, width = _a.width, height = _a.height, autoLoad = _a.autoLoad, linkBaseTexture = _a.linkBaseTexture;
        if (source && source.length !== CubeResource2.SIDES) {
          throw new Error("Invalid length. Got " + source.length + ", expected 6");
        }
        _this = _super.call(this, 6, { width, height }) || this;
        for (var i = 0; i < CubeResource2.SIDES; i++) {
          _this.items[i].target = constants.TARGETS.TEXTURE_CUBE_MAP_POSITIVE_X + i;
        }
        _this.linkBaseTexture = linkBaseTexture !== false;
        if (source) {
          _this.initFromArray(source, options2);
        }
        if (autoLoad !== false) {
          _this.load();
        }
        return _this;
      }
      CubeResource2.prototype.bind = function(baseTexture) {
        _super.prototype.bind.call(this, baseTexture);
        baseTexture.target = constants.TARGETS.TEXTURE_CUBE_MAP;
      };
      CubeResource2.prototype.addBaseTextureAt = function(baseTexture, index, linkBaseTexture) {
        if (linkBaseTexture === void 0) {
          linkBaseTexture = this.linkBaseTexture;
        }
        if (!this.items[index]) {
          throw new Error("Index " + index + " is out of bounds");
        }
        if (!this.linkBaseTexture || baseTexture.parentTextureArray || Object.keys(baseTexture._glTextures).length > 0) {
          if (baseTexture.resource) {
            this.addResourceAt(baseTexture.resource, index);
          } else {
            throw new Error("CubeResource does not support copying of renderTexture.");
          }
        } else {
          baseTexture.target = constants.TARGETS.TEXTURE_CUBE_MAP_POSITIVE_X + index;
          baseTexture.parentTextureArray = this.baseTexture;
          this.items[index] = baseTexture;
        }
        if (baseTexture.valid && !this.valid) {
          this.resize(baseTexture.realWidth, baseTexture.realHeight);
        }
        this.items[index] = baseTexture;
        return this;
      };
      CubeResource2.prototype.upload = function(renderer, _baseTexture, glTexture) {
        var dirty = this.itemDirtyIds;
        for (var i = 0; i < CubeResource2.SIDES; i++) {
          var side = this.items[i];
          if (dirty[i] < side.dirtyId) {
            if (side.valid && side.resource) {
              side.resource.upload(renderer, side, glTexture);
              dirty[i] = side.dirtyId;
            } else if (dirty[i] < -1) {
              renderer.gl.texImage2D(side.target, 0, glTexture.internalFormat, _baseTexture.realWidth, _baseTexture.realHeight, 0, _baseTexture.format, glTexture.type, null);
              dirty[i] = -1;
            }
          }
        }
        return true;
      };
      CubeResource2.test = function(source) {
        return Array.isArray(source) && source.length === CubeResource2.SIDES;
      };
      CubeResource2.SIDES = 6;
      return CubeResource2;
    }(AbstractMultiResource);
    var ImageResource = function(_super) {
      __extends(ImageResource2, _super);
      function ImageResource2(source, options2) {
        var _this = this;
        options2 = options2 || {};
        if (!(source instanceof HTMLImageElement)) {
          var imageElement = new Image();
          BaseImageResource.crossOrigin(imageElement, source, options2.crossorigin);
          imageElement.src = source;
          source = imageElement;
        }
        _this = _super.call(this, source) || this;
        if (!source.complete && !!_this._width && !!_this._height) {
          _this._width = 0;
          _this._height = 0;
        }
        _this.url = source.src;
        _this._process = null;
        _this.preserveBitmap = false;
        _this.createBitmap = (options2.createBitmap !== void 0 ? options2.createBitmap : settings.settings.CREATE_IMAGE_BITMAP) && !!self.createImageBitmap;
        _this.alphaMode = typeof options2.alphaMode === "number" ? options2.alphaMode : null;
        _this.bitmap = null;
        _this._load = null;
        if (options2.autoLoad !== false) {
          _this.load();
        }
        return _this;
      }
      ImageResource2.prototype.load = function(createBitmap) {
        var _this = this;
        if (this._load) {
          return this._load;
        }
        if (createBitmap !== void 0) {
          this.createBitmap = createBitmap;
        }
        this._load = new Promise(function(resolve2, reject) {
          var source = _this.source;
          _this.url = source.src;
          var completed = function() {
            if (_this.destroyed) {
              return;
            }
            source.onload = null;
            source.onerror = null;
            _this.resize(source.width, source.height);
            _this._load = null;
            if (_this.createBitmap) {
              resolve2(_this.process());
            } else {
              resolve2(_this);
            }
          };
          if (source.complete && source.src) {
            completed();
          } else {
            source.onload = completed;
            source.onerror = function(event) {
              reject(event);
              _this.onError.emit(event);
            };
          }
        });
        return this._load;
      };
      ImageResource2.prototype.process = function() {
        var _this = this;
        var source = this.source;
        if (this._process !== null) {
          return this._process;
        }
        if (this.bitmap !== null || !self.createImageBitmap) {
          return Promise.resolve(this);
        }
        var createImageBitmap = self.createImageBitmap;
        var cors = !source.crossOrigin || source.crossOrigin === "anonymous";
        this._process = fetch(source.src, {
          mode: cors ? "cors" : "no-cors"
        }).then(function(r) {
          return r.blob();
        }).then(function(blob) {
          return createImageBitmap(blob, 0, 0, source.width, source.height, {
            premultiplyAlpha: _this.alphaMode === constants.ALPHA_MODES.UNPACK ? "premultiply" : "none"
          });
        }).then(function(bitmap) {
          if (_this.destroyed) {
            return Promise.reject();
          }
          _this.bitmap = bitmap;
          _this.update();
          _this._process = null;
          return Promise.resolve(_this);
        });
        return this._process;
      };
      ImageResource2.prototype.upload = function(renderer, baseTexture, glTexture) {
        if (typeof this.alphaMode === "number") {
          baseTexture.alphaMode = this.alphaMode;
        }
        if (!this.createBitmap) {
          return _super.prototype.upload.call(this, renderer, baseTexture, glTexture);
        }
        if (!this.bitmap) {
          this.process();
          if (!this.bitmap) {
            return false;
          }
        }
        _super.prototype.upload.call(this, renderer, baseTexture, glTexture, this.bitmap);
        if (!this.preserveBitmap) {
          var flag = true;
          var glTextures = baseTexture._glTextures;
          for (var key in glTextures) {
            var otherTex = glTextures[key];
            if (otherTex !== glTexture && otherTex.dirtyId !== baseTexture.dirtyId) {
              flag = false;
              break;
            }
          }
          if (flag) {
            if (this.bitmap.close) {
              this.bitmap.close();
            }
            this.bitmap = null;
          }
        }
        return true;
      };
      ImageResource2.prototype.dispose = function() {
        this.source.onload = null;
        this.source.onerror = null;
        _super.prototype.dispose.call(this);
        if (this.bitmap) {
          this.bitmap.close();
          this.bitmap = null;
        }
        this._process = null;
        this._load = null;
      };
      ImageResource2.test = function(source) {
        return typeof source === "string" || source instanceof HTMLImageElement;
      };
      return ImageResource2;
    }(BaseImageResource);
    var SVGResource = function(_super) {
      __extends(SVGResource2, _super);
      function SVGResource2(sourceBase64, options2) {
        var _this = this;
        options2 = options2 || {};
        _this = _super.call(this, document.createElement("canvas")) || this;
        _this._width = 0;
        _this._height = 0;
        _this.svg = sourceBase64;
        _this.scale = options2.scale || 1;
        _this._overrideWidth = options2.width;
        _this._overrideHeight = options2.height;
        _this._resolve = null;
        _this._crossorigin = options2.crossorigin;
        _this._load = null;
        if (options2.autoLoad !== false) {
          _this.load();
        }
        return _this;
      }
      SVGResource2.prototype.load = function() {
        var _this = this;
        if (this._load) {
          return this._load;
        }
        this._load = new Promise(function(resolve2) {
          _this._resolve = function() {
            _this.resize(_this.source.width, _this.source.height);
            resolve2(_this);
          };
          if (SVGResource2.SVG_XML.test(_this.svg.trim())) {
            if (!btoa) {
              throw new Error("Your browser doesn't support base64 conversions.");
            }
            _this.svg = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(_this.svg)));
          }
          _this._loadSvg();
        });
        return this._load;
      };
      SVGResource2.prototype._loadSvg = function() {
        var _this = this;
        var tempImage = new Image();
        BaseImageResource.crossOrigin(tempImage, this.svg, this._crossorigin);
        tempImage.src = this.svg;
        tempImage.onerror = function(event) {
          if (!_this._resolve) {
            return;
          }
          tempImage.onerror = null;
          _this.onError.emit(event);
        };
        tempImage.onload = function() {
          if (!_this._resolve) {
            return;
          }
          var svgWidth = tempImage.width;
          var svgHeight = tempImage.height;
          if (!svgWidth || !svgHeight) {
            throw new Error("The SVG image must have width and height defined (in pixels), canvas API needs them.");
          }
          var width = svgWidth * _this.scale;
          var height = svgHeight * _this.scale;
          if (_this._overrideWidth || _this._overrideHeight) {
            width = _this._overrideWidth || _this._overrideHeight / svgHeight * svgWidth;
            height = _this._overrideHeight || _this._overrideWidth / svgWidth * svgHeight;
          }
          width = Math.round(width);
          height = Math.round(height);
          var canvas = _this.source;
          canvas.width = width;
          canvas.height = height;
          canvas._pixiId = "canvas_" + utils.uid();
          canvas.getContext("2d").drawImage(tempImage, 0, 0, svgWidth, svgHeight, 0, 0, width, height);
          _this._resolve();
          _this._resolve = null;
        };
      };
      SVGResource2.getSize = function(svgString) {
        var sizeMatch = SVGResource2.SVG_SIZE.exec(svgString);
        var size = {};
        if (sizeMatch) {
          size[sizeMatch[1]] = Math.round(parseFloat(sizeMatch[3]));
          size[sizeMatch[5]] = Math.round(parseFloat(sizeMatch[7]));
        }
        return size;
      };
      SVGResource2.prototype.dispose = function() {
        _super.prototype.dispose.call(this);
        this._resolve = null;
        this._crossorigin = null;
      };
      SVGResource2.test = function(source, extension) {
        return extension === "svg" || typeof source === "string" && /^data:image\/svg\+xml(;(charset=utf8|utf8))?;base64/.test(source) || typeof source === "string" && SVGResource2.SVG_XML.test(source);
      };
      SVGResource2.SVG_XML = /^(<\?xml[^?]+\?>)?\s*(<!--[^(-->)]*-->)?\s*\<svg/m;
      SVGResource2.SVG_SIZE = /<svg[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*>/i;
      return SVGResource2;
    }(BaseImageResource);
    var VideoResource = function(_super) {
      __extends(VideoResource2, _super);
      function VideoResource2(source, options2) {
        var _this = this;
        options2 = options2 || {};
        if (!(source instanceof HTMLVideoElement)) {
          var videoElement = document.createElement("video");
          videoElement.setAttribute("preload", "auto");
          videoElement.setAttribute("webkit-playsinline", "");
          videoElement.setAttribute("playsinline", "");
          if (typeof source === "string") {
            source = [source];
          }
          var firstSrc = source[0].src || source[0];
          BaseImageResource.crossOrigin(videoElement, firstSrc, options2.crossorigin);
          for (var i = 0; i < source.length; ++i) {
            var sourceElement = document.createElement("source");
            var _a = source[i], src2 = _a.src, mime = _a.mime;
            src2 = src2 || source[i];
            var baseSrc = src2.split("?").shift().toLowerCase();
            var ext = baseSrc.substr(baseSrc.lastIndexOf(".") + 1);
            mime = mime || VideoResource2.MIME_TYPES[ext] || "video/" + ext;
            sourceElement.src = src2;
            sourceElement.type = mime;
            videoElement.appendChild(sourceElement);
          }
          source = videoElement;
        }
        _this = _super.call(this, source) || this;
        _this.noSubImage = true;
        _this._autoUpdate = true;
        _this._isConnectedToTicker = false;
        _this._updateFPS = options2.updateFPS || 0;
        _this._msToNextUpdate = 0;
        _this.autoPlay = options2.autoPlay !== false;
        _this._load = null;
        _this._resolve = null;
        _this._onCanPlay = _this._onCanPlay.bind(_this);
        _this._onError = _this._onError.bind(_this);
        if (options2.autoLoad !== false) {
          _this.load();
        }
        return _this;
      }
      VideoResource2.prototype.update = function(_deltaTime) {
        if (!this.destroyed) {
          var elapsedMS = ticker.Ticker.shared.elapsedMS * this.source.playbackRate;
          this._msToNextUpdate = Math.floor(this._msToNextUpdate - elapsedMS);
          if (!this._updateFPS || this._msToNextUpdate <= 0) {
            _super.prototype.update.call(this);
            this._msToNextUpdate = this._updateFPS ? Math.floor(1e3 / this._updateFPS) : 0;
          }
        }
      };
      VideoResource2.prototype.load = function() {
        var _this = this;
        if (this._load) {
          return this._load;
        }
        var source = this.source;
        if ((source.readyState === source.HAVE_ENOUGH_DATA || source.readyState === source.HAVE_FUTURE_DATA) && source.width && source.height) {
          source.complete = true;
        }
        source.addEventListener("play", this._onPlayStart.bind(this));
        source.addEventListener("pause", this._onPlayStop.bind(this));
        if (!this._isSourceReady()) {
          source.addEventListener("canplay", this._onCanPlay);
          source.addEventListener("canplaythrough", this._onCanPlay);
          source.addEventListener("error", this._onError, true);
        } else {
          this._onCanPlay();
        }
        this._load = new Promise(function(resolve2) {
          if (_this.valid) {
            resolve2(_this);
          } else {
            _this._resolve = resolve2;
            source.load();
          }
        });
        return this._load;
      };
      VideoResource2.prototype._onError = function(event) {
        this.source.removeEventListener("error", this._onError, true);
        this.onError.emit(event);
      };
      VideoResource2.prototype._isSourcePlaying = function() {
        var source = this.source;
        return source.currentTime > 0 && source.paused === false && source.ended === false && source.readyState > 2;
      };
      VideoResource2.prototype._isSourceReady = function() {
        var source = this.source;
        return source.readyState === 3 || source.readyState === 4;
      };
      VideoResource2.prototype._onPlayStart = function() {
        if (!this.valid) {
          this._onCanPlay();
        }
        if (this.autoUpdate && !this._isConnectedToTicker) {
          ticker.Ticker.shared.add(this.update, this);
          this._isConnectedToTicker = true;
        }
      };
      VideoResource2.prototype._onPlayStop = function() {
        if (this._isConnectedToTicker) {
          ticker.Ticker.shared.remove(this.update, this);
          this._isConnectedToTicker = false;
        }
      };
      VideoResource2.prototype._onCanPlay = function() {
        var source = this.source;
        source.removeEventListener("canplay", this._onCanPlay);
        source.removeEventListener("canplaythrough", this._onCanPlay);
        var valid = this.valid;
        this.resize(source.videoWidth, source.videoHeight);
        if (!valid && this._resolve) {
          this._resolve(this);
          this._resolve = null;
        }
        if (this._isSourcePlaying()) {
          this._onPlayStart();
        } else if (this.autoPlay) {
          source.play();
        }
      };
      VideoResource2.prototype.dispose = function() {
        if (this._isConnectedToTicker) {
          ticker.Ticker.shared.remove(this.update, this);
          this._isConnectedToTicker = false;
        }
        var source = this.source;
        if (source) {
          source.removeEventListener("error", this._onError, true);
          source.pause();
          source.src = "";
          source.load();
        }
        _super.prototype.dispose.call(this);
      };
      Object.defineProperty(VideoResource2.prototype, "autoUpdate", {
        get: function() {
          return this._autoUpdate;
        },
        set: function(value) {
          if (value !== this._autoUpdate) {
            this._autoUpdate = value;
            if (!this._autoUpdate && this._isConnectedToTicker) {
              ticker.Ticker.shared.remove(this.update, this);
              this._isConnectedToTicker = false;
            } else if (this._autoUpdate && !this._isConnectedToTicker && this._isSourcePlaying()) {
              ticker.Ticker.shared.add(this.update, this);
              this._isConnectedToTicker = true;
            }
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(VideoResource2.prototype, "updateFPS", {
        get: function() {
          return this._updateFPS;
        },
        set: function(value) {
          if (value !== this._updateFPS) {
            this._updateFPS = value;
          }
        },
        enumerable: false,
        configurable: true
      });
      VideoResource2.test = function(source, extension) {
        return self.HTMLVideoElement && source instanceof HTMLVideoElement || VideoResource2.TYPES.indexOf(extension) > -1;
      };
      VideoResource2.TYPES = ["mp4", "m4v", "webm", "ogg", "ogv", "h264", "avi", "mov"];
      VideoResource2.MIME_TYPES = {
        ogv: "video/ogg",
        mov: "video/quicktime",
        m4v: "video/mp4"
      };
      return VideoResource2;
    }(BaseImageResource);
    var ImageBitmapResource = function(_super) {
      __extends(ImageBitmapResource2, _super);
      function ImageBitmapResource2(source) {
        return _super.call(this, source) || this;
      }
      ImageBitmapResource2.test = function(source) {
        return !!self.createImageBitmap && source instanceof ImageBitmap;
      };
      return ImageBitmapResource2;
    }(BaseImageResource);
    INSTALLED.push(ImageResource, ImageBitmapResource, CanvasResource, VideoResource, SVGResource, BufferResource, CubeResource, ArrayResource);
    var _resources = {
      __proto__: null,
      Resource,
      BaseImageResource,
      INSTALLED,
      autoDetectResource,
      AbstractMultiResource,
      ArrayResource,
      BufferResource,
      CanvasResource,
      CubeResource,
      ImageResource,
      SVGResource,
      VideoResource,
      ImageBitmapResource
    };
    var DepthResource = function(_super) {
      __extends(DepthResource2, _super);
      function DepthResource2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      DepthResource2.prototype.upload = function(renderer, baseTexture, glTexture) {
        var gl = renderer.gl;
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === constants.ALPHA_MODES.UNPACK);
        var width = baseTexture.realWidth;
        var height = baseTexture.realHeight;
        if (glTexture.width === width && glTexture.height === height) {
          gl.texSubImage2D(baseTexture.target, 0, 0, 0, width, height, baseTexture.format, glTexture.type, this.data);
        } else {
          glTexture.width = width;
          glTexture.height = height;
          gl.texImage2D(baseTexture.target, 0, glTexture.internalFormat, width, height, 0, baseTexture.format, glTexture.type, this.data);
        }
        return true;
      };
      return DepthResource2;
    }(BufferResource);
    var Framebuffer = function() {
      function Framebuffer2(width, height) {
        this.width = Math.round(width || 100);
        this.height = Math.round(height || 100);
        this.stencil = false;
        this.depth = false;
        this.dirtyId = 0;
        this.dirtyFormat = 0;
        this.dirtySize = 0;
        this.depthTexture = null;
        this.colorTextures = [];
        this.glFramebuffers = {};
        this.disposeRunner = new runner.Runner("disposeFramebuffer");
        this.multisample = constants.MSAA_QUALITY.NONE;
      }
      Object.defineProperty(Framebuffer2.prototype, "colorTexture", {
        get: function() {
          return this.colorTextures[0];
        },
        enumerable: false,
        configurable: true
      });
      Framebuffer2.prototype.addColorTexture = function(index, texture) {
        if (index === void 0) {
          index = 0;
        }
        this.colorTextures[index] = texture || new BaseTexture(null, {
          scaleMode: constants.SCALE_MODES.NEAREST,
          resolution: 1,
          mipmap: constants.MIPMAP_MODES.OFF,
          width: this.width,
          height: this.height
        });
        this.dirtyId++;
        this.dirtyFormat++;
        return this;
      };
      Framebuffer2.prototype.addDepthTexture = function(texture) {
        this.depthTexture = texture || new BaseTexture(new DepthResource(null, { width: this.width, height: this.height }), {
          scaleMode: constants.SCALE_MODES.NEAREST,
          resolution: 1,
          width: this.width,
          height: this.height,
          mipmap: constants.MIPMAP_MODES.OFF,
          format: constants.FORMATS.DEPTH_COMPONENT,
          type: constants.TYPES.UNSIGNED_SHORT
        });
        this.dirtyId++;
        this.dirtyFormat++;
        return this;
      };
      Framebuffer2.prototype.enableDepth = function() {
        this.depth = true;
        this.dirtyId++;
        this.dirtyFormat++;
        return this;
      };
      Framebuffer2.prototype.enableStencil = function() {
        this.stencil = true;
        this.dirtyId++;
        this.dirtyFormat++;
        return this;
      };
      Framebuffer2.prototype.resize = function(width, height) {
        width = Math.round(width);
        height = Math.round(height);
        if (width === this.width && height === this.height) {
          return;
        }
        this.width = width;
        this.height = height;
        this.dirtyId++;
        this.dirtySize++;
        for (var i = 0; i < this.colorTextures.length; i++) {
          var texture = this.colorTextures[i];
          var resolution = texture.resolution;
          texture.setSize(width / resolution, height / resolution);
        }
        if (this.depthTexture) {
          var resolution = this.depthTexture.resolution;
          this.depthTexture.setSize(width / resolution, height / resolution);
        }
      };
      Framebuffer2.prototype.dispose = function() {
        this.disposeRunner.emit(this, false);
      };
      Framebuffer2.prototype.destroyDepthTexture = function() {
        if (this.depthTexture) {
          this.depthTexture.destroy();
          this.depthTexture = null;
          ++this.dirtyId;
          ++this.dirtyFormat;
        }
      };
      return Framebuffer2;
    }();
    var BaseRenderTexture = function(_super) {
      __extends(BaseRenderTexture2, _super);
      function BaseRenderTexture2(options2) {
        var _this = this;
        if (typeof options2 === "number") {
          var width = arguments[0];
          var height = arguments[1];
          var scaleMode = arguments[2];
          var resolution = arguments[3];
          options2 = { width, height, scaleMode, resolution };
        }
        options2.width = options2.width || 100;
        options2.height = options2.height || 100;
        options2.multisample = options2.multisample !== void 0 ? options2.multisample : constants.MSAA_QUALITY.NONE;
        _this = _super.call(this, null, options2) || this;
        _this.mipmap = constants.MIPMAP_MODES.OFF;
        _this.valid = true;
        _this.clearColor = [0, 0, 0, 0];
        _this.framebuffer = new Framebuffer(_this.realWidth, _this.realHeight).addColorTexture(0, _this);
        _this.framebuffer.multisample = options2.multisample;
        _this.maskStack = [];
        _this.filterStack = [{}];
        return _this;
      }
      BaseRenderTexture2.prototype.resize = function(desiredWidth, desiredHeight) {
        this.framebuffer.resize(desiredWidth * this.resolution, desiredHeight * this.resolution);
        this.setRealSize(this.framebuffer.width, this.framebuffer.height);
      };
      BaseRenderTexture2.prototype.dispose = function() {
        this.framebuffer.dispose();
        _super.prototype.dispose.call(this);
      };
      BaseRenderTexture2.prototype.destroy = function() {
        _super.prototype.destroy.call(this);
        this.framebuffer.destroyDepthTexture();
        this.framebuffer = null;
      };
      return BaseRenderTexture2;
    }(BaseTexture);
    var TextureUvs = function() {
      function TextureUvs2() {
        this.x0 = 0;
        this.y0 = 0;
        this.x1 = 1;
        this.y1 = 0;
        this.x2 = 1;
        this.y2 = 1;
        this.x3 = 0;
        this.y3 = 1;
        this.uvsFloat32 = new Float32Array(8);
      }
      TextureUvs2.prototype.set = function(frame, baseFrame, rotate) {
        var tw = baseFrame.width;
        var th = baseFrame.height;
        if (rotate) {
          var w2 = frame.width / 2 / tw;
          var h2 = frame.height / 2 / th;
          var cX = frame.x / tw + w2;
          var cY = frame.y / th + h2;
          rotate = math.groupD8.add(rotate, math.groupD8.NW);
          this.x0 = cX + w2 * math.groupD8.uX(rotate);
          this.y0 = cY + h2 * math.groupD8.uY(rotate);
          rotate = math.groupD8.add(rotate, 2);
          this.x1 = cX + w2 * math.groupD8.uX(rotate);
          this.y1 = cY + h2 * math.groupD8.uY(rotate);
          rotate = math.groupD8.add(rotate, 2);
          this.x2 = cX + w2 * math.groupD8.uX(rotate);
          this.y2 = cY + h2 * math.groupD8.uY(rotate);
          rotate = math.groupD8.add(rotate, 2);
          this.x3 = cX + w2 * math.groupD8.uX(rotate);
          this.y3 = cY + h2 * math.groupD8.uY(rotate);
        } else {
          this.x0 = frame.x / tw;
          this.y0 = frame.y / th;
          this.x1 = (frame.x + frame.width) / tw;
          this.y1 = frame.y / th;
          this.x2 = (frame.x + frame.width) / tw;
          this.y2 = (frame.y + frame.height) / th;
          this.x3 = frame.x / tw;
          this.y3 = (frame.y + frame.height) / th;
        }
        this.uvsFloat32[0] = this.x0;
        this.uvsFloat32[1] = this.y0;
        this.uvsFloat32[2] = this.x1;
        this.uvsFloat32[3] = this.y1;
        this.uvsFloat32[4] = this.x2;
        this.uvsFloat32[5] = this.y2;
        this.uvsFloat32[6] = this.x3;
        this.uvsFloat32[7] = this.y3;
      };
      TextureUvs2.prototype.toString = function() {
        return "[@pixi/core:TextureUvs " + ("x0=" + this.x0 + " y0=" + this.y0 + " ") + ("x1=" + this.x1 + " y1=" + this.y1 + " x2=" + this.x2 + " ") + ("y2=" + this.y2 + " x3=" + this.x3 + " y3=" + this.y3) + "]";
      };
      return TextureUvs2;
    }();
    var DEFAULT_UVS = new TextureUvs();
    var Texture = function(_super) {
      __extends(Texture2, _super);
      function Texture2(baseTexture, frame, orig, trim, rotate, anchor) {
        var _this = _super.call(this) || this;
        _this.noFrame = false;
        if (!frame) {
          _this.noFrame = true;
          frame = new math.Rectangle(0, 0, 1, 1);
        }
        if (baseTexture instanceof Texture2) {
          baseTexture = baseTexture.baseTexture;
        }
        _this.baseTexture = baseTexture;
        _this._frame = frame;
        _this.trim = trim;
        _this.valid = false;
        _this._uvs = DEFAULT_UVS;
        _this.uvMatrix = null;
        _this.orig = orig || frame;
        _this._rotate = Number(rotate || 0);
        if (rotate === true) {
          _this._rotate = 2;
        } else if (_this._rotate % 2 !== 0) {
          throw new Error("attempt to use diamond-shaped UVs. If you are sure, set rotation manually");
        }
        _this.defaultAnchor = anchor ? new math.Point(anchor.x, anchor.y) : new math.Point(0, 0);
        _this._updateID = 0;
        _this.textureCacheIds = [];
        if (!baseTexture.valid) {
          baseTexture.once("loaded", _this.onBaseTextureUpdated, _this);
        } else if (_this.noFrame) {
          if (baseTexture.valid) {
            _this.onBaseTextureUpdated(baseTexture);
          }
        } else {
          _this.frame = frame;
        }
        if (_this.noFrame) {
          baseTexture.on("update", _this.onBaseTextureUpdated, _this);
        }
        return _this;
      }
      Texture2.prototype.update = function() {
        if (this.baseTexture.resource) {
          this.baseTexture.resource.update();
        }
      };
      Texture2.prototype.onBaseTextureUpdated = function(baseTexture) {
        if (this.noFrame) {
          if (!this.baseTexture.valid) {
            return;
          }
          this._frame.width = baseTexture.width;
          this._frame.height = baseTexture.height;
          this.valid = true;
          this.updateUvs();
        } else {
          this.frame = this._frame;
        }
        this.emit("update", this);
      };
      Texture2.prototype.destroy = function(destroyBase) {
        if (this.baseTexture) {
          if (destroyBase) {
            var resource = this.baseTexture.resource;
            if (resource && resource.url && utils.TextureCache[resource.url]) {
              Texture2.removeFromCache(resource.url);
            }
            this.baseTexture.destroy();
          }
          this.baseTexture.off("loaded", this.onBaseTextureUpdated, this);
          this.baseTexture.off("update", this.onBaseTextureUpdated, this);
          this.baseTexture = null;
        }
        this._frame = null;
        this._uvs = null;
        this.trim = null;
        this.orig = null;
        this.valid = false;
        Texture2.removeFromCache(this);
        this.textureCacheIds = null;
      };
      Texture2.prototype.clone = function() {
        var clonedFrame = this._frame.clone();
        var clonedOrig = this._frame === this.orig ? clonedFrame : this.orig.clone();
        var clonedTexture = new Texture2(this.baseTexture, !this.noFrame && clonedFrame, clonedOrig, this.trim && this.trim.clone(), this.rotate, this.defaultAnchor);
        if (this.noFrame) {
          clonedTexture._frame = clonedFrame;
        }
        return clonedTexture;
      };
      Texture2.prototype.updateUvs = function() {
        if (this._uvs === DEFAULT_UVS) {
          this._uvs = new TextureUvs();
        }
        this._uvs.set(this._frame, this.baseTexture, this.rotate);
        this._updateID++;
      };
      Texture2.from = function(source, options2, strict) {
        if (options2 === void 0) {
          options2 = {};
        }
        if (strict === void 0) {
          strict = settings.settings.STRICT_TEXTURE_CACHE;
        }
        var isFrame = typeof source === "string";
        var cacheId = null;
        if (isFrame) {
          cacheId = source;
        } else if (source instanceof BaseTexture) {
          if (!source.cacheId) {
            var prefix = options2 && options2.pixiIdPrefix || "pixiid";
            source.cacheId = prefix + "-" + utils.uid();
            BaseTexture.addToCache(source, source.cacheId);
          }
          cacheId = source.cacheId;
        } else {
          if (!source._pixiId) {
            var prefix = options2 && options2.pixiIdPrefix || "pixiid";
            source._pixiId = prefix + "_" + utils.uid();
          }
          cacheId = source._pixiId;
        }
        var texture = utils.TextureCache[cacheId];
        if (isFrame && strict && !texture) {
          throw new Error('The cacheId "' + cacheId + '" does not exist in TextureCache.');
        }
        if (!texture && !(source instanceof BaseTexture)) {
          if (!options2.resolution) {
            options2.resolution = utils.getResolutionOfUrl(source);
          }
          texture = new Texture2(new BaseTexture(source, options2));
          texture.baseTexture.cacheId = cacheId;
          BaseTexture.addToCache(texture.baseTexture, cacheId);
          Texture2.addToCache(texture, cacheId);
        } else if (!texture && source instanceof BaseTexture) {
          texture = new Texture2(source);
          Texture2.addToCache(texture, cacheId);
        }
        return texture;
      };
      Texture2.fromURL = function(url, options2) {
        var resourceOptions = Object.assign({ autoLoad: false }, options2 === null || options2 === void 0 ? void 0 : options2.resourceOptions);
        var texture = Texture2.from(url, Object.assign({ resourceOptions }, options2), false);
        var resource = texture.baseTexture.resource;
        if (texture.baseTexture.valid) {
          return Promise.resolve(texture);
        }
        return resource.load().then(function() {
          return Promise.resolve(texture);
        });
      };
      Texture2.fromBuffer = function(buffer, width, height, options2) {
        return new Texture2(BaseTexture.fromBuffer(buffer, width, height, options2));
      };
      Texture2.fromLoader = function(source, imageUrl, name2, options2) {
        var baseTexture = new BaseTexture(source, Object.assign({
          scaleMode: settings.settings.SCALE_MODE,
          resolution: utils.getResolutionOfUrl(imageUrl)
        }, options2));
        var resource = baseTexture.resource;
        if (resource instanceof ImageResource) {
          resource.url = imageUrl;
        }
        var texture = new Texture2(baseTexture);
        if (!name2) {
          name2 = imageUrl;
        }
        BaseTexture.addToCache(texture.baseTexture, name2);
        Texture2.addToCache(texture, name2);
        if (name2 !== imageUrl) {
          BaseTexture.addToCache(texture.baseTexture, imageUrl);
          Texture2.addToCache(texture, imageUrl);
        }
        if (texture.baseTexture.valid) {
          return Promise.resolve(texture);
        }
        return new Promise(function(resolve2) {
          texture.baseTexture.once("loaded", function() {
            return resolve2(texture);
          });
        });
      };
      Texture2.addToCache = function(texture, id) {
        if (id) {
          if (texture.textureCacheIds.indexOf(id) === -1) {
            texture.textureCacheIds.push(id);
          }
          if (utils.TextureCache[id]) {
            console.warn("Texture added to the cache with an id [" + id + "] that already had an entry");
          }
          utils.TextureCache[id] = texture;
        }
      };
      Texture2.removeFromCache = function(texture) {
        if (typeof texture === "string") {
          var textureFromCache = utils.TextureCache[texture];
          if (textureFromCache) {
            var index = textureFromCache.textureCacheIds.indexOf(texture);
            if (index > -1) {
              textureFromCache.textureCacheIds.splice(index, 1);
            }
            delete utils.TextureCache[texture];
            return textureFromCache;
          }
        } else if (texture && texture.textureCacheIds) {
          for (var i = 0; i < texture.textureCacheIds.length; ++i) {
            if (utils.TextureCache[texture.textureCacheIds[i]] === texture) {
              delete utils.TextureCache[texture.textureCacheIds[i]];
            }
          }
          texture.textureCacheIds.length = 0;
          return texture;
        }
        return null;
      };
      Object.defineProperty(Texture2.prototype, "resolution", {
        get: function() {
          return this.baseTexture.resolution;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Texture2.prototype, "frame", {
        get: function() {
          return this._frame;
        },
        set: function(frame) {
          this._frame = frame;
          this.noFrame = false;
          var x = frame.x, y = frame.y, width = frame.width, height = frame.height;
          var xNotFit = x + width > this.baseTexture.width;
          var yNotFit = y + height > this.baseTexture.height;
          if (xNotFit || yNotFit) {
            var relationship = xNotFit && yNotFit ? "and" : "or";
            var errorX = "X: " + x + " + " + width + " = " + (x + width) + " > " + this.baseTexture.width;
            var errorY = "Y: " + y + " + " + height + " = " + (y + height) + " > " + this.baseTexture.height;
            throw new Error("Texture Error: frame does not fit inside the base Texture dimensions: " + (errorX + " " + relationship + " " + errorY));
          }
          this.valid = width && height && this.baseTexture.valid;
          if (!this.trim && !this.rotate) {
            this.orig = frame;
          }
          if (this.valid) {
            this.updateUvs();
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Texture2.prototype, "rotate", {
        get: function() {
          return this._rotate;
        },
        set: function(rotate) {
          this._rotate = rotate;
          if (this.valid) {
            this.updateUvs();
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Texture2.prototype, "width", {
        get: function() {
          return this.orig.width;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Texture2.prototype, "height", {
        get: function() {
          return this.orig.height;
        },
        enumerable: false,
        configurable: true
      });
      Texture2.prototype.castToBaseTexture = function() {
        return this.baseTexture;
      };
      return Texture2;
    }(utils.EventEmitter);
    function createWhiteTexture() {
      var canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      var context2 = canvas.getContext("2d");
      context2.fillStyle = "white";
      context2.fillRect(0, 0, 16, 16);
      return new Texture(new BaseTexture(new CanvasResource(canvas)));
    }
    function removeAllHandlers(tex) {
      tex.destroy = function _emptyDestroy() {
      };
      tex.on = function _emptyOn() {
      };
      tex.once = function _emptyOnce() {
      };
      tex.emit = function _emptyEmit() {
      };
    }
    Texture.EMPTY = new Texture(new BaseTexture());
    removeAllHandlers(Texture.EMPTY);
    removeAllHandlers(Texture.EMPTY.baseTexture);
    Texture.WHITE = createWhiteTexture();
    removeAllHandlers(Texture.WHITE);
    removeAllHandlers(Texture.WHITE.baseTexture);
    var RenderTexture = function(_super) {
      __extends(RenderTexture2, _super);
      function RenderTexture2(baseRenderTexture, frame) {
        var _this = _super.call(this, baseRenderTexture, frame) || this;
        _this.valid = true;
        _this.filterFrame = null;
        _this.filterPoolKey = null;
        _this.updateUvs();
        return _this;
      }
      Object.defineProperty(RenderTexture2.prototype, "framebuffer", {
        get: function() {
          return this.baseTexture.framebuffer;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(RenderTexture2.prototype, "multisample", {
        get: function() {
          return this.framebuffer.multisample;
        },
        set: function(value) {
          this.framebuffer.multisample = value;
        },
        enumerable: false,
        configurable: true
      });
      RenderTexture2.prototype.resize = function(desiredWidth, desiredHeight, resizeBaseTexture) {
        if (resizeBaseTexture === void 0) {
          resizeBaseTexture = true;
        }
        var resolution = this.baseTexture.resolution;
        var width = Math.round(desiredWidth * resolution) / resolution;
        var height = Math.round(desiredHeight * resolution) / resolution;
        this.valid = width > 0 && height > 0;
        this._frame.width = this.orig.width = width;
        this._frame.height = this.orig.height = height;
        if (resizeBaseTexture) {
          this.baseTexture.resize(width, height);
        }
        this.updateUvs();
      };
      RenderTexture2.prototype.setResolution = function(resolution) {
        var baseTexture = this.baseTexture;
        if (baseTexture.resolution === resolution) {
          return;
        }
        baseTexture.setResolution(resolution);
        this.resize(baseTexture.width, baseTexture.height, false);
      };
      RenderTexture2.create = function(options2) {
        var arguments$1 = arguments;
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
          rest[_i - 1] = arguments$1[_i];
        }
        if (typeof options2 === "number") {
          utils.deprecation("6.0.0", "Arguments (width, height, scaleMode, resolution) have been deprecated.");
          options2 = {
            width: options2,
            height: rest[0],
            scaleMode: rest[1],
            resolution: rest[2]
          };
        }
        return new RenderTexture2(new BaseRenderTexture(options2));
      };
      return RenderTexture2;
    }(Texture);
    var RenderTexturePool = function() {
      function RenderTexturePool2(textureOptions) {
        this.texturePool = {};
        this.textureOptions = textureOptions || {};
        this.enableFullScreen = false;
        this._pixelsWidth = 0;
        this._pixelsHeight = 0;
      }
      RenderTexturePool2.prototype.createTexture = function(realWidth, realHeight, multisample) {
        if (multisample === void 0) {
          multisample = constants.MSAA_QUALITY.NONE;
        }
        var baseRenderTexture = new BaseRenderTexture(Object.assign({
          width: realWidth,
          height: realHeight,
          resolution: 1,
          multisample
        }, this.textureOptions));
        return new RenderTexture(baseRenderTexture);
      };
      RenderTexturePool2.prototype.getOptimalTexture = function(minWidth, minHeight, resolution, multisample) {
        if (resolution === void 0) {
          resolution = 1;
        }
        if (multisample === void 0) {
          multisample = constants.MSAA_QUALITY.NONE;
        }
        var key;
        minWidth = Math.ceil(minWidth * resolution);
        minHeight = Math.ceil(minHeight * resolution);
        if (!this.enableFullScreen || minWidth !== this._pixelsWidth || minHeight !== this._pixelsHeight) {
          minWidth = utils.nextPow2(minWidth);
          minHeight = utils.nextPow2(minHeight);
          key = ((minWidth & 65535) << 16 | minHeight & 65535) >>> 0;
          if (multisample > 1) {
            key += multisample * 4294967296;
          }
        } else {
          key = multisample > 1 ? -multisample : -1;
        }
        if (!this.texturePool[key]) {
          this.texturePool[key] = [];
        }
        var renderTexture = this.texturePool[key].pop();
        if (!renderTexture) {
          renderTexture = this.createTexture(minWidth, minHeight, multisample);
        }
        renderTexture.filterPoolKey = key;
        renderTexture.setResolution(resolution);
        return renderTexture;
      };
      RenderTexturePool2.prototype.getFilterTexture = function(input, resolution, multisample) {
        var filterTexture = this.getOptimalTexture(input.width, input.height, resolution || input.resolution, multisample || constants.MSAA_QUALITY.NONE);
        filterTexture.filterFrame = input.filterFrame;
        return filterTexture;
      };
      RenderTexturePool2.prototype.returnTexture = function(renderTexture) {
        var key = renderTexture.filterPoolKey;
        renderTexture.filterFrame = null;
        this.texturePool[key].push(renderTexture);
      };
      RenderTexturePool2.prototype.returnFilterTexture = function(renderTexture) {
        this.returnTexture(renderTexture);
      };
      RenderTexturePool2.prototype.clear = function(destroyTextures) {
        destroyTextures = destroyTextures !== false;
        if (destroyTextures) {
          for (var i in this.texturePool) {
            var textures = this.texturePool[i];
            if (textures) {
              for (var j = 0; j < textures.length; j++) {
                textures[j].destroy(true);
              }
            }
          }
        }
        this.texturePool = {};
      };
      RenderTexturePool2.prototype.setScreenSize = function(size) {
        if (size.width === this._pixelsWidth && size.height === this._pixelsHeight) {
          return;
        }
        this.enableFullScreen = size.width > 0 && size.height > 0;
        for (var i in this.texturePool) {
          if (!(Number(i) < 0)) {
            continue;
          }
          var textures = this.texturePool[i];
          if (textures) {
            for (var j = 0; j < textures.length; j++) {
              textures[j].destroy(true);
            }
          }
          this.texturePool[i] = [];
        }
        this._pixelsWidth = size.width;
        this._pixelsHeight = size.height;
      };
      RenderTexturePool2.SCREEN_KEY = -1;
      return RenderTexturePool2;
    }();
    var Attribute = function() {
      function Attribute2(buffer, size, normalized, type, stride, start, instance) {
        if (size === void 0) {
          size = 0;
        }
        if (normalized === void 0) {
          normalized = false;
        }
        if (type === void 0) {
          type = constants.TYPES.FLOAT;
        }
        this.buffer = buffer;
        this.size = size;
        this.normalized = normalized;
        this.type = type;
        this.stride = stride;
        this.start = start;
        this.instance = instance;
      }
      Attribute2.prototype.destroy = function() {
        this.buffer = null;
      };
      Attribute2.from = function(buffer, size, normalized, type, stride) {
        return new Attribute2(buffer, size, normalized, type, stride);
      };
      return Attribute2;
    }();
    var UID = 0;
    var Buffer2 = function() {
      function Buffer3(data, _static, index) {
        if (_static === void 0) {
          _static = true;
        }
        if (index === void 0) {
          index = false;
        }
        this.data = data || new Float32Array(1);
        this._glBuffers = {};
        this._updateID = 0;
        this.index = index;
        this.static = _static;
        this.id = UID++;
        this.disposeRunner = new runner.Runner("disposeBuffer");
      }
      Buffer3.prototype.update = function(data) {
        if (data instanceof Array) {
          data = new Float32Array(data);
        }
        this.data = data || this.data;
        this._updateID++;
      };
      Buffer3.prototype.dispose = function() {
        this.disposeRunner.emit(this, false);
      };
      Buffer3.prototype.destroy = function() {
        this.dispose();
        this.data = null;
      };
      Object.defineProperty(Buffer3.prototype, "index", {
        get: function() {
          return this.type === constants.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
        },
        set: function(value) {
          this.type = value ? constants.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER : constants.BUFFER_TYPE.ARRAY_BUFFER;
        },
        enumerable: false,
        configurable: true
      });
      Buffer3.from = function(data) {
        if (data instanceof Array) {
          data = new Float32Array(data);
        }
        return new Buffer3(data);
      };
      return Buffer3;
    }();
    var map = {
      Float32Array,
      Uint32Array,
      Int32Array,
      Uint8Array
    };
    function interleaveTypedArrays(arrays, sizes) {
      var outSize = 0;
      var stride = 0;
      var views = {};
      for (var i = 0; i < arrays.length; i++) {
        stride += sizes[i];
        outSize += arrays[i].length;
      }
      var buffer = new ArrayBuffer(outSize * 4);
      var out = null;
      var littleOffset = 0;
      for (var i = 0; i < arrays.length; i++) {
        var size = sizes[i];
        var array = arrays[i];
        var type = utils.getBufferType(array);
        if (!views[type]) {
          views[type] = new map[type](buffer);
        }
        out = views[type];
        for (var j = 0; j < array.length; j++) {
          var indexStart = (j / size | 0) * stride + littleOffset;
          var index = j % size;
          out[indexStart + index] = array[j];
        }
        littleOffset += size;
      }
      return new Float32Array(buffer);
    }
    var byteSizeMap = { 5126: 4, 5123: 2, 5121: 1 };
    var UID$1 = 0;
    var map$1 = {
      Float32Array,
      Uint32Array,
      Int32Array,
      Uint8Array,
      Uint16Array
    };
    var Geometry = function() {
      function Geometry2(buffers, attributes) {
        if (buffers === void 0) {
          buffers = [];
        }
        if (attributes === void 0) {
          attributes = {};
        }
        this.buffers = buffers;
        this.indexBuffer = null;
        this.attributes = attributes;
        this.glVertexArrayObjects = {};
        this.id = UID$1++;
        this.instanced = false;
        this.instanceCount = 1;
        this.disposeRunner = new runner.Runner("disposeGeometry");
        this.refCount = 0;
      }
      Geometry2.prototype.addAttribute = function(id, buffer, size, normalized, type, stride, start, instance) {
        if (size === void 0) {
          size = 0;
        }
        if (normalized === void 0) {
          normalized = false;
        }
        if (instance === void 0) {
          instance = false;
        }
        if (!buffer) {
          throw new Error("You must pass a buffer when creating an attribute");
        }
        if (!(buffer instanceof Buffer2)) {
          if (buffer instanceof Array) {
            buffer = new Float32Array(buffer);
          }
          buffer = new Buffer2(buffer);
        }
        var ids = id.split("|");
        if (ids.length > 1) {
          for (var i = 0; i < ids.length; i++) {
            this.addAttribute(ids[i], buffer, size, normalized, type);
          }
          return this;
        }
        var bufferIndex = this.buffers.indexOf(buffer);
        if (bufferIndex === -1) {
          this.buffers.push(buffer);
          bufferIndex = this.buffers.length - 1;
        }
        this.attributes[id] = new Attribute(bufferIndex, size, normalized, type, stride, start, instance);
        this.instanced = this.instanced || instance;
        return this;
      };
      Geometry2.prototype.getAttribute = function(id) {
        return this.attributes[id];
      };
      Geometry2.prototype.getBuffer = function(id) {
        return this.buffers[this.getAttribute(id).buffer];
      };
      Geometry2.prototype.addIndex = function(buffer) {
        if (!(buffer instanceof Buffer2)) {
          if (buffer instanceof Array) {
            buffer = new Uint16Array(buffer);
          }
          buffer = new Buffer2(buffer);
        }
        buffer.type = constants.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
        this.indexBuffer = buffer;
        if (this.buffers.indexOf(buffer) === -1) {
          this.buffers.push(buffer);
        }
        return this;
      };
      Geometry2.prototype.getIndex = function() {
        return this.indexBuffer;
      };
      Geometry2.prototype.interleave = function() {
        if (this.buffers.length === 1 || this.buffers.length === 2 && this.indexBuffer) {
          return this;
        }
        var arrays = [];
        var sizes = [];
        var interleavedBuffer = new Buffer2();
        var i;
        for (i in this.attributes) {
          var attribute = this.attributes[i];
          var buffer = this.buffers[attribute.buffer];
          arrays.push(buffer.data);
          sizes.push(attribute.size * byteSizeMap[attribute.type] / 4);
          attribute.buffer = 0;
        }
        interleavedBuffer.data = interleaveTypedArrays(arrays, sizes);
        for (i = 0; i < this.buffers.length; i++) {
          if (this.buffers[i] !== this.indexBuffer) {
            this.buffers[i].destroy();
          }
        }
        this.buffers = [interleavedBuffer];
        if (this.indexBuffer) {
          this.buffers.push(this.indexBuffer);
        }
        return this;
      };
      Geometry2.prototype.getSize = function() {
        for (var i in this.attributes) {
          var attribute = this.attributes[i];
          var buffer = this.buffers[attribute.buffer];
          return buffer.data.length / (attribute.stride / 4 || attribute.size);
        }
        return 0;
      };
      Geometry2.prototype.dispose = function() {
        this.disposeRunner.emit(this, false);
      };
      Geometry2.prototype.destroy = function() {
        this.dispose();
        this.buffers = null;
        this.indexBuffer = null;
        this.attributes = null;
      };
      Geometry2.prototype.clone = function() {
        var geometry = new Geometry2();
        for (var i = 0; i < this.buffers.length; i++) {
          geometry.buffers[i] = new Buffer2(this.buffers[i].data.slice(0));
        }
        for (var i in this.attributes) {
          var attrib = this.attributes[i];
          geometry.attributes[i] = new Attribute(attrib.buffer, attrib.size, attrib.normalized, attrib.type, attrib.stride, attrib.start, attrib.instance);
        }
        if (this.indexBuffer) {
          geometry.indexBuffer = geometry.buffers[this.buffers.indexOf(this.indexBuffer)];
          geometry.indexBuffer.type = constants.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
        }
        return geometry;
      };
      Geometry2.merge = function(geometries) {
        var geometryOut = new Geometry2();
        var arrays = [];
        var sizes = [];
        var offsets = [];
        var geometry;
        for (var i = 0; i < geometries.length; i++) {
          geometry = geometries[i];
          for (var j = 0; j < geometry.buffers.length; j++) {
            sizes[j] = sizes[j] || 0;
            sizes[j] += geometry.buffers[j].data.length;
            offsets[j] = 0;
          }
        }
        for (var i = 0; i < geometry.buffers.length; i++) {
          arrays[i] = new map$1[utils.getBufferType(geometry.buffers[i].data)](sizes[i]);
          geometryOut.buffers[i] = new Buffer2(arrays[i]);
        }
        for (var i = 0; i < geometries.length; i++) {
          geometry = geometries[i];
          for (var j = 0; j < geometry.buffers.length; j++) {
            arrays[j].set(geometry.buffers[j].data, offsets[j]);
            offsets[j] += geometry.buffers[j].data.length;
          }
        }
        geometryOut.attributes = geometry.attributes;
        if (geometry.indexBuffer) {
          geometryOut.indexBuffer = geometryOut.buffers[geometry.buffers.indexOf(geometry.indexBuffer)];
          geometryOut.indexBuffer.type = constants.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
          var offset = 0;
          var stride = 0;
          var offset2 = 0;
          var bufferIndexToCount = 0;
          for (var i = 0; i < geometry.buffers.length; i++) {
            if (geometry.buffers[i] !== geometry.indexBuffer) {
              bufferIndexToCount = i;
              break;
            }
          }
          for (var i in geometry.attributes) {
            var attribute = geometry.attributes[i];
            if ((attribute.buffer | 0) === bufferIndexToCount) {
              stride += attribute.size * byteSizeMap[attribute.type] / 4;
            }
          }
          for (var i = 0; i < geometries.length; i++) {
            var indexBufferData = geometries[i].indexBuffer.data;
            for (var j = 0; j < indexBufferData.length; j++) {
              geometryOut.indexBuffer.data[j + offset2] += offset;
            }
            offset += geometries[i].buffers[bufferIndexToCount].data.length / stride;
            offset2 += indexBufferData.length;
          }
        }
        return geometryOut;
      };
      return Geometry2;
    }();
    var Quad = function(_super) {
      __extends(Quad2, _super);
      function Quad2() {
        var _this = _super.call(this) || this;
        _this.addAttribute("aVertexPosition", new Float32Array([
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1
        ])).addIndex([0, 1, 3, 2]);
        return _this;
      }
      return Quad2;
    }(Geometry);
    var QuadUv = function(_super) {
      __extends(QuadUv2, _super);
      function QuadUv2() {
        var _this = _super.call(this) || this;
        _this.vertices = new Float32Array([
          -1,
          -1,
          1,
          -1,
          1,
          1,
          -1,
          1
        ]);
        _this.uvs = new Float32Array([
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1
        ]);
        _this.vertexBuffer = new Buffer2(_this.vertices);
        _this.uvBuffer = new Buffer2(_this.uvs);
        _this.addAttribute("aVertexPosition", _this.vertexBuffer).addAttribute("aTextureCoord", _this.uvBuffer).addIndex([0, 1, 2, 0, 2, 3]);
        return _this;
      }
      QuadUv2.prototype.map = function(targetTextureFrame, destinationFrame) {
        var x = 0;
        var y = 0;
        this.uvs[0] = x;
        this.uvs[1] = y;
        this.uvs[2] = x + destinationFrame.width / targetTextureFrame.width;
        this.uvs[3] = y;
        this.uvs[4] = x + destinationFrame.width / targetTextureFrame.width;
        this.uvs[5] = y + destinationFrame.height / targetTextureFrame.height;
        this.uvs[6] = x;
        this.uvs[7] = y + destinationFrame.height / targetTextureFrame.height;
        x = destinationFrame.x;
        y = destinationFrame.y;
        this.vertices[0] = x;
        this.vertices[1] = y;
        this.vertices[2] = x + destinationFrame.width;
        this.vertices[3] = y;
        this.vertices[4] = x + destinationFrame.width;
        this.vertices[5] = y + destinationFrame.height;
        this.vertices[6] = x;
        this.vertices[7] = y + destinationFrame.height;
        this.invalidate();
        return this;
      };
      QuadUv2.prototype.invalidate = function() {
        this.vertexBuffer._updateID++;
        this.uvBuffer._updateID++;
        return this;
      };
      return QuadUv2;
    }(Geometry);
    var UID$2 = 0;
    var UniformGroup = function() {
      function UniformGroup2(uniforms, isStatic, isUbo) {
        this.group = true;
        this.syncUniforms = {};
        this.dirtyId = 0;
        this.id = UID$2++;
        this.static = !!isStatic;
        this.ubo = !!isUbo;
        if (uniforms instanceof Buffer2) {
          this.buffer = uniforms;
          this.buffer.type = constants.BUFFER_TYPE.UNIFORM_BUFFER;
          this.autoManage = false;
          this.ubo = true;
        } else {
          this.uniforms = uniforms;
          if (this.ubo) {
            this.buffer = new Buffer2(new Float32Array(1));
            this.buffer.type = constants.BUFFER_TYPE.UNIFORM_BUFFER;
            this.autoManage = true;
          }
        }
      }
      UniformGroup2.prototype.update = function() {
        this.dirtyId++;
        if (!this.autoManage && this.buffer) {
          this.buffer.update();
        }
      };
      UniformGroup2.prototype.add = function(name2, uniforms, _static) {
        if (!this.ubo) {
          this.uniforms[name2] = new UniformGroup2(uniforms, _static);
        } else {
          throw new Error("[UniformGroup] uniform groups in ubo mode cannot be modified, or have uniform groups nested in them");
        }
      };
      UniformGroup2.from = function(uniforms, _static, _ubo) {
        return new UniformGroup2(uniforms, _static, _ubo);
      };
      UniformGroup2.uboFrom = function(uniforms, _static) {
        return new UniformGroup2(uniforms, _static !== null && _static !== void 0 ? _static : true, true);
      };
      return UniformGroup2;
    }();
    var FilterState = function() {
      function FilterState2() {
        this.renderTexture = null;
        this.target = null;
        this.legacy = false;
        this.resolution = 1;
        this.multisample = constants.MSAA_QUALITY.NONE;
        this.sourceFrame = new math.Rectangle();
        this.destinationFrame = new math.Rectangle();
        this.bindingSourceFrame = new math.Rectangle();
        this.bindingDestinationFrame = new math.Rectangle();
        this.filters = [];
        this.transform = null;
      }
      FilterState2.prototype.clear = function() {
        this.target = null;
        this.filters = null;
        this.renderTexture = null;
      };
      return FilterState2;
    }();
    var tempPoints = [new math.Point(), new math.Point(), new math.Point(), new math.Point()];
    var tempMatrix = new math.Matrix();
    var FilterSystem = function() {
      function FilterSystem2(renderer) {
        this.renderer = renderer;
        this.defaultFilterStack = [{}];
        this.texturePool = new RenderTexturePool();
        this.texturePool.setScreenSize(renderer.view);
        this.statePool = [];
        this.quad = new Quad();
        this.quadUv = new QuadUv();
        this.tempRect = new math.Rectangle();
        this.activeState = {};
        this.globalUniforms = new UniformGroup({
          outputFrame: new math.Rectangle(),
          inputSize: new Float32Array(4),
          inputPixel: new Float32Array(4),
          inputClamp: new Float32Array(4),
          resolution: 1,
          filterArea: new Float32Array(4),
          filterClamp: new Float32Array(4)
        }, true);
        this.forceClear = false;
        this.useMaxPadding = false;
      }
      FilterSystem2.prototype.push = function(target, filters) {
        var renderer = this.renderer;
        var filterStack = this.defaultFilterStack;
        var state = this.statePool.pop() || new FilterState();
        var renderTextureSystem = this.renderer.renderTexture;
        var resolution = filters[0].resolution;
        var multisample = filters[0].multisample;
        var padding = filters[0].padding;
        var autoFit = filters[0].autoFit;
        var legacy = filters[0].legacy;
        for (var i = 1; i < filters.length; i++) {
          var filter = filters[i];
          resolution = Math.min(resolution, filter.resolution);
          multisample = Math.min(multisample, filter.multisample);
          padding = this.useMaxPadding ? Math.max(padding, filter.padding) : padding + filter.padding;
          autoFit = autoFit && filter.autoFit;
          legacy = legacy || filter.legacy;
        }
        if (filterStack.length === 1) {
          this.defaultFilterStack[0].renderTexture = renderTextureSystem.current;
        }
        filterStack.push(state);
        state.resolution = resolution;
        state.multisample = multisample;
        state.legacy = legacy;
        state.target = target;
        state.sourceFrame.copyFrom(target.filterArea || target.getBounds(true));
        state.sourceFrame.pad(padding);
        if (autoFit) {
          var sourceFrameProjected = this.tempRect.copyFrom(renderTextureSystem.sourceFrame);
          if (renderer.projection.transform) {
            this.transformAABB(tempMatrix.copyFrom(renderer.projection.transform).invert(), sourceFrameProjected);
          }
          state.sourceFrame.fit(sourceFrameProjected);
        }
        this.roundFrame(state.sourceFrame, renderTextureSystem.current ? renderTextureSystem.current.resolution : renderer.resolution, renderTextureSystem.sourceFrame, renderTextureSystem.destinationFrame, renderer.projection.transform);
        state.renderTexture = this.getOptimalFilterTexture(state.sourceFrame.width, state.sourceFrame.height, resolution, multisample);
        state.filters = filters;
        state.destinationFrame.width = state.renderTexture.width;
        state.destinationFrame.height = state.renderTexture.height;
        var destinationFrame = this.tempRect;
        destinationFrame.x = 0;
        destinationFrame.y = 0;
        destinationFrame.width = state.sourceFrame.width;
        destinationFrame.height = state.sourceFrame.height;
        state.renderTexture.filterFrame = state.sourceFrame;
        state.bindingSourceFrame.copyFrom(renderTextureSystem.sourceFrame);
        state.bindingDestinationFrame.copyFrom(renderTextureSystem.destinationFrame);
        state.transform = renderer.projection.transform;
        renderer.projection.transform = null;
        renderTextureSystem.bind(state.renderTexture, state.sourceFrame, destinationFrame);
        renderer.framebuffer.clear(0, 0, 0, 0);
      };
      FilterSystem2.prototype.pop = function() {
        var filterStack = this.defaultFilterStack;
        var state = filterStack.pop();
        var filters = state.filters;
        this.activeState = state;
        var globalUniforms = this.globalUniforms.uniforms;
        globalUniforms.outputFrame = state.sourceFrame;
        globalUniforms.resolution = state.resolution;
        var inputSize = globalUniforms.inputSize;
        var inputPixel = globalUniforms.inputPixel;
        var inputClamp = globalUniforms.inputClamp;
        inputSize[0] = state.destinationFrame.width;
        inputSize[1] = state.destinationFrame.height;
        inputSize[2] = 1 / inputSize[0];
        inputSize[3] = 1 / inputSize[1];
        inputPixel[0] = Math.round(inputSize[0] * state.resolution);
        inputPixel[1] = Math.round(inputSize[1] * state.resolution);
        inputPixel[2] = 1 / inputPixel[0];
        inputPixel[3] = 1 / inputPixel[1];
        inputClamp[0] = 0.5 * inputPixel[2];
        inputClamp[1] = 0.5 * inputPixel[3];
        inputClamp[2] = state.sourceFrame.width * inputSize[2] - 0.5 * inputPixel[2];
        inputClamp[3] = state.sourceFrame.height * inputSize[3] - 0.5 * inputPixel[3];
        if (state.legacy) {
          var filterArea = globalUniforms.filterArea;
          filterArea[0] = state.destinationFrame.width;
          filterArea[1] = state.destinationFrame.height;
          filterArea[2] = state.sourceFrame.x;
          filterArea[3] = state.sourceFrame.y;
          globalUniforms.filterClamp = globalUniforms.inputClamp;
        }
        this.globalUniforms.update();
        var lastState = filterStack[filterStack.length - 1];
        this.renderer.framebuffer.blit();
        if (filters.length === 1) {
          filters[0].apply(this, state.renderTexture, lastState.renderTexture, constants.CLEAR_MODES.BLEND, state);
          this.returnFilterTexture(state.renderTexture);
        } else {
          var flip = state.renderTexture;
          var flop = this.getOptimalFilterTexture(flip.width, flip.height, state.resolution);
          flop.filterFrame = flip.filterFrame;
          var i = 0;
          for (i = 0; i < filters.length - 1; ++i) {
            if (i === 1 && state.multisample > 1) {
              flop = this.getOptimalFilterTexture(flip.width, flip.height, state.resolution);
              flop.filterFrame = flip.filterFrame;
            }
            filters[i].apply(this, flip, flop, constants.CLEAR_MODES.CLEAR, state);
            var t = flip;
            flip = flop;
            flop = t;
          }
          filters[i].apply(this, flip, lastState.renderTexture, constants.CLEAR_MODES.BLEND, state);
          if (i > 1 && state.multisample > 1) {
            this.returnFilterTexture(state.renderTexture);
          }
          this.returnFilterTexture(flip);
          this.returnFilterTexture(flop);
        }
        state.clear();
        this.statePool.push(state);
      };
      FilterSystem2.prototype.bindAndClear = function(filterTexture, clearMode) {
        if (clearMode === void 0) {
          clearMode = constants.CLEAR_MODES.CLEAR;
        }
        var _a = this.renderer, renderTextureSystem = _a.renderTexture, stateSystem = _a.state;
        if (filterTexture === this.defaultFilterStack[this.defaultFilterStack.length - 1].renderTexture) {
          this.renderer.projection.transform = this.activeState.transform;
        } else {
          this.renderer.projection.transform = null;
        }
        if (filterTexture && filterTexture.filterFrame) {
          var destinationFrame = this.tempRect;
          destinationFrame.x = 0;
          destinationFrame.y = 0;
          destinationFrame.width = filterTexture.filterFrame.width;
          destinationFrame.height = filterTexture.filterFrame.height;
          renderTextureSystem.bind(filterTexture, filterTexture.filterFrame, destinationFrame);
        } else if (filterTexture !== this.defaultFilterStack[this.defaultFilterStack.length - 1].renderTexture) {
          renderTextureSystem.bind(filterTexture);
        } else {
          this.renderer.renderTexture.bind(filterTexture, this.activeState.bindingSourceFrame, this.activeState.bindingDestinationFrame);
        }
        var autoClear = stateSystem.stateId & 1 || this.forceClear;
        if (clearMode === constants.CLEAR_MODES.CLEAR || clearMode === constants.CLEAR_MODES.BLIT && autoClear) {
          this.renderer.framebuffer.clear(0, 0, 0, 0);
        }
      };
      FilterSystem2.prototype.applyFilter = function(filter, input, output, clearMode) {
        var renderer = this.renderer;
        renderer.state.set(filter.state);
        this.bindAndClear(output, clearMode);
        filter.uniforms.uSampler = input;
        filter.uniforms.filterGlobals = this.globalUniforms;
        renderer.shader.bind(filter);
        filter.legacy = !!filter.program.attributeData.aTextureCoord;
        if (filter.legacy) {
          this.quadUv.map(input._frame, input.filterFrame);
          renderer.geometry.bind(this.quadUv);
          renderer.geometry.draw(constants.DRAW_MODES.TRIANGLES);
        } else {
          renderer.geometry.bind(this.quad);
          renderer.geometry.draw(constants.DRAW_MODES.TRIANGLE_STRIP);
        }
      };
      FilterSystem2.prototype.calculateSpriteMatrix = function(outputMatrix, sprite) {
        var _a = this.activeState, sourceFrame = _a.sourceFrame, destinationFrame = _a.destinationFrame;
        var orig = sprite._texture.orig;
        var mappedMatrix = outputMatrix.set(destinationFrame.width, 0, 0, destinationFrame.height, sourceFrame.x, sourceFrame.y);
        var worldTransform = sprite.worldTransform.copyTo(math.Matrix.TEMP_MATRIX);
        worldTransform.invert();
        mappedMatrix.prepend(worldTransform);
        mappedMatrix.scale(1 / orig.width, 1 / orig.height);
        mappedMatrix.translate(sprite.anchor.x, sprite.anchor.y);
        return mappedMatrix;
      };
      FilterSystem2.prototype.destroy = function() {
        this.renderer = null;
        this.texturePool.clear(false);
      };
      FilterSystem2.prototype.getOptimalFilterTexture = function(minWidth, minHeight, resolution, multisample) {
        if (resolution === void 0) {
          resolution = 1;
        }
        if (multisample === void 0) {
          multisample = constants.MSAA_QUALITY.NONE;
        }
        return this.texturePool.getOptimalTexture(minWidth, minHeight, resolution, multisample);
      };
      FilterSystem2.prototype.getFilterTexture = function(input, resolution, multisample) {
        if (typeof input === "number") {
          var swap = input;
          input = resolution;
          resolution = swap;
        }
        input = input || this.activeState.renderTexture;
        var filterTexture = this.texturePool.getOptimalTexture(input.width, input.height, resolution || input.resolution, multisample || constants.MSAA_QUALITY.NONE);
        filterTexture.filterFrame = input.filterFrame;
        return filterTexture;
      };
      FilterSystem2.prototype.returnFilterTexture = function(renderTexture) {
        this.texturePool.returnTexture(renderTexture);
      };
      FilterSystem2.prototype.emptyPool = function() {
        this.texturePool.clear(true);
      };
      FilterSystem2.prototype.resize = function() {
        this.texturePool.setScreenSize(this.renderer.view);
      };
      FilterSystem2.prototype.transformAABB = function(matrix, rect) {
        var lt = tempPoints[0];
        var lb = tempPoints[1];
        var rt = tempPoints[2];
        var rb = tempPoints[3];
        lt.set(rect.left, rect.top);
        lb.set(rect.left, rect.bottom);
        rt.set(rect.right, rect.top);
        rb.set(rect.right, rect.bottom);
        matrix.apply(lt, lt);
        matrix.apply(lb, lb);
        matrix.apply(rt, rt);
        matrix.apply(rb, rb);
        var x0 = Math.min(lt.x, lb.x, rt.x, rb.x);
        var y0 = Math.min(lt.y, lb.y, rt.y, rb.y);
        var x1 = Math.max(lt.x, lb.x, rt.x, rb.x);
        var y1 = Math.max(lt.y, lb.y, rt.y, rb.y);
        rect.x = x0;
        rect.y = y0;
        rect.width = x1 - x0;
        rect.height = y1 - y0;
      };
      FilterSystem2.prototype.roundFrame = function(frame, resolution, bindingSourceFrame, bindingDestinationFrame, transform) {
        if (transform) {
          var a = transform.a, b = transform.b, c = transform.c, d = transform.d;
          if ((Math.abs(b) > 1e-4 || Math.abs(c) > 1e-4) && (Math.abs(a) > 1e-4 || Math.abs(d) > 1e-4)) {
            return;
          }
        }
        transform = transform ? tempMatrix.copyFrom(transform) : tempMatrix.identity();
        transform.translate(-bindingSourceFrame.x, -bindingSourceFrame.y).scale(bindingDestinationFrame.width / bindingSourceFrame.width, bindingDestinationFrame.height / bindingSourceFrame.height).translate(bindingDestinationFrame.x, bindingDestinationFrame.y);
        this.transformAABB(transform, frame);
        frame.ceil(resolution);
        this.transformAABB(transform.invert(), frame);
      };
      return FilterSystem2;
    }();
    var ObjectRenderer = function() {
      function ObjectRenderer2(renderer) {
        this.renderer = renderer;
      }
      ObjectRenderer2.prototype.flush = function() {
      };
      ObjectRenderer2.prototype.destroy = function() {
        this.renderer = null;
      };
      ObjectRenderer2.prototype.start = function() {
      };
      ObjectRenderer2.prototype.stop = function() {
        this.flush();
      };
      ObjectRenderer2.prototype.render = function(_object) {
      };
      return ObjectRenderer2;
    }();
    var BatchSystem = function() {
      function BatchSystem2(renderer) {
        this.renderer = renderer;
        this.emptyRenderer = new ObjectRenderer(renderer);
        this.currentRenderer = this.emptyRenderer;
      }
      BatchSystem2.prototype.setObjectRenderer = function(objectRenderer) {
        if (this.currentRenderer === objectRenderer) {
          return;
        }
        this.currentRenderer.stop();
        this.currentRenderer = objectRenderer;
        this.currentRenderer.start();
      };
      BatchSystem2.prototype.flush = function() {
        this.setObjectRenderer(this.emptyRenderer);
      };
      BatchSystem2.prototype.reset = function() {
        this.setObjectRenderer(this.emptyRenderer);
      };
      BatchSystem2.prototype.copyBoundTextures = function(arr, maxTextures) {
        var boundTextures = this.renderer.texture.boundTextures;
        for (var i = maxTextures - 1; i >= 0; --i) {
          arr[i] = boundTextures[i] || null;
          if (arr[i]) {
            arr[i]._batchLocation = i;
          }
        }
      };
      BatchSystem2.prototype.boundArray = function(texArray, boundTextures, batchId, maxTextures) {
        var elements = texArray.elements, ids = texArray.ids, count = texArray.count;
        var j = 0;
        for (var i = 0; i < count; i++) {
          var tex = elements[i];
          var loc = tex._batchLocation;
          if (loc >= 0 && loc < maxTextures && boundTextures[loc] === tex) {
            ids[i] = loc;
            continue;
          }
          while (j < maxTextures) {
            var bound = boundTextures[j];
            if (bound && bound._batchEnabled === batchId && bound._batchLocation === j) {
              j++;
              continue;
            }
            ids[i] = j;
            tex._batchLocation = j;
            boundTextures[j] = tex;
            break;
          }
        }
      };
      BatchSystem2.prototype.destroy = function() {
        this.renderer = null;
      };
      return BatchSystem2;
    }();
    var CONTEXT_UID_COUNTER = 0;
    var ContextSystem = function() {
      function ContextSystem2(renderer) {
        this.renderer = renderer;
        this.webGLVersion = 1;
        this.extensions = {};
        this.supports = {
          uint32Indices: false
        };
        this.handleContextLost = this.handleContextLost.bind(this);
        this.handleContextRestored = this.handleContextRestored.bind(this);
        renderer.view.addEventListener("webglcontextlost", this.handleContextLost, false);
        renderer.view.addEventListener("webglcontextrestored", this.handleContextRestored, false);
      }
      Object.defineProperty(ContextSystem2.prototype, "isLost", {
        get: function() {
          return !this.gl || this.gl.isContextLost();
        },
        enumerable: false,
        configurable: true
      });
      ContextSystem2.prototype.contextChange = function(gl) {
        this.gl = gl;
        this.renderer.gl = gl;
        this.renderer.CONTEXT_UID = CONTEXT_UID_COUNTER++;
        if (gl.isContextLost() && gl.getExtension("WEBGL_lose_context")) {
          gl.getExtension("WEBGL_lose_context").restoreContext();
        }
      };
      ContextSystem2.prototype.initFromContext = function(gl) {
        this.gl = gl;
        this.validateContext(gl);
        this.renderer.gl = gl;
        this.renderer.CONTEXT_UID = CONTEXT_UID_COUNTER++;
        this.renderer.runners.contextChange.emit(gl);
      };
      ContextSystem2.prototype.initFromOptions = function(options2) {
        var gl = this.createContext(this.renderer.view, options2);
        this.initFromContext(gl);
      };
      ContextSystem2.prototype.createContext = function(canvas, options2) {
        var gl;
        if (settings.settings.PREFER_ENV >= constants.ENV.WEBGL2) {
          gl = canvas.getContext("webgl2", options2);
        }
        if (gl) {
          this.webGLVersion = 2;
        } else {
          this.webGLVersion = 1;
          gl = canvas.getContext("webgl", options2) || canvas.getContext("experimental-webgl", options2);
          if (!gl) {
            throw new Error("This browser does not support WebGL. Try using the canvas renderer");
          }
        }
        this.gl = gl;
        this.getExtensions();
        return this.gl;
      };
      ContextSystem2.prototype.getExtensions = function() {
        var gl = this.gl;
        var common = {
          anisotropicFiltering: gl.getExtension("EXT_texture_filter_anisotropic"),
          floatTextureLinear: gl.getExtension("OES_texture_float_linear"),
          s3tc: gl.getExtension("WEBGL_compressed_texture_s3tc"),
          s3tc_sRGB: gl.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
          etc: gl.getExtension("WEBGL_compressed_texture_etc"),
          etc1: gl.getExtension("WEBGL_compressed_texture_etc1"),
          pvrtc: gl.getExtension("WEBGL_compressed_texture_pvrtc") || gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
          atc: gl.getExtension("WEBGL_compressed_texture_atc"),
          astc: gl.getExtension("WEBGL_compressed_texture_astc")
        };
        if (this.webGLVersion === 1) {
          Object.assign(this.extensions, common, {
            drawBuffers: gl.getExtension("WEBGL_draw_buffers"),
            depthTexture: gl.getExtension("WEBGL_depth_texture"),
            loseContext: gl.getExtension("WEBGL_lose_context"),
            vertexArrayObject: gl.getExtension("OES_vertex_array_object") || gl.getExtension("MOZ_OES_vertex_array_object") || gl.getExtension("WEBKIT_OES_vertex_array_object"),
            uint32ElementIndex: gl.getExtension("OES_element_index_uint"),
            floatTexture: gl.getExtension("OES_texture_float"),
            floatTextureLinear: gl.getExtension("OES_texture_float_linear"),
            textureHalfFloat: gl.getExtension("OES_texture_half_float"),
            textureHalfFloatLinear: gl.getExtension("OES_texture_half_float_linear")
          });
        } else if (this.webGLVersion === 2) {
          Object.assign(this.extensions, common, {
            colorBufferFloat: gl.getExtension("EXT_color_buffer_float")
          });
        }
      };
      ContextSystem2.prototype.handleContextLost = function(event) {
        event.preventDefault();
      };
      ContextSystem2.prototype.handleContextRestored = function() {
        this.renderer.runners.contextChange.emit(this.gl);
      };
      ContextSystem2.prototype.destroy = function() {
        var view = this.renderer.view;
        this.renderer = null;
        view.removeEventListener("webglcontextlost", this.handleContextLost);
        view.removeEventListener("webglcontextrestored", this.handleContextRestored);
        this.gl.useProgram(null);
        if (this.extensions.loseContext) {
          this.extensions.loseContext.loseContext();
        }
      };
      ContextSystem2.prototype.postrender = function() {
        if (this.renderer.renderingToScreen) {
          this.gl.flush();
        }
      };
      ContextSystem2.prototype.validateContext = function(gl) {
        var attributes = gl.getContextAttributes();
        var isWebGl2 = "WebGL2RenderingContext" in self && gl instanceof self.WebGL2RenderingContext;
        if (isWebGl2) {
          this.webGLVersion = 2;
        }
        if (!attributes.stencil) {
          console.warn("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
        }
        var hasuint32 = isWebGl2 || !!gl.getExtension("OES_element_index_uint");
        this.supports.uint32Indices = hasuint32;
        if (!hasuint32) {
          console.warn("Provided WebGL context does not support 32 index buffer, complex graphics may not render correctly");
        }
      };
      return ContextSystem2;
    }();
    var GLFramebuffer = function() {
      function GLFramebuffer2(framebuffer) {
        this.framebuffer = framebuffer;
        this.stencil = null;
        this.dirtyId = -1;
        this.dirtyFormat = -1;
        this.dirtySize = -1;
        this.multisample = constants.MSAA_QUALITY.NONE;
        this.msaaBuffer = null;
        this.blitFramebuffer = null;
        this.mipLevel = 0;
      }
      return GLFramebuffer2;
    }();
    var tempRectangle = new math.Rectangle();
    var FramebufferSystem = function() {
      function FramebufferSystem2(renderer) {
        this.renderer = renderer;
        this.managedFramebuffers = [];
        this.unknownFramebuffer = new Framebuffer(10, 10);
        this.msaaSamples = null;
      }
      FramebufferSystem2.prototype.contextChange = function() {
        var gl = this.gl = this.renderer.gl;
        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
        this.current = this.unknownFramebuffer;
        this.viewport = new math.Rectangle();
        this.hasMRT = true;
        this.writeDepthTexture = true;
        this.disposeAll(true);
        if (this.renderer.context.webGLVersion === 1) {
          var nativeDrawBuffersExtension_1 = this.renderer.context.extensions.drawBuffers;
          var nativeDepthTextureExtension = this.renderer.context.extensions.depthTexture;
          if (settings.settings.PREFER_ENV === constants.ENV.WEBGL_LEGACY) {
            nativeDrawBuffersExtension_1 = null;
            nativeDepthTextureExtension = null;
          }
          if (nativeDrawBuffersExtension_1) {
            gl.drawBuffers = function(activeTextures) {
              return nativeDrawBuffersExtension_1.drawBuffersWEBGL(activeTextures);
            };
          } else {
            this.hasMRT = false;
            gl.drawBuffers = function() {
            };
          }
          if (!nativeDepthTextureExtension) {
            this.writeDepthTexture = false;
          }
        } else {
          this.msaaSamples = gl.getInternalformatParameter(gl.RENDERBUFFER, gl.RGBA8, gl.SAMPLES);
        }
      };
      FramebufferSystem2.prototype.bind = function(framebuffer, frame, mipLevel) {
        if (mipLevel === void 0) {
          mipLevel = 0;
        }
        var gl = this.gl;
        if (framebuffer) {
          var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID] || this.initFramebuffer(framebuffer);
          if (this.current !== framebuffer) {
            this.current = framebuffer;
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
          }
          if (fbo.mipLevel !== mipLevel) {
            framebuffer.dirtyId++;
            framebuffer.dirtyFormat++;
            fbo.mipLevel = mipLevel;
          }
          if (fbo.dirtyId !== framebuffer.dirtyId) {
            fbo.dirtyId = framebuffer.dirtyId;
            if (fbo.dirtyFormat !== framebuffer.dirtyFormat) {
              fbo.dirtyFormat = framebuffer.dirtyFormat;
              fbo.dirtySize = framebuffer.dirtySize;
              this.updateFramebuffer(framebuffer, mipLevel);
            } else if (fbo.dirtySize !== framebuffer.dirtySize) {
              fbo.dirtySize = framebuffer.dirtySize;
              this.resizeFramebuffer(framebuffer);
            }
          }
          for (var i = 0; i < framebuffer.colorTextures.length; i++) {
            var tex = framebuffer.colorTextures[i];
            this.renderer.texture.unbind(tex.parentTextureArray || tex);
          }
          if (framebuffer.depthTexture) {
            this.renderer.texture.unbind(framebuffer.depthTexture);
          }
          if (frame) {
            var mipWidth = frame.width >> mipLevel;
            var mipHeight = frame.height >> mipLevel;
            var scale = mipWidth / frame.width;
            this.setViewport(frame.x * scale, frame.y * scale, mipWidth, mipHeight);
          } else {
            var mipWidth = framebuffer.width >> mipLevel;
            var mipHeight = framebuffer.height >> mipLevel;
            this.setViewport(0, 0, mipWidth, mipHeight);
          }
        } else {
          if (this.current) {
            this.current = null;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          }
          if (frame) {
            this.setViewport(frame.x, frame.y, frame.width, frame.height);
          } else {
            this.setViewport(0, 0, this.renderer.width, this.renderer.height);
          }
        }
      };
      FramebufferSystem2.prototype.setViewport = function(x, y, width, height) {
        var v = this.viewport;
        x = Math.round(x);
        y = Math.round(y);
        width = Math.round(width);
        height = Math.round(height);
        if (v.width !== width || v.height !== height || v.x !== x || v.y !== y) {
          v.x = x;
          v.y = y;
          v.width = width;
          v.height = height;
          this.gl.viewport(x, y, width, height);
        }
      };
      Object.defineProperty(FramebufferSystem2.prototype, "size", {
        get: function() {
          if (this.current) {
            return { x: 0, y: 0, width: this.current.width, height: this.current.height };
          }
          return { x: 0, y: 0, width: this.renderer.width, height: this.renderer.height };
        },
        enumerable: false,
        configurable: true
      });
      FramebufferSystem2.prototype.clear = function(r, g, b, a, mask) {
        if (mask === void 0) {
          mask = constants.BUFFER_BITS.COLOR | constants.BUFFER_BITS.DEPTH;
        }
        var gl = this.gl;
        gl.clearColor(r, g, b, a);
        gl.clear(mask);
      };
      FramebufferSystem2.prototype.initFramebuffer = function(framebuffer) {
        var gl = this.gl;
        var fbo = new GLFramebuffer(gl.createFramebuffer());
        fbo.multisample = this.detectSamples(framebuffer.multisample);
        framebuffer.glFramebuffers[this.CONTEXT_UID] = fbo;
        this.managedFramebuffers.push(framebuffer);
        framebuffer.disposeRunner.add(this);
        return fbo;
      };
      FramebufferSystem2.prototype.resizeFramebuffer = function(framebuffer) {
        var gl = this.gl;
        var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
        if (fbo.msaaBuffer) {
          gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.msaaBuffer);
          gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.RGBA8, framebuffer.width, framebuffer.height);
        }
        if (fbo.stencil) {
          gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil);
          if (fbo.msaaBuffer) {
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.DEPTH24_STENCIL8, framebuffer.width, framebuffer.height);
          } else {
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, framebuffer.width, framebuffer.height);
          }
        }
        var colorTextures = framebuffer.colorTextures;
        var count = colorTextures.length;
        if (!gl.drawBuffers) {
          count = Math.min(count, 1);
        }
        for (var i = 0; i < count; i++) {
          var texture = colorTextures[i];
          var parentTexture = texture.parentTextureArray || texture;
          this.renderer.texture.bind(parentTexture, 0);
        }
        if (framebuffer.depthTexture && this.writeDepthTexture) {
          this.renderer.texture.bind(framebuffer.depthTexture, 0);
        }
      };
      FramebufferSystem2.prototype.updateFramebuffer = function(framebuffer, mipLevel) {
        var gl = this.gl;
        var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
        var colorTextures = framebuffer.colorTextures;
        var count = colorTextures.length;
        if (!gl.drawBuffers) {
          count = Math.min(count, 1);
        }
        if (fbo.multisample > 1 && this.canMultisampleFramebuffer(framebuffer)) {
          fbo.msaaBuffer = fbo.msaaBuffer || gl.createRenderbuffer();
          gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.msaaBuffer);
          gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.RGBA8, framebuffer.width, framebuffer.height);
          gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, fbo.msaaBuffer);
        } else if (fbo.msaaBuffer) {
          gl.deleteRenderbuffer(fbo.msaaBuffer);
          fbo.msaaBuffer = null;
          if (fbo.blitFramebuffer) {
            fbo.blitFramebuffer.dispose();
            fbo.blitFramebuffer = null;
          }
        }
        var activeTextures = [];
        for (var i = 0; i < count; i++) {
          var texture = colorTextures[i];
          var parentTexture = texture.parentTextureArray || texture;
          this.renderer.texture.bind(parentTexture, 0);
          if (i === 0 && fbo.msaaBuffer) {
            continue;
          }
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, texture.target, parentTexture._glTextures[this.CONTEXT_UID].texture, mipLevel);
          activeTextures.push(gl.COLOR_ATTACHMENT0 + i);
        }
        if (activeTextures.length > 1) {
          gl.drawBuffers(activeTextures);
        }
        if (framebuffer.depthTexture) {
          var writeDepthTexture = this.writeDepthTexture;
          if (writeDepthTexture) {
            var depthTexture = framebuffer.depthTexture;
            this.renderer.texture.bind(depthTexture, 0);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture._glTextures[this.CONTEXT_UID].texture, mipLevel);
          }
        }
        if ((framebuffer.stencil || framebuffer.depth) && !(framebuffer.depthTexture && this.writeDepthTexture)) {
          fbo.stencil = fbo.stencil || gl.createRenderbuffer();
          gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil);
          if (fbo.msaaBuffer) {
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.DEPTH24_STENCIL8, framebuffer.width, framebuffer.height);
          } else {
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, framebuffer.width, framebuffer.height);
          }
          gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, fbo.stencil);
        } else if (fbo.stencil) {
          gl.deleteRenderbuffer(fbo.stencil);
          fbo.stencil = null;
        }
      };
      FramebufferSystem2.prototype.canMultisampleFramebuffer = function(framebuffer) {
        return this.renderer.context.webGLVersion !== 1 && framebuffer.colorTextures.length <= 1 && !framebuffer.depthTexture;
      };
      FramebufferSystem2.prototype.detectSamples = function(samples) {
        var msaaSamples = this.msaaSamples;
        var res = constants.MSAA_QUALITY.NONE;
        if (samples <= 1 || msaaSamples === null) {
          return res;
        }
        for (var i = 0; i < msaaSamples.length; i++) {
          if (msaaSamples[i] <= samples) {
            res = msaaSamples[i];
            break;
          }
        }
        if (res === 1) {
          res = constants.MSAA_QUALITY.NONE;
        }
        return res;
      };
      FramebufferSystem2.prototype.blit = function(framebuffer, sourcePixels, destPixels) {
        var _a = this, current = _a.current, renderer = _a.renderer, gl = _a.gl, CONTEXT_UID = _a.CONTEXT_UID;
        if (renderer.context.webGLVersion !== 2) {
          return;
        }
        if (!current) {
          return;
        }
        var fbo = current.glFramebuffers[CONTEXT_UID];
        if (!fbo) {
          return;
        }
        if (!framebuffer) {
          if (!fbo.msaaBuffer) {
            return;
          }
          var colorTexture = current.colorTextures[0];
          if (!colorTexture) {
            return;
          }
          if (!fbo.blitFramebuffer) {
            fbo.blitFramebuffer = new Framebuffer(current.width, current.height);
            fbo.blitFramebuffer.addColorTexture(0, colorTexture);
          }
          framebuffer = fbo.blitFramebuffer;
          if (framebuffer.colorTextures[0] !== colorTexture) {
            framebuffer.colorTextures[0] = colorTexture;
            framebuffer.dirtyId++;
            framebuffer.dirtyFormat++;
          }
          if (framebuffer.width !== current.width || framebuffer.height !== current.height) {
            framebuffer.width = current.width;
            framebuffer.height = current.height;
            framebuffer.dirtyId++;
            framebuffer.dirtySize++;
          }
        }
        if (!sourcePixels) {
          sourcePixels = tempRectangle;
          sourcePixels.width = current.width;
          sourcePixels.height = current.height;
        }
        if (!destPixels) {
          destPixels = sourcePixels;
        }
        var sameSize = sourcePixels.width === destPixels.width && sourcePixels.height === destPixels.height;
        this.bind(framebuffer);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo.framebuffer);
        gl.blitFramebuffer(sourcePixels.x, sourcePixels.y, sourcePixels.width, sourcePixels.height, destPixels.x, destPixels.y, destPixels.width, destPixels.height, gl.COLOR_BUFFER_BIT, sameSize ? gl.NEAREST : gl.LINEAR);
      };
      FramebufferSystem2.prototype.disposeFramebuffer = function(framebuffer, contextLost) {
        var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
        var gl = this.gl;
        if (!fbo) {
          return;
        }
        delete framebuffer.glFramebuffers[this.CONTEXT_UID];
        var index = this.managedFramebuffers.indexOf(framebuffer);
        if (index >= 0) {
          this.managedFramebuffers.splice(index, 1);
        }
        framebuffer.disposeRunner.remove(this);
        if (!contextLost) {
          gl.deleteFramebuffer(fbo.framebuffer);
          if (fbo.msaaBuffer) {
            gl.deleteRenderbuffer(fbo.msaaBuffer);
          }
          if (fbo.stencil) {
            gl.deleteRenderbuffer(fbo.stencil);
          }
        }
        if (fbo.blitFramebuffer) {
          fbo.blitFramebuffer.dispose();
        }
      };
      FramebufferSystem2.prototype.disposeAll = function(contextLost) {
        var list = this.managedFramebuffers;
        this.managedFramebuffers = [];
        for (var i = 0; i < list.length; i++) {
          this.disposeFramebuffer(list[i], contextLost);
        }
      };
      FramebufferSystem2.prototype.forceStencil = function() {
        var framebuffer = this.current;
        if (!framebuffer) {
          return;
        }
        var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
        if (!fbo || fbo.stencil) {
          return;
        }
        framebuffer.stencil = true;
        var w = framebuffer.width;
        var h = framebuffer.height;
        var gl = this.gl;
        var stencil = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, stencil);
        if (fbo.msaaBuffer) {
          gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.DEPTH24_STENCIL8, w, h);
        } else {
          gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h);
        }
        fbo.stencil = stencil;
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencil);
      };
      FramebufferSystem2.prototype.reset = function() {
        this.current = this.unknownFramebuffer;
        this.viewport = new math.Rectangle();
      };
      FramebufferSystem2.prototype.destroy = function() {
        this.renderer = null;
      };
      return FramebufferSystem2;
    }();
    var byteSizeMap$1 = { 5126: 4, 5123: 2, 5121: 1 };
    var GeometrySystem = function() {
      function GeometrySystem2(renderer) {
        this.renderer = renderer;
        this._activeGeometry = null;
        this._activeVao = null;
        this.hasVao = true;
        this.hasInstance = true;
        this.canUseUInt32ElementIndex = false;
        this.managedGeometries = {};
      }
      GeometrySystem2.prototype.contextChange = function() {
        this.disposeAll(true);
        var gl = this.gl = this.renderer.gl;
        var context2 = this.renderer.context;
        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
        if (context2.webGLVersion !== 2) {
          var nativeVaoExtension_1 = this.renderer.context.extensions.vertexArrayObject;
          if (settings.settings.PREFER_ENV === constants.ENV.WEBGL_LEGACY) {
            nativeVaoExtension_1 = null;
          }
          if (nativeVaoExtension_1) {
            gl.createVertexArray = function() {
              return nativeVaoExtension_1.createVertexArrayOES();
            };
            gl.bindVertexArray = function(vao) {
              return nativeVaoExtension_1.bindVertexArrayOES(vao);
            };
            gl.deleteVertexArray = function(vao) {
              return nativeVaoExtension_1.deleteVertexArrayOES(vao);
            };
          } else {
            this.hasVao = false;
            gl.createVertexArray = function() {
              return null;
            };
            gl.bindVertexArray = function() {
              return null;
            };
            gl.deleteVertexArray = function() {
              return null;
            };
          }
        }
        if (context2.webGLVersion !== 2) {
          var instanceExt_1 = gl.getExtension("ANGLE_instanced_arrays");
          if (instanceExt_1) {
            gl.vertexAttribDivisor = function(a, b) {
              return instanceExt_1.vertexAttribDivisorANGLE(a, b);
            };
            gl.drawElementsInstanced = function(a, b, c, d, e) {
              return instanceExt_1.drawElementsInstancedANGLE(a, b, c, d, e);
            };
            gl.drawArraysInstanced = function(a, b, c, d) {
              return instanceExt_1.drawArraysInstancedANGLE(a, b, c, d);
            };
          } else {
            this.hasInstance = false;
          }
        }
        this.canUseUInt32ElementIndex = context2.webGLVersion === 2 || !!context2.extensions.uint32ElementIndex;
      };
      GeometrySystem2.prototype.bind = function(geometry, shader) {
        shader = shader || this.renderer.shader.shader;
        var gl = this.gl;
        var vaos = geometry.glVertexArrayObjects[this.CONTEXT_UID];
        var incRefCount = false;
        if (!vaos) {
          this.managedGeometries[geometry.id] = geometry;
          geometry.disposeRunner.add(this);
          geometry.glVertexArrayObjects[this.CONTEXT_UID] = vaos = {};
          incRefCount = true;
        }
        var vao = vaos[shader.program.id] || this.initGeometryVao(geometry, shader, incRefCount);
        this._activeGeometry = geometry;
        if (this._activeVao !== vao) {
          this._activeVao = vao;
          if (this.hasVao) {
            gl.bindVertexArray(vao);
          } else {
            this.activateVao(geometry, shader.program);
          }
        }
        this.updateBuffers();
      };
      GeometrySystem2.prototype.reset = function() {
        this.unbind();
      };
      GeometrySystem2.prototype.updateBuffers = function() {
        var geometry = this._activeGeometry;
        var bufferSystem = this.renderer.buffer;
        for (var i = 0; i < geometry.buffers.length; i++) {
          var buffer = geometry.buffers[i];
          bufferSystem.update(buffer);
        }
      };
      GeometrySystem2.prototype.checkCompatibility = function(geometry, program) {
        var geometryAttributes = geometry.attributes;
        var shaderAttributes = program.attributeData;
        for (var j in shaderAttributes) {
          if (!geometryAttributes[j]) {
            throw new Error('shader and geometry incompatible, geometry missing the "' + j + '" attribute');
          }
        }
      };
      GeometrySystem2.prototype.getSignature = function(geometry, program) {
        var attribs = geometry.attributes;
        var shaderAttributes = program.attributeData;
        var strings = ["g", geometry.id];
        for (var i in attribs) {
          if (shaderAttributes[i]) {
            strings.push(i);
          }
        }
        return strings.join("-");
      };
      GeometrySystem2.prototype.initGeometryVao = function(geometry, shader, incRefCount) {
        if (incRefCount === void 0) {
          incRefCount = true;
        }
        var gl = this.gl;
        var CONTEXT_UID = this.CONTEXT_UID;
        var bufferSystem = this.renderer.buffer;
        var program = shader.program;
        if (!program.glPrograms[CONTEXT_UID]) {
          this.renderer.shader.generateProgram(shader);
        }
        this.checkCompatibility(geometry, program);
        var signature = this.getSignature(geometry, program);
        var vaoObjectHash = geometry.glVertexArrayObjects[this.CONTEXT_UID];
        var vao = vaoObjectHash[signature];
        if (vao) {
          vaoObjectHash[program.id] = vao;
          return vao;
        }
        var buffers = geometry.buffers;
        var attributes = geometry.attributes;
        var tempStride = {};
        var tempStart = {};
        for (var j in buffers) {
          tempStride[j] = 0;
          tempStart[j] = 0;
        }
        for (var j in attributes) {
          if (!attributes[j].size && program.attributeData[j]) {
            attributes[j].size = program.attributeData[j].size;
          } else if (!attributes[j].size) {
            console.warn("PIXI Geometry attribute '" + j + "' size cannot be determined (likely the bound shader does not have the attribute)");
          }
          tempStride[attributes[j].buffer] += attributes[j].size * byteSizeMap$1[attributes[j].type];
        }
        for (var j in attributes) {
          var attribute = attributes[j];
          var attribSize = attribute.size;
          if (attribute.stride === void 0) {
            if (tempStride[attribute.buffer] === attribSize * byteSizeMap$1[attribute.type]) {
              attribute.stride = 0;
            } else {
              attribute.stride = tempStride[attribute.buffer];
            }
          }
          if (attribute.start === void 0) {
            attribute.start = tempStart[attribute.buffer];
            tempStart[attribute.buffer] += attribSize * byteSizeMap$1[attribute.type];
          }
        }
        vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        for (var i = 0; i < buffers.length; i++) {
          var buffer = buffers[i];
          bufferSystem.bind(buffer);
          if (incRefCount) {
            buffer._glBuffers[CONTEXT_UID].refCount++;
          }
        }
        this.activateVao(geometry, program);
        this._activeVao = vao;
        vaoObjectHash[program.id] = vao;
        vaoObjectHash[signature] = vao;
        return vao;
      };
      GeometrySystem2.prototype.disposeGeometry = function(geometry, contextLost) {
        var _a;
        if (!this.managedGeometries[geometry.id]) {
          return;
        }
        delete this.managedGeometries[geometry.id];
        var vaos = geometry.glVertexArrayObjects[this.CONTEXT_UID];
        var gl = this.gl;
        var buffers = geometry.buffers;
        var bufferSystem = (_a = this.renderer) === null || _a === void 0 ? void 0 : _a.buffer;
        geometry.disposeRunner.remove(this);
        if (!vaos) {
          return;
        }
        if (bufferSystem) {
          for (var i = 0; i < buffers.length; i++) {
            var buf = buffers[i]._glBuffers[this.CONTEXT_UID];
            if (buf) {
              buf.refCount--;
              if (buf.refCount === 0 && !contextLost) {
                bufferSystem.dispose(buffers[i], contextLost);
              }
            }
          }
        }
        if (!contextLost) {
          for (var vaoId in vaos) {
            if (vaoId[0] === "g") {
              var vao = vaos[vaoId];
              if (this._activeVao === vao) {
                this.unbind();
              }
              gl.deleteVertexArray(vao);
            }
          }
        }
        delete geometry.glVertexArrayObjects[this.CONTEXT_UID];
      };
      GeometrySystem2.prototype.disposeAll = function(contextLost) {
        var all = Object.keys(this.managedGeometries);
        for (var i = 0; i < all.length; i++) {
          this.disposeGeometry(this.managedGeometries[all[i]], contextLost);
        }
      };
      GeometrySystem2.prototype.activateVao = function(geometry, program) {
        var gl = this.gl;
        var CONTEXT_UID = this.CONTEXT_UID;
        var bufferSystem = this.renderer.buffer;
        var buffers = geometry.buffers;
        var attributes = geometry.attributes;
        if (geometry.indexBuffer) {
          bufferSystem.bind(geometry.indexBuffer);
        }
        var lastBuffer = null;
        for (var j in attributes) {
          var attribute = attributes[j];
          var buffer = buffers[attribute.buffer];
          var glBuffer = buffer._glBuffers[CONTEXT_UID];
          if (program.attributeData[j]) {
            if (lastBuffer !== glBuffer) {
              bufferSystem.bind(buffer);
              lastBuffer = glBuffer;
            }
            var location = program.attributeData[j].location;
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, attribute.size, attribute.type || gl.FLOAT, attribute.normalized, attribute.stride, attribute.start);
            if (attribute.instance) {
              if (this.hasInstance) {
                gl.vertexAttribDivisor(location, 1);
              } else {
                throw new Error("geometry error, GPU Instancing is not supported on this device");
              }
            }
          }
        }
      };
      GeometrySystem2.prototype.draw = function(type, size, start, instanceCount) {
        var gl = this.gl;
        var geometry = this._activeGeometry;
        if (geometry.indexBuffer) {
          var byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT;
          var glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
          if (byteSize === 2 || byteSize === 4 && this.canUseUInt32ElementIndex) {
            if (geometry.instanced) {
              gl.drawElementsInstanced(type, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize, instanceCount || 1);
            } else {
              gl.drawElements(type, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize);
            }
          } else {
            console.warn("unsupported index buffer type: uint32");
          }
        } else if (geometry.instanced) {
          gl.drawArraysInstanced(type, start, size || geometry.getSize(), instanceCount || 1);
        } else {
          gl.drawArrays(type, start, size || geometry.getSize());
        }
        return this;
      };
      GeometrySystem2.prototype.unbind = function() {
        this.gl.bindVertexArray(null);
        this._activeVao = null;
        this._activeGeometry = null;
      };
      GeometrySystem2.prototype.destroy = function() {
        this.renderer = null;
      };
      return GeometrySystem2;
    }();
    var MaskData = function() {
      function MaskData2(maskObject) {
        if (maskObject === void 0) {
          maskObject = null;
        }
        this.type = constants.MASK_TYPES.NONE;
        this.autoDetect = true;
        this.maskObject = maskObject || null;
        this.pooled = false;
        this.isMaskData = true;
        this.resolution = null;
        this.multisample = settings.settings.FILTER_MULTISAMPLE;
        this.enabled = true;
        this._filters = null;
        this._stencilCounter = 0;
        this._scissorCounter = 0;
        this._scissorRect = null;
        this._scissorRectLocal = null;
        this._target = null;
      }
      Object.defineProperty(MaskData2.prototype, "filter", {
        get: function() {
          return this._filters ? this._filters[0] : null;
        },
        set: function(value) {
          if (value) {
            if (this._filters) {
              this._filters[0] = value;
            } else {
              this._filters = [value];
            }
          } else {
            this._filters = null;
          }
        },
        enumerable: false,
        configurable: true
      });
      MaskData2.prototype.reset = function() {
        if (this.pooled) {
          this.maskObject = null;
          this.type = constants.MASK_TYPES.NONE;
          this.autoDetect = true;
        }
        this._target = null;
        this._scissorRectLocal = null;
      };
      MaskData2.prototype.copyCountersOrReset = function(maskAbove) {
        if (maskAbove) {
          this._stencilCounter = maskAbove._stencilCounter;
          this._scissorCounter = maskAbove._scissorCounter;
          this._scissorRect = maskAbove._scissorRect;
        } else {
          this._stencilCounter = 0;
          this._scissorCounter = 0;
          this._scissorRect = null;
        }
      };
      return MaskData2;
    }();
    function compileShader(gl, type, src2) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, src2);
      gl.compileShader(shader);
      return shader;
    }
    function logPrettyShaderError(gl, shader) {
      var shaderSrc = gl.getShaderSource(shader).split("\n").map(function(line, index) {
        return index + ": " + line;
      });
      var shaderLog = gl.getShaderInfoLog(shader);
      var splitShader = shaderLog.split("\n");
      var dedupe = {};
      var lineNumbers = splitShader.map(function(line) {
        return parseFloat(line.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"));
      }).filter(function(n) {
        if (n && !dedupe[n]) {
          dedupe[n] = true;
          return true;
        }
        return false;
      });
      var logArgs = [""];
      lineNumbers.forEach(function(number) {
        shaderSrc[number - 1] = "%c" + shaderSrc[number - 1] + "%c";
        logArgs.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px");
      });
      var fragmentSourceToLog = shaderSrc.join("\n");
      logArgs[0] = fragmentSourceToLog;
      console.error(shaderLog);
      console.groupCollapsed("click to view full shader code");
      console.warn.apply(console, logArgs);
      console.groupEnd();
    }
    function logProgramError(gl, program, vertexShader, fragmentShader) {
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
          logPrettyShaderError(gl, vertexShader);
        }
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
          logPrettyShaderError(gl, fragmentShader);
        }
        console.error("PixiJS Error: Could not initialize shader.");
        if (gl.getProgramInfoLog(program) !== "") {
          console.warn("PixiJS Warning: gl.getProgramInfoLog()", gl.getProgramInfoLog(program));
        }
      }
    }
    function booleanArray(size) {
      var array = new Array(size);
      for (var i = 0; i < array.length; i++) {
        array[i] = false;
      }
      return array;
    }
    function defaultValue(type, size) {
      switch (type) {
        case "float":
          return 0;
        case "vec2":
          return new Float32Array(2 * size);
        case "vec3":
          return new Float32Array(3 * size);
        case "vec4":
          return new Float32Array(4 * size);
        case "int":
        case "uint":
        case "sampler2D":
        case "sampler2DArray":
          return 0;
        case "ivec2":
          return new Int32Array(2 * size);
        case "ivec3":
          return new Int32Array(3 * size);
        case "ivec4":
          return new Int32Array(4 * size);
        case "uvec2":
          return new Uint32Array(2 * size);
        case "uvec3":
          return new Uint32Array(3 * size);
        case "uvec4":
          return new Uint32Array(4 * size);
        case "bool":
          return false;
        case "bvec2":
          return booleanArray(2 * size);
        case "bvec3":
          return booleanArray(3 * size);
        case "bvec4":
          return booleanArray(4 * size);
        case "mat2":
          return new Float32Array([
            1,
            0,
            0,
            1
          ]);
        case "mat3":
          return new Float32Array([
            1,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            1
          ]);
        case "mat4":
          return new Float32Array([
            1,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            1
          ]);
      }
      return null;
    }
    var unknownContext = {};
    var context = unknownContext;
    function getTestContext() {
      if (context === unknownContext || context && context.isContextLost()) {
        var canvas = document.createElement("canvas");
        var gl = void 0;
        if (settings.settings.PREFER_ENV >= constants.ENV.WEBGL2) {
          gl = canvas.getContext("webgl2", {});
        }
        if (!gl) {
          gl = canvas.getContext("webgl", {}) || canvas.getContext("experimental-webgl", {});
          if (!gl) {
            gl = null;
          } else {
            gl.getExtension("WEBGL_draw_buffers");
          }
        }
        context = gl;
      }
      return context;
    }
    var maxFragmentPrecision;
    function getMaxFragmentPrecision() {
      if (!maxFragmentPrecision) {
        maxFragmentPrecision = constants.PRECISION.MEDIUM;
        var gl = getTestContext();
        if (gl) {
          if (gl.getShaderPrecisionFormat) {
            var shaderFragment = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
            maxFragmentPrecision = shaderFragment.precision ? constants.PRECISION.HIGH : constants.PRECISION.MEDIUM;
          }
        }
      }
      return maxFragmentPrecision;
    }
    function setPrecision(src2, requestedPrecision, maxSupportedPrecision) {
      if (src2.substring(0, 9) !== "precision") {
        var precision = requestedPrecision;
        if (requestedPrecision === constants.PRECISION.HIGH && maxSupportedPrecision !== constants.PRECISION.HIGH) {
          precision = constants.PRECISION.MEDIUM;
        }
        return "precision " + precision + " float;\n" + src2;
      } else if (maxSupportedPrecision !== constants.PRECISION.HIGH && src2.substring(0, 15) === "precision highp") {
        return src2.replace("precision highp", "precision mediump");
      }
      return src2;
    }
    var GLSL_TO_SIZE = {
      float: 1,
      vec2: 2,
      vec3: 3,
      vec4: 4,
      int: 1,
      ivec2: 2,
      ivec3: 3,
      ivec4: 4,
      uint: 1,
      uvec2: 2,
      uvec3: 3,
      uvec4: 4,
      bool: 1,
      bvec2: 2,
      bvec3: 3,
      bvec4: 4,
      mat2: 4,
      mat3: 9,
      mat4: 16,
      sampler2D: 1
    };
    function mapSize(type) {
      return GLSL_TO_SIZE[type];
    }
    var GL_TABLE = null;
    var GL_TO_GLSL_TYPES = {
      FLOAT: "float",
      FLOAT_VEC2: "vec2",
      FLOAT_VEC3: "vec3",
      FLOAT_VEC4: "vec4",
      INT: "int",
      INT_VEC2: "ivec2",
      INT_VEC3: "ivec3",
      INT_VEC4: "ivec4",
      UNSIGNED_INT: "uint",
      UNSIGNED_INT_VEC2: "uvec2",
      UNSIGNED_INT_VEC3: "uvec3",
      UNSIGNED_INT_VEC4: "uvec4",
      BOOL: "bool",
      BOOL_VEC2: "bvec2",
      BOOL_VEC3: "bvec3",
      BOOL_VEC4: "bvec4",
      FLOAT_MAT2: "mat2",
      FLOAT_MAT3: "mat3",
      FLOAT_MAT4: "mat4",
      SAMPLER_2D: "sampler2D",
      INT_SAMPLER_2D: "sampler2D",
      UNSIGNED_INT_SAMPLER_2D: "sampler2D",
      SAMPLER_CUBE: "samplerCube",
      INT_SAMPLER_CUBE: "samplerCube",
      UNSIGNED_INT_SAMPLER_CUBE: "samplerCube",
      SAMPLER_2D_ARRAY: "sampler2DArray",
      INT_SAMPLER_2D_ARRAY: "sampler2DArray",
      UNSIGNED_INT_SAMPLER_2D_ARRAY: "sampler2DArray"
    };
    function mapType(gl, type) {
      if (!GL_TABLE) {
        var typeNames = Object.keys(GL_TO_GLSL_TYPES);
        GL_TABLE = {};
        for (var i = 0; i < typeNames.length; ++i) {
          var tn = typeNames[i];
          GL_TABLE[gl[tn]] = GL_TO_GLSL_TYPES[tn];
        }
      }
      return GL_TABLE[type];
    }
    var uniformParsers = [
      {
        test: function(data) {
          return data.type === "float" && data.size === 1;
        },
        code: function(name2) {
          return '\n            if(uv["' + name2 + '"] !== ud["' + name2 + '"].value)\n            {\n                ud["' + name2 + '"].value = uv["' + name2 + '"]\n                gl.uniform1f(ud["' + name2 + '"].location, uv["' + name2 + '"])\n            }\n            ';
        }
      },
      {
        test: function(data) {
          return (data.type === "sampler2D" || data.type === "samplerCube" || data.type === "sampler2DArray") && data.size === 1 && !data.isArray;
        },
        code: function(name2) {
          return 't = syncData.textureCount++;\n\n            renderer.texture.bind(uv["' + name2 + '"], t);\n\n            if(ud["' + name2 + '"].value !== t)\n            {\n                ud["' + name2 + '"].value = t;\n                gl.uniform1i(ud["' + name2 + '"].location, t);\n; // eslint-disable-line max-len\n            }';
        }
      },
      {
        test: function(data, uniform) {
          return data.type === "mat3" && data.size === 1 && uniform.a !== void 0;
        },
        code: function(name2) {
          return '\n            gl.uniformMatrix3fv(ud["' + name2 + '"].location, false, uv["' + name2 + '"].toArray(true));\n            ';
        },
        codeUbo: function(name2) {
          return "\n                var " + name2 + "_matrix = uv." + name2 + ".toArray(true);\n\n                data[offset] = " + name2 + "_matrix[0];\n                data[offset+1] = " + name2 + "_matrix[1];\n                data[offset+2] = " + name2 + "_matrix[2];\n        \n                data[offset + 4] = " + name2 + "_matrix[3];\n                data[offset + 5] = " + name2 + "_matrix[4];\n                data[offset + 6] = " + name2 + "_matrix[5];\n        \n                data[offset + 8] = " + name2 + "_matrix[6];\n                data[offset + 9] = " + name2 + "_matrix[7];\n                data[offset + 10] = " + name2 + "_matrix[8];\n            ";
        }
      },
      {
        test: function(data, uniform) {
          return data.type === "vec2" && data.size === 1 && uniform.x !== void 0;
        },
        code: function(name2) {
          return '\n                cv = ud["' + name2 + '"].value;\n                v = uv["' + name2 + '"];\n\n                if(cv[0] !== v.x || cv[1] !== v.y)\n                {\n                    cv[0] = v.x;\n                    cv[1] = v.y;\n                    gl.uniform2f(ud["' + name2 + '"].location, v.x, v.y);\n                }';
        },
        codeUbo: function(name2) {
          return "\n                v = uv." + name2 + ";\n\n                data[offset] = v.x;\n                data[offset+1] = v.y;\n            ";
        }
      },
      {
        test: function(data) {
          return data.type === "vec2" && data.size === 1;
        },
        code: function(name2) {
          return '\n                cv = ud["' + name2 + '"].value;\n                v = uv["' + name2 + '"];\n\n                if(cv[0] !== v[0] || cv[1] !== v[1])\n                {\n                    cv[0] = v[0];\n                    cv[1] = v[1];\n                    gl.uniform2f(ud["' + name2 + '"].location, v[0], v[1]);\n                }\n            ';
        }
      },
      {
        test: function(data, uniform) {
          return data.type === "vec4" && data.size === 1 && uniform.width !== void 0;
        },
        code: function(name2) {
          return '\n                cv = ud["' + name2 + '"].value;\n                v = uv["' + name2 + '"];\n\n                if(cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height)\n                {\n                    cv[0] = v.x;\n                    cv[1] = v.y;\n                    cv[2] = v.width;\n                    cv[3] = v.height;\n                    gl.uniform4f(ud["' + name2 + '"].location, v.x, v.y, v.width, v.height)\n                }';
        },
        codeUbo: function(name2) {
          return "\n                    v = uv." + name2 + ";\n\n                    data[offset] = v.x;\n                    data[offset+1] = v.y;\n                    data[offset+2] = v.width;\n                    data[offset+3] = v.height;\n                ";
        }
      },
      {
        test: function(data) {
          return data.type === "vec4" && data.size === 1;
        },
        code: function(name2) {
          return '\n                cv = ud["' + name2 + '"].value;\n                v = uv["' + name2 + '"];\n\n                if(cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n                {\n                    cv[0] = v[0];\n                    cv[1] = v[1];\n                    cv[2] = v[2];\n                    cv[3] = v[3];\n\n                    gl.uniform4f(ud["' + name2 + '"].location, v[0], v[1], v[2], v[3])\n                }';
        }
      }
    ];
    var GLSL_TO_SINGLE_SETTERS_CACHED = {
      float: "\n    if (cv !== v)\n    {\n        cu.value = v;\n        gl.uniform1f(location, v);\n    }",
      vec2: "\n    if (cv[0] !== v[0] || cv[1] !== v[1])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n\n        gl.uniform2f(location, v[0], v[1])\n    }",
      vec3: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n\n        gl.uniform3f(location, v[0], v[1], v[2])\n    }",
      vec4: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n        cv[3] = v[3];\n\n        gl.uniform4f(location, v[0], v[1], v[2], v[3]);\n    }",
      int: "\n    if (cv !== v)\n    {\n        cu.value = v;\n\n        gl.uniform1i(location, v);\n    }",
      ivec2: "\n    if (cv[0] !== v[0] || cv[1] !== v[1])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n\n        gl.uniform2i(location, v[0], v[1]);\n    }",
      ivec3: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n\n        gl.uniform3i(location, v[0], v[1], v[2]);\n    }",
      ivec4: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n        cv[3] = v[3];\n\n        gl.uniform4i(location, v[0], v[1], v[2], v[3]);\n    }",
      uint: "\n    if (cv !== v)\n    {\n        cu.value = v;\n\n        gl.uniform1ui(location, v);\n    }",
      uvec2: "\n    if (cv[0] !== v[0] || cv[1] !== v[1])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n\n        gl.uniform2ui(location, v[0], v[1]);\n    }",
      uvec3: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n\n        gl.uniform3ui(location, v[0], v[1], v[2]);\n    }",
      uvec4: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n        cv[3] = v[3];\n\n        gl.uniform4ui(location, v[0], v[1], v[2], v[3]);\n    }",
      bool: "\n    if (cv !== v)\n    {\n        cu.value = v;\n        gl.uniform1i(location, v);\n    }",
      bvec2: "\n    if (cv[0] != v[0] || cv[1] != v[1])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n\n        gl.uniform2i(location, v[0], v[1]);\n    }",
      bvec3: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n\n        gl.uniform3i(location, v[0], v[1], v[2]);\n    }",
      bvec4: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n        cv[3] = v[3];\n\n        gl.uniform4i(location, v[0], v[1], v[2], v[3]);\n    }",
      mat2: "gl.uniformMatrix2fv(location, false, v)",
      mat3: "gl.uniformMatrix3fv(location, false, v)",
      mat4: "gl.uniformMatrix4fv(location, false, v)",
      sampler2D: "gl.uniform1i(location, v)",
      samplerCube: "gl.uniform1i(location, v)",
      sampler2DArray: "gl.uniform1i(location, v)"
    };
    var GLSL_TO_ARRAY_SETTERS = {
      float: "gl.uniform1fv(location, v)",
      vec2: "gl.uniform2fv(location, v)",
      vec3: "gl.uniform3fv(location, v)",
      vec4: "gl.uniform4fv(location, v)",
      mat4: "gl.uniformMatrix4fv(location, false, v)",
      mat3: "gl.uniformMatrix3fv(location, false, v)",
      mat2: "gl.uniformMatrix2fv(location, false, v)",
      int: "gl.uniform1iv(location, v)",
      ivec2: "gl.uniform2iv(location, v)",
      ivec3: "gl.uniform3iv(location, v)",
      ivec4: "gl.uniform4iv(location, v)",
      uint: "gl.uniform1uiv(location, v)",
      uvec2: "gl.uniform2uiv(location, v)",
      uvec3: "gl.uniform3uiv(location, v)",
      uvec4: "gl.uniform4uiv(location, v)",
      bool: "gl.uniform1iv(location, v)",
      bvec2: "gl.uniform2iv(location, v)",
      bvec3: "gl.uniform3iv(location, v)",
      bvec4: "gl.uniform4iv(location, v)",
      sampler2D: "gl.uniform1iv(location, v)",
      samplerCube: "gl.uniform1iv(location, v)",
      sampler2DArray: "gl.uniform1iv(location, v)"
    };
    function generateUniformsSync(group, uniformData) {
      var _a;
      var funcFragments = ["\n        var v = null;\n        var cv = null;\n        var cu = null;\n        var t = 0;\n        var gl = renderer.gl;\n    "];
      for (var i in group.uniforms) {
        var data = uniformData[i];
        if (!data) {
          if ((_a = group.uniforms[i]) === null || _a === void 0 ? void 0 : _a.group) {
            if (group.uniforms[i].ubo) {
              funcFragments.push("\n                        renderer.shader.syncUniformBufferGroup(uv." + i + ", '" + i + "');\n                    ");
            } else {
              funcFragments.push("\n                        renderer.shader.syncUniformGroup(uv." + i + ", syncData);\n                    ");
            }
          }
          continue;
        }
        var uniform = group.uniforms[i];
        var parsed = false;
        for (var j = 0; j < uniformParsers.length; j++) {
          if (uniformParsers[j].test(data, uniform)) {
            funcFragments.push(uniformParsers[j].code(i, uniform));
            parsed = true;
            break;
          }
        }
        if (!parsed) {
          var templateType = data.size === 1 ? GLSL_TO_SINGLE_SETTERS_CACHED : GLSL_TO_ARRAY_SETTERS;
          var template2 = templateType[data.type].replace("location", 'ud["' + i + '"].location');
          funcFragments.push('\n            cu = ud["' + i + '"];\n            cv = cu.value;\n            v = uv["' + i + '"];\n            ' + template2 + ";");
        }
      }
      return new Function("ud", "uv", "renderer", "syncData", funcFragments.join("\n"));
    }
    var fragTemplate = [
      "precision mediump float;",
      "void main(void){",
      "float test = 0.1;",
      "%forloop%",
      "gl_FragColor = vec4(0.0);",
      "}"
    ].join("\n");
    function generateIfTestSrc(maxIfs) {
      var src2 = "";
      for (var i = 0; i < maxIfs; ++i) {
        if (i > 0) {
          src2 += "\nelse ";
        }
        if (i < maxIfs - 1) {
          src2 += "if(test == " + i + ".0){}";
        }
      }
      return src2;
    }
    function checkMaxIfStatementsInShader(maxIfs, gl) {
      if (maxIfs === 0) {
        throw new Error("Invalid value of `0` passed to `checkMaxIfStatementsInShader`");
      }
      var shader = gl.createShader(gl.FRAGMENT_SHADER);
      while (true) {
        var fragmentSrc = fragTemplate.replace(/%forloop%/gi, generateIfTestSrc(maxIfs));
        gl.shaderSource(shader, fragmentSrc);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          maxIfs = maxIfs / 2 | 0;
        } else {
          break;
        }
      }
      return maxIfs;
    }
    var unsafeEval;
    function unsafeEvalSupported() {
      if (typeof unsafeEval === "boolean") {
        return unsafeEval;
      }
      try {
        var func = new Function("param1", "param2", "param3", "return param1[param2] === param3;");
        unsafeEval = func({ a: "b" }, "a", "b") === true;
      } catch (e) {
        unsafeEval = false;
      }
      return unsafeEval;
    }
    var defaultFragment = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void){\n   gl_FragColor *= texture2D(uSampler, vTextureCoord);\n}";
    var defaultVertex = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void){\n   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n   vTextureCoord = aTextureCoord;\n}\n";
    var UID$3 = 0;
    var nameCache = {};
    var Program = function() {
      function Program2(vertexSrc, fragmentSrc, name2) {
        if (name2 === void 0) {
          name2 = "pixi-shader";
        }
        this.id = UID$3++;
        this.vertexSrc = vertexSrc || Program2.defaultVertexSrc;
        this.fragmentSrc = fragmentSrc || Program2.defaultFragmentSrc;
        this.vertexSrc = this.vertexSrc.trim();
        this.fragmentSrc = this.fragmentSrc.trim();
        if (this.vertexSrc.substring(0, 8) !== "#version") {
          name2 = name2.replace(/\s+/g, "-");
          if (nameCache[name2]) {
            nameCache[name2]++;
            name2 += "-" + nameCache[name2];
          } else {
            nameCache[name2] = 1;
          }
          this.vertexSrc = "#define SHADER_NAME " + name2 + "\n" + this.vertexSrc;
          this.fragmentSrc = "#define SHADER_NAME " + name2 + "\n" + this.fragmentSrc;
          this.vertexSrc = setPrecision(this.vertexSrc, settings.settings.PRECISION_VERTEX, constants.PRECISION.HIGH);
          this.fragmentSrc = setPrecision(this.fragmentSrc, settings.settings.PRECISION_FRAGMENT, getMaxFragmentPrecision());
        }
        this.glPrograms = {};
        this.syncUniforms = null;
      }
      Object.defineProperty(Program2, "defaultVertexSrc", {
        get: function() {
          return defaultVertex;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Program2, "defaultFragmentSrc", {
        get: function() {
          return defaultFragment;
        },
        enumerable: false,
        configurable: true
      });
      Program2.from = function(vertexSrc, fragmentSrc, name2) {
        var key = vertexSrc + fragmentSrc;
        var program = utils.ProgramCache[key];
        if (!program) {
          utils.ProgramCache[key] = program = new Program2(vertexSrc, fragmentSrc, name2);
        }
        return program;
      };
      return Program2;
    }();
    var Shader = function() {
      function Shader2(program, uniforms) {
        this.uniformBindCount = 0;
        this.program = program;
        if (uniforms) {
          if (uniforms instanceof UniformGroup) {
            this.uniformGroup = uniforms;
          } else {
            this.uniformGroup = new UniformGroup(uniforms);
          }
        } else {
          this.uniformGroup = new UniformGroup({});
        }
      }
      Shader2.prototype.checkUniformExists = function(name2, group) {
        if (group.uniforms[name2]) {
          return true;
        }
        for (var i in group.uniforms) {
          var uniform = group.uniforms[i];
          if (uniform.group) {
            if (this.checkUniformExists(name2, uniform)) {
              return true;
            }
          }
        }
        return false;
      };
      Shader2.prototype.destroy = function() {
        this.uniformGroup = null;
      };
      Object.defineProperty(Shader2.prototype, "uniforms", {
        get: function() {
          return this.uniformGroup.uniforms;
        },
        enumerable: false,
        configurable: true
      });
      Shader2.from = function(vertexSrc, fragmentSrc, uniforms) {
        var program = Program.from(vertexSrc, fragmentSrc);
        return new Shader2(program, uniforms);
      };
      return Shader2;
    }();
    var BLEND = 0;
    var OFFSET = 1;
    var CULLING = 2;
    var DEPTH_TEST = 3;
    var WINDING = 4;
    var DEPTH_MASK = 5;
    var State = function() {
      function State2() {
        this.data = 0;
        this.blendMode = constants.BLEND_MODES.NORMAL;
        this.polygonOffset = 0;
        this.blend = true;
        this.depthMask = true;
      }
      Object.defineProperty(State2.prototype, "blend", {
        get: function() {
          return !!(this.data & 1 << BLEND);
        },
        set: function(value) {
          if (!!(this.data & 1 << BLEND) !== value) {
            this.data ^= 1 << BLEND;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(State2.prototype, "offsets", {
        get: function() {
          return !!(this.data & 1 << OFFSET);
        },
        set: function(value) {
          if (!!(this.data & 1 << OFFSET) !== value) {
            this.data ^= 1 << OFFSET;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(State2.prototype, "culling", {
        get: function() {
          return !!(this.data & 1 << CULLING);
        },
        set: function(value) {
          if (!!(this.data & 1 << CULLING) !== value) {
            this.data ^= 1 << CULLING;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(State2.prototype, "depthTest", {
        get: function() {
          return !!(this.data & 1 << DEPTH_TEST);
        },
        set: function(value) {
          if (!!(this.data & 1 << DEPTH_TEST) !== value) {
            this.data ^= 1 << DEPTH_TEST;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(State2.prototype, "depthMask", {
        get: function() {
          return !!(this.data & 1 << DEPTH_MASK);
        },
        set: function(value) {
          if (!!(this.data & 1 << DEPTH_MASK) !== value) {
            this.data ^= 1 << DEPTH_MASK;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(State2.prototype, "clockwiseFrontFace", {
        get: function() {
          return !!(this.data & 1 << WINDING);
        },
        set: function(value) {
          if (!!(this.data & 1 << WINDING) !== value) {
            this.data ^= 1 << WINDING;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(State2.prototype, "blendMode", {
        get: function() {
          return this._blendMode;
        },
        set: function(value) {
          this.blend = value !== constants.BLEND_MODES.NONE;
          this._blendMode = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(State2.prototype, "polygonOffset", {
        get: function() {
          return this._polygonOffset;
        },
        set: function(value) {
          this.offsets = !!value;
          this._polygonOffset = value;
        },
        enumerable: false,
        configurable: true
      });
      State2.prototype.toString = function() {
        return "[@pixi/core:State " + ("blendMode=" + this.blendMode + " ") + ("clockwiseFrontFace=" + this.clockwiseFrontFace + " ") + ("culling=" + this.culling + " ") + ("depthMask=" + this.depthMask + " ") + ("polygonOffset=" + this.polygonOffset) + "]";
      };
      State2.for2d = function() {
        var state = new State2();
        state.depthTest = false;
        state.blend = true;
        return state;
      };
      return State2;
    }();
    var defaultVertex$1 = "attribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nuniform vec4 inputSize;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aVertexPosition * (outputFrame.zw * inputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n";
    var defaultFragment$1 = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void){\n   gl_FragColor = texture2D(uSampler, vTextureCoord);\n}\n";
    var Filter = function(_super) {
      __extends(Filter2, _super);
      function Filter2(vertexSrc, fragmentSrc, uniforms) {
        var _this = this;
        var program = Program.from(vertexSrc || Filter2.defaultVertexSrc, fragmentSrc || Filter2.defaultFragmentSrc);
        _this = _super.call(this, program, uniforms) || this;
        _this.padding = 0;
        _this.resolution = settings.settings.FILTER_RESOLUTION;
        _this.multisample = settings.settings.FILTER_MULTISAMPLE;
        _this.enabled = true;
        _this.autoFit = true;
        _this.state = new State();
        return _this;
      }
      Filter2.prototype.apply = function(filterManager, input, output, clearMode, _currentState) {
        filterManager.applyFilter(this, input, output, clearMode);
      };
      Object.defineProperty(Filter2.prototype, "blendMode", {
        get: function() {
          return this.state.blendMode;
        },
        set: function(value) {
          this.state.blendMode = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Filter2.prototype, "resolution", {
        get: function() {
          return this._resolution;
        },
        set: function(value) {
          this._resolution = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Filter2, "defaultVertexSrc", {
        get: function() {
          return defaultVertex$1;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Filter2, "defaultFragmentSrc", {
        get: function() {
          return defaultFragment$1;
        },
        enumerable: false,
        configurable: true
      });
      return Filter2;
    }(Shader);
    var vertex = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 otherMatrix;\n\nvarying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;\n}\n";
    var fragment = "varying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform sampler2D mask;\nuniform float alpha;\nuniform float npmAlpha;\nuniform vec4 maskClamp;\n\nvoid main(void)\n{\n    float clip = step(3.5,\n        step(maskClamp.x, vMaskCoord.x) +\n        step(maskClamp.y, vMaskCoord.y) +\n        step(vMaskCoord.x, maskClamp.z) +\n        step(vMaskCoord.y, maskClamp.w));\n\n    vec4 original = texture2D(uSampler, vTextureCoord);\n    vec4 masky = texture2D(mask, vMaskCoord);\n    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);\n\n    original *= (alphaMul * masky.r * alpha * clip);\n\n    gl_FragColor = original;\n}\n";
    var tempMat = new math.Matrix();
    var TextureMatrix = function() {
      function TextureMatrix2(texture, clampMargin) {
        this._texture = texture;
        this.mapCoord = new math.Matrix();
        this.uClampFrame = new Float32Array(4);
        this.uClampOffset = new Float32Array(2);
        this._textureID = -1;
        this._updateID = 0;
        this.clampOffset = 0;
        this.clampMargin = typeof clampMargin === "undefined" ? 0.5 : clampMargin;
        this.isSimple = false;
      }
      Object.defineProperty(TextureMatrix2.prototype, "texture", {
        get: function() {
          return this._texture;
        },
        set: function(value) {
          this._texture = value;
          this._textureID = -1;
        },
        enumerable: false,
        configurable: true
      });
      TextureMatrix2.prototype.multiplyUvs = function(uvs, out) {
        if (out === void 0) {
          out = uvs;
        }
        var mat = this.mapCoord;
        for (var i = 0; i < uvs.length; i += 2) {
          var x = uvs[i];
          var y = uvs[i + 1];
          out[i] = x * mat.a + y * mat.c + mat.tx;
          out[i + 1] = x * mat.b + y * mat.d + mat.ty;
        }
        return out;
      };
      TextureMatrix2.prototype.update = function(forceUpdate) {
        var tex = this._texture;
        if (!tex || !tex.valid) {
          return false;
        }
        if (!forceUpdate && this._textureID === tex._updateID) {
          return false;
        }
        this._textureID = tex._updateID;
        this._updateID++;
        var uvs = tex._uvs;
        this.mapCoord.set(uvs.x1 - uvs.x0, uvs.y1 - uvs.y0, uvs.x3 - uvs.x0, uvs.y3 - uvs.y0, uvs.x0, uvs.y0);
        var orig = tex.orig;
        var trim = tex.trim;
        if (trim) {
          tempMat.set(orig.width / trim.width, 0, 0, orig.height / trim.height, -trim.x / trim.width, -trim.y / trim.height);
          this.mapCoord.append(tempMat);
        }
        var texBase = tex.baseTexture;
        var frame = this.uClampFrame;
        var margin = this.clampMargin / texBase.resolution;
        var offset = this.clampOffset;
        frame[0] = (tex._frame.x + margin + offset) / texBase.width;
        frame[1] = (tex._frame.y + margin + offset) / texBase.height;
        frame[2] = (tex._frame.x + tex._frame.width - margin + offset) / texBase.width;
        frame[3] = (tex._frame.y + tex._frame.height - margin + offset) / texBase.height;
        this.uClampOffset[0] = offset / texBase.realWidth;
        this.uClampOffset[1] = offset / texBase.realHeight;
        this.isSimple = tex._frame.width === texBase.width && tex._frame.height === texBase.height && tex.rotate === 0;
        return true;
      };
      return TextureMatrix2;
    }();
    var SpriteMaskFilter = function(_super) {
      __extends(SpriteMaskFilter2, _super);
      function SpriteMaskFilter2(vertexSrc, fragmentSrc, uniforms) {
        var _this = this;
        var sprite = null;
        if (typeof vertexSrc !== "string" && fragmentSrc === void 0 && uniforms === void 0) {
          sprite = vertexSrc;
          vertexSrc = void 0;
          fragmentSrc = void 0;
          uniforms = void 0;
        }
        _this = _super.call(this, vertexSrc || vertex, fragmentSrc || fragment, uniforms) || this;
        _this.maskSprite = sprite;
        _this.maskMatrix = new math.Matrix();
        return _this;
      }
      Object.defineProperty(SpriteMaskFilter2.prototype, "maskSprite", {
        get: function() {
          return this._maskSprite;
        },
        set: function(value) {
          this._maskSprite = value;
          if (this._maskSprite) {
            this._maskSprite.renderable = false;
          }
        },
        enumerable: false,
        configurable: true
      });
      SpriteMaskFilter2.prototype.apply = function(filterManager, input, output, clearMode) {
        var maskSprite = this._maskSprite;
        var tex = maskSprite._texture;
        if (!tex.valid) {
          return;
        }
        if (!tex.uvMatrix) {
          tex.uvMatrix = new TextureMatrix(tex, 0);
        }
        tex.uvMatrix.update();
        this.uniforms.npmAlpha = tex.baseTexture.alphaMode ? 0 : 1;
        this.uniforms.mask = tex;
        this.uniforms.otherMatrix = filterManager.calculateSpriteMatrix(this.maskMatrix, maskSprite).prepend(tex.uvMatrix.mapCoord);
        this.uniforms.alpha = maskSprite.worldAlpha;
        this.uniforms.maskClamp = tex.uvMatrix.uClampFrame;
        filterManager.applyFilter(this, input, output, clearMode);
      };
      return SpriteMaskFilter2;
    }(Filter);
    var MaskSystem = function() {
      function MaskSystem2(renderer) {
        this.renderer = renderer;
        this.enableScissor = true;
        this.alphaMaskPool = [];
        this.maskDataPool = [];
        this.maskStack = [];
        this.alphaMaskIndex = 0;
      }
      MaskSystem2.prototype.setMaskStack = function(maskStack) {
        this.maskStack = maskStack;
        this.renderer.scissor.setMaskStack(maskStack);
        this.renderer.stencil.setMaskStack(maskStack);
      };
      MaskSystem2.prototype.push = function(target, maskDataOrTarget) {
        var maskData = maskDataOrTarget;
        if (!maskData.isMaskData) {
          var d = this.maskDataPool.pop() || new MaskData();
          d.pooled = true;
          d.maskObject = maskDataOrTarget;
          maskData = d;
        }
        var maskAbove = this.maskStack.length !== 0 ? this.maskStack[this.maskStack.length - 1] : null;
        maskData.copyCountersOrReset(maskAbove);
        if (maskData.autoDetect) {
          this.detect(maskData);
        }
        maskData._target = target;
        if (maskData.type !== constants.MASK_TYPES.SPRITE) {
          this.maskStack.push(maskData);
        }
        if (maskData.enabled) {
          switch (maskData.type) {
            case constants.MASK_TYPES.SCISSOR:
              this.renderer.scissor.push(maskData);
              break;
            case constants.MASK_TYPES.STENCIL:
              this.renderer.stencil.push(maskData);
              break;
            case constants.MASK_TYPES.SPRITE:
              maskData.copyCountersOrReset(null);
              this.pushSpriteMask(maskData);
              break;
          }
        }
        if (maskData.type === constants.MASK_TYPES.SPRITE) {
          this.maskStack.push(maskData);
        }
      };
      MaskSystem2.prototype.pop = function(target) {
        var maskData = this.maskStack.pop();
        if (!maskData || maskData._target !== target) {
          return;
        }
        if (maskData.enabled) {
          switch (maskData.type) {
            case constants.MASK_TYPES.SCISSOR:
              this.renderer.scissor.pop();
              break;
            case constants.MASK_TYPES.STENCIL:
              this.renderer.stencil.pop(maskData.maskObject);
              break;
            case constants.MASK_TYPES.SPRITE:
              this.popSpriteMask(maskData);
              break;
          }
        }
        maskData.reset();
        if (maskData.pooled) {
          this.maskDataPool.push(maskData);
        }
        if (this.maskStack.length !== 0) {
          var maskCurrent = this.maskStack[this.maskStack.length - 1];
          if (maskCurrent.type === constants.MASK_TYPES.SPRITE && maskCurrent._filters) {
            maskCurrent._filters[0].maskSprite = maskCurrent.maskObject;
          }
        }
      };
      MaskSystem2.prototype.detect = function(maskData) {
        var maskObject = maskData.maskObject;
        if (maskObject.isSprite) {
          maskData.type = constants.MASK_TYPES.SPRITE;
        } else if (this.enableScissor && this.renderer.scissor.testScissor(maskData)) {
          maskData.type = constants.MASK_TYPES.SCISSOR;
        } else {
          maskData.type = constants.MASK_TYPES.STENCIL;
        }
      };
      MaskSystem2.prototype.pushSpriteMask = function(maskData) {
        var _a, _b;
        var maskObject = maskData.maskObject;
        var target = maskData._target;
        var alphaMaskFilter = maskData._filters;
        if (!alphaMaskFilter) {
          alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex];
          if (!alphaMaskFilter) {
            alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter()];
          }
        }
        var renderer = this.renderer;
        var renderTextureSystem = renderer.renderTexture;
        var resolution;
        var multisample;
        if (renderTextureSystem.current) {
          var renderTexture = renderTextureSystem.current;
          resolution = maskData.resolution || renderTexture.resolution;
          multisample = (_a = maskData.multisample) !== null && _a !== void 0 ? _a : renderTexture.multisample;
        } else {
          resolution = maskData.resolution || renderer.resolution;
          multisample = (_b = maskData.multisample) !== null && _b !== void 0 ? _b : renderer.multisample;
        }
        alphaMaskFilter[0].resolution = resolution;
        alphaMaskFilter[0].multisample = multisample;
        alphaMaskFilter[0].maskSprite = maskObject;
        var stashFilterArea = target.filterArea;
        target.filterArea = maskObject.getBounds(true);
        renderer.filter.push(target, alphaMaskFilter);
        target.filterArea = stashFilterArea;
        if (!maskData._filters) {
          this.alphaMaskIndex++;
        }
      };
      MaskSystem2.prototype.popSpriteMask = function(maskData) {
        this.renderer.filter.pop();
        if (maskData._filters) {
          maskData._filters[0].maskSprite = null;
        } else {
          this.alphaMaskIndex--;
          this.alphaMaskPool[this.alphaMaskIndex][0].maskSprite = null;
        }
      };
      MaskSystem2.prototype.destroy = function() {
        this.renderer = null;
      };
      return MaskSystem2;
    }();
    var AbstractMaskSystem = function() {
      function AbstractMaskSystem2(renderer) {
        this.renderer = renderer;
        this.maskStack = [];
        this.glConst = 0;
      }
      AbstractMaskSystem2.prototype.getStackLength = function() {
        return this.maskStack.length;
      };
      AbstractMaskSystem2.prototype.setMaskStack = function(maskStack) {
        var gl = this.renderer.gl;
        var curStackLen = this.getStackLength();
        this.maskStack = maskStack;
        var newStackLen = this.getStackLength();
        if (newStackLen !== curStackLen) {
          if (newStackLen === 0) {
            gl.disable(this.glConst);
          } else {
            gl.enable(this.glConst);
            this._useCurrent();
          }
        }
      };
      AbstractMaskSystem2.prototype._useCurrent = function() {
      };
      AbstractMaskSystem2.prototype.destroy = function() {
        this.renderer = null;
        this.maskStack = null;
      };
      return AbstractMaskSystem2;
    }();
    var tempMatrix$1 = new math.Matrix();
    var ScissorSystem = function(_super) {
      __extends(ScissorSystem2, _super);
      function ScissorSystem2(renderer) {
        var _this = _super.call(this, renderer) || this;
        _this.glConst = WebGLRenderingContext.SCISSOR_TEST;
        return _this;
      }
      ScissorSystem2.prototype.getStackLength = function() {
        var maskData = this.maskStack[this.maskStack.length - 1];
        if (maskData) {
          return maskData._scissorCounter;
        }
        return 0;
      };
      ScissorSystem2.prototype.calcScissorRect = function(maskData) {
        if (maskData._scissorRectLocal) {
          return;
        }
        var prevData = maskData._scissorRect;
        var maskObject = maskData.maskObject;
        var renderer = this.renderer;
        var renderTextureSystem = renderer.renderTexture;
        maskObject.renderable = true;
        var rect = maskObject.getBounds();
        this.roundFrameToPixels(rect, renderTextureSystem.current ? renderTextureSystem.current.resolution : renderer.resolution, renderTextureSystem.sourceFrame, renderTextureSystem.destinationFrame, renderer.projection.transform);
        maskObject.renderable = false;
        if (prevData) {
          rect.fit(prevData);
        }
        maskData._scissorRectLocal = rect;
      };
      ScissorSystem2.isMatrixRotated = function(matrix) {
        if (!matrix) {
          return false;
        }
        var a = matrix.a, b = matrix.b, c = matrix.c, d = matrix.d;
        return (Math.abs(b) > 1e-4 || Math.abs(c) > 1e-4) && (Math.abs(a) > 1e-4 || Math.abs(d) > 1e-4);
      };
      ScissorSystem2.prototype.testScissor = function(maskData) {
        var maskObject = maskData.maskObject;
        if (!maskObject.isFastRect || !maskObject.isFastRect()) {
          return false;
        }
        if (ScissorSystem2.isMatrixRotated(maskObject.worldTransform)) {
          return false;
        }
        if (ScissorSystem2.isMatrixRotated(this.renderer.projection.transform)) {
          return false;
        }
        this.calcScissorRect(maskData);
        var rect = maskData._scissorRectLocal;
        return rect.width > 0 && rect.height > 0;
      };
      ScissorSystem2.prototype.roundFrameToPixels = function(frame, resolution, bindingSourceFrame, bindingDestinationFrame, transform) {
        if (ScissorSystem2.isMatrixRotated(transform)) {
          return;
        }
        transform = transform ? tempMatrix$1.copyFrom(transform) : tempMatrix$1.identity();
        transform.translate(-bindingSourceFrame.x, -bindingSourceFrame.y).scale(bindingDestinationFrame.width / bindingSourceFrame.width, bindingDestinationFrame.height / bindingSourceFrame.height).translate(bindingDestinationFrame.x, bindingDestinationFrame.y);
        this.renderer.filter.transformAABB(transform, frame);
        frame.fit(bindingDestinationFrame);
        frame.x = Math.round(frame.x * resolution);
        frame.y = Math.round(frame.y * resolution);
        frame.width = Math.round(frame.width * resolution);
        frame.height = Math.round(frame.height * resolution);
      };
      ScissorSystem2.prototype.push = function(maskData) {
        if (!maskData._scissorRectLocal) {
          this.calcScissorRect(maskData);
        }
        var gl = this.renderer.gl;
        if (!maskData._scissorRect) {
          gl.enable(gl.SCISSOR_TEST);
        }
        maskData._scissorCounter++;
        maskData._scissorRect = maskData._scissorRectLocal;
        this._useCurrent();
      };
      ScissorSystem2.prototype.pop = function() {
        var gl = this.renderer.gl;
        if (this.getStackLength() > 0) {
          this._useCurrent();
        } else {
          gl.disable(gl.SCISSOR_TEST);
        }
      };
      ScissorSystem2.prototype._useCurrent = function() {
        var rect = this.maskStack[this.maskStack.length - 1]._scissorRect;
        var y;
        if (this.renderer.renderTexture.current) {
          y = rect.y;
        } else {
          y = this.renderer.height - rect.height - rect.y;
        }
        this.renderer.gl.scissor(rect.x, y, rect.width, rect.height);
      };
      return ScissorSystem2;
    }(AbstractMaskSystem);
    var StencilSystem = function(_super) {
      __extends(StencilSystem2, _super);
      function StencilSystem2(renderer) {
        var _this = _super.call(this, renderer) || this;
        _this.glConst = WebGLRenderingContext.STENCIL_TEST;
        return _this;
      }
      StencilSystem2.prototype.getStackLength = function() {
        var maskData = this.maskStack[this.maskStack.length - 1];
        if (maskData) {
          return maskData._stencilCounter;
        }
        return 0;
      };
      StencilSystem2.prototype.push = function(maskData) {
        var maskObject = maskData.maskObject;
        var gl = this.renderer.gl;
        var prevMaskCount = maskData._stencilCounter;
        if (prevMaskCount === 0) {
          this.renderer.framebuffer.forceStencil();
          gl.enable(gl.STENCIL_TEST);
        }
        maskData._stencilCounter++;
        gl.colorMask(false, false, false, false);
        gl.stencilFunc(gl.EQUAL, prevMaskCount, 4294967295);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
        maskObject.renderable = true;
        maskObject.render(this.renderer);
        this.renderer.batch.flush();
        maskObject.renderable = false;
        this._useCurrent();
      };
      StencilSystem2.prototype.pop = function(maskObject) {
        var gl = this.renderer.gl;
        if (this.getStackLength() === 0) {
          gl.disable(gl.STENCIL_TEST);
          gl.clearStencil(0);
          gl.clear(gl.STENCIL_BUFFER_BIT);
        } else {
          gl.colorMask(false, false, false, false);
          gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);
          maskObject.renderable = true;
          maskObject.render(this.renderer);
          this.renderer.batch.flush();
          maskObject.renderable = false;
          this._useCurrent();
        }
      };
      StencilSystem2.prototype._useCurrent = function() {
        var gl = this.renderer.gl;
        gl.colorMask(true, true, true, true);
        gl.stencilFunc(gl.EQUAL, this.getStackLength(), 4294967295);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      };
      return StencilSystem2;
    }(AbstractMaskSystem);
    var ProjectionSystem = function() {
      function ProjectionSystem2(renderer) {
        this.renderer = renderer;
        this.destinationFrame = null;
        this.sourceFrame = null;
        this.defaultFrame = null;
        this.projectionMatrix = new math.Matrix();
        this.transform = null;
      }
      ProjectionSystem2.prototype.update = function(destinationFrame, sourceFrame, resolution, root) {
        this.destinationFrame = destinationFrame || this.destinationFrame || this.defaultFrame;
        this.sourceFrame = sourceFrame || this.sourceFrame || destinationFrame;
        this.calculateProjection(this.destinationFrame, this.sourceFrame, resolution, root);
        if (this.transform) {
          this.projectionMatrix.append(this.transform);
        }
        var renderer = this.renderer;
        renderer.globalUniforms.uniforms.projectionMatrix = this.projectionMatrix;
        renderer.globalUniforms.update();
        if (renderer.shader.shader) {
          renderer.shader.syncUniformGroup(renderer.shader.shader.uniforms.globals);
        }
      };
      ProjectionSystem2.prototype.calculateProjection = function(_destinationFrame, sourceFrame, _resolution, root) {
        var pm = this.projectionMatrix;
        var sign = !root ? 1 : -1;
        pm.identity();
        pm.a = 1 / sourceFrame.width * 2;
        pm.d = sign * (1 / sourceFrame.height * 2);
        pm.tx = -1 - sourceFrame.x * pm.a;
        pm.ty = -sign - sourceFrame.y * pm.d;
      };
      ProjectionSystem2.prototype.setTransform = function(_matrix) {
      };
      ProjectionSystem2.prototype.destroy = function() {
        this.renderer = null;
      };
      return ProjectionSystem2;
    }();
    var tempRect = new math.Rectangle();
    var tempRect2 = new math.Rectangle();
    var RenderTextureSystem = function() {
      function RenderTextureSystem2(renderer) {
        this.renderer = renderer;
        this.clearColor = renderer._backgroundColorRgba;
        this.defaultMaskStack = [];
        this.current = null;
        this.sourceFrame = new math.Rectangle();
        this.destinationFrame = new math.Rectangle();
        this.viewportFrame = new math.Rectangle();
      }
      RenderTextureSystem2.prototype.bind = function(renderTexture, sourceFrame, destinationFrame) {
        if (renderTexture === void 0) {
          renderTexture = null;
        }
        var renderer = this.renderer;
        this.current = renderTexture;
        var baseTexture;
        var framebuffer;
        var resolution;
        if (renderTexture) {
          baseTexture = renderTexture.baseTexture;
          resolution = baseTexture.resolution;
          if (!sourceFrame) {
            tempRect.width = renderTexture.frame.width;
            tempRect.height = renderTexture.frame.height;
            sourceFrame = tempRect;
          }
          if (!destinationFrame) {
            tempRect2.x = renderTexture.frame.x;
            tempRect2.y = renderTexture.frame.y;
            tempRect2.width = sourceFrame.width;
            tempRect2.height = sourceFrame.height;
            destinationFrame = tempRect2;
          }
          framebuffer = baseTexture.framebuffer;
        } else {
          resolution = renderer.resolution;
          if (!sourceFrame) {
            tempRect.width = renderer.screen.width;
            tempRect.height = renderer.screen.height;
            sourceFrame = tempRect;
          }
          if (!destinationFrame) {
            destinationFrame = tempRect;
            destinationFrame.width = sourceFrame.width;
            destinationFrame.height = sourceFrame.height;
          }
        }
        var viewportFrame = this.viewportFrame;
        viewportFrame.x = destinationFrame.x * resolution;
        viewportFrame.y = destinationFrame.y * resolution;
        viewportFrame.width = destinationFrame.width * resolution;
        viewportFrame.height = destinationFrame.height * resolution;
        if (!renderTexture) {
          viewportFrame.y = renderer.view.height - (viewportFrame.y + viewportFrame.height);
        }
        viewportFrame.ceil();
        this.renderer.framebuffer.bind(framebuffer, viewportFrame);
        this.renderer.projection.update(destinationFrame, sourceFrame, resolution, !framebuffer);
        if (renderTexture) {
          this.renderer.mask.setMaskStack(baseTexture.maskStack);
        } else {
          this.renderer.mask.setMaskStack(this.defaultMaskStack);
        }
        this.sourceFrame.copyFrom(sourceFrame);
        this.destinationFrame.copyFrom(destinationFrame);
      };
      RenderTextureSystem2.prototype.clear = function(clearColor, mask) {
        if (this.current) {
          clearColor = clearColor || this.current.baseTexture.clearColor;
        } else {
          clearColor = clearColor || this.clearColor;
        }
        var destinationFrame = this.destinationFrame;
        var baseFrame = this.current ? this.current.baseTexture : this.renderer.screen;
        var clearMask = destinationFrame.width !== baseFrame.width || destinationFrame.height !== baseFrame.height;
        if (clearMask) {
          var _a = this.viewportFrame, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
          x = Math.round(x);
          y = Math.round(y);
          width = Math.round(width);
          height = Math.round(height);
          this.renderer.gl.enable(this.renderer.gl.SCISSOR_TEST);
          this.renderer.gl.scissor(x, y, width, height);
        }
        this.renderer.framebuffer.clear(clearColor[0], clearColor[1], clearColor[2], clearColor[3], mask);
        if (clearMask) {
          this.renderer.scissor.pop();
        }
      };
      RenderTextureSystem2.prototype.resize = function() {
        this.bind(null);
      };
      RenderTextureSystem2.prototype.reset = function() {
        this.bind(null);
      };
      RenderTextureSystem2.prototype.destroy = function() {
        this.renderer = null;
      };
      return RenderTextureSystem2;
    }();
    function uboUpdate(_ud, _uv, _renderer, _syncData, buffer) {
      _renderer.buffer.update(buffer);
    }
    var UBO_TO_SINGLE_SETTERS = {
      float: "\n        data[offset] = v;\n    ",
      vec2: "\n        data[offset] = v[0];\n        data[offset+1] = v[1];\n    ",
      vec3: "\n        data[offset] = v[0];\n        data[offset+1] = v[1];\n        data[offset+2] = v[2];\n\n    ",
      vec4: "\n        data[offset] = v[0];\n        data[offset+1] = v[1];\n        data[offset+2] = v[2];\n        data[offset+3] = v[3];\n    ",
      mat2: "\n        data[offset] = v[0];\n        data[offset+1] = v[1];\n\n        data[offset+4] = v[2];\n        data[offset+5] = v[3];\n    ",
      mat3: "\n        data[offset] = v[0];\n        data[offset+1] = v[1];\n        data[offset+2] = v[2];\n\n        data[offset + 4] = v[3];\n        data[offset + 5] = v[4];\n        data[offset + 6] = v[5];\n\n        data[offset + 8] = v[6];\n        data[offset + 9] = v[7];\n        data[offset + 10] = v[8];\n    ",
      mat4: "\n        for(var i = 0; i < 16; i++)\n        {\n            data[offset + i] = v[i];\n        }\n    "
    };
    var GLSL_TO_STD40_SIZE = {
      float: 4,
      vec2: 8,
      vec3: 12,
      vec4: 16,
      int: 4,
      ivec2: 8,
      ivec3: 12,
      ivec4: 16,
      uint: 4,
      uvec2: 8,
      uvec3: 12,
      uvec4: 16,
      bool: 4,
      bvec2: 8,
      bvec3: 12,
      bvec4: 16,
      mat2: 16 * 2,
      mat3: 16 * 3,
      mat4: 16 * 4
    };
    function createUBOElements(uniformData) {
      var uboElements = uniformData.map(function(data) {
        return {
          data,
          offset: 0,
          dataLen: 0,
          dirty: 0
        };
      });
      var size = 0;
      var chunkSize = 0;
      var offset = 0;
      for (var i = 0; i < uboElements.length; i++) {
        var uboElement = uboElements[i];
        size = GLSL_TO_STD40_SIZE[uboElement.data.type];
        if (uboElement.data.size > 1) {
          size = Math.max(size, 16) * uboElement.data.size;
        }
        uboElement.dataLen = size;
        if (chunkSize % size !== 0 && chunkSize < 16) {
          var lineUpValue = chunkSize % size % 16;
          chunkSize += lineUpValue;
          offset += lineUpValue;
        }
        if (chunkSize + size > 16) {
          offset = Math.ceil(offset / 16) * 16;
          uboElement.offset = offset;
          offset += size;
          chunkSize = size;
        } else {
          uboElement.offset = offset;
          chunkSize += size;
          offset += size;
        }
      }
      offset = Math.ceil(offset / 16) * 16;
      return { uboElements, size: offset };
    }
    function getUBOData(uniforms, uniformData) {
      var usedUniformDatas = [];
      for (var i in uniforms) {
        if (uniformData[i]) {
          usedUniformDatas.push(uniformData[i]);
        }
      }
      usedUniformDatas.sort(function(a, b) {
        return a.index - b.index;
      });
      return usedUniformDatas;
    }
    function generateUniformBufferSync(group, uniformData) {
      if (!group.autoManage) {
        return { size: 0, syncFunc: uboUpdate };
      }
      var usedUniformDatas = getUBOData(group.uniforms, uniformData);
      var _a = createUBOElements(usedUniformDatas), uboElements = _a.uboElements, size = _a.size;
      var funcFragments = ["\n    var v = null;\n    var v2 = null;\n    var cv = null;\n    var t = 0;\n    var gl = renderer.gl\n    var index = 0;\n    var data = buffer.data;\n    "];
      for (var i = 0; i < uboElements.length; i++) {
        var uboElement = uboElements[i];
        var uniform = group.uniforms[uboElement.data.name];
        var name2 = uboElement.data.name;
        var parsed = false;
        for (var j = 0; j < uniformParsers.length; j++) {
          var uniformParser = uniformParsers[j];
          if (uniformParser.codeUbo && uniformParser.test(uboElement.data, uniform)) {
            funcFragments.push("offset = " + uboElement.offset / 4 + ";", uniformParsers[j].codeUbo(uboElement.data.name, uniform));
            parsed = true;
            break;
          }
        }
        if (!parsed) {
          if (uboElement.data.size > 1) {
            var size_1 = mapSize(uboElement.data.type);
            var rowSize = Math.max(GLSL_TO_STD40_SIZE[uboElement.data.type] / 16, 1);
            var elementSize = size_1 / rowSize;
            var remainder = (4 - elementSize % 4) % 4;
            funcFragments.push("\n                cv = ud." + name2 + ".value;\n                v = uv." + name2 + ";\n                offset = " + uboElement.offset / 4 + ";\n\n                t = 0;\n\n                for(var i=0; i < " + uboElement.data.size * rowSize + "; i++)\n                {\n                    for(var j = 0; j < " + elementSize + "; j++)\n                    {\n                        data[offset++] = v[t++];\n                    }\n                    offset += " + remainder + ";\n                }\n\n                ");
          } else {
            var template2 = UBO_TO_SINGLE_SETTERS[uboElement.data.type];
            funcFragments.push("\n                cv = ud." + name2 + ".value;\n                v = uv." + name2 + ";\n                offset = " + uboElement.offset / 4 + ";\n                " + template2 + ";\n                ");
          }
        }
      }
      funcFragments.push("\n       renderer.buffer.update(buffer);\n    ");
      return {
        size,
        syncFunc: new Function("ud", "uv", "renderer", "syncData", "buffer", funcFragments.join("\n"))
      };
    }
    var IGLUniformData = function() {
      function IGLUniformData2() {
      }
      return IGLUniformData2;
    }();
    var GLProgram = function() {
      function GLProgram2(program, uniformData) {
        this.program = program;
        this.uniformData = uniformData;
        this.uniformGroups = {};
        this.uniformDirtyGroups = {};
        this.uniformBufferBindings = {};
      }
      GLProgram2.prototype.destroy = function() {
        this.uniformData = null;
        this.uniformGroups = null;
        this.uniformDirtyGroups = null;
        this.uniformBufferBindings = null;
        this.program = null;
      };
      return GLProgram2;
    }();
    function getAttributeData(program, gl) {
      var attributes = {};
      var totalAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
      for (var i = 0; i < totalAttributes; i++) {
        var attribData = gl.getActiveAttrib(program, i);
        if (attribData.name.indexOf("gl_") === 0) {
          continue;
        }
        var type = mapType(gl, attribData.type);
        var data = {
          type,
          name: attribData.name,
          size: mapSize(type),
          location: gl.getAttribLocation(program, attribData.name)
        };
        attributes[attribData.name] = data;
      }
      return attributes;
    }
    function getUniformData(program, gl) {
      var uniforms = {};
      var totalUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < totalUniforms; i++) {
        var uniformData = gl.getActiveUniform(program, i);
        var name2 = uniformData.name.replace(/\[.*?\]$/, "");
        var isArray = !!uniformData.name.match(/\[.*?\]$/);
        var type = mapType(gl, uniformData.type);
        uniforms[name2] = {
          name: name2,
          index: i,
          type,
          size: uniformData.size,
          isArray,
          value: defaultValue(type, uniformData.size)
        };
      }
      return uniforms;
    }
    function generateProgram(gl, program) {
      var glVertShader = compileShader(gl, gl.VERTEX_SHADER, program.vertexSrc);
      var glFragShader = compileShader(gl, gl.FRAGMENT_SHADER, program.fragmentSrc);
      var webGLProgram = gl.createProgram();
      gl.attachShader(webGLProgram, glVertShader);
      gl.attachShader(webGLProgram, glFragShader);
      gl.linkProgram(webGLProgram);
      if (!gl.getProgramParameter(webGLProgram, gl.LINK_STATUS)) {
        logProgramError(gl, webGLProgram, glVertShader, glFragShader);
      }
      program.attributeData = getAttributeData(webGLProgram, gl);
      program.uniformData = getUniformData(webGLProgram, gl);
      if (!/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(program.vertexSrc)) {
        var keys = Object.keys(program.attributeData);
        keys.sort(function(a, b) {
          return a > b ? 1 : -1;
        });
        for (var i = 0; i < keys.length; i++) {
          program.attributeData[keys[i]].location = i;
          gl.bindAttribLocation(webGLProgram, i, keys[i]);
        }
        gl.linkProgram(webGLProgram);
      }
      gl.deleteShader(glVertShader);
      gl.deleteShader(glFragShader);
      var uniformData = {};
      for (var i in program.uniformData) {
        var data = program.uniformData[i];
        uniformData[i] = {
          location: gl.getUniformLocation(webGLProgram, i),
          value: defaultValue(data.type, data.size)
        };
      }
      var glProgram = new GLProgram(webGLProgram, uniformData);
      return glProgram;
    }
    var UID$4 = 0;
    var defaultSyncData = { textureCount: 0, uboCount: 0 };
    var ShaderSystem = function() {
      function ShaderSystem2(renderer) {
        this.destroyed = false;
        this.renderer = renderer;
        this.systemCheck();
        this.gl = null;
        this.shader = null;
        this.program = null;
        this.cache = {};
        this._uboCache = {};
        this.id = UID$4++;
      }
      ShaderSystem2.prototype.systemCheck = function() {
        if (!unsafeEvalSupported()) {
          throw new Error("Current environment does not allow unsafe-eval, please use @pixi/unsafe-eval module to enable support.");
        }
      };
      ShaderSystem2.prototype.contextChange = function(gl) {
        this.gl = gl;
        this.reset();
      };
      ShaderSystem2.prototype.bind = function(shader, dontSync) {
        shader.uniforms.globals = this.renderer.globalUniforms;
        var program = shader.program;
        var glProgram = program.glPrograms[this.renderer.CONTEXT_UID] || this.generateProgram(shader);
        this.shader = shader;
        if (this.program !== program) {
          this.program = program;
          this.gl.useProgram(glProgram.program);
        }
        if (!dontSync) {
          defaultSyncData.textureCount = 0;
          defaultSyncData.uboCount = 0;
          this.syncUniformGroup(shader.uniformGroup, defaultSyncData);
        }
        return glProgram;
      };
      ShaderSystem2.prototype.setUniforms = function(uniforms) {
        var shader = this.shader.program;
        var glProgram = shader.glPrograms[this.renderer.CONTEXT_UID];
        shader.syncUniforms(glProgram.uniformData, uniforms, this.renderer);
      };
      ShaderSystem2.prototype.syncUniformGroup = function(group, syncData) {
        var glProgram = this.getGlProgram();
        if (!group.static || group.dirtyId !== glProgram.uniformDirtyGroups[group.id]) {
          glProgram.uniformDirtyGroups[group.id] = group.dirtyId;
          this.syncUniforms(group, glProgram, syncData);
        }
      };
      ShaderSystem2.prototype.syncUniforms = function(group, glProgram, syncData) {
        var syncFunc = group.syncUniforms[this.shader.program.id] || this.createSyncGroups(group);
        syncFunc(glProgram.uniformData, group.uniforms, this.renderer, syncData);
      };
      ShaderSystem2.prototype.createSyncGroups = function(group) {
        var id = this.getSignature(group, this.shader.program.uniformData, "u");
        if (!this.cache[id]) {
          this.cache[id] = generateUniformsSync(group, this.shader.program.uniformData);
        }
        group.syncUniforms[this.shader.program.id] = this.cache[id];
        return group.syncUniforms[this.shader.program.id];
      };
      ShaderSystem2.prototype.syncUniformBufferGroup = function(group, name2) {
        var glProgram = this.getGlProgram();
        if (!group.static || group.dirtyId !== 0 || !glProgram.uniformGroups[group.id]) {
          group.dirtyId = 0;
          var syncFunc = glProgram.uniformGroups[group.id] || this.createSyncBufferGroup(group, glProgram, name2);
          group.buffer.update();
          syncFunc(glProgram.uniformData, group.uniforms, this.renderer, defaultSyncData, group.buffer);
        }
        this.renderer.buffer.bindBufferBase(group.buffer, glProgram.uniformBufferBindings[name2]);
      };
      ShaderSystem2.prototype.createSyncBufferGroup = function(group, glProgram, name2) {
        var gl = this.renderer.gl;
        this.renderer.buffer.bind(group.buffer);
        var uniformBlockIndex = this.gl.getUniformBlockIndex(glProgram.program, name2);
        glProgram.uniformBufferBindings[name2] = this.shader.uniformBindCount;
        gl.uniformBlockBinding(glProgram.program, uniformBlockIndex, this.shader.uniformBindCount);
        this.shader.uniformBindCount++;
        var id = this.getSignature(group, this.shader.program.uniformData, "ubo");
        var uboData = this._uboCache[id];
        if (!uboData) {
          uboData = this._uboCache[id] = generateUniformBufferSync(group, this.shader.program.uniformData);
        }
        if (group.autoManage) {
          var data = new Float32Array(uboData.size / 4);
          group.buffer.update(data);
        }
        glProgram.uniformGroups[group.id] = uboData.syncFunc;
        return glProgram.uniformGroups[group.id];
      };
      ShaderSystem2.prototype.getSignature = function(group, uniformData, preFix) {
        var uniforms = group.uniforms;
        var strings = [preFix + "-"];
        for (var i in uniforms) {
          strings.push(i);
          if (uniformData[i]) {
            strings.push(uniformData[i].type);
          }
        }
        return strings.join("-");
      };
      ShaderSystem2.prototype.getGlProgram = function() {
        if (this.shader) {
          return this.shader.program.glPrograms[this.renderer.CONTEXT_UID];
        }
        return null;
      };
      ShaderSystem2.prototype.generateProgram = function(shader) {
        var gl = this.gl;
        var program = shader.program;
        var glProgram = generateProgram(gl, program);
        program.glPrograms[this.renderer.CONTEXT_UID] = glProgram;
        return glProgram;
      };
      ShaderSystem2.prototype.reset = function() {
        this.program = null;
        this.shader = null;
      };
      ShaderSystem2.prototype.destroy = function() {
        this.renderer = null;
        this.destroyed = true;
      };
      return ShaderSystem2;
    }();
    function mapWebGLBlendModesToPixi(gl, array) {
      if (array === void 0) {
        array = [];
      }
      array[constants.BLEND_MODES.NORMAL] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.ADD] = [gl.ONE, gl.ONE];
      array[constants.BLEND_MODES.MULTIPLY] = [gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.SCREEN] = [gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.OVERLAY] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.DARKEN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.LIGHTEN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.COLOR_DODGE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.COLOR_BURN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.HARD_LIGHT] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.SOFT_LIGHT] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.DIFFERENCE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.EXCLUSION] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.HUE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.SATURATION] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.COLOR] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.LUMINOSITY] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.NONE] = [0, 0];
      array[constants.BLEND_MODES.NORMAL_NPM] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.ADD_NPM] = [gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE];
      array[constants.BLEND_MODES.SCREEN_NPM] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.SRC_IN] = [gl.DST_ALPHA, gl.ZERO];
      array[constants.BLEND_MODES.SRC_OUT] = [gl.ONE_MINUS_DST_ALPHA, gl.ZERO];
      array[constants.BLEND_MODES.SRC_ATOP] = [gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.DST_OVER] = [gl.ONE_MINUS_DST_ALPHA, gl.ONE];
      array[constants.BLEND_MODES.DST_IN] = [gl.ZERO, gl.SRC_ALPHA];
      array[constants.BLEND_MODES.DST_OUT] = [gl.ZERO, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.DST_ATOP] = [gl.ONE_MINUS_DST_ALPHA, gl.SRC_ALPHA];
      array[constants.BLEND_MODES.XOR] = [gl.ONE_MINUS_DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
      array[constants.BLEND_MODES.SUBTRACT] = [gl.ONE, gl.ONE, gl.ONE, gl.ONE, gl.FUNC_REVERSE_SUBTRACT, gl.FUNC_ADD];
      return array;
    }
    var BLEND$1 = 0;
    var OFFSET$1 = 1;
    var CULLING$1 = 2;
    var DEPTH_TEST$1 = 3;
    var WINDING$1 = 4;
    var DEPTH_MASK$1 = 5;
    var StateSystem = function() {
      function StateSystem2() {
        this.gl = null;
        this.stateId = 0;
        this.polygonOffset = 0;
        this.blendMode = constants.BLEND_MODES.NONE;
        this._blendEq = false;
        this.map = [];
        this.map[BLEND$1] = this.setBlend;
        this.map[OFFSET$1] = this.setOffset;
        this.map[CULLING$1] = this.setCullFace;
        this.map[DEPTH_TEST$1] = this.setDepthTest;
        this.map[WINDING$1] = this.setFrontFace;
        this.map[DEPTH_MASK$1] = this.setDepthMask;
        this.checks = [];
        this.defaultState = new State();
        this.defaultState.blend = true;
      }
      StateSystem2.prototype.contextChange = function(gl) {
        this.gl = gl;
        this.blendModes = mapWebGLBlendModesToPixi(gl);
        this.set(this.defaultState);
        this.reset();
      };
      StateSystem2.prototype.set = function(state) {
        state = state || this.defaultState;
        if (this.stateId !== state.data) {
          var diff = this.stateId ^ state.data;
          var i = 0;
          while (diff) {
            if (diff & 1) {
              this.map[i].call(this, !!(state.data & 1 << i));
            }
            diff = diff >> 1;
            i++;
          }
          this.stateId = state.data;
        }
        for (var i = 0; i < this.checks.length; i++) {
          this.checks[i](this, state);
        }
      };
      StateSystem2.prototype.forceState = function(state) {
        state = state || this.defaultState;
        for (var i = 0; i < this.map.length; i++) {
          this.map[i].call(this, !!(state.data & 1 << i));
        }
        for (var i = 0; i < this.checks.length; i++) {
          this.checks[i](this, state);
        }
        this.stateId = state.data;
      };
      StateSystem2.prototype.setBlend = function(value) {
        this.updateCheck(StateSystem2.checkBlendMode, value);
        this.gl[value ? "enable" : "disable"](this.gl.BLEND);
      };
      StateSystem2.prototype.setOffset = function(value) {
        this.updateCheck(StateSystem2.checkPolygonOffset, value);
        this.gl[value ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL);
      };
      StateSystem2.prototype.setDepthTest = function(value) {
        this.gl[value ? "enable" : "disable"](this.gl.DEPTH_TEST);
      };
      StateSystem2.prototype.setDepthMask = function(value) {
        this.gl.depthMask(value);
      };
      StateSystem2.prototype.setCullFace = function(value) {
        this.gl[value ? "enable" : "disable"](this.gl.CULL_FACE);
      };
      StateSystem2.prototype.setFrontFace = function(value) {
        this.gl.frontFace(this.gl[value ? "CW" : "CCW"]);
      };
      StateSystem2.prototype.setBlendMode = function(value) {
        if (value === this.blendMode) {
          return;
        }
        this.blendMode = value;
        var mode = this.blendModes[value];
        var gl = this.gl;
        if (mode.length === 2) {
          gl.blendFunc(mode[0], mode[1]);
        } else {
          gl.blendFuncSeparate(mode[0], mode[1], mode[2], mode[3]);
        }
        if (mode.length === 6) {
          this._blendEq = true;
          gl.blendEquationSeparate(mode[4], mode[5]);
        } else if (this._blendEq) {
          this._blendEq = false;
          gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        }
      };
      StateSystem2.prototype.setPolygonOffset = function(value, scale) {
        this.gl.polygonOffset(value, scale);
      };
      StateSystem2.prototype.reset = function() {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
        this.forceState(this.defaultState);
        this._blendEq = true;
        this.blendMode = -1;
        this.setBlendMode(0);
      };
      StateSystem2.prototype.updateCheck = function(func, value) {
        var index = this.checks.indexOf(func);
        if (value && index === -1) {
          this.checks.push(func);
        } else if (!value && index !== -1) {
          this.checks.splice(index, 1);
        }
      };
      StateSystem2.checkBlendMode = function(system, state) {
        system.setBlendMode(state.blendMode);
      };
      StateSystem2.checkPolygonOffset = function(system, state) {
        system.setPolygonOffset(1, state.polygonOffset);
      };
      StateSystem2.prototype.destroy = function() {
        this.gl = null;
      };
      return StateSystem2;
    }();
    var TextureGCSystem = function() {
      function TextureGCSystem2(renderer) {
        this.renderer = renderer;
        this.count = 0;
        this.checkCount = 0;
        this.maxIdle = settings.settings.GC_MAX_IDLE;
        this.checkCountMax = settings.settings.GC_MAX_CHECK_COUNT;
        this.mode = settings.settings.GC_MODE;
      }
      TextureGCSystem2.prototype.postrender = function() {
        if (!this.renderer.renderingToScreen) {
          return;
        }
        this.count++;
        if (this.mode === constants.GC_MODES.MANUAL) {
          return;
        }
        this.checkCount++;
        if (this.checkCount > this.checkCountMax) {
          this.checkCount = 0;
          this.run();
        }
      };
      TextureGCSystem2.prototype.run = function() {
        var tm = this.renderer.texture;
        var managedTextures = tm.managedTextures;
        var wasRemoved = false;
        for (var i = 0; i < managedTextures.length; i++) {
          var texture = managedTextures[i];
          if (!texture.framebuffer && this.count - texture.touched > this.maxIdle) {
            tm.destroyTexture(texture, true);
            managedTextures[i] = null;
            wasRemoved = true;
          }
        }
        if (wasRemoved) {
          var j = 0;
          for (var i = 0; i < managedTextures.length; i++) {
            if (managedTextures[i] !== null) {
              managedTextures[j++] = managedTextures[i];
            }
          }
          managedTextures.length = j;
        }
      };
      TextureGCSystem2.prototype.unload = function(displayObject) {
        var tm = this.renderer.texture;
        var texture = displayObject._texture;
        if (texture && !texture.framebuffer) {
          tm.destroyTexture(texture);
        }
        for (var i = displayObject.children.length - 1; i >= 0; i--) {
          this.unload(displayObject.children[i]);
        }
      };
      TextureGCSystem2.prototype.destroy = function() {
        this.renderer = null;
      };
      return TextureGCSystem2;
    }();
    function mapTypeAndFormatToInternalFormat(gl) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
      var table;
      if ("WebGL2RenderingContext" in self && gl instanceof self.WebGL2RenderingContext) {
        table = (_a = {}, _a[constants.TYPES.UNSIGNED_BYTE] = (_b = {}, _b[constants.FORMATS.RGBA] = gl.RGBA8, _b[constants.FORMATS.RGB] = gl.RGB8, _b[constants.FORMATS.RG] = gl.RG8, _b[constants.FORMATS.RED] = gl.R8, _b[constants.FORMATS.RGBA_INTEGER] = gl.RGBA8UI, _b[constants.FORMATS.RGB_INTEGER] = gl.RGB8UI, _b[constants.FORMATS.RG_INTEGER] = gl.RG8UI, _b[constants.FORMATS.RED_INTEGER] = gl.R8UI, _b[constants.FORMATS.ALPHA] = gl.ALPHA, _b[constants.FORMATS.LUMINANCE] = gl.LUMINANCE, _b[constants.FORMATS.LUMINANCE_ALPHA] = gl.LUMINANCE_ALPHA, _b), _a[constants.TYPES.BYTE] = (_c = {}, _c[constants.FORMATS.RGBA] = gl.RGBA8_SNORM, _c[constants.FORMATS.RGB] = gl.RGB8_SNORM, _c[constants.FORMATS.RG] = gl.RG8_SNORM, _c[constants.FORMATS.RED] = gl.R8_SNORM, _c[constants.FORMATS.RGBA_INTEGER] = gl.RGBA8I, _c[constants.FORMATS.RGB_INTEGER] = gl.RGB8I, _c[constants.FORMATS.RG_INTEGER] = gl.RG8I, _c[constants.FORMATS.RED_INTEGER] = gl.R8I, _c), _a[constants.TYPES.UNSIGNED_SHORT] = (_d = {}, _d[constants.FORMATS.RGBA_INTEGER] = gl.RGBA16UI, _d[constants.FORMATS.RGB_INTEGER] = gl.RGB16UI, _d[constants.FORMATS.RG_INTEGER] = gl.RG16UI, _d[constants.FORMATS.RED_INTEGER] = gl.R16UI, _d[constants.FORMATS.DEPTH_COMPONENT] = gl.DEPTH_COMPONENT16, _d), _a[constants.TYPES.SHORT] = (_e = {}, _e[constants.FORMATS.RGBA_INTEGER] = gl.RGBA16I, _e[constants.FORMATS.RGB_INTEGER] = gl.RGB16I, _e[constants.FORMATS.RG_INTEGER] = gl.RG16I, _e[constants.FORMATS.RED_INTEGER] = gl.R16I, _e), _a[constants.TYPES.UNSIGNED_INT] = (_f = {}, _f[constants.FORMATS.RGBA_INTEGER] = gl.RGBA32UI, _f[constants.FORMATS.RGB_INTEGER] = gl.RGB32UI, _f[constants.FORMATS.RG_INTEGER] = gl.RG32UI, _f[constants.FORMATS.RED_INTEGER] = gl.R32UI, _f[constants.FORMATS.DEPTH_COMPONENT] = gl.DEPTH_COMPONENT24, _f), _a[constants.TYPES.INT] = (_g = {}, _g[constants.FORMATS.RGBA_INTEGER] = gl.RGBA32I, _g[constants.FORMATS.RGB_INTEGER] = gl.RGB32I, _g[constants.FORMATS.RG_INTEGER] = gl.RG32I, _g[constants.FORMATS.RED_INTEGER] = gl.R32I, _g), _a[constants.TYPES.FLOAT] = (_h = {}, _h[constants.FORMATS.RGBA] = gl.RGBA32F, _h[constants.FORMATS.RGB] = gl.RGB32F, _h[constants.FORMATS.RG] = gl.RG32F, _h[constants.FORMATS.RED] = gl.R32F, _h[constants.FORMATS.DEPTH_COMPONENT] = gl.DEPTH_COMPONENT32F, _h), _a[constants.TYPES.HALF_FLOAT] = (_j = {}, _j[constants.FORMATS.RGBA] = gl.RGBA16F, _j[constants.FORMATS.RGB] = gl.RGB16F, _j[constants.FORMATS.RG] = gl.RG16F, _j[constants.FORMATS.RED] = gl.R16F, _j), _a[constants.TYPES.UNSIGNED_SHORT_5_6_5] = (_k = {}, _k[constants.FORMATS.RGB] = gl.RGB565, _k), _a[constants.TYPES.UNSIGNED_SHORT_4_4_4_4] = (_l = {}, _l[constants.FORMATS.RGBA] = gl.RGBA4, _l), _a[constants.TYPES.UNSIGNED_SHORT_5_5_5_1] = (_m = {}, _m[constants.FORMATS.RGBA] = gl.RGB5_A1, _m), _a[constants.TYPES.UNSIGNED_INT_2_10_10_10_REV] = (_o = {}, _o[constants.FORMATS.RGBA] = gl.RGB10_A2, _o[constants.FORMATS.RGBA_INTEGER] = gl.RGB10_A2UI, _o), _a[constants.TYPES.UNSIGNED_INT_10F_11F_11F_REV] = (_p = {}, _p[constants.FORMATS.RGB] = gl.R11F_G11F_B10F, _p), _a[constants.TYPES.UNSIGNED_INT_5_9_9_9_REV] = (_q = {}, _q[constants.FORMATS.RGB] = gl.RGB9_E5, _q), _a[constants.TYPES.UNSIGNED_INT_24_8] = (_r = {}, _r[constants.FORMATS.DEPTH_STENCIL] = gl.DEPTH24_STENCIL8, _r), _a[constants.TYPES.FLOAT_32_UNSIGNED_INT_24_8_REV] = (_s = {}, _s[constants.FORMATS.DEPTH_STENCIL] = gl.DEPTH32F_STENCIL8, _s), _a);
      } else {
        table = (_t = {}, _t[constants.TYPES.UNSIGNED_BYTE] = (_u = {}, _u[constants.FORMATS.RGBA] = gl.RGBA, _u[constants.FORMATS.RGB] = gl.RGB, _u[constants.FORMATS.ALPHA] = gl.ALPHA, _u[constants.FORMATS.LUMINANCE] = gl.LUMINANCE, _u[constants.FORMATS.LUMINANCE_ALPHA] = gl.LUMINANCE_ALPHA, _u), _t[constants.TYPES.UNSIGNED_SHORT_5_6_5] = (_v = {}, _v[constants.FORMATS.RGB] = gl.RGB, _v), _t[constants.TYPES.UNSIGNED_SHORT_4_4_4_4] = (_w = {}, _w[constants.FORMATS.RGBA] = gl.RGBA, _w), _t[constants.TYPES.UNSIGNED_SHORT_5_5_5_1] = (_x = {}, _x[constants.FORMATS.RGBA] = gl.RGBA, _x), _t);
      }
      return table;
    }
    var GLTexture = function() {
      function GLTexture2(texture) {
        this.texture = texture;
        this.width = -1;
        this.height = -1;
        this.dirtyId = -1;
        this.dirtyStyleId = -1;
        this.mipmap = false;
        this.wrapMode = 33071;
        this.type = constants.TYPES.UNSIGNED_BYTE;
        this.internalFormat = constants.FORMATS.RGBA;
        this.samplerType = 0;
      }
      return GLTexture2;
    }();
    var TextureSystem = function() {
      function TextureSystem2(renderer) {
        this.renderer = renderer;
        this.boundTextures = [];
        this.currentLocation = -1;
        this.managedTextures = [];
        this._unknownBoundTextures = false;
        this.unknownTexture = new BaseTexture();
        this.hasIntegerTextures = false;
      }
      TextureSystem2.prototype.contextChange = function() {
        var gl = this.gl = this.renderer.gl;
        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
        this.webGLVersion = this.renderer.context.webGLVersion;
        this.internalFormats = mapTypeAndFormatToInternalFormat(gl);
        var maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        this.boundTextures.length = maxTextures;
        for (var i = 0; i < maxTextures; i++) {
          this.boundTextures[i] = null;
        }
        this.emptyTextures = {};
        var emptyTexture2D = new GLTexture(gl.createTexture());
        gl.bindTexture(gl.TEXTURE_2D, emptyTexture2D.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
        this.emptyTextures[gl.TEXTURE_2D] = emptyTexture2D;
        this.emptyTextures[gl.TEXTURE_CUBE_MAP] = new GLTexture(gl.createTexture());
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.emptyTextures[gl.TEXTURE_CUBE_MAP].texture);
        for (var i = 0; i < 6; i++) {
          gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        for (var i = 0; i < this.boundTextures.length; i++) {
          this.bind(null, i);
        }
      };
      TextureSystem2.prototype.bind = function(texture, location) {
        if (location === void 0) {
          location = 0;
        }
        var gl = this.gl;
        texture = texture === null || texture === void 0 ? void 0 : texture.castToBaseTexture();
        if (texture && texture.valid && !texture.parentTextureArray) {
          texture.touched = this.renderer.textureGC.count;
          var glTexture = texture._glTextures[this.CONTEXT_UID] || this.initTexture(texture);
          if (this.boundTextures[location] !== texture) {
            if (this.currentLocation !== location) {
              this.currentLocation = location;
              gl.activeTexture(gl.TEXTURE0 + location);
            }
            gl.bindTexture(texture.target, glTexture.texture);
          }
          if (glTexture.dirtyId !== texture.dirtyId) {
            if (this.currentLocation !== location) {
              this.currentLocation = location;
              gl.activeTexture(gl.TEXTURE0 + location);
            }
            this.updateTexture(texture);
          }
          this.boundTextures[location] = texture;
        } else {
          if (this.currentLocation !== location) {
            this.currentLocation = location;
            gl.activeTexture(gl.TEXTURE0 + location);
          }
          gl.bindTexture(gl.TEXTURE_2D, this.emptyTextures[gl.TEXTURE_2D].texture);
          this.boundTextures[location] = null;
        }
      };
      TextureSystem2.prototype.reset = function() {
        this._unknownBoundTextures = true;
        this.hasIntegerTextures = false;
        this.currentLocation = -1;
        for (var i = 0; i < this.boundTextures.length; i++) {
          this.boundTextures[i] = this.unknownTexture;
        }
      };
      TextureSystem2.prototype.unbind = function(texture) {
        var _a = this, gl = _a.gl, boundTextures = _a.boundTextures;
        if (this._unknownBoundTextures) {
          this._unknownBoundTextures = false;
          for (var i = 0; i < boundTextures.length; i++) {
            if (boundTextures[i] === this.unknownTexture) {
              this.bind(null, i);
            }
          }
        }
        for (var i = 0; i < boundTextures.length; i++) {
          if (boundTextures[i] === texture) {
            if (this.currentLocation !== i) {
              gl.activeTexture(gl.TEXTURE0 + i);
              this.currentLocation = i;
            }
            gl.bindTexture(texture.target, this.emptyTextures[texture.target].texture);
            boundTextures[i] = null;
          }
        }
      };
      TextureSystem2.prototype.ensureSamplerType = function(maxTextures) {
        var _a = this, boundTextures = _a.boundTextures, hasIntegerTextures = _a.hasIntegerTextures, CONTEXT_UID = _a.CONTEXT_UID;
        if (!hasIntegerTextures) {
          return;
        }
        for (var i = maxTextures - 1; i >= 0; --i) {
          var tex = boundTextures[i];
          if (tex) {
            var glTexture = tex._glTextures[CONTEXT_UID];
            if (glTexture.samplerType !== constants.SAMPLER_TYPES.FLOAT) {
              this.renderer.texture.unbind(tex);
            }
          }
        }
      };
      TextureSystem2.prototype.initTexture = function(texture) {
        var glTexture = new GLTexture(this.gl.createTexture());
        glTexture.dirtyId = -1;
        texture._glTextures[this.CONTEXT_UID] = glTexture;
        this.managedTextures.push(texture);
        texture.on("dispose", this.destroyTexture, this);
        return glTexture;
      };
      TextureSystem2.prototype.initTextureType = function(texture, glTexture) {
        var _a, _b;
        glTexture.internalFormat = (_b = (_a = this.internalFormats[texture.type]) === null || _a === void 0 ? void 0 : _a[texture.format]) !== null && _b !== void 0 ? _b : texture.format;
        if (this.webGLVersion === 2 && texture.type === constants.TYPES.HALF_FLOAT) {
          glTexture.type = this.gl.HALF_FLOAT;
        } else {
          glTexture.type = texture.type;
        }
      };
      TextureSystem2.prototype.updateTexture = function(texture) {
        var glTexture = texture._glTextures[this.CONTEXT_UID];
        if (!glTexture) {
          return;
        }
        var renderer = this.renderer;
        this.initTextureType(texture, glTexture);
        if (texture.resource && texture.resource.upload(renderer, texture, glTexture)) {
          if (glTexture.samplerType !== constants.SAMPLER_TYPES.FLOAT) {
            this.hasIntegerTextures = true;
          }
        } else {
          var width = texture.realWidth;
          var height = texture.realHeight;
          var gl = renderer.gl;
          if (glTexture.width !== width || glTexture.height !== height || glTexture.dirtyId < 0) {
            glTexture.width = width;
            glTexture.height = height;
            gl.texImage2D(texture.target, 0, glTexture.internalFormat, width, height, 0, texture.format, glTexture.type, null);
          }
        }
        if (texture.dirtyStyleId !== glTexture.dirtyStyleId) {
          this.updateTextureStyle(texture);
        }
        glTexture.dirtyId = texture.dirtyId;
      };
      TextureSystem2.prototype.destroyTexture = function(texture, skipRemove) {
        var gl = this.gl;
        texture = texture.castToBaseTexture();
        if (texture._glTextures[this.CONTEXT_UID]) {
          this.unbind(texture);
          gl.deleteTexture(texture._glTextures[this.CONTEXT_UID].texture);
          texture.off("dispose", this.destroyTexture, this);
          delete texture._glTextures[this.CONTEXT_UID];
          if (!skipRemove) {
            var i = this.managedTextures.indexOf(texture);
            if (i !== -1) {
              utils.removeItems(this.managedTextures, i, 1);
            }
          }
        }
      };
      TextureSystem2.prototype.updateTextureStyle = function(texture) {
        var glTexture = texture._glTextures[this.CONTEXT_UID];
        if (!glTexture) {
          return;
        }
        if ((texture.mipmap === constants.MIPMAP_MODES.POW2 || this.webGLVersion !== 2) && !texture.isPowerOfTwo) {
          glTexture.mipmap = false;
        } else {
          glTexture.mipmap = texture.mipmap >= 1;
        }
        if (this.webGLVersion !== 2 && !texture.isPowerOfTwo) {
          glTexture.wrapMode = constants.WRAP_MODES.CLAMP;
        } else {
          glTexture.wrapMode = texture.wrapMode;
        }
        if (texture.resource && texture.resource.style(this.renderer, texture, glTexture))
          ;
        else {
          this.setStyle(texture, glTexture);
        }
        glTexture.dirtyStyleId = texture.dirtyStyleId;
      };
      TextureSystem2.prototype.setStyle = function(texture, glTexture) {
        var gl = this.gl;
        if (glTexture.mipmap && texture.mipmap !== constants.MIPMAP_MODES.ON_MANUAL) {
          gl.generateMipmap(texture.target);
        }
        gl.texParameteri(texture.target, gl.TEXTURE_WRAP_S, glTexture.wrapMode);
        gl.texParameteri(texture.target, gl.TEXTURE_WRAP_T, glTexture.wrapMode);
        if (glTexture.mipmap) {
          gl.texParameteri(texture.target, gl.TEXTURE_MIN_FILTER, texture.scaleMode === constants.SCALE_MODES.LINEAR ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST);
          var anisotropicExt = this.renderer.context.extensions.anisotropicFiltering;
          if (anisotropicExt && texture.anisotropicLevel > 0 && texture.scaleMode === constants.SCALE_MODES.LINEAR) {
            var level = Math.min(texture.anisotropicLevel, gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
            gl.texParameterf(texture.target, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, level);
          }
        } else {
          gl.texParameteri(texture.target, gl.TEXTURE_MIN_FILTER, texture.scaleMode === constants.SCALE_MODES.LINEAR ? gl.LINEAR : gl.NEAREST);
        }
        gl.texParameteri(texture.target, gl.TEXTURE_MAG_FILTER, texture.scaleMode === constants.SCALE_MODES.LINEAR ? gl.LINEAR : gl.NEAREST);
      };
      TextureSystem2.prototype.destroy = function() {
        this.renderer = null;
      };
      return TextureSystem2;
    }();
    var _systems = {
      __proto__: null,
      FilterSystem,
      BatchSystem,
      ContextSystem,
      FramebufferSystem,
      GeometrySystem,
      MaskSystem,
      ScissorSystem,
      StencilSystem,
      ProjectionSystem,
      RenderTextureSystem,
      ShaderSystem,
      StateSystem,
      TextureGCSystem,
      TextureSystem
    };
    var tempMatrix$2 = new math.Matrix();
    var AbstractRenderer = function(_super) {
      __extends(AbstractRenderer2, _super);
      function AbstractRenderer2(type, options2) {
        if (type === void 0) {
          type = constants.RENDERER_TYPE.UNKNOWN;
        }
        var _this = _super.call(this) || this;
        options2 = Object.assign({}, settings.settings.RENDER_OPTIONS, options2);
        _this.options = options2;
        _this.type = type;
        _this.screen = new math.Rectangle(0, 0, options2.width, options2.height);
        _this.view = options2.view || document.createElement("canvas");
        _this.resolution = options2.resolution || settings.settings.RESOLUTION;
        _this.useContextAlpha = options2.useContextAlpha;
        _this.autoDensity = !!options2.autoDensity;
        _this.preserveDrawingBuffer = options2.preserveDrawingBuffer;
        _this.clearBeforeRender = options2.clearBeforeRender;
        _this._backgroundColor = 0;
        _this._backgroundColorRgba = [0, 0, 0, 1];
        _this._backgroundColorString = "#000000";
        _this.backgroundColor = options2.backgroundColor || _this._backgroundColor;
        _this.backgroundAlpha = options2.backgroundAlpha;
        if (options2.transparent !== void 0) {
          utils.deprecation("6.0.0", "Option transparent is deprecated, please use backgroundAlpha instead.");
          _this.useContextAlpha = options2.transparent;
          _this.backgroundAlpha = options2.transparent ? 0 : 1;
        }
        _this._lastObjectRendered = null;
        _this.plugins = {};
        return _this;
      }
      AbstractRenderer2.prototype.initPlugins = function(staticMap) {
        for (var o in staticMap) {
          this.plugins[o] = new staticMap[o](this);
        }
      };
      Object.defineProperty(AbstractRenderer2.prototype, "width", {
        get: function() {
          return this.view.width;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(AbstractRenderer2.prototype, "height", {
        get: function() {
          return this.view.height;
        },
        enumerable: false,
        configurable: true
      });
      AbstractRenderer2.prototype.resize = function(desiredScreenWidth, desiredScreenHeight) {
        this.view.width = Math.round(desiredScreenWidth * this.resolution);
        this.view.height = Math.round(desiredScreenHeight * this.resolution);
        var screenWidth = this.view.width / this.resolution;
        var screenHeight = this.view.height / this.resolution;
        this.screen.width = screenWidth;
        this.screen.height = screenHeight;
        if (this.autoDensity) {
          this.view.style.width = screenWidth + "px";
          this.view.style.height = screenHeight + "px";
        }
        this.emit("resize", screenWidth, screenHeight);
      };
      AbstractRenderer2.prototype.generateTexture = function(displayObject, options2, resolution, region) {
        if (options2 === void 0) {
          options2 = {};
        }
        if (typeof options2 === "number") {
          utils.deprecation("6.1.0", "generateTexture options (scaleMode, resolution, region) are now object options.");
          options2 = { scaleMode: options2, resolution, region };
        }
        var manualRegion = options2.region, textureOptions = __rest(options2, ["region"]);
        region = manualRegion || displayObject.getLocalBounds(null, true);
        if (region.width === 0) {
          region.width = 1;
        }
        if (region.height === 0) {
          region.height = 1;
        }
        var renderTexture = RenderTexture.create(__assign({ width: region.width, height: region.height }, textureOptions));
        tempMatrix$2.tx = -region.x;
        tempMatrix$2.ty = -region.y;
        this.render(displayObject, {
          renderTexture,
          clear: false,
          transform: tempMatrix$2,
          skipUpdateTransform: !!displayObject.parent
        });
        return renderTexture;
      };
      AbstractRenderer2.prototype.destroy = function(removeView) {
        for (var o in this.plugins) {
          this.plugins[o].destroy();
          this.plugins[o] = null;
        }
        if (removeView && this.view.parentNode) {
          this.view.parentNode.removeChild(this.view);
        }
        var thisAny = this;
        thisAny.plugins = null;
        thisAny.type = constants.RENDERER_TYPE.UNKNOWN;
        thisAny.view = null;
        thisAny.screen = null;
        thisAny._tempDisplayObjectParent = null;
        thisAny.options = null;
        this._backgroundColorRgba = null;
        this._backgroundColorString = null;
        this._lastObjectRendered = null;
      };
      Object.defineProperty(AbstractRenderer2.prototype, "backgroundColor", {
        get: function() {
          return this._backgroundColor;
        },
        set: function(value) {
          this._backgroundColor = value;
          this._backgroundColorString = utils.hex2string(value);
          utils.hex2rgb(value, this._backgroundColorRgba);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(AbstractRenderer2.prototype, "backgroundAlpha", {
        get: function() {
          return this._backgroundColorRgba[3];
        },
        set: function(value) {
          this._backgroundColorRgba[3] = value;
        },
        enumerable: false,
        configurable: true
      });
      return AbstractRenderer2;
    }(utils.EventEmitter);
    var GLBuffer = function() {
      function GLBuffer2(buffer) {
        this.buffer = buffer || null;
        this.updateID = -1;
        this.byteLength = -1;
        this.refCount = 0;
      }
      return GLBuffer2;
    }();
    var BufferSystem = function() {
      function BufferSystem2(renderer) {
        this.renderer = renderer;
        this.managedBuffers = {};
        this.boundBufferBases = {};
      }
      BufferSystem2.prototype.destroy = function() {
        this.renderer = null;
      };
      BufferSystem2.prototype.contextChange = function() {
        this.disposeAll(true);
        this.gl = this.renderer.gl;
        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
      };
      BufferSystem2.prototype.bind = function(buffer) {
        var _a = this, gl = _a.gl, CONTEXT_UID = _a.CONTEXT_UID;
        var glBuffer = buffer._glBuffers[CONTEXT_UID] || this.createGLBuffer(buffer);
        gl.bindBuffer(buffer.type, glBuffer.buffer);
      };
      BufferSystem2.prototype.bindBufferBase = function(buffer, index) {
        var _a = this, gl = _a.gl, CONTEXT_UID = _a.CONTEXT_UID;
        if (this.boundBufferBases[index] !== buffer) {
          var glBuffer = buffer._glBuffers[CONTEXT_UID] || this.createGLBuffer(buffer);
          this.boundBufferBases[index] = buffer;
          gl.bindBufferBase(gl.UNIFORM_BUFFER, index, glBuffer.buffer);
        }
      };
      BufferSystem2.prototype.bindBufferRange = function(buffer, index, offset) {
        var _a = this, gl = _a.gl, CONTEXT_UID = _a.CONTEXT_UID;
        offset = offset || 0;
        var glBuffer = buffer._glBuffers[CONTEXT_UID] || this.createGLBuffer(buffer);
        gl.bindBufferRange(gl.UNIFORM_BUFFER, index || 0, glBuffer.buffer, offset * 256, 256);
      };
      BufferSystem2.prototype.update = function(buffer) {
        var _a = this, gl = _a.gl, CONTEXT_UID = _a.CONTEXT_UID;
        var glBuffer = buffer._glBuffers[CONTEXT_UID];
        if (buffer._updateID === glBuffer.updateID) {
          return;
        }
        glBuffer.updateID = buffer._updateID;
        gl.bindBuffer(buffer.type, glBuffer.buffer);
        if (glBuffer.byteLength >= buffer.data.byteLength) {
          gl.bufferSubData(buffer.type, 0, buffer.data);
        } else {
          var drawType = buffer.static ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
          glBuffer.byteLength = buffer.data.byteLength;
          gl.bufferData(buffer.type, buffer.data, drawType);
        }
      };
      BufferSystem2.prototype.dispose = function(buffer, contextLost) {
        if (!this.managedBuffers[buffer.id]) {
          return;
        }
        delete this.managedBuffers[buffer.id];
        var glBuffer = buffer._glBuffers[this.CONTEXT_UID];
        var gl = this.gl;
        buffer.disposeRunner.remove(this);
        if (!glBuffer) {
          return;
        }
        if (!contextLost) {
          gl.deleteBuffer(glBuffer.buffer);
        }
        delete buffer._glBuffers[this.CONTEXT_UID];
      };
      BufferSystem2.prototype.disposeAll = function(contextLost) {
        var all = Object.keys(this.managedBuffers);
        for (var i = 0; i < all.length; i++) {
          this.dispose(this.managedBuffers[all[i]], contextLost);
        }
      };
      BufferSystem2.prototype.createGLBuffer = function(buffer) {
        var _a = this, CONTEXT_UID = _a.CONTEXT_UID, gl = _a.gl;
        buffer._glBuffers[CONTEXT_UID] = new GLBuffer(gl.createBuffer());
        this.managedBuffers[buffer.id] = buffer;
        buffer.disposeRunner.add(this);
        return buffer._glBuffers[CONTEXT_UID];
      };
      return BufferSystem2;
    }();
    var Renderer2 = function(_super) {
      __extends(Renderer3, _super);
      function Renderer3(options2) {
        var _this = _super.call(this, constants.RENDERER_TYPE.WEBGL, options2) || this;
        options2 = _this.options;
        _this.gl = null;
        _this.CONTEXT_UID = 0;
        _this.runners = {
          destroy: new runner.Runner("destroy"),
          contextChange: new runner.Runner("contextChange"),
          reset: new runner.Runner("reset"),
          update: new runner.Runner("update"),
          postrender: new runner.Runner("postrender"),
          prerender: new runner.Runner("prerender"),
          resize: new runner.Runner("resize")
        };
        _this.runners.contextChange.add(_this);
        _this.globalUniforms = new UniformGroup({
          projectionMatrix: new math.Matrix()
        }, true);
        _this.addSystem(MaskSystem, "mask").addSystem(ContextSystem, "context").addSystem(StateSystem, "state").addSystem(ShaderSystem, "shader").addSystem(TextureSystem, "texture").addSystem(BufferSystem, "buffer").addSystem(GeometrySystem, "geometry").addSystem(FramebufferSystem, "framebuffer").addSystem(ScissorSystem, "scissor").addSystem(StencilSystem, "stencil").addSystem(ProjectionSystem, "projection").addSystem(TextureGCSystem, "textureGC").addSystem(FilterSystem, "filter").addSystem(RenderTextureSystem, "renderTexture").addSystem(BatchSystem, "batch");
        _this.initPlugins(Renderer3.__plugins);
        _this.multisample = void 0;
        if (options2.context) {
          _this.context.initFromContext(options2.context);
        } else {
          _this.context.initFromOptions({
            alpha: !!_this.useContextAlpha,
            antialias: options2.antialias,
            premultipliedAlpha: _this.useContextAlpha && _this.useContextAlpha !== "notMultiplied",
            stencil: true,
            preserveDrawingBuffer: options2.preserveDrawingBuffer,
            powerPreference: _this.options.powerPreference
          });
        }
        _this.renderingToScreen = true;
        utils.sayHello(_this.context.webGLVersion === 2 ? "WebGL 2" : "WebGL 1");
        _this.resize(_this.options.width, _this.options.height);
        return _this;
      }
      Renderer3.create = function(options2) {
        if (utils.isWebGLSupported()) {
          return new Renderer3(options2);
        }
        throw new Error('WebGL unsupported in this browser, use "pixi.js-legacy" for fallback canvas2d support.');
      };
      Renderer3.prototype.contextChange = function() {
        var gl = this.gl;
        var samples;
        if (this.context.webGLVersion === 1) {
          var framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          samples = gl.getParameter(gl.SAMPLES);
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        } else {
          var framebuffer = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);
          gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
          samples = gl.getParameter(gl.SAMPLES);
          gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
        }
        if (samples >= constants.MSAA_QUALITY.HIGH) {
          this.multisample = constants.MSAA_QUALITY.HIGH;
        } else if (samples >= constants.MSAA_QUALITY.MEDIUM) {
          this.multisample = constants.MSAA_QUALITY.MEDIUM;
        } else if (samples >= constants.MSAA_QUALITY.LOW) {
          this.multisample = constants.MSAA_QUALITY.LOW;
        } else {
          this.multisample = constants.MSAA_QUALITY.NONE;
        }
      };
      Renderer3.prototype.addSystem = function(ClassRef, name2) {
        var system = new ClassRef(this);
        if (this[name2]) {
          throw new Error('Whoops! The name "' + name2 + '" is already in use');
        }
        this[name2] = system;
        for (var i in this.runners) {
          this.runners[i].add(system);
        }
        return this;
      };
      Renderer3.prototype.render = function(displayObject, options2) {
        var renderTexture;
        var clear;
        var transform;
        var skipUpdateTransform;
        if (options2) {
          if (options2 instanceof RenderTexture) {
            utils.deprecation("6.0.0", "Renderer#render arguments changed, use options instead.");
            renderTexture = options2;
            clear = arguments[2];
            transform = arguments[3];
            skipUpdateTransform = arguments[4];
          } else {
            renderTexture = options2.renderTexture;
            clear = options2.clear;
            transform = options2.transform;
            skipUpdateTransform = options2.skipUpdateTransform;
          }
        }
        this.renderingToScreen = !renderTexture;
        this.runners.prerender.emit();
        this.emit("prerender");
        this.projection.transform = transform;
        if (this.context.isLost) {
          return;
        }
        if (!renderTexture) {
          this._lastObjectRendered = displayObject;
        }
        if (!skipUpdateTransform) {
          var cacheParent = displayObject.enableTempParent();
          displayObject.updateTransform();
          displayObject.disableTempParent(cacheParent);
        }
        this.renderTexture.bind(renderTexture);
        this.batch.currentRenderer.start();
        if (clear !== void 0 ? clear : this.clearBeforeRender) {
          this.renderTexture.clear();
        }
        displayObject.render(this);
        this.batch.currentRenderer.flush();
        if (renderTexture) {
          renderTexture.baseTexture.update();
        }
        this.runners.postrender.emit();
        this.projection.transform = null;
        this.emit("postrender");
      };
      Renderer3.prototype.generateTexture = function(displayObject, options2, resolution, region) {
        if (options2 === void 0) {
          options2 = {};
        }
        var renderTexture = _super.prototype.generateTexture.call(this, displayObject, options2, resolution, region);
        this.framebuffer.blit();
        return renderTexture;
      };
      Renderer3.prototype.resize = function(desiredScreenWidth, desiredScreenHeight) {
        _super.prototype.resize.call(this, desiredScreenWidth, desiredScreenHeight);
        this.runners.resize.emit(this.screen.height, this.screen.width);
      };
      Renderer3.prototype.reset = function() {
        this.runners.reset.emit();
        return this;
      };
      Renderer3.prototype.clear = function() {
        this.renderTexture.bind();
        this.renderTexture.clear();
      };
      Renderer3.prototype.destroy = function(removeView) {
        this.runners.destroy.emit();
        for (var r in this.runners) {
          this.runners[r].destroy();
        }
        _super.prototype.destroy.call(this, removeView);
        this.gl = null;
      };
      Object.defineProperty(Renderer3.prototype, "extract", {
        get: function() {
          utils.deprecation("6.0.0", "Renderer#extract has been deprecated, please use Renderer#plugins.extract instead.");
          return this.plugins.extract;
        },
        enumerable: false,
        configurable: true
      });
      Renderer3.registerPlugin = function(pluginName, ctor) {
        Renderer3.__plugins = Renderer3.__plugins || {};
        Renderer3.__plugins[pluginName] = ctor;
      };
      return Renderer3;
    }(AbstractRenderer);
    function autoDetectRenderer(options2) {
      return Renderer2.create(options2);
    }
    var $defaultVertex = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n}";
    var $defaultFilterVertex = "attribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nuniform vec4 inputSize;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aVertexPosition * (outputFrame.zw * inputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n";
    var defaultVertex$2 = $defaultVertex;
    var defaultFilterVertex = $defaultFilterVertex;
    var System = function() {
      function System2(renderer) {
        utils.deprecation("6.1.0", "System class is deprecated, implemement ISystem interface instead.");
        this.renderer = renderer;
      }
      System2.prototype.destroy = function() {
        this.renderer = null;
      };
      return System2;
    }();
    var BatchDrawCall = function() {
      function BatchDrawCall2() {
        this.texArray = null;
        this.blend = 0;
        this.type = constants.DRAW_MODES.TRIANGLES;
        this.start = 0;
        this.size = 0;
        this.data = null;
      }
      return BatchDrawCall2;
    }();
    var BatchTextureArray = function() {
      function BatchTextureArray2() {
        this.elements = [];
        this.ids = [];
        this.count = 0;
      }
      BatchTextureArray2.prototype.clear = function() {
        for (var i = 0; i < this.count; i++) {
          this.elements[i] = null;
        }
        this.count = 0;
      };
      return BatchTextureArray2;
    }();
    var ViewableBuffer = function() {
      function ViewableBuffer2(sizeOrBuffer) {
        if (typeof sizeOrBuffer === "number") {
          this.rawBinaryData = new ArrayBuffer(sizeOrBuffer);
        } else if (sizeOrBuffer instanceof Uint8Array) {
          this.rawBinaryData = sizeOrBuffer.buffer;
        } else {
          this.rawBinaryData = sizeOrBuffer;
        }
        this.uint32View = new Uint32Array(this.rawBinaryData);
        this.float32View = new Float32Array(this.rawBinaryData);
      }
      Object.defineProperty(ViewableBuffer2.prototype, "int8View", {
        get: function() {
          if (!this._int8View) {
            this._int8View = new Int8Array(this.rawBinaryData);
          }
          return this._int8View;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(ViewableBuffer2.prototype, "uint8View", {
        get: function() {
          if (!this._uint8View) {
            this._uint8View = new Uint8Array(this.rawBinaryData);
          }
          return this._uint8View;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(ViewableBuffer2.prototype, "int16View", {
        get: function() {
          if (!this._int16View) {
            this._int16View = new Int16Array(this.rawBinaryData);
          }
          return this._int16View;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(ViewableBuffer2.prototype, "uint16View", {
        get: function() {
          if (!this._uint16View) {
            this._uint16View = new Uint16Array(this.rawBinaryData);
          }
          return this._uint16View;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(ViewableBuffer2.prototype, "int32View", {
        get: function() {
          if (!this._int32View) {
            this._int32View = new Int32Array(this.rawBinaryData);
          }
          return this._int32View;
        },
        enumerable: false,
        configurable: true
      });
      ViewableBuffer2.prototype.view = function(type) {
        return this[type + "View"];
      };
      ViewableBuffer2.prototype.destroy = function() {
        this.rawBinaryData = null;
        this._int8View = null;
        this._uint8View = null;
        this._int16View = null;
        this._uint16View = null;
        this._int32View = null;
        this.uint32View = null;
        this.float32View = null;
      };
      ViewableBuffer2.sizeOf = function(type) {
        switch (type) {
          case "int8":
          case "uint8":
            return 1;
          case "int16":
          case "uint16":
            return 2;
          case "int32":
          case "uint32":
          case "float32":
            return 4;
          default:
            throw new Error(type + " isn't a valid view type");
        }
      };
      return ViewableBuffer2;
    }();
    var AbstractBatchRenderer = function(_super) {
      __extends(AbstractBatchRenderer2, _super);
      function AbstractBatchRenderer2(renderer) {
        var _this = _super.call(this, renderer) || this;
        _this.shaderGenerator = null;
        _this.geometryClass = null;
        _this.vertexSize = null;
        _this.state = State.for2d();
        _this.size = settings.settings.SPRITE_BATCH_SIZE * 4;
        _this._vertexCount = 0;
        _this._indexCount = 0;
        _this._bufferedElements = [];
        _this._bufferedTextures = [];
        _this._bufferSize = 0;
        _this._shader = null;
        _this._packedGeometries = [];
        _this._packedGeometryPoolSize = 2;
        _this._flushId = 0;
        _this._aBuffers = {};
        _this._iBuffers = {};
        _this.MAX_TEXTURES = 1;
        _this.renderer.on("prerender", _this.onPrerender, _this);
        renderer.runners.contextChange.add(_this);
        _this._dcIndex = 0;
        _this._aIndex = 0;
        _this._iIndex = 0;
        _this._attributeBuffer = null;
        _this._indexBuffer = null;
        _this._tempBoundTextures = [];
        return _this;
      }
      AbstractBatchRenderer2.prototype.contextChange = function() {
        var gl = this.renderer.gl;
        if (settings.settings.PREFER_ENV === constants.ENV.WEBGL_LEGACY) {
          this.MAX_TEXTURES = 1;
        } else {
          this.MAX_TEXTURES = Math.min(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), settings.settings.SPRITE_MAX_TEXTURES);
          this.MAX_TEXTURES = checkMaxIfStatementsInShader(this.MAX_TEXTURES, gl);
        }
        this._shader = this.shaderGenerator.generateShader(this.MAX_TEXTURES);
        for (var i = 0; i < this._packedGeometryPoolSize; i++) {
          this._packedGeometries[i] = new this.geometryClass();
        }
        this.initFlushBuffers();
      };
      AbstractBatchRenderer2.prototype.initFlushBuffers = function() {
        var _drawCallPool = AbstractBatchRenderer2._drawCallPool, _textureArrayPool = AbstractBatchRenderer2._textureArrayPool;
        var MAX_SPRITES = this.size / 4;
        var MAX_TA = Math.floor(MAX_SPRITES / this.MAX_TEXTURES) + 1;
        while (_drawCallPool.length < MAX_SPRITES) {
          _drawCallPool.push(new BatchDrawCall());
        }
        while (_textureArrayPool.length < MAX_TA) {
          _textureArrayPool.push(new BatchTextureArray());
        }
        for (var i = 0; i < this.MAX_TEXTURES; i++) {
          this._tempBoundTextures[i] = null;
        }
      };
      AbstractBatchRenderer2.prototype.onPrerender = function() {
        this._flushId = 0;
      };
      AbstractBatchRenderer2.prototype.render = function(element) {
        if (!element._texture.valid) {
          return;
        }
        if (this._vertexCount + element.vertexData.length / 2 > this.size) {
          this.flush();
        }
        this._vertexCount += element.vertexData.length / 2;
        this._indexCount += element.indices.length;
        this._bufferedTextures[this._bufferSize] = element._texture.baseTexture;
        this._bufferedElements[this._bufferSize++] = element;
      };
      AbstractBatchRenderer2.prototype.buildTexturesAndDrawCalls = function() {
        var _a = this, textures = _a._bufferedTextures, MAX_TEXTURES = _a.MAX_TEXTURES;
        var textureArrays = AbstractBatchRenderer2._textureArrayPool;
        var batch = this.renderer.batch;
        var boundTextures = this._tempBoundTextures;
        var touch = this.renderer.textureGC.count;
        var TICK = ++BaseTexture._globalBatch;
        var countTexArrays = 0;
        var texArray = textureArrays[0];
        var start = 0;
        batch.copyBoundTextures(boundTextures, MAX_TEXTURES);
        for (var i = 0; i < this._bufferSize; ++i) {
          var tex = textures[i];
          textures[i] = null;
          if (tex._batchEnabled === TICK) {
            continue;
          }
          if (texArray.count >= MAX_TEXTURES) {
            batch.boundArray(texArray, boundTextures, TICK, MAX_TEXTURES);
            this.buildDrawCalls(texArray, start, i);
            start = i;
            texArray = textureArrays[++countTexArrays];
            ++TICK;
          }
          tex._batchEnabled = TICK;
          tex.touched = touch;
          texArray.elements[texArray.count++] = tex;
        }
        if (texArray.count > 0) {
          batch.boundArray(texArray, boundTextures, TICK, MAX_TEXTURES);
          this.buildDrawCalls(texArray, start, this._bufferSize);
          ++countTexArrays;
          ++TICK;
        }
        for (var i = 0; i < boundTextures.length; i++) {
          boundTextures[i] = null;
        }
        BaseTexture._globalBatch = TICK;
      };
      AbstractBatchRenderer2.prototype.buildDrawCalls = function(texArray, start, finish) {
        var _a = this, elements = _a._bufferedElements, _attributeBuffer = _a._attributeBuffer, _indexBuffer = _a._indexBuffer, vertexSize = _a.vertexSize;
        var drawCalls = AbstractBatchRenderer2._drawCallPool;
        var dcIndex = this._dcIndex;
        var aIndex = this._aIndex;
        var iIndex = this._iIndex;
        var drawCall = drawCalls[dcIndex];
        drawCall.start = this._iIndex;
        drawCall.texArray = texArray;
        for (var i = start; i < finish; ++i) {
          var sprite = elements[i];
          var tex = sprite._texture.baseTexture;
          var spriteBlendMode = utils.premultiplyBlendMode[tex.alphaMode ? 1 : 0][sprite.blendMode];
          elements[i] = null;
          if (start < i && drawCall.blend !== spriteBlendMode) {
            drawCall.size = iIndex - drawCall.start;
            start = i;
            drawCall = drawCalls[++dcIndex];
            drawCall.texArray = texArray;
            drawCall.start = iIndex;
          }
          this.packInterleavedGeometry(sprite, _attributeBuffer, _indexBuffer, aIndex, iIndex);
          aIndex += sprite.vertexData.length / 2 * vertexSize;
          iIndex += sprite.indices.length;
          drawCall.blend = spriteBlendMode;
        }
        if (start < finish) {
          drawCall.size = iIndex - drawCall.start;
          ++dcIndex;
        }
        this._dcIndex = dcIndex;
        this._aIndex = aIndex;
        this._iIndex = iIndex;
      };
      AbstractBatchRenderer2.prototype.bindAndClearTexArray = function(texArray) {
        var textureSystem = this.renderer.texture;
        for (var j = 0; j < texArray.count; j++) {
          textureSystem.bind(texArray.elements[j], texArray.ids[j]);
          texArray.elements[j] = null;
        }
        texArray.count = 0;
      };
      AbstractBatchRenderer2.prototype.updateGeometry = function() {
        var _a = this, packedGeometries = _a._packedGeometries, attributeBuffer = _a._attributeBuffer, indexBuffer = _a._indexBuffer;
        if (!settings.settings.CAN_UPLOAD_SAME_BUFFER) {
          if (this._packedGeometryPoolSize <= this._flushId) {
            this._packedGeometryPoolSize++;
            packedGeometries[this._flushId] = new this.geometryClass();
          }
          packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData);
          packedGeometries[this._flushId]._indexBuffer.update(indexBuffer);
          this.renderer.geometry.bind(packedGeometries[this._flushId]);
          this.renderer.geometry.updateBuffers();
          this._flushId++;
        } else {
          packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData);
          packedGeometries[this._flushId]._indexBuffer.update(indexBuffer);
          this.renderer.geometry.updateBuffers();
        }
      };
      AbstractBatchRenderer2.prototype.drawBatches = function() {
        var dcCount = this._dcIndex;
        var _a = this.renderer, gl = _a.gl, stateSystem = _a.state;
        var drawCalls = AbstractBatchRenderer2._drawCallPool;
        var curTexArray = null;
        for (var i = 0; i < dcCount; i++) {
          var _b = drawCalls[i], texArray = _b.texArray, type = _b.type, size = _b.size, start = _b.start, blend = _b.blend;
          if (curTexArray !== texArray) {
            curTexArray = texArray;
            this.bindAndClearTexArray(texArray);
          }
          this.state.blendMode = blend;
          stateSystem.set(this.state);
          gl.drawElements(type, size, gl.UNSIGNED_SHORT, start * 2);
        }
      };
      AbstractBatchRenderer2.prototype.flush = function() {
        if (this._vertexCount === 0) {
          return;
        }
        this._attributeBuffer = this.getAttributeBuffer(this._vertexCount);
        this._indexBuffer = this.getIndexBuffer(this._indexCount);
        this._aIndex = 0;
        this._iIndex = 0;
        this._dcIndex = 0;
        this.buildTexturesAndDrawCalls();
        this.updateGeometry();
        this.drawBatches();
        this._bufferSize = 0;
        this._vertexCount = 0;
        this._indexCount = 0;
      };
      AbstractBatchRenderer2.prototype.start = function() {
        this.renderer.state.set(this.state);
        this.renderer.texture.ensureSamplerType(this.MAX_TEXTURES);
        this.renderer.shader.bind(this._shader);
        if (settings.settings.CAN_UPLOAD_SAME_BUFFER) {
          this.renderer.geometry.bind(this._packedGeometries[this._flushId]);
        }
      };
      AbstractBatchRenderer2.prototype.stop = function() {
        this.flush();
      };
      AbstractBatchRenderer2.prototype.destroy = function() {
        for (var i = 0; i < this._packedGeometryPoolSize; i++) {
          if (this._packedGeometries[i]) {
            this._packedGeometries[i].destroy();
          }
        }
        this.renderer.off("prerender", this.onPrerender, this);
        this._aBuffers = null;
        this._iBuffers = null;
        this._packedGeometries = null;
        this._attributeBuffer = null;
        this._indexBuffer = null;
        if (this._shader) {
          this._shader.destroy();
          this._shader = null;
        }
        _super.prototype.destroy.call(this);
      };
      AbstractBatchRenderer2.prototype.getAttributeBuffer = function(size) {
        var roundedP2 = utils.nextPow2(Math.ceil(size / 8));
        var roundedSizeIndex = utils.log2(roundedP2);
        var roundedSize = roundedP2 * 8;
        if (this._aBuffers.length <= roundedSizeIndex) {
          this._iBuffers.length = roundedSizeIndex + 1;
        }
        var buffer = this._aBuffers[roundedSize];
        if (!buffer) {
          this._aBuffers[roundedSize] = buffer = new ViewableBuffer(roundedSize * this.vertexSize * 4);
        }
        return buffer;
      };
      AbstractBatchRenderer2.prototype.getIndexBuffer = function(size) {
        var roundedP2 = utils.nextPow2(Math.ceil(size / 12));
        var roundedSizeIndex = utils.log2(roundedP2);
        var roundedSize = roundedP2 * 12;
        if (this._iBuffers.length <= roundedSizeIndex) {
          this._iBuffers.length = roundedSizeIndex + 1;
        }
        var buffer = this._iBuffers[roundedSizeIndex];
        if (!buffer) {
          this._iBuffers[roundedSizeIndex] = buffer = new Uint16Array(roundedSize);
        }
        return buffer;
      };
      AbstractBatchRenderer2.prototype.packInterleavedGeometry = function(element, attributeBuffer, indexBuffer, aIndex, iIndex) {
        var uint32View = attributeBuffer.uint32View, float32View = attributeBuffer.float32View;
        var packedVertices = aIndex / this.vertexSize;
        var uvs = element.uvs;
        var indicies = element.indices;
        var vertexData = element.vertexData;
        var textureId = element._texture.baseTexture._batchLocation;
        var alpha = Math.min(element.worldAlpha, 1);
        var argb = alpha < 1 && element._texture.baseTexture.alphaMode ? utils.premultiplyTint(element._tintRGB, alpha) : element._tintRGB + (alpha * 255 << 24);
        for (var i = 0; i < vertexData.length; i += 2) {
          float32View[aIndex++] = vertexData[i];
          float32View[aIndex++] = vertexData[i + 1];
          float32View[aIndex++] = uvs[i];
          float32View[aIndex++] = uvs[i + 1];
          uint32View[aIndex++] = argb;
          float32View[aIndex++] = textureId;
        }
        for (var i = 0; i < indicies.length; i++) {
          indexBuffer[iIndex++] = packedVertices + indicies[i];
        }
      };
      AbstractBatchRenderer2._drawCallPool = [];
      AbstractBatchRenderer2._textureArrayPool = [];
      return AbstractBatchRenderer2;
    }(ObjectRenderer);
    var BatchShaderGenerator = function() {
      function BatchShaderGenerator2(vertexSrc, fragTemplate2) {
        this.vertexSrc = vertexSrc;
        this.fragTemplate = fragTemplate2;
        this.programCache = {};
        this.defaultGroupCache = {};
        if (fragTemplate2.indexOf("%count%") < 0) {
          throw new Error('Fragment template must contain "%count%".');
        }
        if (fragTemplate2.indexOf("%forloop%") < 0) {
          throw new Error('Fragment template must contain "%forloop%".');
        }
      }
      BatchShaderGenerator2.prototype.generateShader = function(maxTextures) {
        if (!this.programCache[maxTextures]) {
          var sampleValues = new Int32Array(maxTextures);
          for (var i = 0; i < maxTextures; i++) {
            sampleValues[i] = i;
          }
          this.defaultGroupCache[maxTextures] = UniformGroup.from({ uSamplers: sampleValues }, true);
          var fragmentSrc = this.fragTemplate;
          fragmentSrc = fragmentSrc.replace(/%count%/gi, "" + maxTextures);
          fragmentSrc = fragmentSrc.replace(/%forloop%/gi, this.generateSampleSrc(maxTextures));
          this.programCache[maxTextures] = new Program(this.vertexSrc, fragmentSrc);
        }
        var uniforms = {
          tint: new Float32Array([1, 1, 1, 1]),
          translationMatrix: new math.Matrix(),
          default: this.defaultGroupCache[maxTextures]
        };
        return new Shader(this.programCache[maxTextures], uniforms);
      };
      BatchShaderGenerator2.prototype.generateSampleSrc = function(maxTextures) {
        var src2 = "";
        src2 += "\n";
        src2 += "\n";
        for (var i = 0; i < maxTextures; i++) {
          if (i > 0) {
            src2 += "\nelse ";
          }
          if (i < maxTextures - 1) {
            src2 += "if(vTextureId < " + i + ".5)";
          }
          src2 += "\n{";
          src2 += "\n	color = texture2D(uSamplers[" + i + "], vTextureCoord);";
          src2 += "\n}";
        }
        src2 += "\n";
        src2 += "\n";
        return src2;
      };
      return BatchShaderGenerator2;
    }();
    var BatchGeometry = function(_super) {
      __extends(BatchGeometry2, _super);
      function BatchGeometry2(_static) {
        if (_static === void 0) {
          _static = false;
        }
        var _this = _super.call(this) || this;
        _this._buffer = new Buffer2(null, _static, false);
        _this._indexBuffer = new Buffer2(null, _static, true);
        _this.addAttribute("aVertexPosition", _this._buffer, 2, false, constants.TYPES.FLOAT).addAttribute("aTextureCoord", _this._buffer, 2, false, constants.TYPES.FLOAT).addAttribute("aColor", _this._buffer, 4, true, constants.TYPES.UNSIGNED_BYTE).addAttribute("aTextureId", _this._buffer, 1, true, constants.TYPES.FLOAT).addIndex(_this._indexBuffer);
        return _this;
      }
      return BatchGeometry2;
    }(Geometry);
    var defaultVertex$3 = "precision highp float;\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\nattribute float aTextureId;\n\nuniform mat3 projectionMatrix;\nuniform mat3 translationMatrix;\nuniform vec4 tint;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying float vTextureId;\n\nvoid main(void){\n    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n    vTextureId = aTextureId;\n    vColor = aColor * tint;\n}\n";
    var defaultFragment$2 = "varying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying float vTextureId;\nuniform sampler2D uSamplers[%count%];\n\nvoid main(void){\n    vec4 color;\n    %forloop%\n    gl_FragColor = color * vColor;\n}\n";
    var BatchPluginFactory = function() {
      function BatchPluginFactory2() {
      }
      BatchPluginFactory2.create = function(options2) {
        var _a = Object.assign({
          vertex: defaultVertex$3,
          fragment: defaultFragment$2,
          geometryClass: BatchGeometry,
          vertexSize: 6
        }, options2), vertex2 = _a.vertex, fragment2 = _a.fragment, vertexSize = _a.vertexSize, geometryClass = _a.geometryClass;
        return function(_super) {
          __extends(BatchPlugin, _super);
          function BatchPlugin(renderer) {
            var _this = _super.call(this, renderer) || this;
            _this.shaderGenerator = new BatchShaderGenerator(vertex2, fragment2);
            _this.geometryClass = geometryClass;
            _this.vertexSize = vertexSize;
            return _this;
          }
          return BatchPlugin;
        }(AbstractBatchRenderer);
      };
      Object.defineProperty(BatchPluginFactory2, "defaultVertexSrc", {
        get: function() {
          return defaultVertex$3;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(BatchPluginFactory2, "defaultFragmentTemplate", {
        get: function() {
          return defaultFragment$2;
        },
        enumerable: false,
        configurable: true
      });
      return BatchPluginFactory2;
    }();
    var BatchRenderer2 = BatchPluginFactory.create();
    var resources = {};
    var _loop_1 = function(name2) {
      Object.defineProperty(resources, name2, {
        get: function() {
          utils.deprecation("6.0.0", "PIXI.systems." + name2 + " has moved to PIXI." + name2);
          return _resources[name2];
        }
      });
    };
    for (name in _resources) {
      _loop_1(name);
    }
    var name;
    var systems = {};
    var _loop_2 = function(name2) {
      Object.defineProperty(systems, name2, {
        get: function() {
          utils.deprecation("6.0.0", "PIXI.resources." + name2 + " has moved to PIXI." + name2);
          return _systems[name2];
        }
      });
    };
    for (name in _systems) {
      _loop_2(name);
    }
    var name;
    exports.AbstractBatchRenderer = AbstractBatchRenderer;
    exports.AbstractMultiResource = AbstractMultiResource;
    exports.AbstractRenderer = AbstractRenderer;
    exports.ArrayResource = ArrayResource;
    exports.Attribute = Attribute;
    exports.BaseImageResource = BaseImageResource;
    exports.BaseRenderTexture = BaseRenderTexture;
    exports.BaseTexture = BaseTexture;
    exports.BatchDrawCall = BatchDrawCall;
    exports.BatchGeometry = BatchGeometry;
    exports.BatchPluginFactory = BatchPluginFactory;
    exports.BatchRenderer = BatchRenderer2;
    exports.BatchShaderGenerator = BatchShaderGenerator;
    exports.BatchSystem = BatchSystem;
    exports.BatchTextureArray = BatchTextureArray;
    exports.Buffer = Buffer2;
    exports.BufferResource = BufferResource;
    exports.CanvasResource = CanvasResource;
    exports.ContextSystem = ContextSystem;
    exports.CubeResource = CubeResource;
    exports.Filter = Filter;
    exports.FilterState = FilterState;
    exports.FilterSystem = FilterSystem;
    exports.Framebuffer = Framebuffer;
    exports.FramebufferSystem = FramebufferSystem;
    exports.GLFramebuffer = GLFramebuffer;
    exports.GLProgram = GLProgram;
    exports.GLTexture = GLTexture;
    exports.Geometry = Geometry;
    exports.GeometrySystem = GeometrySystem;
    exports.IGLUniformData = IGLUniformData;
    exports.INSTALLED = INSTALLED;
    exports.ImageBitmapResource = ImageBitmapResource;
    exports.ImageResource = ImageResource;
    exports.MaskData = MaskData;
    exports.MaskSystem = MaskSystem;
    exports.ObjectRenderer = ObjectRenderer;
    exports.Program = Program;
    exports.ProjectionSystem = ProjectionSystem;
    exports.Quad = Quad;
    exports.QuadUv = QuadUv;
    exports.RenderTexture = RenderTexture;
    exports.RenderTexturePool = RenderTexturePool;
    exports.RenderTextureSystem = RenderTextureSystem;
    exports.Renderer = Renderer2;
    exports.Resource = Resource;
    exports.SVGResource = SVGResource;
    exports.ScissorSystem = ScissorSystem;
    exports.Shader = Shader;
    exports.ShaderSystem = ShaderSystem;
    exports.SpriteMaskFilter = SpriteMaskFilter;
    exports.State = State;
    exports.StateSystem = StateSystem;
    exports.StencilSystem = StencilSystem;
    exports.System = System;
    exports.Texture = Texture;
    exports.TextureGCSystem = TextureGCSystem;
    exports.TextureMatrix = TextureMatrix;
    exports.TextureSystem = TextureSystem;
    exports.TextureUvs = TextureUvs;
    exports.UniformGroup = UniformGroup;
    exports.VideoResource = VideoResource;
    exports.ViewableBuffer = ViewableBuffer;
    exports.autoDetectRenderer = autoDetectRenderer;
    exports.autoDetectResource = autoDetectResource;
    exports.checkMaxIfStatementsInShader = checkMaxIfStatementsInShader;
    exports.createUBOElements = createUBOElements;
    exports.defaultFilterVertex = defaultFilterVertex;
    exports.defaultVertex = defaultVertex$2;
    exports.generateProgram = generateProgram;
    exports.generateUniformBufferSync = generateUniformBufferSync;
    exports.getTestContext = getTestContext;
    exports.getUBOData = getUBOData;
    exports.resources = resources;
    exports.systems = systems;
    exports.uniformParsers = uniformParsers;
  }
});

// node_modules/@pixi/app/dist/cjs/app.js
var require_app = __commonJS({
  "node_modules/@pixi/app/dist/cjs/app.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var display = require_display();
    var core = require_core();
    var Application2 = function() {
      function Application3(options2) {
        var _this = this;
        this.stage = new display.Container();
        options2 = Object.assign({
          forceCanvas: false
        }, options2);
        this.renderer = core.autoDetectRenderer(options2);
        Application3._plugins.forEach(function(plugin) {
          plugin.init.call(_this, options2);
        });
      }
      Application3.registerPlugin = function(plugin) {
        Application3._plugins.push(plugin);
      };
      Application3.prototype.render = function() {
        this.renderer.render(this.stage);
      };
      Object.defineProperty(Application3.prototype, "view", {
        get: function() {
          return this.renderer.view;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Application3.prototype, "screen", {
        get: function() {
          return this.renderer.screen;
        },
        enumerable: false,
        configurable: true
      });
      Application3.prototype.destroy = function(removeView, stageOptions) {
        var _this = this;
        var plugins = Application3._plugins.slice(0);
        plugins.reverse();
        plugins.forEach(function(plugin) {
          plugin.destroy.call(_this);
        });
        this.stage.destroy(stageOptions);
        this.stage = null;
        this.renderer.destroy(removeView);
        this.renderer = null;
      };
      Application3._plugins = [];
      return Application3;
    }();
    var ResizePlugin = function() {
      function ResizePlugin2() {
      }
      ResizePlugin2.init = function(options2) {
        var _this = this;
        Object.defineProperty(this, "resizeTo", {
          set: function(dom) {
            self.removeEventListener("resize", this.queueResize);
            this._resizeTo = dom;
            if (dom) {
              self.addEventListener("resize", this.queueResize);
              this.resize();
            }
          },
          get: function() {
            return this._resizeTo;
          }
        });
        this.queueResize = function() {
          if (!_this._resizeTo) {
            return;
          }
          _this.cancelResize();
          _this._resizeId = requestAnimationFrame(function() {
            return _this.resize();
          });
        };
        this.cancelResize = function() {
          if (_this._resizeId) {
            cancelAnimationFrame(_this._resizeId);
            _this._resizeId = null;
          }
        };
        this.resize = function() {
          if (!_this._resizeTo) {
            return;
          }
          _this.cancelResize();
          var width;
          var height;
          if (_this._resizeTo === self) {
            width = self.innerWidth;
            height = self.innerHeight;
          } else {
            var _a = _this._resizeTo, clientWidth = _a.clientWidth, clientHeight = _a.clientHeight;
            width = clientWidth;
            height = clientHeight;
          }
          _this.renderer.resize(width, height);
        };
        this._resizeId = null;
        this._resizeTo = null;
        this.resizeTo = options2.resizeTo || null;
      };
      ResizePlugin2.destroy = function() {
        self.removeEventListener("resize", this.queueResize);
        this.cancelResize();
        this.cancelResize = null;
        this.queueResize = null;
        this.resizeTo = null;
        this.resize = null;
      };
      return ResizePlugin2;
    }();
    Application2.registerPlugin(ResizePlugin);
    exports.Application = Application2;
  }
});

// node_modules/@pixi/graphics/dist/cjs/graphics.js
var require_graphics = __commonJS({
  "node_modules/@pixi/graphics/dist/cjs/graphics.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core = require_core();
    var math = require_math();
    var utils = require_utils();
    var constants = require_constants();
    var display = require_display();
    (function(LINE_JOIN) {
      LINE_JOIN["MITER"] = "miter";
      LINE_JOIN["BEVEL"] = "bevel";
      LINE_JOIN["ROUND"] = "round";
    })(exports.LINE_JOIN || (exports.LINE_JOIN = {}));
    (function(LINE_CAP) {
      LINE_CAP["BUTT"] = "butt";
      LINE_CAP["ROUND"] = "round";
      LINE_CAP["SQUARE"] = "square";
    })(exports.LINE_CAP || (exports.LINE_CAP = {}));
    var GRAPHICS_CURVES = {
      adaptive: true,
      maxLength: 10,
      minSegments: 8,
      maxSegments: 2048,
      epsilon: 1e-4,
      _segmentsCount: function(length, defaultSegments) {
        if (defaultSegments === void 0) {
          defaultSegments = 20;
        }
        if (!this.adaptive || !length || isNaN(length)) {
          return defaultSegments;
        }
        var result = Math.ceil(length / this.maxLength);
        if (result < this.minSegments) {
          result = this.minSegments;
        } else if (result > this.maxSegments) {
          result = this.maxSegments;
        }
        return result;
      }
    };
    var FillStyle = function() {
      function FillStyle2() {
        this.color = 16777215;
        this.alpha = 1;
        this.texture = core.Texture.WHITE;
        this.matrix = null;
        this.visible = false;
        this.reset();
      }
      FillStyle2.prototype.clone = function() {
        var obj = new FillStyle2();
        obj.color = this.color;
        obj.alpha = this.alpha;
        obj.texture = this.texture;
        obj.matrix = this.matrix;
        obj.visible = this.visible;
        return obj;
      };
      FillStyle2.prototype.reset = function() {
        this.color = 16777215;
        this.alpha = 1;
        this.texture = core.Texture.WHITE;
        this.matrix = null;
        this.visible = false;
      };
      FillStyle2.prototype.destroy = function() {
        this.texture = null;
        this.matrix = null;
      };
      return FillStyle2;
    }();
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2) {
          if (b2.hasOwnProperty(p)) {
            d2[p] = b2[p];
          }
        }
      };
      return extendStatics(d, b);
    };
    function __extends(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var buildPoly = {
      build: function(graphicsData) {
        graphicsData.points = graphicsData.shape.points.slice();
      },
      triangulate: function(graphicsData, graphicsGeometry) {
        var points = graphicsData.points;
        var holes = graphicsData.holes;
        var verts = graphicsGeometry.points;
        var indices = graphicsGeometry.indices;
        if (points.length >= 6) {
          var holeArray = [];
          for (var i = 0; i < holes.length; i++) {
            var hole = holes[i];
            holeArray.push(points.length / 2);
            points = points.concat(hole.points);
          }
          var triangles = utils.earcut(points, holeArray, 2);
          if (!triangles) {
            return;
          }
          var vertPos = verts.length / 2;
          for (var i = 0; i < triangles.length; i += 3) {
            indices.push(triangles[i] + vertPos);
            indices.push(triangles[i + 1] + vertPos);
            indices.push(triangles[i + 2] + vertPos);
          }
          for (var i = 0; i < points.length; i++) {
            verts.push(points[i]);
          }
        }
      }
    };
    var buildCircle = {
      build: function(graphicsData) {
        var circleData = graphicsData.shape;
        var points = graphicsData.points;
        var x = circleData.x;
        var y = circleData.y;
        var width;
        var height;
        points.length = 0;
        if (graphicsData.type === math.SHAPES.CIRC) {
          width = circleData.radius;
          height = circleData.radius;
        } else {
          var ellipseData = graphicsData.shape;
          width = ellipseData.width;
          height = ellipseData.height;
        }
        if (width === 0 || height === 0) {
          return;
        }
        var totalSegs = Math.floor(30 * Math.sqrt(circleData.radius)) || Math.floor(15 * Math.sqrt(width + height));
        totalSegs /= 2.3;
        var seg = Math.PI * 2 / totalSegs;
        for (var i = 0; i < totalSegs - 0.5; i++) {
          points.push(x + Math.sin(-seg * i) * width, y + Math.cos(-seg * i) * height);
        }
        points.push(points[0], points[1]);
      },
      triangulate: function(graphicsData, graphicsGeometry) {
        var points = graphicsData.points;
        var verts = graphicsGeometry.points;
        var indices = graphicsGeometry.indices;
        var vertPos = verts.length / 2;
        var center = vertPos;
        var circle = graphicsData.shape;
        var matrix = graphicsData.matrix;
        var x = circle.x;
        var y = circle.y;
        verts.push(graphicsData.matrix ? matrix.a * x + matrix.c * y + matrix.tx : x, graphicsData.matrix ? matrix.b * x + matrix.d * y + matrix.ty : y);
        for (var i = 0; i < points.length; i += 2) {
          verts.push(points[i], points[i + 1]);
          indices.push(vertPos++, center, vertPos);
        }
      }
    };
    var buildRectangle = {
      build: function(graphicsData) {
        var rectData = graphicsData.shape;
        var x = rectData.x;
        var y = rectData.y;
        var width = rectData.width;
        var height = rectData.height;
        var points = graphicsData.points;
        points.length = 0;
        points.push(x, y, x + width, y, x + width, y + height, x, y + height);
      },
      triangulate: function(graphicsData, graphicsGeometry) {
        var points = graphicsData.points;
        var verts = graphicsGeometry.points;
        var vertPos = verts.length / 2;
        verts.push(points[0], points[1], points[2], points[3], points[6], points[7], points[4], points[5]);
        graphicsGeometry.indices.push(vertPos, vertPos + 1, vertPos + 2, vertPos + 1, vertPos + 2, vertPos + 3);
      }
    };
    function getPt(n1, n2, perc) {
      var diff = n2 - n1;
      return n1 + diff * perc;
    }
    function quadraticBezierCurve(fromX, fromY, cpX, cpY, toX, toY, out) {
      if (out === void 0) {
        out = [];
      }
      var n = 20;
      var points = out;
      var xa = 0;
      var ya = 0;
      var xb = 0;
      var yb = 0;
      var x = 0;
      var y = 0;
      for (var i = 0, j = 0; i <= n; ++i) {
        j = i / n;
        xa = getPt(fromX, cpX, j);
        ya = getPt(fromY, cpY, j);
        xb = getPt(cpX, toX, j);
        yb = getPt(cpY, toY, j);
        x = getPt(xa, xb, j);
        y = getPt(ya, yb, j);
        if (i === 0 && points[points.length - 2] === x && points[points.length - 1] === y) {
          continue;
        }
        points.push(x, y);
      }
      return points;
    }
    var buildRoundedRectangle = {
      build: function(graphicsData) {
        var rrectData = graphicsData.shape;
        var points = graphicsData.points;
        var x = rrectData.x;
        var y = rrectData.y;
        var width = rrectData.width;
        var height = rrectData.height;
        var radius = Math.max(0, Math.min(rrectData.radius, Math.min(width, height) / 2));
        points.length = 0;
        if (!radius) {
          points.push(x, y, x + width, y, x + width, y + height, x, y + height);
        } else {
          quadraticBezierCurve(x, y + radius, x, y, x + radius, y, points);
          quadraticBezierCurve(x + width - radius, y, x + width, y, x + width, y + radius, points);
          quadraticBezierCurve(x + width, y + height - radius, x + width, y + height, x + width - radius, y + height, points);
          quadraticBezierCurve(x + radius, y + height, x, y + height, x, y + height - radius, points);
        }
      },
      triangulate: function(graphicsData, graphicsGeometry) {
        var points = graphicsData.points;
        var verts = graphicsGeometry.points;
        var indices = graphicsGeometry.indices;
        var vecPos = verts.length / 2;
        var triangles = utils.earcut(points, null, 2);
        for (var i = 0, j = triangles.length; i < j; i += 3) {
          indices.push(triangles[i] + vecPos);
          indices.push(triangles[i + 1] + vecPos);
          indices.push(triangles[i + 2] + vecPos);
        }
        for (var i = 0, j = points.length; i < j; i++) {
          verts.push(points[i], points[++i]);
        }
      }
    };
    function square(x, y, nx, ny, innerWeight, outerWeight, clockwise, verts) {
      var ix = x - nx * innerWeight;
      var iy = y - ny * innerWeight;
      var ox = x + nx * outerWeight;
      var oy = y + ny * outerWeight;
      var exx;
      var eyy;
      if (clockwise) {
        exx = ny;
        eyy = -nx;
      } else {
        exx = -ny;
        eyy = nx;
      }
      var eix = ix + exx;
      var eiy = iy + eyy;
      var eox = ox + exx;
      var eoy = oy + eyy;
      verts.push(eix, eiy);
      verts.push(eox, eoy);
      return 2;
    }
    function round(cx, cy, sx, sy, ex, ey, verts, clockwise) {
      var cx2p0x = sx - cx;
      var cy2p0y = sy - cy;
      var angle0 = Math.atan2(cx2p0x, cy2p0y);
      var angle1 = Math.atan2(ex - cx, ey - cy);
      if (clockwise && angle0 < angle1) {
        angle0 += Math.PI * 2;
      } else if (!clockwise && angle0 > angle1) {
        angle1 += Math.PI * 2;
      }
      var startAngle = angle0;
      var angleDiff = angle1 - angle0;
      var absAngleDiff = Math.abs(angleDiff);
      var radius = Math.sqrt(cx2p0x * cx2p0x + cy2p0y * cy2p0y);
      var segCount = (15 * absAngleDiff * Math.sqrt(radius) / Math.PI >> 0) + 1;
      var angleInc = angleDiff / segCount;
      startAngle += angleInc;
      if (clockwise) {
        verts.push(cx, cy);
        verts.push(sx, sy);
        for (var i = 1, angle = startAngle; i < segCount; i++, angle += angleInc) {
          verts.push(cx, cy);
          verts.push(cx + Math.sin(angle) * radius, cy + Math.cos(angle) * radius);
        }
        verts.push(cx, cy);
        verts.push(ex, ey);
      } else {
        verts.push(sx, sy);
        verts.push(cx, cy);
        for (var i = 1, angle = startAngle; i < segCount; i++, angle += angleInc) {
          verts.push(cx + Math.sin(angle) * radius, cy + Math.cos(angle) * radius);
          verts.push(cx, cy);
        }
        verts.push(ex, ey);
        verts.push(cx, cy);
      }
      return segCount * 2;
    }
    function buildNonNativeLine(graphicsData, graphicsGeometry) {
      var shape = graphicsData.shape;
      var points = graphicsData.points || shape.points.slice();
      var eps = graphicsGeometry.closePointEps;
      if (points.length === 0) {
        return;
      }
      var style = graphicsData.lineStyle;
      var firstPoint = new math.Point(points[0], points[1]);
      var lastPoint = new math.Point(points[points.length - 2], points[points.length - 1]);
      var closedShape = shape.type !== math.SHAPES.POLY || shape.closeStroke;
      var closedPath = Math.abs(firstPoint.x - lastPoint.x) < eps && Math.abs(firstPoint.y - lastPoint.y) < eps;
      if (closedShape) {
        points = points.slice();
        if (closedPath) {
          points.pop();
          points.pop();
          lastPoint.set(points[points.length - 2], points[points.length - 1]);
        }
        var midPointX = (firstPoint.x + lastPoint.x) * 0.5;
        var midPointY = (lastPoint.y + firstPoint.y) * 0.5;
        points.unshift(midPointX, midPointY);
        points.push(midPointX, midPointY);
      }
      var verts = graphicsGeometry.points;
      var length = points.length / 2;
      var indexCount = points.length;
      var indexStart = verts.length / 2;
      var width = style.width / 2;
      var widthSquared = width * width;
      var miterLimitSquared = style.miterLimit * style.miterLimit;
      var x0 = points[0];
      var y0 = points[1];
      var x1 = points[2];
      var y1 = points[3];
      var x2 = 0;
      var y2 = 0;
      var perpx = -(y0 - y1);
      var perpy = x0 - x1;
      var perp1x = 0;
      var perp1y = 0;
      var dist = Math.sqrt(perpx * perpx + perpy * perpy);
      perpx /= dist;
      perpy /= dist;
      perpx *= width;
      perpy *= width;
      var ratio = style.alignment;
      var innerWeight = (1 - ratio) * 2;
      var outerWeight = ratio * 2;
      if (!closedShape) {
        if (style.cap === exports.LINE_CAP.ROUND) {
          indexCount += round(x0 - perpx * (innerWeight - outerWeight) * 0.5, y0 - perpy * (innerWeight - outerWeight) * 0.5, x0 - perpx * innerWeight, y0 - perpy * innerWeight, x0 + perpx * outerWeight, y0 + perpy * outerWeight, verts, true) + 2;
        } else if (style.cap === exports.LINE_CAP.SQUARE) {
          indexCount += square(x0, y0, perpx, perpy, innerWeight, outerWeight, true, verts);
        }
      }
      verts.push(x0 - perpx * innerWeight, y0 - perpy * innerWeight);
      verts.push(x0 + perpx * outerWeight, y0 + perpy * outerWeight);
      for (var i = 1; i < length - 1; ++i) {
        x0 = points[(i - 1) * 2];
        y0 = points[(i - 1) * 2 + 1];
        x1 = points[i * 2];
        y1 = points[i * 2 + 1];
        x2 = points[(i + 1) * 2];
        y2 = points[(i + 1) * 2 + 1];
        perpx = -(y0 - y1);
        perpy = x0 - x1;
        dist = Math.sqrt(perpx * perpx + perpy * perpy);
        perpx /= dist;
        perpy /= dist;
        perpx *= width;
        perpy *= width;
        perp1x = -(y1 - y2);
        perp1y = x1 - x2;
        dist = Math.sqrt(perp1x * perp1x + perp1y * perp1y);
        perp1x /= dist;
        perp1y /= dist;
        perp1x *= width;
        perp1y *= width;
        var dx0 = x1 - x0;
        var dy0 = y0 - y1;
        var dx1 = x1 - x2;
        var dy1 = y2 - y1;
        var cross = dy0 * dx1 - dy1 * dx0;
        var clockwise = cross < 0;
        if (Math.abs(cross) < 0.1) {
          verts.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight);
          verts.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight);
          continue;
        }
        var c1 = (-perpx + x0) * (-perpy + y1) - (-perpx + x1) * (-perpy + y0);
        var c2 = (-perp1x + x2) * (-perp1y + y1) - (-perp1x + x1) * (-perp1y + y2);
        var px = (dx0 * c2 - dx1 * c1) / cross;
        var py = (dy1 * c1 - dy0 * c2) / cross;
        var pdist = (px - x1) * (px - x1) + (py - y1) * (py - y1);
        var imx = x1 + (px - x1) * innerWeight;
        var imy = y1 + (py - y1) * innerWeight;
        var omx = x1 - (px - x1) * outerWeight;
        var omy = y1 - (py - y1) * outerWeight;
        var smallerInsideSegmentSq = Math.min(dx0 * dx0 + dy0 * dy0, dx1 * dx1 + dy1 * dy1);
        var insideWeight = clockwise ? innerWeight : outerWeight;
        var smallerInsideDiagonalSq = smallerInsideSegmentSq + insideWeight * insideWeight * widthSquared;
        var insideMiterOk = pdist <= smallerInsideDiagonalSq;
        if (insideMiterOk) {
          if (style.join === exports.LINE_JOIN.BEVEL || pdist / widthSquared > miterLimitSquared) {
            if (clockwise) {
              verts.push(imx, imy);
              verts.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight);
              verts.push(imx, imy);
              verts.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight);
            } else {
              verts.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight);
              verts.push(omx, omy);
              verts.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight);
              verts.push(omx, omy);
            }
            indexCount += 2;
          } else if (style.join === exports.LINE_JOIN.ROUND) {
            if (clockwise) {
              verts.push(imx, imy);
              verts.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight);
              indexCount += round(x1, y1, x1 + perpx * outerWeight, y1 + perpy * outerWeight, x1 + perp1x * outerWeight, y1 + perp1y * outerWeight, verts, true) + 4;
              verts.push(imx, imy);
              verts.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight);
            } else {
              verts.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight);
              verts.push(omx, omy);
              indexCount += round(x1, y1, x1 - perpx * innerWeight, y1 - perpy * innerWeight, x1 - perp1x * innerWeight, y1 - perp1y * innerWeight, verts, false) + 4;
              verts.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight);
              verts.push(omx, omy);
            }
          } else {
            verts.push(imx, imy);
            verts.push(omx, omy);
          }
        } else {
          verts.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight);
          verts.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight);
          if (style.join === exports.LINE_JOIN.BEVEL || pdist / widthSquared > miterLimitSquared)
            ;
          else if (style.join === exports.LINE_JOIN.ROUND) {
            if (clockwise) {
              indexCount += round(x1, y1, x1 + perpx * outerWeight, y1 + perpy * outerWeight, x1 + perp1x * outerWeight, y1 + perp1y * outerWeight, verts, true) + 2;
            } else {
              indexCount += round(x1, y1, x1 - perpx * innerWeight, y1 - perpy * innerWeight, x1 - perp1x * innerWeight, y1 - perp1y * innerWeight, verts, false) + 2;
            }
          } else {
            if (clockwise) {
              verts.push(omx, omy);
              verts.push(omx, omy);
            } else {
              verts.push(imx, imy);
              verts.push(imx, imy);
            }
            indexCount += 2;
          }
          verts.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight);
          verts.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight);
          indexCount += 2;
        }
      }
      x0 = points[(length - 2) * 2];
      y0 = points[(length - 2) * 2 + 1];
      x1 = points[(length - 1) * 2];
      y1 = points[(length - 1) * 2 + 1];
      perpx = -(y0 - y1);
      perpy = x0 - x1;
      dist = Math.sqrt(perpx * perpx + perpy * perpy);
      perpx /= dist;
      perpy /= dist;
      perpx *= width;
      perpy *= width;
      verts.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight);
      verts.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight);
      if (!closedShape) {
        if (style.cap === exports.LINE_CAP.ROUND) {
          indexCount += round(x1 - perpx * (innerWeight - outerWeight) * 0.5, y1 - perpy * (innerWeight - outerWeight) * 0.5, x1 - perpx * innerWeight, y1 - perpy * innerWeight, x1 + perpx * outerWeight, y1 + perpy * outerWeight, verts, false) + 2;
        } else if (style.cap === exports.LINE_CAP.SQUARE) {
          indexCount += square(x1, y1, perpx, perpy, innerWeight, outerWeight, false, verts);
        }
      }
      var indices = graphicsGeometry.indices;
      var eps2 = GRAPHICS_CURVES.epsilon * GRAPHICS_CURVES.epsilon;
      for (var i = indexStart; i < indexCount + indexStart - 2; ++i) {
        x0 = verts[i * 2];
        y0 = verts[i * 2 + 1];
        x1 = verts[(i + 1) * 2];
        y1 = verts[(i + 1) * 2 + 1];
        x2 = verts[(i + 2) * 2];
        y2 = verts[(i + 2) * 2 + 1];
        if (Math.abs(x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1)) < eps2) {
          continue;
        }
        indices.push(i, i + 1, i + 2);
      }
    }
    function buildNativeLine(graphicsData, graphicsGeometry) {
      var i = 0;
      var shape = graphicsData.shape;
      var points = graphicsData.points || shape.points;
      var closedShape = shape.type !== math.SHAPES.POLY || shape.closeStroke;
      if (points.length === 0) {
        return;
      }
      var verts = graphicsGeometry.points;
      var indices = graphicsGeometry.indices;
      var length = points.length / 2;
      var startIndex = verts.length / 2;
      var currentIndex = startIndex;
      verts.push(points[0], points[1]);
      for (i = 1; i < length; i++) {
        verts.push(points[i * 2], points[i * 2 + 1]);
        indices.push(currentIndex, currentIndex + 1);
        currentIndex++;
      }
      if (closedShape) {
        indices.push(currentIndex, startIndex);
      }
    }
    function buildLine(graphicsData, graphicsGeometry) {
      if (graphicsData.lineStyle.native) {
        buildNativeLine(graphicsData, graphicsGeometry);
      } else {
        buildNonNativeLine(graphicsData, graphicsGeometry);
      }
    }
    var ArcUtils = function() {
      function ArcUtils2() {
      }
      ArcUtils2.curveTo = function(x1, y1, x2, y2, radius, points) {
        var fromX = points[points.length - 2];
        var fromY = points[points.length - 1];
        var a1 = fromY - y1;
        var b1 = fromX - x1;
        var a2 = y2 - y1;
        var b2 = x2 - x1;
        var mm = Math.abs(a1 * b2 - b1 * a2);
        if (mm < 1e-8 || radius === 0) {
          if (points[points.length - 2] !== x1 || points[points.length - 1] !== y1) {
            points.push(x1, y1);
          }
          return null;
        }
        var dd = a1 * a1 + b1 * b1;
        var cc = a2 * a2 + b2 * b2;
        var tt = a1 * a2 + b1 * b2;
        var k1 = radius * Math.sqrt(dd) / mm;
        var k2 = radius * Math.sqrt(cc) / mm;
        var j1 = k1 * tt / dd;
        var j2 = k2 * tt / cc;
        var cx = k1 * b2 + k2 * b1;
        var cy = k1 * a2 + k2 * a1;
        var px = b1 * (k2 + j1);
        var py = a1 * (k2 + j1);
        var qx = b2 * (k1 + j2);
        var qy = a2 * (k1 + j2);
        var startAngle = Math.atan2(py - cy, px - cx);
        var endAngle = Math.atan2(qy - cy, qx - cx);
        return {
          cx: cx + x1,
          cy: cy + y1,
          radius,
          startAngle,
          endAngle,
          anticlockwise: b1 * a2 > b2 * a1
        };
      };
      ArcUtils2.arc = function(_startX, _startY, cx, cy, radius, startAngle, endAngle, _anticlockwise, points) {
        var sweep = endAngle - startAngle;
        var n = GRAPHICS_CURVES._segmentsCount(Math.abs(sweep) * radius, Math.ceil(Math.abs(sweep) / math.PI_2) * 40);
        var theta = sweep / (n * 2);
        var theta2 = theta * 2;
        var cTheta = Math.cos(theta);
        var sTheta = Math.sin(theta);
        var segMinus = n - 1;
        var remainder = segMinus % 1 / segMinus;
        for (var i = 0; i <= segMinus; ++i) {
          var real = i + remainder * i;
          var angle = theta + startAngle + theta2 * real;
          var c = Math.cos(angle);
          var s2 = -Math.sin(angle);
          points.push((cTheta * c + sTheta * s2) * radius + cx, (cTheta * -s2 + sTheta * c) * radius + cy);
        }
      };
      return ArcUtils2;
    }();
    var BezierUtils = function() {
      function BezierUtils2() {
      }
      BezierUtils2.curveLength = function(fromX, fromY, cpX, cpY, cpX2, cpY2, toX, toY) {
        var n = 10;
        var result = 0;
        var t = 0;
        var t2 = 0;
        var t3 = 0;
        var nt = 0;
        var nt2 = 0;
        var nt3 = 0;
        var x = 0;
        var y = 0;
        var dx = 0;
        var dy = 0;
        var prevX = fromX;
        var prevY = fromY;
        for (var i = 1; i <= n; ++i) {
          t = i / n;
          t2 = t * t;
          t3 = t2 * t;
          nt = 1 - t;
          nt2 = nt * nt;
          nt3 = nt2 * nt;
          x = nt3 * fromX + 3 * nt2 * t * cpX + 3 * nt * t2 * cpX2 + t3 * toX;
          y = nt3 * fromY + 3 * nt2 * t * cpY + 3 * nt * t2 * cpY2 + t3 * toY;
          dx = prevX - x;
          dy = prevY - y;
          prevX = x;
          prevY = y;
          result += Math.sqrt(dx * dx + dy * dy);
        }
        return result;
      };
      BezierUtils2.curveTo = function(cpX, cpY, cpX2, cpY2, toX, toY, points) {
        var fromX = points[points.length - 2];
        var fromY = points[points.length - 1];
        points.length -= 2;
        var n = GRAPHICS_CURVES._segmentsCount(BezierUtils2.curveLength(fromX, fromY, cpX, cpY, cpX2, cpY2, toX, toY));
        var dt = 0;
        var dt2 = 0;
        var dt3 = 0;
        var t2 = 0;
        var t3 = 0;
        points.push(fromX, fromY);
        for (var i = 1, j = 0; i <= n; ++i) {
          j = i / n;
          dt = 1 - j;
          dt2 = dt * dt;
          dt3 = dt2 * dt;
          t2 = j * j;
          t3 = t2 * j;
          points.push(dt3 * fromX + 3 * dt2 * j * cpX + 3 * dt * t2 * cpX2 + t3 * toX, dt3 * fromY + 3 * dt2 * j * cpY + 3 * dt * t2 * cpY2 + t3 * toY);
        }
      };
      return BezierUtils2;
    }();
    var QuadraticUtils = function() {
      function QuadraticUtils2() {
      }
      QuadraticUtils2.curveLength = function(fromX, fromY, cpX, cpY, toX, toY) {
        var ax = fromX - 2 * cpX + toX;
        var ay = fromY - 2 * cpY + toY;
        var bx = 2 * cpX - 2 * fromX;
        var by = 2 * cpY - 2 * fromY;
        var a = 4 * (ax * ax + ay * ay);
        var b = 4 * (ax * bx + ay * by);
        var c = bx * bx + by * by;
        var s2 = 2 * Math.sqrt(a + b + c);
        var a2 = Math.sqrt(a);
        var a32 = 2 * a * a2;
        var c2 = 2 * Math.sqrt(c);
        var ba = b / a2;
        return (a32 * s2 + a2 * b * (s2 - c2) + (4 * c * a - b * b) * Math.log((2 * a2 + ba + s2) / (ba + c2))) / (4 * a32);
      };
      QuadraticUtils2.curveTo = function(cpX, cpY, toX, toY, points) {
        var fromX = points[points.length - 2];
        var fromY = points[points.length - 1];
        var n = GRAPHICS_CURVES._segmentsCount(QuadraticUtils2.curveLength(fromX, fromY, cpX, cpY, toX, toY));
        var xa = 0;
        var ya = 0;
        for (var i = 1; i <= n; ++i) {
          var j = i / n;
          xa = fromX + (cpX - fromX) * j;
          ya = fromY + (cpY - fromY) * j;
          points.push(xa + (cpX + (toX - cpX) * j - xa) * j, ya + (cpY + (toY - cpY) * j - ya) * j);
        }
      };
      return QuadraticUtils2;
    }();
    var BatchPart = function() {
      function BatchPart2() {
        this.reset();
      }
      BatchPart2.prototype.begin = function(style, startIndex, attribStart) {
        this.reset();
        this.style = style;
        this.start = startIndex;
        this.attribStart = attribStart;
      };
      BatchPart2.prototype.end = function(endIndex, endAttrib) {
        this.attribSize = endAttrib - this.attribStart;
        this.size = endIndex - this.start;
      };
      BatchPart2.prototype.reset = function() {
        this.style = null;
        this.size = 0;
        this.start = 0;
        this.attribStart = 0;
        this.attribSize = 0;
      };
      return BatchPart2;
    }();
    var _a;
    var FILL_COMMANDS = (_a = {}, _a[math.SHAPES.POLY] = buildPoly, _a[math.SHAPES.CIRC] = buildCircle, _a[math.SHAPES.ELIP] = buildCircle, _a[math.SHAPES.RECT] = buildRectangle, _a[math.SHAPES.RREC] = buildRoundedRectangle, _a);
    var BATCH_POOL = [];
    var DRAW_CALL_POOL = [];
    function isPolygonClockwise(polygon) {
      var points = polygon.points;
      var sum = 0;
      for (var i = 0; i < points.length - 2; i += 2) {
        sum += (points[i + 2] - points[i]) * (points[i + 3] + points[i + 1]);
      }
      return sum > 0;
    }
    var GraphicsData = function() {
      function GraphicsData2(shape, fillStyle, lineStyle, matrix) {
        if (fillStyle === void 0) {
          fillStyle = null;
        }
        if (lineStyle === void 0) {
          lineStyle = null;
        }
        if (matrix === void 0) {
          matrix = null;
        }
        this.points = [];
        this.holes = [];
        this.shape = shape;
        this.lineStyle = lineStyle;
        this.fillStyle = fillStyle;
        this.matrix = matrix;
        this.type = shape.type;
      }
      GraphicsData2.prototype.clone = function() {
        return new GraphicsData2(this.shape, this.fillStyle, this.lineStyle, this.matrix);
      };
      GraphicsData2.prototype.destroy = function() {
        this.shape = null;
        this.holes.length = 0;
        this.holes = null;
        this.points.length = 0;
        this.points = null;
        this.lineStyle = null;
        this.fillStyle = null;
      };
      return GraphicsData2;
    }();
    var tmpPoint = new math.Point();
    var tmpBounds = new display.Bounds();
    var GraphicsGeometry = function(_super) {
      __extends(GraphicsGeometry2, _super);
      function GraphicsGeometry2() {
        var _this = _super.call(this) || this;
        _this.closePointEps = 1e-4;
        _this.boundsPadding = 0;
        _this.uvsFloat32 = null;
        _this.indicesUint16 = null;
        _this.batchable = false;
        _this.points = [];
        _this.colors = [];
        _this.uvs = [];
        _this.indices = [];
        _this.textureIds = [];
        _this.graphicsData = [];
        _this.drawCalls = [];
        _this.batchDirty = -1;
        _this.batches = [];
        _this.dirty = 0;
        _this.cacheDirty = -1;
        _this.clearDirty = 0;
        _this.shapeIndex = 0;
        _this._bounds = new display.Bounds();
        _this.boundsDirty = -1;
        return _this;
      }
      Object.defineProperty(GraphicsGeometry2.prototype, "bounds", {
        get: function() {
          if (this.boundsDirty !== this.dirty) {
            this.boundsDirty = this.dirty;
            this.calculateBounds();
          }
          return this._bounds;
        },
        enumerable: false,
        configurable: true
      });
      GraphicsGeometry2.prototype.invalidate = function() {
        this.boundsDirty = -1;
        this.dirty++;
        this.batchDirty++;
        this.shapeIndex = 0;
        this.points.length = 0;
        this.colors.length = 0;
        this.uvs.length = 0;
        this.indices.length = 0;
        this.textureIds.length = 0;
        for (var i = 0; i < this.drawCalls.length; i++) {
          this.drawCalls[i].texArray.clear();
          DRAW_CALL_POOL.push(this.drawCalls[i]);
        }
        this.drawCalls.length = 0;
        for (var i = 0; i < this.batches.length; i++) {
          var batchPart = this.batches[i];
          batchPart.reset();
          BATCH_POOL.push(batchPart);
        }
        this.batches.length = 0;
      };
      GraphicsGeometry2.prototype.clear = function() {
        if (this.graphicsData.length > 0) {
          this.invalidate();
          this.clearDirty++;
          this.graphicsData.length = 0;
        }
        return this;
      };
      GraphicsGeometry2.prototype.drawShape = function(shape, fillStyle, lineStyle, matrix) {
        if (fillStyle === void 0) {
          fillStyle = null;
        }
        if (lineStyle === void 0) {
          lineStyle = null;
        }
        if (matrix === void 0) {
          matrix = null;
        }
        var data = new GraphicsData(shape, fillStyle, lineStyle, matrix);
        this.graphicsData.push(data);
        this.dirty++;
        return this;
      };
      GraphicsGeometry2.prototype.drawHole = function(shape, matrix) {
        if (matrix === void 0) {
          matrix = null;
        }
        if (!this.graphicsData.length) {
          return null;
        }
        var data = new GraphicsData(shape, null, null, matrix);
        var lastShape = this.graphicsData[this.graphicsData.length - 1];
        data.lineStyle = lastShape.lineStyle;
        lastShape.holes.push(data);
        this.dirty++;
        return this;
      };
      GraphicsGeometry2.prototype.destroy = function() {
        _super.prototype.destroy.call(this);
        for (var i = 0; i < this.graphicsData.length; ++i) {
          this.graphicsData[i].destroy();
        }
        this.points.length = 0;
        this.points = null;
        this.colors.length = 0;
        this.colors = null;
        this.uvs.length = 0;
        this.uvs = null;
        this.indices.length = 0;
        this.indices = null;
        this.indexBuffer.destroy();
        this.indexBuffer = null;
        this.graphicsData.length = 0;
        this.graphicsData = null;
        this.drawCalls.length = 0;
        this.drawCalls = null;
        this.batches.length = 0;
        this.batches = null;
        this._bounds = null;
      };
      GraphicsGeometry2.prototype.containsPoint = function(point) {
        var graphicsData = this.graphicsData;
        for (var i = 0; i < graphicsData.length; ++i) {
          var data = graphicsData[i];
          if (!data.fillStyle.visible) {
            continue;
          }
          if (data.shape) {
            if (data.matrix) {
              data.matrix.applyInverse(point, tmpPoint);
            } else {
              tmpPoint.copyFrom(point);
            }
            if (data.shape.contains(tmpPoint.x, tmpPoint.y)) {
              var hitHole = false;
              if (data.holes) {
                for (var i_1 = 0; i_1 < data.holes.length; i_1++) {
                  var hole = data.holes[i_1];
                  if (hole.shape.contains(tmpPoint.x, tmpPoint.y)) {
                    hitHole = true;
                    break;
                  }
                }
              }
              if (!hitHole) {
                return true;
              }
            }
          }
        }
        return false;
      };
      GraphicsGeometry2.prototype.updateBatches = function(allow32Indices) {
        if (!this.graphicsData.length) {
          this.batchable = true;
          return;
        }
        if (!this.validateBatching()) {
          return;
        }
        this.cacheDirty = this.dirty;
        var uvs = this.uvs;
        var graphicsData = this.graphicsData;
        var batchPart = null;
        var currentStyle = null;
        if (this.batches.length > 0) {
          batchPart = this.batches[this.batches.length - 1];
          currentStyle = batchPart.style;
        }
        for (var i = this.shapeIndex; i < graphicsData.length; i++) {
          this.shapeIndex++;
          var data = graphicsData[i];
          var fillStyle = data.fillStyle;
          var lineStyle = data.lineStyle;
          var command = FILL_COMMANDS[data.type];
          command.build(data);
          if (data.matrix) {
            this.transformPoints(data.points, data.matrix);
          }
          for (var j = 0; j < 2; j++) {
            var style = j === 0 ? fillStyle : lineStyle;
            if (!style.visible) {
              continue;
            }
            var nextTexture = style.texture.baseTexture;
            var index_1 = this.indices.length;
            var attribIndex = this.points.length / 2;
            nextTexture.wrapMode = constants.WRAP_MODES.REPEAT;
            if (j === 0) {
              this.processFill(data);
            } else {
              this.processLine(data);
            }
            var size = this.points.length / 2 - attribIndex;
            if (size === 0) {
              continue;
            }
            if (batchPart && !this._compareStyles(currentStyle, style)) {
              batchPart.end(index_1, attribIndex);
              batchPart = null;
            }
            if (!batchPart) {
              batchPart = BATCH_POOL.pop() || new BatchPart();
              batchPart.begin(style, index_1, attribIndex);
              this.batches.push(batchPart);
              currentStyle = style;
            }
            this.addUvs(this.points, uvs, style.texture, attribIndex, size, style.matrix);
          }
        }
        var index = this.indices.length;
        var attrib = this.points.length / 2;
        if (batchPart) {
          batchPart.end(index, attrib);
        }
        if (this.batches.length === 0) {
          this.batchable = true;
          return;
        }
        if (this.indicesUint16 && this.indices.length === this.indicesUint16.length) {
          this.indicesUint16.set(this.indices);
        } else {
          var need32 = attrib > 65535 && allow32Indices;
          this.indicesUint16 = need32 ? new Uint32Array(this.indices) : new Uint16Array(this.indices);
        }
        this.batchable = this.isBatchable();
        if (this.batchable) {
          this.packBatches();
        } else {
          this.buildDrawCalls();
        }
      };
      GraphicsGeometry2.prototype._compareStyles = function(styleA, styleB) {
        if (!styleA || !styleB) {
          return false;
        }
        if (styleA.texture.baseTexture !== styleB.texture.baseTexture) {
          return false;
        }
        if (styleA.color + styleA.alpha !== styleB.color + styleB.alpha) {
          return false;
        }
        if (!!styleA.native !== !!styleB.native) {
          return false;
        }
        return true;
      };
      GraphicsGeometry2.prototype.validateBatching = function() {
        if (this.dirty === this.cacheDirty || !this.graphicsData.length) {
          return false;
        }
        for (var i = 0, l = this.graphicsData.length; i < l; i++) {
          var data = this.graphicsData[i];
          var fill = data.fillStyle;
          var line = data.lineStyle;
          if (fill && !fill.texture.baseTexture.valid) {
            return false;
          }
          if (line && !line.texture.baseTexture.valid) {
            return false;
          }
        }
        return true;
      };
      GraphicsGeometry2.prototype.packBatches = function() {
        this.batchDirty++;
        this.uvsFloat32 = new Float32Array(this.uvs);
        var batches = this.batches;
        for (var i = 0, l = batches.length; i < l; i++) {
          var batch = batches[i];
          for (var j = 0; j < batch.size; j++) {
            var index = batch.start + j;
            this.indicesUint16[index] = this.indicesUint16[index] - batch.attribStart;
          }
        }
      };
      GraphicsGeometry2.prototype.isBatchable = function() {
        if (this.points.length > 65535 * 2) {
          return false;
        }
        var batches = this.batches;
        for (var i = 0; i < batches.length; i++) {
          if (batches[i].style.native) {
            return false;
          }
        }
        return this.points.length < GraphicsGeometry2.BATCHABLE_SIZE * 2;
      };
      GraphicsGeometry2.prototype.buildDrawCalls = function() {
        var TICK = ++core.BaseTexture._globalBatch;
        for (var i = 0; i < this.drawCalls.length; i++) {
          this.drawCalls[i].texArray.clear();
          DRAW_CALL_POOL.push(this.drawCalls[i]);
        }
        this.drawCalls.length = 0;
        var colors = this.colors;
        var textureIds = this.textureIds;
        var currentGroup = DRAW_CALL_POOL.pop();
        if (!currentGroup) {
          currentGroup = new core.BatchDrawCall();
          currentGroup.texArray = new core.BatchTextureArray();
        }
        currentGroup.texArray.count = 0;
        currentGroup.start = 0;
        currentGroup.size = 0;
        currentGroup.type = constants.DRAW_MODES.TRIANGLES;
        var textureCount = 0;
        var currentTexture = null;
        var textureId = 0;
        var native = false;
        var drawMode = constants.DRAW_MODES.TRIANGLES;
        var index = 0;
        this.drawCalls.push(currentGroup);
        for (var i = 0; i < this.batches.length; i++) {
          var data = this.batches[i];
          var MAX_TEXTURES = 8;
          var style = data.style;
          var nextTexture = style.texture.baseTexture;
          if (native !== !!style.native) {
            native = !!style.native;
            drawMode = native ? constants.DRAW_MODES.LINES : constants.DRAW_MODES.TRIANGLES;
            currentTexture = null;
            textureCount = MAX_TEXTURES;
            TICK++;
          }
          if (currentTexture !== nextTexture) {
            currentTexture = nextTexture;
            if (nextTexture._batchEnabled !== TICK) {
              if (textureCount === MAX_TEXTURES) {
                TICK++;
                textureCount = 0;
                if (currentGroup.size > 0) {
                  currentGroup = DRAW_CALL_POOL.pop();
                  if (!currentGroup) {
                    currentGroup = new core.BatchDrawCall();
                    currentGroup.texArray = new core.BatchTextureArray();
                  }
                  this.drawCalls.push(currentGroup);
                }
                currentGroup.start = index;
                currentGroup.size = 0;
                currentGroup.texArray.count = 0;
                currentGroup.type = drawMode;
              }
              nextTexture.touched = 1;
              nextTexture._batchEnabled = TICK;
              nextTexture._batchLocation = textureCount;
              nextTexture.wrapMode = constants.WRAP_MODES.REPEAT;
              currentGroup.texArray.elements[currentGroup.texArray.count++] = nextTexture;
              textureCount++;
            }
          }
          currentGroup.size += data.size;
          index += data.size;
          textureId = nextTexture._batchLocation;
          this.addColors(colors, style.color, style.alpha, data.attribSize, data.attribStart);
          this.addTextureIds(textureIds, textureId, data.attribSize, data.attribStart);
        }
        core.BaseTexture._globalBatch = TICK;
        this.packAttributes();
      };
      GraphicsGeometry2.prototype.packAttributes = function() {
        var verts = this.points;
        var uvs = this.uvs;
        var colors = this.colors;
        var textureIds = this.textureIds;
        var glPoints = new ArrayBuffer(verts.length * 3 * 4);
        var f32 = new Float32Array(glPoints);
        var u32 = new Uint32Array(glPoints);
        var p = 0;
        for (var i = 0; i < verts.length / 2; i++) {
          f32[p++] = verts[i * 2];
          f32[p++] = verts[i * 2 + 1];
          f32[p++] = uvs[i * 2];
          f32[p++] = uvs[i * 2 + 1];
          u32[p++] = colors[i];
          f32[p++] = textureIds[i];
        }
        this._buffer.update(glPoints);
        this._indexBuffer.update(this.indicesUint16);
      };
      GraphicsGeometry2.prototype.processFill = function(data) {
        if (data.holes.length) {
          this.processHoles(data.holes);
          buildPoly.triangulate(data, this);
        } else {
          var command = FILL_COMMANDS[data.type];
          command.triangulate(data, this);
        }
      };
      GraphicsGeometry2.prototype.processLine = function(data) {
        buildLine(data, this);
        for (var i = 0; i < data.holes.length; i++) {
          buildLine(data.holes[i], this);
        }
      };
      GraphicsGeometry2.prototype.processHoles = function(holes) {
        for (var i = 0; i < holes.length; i++) {
          var hole = holes[i];
          var command = FILL_COMMANDS[hole.type];
          command.build(hole);
          if (hole.matrix) {
            this.transformPoints(hole.points, hole.matrix);
          }
        }
      };
      GraphicsGeometry2.prototype.calculateBounds = function() {
        var bounds = this._bounds;
        var sequenceBounds = tmpBounds;
        var curMatrix = math.Matrix.IDENTITY;
        this._bounds.clear();
        sequenceBounds.clear();
        for (var i = 0; i < this.graphicsData.length; i++) {
          var data = this.graphicsData[i];
          var shape = data.shape;
          var type = data.type;
          var lineStyle = data.lineStyle;
          var nextMatrix = data.matrix || math.Matrix.IDENTITY;
          var lineWidth = 0;
          if (lineStyle && lineStyle.visible) {
            var alignment = lineStyle.alignment;
            lineWidth = lineStyle.width;
            if (type === math.SHAPES.POLY) {
              if (isPolygonClockwise(shape)) {
                lineWidth = lineWidth * (1 - alignment);
              } else {
                lineWidth = lineWidth * alignment;
              }
            } else {
              lineWidth = lineWidth * Math.max(0, alignment);
            }
          }
          if (curMatrix !== nextMatrix) {
            if (!sequenceBounds.isEmpty()) {
              bounds.addBoundsMatrix(sequenceBounds, curMatrix);
              sequenceBounds.clear();
            }
            curMatrix = nextMatrix;
          }
          if (type === math.SHAPES.RECT || type === math.SHAPES.RREC) {
            var rect = shape;
            sequenceBounds.addFramePad(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height, lineWidth, lineWidth);
          } else if (type === math.SHAPES.CIRC) {
            var circle = shape;
            sequenceBounds.addFramePad(circle.x, circle.y, circle.x, circle.y, circle.radius + lineWidth, circle.radius + lineWidth);
          } else if (type === math.SHAPES.ELIP) {
            var ellipse = shape;
            sequenceBounds.addFramePad(ellipse.x, ellipse.y, ellipse.x, ellipse.y, ellipse.width + lineWidth, ellipse.height + lineWidth);
          } else {
            var poly = shape;
            bounds.addVerticesMatrix(curMatrix, poly.points, 0, poly.points.length, lineWidth, lineWidth);
          }
        }
        if (!sequenceBounds.isEmpty()) {
          bounds.addBoundsMatrix(sequenceBounds, curMatrix);
        }
        bounds.pad(this.boundsPadding, this.boundsPadding);
      };
      GraphicsGeometry2.prototype.transformPoints = function(points, matrix) {
        for (var i = 0; i < points.length / 2; i++) {
          var x = points[i * 2];
          var y = points[i * 2 + 1];
          points[i * 2] = matrix.a * x + matrix.c * y + matrix.tx;
          points[i * 2 + 1] = matrix.b * x + matrix.d * y + matrix.ty;
        }
      };
      GraphicsGeometry2.prototype.addColors = function(colors, color, alpha, size, offset) {
        if (offset === void 0) {
          offset = 0;
        }
        var rgb = (color >> 16) + (color & 65280) + ((color & 255) << 16);
        var rgba = utils.premultiplyTint(rgb, alpha);
        colors.length = Math.max(colors.length, offset + size);
        for (var i = 0; i < size; i++) {
          colors[offset + i] = rgba;
        }
      };
      GraphicsGeometry2.prototype.addTextureIds = function(textureIds, id, size, offset) {
        if (offset === void 0) {
          offset = 0;
        }
        textureIds.length = Math.max(textureIds.length, offset + size);
        for (var i = 0; i < size; i++) {
          textureIds[offset + i] = id;
        }
      };
      GraphicsGeometry2.prototype.addUvs = function(verts, uvs, texture, start, size, matrix) {
        if (matrix === void 0) {
          matrix = null;
        }
        var index = 0;
        var uvsStart = uvs.length;
        var frame = texture.frame;
        while (index < size) {
          var x = verts[(start + index) * 2];
          var y = verts[(start + index) * 2 + 1];
          if (matrix) {
            var nx = matrix.a * x + matrix.c * y + matrix.tx;
            y = matrix.b * x + matrix.d * y + matrix.ty;
            x = nx;
          }
          index++;
          uvs.push(x / frame.width, y / frame.height);
        }
        var baseTexture = texture.baseTexture;
        if (frame.width < baseTexture.width || frame.height < baseTexture.height) {
          this.adjustUvs(uvs, texture, uvsStart, size);
        }
      };
      GraphicsGeometry2.prototype.adjustUvs = function(uvs, texture, start, size) {
        var baseTexture = texture.baseTexture;
        var eps = 1e-6;
        var finish = start + size * 2;
        var frame = texture.frame;
        var scaleX = frame.width / baseTexture.width;
        var scaleY = frame.height / baseTexture.height;
        var offsetX = frame.x / frame.width;
        var offsetY = frame.y / frame.height;
        var minX = Math.floor(uvs[start] + eps);
        var minY = Math.floor(uvs[start + 1] + eps);
        for (var i = start + 2; i < finish; i += 2) {
          minX = Math.min(minX, Math.floor(uvs[i] + eps));
          minY = Math.min(minY, Math.floor(uvs[i + 1] + eps));
        }
        offsetX -= minX;
        offsetY -= minY;
        for (var i = start; i < finish; i += 2) {
          uvs[i] = (uvs[i] + offsetX) * scaleX;
          uvs[i + 1] = (uvs[i + 1] + offsetY) * scaleY;
        }
      };
      GraphicsGeometry2.BATCHABLE_SIZE = 100;
      return GraphicsGeometry2;
    }(core.BatchGeometry);
    var LineStyle = function(_super) {
      __extends(LineStyle2, _super);
      function LineStyle2() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.width = 0;
        _this.alignment = 0.5;
        _this.native = false;
        _this.cap = exports.LINE_CAP.BUTT;
        _this.join = exports.LINE_JOIN.MITER;
        _this.miterLimit = 10;
        return _this;
      }
      LineStyle2.prototype.clone = function() {
        var obj = new LineStyle2();
        obj.color = this.color;
        obj.alpha = this.alpha;
        obj.texture = this.texture;
        obj.matrix = this.matrix;
        obj.visible = this.visible;
        obj.width = this.width;
        obj.alignment = this.alignment;
        obj.native = this.native;
        obj.cap = this.cap;
        obj.join = this.join;
        obj.miterLimit = this.miterLimit;
        return obj;
      };
      LineStyle2.prototype.reset = function() {
        _super.prototype.reset.call(this);
        this.color = 0;
        this.alignment = 0.5;
        this.width = 0;
        this.native = false;
      };
      return LineStyle2;
    }(FillStyle);
    var temp = new Float32Array(3);
    var DEFAULT_SHADERS = {};
    var Graphics = function(_super) {
      __extends(Graphics2, _super);
      function Graphics2(geometry) {
        if (geometry === void 0) {
          geometry = null;
        }
        var _this = _super.call(this) || this;
        _this.shader = null;
        _this.pluginName = "batch";
        _this.currentPath = null;
        _this.batches = [];
        _this.batchTint = -1;
        _this.batchDirty = -1;
        _this.vertexData = null;
        _this._fillStyle = new FillStyle();
        _this._lineStyle = new LineStyle();
        _this._matrix = null;
        _this._holeMode = false;
        _this.state = core.State.for2d();
        _this._geometry = geometry || new GraphicsGeometry();
        _this._geometry.refCount++;
        _this._transformID = -1;
        _this.tint = 16777215;
        _this.blendMode = constants.BLEND_MODES.NORMAL;
        return _this;
      }
      Object.defineProperty(Graphics2.prototype, "geometry", {
        get: function() {
          return this._geometry;
        },
        enumerable: false,
        configurable: true
      });
      Graphics2.prototype.clone = function() {
        this.finishPoly();
        return new Graphics2(this._geometry);
      };
      Object.defineProperty(Graphics2.prototype, "blendMode", {
        get: function() {
          return this.state.blendMode;
        },
        set: function(value) {
          this.state.blendMode = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Graphics2.prototype, "tint", {
        get: function() {
          return this._tint;
        },
        set: function(value) {
          this._tint = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Graphics2.prototype, "fill", {
        get: function() {
          return this._fillStyle;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Graphics2.prototype, "line", {
        get: function() {
          return this._lineStyle;
        },
        enumerable: false,
        configurable: true
      });
      Graphics2.prototype.lineStyle = function(options2, color, alpha, alignment, native) {
        if (options2 === void 0) {
          options2 = null;
        }
        if (color === void 0) {
          color = 0;
        }
        if (alpha === void 0) {
          alpha = 1;
        }
        if (alignment === void 0) {
          alignment = 0.5;
        }
        if (native === void 0) {
          native = false;
        }
        if (typeof options2 === "number") {
          options2 = { width: options2, color, alpha, alignment, native };
        }
        return this.lineTextureStyle(options2);
      };
      Graphics2.prototype.lineTextureStyle = function(options2) {
        options2 = Object.assign({
          width: 0,
          texture: core.Texture.WHITE,
          color: options2 && options2.texture ? 16777215 : 0,
          alpha: 1,
          matrix: null,
          alignment: 0.5,
          native: false,
          cap: exports.LINE_CAP.BUTT,
          join: exports.LINE_JOIN.MITER,
          miterLimit: 10
        }, options2);
        if (this.currentPath) {
          this.startPoly();
        }
        var visible = options2.width > 0 && options2.alpha > 0;
        if (!visible) {
          this._lineStyle.reset();
        } else {
          if (options2.matrix) {
            options2.matrix = options2.matrix.clone();
            options2.matrix.invert();
          }
          Object.assign(this._lineStyle, { visible }, options2);
        }
        return this;
      };
      Graphics2.prototype.startPoly = function() {
        if (this.currentPath) {
          var points = this.currentPath.points;
          var len = this.currentPath.points.length;
          if (len > 2) {
            this.drawShape(this.currentPath);
            this.currentPath = new math.Polygon();
            this.currentPath.closeStroke = false;
            this.currentPath.points.push(points[len - 2], points[len - 1]);
          }
        } else {
          this.currentPath = new math.Polygon();
          this.currentPath.closeStroke = false;
        }
      };
      Graphics2.prototype.finishPoly = function() {
        if (this.currentPath) {
          if (this.currentPath.points.length > 2) {
            this.drawShape(this.currentPath);
            this.currentPath = null;
          } else {
            this.currentPath.points.length = 0;
          }
        }
      };
      Graphics2.prototype.moveTo = function(x, y) {
        this.startPoly();
        this.currentPath.points[0] = x;
        this.currentPath.points[1] = y;
        return this;
      };
      Graphics2.prototype.lineTo = function(x, y) {
        if (!this.currentPath) {
          this.moveTo(0, 0);
        }
        var points = this.currentPath.points;
        var fromX = points[points.length - 2];
        var fromY = points[points.length - 1];
        if (fromX !== x || fromY !== y) {
          points.push(x, y);
        }
        return this;
      };
      Graphics2.prototype._initCurve = function(x, y) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = 0;
        }
        if (this.currentPath) {
          if (this.currentPath.points.length === 0) {
            this.currentPath.points = [x, y];
          }
        } else {
          this.moveTo(x, y);
        }
      };
      Graphics2.prototype.quadraticCurveTo = function(cpX, cpY, toX, toY) {
        this._initCurve();
        var points = this.currentPath.points;
        if (points.length === 0) {
          this.moveTo(0, 0);
        }
        QuadraticUtils.curveTo(cpX, cpY, toX, toY, points);
        return this;
      };
      Graphics2.prototype.bezierCurveTo = function(cpX, cpY, cpX2, cpY2, toX, toY) {
        this._initCurve();
        BezierUtils.curveTo(cpX, cpY, cpX2, cpY2, toX, toY, this.currentPath.points);
        return this;
      };
      Graphics2.prototype.arcTo = function(x1, y1, x2, y2, radius) {
        this._initCurve(x1, y1);
        var points = this.currentPath.points;
        var result = ArcUtils.curveTo(x1, y1, x2, y2, radius, points);
        if (result) {
          var cx = result.cx, cy = result.cy, radius_1 = result.radius, startAngle = result.startAngle, endAngle = result.endAngle, anticlockwise = result.anticlockwise;
          this.arc(cx, cy, radius_1, startAngle, endAngle, anticlockwise);
        }
        return this;
      };
      Graphics2.prototype.arc = function(cx, cy, radius, startAngle, endAngle, anticlockwise) {
        if (anticlockwise === void 0) {
          anticlockwise = false;
        }
        if (startAngle === endAngle) {
          return this;
        }
        if (!anticlockwise && endAngle <= startAngle) {
          endAngle += math.PI_2;
        } else if (anticlockwise && startAngle <= endAngle) {
          startAngle += math.PI_2;
        }
        var sweep = endAngle - startAngle;
        if (sweep === 0) {
          return this;
        }
        var startX = cx + Math.cos(startAngle) * radius;
        var startY = cy + Math.sin(startAngle) * radius;
        var eps = this._geometry.closePointEps;
        var points = this.currentPath ? this.currentPath.points : null;
        if (points) {
          var xDiff = Math.abs(points[points.length - 2] - startX);
          var yDiff = Math.abs(points[points.length - 1] - startY);
          if (xDiff < eps && yDiff < eps)
            ;
          else {
            points.push(startX, startY);
          }
        } else {
          this.moveTo(startX, startY);
          points = this.currentPath.points;
        }
        ArcUtils.arc(startX, startY, cx, cy, radius, startAngle, endAngle, anticlockwise, points);
        return this;
      };
      Graphics2.prototype.beginFill = function(color, alpha) {
        if (color === void 0) {
          color = 0;
        }
        if (alpha === void 0) {
          alpha = 1;
        }
        return this.beginTextureFill({ texture: core.Texture.WHITE, color, alpha });
      };
      Graphics2.prototype.beginTextureFill = function(options2) {
        options2 = Object.assign({
          texture: core.Texture.WHITE,
          color: 16777215,
          alpha: 1,
          matrix: null
        }, options2);
        if (this.currentPath) {
          this.startPoly();
        }
        var visible = options2.alpha > 0;
        if (!visible) {
          this._fillStyle.reset();
        } else {
          if (options2.matrix) {
            options2.matrix = options2.matrix.clone();
            options2.matrix.invert();
          }
          Object.assign(this._fillStyle, { visible }, options2);
        }
        return this;
      };
      Graphics2.prototype.endFill = function() {
        this.finishPoly();
        this._fillStyle.reset();
        return this;
      };
      Graphics2.prototype.drawRect = function(x, y, width, height) {
        return this.drawShape(new math.Rectangle(x, y, width, height));
      };
      Graphics2.prototype.drawRoundedRect = function(x, y, width, height, radius) {
        return this.drawShape(new math.RoundedRectangle(x, y, width, height, radius));
      };
      Graphics2.prototype.drawCircle = function(x, y, radius) {
        return this.drawShape(new math.Circle(x, y, radius));
      };
      Graphics2.prototype.drawEllipse = function(x, y, width, height) {
        return this.drawShape(new math.Ellipse(x, y, width, height));
      };
      Graphics2.prototype.drawPolygon = function() {
        var arguments$1 = arguments;
        var path = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          path[_i] = arguments$1[_i];
        }
        var points;
        var closeStroke = true;
        var poly = path[0];
        if (poly.points) {
          closeStroke = poly.closeStroke;
          points = poly.points;
        } else if (Array.isArray(path[0])) {
          points = path[0];
        } else {
          points = path;
        }
        var shape = new math.Polygon(points);
        shape.closeStroke = closeStroke;
        this.drawShape(shape);
        return this;
      };
      Graphics2.prototype.drawShape = function(shape) {
        if (!this._holeMode) {
          this._geometry.drawShape(shape, this._fillStyle.clone(), this._lineStyle.clone(), this._matrix);
        } else {
          this._geometry.drawHole(shape, this._matrix);
        }
        return this;
      };
      Graphics2.prototype.clear = function() {
        this._geometry.clear();
        this._lineStyle.reset();
        this._fillStyle.reset();
        this._boundsID++;
        this._matrix = null;
        this._holeMode = false;
        this.currentPath = null;
        return this;
      };
      Graphics2.prototype.isFastRect = function() {
        var data = this._geometry.graphicsData;
        return data.length === 1 && data[0].shape.type === math.SHAPES.RECT && !data[0].holes.length && !(data[0].lineStyle.visible && data[0].lineStyle.width);
      };
      Graphics2.prototype._render = function(renderer) {
        this.finishPoly();
        var geometry = this._geometry;
        var hasuint32 = renderer.context.supports.uint32Indices;
        geometry.updateBatches(hasuint32);
        if (geometry.batchable) {
          if (this.batchDirty !== geometry.batchDirty) {
            this._populateBatches();
          }
          this._renderBatched(renderer);
        } else {
          renderer.batch.flush();
          this._renderDirect(renderer);
        }
      };
      Graphics2.prototype._populateBatches = function() {
        var geometry = this._geometry;
        var blendMode = this.blendMode;
        var len = geometry.batches.length;
        this.batchTint = -1;
        this._transformID = -1;
        this.batchDirty = geometry.batchDirty;
        this.batches.length = len;
        this.vertexData = new Float32Array(geometry.points);
        for (var i = 0; i < len; i++) {
          var gI = geometry.batches[i];
          var color = gI.style.color;
          var vertexData = new Float32Array(this.vertexData.buffer, gI.attribStart * 4 * 2, gI.attribSize * 2);
          var uvs = new Float32Array(geometry.uvsFloat32.buffer, gI.attribStart * 4 * 2, gI.attribSize * 2);
          var indices = new Uint16Array(geometry.indicesUint16.buffer, gI.start * 2, gI.size);
          var batch = {
            vertexData,
            blendMode,
            indices,
            uvs,
            _batchRGB: utils.hex2rgb(color),
            _tintRGB: color,
            _texture: gI.style.texture,
            alpha: gI.style.alpha,
            worldAlpha: 1
          };
          this.batches[i] = batch;
        }
      };
      Graphics2.prototype._renderBatched = function(renderer) {
        if (!this.batches.length) {
          return;
        }
        renderer.batch.setObjectRenderer(renderer.plugins[this.pluginName]);
        this.calculateVertices();
        this.calculateTints();
        for (var i = 0, l = this.batches.length; i < l; i++) {
          var batch = this.batches[i];
          batch.worldAlpha = this.worldAlpha * batch.alpha;
          renderer.plugins[this.pluginName].render(batch);
        }
      };
      Graphics2.prototype._renderDirect = function(renderer) {
        var shader = this._resolveDirectShader(renderer);
        var geometry = this._geometry;
        var tint = this.tint;
        var worldAlpha = this.worldAlpha;
        var uniforms = shader.uniforms;
        var drawCalls = geometry.drawCalls;
        uniforms.translationMatrix = this.transform.worldTransform;
        uniforms.tint[0] = (tint >> 16 & 255) / 255 * worldAlpha;
        uniforms.tint[1] = (tint >> 8 & 255) / 255 * worldAlpha;
        uniforms.tint[2] = (tint & 255) / 255 * worldAlpha;
        uniforms.tint[3] = worldAlpha;
        renderer.shader.bind(shader);
        renderer.geometry.bind(geometry, shader);
        renderer.state.set(this.state);
        for (var i = 0, l = drawCalls.length; i < l; i++) {
          this._renderDrawCallDirect(renderer, geometry.drawCalls[i]);
        }
      };
      Graphics2.prototype._renderDrawCallDirect = function(renderer, drawCall) {
        var texArray = drawCall.texArray, type = drawCall.type, size = drawCall.size, start = drawCall.start;
        var groupTextureCount = texArray.count;
        for (var j = 0; j < groupTextureCount; j++) {
          renderer.texture.bind(texArray.elements[j], j);
        }
        renderer.geometry.draw(type, size, start);
      };
      Graphics2.prototype._resolveDirectShader = function(renderer) {
        var shader = this.shader;
        var pluginName = this.pluginName;
        if (!shader) {
          if (!DEFAULT_SHADERS[pluginName]) {
            var MAX_TEXTURES = renderer.plugins.batch.MAX_TEXTURES;
            var sampleValues = new Int32Array(MAX_TEXTURES);
            for (var i = 0; i < MAX_TEXTURES; i++) {
              sampleValues[i] = i;
            }
            var uniforms = {
              tint: new Float32Array([1, 1, 1, 1]),
              translationMatrix: new math.Matrix(),
              default: core.UniformGroup.from({ uSamplers: sampleValues }, true)
            };
            var program = renderer.plugins[pluginName]._shader.program;
            DEFAULT_SHADERS[pluginName] = new core.Shader(program, uniforms);
          }
          shader = DEFAULT_SHADERS[pluginName];
        }
        return shader;
      };
      Graphics2.prototype._calculateBounds = function() {
        this.finishPoly();
        var geometry = this._geometry;
        if (!geometry.graphicsData.length) {
          return;
        }
        var _a2 = geometry.bounds, minX = _a2.minX, minY = _a2.minY, maxX = _a2.maxX, maxY = _a2.maxY;
        this._bounds.addFrame(this.transform, minX, minY, maxX, maxY);
      };
      Graphics2.prototype.containsPoint = function(point) {
        this.worldTransform.applyInverse(point, Graphics2._TEMP_POINT);
        return this._geometry.containsPoint(Graphics2._TEMP_POINT);
      };
      Graphics2.prototype.calculateTints = function() {
        if (this.batchTint !== this.tint) {
          this.batchTint = this.tint;
          var tintRGB = utils.hex2rgb(this.tint, temp);
          for (var i = 0; i < this.batches.length; i++) {
            var batch = this.batches[i];
            var batchTint = batch._batchRGB;
            var r = tintRGB[0] * batchTint[0] * 255;
            var g = tintRGB[1] * batchTint[1] * 255;
            var b = tintRGB[2] * batchTint[2] * 255;
            var color = (r << 16) + (g << 8) + (b | 0);
            batch._tintRGB = (color >> 16) + (color & 65280) + ((color & 255) << 16);
          }
        }
      };
      Graphics2.prototype.calculateVertices = function() {
        var wtID = this.transform._worldID;
        if (this._transformID === wtID) {
          return;
        }
        this._transformID = wtID;
        var wt = this.transform.worldTransform;
        var a = wt.a;
        var b = wt.b;
        var c = wt.c;
        var d = wt.d;
        var tx = wt.tx;
        var ty = wt.ty;
        var data = this._geometry.points;
        var vertexData = this.vertexData;
        var count = 0;
        for (var i = 0; i < data.length; i += 2) {
          var x = data[i];
          var y = data[i + 1];
          vertexData[count++] = a * x + c * y + tx;
          vertexData[count++] = d * y + b * x + ty;
        }
      };
      Graphics2.prototype.closePath = function() {
        var currentPath = this.currentPath;
        if (currentPath) {
          currentPath.closeStroke = true;
          this.finishPoly();
        }
        return this;
      };
      Graphics2.prototype.setMatrix = function(matrix) {
        this._matrix = matrix;
        return this;
      };
      Graphics2.prototype.beginHole = function() {
        this.finishPoly();
        this._holeMode = true;
        return this;
      };
      Graphics2.prototype.endHole = function() {
        this.finishPoly();
        this._holeMode = false;
        return this;
      };
      Graphics2.prototype.destroy = function(options2) {
        this._geometry.refCount--;
        if (this._geometry.refCount === 0) {
          this._geometry.dispose();
        }
        this._matrix = null;
        this.currentPath = null;
        this._lineStyle.destroy();
        this._lineStyle = null;
        this._fillStyle.destroy();
        this._fillStyle = null;
        this._geometry = null;
        this.shader = null;
        this.vertexData = null;
        this.batches.length = 0;
        this.batches = null;
        _super.prototype.destroy.call(this, options2);
      };
      Graphics2._TEMP_POINT = new math.Point();
      return Graphics2;
    }(display.Container);
    var graphicsUtils = {
      buildPoly,
      buildCircle,
      buildRectangle,
      buildRoundedRectangle,
      buildLine,
      ArcUtils,
      BezierUtils,
      QuadraticUtils,
      BatchPart,
      FILL_COMMANDS,
      BATCH_POOL,
      DRAW_CALL_POOL
    };
    exports.FillStyle = FillStyle;
    exports.GRAPHICS_CURVES = GRAPHICS_CURVES;
    exports.Graphics = Graphics;
    exports.GraphicsData = GraphicsData;
    exports.GraphicsGeometry = GraphicsGeometry;
    exports.LineStyle = LineStyle;
    exports.graphicsUtils = graphicsUtils;
  }
});

// node_modules/@pixi/interaction/dist/cjs/interaction.js
var require_interaction = __commonJS({
  "node_modules/@pixi/interaction/dist/cjs/interaction.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var math = require_math();
    var ticker = require_ticker();
    var display = require_display();
    var utils = require_utils();
    var InteractionData = function() {
      function InteractionData2() {
        this.pressure = 0;
        this.rotationAngle = 0;
        this.twist = 0;
        this.tangentialPressure = 0;
        this.global = new math.Point();
        this.target = null;
        this.originalEvent = null;
        this.identifier = null;
        this.isPrimary = false;
        this.button = 0;
        this.buttons = 0;
        this.width = 0;
        this.height = 0;
        this.tiltX = 0;
        this.tiltY = 0;
        this.pointerType = null;
        this.pressure = 0;
        this.rotationAngle = 0;
        this.twist = 0;
        this.tangentialPressure = 0;
      }
      Object.defineProperty(InteractionData2.prototype, "pointerId", {
        get: function() {
          return this.identifier;
        },
        enumerable: false,
        configurable: true
      });
      InteractionData2.prototype.getLocalPosition = function(displayObject, point, globalPos) {
        return displayObject.worldTransform.applyInverse(globalPos || this.global, point);
      };
      InteractionData2.prototype.copyEvent = function(event) {
        if ("isPrimary" in event && event.isPrimary) {
          this.isPrimary = true;
        }
        this.button = "button" in event && event.button;
        var buttons = "buttons" in event && event.buttons;
        this.buttons = Number.isInteger(buttons) ? buttons : "which" in event && event.which;
        this.width = "width" in event && event.width;
        this.height = "height" in event && event.height;
        this.tiltX = "tiltX" in event && event.tiltX;
        this.tiltY = "tiltY" in event && event.tiltY;
        this.pointerType = "pointerType" in event && event.pointerType;
        this.pressure = "pressure" in event && event.pressure;
        this.rotationAngle = "rotationAngle" in event && event.rotationAngle;
        this.twist = "twist" in event && event.twist || 0;
        this.tangentialPressure = "tangentialPressure" in event && event.tangentialPressure || 0;
      };
      InteractionData2.prototype.reset = function() {
        this.isPrimary = false;
      };
      return InteractionData2;
    }();
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2) {
          if (b2.hasOwnProperty(p)) {
            d2[p] = b2[p];
          }
        }
      };
      return extendStatics(d, b);
    };
    function __extends(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var InteractionEvent = function() {
      function InteractionEvent2() {
        this.stopped = false;
        this.stopsPropagatingAt = null;
        this.stopPropagationHint = false;
        this.target = null;
        this.currentTarget = null;
        this.type = null;
        this.data = null;
      }
      InteractionEvent2.prototype.stopPropagation = function() {
        this.stopped = true;
        this.stopPropagationHint = true;
        this.stopsPropagatingAt = this.currentTarget;
      };
      InteractionEvent2.prototype.reset = function() {
        this.stopped = false;
        this.stopsPropagatingAt = null;
        this.stopPropagationHint = false;
        this.currentTarget = null;
        this.target = null;
      };
      return InteractionEvent2;
    }();
    var InteractionTrackingData = function() {
      function InteractionTrackingData2(pointerId) {
        this._pointerId = pointerId;
        this._flags = InteractionTrackingData2.FLAGS.NONE;
      }
      InteractionTrackingData2.prototype._doSet = function(flag, yn) {
        if (yn) {
          this._flags = this._flags | flag;
        } else {
          this._flags = this._flags & ~flag;
        }
      };
      Object.defineProperty(InteractionTrackingData2.prototype, "pointerId", {
        get: function() {
          return this._pointerId;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(InteractionTrackingData2.prototype, "flags", {
        get: function() {
          return this._flags;
        },
        set: function(flags) {
          this._flags = flags;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(InteractionTrackingData2.prototype, "none", {
        get: function() {
          return this._flags === InteractionTrackingData2.FLAGS.NONE;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(InteractionTrackingData2.prototype, "over", {
        get: function() {
          return (this._flags & InteractionTrackingData2.FLAGS.OVER) !== 0;
        },
        set: function(yn) {
          this._doSet(InteractionTrackingData2.FLAGS.OVER, yn);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(InteractionTrackingData2.prototype, "rightDown", {
        get: function() {
          return (this._flags & InteractionTrackingData2.FLAGS.RIGHT_DOWN) !== 0;
        },
        set: function(yn) {
          this._doSet(InteractionTrackingData2.FLAGS.RIGHT_DOWN, yn);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(InteractionTrackingData2.prototype, "leftDown", {
        get: function() {
          return (this._flags & InteractionTrackingData2.FLAGS.LEFT_DOWN) !== 0;
        },
        set: function(yn) {
          this._doSet(InteractionTrackingData2.FLAGS.LEFT_DOWN, yn);
        },
        enumerable: false,
        configurable: true
      });
      InteractionTrackingData2.FLAGS = Object.freeze({
        NONE: 0,
        OVER: 1 << 0,
        LEFT_DOWN: 1 << 1,
        RIGHT_DOWN: 1 << 2
      });
      return InteractionTrackingData2;
    }();
    var TreeSearch = function() {
      function TreeSearch2() {
        this._tempPoint = new math.Point();
      }
      TreeSearch2.prototype.recursiveFindHit = function(interactionEvent, displayObject, func, hitTest, interactive) {
        if (!displayObject || !displayObject.visible) {
          return false;
        }
        var point = interactionEvent.data.global;
        interactive = displayObject.interactive || interactive;
        var hit = false;
        var interactiveParent = interactive;
        var hitTestChildren = true;
        if (displayObject.hitArea) {
          if (hitTest) {
            displayObject.worldTransform.applyInverse(point, this._tempPoint);
            if (!displayObject.hitArea.contains(this._tempPoint.x, this._tempPoint.y)) {
              hitTest = false;
              hitTestChildren = false;
            } else {
              hit = true;
            }
          }
          interactiveParent = false;
        } else if (displayObject._mask) {
          if (hitTest) {
            if (!(displayObject._mask.containsPoint && displayObject._mask.containsPoint(point))) {
              hitTest = false;
            }
          }
        }
        if (hitTestChildren && displayObject.interactiveChildren && displayObject.children) {
          var children = displayObject.children;
          for (var i = children.length - 1; i >= 0; i--) {
            var child = children[i];
            var childHit = this.recursiveFindHit(interactionEvent, child, func, hitTest, interactiveParent);
            if (childHit) {
              if (!child.parent) {
                continue;
              }
              interactiveParent = false;
              if (childHit) {
                if (interactionEvent.target) {
                  hitTest = false;
                }
                hit = true;
              }
            }
          }
        }
        if (interactive) {
          if (hitTest && !interactionEvent.target) {
            if (!displayObject.hitArea && displayObject.containsPoint) {
              if (displayObject.containsPoint(point)) {
                hit = true;
              }
            }
          }
          if (displayObject.interactive) {
            if (hit && !interactionEvent.target) {
              interactionEvent.target = displayObject;
            }
            if (func) {
              func(interactionEvent, displayObject, !!hit);
            }
          }
        }
        return hit;
      };
      TreeSearch2.prototype.findHit = function(interactionEvent, displayObject, func, hitTest) {
        this.recursiveFindHit(interactionEvent, displayObject, func, hitTest, false);
      };
      return TreeSearch2;
    }();
    var interactiveTarget = {
      interactive: false,
      interactiveChildren: true,
      hitArea: null,
      get buttonMode() {
        return this.cursor === "pointer";
      },
      set buttonMode(value) {
        if (value) {
          this.cursor = "pointer";
        } else if (this.cursor === "pointer") {
          this.cursor = null;
        }
      },
      cursor: null,
      get trackedPointers() {
        if (this._trackedPointers === void 0) {
          this._trackedPointers = {};
        }
        return this._trackedPointers;
      },
      _trackedPointers: void 0
    };
    display.DisplayObject.mixin(interactiveTarget);
    var MOUSE_POINTER_ID = 1;
    var hitTestEvent = {
      target: null,
      data: {
        global: null
      }
    };
    var InteractionManager2 = function(_super) {
      __extends(InteractionManager3, _super);
      function InteractionManager3(renderer, options2) {
        var _this = _super.call(this) || this;
        options2 = options2 || {};
        _this.renderer = renderer;
        _this.autoPreventDefault = options2.autoPreventDefault !== void 0 ? options2.autoPreventDefault : true;
        _this.interactionFrequency = options2.interactionFrequency || 10;
        _this.mouse = new InteractionData();
        _this.mouse.identifier = MOUSE_POINTER_ID;
        _this.mouse.global.set(-999999);
        _this.activeInteractionData = {};
        _this.activeInteractionData[MOUSE_POINTER_ID] = _this.mouse;
        _this.interactionDataPool = [];
        _this.eventData = new InteractionEvent();
        _this.interactionDOMElement = null;
        _this.moveWhenInside = false;
        _this.eventsAdded = false;
        _this.tickerAdded = false;
        _this.mouseOverRenderer = !("PointerEvent" in self);
        _this.supportsTouchEvents = "ontouchstart" in self;
        _this.supportsPointerEvents = !!self.PointerEvent;
        _this.onPointerUp = _this.onPointerUp.bind(_this);
        _this.processPointerUp = _this.processPointerUp.bind(_this);
        _this.onPointerCancel = _this.onPointerCancel.bind(_this);
        _this.processPointerCancel = _this.processPointerCancel.bind(_this);
        _this.onPointerDown = _this.onPointerDown.bind(_this);
        _this.processPointerDown = _this.processPointerDown.bind(_this);
        _this.onPointerMove = _this.onPointerMove.bind(_this);
        _this.processPointerMove = _this.processPointerMove.bind(_this);
        _this.onPointerOut = _this.onPointerOut.bind(_this);
        _this.processPointerOverOut = _this.processPointerOverOut.bind(_this);
        _this.onPointerOver = _this.onPointerOver.bind(_this);
        _this.cursorStyles = {
          default: "inherit",
          pointer: "pointer"
        };
        _this.currentCursorMode = null;
        _this.cursor = null;
        _this.resolution = 1;
        _this.delayedEvents = [];
        _this.search = new TreeSearch();
        _this._tempDisplayObject = new display.TemporaryDisplayObject();
        _this._eventListenerOptions = { capture: true, passive: false };
        _this._useSystemTicker = options2.useSystemTicker !== void 0 ? options2.useSystemTicker : true;
        _this.setTargetElement(_this.renderer.view, _this.renderer.resolution);
        return _this;
      }
      Object.defineProperty(InteractionManager3.prototype, "useSystemTicker", {
        get: function() {
          return this._useSystemTicker;
        },
        set: function(useSystemTicker) {
          this._useSystemTicker = useSystemTicker;
          if (useSystemTicker) {
            this.addTickerListener();
          } else {
            this.removeTickerListener();
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(InteractionManager3.prototype, "lastObjectRendered", {
        get: function() {
          return this.renderer._lastObjectRendered || this._tempDisplayObject;
        },
        enumerable: false,
        configurable: true
      });
      InteractionManager3.prototype.hitTest = function(globalPoint, root) {
        hitTestEvent.target = null;
        hitTestEvent.data.global = globalPoint;
        if (!root) {
          root = this.lastObjectRendered;
        }
        this.processInteractive(hitTestEvent, root, null, true);
        return hitTestEvent.target;
      };
      InteractionManager3.prototype.setTargetElement = function(element, resolution) {
        if (resolution === void 0) {
          resolution = 1;
        }
        this.removeTickerListener();
        this.removeEvents();
        this.interactionDOMElement = element;
        this.resolution = resolution;
        this.addEvents();
        this.addTickerListener();
      };
      InteractionManager3.prototype.addTickerListener = function() {
        if (this.tickerAdded || !this.interactionDOMElement || !this._useSystemTicker) {
          return;
        }
        ticker.Ticker.system.add(this.tickerUpdate, this, ticker.UPDATE_PRIORITY.INTERACTION);
        this.tickerAdded = true;
      };
      InteractionManager3.prototype.removeTickerListener = function() {
        if (!this.tickerAdded) {
          return;
        }
        ticker.Ticker.system.remove(this.tickerUpdate, this);
        this.tickerAdded = false;
      };
      InteractionManager3.prototype.addEvents = function() {
        if (this.eventsAdded || !this.interactionDOMElement) {
          return;
        }
        var style = this.interactionDOMElement.style;
        if (self.navigator.msPointerEnabled) {
          style.msContentZooming = "none";
          style.msTouchAction = "none";
        } else if (this.supportsPointerEvents) {
          style.touchAction = "none";
        }
        if (this.supportsPointerEvents) {
          self.document.addEventListener("pointermove", this.onPointerMove, this._eventListenerOptions);
          this.interactionDOMElement.addEventListener("pointerdown", this.onPointerDown, this._eventListenerOptions);
          this.interactionDOMElement.addEventListener("pointerleave", this.onPointerOut, this._eventListenerOptions);
          this.interactionDOMElement.addEventListener("pointerover", this.onPointerOver, this._eventListenerOptions);
          self.addEventListener("pointercancel", this.onPointerCancel, this._eventListenerOptions);
          self.addEventListener("pointerup", this.onPointerUp, this._eventListenerOptions);
        } else {
          self.document.addEventListener("mousemove", this.onPointerMove, this._eventListenerOptions);
          this.interactionDOMElement.addEventListener("mousedown", this.onPointerDown, this._eventListenerOptions);
          this.interactionDOMElement.addEventListener("mouseout", this.onPointerOut, this._eventListenerOptions);
          this.interactionDOMElement.addEventListener("mouseover", this.onPointerOver, this._eventListenerOptions);
          self.addEventListener("mouseup", this.onPointerUp, this._eventListenerOptions);
        }
        if (this.supportsTouchEvents) {
          this.interactionDOMElement.addEventListener("touchstart", this.onPointerDown, this._eventListenerOptions);
          this.interactionDOMElement.addEventListener("touchcancel", this.onPointerCancel, this._eventListenerOptions);
          this.interactionDOMElement.addEventListener("touchend", this.onPointerUp, this._eventListenerOptions);
          this.interactionDOMElement.addEventListener("touchmove", this.onPointerMove, this._eventListenerOptions);
        }
        this.eventsAdded = true;
      };
      InteractionManager3.prototype.removeEvents = function() {
        if (!this.eventsAdded || !this.interactionDOMElement) {
          return;
        }
        var style = this.interactionDOMElement.style;
        if (self.navigator.msPointerEnabled) {
          style.msContentZooming = "";
          style.msTouchAction = "";
        } else if (this.supportsPointerEvents) {
          style.touchAction = "";
        }
        if (this.supportsPointerEvents) {
          self.document.removeEventListener("pointermove", this.onPointerMove, this._eventListenerOptions);
          this.interactionDOMElement.removeEventListener("pointerdown", this.onPointerDown, this._eventListenerOptions);
          this.interactionDOMElement.removeEventListener("pointerleave", this.onPointerOut, this._eventListenerOptions);
          this.interactionDOMElement.removeEventListener("pointerover", this.onPointerOver, this._eventListenerOptions);
          self.removeEventListener("pointercancel", this.onPointerCancel, this._eventListenerOptions);
          self.removeEventListener("pointerup", this.onPointerUp, this._eventListenerOptions);
        } else {
          self.document.removeEventListener("mousemove", this.onPointerMove, this._eventListenerOptions);
          this.interactionDOMElement.removeEventListener("mousedown", this.onPointerDown, this._eventListenerOptions);
          this.interactionDOMElement.removeEventListener("mouseout", this.onPointerOut, this._eventListenerOptions);
          this.interactionDOMElement.removeEventListener("mouseover", this.onPointerOver, this._eventListenerOptions);
          self.removeEventListener("mouseup", this.onPointerUp, this._eventListenerOptions);
        }
        if (this.supportsTouchEvents) {
          this.interactionDOMElement.removeEventListener("touchstart", this.onPointerDown, this._eventListenerOptions);
          this.interactionDOMElement.removeEventListener("touchcancel", this.onPointerCancel, this._eventListenerOptions);
          this.interactionDOMElement.removeEventListener("touchend", this.onPointerUp, this._eventListenerOptions);
          this.interactionDOMElement.removeEventListener("touchmove", this.onPointerMove, this._eventListenerOptions);
        }
        this.interactionDOMElement = null;
        this.eventsAdded = false;
      };
      InteractionManager3.prototype.tickerUpdate = function(deltaTime) {
        this._deltaTime += deltaTime;
        if (this._deltaTime < this.interactionFrequency) {
          return;
        }
        this._deltaTime = 0;
        this.update();
      };
      InteractionManager3.prototype.update = function() {
        if (!this.interactionDOMElement) {
          return;
        }
        if (this._didMove) {
          this._didMove = false;
          return;
        }
        this.cursor = null;
        for (var k in this.activeInteractionData) {
          if (this.activeInteractionData.hasOwnProperty(k)) {
            var interactionData = this.activeInteractionData[k];
            if (interactionData.originalEvent && interactionData.pointerType !== "touch") {
              var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, interactionData.originalEvent, interactionData);
              this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerOverOut, true);
            }
          }
        }
        this.setCursorMode(this.cursor);
      };
      InteractionManager3.prototype.setCursorMode = function(mode) {
        mode = mode || "default";
        var applyStyles = true;
        if (self.OffscreenCanvas && this.interactionDOMElement instanceof OffscreenCanvas) {
          applyStyles = false;
        }
        if (this.currentCursorMode === mode) {
          return;
        }
        this.currentCursorMode = mode;
        var style = this.cursorStyles[mode];
        if (style) {
          switch (typeof style) {
            case "string":
              if (applyStyles) {
                this.interactionDOMElement.style.cursor = style;
              }
              break;
            case "function":
              style(mode);
              break;
            case "object":
              if (applyStyles) {
                Object.assign(this.interactionDOMElement.style, style);
              }
              break;
          }
        } else if (applyStyles && typeof mode === "string" && !Object.prototype.hasOwnProperty.call(this.cursorStyles, mode)) {
          this.interactionDOMElement.style.cursor = mode;
        }
      };
      InteractionManager3.prototype.dispatchEvent = function(displayObject, eventString, eventData) {
        if (!eventData.stopPropagationHint || displayObject === eventData.stopsPropagatingAt) {
          eventData.currentTarget = displayObject;
          eventData.type = eventString;
          displayObject.emit(eventString, eventData);
          if (displayObject[eventString]) {
            displayObject[eventString](eventData);
          }
        }
      };
      InteractionManager3.prototype.delayDispatchEvent = function(displayObject, eventString, eventData) {
        this.delayedEvents.push({ displayObject, eventString, eventData });
      };
      InteractionManager3.prototype.mapPositionToPoint = function(point, x, y) {
        var rect;
        if (!this.interactionDOMElement.parentElement) {
          rect = {
            x: 0,
            y: 0,
            width: this.interactionDOMElement.width,
            height: this.interactionDOMElement.height,
            left: 0,
            top: 0
          };
        } else {
          rect = this.interactionDOMElement.getBoundingClientRect();
        }
        var resolutionMultiplier = 1 / this.resolution;
        point.x = (x - rect.left) * (this.interactionDOMElement.width / rect.width) * resolutionMultiplier;
        point.y = (y - rect.top) * (this.interactionDOMElement.height / rect.height) * resolutionMultiplier;
      };
      InteractionManager3.prototype.processInteractive = function(interactionEvent, displayObject, func, hitTest) {
        var hit = this.search.findHit(interactionEvent, displayObject, func, hitTest);
        var delayedEvents = this.delayedEvents;
        if (!delayedEvents.length) {
          return hit;
        }
        interactionEvent.stopPropagationHint = false;
        var delayedLen = delayedEvents.length;
        this.delayedEvents = [];
        for (var i = 0; i < delayedLen; i++) {
          var _a = delayedEvents[i], displayObject_1 = _a.displayObject, eventString = _a.eventString, eventData = _a.eventData;
          if (eventData.stopsPropagatingAt === displayObject_1) {
            eventData.stopPropagationHint = true;
          }
          this.dispatchEvent(displayObject_1, eventString, eventData);
        }
        return hit;
      };
      InteractionManager3.prototype.onPointerDown = function(originalEvent) {
        if (this.supportsTouchEvents && originalEvent.pointerType === "touch") {
          return;
        }
        var events = this.normalizeToPointerData(originalEvent);
        if (this.autoPreventDefault && events[0].isNormalized) {
          var cancelable = originalEvent.cancelable || !("cancelable" in originalEvent);
          if (cancelable) {
            originalEvent.preventDefault();
          }
        }
        var eventLen = events.length;
        for (var i = 0; i < eventLen; i++) {
          var event = events[i];
          var interactionData = this.getInteractionDataForPointerId(event);
          var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
          interactionEvent.data.originalEvent = originalEvent;
          this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerDown, true);
          this.emit("pointerdown", interactionEvent);
          if (event.pointerType === "touch") {
            this.emit("touchstart", interactionEvent);
          } else if (event.pointerType === "mouse" || event.pointerType === "pen") {
            var isRightButton = event.button === 2;
            this.emit(isRightButton ? "rightdown" : "mousedown", this.eventData);
          }
        }
      };
      InteractionManager3.prototype.processPointerDown = function(interactionEvent, displayObject, hit) {
        var data = interactionEvent.data;
        var id = interactionEvent.data.identifier;
        if (hit) {
          if (!displayObject.trackedPointers[id]) {
            displayObject.trackedPointers[id] = new InteractionTrackingData(id);
          }
          this.dispatchEvent(displayObject, "pointerdown", interactionEvent);
          if (data.pointerType === "touch") {
            this.dispatchEvent(displayObject, "touchstart", interactionEvent);
          } else if (data.pointerType === "mouse" || data.pointerType === "pen") {
            var isRightButton = data.button === 2;
            if (isRightButton) {
              displayObject.trackedPointers[id].rightDown = true;
            } else {
              displayObject.trackedPointers[id].leftDown = true;
            }
            this.dispatchEvent(displayObject, isRightButton ? "rightdown" : "mousedown", interactionEvent);
          }
        }
      };
      InteractionManager3.prototype.onPointerComplete = function(originalEvent, cancelled, func) {
        var events = this.normalizeToPointerData(originalEvent);
        var eventLen = events.length;
        var eventAppend = originalEvent.target !== this.interactionDOMElement ? "outside" : "";
        for (var i = 0; i < eventLen; i++) {
          var event = events[i];
          var interactionData = this.getInteractionDataForPointerId(event);
          var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
          interactionEvent.data.originalEvent = originalEvent;
          this.processInteractive(interactionEvent, this.lastObjectRendered, func, cancelled || !eventAppend);
          this.emit(cancelled ? "pointercancel" : "pointerup" + eventAppend, interactionEvent);
          if (event.pointerType === "mouse" || event.pointerType === "pen") {
            var isRightButton = event.button === 2;
            this.emit(isRightButton ? "rightup" + eventAppend : "mouseup" + eventAppend, interactionEvent);
          } else if (event.pointerType === "touch") {
            this.emit(cancelled ? "touchcancel" : "touchend" + eventAppend, interactionEvent);
            this.releaseInteractionDataForPointerId(event.pointerId);
          }
        }
      };
      InteractionManager3.prototype.onPointerCancel = function(event) {
        if (this.supportsTouchEvents && event.pointerType === "touch") {
          return;
        }
        this.onPointerComplete(event, true, this.processPointerCancel);
      };
      InteractionManager3.prototype.processPointerCancel = function(interactionEvent, displayObject) {
        var data = interactionEvent.data;
        var id = interactionEvent.data.identifier;
        if (displayObject.trackedPointers[id] !== void 0) {
          delete displayObject.trackedPointers[id];
          this.dispatchEvent(displayObject, "pointercancel", interactionEvent);
          if (data.pointerType === "touch") {
            this.dispatchEvent(displayObject, "touchcancel", interactionEvent);
          }
        }
      };
      InteractionManager3.prototype.onPointerUp = function(event) {
        if (this.supportsTouchEvents && event.pointerType === "touch") {
          return;
        }
        this.onPointerComplete(event, false, this.processPointerUp);
      };
      InteractionManager3.prototype.processPointerUp = function(interactionEvent, displayObject, hit) {
        var data = interactionEvent.data;
        var id = interactionEvent.data.identifier;
        var trackingData = displayObject.trackedPointers[id];
        var isTouch = data.pointerType === "touch";
        var isMouse = data.pointerType === "mouse" || data.pointerType === "pen";
        var isMouseTap = false;
        if (isMouse) {
          var isRightButton = data.button === 2;
          var flags = InteractionTrackingData.FLAGS;
          var test = isRightButton ? flags.RIGHT_DOWN : flags.LEFT_DOWN;
          var isDown = trackingData !== void 0 && trackingData.flags & test;
          if (hit) {
            this.dispatchEvent(displayObject, isRightButton ? "rightup" : "mouseup", interactionEvent);
            if (isDown) {
              this.dispatchEvent(displayObject, isRightButton ? "rightclick" : "click", interactionEvent);
              isMouseTap = true;
            }
          } else if (isDown) {
            this.dispatchEvent(displayObject, isRightButton ? "rightupoutside" : "mouseupoutside", interactionEvent);
          }
          if (trackingData) {
            if (isRightButton) {
              trackingData.rightDown = false;
            } else {
              trackingData.leftDown = false;
            }
          }
        }
        if (hit) {
          this.dispatchEvent(displayObject, "pointerup", interactionEvent);
          if (isTouch) {
            this.dispatchEvent(displayObject, "touchend", interactionEvent);
          }
          if (trackingData) {
            if (!isMouse || isMouseTap) {
              this.dispatchEvent(displayObject, "pointertap", interactionEvent);
            }
            if (isTouch) {
              this.dispatchEvent(displayObject, "tap", interactionEvent);
              trackingData.over = false;
            }
          }
        } else if (trackingData) {
          this.dispatchEvent(displayObject, "pointerupoutside", interactionEvent);
          if (isTouch) {
            this.dispatchEvent(displayObject, "touchendoutside", interactionEvent);
          }
        }
        if (trackingData && trackingData.none) {
          delete displayObject.trackedPointers[id];
        }
      };
      InteractionManager3.prototype.onPointerMove = function(originalEvent) {
        if (this.supportsTouchEvents && originalEvent.pointerType === "touch") {
          return;
        }
        var events = this.normalizeToPointerData(originalEvent);
        if (events[0].pointerType === "mouse" || events[0].pointerType === "pen") {
          this._didMove = true;
          this.cursor = null;
        }
        var eventLen = events.length;
        for (var i = 0; i < eventLen; i++) {
          var event = events[i];
          var interactionData = this.getInteractionDataForPointerId(event);
          var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
          interactionEvent.data.originalEvent = originalEvent;
          this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerMove, true);
          this.emit("pointermove", interactionEvent);
          if (event.pointerType === "touch") {
            this.emit("touchmove", interactionEvent);
          }
          if (event.pointerType === "mouse" || event.pointerType === "pen") {
            this.emit("mousemove", interactionEvent);
          }
        }
        if (events[0].pointerType === "mouse") {
          this.setCursorMode(this.cursor);
        }
      };
      InteractionManager3.prototype.processPointerMove = function(interactionEvent, displayObject, hit) {
        var data = interactionEvent.data;
        var isTouch = data.pointerType === "touch";
        var isMouse = data.pointerType === "mouse" || data.pointerType === "pen";
        if (isMouse) {
          this.processPointerOverOut(interactionEvent, displayObject, hit);
        }
        if (!this.moveWhenInside || hit) {
          this.dispatchEvent(displayObject, "pointermove", interactionEvent);
          if (isTouch) {
            this.dispatchEvent(displayObject, "touchmove", interactionEvent);
          }
          if (isMouse) {
            this.dispatchEvent(displayObject, "mousemove", interactionEvent);
          }
        }
      };
      InteractionManager3.prototype.onPointerOut = function(originalEvent) {
        if (this.supportsTouchEvents && originalEvent.pointerType === "touch") {
          return;
        }
        var events = this.normalizeToPointerData(originalEvent);
        var event = events[0];
        if (event.pointerType === "mouse") {
          this.mouseOverRenderer = false;
          this.setCursorMode(null);
        }
        var interactionData = this.getInteractionDataForPointerId(event);
        var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
        interactionEvent.data.originalEvent = event;
        this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerOverOut, false);
        this.emit("pointerout", interactionEvent);
        if (event.pointerType === "mouse" || event.pointerType === "pen") {
          this.emit("mouseout", interactionEvent);
        } else {
          this.releaseInteractionDataForPointerId(interactionData.identifier);
        }
      };
      InteractionManager3.prototype.processPointerOverOut = function(interactionEvent, displayObject, hit) {
        var data = interactionEvent.data;
        var id = interactionEvent.data.identifier;
        var isMouse = data.pointerType === "mouse" || data.pointerType === "pen";
        var trackingData = displayObject.trackedPointers[id];
        if (hit && !trackingData) {
          trackingData = displayObject.trackedPointers[id] = new InteractionTrackingData(id);
        }
        if (trackingData === void 0) {
          return;
        }
        if (hit && this.mouseOverRenderer) {
          if (!trackingData.over) {
            trackingData.over = true;
            this.delayDispatchEvent(displayObject, "pointerover", interactionEvent);
            if (isMouse) {
              this.delayDispatchEvent(displayObject, "mouseover", interactionEvent);
            }
          }
          if (isMouse && this.cursor === null) {
            this.cursor = displayObject.cursor;
          }
        } else if (trackingData.over) {
          trackingData.over = false;
          this.dispatchEvent(displayObject, "pointerout", this.eventData);
          if (isMouse) {
            this.dispatchEvent(displayObject, "mouseout", interactionEvent);
          }
          if (trackingData.none) {
            delete displayObject.trackedPointers[id];
          }
        }
      };
      InteractionManager3.prototype.onPointerOver = function(originalEvent) {
        var events = this.normalizeToPointerData(originalEvent);
        var event = events[0];
        var interactionData = this.getInteractionDataForPointerId(event);
        var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
        interactionEvent.data.originalEvent = event;
        if (event.pointerType === "mouse") {
          this.mouseOverRenderer = true;
        }
        this.emit("pointerover", interactionEvent);
        if (event.pointerType === "mouse" || event.pointerType === "pen") {
          this.emit("mouseover", interactionEvent);
        }
      };
      InteractionManager3.prototype.getInteractionDataForPointerId = function(event) {
        var pointerId = event.pointerId;
        var interactionData;
        if (pointerId === MOUSE_POINTER_ID || event.pointerType === "mouse") {
          interactionData = this.mouse;
        } else if (this.activeInteractionData[pointerId]) {
          interactionData = this.activeInteractionData[pointerId];
        } else {
          interactionData = this.interactionDataPool.pop() || new InteractionData();
          interactionData.identifier = pointerId;
          this.activeInteractionData[pointerId] = interactionData;
        }
        interactionData.copyEvent(event);
        return interactionData;
      };
      InteractionManager3.prototype.releaseInteractionDataForPointerId = function(pointerId) {
        var interactionData = this.activeInteractionData[pointerId];
        if (interactionData) {
          delete this.activeInteractionData[pointerId];
          interactionData.reset();
          this.interactionDataPool.push(interactionData);
        }
      };
      InteractionManager3.prototype.configureInteractionEventForDOMEvent = function(interactionEvent, pointerEvent, interactionData) {
        interactionEvent.data = interactionData;
        this.mapPositionToPoint(interactionData.global, pointerEvent.clientX, pointerEvent.clientY);
        if (pointerEvent.pointerType === "touch") {
          pointerEvent.globalX = interactionData.global.x;
          pointerEvent.globalY = interactionData.global.y;
        }
        interactionData.originalEvent = pointerEvent;
        interactionEvent.reset();
        return interactionEvent;
      };
      InteractionManager3.prototype.normalizeToPointerData = function(event) {
        var normalizedEvents = [];
        if (this.supportsTouchEvents && event instanceof TouchEvent) {
          for (var i = 0, li = event.changedTouches.length; i < li; i++) {
            var touch = event.changedTouches[i];
            if (typeof touch.button === "undefined") {
              touch.button = event.touches.length ? 1 : 0;
            }
            if (typeof touch.buttons === "undefined") {
              touch.buttons = event.touches.length ? 1 : 0;
            }
            if (typeof touch.isPrimary === "undefined") {
              touch.isPrimary = event.touches.length === 1 && event.type === "touchstart";
            }
            if (typeof touch.width === "undefined") {
              touch.width = touch.radiusX || 1;
            }
            if (typeof touch.height === "undefined") {
              touch.height = touch.radiusY || 1;
            }
            if (typeof touch.tiltX === "undefined") {
              touch.tiltX = 0;
            }
            if (typeof touch.tiltY === "undefined") {
              touch.tiltY = 0;
            }
            if (typeof touch.pointerType === "undefined") {
              touch.pointerType = "touch";
            }
            if (typeof touch.pointerId === "undefined") {
              touch.pointerId = touch.identifier || 0;
            }
            if (typeof touch.pressure === "undefined") {
              touch.pressure = touch.force || 0.5;
            }
            if (typeof touch.twist === "undefined") {
              touch.twist = 0;
            }
            if (typeof touch.tangentialPressure === "undefined") {
              touch.tangentialPressure = 0;
            }
            if (typeof touch.layerX === "undefined") {
              touch.layerX = touch.offsetX = touch.clientX;
            }
            if (typeof touch.layerY === "undefined") {
              touch.layerY = touch.offsetY = touch.clientY;
            }
            touch.isNormalized = true;
            normalizedEvents.push(touch);
          }
        } else if (!self.MouseEvent || event instanceof MouseEvent && (!this.supportsPointerEvents || !(event instanceof self.PointerEvent))) {
          var tempEvent = event;
          if (typeof tempEvent.isPrimary === "undefined") {
            tempEvent.isPrimary = true;
          }
          if (typeof tempEvent.width === "undefined") {
            tempEvent.width = 1;
          }
          if (typeof tempEvent.height === "undefined") {
            tempEvent.height = 1;
          }
          if (typeof tempEvent.tiltX === "undefined") {
            tempEvent.tiltX = 0;
          }
          if (typeof tempEvent.tiltY === "undefined") {
            tempEvent.tiltY = 0;
          }
          if (typeof tempEvent.pointerType === "undefined") {
            tempEvent.pointerType = "mouse";
          }
          if (typeof tempEvent.pointerId === "undefined") {
            tempEvent.pointerId = MOUSE_POINTER_ID;
          }
          if (typeof tempEvent.pressure === "undefined") {
            tempEvent.pressure = 0.5;
          }
          if (typeof tempEvent.twist === "undefined") {
            tempEvent.twist = 0;
          }
          if (typeof tempEvent.tangentialPressure === "undefined") {
            tempEvent.tangentialPressure = 0;
          }
          tempEvent.isNormalized = true;
          normalizedEvents.push(tempEvent);
        } else {
          normalizedEvents.push(event);
        }
        return normalizedEvents;
      };
      InteractionManager3.prototype.destroy = function() {
        this.removeEvents();
        this.removeTickerListener();
        this.removeAllListeners();
        this.renderer = null;
        this.mouse = null;
        this.eventData = null;
        this.interactionDOMElement = null;
        this.onPointerDown = null;
        this.processPointerDown = null;
        this.onPointerUp = null;
        this.processPointerUp = null;
        this.onPointerCancel = null;
        this.processPointerCancel = null;
        this.onPointerMove = null;
        this.processPointerMove = null;
        this.onPointerOut = null;
        this.processPointerOverOut = null;
        this.onPointerOver = null;
        this.search = null;
      };
      return InteractionManager3;
    }(utils.EventEmitter);
    exports.InteractionData = InteractionData;
    exports.InteractionEvent = InteractionEvent;
    exports.InteractionManager = InteractionManager2;
    exports.InteractionTrackingData = InteractionTrackingData;
    exports.interactiveTarget = interactiveTarget;
  }
});

// node_modules/@pixi/filter-kawase-blur/dist/filter-kawase-blur.cjs.js
var require_filter_kawase_blur_cjs = __commonJS({
  "node_modules/@pixi/filter-kawase-blur/dist/filter-kawase-blur.cjs.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core = require_core();
    var math = require_math();
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2) {
          if (Object.prototype.hasOwnProperty.call(b2, p)) {
            d2[p] = b2[p];
          }
        }
      };
      return extendStatics(d, b);
    };
    function __extends(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var vertex = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n}";
    var fragment = "\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\n\nuniform vec2 uOffset;\n\nvoid main(void)\n{\n    vec4 color = vec4(0.0);\n\n    // Sample top left pixel\n    color += texture2D(uSampler, vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y + uOffset.y));\n\n    // Sample top right pixel\n    color += texture2D(uSampler, vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y + uOffset.y));\n\n    // Sample bottom right pixel\n    color += texture2D(uSampler, vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y - uOffset.y));\n\n    // Sample bottom left pixel\n    color += texture2D(uSampler, vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y - uOffset.y));\n\n    // Average\n    color *= 0.25;\n\n    gl_FragColor = color;\n}";
    var fragmentClamp = "\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\n\nuniform vec2 uOffset;\nuniform vec4 filterClamp;\n\nvoid main(void)\n{\n    vec4 color = vec4(0.0);\n\n    // Sample top left pixel\n    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y + uOffset.y), filterClamp.xy, filterClamp.zw));\n\n    // Sample top right pixel\n    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y + uOffset.y), filterClamp.xy, filterClamp.zw));\n\n    // Sample bottom right pixel\n    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y - uOffset.y), filterClamp.xy, filterClamp.zw));\n\n    // Sample bottom left pixel\n    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y - uOffset.y), filterClamp.xy, filterClamp.zw));\n\n    // Average\n    color *= 0.25;\n\n    gl_FragColor = color;\n}\n";
    var KawaseBlurFilter = function(_super) {
      __extends(KawaseBlurFilter2, _super);
      function KawaseBlurFilter2(blur, quality, clamp) {
        if (blur === void 0) {
          blur = 4;
        }
        if (quality === void 0) {
          quality = 3;
        }
        if (clamp === void 0) {
          clamp = false;
        }
        var _this = _super.call(this, vertex, clamp ? fragmentClamp : fragment) || this;
        _this._kernels = [];
        _this._blur = 4;
        _this._quality = 3;
        _this.uniforms.uOffset = new Float32Array(2);
        _this._pixelSize = new math.Point();
        _this.pixelSize = 1;
        _this._clamp = clamp;
        if (Array.isArray(blur)) {
          _this.kernels = blur;
        } else {
          _this._blur = blur;
          _this.quality = quality;
        }
        return _this;
      }
      KawaseBlurFilter2.prototype.apply = function(filterManager, input, output, clear) {
        var uvX = this._pixelSize.x / input._frame.width;
        var uvY = this._pixelSize.y / input._frame.height;
        var offset;
        if (this._quality === 1 || this._blur === 0) {
          offset = this._kernels[0] + 0.5;
          this.uniforms.uOffset[0] = offset * uvX;
          this.uniforms.uOffset[1] = offset * uvY;
          filterManager.applyFilter(this, input, output, clear);
        } else {
          var renderTarget = filterManager.getFilterTexture();
          var source = input;
          var target = renderTarget;
          var tmp = void 0;
          var last = this._quality - 1;
          for (var i = 0; i < last; i++) {
            offset = this._kernels[i] + 0.5;
            this.uniforms.uOffset[0] = offset * uvX;
            this.uniforms.uOffset[1] = offset * uvY;
            filterManager.applyFilter(this, source, target, 1);
            tmp = source;
            source = target;
            target = tmp;
          }
          offset = this._kernels[last] + 0.5;
          this.uniforms.uOffset[0] = offset * uvX;
          this.uniforms.uOffset[1] = offset * uvY;
          filterManager.applyFilter(this, source, output, clear);
          filterManager.returnFilterTexture(renderTarget);
        }
      };
      KawaseBlurFilter2.prototype._updatePadding = function() {
        this.padding = Math.ceil(this._kernels.reduce(function(acc, v) {
          return acc + v + 0.5;
        }, 0));
      };
      KawaseBlurFilter2.prototype._generateKernels = function() {
        var blur = this._blur;
        var quality = this._quality;
        var kernels = [blur];
        if (blur > 0) {
          var k = blur;
          var step = blur / quality;
          for (var i = 1; i < quality; i++) {
            k -= step;
            kernels.push(k);
          }
        }
        this._kernels = kernels;
        this._updatePadding();
      };
      Object.defineProperty(KawaseBlurFilter2.prototype, "kernels", {
        get: function() {
          return this._kernels;
        },
        set: function(value) {
          if (Array.isArray(value) && value.length > 0) {
            this._kernels = value;
            this._quality = value.length;
            this._blur = Math.max.apply(Math, value);
          } else {
            this._kernels = [0];
            this._quality = 1;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(KawaseBlurFilter2.prototype, "clamp", {
        get: function() {
          return this._clamp;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(KawaseBlurFilter2.prototype, "pixelSize", {
        get: function() {
          return this._pixelSize;
        },
        set: function(value) {
          if (typeof value === "number") {
            this._pixelSize.x = value;
            this._pixelSize.y = value;
          } else if (Array.isArray(value)) {
            this._pixelSize.x = value[0];
            this._pixelSize.y = value[1];
          } else if (value instanceof math.Point) {
            this._pixelSize.x = value.x;
            this._pixelSize.y = value.y;
          } else {
            this._pixelSize.x = 1;
            this._pixelSize.y = 1;
          }
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(KawaseBlurFilter2.prototype, "quality", {
        get: function() {
          return this._quality;
        },
        set: function(value) {
          this._quality = Math.max(1, Math.round(value));
          this._generateKernels();
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(KawaseBlurFilter2.prototype, "blur", {
        get: function() {
          return this._blur;
        },
        set: function(value) {
          this._blur = value;
          this._generateKernels();
        },
        enumerable: false,
        configurable: true
      });
      return KawaseBlurFilter2;
    }(core.Filter);
    exports.KawaseBlurFilter = KawaseBlurFilter;
  }
});

// node_modules/@pixi/filter-noise/dist/cjs/filter-noise.js
var require_filter_noise = __commonJS({
  "node_modules/@pixi/filter-noise/dist/cjs/filter-noise.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core = require_core();
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2) {
          if (b2.hasOwnProperty(p)) {
            d2[p] = b2[p];
          }
        }
      };
      return extendStatics(d, b);
    };
    function __extends(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var fragment = "precision highp float;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform float uNoise;\nuniform float uSeed;\nuniform sampler2D uSampler;\n\nfloat rand(vec2 co)\n{\n    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\nvoid main()\n{\n    vec4 color = texture2D(uSampler, vTextureCoord);\n    float randomValue = rand(gl_FragCoord.xy * uSeed);\n    float diff = (randomValue - 0.5) * uNoise;\n\n    // Un-premultiply alpha before applying the color matrix. See issue #3539.\n    if (color.a > 0.0) {\n        color.rgb /= color.a;\n    }\n\n    color.r += diff;\n    color.g += diff;\n    color.b += diff;\n\n    // Premultiply alpha again.\n    color.rgb *= color.a;\n\n    gl_FragColor = color;\n}\n";
    var NoiseFilter = function(_super) {
      __extends(NoiseFilter2, _super);
      function NoiseFilter2(noise, seed) {
        if (noise === void 0) {
          noise = 0.5;
        }
        if (seed === void 0) {
          seed = Math.random();
        }
        var _this = _super.call(this, core.defaultFilterVertex, fragment, {
          uNoise: 0,
          uSeed: 0
        }) || this;
        _this.noise = noise;
        _this.seed = seed;
        return _this;
      }
      Object.defineProperty(NoiseFilter2.prototype, "noise", {
        get: function() {
          return this.uniforms.uNoise;
        },
        set: function(value) {
          this.uniforms.uNoise = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(NoiseFilter2.prototype, "seed", {
        get: function() {
          return this.uniforms.uSeed;
        },
        set: function(value) {
          this.uniforms.uSeed = value;
        },
        enumerable: false,
        configurable: true
      });
      return NoiseFilter2;
    }(core.Filter);
    exports.NoiseFilter = NoiseFilter;
  }
});

// node_modules/@pixi/filter-color-matrix/dist/cjs/filter-color-matrix.js
var require_filter_color_matrix = __commonJS({
  "node_modules/@pixi/filter-color-matrix/dist/cjs/filter-color-matrix.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core = require_core();
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2) {
          if (b2.hasOwnProperty(p)) {
            d2[p] = b2[p];
          }
        }
      };
      return extendStatics(d, b);
    };
    function __extends(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var fragment = "varying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform float m[20];\nuniform float uAlpha;\n\nvoid main(void)\n{\n    vec4 c = texture2D(uSampler, vTextureCoord);\n\n    if (uAlpha == 0.0) {\n        gl_FragColor = c;\n        return;\n    }\n\n    // Un-premultiply alpha before applying the color matrix. See issue #3539.\n    if (c.a > 0.0) {\n      c.rgb /= c.a;\n    }\n\n    vec4 result;\n\n    result.r = (m[0] * c.r);\n        result.r += (m[1] * c.g);\n        result.r += (m[2] * c.b);\n        result.r += (m[3] * c.a);\n        result.r += m[4];\n\n    result.g = (m[5] * c.r);\n        result.g += (m[6] * c.g);\n        result.g += (m[7] * c.b);\n        result.g += (m[8] * c.a);\n        result.g += m[9];\n\n    result.b = (m[10] * c.r);\n       result.b += (m[11] * c.g);\n       result.b += (m[12] * c.b);\n       result.b += (m[13] * c.a);\n       result.b += m[14];\n\n    result.a = (m[15] * c.r);\n       result.a += (m[16] * c.g);\n       result.a += (m[17] * c.b);\n       result.a += (m[18] * c.a);\n       result.a += m[19];\n\n    vec3 rgb = mix(c.rgb, result.rgb, uAlpha);\n\n    // Premultiply alpha again.\n    rgb *= result.a;\n\n    gl_FragColor = vec4(rgb, result.a);\n}\n";
    var ColorMatrixFilter = function(_super) {
      __extends(ColorMatrixFilter2, _super);
      function ColorMatrixFilter2() {
        var _this = this;
        var uniforms = {
          m: new Float32Array([
            1,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            0,
            1,
            0
          ]),
          uAlpha: 1
        };
        _this = _super.call(this, core.defaultFilterVertex, fragment, uniforms) || this;
        _this.alpha = 1;
        return _this;
      }
      ColorMatrixFilter2.prototype._loadMatrix = function(matrix, multiply) {
        if (multiply === void 0) {
          multiply = false;
        }
        var newMatrix = matrix;
        if (multiply) {
          this._multiply(newMatrix, this.uniforms.m, matrix);
          newMatrix = this._colorMatrix(newMatrix);
        }
        this.uniforms.m = newMatrix;
      };
      ColorMatrixFilter2.prototype._multiply = function(out, a, b) {
        out[0] = a[0] * b[0] + a[1] * b[5] + a[2] * b[10] + a[3] * b[15];
        out[1] = a[0] * b[1] + a[1] * b[6] + a[2] * b[11] + a[3] * b[16];
        out[2] = a[0] * b[2] + a[1] * b[7] + a[2] * b[12] + a[3] * b[17];
        out[3] = a[0] * b[3] + a[1] * b[8] + a[2] * b[13] + a[3] * b[18];
        out[4] = a[0] * b[4] + a[1] * b[9] + a[2] * b[14] + a[3] * b[19] + a[4];
        out[5] = a[5] * b[0] + a[6] * b[5] + a[7] * b[10] + a[8] * b[15];
        out[6] = a[5] * b[1] + a[6] * b[6] + a[7] * b[11] + a[8] * b[16];
        out[7] = a[5] * b[2] + a[6] * b[7] + a[7] * b[12] + a[8] * b[17];
        out[8] = a[5] * b[3] + a[6] * b[8] + a[7] * b[13] + a[8] * b[18];
        out[9] = a[5] * b[4] + a[6] * b[9] + a[7] * b[14] + a[8] * b[19] + a[9];
        out[10] = a[10] * b[0] + a[11] * b[5] + a[12] * b[10] + a[13] * b[15];
        out[11] = a[10] * b[1] + a[11] * b[6] + a[12] * b[11] + a[13] * b[16];
        out[12] = a[10] * b[2] + a[11] * b[7] + a[12] * b[12] + a[13] * b[17];
        out[13] = a[10] * b[3] + a[11] * b[8] + a[12] * b[13] + a[13] * b[18];
        out[14] = a[10] * b[4] + a[11] * b[9] + a[12] * b[14] + a[13] * b[19] + a[14];
        out[15] = a[15] * b[0] + a[16] * b[5] + a[17] * b[10] + a[18] * b[15];
        out[16] = a[15] * b[1] + a[16] * b[6] + a[17] * b[11] + a[18] * b[16];
        out[17] = a[15] * b[2] + a[16] * b[7] + a[17] * b[12] + a[18] * b[17];
        out[18] = a[15] * b[3] + a[16] * b[8] + a[17] * b[13] + a[18] * b[18];
        out[19] = a[15] * b[4] + a[16] * b[9] + a[17] * b[14] + a[18] * b[19] + a[19];
        return out;
      };
      ColorMatrixFilter2.prototype._colorMatrix = function(matrix) {
        var m = new Float32Array(matrix);
        m[4] /= 255;
        m[9] /= 255;
        m[14] /= 255;
        m[19] /= 255;
        return m;
      };
      ColorMatrixFilter2.prototype.brightness = function(b, multiply) {
        var matrix = [
          b,
          0,
          0,
          0,
          0,
          0,
          b,
          0,
          0,
          0,
          0,
          0,
          b,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.tint = function(color, multiply) {
        var r = color >> 16 & 255;
        var g = color >> 8 & 255;
        var b = color & 255;
        var matrix = [
          r / 255,
          0,
          0,
          0,
          0,
          0,
          g / 255,
          0,
          0,
          0,
          0,
          0,
          b / 255,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.greyscale = function(scale, multiply) {
        var matrix = [
          scale,
          scale,
          scale,
          0,
          0,
          scale,
          scale,
          scale,
          0,
          0,
          scale,
          scale,
          scale,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.blackAndWhite = function(multiply) {
        var matrix = [
          0.3,
          0.6,
          0.1,
          0,
          0,
          0.3,
          0.6,
          0.1,
          0,
          0,
          0.3,
          0.6,
          0.1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.hue = function(rotation, multiply) {
        rotation = (rotation || 0) / 180 * Math.PI;
        var cosR = Math.cos(rotation);
        var sinR = Math.sin(rotation);
        var sqrt = Math.sqrt;
        var w = 1 / 3;
        var sqrW = sqrt(w);
        var a00 = cosR + (1 - cosR) * w;
        var a01 = w * (1 - cosR) - sqrW * sinR;
        var a02 = w * (1 - cosR) + sqrW * sinR;
        var a10 = w * (1 - cosR) + sqrW * sinR;
        var a11 = cosR + w * (1 - cosR);
        var a12 = w * (1 - cosR) - sqrW * sinR;
        var a20 = w * (1 - cosR) - sqrW * sinR;
        var a21 = w * (1 - cosR) + sqrW * sinR;
        var a22 = cosR + w * (1 - cosR);
        var matrix = [
          a00,
          a01,
          a02,
          0,
          0,
          a10,
          a11,
          a12,
          0,
          0,
          a20,
          a21,
          a22,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.contrast = function(amount, multiply) {
        var v = (amount || 0) + 1;
        var o = -0.5 * (v - 1);
        var matrix = [
          v,
          0,
          0,
          0,
          o,
          0,
          v,
          0,
          0,
          o,
          0,
          0,
          v,
          0,
          o,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.saturate = function(amount, multiply) {
        if (amount === void 0) {
          amount = 0;
        }
        var x = amount * 2 / 3 + 1;
        var y = (x - 1) * -0.5;
        var matrix = [
          x,
          y,
          y,
          0,
          0,
          y,
          x,
          y,
          0,
          0,
          y,
          y,
          x,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.desaturate = function() {
        this.saturate(-1);
      };
      ColorMatrixFilter2.prototype.negative = function(multiply) {
        var matrix = [
          -1,
          0,
          0,
          1,
          0,
          0,
          -1,
          0,
          1,
          0,
          0,
          0,
          -1,
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.sepia = function(multiply) {
        var matrix = [
          0.393,
          0.7689999,
          0.18899999,
          0,
          0,
          0.349,
          0.6859999,
          0.16799999,
          0,
          0,
          0.272,
          0.5339999,
          0.13099999,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.technicolor = function(multiply) {
        var matrix = [
          1.9125277891456083,
          -0.8545344976951645,
          -0.09155508482755585,
          0,
          11.793603434377337,
          -0.3087833385928097,
          1.7658908555458428,
          -0.10601743074722245,
          0,
          -70.35205161461398,
          -0.231103377548616,
          -0.7501899197440212,
          1.847597816108189,
          0,
          30.950940869491138,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.polaroid = function(multiply) {
        var matrix = [
          1.438,
          -0.062,
          -0.062,
          0,
          0,
          -0.122,
          1.378,
          -0.122,
          0,
          0,
          -0.016,
          -0.016,
          1.483,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.toBGR = function(multiply) {
        var matrix = [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.kodachrome = function(multiply) {
        var matrix = [
          1.1285582396593525,
          -0.3967382283601348,
          -0.03992559172921793,
          0,
          63.72958762196502,
          -0.16404339962244616,
          1.0835251566291304,
          -0.05498805115633132,
          0,
          24.732407896706203,
          -0.16786010706155763,
          -0.5603416277695248,
          1.6014850761964943,
          0,
          35.62982807460946,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.browni = function(multiply) {
        var matrix = [
          0.5997023498159715,
          0.34553243048391263,
          -0.2708298674538042,
          0,
          47.43192855600873,
          -0.037703249837783157,
          0.8609577587992641,
          0.15059552388459913,
          0,
          -36.96841498319127,
          0.24113635128153335,
          -0.07441037908422492,
          0.44972182064877153,
          0,
          -7.562075277591283,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.vintage = function(multiply) {
        var matrix = [
          0.6279345635605994,
          0.3202183420819367,
          -0.03965408211312453,
          0,
          9.651285835294123,
          0.02578397704808868,
          0.6441188644374771,
          0.03259127616149294,
          0,
          7.462829176470591,
          0.0466055556782719,
          -0.0851232987247891,
          0.5241648018700465,
          0,
          5.159190588235296,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.colorTone = function(desaturation, toned, lightColor, darkColor, multiply) {
        desaturation = desaturation || 0.2;
        toned = toned || 0.15;
        lightColor = lightColor || 16770432;
        darkColor = darkColor || 3375104;
        var lR = (lightColor >> 16 & 255) / 255;
        var lG = (lightColor >> 8 & 255) / 255;
        var lB = (lightColor & 255) / 255;
        var dR = (darkColor >> 16 & 255) / 255;
        var dG = (darkColor >> 8 & 255) / 255;
        var dB = (darkColor & 255) / 255;
        var matrix = [
          0.3,
          0.59,
          0.11,
          0,
          0,
          lR,
          lG,
          lB,
          desaturation,
          0,
          dR,
          dG,
          dB,
          toned,
          0,
          lR - dR,
          lG - dG,
          lB - dB,
          0,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.night = function(intensity, multiply) {
        intensity = intensity || 0.1;
        var matrix = [
          intensity * -2,
          -intensity,
          0,
          0,
          0,
          -intensity,
          0,
          intensity,
          0,
          0,
          0,
          intensity,
          intensity * 2,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.predator = function(amount, multiply) {
        var matrix = [
          11.224130630493164 * amount,
          -4.794486999511719 * amount,
          -2.8746118545532227 * amount,
          0 * amount,
          0.40342438220977783 * amount,
          -3.6330697536468506 * amount,
          9.193157196044922 * amount,
          -2.951810836791992 * amount,
          0 * amount,
          -1.316135048866272 * amount,
          -3.2184197902679443 * amount,
          -4.2375030517578125 * amount,
          7.476448059082031 * amount,
          0 * amount,
          0.8044459223747253 * amount,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.lsd = function(multiply) {
        var matrix = [
          2,
          -0.4,
          0.5,
          0,
          0,
          -0.5,
          2,
          -0.4,
          0,
          0,
          -0.4,
          -0.5,
          3,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, multiply);
      };
      ColorMatrixFilter2.prototype.reset = function() {
        var matrix = [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, false);
      };
      Object.defineProperty(ColorMatrixFilter2.prototype, "matrix", {
        get: function() {
          return this.uniforms.m;
        },
        set: function(value) {
          this.uniforms.m = value;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(ColorMatrixFilter2.prototype, "alpha", {
        get: function() {
          return this.uniforms.uAlpha;
        },
        set: function(value) {
          this.uniforms.uAlpha = value;
        },
        enumerable: false,
        configurable: true
      });
      return ColorMatrixFilter2;
    }(core.Filter);
    ColorMatrixFilter.prototype.grayscale = ColorMatrixFilter.prototype.greyscale;
    exports.ColorMatrixFilter = ColorMatrixFilter;
  }
});

// node_modules/simplex-noise/dist/esm/simplex-noise.js
var F2, G2, F3, G3, F4, G4, grad3, grad4;
var init_simplex_noise = __esm({
  "node_modules/simplex-noise/dist/esm/simplex-noise.js"() {
    init_shims();
    F2 = 0.5 * (Math.sqrt(3) - 1);
    G2 = (3 - Math.sqrt(3)) / 6;
    F3 = 1 / 3;
    G3 = 1 / 6;
    F4 = (Math.sqrt(5) - 1) / 4;
    G4 = (5 - Math.sqrt(5)) / 20;
    grad3 = new Float32Array([
      1,
      1,
      0,
      -1,
      1,
      0,
      1,
      -1,
      0,
      -1,
      -1,
      0,
      1,
      0,
      1,
      -1,
      0,
      1,
      1,
      0,
      -1,
      -1,
      0,
      -1,
      0,
      1,
      1,
      0,
      -1,
      1,
      0,
      1,
      -1,
      0,
      -1,
      -1
    ]);
    grad4 = new Float32Array([
      0,
      1,
      1,
      1,
      0,
      1,
      1,
      -1,
      0,
      1,
      -1,
      1,
      0,
      1,
      -1,
      -1,
      0,
      -1,
      1,
      1,
      0,
      -1,
      1,
      -1,
      0,
      -1,
      -1,
      1,
      0,
      -1,
      -1,
      -1,
      1,
      0,
      1,
      1,
      1,
      0,
      1,
      -1,
      1,
      0,
      -1,
      1,
      1,
      0,
      -1,
      -1,
      -1,
      0,
      1,
      1,
      -1,
      0,
      1,
      -1,
      -1,
      0,
      -1,
      1,
      -1,
      0,
      -1,
      -1,
      1,
      1,
      0,
      1,
      1,
      1,
      0,
      -1,
      1,
      -1,
      0,
      1,
      1,
      -1,
      0,
      -1,
      -1,
      1,
      0,
      1,
      -1,
      1,
      0,
      -1,
      -1,
      -1,
      0,
      1,
      -1,
      -1,
      0,
      -1,
      1,
      1,
      1,
      0,
      1,
      1,
      -1,
      0,
      1,
      -1,
      1,
      0,
      1,
      -1,
      -1,
      0,
      -1,
      1,
      1,
      0,
      -1,
      1,
      -1,
      0,
      -1,
      -1,
      1,
      0,
      -1,
      -1,
      -1,
      0
    ]);
  }
});

// node_modules/hsl-to-rgb-for-reals/converter.js
var require_converter = __commonJS({
  "node_modules/hsl-to-rgb-for-reals/converter.js"(exports, module2) {
    init_shims();
    var hslToRgb = function(hue, saturation, lightness) {
      if (hue == void 0) {
        return [0, 0, 0];
      }
      var chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
      var huePrime = hue / 60;
      var secondComponent = chroma * (1 - Math.abs(huePrime % 2 - 1));
      huePrime = Math.floor(huePrime);
      var red;
      var green;
      var blue;
      if (huePrime === 0) {
        red = chroma;
        green = secondComponent;
        blue = 0;
      } else if (huePrime === 1) {
        red = secondComponent;
        green = chroma;
        blue = 0;
      } else if (huePrime === 2) {
        red = 0;
        green = chroma;
        blue = secondComponent;
      } else if (huePrime === 3) {
        red = 0;
        green = secondComponent;
        blue = chroma;
      } else if (huePrime === 4) {
        red = secondComponent;
        green = 0;
        blue = chroma;
      } else if (huePrime === 5) {
        red = chroma;
        green = 0;
        blue = secondComponent;
      }
      var lightnessAdjustment = lightness - chroma / 2;
      red += lightnessAdjustment;
      green += lightnessAdjustment;
      blue += lightnessAdjustment;
      return [
        Math.abs(Math.round(red * 255)),
        Math.abs(Math.round(green * 255)),
        Math.abs(Math.round(blue * 255))
      ];
    };
    module2.exports = hslToRgb;
  }
});

// node_modules/hsl-to-hex/index.js
var require_hsl_to_hex = __commonJS({
  "node_modules/hsl-to-hex/index.js"(exports, module2) {
    init_shims();
    var toRgb = require_converter();
    function max(val, n) {
      return val > n ? n : val;
    }
    function min(val, n) {
      return val < n ? n : val;
    }
    function cycle(val) {
      val = max(val, 1e7);
      val = min(val, -1e7);
      while (val < 0) {
        val += 360;
      }
      while (val > 359) {
        val -= 360;
      }
      return val;
    }
    function hsl(hue, saturation, luminosity) {
      hue = cycle(hue);
      saturation = min(max(saturation, 100), 0);
      luminosity = min(max(luminosity, 100), 0);
      saturation /= 100;
      luminosity /= 100;
      var rgb = toRgb(hue, saturation, luminosity);
      return "#" + rgb.map(function(n) {
        return (256 + n).toString(16).substr(-2);
      }).join("");
    }
    module2.exports = hsl;
  }
});

// node_modules/debounce/index.js
var require_debounce = __commonJS({
  "node_modules/debounce/index.js"(exports, module2) {
    init_shims();
    function debounce(func, wait, immediate) {
      var timeout, args, context, timestamp, result;
      if (wait == null)
        wait = 100;
      function later() {
        var last = Date.now() - timestamp;
        if (last < wait && last >= 0) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
            context = args = null;
          }
        }
      }
      ;
      var debounced = function() {
        context = this;
        args = arguments;
        timestamp = Date.now();
        var callNow = immediate && !timeout;
        if (!timeout)
          timeout = setTimeout(later, wait);
        if (callNow) {
          result = func.apply(context, args);
          context = args = null;
        }
        return result;
      };
      debounced.clear = function() {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
      };
      debounced.flush = function() {
        if (timeout) {
          result = func.apply(context, args);
          context = args = null;
          clearTimeout(timeout);
          timeout = null;
        }
      };
      return debounced;
    }
    debounce.debounce = debounce;
    module2.exports = debounce;
  }
});

// .svelte-kit/output/server/chunks/__layout-0ea74923.js
var layout_0ea74923_exports = {};
__export(layout_0ea74923_exports, {
  default: () => _layout,
  load: () => load
});
var import_app, import_graphics, import_display, import_constants, import_core, import_interaction, import_ticker, import_filter_kawase_blur, import_filter_noise, import_filter_color_matrix, import_hsl_to_hex, import_debounce, import_utils, import_cookie, css, Progress, load, _layout;
var init_layout_0ea74923 = __esm({
  ".svelte-kit/output/server/chunks/__layout-0ea74923.js"() {
    init_shims();
    init_app_03b8560f();
    init_Scene_svelte_svelte_type_style_lang_2822b95d();
    init_index_fa8f98f1();
    init_dist2();
    import_app = __toModule(require_app());
    import_graphics = __toModule(require_graphics());
    import_display = __toModule(require_display());
    import_constants = __toModule(require_constants());
    import_core = __toModule(require_core());
    import_interaction = __toModule(require_interaction());
    import_ticker = __toModule(require_ticker());
    import_filter_kawase_blur = __toModule(require_filter_kawase_blur_cjs());
    import_filter_noise = __toModule(require_filter_noise());
    import_filter_color_matrix = __toModule(require_filter_color_matrix());
    init_simplex_noise();
    import_hsl_to_hex = __toModule(require_hsl_to_hex());
    import_debounce = __toModule(require_debounce());
    import_utils = __toModule(require_utils());
    import_cookie = __toModule(require_cookie());
    init_dist();
    css = {
      code: '.progress.svelte-1e2qztx.svelte-1e2qztx{position:fixed;bottom:2.5rem;left:2.5rem;right:2.5rem;font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"}.progress.svelte-1e2qztx>div.svelte-1e2qztx{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline}.number.svelte-1e2qztx.svelte-1e2qztx{font-size:clamp(4rem, 2.9038461538rem + 4.8717948718vw, 8.75rem)}@media(prefers-reduced-motion: reduce){.number.svelte-1e2qztx.svelte-1e2qztx{display:none}}.progress-bar.svelte-1e2qztx.svelte-1e2qztx{height:0.0625rem;background-color:hsla(var(--on-base-h, 0), var(--on-base-s, 0%), var(--on-base-l, 100%), 0.1)}@media(prefers-reduced-motion: reduce){.progress-bar.svelte-1e2qztx.svelte-1e2qztx{display:none !important}}.progress-sliver.svelte-1e2qztx.svelte-1e2qztx{width:var(--width);background-color:hsla(var(--on-base-h, 0), var(--on-base-s, 0%), var(--on-base-l, 100%), 0.5);height:100%}',
      map: null
    };
    Progress = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $$unsubscribe_progress = noop, $$subscribe_progress = () => ($$unsubscribe_progress(), $$unsubscribe_progress = subscribe(progress, ($$value) => $$value), progress);
      let $page, $$unsubscribe_page;
      $$unsubscribe_page = subscribe(page, (value) => $page = value);
      let progress = tweened(0);
      $$subscribe_progress();
      $$result.css.add(css);
      $$unsubscribe_progress();
      $$unsubscribe_page();
      return `${$$result.head += `<script data-svelte="svelte-kw2fqm">var preProgress = 0;

        setTimeout(() => {
            if (document.getElementById("preProgressNumber") && document.getElementById("preProgressNumber").innerText) {
                setInterval(() => {
                    if (document.getElementById("preProgressNumber") && document.getElementById("preProgressNumber").innerText) {
                        if (parseInt(document.getElementById("preProgressNumber").innerText) < 70) {
                            document.getElementById("preProgressNumber").innerText = parseInt(document.getElementById("preProgressNumber").innerText) + 1;
                            preProgress = parseInt(document.getElementById("preProgressNumber").innerText) + 1;
                            document.getElementById("preProgressSliver").style.setProperty('--width', \`\${preProgress}%\`);
                        }
                    }
                }, 100);
            }
        }, 500);
    <\/script>`, ""}

<div class="${"progress svelte-1e2qztx"}"><div class="${"svelte-1e2qztx"}"><div class="${"number svelte-1e2qztx"}">${`<span id="${"preProgressNumber"}">0</span>%`}</div>
        <div class="${"path"}">loading ${escape($page.path == "/" ? "/start" : $page.path)}</div></div>
    
    <div class="${"progress-bar svelte-1e2qztx"}">${`<div id="${"preProgressSliver"}" class="${"progress-sliver svelte-1e2qztx"}"></div>`}</div>
</div>`;
    });
    load = async ({ page: page2 }) => ({ props: { key: page2.path } });
    _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { key } = $$props;
      scheme.subscribe((value) => {
      });
      if ($$props.key === void 0 && $$bindings.key && key !== void 0)
        $$bindings.key(key);
      return `

${`<div>${validate_component(Progress, "Progress").$$render($$result, {}, {}, {})}</div>`}`;
    });
  }
});

// .svelte-kit/output/server/chunks/__error-bfa49163.js
var error_bfa49163_exports = {};
__export(error_bfa49163_exports, {
  default: () => _error,
  load: () => load2
});
function load2({ error: error2, status }) {
  console.log(error2);
  return {
    props: {
      title: status,
      message: error2.message.replace("Not found: ", "")
    }
  };
}
var import_cookie2, css2, _error;
var init_error_bfa49163 = __esm({
  ".svelte-kit/output/server/chunks/__error-bfa49163.js"() {
    init_shims();
    init_app_03b8560f();
    import_cookie2 = __toModule(require_cookie());
    init_dist();
    css2 = {
      code: "section.svelte-1roueoo{box-sizing:border-box;padding:9.375rem var(--core-padding)}div.svelte-1roueoo{max-width:var(--core-max-width);margin:0 auto}h1.svelte-1roueoo{font-family:var(--serif);font-weight:700;font-size:clamp(2rem, 0.875rem + 5vw, 6.875rem);line-height:1;margin:0.5em 0}p.svelte-1roueoo{font-size:1.25rem}a.svelte-1roueoo{text-decoration:underline}",
      map: null
    };
    _error = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { title } = $$props;
      let { message } = $$props;
      if ($$props.title === void 0 && $$bindings.title && title !== void 0)
        $$bindings.title(title);
      if ($$props.message === void 0 && $$bindings.message && message !== void 0)
        $$bindings.message(message);
      $$result.css.add(css2);
      return `${$$result.head += `${$$result.title = `<title>Armin Neuhauser | ${escape(title)} Error</title>`, ""}`, ""}

<section class="${"svelte-1roueoo"}"><div class="${"svelte-1roueoo"}"><h1 class="${"svelte-1roueoo"}">${escape(title)}</h1>
        <p class="${"svelte-1roueoo"}">Entschuldige, diese Seite wurde nicht gefunden: ${escape(message)}</p>
        <p class="${"svelte-1roueoo"}"><a href="${"/"}" class="${"svelte-1roueoo"}">Zur Startseite</a></p></div>
</section>`;
    });
  }
});

// .svelte-kit/output/server/chunks/DeathStar-d5b8ee16.js
var deathStarIcon, css3, DeathStar;
var init_DeathStar_d5b8ee16 = __esm({
  ".svelte-kit/output/server/chunks/DeathStar-d5b8ee16.js"() {
    init_shims();
    init_app_03b8560f();
    init_index_fa8f98f1();
    deathStarIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\n    <path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M12.5745 3.01804C12.4465 3.00607 12.3175 3 12.1875 3C12.1623 3 12.1372 3.00023 12.112 3.00068C12.0747 3.00023 12.0374 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C12.0374 21 12.0747 20.9998 12.112 20.9993C12.1372 20.9998 12.1623 21 12.1875 21C12.3175 21 12.4465 20.9939 12.5745 20.982C17.2773 20.6857 21 16.7776 21 12C21 7.2224 17.2773 3.31427 12.5745 3.01804ZM12 20.25V3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25ZM15.6276 19.4117C18.3652 18.0693 20.25 15.2548 20.25 12C20.25 8.74524 18.3652 5.93069 15.6276 4.58826C17.2118 6.21185 18.2499 8.92594 18.2499 12C18.2499 15.0741 17.2118 17.7881 15.6276 19.4117ZM15.8523 17.945C16.8553 16.4559 17.4999 14.3563 17.4999 12C17.4999 9.64371 16.8553 7.54407 15.8523 6.05505C15.2588 5.17405 14.5597 4.53038 13.8092 4.15059C14.8183 5.69296 15.5 8.6302 15.5 12C15.5 15.3698 14.8183 18.307 13.8092 19.8494C14.5597 19.4696 15.2588 18.8259 15.8523 17.945ZM12.75 4.03182C12.8015 4.07978 12.8552 4.13535 12.9111 4.19959C13.2261 4.56167 13.544 5.12906 13.8259 5.89509C14.3876 7.42122 14.75 9.5795 14.75 12C14.75 14.4205 14.3876 16.5788 13.8259 18.1049C13.544 18.8709 13.2261 19.4383 12.9111 19.8004C12.8552 19.8646 12.8015 19.9202 12.75 19.9682V4.03182Z"/>\n</svg>';
    css3 = {
      code: "button.svelte-iyvpaf{display:flex}",
      map: null
    };
    DeathStar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      $$result.css.add(css3);
      return `<button class="${"death-star svelte-iyvpaf"}" title="${"Farbschema wechseln"}"><!-- HTML_TAG_START -->${deathStarIcon}<!-- HTML_TAG_END -->
</button>`;
    });
  }
});

// .svelte-kit/output/server/chunks/IntersectionObserver-c7b56316.js
var IntersectionObserver_1;
var init_IntersectionObserver_c7b56316 = __esm({
  ".svelte-kit/output/server/chunks/IntersectionObserver-c7b56316.js"() {
    init_shims();
    init_app_03b8560f();
    IntersectionObserver_1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { element = null } = $$props;
      let { once = false } = $$props;
      let { root = null } = $$props;
      let { rootMargin = "0px" } = $$props;
      let { threshold = 0 } = $$props;
      let { entry = null } = $$props;
      let { intersecting = false } = $$props;
      let { observer = null } = $$props;
      createEventDispatcher();
      if ($$props.element === void 0 && $$bindings.element && element !== void 0)
        $$bindings.element(element);
      if ($$props.once === void 0 && $$bindings.once && once !== void 0)
        $$bindings.once(once);
      if ($$props.root === void 0 && $$bindings.root && root !== void 0)
        $$bindings.root(root);
      if ($$props.rootMargin === void 0 && $$bindings.rootMargin && rootMargin !== void 0)
        $$bindings.rootMargin(rootMargin);
      if ($$props.threshold === void 0 && $$bindings.threshold && threshold !== void 0)
        $$bindings.threshold(threshold);
      if ($$props.entry === void 0 && $$bindings.entry && entry !== void 0)
        $$bindings.entry(entry);
      if ($$props.intersecting === void 0 && $$bindings.intersecting && intersecting !== void 0)
        $$bindings.intersecting(intersecting);
      if ($$props.observer === void 0 && $$bindings.observer && observer !== void 0)
        $$bindings.observer(observer);
      return `${slots.default ? slots.default({ intersecting, entry, observer }) : ``}`;
    });
  }
});

// .svelte-kit/output/server/chunks/arrow-c94cf332.js
var arrow;
var init_arrow_c94cf332 = __esm({
  ".svelte-kit/output/server/chunks/arrow-c94cf332.js"() {
    init_shims();
    arrow = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n    <path d="M23.854 11.646a.5.5 0 0 1 0 .708l-5 5a.5.5 0 0 1-.708-.708L22.793 12l-4.647-4.646a.5.5 0 0 1 .708-.708l5 5Z" fill="currentColor"/>\n    <path d="M24 12a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1 0-1h23a.5.5 0 0 1 .5.5Z" fill="currentColor"/>\n</svg>\n';
  }
});

// .svelte-kit/output/server/chunks/index-8451d8a1.js
var index_8451d8a1_exports = {};
__export(index_8451d8a1_exports, {
  default: () => Routes,
  prerender: () => prerender
});
var import_cookie3, css$3, Hero, css$2, Teaser, wheel, css$1, LatestWork, css4, Wisdom, prerender, Routes;
var init_index_8451d8a1 = __esm({
  ".svelte-kit/output/server/chunks/index-8451d8a1.js"() {
    init_shims();
    init_app_03b8560f();
    init_DeathStar_d5b8ee16();
    init_IntersectionObserver_c7b56316();
    init_index_fa8f98f1();
    init_arrow_c94cf332();
    import_cookie3 = __toModule(require_cookie());
    init_dist();
    css$3 = {
      code: '@keyframes svelte-1qjbrof-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-1qjbrof-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-1qjbrof-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1qjbrof-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1qjbrof-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1qjbrof-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-1qjbrof-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-1qjbrof-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-1qjbrof-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-1qjbrof-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-1qjbrof-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}.hero.svelte-1qjbrof.svelte-1qjbrof.svelte-1qjbrof{align-items:start;box-sizing:border-box;display:grid;grid-column-gap:0;grid-gap:0.3125rem;grid-template-columns:auto clamp(19.375rem, 11rem + 28vw, 160rem) auto;grid-template-rows:1fr auto;min-height:var(--app-height, 100vh);padding:var(--core-padding) 0;z-index:1}.headline.svelte-1qjbrof.svelte-1qjbrof.svelte-1qjbrof{position:relative;aspect-ratio:1;align-self:center;grid-column:2}.headline.svelte-1qjbrof .sphere.svelte-1qjbrof.svelte-1qjbrof{animation:svelte-1qjbrof-fadein 2s var(--easing) forwards;display:block;padding-bottom:100%;background-color:rgba(255, 255, 255, 0.5);border:1px solid rgba(255, 255, 255, 0.8);border-radius:50%;mix-blend-mode:soft-light;will-change:opacity;opacity:0}h1.svelte-1qjbrof.svelte-1qjbrof.svelte-1qjbrof{font-family:var(--serif);font-weight:700;font-size:clamp(2.875rem, 1.7524271845rem + 3.5922330097vw, 7.5rem);line-height:0.85;text-align:center;margin:0;position:absolute;top:0;left:0;bottom:0;right:0;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:1}[color-scheme="highcontrast"] h1.svelte-1qjbrof.svelte-1qjbrof.svelte-1qjbrof{line-height:1}[color-scheme="highcontrast"] h1.svelte-1qjbrof span.svelte-1qjbrof.svelte-1qjbrof{margin:0 !important}@media(prefers-reduced-motion: no-preference){h1.svelte-1qjbrof.svelte-1qjbrof.svelte-1qjbrof{opacity:0;animation:svelte-1qjbrof-fadein-from-primary 2s var(--easing) forwards}}h1.svelte-1qjbrof span.svelte-1qjbrof.svelte-1qjbrof{display:block}h1.svelte-1qjbrof span.svelte-1qjbrof.svelte-1qjbrof:first-child{margin-right:0.6em}h1.svelte-1qjbrof span.svelte-1qjbrof.svelte-1qjbrof:last-child{margin-left:1em}@media(prefers-reduced-motion: no-preference){h1.svelte-1qjbrof span.svelte-1qjbrof.svelte-1qjbrof{animation:svelte-1qjbrof-to-top-10 0.5s var(--easing) forwards}}.bottom.svelte-1qjbrof.svelte-1qjbrof.svelte-1qjbrof{grid-column:1/span 3;padding:0 var(--core-padding)}.bottom.svelte-1qjbrof>div.svelte-1qjbrof.svelte-1qjbrof{display:grid;grid-template-columns:1.875rem 1fr 1.875rem;max-width:var(--core-max-width);margin:0 auto;align-items:center}@media(min-width: 768px){.bottom.svelte-1qjbrof>div.svelte-1qjbrof.svelte-1qjbrof{grid-template-columns:2.75rem 1fr 2.75rem}}@media(prefers-reduced-motion: no-preference){.bottom.svelte-1qjbrof>div.svelte-1qjbrof.svelte-1qjbrof{animation:svelte-1qjbrof-fadein-from-primary 0.5s var(--easing) forwards}}.bottom.svelte-1qjbrof .claim.svelte-1qjbrof.svelte-1qjbrof{grid-column:2}.bottom.svelte-1qjbrof h2.svelte-1qjbrof.svelte-1qjbrof,.bottom.svelte-1qjbrof h3.svelte-1qjbrof.svelte-1qjbrof{font-size:clamp(0.9375rem, 0.625rem + 0.390625vw, 1.25rem);font-weight:400;margin:0;text-align:center;opacity:0.75}[color-scheme="highcontrast"] .bottom.svelte-1qjbrof h2.svelte-1qjbrof.svelte-1qjbrof,[color-scheme="highcontrast"] .bottom.svelte-1qjbrof h3.svelte-1qjbrof.svelte-1qjbrof{opacity:1}.bottom.svelte-1qjbrof .death-star{margin-right:-0.8125rem;padding:0.625rem}@media(min-width: 768px){.bottom.svelte-1qjbrof .death-star{display:none}}.scroll-please.svelte-1qjbrof.svelte-1qjbrof.svelte-1qjbrof{--size:0.4375rem;grid-column:1;grid-row:1;position:relative;width:2.75rem;height:2.75rem;display:flex;align-items:center;justify-content:center;margin-left:-1.0625rem}@media(min-width: 768px){.scroll-please.svelte-1qjbrof.svelte-1qjbrof.svelte-1qjbrof{--size:0.5625rem;grid-column:3;margin-left:0.9375rem}}.scroll-please.svelte-1qjbrof:hover div.svelte-1qjbrof span.svelte-1qjbrof{color:var(--primary)}.scroll-please.svelte-1qjbrof div.svelte-1qjbrof.svelte-1qjbrof{position:relative;width:calc(var(--size) + 0.125rem);height:calc((var(--size) + 0.125rem) * 3);pointer-events:none}.scroll-please.svelte-1qjbrof div i.svelte-1qjbrof.svelte-1qjbrof{position:absolute;top:0;width:var(--size);height:var(--size);border:0.0625rem solid hsla(var(--on-base-h), var(--on-base-s), var(--on-base-l), 0.5);border-radius:50%}@media(prefers-reduced-motion: no-preference){.scroll-please.svelte-1qjbrof div i.svelte-1qjbrof.svelte-1qjbrof{animation:svelte-1qjbrof-scroll 1.5s var(--easing) infinite}}.scroll-please.svelte-1qjbrof div i.svelte-1qjbrof.svelte-1qjbrof:nth-child(2){animation-delay:0.2s;border-color:hsla(var(--on-base-h), var(--on-base-s), var(--on-base-l), 0.25);transform:translate3d(0, 50%, 0)}.scroll-please.svelte-1qjbrof div i.svelte-1qjbrof.svelte-1qjbrof:nth-child(3){animation-delay:0.4s;border-color:hsla(var(--on-base-h), var(--on-base-s), var(--on-base-l), 0.15);transform:translate3d(0, 100%, 0)}.scroll-please.svelte-1qjbrof div.svelte-1qjbrof span.svelte-1qjbrof{position:absolute;transform:rotate(270deg);transform-origin:top left;top:-0.5rem;left:0;left:1;font-size:calc(var(--size) + 0.125rem);line-height:var(--size);transition:color 0.2s var(--easing)}',
      map: null
    };
    Hero = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { scrollY } = $$props;
      if ($$props.scrollY === void 0 && $$bindings.scrollY && scrollY !== void 0)
        $$bindings.scrollY(scrollY);
      $$result.css.add(css$3);
      return `<section class="${"hero svelte-1qjbrof"}"><div class="${"headline svelte-1qjbrof"}"><h1 style="${"transform: translate(0," + escape(scrollY / 4) + "px)"}" class="${"svelte-1qjbrof"}"><span class="${"svelte-1qjbrof"}">Digital</span>
            <span class="${"svelte-1qjbrof"}">Experience</span>
            <span class="${"svelte-1qjbrof"}">Creator</span></h1>
        <div class="${"sphere svelte-1qjbrof"}" style="${"transform: translate(0," + escape(scrollY / 6) + "px)"}"></div></div>
    <div class="${"bottom svelte-1qjbrof"}" style="${"transform: translate(0," + escape(scrollY / 8) + "px)"}"><div class="${"svelte-1qjbrof"}"><button title="${"runterscrollen"}" class="${"scroll-please svelte-1qjbrof"}"><div class="${"svelte-1qjbrof"}"><i class="${"svelte-1qjbrof"}"></i>
                    <i class="${"svelte-1qjbrof"}"></i>
                    <i class="${"svelte-1qjbrof"}"></i>
                    <span class="${"sr-only svelte-1qjbrof"}">scroll</span></div></button>
            <div class="${"claim svelte-1qjbrof"}"><h2 class="${"svelte-1qjbrof"}">Konzept, Design &amp; Entwicklung</h2>
                <h3 class="${"svelte-1qjbrof"}">made in Vienna</h3></div>
            ${validate_component(DeathStar, "DeathStar").$$render($$result, {}, {}, {})}</div></div>
</section>`;
    });
    css$2 = {
      code: '@keyframes svelte-1cxgjsb-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-1cxgjsb-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-1cxgjsb-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1cxgjsb-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1cxgjsb-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1cxgjsb-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-1cxgjsb-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-1cxgjsb-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-1cxgjsb-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-1cxgjsb-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-1cxgjsb-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}.teaser.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{position:relative;margin-top:calc(var(--app-height, -100vh) * -1);pointer-events:none}.teaser.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb::after{content:"";display:block;height:calc(var(--app-height, 100vh) * 1.5);width:100%;pointer-events:none;position:relative}.inner.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{position:relative;top:0;height:var(--app-height, 100vh);display:grid;grid-template-rows:1fr repeat(3, auto) 1fr;padding:5rem var(--core-padding) var(--core-padding);box-sizing:border-box;max-width:calc(var(--core-max-width) + var(--core-padding) * 2);margin:0 auto}.inner.svelte-1cxgjsb>.svelte-1cxgjsb.svelte-1cxgjsb{pointer-events:auto}@media(prefers-reduced-motion: no-preference){.inner.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{position:sticky}}@media(min-width: 768px){.inner.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{grid-template-columns:minmax(3.125rem, auto) minmax(auto, 79.375rem) minmax(3.125rem, auto);grid-template-rows:repeat(4, auto);padding-top:6.25rem;align-items:center}}header.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{grid-row:2;align-self:end;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:0.5em;width:100%;overflow:hidden;flex:1 0 auto;margin-bottom:0.625rem;position:relative;z-index:3}@media(min-width: 768px){header.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{grid-column:1/span 2;grid-row:2;justify-content:flex-start;align-self:flex-end;margin-bottom:0;width:auto;justify-self:start}[color-scheme="light"] header.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb,[color-scheme="highcontrast"] header.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{background-color:var(--base);padding-right:1em}}header.svelte-1cxgjsb h1.svelte-1cxgjsb.svelte-1cxgjsb{font-size:1.625rem;margin:0;transform:translate3d(0, 100%, 0)}@media(min-width: 768px){header.svelte-1cxgjsb h1.svelte-1cxgjsb.svelte-1cxgjsb{font-size:clamp(4.5rem, 2.9166666667rem + 3.2986111111vw, 6.875rem)}}header.svelte-1cxgjsb div.svelte-1cxgjsb.svelte-1cxgjsb{font-family:var(--sans);font-weight:400;font-size:0.875rem;transform:translate3d(0, 100%, 0)}@media(min-width: 768px){header.svelte-1cxgjsb div.svelte-1cxgjsb.svelte-1cxgjsb{font-size:clamp(1.125rem, 0.875rem + 0.5208333333vw, 1.5rem)}}header.intersecting.svelte-1cxgjsb h1.svelte-1cxgjsb.svelte-1cxgjsb,header.intersecting.svelte-1cxgjsb div.svelte-1cxgjsb.svelte-1cxgjsb{animation:svelte-1cxgjsb-to-top 0.8s var(--easing) forwards}figure.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{grid-row:3;display:flex;margin:0;aspect-ratio:0.8;justify-self:start;overflow:hidden;width:100%;max-height:100%;position:relative;z-index:1}@media(min-width: 768px){figure.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{aspect-ratio:1.77778;grid-column:2;grid-row:2/span 2;justify-self:center}}figure.svelte-1cxgjsb a.svelte-1cxgjsb.svelte-1cxgjsb{display:flex}figure.svelte-1cxgjsb picture.svelte-1cxgjsb.svelte-1cxgjsb{flex-basis:100%;pointer-events:none}figure.svelte-1cxgjsb img.svelte-1cxgjsb.svelte-1cxgjsb{transform-origin:bottom center}footer.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{grid-row:4;width:100%;position:relative;z-index:2}@media(min-width: 768px){footer.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{grid-column:1/span 2;grid-row:3;align-self:flex-start;padding:0 0 0 0.3em;width:auto;justify-self:start}[color-scheme="light"] footer.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb,[color-scheme="highcontrast"] footer.svelte-1cxgjsb.svelte-1cxgjsb.svelte-1cxgjsb{background-color:var(--base);padding-right:1em}}footer.svelte-1cxgjsb div.svelte-1cxgjsb.svelte-1cxgjsb{display:flex;align-items:center;gap:0.625rem}footer.svelte-1cxgjsb div.svelte-1cxgjsb.svelte-1cxgjsb::before{content:"";height:1px;flex:1 0 auto;background-color:var(--on-base);transform-origin:top left;transform:scaleX(0) translateY(-0.5px)}@media(min-width: 768px){footer.svelte-1cxgjsb div.svelte-1cxgjsb.svelte-1cxgjsb::before{display:none}}footer.svelte-1cxgjsb div.svelte-1cxgjsb a.svelte-1cxgjsb{display:flex;align-items:center;gap:0.5rem;text-transform:uppercase;font-size:0.75rem;font-weight:500;letter-spacing:0.03em;padding:0.625rem 0}@media(min-width: 768px){footer.svelte-1cxgjsb div.svelte-1cxgjsb a.svelte-1cxgjsb{font-size:0.875rem}}footer.svelte-1cxgjsb div a span.svelte-1cxgjsb.svelte-1cxgjsb{pointer-events:none}footer.svelte-1cxgjsb div a i.svelte-1cxgjsb.svelte-1cxgjsb{display:inline-flex;overflow:hidden}footer.svelte-1cxgjsb div a i i.svelte-1cxgjsb.svelte-1cxgjsb{display:inline-flex;transform:translate3d(-100%, 0, 0)}footer.svelte-1cxgjsb div a em.svelte-1cxgjsb.svelte-1cxgjsb{display:inline-flex;pointer-events:none;overflow:hidden;font-style:normal}footer.svelte-1cxgjsb div a em.svelte-1cxgjsb svg{transform:translate3d(-100%, 0, 0)}footer.intersecting.svelte-1cxgjsb div.svelte-1cxgjsb.svelte-1cxgjsb::before{animation:svelte-1cxgjsb-scale 0.5s var(--easing) forwards}footer.intersecting.svelte-1cxgjsb a i i.svelte-1cxgjsb.svelte-1cxgjsb{animation:svelte-1cxgjsb-to-right 0.2s 0.5s var(--easing) forwards}footer.intersecting.svelte-1cxgjsb a i:nth-child(2) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.54s}footer.intersecting.svelte-1cxgjsb a i:nth-child(3) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.58s}footer.intersecting.svelte-1cxgjsb a i:nth-child(4) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.62s}footer.intersecting.svelte-1cxgjsb a i:nth-child(5) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.66s}footer.intersecting.svelte-1cxgjsb a i:nth-child(6) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.7s}footer.intersecting.svelte-1cxgjsb a i:nth-child(7) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.74s}footer.intersecting.svelte-1cxgjsb a i:nth-child(8) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.82s}footer.intersecting.svelte-1cxgjsb a i:nth-child(9) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.86s}footer.intersecting.svelte-1cxgjsb a i:nth-child(10) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.9s}footer.intersecting.svelte-1cxgjsb a i:nth-child(11) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.94s}footer.intersecting.svelte-1cxgjsb a i:nth-child(12) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:0.98s}footer.intersecting.svelte-1cxgjsb a i:nth-child(13) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:1.02s}footer.intersecting.svelte-1cxgjsb a i:nth-child(14) i.svelte-1cxgjsb.svelte-1cxgjsb{animation-delay:1.06s}footer.intersecting.svelte-1cxgjsb a em.svelte-1cxgjsb svg{animation:svelte-1cxgjsb-to-right 0.8s 1.1s var(--easing) forwards}',
      map: null
    };
    Teaser = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { slug } = $$props;
      let { title } = $$props;
      let { year } = $$props;
      let { imageSm } = $$props;
      let { imageLg } = $$props;
      let teaser;
      let scale = 1;
      let opacity = 1;
      let element;
      let intersecting;
      let element2;
      let intersecting2;
      if ($$props.slug === void 0 && $$bindings.slug && slug !== void 0)
        $$bindings.slug(slug);
      if ($$props.title === void 0 && $$bindings.title && title !== void 0)
        $$bindings.title(title);
      if ($$props.year === void 0 && $$bindings.year && year !== void 0)
        $$bindings.year(year);
      if ($$props.imageSm === void 0 && $$bindings.imageSm && imageSm !== void 0)
        $$bindings.imageSm(imageSm);
      if ($$props.imageLg === void 0 && $$bindings.imageLg && imageLg !== void 0)
        $$bindings.imageLg(imageLg);
      $$result.css.add(css$2);
      let $$settled;
      let $$rendered;
      do {
        $$settled = true;
        $$rendered = `

<article class="${"teaser svelte-1cxgjsb"}" style="${"opacity: " + escape(opacity) + ";"}"${add_attribute("this", teaser, 0)}><div class="${"inner svelte-1cxgjsb"}">${validate_component(IntersectionObserver_1, "IntersectionObserver").$$render($$result, { element, intersecting }, {
          intersecting: ($$value) => {
            intersecting = $$value;
            $$settled = false;
          }
        }, {
          default: () => `<header class="${["svelte-1cxgjsb", intersecting ? "intersecting" : ""].join(" ").trim()}"${add_attribute("this", element, 0)}><h1 class="${"svelte-1cxgjsb"}">${escape(title)}</h1>
                <div class="${"svelte-1cxgjsb"}">${escape(year)}</div></header>`
        })}

        <figure class="${"svelte-1cxgjsb"}"><a sveltekit:prefetch href="${"/projekte/" + escape(slug)}" title="${"Projekt " + escape(title) + " ansehen"}" class="${"svelte-1cxgjsb"}"><picture class="${"svelte-1cxgjsb"}"><source media="${"(min-width: 768px)"}"${add_attribute("srcset", imageLg, 0)}>
                    <img${add_attribute("src", imageSm, 0)}${add_attribute("alt", title, 0)} style="${"transform: scale(" + escape(scale) + ");"}" class="${"svelte-1cxgjsb"}"></picture></a></figure>

        ${validate_component(IntersectionObserver_1, "IntersectionObserver").$$render($$result, {
          element: element2,
          intersecting: intersecting2
        }, {
          intersecting: ($$value) => {
            intersecting2 = $$value;
            $$settled = false;
          }
        }, {
          default: () => `<footer class="${["svelte-1cxgjsb", intersecting2 ? "intersecting" : ""].join(" ").trim()}"${add_attribute("this", element2, 0)}><div class="${"svelte-1cxgjsb"}"><a sveltekit:prefetch href="${"/projekte/" + escape(slug)}" title="${"Projekt " + escape(title) + " ansehen"}" class="${"svelte-1cxgjsb"}"><span class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">P</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">r</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">o</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">j</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">e</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">k</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">t</i></i> <i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">a</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">n</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">s</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">e</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">h</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">e</i></i><i class="${"svelte-1cxgjsb"}"><i class="${"svelte-1cxgjsb"}">n</i></i></span>
                        <em class="${"svelte-1cxgjsb"}"><!-- HTML_TAG_START -->${arrow}<!-- HTML_TAG_END --></em></a></div></footer>`
        })}</div>
</article>`;
      } while (!$$settled);
      return $$rendered;
    });
    wheel = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\n    <path fill="currentColor" d="M9.22 3.44a9 9 0 1 0 5.56 17.12A9 9 0 0 0 9.22 3.44Zm8.32 2.8s.2.93-.09 1.24c-.29.31-4.26 3-4.26 3a1.001 1.001 0 0 1-.86.19.791.791 0 0 1-.51-.38l-2.18-6a8 8 0 0 1 7.9 1.95Zm-4.95 5.57a.619.619 0 1 1-.78-.4.63.63 0 0 1 .78.4ZM8.24 5c.07 0 .94.11 1.15.47.21.36 1.61 4.94 1.61 4.94a1 1 0 0 1-.08.88.769.769 0 0 1-.52.36l-6.4.23A8 8 0 0 1 8.24 5Zm-3.85 9.47a9.813 9.813 0 0 1-.26-1.07c0-.08.4-.87.8-1s5.23.05 5.23.05a1.05 1.05 0 0 1 .84.4.78.78 0 0 1 .18.61l-1.74 6.1a8 8 0 0 1-5.05-5.09Zm10.08 5.14a7.94 7.94 0 0 1-3.57.3c-.08-.06-.7-.64-.66-1.05.04-.41 1.66-5 1.66-5a1.079 1.079 0 0 1 .59-.67.77.77 0 0 1 .64 0l5.26 3.54a7.91 7.91 0 0 1-3.92 2.88Zm4.71-4.12c-.08 0-.83.47-1.2.3-.37-.17-4.2-3.11-4.2-3.11a1.082 1.082 0 0 1-.46-.77.85.85 0 0 1 .21-.6l5-3.92a8.25 8.25 0 0 1 1.07 2.14 8 8 0 0 1-.42 5.96Z"/>\n</svg>';
    css$1 = {
      code: ".latest-work.svelte-pem4xt.svelte-pem4xt{box-sizing:border-box;min-height:var(--app-height, 100vh);padding:8.75rem 0 0}.latest-work.svelte-pem4xt>h1.svelte-pem4xt{font-size:clamp(2.5rem, 1.4772727273rem + 4.5454545455vw, 8.75rem);font-weight:400;white-space:nowrap;overflow:hidden;margin:0}.latest-work.svelte-pem4xt>h1 span.svelte-pem4xt{display:inline-block}.latest-work.svelte-pem4xt>h1 span span.svelte-pem4xt{display:flex;gap:0.25em;align-items:baseline;transform:translate(0, 100%);transition:transform 0.5s var(--easing)}.latest-work.svelte-pem4xt>h1.intersecting span span.svelte-pem4xt{transform:translate(0, 0)}.latest-work.svelte-pem4xt>h1 em.svelte-pem4xt{font-family:var(--serif);font-style:normal;font-weight:700}.latest-work.svelte-pem4xt>h1 i.svelte-pem4xt{align-self:center;line-height:0}.latest-work.svelte-pem4xt>h1 i.svelte-pem4xt svg{width:1em;height:1em}.projects.svelte-pem4xt.svelte-pem4xt{overflow:visible;position:relative}.projects.svelte-pem4xt>div.svelte-pem4xt{margin-top:calc(var(--app-height, 100vh) - 2.5rem)}",
      map: null
    };
    LatestWork = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $shift, $$unsubscribe_shift;
      let $spin, $$unsubscribe_spin;
      let { scrollY } = $$props;
      let element;
      let intersecting;
      let shift = spring(scrollY, { stiffness: 0.1, damping: 1 });
      $$unsubscribe_shift = subscribe(shift, (value) => $shift = value);
      let spin = spring(scrollY, { stiffness: 0.1, damping: 0.8 });
      $$unsubscribe_spin = subscribe(spin, (value) => $spin = value);
      if ($$props.scrollY === void 0 && $$bindings.scrollY && scrollY !== void 0)
        $$bindings.scrollY(scrollY);
      $$result.css.add(css$1);
      let $$settled;
      let $$rendered;
      do {
        $$settled = true;
        $$rendered = `

<section class="${"latest-work svelte-pem4xt"}">${validate_component(IntersectionObserver_1, "IntersectionObserver").$$render($$result, { element, intersecting }, {
          intersecting: ($$value) => {
            intersecting = $$value;
            $$settled = false;
          }
        }, {
          default: () => `<h1 class="${["headline svelte-pem4xt", intersecting ? "intersecting" : ""].join(" ").trim()}"${add_attribute("this", element, 0)}><span style="${"transform: translate(" + escape($shift) + "px,0)"}" class="${"svelte-pem4xt"}"><span class="${"svelte-pem4xt"}"><em class="${"svelte-pem4xt"}">Meine</em> Projekte <i style="${"transform: rotate(" + escape($spin) + "deg)"}" class="${"svelte-pem4xt"}"><!-- HTML_TAG_START -->${wheel}<!-- HTML_TAG_END --></i>
                    <em class="${"svelte-pem4xt"}">Meine</em> Projekte <i style="${"transform: rotate(" + escape($spin) + "deg)"}" class="${"svelte-pem4xt"}"><!-- HTML_TAG_START -->${wheel}<!-- HTML_TAG_END --></i>
                    <em class="${"svelte-pem4xt"}">Meine</em> Projekte <i style="${"transform: rotate(" + escape($spin) + "deg)"}" class="${"svelte-pem4xt"}"><!-- HTML_TAG_START -->${wheel}<!-- HTML_TAG_END --></i>
                    <em class="${"svelte-pem4xt"}">Meine</em> Projekte <i style="${"transform: rotate(" + escape($spin) + "deg)"}" class="${"svelte-pem4xt"}"><!-- HTML_TAG_START -->${wheel}<!-- HTML_TAG_END --></i></span></span></h1>`
        })}

    <div class="${"projects svelte-pem4xt"}"><div class="${"svelte-pem4xt"}">${validate_component(Teaser, "Teaser").$$render($$result, {
          slug: "mst-muhr",
          title: "MST Muhr",
          year: "2022",
          imageSm: "/images/mst-muhr/mst-muhr.jpg",
          imageLg: "/images/mst-muhr/mst-muhr-lg.jpg"
        }, {}, {})}

            ${validate_component(Teaser, "Teaser").$$render($$result, {
          slug: "solmates",
          title: "Solmates",
          year: "2019",
          imageSm: "/images/solmates/solmates.jpg",
          imageLg: "/images/solmates/solmates-lg.jpg"
        }, {}, {})}

            ${validate_component(Teaser, "Teaser").$$render($$result, {
          slug: "wohnformat",
          title: "Wohnformat",
          year: "2016",
          imageSm: "/images/wohnformat/wohnformat.jpg",
          imageLg: "/images/wohnformat/wohnformat-lg.jpg"
        }, {}, {})}</div></div>
    
</section>`;
      } while (!$$settled);
      $$unsubscribe_shift();
      $$unsubscribe_spin();
      return $$rendered;
    });
    css4 = {
      code: "@keyframes svelte-1euhmj0-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-1euhmj0-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-1euhmj0-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1euhmj0-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1euhmj0-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1euhmj0-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-1euhmj0-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-1euhmj0-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-1euhmj0-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-1euhmj0-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-1euhmj0-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}.wisdom.svelte-1euhmj0.svelte-1euhmj0{align-items:center;display:grid;grid-gap:0;grid-template-columns:auto clamp(17.5rem, 10rem + 30vw, 160rem) auto;justify-content:center;padding:4.375rem var(--core-padding);max-width:var(--core-max-width);margin:0 auto;overflow:hidden;margin-top:-50vh;position:relative}.wisdom.svelte-1euhmj0 div.svelte-1euhmj0{grid-column:2}p.svelte-1euhmj0.svelte-1euhmj0{font-size:clamp(1.625rem, 0.9615384615rem + 2.9487179487vw, 4.5rem);font-weight:500;line-height:1.2}p.intersecting.svelte-1euhmj0 .mask span.svelte-1euhmj0{animation:svelte-1euhmj0-to-top 1.2s var(--easing) forwards}p.intersecting.svelte-1euhmj0 .mask:nth-child(2) span.svelte-1euhmj0{animation-delay:200ms}p.intersecting.svelte-1euhmj0 .mask:nth-child(3) span.svelte-1euhmj0{animation-delay:400ms}p.intersecting.svelte-1euhmj0 .mask:nth-child(4) span.svelte-1euhmj0{animation-delay:600ms}p.intersecting.svelte-1euhmj0 .mask:nth-child(5) span.svelte-1euhmj0{animation-delay:800ms}p.intersecting.svelte-1euhmj0 .mask:nth-child(6) span.svelte-1euhmj0{animation-delay:1000ms}p.intersecting.svelte-1euhmj0 .mask:nth-child(7) span.svelte-1euhmj0{animation-delay:1200ms}",
      map: null
    };
    Wisdom = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let element;
      let intersecting;
      $$result.css.add(css4);
      let $$settled;
      let $$rendered;
      do {
        $$settled = true;
        $$rendered = `${validate_component(IntersectionObserver_1, "IntersectionObserver").$$render($$result, { element, intersecting }, {
          intersecting: ($$value) => {
            intersecting = $$value;
            $$settled = false;
          }
        }, {
          default: () => `<section class="${"wisdom svelte-1euhmj0"}"><div class="${"svelte-1euhmj0"}"><p class="${["svelte-1euhmj0", intersecting ? "intersecting" : ""].join(" ").trim()}"${add_attribute("this", element, 0)}><span class="${"mask svelte-1euhmj0"}"><span class="${"svelte-1euhmj0"}">Meine Webseiten</span></span>
                <span class="${"mask svelte-1euhmj0"}"><span class="${"svelte-1euhmj0"}">sind wie gute</span></span>
                <span class="${"mask svelte-1euhmj0"}"><span class="${"svelte-1euhmj0"}">Fahrr\xE4der:</span></span>
                <span class="${"mask svelte-1euhmj0"}"><span class="${"svelte-1euhmj0"}">elegant, hochwertig,</span></span>
                <span class="${"mask svelte-1euhmj0"}"><span class="${"svelte-1euhmj0"}">auf den Benutzer</span></span>
                <span class="${"mask svelte-1euhmj0"}"><span class="${"svelte-1euhmj0"}">angepasst und vor</span></span>
                <span class="${"mask svelte-1euhmj0"}"><span class="${"svelte-1euhmj0"}">allem pfeilschnell.</span></span></p></div></section>`
        })}`;
      } while (!$$settled);
      return $$rendered;
    });
    prerender = true;
    Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let scrollY;
      return `${$$result.head += `${$$result.title = `<title>Armin Neuhauser | Konzept, Design &amp; Entwicklung</title>`, ""}<meta name="${"description"}" content="${"Armin Neuhauser ist ein \xF6sterreichischer Grafik-Designer und Entwickler von Websites."}" data-svelte="svelte-lhq760">`, ""}



${validate_component(Hero, "Hero").$$render($$result, { scrollY }, {}, {})}

${validate_component(LatestWork, "LatestWork").$$render($$result, { scrollY }, {}, {})}

${validate_component(Wisdom, "Wisdom").$$render($$result, {}, {}, {})}`;
    });
  }
});

// .svelte-kit/output/server/chunks/ueber-mich-586498a5.js
var ueber_mich_586498a5_exports = {};
__export(ueber_mich_586498a5_exports, {
  default: () => Ueber_mich,
  prerender: () => prerender2
});
var import_cookie4, css5, prerender2, Ueber_mich;
var init_ueber_mich_586498a5 = __esm({
  ".svelte-kit/output/server/chunks/ueber-mich-586498a5.js"() {
    init_shims();
    init_app_03b8560f();
    import_cookie4 = __toModule(require_cookie());
    init_dist();
    css5 = {
      code: "section.svelte-19fd63u.svelte-19fd63u.svelte-19fd63u{box-sizing:border-box;padding:9.375rem var(--core-padding)}section.svelte-19fd63u>div.svelte-19fd63u.svelte-19fd63u{margin:0 auto;max-width:var(--core-max-width);display:grid}@media(min-width: 768px){section.svelte-19fd63u>div.svelte-19fd63u.svelte-19fd63u{grid-template-columns:1fr 0.5fr}section.svelte-19fd63u>div.svelte-19fd63u>div.svelte-19fd63u{grid-column:1}section.svelte-19fd63u>div.svelte-19fd63u>img.svelte-19fd63u{grid-column:2;grid-row:1/span 2}}h1.svelte-19fd63u.svelte-19fd63u.svelte-19fd63u{font-family:var(--serif);font-weight:700;font-size:clamp(2.375rem, 1.8413461538rem + 2.3717948718vw, 4.6875rem);line-height:1;margin:0.5em 0}p.svelte-19fd63u.svelte-19fd63u.svelte-19fd63u{font-size:1.25rem;max-width:38.75rem}",
      map: null
    };
    prerender2 = true;
    Ueber_mich = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let now2 = new Date();
      let year = now2.getFullYear();
      let since = year - 2009;
      $$result.css.add(css5);
      return `${$$result.head += `${$$result.title = `<title>\xDCber mich | Armin Neuhauser</title>`, ""}`, ""}

<section class="${"svelte-19fd63u"}"><div class="${"svelte-19fd63u"}"><h1 class="${"svelte-19fd63u"}">Hallo, ich bin Armin.</h1>
        <img src="${"images/armin-panama-city.jpg"}" alt="${"Armin in Panama City"}" loading="${"lazy"}" width="${"860"}" height="${"1147"}" class="${"svelte-19fd63u"}">
        <div class="${"svelte-19fd63u"}"><p class="${"svelte-19fd63u"}">Seit mittlerweile fast ${escape(since)} Jahren gestalte und entwickle ich Websites &amp; Online-Shops.</p>
            <p class="${"svelte-19fd63u"}">Mit einer Kombination aus Erfahrungen in Design und Development kann ich verschiedenste Problemstellungen l\xF6sen und Projekte ganzheitlich betreuen und steuern. Es begeistert mich, zusammen mit dir von Grund auf die Pers\xF6nlichkeit deiner Marke zu definieren, zu gestalten und unverwechselbar zu machen. Ich erarbeite aus deinen Ideen digitale und analoge Kreationen f\xFCr deinen Erfolg.</p></div></div>
</section>`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-0a3f2f66.js
var index_0a3f2f66_exports = {};
__export(index_0a3f2f66_exports, {
  default: () => Projekte
});
var import_cookie5, css$12, Teaser2, css6, Projekte;
var init_index_0a3f2f66 = __esm({
  ".svelte-kit/output/server/chunks/index-0a3f2f66.js"() {
    init_shims();
    init_app_03b8560f();
    init_IntersectionObserver_c7b56316();
    import_cookie5 = __toModule(require_cookie());
    init_dist();
    css$12 = {
      code: "@keyframes svelte-h7rxnd-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-h7rxnd-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-h7rxnd-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-h7rxnd-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-h7rxnd-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-h7rxnd-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-h7rxnd-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-h7rxnd-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-h7rxnd-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-h7rxnd-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-h7rxnd-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}.teaser.svelte-h7rxnd.svelte-h7rxnd{position:relative}.inner.svelte-h7rxnd.svelte-h7rxnd{position:relative;top:0;display:grid;grid-template-rows:1fr repeat(3, auto) 1fr}header.svelte-h7rxnd.svelte-h7rxnd{grid-row:2;align-self:end;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:0.5em;width:100%;flex:1 0 auto;margin-bottom:0.625rem;position:relative;z-index:3}header.intersecting.svelte-h7rxnd a span.svelte-h7rxnd{transform:translate3d(0, 0, 0)}header.svelte-h7rxnd a.svelte-h7rxnd{display:inline-flex;overflow:hidden}header.svelte-h7rxnd a span.svelte-h7rxnd{transform:translate3d(0, 100%, 0);transition:transform 0.8s var(--easing);position:relative;pointer-events:none}header.svelte-h7rxnd a span.svelte-h7rxnd::after{content:attr(data-title);position:absolute;left:0;top:0;transform:translate3d(0, 100%, 0)}header.svelte-h7rxnd a:hover span.svelte-h7rxnd{transform:translate3d(0, -100%, 0)}header.svelte-h7rxnd h1.svelte-h7rxnd{font-size:clamp(1.625rem, 0.6607142857rem + 1.0714285714vw, 2.375rem);margin:0}header.svelte-h7rxnd div.svelte-h7rxnd{font-family:var(--sans);font-weight:400;font-size:clamp(0.875rem, 0.7142857143rem + 0.1785714286vw, 1rem)}figure.svelte-h7rxnd.svelte-h7rxnd{grid-row:3;display:flex;margin:0;aspect-ratio:0.8;justify-self:start;overflow:hidden;width:100%;max-height:100%;position:relative;z-index:1;opacity:0}figure.svelte-h7rxnd picture.svelte-h7rxnd{flex-basis:100%;pointer-events:none}figure.intersecting.svelte-h7rxnd.svelte-h7rxnd{animation:svelte-h7rxnd-fadein 1s var(--easing) forwards}footer.svelte-h7rxnd.svelte-h7rxnd{grid-row:4;margin-top:0.625rem;width:100%;position:relative;z-index:2}footer.svelte-h7rxnd p.svelte-h7rxnd{font-size:clamp(0.875rem, 0.7142857143rem + 0.1785714286vw, 1rem);margin:0;overflow:hidden}footer.svelte-h7rxnd p a.svelte-h7rxnd{display:inline-flex;transform:translate3d(0, 100%, 0)}footer.svelte-h7rxnd hr.svelte-h7rxnd{margin:1.25rem 0 0;transform:scaleX(0);transform-origin:top left}footer.intersecting.svelte-h7rxnd p a.svelte-h7rxnd{animation:svelte-h7rxnd-to-top 0.8s 0.2s var(--easing) forwards}footer.intersecting.svelte-h7rxnd hr.svelte-h7rxnd{animation:svelte-h7rxnd-scale 0.8s 0.3s var(--easing) forwards}",
      map: null
    };
    Teaser2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { slug } = $$props;
      let { title } = $$props;
      let { year } = $$props;
      let { desc } = $$props;
      let { image } = $$props;
      let element;
      let intersecting;
      let element2;
      let intersecting2;
      let element3;
      let intersecting3;
      if ($$props.slug === void 0 && $$bindings.slug && slug !== void 0)
        $$bindings.slug(slug);
      if ($$props.title === void 0 && $$bindings.title && title !== void 0)
        $$bindings.title(title);
      if ($$props.year === void 0 && $$bindings.year && year !== void 0)
        $$bindings.year(year);
      if ($$props.desc === void 0 && $$bindings.desc && desc !== void 0)
        $$bindings.desc(desc);
      if ($$props.image === void 0 && $$bindings.image && image !== void 0)
        $$bindings.image(image);
      $$result.css.add(css$12);
      let $$settled;
      let $$rendered;
      do {
        $$settled = true;
        $$rendered = `<article class="${"teaser svelte-h7rxnd"}"><div class="${"inner svelte-h7rxnd"}">${validate_component(IntersectionObserver_1, "IntersectionObserver").$$render($$result, { once: true, element, intersecting }, {
          intersecting: ($$value) => {
            intersecting = $$value;
            $$settled = false;
          }
        }, {
          default: () => `<header class="${["svelte-h7rxnd", intersecting ? "intersecting" : ""].join(" ").trim()}"${add_attribute("this", element, 0)}><h1 class="${"svelte-h7rxnd"}"><a sveltekit:prefetch href="${"/projekte/" + escape(slug)}" title="${"Projekt " + escape(title) + " ansehen"}" class="${"svelte-h7rxnd"}"><span${add_attribute("data-title", title, 0)} class="${"svelte-h7rxnd"}">${escape(title)}</span></a></h1>
                <div class="${"svelte-h7rxnd"}"><a sveltekit:prefetch href="${"/projekte/" + escape(slug)}" title="${"Projekt " + escape(title) + " ansehen"}" class="${"svelte-h7rxnd"}"><span${add_attribute("data-title", year, 0)} class="${"svelte-h7rxnd"}">${escape(year)}</span></a></div></header>`
        })}

        ${validate_component(IntersectionObserver_1, "IntersectionObserver").$$render($$result, {
          once: true,
          element: element2,
          intersecting: intersecting2
        }, {
          intersecting: ($$value) => {
            intersecting2 = $$value;
            $$settled = false;
          }
        }, {
          default: () => `<figure class="${["svelte-h7rxnd", intersecting2 ? "intersecting" : ""].join(" ").trim()}"${add_attribute("this", element2, 0)}><a sveltekit:prefetch href="${"/projekte/" + escape(slug)}" title="${"Projekt " + escape(title) + " ansehen"}"><picture class="${"svelte-h7rxnd"}"><img${add_attribute("src", image, 0)}${add_attribute("alt", title, 0)} loading="${"lazy"}"></picture></a></figure>`
        })}

        ${validate_component(IntersectionObserver_1, "IntersectionObserver").$$render($$result, {
          once: true,
          element: element3,
          intersecting: intersecting3
        }, {
          intersecting: ($$value) => {
            intersecting3 = $$value;
            $$settled = false;
          }
        }, {
          default: () => `<footer class="${["svelte-h7rxnd", intersecting3 ? "intersecting" : ""].join(" ").trim()}"${add_attribute("this", element3, 0)}><p class="${"svelte-h7rxnd"}"><a sveltekit:prefetch href="${"/projekte/" + escape(slug)}" title="${"Projekt " + escape(title) + " ansehen"}" class="${"svelte-h7rxnd"}">${escape(desc)}</a></p>
                <hr class="${"svelte-h7rxnd"}"></footer>`
        })}</div>
</article>`;
      } while (!$$settled);
      return $$rendered;
    });
    css6 = {
      code: "@keyframes svelte-c8ejd-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-c8ejd-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-c8ejd-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-c8ejd-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-c8ejd-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-c8ejd-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-c8ejd-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-c8ejd-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-c8ejd-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-c8ejd-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-c8ejd-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}header.svelte-c8ejd.svelte-c8ejd.svelte-c8ejd{box-sizing:border-box;padding:9.375rem var(--core-padding) 6.25rem;min-height:60vh;display:flex}header.svelte-c8ejd>div.svelte-c8ejd.svelte-c8ejd{flex-basis:100%;display:grid;grid-gap:2.5rem;grid-template-rows:auto min-content min-content auto;margin:0 auto;max-width:var(--core-max-width)}@media(min-width: 768px){header.svelte-c8ejd>div.svelte-c8ejd.svelte-c8ejd{grid-template-columns:repeat(12, 1fr);grid-row-gap:5rem;align-items:end}}@media(min-width: 1440px){header.svelte-c8ejd>div.svelte-c8ejd.svelte-c8ejd{grid-gap:5rem}}header.svelte-c8ejd>div .mask span.svelte-c8ejd.svelte-c8ejd{animation:svelte-c8ejd-to-top 1.2s var(--easing) forwards}header.svelte-c8ejd>div .mask:nth-child(2) span.svelte-c8ejd.svelte-c8ejd{animation-delay:200ms}header.svelte-c8ejd>div h1.svelte-c8ejd.svelte-c8ejd{grid-row:2;font-family:var(--serif);font-weight:700;font-size:2.8125rem;line-height:1;margin:0}@media(min-width: 768px){header.svelte-c8ejd>div h1.svelte-c8ejd.svelte-c8ejd{grid-column:1/span 6;grid-row:3;font-size:clamp(3.5rem, 2.5892857143rem + 1.8973214286vw, 5.625rem)}}@media(min-width: 1440px){header.svelte-c8ejd>div h1.svelte-c8ejd.svelte-c8ejd{grid-column:1/span 6}}header.svelte-c8ejd>div.svelte-c8ejd div.svelte-c8ejd{grid-row:3;font-size:clamp(0.8125rem, 0.625rem + 0.234375vw, 1rem)}@media(min-width: 768px){header.svelte-c8ejd>div.svelte-c8ejd div.svelte-c8ejd{grid-column:7/span 6}}@media(min-width: 1440px){header.svelte-c8ejd>div.svelte-c8ejd div.svelte-c8ejd{grid-column:9/span 4}}header.svelte-c8ejd>div.svelte-c8ejd div p.svelte-c8ejd{margin:0;max-width:18.75rem}header.svelte-c8ejd>div div hr.svelte-c8ejd.svelte-c8ejd{margin:1.25rem 0 0;transform:scaleX(0);transform-origin:top left;animation:svelte-c8ejd-scale 0.8s 0.3s var(--easing) forwards}.projects.svelte-c8ejd.svelte-c8ejd.svelte-c8ejd{background-color:var(--base);box-sizing:border-box;padding:var(--core-padding)}.projects-list.svelte-c8ejd.svelte-c8ejd.svelte-c8ejd{display:grid;grid-gap:2.5rem;margin:0 auto;max-width:var(--core-max-width)}@media(min-width: 768px){.projects-list.svelte-c8ejd.svelte-c8ejd.svelte-c8ejd{grid-template-columns:repeat(2, 1fr)}}@media(min-width: 1024px){.projects-list.svelte-c8ejd.svelte-c8ejd.svelte-c8ejd{grid-template-columns:repeat(3, 1fr)}}@media(min-width: 1440px){.projects-list.svelte-c8ejd.svelte-c8ejd.svelte-c8ejd{grid-gap:5rem}}.coming-soon.svelte-c8ejd.svelte-c8ejd.svelte-c8ejd{margin:0 auto;max-width:var(--core-max-width);padding:6.25rem 0}.coming-soon.svelte-c8ejd p.svelte-c8ejd.svelte-c8ejd{width:17.5rem;height:17.5rem;border:1px solid var(--on-base);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;opacity:0.6;font-size:0.875rem}@media(min-width: 1024px){.coming-soon.svelte-c8ejd p.svelte-c8ejd.svelte-c8ejd{width:22.5rem;height:22.5rem}}",
      map: null
    };
    Projekte = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      $$result.css.add(css6);
      return `${$$result.head += `${$$result.title = `<title>Projekte| Armin Neuhauser</title>`, ""}`, ""}

<section><header class="${"svelte-c8ejd"}"><div class="${"svelte-c8ejd"}"><h1 class="${"svelte-c8ejd"}"><span class="${"mask svelte-c8ejd"}"><span class="${"svelte-c8ejd"}">Projekte,</span></span>
                <span class="${"mask svelte-c8ejd"}"><span class="${"svelte-c8ejd"}">auf die ich stolz bin</span></span></h1>
            <div class="${"svelte-c8ejd"}"><p class="${"mask svelte-c8ejd"}"><span class="${"svelte-c8ejd"}">Jedes Projekt ist eine Chance, etwas Neues auszuprobieren. Ich gehe auf die W\xFCnsche meiner Kunden ein und berate sie, um gemeinsam das bestm\xF6gliche Ergebnis zu erreichen.</span></p>
                <hr class="${"svelte-c8ejd"}"></div></div></header>
    <div class="${"projects svelte-c8ejd"}"><div class="${"projects-list svelte-c8ejd"}">${validate_component(Teaser2, "Teaser").$$render($$result, {
        slug: "mst-muhr",
        title: "MST Muhr",
        year: "2022",
        desc: "Webdesign, Development, CMS, Fotografie",
        image: "/images/mst-muhr/mst-muhr.jpg"
      }, {}, {})}

            ${validate_component(Teaser2, "Teaser").$$render($$result, {
        slug: "solmates",
        title: "Solmates",
        year: "2019",
        desc: "Design, Development, CMS, Fotografie, Texte",
        image: "/images/solmates/solmates.jpg"
      }, {}, {})}

            ${validate_component(Teaser2, "Teaser").$$render($$result, {
        slug: "wohnformat",
        title: "Wohnformat",
        year: "2016",
        desc: "CI, Webdesign, Development, CMS",
        image: "/images/wohnformat/wohnformat.jpg"
      }, {}, {})}</div>
        <div class="${"coming-soon svelte-c8ejd"}"><p class="${"svelte-c8ejd"}">Weitere Projekte kommen bald</p></div></div>
</section>`;
    });
  }
});

// .svelte-kit/output/server/chunks/external-2843e32b.js
var css$13, Hero2, css7, Next, external;
var init_external_2843e32b = __esm({
  ".svelte-kit/output/server/chunks/external-2843e32b.js"() {
    init_shims();
    init_app_03b8560f();
    css$13 = {
      code: '@keyframes svelte-1gkm352-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-1gkm352-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-1gkm352-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1gkm352-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1gkm352-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1gkm352-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-1gkm352-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-1gkm352-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-1gkm352-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-1gkm352-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-1gkm352-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}.hero.svelte-1gkm352.svelte-1gkm352{align-items:center;background-position:center center;background-size:cover;box-sizing:border-box;display:grid;grid-gap:0.3125rem;grid-template-columns:auto clamp(19.375rem, 11rem + 28vw, 160rem) auto;grid-template-rows:1fr auto;justify-content:center;left:0;min-height:100vh;padding:var(--core-padding) 0;position:fixed;top:0;width:100%}.hero.svelte-1gkm352.svelte-1gkm352::before{content:"";position:absolute;top:0;right:0;left:0;bottom:0;background-color:#000;opacity:0.3}.hero.svelte-1gkm352 + section{margin-top:100vh}.headline.svelte-1gkm352.svelte-1gkm352{position:relative;aspect-ratio:1;align-self:center;grid-column:2}.text.svelte-1gkm352.svelte-1gkm352{animation:svelte-1gkm352-fadein 1s var(--easing) forwards;opacity:0;position:absolute;top:0;left:0;bottom:0;right:0;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:2;text-align:center;padding:0.9375rem;color:#fff}.text.svelte-1gkm352 h1.svelte-1gkm352{font-family:var(--serif);font-weight:700;font-size:clamp(2.625rem, 1.4417475728rem + 3.786407767vw, 7.5rem);line-height:1;margin:0}.text.svelte-1gkm352 h1 span.svelte-1gkm352{animation:svelte-1gkm352-to-top 1s var(--easing) forwards}.text.svelte-1gkm352 hr.svelte-1gkm352{animation:svelte-1gkm352-scale 0.8s 0.3s var(--easing) forwards;width:33%;transform:scaleX(0);transform-origin:top left;margin:1.25rem 0;border-color:#fff}.text.svelte-1gkm352 p.svelte-1gkm352{font-size:clamp(0.875rem, 0.7839805825rem + 0.2912621359vw, 1.25rem);margin:0}.text.svelte-1gkm352 p span.svelte-1gkm352{animation:svelte-1gkm352-to-top 1s 0.8s var(--easing) forwards}.sphere.svelte-1gkm352.svelte-1gkm352{animation:svelte-1gkm352-fadein 1s var(--easing) forwards;opacity:0;display:block;background-size:cover;background-position:center center;padding-bottom:100%;border-radius:50%;will-change:opacity;opacity:0;position:relative;z-index:1;margin:0;overflow:hidden}.sphere.svelte-1gkm352 img.svelte-1gkm352{height:100%;left:0;object-fit:cover;position:absolute;top:0;width:100%}.background-image.svelte-1gkm352.svelte-1gkm352{animation:svelte-1gkm352-fadein 3s var(--easing) forwards;opacity:0;margin:0;position:absolute;top:0;left:0;bottom:0;right:0;z-index:0}.background-image.svelte-1gkm352 img.svelte-1gkm352{height:100%;left:0;object-fit:cover;position:absolute;top:0;width:100%}',
      map: null
    };
    Hero2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { title } = $$props;
      let { desc } = $$props;
      let { imageSm } = $$props;
      let { imageLg } = $$props;
      let scrollY;
      let windowHeight;
      let root = document.documentElement;
      onDestroy(() => {
        root.style.removeProperty("--header-color");
      });
      if ($$props.title === void 0 && $$bindings.title && title !== void 0)
        $$bindings.title(title);
      if ($$props.desc === void 0 && $$bindings.desc && desc !== void 0)
        $$bindings.desc(desc);
      if ($$props.imageSm === void 0 && $$bindings.imageSm && imageSm !== void 0)
        $$bindings.imageSm(imageSm);
      if ($$props.imageLg === void 0 && $$bindings.imageLg && imageLg !== void 0)
        $$bindings.imageLg(imageLg);
      $$result.css.add(css$13);
      return `

<section class="${"hero svelte-1gkm352"}" style="${"opacity: " + escape(Math.max(0, 1 - scrollY / windowHeight)) + ";"}"><div class="${"headline svelte-1gkm352"}"><div class="${"text svelte-1gkm352"}"><h1 class="${"mask svelte-1gkm352"}"><span class="${"svelte-1gkm352"}">${escape(title)}</span></h1>
            <hr class="${"svelte-1gkm352"}">
            <p class="${"mask svelte-1gkm352"}"><span class="${"svelte-1gkm352"}">${escape(desc)}</span></p></div>
        <figure class="${"sphere svelte-1gkm352"}"><picture><source media="${"(min-width: 768px)"}"${add_attribute("srcset", imageLg, 0)}>
                <img${add_attribute("src", imageSm, 0)}${add_attribute("alt", title, 0)} class="${"svelte-1gkm352"}"></picture></figure></div>
    <figure class="${"background-image svelte-1gkm352"}"><picture><source media="${"(min-width: 768px)"}"${add_attribute("srcset", imageLg, 0)}>
            <img${add_attribute("src", imageSm, 0)}${add_attribute("alt", title, 0)} class="${"svelte-1gkm352"}"></picture></figure>
</section>`;
    });
    css7 = {
      code: ".next.svelte-1hm099y.svelte-1hm099y{background:none;min-height:var(--app-height, 100vh);padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.next.svelte-1hm099y h3.svelte-1hm099y{font-size:1.5rem;margin:2em}.next.svelte-1hm099y .circle.svelte-1hm099y{height:20rem;width:20rem;display:flex;align-items:center;justify-content:center;border-radius:50%;background-size:cover;background-position:center center;position:relative}@media(min-width: 768px){.next.svelte-1hm099y .circle.svelte-1hm099y{height:28.75rem;width:28.75rem}}.next.svelte-1hm099y .text.svelte-1hm099y{text-align:center;pointer-events:none;color:#fff}.next.svelte-1hm099y .text h1.svelte-1hm099y{font-family:var(--serif);font-weight:700;font-size:2.25rem;line-height:1;margin:0.5em 0}@media(min-width: 768px){.next.svelte-1hm099y .text h1.svelte-1hm099y{font-size:2.625rem}}@media(min-width: 1024px){.next.svelte-1hm099y .text h1.svelte-1hm099y{font-size:3rem}}.next.svelte-1hm099y .text hr.svelte-1hm099y{width:33%;border-color:currentColor}.next.svelte-1hm099y .text p.svelte-1hm099y{font-size:0.9375rem}@media(min-width: 768px){.next.svelte-1hm099y .text p.svelte-1hm099y{font-size:1rem}}@media(min-width: 1024px){.next.svelte-1hm099y .text p.svelte-1hm099y{font-size:1.125rem}}",
      map: null
    };
    Next = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { title } = $$props;
      let { desc } = $$props;
      let { slug } = $$props;
      let { image } = $$props;
      if ($$props.title === void 0 && $$bindings.title && title !== void 0)
        $$bindings.title(title);
      if ($$props.desc === void 0 && $$bindings.desc && desc !== void 0)
        $$bindings.desc(desc);
      if ($$props.slug === void 0 && $$bindings.slug && slug !== void 0)
        $$bindings.slug(slug);
      if ($$props.image === void 0 && $$bindings.image && image !== void 0)
        $$bindings.image(image);
      $$result.css.add(css7);
      return `<section class="${"next svelte-1hm099y"}"><h3 class="${"svelte-1hm099y"}">N\xE4chstes Projekt</h3>
    <a${add_attribute("href", slug, 0)} class="${"circle svelte-1hm099y"}" style="${"background-image: url(" + escape(image) + ");"}"><div class="${"text svelte-1hm099y"}"><h1 class="${"svelte-1hm099y"}">${escape(title)}</h1>
            <hr class="${"svelte-1hm099y"}">
            <p class="${"svelte-1hm099y"}">${escape(desc)}</p></div></a>
</section>`;
    });
    external = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n    <path d="M20.131 3.368a.5.5 0 0 1 .5.5V16.94a.5.5 0 0 1-1 0V4.37H7.061a.5.5 0 0 1 0-1h13.07Z" fill="currentColor"/>\n    <path d="M20.485 3.515a.5.5 0 0 1 0 .707L4.22 20.485a.5.5 0 1 1-.707-.707L19.778 3.515a.5.5 0 0 1 .707 0Z" fill="currentColor"/>\n</svg>';
  }
});

// .svelte-kit/output/server/chunks/wohnformat-7471a4d0.js
var wohnformat_7471a4d0_exports = {};
__export(wohnformat_7471a4d0_exports, {
  default: () => Wohnformat
});
var import_cookie6, css8, Wohnformat;
var init_wohnformat_7471a4d0 = __esm({
  ".svelte-kit/output/server/chunks/wohnformat-7471a4d0.js"() {
    init_shims();
    init_app_03b8560f();
    init_external_2843e32b();
    import_cookie6 = __toModule(require_cookie());
    init_dist();
    css8 = {
      code: '@keyframes svelte-ds5dzu-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-ds5dzu-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-ds5dzu-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-ds5dzu-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-ds5dzu-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-ds5dzu-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-ds5dzu-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-ds5dzu-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-ds5dzu-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-ds5dzu-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-ds5dzu-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}section.svelte-ds5dzu.svelte-ds5dzu{box-sizing:border-box;padding:var(--core-padding);background-color:var(--base);position:relative;overflow:hidden}section.svelte-ds5dzu>div.svelte-ds5dzu{display:grid;grid-gap:var(--core-padding);justify-content:center;margin:0 auto;max-width:var(--core-max-width)}section.narrow.svelte-ds5dzu>div.svelte-ds5dzu{max-width:var(--content-max-width)}@media(min-width: 1024px){section.col2.svelte-ds5dzu>div.svelte-ds5dzu{grid-template-columns:1fr 1fr}}@media(min-width: 1024px){section.align-end.svelte-ds5dzu>div.svelte-ds5dzu{align-items:flex-end}}section.last.svelte-ds5dzu.svelte-ds5dzu{padding-bottom:calc(var(--core-padding) * 2)}h1.svelte-ds5dzu.svelte-ds5dzu{font-weight:400;font-size:clamp(1.5rem, 1.2403846154rem + 1.1538461538vw, 2.625rem);line-height:1.2}p.svelte-ds5dzu.svelte-ds5dzu{font-size:1.125rem}.facts.svelte-ds5dzu.svelte-ds5dzu{max-width:var(--content-max-width);margin:3.125rem auto 0;font-size:clamp(0.9375rem, 0.625rem + 0.390625vw, 1.25rem)}.facts.svelte-ds5dzu>div.svelte-ds5dzu{display:flex;flex-direction:column;border-top:1px solid var(--on-base);padding:1.25rem 0;gap:0.3125rem}.facts.svelte-ds5dzu h3.svelte-ds5dzu{font-family:var(--serif);font-weight:700;font-size:1.2em;margin:0}.facts.svelte-ds5dzu p.svelte-ds5dzu{font-size:1em;margin:0}.facts.svelte-ds5dzu a.svelte-ds5dzu{align-self:flex-end}.link.svelte-ds5dzu.svelte-ds5dzu{justify-self:center;display:flex;align-items:center;justify-content:flex-end;gap:0.625rem;margin-top:1.25rem;font-size:clamp(0.9375rem, 0.625rem + 0.390625vw, 1.25rem)}.link.svelte-ds5dzu i.svelte-ds5dzu{border:1px solid var(--primary);width:4.125rem;height:4.125rem;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;transform:rotate(45deg)}.link.svelte-ds5dzu i.svelte-ds5dzu::before{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background-color:var(--primary);transform:scaleY(0);transform-origin:bottom left;transition:transform 0.6s var(--easing)}.link.svelte-ds5dzu i.svelte-ds5dzu svg{position:relative;transform:rotate(-45deg)}.link.svelte-ds5dzu span.svelte-ds5dzu{pointer-events:none}.link.svelte-ds5dzu:hover i.svelte-ds5dzu::before{transform:scaleY(1)}img.svelte-ds5dzu.svelte-ds5dzu{display:block}',
      map: null
    };
    Wohnformat = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      $$result.css.add(css8);
      return `${$$result.head += `${$$result.title = `<title>Wohnformat | Armin Neuhauser</title>`, ""}<meta name="${"description"}" content="${"Wohnformat"}" data-svelte="svelte-ne6hci">`, ""}

${validate_component(Hero2, "Hero").$$render($$result, {
        title: "Wohnformat",
        desc: "die M\xF6bel- und Designwerkstatt",
        imageSm: "/images/wohnformat/wohnformat-hero-sm.jpg",
        imageLg: "/images/wohnformat/wohnformat-hero-lg.jpg"
      }, {}, {})}

<section class="${"svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><div class="${"facts svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><h3 class="${"svelte-ds5dzu"}">Launch</h3>
                <p class="${"svelte-ds5dzu"}">Oktober 2016</p></div>
            <div class="${"svelte-ds5dzu"}"><h3 class="${"svelte-ds5dzu"}">Services</h3>
                <p class="${"svelte-ds5dzu"}">Corporate Identity, Webdesign, UI/UX, Development, Content Management System</p></div>
            <div class="${"svelte-ds5dzu"}"><h3 class="${"svelte-ds5dzu"}">Technologien</h3>
                <p class="${"svelte-ds5dzu"}">WordPress</p></div>
            <div class="${"svelte-ds5dzu"}"><a class="${"link svelte-ds5dzu"}" href="${"https://www.wohnformat.at/"}" target="${"_blank"}"><span class="${"svelte-ds5dzu"}">Website ansehen</span>
                    <i class="${"svelte-ds5dzu"}"><!-- HTML_TAG_START -->${external}<!-- HTML_TAG_END --></i></a></div></div></div></section>


<section class="${"col2 align-end svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><img src="${"/images/wohnformat/wohnformat1.jpg"}" alt="${"Wohnformat Startseite"}" class="${"svelte-ds5dzu"}">
        <img src="${"/images/wohnformat/wohnformat4.jpg"}" alt="${"Wohnformat Tablets"}" class="${"svelte-ds5dzu"}"></div></section>

<section class="${"col2 svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><img src="${"/images/wohnformat/wohnformat2.jpg"}" alt="${"Wohnformat Kontakt"}" class="${"svelte-ds5dzu"}">
        <img src="${"/images/wohnformat/wohnformat5.jpg"}" alt="${"Wohnformat Phones"}" class="${"svelte-ds5dzu"}"></div></section>

<section class="${"narrow svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><div><hr>
            <h1 class="${"svelte-ds5dzu"}">Wohntr\xE4ume nach Ma\xDF
            </h1>
            <p class="${"svelte-ds5dzu"}">Wohnformat ist das Unternehmen von Patrick Schachinger und Johannes Haberfehlner. Gemeinsam mit ihren Kunden planen sie R\xE4ume und M\xF6bel nach Ma\xDF. Ich durfte das Corporate Design und die Website von Wohnformat konzipieren und umsetzen. Dabei war ich von der Firmengr\xFCndung an involviert und konnte so die Marke von Grund auf definieren.
            </p>
            <p class="${"svelte-ds5dzu"}">Bei der Website von Wohnformat habe ich auf ein klassisches, modernes und minimalistisches Design gesetzt. Programmiert wurde die Website mit modernen \u201Estate of the art\u201C Technologien im Responsive Design. Im Hintergrund l\xE4uft das bekannte CMS WordPress. Wohnformat kann damit selbst Blog-Beitr\xE4ge, Projekte und Seiten anlegen und bearbeiten.
            </p></div></div></section>

<section class="${"last svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><a class="${"link svelte-ds5dzu"}" href="${"https://www.wohnformat.at/"}" target="${"_blank"}"><span class="${"svelte-ds5dzu"}">Website ansehen</span>
            <i class="${"svelte-ds5dzu"}"><!-- HTML_TAG_START -->${external}<!-- HTML_TAG_END --></i></a></div></section>

${validate_component(Next, "Next").$$render($$result, {
        title: "Solmates",
        desc: "ein Blog f\xFCr unsere Reise durch Lateinamerika",
        slug: "/projekte/solmates",
        image: "/images/solmates/solmates-hero-sm.jpg"
      }, {}, {})}`;
    });
  }
});

// .svelte-kit/output/server/chunks/Parallax-b30b0ed9.js
var css9, Parallax;
var init_Parallax_b30b0ed9 = __esm({
  ".svelte-kit/output/server/chunks/Parallax-b30b0ed9.js"() {
    init_shims();
    init_app_03b8560f();
    init_external_2843e32b();
    css9 = {
      code: "section.svelte-1nzr0eg{background-color:var(--base)}figure.svelte-1nzr0eg{aspect-ratio:16/9;margin:0;overflow:hidden;display:flex}picture.svelte-1nzr0eg{flex-grow:1;display:flex}img.svelte-1nzr0eg{flex-grow:1;object-fit:cover}",
      map: null
    };
    Parallax = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { image } = $$props;
      let { width = void 0 } = $$props;
      let { height = void 0 } = $$props;
      let { alt = void 0 } = $$props;
      let figure;
      let translateY = 0;
      if ($$props.image === void 0 && $$bindings.image && image !== void 0)
        $$bindings.image(image);
      if ($$props.width === void 0 && $$bindings.width && width !== void 0)
        $$bindings.width(width);
      if ($$props.height === void 0 && $$bindings.height && height !== void 0)
        $$bindings.height(height);
      if ($$props.alt === void 0 && $$bindings.alt && alt !== void 0)
        $$bindings.alt(alt);
      $$result.css.add(css9);
      return `

<section class="${"full svelte-1nzr0eg"}"><div><figure class="${"svelte-1nzr0eg"}"${add_attribute("this", figure, 0)}><picture class="${"svelte-1nzr0eg"}"><img${add_attribute("src", image, 0)}${add_attribute("alt", alt, 0)} style="${"transform: translateY(" + escape(translateY) + "%);"}"${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} class="${"svelte-1nzr0eg"}"></picture></figure></div>
</section>`;
    });
  }
});

// .svelte-kit/output/server/chunks/mst-muhr-de98b9f5.js
var mst_muhr_de98b9f5_exports = {};
__export(mst_muhr_de98b9f5_exports, {
  default: () => Mst_muhr
});
var import_cookie7, css$14, Switch, css10, Mst_muhr;
var init_mst_muhr_de98b9f5 = __esm({
  ".svelte-kit/output/server/chunks/mst-muhr-de98b9f5.js"() {
    init_shims();
    init_app_03b8560f();
    init_external_2843e32b();
    init_Parallax_b30b0ed9();
    import_cookie7 = __toModule(require_cookie());
    init_dist();
    css$14 = {
      code: '.switch.svelte-1rl4mri.svelte-1rl4mri.svelte-1rl4mri{position:relative;display:flex;gap:0.9375rem;flex-direction:row;align-items:center;user-select:none;cursor:pointer}.switch--label.svelte-1rl4mri.svelte-1rl4mri.svelte-1rl4mri{color:var(--on-base);user-select:none}.switch--input.svelte-1rl4mri.svelte-1rl4mri.svelte-1rl4mri{position:absolute;opacity:0;display:none;width:0;height:0;top:-100rem;left:-100rem}.switch--trigger.svelte-1rl4mri.svelte-1rl4mri.svelte-1rl4mri{position:relative;height:1.8rem;width:4rem;border-radius:5rem;transition:all 0.3s var(--easing);background-color:var(--base);border:1px solid var(--on-base)}.switch--trigger.svelte-1rl4mri.svelte-1rl4mri.svelte-1rl4mri::after{content:"";position:absolute;height:1.3rem;width:1.3rem;background:var(--on-base);left:0.9rem;top:50%;transform:translate(-50%, -50%);transition:all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);border-radius:100%}.switch.svelte-1rl4mri input.svelte-1rl4mri:checked~.switch--trigger.svelte-1rl4mri{background-color:var(--on-base)}.switch.svelte-1rl4mri input.svelte-1rl4mri:checked~.switch--trigger.svelte-1rl4mri::after{background:var(--base);left:calc(100% - 0.9rem)}',
      map: null
    };
    Switch = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { label1 } = $$props;
      let { label2 } = $$props;
      let { checked } = $$props;
      if ($$props.label1 === void 0 && $$bindings.label1 && label1 !== void 0)
        $$bindings.label1(label1);
      if ($$props.label2 === void 0 && $$bindings.label2 && label2 !== void 0)
        $$bindings.label2(label2);
      if ($$props.checked === void 0 && $$bindings.checked && checked !== void 0)
        $$bindings.checked(checked);
      $$result.css.add(css$14);
      return `<label class="${"switch svelte-1rl4mri"}"><span class="${"switch--label svelte-1rl4mri"}">${escape(label1)}</span>
    <input class="${"switch--input svelte-1rl4mri"}" type="${"checkbox"}"${add_attribute("checked", checked, 1)}>
    <span class="${"switch--trigger wrapper svelte-1rl4mri"}"></span>
    <span class="${"switch--label svelte-1rl4mri"}">${escape(label2)}</span>
</label>`;
    });
    css10 = {
      code: '@keyframes svelte-ds5dzu-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-ds5dzu-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-ds5dzu-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-ds5dzu-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-ds5dzu-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-ds5dzu-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-ds5dzu-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-ds5dzu-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-ds5dzu-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-ds5dzu-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-ds5dzu-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}section.svelte-ds5dzu.svelte-ds5dzu{box-sizing:border-box;padding:var(--core-padding);background-color:var(--base);position:relative;overflow:hidden}section.svelte-ds5dzu>div.svelte-ds5dzu{display:grid;grid-gap:var(--core-padding);justify-content:center;margin:0 auto;max-width:var(--core-max-width)}section.full.svelte-ds5dzu.svelte-ds5dzu{padding-left:0;padding-right:0}section.narrow.svelte-ds5dzu>div.svelte-ds5dzu{max-width:var(--content-max-width)}@media(min-width: 1024px){section.col2.svelte-ds5dzu>div.svelte-ds5dzu{grid-template-columns:1fr 1fr}}@media(min-width: 1024px){}section.last.svelte-ds5dzu.svelte-ds5dzu{padding-bottom:calc(var(--core-padding) * 2)}h1.svelte-ds5dzu.svelte-ds5dzu{font-weight:400;font-size:clamp(1.5rem, 1.2403846154rem + 1.1538461538vw, 2.625rem);line-height:1.2}p.svelte-ds5dzu.svelte-ds5dzu{font-size:1.125rem}.facts.svelte-ds5dzu.svelte-ds5dzu{max-width:var(--content-max-width);margin:3.125rem auto 0;font-size:clamp(0.9375rem, 0.625rem + 0.390625vw, 1.25rem)}.facts.svelte-ds5dzu>div.svelte-ds5dzu{display:flex;flex-direction:column;border-top:1px solid var(--on-base);padding:1.25rem 0;gap:0.3125rem}.facts.svelte-ds5dzu h3.svelte-ds5dzu{font-family:var(--serif);font-weight:700;font-size:1.2em;margin:0}.facts.svelte-ds5dzu p.svelte-ds5dzu{font-size:1em;margin:0}.facts.svelte-ds5dzu a.svelte-ds5dzu{align-self:flex-end}.link.svelte-ds5dzu.svelte-ds5dzu{justify-self:center;display:flex;align-items:center;justify-content:flex-end;gap:0.625rem;margin-top:1.25rem;font-size:clamp(0.9375rem, 0.625rem + 0.390625vw, 1.25rem)}.link.svelte-ds5dzu i.svelte-ds5dzu{border:1px solid var(--primary);width:4.125rem;height:4.125rem;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;transform:rotate(45deg)}.link.svelte-ds5dzu i.svelte-ds5dzu::before{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background-color:var(--primary);transform:scaleY(0);transform-origin:bottom left;transition:transform 0.6s var(--easing)}.link.svelte-ds5dzu i.svelte-ds5dzu svg{position:relative;transform:rotate(-45deg)}.link.svelte-ds5dzu span.svelte-ds5dzu{pointer-events:none}.link.svelte-ds5dzu:hover i.svelte-ds5dzu::before{transform:scaleY(1)}img.svelte-ds5dzu.svelte-ds5dzu{display:block}',
      map: null
    };
    Mst_muhr = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let dark = false;
      $$result.css.add(css10);
      let $$settled;
      let $$rendered;
      do {
        $$settled = true;
        $$rendered = `${$$result.head += `${$$result.title = `<title>MST Muhr | Armin Neuhauser</title>`, ""}<meta name="${"description"}" content="${"MST Muhr"}" data-svelte="svelte-16aerro">`, ""}

${validate_component(Hero2, "Hero").$$render($$result, {
          title: "MST Muhr",
          desc: "individuelle Unternehmenswebsite",
          imageSm: "/images/mst-muhr/mst-hero-sm.jpg",
          imageLg: "/images/mst-muhr/mst-hero-lg.jpg"
        }, {}, {})}

<section class="${"svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><div class="${"facts svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><h3 class="${"svelte-ds5dzu"}">Launch</h3>
                <p class="${"svelte-ds5dzu"}">J\xE4nner 2022</p></div>
            <div class="${"svelte-ds5dzu"}"><h3 class="${"svelte-ds5dzu"}">Services</h3>
                <p class="${"svelte-ds5dzu"}">Konzept &amp; Beratung, Webdesign, UI/UX, Development, Content Management System, Fotografie</p></div>
            <div class="${"svelte-ds5dzu"}"><h3 class="${"svelte-ds5dzu"}">Technologien</h3>
                <p class="${"svelte-ds5dzu"}">Vue.js, Nuxt.js, Storyblok, Netlify</p></div>
            <div class="${"svelte-ds5dzu"}"><a class="${"link svelte-ds5dzu"}" href="${"https://www.mst-muhr.at/"}" target="${"_blank"}"><span class="${"svelte-ds5dzu"}">Website ansehen</span>
                    <i class="${"svelte-ds5dzu"}"><!-- HTML_TAG_START -->${external}<!-- HTML_TAG_END --></i></a></div></div></div></section>

${validate_component(Parallax, "Parallax").$$render($$result, {
          image: "/images/mst-muhr/mst-schweizergarten.jpg",
          width: "1920",
          height: "1280",
          alt: "MST Muhr Schweizergarten"
        }, {}, {})}

<section class="${"narrow svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><div><hr>
            <h1 class="${"svelte-ds5dzu"}">Eine gro\xDFartige Website f\xFCr ein gro\xDFartiges Unternehmen
            </h1>
            <p class="${"svelte-ds5dzu"}">Die MST Muhr Sanierungstechnik wurde 1995 aus dem Interesse Bauwerke zu erhalten und einer Begeisterung f\xFCr individuelle L\xF6sungen in der Sanierung von Hoch- und Tiefbauobjekten gegr\xFCndet.
            </p>
            <p class="${"svelte-ds5dzu"}">2021 begann die Zusammenarbeit zwischen mir und der MST mit der Zielsetzung eine individuelle, editierbare und nicht zuletzt einzigartige Website zu kreieren, die die Spitzenposition des Unternehmens in der Branche widerspiegelt.
            </p></div></div></section>

<section class="${"narrow svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}">${validate_component(Switch, "Switch").$$render($$result, {
          label1: "Light mode",
          label2: "Dark mode",
          checked: dark
        }, {
          checked: ($$value) => {
            dark = $$value;
            $$settled = false;
          }
        }, {})}</div></section>

<section class="${"col2 svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}">${dark ? `<img src="${"/images/mst-muhr/mst-muhr-01-dark.jpg"}" alt="${"MST Muhr Startseite"}" width="${"1920"}" height="${"1200"}" class="${"svelte-ds5dzu"}">
            <img src="${"/images/mst-muhr/mst-muhr-02-dark.jpg"}" alt="${"MST Muhr Kontakt"}" width="${"1920"}" height="${"1200"}" class="${"svelte-ds5dzu"}">` : `<img src="${"/images/mst-muhr/mst-muhr-01.jpg"}" alt="${"MST Muhr Startseite"}" width="${"1920"}" height="${"1200"}" class="${"svelte-ds5dzu"}">
            <img src="${"/images/mst-muhr/mst-muhr-02.jpg"}" alt="${"MST Muhr Kontakt"}" width="${"1920"}" height="${"1200"}" class="${"svelte-ds5dzu"}">`}</div></section>

<section class="${"full svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}">${dark ? `<video width="${"1152"}" height="${"720"}" muted playsinline loop autoplay poster="${"/images/mst-muhr/mst-muhr-01-dark.jpg"}"><source src="${"/images/mst-muhr/mst-muhr-dark.webm"}" type="${"video/webm"}"><source src="${"/images/mst-muhr/mst-muhr-dark.mp4"}" type="${"video/mp4"}"></video>` : `<video width="${"1152"}" height="${"720"}" muted playsinline loop autoplay poster="${"/images/mst-muhr/mst-muhr-01.jpg"}"><source src="${"/images/mst-muhr/mst-muhr.webm"}" type="${"video/webm"}"><source src="${"/images/mst-muhr/mst-muhr.mp4"}" type="${"video/mp4"}"></video>`}</div></section>

<section class="${"last svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><a class="${"link svelte-ds5dzu"}" href="${"https://www.mst-muhr.at/"}" target="${"_blank"}"><span class="${"svelte-ds5dzu"}">Website ansehen</span>
            <i class="${"svelte-ds5dzu"}"><!-- HTML_TAG_START -->${external}<!-- HTML_TAG_END --></i></a></div></section>

${validate_component(Next, "Next").$$render($$result, {
          title: "Solmates",
          desc: "ein Blog f\xFCr unsere Reise durch Lateinamerika",
          slug: "/projekte/solmates",
          image: "/images/solmates/solmates-hero-sm.jpg"
        }, {}, {})}`;
      } while (!$$settled);
      return $$rendered;
    });
  }
});

// .svelte-kit/output/server/chunks/solmates-3cbe8739.js
var solmates_3cbe8739_exports = {};
__export(solmates_3cbe8739_exports, {
  default: () => Solmates
});
var import_cookie8, css11, Solmates;
var init_solmates_3cbe8739 = __esm({
  ".svelte-kit/output/server/chunks/solmates-3cbe8739.js"() {
    init_shims();
    init_app_03b8560f();
    init_external_2843e32b();
    init_Parallax_b30b0ed9();
    import_cookie8 = __toModule(require_cookie());
    init_dist();
    css11 = {
      code: '@keyframes svelte-ds5dzu-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-ds5dzu-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-ds5dzu-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-ds5dzu-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-ds5dzu-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-ds5dzu-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-ds5dzu-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-ds5dzu-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-ds5dzu-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-ds5dzu-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-ds5dzu-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}section.svelte-ds5dzu.svelte-ds5dzu{box-sizing:border-box;padding:var(--core-padding);background-color:var(--base);position:relative;overflow:hidden}section.svelte-ds5dzu>div.svelte-ds5dzu{display:grid;grid-gap:var(--core-padding);justify-content:center;margin:0 auto;max-width:var(--core-max-width)}section.full.svelte-ds5dzu.svelte-ds5dzu{padding-left:0;padding-right:0}section.narrow.svelte-ds5dzu>div.svelte-ds5dzu{max-width:var(--content-max-width)}@media(min-width: 1024px){section.col2.svelte-ds5dzu>div.svelte-ds5dzu{grid-template-columns:1fr 1fr}}@media(min-width: 1024px){section.align-end.svelte-ds5dzu>div.svelte-ds5dzu{align-items:flex-end}}section.last.svelte-ds5dzu.svelte-ds5dzu{padding-bottom:calc(var(--core-padding) * 2)}h1.svelte-ds5dzu.svelte-ds5dzu{font-weight:400;font-size:clamp(1.5rem, 1.2403846154rem + 1.1538461538vw, 2.625rem);line-height:1.2}p.svelte-ds5dzu.svelte-ds5dzu{font-size:1.125rem}.facts.svelte-ds5dzu.svelte-ds5dzu{max-width:var(--content-max-width);margin:3.125rem auto 0;font-size:clamp(0.9375rem, 0.625rem + 0.390625vw, 1.25rem)}.facts.svelte-ds5dzu>div.svelte-ds5dzu{display:flex;flex-direction:column;border-top:1px solid var(--on-base);padding:1.25rem 0;gap:0.3125rem}.facts.svelte-ds5dzu h3.svelte-ds5dzu{font-family:var(--serif);font-weight:700;font-size:1.2em;margin:0}.facts.svelte-ds5dzu p.svelte-ds5dzu{font-size:1em;margin:0}.facts.svelte-ds5dzu a.svelte-ds5dzu{align-self:flex-end}.link.svelte-ds5dzu.svelte-ds5dzu{justify-self:center;display:flex;align-items:center;justify-content:flex-end;gap:0.625rem;margin-top:1.25rem;font-size:clamp(0.9375rem, 0.625rem + 0.390625vw, 1.25rem)}.link.svelte-ds5dzu i.svelte-ds5dzu{border:1px solid var(--primary);width:4.125rem;height:4.125rem;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;transform:rotate(45deg)}.link.svelte-ds5dzu i.svelte-ds5dzu::before{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background-color:var(--primary);transform:scaleY(0);transform-origin:bottom left;transition:transform 0.6s var(--easing)}.link.svelte-ds5dzu i.svelte-ds5dzu svg{position:relative;transform:rotate(-45deg)}.link.svelte-ds5dzu span.svelte-ds5dzu{pointer-events:none}.link.svelte-ds5dzu:hover i.svelte-ds5dzu::before{transform:scaleY(1)}img.svelte-ds5dzu.svelte-ds5dzu{display:block}',
      map: null
    };
    Solmates = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      $$result.css.add(css11);
      return `${$$result.head += `${$$result.title = `<title>Solmates | Armin Neuhauser</title>`, ""}<meta name="${"description"}" content="${"Solmates ist ein Reiseblog von Armin & Miriam"}" data-svelte="svelte-xo6kt7">`, ""}

${validate_component(Hero2, "Hero").$$render($$result, {
        title: "Solmates",
        desc: "ein Blog f\xFCr unsere Reise durch Lateinamerika",
        imageSm: "/images/solmates/solmates-hero-sm.jpg",
        imageLg: "/images/solmates/solmates-hero-lg.jpg"
      }, {}, {})}

<section class="${"svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><div class="${"facts svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><h3 class="${"svelte-ds5dzu"}">Launch</h3>
                <p class="${"svelte-ds5dzu"}">November 2019</p></div>
            <div class="${"svelte-ds5dzu"}"><h3 class="${"svelte-ds5dzu"}">Services</h3>
                <p class="${"svelte-ds5dzu"}">Konzept, Webdesign, UI/UX, Development, Content Management System, Fotografie, Texte, Buchgestaltung</p></div>
            <div class="${"svelte-ds5dzu"}"><h3 class="${"svelte-ds5dzu"}">Technologien</h3>
                <p class="${"svelte-ds5dzu"}">Vue.js, Nuxt.js, Storyblok, Netlify, Mailchimp</p></div>
            <div class="${"svelte-ds5dzu"}"><a class="${"link svelte-ds5dzu"}" href="${"https://www.solmates.at/"}" target="${"_blank"}"><span class="${"svelte-ds5dzu"}">Website ansehen</span>
                    <i class="${"svelte-ds5dzu"}"><!-- HTML_TAG_START -->${external}<!-- HTML_TAG_END --></i></a></div></div></div></section>

<section class="${"full svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><video width="${"1152"}" height="${"720"}" muted playsinline loop autoplay poster="${"/images/solmates/solmates01.jpg"}"><source src="${"/images/solmates/solmates.webm"}" type="${"video/webm"}"><source src="${"/images/solmates/solmates.mp4"}" type="${"video/mp4"}"></video></div></section>

<section class="${"narrow svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><div><hr>
            <h1 class="${"svelte-ds5dzu"}">Solmates ist ein Reiseblog von Armin &amp; Miriam.
            </h1>
            <p class="${"svelte-ds5dzu"}">Zu reisen, um neue Orte zu entdecken, ist f\xFCr mich eines der sch\xF6nsten und aufregendsten Dinge im Leben. Deshalb bin ich gemeinsam mit meiner Partnerin im November 2019 aufgebrochen, um Lateinamerika zu bereisen. Mit dem Blog wollte ich einen Platz erschaffen, um Erinnerungen zu speichern und zu teilen \u2013 f\xFCr uns selbst, unsere Familien und Freunde.
            </p>
            <p class="${"svelte-ds5dzu"}">Den Blog habe ich von Grund auf mit Vue &amp; Nuxt gebaut. Die Texte und Bilder werden in dem Content Management System Storyblok gepflegt.
            </p></div></div></section>

${validate_component(Parallax, "Parallax").$$render($$result, {
        image: "/images/solmates/solmates-cartagena.jpg",
        width: "1920",
        height: "1280",
        alt: "Solamtes Cartagena Kolumbien"
      }, {}, {})}

<section class="${"narrow svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><img src="${"/images/solmates/solmates-home.jpg"}" alt="${"Solmates Startseite"}" class="${"svelte-ds5dzu"}"></div></section>

<section class="${"col2 align-end svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><img src="${"/images/solmates/solmates-san-blas-02.jpg"}" alt="${"Solmates San Blas Inseln"}" class="${"svelte-ds5dzu"}">
        <img src="${"/images/solmates/solmates-costa-rica.jpg"}" alt="${"Solmates Costa Rica"}" class="${"svelte-ds5dzu"}">
        <img src="${"/images/solmates/solmates-boquete.jpg"}" alt="${"Solmates Vulkan Baru"}" class="${"svelte-ds5dzu"}">
        <img src="${"/images/solmates/solmates-peru.jpg"}" alt="${"Solmates Peru"}" class="${"svelte-ds5dzu"}"></div></section>

<section class="${"narrow svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><div><hr>
            <h1 class="${"svelte-ds5dzu"}">Mit dem Rucksack durch Lateinamerika
            </h1>
            <p class="${"svelte-ds5dzu"}">Nach unserer R\xFCckkehr nach \xD6sterreich ist im Sommer 2020 ein 328-seitiger Fotoband entstanden. Dieses Buch erz\xE4hlt von der gesamten Reise \u201Evon den Alpen in die Anden\u201C.
            </p></div></div></section>

<section class="${"full svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><video width="${"1152"}" height="${"720"}" muted playsinline loop autoplay poster="${"/images/solmates/solmates01.jpg"}"><source src="${"/images/solmates/solmates-buch.webm"}" type="${"video/webm"}"><source src="${"/images/solmates/solmates-buch.mp4"}" type="${"video/mp4"}"></video></div></section>

<section class="${"col2 svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><img src="${"/images/solmates/solmates-buch.jpg"}" alt="${"Solmates Buch"}" class="${"svelte-ds5dzu"}">
        <img src="${"/images/solmates/solmates-buch-02.jpg"}" alt="${"Solmates Buch R\xFCckseite"}" class="${"svelte-ds5dzu"}"></div></section>

<section class="${"last svelte-ds5dzu"}"><div class="${"svelte-ds5dzu"}"><a class="${"link svelte-ds5dzu"}" href="${"https://www.solmates.at/"}" target="${"_blank"}"><span class="${"svelte-ds5dzu"}">Website ansehen</span>
            <i class="${"svelte-ds5dzu"}"><!-- HTML_TAG_START -->${external}<!-- HTML_TAG_END --></i></a></div></section>

${validate_component(Next, "Next").$$render($$result, {
        title: "MST Muhr",
        desc: "individuelle Unternehmenswebsite",
        slug: "/projekte/mst-muhr",
        image: "/images/mst-muhr/mst-hero-sm.jpg"
      }, {}, {})}`;
    });
  }
});

// .svelte-kit/output/server/chunks/__layout.reset-90845c5f.js
var layout_reset_90845c5f_exports = {};
__export(layout_reset_90845c5f_exports, {
  default: () => _layout_reset,
  load: () => load3
});
var import_app2, import_graphics2, import_display2, import_constants2, import_core2, import_interaction2, import_ticker2, import_filter_kawase_blur2, import_filter_noise2, import_filter_color_matrix2, import_hsl_to_hex2, import_debounce2, import_utils2, import_cookie9, makiMix, css$32, Header, up, css$22, Footer, PageTransition, css$15, baseSize, CursorCreep, css12, Scene, load3, _layout_reset;
var init_layout_reset_90845c5f = __esm({
  ".svelte-kit/output/server/chunks/__layout.reset-90845c5f.js"() {
    init_shims();
    init_app_03b8560f();
    init_Scene_svelte_svelte_type_style_lang_2822b95d();
    init_index_fa8f98f1();
    init_DeathStar_d5b8ee16();
    init_dist2();
    import_app2 = __toModule(require_app());
    import_graphics2 = __toModule(require_graphics());
    import_display2 = __toModule(require_display());
    import_constants2 = __toModule(require_constants());
    import_core2 = __toModule(require_core());
    import_interaction2 = __toModule(require_interaction());
    import_ticker2 = __toModule(require_ticker());
    import_filter_kawase_blur2 = __toModule(require_filter_kawase_blur_cjs());
    import_filter_noise2 = __toModule(require_filter_noise());
    import_filter_color_matrix2 = __toModule(require_filter_color_matrix());
    init_simplex_noise();
    import_hsl_to_hex2 = __toModule(require_hsl_to_hex());
    import_debounce2 = __toModule(require_debounce());
    import_utils2 = __toModule(require_utils());
    import_cookie9 = __toModule(require_cookie());
    init_dist();
    makiMix = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\n    <rect x="5" y="5" width="2" height="2" fill="currentColor"/>\n    <rect class="yummy" x="11" y="5" width="2" height="2" fill="currentColor"/>\n    <rect x="17" y="5" width="2" height="2" fill="currentColor"/>\n    <rect class="yummy" x="5" y="11" width="2" height="2" fill="currentColor"/>\n    <rect x="11" y="11" width="2" height="2" fill="currentColor"/>\n    <rect class="yummy" x="17" y="11" width="2" height="2" fill="currentColor"/>\n    <rect x="5" y="17" width="2" height="2" fill="currentColor"/>\n    <rect class="yummy" x="11" y="17" width="2" height="2" fill="currentColor"/>\n    <rect x="17" y="17" width="2" height="2" fill="currentColor"/>\n</svg>\n';
    css$32 = {
      code: '@keyframes svelte-18pc5lf-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-18pc5lf-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-18pc5lf-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-18pc5lf-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-18pc5lf-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-18pc5lf-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-18pc5lf-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-18pc5lf-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-18pc5lf-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-18pc5lf-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-18pc5lf-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}header.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{position:fixed;top:0;left:0;right:0;z-index:10;pointer-events:none}@media(prefers-reduced-motion: no-preference){header.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{animation:svelte-18pc5lf-fadein-from-primary 1s var(--easing) forwards}}header.svelte-18pc5lf>section.svelte-18pc5lf.svelte-18pc5lf{align-items:center;color:var(--header-color, var(--on-base));display:flex;font-size:clamp(0.8125rem, 0.625rem + 0.234375vw, 1rem);justify-content:space-between;padding:0.625rem var(--core-padding);text-align:left;text-transform:uppercase}@media(max-width: 767px){header.svelte-18pc5lf>section.svelte-18pc5lf>div.svelte-18pc5lf:not(.logo){display:none}}@media(min-width: 768px){header.svelte-18pc5lf>section.svelte-18pc5lf.svelte-18pc5lf{display:grid;grid-column-gap:1.25rem;grid-template-columns:repeat(4, 1fr);padding-top:1.875rem;padding-bottom:1.875rem;align-items:flex-start;max-width:var(--core-max-width);margin:0 auto}}header.svelte-18pc5lf>section.svelte-18pc5lf>.svelte-18pc5lf{pointer-events:auto}header.svelte-18pc5lf>section div.svelte-18pc5lf.svelte-18pc5lf{display:flex;flex-direction:column;align-items:flex-start}[color-scheme="dark"] header.svelte-18pc5lf>section.svelte-18pc5lf.svelte-18pc5lf{color:var(--on-base)}[color-scheme="dark"] header.svelte-18pc5lf>section.svelte-18pc5lf.svelte-18pc5lf::before{content:"";background:linear-gradient(0deg, hsla(var(--base-h), var(--base-s), var(--base-l), 0), hsla(var(--base-h), var(--base-s), var(--base-l), 0.2) 70%, hsla(var(--base-h), var(--base-s), var(--base-l), 0.9));position:fixed;left:0;top:0;width:100%;height:12.5rem;z-index:-1;pointer-events:none !important}.logo.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{font-weight:500;margin-left:-0.625rem}.last.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{flex-direction:row;justify-content:space-between;align-items:flex-start;margin-right:-0.375rem}.last.svelte-18pc5lf button{padding:0.25em;transition:color 0.2s var(--easing)}.last.svelte-18pc5lf button:hover{color:var(--primary)}.last.svelte-18pc5lf svg{height:1.85em;width:1.85em}a.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf,span.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{padding:0.625rem;box-sizing:border-box}@media(min-width: 768px){a.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf,span.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{padding-top:0.25em;padding-bottom:0.25em}}[color-scheme="highcontrast"] a.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf,[color-scheme="highcontrast"] span.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{font-weight:500}a.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{transition:all 0.2s var(--easing)}a.svelte-18pc5lf i.svelte-18pc5lf.svelte-18pc5lf{display:inline-block;font-style:normal;pointer-events:none}@media(prefers-reduced-motion: no-preference){a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf{animation:svelte-18pc5lf-flip-and-back 0.5s 0.02s var(--easing)}}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(2){animation-delay:0.04s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(3){animation-delay:0.06s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(4){animation-delay:0.08s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(5){animation-delay:0.1s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(6){animation-delay:0.12s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(7){animation-delay:0.14s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(8){animation-delay:0.16s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(9){animation-delay:0.18s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(10){animation-delay:0.2s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(11){animation-delay:0.22s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(12){animation-delay:0.24s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(13){animation-delay:0.26s}a.svelte-18pc5lf:hover i.svelte-18pc5lf.svelte-18pc5lf:nth-child(14){animation-delay:0.28s}.maki-mix.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{display:flex;align-items:center;justify-content:center;padding:0.625rem;margin-right:-0.9375rem}.maki-mix.active.svelte-18pc5lf .yummy{display:none}@media(min-width: 768px){.maki-mix.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{display:none}}.mobile-nav.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{box-sizing:border-box;position:fixed;top:0;right:0;bottom:0;left:0;overflow:hidden;overflow-y:auto;background-color:var(--base);opacity:0;pointer-events:none;transition:opacity 0.4s cubic-bezier(0.7, 0, 0.3, 1);z-index:9;height:100vh}@media(max-width: 767px){.mobile-nav.active.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{opacity:1;pointer-events:all}.mobile-nav.active.svelte-18pc5lf a.svelte-18pc5lf.svelte-18pc5lf{transform:rotateY(0deg);opacity:1}.mobile-nav.active.svelte-18pc5lf a span.svelte-18pc5lf.svelte-18pc5lf{animation:svelte-18pc5lf-to-top 0.8s 0.2s var(--easing) forwards}.mobile-nav.active.svelte-18pc5lf a:nth-child(2) span.svelte-18pc5lf.svelte-18pc5lf{animation-delay:0.3s}.mobile-nav.active.svelte-18pc5lf a:nth-child(3) span.svelte-18pc5lf.svelte-18pc5lf{animation-delay:0.4s}.mobile-nav.active.svelte-18pc5lf a:nth-child(4) span.svelte-18pc5lf.svelte-18pc5lf{animation-delay:0.5s}.mobile-nav.active.svelte-18pc5lf footer h3 span.svelte-18pc5lf.svelte-18pc5lf{animation:svelte-18pc5lf-to-top 0.8s 0.7s var(--easing) forwards}.mobile-nav.active.svelte-18pc5lf footer a span.svelte-18pc5lf.svelte-18pc5lf{animation-delay:1s !important}}@media(min-width: 768px){.mobile-nav.svelte-18pc5lf.svelte-18pc5lf.svelte-18pc5lf{display:none}}.mobile-nav.svelte-18pc5lf>nav.svelte-18pc5lf.svelte-18pc5lf{height:var(--app-height);padding:6.25rem var(--core-padding) var(--core-padding);box-sizing:border-box;display:flex;flex-direction:column;justify-content:center}.mobile-nav.svelte-18pc5lf>nav.svelte-18pc5lf>div.svelte-18pc5lf{flex-grow:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:6.25rem}.mobile-nav.svelte-18pc5lf a.svelte-18pc5lf.svelte-18pc5lf{display:flex;font-size:2rem;line-height:2;width:100%;text-transform:uppercase;overflow:hidden;padding:0}.mobile-nav.svelte-18pc5lf a span.svelte-18pc5lf.svelte-18pc5lf{transform:translate3d(0, 100%, 0);padding:0}.mobile-nav.svelte-18pc5lf footer.svelte-18pc5lf.svelte-18pc5lf{margin-top:auto}.mobile-nav.svelte-18pc5lf footer h3.svelte-18pc5lf.svelte-18pc5lf,.mobile-nav.svelte-18pc5lf footer a.svelte-18pc5lf.svelte-18pc5lf{overflow:hidden}.mobile-nav.svelte-18pc5lf footer h3 span.svelte-18pc5lf.svelte-18pc5lf,.mobile-nav.svelte-18pc5lf footer a span.svelte-18pc5lf.svelte-18pc5lf{display:inline-flex;transform:translate3d(0, 100%, 0)}.mobile-nav.svelte-18pc5lf footer h3.svelte-18pc5lf.svelte-18pc5lf{font:var(--w1-serif);font-size:1.5rem;margin:0 0 0.625rem}.mobile-nav.svelte-18pc5lf footer h3 span.svelte-18pc5lf.svelte-18pc5lf{padding:0}.mobile-nav.svelte-18pc5lf footer a.svelte-18pc5lf.svelte-18pc5lf{font:var(--w1-sans);text-transform:none;text-decoration:underline;text-underline-offset:0.2em}',
      map: null
    };
    Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $page, $$unsubscribe_page;
      $$unsubscribe_page = subscribe(page, (value) => $page = value);
      let now2 = new Date(), year = now2.getFullYear();
      $$result.css.add(css$32);
      $$unsubscribe_page();
      return `

<header class="${"svelte-18pc5lf"}"><section class="${"svelte-18pc5lf"}"><div class="${"logo svelte-18pc5lf"}"><a sveltekit:prefetch href="${"/"}" title="${"Armin Neuhauser"}" class="${"svelte-18pc5lf"}"><i class="${"svelte-18pc5lf"}">A</i><i class="${"svelte-18pc5lf"}">r</i><i class="${"svelte-18pc5lf"}">m</i><i class="${"svelte-18pc5lf"}">i</i><i class="${"svelte-18pc5lf"}">n</i> <i class="${"svelte-18pc5lf"}">N</i><i class="${"svelte-18pc5lf"}">e</i><i class="${"svelte-18pc5lf"}">u</i><i class="${"svelte-18pc5lf"}">h</i><i class="${"svelte-18pc5lf"}">a</i><i class="${"svelte-18pc5lf"}">u</i><i class="${"svelte-18pc5lf"}">s</i><i class="${"svelte-18pc5lf"}">e</i><i class="${"svelte-18pc5lf"}">r</i></a></div>
        <div class="${"svelte-18pc5lf"}"><div class="${"svelte-18pc5lf"}"><a sveltekit:prefetch href="${"/projekte"}" title="${"Projekte"}" class="${["svelte-18pc5lf", $page.path === "/" ? "active" : ""].join(" ").trim()}"><i class="${"svelte-18pc5lf"}">P</i><i class="${"svelte-18pc5lf"}">r</i><i class="${"svelte-18pc5lf"}">o</i><i class="${"svelte-18pc5lf"}">j</i><i class="${"svelte-18pc5lf"}">e</i><i class="${"svelte-18pc5lf"}">k</i><i class="${"svelte-18pc5lf"}">t</i><i class="${"svelte-18pc5lf"}">e</i></a></div>
            <div class="${"svelte-18pc5lf"}"><a sveltekit:prefetch href="${"/ueber-mich"}" title="${"\xDCber mich"}" class="${["svelte-18pc5lf", $page.path === "/" ? "active" : ""].join(" ").trim()}"><i class="${"svelte-18pc5lf"}">\xDC</i><i class="${"svelte-18pc5lf"}">b</i><i class="${"svelte-18pc5lf"}">e</i><i class="${"svelte-18pc5lf"}">r</i> <i class="${"svelte-18pc5lf"}">m</i><i class="${"svelte-18pc5lf"}">i</i><i class="${"svelte-18pc5lf"}">c</i><i class="${"svelte-18pc5lf"}">h</i></a></div></div>
        <div class="${"svelte-18pc5lf"}"><a sveltekit:prefetch href="${"/kontakt"}" title="${"Kontakt"}" class="${["svelte-18pc5lf", $page.path === "/" ? "active" : ""].join(" ").trim()}"><i class="${"svelte-18pc5lf"}">K</i><i class="${"svelte-18pc5lf"}">o</i><i class="${"svelte-18pc5lf"}">n</i><i class="${"svelte-18pc5lf"}">t</i><i class="${"svelte-18pc5lf"}">a</i><i class="${"svelte-18pc5lf"}">k</i><i class="${"svelte-18pc5lf"}">t</i></a></div>
        <div class="${"last svelte-18pc5lf"}"><span class="${"svelte-18pc5lf"}">\xA9${escape(year)}</span>
            ${validate_component(DeathStar, "DeathStar").$$render($$result, {}, {}, {})}</div>
        <button class="${["maki-mix svelte-18pc5lf", ""].join(" ").trim()}"${add_attribute("title", "Men\xFC anzeigen", 0)}><!-- HTML_TAG_START -->${makiMix}<!-- HTML_TAG_END --></button></section></header>

<aside class="${["mobile-nav svelte-18pc5lf", ""].join(" ").trim()}"><nav class="${"svelte-18pc5lf"}"><div class="${"svelte-18pc5lf"}"><a sveltekit:prefetch href="${"/"}" title="${"Start"}" class="${["svelte-18pc5lf", $page.path === "/" ? "active" : ""].join(" ").trim()}"><span class="${"svelte-18pc5lf"}">Start</span></a>
            <a sveltekit:prefetch href="${"/projekte"}" title="${"Projekte"}" class="${"svelte-18pc5lf"}"><span class="${"svelte-18pc5lf"}">Projekte</span></a>
            <a sveltekit:prefetch href="${"/ueber-mich"}" title="${"\xDCber mich"}" class="${"svelte-18pc5lf"}"><span class="${"svelte-18pc5lf"}">\xDCber mich</span></a>
            <a sveltekit:prefetch href="${"/kontakt"}" title="${"Kontakt"}" class="${"svelte-18pc5lf"}"><span class="${"svelte-18pc5lf"}">Kontakt</span></a></div>
        <footer class="${"svelte-18pc5lf"}"><h3 class="${"svelte-18pc5lf"}"><span class="${"svelte-18pc5lf"}">Sag Hallo</span></h3>
            <a href="${"mailto:mail@arminneuhauser.at"}" class="${"svelte-18pc5lf"}"><span class="${"svelte-18pc5lf"}">mail@arminneuhauser.at</span></a></footer></nav>
</aside>`;
    });
    up = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n    <path d="M11.6464 0.146447C11.8417 -0.0488155 12.1583 -0.0488155 12.3536 0.146447L17.3536 5.14645C17.5488 5.34171 17.5488 5.65829 17.3536 5.85355C17.1583 6.04882 16.8417 6.04882 16.6464 5.85355L12 1.20711L7.35355 5.85355C7.15829 6.04882 6.84171 6.04882 6.64645 5.85355C6.45118 5.65829 6.45118 5.34171 6.64645 5.14645L11.6464 0.146447Z" fill="currentColor"/>\n    <path d="M12 0C12.2761 0 12.5 0.223858 12.5 0.5V23.5C12.5 23.7761 12.2761 24 12 24C11.7239 24 11.5 23.7761 11.5 23.5V0.5C11.5 0.223858 11.7239 0 12 0Z" fill="currentColor"/>\n</svg>\n';
    css$22 = {
      code: 'footer.svelte-11170st.svelte-11170st.svelte-11170st{background-color:var(--base);padding:4.375rem var(--core-padding) var(--core-padding);position:relative}@media(min-width: 768px){footer.svelte-11170st.svelte-11170st.svelte-11170st{padding-top:1.875rem;padding-bottom:1.875rem}}footer.svelte-11170st>div.svelte-11170st.svelte-11170st{max-width:var(--core-max-width);margin:0 auto}footer.svelte-11170st>div.svelte-11170st>div.svelte-11170st{display:flex;align-items:center;justify-content:space-between}footer.svelte-11170st h1.svelte-11170st.svelte-11170st{font-family:var(--serif);font-weight:700;font-size:clamp(2rem, 1.5384615385rem + 2.0512820513vw, 4rem);line-height:1.1}footer.svelte-11170st p.svelte-11170st.svelte-11170st{opacity:0.7}[color-scheme="highcontrast"] footer.svelte-11170st p.svelte-11170st.svelte-11170st{opacity:1}footer.svelte-11170st a.svelte-11170st.svelte-11170st{font-size:clamp(1.125rem, 1.0384615385rem + 0.3846153846vw, 1.5rem);margin:0 -0.625rem;padding:0.625rem;text-decoration:underline;text-underline-offset:0.2em;transition:color 0.2s var(--easing)}footer.svelte-11170st a.svelte-11170st.svelte-11170st:hover{color:var(--primary)}footer.svelte-11170st small.svelte-11170st.svelte-11170st{opacity:0.5}[color-scheme="highcontrast"] footer.svelte-11170st small.svelte-11170st.svelte-11170st{opacity:1}footer.svelte-11170st button.svelte-11170st.svelte-11170st{display:flex;align-items:center;justify-content:center;padding:0.625rem;margin-right:-0.625rem;transition:color 0.2s var(--easing)}footer.svelte-11170st button.svelte-11170st.svelte-11170st:hover{color:var(--primary)}footer.svelte-11170st hr.svelte-11170st.svelte-11170st{margin:2.5rem 0 1.25rem}',
      map: null
    };
    Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let now2 = new Date(), year = now2.getFullYear();
      $$result.css.add(css$22);
      return `<footer class="${"svelte-11170st"}"><div class="${"svelte-11170st"}"><h1 class="${"svelte-11170st"}">Lass uns gemeinsam Gro\xDFes erschaffen</h1>
        <p class="${"svelte-11170st"}">Jede Ausfahrt sollte mit einem guten Kaffee abgeschlossen werden.<br> Also komm vorbei und sag Hallo.
        </p>
        <a href="${"mailto:mail@arminneuhauser.at"}" class="${"svelte-11170st"}">mail@arminneuhauser.at</a>
        <hr class="${"svelte-11170st"}">
        <div class="${"svelte-11170st"}"><small class="${"svelte-11170st"}">Armin Neuhauser \xA9 ${escape(year)}</small>
            <button title="${"Zur\xFCck nach oben"}" class="${"svelte-11170st"}"><!-- HTML_TAG_START -->${up}<!-- HTML_TAG_END --></button></div></div>
</footer>`;
    });
    PageTransition = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { refresh = "" } = $$props;
      if ($$props.refresh === void 0 && $$bindings.refresh && refresh !== void 0)
        $$bindings.refresh(refresh);
      return `
    <div>${slots.default ? slots.default({}) : ``}</div>

`;
    });
    css$15 = {
      code: "svg.svelte-15pfraj{position:fixed;width:100%;height:100%;pointer-events:none;z-index:20;mix-blend-mode:exclusion;display:none}@media(pointer: fine) and (prefers-reduced-motion: no-preference){svg.svelte-15pfraj{display:block}}circle.svelte-15pfraj{color:#fff}",
      map: null
    };
    baseSize = 6;
    CursorCreep = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $coords, $$unsubscribe_coords;
      let $size, $$unsubscribe_size;
      let coords = spring({ x: -baseSize, y: -baseSize }, { stiffness: 0.3, damping: 1 });
      $$unsubscribe_coords = subscribe(coords, (value) => $coords = value);
      let size = spring(baseSize);
      $$unsubscribe_size = subscribe(size, (value) => $size = value);
      $$result.css.add(css$15);
      $$unsubscribe_coords();
      $$unsubscribe_size();
      return `

<svg class="${"svelte-15pfraj"}"><circle${add_attribute("cx", $coords.x, 0)}${add_attribute("cy", $coords.y, 0)}${add_attribute("r", $size, 0)} fill="${"currentColor"}" class="${"svelte-15pfraj"}"></circle></svg>`;
    });
    css12 = {
      code: "canvas.svelte-1konbxi{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1}",
      map: null
    };
    Scene = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      if (!(import_core2.Renderer.__plugins ?? {}).hasOwnProperty("interaction")) {
        import_core2.Renderer.registerPlugin("interaction", import_interaction2.InteractionManager);
      }
      if (!(import_core2.Renderer.__plugins ?? {}).hasOwnProperty("batch")) {
        import_core2.Renderer.registerPlugin("batch", import_core2.BatchRenderer);
      }
      if (!(import_app2.Application._plugins || []).some((plugin) => plugin === import_ticker2.TickerPlugin)) {
        import_app2.Application.registerPlugin(import_ticker2.TickerPlugin);
      }
      let view;
      $$result.css.add(css12);
      return `<canvas class="${"svelte-1konbxi"}"${add_attribute("this", view, 0)}></canvas>`;
    });
    load3 = async ({ page: page2 }) => ({ props: { key: page2.path } });
    _layout_reset = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { key } = $$props;
      scheme.subscribe((value) => {
      });
      if ($$props.key === void 0 && $$bindings.key && key !== void 0)
        $$bindings.key(key);
      return `<div>${validate_component(Header, "Header").$$render($$result, {}, {}, {})}

        <main>${validate_component(PageTransition, "PageTransition").$$render($$result, { refresh: key }, {}, {
        default: () => `${slots.default ? slots.default({}) : ``}`
      })}</main>
        
    ${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}
    ${validate_component(CursorCreep, "CursorCreep").$$render($$result, {}, {}, {})}

    ${validate_component(Scene, "Scene").$$render($$result, {}, {}, {})}</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-a1c47813.js
var index_a1c47813_exports = {};
__export(index_a1c47813_exports, {
  default: () => Kontakt,
  prerender: () => prerender3
});
var import_cookie10, css13, prerender3, Kontakt;
var init_index_a1c47813 = __esm({
  ".svelte-kit/output/server/chunks/index-a1c47813.js"() {
    init_shims();
    init_app_03b8560f();
    init_arrow_c94cf332();
    import_cookie10 = __toModule(require_cookie());
    init_dist();
    css13 = {
      code: 'form.svelte-1lbwzwq.svelte-1lbwzwq.svelte-1lbwzwq{font:var(--w1-sans)}form.svelte-1lbwzwq label.svelte-1lbwzwq.svelte-1lbwzwq{font:inherit;display:block;text-transform:uppercase;font-size:0.8125rem;font-weight:500}form.svelte-1lbwzwq input.svelte-1lbwzwq.svelte-1lbwzwq,form.svelte-1lbwzwq textarea.svelte-1lbwzwq.svelte-1lbwzwq{box-sizing:border-box;font:inherit;display:block;width:100%;background:none;border:0;border-bottom:1px solid var(--on-base);color:var(--on-base);min-height:3.125rem;padding:0.75rem 0}form.svelte-1lbwzwq input.svelte-1lbwzwq.svelte-1lbwzwq:focus-visible,form.svelte-1lbwzwq textarea.svelte-1lbwzwq.svelte-1lbwzwq:focus-visible{outline:none}form.svelte-1lbwzwq textarea.svelte-1lbwzwq.svelte-1lbwzwq{resize:none}form.svelte-1lbwzwq button.svelte-1lbwzwq.svelte-1lbwzwq{font:inherit;border:1px solid var(--primary);height:3.125rem;border-radius:1.5625rem;padding:0.625rem 1.875rem;text-transform:uppercase;font-size:0.8125rem;font-weight:500;display:flex;align-items:center;gap:0.9375rem;position:relative;z-index:1;overflow:hidden}form.svelte-1lbwzwq button.svelte-1lbwzwq svg{transition:transform 0.25s var(--easing)}form.svelte-1lbwzwq button.svelte-1lbwzwq.svelte-1lbwzwq::before{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background-color:var(--primary);transform:scaleX(0);transform-origin:bottom left;transition:transform 0.6s var(--easing);z-index:-1}form.svelte-1lbwzwq button.svelte-1lbwzwq.svelte-1lbwzwq:hover::before,form.svelte-1lbwzwq button.svelte-1lbwzwq.svelte-1lbwzwq:focus::before{transform:scaleX(1)}form.svelte-1lbwzwq button.svelte-1lbwzwq:hover svg,form.svelte-1lbwzwq button.svelte-1lbwzwq:focus svg{transform:translateX(0.3125rem)}@keyframes svelte-1lbwzwq-fadein{0%{opacity:0}100%{opacity:1}}@keyframes svelte-1lbwzwq-fadein-from-primary{0%{color:var(--primary);opacity:0;filter:blur(0.05em)}50%{color:var(--primary);opacity:0.8}100%{color:var(--on-base);opacity:1;filter:unset}}@keyframes svelte-1lbwzwq-to-top-10{0%{transform:translate3d(0, 10%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1lbwzwq-to-top{0%{transform:translate3d(0, 100%, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1lbwzwq-to-right{0%{transform:translate3d(-100%, 0, 0)}100%{transform:translate3d(0, 0, 0)}}@keyframes svelte-1lbwzwq-flip-and-back{0%{transform:rotate3d(1, 0, 0, 0deg)}50%{transform:rotate3d(1, 0, 0, 180deg)}100%{transform:rotate3d(1, 0, 0, 360deg)}}@keyframes svelte-1lbwzwq-blink-animation{from{opacity:1}to{opacity:0}}@keyframes svelte-1lbwzwq-scroll{0%{transform:translate3d(0, 200%, 0);opacity:0}10%{opacity:1}70%{opacity:1}100%{transform:translate3d(0, 0, 0);opacity:0}}@keyframes svelte-1lbwzwq-shutter{0%{bottom:0%;top:100%}50%{bottom:0%;top:0%}100%{bottom:100%;top:0%}}@keyframes svelte-1lbwzwq-scale{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}@keyframes svelte-1lbwzwq-flickr{0%,19.999%,22%,62.999%,64%,64.999%,72%,100%{opacity:1}20%,21.999%,63%,63.999%,65%,71.999%{opacity:0.3}}section.svelte-1lbwzwq.svelte-1lbwzwq.svelte-1lbwzwq{box-sizing:border-box;padding:var(--core-padding)}section.svelte-1lbwzwq>div.svelte-1lbwzwq.svelte-1lbwzwq{margin:0 auto;max-width:var(--content-max-width)}section.svelte-1lbwzwq>header.svelte-1lbwzwq.svelte-1lbwzwq{margin:0 auto 2.5rem;max-width:var(--content-max-width)}section.svelte-1lbwzwq.svelte-1lbwzwq.svelte-1lbwzwq:last-child{padding-bottom:calc(var(--core-padding) * 3)}section.svelte-1lbwzwq+section.svelte-1lbwzwq.svelte-1lbwzwq{padding-top:calc(var(--core-padding) * 3)}h1.svelte-1lbwzwq.svelte-1lbwzwq.svelte-1lbwzwq{font-size:clamp(3.5rem, 1.5159090909rem + 8.8181818182vw, 15.625rem);font-weight:400;white-space:nowrap;overflow:hidden;width:100vw;margin:7.5rem 0 4.375rem;text-transform:uppercase}@media(min-width: 1024px){h1.svelte-1lbwzwq.svelte-1lbwzwq.svelte-1lbwzwq{margin-top:11.25rem}}h1.svelte-1lbwzwq span.svelte-1lbwzwq.svelte-1lbwzwq{display:inline-block}h1.svelte-1lbwzwq span.svelte-1lbwzwq span.svelte-1lbwzwq{display:flex;gap:0.25em;align-items:baseline;transition:transform 0.5s var(--easing)}h1.svelte-1lbwzwq em.svelte-1lbwzwq.svelte-1lbwzwq{font-family:var(--serif);font-style:normal;font-weight:700}h3.svelte-1lbwzwq.svelte-1lbwzwq.svelte-1lbwzwq{font-size:clamp(1.5rem, 1.3557692308rem + 0.641025641vw, 2.125rem);line-height:1.1;margin:0.75em 0}p.svelte-1lbwzwq.svelte-1lbwzwq.svelte-1lbwzwq{font-size:clamp(1rem, 0.9711538462rem + 0.1282051282vw, 1.125rem);max-width:37.5rem;margin:0.75em 0}form.svelte-1lbwzwq>div.svelte-1lbwzwq.svelte-1lbwzwq{margin-bottom:1.875rem}.mail.svelte-1lbwzwq.svelte-1lbwzwq.svelte-1lbwzwq{font-size:clamp(1.375rem, 0.125rem + 6.25vw, 3.125rem);font-weight:500}.mail.svelte-1lbwzwq>span.svelte-1lbwzwq.svelte-1lbwzwq{position:relative;z-index:1}.mail.svelte-1lbwzwq>span.svelte-1lbwzwq.svelte-1lbwzwq::before{content:"";position:absolute;left:0;width:100%;bottom:-0.05em;border-bottom:0.1em solid var(--on-base);transition:transform 0.25s var(--easing);pointer-events:none}[color-scheme="dark"] .mail.svelte-1lbwzwq>span.svelte-1lbwzwq.svelte-1lbwzwq{text-shadow:0 0 0.033em #fff, 0 0 0.08em #fff, 0 0 0.1em var(--primary), 0 0 0.2em var(--primary), 0 0 0.3em var(--primary), 0 0 1em var(--primary), 0 0 1.5em var(--primary)}[color-scheme="dark"] .mail.svelte-1lbwzwq>span.svelte-1lbwzwq.svelte-1lbwzwq::before{box-shadow:0 0 0.033em #fff, 0 0 0.08em #fff, 0 0 0.1em var(--primary), 0 0 0.2em var(--primary), 0 0 0.3em var(--primary), 0 0 1em var(--primary), 0 0 1.5em var(--primary)}[color-scheme="dark"] .mail.svelte-1lbwzwq>span .flickr.svelte-1lbwzwq.svelte-1lbwzwq{animation:svelte-1lbwzwq-flickr 3s linear infinite alternate forwards;position:relative;z-index:1}.mail.svelte-1lbwzwq:hover>span.svelte-1lbwzwq.svelte-1lbwzwq::before{transform:translateY(0.1em)}',
      map: null
    };
    prerender3 = true;
    Kontakt = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let shift = -10;
      setInterval(() => {
        if (shift < -75) {
          shift = 0;
        }
        shift -= 0.015;
      }, 10);
      $$result.css.add(css13);
      return `${$$result.head += `${$$result.title = `<title>Kontakt | Armin Neuhauser</title>`, ""}`, ""}

<h1 class="${"headline svelte-1lbwzwq"}"><span style="${"transform: translate(" + escape(shift) + "%,0)"}" class="${"svelte-1lbwzwq"}"><span class="${"svelte-1lbwzwq"}"><em class="${"svelte-1lbwzwq"}">Kontakt</em> Kontakt
            <em class="${"svelte-1lbwzwq"}">Kontakt</em> Kontakt
            <em class="${"svelte-1lbwzwq"}">Kontakt</em> Kontakt
            <em class="${"svelte-1lbwzwq"}">Kontakt</em> Kontakt
        </span></span></h1>

<section class="${"svelte-1lbwzwq"}"><header class="${"svelte-1lbwzwq"}"><p class="${"svelte-1lbwzwq"}">Ich bin immer auf der Suche nach neuen Ideen und spannenden Projekten. Z\xF6gere nicht, mir zu schreiben.
        </p></header>
    <div class="${"svelte-1lbwzwq"}"><a class="${"mail svelte-1lbwzwq"}" href="${"mailto:mail@arminneuhauser.at"}"><span class="${"svelte-1lbwzwq"}">mail<span class="${"flickr svelte-1lbwzwq"}">@</span>arminneuhauser.at</span></a></div></section>

<section class="${"svelte-1lbwzwq"}"><header class="${"svelte-1lbwzwq"}"><h3 class="${"svelte-1lbwzwq"}">Lass uns dein Projekt verwirklichen</h3>
        <p class="${"svelte-1lbwzwq"}">Ob zu einem konkreten Projekt oder nur zum Kennenlernen \u2013 F\xFClle das Kontaktformular aus, wenn du mit mir zusammenarbeiten m\xF6chtest.
        </p></header>
    <div class="${"svelte-1lbwzwq"}"><form name="${"contact"}" method="${"post"}" netlify class="${"svelte-1lbwzwq"}"><input type="${"hidden"}" name="${"form-name"}" value="${"contact"}" class="${"svelte-1lbwzwq"}">
            <div class="${"svelte-1lbwzwq"}"><label for="${"name"}" class="${"svelte-1lbwzwq"}">Name</label>
                <input id="${"name"}" name="${"name"}" type="${"text"}" placeholder="${"Dein Name"}" class="${"svelte-1lbwzwq"}"></div>
            <div class="${"svelte-1lbwzwq"}"><label for="${"email"}" class="${"svelte-1lbwzwq"}">E-Mail-Adresse</label>
                <input id="${"email"}" name="${"email"}" type="${"email"}" placeholder="${"Deine E-Mail-Adresse"}" class="${"svelte-1lbwzwq"}"></div>
            <div class="${"svelte-1lbwzwq"}"><label for="${"message"}" class="${"svelte-1lbwzwq"}">Nachricht</label>
                <textarea id="${"message"}" name="${"message"}" placeholder="${"Deine Nachricht an mich"}" rows="${"5"}" class="${"svelte-1lbwzwq"}"></textarea></div>
            <button type="${"submit"}" class="${"svelte-1lbwzwq"}">Absenden
                <!-- HTML_TAG_START -->${arrow}<!-- HTML_TAG_END --></button></form></div>
</section>`;
    });
  }
});

// .svelte-kit/output/server/chunks/app-03b8560f.js
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function resolve(base2, path) {
  if (scheme2.test(path))
    return path;
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
function is_root_relative(path) {
  return path[0] === "/" && path[1] !== "/";
}
function coalesce_to_error(err) {
  return err instanceof Error || err && err.name && err.message ? err : new Error(JSON.stringify(err));
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler2) {
    return;
  }
  const params = route.params(match);
  const response = await handler2({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop$1() {
}
function safe_not_equal$1(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function writable2(value, start = noop$1) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal$1(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue2.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue2.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue2.length; i += 2) {
            subscriber_queue2[i][0](subscriber_queue2[i + 1]);
          }
          subscriber_queue2.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
function escape_json_string_in_html(str) {
  return escape$1(str, escape_json_string_in_html_dict, (code) => `\\u${code.toString(16).toUpperCase()}`);
}
function escape_html_attr(str) {
  return '"' + escape$1(str, escape_html_attr_dict, (code) => `&#${code};`) + '"';
}
function escape$1(str, dict, unicode_encoder) {
  let result = "";
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char in dict) {
      result += dict[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += unicode_encoder(code);
      }
    } else {
      result += char;
    }
  }
  return result;
}
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  page: page2
}) {
  const css22 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css22.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable2($session);
    const props = {
      stores: {
        page: writable2(null),
        navigating: writable2(null),
        session
      },
      page: page2,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css22).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
    init2 += options2.service_worker ? '<script async custom-element="amp-install-serviceworker" src="https://cdn.ampproject.org/v0/amp-install-serviceworker-0.1.js"><\/script>' : "";
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page2 && page2.host ? s$1(page2.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page2 && page2.host ? s$1(page2.host) : "location.host"}, // TODO this is redundant
						path: ${page2 && page2.path ? try_serialize(page2.path, (error3) => {
      throw new Error(`Failed to serialize page.path: ${error3.message}`);
    }) : null},
						query: new URLSearchParams(${page2 && page2.query ? s$1(page2.query.toString()) : ""}),
						params: ${page2 && page2.params ? try_serialize(page2.params, (error3) => {
      throw new Error(`Failed to serialize page.params: ${error3.message}`);
    }) : null}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += options2.amp ? `<amp-install-serviceworker src="${options2.service_worker}" layout="nodisplay"></amp-install-serviceworker>` : `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url=${escape_html_attr(url)}`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(coalesce_to_error(err));
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  if (loaded.context) {
    throw new Error('You are returning "context" from a load function. "context" was renamed to "stuff", please adjust your code accordingly.');
  }
  return loaded;
}
async function load_node({
  request,
  options: options2,
  state,
  route,
  page: page2,
  node,
  $session,
  stuff,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let set_cookie_headers = [];
  let loaded;
  const page_proxy = new Proxy(page2, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const prefix = options2.paths.assets || options2.paths.base;
        const filename = (resolved.startsWith(prefix) ? resolved.slice(prefix.length) : resolved).slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page2.host}/${asset.file}`, opts);
        } else if (is_root_relative(resolved)) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, _receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 === "set-cookie") {
                    set_cookie_headers = set_cookie_headers.concat(value);
                  } else if (key2 !== "etag") {
                    headers[key2] = value;
                  }
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":"${escape_json_string_in_html(body)}"}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      stuff: { ...stuff }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    stuff: loaded.stuff || stuff,
    fetched,
    set_cookie_headers,
    uses_credentials
  };
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page: page2,
    node: default_layout,
    $session,
    stuff: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page: page2,
      node: default_error,
      $session,
      stuff: loaded ? loaded.stuff : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page: page2
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {}
    };
  }
  let branch = [];
  let status = 200;
  let error2;
  let set_cookie_headers = [];
  ssr:
    if (page_config.ssr) {
      let stuff = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              stuff,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            set_cookie_headers = set_cookie_headers.concat(loaded.set_cookie_headers);
            if (loaded.loaded.redirect) {
              return with_cookies({
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              }, set_cookie_headers);
            }
            if (loaded.loaded.error) {
              ({ status, error: error2 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded && !error2) {
            branch.push(loaded);
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    stuff: node_loaded.stuff,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return with_cookies(await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            }), set_cookie_headers);
          }
        }
        if (loaded && loaded.loaded.stuff) {
          stuff = {
            ...stuff,
            ...loaded.loaded.stuff
          };
        }
      }
    }
  try {
    return with_cookies(await render_response({
      ...opts,
      page_config,
      status,
      error: error2,
      branch: branch.filter(Boolean)
    }), set_cookie_headers);
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return with_cookies(await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    }), set_cookie_headers);
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
function with_cookies(response, set_cookie_headers) {
  if (set_cookie_headers.length) {
    response.headers["set-cookie"] = set_cookie_headers;
  }
  return response;
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page: page2
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text();
    case "application/json":
      return JSON.parse(text());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                let if_none_match_value = request2.headers["if-none-match"];
                if (if_none_match_value?.startsWith('W/"')) {
                  if_none_match_value = if_none_match_value.substring(2);
                }
                const etag = `"${hash(response.body || "")}"`;
                if (if_none_match_value === etag) {
                  return {
                    status: 304,
                    headers: {}
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
function assign(tar, src2) {
  for (const k in src2)
    tar[k] = src2[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(context || (parent_component ? parent_component.$$.context : [])),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css22) => css22.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-564224a5.js",
      css: [assets + "/_app/assets/start-0dba5459.css"],
      js: [assets + "/_app/start-564224a5.js", assets + "/_app/chunks/vendor-01d7f779.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
async function load_component(file) {
  const { entry, css: css22, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css22.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender: prerender4
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender4 });
}
var import_cookie11, __accessCheck, __privateGet, __privateAdd, __privateSet, _map, absolute, scheme2, chars, unsafeChars, reserved, escaped$1, objectProtoOwnPropertyNames, subscriber_queue2, escape_json_string_in_html_dict, escape_html_attr_dict, s$1, s, ReadOnlyFormData, identity, is_client, now, raf, tasks, current_component, escaped, missing_component, on_destroy, css14, Root, base, assets, handle, user_hooks, template, options, default_settings, empty, manifest, get_hooks, module_lookup, metadata_lookup;
var init_app_03b8560f = __esm({
  ".svelte-kit/output/server/chunks/app-03b8560f.js"() {
    init_shims();
    import_cookie11 = __toModule(require_cookie());
    init_dist();
    __accessCheck = (obj, member, msg) => {
      if (!member.has(obj))
        throw TypeError("Cannot " + msg);
    };
    __privateGet = (obj, member, getter) => {
      __accessCheck(obj, member, "read from private field");
      return getter ? getter.call(obj) : member.get(obj);
    };
    __privateAdd = (obj, member, value) => {
      if (member.has(obj))
        throw TypeError("Cannot add the same private member more than once");
      member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
    };
    __privateSet = (obj, member, value, setter) => {
      __accessCheck(obj, member, "write to private field");
      setter ? setter.call(obj, value) : member.set(obj, value);
      return value;
    };
    absolute = /^([a-z]+:)?\/?\//;
    scheme2 = /^[a-z]+:/;
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
    unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
    reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
    escaped$1 = {
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
    Promise.resolve();
    subscriber_queue2 = [];
    escape_json_string_in_html_dict = {
      '"': '\\"',
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    escape_html_attr_dict = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    };
    s$1 = JSON.stringify;
    s = JSON.stringify;
    ReadOnlyFormData = class {
      constructor(map) {
        __privateAdd(this, _map, void 0);
        __privateSet(this, _map, map);
      }
      get(key) {
        const value = __privateGet(this, _map).get(key);
        return value && value[0];
      }
      getAll(key) {
        return __privateGet(this, _map).get(key);
      }
      has(key) {
        return __privateGet(this, _map).has(key);
      }
      *[Symbol.iterator]() {
        for (const [key, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *entries() {
        for (const [key, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *keys() {
        for (const [key] of __privateGet(this, _map))
          yield key;
      }
      *values() {
        for (const [, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield value[i];
          }
        }
      }
    };
    _map = new WeakMap();
    identity = (x) => x;
    is_client = typeof window !== "undefined";
    now = is_client ? () => window.performance.now() : () => Date.now();
    raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
    tasks = new Set();
    Promise.resolve();
    escaped = {
      '"': "&quot;",
      "'": "&#39;",
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    };
    missing_component = {
      $$render: () => ""
    };
    css14 = {
      code: "#svelte-announcer.svelte-b8s5el{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
      map: null
    };
    Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { stores } = $$props;
      let { page: page2 } = $$props;
      let { components } = $$props;
      let { props_0 = null } = $$props;
      let { props_1 = null } = $$props;
      let { props_2 = null } = $$props;
      setContext("__svelte__", stores);
      afterUpdate(stores.page.notify);
      if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
        $$bindings.stores(stores);
      if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
        $$bindings.page(page2);
      if ($$props.components === void 0 && $$bindings.components && components !== void 0)
        $$bindings.components(components);
      if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
        $$bindings.props_0(props_0);
      if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
        $$bindings.props_1(props_1);
      if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
        $$bindings.props_2(props_2);
      $$result.css.add(css14);
      {
        stores.page.set(page2);
      }
      return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
        default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
          default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
        })}` : ``}`
      })}

${``}`;
    });
    base = "";
    assets = "";
    handle = async ({ request, resolve: resolve2 }) => {
      const cookies = import_cookie11.default.parse(request.headers.cookie || "");
      request.locals.userid = cookies.userid || v4();
      if (request.query.has("_method")) {
        request.method = request.query.get("_method").toUpperCase();
      }
      const response = await resolve2(request);
      if (!cookies.userid) {
        response.headers["set-cookie"] = import_cookie11.default.serialize("userid", request.locals.userid, {
          path: "/",
          httpOnly: true
        });
      }
      return response;
    };
    user_hooks = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module",
      handle
    });
    template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="de" color-scheme="dark">\n    <head>\n        <meta charset="utf-8" />\n        <link rel="icon" href="/favicon.png" />\n        <meta name="viewport" content="width=device-width, initial-scale=1" />\n        <meta name="theme-color" content="#000">\n        <style>body {background-color: #050505; color: #fff;}</style>\n\n        ' + head + '\n    </head>\n    <body>\n        <div id="svelte">' + body + "</div>\n    </body>\n</html>\n";
    options = null;
    default_settings = { paths: { "base": "", "assets": "" } };
    empty = () => ({});
    manifest = {
      assets: [{ "file": ".DS_Store", "size": 6148, "type": null }, { "file": "favicon.png", "size": 5717, "type": "image/png" }, { "file": "fonts/ff-mark-medium.woff2", "size": 42076, "type": "font/woff2" }, { "file": "fonts/ff-mark-regular.woff2", "size": 43796, "type": "font/woff2" }, { "file": "fonts/iskry-bold.woff2", "size": 47796, "type": "font/woff2" }, { "file": "images/.DS_Store", "size": 8196, "type": null }, { "file": "images/armin-panama-city.jpg", "size": 149758, "type": "image/jpeg" }, { "file": "images/mst-muhr/.DS_Store", "size": 6148, "type": null }, { "file": "images/mst-muhr/mst-hero-lg.jpg", "size": 82996, "type": "image/jpeg" }, { "file": "images/mst-muhr/mst-hero-sm.jpg", "size": 42139, "type": "image/jpeg" }, { "file": "images/mst-muhr/mst-muhr-01-dark.jpg", "size": 89405, "type": "image/jpeg" }, { "file": "images/mst-muhr/mst-muhr-01.jpg", "size": 93478, "type": "image/jpeg" }, { "file": "images/mst-muhr/mst-muhr-02-dark.jpg", "size": 103324, "type": "image/jpeg" }, { "file": "images/mst-muhr/mst-muhr-02.jpg", "size": 112619, "type": "image/jpeg" }, { "file": "images/mst-muhr/mst-muhr-dark.mp4", "size": 2056877, "type": "video/mp4" }, { "file": "images/mst-muhr/mst-muhr-dark.webm", "size": 1788378, "type": "video/webm" }, { "file": "images/mst-muhr/mst-muhr-lg.jpg", "size": 137924, "type": "image/jpeg" }, { "file": "images/mst-muhr/mst-muhr.jpg", "size": 34723, "type": "image/jpeg" }, { "file": "images/mst-muhr/mst-muhr.mp4", "size": 2237896, "type": "video/mp4" }, { "file": "images/mst-muhr/mst-muhr.webm", "size": 1787784, "type": "video/webm" }, { "file": "images/mst-muhr/mst-schweizergarten.jpg", "size": 229134, "type": "image/jpeg" }, { "file": "images/solmates/.DS_Store", "size": 6148, "type": null }, { "file": "images/solmates/solmates-boquete.jpg", "size": 209770, "type": "image/jpeg" }, { "file": "images/solmates/solmates-buch-02.jpg", "size": 192280, "type": "image/jpeg" }, { "file": "images/solmates/solmates-buch.jpg", "size": 277868, "type": "image/jpeg" }, { "file": "images/solmates/solmates-buch.mp4", "size": 15967483, "type": "video/mp4" }, { "file": "images/solmates/solmates-buch.webm", "size": 15112406, "type": "video/webm" }, { "file": "images/solmates/solmates-cartagena.jpg", "size": 295383, "type": "image/jpeg" }, { "file": "images/solmates/solmates-costa-rica.jpg", "size": 314053, "type": "image/jpeg" }, { "file": "images/solmates/solmates-hero-lg.jpg", "size": 369052, "type": "image/jpeg" }, { "file": "images/solmates/solmates-hero-sm.jpg", "size": 162565, "type": "image/jpeg" }, { "file": "images/solmates/solmates-home.jpg", "size": 371539, "type": "image/jpeg" }, { "file": "images/solmates/solmates-lg.jpg", "size": 464356, "type": "image/jpeg" }, { "file": "images/solmates/solmates-panama-city.jpg", "size": 408266, "type": "image/jpeg" }, { "file": "images/solmates/solmates-peru.jpg", "size": 492739, "type": "image/jpeg" }, { "file": "images/solmates/solmates-san-blas-02.jpg", "size": 294816, "type": "image/jpeg" }, { "file": "images/solmates/solmates-san-blas.jpg", "size": 519302, "type": "image/jpeg" }, { "file": "images/solmates/solmates.jpg", "size": 106493, "type": "image/jpeg" }, { "file": "images/solmates/solmates.mp4", "size": 6718092, "type": "video/mp4" }, { "file": "images/solmates/solmates.webm", "size": 4565940, "type": "video/webm" }, { "file": "images/solmates/solmates01.jpg", "size": 243436, "type": "image/jpeg" }, { "file": "images/solmates/solmates02.jpg", "size": 288001, "type": "image/jpeg" }, { "file": "images/solmates/solmates03.jpg", "size": 220855, "type": "image/jpeg" }, { "file": "images/solmates/solmates04.jpg", "size": 127719, "type": "image/jpeg" }, { "file": "images/solmates/solmates05.jpg", "size": 214718, "type": "image/jpeg" }, { "file": "images/wohnformat/.DS_Store", "size": 6148, "type": null }, { "file": "images/wohnformat/wohnformat-hero-lg.jpg", "size": 81564, "type": "image/jpeg" }, { "file": "images/wohnformat/wohnformat-hero-sm.jpg", "size": 43244, "type": "image/jpeg" }, { "file": "images/wohnformat/wohnformat-lg.jpg", "size": 142604, "type": "image/jpeg" }, { "file": "images/wohnformat/wohnformat.jpg", "size": 43204, "type": "image/jpeg" }, { "file": "images/wohnformat/wohnformat1.jpg", "size": 57217, "type": "image/jpeg" }, { "file": "images/wohnformat/wohnformat2.jpg", "size": 36220, "type": "image/jpeg" }, { "file": "images/wohnformat/wohnformat3.jpg", "size": 40437, "type": "image/jpeg" }, { "file": "images/wohnformat/wohnformat4.jpg", "size": 75241, "type": "image/jpeg" }, { "file": "images/wohnformat/wohnformat5.jpg", "size": 61749, "type": "image/jpeg" }, { "file": "robots.txt", "size": 67, "type": "text/plain" }],
      layout: "src/routes/__layout.svelte",
      error: "src/routes/__error.svelte",
      routes: [
        {
          type: "page",
          pattern: /^\/$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
          b: ["src/routes/__error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/ueber-mich\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/ueber-mich.svelte"],
          b: ["src/routes/__error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/projekte\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/projekte/index.svelte"],
          b: ["src/routes/__error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/projekte\/wohnformat\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/projekte/wohnformat.svelte"],
          b: ["src/routes/__error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/projekte\/mst-muhr\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/projekte/mst-muhr.svelte"],
          b: ["src/routes/__error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/projekte\/solmates\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/projekte/solmates.svelte"],
          b: ["src/routes/__error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/kontakt\/?$/,
          params: empty,
          a: ["src/routes/kontakt/__layout.reset.svelte", "src/routes/kontakt/index.svelte"],
          b: []
        }
      ]
    };
    get_hooks = (hooks) => ({
      getSession: hooks.getSession || (() => ({})),
      handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
      handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
      externalFetch: hooks.externalFetch || fetch
    });
    module_lookup = {
      "src/routes/__layout.svelte": () => Promise.resolve().then(() => (init_layout_0ea74923(), layout_0ea74923_exports)),
      "src/routes/__error.svelte": () => Promise.resolve().then(() => (init_error_bfa49163(), error_bfa49163_exports)),
      "src/routes/index.svelte": () => Promise.resolve().then(() => (init_index_8451d8a1(), index_8451d8a1_exports)),
      "src/routes/ueber-mich.svelte": () => Promise.resolve().then(() => (init_ueber_mich_586498a5(), ueber_mich_586498a5_exports)),
      "src/routes/projekte/index.svelte": () => Promise.resolve().then(() => (init_index_0a3f2f66(), index_0a3f2f66_exports)),
      "src/routes/projekte/wohnformat.svelte": () => Promise.resolve().then(() => (init_wohnformat_7471a4d0(), wohnformat_7471a4d0_exports)),
      "src/routes/projekte/mst-muhr.svelte": () => Promise.resolve().then(() => (init_mst_muhr_de98b9f5(), mst_muhr_de98b9f5_exports)),
      "src/routes/projekte/solmates.svelte": () => Promise.resolve().then(() => (init_solmates_3cbe8739(), solmates_3cbe8739_exports)),
      "src/routes/kontakt/__layout.reset.svelte": () => Promise.resolve().then(() => (init_layout_reset_90845c5f(), layout_reset_90845c5f_exports)),
      "src/routes/kontakt/index.svelte": () => Promise.resolve().then(() => (init_index_a1c47813(), index_a1c47813_exports))
    };
    metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-dbe2987b.js", "css": ["assets/pages/__layout.svelte-8abd4b06.css", "assets/Scene-13ff6062.css", "assets/DeathStar-5f3bc394.css"], "js": ["pages/__layout.svelte-dbe2987b.js", "chunks/vendor-01d7f779.js", "chunks/Scene-032ebd6e.js", "chunks/DeathStar-a6fcbfb9.js"], "styles": [] }, "src/routes/__error.svelte": { "entry": "pages/__error.svelte-6baf8ab2.js", "css": ["assets/pages/__error.svelte-5a8fc307.css"], "js": ["pages/__error.svelte-6baf8ab2.js", "chunks/vendor-01d7f779.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-978b1a45.js", "css": ["assets/pages/index.svelte-b717f5e1.css", "assets/DeathStar-5f3bc394.css"], "js": ["pages/index.svelte-978b1a45.js", "chunks/vendor-01d7f779.js", "chunks/DeathStar-a6fcbfb9.js", "chunks/arrow-c94cf332.js"], "styles": [] }, "src/routes/ueber-mich.svelte": { "entry": "pages/ueber-mich.svelte-045d1850.js", "css": ["assets/pages/ueber-mich.svelte-81172310.css"], "js": ["pages/ueber-mich.svelte-045d1850.js", "chunks/vendor-01d7f779.js"], "styles": [] }, "src/routes/projekte/index.svelte": { "entry": "pages/projekte/index.svelte-d5e28d9d.js", "css": ["assets/pages/projekte/index.svelte-dbc05f05.css"], "js": ["pages/projekte/index.svelte-d5e28d9d.js", "chunks/vendor-01d7f779.js"], "styles": [] }, "src/routes/projekte/wohnformat.svelte": { "entry": "pages/projekte/wohnformat.svelte-835575e1.js", "css": ["assets/pages/projekte/wohnformat.svelte-59c98956.css", "assets/Switch.svelte_svelte_type_style_lang-ed5f0fd4.css", "assets/external-40be6ba9.css"], "js": ["pages/projekte/wohnformat.svelte-835575e1.js", "chunks/vendor-01d7f779.js", "chunks/external-e2a53927.js"], "styles": [] }, "src/routes/projekte/mst-muhr.svelte": { "entry": "pages/projekte/mst-muhr.svelte-a4c157a7.js", "css": ["assets/pages/projekte/mst-muhr.svelte-2eef603c.css", "assets/Switch.svelte_svelte_type_style_lang-ed5f0fd4.css", "assets/external-40be6ba9.css"], "js": ["pages/projekte/mst-muhr.svelte-a4c157a7.js", "chunks/vendor-01d7f779.js", "chunks/external-e2a53927.js", "chunks/Parallax-49dc5c87.js"], "styles": [] }, "src/routes/projekte/solmates.svelte": { "entry": "pages/projekte/solmates.svelte-8f52ca75.js", "css": ["assets/pages/projekte/solmates.svelte-73870ba0.css", "assets/external-40be6ba9.css"], "js": ["pages/projekte/solmates.svelte-8f52ca75.js", "chunks/vendor-01d7f779.js", "chunks/external-e2a53927.js", "chunks/Parallax-49dc5c87.js"], "styles": [] }, "src/routes/kontakt/__layout.reset.svelte": { "entry": "pages/kontakt/__layout.reset.svelte-06dc6fd5.js", "css": ["assets/Scene-13ff6062.css", "assets/DeathStar-5f3bc394.css"], "js": ["pages/kontakt/__layout.reset.svelte-06dc6fd5.js", "chunks/vendor-01d7f779.js", "chunks/Scene-032ebd6e.js", "chunks/DeathStar-a6fcbfb9.js"], "styles": [] }, "src/routes/kontakt/index.svelte": { "entry": "pages/kontakt/index.svelte-3dde359c.js", "css": ["assets/pages/kontakt/index.svelte-4ac878b4.css"], "js": ["pages/kontakt/index.svelte-3dde359c.js", "chunks/vendor-01d7f779.js", "chunks/arrow-c94cf332.js"], "styles": [] } };
  }
});

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});
init_shims();

// .svelte-kit/output/server/app.js
init_shims();
init_app_03b8560f();
var import_cookie12 = __toModule(require_cookie());
init_dist();

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const encoding = isBase64Encoded ? "base64" : headers["content-encoding"] || "utf-8";
  const rawBody = typeof body === "string" ? Buffer.from(body, encoding) : body;
  const rendered = await render({
    method: httpMethod,
    headers,
    path,
    query,
    rawBody
  });
  if (!rendered) {
    return {
      statusCode: 404,
      body: "Not found"
    };
  }
  const partial_response = {
    statusCode: rendered.status,
    ...split_headers(rendered.headers)
  };
  if (rendered.body instanceof Uint8Array) {
    return {
      ...partial_response,
      isBase64Encoded: true,
      body: Buffer.from(rendered.body).toString("base64")
    };
  }
  return {
    ...partial_response,
    body: rendered.body
  };
}
function split_headers(headers) {
  const h = {};
  const m = {};
  for (const key in headers) {
    const value = headers[key];
    const target = Array.isArray(value) ? m : h;
    target[key] = value;
  }
  return {
    headers: h,
    multiValueHeaders: m
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*!
 * @pixi/app - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/app is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/constants - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/constants is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/core - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/core is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/display - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/display is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/filter-color-matrix - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/filter-color-matrix is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/filter-kawase-blur - v4.1.5
 * Compiled Wed, 29 Sep 2021 14:05:57 UTC
 *
 * @pixi/filter-kawase-blur is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/filter-noise - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/filter-noise is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/graphics - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/graphics is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/interaction - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/interaction is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/math - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/math is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/runner - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/runner is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/settings - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/settings is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/ticker - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/ticker is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * @pixi/utils - v6.2.0
 * Compiled Mon, 01 Nov 2021 16:52:10 UTC
 *
 * @pixi/utils is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
