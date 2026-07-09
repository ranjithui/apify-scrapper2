import { logger } from '../utils/logger.js';

/**
 * In-memory job queue (Phase 1).
 *
 * Processes tasks sequentially in the background so the API can return the
 * job id immediately. Phase 2 swaps this implementation for BullMQ + Redis
 * behind the same `enqueue` signature — no calling code changes.
 */
type Task = () => Promise<void>;

class InMemoryQueue {
  private queue: Task[] = [];
  private running = false;

  enqueue(task: Task): void {
    this.queue.push(task);
    void this.drain();
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      const task = this.queue.shift()!;
      try {
        await task();
      } catch (err) {
        logger.error('[jobQueue] task threw', err);
      }
    }
    this.running = false;
  }
}

export const jobQueue = new InMemoryQueue();
