import { EventSourceMessage } from '@microsoft/fetch-event-source';
import { UUID } from 'crypto';
import { toast } from 'react-toastify';
import appConfig from '../config/config';
import { appConstant } from '../config/constant';
import {
  UserChangeEvent,
  UserEventMessage,
  UserEventPayload,
} from '../types/custom-types';
import { UserEventType } from '../types/user-event.model';
import { subscribe } from './sse';
import { getSavedUserEvents, saveUserEvents } from './storage';

export function subscribeUserChangeEventsWs(
  currentUserUuid: UUID,
  ws: WebSocket
) {
  if (!currentUserUuid) {
    console.error('Invalid current user');
    return;
  }

  ws.onopen = () => {
    console.log('===== WebSocket connection opened =====');
  };
  ws.onmessage = (event: MessageEvent<string>) => {
    console.log('===== WebSocket message received =====', event.data);
    const userChangeEvent = JSON.parse(event.data) as UserChangeEvent;

    if (!userChangeEvent) {
      console.error('Invalid data received from WebSocket');
      return;
    }

    const eventMessage = mapToUserEventMessage(
      userChangeEvent.data,
      userChangeEvent.type
    );
    if (!eventMessage) {
      console.error('Invalid event message received from WebSocket');
      return;
    }

    const toastType =
      eventMessage.eventType === 'USER_DELETED' ? 'warning' : 'info';
    toast(eventMessage.message, {
      type: toastType,
      position: 'bottom-right',
      autoClose: false,
    });
  };
  ws.onclose = () => {
    console.log('===== WebSocket connection closed =====');
  };
  ws.onerror = (error) => {
    console.error('===== WebSocket error =====', error);
  };
}

export async function subscribeUserChangeEvents(
  currentUserUuid: UUID,
  userChangeEventAbortController: AbortController
) {
  if (!currentUserUuid) {
    console.error('Invalid current user');
    return;
  }

  subscribe(
    `${appConfig.baseUrl}/api/v1/events/users`,
    userChangeEventAbortController,
    onMessage,
    currentUserUuid
  );
}

const onMessage = (message: EventSourceMessage, currentUserUuid: UUID) => {
  console.log(`Processing message: ${JSON.stringify(message)}`);
  const userChangeEvent =
    currentUserUuid && mapToUserChangeEvent(message, currentUserUuid);
  if (!userChangeEvent) {
    console.error('Invalid user change event:', message);
    return;
  }

  const eventMessage = mapToUserEventMessage(
    userChangeEvent.data,
    userChangeEvent.type
  );
  if (!eventMessage) {
    console.error('Invalid event message:', userChangeEvent);
    return;
  }

  const toastType =
    eventMessage.eventType === 'USER_DELETED' ? 'warning' : 'info';
  toast(eventMessage.message, {
    type: toastType,
    position: 'bottom-right',
    autoClose: false,
  });

  //   if (event.eventType === 'USER_UPDATED') {
  //     const userFromEvent = event.user;
  //     const userIndex = usersToDisplay.findIndex(
  //       (u: IUser) => u.uuid === userFromEvent.uuid
  //     );

  //     if (userIndex !== -1) {
  //       usersToDisplay[userIndex] = userFromEvent;
  //       setUsersToDisplay([...usersToDisplay]);

  //       hightlightRow(userFromEvent.uuid);
  //     }
  //   }
};

const mapToUserChangeEvent = (
  message: EventSourceMessage,
  currentUserUuid: UUID
): UserChangeEvent | null => {
  if (!message.event || !message.data || !message.id) {
    console.error('Invalid message:', message);
    return null;
  }

  const data = JSON.parse(message.data);
  const auditUserUuid = data.auditUserUuid;

  if (auditUserUuid === currentUserUuid) {
    console.warn('Ignoring event from current user');
    return null;
  }

  // Store notifications to prevent duplicate notifications
  const savedUserEventsMap = getSavedUserEvents() || new Map<UUID, string[]>();
  const events = savedUserEventsMap?.get(currentUserUuid) || [];

  if (events.includes(message.id)) {
    console.warn('Event already processed:', message.id);
    return null;
  }

  const newEvents = [message.id, ...events];
  // Clear old events
  if (newEvents.length >= appConstant.MAX_USER_EVENTS_TO_STORE) {
    newEvents.pop();
  }
  savedUserEventsMap.set(currentUserUuid, newEvents);
  saveUserEvents(savedUserEventsMap);

  return {
    id: message.id,
    type: message.event,
    data: {
      user: data.user,
      auditUserUuid: auditUserUuid,
    },
  };
};

const mapToUserEventMessage = (
  payload: UserEventPayload,
  type: string
): UserEventMessage | null => {
  let msg = '';
  const userFromEvent = payload.user;
  if (!userFromEvent) {
    console.error(`Invalid user data: ${payload}`);
    return null;
  }

  const name = userFromEvent.name ?? 'Unknown';
  const email = userFromEvent.email ?? userFromEvent.providers?.[0]?.email;

  if (type === UserEventType.USER_CREATED) {
    msg = `New user has been created: ${name} (${email}).`;
  }

  if (type === UserEventType.USER_UPDATED) {
    msg = `User has been updated: ${name} (${email}).`;
  }

  if (type === UserEventType.USER_DELETED) {
    msg = `User has been deleted: ${name} (${email}).`;
  }

  return { eventType: type, user: userFromEvent, message: msg };
};
