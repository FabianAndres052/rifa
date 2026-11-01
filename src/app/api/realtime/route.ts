import { realtimeEmitter } from '@/lib/events';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Enviar mensaje de bienvenida / conexión establecida
      const welcome = `data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(welcome));

      // 2. Manejador de eventos en tiempo real
      const onRaffleUpdate = (eventData: unknown) => {
        try {
          const payload = `data: ${JSON.stringify(eventData)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error('Error enviando evento SSE:', err);
        }
      };

      realtimeEmitter.on('raffle_update', onRaffleUpdate);

      // 3. Heartbeat periódico cada 25 segundos para mantener viva la conexión
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 25000);

      // 4. Limpieza al desconectar
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        realtimeEmitter.off('raffle_update', onRaffleUpdate);
        try {
          controller.close();
        } catch {
          // Ya cerrado
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
