import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import { Link, Match } from "preact-router/match";
import style from "./style.css";
import useClickOutside from "use-click-outside";

import { useQuery, useQueryClient, useInfiniteQuery } from "react-query";

import useInView from "../../components/other/inView/index";

import PostedCard from "../../components/posted-card";
import ExpPeople from "../../components/expPeople";
import LoginImg from "../../assets/images/login_img.svg";
import Loader from "../../components/loader/loader";

import { route } from "preact-router";

import { encode, decode } from "url-encode-decode";
import Footer from "../../components/footer";
import pb from "../../_pocketbase/connect";
import { getAll } from "../../_pocketbase/services/Posts";
import { getAllUsers } from "../../_pocketbase/services/Users";

// Note: `user` comes from the URL, courtesy of our router
const Profile = ({ searchTerm, filter }) => {
  const [searchInput, setSearchInput] = useState(decode(searchTerm));
  const [recentSearchesOpen, setRecentSearchesOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const { isInView: loadInView, inViewRef: loadRef } = useInView();
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery(
    "currentUser",
    async () => {
      return pb.authStore?.model
    },
    {
      retry: false,
    }
  );

  const {
    status: expStatus,
    data: expData,
    error: expError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    [filter + "-Explore", decode(searchTerm)],
    async ({ pageParam = 1 }) => {
      let filterQuery = {};
      if (filter === "people") {
        filterQuery.sort = "-followers:length";
        if (searchTerm) filterQuery.filter = [`name ~ "${searchTerm}" || username ~ "${searchTerm}"`];
        return getAllUsers(filterQuery, 20, pageParam)
      }
      filterQuery.filter = ['(type = "post" || type = "comment")'];
      if (searchTerm) filterQuery.filter.push(`post.text ~ "${searchTerm}"`);
      if (filter === "top") filterQuery.sort = "-post.totalLikes";
      else if (filter === "latest") filterQuery.sort = "-created";
      else if (filter === "media") filterQuery.filter.push("post.images:length > 0");
      return getAll(filterQuery, 20, pageParam);
    },
    {
      getNextPageParam: (lastPage, pages) => (lastPage.totalPages > pages.length ? pages.length + 1 : undefined),
    }
  );

  useEffect(() => {
    console.log(expData)
  }, [expData])

  const searchSuggRef = useRef();

  useClickOutside(searchSuggRef, () => {
    setRecentSearchesOpen(false);
  });

  useEffect(async () => {
    if (user && !pb.authStore.isValid) {
      pb.authStore.clear()
      queryClient.invalidateQueries("currentUser");
      location.reload();
    }
  }, [user]);

  useEffect(() => {
    setSearchInput(decode(searchTerm));
  }, [searchTerm]);

  function sendSearch(e) {
    e.preventDefault();
    let search = e.target.elements.searchInput.value;
    let recent = localStorage.getItem("recent-searches") || [];
    if (!!search.length && !recent.includes(search)) {
      localStorage.setItem("recent-searches", JSON.stringify([search, ...JSON.parse(recent)].slice(0, 5)));
    }
    setRecentSearchesOpen(false);
    e.target.elements.searchInput.blur()
    route("/explore/" + filter + "/" + encode(searchInput));
  }

  useEffect(() => {
    if (loadInView) fetchNextPage();
  }, [loadInView]);

  function openRecentSearches() {
    let recent = localStorage.getItem("recent-searches");
    if (recent) {
      setRecentSearches(JSON.parse(recent));
      setRecentSearchesOpen(true);
    }
  }

  return (
    <div class="mobile-space">
      {!user && (
        <div class={style["not-login-cont"]}>
          <div class={style["not-login"]}>
            <img src={LoginImg} class={style["not-login-img"]} />
            <div>
              <h2 class="accent">Signup/Login now</h2>
              <p>If you signup/login you can follow your favourite AppLogos, get a personalised Home-Feed and Post for yourself!</p>
              <Link href="/login" class="button sec mr-1">
                Login
              </Link>
              <Link href="/signup" class="button">
                Signup
              </Link>
            </div>
          </div>
        </div>
      )}
      <div class={"container " + style.explore}>
        <div class={style["filter-outer"]}>
          <div class={"card " + style["filter-card"]}>
            <Match path="/explore/top/:searchTerm?">
              {({ matches, path, url }) => (
                <Link href={"/explore/top" + (searchInput && "/" + encode(searchInput))} class={style["filter-out"] + " " + (matches && style.active)}>
                  <strong>Top</strong>
                </Link>
              )}
            </Match>
            <Match path="/explore/latest/:searchTerm?">
              {({ matches, path, url }) => (
                <Link href={"/explore/latest" + (searchInput && "/" + encode(searchInput))} class={style["filter-out"] + " " + (matches && style.active)}>
                  <strong>Latest</strong>
                </Link>
              )}
            </Match>
            <Match path="/explore/people/:searchTerm?">
              {({ matches, path, url }) => (
                <Link href={"/explore/people" + (searchInput && "/" + encode(searchInput))} class={style["filter-out"] + " " + (matches && style.active)}>
                  <strong>People</strong>
                </Link>
              )}
            </Match>
            <Match path="/explore/media/:searchTerm?">
              {({ matches, path, url }) => (
                <Link href={"/explore/media" + (searchInput && "/" + encode(searchInput))} class={style["filter-out"] + " " + (matches && style.active)}>
                  <strong>Media</strong>
                </Link>
              )}
            </Match>
          </div>
          <Footer />
        </div>
        <div>
          <form class={style["filter-search"]} onSubmit={sendSearch}>
            <div class={style["search-cont"]} ref={searchSuggRef}>
              <i class={"fa-solid fa-magnifying-glass " + style["input-i"]}></i>
              <input
                onFocus={openRecentSearches}
                autocomplete="off"
                name="searchInput"
                type="text"
                placeholder="Search Posts/People/Hashtags"
                value={searchInput}
                onInput={(e) => setSearchInput(e.target.value)}
              />
              <button type="reset" class={"unset pointer " + style["input-i-reset-btn"]}>
                  <i class={"fa-solid fa-xmark " + style["input-i-reset"]}></i>
                </button>
              {recentSearchesOpen && (
                <div class={style["recent-searches"]}>
                  {recentSearches.map((s) => (
                    <Link href={"/explore/top/" + encode(s)} onClick={() => setRecentSearchesOpen(false)}>
                      <i class="fa-regular fa-clock"></i> {s}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button type="submit">Search</button>
          </form>
          {expStatus === "success" &&
            (expData.pages[0].totalItems === 0 ? (
              <p class="loader-outer accent">{filter === "people" ? "No accounts found" : "No posts found"}</p>
            ) : filter === "people" ? (
              expData.pages.map((page) => page.items.map((person) => <ExpPeople user={person} curUser={user} />))
            ) : (
              expData.pages.map((page) => page.items.map((post) => <PostedCard data={post} user={user} />))
            ))}
          <div ref={loadRef}>
            {isFetchingNextPage || expStatus === "loading" ? (
              <Loader />
            ) : (
              hasNextPage && (
                <button class="small" onClick={fetchNextPage}>
                  Load more
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
