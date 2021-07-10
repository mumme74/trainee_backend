type HtmlEscChars = {[key: string]: string}

const htmlEscChars: HtmlEscChars = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
};
const htmlEscKeys = Object.keys(htmlEscChars);
const htmlEscRegex = new RegExp(htmlEscKeys.join(), "g");

export const escapeHTML = (str: string) => {
  return str.replace(htmlEscRegex,  (tag: string) => 
    htmlEscChars[tag]
  )
};


