import { SimpleMutex, Worker } from "../SimpleMutex";

describe("SimpleMutex", () => {
  let mutex: SimpleMutex;

  beforeEach(() => {
    mutex = new SimpleMutex();
  });

  it("should run a single operation successfully", async () => {
    const operation = jest.fn().mockResolvedValue("result");
    const result = await mutex.run(operation);
    expect(operation).toHaveBeenCalled();
    expect(result).toBe("result");
  });

  it("should run operations exclusively", async () => {
    let resource = 0;
    const increment: Worker<void> = async () => {
      const current = resource;
      await new Promise((resolve) => setTimeout(resolve, 50)); // simulate async work
      resource = current + 1;
    };

    const ops = [
      mutex.run(increment),
      mutex.run(increment),
      mutex.run(increment),
    ];
    await Promise.all(ops);
    expect(resource).toBe(3);
  });

  it("should run operations in order", async () => {
    let order = 0;
    const createOp = (id: number) => async () => {
      expect(order).toBe(id);
      order += 1;
    };

    const ops = [
      mutex.run(createOp(0)),
      mutex.run(createOp(1)),
      mutex.run(createOp(2)),
    ];
    await Promise.all(ops);
  });

  it("should handle errors without affecting subsequent operations", async () => {
    const failingOperation = jest.fn().mockRejectedValue(new Error("Failed"));
    const succeedingOperation = jest.fn().mockResolvedValue("Success");

    await expect(mutex.run(failingOperation)).rejects.toThrow("Failed");
    const result = await mutex.run(succeedingOperation);

    expect(succeedingOperation).toHaveBeenCalled();
    expect(result).toBe("Success");
  });

  it("should release the lock correctly", async () => {
    const op1 = jest.fn().mockResolvedValue("First");
    const op2 = jest.fn().mockResolvedValue("Second");

    await mutex.run(op1);
    const result = await mutex.run(op2);

    expect(op1).toHaveBeenCalled();
    expect(result).toBe("Second");
  });

  it("should correctly update the internal state of a a class when used inside a method", async () => {
    class Counter {
      private value = 0;
      private mutex = new SimpleMutex();

      public async increment(): Promise<void> {
        await this.mutex.run(() => {
          this.value += 1;
        });
      }

      public getValue(): number {
        return this.value;
      }
    }

    const counter = new Counter();
    await counter.increment();

    expect(counter.getValue()).toBe(1);

    const ops = [counter.increment(), counter.increment(), counter.increment()];
    await Promise.all(ops);
    expect(counter.getValue()).toBe(4);
  });
});
