import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Link } from "preact-router/match";
import style from "./style.css";

import { useQuery, useQueryClient, useInfiniteQuery } from "react-query";

import useInView from "../../components/other/inView/index";

import ChirpedCard from "../../components/chirped-card";
import ExpPeople from "../../components/expPeople";
import LoginImg from "../../assets/images/login_img.svg";
import Loader from "../../components/loader/loader";

import { route } from "preact-router";

import { encode, decode } from "url-encode-decode";

// Note: `user` comes from the URL, courtesy of our router
const Profile = ({ searchTerm, filter }) => {
  const [searchInput, setSearchInput] = useState(decode(searchTerm));
  const { isInView: loadInView, inViewRef: loadRef } = useInView();
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser();
  });
  const {
    status: expStatus,
    data: expData,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    [filter + "-Explore", decode(searchTerm)],
    async ({ pageParam = 0 }) => {
      let filterQuery = { pageSize: 20, pageOffset: pageParam };
      if (filter === "people") {
        filterQuery.sortBy = "Count(followers) DESC";
        if (searchTerm) filterQuery.whereClause = [`name LIKE '%${searchTerm}%' or username LIKE '%${searchTerm}%'`];
        return Backendless.APIServices.Users.getAllUsers(filterQuery);
      }
      filterQuery.whereClause = ["type in ('Post', 'Comment')"];
      if (searchTerm) filterQuery.whereClause.push(`post.text LIKE '%${searchTerm}%'`);
      if (filter === "top") filterQuery.sortBy = "post.likes DESC";
      else if (filter === "latest") filterQuery.sortBy = "created DESC";
      else if (filter === "media") filterQuery.whereClause.push("post.images->'$[0]' != null");
      return Backendless.APIServices.Posts.getAll(filterQuery);
    },
    {
      getNextPageParam: (lastPage, pages) => (lastPage.length === 20 ? pages.length * 20 : undefined),
    }
  );

  function sendSearch(e) {
    e.preventDefault();
    route("/explore/" + filter + "/" + encode(searchInput));
  }

  useEffect(() => {
    if (loadInView) fetchNextPage();
  }, [loadInView]);

  return (
    <div>
      {!user && (
        <div class={style["not-login-cont"]}>
          <div class={style["not-login"]}>
            <img src={LoginImg} class={style["not-login-img"]} />
            <div>
              <h2 class="accent">Signup/Login now</h2>
              <p>If you signup/login you can follow your favourite Chirpers, get a personalised Home-Feed and Chirp for yourself!</p>
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
        <div class={"card " + style["filter-card"]}>
          <Link href={"/explore/top" + (searchInput && "/" + encode(searchInput))} activeClassName={style.active} class={style["filter-out"]}>
            <strong>Top</strong>
          </Link>
          <Link href={"/explore/latest" + (searchInput && "/" + encode(searchInput))} activeClassName={style.active} class={style["filter-out"]}>
            <strong>Latest</strong>
          </Link>
          <Link href={"/explore/people" + (searchInput && "/" + encode(searchInput))} activeClassName={style.active} class={style["filter-out"]}>
            <strong>People</strong>
          </Link>
          <Link href={"/explore/media" + (searchInput && "/" + encode(searchInput))} activeClassName={style.active} class={style["filter-out"]}>
            <strong>Media</strong>
          </Link>
        </div>
        <div>
          <form class={style["filter-search"]} onSubmit={sendSearch}>
            <div class={style["search-cont"]}>
              <i class="fa-solid fa-magnifying-glass"></i>
              <input name="searchInput" type="text" placeholder="#GreekSalad" value={searchInput} onInput={(e) => setSearchInput(e.target.value)} />
            </div>

            <button type="submit">Search</button>
          </form>
          {expStatus === "success" &&
            (expData.pages[0].length === 0 ? (
              <p class="loader-outer accent">{filter === "people" ? "No accounts found" : "No posts found"}</p>
            ) : filter === "people" ? (
              expData.pages.map((page) => page.map((person) => <ExpPeople user={person} curUser={user} />))
            ) : (
              expData.pages.map((page) => page.map((chirp) => <ChirpedCard data={chirp} user={user} />))
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
