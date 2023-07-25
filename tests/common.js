"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwErr = void 0;
// only used to get a stacktrace
function throwErr(err) {
    try {
        throw err;
    }
    catch (e) {
        return e;
    }
}
exports.throwErr = throwErr;
//# sourceMappingURL=common.js.map