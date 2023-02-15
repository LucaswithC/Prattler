import { h } from "preact";
import style from "./style.css";
import { Link, route } from "preact-router";
import { useEffect, useState } from "preact/hooks";
import { useQuery, useQueryClient } from "react-query";

import SignupImg from "../../assets/images/signup-img.jpg";
import AppLogo from "../../assets/icons/AppLogo.svg";
import GoogleMark from "../../assets/brands/Google-Mark.png";
import GitHubMark from "../../assets/brands/GitHub-Mark.png";

import pb from "../../_pocketbase/connect";
import { signupUser } from "../../_pocketbase/services/Users";

let emailCheckTimeout;

const SignUp = () => {
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery(
    "currentUser",
    async () => {
      return pb.authStore?.model;
    },
    {
      retry: false,
    }
  );

  const [pw, setPw] = useState("");
  const [pwStatus, setpwStatus] = useState(false);
  const [pwVisibility, setPwVisibility] = useState(false);

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(false);
  const [usernameError, setUsernameError] = useState(false);

  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState(true);
  const [emailError, setEmailError] = useState("");

  const [generalError, setGeneralError] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!!user) route("/profile");
  }, [user]);

  useEffect(async () => {
    if (user && !user.isValid) {
      pb.authStore.clear();
      queryClient.invalidateQueries("currentUser");
      location.reload();
    }
  }, [userStatus]);

  useEffect(() => {
    if (pw.length > 0 && pw.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/g)) {
      setpwStatus(true);
    } else {
      setpwStatus(false);
    }
  }, [pw]);

  useEffect(() => {
    setUsernameError("");
    if (username.length > 0 && !/[^a-zA-Z0-9 ]/.test(username) && !username.match(/[ ]/g) && username.match(/^.{4,20}$/g)) {
      setUsernameStatus(true);
    } else {
      setUsernameStatus(false);
    }
  }, [username]);

  useEffect(() => {
    clearTimeout(emailCheckTimeout);
    if (email.length === 0) {
      setEmailError("");
    }
    if (/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email)) {
      setEmailStatus(true);
    } else if (email.length === 0) {
      setEmailStatus(false);
    } else {
      setEmailStatus(false);
    }
    let timeout = emailError.length > 0 ? 0 : 1000;
    emailCheckTimeout = setTimeout(() => {
      if (/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email)) {
        setEmailError("");
      } else if (email.length === 0) {
        setEmailError("");
      } else {
        setEmailError("Please provide a real Email-Adress");
      }
    }, timeout);
  }, [email]);

  function createUser(e) {
    e.preventDefault();
    setLoading(true);
    setEmailError("");
    setUsernameError("");
    setGeneralError("");

    let formData = e.target.elements;

    var newUser = {};
    newUser.email = formData.email.value;
    newUser.password = formData.password.value;
    newUser.username = formData.username.value;
    newUser.name = formData.username.value;

    signupUser(newUser)
      .then((user) => {
        pb.collection("users")
          .authWithPassword(email, pw)
          .then((user) => {
            queryClient.invalidateQueries("currentUser");
          })
          .catch((error) => {
            setLoading(false);
            console.log(error);
          });
      })
      .catch((error) => {
        setGeneralError(
          error?.data?.data?.email?.message || error?.data?.data?.password?.message || error?.data?.data?.username?.message || error?.message || "Something went wrong"
        );
        setPw("");
        setLoading(false);
      });
  }

  return (
    <div class={style.login}>
      <div class={style["login-img-cont"]}>
        <img src={SignupImg} />
      </div>
      <div class={style["login-right"]}>
        <div class={style["login-header"]}>
          <img src={AppLogo} class={style.logo} />
          <button onclick={() => history.back()} class="button sec">
            Back
          </button>
        </div>
        <div class={style["login-form-cont"]}>
          <h2 class="accent">Signup</h2>
          <p class="m-0">Lets start posting with your own personal account and spread your thoughts into the world!</p>
          {generalError.length > 0 && (
            <p class={"small " + style.error}>
              <i class="fa-regular fa-circle-xmark"></i> {generalError}
            </p>
          )}
          <form class={style["login-form"]} onSubmit={createUser}>
            <label>Username</label>
            <input
              name="username"
              type="text"
              placeholder="Your Username"
              value={username}
              onInput={(e) => setUsername(e.target.value)}
              autocomplete="off"
              autofocus
              class={usernameError.length > 0 && style["error-box"]}
            />
            {usernameError.length > 0 && (
              <p class={"smaller m-0 " + style.error + " " + style["error-message"]}>
                <i class="fa-regular fa-circle-xmark"></i> {usernameError}
              </p>
            )}
            {username.length > 0 && (
              <div class={style["input-req"]}>
                {!/[^a-zA-Z0-9 ]/.test(username) ? (
                  <div class={"smaller " + style.correct}>
                    <i class="fa-regular fa-circle-check"></i>
                    <p class="m-0">No Special Characters</p>
                  </div>
                ) : (
                  <div class={"smaller " + style.error}>
                    <i class="fa-regular fa-circle-xmark"></i>
                    <p class="m-0">No Special Characters</p>
                  </div>
                )}
                {!username.match(/[ ]/g) ? (
                  <div class={"smaller " + style.correct}>
                    <i class="fa-regular fa-circle-check"></i>
                    <p class="m-0">No Spaces</p>
                  </div>
                ) : (
                  <div class={"smaller " + style.error}>
                    <i class="fa-regular fa-circle-xmark"></i>
                    <p class="m-0">No Spaces</p>
                  </div>
                )}
                {username.match(/^.{4,20}$/g) ? (
                  <div class={"smaller " + style.correct}>
                    <i class="fa-regular fa-circle-check"></i>
                    <p class="m-0">Between 4 and 20 Characters</p>
                  </div>
                ) : (
                  <div class={"smaller " + style.error}>
                    <i class="fa-regular fa-circle-xmark"></i>
                    <p class="m-0">Between 4 and 20 Characters</p>
                  </div>
                )}
              </div>
            )}
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="Your Email"
              value={email}
              onInput={(e) => setEmail(e.target.value)}
              class={emailError.length > 0 && style["error-box"]}
            />
            {emailError.length > 0 && (
              <p class={"smaller m-0 " + style.error + " " + style["error-message"]}>
                <i class="fa-regular fa-circle-xmark"></i> {emailError}
              </p>
            )}
            <label>Password</label>
            <div class={style["pw-cont"]}>
              <input name="password" type={pwVisibility ? "text" : "password"} placeholder="Your Password" value={pw} onInput={(e) => setPw(e.target.value)} />
              {pwVisibility ? (
                <i class="fa-solid fa-eye-slash" onClick={() => setPwVisibility(false)}></i>
              ) : (
                <i class="fa-solid fa-eye" onClick={() => setPwVisibility(true)}></i>
              )}
            </div>
            {pw.length > 0 && (
              <div class={style["input-req"]}>
                {pw.match(/^.{8,20}$/g) ? (
                  <div class={"smaller " + style.correct}>
                    <i class="fa-regular fa-circle-check"></i>
                    <p class="m-0">8 - 20 Characters long</p>
                  </div>
                ) : (
                  <div class={"smaller " + style.error}>
                    <i class="fa-regular fa-circle-xmark"></i>
                    <p class="m-0">8 - 20 Characters long</p>
                  </div>
                )}
                {pw.match(/(?=.*[a-z])(?=.*[A-Z])\w+/g) ? (
                  <div class={"smaller " + style.correct}>
                    <i class="fa-regular fa-circle-check"></i>
                    <p class="m-0">1+ lower- and 1+ uppercase Letter</p>
                  </div>
                ) : (
                  <div class={"smaller " + style.error}>
                    <i class="fa-regular fa-circle-xmark"></i>
                    <p class="m-0">1+ lower- and 1+ uppercase Letter</p>
                  </div>
                )}
                {pw.match(/(?=.*\d)/g) ? (
                  <div class={"smaller " + style.correct}>
                    <i class="fa-regular fa-circle-check"></i>
                    <p class="m-0">min. 1 Number</p>
                  </div>
                ) : (
                  <div class={"smaller " + style.error}>
                    <i class="fa-regular fa-circle-xmark"></i>
                    <p class="m-0">min. 1 Number</p>
                  </div>
                )}
              </div>
            )}
            {usernameStatus && pwStatus && emailStatus ? (
              <button type="submit" class={style.submit}>
                {loading && <i class={"fa-solid fa-spinner " + style["login-loader"]}></i>} Signup
              </button>
            ) : (
              <button type="button" class={"button disabled " + style.submit}>
                Signup
              </button>
            )}
          </form>
          <p class="smaller">
            You already have an Account?{" "}
            <Link href="/login" class="link">
              Login now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
