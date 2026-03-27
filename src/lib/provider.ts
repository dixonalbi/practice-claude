import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_0`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: { promptTokens: 50, completionTokens: 30 },
      };
      return;
    }

    // Step 2: Create App.jsx with import
    if (toolMessageCount === 1) {
      const text = `Now let me create the App.jsx entry point.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCodeWithImport(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: { promptTokens: 50, completionTokens: 30 },
      };
      return;
    }

    // Step 3: Final summary
    if (toolMessageCount >= 2) {
      const text = `I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: { promptTokens: 50, completionTokens: 50 },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-stone-50 to-orange-50/30 rounded-3xl shadow-xl shadow-stone-200/50 ring-1 ring-black/[0.03] overflow-hidden">
        <div className="border-t-4 border-amber-400" />
        <div className="pt-10 pb-8 px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 mb-2">Get in touch</p>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">Send us a message</h2>
          <p className="mt-2 text-sm text-stone-500">We'd love to hear from you. Fill out the form below.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
          <div>
            <label htmlFor="name" className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Jane Doe"
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border-0 ring-1 ring-stone-200 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="jane@example.com"
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border-0 ring-1 ring-stone-200 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-1.5">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Tell us what's on your mind..."
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border-0 ring-1 ring-stone-200 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all duration-200 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 px-6 rounded-xl font-semibold tracking-wide hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 transition-all duration-200 shadow-lg shadow-amber-500/25"
          >
            {submitted ? 'Message Sent!' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `import React from 'react';

const Card = ({
  title = "Welcome to Our Service",
  description = "Discover amazing features and capabilities that will transform your experience.",
  imageUrl,
  actions
}) => {
  return (
    <div className="group bg-gradient-to-b from-white to-stone-50/80 rounded-3xl shadow-xl shadow-stone-200/40 ring-1 ring-black/[0.04] overflow-hidden hover:shadow-2xl hover:shadow-stone-300/40 transition-all duration-300">
      {imageUrl && (
        <div className="overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="pt-8 pb-7 px-7">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block w-8 h-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-500">Featured</span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-2 group-hover:text-violet-700 transition-colors duration-200">{title}</h3>
        <p className="text-sm leading-relaxed text-stone-500">{description}</p>
        {actions && (
          <div className="mt-6 pt-5 border-t border-black/[0.04]">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-3xl shadow-xl shadow-indigo-100/50 ring-1 ring-black/[0.04] p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-1 text-center">Live Counter</p>
      <h2 className="text-xl font-bold tracking-tight text-slate-900 text-center mb-8">Track Your Progress</h2>

      <div className="flex items-center justify-center mb-10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full blur-2xl opacity-20 scale-150" />
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-5xl font-bold text-white tabular-nums">{count}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setCount(c => c - 1)}
          className="w-14 h-14 rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-sm text-rose-500 font-bold text-xl hover:bg-rose-50 hover:ring-rose-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 transition-all duration-150"
        >
          −
        </button>
        <button
          onClick={() => setCount(0)}
          className="h-14 px-6 rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-sm text-slate-400 text-sm font-medium uppercase tracking-wider hover:bg-slate-50 hover:text-slate-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 transition-all duration-150"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xl shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-all duration-150"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getAppCode(componentName: string): string {
    return `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-orange-50/30 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <p className="text-center text-stone-400 text-sm">Loading component...</p>
      </div>
    </div>
  );
}`;
  }

  private getAppCodeWithImport(componentName: string): string {
    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-violet-50/20 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Card
          title="Stellar Dashboard"
          description="Monitor your analytics in real-time with beautiful visualizations and actionable insights."
          actions={
            <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-purple-700 active:scale-[0.98] transition-all duration-200">
              Explore Now
              <span>&rarr;</span>
            </button>
          }
        />
      </div>
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-indigo-50/20 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <${componentName} />
      </div>
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log("No ANTHROPIC_API_KEY found, using mock provider");
    return new MockLanguageModel("mock-claude-sonnet-4-0");
  }

  return anthropic(MODEL);
}
