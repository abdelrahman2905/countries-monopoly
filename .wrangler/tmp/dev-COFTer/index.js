var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env3) {
    return 1;
  }
  hasColors(count3, env3) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// node_modules/partyserver/dist/index.js
import { DurableObject, env as env2 } from "cloudflare:workers";

// node_modules/partyserver/node_modules/nanoid/url-alphabet/index.js
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

// node_modules/partyserver/node_modules/nanoid/index.browser.js
var nanoid = /* @__PURE__ */ __name((size = 21) => {
  let id = "";
  let bytes = crypto.getRandomValues(new Uint8Array(size |= 0));
  while (size--) {
    id += urlAlphabet[bytes[size] & 63];
  }
  return id;
}, "nanoid");

// node_modules/partyserver/dist/index.js
if (!("OPEN" in WebSocket)) {
  const WebSocketStatus = {
    CONNECTING: WebSocket.READY_STATE_CONNECTING,
    OPEN: WebSocket.READY_STATE_OPEN,
    CLOSING: WebSocket.READY_STATE_CLOSING,
    CLOSED: WebSocket.READY_STATE_CLOSED
  };
  Object.assign(WebSocket, WebSocketStatus);
  Object.assign(WebSocket.prototype, WebSocketStatus);
}
function tryGetPartyServerMeta(ws) {
  try {
    const attachment = WebSocket.prototype.deserializeAttachment.call(ws);
    if (!attachment || typeof attachment !== "object") return null;
    if (!("__pk" in attachment)) return null;
    const pk = attachment.__pk;
    if (!pk || typeof pk !== "object") return null;
    const { id, tags } = pk;
    if (typeof id !== "string") return null;
    const { uri } = pk;
    return {
      id,
      tags: Array.isArray(tags) ? tags : [],
      uri: typeof uri === "string" ? uri : void 0
    };
  } catch {
    return null;
  }
}
__name(tryGetPartyServerMeta, "tryGetPartyServerMeta");
function isPartyServerWebSocket(ws) {
  return tryGetPartyServerMeta(ws) !== null;
}
__name(isPartyServerWebSocket, "isPartyServerWebSocket");
var AttachmentCache = class {
  static {
    __name(this, "AttachmentCache");
  }
  #cache = /* @__PURE__ */ new WeakMap();
  get(ws) {
    let attachment = this.#cache.get(ws);
    if (!attachment) {
      attachment = WebSocket.prototype.deserializeAttachment.call(ws);
      if (attachment !== void 0) this.#cache.set(ws, attachment);
      else throw new Error("Missing websocket attachment. This is most likely an issue in PartyServer, please open an issue at https://github.com/cloudflare/partykit/issues");
    }
    return attachment;
  }
  set(ws, attachment) {
    this.#cache.set(ws, attachment);
    WebSocket.prototype.serializeAttachment.call(ws, attachment);
  }
};
var attachments = new AttachmentCache();
var connections = /* @__PURE__ */ new WeakSet();
var isWrapped = /* @__PURE__ */ __name((ws) => {
  return connections.has(ws);
}, "isWrapped");
var createLazyConnection = /* @__PURE__ */ __name((ws) => {
  if (isWrapped(ws)) return ws;
  let initialState;
  if ("state" in ws) {
    initialState = ws.state;
    delete ws.state;
  }
  const connection = Object.defineProperties(ws, {
    id: {
      configurable: true,
      get() {
        return attachments.get(ws).__pk.id;
      }
    },
    uri: {
      configurable: true,
      get() {
        return attachments.get(ws).__pk.uri ?? null;
      }
    },
    tags: {
      configurable: true,
      get() {
        return attachments.get(ws).__pk.tags ?? [];
      }
    },
    socket: {
      configurable: true,
      get() {
        return ws;
      }
    },
    state: {
      configurable: true,
      get() {
        return ws.deserializeAttachment();
      }
    },
    setState: {
      configurable: true,
      value: /* @__PURE__ */ __name(function setState(setState) {
        let state;
        if (setState instanceof Function) state = setState(this.state);
        else state = setState;
        ws.serializeAttachment(state);
        return state;
      }, "setState")
    },
    deserializeAttachment: {
      configurable: true,
      value: /* @__PURE__ */ __name(function deserializeAttachment() {
        return attachments.get(ws).__user ?? null;
      }, "deserializeAttachment")
    },
    serializeAttachment: {
      configurable: true,
      value: /* @__PURE__ */ __name(function serializeAttachment(attachment) {
        const setting = {
          ...attachments.get(ws),
          __user: attachment ?? null
        };
        attachments.set(ws, setting);
      }, "serializeAttachment")
    }
  });
  if (initialState) connection.setState(initialState);
  connections.add(connection);
  return connection;
}, "createLazyConnection");
var HibernatingConnectionIterator = class {
  static {
    __name(this, "HibernatingConnectionIterator");
  }
  index = 0;
  sockets;
  constructor(state, tag) {
    this.state = state;
    this.tag = tag;
  }
  [Symbol.iterator]() {
    return this;
  }
  next() {
    const sockets = this.sockets ?? (this.sockets = this.state.getWebSockets(this.tag));
    let socket;
    while (socket = sockets[this.index++]) if (socket.readyState === WebSocket.READY_STATE_OPEN) {
      if (!isPartyServerWebSocket(socket)) continue;
      return {
        done: false,
        value: createLazyConnection(socket)
      };
    }
    return {
      done: true,
      value: void 0
    };
  }
};
function prepareTags(connectionId, userTags) {
  const tags = [connectionId, ...userTags.filter((t) => t !== connectionId)];
  if (tags.length > 10) throw new Error("A connection can only have 10 tags, including the default id tag.");
  for (const tag of tags) {
    if (typeof tag !== "string") throw new Error(`A connection tag must be a string. Received: ${tag}`);
    if (tag === "") throw new Error("A connection tag must not be an empty string.");
    if (tag.length > 256) throw new Error("A connection tag must not exceed 256 characters");
  }
  return tags;
}
__name(prepareTags, "prepareTags");
var InMemoryConnectionManager = class {
  static {
    __name(this, "InMemoryConnectionManager");
  }
  #connections = /* @__PURE__ */ new Map();
  tags = /* @__PURE__ */ new WeakMap();
  getCount() {
    return this.#connections.size;
  }
  getConnection(id) {
    return this.#connections.get(id);
  }
  *getConnections(tag) {
    if (!tag) {
      yield* this.#connections.values().filter((c2) => c2.readyState === WebSocket.READY_STATE_OPEN);
      return;
    }
    for (const connection of this.#connections.values()) if ((this.tags.get(connection) ?? []).includes(tag)) yield connection;
  }
  accept(connection, options) {
    try {
      connection.accept({ allowHalfOpen: true });
    } catch {
      connection.accept();
    }
    try {
      connection.binaryType = "arraybuffer";
    } catch {
    }
    const tags = prepareTags(connection.id, options.tags);
    this.#connections.set(connection.id, connection);
    this.tags.set(connection, tags);
    Object.defineProperty(connection, "tags", {
      get: /* @__PURE__ */ __name(() => tags, "get"),
      configurable: true
    });
    const removeConnection = /* @__PURE__ */ __name(() => {
      this.#connections.delete(connection.id);
      connection.removeEventListener("close", removeConnection);
      connection.removeEventListener("error", removeConnection);
    }, "removeConnection");
    connection.addEventListener("close", removeConnection);
    connection.addEventListener("error", removeConnection);
    return connection;
  }
};
var HibernatingConnectionManager = class {
  static {
    __name(this, "HibernatingConnectionManager");
  }
  constructor(controller) {
    this.controller = controller;
  }
  getCount() {
    let count3 = 0;
    for (const ws of this.controller.getWebSockets()) if (isPartyServerWebSocket(ws)) count3++;
    return count3;
  }
  getConnection(id) {
    const matching = this.controller.getWebSockets(id).filter((ws) => {
      return tryGetPartyServerMeta(ws)?.id === id;
    });
    if (matching.length === 0) return void 0;
    if (matching.length === 1) return createLazyConnection(matching[0]);
    throw new Error(`More than one connection found for id ${id}. Did you mean to use getConnections(tag) instead?`);
  }
  getConnections(tag) {
    return new HibernatingConnectionIterator(this.controller, tag);
  }
  accept(connection, options) {
    const tags = prepareTags(connection.id, options.tags);
    this.controller.acceptWebSocket(connection, tags);
    connection.serializeAttachment({
      __pk: {
        id: connection.id,
        tags,
        uri: connection.uri ?? void 0
      },
      __user: null
    });
    return createLazyConnection(connection);
  }
};
var CLOSING = 2;
var CLOSED = 3;
function isBenignTeardownError(ws, error3) {
  const state = ws.readyState;
  if (state !== CLOSING && state !== CLOSED) return false;
  if (typeof error3 !== "object" || error3 === null) return false;
  const typed = error3;
  if (typed.retryable === true) return true;
  const message = typeof typed.message === "string" ? typed.message : "";
  return /Network connection lost|WebSocket peer disconnected/i.test(message);
}
__name(isBenignTeardownError, "isBenignTeardownError");
var NAME_STORAGE_KEY = "__ps_name";
function isReservedCloseCode(code) {
  return code === 1005 || code === 1006 || code === 1015;
}
__name(isReservedCloseCode, "isReservedCloseCode");
function closeQuietly(ws, code, reason) {
  if (isReservedCloseCode(code)) return;
  try {
    ws.close(code, reason);
  } catch {
  }
}
__name(closeQuietly, "closeQuietly");
var serverMapCache = /* @__PURE__ */ new WeakMap();
var bindingNameCache = /* @__PURE__ */ new WeakMap();
var DEFAULT_ROUTING_RETRY_OPTIONS = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 800
};
function durableObjectGetOptions(options) {
  return options?.locationHint ? { locationHint: options.locationHint } : void 0;
}
__name(durableObjectGetOptions, "durableObjectGetOptions");
function validatePositiveInteger(value, name) {
  if (!Number.isFinite(value) || value < 1) throw new Error(`${name} must be >= 1`);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
}
__name(validatePositiveInteger, "validatePositiveInteger");
function validatePositiveNumber(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be > 0`);
}
__name(validatePositiveNumber, "validatePositiveNumber");
function resolveRoutingRetryOptions(options) {
  if (options === false) return null;
  const resolved = {
    maxAttempts: options?.maxAttempts ?? DEFAULT_ROUTING_RETRY_OPTIONS.maxAttempts,
    baseDelayMs: options?.baseDelayMs ?? DEFAULT_ROUTING_RETRY_OPTIONS.baseDelayMs,
    maxDelayMs: options?.maxDelayMs ?? DEFAULT_ROUTING_RETRY_OPTIONS.maxDelayMs,
    onRetry: options?.onRetry
  };
  validatePositiveInteger(resolved.maxAttempts, "routingRetry.maxAttempts");
  validatePositiveNumber(resolved.baseDelayMs, "routingRetry.baseDelayMs");
  validatePositiveNumber(resolved.maxDelayMs, "routingRetry.maxDelayMs");
  if (resolved.baseDelayMs > resolved.maxDelayMs) throw new Error("routingRetry.baseDelayMs must be <= maxDelayMs");
  return resolved;
}
__name(resolveRoutingRetryOptions, "resolveRoutingRetryOptions");
function isRetryableDurableObjectError(error3) {
  if (typeof error3 !== "object" || error3 === null) return false;
  const typed = error3;
  return typed.retryable === true && typed.overloaded !== true;
}
__name(isRetryableDurableObjectError, "isRetryableDurableObjectError");
function routingRetryDelayMs(attempt, options) {
  const upperBoundMs = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** (attempt - 1));
  return Math.floor(Math.random() * upperBoundMs);
}
__name(routingRetryDelayMs, "routingRetryDelayMs");
async function retryDurableObjectOperation(operation, context2, retryOptions) {
  const resolved = resolveRoutingRetryOptions(retryOptions);
  if (!resolved) return await operation();
  let attempt = 1;
  while (true) try {
    return await operation();
  } catch (error3) {
    const nextAttempt = attempt + 1;
    if (nextAttempt > resolved.maxAttempts || !isRetryableDurableObjectError(error3)) throw error3;
    const delayMs = routingRetryDelayMs(attempt, resolved);
    try {
      await resolved.onRetry?.({
        error: error3,
        attempt,
        maxAttempts: resolved.maxAttempts,
        delayMs,
        name: context2.name,
        className: context2.className
      });
    } catch (callbackError) {
      console.warn("PartyServer routingRetry onRetry callback failed:", callbackError);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    attempt = nextAttempt;
  }
}
__name(retryDurableObjectOperation, "retryDurableObjectOperation");
function encodeProps(props) {
  const bytes = new TextEncoder().encode(JSON.stringify(props));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
__name(encodeProps, "encodeProps");
function decodeProps(header) {
  const trimmed = header.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);
  const binary = atob(header);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}
__name(decodeProps, "decodeProps");
function camelCaseToKebabCase(str) {
  if (str === str.toUpperCase() && str !== str.toLowerCase()) return str.toLowerCase().replace(/_/g, "-");
  let kebabified = str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  kebabified = kebabified.startsWith("-") ? kebabified.slice(1) : kebabified;
  return kebabified.replace(/_/g, "-").replace(/-$/, "");
}
__name(camelCaseToKebabCase, "camelCaseToKebabCase");
function resolveCorsHeaders(cors) {
  if (cors === true) return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400"
  };
  if (cors && typeof cors === "object") {
    const h = new Headers(cors);
    const record = {};
    h.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }
  return null;
}
__name(resolveCorsHeaders, "resolveCorsHeaders");
async function routePartykitRequest(req, env$1 = env2, options) {
  if (!serverMapCache.has(env$1)) {
    const namespaceMap = {};
    const bindingNames2 = {};
    for (const [k, v] of Object.entries(env$1)) if (v && typeof v === "object" && "idFromName" in v && typeof v.idFromName === "function") {
      const kebab = camelCaseToKebabCase(k);
      namespaceMap[kebab] = v;
      bindingNames2[kebab] = k;
    }
    serverMapCache.set(env$1, namespaceMap);
    bindingNameCache.set(env$1, bindingNames2);
  }
  const map = serverMapCache.get(env$1);
  const bindingNames = bindingNameCache.get(env$1);
  const prefixParts = (options?.prefix || "parties").split("/");
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  if (!prefixParts.every((part, index) => parts[index] === part) || parts.length < prefixParts.length + 2) return null;
  const namespace = parts[prefixParts.length];
  const name = parts[prefixParts.length + 1];
  if (name && namespace) {
    let withCorsHeaders = function(response2) {
      if (!corsHeaders || isWebSocket) return response2;
      const newResponse = new Response(response2.body, response2);
      for (const [key, value] of Object.entries(corsHeaders)) newResponse.headers.set(key, value);
      return newResponse;
    };
    __name(withCorsHeaders, "withCorsHeaders");
    if (!map[namespace]) {
      if (namespace === "main") {
        console.warn("You appear to be migrating a PartyKit project to PartyServer.");
        console.warn(`PartyServer doesn't have a "main" party by default. Try adding this to your PartySocket client:
 
party: "${camelCaseToKebabCase(Object.keys(map)[0])}"`);
      } else console.error(`The url ${req.url}  with namespace "${namespace}" and name "${name}" does not match any server namespace. 
Did you forget to add a durable object binding to the class ${namespace[0].toUpperCase() + namespace.slice(1)} in your wrangler.jsonc?`);
      return new Response("Invalid request", { status: 400 });
    }
    const corsHeaders = resolveCorsHeaders(options?.cors);
    const isWebSocket = req.headers.get("Upgrade")?.toLowerCase() === "websocket";
    if (req.method === "OPTIONS" && corsHeaders) return new Response(null, { headers: corsHeaders });
    let doNamespace = map[namespace];
    if (options?.jurisdiction) doNamespace = doNamespace.jurisdiction(options.jurisdiction);
    const id = doNamespace.idFromName(name);
    const getOptions = durableObjectGetOptions(options);
    req = new Request(req);
    req.headers.set("x-partykit-namespace", namespace);
    if (options?.jurisdiction) req.headers.set("x-partykit-jurisdiction", options.jurisdiction);
    const className = bindingNames[namespace];
    let partyDeprecationWarned = false;
    const lobby = {
      get party() {
        if (!partyDeprecationWarned) {
          partyDeprecationWarned = true;
          console.warn('lobby.party is deprecated and currently returns the kebab-case namespace (e.g. "my-agent"). Use lobby.className instead to get the Durable Object class name (e.g. "MyAgent"). In the next major version, lobby.party will return the class name.');
        }
        return namespace;
      },
      className,
      name
    };
    if (isWebSocket) {
      if (options?.onBeforeConnect) {
        const reqOrRes = await options.onBeforeConnect(req, lobby);
        if (reqOrRes instanceof Request) req = reqOrRes;
        else if (reqOrRes instanceof Response) return reqOrRes;
      }
    } else if (options?.onBeforeRequest) {
      const reqOrRes = await options.onBeforeRequest(req, lobby);
      if (reqOrRes instanceof Request) req = reqOrRes;
      else if (reqOrRes instanceof Response) return withCorsHeaders(reqOrRes);
    }
    if (options?.props !== void 0) req.headers.set("x-partykit-props", encodeProps(options.props));
    const response = await retryDurableObjectOperation(() => doNamespace.get(id, getOptions).fetch(req.clone()), {
      name,
      className
    }, options?.routingRetry);
    return isWebSocket ? response : withCorsHeaders(response);
  } else return null;
}
__name(routePartykitRequest, "routePartykitRequest");
function resolveServerOptions(serverClass) {
  let current = serverClass;
  while (current) {
    const hibernate = current.options?.hibernate;
    if (hibernate !== void 0) return { hibernate };
    current = Object.getPrototypeOf(current);
  }
  return { hibernate: false };
}
__name(resolveServerOptions, "resolveServerOptions");
var Server = class extends DurableObject {
  static {
    __name(this, "Server");
  }
  static options = { hibernate: false };
  #status = "zero";
  #ParentClass = Object.getPrototypeOf(this).constructor;
  #options = resolveServerOptions(this.#ParentClass);
  #connectionManager = this.#options.hibernate ? new HibernatingConnectionManager(this.ctx) : new InMemoryConnectionManager();
  /**
  * Execute SQL queries against the Server's database
  * @template T Type of the returned rows
  * @param strings SQL query template strings
  * @param values Values to be inserted into the query
  * @returns Array of query results
  */
  sql(strings, ...values) {
    let query = "";
    try {
      query = strings.reduce((acc, str, i) => acc + str + (i < values.length ? "?" : ""), "");
      return [...this.ctx.storage.sql.exec(query, ...values)];
    } catch (e) {
      console.error(`failed to execute sql query: ${query}`, e);
      throw this.onException(e);
    }
  }
  constructor(ctx, env3) {
    super(ctx, env3);
  }
  /**
  * Handle incoming requests to the server.
  */
  async fetch(request) {
    try {
      const props = request.headers.get("x-partykit-props");
      if (props) this.#_props = decodeProps(props);
      if (!this.ctx.id.name && !this.#_name) {
        const room = request.headers.get("x-partykit-room");
        if (room) this.#_name = room;
      }
      await this.#ensureInitialized();
      if (!this.ctx.id.name && !this.#_name) throw new Error(`Cannot determine the name for ${this.#ParentClass.name}: this.ctx.id.name is undefined, no legacy __ps_name storage record is present, and no x-partykit-room header was supplied. Likely causes:
  1. The stub was built via idFromString()/newUniqueId(). PartyServer requires name-based addressing (idFromName/getByName).
  2. The workerd/wrangler runtime is too old to expose ctx.id.name \u2014 update to a recent wrangler release.
  3. You called stub.fetch() directly without going through routePartykitRequest()/getServerByName(). Prefer those, or set the x-partykit-room header.`);
      const url = new URL(request.url);
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return await this.onRequest(request);
      else {
        const { 0: clientWebSocket, 1: serverWebSocket } = new WebSocketPair();
        let connectionId = url.searchParams.get("_pk");
        if (!connectionId) connectionId = nanoid();
        let connection = Object.assign(serverWebSocket, {
          id: connectionId,
          uri: request.url,
          server: this.name,
          tags: [],
          state: null,
          setState(setState) {
            let state;
            if (setState instanceof Function) state = setState(this.state);
            else state = setState;
            this.state = state;
            return this.state;
          }
        });
        const ctx = { request };
        const tags = await this.getConnectionTags(connection, ctx);
        connection = this.#connectionManager.accept(connection, { tags });
        if (!this.#options.hibernate) this.#attachSocketEventHandlers(connection);
        await this.onConnect(connection, ctx);
        return new Response(null, {
          status: 101,
          webSocket: clientWebSocket
        });
      }
    } catch (err) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} fetch:`, err);
      if (!(err instanceof Error)) throw err;
      if (request.headers.get("Upgrade") === "websocket") {
        const pair = new WebSocketPair();
        pair[1].accept();
        pair[1].send(JSON.stringify({ error: err.stack }));
        pair[1].close(1011, "Uncaught exception during session setup");
        return new Response(null, {
          status: 101,
          webSocket: pair[0]
        });
      } else return new Response(err.stack, { status: 500 });
    }
  }
  async webSocketMessage(ws, message) {
    if (!isPartyServerWebSocket(ws)) return;
    try {
      const connection = createLazyConnection(ws);
      await this.#ensureInitialized();
      connection.server = this.name;
      return this.onMessage(connection, message);
    } catch (e) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} webSocketMessage:`, e);
    }
  }
  async webSocketClose(ws, code, reason, wasClean) {
    if (!isPartyServerWebSocket(ws)) return;
    try {
      const connection = createLazyConnection(ws);
      await this.#ensureInitialized();
      connection.server = this.name;
      await this.onClose(connection, code, reason, wasClean);
    } catch (e) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} webSocketClose:`, e);
    } finally {
      closeQuietly(ws, code, reason);
    }
  }
  async webSocketError(ws, error3) {
    if (!isPartyServerWebSocket(ws)) return;
    if (isBenignTeardownError(ws, error3)) return;
    try {
      const connection = createLazyConnection(ws);
      await this.#ensureInitialized();
      connection.server = this.name;
      return this.onError(connection, error3);
    } catch (e) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} webSocketError:`, e);
    }
  }
  /**
  * Read the legacy `__ps_name` storage record as a fallback source of
  * `this.name` when `ctx.id.name` is unavailable. Covers:
  *
  *   1. Alarm handlers firing on alarm records that were scheduled by
  *      a workerd version that did not yet persist `name` into the
  *      alarm record (see the Durable Objects ID docs:
  *      https://developers.cloudflare.com/durable-objects/api/id/#name).
  *      The runtime contract for current workerd populates `ctx.id.name`
  *      in alarm handlers — see the "Raw runtime contract" tests — so
  *      this fallback exists primarily for stale on-disk alarm records
  *      and for defense-in-depth against future runtime changes.
  *   2. Legacy framework-level bootstrap patterns that write
  *      `__ps_name` directly (or call `setName()`) before triggering
  *      `__unsafe_ensureInitialized()` — typically DOs addressed via
  *      `idFromString()` / `newUniqueId()` plus a name override.
  */
  async #hydrateNameFromLegacyStorage() {
    if (this.#_name) return;
    const stored = await this.ctx.storage.get(NAME_STORAGE_KEY);
    if (stored) this.#_name = stored;
  }
  async #persistNameFallbackFromCtxId() {
    const ctxName = this.ctx.id.name;
    if (ctxName === void 0 || this.#_name) return;
    if (await this.ctx.storage.get(NAME_STORAGE_KEY) !== ctxName) await this.ctx.storage.put(NAME_STORAGE_KEY, ctxName);
    this.#_name = ctxName;
  }
  /**
  * @internal — Do not use directly. This is an escape hatch for frameworks
  * (like Agents) that receive calls via native DO RPC, bypassing the
  * standard fetch/alarm/webSocket entry points where initialization
  * normally happens. Calling this from application code is unsupported
  * and may break without notice.
  */
  async __unsafe_ensureInitialized() {
    await this.#ensureInitialized();
  }
  async #ensureInitialized() {
    if (this.#status === "started") return;
    if (this.ctx.id.name !== void 0) await this.#persistNameFallbackFromCtxId();
    else if (!this.#_name) await this.#hydrateNameFromLegacyStorage();
    let error3;
    await this.ctx.blockConcurrencyWhile(async () => {
      this.#status = "starting";
      try {
        await this.onStart(this.#_props);
        this.#status = "started";
      } catch (e) {
        this.#status = "zero";
        error3 = e;
      }
    });
    if (error3) throw error3;
  }
  #attachSocketEventHandlers(connection) {
    const handleMessageFromClient = /* @__PURE__ */ __name((event) => {
      this.onMessage(connection, event.data)?.catch((e) => {
        console.error("onMessage error:", e);
      });
    }, "handleMessageFromClient");
    const reciprocateClose = /* @__PURE__ */ __name((event) => {
      closeQuietly(connection, event.code, event.reason);
    }, "reciprocateClose");
    const handleCloseFromClient = /* @__PURE__ */ __name((event) => {
      connection.removeEventListener("message", handleMessageFromClient);
      connection.removeEventListener("close", handleCloseFromClient);
      let result;
      try {
        result = this.onClose(connection, event.code, event.reason, event.wasClean);
      } catch (e) {
        console.error("onClose error:", e);
        reciprocateClose(event);
        return;
      }
      if (result && typeof result.then === "function") result.catch((e) => {
        console.error("onClose error:", e);
      }).finally(() => reciprocateClose(event));
      else reciprocateClose(event);
    }, "handleCloseFromClient");
    const handleErrorFromClient = /* @__PURE__ */ __name((e) => {
      connection.removeEventListener("message", handleMessageFromClient);
      connection.removeEventListener("error", handleErrorFromClient);
      if (isBenignTeardownError(connection, e.error)) return;
      this.onError(connection, e.error)?.catch((err) => {
        console.error("onError error:", err);
      });
    }, "handleErrorFromClient");
    connection.addEventListener("close", handleCloseFromClient);
    connection.addEventListener("error", handleErrorFromClient);
    connection.addEventListener("message", handleMessageFromClient);
  }
  #_name;
  /**
  * The name for this server.
  *
  * Resolves from `this.ctx.id.name` — the native DO id name, populated
  * whenever the stub was created via `idFromName()` or `getByName()`.
  * This is available inside every entry point (including the constructor,
  * alarms, and hibernating websocket handlers).
  *
  * For alarm handlers firing on stale on-disk alarm records from
  * older workerd versions that didn't persist `name` into the alarm
  * record, the name is recovered from a storage fallback record.
  *
  * Throws if neither source is available — typically this means the DO
  * was addressed via `idFromString()` or `newUniqueId()`, which is not
  * supported by PartyServer.
  */
  get name() {
    const ctxName = this.ctx.id.name;
    if (ctxName !== void 0) return ctxName;
    if (this.#_name) return this.#_name;
    throw new Error(`Attempting to read .name on ${this.#ParentClass.name}, but this.ctx.id.name is not set and no ${NAME_STORAGE_KEY} fallback record is available. PartyServer requires DOs to be addressed via idFromName()/getByName(), or explicitly bootstrapped with setName() when using idFromString()/newUniqueId(). If this happens in an alarm handler firing on a stale alarm record, initialize the DO from a fetch/RPC entry point first so PartyServer can persist the fallback name.`);
  }
  /**
  * Establish this server's name and trigger `onStart()`.
  *
  * Use cases:
  *
  *   1. **Framework-level bootstrap of DOs where `ctx.id.name` is
  *      undefined** — e.g. DOs addressed via `idFromString()` /
  *      `newUniqueId()`. `setName()` stashes the name in memory and
  *      persists it under `__ps_name` so cold-wake invocations
  *      recover it via `#ensureInitialized()`'s legacy fallback.
  *   2. **Delivering initial `props` to `onStart()`** via the
  *      optional second argument.
  *
  * For DOs addressed via `idFromName()` / `getByName()`, calling
  * `setName()` is redundant — `this.name` is available automatically
  * from `ctx.id.name`. The normal initialization path also persists
  * a fallback record so old-compat alarm handlers can recover the name.
  * Throws if `name` does not match `ctx.id.name`.
  *
  * **Not appropriate for facets.** Cloudflare Agents and any other
  * framework using `ctx.facets.get(...)` should pass an explicit
  * `id` in `FacetStartupOptions` so the facet has its own
  * `ctx.id.name`:
  *
  * ```ts
  * const stub = ctx.facets.get(facetKey, () => ({
  *   class: ChildClass,
  *   id: ctx.exports.SomeBoundDOClass.idFromName(facetName),
  * }));
  * ```
  *
  * Without an explicit `id`, the facet inherits the parent DO's
  * `ctx.id` (including `ctx.id.name`), and `setName()` will throw
  * the ctx.id.name-mismatch error because the facet's intended
  * name differs from the parent's. See
  * https://developers.cloudflare.com/dynamic-workers/usage/durable-object-facets/
  * for the `FacetStartupOptions.id` semantics.
  *
  * @deprecated for callers that address DOs via `idFromName()` /
  * `getByName()`. Still the supported API for framework-level
  * bootstrap of header/`newUniqueId`-addressed DOs and for
  * delivering initial `props` to `onStart()`.
  */
  async setName(name, props) {
    if (!name) throw new Error("A name is required.");
    const ctxName = this.ctx.id.name;
    if (ctxName !== void 0 && ctxName !== name) throw new Error(`This server's Durable Object id was created for name "${ctxName}", cannot setName to "${name}".`);
    if (this.#_name && this.#_name !== name) throw new Error(`This server already has a name: ${this.#_name}, attempting to set to: ${name}`);
    if (props !== void 0) this.#_props = props;
    if (!this.#_name && ctxName === void 0) {
      await this.ctx.storage.put(NAME_STORAGE_KEY, name);
      this.#_name = name;
    }
    await this.#ensureInitialized();
  }
  /**
  * @internal
  * @deprecated Retained for backward compatibility with older callers.
  * `routePartykitRequest` no longer uses this method; it sends props via
  * the `x-partykit-props` header on the underlying `fetch()` request.
  */
  async _initAndFetch(name, props, request) {
    await this.setName(name, props);
    return this.fetch(request);
  }
  #sendMessageToConnection(connection, message) {
    try {
      connection.send(message);
    } catch (_e) {
      connection.close(1011, "Unexpected error");
    }
  }
  /** Send a message to all connected clients, except connection ids listed in `without` */
  broadcast(msg, without) {
    for (const connection of this.#connectionManager.getConnections()) if (!without || !without.includes(connection.id)) this.#sendMessageToConnection(connection, msg);
  }
  /** Get a connection by connection id */
  getConnection(id) {
    return this.#connectionManager.getConnection(id);
  }
  /**
  * Get all connections. Optionally, you can provide a tag to filter returned connections.
  * Use `Server#getConnectionTags` to tag the connection on connect.
  */
  getConnections(tag) {
    return this.#connectionManager.getConnections(tag);
  }
  /**
  * You can tag a connection to filter them in Server#getConnections.
  * Each connection supports up to 9 tags, each tag max length is 256 characters.
  */
  getConnectionTags(connection, context2) {
    return [];
  }
  #_props;
  /**
  * Called when the server is started for the first time.
  */
  onStart(props) {
  }
  /**
  * Called when a new connection is made to the server.
  */
  onConnect(connection, ctx) {
  }
  /**
  * Called when a message is received from a connection.
  */
  onMessage(connection, message) {
  }
  /**
  * Called when a connection is closed.
  */
  onClose(connection, code, reason, wasClean) {
  }
  /**
  * Called when an error occurs on a connection.
  */
  onError(connection, error3) {
    console.error(`Error on connection ${connection.id} in ${this.#ParentClass.name}:${this.name}:`, error3);
    console.info(`Implement onError on ${this.#ParentClass.name} to handle this error.`);
  }
  /**
  * Called when a request is made to the server.
  */
  onRequest(request) {
    console.warn(`onRequest hasn't been implemented on ${this.#ParentClass.name}:${this.name} responding to ${request.url}`);
    return new Response("Not implemented", { status: 404 });
  }
  /**
  * Called when an exception occurs.
  * @param error - The error that occurred.
  */
  onException(error3) {
    console.error(`Exception in ${this.#ParentClass.name}:${this.name}:`, error3);
    console.info(`Implement onException on ${this.#ParentClass.name} to handle this error.`);
  }
  onAlarm() {
    console.log(`Implement onAlarm on ${this.#ParentClass.name} to handle alarms.`);
  }
  async alarm() {
    await this.#ensureInitialized();
    await this.onAlarm();
  }
};

