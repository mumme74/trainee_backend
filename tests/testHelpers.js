"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareUser = exports.userPrimaryObj = exports.signToken = exports.JsonReq = exports.matchError = exports.matchErrorMockCall = exports.matchErrorSupertest = exports.jsonApp = void 0;
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const usersModel_1 = require("../src/models/old_mongo/usersModel");
function jsonApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.finalize = () => {
        app.use((req, res, next) => {
            //console.log(`404 not found ${req.path}`);
            res.status(404).json({
                success: false,
                error: { message: `Not found ${req.path}` },
            });
        });
        app.use((err, req, res, next) => {
            const errObj = {
                success: false,
                error: {
                    message: "500: Internal Server Error",
                    status: 500,
                    error: { message: err.message, stack: err.stack?.split("\n") },
                },
            };
            console.log(err);
            res.status(500).json(errObj);
        });
    };
    return app;
}
exports.jsonApp = jsonApp;
function matchErrorSupertest(res, errMsg) {
    matchError(JSON.parse(res.text), errMsg);
}
exports.matchErrorSupertest = matchErrorSupertest;
function matchErrorMockCall(res, errMsg) {
    const response = res.json.mock.calls[0][0];
    matchError(response, errMsg);
}
exports.matchErrorMockCall = matchErrorMockCall;
function matchError(response, errMsg) {
    expect(response.success).toEqual(false);
    expect(response.error.message.substr(0, errMsg.length)).toEqual(errMsg);
}
exports.matchError = matchError;
class JsonReq {
    constructor(app, basePath, headers = [["Accept", "application/json"]], contentTypeMatcher) {
        this.token = "";
        this.contentTypeMatcher = /application\/json/;
        this.app = app;
        this.basePath = basePath;
        this.headers = headers || [];
        if (contentTypeMatcher) {
            this.contentTypeMatcher = contentTypeMatcher;
        }
    }
    setToken(token) {
        this.token = token;
    }
    setHeaders(req) {
        req.set("Accept", "application/json");
        this.headers.forEach((header) => {
            req.set(header[0], header[1]);
        });
        if (this.token)
            req.set("Authorization", this.token);
        return req;
    }
    post(postObj, path) {
        const req = (0, supertest_1.default)(this.app).post(this.basePath + (path || ""));
        return this.setHeaders(req)
            .send(postObj)
            .expect("Content-Type", this.contentTypeMatcher);
    }
    get(path) {
        const req = (0, supertest_1.default)(this.app).get(this.basePath + (path || ""));
        return this.setHeaders(req)
            .send()
            .expect("Content-Type", this.contentTypeMatcher);
    }
}
exports.JsonReq = JsonReq;
function signToken({ userId, expiresInMinutes = 60 * 8, notBefore = 0, // in seconds
roles, }) {
    return jsonwebtoken_1.default.sign({
        iss: process.env.APP_NAME,
        sub: userId,
        nbf: Math.floor(new Date().getTime() / 1000) + notBefore,
        iat: Math.floor(new Date().getTime() / 1000),
        exp: Math.floor(new Date(new Date().getTime() + expiresInMinutes * 60000).getTime() /
            1000),
        roles,
    }, process.env.JWT_SECRET + "");
}
exports.signToken = signToken;
exports.userPrimaryObj = {
    firstName: "Test",
    lastName: "Testson",
    userName: "tester",
    method: "google",
    password: "SecretPass1$",
    email: "user@testing.com",
    google: { id: "123456789abc" },
    domain: "testing.com",
    picture: "https://somedomain.com/path/to/image.png",
    roles: [usersModel_1.eRolesAvailable.student],
    updatedBy: "123456789abc",
};
function compareUser(user, userSaved, compareId = true) {
    if (compareId) {
        expect(user.id.toString()).toEqual(userSaved.id.toString());
    }
    if (user.updatedBy && userSaved.updatedBy) {
        expect(user.updatedBy.toString()).toEqual(userSaved.updatedBy.toString());
    }
    expect(user).toMatchObject({
        method: userSaved.method,
        userName: userSaved.userName,
        email: userSaved.email,
        firstName: userSaved.firstName,
        lastName: userSaved.lastName,
        domain: userSaved.domain,
        createdAt: userSaved.createdAt,
        updatedAt: userSaved.updatedAt,
    });
}
exports.compareUser = compareUser;
//# sourceMappingURL=testHelpers.js.map