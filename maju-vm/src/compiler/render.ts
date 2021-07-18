export function renderValue(value: string, data: Object) {
  return new Function('', `with (this) { return ${value} }`).call(data);
}

export function renderTemplate(str: string, data: any) {
  const re = /\{\{([^}]+)?\}\}/g;
  const matched = str.match(re);
  if (matched) {
    return str.replace(re, ($0: any, $1: string) => renderValue($1, data));
  }
  return str;
}

export function renderList(source: Array<any>, renderItem: Function) {

}