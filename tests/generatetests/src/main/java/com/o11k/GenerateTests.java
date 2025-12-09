package com.o11k;

import java.io.*;
import java.util.*;

public class GenerateTests {
    public static void main(String[] args) throws Exception {
        new File("tests/tmp").mkdirs();
        final FileWriter outExpected = new FileWriter("tests/tmp/expected.txt");
        final FileOutputStream outSerialized = new FileOutputStream("tests/tmp/serialized.ser");
        final ObjectOutputStream oos = new ObjectOutputStream(outSerialized);
        final Random rnd = new Random();

        final char[] typecodes = {'B', 'C', 'D', 'F', 'I', 'J', 'S', 'Z'};

        for (int i=0; i<1000; i++) {
            char typecode = typecodes[rnd.nextInt(typecodes.length)];

            switch (typecode) {
                case 'B':
                    final byte[] bs = {0};
                    rnd.nextBytes(bs);
                    oos.writeByte(bs[0]);
                    outExpected.write(typecode + Byte.toString(bs[0]) + '\n');
                    break;
                case 'C':
                    char c = (char)rnd.nextInt(1 << 16);
                    oos.writeChar(c);
                    outExpected.write(typecode + Integer.toString(c) + '\n');
                    break;
                case 'D':
                    long dBits = rnd.nextLong();
                    final long dExponentMask = 0b0__1111_1111_111__0000_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000L;
                    final long dFractionMask = 0b0__0000_0000_000__1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111L;
                    if (rnd.nextFloat() < 0.10) {
                        // ~5% chance of NaN
                        dBits |= dExponentMask;
                        // ~5% chance of +-Infinity
                        if (rnd.nextFloat() < 0.50) {
                            dBits &= ~dFractionMask;
                        }
                    } else if (rnd.nextFloat() < 0.10) {
                        // ~5% chance of subnormal
                        dBits &= ~dExponentMask;
                        // ~5% chance of +-0
                        if (rnd.nextFloat() < 0.50) {
                            dBits &= ~dFractionMask;
                        }
                    }
                    final double d = Double.longBitsToDouble(dBits);
                    oos.writeDouble(d);
                    outExpected.write(typecode + Double.toString(d) + '\n');
                    break;
                case 'F':
                    int fBits = rnd.nextInt();
                    final int fExponentMask = 0b0__1111_1111__0000_0000_0000_0000_0000_000;
                    final int fFractionMask = 0b0__0000_0000__1111_1111_1111_1111_1111_111;
                    if (rnd.nextFloat() < 0.10) {
                        // ~5% chance of NaN
                        fBits |= fExponentMask;
                        // ~5% chance of +-Infinity
                        if (rnd.nextFloat() < 0.50) {
                            fBits &= ~fFractionMask;
                        }
                    } else if (rnd.nextFloat() < 0.10) {
                        // ~5% chance of subnormal
                        fBits &= ~fExponentMask;
                        // ~5% chance of +-0
                        if (rnd.nextFloat() < 0.50) {
                            fBits &= ~fFractionMask;
                        }
                    }
                    final float f = Float.intBitsToFloat(fBits);
                    oos.writeFloat(f);
                    outExpected.write(typecode + Double.toString((double)f) + '\n');
                    break;
                case 'I':
                    final int i_ = rnd.nextInt();
                    oos.writeInt(i_);
                    outExpected.write(typecode + Integer.toString(i_) + '\n');
                    break;
                case 'J':
                    final long l = rnd.nextLong();
                    oos.writeLong(l);
                    outExpected.write(typecode + Long.toString(l) + '\n');
                    break;
                case 'S':
                    final short s = (short)rnd.nextInt(1 << 16);
                    oos.writeShort(s);
                    outExpected.write(typecode + Short.toString(s) + '\n');
                    break;
                case 'Z':
                    final boolean b = rnd.nextBoolean();
                    oos.writeBoolean(b);
                    outExpected.write(typecode + Boolean.toString(b) + '\n');
                    break;
                default:
                    throw new Exception("Unexpected typecode: " + typecode);
            }
        }

        oos.close();
        outSerialized.close();
        outExpected.close();
    }
}
