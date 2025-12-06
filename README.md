# javaobj-js
ObjectInputStream for JavaScript. Equivalent to Python's javaobj-py3.

## Limitations

This library first parses the entire object stream deterministically (without invoking `readObject` and `readExternal`),
and only then lets users start receiving data from it. This has several implications:

- `Externalizable` objects from `PROTOCOL_VERSION_1` (JDK 1.1 and earlier, 1998) are not supported.
- `Serializable` objects with a `writeObject` method must call `writeFields` or `defaultWriteObject` before writing anything else to the stream.
  This is technically required by the spec, but the standard library doesn't enforce it.
