const EvaTC = require('../src/EvaTC');
const tests = [
    require('./self-eval-test.js'),
    require('./math-test.js'),
    require('./variable-test.js'),
    require('./block-test.js'),
    require('./if-test.js'),
    require('./while-test.js')
];

// tests.forEach(test=>test(eva));
for(const test of tests){
    const eva = new EvaTC();
    test(eva)
}


console.log('All assertions passed!');