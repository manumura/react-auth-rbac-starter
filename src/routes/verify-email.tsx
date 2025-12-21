import clsx from "clsx";
import React from "react";
import {
  Await,
  LoaderFunction,
  redirect,
  useLoaderData,
} from "react-router-dom";
import { verifyEmail } from "../lib/api";
import useUserStore from "../lib/user-store";
import { getCurrentUserFromStorage } from "../lib/user-utils";

export const loader: LoaderFunction<any> = async ({
  request,
}: {
  request: Request;
}) => {
  let currentUser = useUserStore.getState().user;
  if (!currentUser) {
    currentUser = await getCurrentUserFromStorage();
    useUserStore.getState().setUser(currentUser);
  }
  if (currentUser) {
    console.error("User already logged in");
    return redirect("/");
  }

  const searchParams = new URL(request.url).searchParams;
  const token = searchParams.get("token");
  if (!token) {
    console.error("No token found");
    return redirect("/");
  }

  const data = verifyEmail(token)
    .then((user) => (user ? "success" : "failed"))
    .catch((error) => {
      console.error(error);
      return "failed";
    });
  return {
    data,
  };
};

export default function VerifyEmail(): React.ReactElement {
  const { data } = useLoaderData() as { data: Promise<string> };

  return (
    <section className="h-section bg-slate-200 pt-20">
      <div className="mx-auto flex h-[20rem] max-w-4xl flex-col items-center justify-center rounded-md bg-slate-50">
        <React.Suspense
          fallback={<p className="text-2xl font-semibold">Loading...</p>}
        >
          <Await
            resolve={data}
            errorElement={<MessageSection result="failed" />}
          >
            {(result) => <MessageSection result={result} />}
          </Await>
        </React.Suspense>
      </div>
    </section>
  );
}

function MessageSection({
  result,
}: {
  readonly result: string;
}): React.ReactElement {
  const success = result === "success";
  const message = success
    ? "Email verified successfully"
    : "Email verification failed";

  const messageBaseClasses = "text-2xl font-semibold";
  const messageClasses = success
    ? clsx(messageBaseClasses, " text-green-700")
    : clsx(messageBaseClasses, " text-red-700");

  return (
    <>
      <p className={messageClasses}>{message}</p>
      <div className="mt-4 text-xl">
        {success ? (
          <a href="/login">Click here to login</a>
        ) : (
          <a href="/">Click here to return to Home</a>
        )}
      </div>
    </>
  );
}
