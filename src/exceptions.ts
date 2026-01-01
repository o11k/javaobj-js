export class JavaException extends Error {
    name = "JavaException";
}
export class IOException extends JavaException {
    name = "IOException";
}
export class ObjectStreamException extends IOException {
    name = "ObjectStreamException";
}
export class StreamCorruptedException extends ObjectStreamException {
    name = "StreamCorruptedException";
}
export class EOFException extends IOException {
    name = "EOFException";
}
export class UTFDataFormatException extends IOException {
    name = "UTFDataFormatException";
}
export class RuntimeException extends JavaException {
    name = "RuntimeException";
}
export class IllegalStateException extends RuntimeException {
    name = "IllegalStateException";
}
export class IndexOutOfBoundsException extends RuntimeException {
    name = "IndexOutOfBoundsException";
}
export class ClassCastException extends RuntimeException {
    name = "ClassCastException";
}
export class NullPointerException extends RuntimeException {
    name = "NullPointerException";
}
export class OptionalDataException extends ObjectStreamException {
    length: number;
    eof: boolean;
    constructor(detail: number | boolean) {
        if (typeof detail === "number") {
            super("inside block. remaining bytes " + detail);
            this.length = detail;
            this.eof = false;
        } else if (typeof detail === "boolean") {
            super("eof");
            this.length = 0;
            this.eof = detail;
        } else {
            throw new Error("unreachable");
        }
        this.name = "OptionalDataException";
    }
}
export class InvalidClassException extends ObjectStreamException {
    name = "InvalidClassException";
    cname: string | null
    constructor(cname: string | null, reason: string) {
        super(cname ?? "<unnamed>: " + reason);
        this.cname = cname;
    }
}
export class ReflectiveOperationException extends JavaException {
    name = "ReflectiveOperationException";
}
export class ClassNotFoundException extends ReflectiveOperationException {
    name = "ClassNotFoundException";
}
export class NotActiveException extends ObjectStreamException {
    name = "NotActiveException";
}
export class InvalidObjectException extends ObjectStreamException {
    name = "InvalidObjectException";
}
export class WriteAbortedException extends ObjectStreamException {
    detail: any;
    constructor(message: string, detail: any) {
        super(message);
        this.name = "WriteAbortedException";
        this.detail = detail;
    }
}
export class InternalError extends JavaException {
    name = "InternalError";
}

export class NotImplementedError extends Error {}  // TODO remove before publishing
