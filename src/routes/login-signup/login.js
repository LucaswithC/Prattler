import { h } from "preact";
import style from "./style.css";
import { Link, route } from "preact-router";
import { useEffect, useState } from "preact/hooks";

import { useQuery, useQueryClient } from "react-query";

import LoginImg from "../../assets/images/login-img.jpg";
import AppLogo from "../../assets/icons/AppLogo.svg";
import GoogleMark from "../../assets/brands/Google-Mark.png";
import GitHubMark from "../../assets/brands/GitHub-Mark.png";
import Loader from "../../components/loader/loader";

import pb from "../../_pocketbase/connect";

const Login = () => {
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return pb.authStore?.model
  }, {
    retry: false
  });

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwVisibility, setPwVisibility] = useState(false);

  const [generalError, setGeneralError] = useState("");

  const [loading, setLoading] = useState(false);

  const [resetPw, setResetPw] = useState(false)

  useEffect(() => {
    if (!!user) { route("/") }
  }, [user]);

  useEffect(async () => {
    if(user && !user?.isValid) {
      pb.authStore.clear()
      queryClient.invalidateQueries("currentUser")
      location.reload();
    }
  }, [userStatus])

  function login(e) {
    e.preventDefault();
    setLoading(true);
    setGeneralError("");

    pb.collection('users').authWithPassword(email, pw).then((user) => {
      queryClient.invalidateQueries("currentUser")
    }).catch((error) => {
      setGeneralError(
        error?.data?.data?.email?.message || error?.data?.data?.password?.message || error?.data?.data?.username?.message || error?.message || "Something went wrong"
      );
      setLoading(false)
    });
  }

  return (
    <div class={style.login}>
      <div class={style["login-img-cont"]}>
        <img src={LoginImg} />
      </div>
      <div class={style["login-right"]}>
        <div class={style["login-header"]}>
          <img src={AppLogo} class={style.logo} />
          <Link href="/" class="button sec">
            Back
          </Link>
        </div>
        <div class={style["login-outer"]}>
        <div class={style["login-form-cont"]}>
          <h2 class="accent">Login</h2>
          <p class="m-0">Login to start posting and to get connected with People all over the World!</p>
          {generalError.length > 0 && (
            <p class={"small " + style.error}>
              <i class="fa-regular fa-circle-xmark"></i> {generalError}
            </p>
          )}
          <form class={style["login-form"]} onSubmit={login}>
            <label>Email</label>
            <input name="email" type="email" placeholder="Your Email" value={email} onInput={(e) => setEmail(e.target.value)} />
            <label>Password</label>
            <div class={style["pw-cont"]}>
              <input name="password" type={pwVisibility ? "text" : "password"} placeholder="Your Password" value={pw} onInput={(e) => setPw(e.target.value)} />
              {pwVisibility ? (
                <i class="fa-solid fa-eye-slash" onClick={() => setPwVisibility(false)}></i>
              ) : (
                <i class="fa-solid fa-eye" onClick={() => setPwVisibility(true)}></i>
              )}
            </div>
            <p class={style["forgot-password"]} onClick={() => setResetPw(!resetPw)}>Forgot Password?</p>
            {/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email) &&
            pw.length >= 8 ? (
              <button type="submit" class={style.submit}>
                {loading && <i class={"fa-solid fa-spinner " + style["login-loader"]}></i>} Login
              </button>
            ) : (
              <button type="button" class={"button disabled " + style.submit}>
                Login
              </button>
            )}
          </form>
          <p class="smaller">
            You don't have an Account yet?{" "}
            <Link href="/signup" class="link">
              Signup now
            </Link>
          </p>
        </div>
        {resetPw && <ForgotPassword />}
        </div>
      </div>
    </div>
  );
};

export default Login;

const ForgotPassword = () => {
  const [message, setMessage] = useState([])
  const [loading, setLoading] = useState(false)

  function resetPassword(e) {
    e.preventDefault()
    setLoading(true)
    let email = e.target.elements.email.value;

    pb.collection('users').requestPasswordReset(email).then(res => {
      setLoading(false)
      setMessage([true, "Please check your inbox to reset your password"])
    }).catch(error => {
      setLoading(false)
      setMessage(error.message)
    });
  }

  return (
  <div class={style["forgot-outer"]}>
    <div class={style["forgot-inner"] + " " + style["login-form-cont"] + " mt-2"}>
      <h2 class="accent">Reset Password</h2>
      {message.length > 0 && <p class={"small mt-0 " + (message[0] ? style.success : style.error)}>{message[1]}</p>}
      <p class="m-0">Enter your Email that is connected to your account to get a new Password</p>
      <form onSubmit={resetPassword}>
        <label>Email</label>
        <input tyoe="email" placeholder="Your Email" name="email"></input>
        <button type="submit" class={"mt-2 " + style.submit}>{loading && <Loader type={"text"} />} Reset Password</button>
      </form>
    </div>
  </div>
)};