// shared/game.ts
var JAIL_INDEX = 10;
var MIN_PLAYERS = 2;
var MAX_BUILD_LEVEL = 5;
var DEFAULT_SETTINGS = {
  startMoney: 1500,
  goSalary: 300,
  bonusAfterRounds: 5,
  bonusSalary: 1e3,
  turnTimer: 90,
  maxPlayers: 6,
  buildings: true,
  inflation: true,
  doublesRoll: true,
  freeParkingPot: false
};
var SETTING_OPTIONS = {
  startMoney: [1e3, 1500, 2e3, 3e3, 5e3],
  goSalary: [0, 100, 200, 300, 500],
  bonusAfterRounds: [0, 3, 5, 8, 10],
  bonusSalary: [500, 1e3, 1500, 2e3],
  turnTimer: [0, 30, 60, 90, 120],
  maxPlayers: [2, 3, 4, 5, 6]
};
var salaryFor = /* @__PURE__ */ __name((g) => g.settings.bonusAfterRounds > 0 && g.round >= g.settings.bonusAfterRounds ? g.settings.bonusSalary : g.settings.goSalary, "salaryFor");
function mergeSettings(base, patch) {
  if (!patch || typeof patch !== "object") return "Invalid settings.";
  const next = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (k in SETTING_OPTIONS) {
      if (!SETTING_OPTIONS[k].includes(v)) return "Invalid value.";
      next[k] = v;
    } else if (k in DEFAULT_SETTINGS && typeof v === "boolean") {
      next[k] = v;
    } else return "Unknown setting.";
  }
  return next;
}
__name(mergeSettings, "mergeSettings");
var c = /* @__PURE__ */ __name((iso, name, price, group3, c1, c2) => ({
  kind: "country",
  name,
  iso,
  price,
  rent: Math.round(price / 10),
  group: group3,
  colors: [c1, c2]
}), "c");
var chance = /* @__PURE__ */ __name(() => ({ kind: "chance", name: "Chance", icon: "\u2753" }), "chance");
var BOARD = [
  { kind: "go", name: "Go", icon: "\u{1F3C1}" },
  c("ng", "Nigeria", 60, 0, "#008751", "#ffffff"),
  c("ke", "Kenya", 60, 0, "#bb0000", "#006600"),
  chance(),
  c("eg", "Egypt", 100, 1, "#ce1126", "#c09300"),
  c("ma", "Morocco", 100, 1, "#c1272d", "#006233"),
  c("dz", "Algeria", 120, 1, "#006233", "#d21034"),
  c("th", "Thailand", 140, 2, "#a51931", "#2d2a4a"),
  c("vn", "Vietnam", 140, 2, "#da251d", "#ffcd00"),
  c("id", "Indonesia", 160, 2, "#ce1126", "#ffffff"),
  { kind: "jail", name: "Jail", icon: "\u{1F512}" },
  c("pk", "Pakistan", 180, 3, "#01411c", "#ffffff"),
  c("bd", "Bangladesh", 180, 3, "#006a4e", "#f42a41"),
  chance(),
  c("in", "India", 200, 4, "#ff9933", "#138808"),
  c("sa", "Saudi Arabia", 200, 4, "#006c35", "#ffffff"),
  c("ir", "Iran", 220, 4, "#239f40", "#da0000"),
  c("tr", "Turkey", 240, 5, "#e30a17", "#ffffff"),
  c("gr", "Greece", 240, 5, "#0d5eaf", "#ffffff"),
  c("pl", "Poland", 260, 5, "#dc143c", "#ffffff"),
  { kind: "parking", name: "Free Parking", icon: "\u{1F17F}\uFE0F" },
  c("mx", "Mexico", 280, 6, "#006847", "#ce1126"),
  c("co", "Colombia", 280, 6, "#fcd116", "#003893"),
  chance(),
  c("ar", "Argentina", 300, 7, "#74acdf", "#f6b40e"),
  c("cl", "Chile", 300, 7, "#d52b1e", "#0039a6"),
  c("br", "Brazil", 320, 7, "#009c3b", "#ffdf00"),
  c("ca", "Canada", 340, 8, "#d52b1e", "#ffffff"),
  c("au", "Australia", 340, 8, "#00008b", "#e4002b"),
  c("es", "Spain", 360, 8, "#aa151b", "#f1bf00"),
  { kind: "gotojail", name: "Go To Jail", icon: "\u{1F694}" },
  c("de", "Germany", 380, 9, "#dd0000", "#ffce00"),
  c("fr", "France", 380, 9, "#0055a4", "#ef4135"),
  chance(),
  c("it", "Italy", 400, 10, "#009246", "#ce2b37"),
  c("gb", "United Kingdom", 400, 10, "#012169", "#c8102e"),
  c("jp", "Japan", 420, 10, "#bc002d", "#ffffff"),
  c("cn", "China", 440, 11, "#de2910", "#ffde00"),
  c("us", "USA", 460, 11, "#3c3b6e", "#b22234"),
  c("ru", "Russia", 480, 11, "#0039a6", "#d52b1e")
];
var groupSquares = /* @__PURE__ */ __name((group3) => BOARD.flatMap((s, i) => s.kind === "country" && s.group === group3 ? [i] : []), "groupSquares");
var houseCost = /* @__PURE__ */ __name((index) => {
  const s = BOARD[index];
  return s.kind === "country" ? Math.max(10, Math.round(s.price / 20) * 10) : 0;
}, "houseCost");
var RENT_BY_LEVEL = [1, 5, 12, 22, 32, 45];
var PLAYER_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#94a3b8"
];
var freeColor = /* @__PURE__ */ __name((g) => PLAYER_COLORS.find((c2) => !g.players.some((p) => p.color === c2)) ?? PLAYER_COLORS[0], "freeColor");
var newGame = /* @__PURE__ */ __name((code) => ({
  code,
  phase: "lobby",
  settings: { ...DEFAULT_SETTINGS },
  hostId: null,
  players: [],
  owners: {},
  houses: {},
  pot: 0,
  turn: 0,
  round: 0,
  dice: null,
  canBuy: null,
  extraRoll: false,
  winnerId: null,
  turnDeadline: null,
  log: []
}), "newGame");
var say = /* @__PURE__ */ __name((g, msg) => {
  g.log.push(msg);
  if (g.log.length > 40) g.log.shift();
}, "say");
var alive = /* @__PURE__ */ __name((g) => g.players.filter((p) => !p.bankrupt), "alive");
var currentPlayer = /* @__PURE__ */ __name((g) => g.players[g.turn], "currentPlayer");
var byId = /* @__PURE__ */ __name((g, id) => g.players.find((p) => p.id === id), "byId");
var ownsGroup = /* @__PURE__ */ __name((g, playerId, group3) => groupSquares(group3).every((i) => g.owners[i] === playerId), "ownsGroup");
var level = /* @__PURE__ */ __name((g, i) => g.houses[i] ?? 0, "level");
var INFLATION_EVERY = 3;
var rentMultiplier = /* @__PURE__ */ __name((g) => g.settings.inflation ? 1.15 ** Math.floor(g.round / INFLATION_EVERY) : 1, "rentMultiplier");
function baseRent(index, lvl, monopoly) {
  const s = BOARD[index];
  if (s.kind !== "country") return 0;
  return lvl === 0 ? s.rent * (monopoly ? 2 : 1) : s.rent * RENT_BY_LEVEL[lvl];
}
__name(baseRent, "baseRent");
function rentFor(g, index) {
  const s = BOARD[index];
  const owner = g.owners[index];
  if (s.kind !== "country" || !owner) return 0;
  const mono = ownsGroup(g, owner, s.group);
  return Math.round(baseRent(index, mono ? level(g, index) : 0, mono) * rentMultiplier(g));
}
__name(rentFor, "rentFor");
function buildError(g, playerId, index) {
  const s = BOARD[index];
  if (!g.settings.buildings) return "Building is turned off in this room.";
  if (s?.kind !== "country") return "You can only build on countries.";
  if (g.owners[index] !== playerId) return "You don't own this country.";
  if (!ownsGroup(g, playerId, s.group)) return "You need every country in this color set first.";
  const lvl = level(g, index);
  if (lvl >= MAX_BUILD_LEVEL) return "Already has a hotel.";
  const min = Math.min(...groupSquares(s.group).map((i) => level(g, i)));
  if (lvl > min) return "Build evenly: upgrade your other countries in this set first.";
  const me = byId(g, playerId);
  if (me.money < houseCost(index)) return `You need $${houseCost(index)}.`;
  return null;
}
__name(buildError, "buildError");
function sellError(g, playerId, index) {
  const s = BOARD[index];
  if (s?.kind !== "country" || g.owners[index] !== playerId) return "You don't own this country.";
  const lvl = level(g, index);
  if (lvl < 1) return "Nothing to sell here.";
  const max = Math.max(...groupSquares(s.group).map((i) => level(g, i)));
  if (lvl < max) return "Sell evenly: downgrade the highest country in this set first.";
  return null;
}
__name(sellError, "sellError");
function pay(g, from, to, amount) {
  const toPot = !to && g.settings.freeParkingPot;
  if (from.money >= amount) {
    from.money -= amount;
    if (to) to.money += amount;
    else if (toPot) g.pot += amount;
    return;
  }
  if (to) to.money += from.money;
  from.money = 0;
  from.bankrupt = true;
  for (const [i, o] of Object.entries(g.owners)) {
    if (o === from.id) {
      delete g.owners[Number(i)];
      delete g.houses[Number(i)];
    }
  }
  say(g, `\u{1F4A5} ${from.name} can't pay $${amount} and is bankrupt!`);
}
__name(pay, "pay");
function checkWinner(g) {
  const left = alive(g);
  if (g.phase !== "lobby" && g.phase !== "over" && left.length === 1) {
    g.phase = "over";
    g.winnerId = left[0].id;
    g.canBuy = null;
    say(g, `\u{1F3C6} ${left[0].name} wins the game!`);
  }
}
__name(checkWinner, "checkWinner");
function moveTo(g, p, target, collectGo) {
  const salary = salaryFor(g);
  if (collectGo && salary > 0) {
    p.money += salary;
    say(g, `${p.name} passed Go and collected $${salary}${salary === g.settings.bonusSalary && salary !== g.settings.goSalary ? " (bonus salary!)" : ""}.`);
  }
  p.pos = target;
}
__name(moveTo, "moveTo");
function sendToJail(g, p) {
  p.pos = JAIL_INDEX;
  p.jailed = true;
  g.extraRoll = false;
}
__name(sendToJail, "sendToJail");
var REPAIR_COUNTRY = 15;
var REPAIR_HOUSE = 40;
var REPAIR_HOTEL = 50;
function repairBill(g, playerId) {
  let total = 0;
  for (const [i, o] of Object.entries(g.owners)) {
    if (o !== playerId) continue;
    const lvl = level(g, Number(i));
    total += REPAIR_COUNTRY + (lvl === MAX_BUILD_LEVEL ? REPAIR_HOTEL : lvl * REPAIR_HOUSE);
  }
  return total;
}
__name(repairBill, "repairBill");
var gain = /* @__PURE__ */ __name((amount, text) => (g, p) => {
  say(g, `\u2753 ${p.name}: ${text} Collect $${amount}.`);
  p.money += amount;
}, "gain");
var collectFromEach = /* @__PURE__ */ __name((amount, text) => (g, p) => {
  say(g, `\u2753 ${p.name}: ${text} Every player pays them $${amount}.`);
  for (const o of alive(g)) if (o.id !== p.id) pay(g, o, p, amount);
}, "collectFromEach");
var lose = /* @__PURE__ */ __name((amount, text) => (g, p) => {
  say(g, `\u2753 ${p.name}: ${text} Pay $${amount}.`);
  pay(g, p, null, amount);
}, "lose");
var CHANCE_DECK = [
  gain(150, "Tourism boom!"),
  gain(200, "You won the national lottery!"),
  gain(100, "Bank error in your favor."),
  gain(75, "Tax refund."),
  gain(250, "A distant relative left you an inheritance."),
  gain(120, "Your export business is booming."),
  collectFromEach(50, "It's your birthday!"),
  collectFromEach(30, "Charity gala: you are the guest of honor."),
  (g, p) => {
    say(g, `\u2753 ${p.name}: Advance to Go!`);
    moveTo(g, p, 0, true);
  },
  (g, p, rng) => {
    say(g, `\u2753 ${p.name}: Go back 3 squares.`);
    p.pos = (p.pos + BOARD.length - 3) % BOARD.length;
    landOn(g, p, rng, false);
  },
  (g, p) => {
    say(g, `\u2753 ${p.name}: Caught smuggling! Go to Jail.`);
    sendToJail(g, p);
  },
  lose(60, "Lost luggage."),
  lose(40, "Speeding fine."),
  (g, p) => {
    const bill = repairBill(g, p.id);
    if (bill === 0) say(g, `\u2753 ${p.name}: Property repairs, but you own nothing. Lucky!`);
    else {
      say(g, `\u2753 ${p.name}: Property repairs! $${REPAIR_COUNTRY}/country, $${REPAIR_HOUSE}/house, $${REPAIR_HOTEL}/hotel = $${bill}.`);
      pay(g, p, null, bill);
    }
  },
  (g, p) => {
    say(g, `\u2753 ${p.name}: Global tax day! Every player pays the bank $50.`);
    for (const o of alive(g)) pay(g, o, null, 50);
  }
];
function drawChance(g, p, rng) {
  CHANCE_DECK[Math.floor(rng() * CHANCE_DECK.length)](g, p, rng);
}
__name(drawChance, "drawChance");
function landOn(g, p, rng, allowChance = true) {
  const s = BOARD[p.pos];
  switch (s.kind) {
    case "gotojail":
      say(g, `\u{1F694} ${p.name} goes to Jail.`);
      sendToJail(g, p);
      break;
    case "parking":
      if (g.pot > 0) {
        say(g, `\u{1F17F}\uFE0F ${p.name} collects $${g.pot} from Free Parking!`);
        p.money += g.pot;
        g.pot = 0;
      }
      break;
    case "chance":
      if (allowChance) drawChance(g, p, rng);
      break;
    case "country": {
      const ownerId = g.owners[p.pos];
      if (!ownerId) {
        if (p.money >= s.price) g.canBuy = p.pos;
        else say(g, `${p.name} landed on ${s.name} but can't afford $${s.price}.`);
      } else if (ownerId !== p.id) {
        const owner = byId(g, ownerId);
        const rent = rentFor(g, p.pos);
        say(g, `${p.name} pays $${rent} rent to ${owner.name} for ${s.name}.`);
        pay(g, p, owner, rent);
      }
      break;
    }
    default:
      break;
  }
}
__name(landOn, "landOn");
function nextTurn(g) {
  g.canBuy = null;
  g.dice = null;
  g.extraRoll = false;
  const n = g.players.length;
  for (let i = 1; i <= n * 2; i++) {
    const p = g.players[(g.turn + i) % n];
    if (p.bankrupt) continue;
    if ((g.turn + i) % n <= g.turn) g.round++;
    g.turn = (g.turn + i) % n;
    if (p.jailed) {
      p.jailed = false;
      say(g, `\u{1F512} ${p.name} is released from Jail but skips this turn.`);
      continue;
    }
    g.phase = "roll";
    return;
  }
}
__name(nextTurn, "nextTurn");
function apply(g, playerId, a, rng = Math.random) {
  const err = applyInner(g, playerId, a, rng);
  if (!err && g.phase === "action" && currentPlayer(g).bankrupt) {
    checkWinner(g);
    if (!g.winnerId) nextTurn(g);
  }
  return err;
}
__name(apply, "apply");
function applyInner(g, playerId, a, rng) {
  const me = byId(g, playerId);
  if (a.type === "JOIN") {
    if (me) {
      me.connected = true;
      return null;
    }
    if (g.phase !== "lobby") return "Game already started.";
    if (g.players.length >= g.settings.maxPlayers) return "Room is full.";
    const name = a.name.trim().slice(0, 16) || "Player";
    g.players.push({
      id: playerId,
      name,
      color: freeColor(g),
      money: g.settings.startMoney,
      pos: 0,
      jailed: false,
      bankrupt: false,
      connected: true,
      isBot: false
    });
    g.hostId ??= playerId;
    say(g, `${name} joined.`);
    return null;
  }
  if (!me) return "You are not in this game.";
  const myTurn = g.phase !== "lobby" && g.phase !== "over" && currentPlayer(g).id === playerId && !me.bankrupt;
  switch (a.type) {
    case "SET_PROFILE": {
      if (g.phase !== "lobby") return "You can only change this before the game starts.";
      if (a.name !== void 0) {
        const name = String(a.name).trim().slice(0, 16);
        if (!name) return "Name can't be empty.";
        me.name = name;
      }
      if (a.color !== void 0) {
        if (!PLAYER_COLORS.includes(a.color)) return "Unknown color.";
        if (g.players.some((p) => p.id !== me.id && p.color === a.color)) return "That color is taken.";
        me.color = a.color;
      }
      return null;
    }
    case "SET_SETTINGS": {
      if (g.phase !== "lobby") return "Settings are locked once the game starts.";
      if (g.hostId !== playerId) return "Only the host can change settings.";
      const next = mergeSettings(g.settings, a.settings);
      if (typeof next === "string") return next;
      if (next.maxPlayers < g.players.length) return "Too many players already joined for that limit.";
      g.settings = next;
      return null;
    }
    case "ADD_BOT": {
      if (g.phase !== "lobby") return "Game already started.";
      if (g.hostId !== playerId) return "Only the host can add bots.";
      if (g.players.length >= g.settings.maxPlayers) return "Room is full.";
      const n = g.players.filter((p) => p.isBot).length + 1;
      g.players.push({
        id: `bot-${n}-${Math.floor(rng() * 1e6)}`,
        name: `Bot ${n}`,
        color: freeColor(g),
        money: g.settings.startMoney,
        pos: 0,
        jailed: false,
        bankrupt: false,
        connected: true,
        isBot: true
      });
      return null;
    }
    case "START":
      if (g.phase !== "lobby") return "Game already started.";
      if (g.hostId !== playerId) return "Only the host can start.";
      if (g.players.length < MIN_PLAYERS) return "Need at least 2 players (add a bot!).";
      for (const p of g.players) p.money = g.settings.startMoney;
      g.phase = "roll";
      g.turn = 0;
      say(g, "\u{1F3B2} Game started!");
      return null;
    case "ROLL": {
      if (g.phase !== "roll") return "You can't roll now.";
      if (!myTurn) return "Not your turn.";
      const d1 = 1 + Math.floor(rng() * 6), d2 = 1 + Math.floor(rng() * 6);
      g.dice = [d1, d2];
      const doubles = d1 === d2 && g.settings.doublesRoll;
      say(g, `${me.name} rolled ${d1} + ${d2}${doubles ? " (doubles!)" : ""}.`);
      g.extraRoll = doubles;
      const raw = me.pos + d1 + d2;
      moveTo(g, me, raw % BOARD.length, raw >= BOARD.length);
      landOn(g, me, rng);
      g.phase = "action";
      checkWinner(g);
      return null;
    }
    case "BUY": {
      if (g.phase !== "action" || g.canBuy === null) return "Nothing to buy.";
      if (!myTurn) return "Not your turn.";
      const s = BOARD[g.canBuy];
      if (s.kind !== "country" || me.money < s.price) return "Can't afford that.";
      me.money -= s.price;
      g.owners[g.canBuy] = me.id;
      say(g, `${me.name} bought ${s.name} for $${s.price}.`);
      g.canBuy = null;
      return null;
    }
    case "BUILD": {
      if (!myTurn) return "You can only build on your own turn.";
      const idx = Number(a.square);
      const err = buildError(g, playerId, idx);
      if (err) return err;
      me.money -= houseCost(idx);
      g.houses[idx] = level(g, idx) + 1;
      say(g, `\u{1F3D7}\uFE0F ${me.name} built a ${g.houses[idx] === MAX_BUILD_LEVEL ? "hotel" : "house"} in ${BOARD[idx].name}.`);
      return null;
    }
    case "SELL": {
      if (!myTurn) return "You can only sell on your own turn.";
      const idx = Number(a.square);
      const err = sellError(g, playerId, idx);
      if (err) return err;
      g.houses[idx] = level(g, idx) - 1;
      if (g.houses[idx] === 0) delete g.houses[idx];
      me.money += Math.floor(houseCost(idx) / 2);
      say(g, `${me.name} sold a building in ${BOARD[idx].name}.`);
      return null;
    }
    case "END_TURN": {
      if (g.phase !== "action") return "Roll first.";
      if (!myTurn) return "Not your turn.";
      if (g.extraRoll && !me.jailed) {
        g.canBuy = null;
        g.dice = null;
        g.extraRoll = false;
        g.phase = "roll";
        say(g, `${me.name} rolls again.`);
      } else nextTurn(g);
      return null;
    }
  }
}
__name(applyInner, "applyInner");
function botAction(g, force = false) {
  const p = currentPlayer(g);
  if (!p || p.bankrupt || !(force || p.isBot || !p.connected)) return null;
  if (g.phase === "roll") return { type: "ROLL" };
  if (g.phase === "action") {
    if (g.canBuy !== null) {
      const s = BOARD[g.canBuy];
      if (s.kind === "country" && p.money - s.price >= 150) return { type: "BUY" };
    }
    for (let i = 0; i < BOARD.length; i++) {
      if (g.owners[i] === p.id && houseCost(i) > 0 && p.money - houseCost(i) >= 250 && !buildError(g, p.id, i)) {
        return { type: "BUILD", square: i };
      }
    }
    return { type: "END_TURN" };
  }
  return null;
}
__name(botAction, "botAction");

