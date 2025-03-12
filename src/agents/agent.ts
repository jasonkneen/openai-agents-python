import { MaybeAwaitable } from './_utils';
import { InputGuardrail, OutputGuardrail } from './guardrail';
import { Handoff } from './handoffs';
import { ItemHelpers } from './items';
import { logger } from './logger';
import { ModelSettings } from './model_settings';
import { Model } from './models/interface';
import { RunContextWrapper, TContext } from './run_context';
import { Tool, function_tool } from './tool';
import { AgentHooks } from './lifecycle';
import { RunResult } from './result';

export interface AgentOptions<TContext> {
  name: string;
  instructions?: string | ((context: RunContextWrapper<TContext>, agent: Agent<TContext>) => MaybeAwaitable<string>);
  handoffDescription?: string;
  handoffs?: Array<Agent<any> | Handoff<TContext>>;
  model?: string | Model;
  modelSettings?: ModelSettings;
  tools?: Tool[];
  inputGuardrails?: InputGuardrail<TContext>[];
  outputGuardrails?: OutputGuardrail<TContext>[];
  outputType?: any;
  hooks?: AgentHooks<TContext>;
}

export class Agent<TContext> {
  name: string;
  instructions?: string | ((context: RunContextWrapper<TContext>, agent: Agent<TContext>) => MaybeAwaitable<string>);
  handoffDescription?: string;
  handoffs: Array<Agent<any> | Handoff<TContext>>;
  model?: string | Model;
  modelSettings: ModelSettings;
  tools: Tool[];
  inputGuardrails: InputGuardrail<TContext>[];
  outputGuardrails: OutputGuardrail<TContext>[];
  outputType?: any;
  hooks?: AgentHooks<TContext>;

  constructor(options: AgentOptions<TContext>) {
    this.name = options.name;
    this.instructions = options.instructions;
    this.handoffDescription = options.handoffDescription;
    this.handoffs = options.handoffs || [];
    this.model = options.model;
    this.modelSettings = options.modelSettings || new ModelSettings();
    this.tools = options.tools || [];
    this.inputGuardrails = options.inputGuardrails || [];
    this.outputGuardrails = options.outputGuardrails || [];
    this.outputType = options.outputType;
    this.hooks = options.hooks;
  }

  clone(options: Partial<AgentOptions<TContext>>): Agent<TContext> {
    return new Agent<TContext>({
      ...this,
      ...options,
    });
  }

  asTool(
    toolName?: string,
    toolDescription?: string,
    customOutputExtractor?: (output: RunResult) => Promise<string>
  ): Tool {
    const runAgent = async (context: RunContextWrapper<any>, input: string): Promise<string> => {
      const { Runner } = await import('./run');
      const output = await Runner.run({
        startingAgent: this,
        input,
        context: context.context,
      });
      if (customOutputExtractor) {
        return await customOutputExtractor(output);
      }
      return ItemHelpers.textMessageOutputs(output.newItems);
    };

    return function_tool({
      nameOverride: toolName || this.name.replace(/\s+/g, '_').toLowerCase(),
      descriptionOverride: toolDescription || '',
    })(runAgent);
  }

  async getSystemPrompt(runContext: RunContextWrapper<TContext>): Promise<string | undefined> {
    if (typeof this.instructions === 'string') {
      return this.instructions;
    } else if (typeof this.instructions === 'function') {
      return await this.instructions(runContext, this);
    } else if (this.instructions !== undefined) {
      logger.error(`Instructions must be a string or a function, got ${this.instructions}`);
    }
    return undefined;
  }
}
