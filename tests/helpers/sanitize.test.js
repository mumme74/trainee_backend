"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sanitize_1 = require("../../src/helpers/sanitize");
describe("test xss findStrings", () => {
    test("string no change", () => {
        // we goe around JSON here to provide a simple deepcopy
        const data = JSON.stringify({
            body: {
                str: 'this is <p>a simple </p> string <img src="https://domain.com/picture.png" />',
                sub: {
                    sub: {
                        str: "This is a nested string in a object",
                    },
                },
                arr: [["a nested array"], 1, "a simple string"],
            },
        });
        const res = (0, sanitize_1.findStrings)(JSON.parse(data));
        expect(res).toEqual(JSON.parse(data));
    });
    test("string whick should be escaped", () => {
        // we goe around JSON here to provide a simple deepcopy
        const data = JSON.stringify({
            body: {
                img: "This <img src=\"javascript:alert('xss')\"/>",
                script: "<script>alert('xss')</script>",
                onclick: '<a href="/" onclick="javascript:alert(\'xss\')">link</a>',
            },
        });
        const correctRes = {
            body: {
                img: "This <img src />",
                script: "&lt;script&gt;alert('xss')&lt;/script&gt;",
                onclick: '<a href="/">link</a>',
            },
        };
        const res = (0, sanitize_1.findStrings)(JSON.parse(data));
        expect(res).toEqual(correctRes);
    });
});
//# sourceMappingURL=sanitize.test.js.map