import Papa from 'papaparse';

export interface CodonData {
  index: number;
  mRNA: string;
  DNA: string;
  AA: string;
  binary: string;
  radiusLevel: number;
  gate: string;
  geneKey: string;
  element: string;
  upperTrigram: string;
  lowerTrigram: string;
}

export interface TrigramMapping {
  code: string;
  element: string;
  yangInterval: number;
  yinInterval: number;
  note: string;
}

export const loadMandalaData = async () => {
  const [codonsRes, trigramsRes] = await Promise.all([
    fetch('/data/codon_mapping_sheet_v2.csv').then(r => r.text()),
    fetch('/data/trigram_interval_mapping.csv').then(r => r.text())
  ]);

  const codons = Papa.parse(codonsRes, { header: true }).data.map((row: any) => ({
    index: parseInt(row['Index(1..64)']),
    mRNA: row['mRNA Codon'],
    DNA: row['DNA Codon (T instead of U)'],
    AA: row['AA (3-letter)'],
    binary: row['Binary(6 bits A11,G10,C01,U00)'],
    radiusLevel: parseInt(row['Radius level (0=center..3=outer)']),
    gate: row['Gate (Human Design)'],
    geneKey: row['Gene Key'],
    element: row['Element (Wu Xing)'],
    upperTrigram: row['Trigram Upper (code 000..111)'],
    lowerTrigram: row['Trigram Lower (code 000..111)']
  })).filter(c => !isNaN(c.index));

  const trigrams = Papa.parse(trigramsRes, { header: true }).data.map((row: any) => ({
    code: row['Trigram code (000..111)'],
    element: row['Element (Wu Xing)'],
    yangInterval: parseFloat(row['Yang interval (tones) — Mode A']),
    yinInterval: parseFloat(row['Yin interval (tones) — Mode A']),
    note: row['Note — Mode A']
  })).filter(t => t.code);

  return { codons, trigrams };
};

export const mapCodonToMandala = (codon: CodonData, trigrams: TrigramMapping[]) => {
  const upper = trigrams.find(t => t.code === codon.upperTrigram);
  const lower = trigrams.find(t => t.code === codon.lowerTrigram);

  // 3D Coordinates: Cylindrical mapping for "Cosmic Tube"
  // Radius level 0-3 determines layers
  const angle = (codon.index / 64) * Math.PI * 2;
  const radius = 2 + codon.radiusLevel * 1.5;
  const z = (codon.index / 64) * 20 - 10; // Spread along tube

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  const elementColors: Record<string, string> = {
    'Металл': '#e5e7eb',
    'Дерево': '#10b981',
    'Огонь': '#ef4444',
    'Почва': '#f59e0b',
    'Вода': '#3b82f6',
    'Дерево*': '#059669'
  };

  return {
    index: codon.index,
    coordinates: { x, y, z },
    audio: {
      frequency: 432 + (codon.index * 2),
      interval_type: codon.index % 2 === 0 ? "Yang" : "Yin",
      note: upper?.note || "C"
    },
    visual: {
      element: codon.element,
      color_hex: elementColors[codon.element] || '#ffffff',
      radius_level: codon.radiusLevel
    },
    meta: {
      gate: codon.gate,
      geneKey: codon.geneKey
    }
  };
};
