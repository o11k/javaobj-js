type ClassDesc = {}


class ObjectStreamException extends Error {}
class StreamCorruptedException extends ObjectStreamException {}
class EOFException extends ObjectStreamException {}  // Not the same hierarchy as Java

class ObjectInputStream {
    private data: Uint8Array;
    private offset: number;

    constructor(data: Uint8Array) {
        this.data = data;
        this.offset = 0;
    }

    eof(): boolean {
        return this.offset === this.data.byteLength;
    }

    read(): number
    read(length: number): Uint8Array
    read(length?: number): number | Uint8Array {
        if (length === undefined) {
            if (this.eof()) return -1;
            return this.read(1)[0];
        }

        length = Math.min(length, this.data.byteLength-this.offset);
        const result = this.data.slice(this.offset, this.offset + length);
        this.offset += length;
        return result
    }

    readFully(length: number): Uint8Array {
        const result = this.read(length);
        if (result.byteLength < length) {
            throw new EOFException();
        }
        return result;
    }

    skipBytes(length: number): void {
        this.read(length);
    }

    private peekByte(): number {
        if (this.eof()) throw new EOFException();
        return this.data[this.offset];
    }

    readBoolean(): boolean {}

    readByte(): number {}

    readUnsignedByte(): number {}

    readChar(): number {}

    readShort(): number {}

    readUnsignedShort(): number {}

    readInt(): number {}

    readLong(): bigint {}

    readFloat(): number {}

    readDouble(): number {}

    readUtf(): string {}

    readObject(): any {}

    registerHandler<T, S>(className: string, handler: (ois: ObjectInputStream, initial: S, classDesc: ClassDesc) => T, initializer: () => S): void;
    registerHandler<T>(className: string, handler: (ois: ObjectInputStream, initial: {}, classDesc: ClassDesc) => T): void;
    registerHandler<T, S>(className: string, handler: (ois: ObjectInputStream, initial: S, classDesc: ClassDesc) => T, initializer?: () => S): void {

    }
}
