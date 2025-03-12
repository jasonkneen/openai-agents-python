import { AsyncIterator } from "asynciterator";
import { AgentOutputSchema } from "../agent_output";
import { Handoff } from "../handoffs";
import { ModelResponse, TResponseInputItem, TResponseStreamEvent } from "../items";
import { Tool } from "../tool";
import { ModelSettings } from "../model_settings";

export enum ModelTracing {
  DISABLED = 0,
  ENABLED = 1,
  ENABLED_WITHOUT_DATA = 2,

  is_disabled(): boolean {
    return this === ModelTracing.DISABLED;
  },

  include_data(): boolean {
    return this === ModelTracing.ENABLED;
  }
}

export interface Model {
  get_response(
    system_instructions: string | null,
    input: string | TResponseInputItem[],
    model_settings: ModelSettings,
    tools: Tool[],
    output_schema: AgentOutputSchema | null,
    handoffs: Handoff[],
    tracing: ModelTracing
  ): Promise<ModelResponse>;

  stream_response(
    system_instructions: string | null,
    input: string | TResponseInputItem[],
    model_settings: ModelSettings,
    tools: Tool[],
    output_schema: AgentOutputSchema | null,
    handoffs: Handoff[],
    tracing: ModelTracing
  ): AsyncIterator<TResponseStreamEvent>;
}

export interface ModelProvider {
  get_model(model_name: string | null): Model;
}