// party/index.ts
var VALID_ACTIONS = /* @__PURE__ */ new Set([
  "SET_PROFILE",
  "SET_SETTINGS",
  "ADD_BOT",
  "START",
  "ROLL",
  "BUY",
  "BUILD",
  "SELL",
  "END_TURN"
]);
var MAX_MSG_BYTES = 2048;
var MAX_MSGS_PER_SEC = 20;
var GameServer = class extends Server {
  static {
    __name(this, "GameServer");
  }
  game = newGame("");
  tokens = /* @__PURE__ */ new Map();
  // secret client token -> public player id
  conns = /* @__PURE__ */ new Map();
  // connection id -> public player id
  rate = /* @__PURE__ */ new Map();
  timer = null;
  turnKey = "";
  /** Restore the game after a restart so players don't lose their match. */
  async onStart() {
    this.game = newGame(this.name);
    try {
      const saved = await this.ctx.storage.get("state");
      if (saved?.game) {
        this.game = saved.game;
        this.tokens = new Map(saved.tokens);
        for (const p of this.game.players) if (!p.isBot) p.connected = false;
      }
    } catch (e) {
      console.error("failed to restore state", e);
    }
  }
  onConnect(conn) {
    conn.send(JSON.stringify({ type: "STATE", state: this.game }));
    this.scheduleAuto();
  }
  onMessage(sender, raw) {
    try {
      this.handle(raw, sender);
    } catch (e) {
      console.error("message error", e);
      sender.send(JSON.stringify({ type: "ERROR", message: "Something went wrong." }));
    }
  }
  handle(raw, sender) {
    if (typeof raw !== "string" || raw.length > MAX_MSG_BYTES) return;
    const sec = Math.floor(Date.now() / 1e3);
    const r = this.rate.get(sender.id);
    if (!r || r.sec !== sec) this.rate.set(sender.id, { sec, n: 1 });
    else if (++r.n > MAX_MSGS_PER_SEC) return;
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object") return;
    let error3 = null;
    if (msg.type === "JOIN") {
      const token = String(msg.token ?? "").slice(0, 64);
      if (!token) return;
      let id = this.tokens.get(token);
      const isNew = !id;
      id ??= crypto.randomUUID().slice(0, 8);
      error3 = apply(this.game, id, { type: "JOIN", name: String(msg.name ?? "") });
      if (!error3) {
        if (isNew) this.tokens.set(token, id);
        this.conns.set(sender.id, id);
        sender.send(JSON.stringify({ type: "YOU", id }));
      }
    } else if (msg.type === "ACTION" && VALID_ACTIONS.has(msg.action?.type)) {
      const id = this.conns.get(sender.id);
      error3 = id ? apply(this.game, id, msg.action) : "Join the room first.";
    } else return;
    if (error3) sender.send(JSON.stringify({ type: "ERROR", message: error3 }));
    this.broadcastState();
  }
  onClose(conn) {
    this.rate.delete(conn.id);
    const id = this.conns.get(conn.id);
    this.conns.delete(conn.id);
    if (!id) return;
    if ([...this.conns.values()].includes(id)) return;
    const g = this.game;
    const p = g.players.find((x) => x.id === id);
    if (!p) return;
    if (g.phase === "lobby") {
      g.players = g.players.filter((x) => x.id !== id);
      if (g.hostId === id) g.hostId = g.players.find((x) => !x.isBot)?.id ?? null;
    } else {
      p.connected = false;
    }
    this.broadcastState();
  }
  onError(_conn, err) {
    console.error("connection error", err);
  }
  broadcastState() {
    this.updateDeadline();
    this.broadcast(JSON.stringify({ type: "STATE", state: this.game }));
    this.ctx.storage.put("state", { game: this.game, tokens: [...this.tokens] }).catch((e) => console.error("persist failed", e));
    this.scheduleAuto();
  }
  /** Start a fresh turn timer whenever the turn/phase moves on. */
  updateDeadline() {
    const g = this.game;
    const inGame = g.phase === "roll" || g.phase === "action";
    if (!inGame || g.settings.turnTimer <= 0) {
      g.turnDeadline = null;
      this.turnKey = "";
      return;
    }
    const key = `${g.phase}:${g.turn}:${g.round}:${g.dice}:${g.canBuy}`;
    if (key !== this.turnKey || g.turnDeadline === null) {
      this.turnKey = key;
      g.turnDeadline = Date.now() + g.settings.turnTimer * 1e3;
    }
  }
  hasPlayersOnline() {
    for (const _ of this.getConnections()) return true;
    return false;
  }
  /** Bots, offline players and idle players (turn timer) are played by the server. */
  scheduleAuto() {
    const g = this.game;
    if (this.timer || g.phase !== "roll" && g.phase !== "action" || !this.hasPlayersOnline()) return;
    const cur = currentPlayer(g);
    if (!cur) return;
    let delay = null;
    if (botAction(g)) delay = cur.isBot ? 1e3 : 8e3;
    else if (g.turnDeadline) delay = Math.max(0, g.turnDeadline - Date.now()) + 50;
    if (delay === null) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const now = this.game;
      const p = currentPlayer(now);
      const idle = !!now.turnDeadline && Date.now() >= now.turnDeadline;
      const a = p && (idle ? botAction(now, true) : botAction(now));
      if (a) {
        if (idle && !p.isBot && p.connected) {
          this.broadcast(JSON.stringify({ type: "NOTICE", message: `${p.name} ran out of time.` }));
        }
        apply(now, p.id, a);
      }
      this.broadcastState();
    }, delay);
  }
};
var party_default = {
  async fetch(request, env3) {
    return await routePartykitRequest(request, env3) || new Response("Countries Monopoly game server", { status: 200 });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env3, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env3);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env3, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env3);
  } catch (e) {
    const error3 = reduceError(e);
    const body = JSON.stringify(error3);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-lRTwph/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = party_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env3, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env3, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env3, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env3, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-lRTwph/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env3, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env3, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env3, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env3, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env3, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env3, ctx) => {
      this.env = env3;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  GameServer,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
