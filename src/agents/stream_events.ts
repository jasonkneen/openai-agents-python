import { Agent } from './agent';
import { RunItem, TResponseStreamEvent } from './items';

export interface RawResponsesStreamEvent {
  data: TResponseStreamEvent;
  type: 'raw_response_event';
}

export interface RunItemStreamEvent {
  name: 'message_output_created' | 'handoff_requested' | 'handoff_occured' | 'tool_called' | 'tool_output' | 'reasoning_item_created';
  item: RunItem;
  type: 'run_item_stream_event';
}

export interface AgentUpdatedStreamEvent {
  newAgent: Agent<any>;
  type: 'agent_updated_stream_event';
}

export type StreamEvent = RawResponsesStreamEvent | RunItemStreamEvent | AgentUpdatedStreamEvent;
