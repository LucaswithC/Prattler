import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import style from "./style.css";
import stylesExp from "../explore/style.css";
import { Link } from "preact-router/match";
import { useQuery, useQueryClient, useInfiniteQuery } from "react-query";
import useInView from "../../components/other/inView";

import PostedCard from "../../components/posted-card";
import EditProfile from "../../components/edit-profile";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import bannerPlaceholder from "../../assets/icons/banner_placeholder.svg";
import PostCard from "../../components/post-card";
import toastSuccess from "../../components/toasts/success";
import toastInfo from "../../components/toasts/info";
import Loader from "../../components/loader/loader";
import Footer from "../../components/footer";

// Note: `user` comes from the URL, courtesy of our router
const Profile = ({ userFilter, filter }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  const [modalState, setModalState] = useState(false);
  const [modalType, setModalType] = useState("follower");
  const [editStatus, setEditStatus] = useState(false);

  const { isInView: loadInView, inViewRef: loadRef } = useInView();
  const {
    status: curUserStatus,
    data: curUser,
    error: curUserError,
  } = useQuery(
    "currentUser",
    async () => {
      return Backendless.UserService.getCurrentUser();
    },
    {
      retry: false,
    }
  );
  const {
    status: userStatus,
    data: userData,
    error: userError,
    refetch: userRefetch,
  } = useQuery(userFilter + "-User", async () => {
    let res;
    if (userFilter === "me") {
      res = await Backendless.APIServices.Users.getCurrentUser();
    } else {
      res = await Backendless.APIServices.Users.getSingleUser(userFilter);
    }
    setUser(res);
    return res;
  });
  const {
    status: postsStatus,
    data: postsData,
    error: postsError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    [userFilter + "-Posts-" + (filter || "all"), user],
    async ({ pageParam = 0 }) => {
      let filterQuery = { pageSize: 20, pageOffset: pageParam };
      filterQuery.whereClause = [`ownerId='${user.objectId}'`];
      if (!filter) filterQuery.whereClause.push("type in ('Post', 'Repost')");
      else if (filter === "replies") filterQuery.whereClause.push("type in ('Post', 'Comment', 'Repost')");
      else if (filter === "media") filterQuery.whereClause.push(`post.images->'$[0]' != null and type = 'Post'`);
      else if (filter === "likes") filterQuery.whereClause.push("type = 'Like'");
      return Backendless.APIServices.Posts.getAll(filterQuery);
    },
    {
      getNextPageParam: (lastPage, pages) => (lastPage.length === 20 ? pages.length * 20 : undefined),
      enabled: !!user,
    }
  );

  useEffect(async () => {
    if (curUserError?.code === 3064 || userError?.code === 3064 || postsError?.code === 3064) {
      Backendless.UserService.logout().then(function () {
        queryClient.invalidateQueries("currentUser");
        location.reload();
      });
    }
  }, [curUserStatus, userStatus, postsStatus]);

  useEffect(() => {
    if (userStatus === "success") {
      if (!userData) route("/");
    } else if (userStatus === "error") {
      console.log(userError.message);
      route("/");
    }
  }, [userStatus]);

  useEffect(() => {
    if (user) {
      if (typeof window !== "undefined") {
        let modal = document.querySelector("." + style["follower-modal"]);
        modal.addEventListener("click", (e) => {
          e.stopPropagation();
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (loadInView) fetchNextPage();
  }, [loadInView]);

  function openModal(type) {
    setModalType(type);
    setModalState(true);
  }

  function closeModal() {
    setModalState(false);
  }

  function openEdit() {
    if (typeof window !== "undefined") {
      let body = document.querySelector("body");
      body.style.overflow = "hidden";
      setEditStatus(true);
    }
  }

  function closeEdit() {
    if (typeof window !== "undefined") {
      let body = document.querySelector("body");
      body.style.overflow = "auto";
      setEditStatus(false);
    }
  }

  function logout() {
    Backendless.UserService.logout()
      .then(function () {
        queryClient.invalidateQueries("currentUser");
        route("/explore/top");
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  function reload() {
    Backendless.UserService.getCurrentUser()
      .then(function (currentUser) {
        console.log(currentUser);
      })
      .catch(function (error) {});
  }

  async function follow() {
    if (!curUser) {
      toastInfo("Please login to follow");
      route("/signup");
      return;
    }
    let newUser = { ...user };
    newUser.followers = user.followed ? user.followers - 1 : user.followers + 1;
    newUser.followed = !user.followed;
    setUser(newUser);
    if (!user.followed) {
      await Backendless.APIServices.Users.followUser(user.objectId).catch((err) => {
        newUser = { ...user };
        newUser.followed = !user.followed;
        newUser.followers = user.followers - 1;
        setUser(newUser);
        toastSuccess(err);
      });
    } else {
      await Backendless.APIServices.Users.unfollowUser(user.objectId).catch((err) => {
        newUser = { ...user };
        newUser.followed = !user.followed;
        newUser.followers = user.followers + 1;
        setUser(newUser);
        toastSuccess(err);
      });
    }
  }

  return (
    <div class="mobile-space">
      {user && (
        <div class={style.profile}>
          <div class={style["follower-modal-cont"] + " " + (modalState && style.active)} onclick={closeModal}>
            <div class={style["follower-modal"]}>
              <div class={style["modal-header"]}>
                <strong>
                  {user.name}'s {modalType.slice(0, 1).toUpperCase() + modalType.slice(1)}
                </strong>
                <i class={"fa-solid fa-xmark " + style["close-modal"]} onclick={closeModal}></i>
              </div>
              {modalState && <FollowList type={modalType} userId={user.objectId} curUser={curUser} closeModal={closeModal} />}
            </div>
          </div>
          <img class={style["header-img"]} src={user?.banner?.original || bannerPlaceholder} />
          <div class="container">
            <div class={style["profile-header"]}>
              <img class={style["profile-picture"]} src={user?.profilePicture?.medium || ppPlaceholder} />
              <div class={style["profile-main"]}>
                <div class={style["profile-name-info"]}>
                  <div>
                    <h3>{user?.name || user.username}</h3><span class="smaller dimmed"> | </span>
                    <span class="smaller m-0 pointer" onclick={() => openModal("follower")}>
                      <strong>{user?.followers || 0}</strong> Followers
                    </span><span class="smaller dimmed"> | </span>
                    <span class="smaller m-0 pointer" onclick={() => openModal("following")}>
                      <strong>{user?.following || 0}</strong> Following
                    </span>
                    <p class="smaller dimmed m-0">@{user.username}</p>
                  </div>
                </div>
                <p class={style["profile-bio"]}>
                  {userFilter === "me" ? (
                    user.bio || (
                      <p class="m-0 dimmed">
                        <i>
                          You don't have a Biography yet!{" "}
                          <span class="accent pointer" onclick={openEdit}>
                            Add now
                          </span>
                        </i>
                      </p>
                    )
                  ) : (
                    <p>{user.bio}</p>
                  )}
                </p>
              </div>
              <div class={style["profile-secondary"]}>
                {user.objectId === curUser?.objectId ? (
                  <div class={style["user-btns"]}>
                    <button class="sec" onclick={openEdit}>
                      <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="pointer third block mt-05" onClick={logout}>
                      Logout
                    </button>
                  </div>
                ) : user.followed ? (
                  <button class={"sec " + style["follow-btn"]} onclick={follow}>
                    Unfollow
                  </button>
                ) : (
                  <button class={style["follow-btn"]} onclick={follow}>
                    <i class="fa-solid fa-user-plus"></i> Follow
                  </button>
                )}
              </div>
            </div>
            <div class={stylesExp.explore}>
              <div class={stylesExp["filter-outer"]}>
                <div class={"card " + stylesExp["filter-card"]}>
                  <Link href={"/profile/" + userFilter} activeClassName={stylesExp.active} class={stylesExp["filter-out"]}>
                    <strong>Posts</strong>
                  </Link>
                  <Link href={"/profile/" + userFilter + "/replies"} activeClassName={stylesExp.active} class={stylesExp["filter-out"]}>
                    <strong>Posts & Replies</strong>
                  </Link>
                  <Link href={"/profile/" + userFilter + "/media"} activeClassName={stylesExp.active} class={stylesExp["filter-out"]}>
                    <strong>Media</strong>
                  </Link>
                  <Link href={"/profile/" + userFilter + "/likes"} activeClassName={stylesExp.active} class={stylesExp["filter-out"]}>
                    <strong>Likes</strong>
                  </Link>
                </div>
                <Footer />
              </div>
              <div class={style.posts}>
                {curUser?.objectId === user.objectId && (
                  <div class="mt-2">
                    {" "}
                    <PostCard user={curUser} />{" "}
                  </div>
                )}
                {postsStatus === "success" &&
                  (postsData.pages[0].length === 0 ? (
                    <p class="accent" style={{ textAlign: "center", fontWeight: "500" }}>
                      No Posts found
                    </p>
                  ) : (
                    postsData.pages.map((page) => page.map((post) => <PostedCard data={post} user={curUser} />))
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
            </div>
          </div>
          {(userFilter === "me" || user.objectId === curUser?.objectId) && (
            <EditProfile oldUser={user} editStatus={editStatus} closeEdit={closeEdit} setUser={setUser} />
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;

const FollowList = ({ type, userId, curUser, closeModal }) => {
  const {
    status: userStatus,
    data: userData,
    error: userError,
  } = useQuery(userId + type, async () => {
    if (type === "following") {
      return Backendless.APIServices.Users.getAllUsers({ whereClause: [`followers in ('${userId}')`] });
    } else if (type === "follower") {
      return Backendless.APIServices.Users.getAllUsers({ whereClause: [`following in ('${userId}')`] });
    }
  });
  return (
    <div class={style["modal-body"]}>
      {userStatus === "success" ? (
        !!userData.length ? (
          userData.map((user) => <UserFollow followUser={user} curUser={curUser} closeModal={closeModal} />)
        ) : (
          <p class="loader-outer accent">{type === "following" ? "This account follows no one" : "This account has no followers yet"}</p>
        )
      ) : (
        <Loader />
      )}
    </div>
  );
};

const UserFollow = ({ followUser, curUser, closeModal }) => {
  const [user, setUser] = useState(followUser);

  async function follow(e) {
    e.stopPropagation();
    e.preventDefault();
    toastInfo("Please login to follow");
    if (!curUser) {
      route("/signup");
      return;
    }
    let newUser = { ...user };
    newUser.followers = user.followed ? user.followers - 1 : user.followers + 1;
    newUser.followed = !user.followed;
    setUser(newUser);
    if (!user.followed) {
      await Backendless.APIServices.Users.followUser(user.objectId).catch((err) => {
        newUser = { ...user };
        newUser.followed = !user.followed;
        newUser.followers = user.followers - 1;
        setUser(newUser);
        toastSuccess(err);
      });
    } else {
      await Backendless.APIServices.Users.unfollowUser(user.objectId).catch((err) => {
        newUser = { ...user };
        newUser.followed = !user.followed;
        newUser.followers = user.followers + 1;
        setUser(newUser);
        toastSuccess(err);
      });
    }
  }

  return (
    <Link href={"/profile/" + followUser.username} class={style["follower-item"]}>
      <div class={style["follower-item-main"]}>
        <div onClick={closeModal}>
          <div class={style["follower-header"]}>
            <img src={user.profilePicture?.small} />
            <div>
              <p class="m-0">
                <strong>{user.name}</strong>
                <span class="m-0 smaller dimmed"> | {user.followers} Followers</span>
              </p>
              <p class="dimmed m-0 small">{user.bio}</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        {followUser.objectId !== curUser?.objectId && (
          <button class={user.followed && "sec"} onClick={follow}>
            {!user.followed && <i class="fa-solid fa-user-plus"></i>} {user.followed ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>
    </Link>
  );
};
