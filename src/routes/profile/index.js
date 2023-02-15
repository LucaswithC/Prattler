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

import pb from "../../_pocketbase/connect";
import { getAll } from "../../_pocketbase/services/Posts";
import { followUser, getAllUsers, unfollowUser } from "../../_pocketbase/services/Users";
import toastError from "../../components/toasts/error";

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
      return pb.authStore?.model;
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
      res = pb.authStore.model;
    } else {
      res = await pb.collection("users").getOne(userFilter);
      console.log(res);
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
    async ({ pageParam = 1 }) => {
      let filterQuery = {};
      filterQuery.filter = [`author = "${user.id}"`];
      if (!filter) filterQuery.filter.push('(type = "post" || type = "repost")');
      else if (filter === "replies") filterQuery.filter.push('(type = "post" || type = "repost" || type = "comment")');
      else if (filter === "media") filterQuery.filter.push(`(type = "post" && post.images:length > 0)`);
      else if (filter === "likes") filterQuery.filter.push('type = "like"');
      filterQuery.sort = "-created";
      return getAll(filterQuery, 20, pageParam);
    },
    {
      getNextPageParam: (lastPage, pages) =>  (lastPage.totalPages > pages.length ? pages.length + 1 : undefined),
      enabled: !!user,
    }
  );

  useEffect(async () => {
    if (curUser && !pb.authStore.isValid) {
      pb.authStore.clear();
      location.reload();
    }
  }, [curUser]);

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
    pb.authStore.clear();
    queryClient.invalidateQueries("currentUser");
    route("/explore/top");
  }

  async function follow() {
    if (!curUser) {
      toastInfo("Please login to follow");
      route("/signup");
      return;
    }
    // let newUser = { ...user };
    // newUser.followers = user.followed ? user.followers - 1 : user.followers + 1;
    // newUser.followed = !user.followed;
    // setUser(newUser);
    if (!curUser.follows.includes(user.id)) {
      followUser(user.id)
        .then((res) => {
          queryClient.invalidateQueries(userFilter + "-User");
          queryClient.invalidateQueries("currentUser");
        })
        .catch((err) => {
          // newUser = { ...user };
          // newUser.followed = !user.followed;
          // newUser.followers = user.followers - 1;
          // setUser(newUser);
          toastError(err);
        });
    } else {
      unfollowUser(user.id)
        .then((res) => {
          queryClient.invalidateQueries(userFilter + "-User");
          queryClient.invalidateQueries("currentUser");
        })
        .catch((err) => {
          console.log(err);
          // newUser = { ...user };
          // newUser.followed = !user.followed;
          // newUser.followers = user.followers + 1;
          // setUser(newUser);
          toastError(err);
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
              {modalState && <FollowList type={modalType} userId={user.id} curUser={curUser} closeModal={closeModal} userFilter={userFilter} />}
            </div>
          </div>
          <img class={style["header-img"]} src={user?.banner ? pb.getFileUrl(user, user.banner) : bannerPlaceholder} />
          <div class="container">
            <div class={style["profile-header"]}>
              <img class={style["profile-picture"]} src={user?.avatar ? pb.getFileUrl(user, user.avatar) : ppPlaceholder} />
              <div class={style["profile-main"]}>
                <div class={style["profile-name-info"]}>
                  <div>
                    <h3>{user?.name || user.username}</h3>
                    <span class="smaller dimmed"> | </span>
                    <span class="smaller m-0 pointer" onclick={() => openModal("follower")}>
                      <strong>{user?.followers.length || 0}</strong> Followers
                    </span>
                    <span class="smaller dimmed"> | </span>
                    <span class="smaller m-0 pointer" onclick={() => openModal("following")}>
                      <strong>{user?.follows.length || 0}</strong> Following
                    </span>
                    <p class="smaller dimmed m-0">@{user.username}</p>
                  </div>
                </div>
                <p class={style["profile-bio"]}>
                  {userFilter === "me" ? (
                    user.biography || (
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
                    <p>{user.biography}</p>
                  )}
                </p>
              </div>
              <div class={style["profile-secondary"]}>
                {user.id === curUser?.id ? (
                  <div class={style["user-btns"]}>
                    <button class="sec" onclick={openEdit}>
                      <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="pointer third block mt-05" onClick={logout}>
                      Logout
                    </button>
                  </div>
                ) : curUser?.follows.includes(user.id) ? (
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
                {curUser?.id === user.id && (
                  <div class="mt-2">
                    {" "}
                    <PostCard user={curUser} />{" "}
                  </div>
                )}
                {postsStatus === "success" &&
                  (postsData.pages[0].totalItems === 0 ? (
                    <p class="accent" style={{ textAlign: "center", fontWeight: "500" }}>
                      No Posts found
                    </p>
                  ) : (
                    postsData.pages.map((page) => page.items.map((post) => <PostedCard data={post} user={curUser} />))
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

const FollowList = ({ type, userId, curUser, closeModal, userFilter }) => {
  const {
    status: userStatus,
    data: userData,
    error: userError,
  } = useQuery(userId + type, async () => {
    if (type === "following") {
      return getAllUsers({ filter: [`followers.id ?= "${userId}"`] });
      return Backendless.APIServices.Users.getAllUsers({ whereClause: [`followers in ('${userId}')`] });
    } else if (type === "follower") {
      return getAllUsers({ filter: [`follows.id ?= "${userId}"`] });
      // return Backendless.APIServices.Users.getAllUsers({ whereClause: [`following in ('${userId}')`] });
    }
  });
  return (
    <div class={style["modal-body"]}>
      {userStatus === "success" ? (
        !!userData.totalItems ? (
          userData.items.map((user) => <UserFollow openUser={user} curUser={curUser} closeModal={closeModal} userFilter={userFilter} />)
        ) : (
          <p class="loader-outer accent">{type === "following" ? "This account follows no one" : "This account has no followers yet"}</p>
        )
      ) : (
        <Loader />
      )}
    </div>
  );
};

const UserFollow = ({ openUser, curUser, closeModal, userFilter }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(openUser);
  const [isFollowing, setFollowing] = useState(curUser.follows.includes(openUser.id));

  async function follow(e) {
    e.stopPropagation();
    e.preventDefault();
    if (!curUser) {
      toastInfo("Please login to follow");
      route("/signup");
      return;
    }
    // let newUser = { ...user };
    // newUser.followers = user.followed ? user.followers - 1 : user.followers + 1;
    // newUser.followed = !user.followed;
    // setUser(newUser);
    if (!isFollowing) {
      followUser(openUser.id)
        .then((res) => {
          queryClient.invalidateQueries(userFilter + "-User");
          queryClient.invalidateQueries("currentUser")
          let newUser = { ...user };
          newUser.followers.push(curUser.id);
          setUser(newUser);
          setFollowing(true);
        })
        .catch((err) => {
          // newUser = { ...user };
          // newUser.followed = !user.followed;
          // newUser.followers = user.followers - 1;
          // setUser(newUser);
          toastError(err);
        });
    } else {
      unfollowUser(openUser.id)
        .then((res) => {
          queryClient.invalidateQueries(userFilter + "-User");
          queryClient.invalidateQueries("currentUser")
          let newUser = { ...user };
          newUser.followers = newUser.followers.filter((u) => u !== curUser.id);
          setUser(newUser);
          setFollowing(false);
        })
        .catch((err) => {
          // newUser = { ...user };
          // newUser.followed = !user.followed;
          // newUser.followers = user.followers + 1;
          // setUser(newUser);
          toastError(err);
        });
    }
  }

  return (
    <Link href={"/profile/" + openUser.id} class={style["follower-item"]}>
      <div class={style["follower-item-main"]}>
        <div onClick={closeModal}>
          <div class={style["follower-header"]}>
            <img src={openUser?.avatar ? pb.getFileUrl(openUser, openUser.avatar, { thumb: "60x0" }) : ppPlaceholder} />
            <div>
              <p class="m-0">
                <strong>{openUser.name || openUser.username}</strong>
                <span class="m-0 smaller dimmed"> | {user.followers.length} Followers</span>
              </p>
              <p class="dimmed m-0 small">{openUser.biography}</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        {openUser.id !== curUser?.id && (
          <button class={isFollowing && "sec"} onClick={follow}>
            {!isFollowing && <i class="fa-solid fa-user-plus"></i>} {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>
    </Link>
  );
};
