const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function bech32Polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

function bech32HrpExpand(hrp) {
  const ret = [];
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
  ret.push(0);
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
  return ret;
}

function bech32CreateChecksum(hrp, data) {
  const values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = bech32Polymod(values) ^ 1;
  const ret = [];
  for (let p = 0; p < 6; p++) ret.push((mod >> (5 * (5 - p))) & 31);
  return ret;
}

function bech32Encode(hrp, data) {
  const combined = data.concat(bech32CreateChecksum(hrp, data));
  return hrp + "1" + combined.map((v) => BECH32_CHARSET.charAt(v)).join("");
}

function convertBits(data, fromBits, toBits, pad) {
  let acc = 0;
  let bits = 0;
  const ret = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    if (value < 0 || value >> fromBits) return null;
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits) ret.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || (acc << (toBits - bits)) & maxv) {
    return null;
  }
  return ret;
}

export function hexToNpub(hex) {
  let clean = hex.trim().toLowerCase();
  if (clean.startsWith("0x")) clean = clean.slice(2);
  if (!/^[0-9a-f]{64}$/.test(clean)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  const data = convertBits(Array.from(bytes), 8, 5, true);
  if (!data) return null;
  return bech32Encode("npub", data);
}

export function shortenNpub(npub, head = 12, tail = 8) {
  if (!npub || npub.length <= head + tail + 1) return npub || "";
  return `${npub.slice(0, head)}…${npub.slice(-tail)}`;
}
