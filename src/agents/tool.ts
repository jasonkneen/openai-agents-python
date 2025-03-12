import { MaybeAwaitable } from './_utils';
import { RunContextWrapper } from './run_context';
import { FunctionTool, FileSearchTool, WebSearchTool, ComputerTool } from './tool';
import { RunResult } from './result';
import { ItemHelpers } from './items';

export interface Tool {
  name: string;
  description: string;
  run: (context: RunContextWrapper, input: string) => MaybeAwaitable<string>;
}

export function function_tool(options: {
  nameOverride?: string;
  descriptionOverride?: string;
}) {
  return function (target: (context: RunContextWrapper, input: string) => MaybeAwaitable<string>) {
    const tool: Tool = {
      name: options.nameOverride || target.name,
      description: options.descriptionOverride || '',
      run: target,
    };
    return tool;
  };
}

export class FunctionTool implements Tool {
  name: string;
  description: string;
  run: (context: RunContextWrapper, input: string) => MaybeAwaitable<string>;

  constructor(name: string, description: string, run: (context: RunContextWrapper, input: string) => MaybeAwaitable<string>) {
    this.name = name;
    this.description = description;
    this.run = run;
  }
}

export class FileSearchTool implements Tool {
  name: string;
  description: string;
  run: (context: RunContextWrapper, input: string) => MaybeAwaitable<string>;

  constructor(name: string, description: string, run: (context: RunContextWrapper, input: string) => MaybeAwaitable<string>) {
    this.name = name;
    this.description = description;
    this.run = run;
  }
}

export class WebSearchTool implements Tool {
  name: string;
  description: string;
  run: (context: RunContextWrapper, input: string) => MaybeAwaitable<string>;

  constructor(name: string, description: string, run: (context: RunContextWrapper, input: string) => MaybeAwaitable<string>) {
    this.name = name;
    this.description = description;
    this.run = run;
  }
}

export class ComputerTool implements Tool {
  name: string;
  description: string;
  run: (context: RunContextWrapper, input: string) => MaybeAwaitable<string>;

  constructor(name: string, description: string, run: (context: RunContextWrapper, input: string) => MaybeAwaitable<string>) {
    this.name = name;
    this.description = description;
    this.run = run;
  }
}
