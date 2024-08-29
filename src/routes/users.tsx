import { EventSourceMessage } from '@microsoft/fetch-event-source';
import { UUID } from 'crypto';
import { useEffect, useState } from 'react';
import { FiDelete, FiEdit, FiPlusCircle } from 'react-icons/fi';
import { redirect, useLoaderData, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DeleteUserModal from '../components/DeleteUserModal';
import { Pagination } from '../components/Pagination';
import appConfig from '../config/config';
import { processMessage, shouldProcessMessage, subscribe } from '../lib/sse';
import { IUser } from '../types/custom-types';
import useUserStore from '../lib/user-store';
import { getUsers } from '../lib/api';

export const loader = async ({ request }: { request: Request }) => {
  try {
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
      console.error('Invalid users response');
      return redirect('/');
    }

    return { users, totalElements, page, pageSize, role };
  } catch (error) {
    console.error(error);
    return redirect('/');
  }
};

export default function Users() {
  const userSore = useUserStore();
  const currentUser = userSore.user;
  console.log('User store:', currentUser);
  const { users, totalElements, page, pageSize, role } = useLoaderData() as {
    users: IUser[];
    totalElements: number;
    page: number;
    pageSize: number;
    role: string;
  };
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [usersToDisplay, setUsersToDisplay] = useState(users);
  const navigate = useNavigate();

  const userChangeEventAbortController = new AbortController();

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

  const onCloseDeleteModal = async (success: boolean): Promise<void> => {
    setIsDeleteModalOpen(false);
    if (success) {
      // TODO Refresh users
      window.location.reload();
    }
  };

  const onEditUser = (userUuid: UUID): void => {
    navigate(`${userUuid}`);
  };

  const onCreateUser = (): void => {
    navigate('/create-user');
  };

  const onMessage = (message: EventSourceMessage) => {
    const shouldProcess =
      userSore.user && shouldProcessMessage(message, userSore.user);
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
    console.log('Subscribing to user change events');
    subscribe(
      `${appConfig.baseUrl}/api/v1/events/users`,
      userChangeEventAbortController,
      onMessage
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

  const userRows = usersToDisplay?.map((user: IUser) => (
    <tr key={user.uuid} id={`user-${user.uuid}`}>
      <th>{user.uuid}</th>
      <td>{user.name}</td>
      <td>{user.email}</td>
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
  ));

  const usersTable = (
    <div className='flex flex-col items-center'>
      <div className='mt-10 overflow-x-auto rounded-lg bg-slate-50 p-10 md:container md:mx-auto'>
        <table className='table table-zebra w-full'>
          <thead>
            <tr>
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
