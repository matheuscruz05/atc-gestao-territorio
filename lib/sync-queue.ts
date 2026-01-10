import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendCadastroToSheets } from "./google-sheets-sync";
import type { Cadastro } from "@/types/models";

const QUEUE_KEY = "@atc:sync_queue";
const PROCESS_INTERVAL_MS = 15 * 1000; // 15s

type QueueItem = {
  cadastro: Cadastro;
  enqueuedAt: number;
  attempts: number;
};

// Simple cross-platform subscriber list instead of Node EventEmitter
const subscribers = new Set<(count: number) => void>();
function emitChange(count: number) {
  subscribers.forEach((fn) => {
    try {
      fn(count);
    } catch (e) {
      console.warn("sync-queue: subscriber error", e);
    }
  });
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let isProcessing = false;

let memoryQueue: QueueItem[] | null = null;

async function getQueue(): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const q = raw ? (JSON.parse(raw) as QueueItem[]) : [];
    // If memoryQueue exists (node fallback), merge
    if (memoryQueue && memoryQueue.length) {
      return [...q, ...memoryQueue];
    }
    return q;
  } catch (e) {
    // Fallback to in-memory queue (Node environment / tests)
    if (memoryQueue === null) memoryQueue = [];
    console.warn("sync-queue: AsyncStorage unavailable, using in-memory queue");
    return memoryQueue;
  }
}

async function setQueue(q: QueueItem[]) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    emitChange(q.length);
  } catch (e) {
    // Fallback to in-memory queue
    if (memoryQueue === null) memoryQueue = [];
    memoryQueue = q;
    console.warn("sync-queue: AsyncStorage unavailable, storing queue in memory");
    emitChange(q.length);
  }
}

export async function enqueueCadastro(cadastro: Cadastro) {
  const q = await getQueue();
  q.push({ cadastro, enqueuedAt: Date.now(), attempts: 0 });
  await setQueue(q);
}

export async function dequeueOne(): Promise<void> {
  const q = await getQueue();
  if (q.length === 0) return;
  q.shift();
  await setQueue(q);
}

export async function getPendingCount(): Promise<number> {
  const q = await getQueue();
  return q.length;
}

export function subscribePendingCount(fn: (count: number) => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export async function processQueueOnce() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const q = await getQueue();
    if (q.length === 0) return;

    // Try items sequentially
    for (let i = 0; i < q.length; i++) {
      const item = q[i];
      try {
        const res = await sendCadastroToSheets(item.cadastro);
        if (res.success) {
          // remove this item
          q.splice(i, 1);
          i--; // adjust index
        } else {
          // increment attempts and keep it
          item.attempts = (item.attempts || 0) + 1;
          // If attempts too many, drop to avoid infinite loop
          if (item.attempts >= 5) {
            console.warn("sync-queue: dropping item after too many attempts", item);
            q.splice(i, 1);
            i--;
          }
        }
      } catch (e) {
        console.warn("sync-queue: error processing item", e);
        item.attempts = (item.attempts || 0) + 1;
        if (item.attempts >= 5) {
          console.warn("sync-queue: dropping item after error attempts", item);
          q.splice(i, 1);
          i--;
        }
      }
    }

    await setQueue(q);
  } finally {
    isProcessing = false;
  }
}

export function startQueueWorker() {
  // Start interval if not already started
  if (intervalHandle) return;
  // Trigger an immediate pass
  processQueueOnce().catch((e) => console.warn("sync-queue: initial process error", e));
  intervalHandle = setInterval(() => {
    processQueueOnce().catch((e) => console.warn("sync-queue: process error", e));
  }, PROCESS_INTERVAL_MS);
}

export function stopQueueWorker() {
  if (!intervalHandle) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
}

// Expose for manual testing
export default {
  enqueueCadastro,
  processQueueOnce,
  startQueueWorker,
  stopQueueWorker,
  getPendingCount,
  subscribePendingCount,
};
