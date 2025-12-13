import { Serializable } from ".";

export namespace java {
    export namespace lang {
        export class Byte implements Serializable {
            value: number = 0;
            readResolve() { return this.value; }
        }
        export class Short implements Serializable {
            value: number = 0;
            readResolve() { return this.value; }
        }
        export class Integer implements Serializable {
            value: number = 0;
            readResolve() { return this.value; }
        }
        export class Long implements Serializable {
            value: bigint = 0n;
            readResolve() { return this.value; }
        }
        export class Float implements Serializable {
            value: number = 0;
            readResolve() { return this.value; }
        }
        export class Double implements Serializable {
            value: number = 0;
            readResolve() { return this.value; }
        }
        export class Character implements Serializable {
            value: string = '\0';
            readResolve() { return this.value; }
        }
        export class Boolean implements Serializable {
            value: boolean = false;
            readResolve() { return this.value; }
        }
    }
}