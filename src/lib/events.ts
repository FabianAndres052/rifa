import { EventEmitter } from 'events';

// Manejador global de eventos para streaming SSE en memoria
const globalForEvents = globalThis as unknown as {
  realtimeEmitter: EventEmitter | undefined;
};

export const realtimeEmitter =
  globalForEvents.realtimeEmitter ?? new EventEmitter();

realtimeEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.realtimeEmitter = realtimeEmitter;
}

export function notifyRaffleUpdate(type: string, data?: unknown) {
  realtimeEmitter.emit('raffle_update', {
    type,
    data,
    timestamp: new Date().toISOString(),
  });
}
