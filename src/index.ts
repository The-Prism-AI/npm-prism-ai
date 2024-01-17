import { KnowledgeBase, Knowledge } from "./types";
import { StreamingTextResponse } from "ai";

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class BaseClient {
  protected headers: any;
  protected api_url: string;

  constructor({ api_key, api_url }: { api_key: string; api_url: string }) {
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: api_key,
    };
    this.api_url = api_url;
  }
}

async function safeFetchCall<T>(
  request: Promise<Response>
): Promise<T | Error> {
  const response = await request;
  if (!response.ok) {
    return Error(response.statusText);
  }
  return await response.json();
}

class KnowledgeBaseClient extends BaseClient {
  async create({ name }: { name: string }): Promise<KnowledgeBase | Error> {
    const methodPath = this.api_url + "/users/knowledge_base/";
    return safeFetchCall(
      fetch(methodPath, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ name: name }),
      })
    );
  }

  async get({ kb_id }: { kb_id: number }): Promise<KnowledgeBase | Error> {
    const methodPath = this.api_url + "/users/knowledge_base/" + kb_id + "/";
    return safeFetchCall(
      fetch(methodPath, {
        method: "GET",
        headers: this.headers,
      })
    );
  }

  async delete({ kb_id }: { kb_id: number }): Promise<String | Error> {
    const methodPath = this.api_url + "/knowledge_base/" + kb_id + "/";
    return safeFetchCall(
      fetch(methodPath, {
        method: "DELETE",
        headers: this.headers,
      })
    );
  }
}

class KnowledgeClient extends BaseClient {
  async create({
    method,
    name,
    kb_id,
    url,
    text,
    recursion,
    max_recursion,
    only_base_url,
  }: {
    method: string;
    name: string;
    kb_id: number;
    url?: string;
    text?: string;
    recursion?: boolean;
    max_recursion?: number;
    only_base_url?: boolean;
  }): Promise<KnowledgeBase | Knowledge | Error> {
    function isValidURL(str: string): boolean {
      try {
        new URL(str);
        return true;
      } catch (_) {
        return false;
      }
    }
    let appendToMethodPath: string;
    let methodInput: string;
    let methodPath: string;

    interface KnowledgeCreateBody {
      name: string;
      url?: string;
      text?: string;
      recursion?: boolean; // default: false
      max_recursion?: number; // default: 10
      only_base_url?: boolean; // default: false
    }

    const body: KnowledgeCreateBody = {
      name: name,
    };

    switch (method) {
      case "url":
        if (!url || !isValidURL(url)) {
          throw new ValidationError("Invalid or missing URL.");
        }

        methodPath =
          this.api_url +
          "/users/knowledge_base/" +
          kb_id +
          "/knowledge_from_url/";

        body.url = url;
        if (recursion) body.recursion = recursion;
        if (max_recursion) body.max_recursion = max_recursion;
        if (only_base_url) body.only_base_url = only_base_url;
        break;

      case "text":
        if (!text) {
          throw new ValidationError("Missing text.");
        }

        methodPath =
          this.api_url +
          "/users/knowledge_base/" +
          kb_id +
          "/knowledge_from_text/";

        body.text = text;
        break;

      default:
        throw new ValidationError(
          "Invalid method. Must be 'url', 'text', or 'path'."
        );
    }
    return safeFetchCall(
      fetch(methodPath, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
      })
    );
  }

  async get({ knowledge_id }: { knowledge_id: number }): Promise<Knowledge | Error> {
    const methodPath = this.api_url + "/knowledge/" + knowledge_id + "/";
    return safeFetchCall(
      fetch(methodPath, {
        method: "GET",
        headers: this.headers,
      })
    );
  }

  async delete({ knowledge_id }: { knowledge_id: number }): Promise<string | Error> {
    const methodPath = this.api_url + "/knowledge/" + knowledge_id + "/";
    return safeFetchCall(
      fetch(methodPath, {
        method: "DELETE",
        headers: this.headers,
      })
    );
  }
}

class ReplyClient extends BaseClient {
  async create({
    prompt,
    conversation_id,
    knowledge_base,
    max_tokens,
    num_results,
    model,
  }: {
    prompt: string;
    conversation_id?: number;
    knowledge_base?: string;
    max_tokens?: number;
    num_results?: number;
    model?: string;
  }): Promise<Response | Error> {
    const methodPath = this.api_url + "/response/";

    const updatedHeadersForStream = {
      ...this.headers,
      Accept: "application/json",
    };

    interface CreateBody {
      user_prompt: string;
      conversation_id?: number;
      knowledge_base?: string;
      max_tokens?: number;
      num_results?: number;
      model?: string;
    }
    const body: CreateBody = {
      user_prompt: prompt,
    };
    if (conversation_id) body.conversation_id = conversation_id;
    if (knowledge_base) body.knowledge_base = knowledge_base;
    if (max_tokens) body.max_tokens = max_tokens;
    if (num_results) body.num_results = num_results;
    if (model) body.model = model;

    const response = await fetch(methodPath, {
      method: "POST",
      headers: updatedHeadersForStream,
      body: JSON.stringify(body),
    });

    if (!response.body) return new Error("No response body.");
    return response;
  }

  async stream({
    prompt,
    conversation_id,
    knowledge_base,
    max_tokens,
    num_results,
    model,
  }: {
    prompt: string;
    conversation_id?: number;
    knowledge_base?: string;
    max_tokens?: number;
    num_results?: number;
    model?: string;
  }): Promise<Response | Error> {
    const methodPath = this.api_url + "/response_stream/";

    const updatedHeadersForStream = {
      ...this.headers,
      Accept: "text/response-stream",
    };

    interface StreamBody {
      user_prompt: string;
      conversation_id?: number;
      knowledge_base?: string;
      max_tokens?: number;
      num_results?: number;
      model?: string;
    }
    const body: StreamBody = {
      user_prompt: prompt,
    };
    if (conversation_id) body.conversation_id = conversation_id;
    if (knowledge_base) body.knowledge_base = knowledge_base;
    if (max_tokens) body.max_tokens = max_tokens;
    if (num_results) body.num_results = num_results;
    if (model) body.model = model;

    const response = await fetch(methodPath, {
      method: "POST",
      headers: updatedHeadersForStream,
      body: JSON.stringify(body),
    });

    if (!response.body) return new Error("No response body.");
    return new StreamingTextResponse(response.body);
  }
}

export default function pai({
  api_key,
}: {
  api_key: string;
}) {
  const api_url = "https://api.prism-ai.ch";
  const knowledgeBaseClient = new KnowledgeBaseClient({ api_key, api_url });
  const knowledgeClient = new KnowledgeClient({ api_key, api_url });
  const replyClient = new ReplyClient({ api_key, api_url });

  return {
    KnowledgeBase: knowledgeBaseClient,
    Knowledge: knowledgeClient,
    Reply: replyClient,
  };
}
