import { h } from "preact";
import Router, { route } from "preact-router";
import Match from "preact-router/match";
import { Link } from "preact-router/match";
import { useEffect, useState, useRef } from "preact/hooks";
import style from "./style.css";
import { useQuery, useQueryClient } from "react-query";
import useClickOutside from "use-click-outside";

import AppLogo from "../../assets/icons/AppLogo.svg";
import AppLogoSmall from "../../assets/icons/App-icon.svg";
import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";

const { encode, decode } = require("url-encode-decode");

const Nav = () => {
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser();
  });

  const [recentSearchesOpen, setRecentSearchesOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const searchSuggRef = useRef();

  useClickOutside(searchSuggRef, () => {
    setRecentSearchesOpen(false);
  });

  function searchRedirect(e) {
    e.preventDefault();
    let search = e.target.elements.searchInput.value;
    let recent = localStorage.getItem("recent-searches") || "[]";
    console.log(recent)
    if (!!search.length && !recent.includes(search)) {
      localStorage.setItem("recent-searches", JSON.stringify([search, ...JSON.parse(recent)].slice(0, 5)));
    }
    setRecentSearchesOpen(false)
    e.target.elements.searchInput.blur()
    route("/explore/top/" + encode(search));
  }

  function openRecentSearches() {
    let recent = localStorage.getItem("recent-searches");
    if (recent) {
      setRecentSearches(JSON.parse(recent));
      setRecentSearchesOpen(true);
    }
  }

  function recentClick() {
    setRecentSearchesOpen(false)
  }

  return (
    <div>
      <header class={style["nav-cont"]}>
        <Link href="/" class={style["logo-cont"]}>
          <img class={style["nav-logo"] + " " + style["item-desktop"]} src={AppLogo} />
          <img class={style["nav-logo"] + " " + style["item-mobile"]} src={AppLogoSmall} />
        </Link>
        <nav>
          {user && (
            <Link activeClassName={style.active} class={style["nav-item"] + " " + style["item-desktop"]} href="/">
              Home
            </Link>
          )}
          <Match path="/explore/:filter?/:searchTerm?">
            {({ matches, path, url }) => (
              <Link class={style["nav-item"] + " " + style["item-desktop"] + " " + (matches && style.active)} href={matches ? path : "/explore/top"}>
                Explore
              </Link>
            )}
          </Match>
        </nav>
        {user ? (
          <div class={style["nav-user"]}>
            <div class={style["icon-input"]} ref={searchSuggRef}>
              <form onSubmit={searchRedirect}>
              <button type="submit" class={"unset pointer " + style["icon-glass"]}>
                  <i class="fa-solid fa-magnifying-glass"></i>
                </button>
                <input
                  onFocus={openRecentSearches}
                  name="searchInput"
                  type="search"
                  placeholder="#great"
                  class={style["nav-search"]}
                  autocomplete="off"
                ></input>
                <button type="reset" class={"unset pointer " + style["icon-reset"]}>
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </form>
              {recentSearchesOpen && (
                <div class={style["recent-searches"]}>
                  {recentSearches.map((s) => (
                    <Link href={"/explore/top/" + encode(s)} onClick={recentClick}>
                      <i class="fa-regular fa-clock"></i> {s}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Match path="/bookmarks/:filter?">
              {({ matches }) =>
                !matches ? (
                  <Link href="/bookmarks">
                    <i class="fa-regular fa-bookmark"></i>
                  </Link>
                ) : (
                  <Link href="/bookmarks">
                    <i class={"fa-solid fa-bookmark " + style["active-bookmark"]}></i>
                  </Link>
                )
              }
            </Match>
            <Link href="/profile/me" activeClassName={style["account-active"]} class={style.account + " " + style["item-desktop"]}>
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

      <nav class={style["nav-mobile"]}>
        {user && (
          <Link activeClassName={style.active} class={style["nav-item"]} href="/">
            <i class="fa-solid fa-house"></i>
            Home
          </Link>
        )}

        <Match path="/explore/:filter?/:searchTerm?">
          {({ matches, path, url }) => (
            <Link class={style["nav-item"] + " " + (matches && style.active)} href={matches ? path : "/explore/top"}>
              <i class="fa-solid fa-compass"></i>
              Explore
            </Link>
          )}
        </Match>
        {user && (
          <Link activeClassName={style.active} class={style["nav-item"]} href="/profile/me">
            <img src={user.profilePicture} />
            Account
          </Link>
        )}
      </nav>
    </div>
  );
};

export default Nav;
