import { Usage } from './usage';

export class RunContextWrapper<TContext = any> {
  context: TContext;
  usage: Usage;

  constructor(context: TContext, usage: Usage = new Usage()) {
    this.context = context;
    this.usage = usage;
  }
}
