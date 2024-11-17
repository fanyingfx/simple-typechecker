const Type = require('../src/Type');
const {test} = require('./test-util');

module.exports = eva => {
    test(eva,['+',2,3],Type.number);
    test(eva,['-',2,3],Type.number);
    test(eva,['*',2,3],Type.number);
    test(eva,['/',2,3],Type.number);

    test(eva,['+','"Hello, "','"world!"'],Type.string);
}
