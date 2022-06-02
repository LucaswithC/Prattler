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

const { encode, decode } = require("url-encode-decode");

const Home = () => {
  const queryClient = useQueryClient();
  const { isInView: loadInView, inViewRef: loadRef } = useInView();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser()
  }, {
    retry: false
  });
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
    async ({ pageParam = 0 }) => {
      return Backendless.APIServices.Posts.getFollowingPosts({ pageSize: 20, pageOffset: pageParam });
    },
    {
      getNextPageParam: (lastPage, pages) => (lastPage.length === 20 ? pages.length * 20 : undefined),
    }
  );
  const {
    status: trendsStatus,
    data: trendsHashtags,
    error: trendsError,
  } = useQuery("homeHashtags", async () => {
    return await Backendless.APIServices.Posts.trendingHashtags();
  },{
    enabled: window.innerWidth > 850
  });
  const {
    status: homeUserStatus,
    data: homeUser,
    error: homeUserError,
  } = useQuery("homeUserList", async () => {
    return Backendless.APIServices.Users.getSuggestedUsers();
  }, {
    enabled: window.innerWidth > 850
  });

  useEffect(async () => {
    if(userError?.code === 3064 || postsError?.code === 3064 || trendsError?.code === 3064 || homeUserError?.code === 3064) {
      Backendless.UserService.logout()
      .then(function () {
        queryClient.invalidateQueries("currentUser")
        location.reload();
      })
    }
  }, [userStatus, postsStatus, trendsError, homeUserStatus])

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
              (posts.pages[0].length === 0 ? (
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
                posts.pages.map((postsRender) => postsRender.map((post) => <PostedCard data={post} user={user} />))
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
            {trendsStatus === "success" && trendsHashtags.length > 0 && (
              <div class="card">
                <div class="card-header">
                  <strong class="smaller">Trends</strong>
                </div>
                <div class="card-body">
                  {trendsHashtags.map((trend) => (
                    <Link href={"/explore/top/" + encode(trend.hashtag)} class={style["hashtag-cont"]}>
                      <p class="m-0">
                        <strong>{trend.hashtag}</strong>
                      </p>
                      <p class="smaller m-0">{trend.postCount} Posts</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {homeUserStatus === "success" && homeUser.length > 0 && (
              <div class="card">
                <div class="card-header">
                  <strong class="smaller">Who to follow</strong>
                </div>
                <div class="card-body">
                  {homeUser.map((user) => (
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
  const [followers, setFollowers] = useState(user.followers);
  const [followed, setFollowed] = useState(user.followed);

  async function follow(e) {
    e.preventDefault()
    e.stopPropagation()
    setFollowers(followed ? followers - 1 : followers + 1)
    setFollowed(!followed)
    if (!followed) {
      await Backendless.APIServices.Users.followUser(user.objectId).catch((err) => {
        setFollowed(!followed)
        setFollowers(followers - 1)
        toastError(err);
      });
    } else {
      await Backendless.APIServices.Users.unfollowUser(user.objectId).catch((err) => {
        setFollowed(!followed)
        setFollowers(followers + 1)
        toastError(err);
      });
    }
  }

  return (
    <Link href={"/profile/" + user.username} class={style["follow-card"]}>
      <img class={style["follow-banner"]} src={user.banner || bannerPlaceholder} />
      <img class={style["follow-profile-picture"]} src={user.profilePicture || ppPlaceholder} />
      <div class={style["follow-head"]}>
        <div class={style["follow-name"]}>
          <p class="m-0">
            <strong>{user.name || user.username}</strong>
          </p>
          <p class="smaller m-0">{followers} Follower</p>
        </div>
        {followed ? (
          <button class="small sec" onClick={follow}>Unfollow</button>
        ) : (
          <button class="small" onClick={follow}>
            <i class="fa-solid fa-user-plus"></i> Follow
          </button>
        )}
      </div>
      {user.bio && <p class={style["card-bio"] + " m-0 mt-05"}>{user.bio}</p>}
    </Link>
  );
};