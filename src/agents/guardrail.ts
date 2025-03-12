import { MaybeAwaitable } from './_utils';
import { UserError } from './exceptions';
import { TResponseInputItem } from './items';
import { RunContextWrapper, TContext } from './run_context';
import { Agent } from './agent';

export interface GuardrailFunctionOutput {
  outputInfo: any;
  tripwireTriggered: boolean;
}

export interface InputGuardrailResult<TContext> {
  guardrail: InputGuardrail<TContext>;
  output: GuardrailFunctionOutput;
}

export interface OutputGuardrailResult<TContext> {
  guardrail: OutputGuardrail<TContext>;
  agentOutput: any;
  agent: Agent<any>;
  output: GuardrailFunctionOutput;
}

export class InputGuardrail<TContext> {
  guardrailFunction: (
    context: RunContextWrapper<TContext>,
    agent: Agent<any>,
    input: string | TResponseInputItem[]
  ) => MaybeAwaitable<GuardrailFunctionOutput>;
  name?: string;

  constructor(
    guardrailFunction: (
      context: RunContextWrapper<TContext>,
      agent: Agent<any>,
      input: string | TResponseInputItem[]
    ) => MaybeAwaitable<GuardrailFunctionOutput>,
    name?: string
  ) {
    this.guardrailFunction = guardrailFunction;
    this.name = name;
  }

  getName(): string {
    return this.name || this.guardrailFunction.name;
  }

  async run(
    agent: Agent<any>,
    input: string | TResponseInputItem[],
    context: RunContextWrapper<TContext>
  ): Promise<InputGuardrailResult<TContext>> {
    if (typeof this.guardrailFunction !== 'function') {
      throw new UserError(`Guardrail function must be callable, got ${this.guardrailFunction}`);
    }

    const output = this.guardrailFunction(context, agent, input);
    if (output instanceof Promise) {
      return {
        guardrail: this,
        output: await output,
      };
    }

    return {
      guardrail: this,
      output,
    };
  }
}

export class OutputGuardrail<TContext> {
  guardrailFunction: (
    context: RunContextWrapper<TContext>,
    agent: Agent<any>,
    agentOutput: any
  ) => MaybeAwaitable<GuardrailFunctionOutput>;
  name?: string;

  constructor(
    guardrailFunction: (
      context: RunContextWrapper<TContext>,
      agent: Agent<any>,
      agentOutput: any
    ) => MaybeAwaitable<GuardrailFunctionOutput>,
    name?: string
  ) {
    this.guardrailFunction = guardrailFunction;
    this.name = name;
  }

  getName(): string {
    return this.name || this.guardrailFunction.name;
  }

  async run(
    context: RunContextWrapper<TContext>,
    agent: Agent<any>,
    agentOutput: any
  ): Promise<OutputGuardrailResult<TContext>> {
    if (typeof this.guardrailFunction !== 'function') {
      throw new UserError(`Guardrail function must be callable, got ${this.guardrailFunction}`);
    }

    const output = this.guardrailFunction(context, agent, agentOutput);
    if (output instanceof Promise) {
      return {
        guardrail: this,
        agent,
        agentOutput,
        output: await output,
      };
    }

    return {
      guardrail: this,
      agent,
      agentOutput,
      output,
    };
  }
}

export function inputGuardrail<TContext>(
  func: (
    context: RunContextWrapper<TContext>,
    agent: Agent<any>,
    input: string | TResponseInputItem[]
  ) => MaybeAwaitable<GuardrailFunctionOutput>
): InputGuardrail<TContext>;
export function inputGuardrail<TContext>(
  options: { name?: string }
): (
  func: (
    context: RunContextWrapper<TContext>,
    agent: Agent<any>,
    input: string | TResponseInputItem[]
  ) => MaybeAwaitable<GuardrailFunctionOutput>
) => InputGuardrail<TContext>;
export function inputGuardrail<TContext>(
  funcOrOptions:
    | ((
        context: RunContextWrapper<TContext>,
        agent: Agent<any>,
        input: string | TResponseInputItem[]
      ) => MaybeAwaitable<GuardrailFunctionOutput>)
    | { name?: string }
):
  | InputGuardrail<TContext>
  | ((
      func: (
        context: RunContextWrapper<TContext>,
        agent: Agent<any>,
        input: string | TResponseInputItem[]
      ) => MaybeAwaitable<GuardrailFunctionOutput>
    ) => InputGuardrail<TContext>) {
  if (typeof funcOrOptions === 'function') {
    return new InputGuardrail(funcOrOptions);
  }

  return (
    func: (
      context: RunContextWrapper<TContext>,
      agent: Agent<any>,
      input: string | TResponseInputItem[]
    ) => MaybeAwaitable<GuardrailFunctionOutput>
  ) => new InputGuardrail(func, funcOrOptions.name);
}

export function outputGuardrail<TContext>(
  func: (
    context: RunContextWrapper<TContext>,
    agent: Agent<any>,
    agentOutput: any
  ) => MaybeAwaitable<GuardrailFunctionOutput>
): OutputGuardrail<TContext>;
export function outputGuardrail<TContext>(
  options: { name?: string }
): (
  func: (
    context: RunContextWrapper<TContext>,
    agent: Agent<any>,
    agentOutput: any
  ) => MaybeAwaitable<GuardrailFunctionOutput>
) => OutputGuardrail<TContext>;
export function outputGuardrail<TContext>(
  funcOrOptions:
    | ((
        context: RunContextWrapper<TContext>,
        agent: Agent<any>,
        agentOutput: any
      ) => MaybeAwaitable<GuardrailFunctionOutput>)
    | { name?: string }
):
  | OutputGuardrail<TContext>
  | ((
      func: (
        context: RunContextWrapper<TContext>,
        agent: Agent<any>,
        agentOutput: any
      ) => MaybeAwaitable<GuardrailFunctionOutput>
    ) => OutputGuardrail<TContext>) {
  if (typeof funcOrOptions === 'function') {
    return new OutputGuardrail(funcOrOptions);
  }

  return (
    func: (
      context: RunContextWrapper<TContext>,
      agent: Agent<any>,
      agentOutput: any
    ) => MaybeAwaitable<GuardrailFunctionOutput>
  ) => new OutputGuardrail(func, funcOrOptions.name);
}
