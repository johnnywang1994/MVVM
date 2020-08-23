function replaceString(data) {
  return function(raw, content) {
    return `" + (() => ${content.trim()})() + "`;
  };
}

function renderText(str, data) {
  str = String(str);
  const t = function(str){
    str = str.replace(/\{\{\s*([^\}]+)?\s*\}\}/g, replaceString(data));
    return new Function('', 'return "'+ str +'";').bind(data);
  };
  const r = t(str);
  return computed(r);
}

function renderAttr(str, data) {
  str = String(str);
  const t = function(str) {
    str = `(() => ${str})()`;
    return new Function('', `return ${str};`).bind(data);
  };
  const r = t(str);
  return computed(r);
}