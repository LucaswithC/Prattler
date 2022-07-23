import { h } from "preact";
import { Router } from "preact-router";
import Match from "preact-router/match";
import Redirect from "../components/Redirect";
import Backendless from "backendless";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Nav from "./nav";

// Code-splitting is automated for `routes` directory
import Home from "../routes/home";
import Profile from "../routes/profile";
import Bookmark from "../routes/bookmark";
import Explore from "../routes/explore";
import Login from "../routes/login-signup/login.js";
import SignUp from "../routes/login-signup/signup.js";
import Post from "../routes/singlePost"
import Chats from "../routes/chats"
import { useEffect, useState } from "preact/hooks";

const APP_ID = "AD410151-2D10-4D0D-FFE5-2F082E483500";
const API_KEY = "C1715888-39CA-449E-A97C-5BA12DF125B0";
Backendless.serverURL = "https://eu-api.backendless.com";
Backendless.initApp(APP_ID, API_KEY);

import "../backendless/services/Posts.js"
import "../backendless/services/Users.js"
import "../backendless/services/Messages.js"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      //refetchOnWindowFocus: false,
      retry: false
    },
  },
});

const App = () => {
  const [curLoc, setCurLoc] = useState("")

  useEffect(() => {
    function success(result) {
      console.log("Is login valid?: " + result);
    }

    function error(err) {
      console.log(err.message);
      console.log(err.statusCode);
    }

    Backendless.UserService.isValidLogin().then(success).catch(error);
  }, []);

  function location(path) {
    setCurLoc(path.split("/")[1])
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Match path="/chats/:chatId?">{({ matches, path }) => location(path) }</Match>
      <div id="app" class="dark-theme">
        <Router>
          <Login path="/login" />
          <SignUp path="/signup" />
          <div default id={curLoc === "chats" && "container-fullscreen"}>
            <Nav screen={curLoc === "chats" && "fullscreen"} />
            <Router>
              <Home path="/" />
              <Redirect path="/profile" to="/profile/me" />
              <Profile path="/profile/:userFilter/:filter?" />
              <Redirect path="/explore" to="/explore/top" />
              <Explore path="/explore/:filter/:searchTerm?" />
              <Bookmark path="/bookmarks/:filter?" />
              <Post path="/post/:postId" />
              <Chats path="/chats/:chatId?" />
              <div default>404</div>
            </Router>
          </div>
        </Router>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
      <ToastContainer
        position="bottom-center"
        autoClose={10000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </QueryClientProvider>
  );
};

export default App;
