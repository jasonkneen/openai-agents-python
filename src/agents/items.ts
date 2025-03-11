import { BaseModel } from 'pydantic';
import { Agent } from './agent';
import { Usage } from './usage';
import { AgentsException, ModelBehaviorError } from './exceptions';
import { Response, ResponseInputItemParam, ResponseOutputItem, ResponseStreamEvent, ResponseOutputMessage, ResponseOutputText, ResponseOutputRefusal, ResponseFunctionToolCall, ResponseComputerToolCall, ResponseFileSearchToolCall, ResponseFunctionWebSearch, FunctionCallOutput, ComputerCallOutput, Reasoning } from 'openai/types/responses';

export type TResponse = Response;
export type TResponseInputItem = ResponseInputItemParam;
export type TResponseOutputItem = ResponseOutputItem;
export type TResponseStreamEvent = ResponseStreamEvent;

export abstract class RunItemBase<T extends TResponseOutputItem | TResponseInputItem> {
  agent: Agent<any>;
  rawItem: T;

  constructor(agent: Agent<any>, rawItem: T) {
    this.agent = agent;
    this.rawItem = rawItem;
  }

  toInputItem(): TResponseInputItem {
    if (typeof this.rawItem === 'object') {
      return this.rawItem as TResponseInputItem;
    } else if (this.rawItem instanceof BaseModel) {
      return this.rawItem.model_dump({ exclude_unset: true }) as TResponseInputItem;
    } else {
      throw new AgentsException(`Unexpected raw item type: ${typeof this.rawItem}`);
    }
  }
}

export class MessageOutputItem extends RunItemBase<ResponseOutputMessage> {
  type: 'message_output_item' = 'message_output_item';
}

export class HandoffCallItem extends RunItemBase<ResponseFunctionToolCall> {
  type: 'handoff_call_item' = 'handoff_call_item';
}

export class HandoffOutputItem extends RunItemBase<TResponseInputItem> {
  sourceAgent: Agent<any>;
  targetAgent: Agent<any>;
  type: 'handoff_output_item' = 'handoff_output_item';

  constructor(agent: Agent<any>, rawItem: TResponseInputItem, sourceAgent: Agent<any>, targetAgent: Agent<any>) {
    super(agent, rawItem);
    this.sourceAgent = sourceAgent;
    this.targetAgent = targetAgent;
  }
}

export type ToolCallItemTypes = ResponseFunctionToolCall | ResponseComputerToolCall | ResponseFileSearchToolCall | ResponseFunctionWebSearch;

export class ToolCallItem extends RunItemBase<ToolCallItemTypes> {
  type: 'tool_call_item' = 'tool_call_item';
}

export class ToolCallOutputItem extends RunItemBase<FunctionCallOutput | ComputerCallOutput> {
  output: string;
  type: 'tool_call_output_item' = 'tool_call_output_item';

  constructor(agent: Agent<any>, rawItem: FunctionCallOutput | ComputerCallOutput, output: string) {
    super(agent, rawItem);
    this.output = output;
  }
}

export class ReasoningItem extends RunItemBase<Reasoning> {
  type: 'reasoning_item' = 'reasoning_item';
}

export type RunItem = MessageOutputItem | HandoffCallItem | HandoffOutputItem | ToolCallItem | ToolCallOutputItem | ReasoningItem;

export class ModelResponse {
  output: TResponseOutputItem[];
  usage: Usage;
  referenceableId: string | null;

  constructor(output: TResponseOutputItem[], usage: Usage, referenceableId: string | null) {
    this.output = output;
    this.usage = usage;
    this.referenceableId = referenceableId;
  }

  toInputItems(): TResponseInputItem[] {
    return this.output.map(item => item.model_dump({ exclude_unset: true }) as TResponseInputItem);
  }
}

export class ItemHelpers {
  static extractLastContent(message: TResponseOutputItem): string {
    if (!(message instanceof ResponseOutputMessage)) {
      return '';
    }

    const lastContent = message.content[message.content.length - 1];
    if (lastContent instanceof ResponseOutputText) {
      return lastContent.text;
    } else if (lastContent instanceof ResponseOutputRefusal) {
      return lastContent.refusal;
    } else {
      throw new ModelBehaviorError(`Unexpected content type: ${typeof lastContent}`);
    }
  }

  static extractLastText(message: TResponseOutputItem): string | null {
    if (message instanceof ResponseOutputMessage) {
      const lastContent = message.content[message.content.length - 1];
      if (lastContent instanceof ResponseOutputText) {
        return lastContent.text;
      }
    }
    return null;
  }

  static inputToNewInputList(input: string | TResponseInputItem[]): TResponseInputItem[] {
    if (typeof input === 'string') {
      return [{ content: input, role: 'user' }];
    }
    return JSON.parse(JSON.stringify(input));
  }

  static textMessageOutputs(items: RunItem[]): string {
    return items
      .filter(item => item instanceof MessageOutputItem)
      .map(item => this.textMessageOutput(item as MessageOutputItem))
      .join('');
  }

  static textMessageOutput(message: MessageOutputItem): string {
    return message.rawItem.content
      .filter(item => item instanceof ResponseOutputText)
      .map(item => (item as ResponseOutputText).text)
      .join('');
  }

  static toolCallOutputItem(toolCall: ResponseFunctionToolCall, output: string): FunctionCallOutput {
    return {
      call_id: toolCall.call_id,
      output,
      type: 'function_call_output',
    };
  }
}
