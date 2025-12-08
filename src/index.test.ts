import {JAVAOBJ_SYMBOL} from './index';

describe("example", () => {
    test("symbol name", () => {
        expect(JAVAOBJ_SYMBOL.toString()).toBe("Symbol(javaobj)");
    })
})
