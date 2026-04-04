// Stream replay utilities for SSE/streaming testing
// Provides tools to record, replay, and validate streaming events

import type { StreamEvent } from "@fusionaize/sdk-contracts";

export interface StreamRecording {
  events: StreamEvent[];
  metadata: {
    recordedAt: Date;
    durationMs: number;
    eventCount: number;
    source?: string;
    tags?: string[];
  };
}

export interface StreamReplayOptions {
  /** Delay between events in milliseconds */
  delayMs?: number;
  /** Maximum number of events to replay (default: all) */
  limit?: number;
  /** Whether to include event metadata in replay */
  includeMetadata?: boolean;
  /** Callback before each event is emitted */
  onEvent?: (event: StreamEvent, index: number) => void;
  /** Transform events before emitting */
  transform?: (event: StreamEvent) => StreamEvent;
}

export class StreamRecorder {
  private events: StreamEvent[] = [];
  private startTime?: Date;
  private endTime?: Date;
  private metadata: StreamRecording["metadata"];

  constructor(options?: { source?: string; tags?: string[] }) {
    this.metadata = {
      recordedAt: new Date(),
      durationMs: 0,
      eventCount: 0,
      source: options?.source,
      tags: options?.tags,
    };
  }

  start(): void {
    this.startTime = new Date();
    this.events = [];
  }

  record(event: StreamEvent): void {
    if (!this.startTime) {
      this.startTime = new Date();
    }

    this.events.push(event);
    this.metadata.eventCount = this.events.length;

    this.endTime = new Date();
    this.metadata.durationMs = this.endTime.getTime() - this.startTime.getTime();
  }

  recordMany(events: StreamEvent[]): void {
    for (const event of events) {
      this.record(event);
    }
  }

  stop(): StreamRecording {
    if (!this.startTime) {
      this.startTime = new Date();
    }

    if (!this.endTime) {
      this.endTime = new Date();
    }

    this.metadata.durationMs = this.endTime.getTime() - this.startTime.getTime();
    this.metadata.eventCount = this.events.length;

    return {
      events: [...this.events],
      metadata: { ...this.metadata },
    };
  }

  getRecording(): StreamRecording {
    return this.stop();
  }

  clear(): void {
    this.events = [];
    this.startTime = undefined;
    this.endTime = undefined;
    this.metadata.durationMs = 0;
    this.metadata.eventCount = 0;
  }
}

export class StreamReplayer {
  static fromRecording(
    recording: StreamRecording,
    options?: StreamReplayOptions,
  ): AsyncIterable<StreamEvent> {
    const events = options?.limit ? recording.events.slice(0, options.limit) : recording.events;

    const delayMs = options?.delayMs ?? 0;
    const transform = options?.transform ?? ((event) => event);

    async function* generate() {
      for (let i = 0; i < events.length; i++) {
        const originalEvent = events[i];
        options?.onEvent?.(originalEvent, i);

        const transformedEvent = transform(originalEvent);

        if (options?.includeMetadata) {
          yield {
            ...transformedEvent,
            _metadata: {
              recordingIndex: i,
              recordedAt: recording.metadata.recordedAt,
              originalType: originalEvent.type,
            },
          } as StreamEvent;
        } else {
          yield transformedEvent;
        }

        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    return generate();
  }

  static fromEvents(
    events: StreamEvent[],
    options?: StreamReplayOptions,
  ): AsyncIterable<StreamEvent> {
    const recording: StreamRecording = {
      events,
      metadata: {
        recordedAt: new Date(),
        durationMs: 0,
        eventCount: events.length,
      },
    };

    return this.fromRecording(recording, options);
  }

  static async collect<T extends StreamEvent>(stream: AsyncIterable<T>): Promise<T[]> {
    const events: T[] = [];
    for await (const event of stream) {
      events.push(event);
    }
    return events;
  }

  static async collectWithTimeout<T extends StreamEvent>(
    stream: AsyncIterable<T>,
    timeoutMs: number,
  ): Promise<T[]> {
    const events: T[] = [];
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Stream collection timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    });

    try {
      for await (const event of stream) {
        events.push(event);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("timed out")) {
        // Return events collected so far
        return events;
      }
      throw error;
    }

    return events;
  }
}

// SSE (Server-Sent Events) utilities
export class SSE {
  static formatEvent(event: StreamEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
  }

  static formatEvents(events: StreamEvent[]): string {
    return events.map((event) => this.formatEvent(event)).join("");
  }

  static parseEvent(line: string): StreamEvent | null {
    if (!line.startsWith("data: ")) {
      return null;
    }

    try {
      const json = line.substring(6); // Remove 'data: '
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  static async *parseStream(stream: AsyncIterable<string>): AsyncIterable<StreamEvent> {
    let buffer = "";

    for await (const chunk of stream) {
      buffer += chunk;

      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim() === "") continue;

        const event = this.parseEvent(line);
        if (event) {
          yield event;
        }
      }
    }

    // Process any remaining line in buffer
    if (buffer.trim()) {
      const event = this.parseEvent(buffer);
      if (event) {
        yield event;
      }
    }
  }

