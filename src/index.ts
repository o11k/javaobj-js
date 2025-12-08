const STREAM_MAGIC      = 0xaced;
const STREAM_VERSION    = 5;

const TC_NULL           = 0x70;
const TC_REFERENCE      = 0x71;
const TC_CLASSDESC      = 0x72;
const TC_OBJECT         = 0x73;
const TC_STRING         = 0x74;
const TC_ARRAY          = 0x75;
const TC_CLASS          = 0x76;
const TC_BLOCKDATA      = 0x77;
const TC_ENDBLOCKDATA   = 0x78;
const TC_RESET          = 0x79;
const TC_BLOCKDATALONG  = 0x7A;
const TC_EXCEPTION      = 0x7B;
const TC_LONGSTRING     = 0x7C;
const TC_PROXYCLASSDESC = 0x7D;
const TC_ENUM           = 0x7E;

const baseWireHandle    = 0x7E0000;

const SC_WRITE_METHOD   = 0x01;  // if SC_SERIALIZABLE
const SC_BLOCK_DATA     = 0x08;  // if SC_EXTERNALIZABLE
const SC_SERIALIZABLE   = 0x02;
const SC_EXTERNALIZABLE = 0x04;
const SC_ENUM           = 0x10;


class JavaException extends Error {}
class IOException extends JavaException {}
class ObjectStreamException extends IOException {}
class StreamCorruptedException extends ObjectStreamException {}
class EOFException extends IOException {}
class UTFDataFormatException extends IOException {}
class RuntimeException extends JavaException {}
class IllegalStateException extends RuntimeException {}
class IndexOutOfBoundsException extends RuntimeException {}
class OptionalDataException extends ObjectStreamException {}

class NotImplementedError extends Error {}  // TODO remove before publishing

// Note: interface and class definitions are slightly different to Java

abstract class ByteInput {
    abstract read1(): number;

    read(len: number): Uint8Array {
        len = Math.max(len, 0);
        const result = new Uint8Array(len);
        let i = 0;
        while (i < len) {
            const c = this.read1();
            if (c < 0) break;
            result[i++] = c;
        }
        return result.slice(0, i);
    }

    readFully(len: number): Uint8Array {
        const result = this.read(len);
        if (result.length < len) {
            throw new EOFException()
        }
        return result;
    }
}

abstract class PrimitiveInput extends ByteInput {
    readBoolean(): boolean {
        return ByteArray.getBoolean(this.readFully(1));
    }

    readByte(): number {
        return ByteArray.getByte(this.readFully(1));
    }

    readUnsignedByte(): number {
        return ByteArray.getUnsignedByte(this.readFully(1));
    }

    readChar(): string {
        return ByteArray.getChar(this.readFully(2));
    }

    readShort(): number {
        return ByteArray.getShort(this.readFully(2));
    }

    readUnsignedShort(): number {
        return ByteArray.getUnsignedShort(this.readFully(2));
    }

    readInt(): number {
        return ByteArray.getInt(this.readFully(4));
    }

    readLong(): bigint {
        return ByteArray.getLong(this.readFully(8));
    }

    readFloat(): number {
        return ByteArray.getFloat(this.readFully(4));
    }

    readDouble(): number {
        return ByteArray.getDouble(this.readFully(8));
    }

    readUTF(): string {
        return this.readUTFBody(this.readUnsignedShort());
    }

    readLongUTF(): string {
        const length = this.readLong();
        if (length > Number.MAX_SAFE_INTEGER) {
            throw new NotImplementedError(`string longer than ${Number.MAX_SAFE_INTEGER} bytes`);
        }
        return this.readUTFBody(Number(length));
    }

    // https://docs.oracle.com/javase/8/docs/api/java/io/DataInput.html#readUTF--
    readUTFBody(length: number): string {
        const bytes = this.readFully(length);

        const resultChars = new Uint16Array(bytes.length);
        let resultCharsOffset = 0;
        for (let i=0; i<bytes.length; resultCharsOffset++) {
            const a = bytes[i++];

            // Single-byte group
            if ((a & 0b1000_0000) === 0b0000_0000) {
                resultChars[resultCharsOffset] = a;
            }
            // Two-byte group
            else if ((a & 0b1110_0000) === 0b1100_0000) {
                if (i+1 > bytes.length) throw new UTFDataFormatException();
                const b = bytes[i++];
                if ((b & 0b1100_0000) !== 0b1000_0000) throw new UTFDataFormatException();
                resultChars[resultCharsOffset] = (((a & 0x1F) << 6) | (b & 0x3F));
            }
            // Three-byte group
            else if ((a & 0b1111_0000) === 0b1110_0000) {
                if (i+2 > bytes.length) throw new UTFDataFormatException();
                const b = bytes[i++];
                const c = bytes[i++];
                if ((b & 0b1100_0000) !== 0b1000_0000) throw new UTFDataFormatException();
                if ((c & 0b1100_0000) !== 0b1000_0000) throw new UTFDataFormatException();
                resultChars[resultCharsOffset] = (((a & 0x0F) << 12) | ((b & 0x3F) << 6) | (c & 0x3F));
            }
            //  Encoding error
            else {
                throw new UTFDataFormatException();
            }
        }

        return Array.from(resultChars.subarray(0, resultCharsOffset), c => String.fromCharCode(c)).join("");
    }
}

