# OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight yet powerful framework for building multi-agent workflows.

<img src="https://cdn.openai.com/API/docs/images/orchestration.png" alt="Image of the Agents Tracing UI" style="max-height: 803px;">

### Core concepts:

1. [**Agents**](https://openai.github.io/openai-agents-python/agents): LLMs configured with instructions, tools, guardrails, and handoffs
2. [**Handoffs**](https://openai.github.io/openai-agents-python/handoffs/): Allow agents to transfer control to other agents for specific tasks
3. [**Guardrails**](https://openai.github.io/openai-agents-python/guardrails/): Configurable safety checks for input and output validation
4. [**Tracing**](https://openai.github.io/openai-agents-python/tracing/): Built-in tracking of agent runs, allowing you to view, debug and optimize your workflows

Explore the [examples](examples) directory to see the SDK in action, and read our [documentation](https://openai.github.io/openai-agents-python/) for more details.

## Get started

1. Set up your Node.js environment

```
npm install
```

2. Install Agents SDK

```
npm install openai-agents
```

## Hello world example

```typescript
import { Agent, Runner } from 'agents';

const agent = new Agent({ name: "Assistant", instructions: "You are a helpful assistant" });

Runner.run(agent, "Write a haiku about recursion in programming.").then(result => {
    console.log(result.finalOutput);
});

// Code within the code,
// Functions calling themselves,
// Infinite loop's dance.
```

(_If running this, ensure you set the `OPENAI_API_KEY` environment variable_)

## Handoffs example

```typescript
import { Agent, Runner } from 'agents';

const spanishAgent = new Agent({
    name: "Spanish agent",
    instructions: "You only speak Spanish.",
});

const englishAgent = new Agent({
    name: "English agent",
    instructions: "You only speak English",
});

const triageAgent = new Agent({
    name: "Triage agent",
    instructions: "Handoff to the appropriate agent based on the language of the request.",
    handoffs: [spanishAgent, englishAgent],
});

Runner.run(triageAgent, "Hola, ¿cómo estás?").then(result => {
    console.log(result.finalOutput);
    // ¡Hola! Estoy bien, gracias por preguntar. ¿Y tú, cómo estás?
});
```

## Functions example

```typescript
import { Agent, Runner, functionTool } from 'agents';

const getWeather = functionTool({
    name: "getWeather",
    description: "Get the weather for a city",
    parameters: {
        city: { type: "string" }
    },
    handler: (params) => {
        return `The weather in ${params.city} is sunny.`;
    }
});

const agent = new Agent({
    name: "Hello world",
    instructions: "You are a helpful agent.",
    tools: [getWeather],
});

Runner.run(agent, "What's the weather in Tokyo?").then(result => {
    console.log(result.finalOutput);
    // The weather in Tokyo is sunny.
});
```

## The agent loop

When you call `Runner.run()`, we run a loop until we get a final output.

1. We call the LLM, using the model and settings on the agent, and the message history.
2. The LLM returns a response, which may include tool calls.
3. If the response has a final output (see below for the more on this), we return it and end the loop.
4. If the response has a handoff, we set the agent to the new agent and go back to step 1.
5. We process the tool calls (if any) and append the tool responses messsages. Then we go to step 1.

There is a `maxTurns` parameter that you can use to limit the number of times the loop executes.

### Final output

Final output is the last thing the agent produces in the loop.

1.  If you set an `outputType` on the agent, the final output is when the LLM returns something of that type. We use [structured outputs](https://platform.openai.com/docs/guides/structured-outputs) for this.
2.  If there's no `outputType` (i.e. plain text responses), then the first LLM response without any tool calls or handoffs is considered as the final output.

As a result, the mental model for the agent loop is:

1. If the current agent has an `outputType`, the loop runs until the agent produces structured output matching that type.
2. If the current agent does not have an `outputType`, the loop runs until the current agent produces a message without any tool calls/handoffs.

## Common agent patterns

The Agents SDK is designed to be highly flexible, allowing you to model a wide range of LLM workflows including deterministic flows, iterative loops, and more. See examples in [`examples/agent_patterns`](examples/agent_patterns).

## Tracing

The Agents SDK automatically traces your agent runs, making it easy to track and debug the behavior of your agents. Tracing is extensible by design, supporting custom spans and a wide variety of external destinations, including [Logfire](https://logfire.pydantic.dev/docs/integrations/llms/openai/#openai-agents), [AgentOps](https://docs.agentops.ai/v1/integrations/agentssdk), and [Braintrust](https://braintrust.dev/docs/guides/traces/integrations#openai-agents-sdk). For more details about how to customize or disable tracing, see [Tracing](http://openai.github.io/openai-agents-python/tracing).

## Development (only needed if you need to edit the SDK/examples)

0. Ensure you have [`uv`](https://docs.astral.sh/uv/) installed.

```bash
uv --version
```

1. Install dependencies

```bash
make sync
```

2. (After making changes) lint/test

```
make tests  # run tests
make lint   # run linter
make build  # build TypeScript code
```

## Acknowledgements

We'd like to acknowledge the excellent work of the open-source community, especially:

-   [Pydantic](https://docs.pydantic.dev/latest/) (data validation) and [PydanticAI](https://ai.pydantic.dev/) (advanced agent framework)
-   [MkDocs](https://github.com/squidfunk/mkdocs-material)
-   [Griffe](https://github.com/mkdocstrings/griffe)
-   [uv](https://github.com/astral-sh/uv) and [ruff](https://github.com/astral-sh/ruff)

We're committed to continuing to build the Agents SDK as an open source framework so others in the community can expand on our approach.
