export interface Releaser {
  (): void;
}

export interface Worker<T> {
  (): Promise<T> | T;
}

export class SimpleMutex {
  private queue: Array<() => void> = [];
  private pending = false;

  async run<T>(callback: Worker<T>): Promise<T> {
    const release = await this._acquire();

    try {
      return await Promise.resolve(callback());
    } finally {
      release();
    }
  }

  private _next(): void {
    if (this.queue.length > 0) {
      this.pending = true;
      const _next = this.queue.shift();
      if (_next) {
        _next();
      }
    } else {
      this.pending = false;
    }
  }

  private _acquire(): Promise<Releaser> {
    const ticket = new Promise<Releaser>((resolve) => {
      this.queue.push(() => resolve(() => this._next()));
    });

    if (!this.pending) {
      this._next();
    }

    return ticket;
  }
}