class HandleTable {
    private table: Map<number, any>;
    private currHandle = baseWireHandle;

    constructor() {
        this.table = new Map();
    }

    reset(): void {
        this.table.clear();
        this.currHandle = baseWireHandle;
    }

    newHandle(obj: any): number {
        const handle = this.currHandle++;
        this.table.set(handle, obj);
        return handle;
    }

    getObject(handle: number): any {
        return this.table.get(handle);
    }
}

class ObjectInputStreamParser extends PrimitiveInput {
    private data: Uint8Array;
    private offset: number;
    private handleTable: HandleTable;

    constructor(data: Uint8Array) {
        super();
        this.data = data;
        this.offset = 0;
        this.handleTable = new HandleTable();

        if (this.readUnsignedShort() !== STREAM_MAGIC) throw new StreamCorruptedException("Missing STREAM_MAGIC");
        if (this.readUnsignedShort() !== STREAM_VERSION) throw new StreamCorruptedException("Missing STREAM_VERSION");
    }

    read1(): number {
        if (this.eof())
            return -1;
        return this.data[this.offset++];
    }

    peek1(): number {
        if (this.eof())
            return -1;
        return this.data[this.offset];
    }

    eof(): boolean {
        return this.offset >= this.data.length;
    }

    parseContents(allowEndBlock=false): any[] {
        const result = [];
        let done = false;
        while (!this.eof() && !done) {
            const tc = this.peek1();
            switch (tc) {
                case TC_BLOCKDATA:
                case TC_BLOCKDATALONG:
                    result.push(this.parseBlockData());
                    break;
                case TC_OBJECT:
                case TC_CLASS:
                case TC_ARRAY:
                case TC_STRING:
                case TC_ENUM:
                case TC_CLASSDESC:
                case TC_PROXYCLASSDESC:
                case TC_REFERENCE:
                case TC_NULL:
                case TC_EXCEPTION:
                    result.push(this.parseObject());
                    break;
                case TC_RESET:
                    // This is technically an "object", but in practice it doesn't matter
                    this.handleTable.reset();
                    break;
                case TC_ENDBLOCKDATA:
                    if (allowEndBlock) {
                        done = true;
                        break;
                    }
                default:
                    throw new StreamCorruptedException("Unknown content tc: " + tc);
            }
        }
        return result;
    }

    parseBlockData(): Uint8Array {
        const tc = this.read1();
        let size: number;
        switch (tc) {
            case TC_BLOCKDATA:
                size = this.readUnsignedByte();
                break;
            case TC_BLOCKDATALONG:
                size = this.readInt();
                break;
            default:
                throw new StreamCorruptedException("Unknown block data tc: " + tc);
        }
        return this.readFully(size);
    }

    parseObject(): any {
        const tc = this.peek1();
        switch (tc) {
            case TC_OBJECT:
                return this.parseNewObject();
            case TC_CLASS:
                return this.parseNewClass();
            case TC_ARRAY:
                return this.parseNewArray();
            case TC_STRING:
            case TC_LONGSTRING:
                return this.parseNewString();
            case TC_ENUM:
                return this.parseNewEnum();
            case TC_CLASSDESC:
            case TC_PROXYCLASSDESC:
                return this.parseNewClassDesc();
            case TC_REFERENCE:
                return this.parsePrevObject();
            case TC_NULL:
                this.read1();
                return null;
            case TC_EXCEPTION:
                return this.parseException();
            default:
                throw new StreamCorruptedException("Unknown object tc: " + tc);
        }
    }

