import { Agent } from './agent';
import { AgentOutputSchema } from './agent_output';
import { InputGuardrailResult, OutputGuardrailResult } from './guardrail';
import { ItemHelpers, ModelResponse, RunItem, TResponseInputItem } from './items';
import { InputGuardrailTripwireTriggered, MaxTurnsExceeded } from './exceptions';
import { StreamEvent } from './stream_events';
import { Trace } from './tracing';
import { QueueCompleteSentinel } from './_run_impl';
import { logger } from './logger';
import { Trace } from './tracing';
import { QueueCompleteSentinel } from './_run_impl';
import { logger } from './logger';

export abstract class RunResultBase {
  input: string | TResponseInputItem[];
  newItems: RunItem[];
  rawResponses: ModelResponse[];
  finalOutput: any;
  inputGuardrailResults: InputGuardrailResult[];
  outputGuardrailResults: OutputGuardrailResult[];

  constructor(
    input: string | TResponseInputItem[],
    newItems: RunItem[],
    rawResponses: ModelResponse[],
    finalOutput: any,
    inputGuardrailResults: InputGuardrailResult[],
    outputGuardrailResults: OutputGuardrailResult[]
  ) {
    this.input = input;
    this.newItems = newItems;
    this.rawResponses = rawResponses;
    this.finalOutput = finalOutput;
    this.inputGuardrailResults = inputGuardrailResults;
    this.outputGuardrailResults = outputGuardrailResults;
  }

  abstract get lastAgent(): Agent<any>;

  finalOutputAs<T>(cls: new (...args: any[]) => T, raiseIfIncorrectType = false): T {
    if (raiseIfIncorrectType && !(this.finalOutput instanceof cls)) {
      throw new TypeError(`Final output is not of type ${cls.name}`);
    }
    return this.finalOutput as T;
  }

  toInputList(): TResponseInputItem[] {
    const originalItems = ItemHelpers.inputToNewInputList(this.input);
    const newItems = this.newItems.map(item => item.toInputItem());
    return originalItems.concat(newItems);
  }
}

export class RunResult extends RunResultBase {
  private _lastAgent: Agent<any>;

  constructor(
    input: string | TResponseInputItem[],
    newItems: RunItem[],
    rawResponses: ModelResponse[],
    finalOutput: any,
    inputGuardrailResults: InputGuardrailResult[],
    outputGuardrailResults: OutputGuardrailResult[],
    lastAgent: Agent<any>
  ) {
    super(input, newItems, rawResponses, finalOutput, inputGuardrailResults, outputGuardrailResults);
    this._lastAgent = lastAgent;
  }

  get lastAgent(): Agent<any> {
    return this._lastAgent;
  }
}

export class RunResultStreaming extends RunResultBase {
  currentAgent: Agent<any>;
  currentTurn: number;
  maxTurns: number;
  finalOutput: any;
  private _currentAgentOutputSchema: AgentOutputSchema | null;
  private _trace: Trace | null;
  isComplete: boolean;
  private _eventQueue: AsyncQueue<StreamEvent | QueueCompleteSentinel>;
  private _inputGuardrailQueue: AsyncQueue<InputGuardrailResult>;
  private _runImplTask: Task<any> | null;
  private _inputGuardrailsTask: Task<any> | null;
  private _outputGuardrailsTask: Task<any> | null;
  private _storedException: Exception | null;

  constructor(
    input: string | TResponseInputItem[],
    newItems: RunItem[],
    rawResponses: ModelResponse[],
    finalOutput: any,
    inputGuardrailResults: InputGuardrailResult[],
    outputGuardrailResults: OutputGuardrailResult[],
    currentAgent: Agent<any>,
    currentTurn: number,
    maxTurns: number,
    currentAgentOutputSchema: AgentOutputSchema | null,
    trace: Trace | null
  ) {
    super(input, newItems, rawResponses, finalOutput, inputGuardrailResults, outputGuardrailResults);
    this.currentAgent = currentAgent;
    this.currentTurn = currentTurn;
    this.maxTurns = maxTurns;
    this.finalOutput = finalOutput;
    this._currentAgentOutputSchema = currentAgentOutputSchema;
    this._trace = trace;
    this.isComplete = false;
    this._eventQueue = new AsyncQueue<StreamEvent | QueueCompleteSentinel>();
    this._inputGuardrailQueue = new AsyncQueue<InputGuardrailResult>();
    this._runImplTask = null;
    this._inputGuardrailsTask = null;
    this._outputGuardrailsTask = null;
    this._storedException = null;
  }

  get lastAgent(): Agent<any> {
    return this.currentAgent;
  }

  async *streamEvents(): AsyncIterable<StreamEvent> {
    while (true) {
      this._checkErrors();
      if (this._storedException) {
        logger.debug('Breaking due to stored exception');
        this.isComplete = true;
        break;
      }

      if (this.isComplete && this._eventQueue.isEmpty()) {
        break;
      }

      try {
        const item = await this._eventQueue.dequeue();
        if (item instanceof QueueCompleteSentinel) {
          this._eventQueue.complete();
          this._checkErrors();
          break;
        }

        yield item;
        this._eventQueue.complete();
      } catch (error) {
        break;
      }
    }

    if (this._trace) {
      this._trace.finish(true);
    }

    this._cleanupTasks();

    if (this._storedException) {
      throw this._storedException;
    }
  }

  private _checkErrors() {
    if (this.currentTurn > this.maxTurns) {
      this._storedException = new MaxTurnsExceeded(`Max turns (${this.maxTurns}) exceeded`);
    }

    while (!this._inputGuardrailQueue.isEmpty()) {
      const guardrailResult = this._inputGuardrailQueue.dequeueSync();
      if (guardrailResult.output.tripwireTriggered) {
        this._storedException = new InputGuardrailTripwireTriggered(guardrailResult);
      }
    }

    if (this._runImplTask && this._runImplTask.isDone()) {
      const exc = this._runImplTask.getException();
      if (exc) {
        this._storedException = exc;
      }
    }

    if (this._inputGuardrailsTask && this._inputGuardrailsTask.isDone()) {
      const exc = this._inputGuardrailsTask.getException();
      if (exc) {
        this._storedException = exc;
      }
    }

    if (this._outputGuardrailsTask && this._outputGuardrailsTask.isDone()) {
      const exc = this._outputGuardrailsTask.getException();
      if (exc) {
        this._storedException = exc;
      }
    }
  }

  private _cleanupTasks() {
    if (this._runImplTask && !this._runImplTask.isDone()) {
      this._runImplTask.cancel();
    }

    if (this._inputGuardrailsTask && !this._inputGuardrailsTask.isDone()) {
      this._inputGuardrailsTask.cancel();
    }

    if (this._outputGuardrailsTask && !this._outputGuardrailsTask.isDone()) {
      this._outputGuardrailsTask.cancel();
    }
  }
}
