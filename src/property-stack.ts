// Type for a modifier function that transforms a value
type Modifier<T> = (value: T) => T;

// Union type for stack elements - either a direct value or a modifier
type StackElement<T> = T | Modifier<T>;

export default class PropertyStack<T> {
  stack: Array<StackElement<T>> = [];

  constructor(initialValues: Array<T>) {
    this.stack = initialValues;
  }

  // Add a new value or modifier to the top of the stack
  push(element: StackElement<T>): void {
    this.stack.push(element);
  }

  // Remove and return the top element
  pop(): StackElement<T> | undefined {
    return this.stack.pop();
  }

  // Calculate the final value by applying all stack elements
  getValue(): T | undefined {
    if (this.stack.length === 0) {
      return undefined;
    }

    let result: T | undefined;

    // Find the first direct value (not a modifier) from the end of the array
    let baseValueIndex = -1;
    for (let i = this.stack.length - 1; i >= 0; i--) {
      if (typeof this.stack[i] !== "function") {
        baseValueIndex = i;
        break;
      }
    }

    if (baseValueIndex === -1) {
      return undefined;
    }

    result = this.stack[baseValueIndex] as T;

    // Apply all modifiers that come after the base value
    for (let i = baseValueIndex + 1; i < this.stack.length; i++) {
      const element = this.stack[i];
      result = (element as Modifier<T>)(result!);
    }

    return result;
  }

  // Clear the stack
  clear(): void {
    this.stack = [];
  }
}
