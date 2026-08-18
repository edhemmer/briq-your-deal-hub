const textEncoder = new TextEncoder();

export function utf8(value: string) {
  return textEncoder.encode(value);
}

export function makeZip(files: Record<string, Uint8Array | string>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const [name, value] of Object.entries(files)) {
    const data = typeof value === "string" ? utf8(value) : value;
    const nameBytes = utf8(name);
    const checksum = crc32(data);

    const localHeader = new Uint8Array(30);
    const local = new DataView(localHeader.buffer);
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(14, checksum, true);
    local.setUint16(16, checksum >>> 16, true);
    local.setUint32(18, data.byteLength, true);
    local.setUint32(22, data.byteLength, true);
    local.setUint16(26, nameBytes.byteLength, true);
    localParts.push(localHeader, nameBytes, data);

    const centralHeader = new Uint8Array(46);
    const central = new DataView(centralHeader.buffer);
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(16, checksum, true);
    central.setUint16(18, checksum >>> 16, true);
    central.setUint32(20, data.byteLength, true);
    central.setUint32(24, data.byteLength, true);
    central.setUint16(28, nameBytes.byteLength, true);
    central.setUint32(42, offset, true);
    centralParts.push(centralHeader, nameBytes);

    offset += localHeader.byteLength + nameBytes.byteLength + data.byteLength;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((total, part) => total + part.byteLength, 0);
  const endHeader = new Uint8Array(22);
  const end = new DataView(endHeader.buffer);
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(files).length, true);
  end.setUint16(10, Object.keys(files).length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, centralOffset, true);

  return concat([...localParts, ...centralParts, endHeader]);
}

function concat(parts: Uint8Array[]) {
  const totalBytes = parts.reduce((total, part) => total + part.byteLength, 0);
  const output = new Uint8Array(totalBytes);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
