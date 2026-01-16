import { AxiosError } from "axios";
import { UUID } from "crypto";
import { useEffect, useState } from "react";
import { FaFacebook, FaUserAltSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { FiDelete, FiEdit, FiPlusCircle } from "react-icons/fi";
import {
  ActionFunction,
  LoaderFunction,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useSubmit,
} from "react-router-dom";
import { toast } from "react-toastify";
import DeleteUserModal from "../components/DeleteUserModal";
import { Pagination } from "../components/Pagination";
import appConfig from "../config/config";
import { appMessages, errorMessages } from "../config/constant";
import { deleteUser, getProfile, getUsers } from "../lib/api";
import useMessageStore from "../lib/message-store";
import useUserStore from "../lib/user-store";
import { isAdmin } from "../lib/user-utils";
import { ValidationError } from "../types/custom-errors";
import { IOauthProvider, IUser } from "../types/custom-types";
import { OauthProvider } from "../types/provider.model";

export const loader: LoaderFunction = async ({
  request,
}: {
  request: Request;
}) => {
  try {
    let currentUser = useUserStore.getState().user;
    if (!currentUser) {
      currentUser = await getProfile();
      useUserStore.getState().setUser(currentUser);
    }
    console.log(
      `===== Current user from loader: ${JSON.stringify(currentUser)} =====`
    );
    if (!currentUser || !isAdmin(currentUser)) {
      console.error("No logged in ADMIN user");
      return redirect("/");
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = appConfig.defaultRowsPerPage;
    // TODO filter by role
    const role = undefined;
    const { elements: users, totalElements } = await getUsers(
      page,
      pageSize,
      role
    );
    if (!users) {
      console.error("Invalid users");
      return redirect("/");
    }

    return { users, totalElements, page, pageSize, role };
  } catch (error) {
    console.error(error);
    return redirect("/");
  }
};

type DeleteUserResponse = {
  error: Error | undefined;
  user: IUser | undefined;
  time: number | undefined;
};

export const action: ActionFunction = async ({
  request,
}: {
  request: Request;
}): Promise<DeleteUserResponse> => {
  const formData = await request.formData();
  const userUuid = formData.get("userUuid") as UUID;

  try {
    if (!userUuid) {
      throw new ValidationError("Invalid form data", { userUuid });
    }

    const user = await deleteUser(userUuid);
    if (!user) {
      throw new ValidationError(`Invalid user: ${userUuid}`, { userUuid });
    }

    const time = Date.now();
    useMessageStore.getState().setMessage({
      type: appMessages.USER_DELETE_SUCCESS.type,
      text: appMessages.USER_DELETE_SUCCESS.text,
      id: time,
    });

    return { user, error: undefined, time };
  } catch (error) {
    // You cannot `useLoaderData` in an errorElemen
    console.error(error);
    let message = "Unknown error";
    if (error instanceof AxiosError && error.response?.data.message) {
      message = error.response.data.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    const time = Date.now();
    useMessageStore.getState().setMessage({
      type: errorMessages.USER_DELETE_FAILED.code,
      text: message,
      id: time,
    });

    return { user: undefined, error: new Error(message), time };
  }
};

export default function Users() {
  const { users, totalElements, page, pageSize } = useLoaderData();
  const response = useActionData() as DeleteUserResponse;
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [usersToDisplay, setUsersToDisplay] = useState(users);
  const submit = useSubmit();
  const navigate = useNavigate();
  const message = useMessageStore().message;

  useEffect(() => {
    console.log(`===== Action response: ${JSON.stringify(response)} =====`);
  }, [response]);

  useEffect(() => {
    if (message) {
      const toastId = `${message.type}-${message.id}`;
      const msg = message.text;
      useMessageStore.getState().clearMessage();

      if (!toast.isActive(toastId)) {
        toast(msg, {
          type: "success",
          position: "bottom-right",
          toastId,
        });
      }
    }
  }, [message]);

  useEffect(() => {
    setUsersToDisplay(users);
  }, [users]);

  const onPageSelect = (pageSelected: number): void => {
    navigate(`?page=${pageSelected}`);
  };

  const openDeleteModal = (user: IUser): void => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const onCloseDeleteModal = async (
    isProceedToDelete: boolean
  ): Promise<void> => {
    if (isProceedToDelete) {
      submit({ userUuid: selectedUser?.uuid }, { method: "delete" });
    }
    setSelectedUser(null);
    setIsDeleteModalOpen(false);
  };

  const onEditUser = (userUuid: UUID): void => {
    navigate(`${userUuid}`);
  };

  const onCreateUser = (): void => {
    navigate("/create-user");
  };

  // const hightlightRow = (userUuid: string) => {
  //   const row = document.getElementById('user-' + userUuid);
  //   if (row) {
  //     row.classList.add('highlight-row');
  //     row.onanimationend = () => {
  //       row.classList.remove('highlight-row');
  //     };
  //   }
  // };

  const isUserListEmpty = !usersToDisplay || usersToDisplay.length <= 0;
  const noUserRow = (
    <tr>
      <td colSpan={6} className="text-center font-bold">
        No Users found
      </td>
    </tr>
  );

  const userRows = usersToDisplay?.map((user: IUser) => {
    const providers = user.providers?.map((oauthProvider: IOauthProvider) => {
      let icon;
      if (oauthProvider.provider === OauthProvider.Facebook) {
        icon = <FaFacebook className="text-2xl" />;
      } else if (oauthProvider.provider === OauthProvider.Google) {
        icon = <FcGoogle className="text-2xl" />;
      }

      return (
        <div className="flex items-center" key={oauthProvider.externalUserId}>
          {icon && <div className="pr-2">{icon}</div>}
          <div>{oauthProvider.email}</div>
        </div>
      );
    });

    const email = user.email ? <div>{user.email}</div> : providers;

    return (
      <tr key={user.uuid} id={`user-${user.uuid}`}>
        <th>
          {!user.isActive ? (
            <FaUserAltSlash size={24} color="red" title="Inactive user" />
          ) : null}
        </th>
        <th>{user.uuid}</th>
        <td>{user.name}</td>
        <td>{email}</td>
        <td>{user.role}</td>
        <td>
          <div className="flex justify-end space-x-1">
            <button
              className="btn btn-primary btn-sm gap-2"
              onClick={(): void => onEditUser(user.uuid)}
            >
              <FiEdit />
              Edit
            </button>
            <button
              className="btn btn-accent btn-sm gap-2"
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
    <div className="flex flex-col items-center">
      <div className="mt-10 overflow-x-auto rounded-lg bg-slate-50 p-10 md:container md:mx-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>
                <div className="flex justify-end space-x-1">
                  <button className="btn gap-2" onClick={onCreateUser}>
                    <FiPlusCircle />
                    Create User
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>{!isUserListEmpty ? userRows : noUserRow}</tbody>
        </table>
        <div className="flex justify-end">
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
    <section className="h-section bg-slate-200">
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
