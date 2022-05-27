const assert = require('assert')


function sum (a , b) {
    return a+b;
}

describe("testing example" , ()=> {
    it ("this should be 5" , done => {
        let result = sum(3 , 2);
        assert.strictEqual(result , 5);
        done();
    })
})