    parseNewObject(): any {
        const tc = this.read1();
        if (tc !== TC_OBJECT) throw new StreamCorruptedException("Unknown new object tc: " + tc);
        const result: any = {};
        result.classDesc = this.parseClassDesc();
        result.handle = this.handleTable.newHandle(result);
        
        const classChain = [];
        let currClass = result.classDesc;
        while (currClass !== null) {
            classChain.push(currClass);
            currClass = currClass.classDescInfo.super;
        }
        classChain.reverse();

        result.classdata = [];
        for (const classDesc of classChain) {
            const currData: any = {};
            const flags = classDesc.classDescInfo.flags;

            if ((SC_SERIALIZABLE & flags) && !(SC_WRITE_METHOD & flags)) {
                currData.values = this.parseValues(classDesc);
            } else if ((SC_SERIALIZABLE & flags) && !(SC_WRITE_METHOD & flags)) {
                currData.values = this.parseValues(classDesc);
                currData.objectAnnotation = this.parseObjectAnnotation();
            } else if ((SC_EXTERNALIZABLE & flags) && !(SC_BLOCK_DATA & flags)) {
                throw new NotImplementedError("PROTOCOL_VERSION_1 Externalizable object");
            } else if ((SC_EXTERNALIZABLE & flags) && !(SC_BLOCK_DATA & flags)) {
                currData.objectAnnotation = this.parseObjectAnnotation();
            } else {
                throw new StreamCorruptedException("Unknown classDescFlags: " + flags);
            }
            result.classdata.push(currData);
        }
        return result;
    }

    parseValues(classDesc: any): any {
        const fields = classDesc.classDescInfo.fields;
        const values = [];
        for (const field of fields) {
            values.push(this.parseValue(field.typecode));
        }
        return values;
    }

    parseValue(typecode: string): any {
        switch (typecode) {
            case '[':
            case 'L':
                // TODO: type checking
                return this.parseObject();
            case 'B': return this.readByte();
            case 'C': return this.readChar();
            case 'D': return this.readDouble();
            case 'F': return this.readFloat();
            case 'I': return this.readInt();
            case 'J': return this.readLong();
            case 'S': return this.readShort();
            case 'Z': return this.readBoolean();
            default:
                throw new StreamCorruptedException("Unkown field value typecode: " + typecode);
        }
    }

    parseNewClass(): any {
        const tc = this.read1();
        if (tc !== TC_CLASS) throw new StreamCorruptedException("Unknown reference tc: " + tc);

        const result: any = {};
        result.classDesc = this.parseClassDesc();
        result.handle = this.handleTable.newHandle(result);
        return result;
    }

    parseNewArray(): any[] {
        const tc = this.read1();
        if (tc !== TC_ARRAY) throw new StreamCorruptedException("Unknown array tc: " + tc);

        const result: any[] = [];
        const classDesc = this.parseClassDesc();
        if (!classDesc.className.startsWith("["))
            throw new StreamCorruptedException("Array class name doesn't begin with [: " + classDesc.className);
        const typecode = classDesc.className[1];
        this.handleTable.newHandle(result);
        const size = this.readInt();
        for (let i=0; i<size; i++) {
            result.push(this.parseValue(typecode));
        }
        return result;
    }

    parseNewString(): string {
        const tc = this.read1();
        let result: string;
        switch (tc) {
            case TC_STRING:
                result = this.readUTF();
                break;
            case TC_LONGSTRING:
                result = this.readLongUTF();
                break;
            default:
                throw new StreamCorruptedException("Unknown string tc: " + tc);
        }
        this.handleTable.newHandle(result);
        return result;
    }

    parseNewEnum(): any {
        const tc = this.read1();
        if (tc !== TC_ENUM) throw new StreamCorruptedException("Unknown enum tc: " + tc);
        const result: any = {};
        result.handle = this.handleTable.newHandle(result);
        const enumConstantName = this.parseObject();
        if (typeof enumConstantName !== "string") {
            throw new StreamCorruptedException("Enum name must be a String object");
        }
        result.enumConstantName = enumConstantName;
        return result;
    }

    parseNewClassDesc(): any {
        const tc = this.read1();
        switch (tc) {
            case TC_CLASSDESC: {
                const result: any = {};
                result.className = this.readUTF();
                result.serialVersionUID = this.readLong();
                result.handle = this.handleTable.newHandle(result);
                result.classDescInfo = this.parseClassDescInfo();
                return result;
            }
            case TC_PROXYCLASSDESC:
                throw new NotImplementedError("proxy classes");
            default:
                throw new StreamCorruptedException("Unknown new class desc tc: " + tc);
        }
    }

    parseClassDescInfo(): any {
        const result: any = {};
        result.flags = this.readUnsignedByte();
        result.fields = [];
        const fieldsCount = this.readShort();
        for (let i=0; i<fieldsCount; i++) {
            const field: any = {};
            field.typecode = String.fromCharCode(this.readUnsignedByte());
            field.fieldName = this.readUTF();
            switch (field.typecode) {
                case '[': case 'L':
                    const className = this.parseObject();
                    if (typeof className !== "string")
                        throw new StreamCorruptedException("Field class name must be a String object");
                    field.className = className;
                    break;
                case 'B': case 'C': case 'D': case 'F': case 'I': case 'J': case 'S': case 'Z':
                    break;
                default:
                    throw new StreamCorruptedException("Unkown field typecode: " + field.typecode);
            }
            result.fields.push(field);
        }
        result.classAnnotation = this.parseClassAnnotation();
        result.super = this.parseClassDesc();
        return result;
    }

