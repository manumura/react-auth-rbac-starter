import { FaFacebook } from "react-icons/fa";
import { LoaderFunction, redirect } from "react-router-dom";
import { appMessages } from "../config/constant";
import { getUserFromIdToken } from "../lib/jwt.utils";
import useMessageStore from "../lib/message-store";
import { saveIdToken } from "../lib/storage";
import useUserStore from "../lib/user-store";

export const loader: LoaderFunction = async ({
  request,
}: {
  request: Request;
}) => {
  // TODO do we need this ?
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const idToken = searchParams.get("id_token");

  if (!idToken) {
    throw new Error("Login failed. Please try again.");
  }

  const user = await getUserFromIdToken(idToken);
  if (!user) {
    throw new Error("Login failed. Please try again.");
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
};

// https://github.com/greatSumini/react-facebook-login/tree/master
// https://medium.com/@syedmahmad/login-with-facebook-meta-in-react-app-88efb7a9fc0a
export default function FacebookLoginButton({
  onClick,
}: {
  readonly onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      className="btn w-full bg-[#4267b2] hover:bg-[#3B5998] text-[#fff] text-md rounded-md"
      onClick={onClick}
    >
      <FaFacebook className="text-2xl" />
      <span>Continue with Facebook</span>
    </button>
  );
}
