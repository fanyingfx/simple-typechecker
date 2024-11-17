
const Type = require('../src/Type');
const {test} = require('./test-util');

module.exports = eva => {
  test(eva,
    `
    (def square ((x number)) -> number (* x x))
    (square 2)
    `,Type.number
  );
  test(eva,
    `
    (def calc ((x number) (y number)) -> number 
    (begin
        (var z 30)
        (+ (* x y) z)
        ))
    (calc 10 20)
    `,Type.number
  )
}