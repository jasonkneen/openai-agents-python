import { AsyncIterator } from "asynciterator";
import { AgentOutputSchema } from "../agent_output";
import { Handoff } from "../handoffs";
import { ModelResponse, TResponseInputItem, TResponseStreamEvent } from "../items";
import { Tool } from "../tool";
import { ModelSettings } from "../model_settings";
import { Model, ModelTracing } from "./interface";
import { OpenAI } from "openai";

export class OpenAIChatCompletionsModel implements Model {
  private model: string;
  private openaiClient: OpenAI;

  constructor(model: string, openaiClient: OpenAI) {
    this.model = model;
    this.openaiClient = openaiClient;
  }

  async get_response(
    system_instructions: string | null,
    input: string | TResponseInputItem[],
    model_settings: ModelSettings,
    tools: Tool[],
    output_schema: AgentOutputSchema | null,
    handoffs: Handoff[],
    tracing: ModelTracing
  ): Promise<ModelResponse> {
    const response = await this.openaiClient.chat.completions.create({
      model: this.model,
      messages: this.convertInputToMessages(system_instructions, input),
      temperature: model_settings.temperature,
      top_p: model_settings.top_p,
      frequency_penalty: model_settings.frequency_penalty,
      presence_penalty: model_settings.presence_penalty,
      tools: tools.map((tool) => this.convertTool(tool)),
      output_schema: output_schema ? output_schema.json_schema() : undefined,
      handoffs: handoffs.map((handoff) => this.convertHandoff(handoff)),
      tracing: tracing.is_disabled() ? "disabled" : tracing.include_data() ? "enabled" : "enabled_without_data",
    });

    return this.convertResponse(response);
  }

  stream_response(
    system_instructions: string | null,
    input: string | TResponseInputItem[],
    model_settings: ModelSettings,
    tools: Tool[],
    output_schema: AgentOutputSchema | null,
    handoffs: Handoff[],
    tracing: ModelTracing
  ): AsyncIterator<TResponseStreamEvent> {
    const stream = this.openaiClient.chat.completions.stream({
      model: this.model,
      messages: this.convertInputToMessages(system_instructions, input),
      temperature: model_settings.temperature,
      top_p: model_settings.top_p,
      frequency_penalty: model_settings.frequency_penalty,
      presence_penalty: model_settings.presence_penalty,
      tools: tools.map((tool) => this.convertTool(tool)),
      output_schema: output_schema ? output_schema.json_schema() : undefined,
      handoffs: handoffs.map((handoff) => this.convertHandoff(handoff)),
      tracing: tracing.is_disabled() ? "disabled" : tracing.include_data() ? "enabled" : "enabled_without_data",
    });

    return this.convertStream(stream);
  }

  private convertInputToMessages(system_instructions: string | null, input: string | TResponseInputItem[]): any[] {
    const messages: any[] = [];

    if (system_instructions) {
      messages.push({
        role: "system",
        content: system_instructions,
      });
    }

    for (const item of input) {
      if (typeof item === "string") {
        messages.push({
          role: "user",
          content: item,
        });
      } else {
        messages.push(item);
      }
    }

    return messages;
  }

  private convertTool(tool: Tool): any {
    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.params_json_schema,
    };
  }

  private convertHandoff(handoff: Handoff): any {
    return {
      name: handoff.tool_name,
      description: handoff.tool_description,
      parameters: handoff.input_json_schema,
    };
  }

  private convertResponse(response: any): ModelResponse {
    return {
      output: response.choices[0].message,
      usage: response.usage,
      referenceable_id: response.id,
    };
  }

  private convertStream(stream: any): AsyncIterator<TResponseStreamEvent> {
    // Implement the conversion logic for the stream
    return stream;
  }
}
