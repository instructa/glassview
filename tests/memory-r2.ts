type StoredObject = {
  body: ArrayBuffer;
  httpMetadata?: R2HTTPMetadata;
};

class MemoryR2Object {
  readonly body: ReadableStream<Uint8Array>;
  readonly httpMetadata?: R2HTTPMetadata;

  constructor(private readonly stored: StoredObject) {
    this.httpMetadata = stored.httpMetadata;
    this.body = new Response(stored.body).body as ReadableStream<Uint8Array>;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.stored.body.slice(0);
  }

  async text(): Promise<string> {
    return new TextDecoder().decode(this.stored.body);
  }

  async json<T>(): Promise<T> {
    return JSON.parse(await this.text()) as T;
  }
}

export class MemoryR2Bucket {
  readonly objects = new Map<string, StoredObject>();

  async get(key: string): Promise<MemoryR2Object | null> {
    const stored = this.objects.get(key);
    return stored ? new MemoryR2Object(stored) : null;
  }

  async put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: R2PutOptions,
  ): Promise<unknown> {
    if (value instanceof ReadableStream) {
      value = await new Response(value).arrayBuffer();
    }
    const bodySource =
      typeof value === "string"
        ? new TextEncoder().encode(value).buffer
        : ArrayBuffer.isView(value)
          ? value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
          : value;
    const body = copyArrayBuffer(bodySource);
    this.objects.set(key, {
      body,
      httpMetadata: options?.httpMetadata instanceof Headers ? undefined : options?.httpMetadata,
    });
    return {};
  }
}

function copyArrayBuffer(source: ArrayBuffer | SharedArrayBuffer): ArrayBuffer {
  const copy = new Uint8Array(source.byteLength);
  copy.set(new Uint8Array(source));
  return copy.buffer;
}
