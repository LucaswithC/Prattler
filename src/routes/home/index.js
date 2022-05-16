import { h } from "preact";
import { Router, Link, route, getCurrentUrl } from "preact-router";
import style from "./style.css";

import ChirpCard from "../../components/chirp-card";
import ChirpedCard from "../../components/chirped-card";
import Chirp from "../chirp";
import Empty from "../../assets/images/empty.svg";
import { useEffect, useState } from "preact/hooks";

import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "react-query";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import bannerPlaceholder from "../../assets/icons/banner_placeholder.svg";

const Home = () => {
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser();
  });
  const {
    status: homeUserStatus,
    data: homeUser,
    error: homeUserError,
  } = useQuery("homeUserList", async () => {
    let queryBuilder = Backendless.DataQueryBuilder.create();
    queryBuilder.addProperties("banner", "bio", "name", "username", "profilePicture");
    queryBuilder.setPageSize(3);
    queryBuilder.setSortBy(["created DESC"]);
    return Backendless.Data.of("Users").find(queryBuilder);
  });
  const {
    status: chirpsStatus,
    data: chirps,
    error: chirpsError,
  } = useQuery("homeChirps", async () => {
    var queryBuilder = Backendless.DataQueryBuilder.create().setWhereClause("");
    queryBuilder.setSortBy(["created DESC"]);
    queryBuilder.setRelated(["creator"]);
    return Backendless.Data.of("Chirps").find(queryBuilder);
  });

  useEffect(() => {
    if (userStatus === "success") {
      if (!user) route("/explore/top");
    } else if (userStatus === "error") {
      console.log(userError.message);
      route("/explore/top");
    }
  }, [userStatus]);

  return (
    <div>
      {user ? (
        <div class={style.home + " container"}>
          <div class={style["left-column"]}>
                <ChirpCard user={user} />
                {chirpsStatus == "success" ? (
                  chirps.length >= 1 ? (
                    chirps.map((chirp) => <ChirpedCard data={chirp} user={user} />)
                  ) : (
                    <div class={style["empty-cont"]}>
                      <img src={Empty} />
                      <div>
                        <h2 class="accent">A bit empty here right?</h2>
                        <p>Discover our Explore page and follow your favourite Chirpers to fill up your personal Home-Feed</p>
                        <Link href="/explore/top" class="button">
                          Explore
                        </Link>
                      </div>
                    </div>
                  )
                ) : (
                  <div>Loading</div>
                )}
          </div>
          <div class={style["right-column"]}>
            <div class="card">
              <div class="card-header">
                <strong class="smaller">Trends for you</strong>
              </div>
              <div class="card-body">
                <Link href="/explore/top/%23programming" class={style["hashtag-cont"]}>
                  <p class="m-0">
                    <strong>#programming</strong>
                  </p>
                  <p class="smaller m-0">213k Chirps</p>
                </Link>
                <Link href="/explore/top/%23+space" class={style["hashtag-cont"]}>
                  <p class="m-0">
                    <strong>#space</strong>
                  </p>
                  <p class="smaller m-0">34k Chirps</p>
                </Link>
                <Link href="/explore/top/%23basketball" class={style["hashtag-cont"]}>
                  <p class="m-0">
                    <strong>#basketball</strong>
                  </p>
                  <p class="smaller m-0">1.2k Chirps</p>
                </Link>
                <Link href="/explore/top/%23cineville" class={style["hashtag-cont"]}>
                  <p class="m-0">
                    <strong>#cineville</strong>
                  </p>
                  <p class="smaller m-0">712 Chirps</p>
                </Link>
                <Link href="/explore/top/%23cinema" class={style["hashtag-cont"]}>
                  <p class="m-0">
                    <strong>#cinema</strong>
                  </p>
                  <p class="smaller m-0">654 Chirps</p>
                </Link>
                <Link href="/explore/top/%23grrensocks" class={style["hashtag-cont"]}>
                  <p class="m-0">
                    <strong>#grrensocks</strong>
                  </p>
                  <p class="smaller m-0">325 Chirps</p>
                </Link>
                <Link href="/explore/top/%23london" class={style["hashtag-cont"]}>
                  <p class="m-0">
                    <strong>#london</strong>
                  </p>
                  <p class="smaller m-0">278 Chirps</p>
                </Link>
                <Link href="/explore/top/%23dragon" class={style["hashtag-cont"]}>
                  <p class="m-0">
                    <strong>#dragon</strong>
                  </p>
                  <p class="smaller m-0">48 Chirps</p>
                </Link>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <strong class="smaller">Who to follow</strong>
              </div>
              {homeUser && (
                <div class="card-body">
                  {homeUser.map((user) => (
                    <Link href={"/profile/" + user.username} class={style["follow-card"]}>
                      <img class={style["follow-banner"]} src={user.banner || bannerPlaceholder} />
                      <img class={style["follow-profile-picture"]} src={user.profilePicture || ppPlaceholder} />
                      <div class={style["follow-head"]}>
                        <div class={style["follow-name"]}>
                          <p class="m-0">
                            <strong>{user.name || user.username}</strong>
                          </p>
                          <p class="smaller m-0">154 Follower</p>
                        </div>
                        <button class="small">
                          <i class="fa-solid fa-user-plus"></i> Follow
                        </button>
                      </div>
                      {user.bio && <p class={style["card-bio"]}>{user.bio}</p>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <p class="smaller dimmed">
            {/* 2021 - {new Date().getFullYear()} |{" "} */}
            <a href="https://github.com/LucaswithC" target="_blank">
              © Lucas Kiers
            </a>
          </p>
          </div>
          
        </div>
      ) : (
        <div class={"container " + style["not-logged-in-cont"]}>
          <h1 class="accent">Please login</h1>
          <p>Please login/signup to get your personal Home-Feed and to chirp yourself!</p>
          <Link href="/login" class="button sec">
            Login
          </Link>
          <Link href="/signup" class="button">
            Signup
          </Link>
          <hr />
          <p>Or you can discover the Explore-Feed with all Chirps!</p>
          <Link href="/explore/top" class="button">
            Explore
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
