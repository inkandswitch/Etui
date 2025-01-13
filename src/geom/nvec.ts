// n dimensional vector
export type NVec = Array<number>;

export function NVec(...values: number[]): NVec {
  return values;
}

// n dimensional vector functions
NVec.sub = (a: NVec, b: NVec): NVec => {
  if (a.length != b.length) {
    throw new Error("Vectors must have the same length");
  }

  return a.map((value, index) => value - b[index]);
};

NVec.dot = (a: NVec, b: NVec): number => {
  if (a.length != b.length) {
    throw new Error("Vectors must have the same length");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
};

NVec.project = (a: NVec, b: NVec): NVec => {
  if (b.every((val) => val === 0)) {
    throw new Error("Cannot project onto a zero vector");
  }

  const scalar = NVec.dot(a, b) / NVec.dot(b, b);
  return b.map((value) => value * scalar);
};

NVec.magnitude = (a: NVec): number => Math.sqrt(NVec.dot(a, a));
