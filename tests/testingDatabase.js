"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeMemoryDb = exports.initMemoryDb = void 0;
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
require("./testProcess.env");
let mongod;
let connections = 0;
async function initMemoryDb() {
    if (connections++ === 0) {
        // This will create an new instance of "MongoMemoryServer" and automatically start it
        mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
        const uri = mongod.getUri();
        //connect to DB
        await mongoose_1.default.connect(uri, {});
    }
}
exports.initMemoryDb = initMemoryDb;
async function closeMemoryDb() {
    if (--connections === 0) {
        await mongoose_1.default.disconnect();
        return await mongod.stop();
    }
}
exports.closeMemoryDb = closeMemoryDb;
//# sourceMappingURL=testingDatabase.js.map