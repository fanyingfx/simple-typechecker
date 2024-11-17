const Type = require('../src/Type');
const {test} = require('./test-util');

module.exports = eva => {
    test(eva,['var','x',10],Type.number);
    test(eva,['var',['y','number'],'x'],Type.number);
    test(eva,'x',Type.number)
    test(eva,'y',Type.number)
    test(eva,'VERSION',Type.string);

}