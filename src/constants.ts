export const TC_NULL           = 0x70 as const;
export const TC_REFERENCE      = 0x71 as const;
export const TC_CLASSDESC      = 0x72 as const;
export const TC_OBJECT         = 0x73 as const;
export const TC_STRING         = 0x74 as const;
export const TC_ARRAY          = 0x75 as const;
export const TC_CLASS          = 0x76 as const;
export const TC_BLOCKDATA      = 0x77 as const;
export const TC_ENDBLOCKDATA   = 0x78 as const;
export const TC_RESET          = 0x79 as const;
export const TC_BLOCKDATALONG  = 0x7A as const;
export const TC_EXCEPTION      = 0x7B as const;
export const TC_LONGSTRING     = 0x7C as const;
export const TC_PROXYCLASSDESC = 0x7D as const;
export const TC_ENUM           = 0x7E as const;

export const baseWireHandle    = 0x7E0000 as const;

export const SC_WRITE_METHOD   = 0x01 as const;  // if SC_SERIALIZABLE
export const SC_BLOCK_DATA     = 0x08 as const;  // if SC_EXTERNALIZABLE
export const SC_SERIALIZABLE   = 0x02 as const;
export const SC_EXTERNALIZABLE = 0x04 as const;
export const SC_ENUM           = 0x10 as const;

export const STREAM_MAGIC      = 0xaced as const;
export const STREAM_VERSION    = 0x0005 as const;
