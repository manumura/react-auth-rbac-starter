import {
  EventSourceMessage,
  EventStreamContentType,
  fetchEventSource,
} from '@microsoft/fetch-event-source';
import { UUID } from 'crypto';
import { appConstant } from '../config/constant';
import { FatalError, RetriableError } from '../types/custom-errors';
import { getSavedUserEvents, saveUserEvents } from './storage';

const maxRetries = 10;

// Can try : https://github.com/EventSource/eventsource
export async function subscribe(
  url: string,
  abortController: AbortController,
  onMessage: (message: EventSourceMessage, currentUserUuid: UUID) => void,
  currentUserUuid: UUID
) {
  let retryCount = 0;

  try {
    await fetchEventSource(url, {
      credentials: 'include',
      signal: abortController.signal,
      async onopen(response) {
        if (
          response.ok &&
          response.headers
            .get('content-type')
            ?.startsWith(EventStreamContentType)
        ) {
          // everything's good
          console.log('===== Connection opened successfully =====');
          retryCount = 0;
          // return;
        } else if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          // client-side errors are usually non-retriable:
          console.error(`===== Fatal error on open: ${JSON.stringify(response)} =====`);
          throw new FatalError();
        } else {
          console.error(`===== Retriable error on open: ${JSON.stringify(response)} =====`);
          throw new RetriableError();
        }
      },
      onmessage(message) {
        // if the server emits an error message, throw an exception
        // so it gets handled by the onerror callback below:
        if (message.event === 'FatalError') {
          throw new FatalError(message.data);
        }

        onMessage(message, currentUserUuid);
      },
      onclose() {
        console.error('===== Connection closed unexpectedly =====');
        // if the server closes the connection unexpectedly, retry:
        throw new RetriableError();
      },
      onerror(error) {
        console.error(`===== Fetch event source error: ${error} =====`);
        if (error instanceof FatalError) {
          console.error('===== Fatal error: closing stream =====');
          // rethrow to stop the operation
          throw error;
        } else {
          console.error(`===== Retry count: ${retryCount} =====`);
          // do nothing to automatically retry. You can also return a specific retry interval here.
          if (retryCount >= maxRetries) {
            console.error('===== Max retries reached: closing stream =====');
            throw error;
          }
          retryCount++;
        }
      },
    });
  } catch (error) {
    console.error(`===== Error while subscribing to event stream: ${JSON.stringify(error)} =====`);
  }
}

export const shouldProcessMessage = (
  message: EventSourceMessage,
  currentUserUuid: UUID
): boolean => {
  if (!message.event || !message.data || !message.id) {
    console.error('Invalid message:', message);
    return false;
  }

  const data = JSON.parse(message.data);
  const auditUserUuid = data.auditUserUuid;

  if (auditUserUuid === currentUserUuid) {
    console.warn('Ignoring event from current user');
    return false;
  }

  // Store notifications to prevent duplicate notifications
  const savedUserEventsMap = getSavedUserEvents() || new Map<UUID, string[]>();
  const events = savedUserEventsMap?.get(currentUserUuid) || [];

  if (events.includes(message.id)) {
    console.warn('Event already processed:', message.id);
    return false;
  }

  const newEvents = [message.id, ...events];
  // Clear old events
  if (newEvents.length >= appConstant.MAX_USER_EVENTS_TO_STORE) {
    newEvents.pop();
  }
  savedUserEventsMap.set(currentUserUuid, newEvents);
  saveUserEvents(savedUserEventsMap);

  return true;
};
