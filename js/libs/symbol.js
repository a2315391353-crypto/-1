/* Symbol polyfill placeholder */
if (typeof Symbol === 'undefined') {
  function Symbol(description) {
    return '__symbol_' + (description || '') + '_' + Math.random().toString(16).slice(2);
  }
  Symbol.iterator = Symbol('Symbol.iterator');
  global.Symbol = Symbol;
}
