import { CredentialResponse } from "@react-oauth/google";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { FormProvider, useForm } from "react-hook-form";
import { IoEyeOffSharp, IoEyeSharp } from "react-icons/io5";
import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  redirect,
  useActionData,
  useFetcher,
  useNavigation,
  useSubmit,
} from "react-router-dom";
import { toast } from "react-toastify";
import FacebookLoginButton from "../components/FacebookLoginButton";
import FormInput from "../components/FormInput";
import GoogleLoginButton from "../components/GoogleLoginButton";
import LoadingSpinner from "../components/LoadingSpinner";
import appConfig from "../config/config";
import { appConstant, appMessages, errorMessages } from "../config/constant";
import { login, validateRecaptcha } from "../lib/api";
import { getUserFromIdToken } from "../lib/jwt.utils";
import useMessageStore from "../lib/message-store";
import { saveIdToken } from "../lib/storage";
import useUserStore from "../lib/user-store";
import { getCurrentUserFromStorage } from "../lib/user-utils";
import { ValidationError } from "../types/custom-errors";

export const loader: LoaderFunction = async () => {
  try {
    let currentUser = useUserStore.getState().user;
    if (!currentUser) {
      currentUser = await getCurrentUserFromStorage();
      useUserStore.getState().setUser(currentUser);
    }
    if (currentUser) {
      console.error("User already logged in");
      return redirect("/");
    }

    return { currentUser };
  } catch (error) {
    console.error(error);
    return redirect("/");
  }
};

export const action: ActionFunction = async ({
  request,
}: {
  request: Request;
}): Promise<
  | Response
  | {
      error: Error | undefined;
    }
> => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const token = formData.get("token") as string;

  try {
    if (!email || !password) {
      throw new ValidationError("Invalid form data", { email, password });
    }

    if (!token) {
      throw new ValidationError("Recaptcha token not found", {
        email,
        password,
      });
    }

    const isCaptchaValid = await validateRecaptcha(token);
    if (!isCaptchaValid) {
      throw new ValidationError("Captcha validation failed", {
        email,
        password,
      });
    }

    const response = await login(email, password);
    if (!response) {
      throw new ValidationError("Invalid response", { email, password });
    }

    const { idToken } = response;
    if (!idToken) {
      throw new ValidationError("Invalid response", { email, password });
    }

    const user = await getUserFromIdToken(idToken);
    if (!user) {
      throw new ValidationError("Invalid user", { email, password });
    }

    saveIdToken(idToken);
    useUserStore.getState().setUser(user);
    const time = Date.now();

    useMessageStore.getState().setMessage({
      type: appMessages.LOGIN_SUCCESS.type,
      text: appMessages.LOGIN_SUCCESS.text.replace("${name}", user.name),
      id: time,
    });
    return redirect("/");
  } catch (error) {
    // You cannot `useLoaderData` in an errorElement
    console.error(error);
    let message = "Unknown error";
    if (error instanceof AxiosError && error.response?.data) {
      const msg = error.response.data.message;
      if (msg === errorMessages.INVALID_EMAIL_OR_PASSWORD.code) {
        message = errorMessages.INVALID_EMAIL_OR_PASSWORD.text;
      } else if (msg === errorMessages.EMAIL_NOT_VERIFIED.code) {
        message = errorMessages.EMAIL_NOT_VERIFIED.text;
      } else {
        message = msg;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    return { error: new Error(message) };
  }
};

function SubmitButton({
  isValid,
  isLoading,
}: {
  isValid: boolean;
  isLoading: boolean;
}): React.ReactElement {
  const btn = <button className="btn btn-primary w-full">Login</button>;
  const btnDisabled = (
    <button className="btn btn-disabled btn-primary w-full">Login</button>
  );
  const btnLoading = (
    <button className="btn btn-disabled btn-primary w-full">
      <span className="loading loading-spinner"></span>
      Login
    </button>
  );

  return !isValid ? btnDisabled : isLoading ? btnLoading : btn;
}

export default function Login(): React.ReactElement {
  const navigation = useNavigation();
  const response = useActionData() as {
    error: Error | undefined;
  };
  const submit = useSubmit();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const message = useMessageStore().message;

  const fetcher = useFetcher();
  const error = fetcher.data?.error;
  const isLoading =
    navigation.state === "submitting" || fetcher.state === "submitting";

  const iconEye = <IoEyeSharp size={24} className="cursor-pointer" />;
  const iconEyeOff = <IoEyeOffSharp size={24} className="cursor-pointer" />;
  const [type, setType] = useState("password");
  const [icon, setIcon] = useState(iconEyeOff);

  const onPasswordToggle = () => {
    if (type === "password") {
      setIcon(iconEye);
      setType("text");
    } else {
      setIcon(iconEyeOff);
      setType("password");
    }
  };

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
    if (response?.error) {
      toast(response.error?.message, {
        type: "error",
        position: "bottom-right",
      });
    }
  }, [response]);

  useEffect(() => {
    if (error) {
      toast("Login failed", {
        type: "error",
        position: "bottom-right",
      });
    }
  }, [error]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!executeRecaptcha) {
      toast("Recaptcha not loaded", {
        type: "error",
        position: "bottom-right",
      });
      return;
    }
    const token = await executeRecaptcha("onSubmit");
    const { email, password } = getValues();

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("token", token);
    submit(formData, { method: "post" });
  };

  const methods = useForm({
    mode: "all",
  });
  const {
    getValues,
    formState: { isValid },
  } = methods;

  const emailConstraints = {
    required: { value: true, message: "Email is required" },
    pattern: {
      value: appConstant.EMAIL_VALIDATION_REGEX,
      message: "Email is invalid",
    },
  };
  const passwordConstraints = {
    required: { value: true, message: "Password is required" },
  };

  const onGoogleLoginFailed = () => {
    toast("Login failed", {
      type: "error",
      position: "bottom-right",
    });
  };

  const onGoogleLoginSuccess = (
    credentialResponse: CredentialResponse | null,
  ) => {
    if (!credentialResponse?.credential) {
      toast("Login failed", {
        type: "error",
        position: "bottom-right",
      });
      return;
    }

    const payload = { token: credentialResponse.credential };
    fetcher.submit(payload, { method: "post", action: "/oauth/google" });
  };

  const onFacebookLoginClicked = () => {
    const url = appConfig.baseUrl + "/api/v1/oauth2/facebook";
    window.location.href = url;

    // Open the URL in a new window
    // const width = 600;
    // const height = 600;
    // const left = window.screen.width / 2 - width / 2;
    // const top = window.screen.height / 2 - height / 2;
    // const features = `width=${width},height=${height},left=${left},top=${top},popup=yes`;
    // window.open(url, 'facebookLoginWindow', features);
  };

  return (
    <section className="h-section py-20 w-full bg-slate-200">
      <FormProvider {...methods}>
        <Form
          // method='post'
          onSubmit={(event) => onSubmit(event)}
          id="login-form"
          className="mx-auto w-full max-w-md space-y-5 p-8 overflow-hidden rounded-2xl bg-slate-50 shadow-lg"
        >
          <h1 className="mb-4 text-center text-4xl font-[600]">
            Login to MyApp
          </h1>
          <FormInput
            label="Email"
            name="email"
            type="email"
            constraints={emailConstraints}
          />
          <FormInput
            label="Password"
            name="password"
            type={type}
            constraints={passwordConstraints}
            iconEnd={icon}
            onClickIconEnd={onPasswordToggle}
          />
          <div className="text-right">
            <Link to="/forgot-password" className="text-secondary">
              Forgot Password?
            </Link>
          </div>
          <SubmitButton isValid={isValid} isLoading={isLoading} />
          <span className="block">
            Need an account?{" "}
            <Link to="/register" className="text-secondary">
              Sign Up Here
            </Link>
          </span>
          <div className="divider">OR</div>
          {isLoading ? (
            <LoadingSpinner label="Loading" isHorizontal={true} />
          ) : (
            <>
              <GoogleLoginButton
                onGoogleLoginSuccess={onGoogleLoginSuccess}
                onGoogleLoginFailed={onGoogleLoginFailed}
              />
              <FacebookLoginButton onClick={onFacebookLoginClicked} />
            </>
          )}
        </Form>
      </FormProvider>
    </section>
  );
}
