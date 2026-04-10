export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type StructuredCompletion<T> = {
  complete(messages: ChatMessage[], schemaName: string): Promise<T>;
};
