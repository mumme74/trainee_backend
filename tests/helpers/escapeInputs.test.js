"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escapeInputs_1 = require("../../src/helpers/escapeInputs");
describe("don't escape", () => {
    test("clean string", () => {
        expect((0, escapeInputs_1.escapeHTML)("dont touch me!")).toEqual("dont touch me!");
    });
    test("test &amp;", () => {
        expect((0, escapeInputs_1.escapeHTML)("Me &amp;")).toEqual("Me &amp;");
    });
    test("test &gt;", () => {
        expect((0, escapeInputs_1.escapeHTML)("this &gt;")).toEqual("this &gt;");
    });
    test("test &quot;", () => {
        expect((0, escapeInputs_1.escapeHTML)("&quot;you&quot;")).toEqual("&quot;you&quot;");
    });
    test("test &lt;", () => {
        expect((0, escapeInputs_1.escapeHTML)("1 &lt; 2")).toEqual("1 &lt; 2");
    });
    test("test &#39;", () => {
        expect((0, escapeInputs_1.escapeHTML)("&#39;name&#39;")).toEqual("&#39;name&#39;");
    });
});
describe("escape", () => {
    test("clean string", () => {
        expect((0, escapeInputs_1.escapeHTML)("Hello world")).toEqual("Hello world");
    });
    test("test &amp;", () => {
        expect((0, escapeInputs_1.escapeHTML)("test &")).toEqual("test &amp;");
    });
    test("test &gt;", () => {
        expect((0, escapeInputs_1.escapeHTML)("test >")).toEqual("test &gt;");
    });
    test("test &quot;", () => {
        expect((0, escapeInputs_1.escapeHTML)('"test "')).toEqual("&quot;test &quot;");
    });
    test("test &lt;", () => {
        expect((0, escapeInputs_1.escapeHTML)("test <")).toEqual("test &lt;");
    });
    test("test &#39;", () => {
        expect((0, escapeInputs_1.escapeHTML)("' test '")).toEqual("&#39; test &#39;");
    });
});
//# sourceMappingURL=escapeInputs.test.js.map