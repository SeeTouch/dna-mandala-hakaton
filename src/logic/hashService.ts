/**
 * Subconscious Hash Logic
 * 64-bit mask for codons + 3 floats (Temporal Flow, Chaos, Resonance)
 */

export const serializeState = (activeIndices: number[], params: { flow: number, chaos: number, resonance: number }) => {
  // 64-bit mask
  let mask = BigInt(0);
  activeIndices.forEach(idx => {
    mask |= BigInt(1) << BigInt(idx - 1);
  });

  // Pack into buffer
  const buffer = new ArrayBuffer(8 + 12); // 8 bytes for mask, 12 for 3 floats
  const view = new DataView(buffer);
  
  view.setBigUint64(0, mask, true);
  view.setFloat32(8, params.flow, true);
  view.setFloat32(12, params.chaos, true);
  view.setFloat32(16, params.resonance, true);

  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const deserializeState = (hash: string) => {
  try {
    const binary = atob(hash.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    const view = new DataView(bytes.buffer);
    const mask = view.getBigUint64(0, true);
    const flow = view.getFloat32(8, true);
    const chaos = view.getFloat32(12, true);
    const resonance = view.getFloat32(16, true);

    const activeIndices: number[] = [];
    for (let i = 0; i < 64; i++) {
      if ((mask >> BigInt(i)) & BigInt(1)) {
        activeIndices.push(i + 1);
      }
    }

    return { activeIndices, params: { flow, chaos, resonance } };
  } catch (e) {
    console.error("Hydration failed", e);
    return null;
  }
};
