export type ToolChoice = "auto" | "required" | "none";

export class ModelSettings {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  tool_choice?: ToolChoice | string;
  parallel_tool_calls?: boolean;
  truncation?: "auto" | "disabled";

  constructor(
    temperature?: number,
    top_p?: number,
    frequency_penalty?: number,
    presence_penalty?: number,
    tool_choice?: ToolChoice | string,
    parallel_tool_calls?: boolean,
    truncation?: "auto" | "disabled"
  ) {
    this.temperature = temperature;
    this.top_p = top_p;
    this.frequency_penalty = frequency_penalty;
    this.presence_penalty = presence_penalty;
    this.tool_choice = tool_choice;
    this.parallel_tool_calls = parallel_tool_calls;
    this.truncation = truncation;
  }

  resolve(override?: ModelSettings): ModelSettings {
    if (!override) {
      return this;
    }
    return new ModelSettings(
      override.temperature ?? this.temperature,
      override.top_p ?? this.top_p,
      override.frequency_penalty ?? this.frequency_penalty,
      override.presence_penalty ?? this.presence_penalty,
      override.tool_choice ?? this.tool_choice,
      override.parallel_tool_calls ?? this.parallel_tool_calls,
      override.truncation ?? this.truncation
    );
  }
}
