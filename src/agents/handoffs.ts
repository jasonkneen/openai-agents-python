import { MaybeAwaitable } from './_utils';
import { ModelBehaviorError, UserError } from './exceptions';
import { RunItem, TResponseInputItem } from './items';
import { RunContextWrapper, TContext } from './run_context';
import { ensureStrictJsonSchema } from './strict_schema';
import { SpanError, attachErrorToCurrentSpan } from './tracing/spans';
import { Agent } from './agent';

export type THandoffInput = any;

export interface HandoffInputData {
  inputHistory: string | TResponseInputItem[];
  preHandoffItems: RunItem[];
  newItems: RunItem[];
}

export type HandoffInputFilter = (handoffInputData: HandoffInputData) => HandoffInputData;

export interface HandoffOptions<TContext> {
  toolName: string;
  toolDescription: string;
  inputJsonSchema: Record<string, any>;
  onInvokeHandoff: (context: RunContextWrapper<any>, inputJson: string) => Promise<Agent<TContext>>;
  agentName: string;
  inputFilter?: HandoffInputFilter;
  strictJsonSchema?: boolean;
}

export class Handoff<TContext> {
  toolName: string;
  toolDescription: string;
  inputJsonSchema: Record<string, any>;
  onInvokeHandoff: (context: RunContextWrapper<any>, inputJson: string) => Promise<Agent<TContext>>;
  agentName: string;
  inputFilter?: HandoffInputFilter;
  strictJsonSchema: boolean;

  constructor(options: HandoffOptions<TContext>) {
    this.toolName = options.toolName;
    this.toolDescription = options.toolDescription;
    this.inputJsonSchema = options.inputJsonSchema;
    this.onInvokeHandoff = options.onInvokeHandoff;
    this.agentName = options.agentName;
    this.inputFilter = options.inputFilter;
    this.strictJsonSchema = options.strictJsonSchema ?? true;
  }

  getTransferMessage(agent: Agent<any>): string {
    return `{'assistant': '${agent.name}'}`;
  }

  static defaultToolName(agent: Agent<any>): string {
    return `transfer_to_${agent.name.replace(/\s+/g, '_').toLowerCase()}`;
  }

  static defaultToolDescription(agent: Agent<any>): string {
    return `Handoff to the ${agent.name} agent to handle the request. ${agent.handoffDescription || ''}`;
  }
}

export function handoff<TContext>(
  agent: Agent<TContext>,
  options: {
    toolNameOverride?: string;
    toolDescriptionOverride?: string;
    onHandoff?: (context: RunContextWrapper<any>, input: THandoffInput) => MaybeAwaitable<void>;
    inputType?: new () => THandoffInput;
    inputFilter?: HandoffInputFilter;
  } = {}
): Handoff<TContext> {
  const {
    toolNameOverride,
    toolDescriptionOverride,
    onHandoff,
    inputType,
    inputFilter,
  } = options;

  const inputJsonSchema = inputType ? new inputType().constructor : {};
  const typeAdapter = inputType ? new inputType() : null;

  async function _invokeHandoff(
    context: RunContextWrapper<any>,
    inputJson: string | null = null
  ): Promise<Agent<any>> {
    if (inputType && typeAdapter) {
      if (inputJson === null) {
        attachErrorToCurrentSpan(
          new SpanError({
            message: 'Handoff function expected non-null input, but got None',
            data: { details: 'inputJson is None' },
          })
        );
        throw new ModelBehaviorError('Handoff function expected non-null input, but got None');
      }

      const validatedInput = JSON.parse(inputJson);
      if (onHandoff) {
        await onHandoff(context, validatedInput);
      }
    } else if (onHandoff) {
      await onHandoff(context, undefined);
    }

    return agent;
  }

  const toolName = toolNameOverride || Handoff.defaultToolName(agent);
  const toolDescription = toolDescriptionOverride || Handoff.defaultToolDescription(agent);

  const strictJsonSchema = ensureStrictJsonSchema(inputJsonSchema);

  return new Handoff({
    toolName,
    toolDescription,
    inputJsonSchema: strictJsonSchema,
    onInvokeHandoff: _invokeHandoff,
    agentName: agent.name,
    inputFilter,
  });
}
