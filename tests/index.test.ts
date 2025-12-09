/// <reference types="jest" />
/// <reference types="node" />

import fs from 'node:fs';

import {JAVAOBJ_SYMBOL, ObjectInputStream} from '../src/index';

describe("example", () => {
    test("symbol name", () => {
        expect(JAVAOBJ_SYMBOL.toString()).toBe("Symbol(javaobj)");
    })
})

test("read primitives", () => {
    console.log(process.cwd());
    const streamBytes = new Uint8Array(fs.readFileSync("tests/tmp/serialized.ser"));
    const ois = new ObjectInputStream(streamBytes);

    const methods = Object.freeze({
        B: ois.readByte.bind(ois),
        C: ois.readChar.bind(ois),
        D: ois.readDouble.bind(ois),
        F: ois.readFloat.bind(ois),
        I: ois.readInt.bind(ois),
        J: ois.readLong.bind(ois),
        S: ois.readShort.bind(ois),
        Z: ois.readBoolean.bind(ois),
    } as const)

    const expectedFile = new Uint8Array(fs.readFileSync("tests/tmp/expected.txt"))
    const expectedLines = splitUint8Array(expectedFile, "\n".charCodeAt(0));
    for (let i=0; i<expectedLines.length; i++) {
        const expectedLine = expectedLines[i];

        // Read from stream based on typecode
        const typecode = new TextDecoder().decode(new Uint8Array([expectedLine[0]]));
        if (!(typecode in methods)) throw new Error("Unknwon typecode: " + typecode);
        const method = methods[typecode as keyof typeof methods];
        const found = method();

        // Read expected value from file
        const expectedString = new TextDecoder().decode(expectedLine.subarray(1));
        let expected = eval(typecode === "J" ? expectedString+"n" : expectedString);
        if (typecode === "C") expected = String.fromCharCode(expected);

        // We can even expect floats and doubles to be exactly the same, since they are written exactly to stream
        expect(found).toBe(expected);
    }
})

function splitUint8Array(arr: Uint8Array, delimiter: number): Uint8Array[] {
  const result = [];
  let start = 0;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === delimiter) {
      result.push(arr.subarray(start, i));
      start = i + 1;
    }
  }

  // Push remaining part
  if (start < arr.length) {
    result.push(arr.subarray(start));
  }

  return result;
}