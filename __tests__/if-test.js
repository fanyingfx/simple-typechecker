const Type = require('../src/Type');
const {test} = require('./test-util');

module.exports = eva => {
    test(eva,`(<= 1 10)`,Type.boolean);
    test(eva,
        `
        (var x 10)
        (var y 20)
        (if (<= x 10) 
            (set y 1)
            (set y 2))
        y
        `,
        Type.number
    );
}