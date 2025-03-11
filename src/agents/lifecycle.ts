import { Agent } from './agent';
import { RunContextWrapper, TContext } from './run_context';
import { Tool } from './tool';

export class RunHooks<TContext> {
  async onAgentStart(context: RunContextWrapper<TContext>, agent: Agent<TContext>): Promise<void> {
    // Called before the agent is invoked. Called each time the current agent changes.
  }

  async onAgentEnd(
    context: RunContextWrapper<TContext>,
    agent: Agent<TContext>,
    output: any
  ): Promise<void> {
    // Called when the agent produces a final output.
  }

  async onHandoff(
    context: RunContextWrapper<TContext>,
    fromAgent: Agent<TContext>,
    toAgent: Agent<TContext>
  ): Promise<void> {
    // Called when a handoff occurs.
  }

  async onToolStart(
    context: RunContextWrapper<TContext>,
    agent: Agent<TContext>,
    tool: Tool
  ): Promise<void> {
    // Called before a tool is invoked.
  }

  async onToolEnd(
    context: RunContextWrapper<TContext>,
    agent: Agent<TContext>,
    tool: Tool,
    result: string
  ): Promise<void> {
    // Called after a tool is invoked.
  }
}

export class AgentHooks<TContext> {
  async onStart(context: RunContextWrapper<TContext>, agent: Agent<TContext>): Promise<void> {
    // Called before the agent is invoked. Called each time the running agent is changed to this agent.
  }

  async onEnd(
    context: RunContextWrapper<TContext>,
    agent: Agent<TContext>,
    output: any
  ): Promise<void> {
    // Called when the agent produces a final output.
  }

  async onHandoff(
    context: RunContextWrapper<TContext>,
    agent: Agent<TContext>,
    source: Agent<TContext>
  ): Promise<void> {
    // Called when the agent is being handed off to. The `source` is the agent that is handing off to this agent.
  }

  async onToolStart(
    context: RunContextWrapper<TContext>,
    agent: Agent<TContext>,
    tool: Tool
  ): Promise<void> {
    // Called before a tool is invoked.
  }

  async onToolEnd(
    context: RunContextWrapper<TContext>,
    agent: Agent<TContext>,
    tool: Tool,
    result: string
  ): Promise<void> {
    // Called after a tool is invoked.
  }
}
