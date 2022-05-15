import { h } from "preact";
import style from "./style.css";
import { Link, route } from "preact-router";
import { useEffect, useState } from "preact/hooks";

import { useQuery, useQueryClient} from "react-query";

import LoginImg from "../../assets/images/login-img.jpg";
import Chirper from "../../assets/icons/Chirper.svg";
import GoogleMark from "../../assets/brands/Google-Mark.png"
import GitHubMark from "../../assets/brands/GitHub-Mark.png"

const Login = () => {
  const queryClient = useQueryClient()
  const {status: userStatus, data: user, error: userError} = useQuery('currentUser', async () => {
    return Backendless.UserService.getCurrentUser()
  })

  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [pwVisibility, setPwVisibility] = useState(false);

  const [generalError, setGeneralError] = useState("")

  const [loading, setLoading] = useState(false)

  useEffect(() => {
      if(user) route("/")
  }, [user]);
  
  function login(e) {
    e.preventDefault()
    setLoading(true)
    setGeneralError("")

    Backendless.UserService.login(email, pw, true)
    .then((user) => {
      queryClient.invalidateQueries('currentUser')
    })
    .catch((error) => {
      setGeneralError(error.message)
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
          <img src={Chirper} class={style.logo} />
          <Link href="/" class="button sec">Back</Link>
        </div>
        <div class={style["login-form-cont"]}>
          <h2 class="accent">Login</h2>
          <p class="m-0">Login to start chirping and to get connected with People all over the World!</p>
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
            )}</div>
            <p class={style["forgot-password"]}>Forgot Password</p>
            {(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email) && pw.length >= 8) ? (
            <button type="submit" class={style.submit}>{loading && <i class={"fa-solid fa-spinner " + style["login-loader"]}></i>} Login</button>
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
      </div>
    </div>
  );
};

export default Login;
