import { EventSourceMessage } from '@microsoft/fetch-event-source';
import { UUID } from 'crypto';
import { toast } from 'react-toastify';
import appConfig from '../config/config';
import { UserEventMessage } from '../types/custom-types';
import { UserEventType } from '../types/user-event.model';
import { shouldProcessMessage, subscribe } from './sse';

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
  const shouldProcess =
    currentUserUuid && shouldProcessMessage(message, currentUserUuid);
  if (!shouldProcess) {
    return;
  }

  const event = handleUserEvent(message);
  if (!event) {
    return;
  }

  const toastType = event.eventType === 'USER_DELETED' ? 'warning' : 'info';
  toast(event.message, {
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

const handleUserEvent = (
  message: EventSourceMessage
): UserEventMessage | null => {
  const data = JSON.parse(message.data);
  const type = message.event;
  console.log(`Processing message: ${JSON.stringify(message)}`);

  let msg = '';
  const userFromEvent = data.user;
  if (!userFromEvent) {
    console.error(`Invalid user data: ${data}`);
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
