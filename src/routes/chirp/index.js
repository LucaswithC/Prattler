import { h } from "preact";
import style from "./style.css";
import { useEffect, useState, useRef } from "preact/hooks";

import Chocolat from "chocolat";
import { useQuery, useInfiniteQuery } from "react-query";
import { Link } from "preact-router";
import ChirpCard from "../../components/chirp-card";
import CommentCard from "../../components/comment-card";
import RepliedCard from "../../components/replied-card";

import useInView from "../../components/other/inView";

import toastError from "../../components/toasts/error";
import toastSuccess from "../../components/toasts/success";

import reactStringReplace from "react-string-replace";
import Loader from "../../components/loader/loader";

import createDate from "../../components/other/date";

import useClickOutside from 'use-click-outside';

const ChirpedCard = ({ chirpId }) => {
  const [replySetting, setReplySetting] = useState("everyone");
  const { isInView: loadInView, inViewRef: loadRef } = useInView();
  const [sortComments, setSortComments] = useState("top")

  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser();
  });
  const {
    status: chirpStatus,
    data: chirp,
    error: chirpError,
  } = useQuery("chirp-" + chirpId, async () => {
    return Backendless.APIServices.Posts.getSinglePost(chirpId);
  }, {
    retry: false
  });
  const {
    status: commentStatus,
    data: comments,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    ["chirp-comments-" + chirpId, chirp, sortComments],
    async ({ pageParam = 0 }) => {
      let sortBy;
      switch (sortComments) {
        case "newest":
          sortBy = "post.created DESC"
          break;
        case "oldest":
          sortBy = "post.created"
          break;
        default:
          sortBy = "Count(post.likes) DESC"
          break;
      }
      return Backendless.APIServices.Posts.getPostComments(chirp.post.postObjectId, { pageSize: 20, pageOffset: pageParam, sortBy  });
    },
    {
      getNextPageParam: (lastPage, pages) => (lastPage.length === 20 ? pages.length * 20 : undefined),
      enabled: !!chirp,
    }
  );

  const [newComments, setNewComments] = useState([]);

  const [commentAmount, setCommentAmount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likedAmount, setLikedAmount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [repostedAmount, setRepostedAmount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);

  const [extraMenu, setExtraMenu] = useState(false);
  const [sortStatus, setSortStatus] = useState(false);

  const extraMenuRef = useRef();
  const extraMenuCom = useRef();

  useClickOutside(extraMenuRef, () => {if(extraMenu) setExtraMenu(false)});
  useClickOutside(extraMenuCom, () => {if(sortStatus) setSortStatus(false)});

  useEffect(() => {
    if (chirpStatus === "success") {
      if (chirp !== undefined) {
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0 });
          Chocolat(document.querySelectorAll(".chocolat-image-" + chirp.objectId), {
            loop: true,
          });
        }
        setLiked(chirp.post?.liked);
        setReposted(chirp.post?.reposted);
        setSaved(chirp.saved);
        setCommentAmount(chirp.post?.totalComments || 0);
        setLikedAmount(chirp.post?.totalLikes || 0);
        setRepostedAmount(chirp.post?.totalRepost || 0);
        setSavedAmount(chirp.totalSaved || 0);
      }
    }
  }, [chirpStatus, chirp]);

  useEffect(() => {
    if (loadInView) fetchNextPage();
  }, [loadInView]);

  async function rechirp(e) {
    if (!reposted) {
      setReposted(!reposted);
      setRepostedAmount(likedAmount + 1);
      await Backendless.APIServices.Posts.repost(chirp.post.postObjectId).catch((err) => {
        setReposted(!liked);
        setRepostedAmount(likedAmount - 1);
        toastError(err.message);
      });
    } else {
      toastError("Delete your Post to remove the repost");
    }
  }

  async function like(e) {
    setLiked(!liked);
    if (!liked) {
      setLikedAmount(likedAmount + 1);
      await Backendless.APIServices.Posts.likePost(chirp.post.postObjectId).catch((err) => {
        setLiked(!liked);
        setLikedAmount(likedAmount - 1);
        toastError(err.message);
      });
    } else {
      setLikedAmount(likedAmount - 1);
      await Backendless.APIServices.Posts.unlikePost(chirp.post.postObjectId).catch((err) => {
        setLiked(!liked);
        setLikedAmount(likedAmount + 1);
        toastError(err.message);
      });
    }
  }

  async function save(e) {
    setSaved(!saved);
    if (!saved) {
      setSavedAmount(savedAmount + 1);
      await Backendless.APIServices.Posts.savePost(chirp.objectId).catch((err) => {
        setSaved(!saved);
        setSavedAmount(savedAmount - 1);
        toastError(err.message);
      });
    } else {
      setSavedAmount(savedAmount - 1);
      await Backendless.APIServices.Posts.unsavePost(chirp.objectId).catch((err) => {
        setSaved(!saved);
        setSavedAmount(savedAmount + 1);
        toastError(err.message);
      });
    }
  }

  function removeChirp(e) {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      if (window.confirm("Do you really want to delete your Chirp?")) {
        Backendless.APIServices.Posts.removePost(chirp.post.postObjectId)
          .then((res) => {
            toastSuccess("Chirp successful removed");
            history.back()
          })
          .catch((err) => {
            toastError("Something went wrong");
          });
      }
    }
  }

  function onCommentPostet(comment) {
    setNewComments([...newComments, comment]);
    setCommentAmount(commentAmount + 1);
  }

  return (
    <div class={style["single-chirp"] + " container"}>
      {chirpStatus === "success" ? (
        chirp !== undefined ? (
          <div class={style["left-column"]}>
            <div class={style["chirp-back"]} onclick={() => history.back()}>
              <i class="fa-solid fa-arrow-left"></i> Back
            </div>
            {chirp.type === "Repost" && (
              <p class={style["chirp-notice"]}>
                <i class="fa-solid fa-retweet"></i> {chirp.newPublisher.name} rechirped
              </p>
            )}
            {chirp.type === "Like" && (
              <p class={style["chirp-notice"]}>
                <i class="fa-regular fa-heart"></i> {chirp.newPublisher.name} liked
              </p>
            )}
            {chirp.type === "Comment" && (
              <p class={style["chirp-notice"]}>
                <i class="fa-regular fa-comment"></i> {chirp.post.creator.name} commented on {chirp.replyInformation.creatorName}
              </p>
            )}
            {!!chirp?.replyInformation && <RepliedCard data={chirp.replyInformation} single={true} />}
            <div class={style["chirped-card"]}>
              <div class={style["chirped-card-header"]}>
                <Link href={"/profile/" + chirp.post.creator.username}>
                  <img src={chirp.post.creator.profilePicture} />
                </Link>
                <Link href={"/profile/" + chirp.post.creator.username} class={style["chirped-card-header-main"]}>
                  <p>
                    <strong>{chirp.post.creator.name}</strong>
                  </p>
                  <p class="smaller dimmed">{createDate(chirp.post.created)}</p>
                </Link>
                {user?.username === chirp.post.creator.username && (
                  <div class={style["chirped-extra-menu"]}>
                    <i
                      class="fa-solid fa-ellipsis-vertical pointer"
                      onclick={(e) => {
                        e.stopPropagation();
                        setExtraMenu(true);
                      }}
                    ></i>
                    {extraMenu && (
                      <div ref={extraMenuRef} class={style["chirped-extra-dropdown"]}>
                        <div class="red" onclick={removeChirp}>
                          Remove
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div class={style["chirped-card-body"]}>
                <p class="text-pre-wrap">
                  {reactStringReplace(chirp.post.text, /(#\w+)/gi, (match, i) => (
                    <Link href={"/explore/top/" + match.replaceAll("#", "%23")} class="link" onclick={(e) => e.stopPropagation()}>
                      {match}
                    </Link>
                  ))}
                </p>
              </div>
              {chirp.post.images.length > 0 && (
                <div class={style["chirped-card-pictures"] + " " + (chirp.post.images.length % 2 === 0 ? style["even"] : style["odd"])}>
                  {chirp.post.images.map((img) => (
                    <a class={"chocolat-image-" + chirp.objectId} href={img} title="image caption a">
                      <img src={img} />
                    </a>
                  ))}
                </div>
              )}
              <div class={style["chirped-card-interaction"]}>
                <div class={style["interaction-button"] + " " + style["interaction-comment"]} tabindex="0">
                  <i class="fa-regular fa-comment"></i>
                  <div>
                    <p>{commentAmount}</p>
                    <p>Comment</p>
                  </div>
                </div>
                <div class={style["interaction-button"] + " " + style["interaction-retweet"] + " " + (reposted && "rechirped")} onclick={rechirp} tabindex="0">
                  <i class="fa-solid fa-retweet"></i>{" "}
                  <div>
                    <p>{repostedAmount}</p>
                    <p>Rechirp</p>
                  </div>
                </div>
                <div class={style["interaction-button"] + " " + style["interaction-like"] + " " + (liked && "liked")} onclick={like} tabindex="0">
                  <i class={"fa-heart " + (liked ? "fa-solid" : "fa-regular")}></i>{" "}
                  <div>
                    <p>{likedAmount}</p>
                    <p>Like</p>
                  </div>
                </div>
                <div class={style["interaction-button"] + " " + style["interaction-save"]} onclick={save} tabindex="0">
                  <i class={"fa-bookmark " + (saved ? "fa-solid" : "fa-regular")}></i>{" "}
                  <div>
                    <p>{savedAmount}</p>
                    <p>Bookmark</p>
                  </div>
                </div>
              </div>
              {user && (!(chirp.post.replyStatus === "followers" && !chirp.followed) || chirp.post.creator.ownerId === user.objectId) && (
                <ChirpCard user={user} commentOn={{ feedId: chirp.objectId, objectId: chirp.post.postObjectId, onFinish: onCommentPostet }} />
              )}

              <div class={style["comment-cont"]} style={{ overflow: "visible" }}>
                <div class={style["sort-comments"]}>
                  {chirp.post.replyStatus === "followers" && <p class="small dimmed m-0">Followers only</p>}
                  <div class={style["sort-comments-btn"]} onclick={() => setSortStatus(true)}>
                    <i class="fa-solid fa-arrow-down-wide-short"></i> Sort Comments
                  </div>
                  {sortStatus && (
                    <div class={style["sort-comments-selection"]} ref={extraMenuCom}>
                      <div onclick={() => {setSortComments("top"); setSortStatus(false)}}>
                        <i class="fa-solid fa-heart"></i> Popularity
                      </div>
                      <div onclick={() => {setSortComments("newest"); setSortStatus(false)}}>
                        <i class="fa-solid fa-clock"></i> Newest first
                      </div>
                      <div onclick={() => {setSortComments("oldest"); setSortStatus(false)}}>
                        <i class="fa-solid fa-clock-rotate-left"></i> Oldest first
                      </div>
                    </div>
                  )}
                </div>
                {!!newComments.length && newComments.reverse().map((com) => <CommentCard data={com} user={user} />)}
                {commentStatus === "success" &&
                  (!comments.pages[0].length && !newComments.length ? (
                    <div style={{ textAlign: "center" }} class="accent">
                      This post received no comments yet
                    </div>
                  ) : (
                    comments.pages.map((page) => page.map((com) => <CommentCard data={com} user={user} />))
                  ))}
                <div ref={loadRef}>
                  {isFetchingNextPage || commentStatus === "loading" ? (
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
        ) : (
          <div>Chirp not found</div>
        )
      ) : chirpStatus === 'error' ? 
      (<p class="accent text-center">Post not found</p>) 
      : ( <Loader />
      )}
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
          {/* {homeUser && (
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
          )} */}
        </div>
        <p class="smaller dimmed">
          2021 - {new Date().getFullYear()} |{" "}
          <a href="https://github.com/LucaswithC" target="_blank">
            © Lucas Kiers
          </a>
        </p>
      </div>
    </div>
  );
};

export default ChirpedCard;
