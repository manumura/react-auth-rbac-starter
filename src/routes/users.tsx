import { EventSourceMessage } from '@microsoft/fetch-event-source';
import { AxiosError } from 'axios';
import { UUID } from 'crypto';
import { useEffect, useState } from 'react';
import { FaFacebook, FaUserAltSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { FiDelete, FiEdit, FiPlusCircle } from 'react-icons/fi';
import {
  ActionFunction,
  LoaderFunction,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useSubmit
} from 'react-router-dom';
import { toast } from 'react-toastify';
import DeleteUserModal from '../components/DeleteUserModal';
import { Pagination } from '../components/Pagination';
import appConfig from '../config/config';
import { appMessages } from '../config/constant';
import { deleteUser, getUsers } from '../lib/api';
import useMessageStore from '../lib/message-store';
import { processMessage, shouldProcessMessage, subscribe } from '../lib/sse';
import useUserStore from '../lib/user-store';
import { getCurrentUserFromStorage, isAdmin } from '../lib/utils';
import { ValidationError } from '../types/custom-errors';
import {
  IAuthenticatedUser,
  IOauthProvider,
  IUser,
} from '../types/custom-types';
import { OauthProvider } from '../types/provider.model';

export const loader: LoaderFunction<any> = async ({
  request,
}: {
  request: Request;
}) => {
  try {
    const currentUser = await getCurrentUserFromStorage();
    if (!currentUser || !isAdmin(currentUser)) {
      console.error('No logged in ADMIN user');
      return redirect('/');
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = appConfig.defaultRowsPerPage;
    // TODO filter by role
    const role = undefined;
    const { elements: users, totalElements } = await getUsers(
      page,
      pageSize,
      role
    );
    if (!users) {
      console.error('Invalid users');
      return redirect('/');
    }

    return { users, totalElements, page, pageSize, role };
  } catch (error) {
    console.error(error);
    return redirect('/');
  }
};

type DeleteUserResponse = {
  error: Error | undefined;
  user: IUser | undefined;
  time: number | undefined;
};

export const action: ActionFunction<any> = async ({
  request,
}: {
  request: Request;
}): Promise<DeleteUserResponse> => {
  const formData = await request.formData();
  const userUuid = formData.get('userUuid') as UUID;
  const time = new Date().getTime();

  try {
    if (!userUuid) {
      throw new ValidationError('Invalid form data', { userUuid });
    }

    const user = await deleteUser(userUuid);
    if (!user) {
      throw new ValidationError(`Invalid user: ${userUuid}`, { userUuid });
    }

    return { user, error: undefined, time };
  } catch (error) {
    // You cannot `useLoaderData` in an errorElemen
    console.error(error);
    let message = 'Unknown error';
    if (error instanceof AxiosError && error.response?.data.message) {
      message = error.response.data.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return { user: undefined, error: new Error(message), time };
  }
};

export default function Users() {
  const userSore = useUserStore();
  const currentUser = userSore.user;
  const { users, totalElements, page, pageSize } = useLoaderData() as {
    users: IUser[];
    totalElements: number;
    page: number;
    pageSize: number;
    role: string;
  };
  const response = useActionData() as DeleteUserResponse;
  const userChangeEventAbortController = new AbortController();
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [usersToDisplay, setUsersToDisplay] = useState(users);
  const submit = useSubmit();
  const navigate = useNavigate();
  const message = useMessageStore().message;

  useEffect(() => {
    if (response?.error) {
      const time = response?.time;
      const toastId = `users-error-${time}`;
      if (!toast.isActive(toastId)) {
        toast(response.error?.message, {
          type: 'error',
          position: 'bottom-right',
        });
      }
    }

    if (response?.user) {
      const time = response?.time;
      const toastId = `users-success-${time}`;
      if (!toast.isActive(toastId)) {
        toast(`User deleted successfully ${response.user.email}`, {
          type: 'success',
          position: 'bottom-right',
        });
      }
    }
  }, [response]);

  useEffect(() => {
    if (message) {
      const toastId = `${message.type}-${message.id}`;
      const msg = appMessages[message.type as keyof typeof appMessages];
      useMessageStore.getState().clearMessage();

      if (!toast.isActive(toastId)) {
        toast(msg, {
          type: 'success',
          position: 'bottom-right',
          toastId,
        });
      }
    }
  }, [message]);

  useEffect(() => {
    setUsersToDisplay(users);
  }, [users]);

  useEffect(() => {
    subscribeUserChangeEvents();
    return () => {
      userChangeEventAbortController.abort();
      console.log(
        'Unsubscribed to user change events - signal aborted:',
        userChangeEventAbortController.signal.aborted
      );
    };
  }, []);

  const onPageSelect = (pageSelected: number): void => {
    navigate(`?page=${pageSelected}`);
  };

  const openDeleteModal = (user: IUser): void => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const onCloseDeleteModal = async (confirmed: boolean): Promise<void> => {
    setIsDeleteModalOpen(false);
    if (confirmed) {
      submit({ userUuid: selectedUser?.uuid }, { method: 'delete' });
    }
  };

  const onEditUser = (userUuid: UUID): void => {
    navigate(`${userUuid}`);
  };

  const onCreateUser = (): void => {
    navigate('/create-user');
  };

  const onMessage = (
    message: EventSourceMessage,
    currentUser: IAuthenticatedUser
  ) => {
    const shouldProcess =
      currentUser && shouldProcessMessage(message, currentUser);
    if (!shouldProcess) {
      return;
    }

    const event = processMessage(message);
    if (!event) {
      return;
    }

    console.log(event.message);
    const toastType = event.eventType === 'USER_DELETED' ? 'warning' : 'info';
    toast(event.message, {
      type: toastType,
      position: 'bottom-right',
      autoClose: false,
    });

    if (event.eventType === 'USER_UPDATED') {
      const userFromEvent = event.user;
      const userIndex = usersToDisplay.findIndex(
        (u: IUser) => u.uuid === userFromEvent.uuid
      );

      if (userIndex !== -1) {
        usersToDisplay[userIndex] = userFromEvent;
        setUsersToDisplay([...usersToDisplay]);

        hightlightRow(userFromEvent.uuid);
      }
    }
  };

  const hightlightRow = (userUuid: string) => {
    const row = document.getElementById('user-' + userUuid);
    if (row) {
      row.classList.add('highlight-row');
      row.onanimationend = () => {
        row.classList.remove('highlight-row');
      };
    }
  };

  async function subscribeUserChangeEvents() {
    if (!currentUser) {
      console.error('Invalid current user');
      return;
    }

    console.log('Subscribing to user change events');
    subscribe(
      `${appConfig.baseUrl}/api/v1/events/users`,
      userChangeEventAbortController,
      onMessage,
      currentUser
    );
  }

  const isUserListEmpty = !usersToDisplay || usersToDisplay.length <= 0;
  const noUserRow = (
    <tr>
      <td colSpan={5} className='text-center font-bold'>
        No Users found
      </td>
    </tr>
  );

  const userRows = usersToDisplay?.map((user: IUser) => {
    const providers = user.providers?.map((oauthProvider: IOauthProvider) => {
      let icon;
      if (oauthProvider.provider === OauthProvider.Facebook) {
        icon = <FaFacebook className='text-2xl' />;
      } else if (oauthProvider.provider === OauthProvider.Google) {
        icon = <FcGoogle className='text-2xl' />;
      }

      return (
        <div className='flex items-center' key={oauthProvider.externalUserId}>
          {icon && <div className='pr-2'>{icon}</div>}
          <div>{oauthProvider.email}</div>
        </div>
      );
    });

    const email = user.email ? <div>{user.email}</div> : providers;

    return (
      <tr key={user.uuid} id={`user-${user.uuid}`}>
        <th>
          {!user.isActive ? (
            <FaUserAltSlash size={24} color='red' title='Inactive user' />
          ) : null}
        </th>
        <th>{user.uuid}</th>
        <td>{user.name}</td>
        <td>{email}</td>
        <td>{user.role}</td>
        <td>
          <div className='flex justify-end space-x-1'>
            <button
              className='btn btn-primary btn-sm gap-2'
              onClick={(): void => onEditUser(user.uuid)}
            >
              <FiEdit />
              Edit
            </button>
            <button
              className='btn btn-accent btn-sm gap-2'
              onClick={(): void => openDeleteModal(user)}
            >
              <FiDelete />
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  });

  const usersTable = (
    <div className='flex flex-col items-center'>
      <div className='mt-10 overflow-x-auto rounded-lg bg-slate-50 p-10 md:container md:mx-auto'>
        <table className='table table-zebra w-full'>
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>
                <div className='flex justify-end space-x-1'>
                  <button className='btn gap-2' onClick={onCreateUser}>
                    <FiPlusCircle />
                    Create User
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>{!isUserListEmpty ? userRows : noUserRow}</tbody>
        </table>
        <div className='flex justify-end'>
          {!isUserListEmpty && (
            <Pagination
              currentPage={page}
              onPageSelect={onPageSelect}
              rowsPerPage={pageSize}
              totalElements={totalElements}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section className='h-section bg-slate-200'>
      {usersTable}
      {selectedUser && (
        <DeleteUserModal
          user={selectedUser}
          isOpen={isDeleteModalOpen}
          onClose={onCloseDeleteModal}
        />
      )}
    </section>
  );
}
