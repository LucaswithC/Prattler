import { h } from "preact";
import Router, { route } from "preact-router";
import Match from "preact-router/match";
import { Link } from "preact-router/match";
import { useEffect, useState } from "preact/hooks";
import style from "./style.css";
import { useQuery, useQueryClient } from "react-query";

import Chirper from "../../assets/icons/Chirper.svg";
import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";

const { encode, decode } = require('url-encode-decode')

const Nav = () => {
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser();
  });

  function searchRedirect(e) {
    e.preventDefault()

    route("/explore/top/" + encode(e.target.elements.searchInput.value))
  }

  return (
    <div>
      <header class={style["nav-cont"]}>
        <Link href="/" class={style["logo-cont"]}>
          <img class={style["nav-logo"]} src={Chirper} />
          <p class={"m-0 " + style["dev-badge"]}>ALPHA</p>
        </Link>
        <nav>
          {user && (
            <Link activeClassName={style.active} class={style["nav-item"] + " " + style["item-desktop"]} href="/">
              Home
            </Link>
          )}
          <Link activeClassName={style.active} class={style["nav-item"] + " " + style["item-desktop"]} href="/explore/top">
            Explore
          </Link>
        </nav>
        {user ? (
          <div class={style["nav-user"]}>
            <div class={style["icon-input"]}>
              <i class="fa-solid fa-magnifying-glass"></i>
              <form onSubmit={searchRedirect}>
                <input name="searchInput" type="search" placeholder="#green" class={style["nav-search"]}></input>
              </form>
            </div>
            <Link href="/explore/top" class={style["nav-search-mobile"]}>
              <i class="fa-solid fa-magnifying-glass"></i>
            </Link>
            <Match path="/bookmarks/:filter?">
              {({ matches }) =>
                matches && (
                  <Link href="/bookmarks">
                    <i class={"fa-solid fa-bookmark " + style["active-bookmark"]}></i>
                  </Link>
                )
              }
            </Match>
            <Match path="/bookmarks/:filter?">
              {({ matches }) =>
                !matches && (
                  <Link href="/bookmarks">
                    <i class="fa-regular fa-bookmark"></i>
                  </Link>
                )
              }
            </Match>
            <Link href="/profile/me" activeClassName={style["account-active"]} class={style.account}>
              <img src={user?.profilePicture || ppPlaceholder} height="40" width="40" style={{ objectFit: "cover", borderRadius: "50%" }} />
            </Link>
          </div>
        ) : (
          <div class={style["nav-user"]}>
            <Link href="/login" class="button sec">
              Login
            </Link>
            <Link href="/signup" class="button">
              Signup
            </Link>
          </div>
        )}
      </header>
      {user && (
        <nav class={style["nav-mobile"]}>
          <Link activeClassName={style.active} class={style["nav-item"]} href="/">
            <i class="fa-solid fa-house"></i>
            Home
          </Link>

          <Link activeClassName={style.active} class={style["nav-item"]} href="/explore/top">
            <i class="fa-solid fa-compass"></i>
            Explore
          </Link>

          <Link activeClassName={style.active} class={style["nav-item"]} href="/profile/me">
            <img src={user.profilePicture} />
             Account
          </Link>
        </nav>
      )}
    </div>
  );
};

export default Nav;