  static createMockStream(
    events: StreamEvent[],
    options?: StreamReplayOptions,
  ): AsyncIterable<string> {
    const eventStrings = events.map((event) => this.formatEvent(event));

    const delayMs = options?.delayMs ?? 0;

    async function* generate() {
      for (let i = 0; i < eventStrings.length; i++) {
        yield eventStrings[i];

        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    return generate();
  }
}

// Validation utilities
export class StreamValidator {
  static validateEventOrder(events: StreamEvent[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required start event
    const hasStart = events.some((e) => e.type === "run.start");
    if (!hasStart && events.length > 0) {
      warnings.push("Stream does not start with run.start event");
    }

    // Check for duplicate start events
    const startEvents = events.filter((e) => e.type === "run.start");
    if (startEvents.length > 1) {
      errors.push(`Multiple run.start events found: ${startEvents.length}`);
    }

    // Check event sequence logic
    let hasCompletion = false;
    let hasToolCall = false;
    let hasToolResult = false;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      switch (event.type) {
        case "run.start":
          // Start should be first
          if (i > 0) {
            warnings.push("run.start event is not the first event");
          }
          break;

        case "run.completion":
          hasCompletion = true;
          break;

        case "run.tool_call":
          hasToolCall = true;
          // Tool calls should come after start
          if (!events.slice(0, i).some((e) => e.type === "run.start")) {
            warnings.push("run.tool_call appears before run.start");
          }
          break;

        case "run.tool_result":
          hasToolResult = true;
          // Tool results should come after tool calls
          if (!hasToolCall) {
            warnings.push("run.tool_result appears before any run.tool_call");
          }
          break;

        case "run.finish":
          // Finish should be near the end
          if (i < events.length - 1) {
            const remaining = events.slice(i + 1);
            const hasImportantAfter = remaining.some(
              (e) =>
                e.type === "run.completion" ||
                e.type === "run.tool_call" ||
                e.type === "run.tool_result",
            );
            if (hasImportantAfter) {
              warnings.push("Events after run.finish may be ignored");
            }
          }
          break;

        case "run.error":
          // Error typically ends the stream
          if (i < events.length - 1) {
            warnings.push("Events after run.error may be ignored");
          }
          break;
      }
    }

    // Check for required finish/error event
    const hasFinish = events.some((e) => e.type === "run.finish");
    const hasError = events.some((e) => e.type === "run.error");
    if (!hasFinish && !hasError && events.length > 0) {
      warnings.push("Stream does not end with run.finish or run.error event");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static expectEventType(events: StreamEvent[], type: string, minCount = 1): void {
    const count = events.filter((e) => e.type === type).length;
    if (count < minCount) {
      throw new Error(`Expected at least ${minCount} ${type} events, found ${count}`);
    }
  }

  static expectEventSequence(events: StreamEvent[], sequence: string[]): void {
    const eventTypes = events.map((e) => e.type);

    for (let i = 0; i <= eventTypes.length - sequence.length; i++) {
      if (eventTypes.slice(i, i + sequence.length).join(",") === sequence.join(",")) {
        return; // Found sequence
      }
    }

    throw new Error(`Expected sequence ${sequence.join(" -> ")} not found in stream`);
  }
}

// Factory for common stream scenarios
export const streamScenarios = {
  simpleCompletion(): StreamEvent[] {
    return [
      { type: "run.start", data: { id: "run_1", model: "claude-3-haiku" } },
      { type: "run.completion", data: { content: "Hello" } },
      { type: "run.completion", data: { content: " world" } },
      { type: "run.finish", data: { finish_reason: "stop" } },
    ];
  },

  withToolCalls(): StreamEvent[] {
    return [
      { type: "run.start", data: { id: "run_1", model: "claude-3-haiku" } },
      { type: "run.completion", data: { content: "Let me get the weather" } },
      {
        type: "run.tool_call",
        data: {
          id: "tool_1",
          type: "function",
          function: { name: "get_weather", arguments: '{"location":"SF"}' },
        },
      },
      {
        type: "run.tool_result",
        data: {
          tool_call_id: "tool_1",
          output: '{"temperature":22,"condition":"sunny"}',
        },
      },
      { type: "run.completion", data: { content: "The weather is sunny" } },
      { type: "run.finish", data: { finish_reason: "stop" } },
    ];
  },

  withError(): StreamEvent[] {
    return [
      { type: "run.start", data: { id: "run_1", model: "claude-3-haiku" } },
      { type: "run.completion", data: { content: "Processing" } },
      { type: "run.error", data: { error: "Something went wrong" } },
    ];
  },

  rateLimited(): StreamEvent[] {
    return [
      { type: "run.start", data: { id: "run_1", model: "claude-3-haiku" } },
      { type: "run.error", data: { error: "Rate limit exceeded" } },
    ];
  },
};
