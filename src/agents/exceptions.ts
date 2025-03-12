import { InputGuardrailResult, OutputGuardrailResult } from './guardrail';

export class AgentsException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'AgentsException';
  }
}

export class MaxTurnsExceeded extends AgentsException {
  constructor(message: string) {
    super(message);
    this.name = 'MaxTurnsExceeded';
  }
}

export class ModelBehaviorError extends AgentsException {
  constructor(message: string) {
    super(message);
    this.name = 'ModelBehaviorError';
  }
}

export class UserError extends AgentsException {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

export class InputGuardrailTripwireTriggered extends AgentsException {
  guardrailResult: InputGuardrailResult;

  constructor(guardrailResult: InputGuardrailResult) {
    super(`Guardrail ${guardrailResult.guardrail.constructor.name} triggered tripwire`);
    this.guardrailResult = guardrailResult;
    this.name = 'InputGuardrailTripwireTriggered';
  }
}

export class OutputGuardrailTripwireTriggered extends AgentsException {
  guardrailResult: OutputGuardrailResult;

  constructor(guardrailResult: OutputGuardrailResult) {
    super(`Guardrail ${guardrailResult.guardrail.constructor.name} triggered tripwire`);
    this.guardrailResult = guardrailResult;
    this.name = 'OutputGuardrailTripwireTriggered';
  }
}
