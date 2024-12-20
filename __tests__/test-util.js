const assert = require('assert');
const evaParser = require('../parser/evaParser');
function exec(eva, exp) {
    // console.log('exec-exp',exp);
    if (typeof exp === 'string'){
        exp = evaParser.parse(`(begin ${exp})`);
        // console.log('exec-exp',exp);
    }
    // console.log(eva);
    return eva.tcGlobal(exp);
}
function test(eva, exp, expected) {
    const actual = exec(eva, exp);
    try {
        assert.strictEqual(actual.equals(expected), true);
    } catch (e) {
        console.log(`Expected ${expected} type for ${exp}, but got ${actual}.`);
        throw e;
    }
}
module.exports = {
    exec, test
}