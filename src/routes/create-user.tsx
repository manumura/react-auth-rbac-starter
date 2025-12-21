import { AxiosError } from "axios";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  ActionFunction,
  Form,
  LoaderFunction,
  redirect,
  useActionData,
  useNavigate,
  useNavigation,
} from "react-router-dom";
import { toast } from "react-toastify";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import { appMessages } from "../config/constant";
import { createUser, getProfile } from "../lib/api";
import useMessageStore from "../lib/message-store";
import useUserStore from "../lib/user-store";
import { isAdmin } from "../lib/user-utils";
import { ValidationError } from "../types/custom-errors";

export const loader: LoaderFunction<any> = async () => {
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

    return { currentUser };
  } catch (error) {
    console.error(error);
    return redirect("/");
  }
};

export const action: ActionFunction<any> = async ({
  request,
}: {
  request: Request;
}): Promise<
  | Response
  | {
      error: Error | undefined;
      time: number | undefined;
    }
> => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const time = new Date().getTime();

  try {
    if (!name || !email || !role) {
      throw new ValidationError("Invalid form data", { email, name, role });
    }

    const user = await createUser(email, name, role);
    if (!user) {
      throw new ValidationError("Invalid user", { email, name, role });
    }

    useMessageStore.getState().setMessage({
      type: appMessages.USER_CREATE_SUCCESS.type,
      text: appMessages.USER_CREATE_SUCCESS.text,
      id: time,
    });
    return redirect("/users");
  } catch (error) {
    // You cannot `useLoaderData` in an errorElemen
    console.error(error);
    let message = "Unknown error";
    if (error instanceof AxiosError && error.response?.data.message) {
      message = error.response.data.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return { error: new Error(message), time };
  }
};

function SubmitButton({
  isValid,
  isLoading,
}: {
  isValid: boolean;
  isLoading: boolean;
}): React.ReactElement {
  const btn = <button className="btn btn-primary mx-1">Save</button>;
  const btnDisabled = (
    <button className="btn btn-disabled btn-primary mx-1">Save</button>
  );
  const btnLoading = (
    <button className="btn btn-disabled btn-primary mx-1">
      <span className="loading loading-spinner"></span>
      Save
    </button>
  );

  return !isValid ? btnDisabled : isLoading ? btnLoading : btn;
}

export default function CreateUser(): React.ReactElement {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const response = useActionData() as {
    error: Error | undefined;
    time: number | undefined;
  };
  const isLoading = navigation.state === "submitting";

  const methods = useForm({
    mode: "all",
  });

  const {
    formState: { isValid },
  } = methods;

  useEffect(() => {
    if (response?.error) {
      const time = response.time ?? new Date().getTime();
      const message = response.error?.message;
      const toastId = `${message}-${time}`;

      if (message && !toast.isActive(toastId)) {
        toast(message, {
          type: "error",
          position: "bottom-right",
          toastId,
        });
      }
    }
  }, [response]);

  const onCancel = (): void => {
    navigate(-1);
  };

  const nameConstraints = {
    required: { value: true, message: "Full Name is required" },
    minLength: {
      value: 5,
      message: "Full Name is min 5 characters",
    },
  };
  const emailConstraints = {
    required: { value: true, message: "Email is required" },
  };
  const roleConstraints = {
    required: { value: true, message: "Role is required" },
  };

  const roles = [
    { label: "--- Please select a role ---", value: "" },
    { label: "Admin", value: "ADMIN" },
    { label: "User", value: "USER" },
  ];

  return (
    <section className="h-section bg-slate-200 py-20">
      <div className="w-full">
        <FormProvider {...methods}>
          <Form
            method="post"
            id="create-user-form"
            className="mx-auto w-full max-w-md space-y-5 overflow-hidden rounded-2xl bg-slate-50 p-8 shadow-lg"
          >
            <h2 className="mb-4 text-center text-2xl font-[600]">
              Create a new user
            </h2>
            <FormInput
              label="Full Name"
              name="name"
              constraints={nameConstraints}
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              constraints={emailConstraints}
            />
            <FormSelect
              label="Role"
              name="role"
              options={roles}
              constraints={roleConstraints}
            />
            <div className="flex justify-center space-x-5">
              <SubmitButton isValid={isValid} isLoading={isLoading} />
              <button
                type="button"
                id="btn-cancel"
                className={`btn btn-outline mx-1 ${
                  isLoading ? "btn-disabled" : ""
                }`}
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </Form>
        </FormProvider>
      </div>
    </section>
  );
}
