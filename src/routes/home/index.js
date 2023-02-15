import { h } from "preact";
import { Router, Link, route, getCurrentUrl } from "preact-router";
import style from "./style.css";

import PostCard from "../../components/post-card";
import PostedCard from "../../components/posted-card";
import Post from "../singlePost";
import Empty from "../../assets/images/empty.svg";
import { useEffect, useState } from "preact/hooks";
import useInView from "../../components/other/inView/index.tsx";

import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider, useInfiniteQuery } from "react-query";
import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import bannerPlaceholder from "../../assets/icons/banner_placeholder.svg";
import Loader from "../../components/loader/loader";
import Footer from "../../components/footer";
import pb from "../../_pocketbase/connect";
import { getAll, getFollowingPosts, trendingHashtags } from "../../_pocketbase/services/Posts";
import { followUser, getSuggestedUsers, unfollowUser } from "../../_pocketbase/services/Users";
import toastError from "../../components/toasts/error";

const { encode, decode } = require("url-encode-decode");

const Home = () => {
  const queryClient = useQueryClient();
  const { isInView: loadInView, inViewRef: loadRef } = useInView();
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
  const {
    status: postsStatus,
    data: posts,
    error: postsError,
    error,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
  } = useInfiniteQuery(
    "homePosts",
    async ({ pageParam = 1 }) => {
      return getFollowingPosts(20, pageParam)
    },
    {
      enabled: !!user,
      getNextPageParam: (lastPage, pages) =>  (lastPage.totalPages > pages.length ? pages.length + 1 : undefined),
    }
  );
  const {
    status: trendsStatus,
    data: trendsHashtags,
    error: trendsError,
  } = useQuery(
    "homeHashtags",
    async () => {
      return trendingHashtags()
    },
    {
      enabled: window.innerWidth > 850,
    }
  );
  const {
    status: homeUserStatus,
    data: homeUser,
    error: homeUserError,
  } = useQuery(
    "homeUserList",
    async () => {
      return getSuggestedUsers()
    },
    {
      enabled: !!user && window.innerWidth > 850,
    }
  );

  useEffect(async () => {
    if (user && !pb.authStore.isValid) {
      pb.authStore.clear();
      queryClient.invalidateQueries("currentUser");
      location.reload();
    }
  }, [user]);

  useEffect(() => {
    if (userStatus === "success") {
      if (!user) route("/explore/top");
    } else if (userStatus === "error") {
      console.log(userError.message);
      route("/explore/top");
    }
  }, [userStatus]);

  useEffect(() => {
    if (loadInView) fetchNextPage();
  }, [loadInView]);

  return (
    <div class="mobile-space">
      {user ? (
        <div class={style.home + " container"}>
          <div class={style["left-column"]}>
            <PostCard user={user} />
            {postsStatus == "success" &&
              (posts.pages[0].totalItems === 0 ? (
                <div class={style["empty-cont"]}>
                  <img src={Empty} />
                  <div>
                    <h2 class="accent">A bit empty here right?</h2>
                    <p>Discover our Explore page and follow your favourite AppLogos to fill up your personal Home-Feed</p>
                    <Link href="/explore/top" class="button">
                      Explore
                    </Link>
                  </div>
                </div>
              ) : (
                posts.pages.map((postsRender) => postsRender.items.map((post) => <PostedCard data={post} user={user} />))
              ))}
            <div ref={loadRef}>
              {isFetchingNextPage || postsStatus === "loading" ? (
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
          <div class={style["right-column"]}>
            {trendsStatus === "success" && trendsHashtags.items.length > 0 && (
              <div class="card">
                <div class="card-header">
                  <strong class="smaller">Trends</strong>
                </div>
                <div class="card-body">
                  {trendsHashtags.items.map((trend) => (
                    <Link href={"/explore/top/" + encode(trend.name)} class={style["hashtag-cont"]}>
                      <p class="m-0">
                        <strong>{trend.name}</strong>
                      </p>
                      <p class="smaller m-0">{trend.amount} Posts</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {homeUserStatus === "success" && homeUser.items.length > 0 && (
              <div class="card">
                <div class="card-header">
                  <strong class="smaller">Who to follow</strong>
                </div>
                <div class="card-body">
                  {homeUser.items.map((user) => (
                    <HomeUserBox user={user} />
                  ))}
                </div>
              </div>
            )}
            <Footer />
          </div>
        </div>
      ) : (
        <div class={"container " + style["not-logged-in-cont"]}>
          <h1 class="accent">Please login</h1>
          <p>Please login/signup to get your personal Home-Feed and to post yourself!</p>
          <Link href="/login" class="button sec">
            Login
          </Link>
          <Link href="/signup" class="button">
            Signup
          </Link>
          <hr />
          <p>Or you can discover the Explore-Feed with all Posts!</p>
          <Link href="/explore/top" class="button">
            Explore
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;

const HomeUserBox = ({ user }) => {
  const [followers, setFollowers] = useState(user.followers.length);
  const [followed, setFollowed] = useState(false);

  async function follow(e) {
    e.preventDefault();
    e.stopPropagation();
    setFollowed(!followed)
    if (!followed) {
      followUser(user.id).then(res => {
        setFollowers(followers + 1)
      }).catch((err) => {
        toastError(err);
      });
    } else {
      unfollowUser(user.id).then(res => {
        setFollowers(followers - 1)
      }).catch((err) => {
        toastError(err);
      });
    }
  }

  return (
    <Link href={"/profile/" + user.id} class={style["follow-card"]}>
      <img class={style["follow-banner"]} src={user?.banner ? pb.getFileUrl(user, user.banner, {thumb: "600x0"}) : bannerPlaceholder} />
      <img class={style["follow-profile-picture"]} src={user?.avatar ? pb.getFileUrl(user, user.avatar, {thumb: "60x0"}) : ppPlaceholder} />
      <div class={style["follow-head"]}>
        <div class={style["follow-name"]}>
          <p class="m-0">
            <strong>{user.name || user.username}</strong>
          </p>
          <p class="smaller m-0">{followers} Follower</p>
        </div>
        {followed ? (
          <button class="small sec" onClick={follow}>
            Unfollow
          </button>
        ) : (
          <button class="small" onClick={follow}>
            <i class="fa-solid fa-user-plus"></i> Follow
          </button>
        )}
      </div>
      {user.biography && <p class={style["card-bio"] + " m-0 mt-05"}>{user.biography}</p>}
    </Link>
  );
};
