import atexit

import {
  agentSpan,
  customSpan,
  functionSpan,
  generationSpan,
  getCurrentSpan,
  getCurrentTrace,
  guardrailSpan,
  handoffSpan,
  responseSpan,
  trace,
} from './create';
import { TracingProcessor } from './processor_interface';
import { defaultExporter, defaultProcessor } from './processors';
import { GLOBAL_TRACE_PROVIDER } from './setup';
import {
  AgentSpanData,
  CustomSpanData,
  FunctionSpanData,
  GenerationSpanData,
  GuardrailSpanData,
  HandoffSpanData,
  ResponseSpanData,
  SpanData,
} from './span_data';
import { Span, SpanError } from './spans';
import { Trace } from './traces';
import { genSpanId, genTraceId } from './util';

export {
  addTraceProcessor,
  agentSpan,
  customSpan,
  functionSpan,
  generationSpan,
  getCurrentSpan,
  getCurrentTrace,
  guardrailSpan,
  handoffSpan,
  responseSpan,
  setTraceProcessors,
  setTracingDisabled,
  trace,
  Trace,
  SpanError,
  Span,
  SpanData,
  AgentSpanData,
  CustomSpanData,
  FunctionSpanData,
  GenerationSpanData,
  GuardrailSpanData,
  HandoffSpanData,
  ResponseSpanData,
  TracingProcessor,
  genTraceId,
  genSpanId,
};

function addTraceProcessor(spanProcessor: TracingProcessor): void {
  GLOBAL_TRACE_PROVIDER.registerProcessor(spanProcessor);
}

function setTraceProcessors(processors: TracingProcessor[]): void {
  GLOBAL_TRACE_PROVIDER.setProcessors(processors);
}

function setTracingDisabled(disabled: boolean): void {
  GLOBAL_TRACE_PROVIDER.setDisabled(disabled);
}

function setTracingExportApiKey(apiKey: string): void {
  defaultExporter().setApiKey(apiKey);
}

addTraceProcessor(defaultProcessor());

atexit.register(GLOBAL_TRACE_PROVIDER.shutdown);
