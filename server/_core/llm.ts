import OpenAI from "openai";
import { ENV } from "./env";

const openai = new OpenAI({
  apiKey: ENV.openaiApiKey,
});

export async function invokeLLM(params: {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  response_format?: OpenAI.Chat.ChatCompletionCreateParams["response_format"];
}): Promise<OpenAI.Chat.ChatCompletion> {
  return openai.chat.completions.create({
    model: "gpt-4",
    messages: params.messages,
    response_format: params.response_format,
    temperature: 0.4,
  });
}
