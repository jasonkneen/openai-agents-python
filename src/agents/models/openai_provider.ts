import { AsyncOpenAI, DefaultAsyncHttpxClient } from "openai";
import { Model, ModelProvider } from "./interface";
import { OpenAIChatCompletionsModel } from "./openai_chatcompletions";
import { OpenAIResponsesModel } from "./openai_responses";

const DEFAULT_MODEL = "gpt-4o";

let _http_client: DefaultAsyncHttpxClient | null = null;

function sharedHttpClient(): DefaultAsyncHttpxClient {
  if (_http_client === null) {
    _http_client = new DefaultAsyncHttpxClient();
  }
  return _http_client;
}

export class OpenAIProvider implements ModelProvider {
  private _client: AsyncOpenAI;
  private _use_responses: boolean;

  constructor({
    api_key,
    base_url,
    openai_client,
    organization,
    project,
    use_responses,
  }: {
    api_key?: string;
    base_url?: string;
    openai_client?: AsyncOpenAI;
    organization?: string;
    project?: string;
    use_responses?: boolean;
  } = {}) {
    if (openai_client) {
      if (api_key || base_url) {
        throw new Error("Don't provide api_key or base_url if you provide openai_client");
      }
      this._client = openai_client;
    } else {
      this._client = new AsyncOpenAI({
        api_key: api_key || process.env.OPENAI_API_KEY,
        base_url,
        organization,
        project,
        http_client: sharedHttpClient(),
      });
    }

    this._use_responses = use_responses ?? true;
  }

  get_model(model_name: string | null): Model {
    if (!model_name) {
      model_name = DEFAULT_MODEL;
    }

    return this._use_responses
      ? new OpenAIResponsesModel(model_name, this._client)
      : new OpenAIChatCompletionsModel(model_name, this._client);
  }
}
