// Container type to distinguish between values and modifiers
type ValueContainer<T> = {
  type: "value";
  value: T;
};

// Type for a modifier function that transforms a value
type Modifier<T> = {
  type: "modifier";
  modify: (value: T) => T;
};

// Union type for stack elements - either a value container or a modifier
type StackElement<T> = ValueContainer<T> | Modifier<T>;

export default class PropertyStack<T> {
  stack: Array<StackElement<T>> = [];

  constructor(initialValues: Array<StackElement<T>>) {
    this.stack = initialValues;
  }

  // Add a new value or modifier to the top of the stack
  add(element: StackElement<T>): PropertyStack<T> {
    let newStack = this.stack.slice();
    newStack.push(element);
    return new PropertyStack(newStack);
  }

  // Calculate the final value by applying all stack elements
  getValue(): T | undefined {
    if (this.stack.length === 0) {
      return undefined;
    }

    let result: T | undefined;

    // Find the first direct value from the end of the array
    let baseValueIndex = -1;
    for (let i = this.stack.length - 1; i >= 0; i--) {
      if (this.stack[i].type === "value") {
        baseValueIndex = i;
        break;
      }
    }

    if (baseValueIndex === -1) {
      return undefined;
    }

    result = (this.stack[baseValueIndex] as ValueContainer<T>).value;

    // Apply all modifiers that come after the base value
    for (let i = baseValueIndex + 1; i < this.stack.length; i++) {
      const element = this.stack[i] as Modifier<T>;
      result = element.modify(result!);
    }

    return result;
  }

  // Clear the stack
  clear(): void {
    this.stack = [];
  }
}
