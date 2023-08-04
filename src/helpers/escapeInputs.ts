type HtmlEscChars = { [key: string]: string };

const htmlEscChars: HtmlEscChars = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
};
// need to special case & because it can be a start of a already escaped entity
const htmlEscKeys = Object.keys(htmlEscChars).map((key) =>
  key === "&" ? "&(?![#\\w]\\w{1,5};)" : key,
);
const htmlEscRegex = new RegExp(`(${htmlEscKeys.join("|")})`, "g");

export const escapeHTML = (str: string) => {
  return str.replace(htmlEscRegex, (tag: string) => htmlEscChars[tag[0]]);
};