    parseClassDesc(): any {
        const tc = this.peek1();
        switch (tc) {
            case TC_CLASSDESC:
            case TC_PROXYCLASSDESC:
                return this.parseNewClassDesc();
            case TC_NULL:
                this.read1();
                return null;
            case TC_REFERENCE:
                // TODO: check that's it's a classdesc
                return this.parsePrevObject();
            default:
                throw new StreamCorruptedException("Unknown class desc tc: " + tc);
        }
    }

    parsePrevObject(): any {
        const tc = this.read1();
        if (tc !== TC_REFERENCE) throw new StreamCorruptedException("Unknown reference tc: " + tc);
        const handle = this.readInt();
        return this.handleTable.getObject(handle);
    }

    parseException(): any {
        const tc = this.read1();
        if (tc !== TC_EXCEPTION) throw new StreamCorruptedException("Unknown exception tc: " + tc);
        throw new NotImplementedError("Exceptions in stream");
    }

    _parseEndBlockTerminatedContents(): any[] {
        const contents = this.parseContents(true);
        const endBlock = this.read1();
        if (endBlock !== TC_ENDBLOCKDATA) throw new StreamCorruptedException("Expected TC_ENDBLOCKDATA");
        return contents;
    }

    parseObjectAnnotation = this._parseEndBlockTerminatedContents
    parseClassAnnotation = this._parseEndBlockTerminatedContents
}

abstract class ObjectInput extends PrimitiveInput {
    abstract readObject(): any;
}


class ObjectInputStream extends ObjectInput {
    private contents: any[];
    private offset: number;
    private blockOffset: number;

    constructor(data: Uint8Array) {
        super();
        this.contents = new ObjectInputStreamParser(data).parseContents();
        this.offset = 0;
        this.blockOffset = 0;
    }

    read1() {
        if (this.offset >= this.contents.length)
            return -1;
        const content = this.contents[this.offset];
        if (!(content instanceof Uint8Array))
            return -1;
        if (this.blockOffset >= content.length) {
            throw new Error("Illegal state");
        }
        const result = content[this.blockOffset++];
        if (this.blockOffset >= content.length) {
            this.offset++;
            this.blockOffset = 0;
        }
        return result;
    }

    readObject(): any {
        if (this.offset >= this.contents.length)
            throw new EOFException();
        const content = this.contents[this.offset];
        if (content instanceof Uint8Array)
            throw new OptionalDataException();
        this.offset++;
        return content;
    }
}


class ByteArray {
    private static getIntegral(arr: Uint8Array, numBytes: number, signed: boolean): bigint {
        if (arr.length < numBytes) {
            throw new IndexOutOfBoundsException();
        }
        if (numBytes <= 0) {
            return 0n;
        }
        const bytes = arr.subarray(0, numBytes);
        let result = 0n;
        for (const byte of bytes) {
            result <<= 8n;
            result += BigInt(byte);
        }
        if (signed) {
            const signMask = 1 << 7;
            const signBit = numBytes > 0 && ((bytes[0] & signMask) !== 0);
            if (signBit) {
                const modulus = 1n << BigInt(numBytes * 8 - 1);
                result -= modulus;
            }
        }
        return result;
    }

    public static getBoolean(arr: Uint8Array): boolean {
        if (arr.length < 1) throw new IndexOutOfBoundsException();
        return arr[0] !== 0;
    }

    public static getByte(arr: Uint8Array): number {
        return Number(this.getIntegral(arr, 1, true));
    }

    public static getUnsignedByte(arr: Uint8Array): number {
        return Number(this.getIntegral(arr, 1, false))
    }

    public static getChar(arr: Uint8Array): string {
        return String.fromCharCode(Number(this.getIntegral(arr, 2, false)));
    }

    public static getShort(arr: Uint8Array): number {
        return Number(this.getIntegral(arr, 2, true));
    }

    public static getUnsignedShort(arr: Uint8Array): number {
        return Number(this.getIntegral(arr, 2, false));
    }

    public static getInt(arr: Uint8Array): number {
        return Number(this.getIntegral(arr, 4, true));
    }

    public static getLong(arr: Uint8Array): bigint {
        return this.getIntegral(arr, 8, true);
    }

    public static getFloat(arr: Uint8Array): number {
        if (arr.length < 4) throw new IndexOutOfBoundsException();
        return new DataView(arr.subarray(0, 4).buffer).getFloat32(0, false);
    }

    public static getDouble(arr: Uint8Array): number {
        if (arr.length < 8) throw new IndexOutOfBoundsException();
        return new DataView(arr.subarray(0, 8).buffer).getFloat64(0, false);
    }
}
