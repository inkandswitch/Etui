export type Id = string & { readonly __brand: unique symbol };

export function Id(): Id {
  return Math.random().toString(36).substring(2, 8) as Id; // start at index 2 to skip decimal point
}
