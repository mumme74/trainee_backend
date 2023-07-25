import { escapeHTML } from "../../src/helpers/escapeInputs";

describe("don't escape", () => {
  test("clean string", () => {
    expect(escapeHTML("dont touch me!")).toEqual("dont touch me!");
  });
  test("test &amp;", () => {
    expect(escapeHTML("Me &amp;")).toEqual("Me &amp;");
  });
  test("test &gt;", () => {
    expect(escapeHTML("this &gt;")).toEqual("this &gt;");
  });
  test("test &quot;", () => {
    expect(escapeHTML("&quot;you&quot;")).toEqual("&quot;you&quot;");
  });
  test("test &lt;", () => {
    expect(escapeHTML("1 &lt; 2")).toEqual("1 &lt; 2");
  });
  test("test &#39;", () => {
    expect(escapeHTML("&#39;name&#39;")).toEqual("&#39;name&#39;");
  });
});

describe("escape", () => {
  test("clean string", () => {
    expect(escapeHTML("Hello world")).toEqual("Hello world");
  });
  test("test &amp;", () => {
    expect(escapeHTML("test &")).toEqual("test &amp;");
  });
  test("test &gt;", () => {
    expect(escapeHTML("test >")).toEqual("test &gt;");
  });
  test("test &quot;", () => {
    expect(escapeHTML('"test "')).toEqual("&quot;test &quot;");
  });
  test("test &lt;", () => {
    expect(escapeHTML("test <")).toEqual("test &lt;");
  });
  test("test &#39;", () => {
    expect(escapeHTML("' test '")).toEqual("&#39; test &#39;");
  });
});
