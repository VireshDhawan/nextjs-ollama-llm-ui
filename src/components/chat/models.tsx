interface ModelType {
  name: string;
  system_message: string;
  first_message: string;
}

export const models: ModelType[] = [
  {
    name: "model1",
    system_message: `System message for model1.
This is the second line.`,
    first_message: `First message for model1.
What can I do for you?`
  }
];
