# object-input-stream

Java's ObjectInputStream for JavaScript.

Read Java serialized objects in Node and the browser.

## Limitations

The following features are not implemented. If you need them, please open an issue / PR.

- Strings longer than Number.MAX_SAFE_INTEGER (2**53 - 1) bytes

## TODO

- [ ] all tests
- [X] ensure eof is always handled
- [ ] when reading a primitive and next content is an object, make sure it doesn't read it (add to tests)
- [X] better enum handling
- [ ] test and/or improve classDesc and class handling
- [X] handle proxy classes
- [X] handle exceptions
- [ ] emit AST
- [X] error when unmatching serialVersionUID
- [X] PROTOCOL_VERSION_1 externalizables
