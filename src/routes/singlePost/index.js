import { h } from "preact";
import style from "./style.css";
import { useEffect, useState, useRef } from "preact/hooks";

import Chocolat from "chocolat";
import { useQuery, useInfiniteQuery } from "react-query";
import { Link } from "preact-router";
import PostCard from "../../components/post-card";
import CommentCard from "../../components/comment-card";
import RepliedCard from "../../components/replied-card";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";

import useInView from "../../components/other/inView";

import toastError from "../../components/toasts/error";
import toastSuccess from "../../components/toasts/success";

import reactStringReplace from "react-string-replace";
import Loader from "../../components/loader/loader";

import createDate from "../../components/other/date";

import useClickOutside from "use-click-outside";
import Footer from "../../components/footer";
import { encode } from "url-encode-decode";
import pb from "../../_pocketbase/connect";
import { getPostComments, getSinglePost, getTags, hidePost, likePost, removeRepost, repostPost, savePost, unlikePost, unsavePost } from "../../_pocketbase/services/Posts";

const PostedCard = ({ postId, comment }) => {
  const [replySetting, setReplySetting] = useState("everyone");
  const { isInView: loadInView, inViewRef: loadRef } = useInView();
  const [sortComments, setSortComments] = useState("top");

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

  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery(
    "currentUser",
    async () => {
      return pb?.authStore?.model;
    },
    {
      retry: false,
    }
  );
  const {
    status: postStatus,
    data: post,
    error: postError,
  } = useQuery(
    "post-" + postId,
    async () => {
      return getSinglePost(postId, comment !== undefined);
    },
    {
      retry: false,
    }
  );
  const {
    status: tagsStatus,
    data: tags,
    error: tagsError,
  } = useQuery(
    "tags-" + postId,
    async () => {
      let postTags = post.expand.post.text.match(/#\w+/gi);
      if (postTags) return getTags(postTags);
      return [];
    },
    {
      enabled: !!post && window.innerWidth > 850,
    }
  );
  const {
    status: commentStatus,
    data: comments,
    error: commentsError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    ["post-comments-" + postId, post, sortComments],
    async ({ pageParam = 1 }) => {
      let sortBy;
      switch (sortComments) {
        case "newest":
          sortBy = "-created";
          break;
        case "oldest":
          sortBy = "+created";
          break;
        default:
          sortBy = "-post.totalLikes,-created";
          break;
      }
      return getPostComments(post.expand.post.id, sortBy, 20, pageParam);
    },
    {
      getNextPageParam: (lastPage, pages) => (lastPage.totalPages > pages.length ? pages.length + 1 : undefined),
      enabled: !!post,
    }
  );

  useEffect(async () => {
    if (user && !pb.authStore.isValid) {
      pb.authStore.clear();
      queryClient.invalidateQueries("currentUser");
      location.reload();
    }
  }, [user]);

  useClickOutside(extraMenuRef, () => {
    if (extraMenu) setExtraMenu(false);
  });
  useClickOutside(extraMenuCom, () => {
    if (sortStatus) setSortStatus(false);
  });

  useEffect(() => {
    if (postStatus === "success") {
      if (post !== undefined) {
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0 });
          Chocolat(document.querySelectorAll(".chocolat-image-" + post.id), {
            loop: true,
          });
        }
        setLiked(post.expand.post?.didLike);
        setReposted(post.expand.post?.didRepost);
        setSaved(post.didSave || false);
        setCommentAmount(post.expand.post?.totalComments || 0);
        setLikedAmount(post.expand.post?.totalLikes || 0);
        setRepostedAmount(post.expand.post?.totalReposts || 0);
        setSavedAmount(post.totalSaves || 0);
        setNewComments([]);
      }
    }
    console.log(post);
  }, [postStatus, post]);

  useEffect(() => {
    if (loadInView) fetchNextPage();
  }, [loadInView]);

  async function repost(e) {
    if(!pb.authStore?.model) {
      toastError("Please login to repost")
      return
    }
    setReposted(!reposted);
    if (!reposted) {
      setRepostedAmount(repostedAmount + 1);
      repostPost(post.post).catch((err) => {
        setReposted(false);
        setRepostedAmount(repostedAmount);
        toastError(err.message);
      });
    } else {
      setRepostedAmount(repostedAmount - 1)
      removeRepost(post.post).then(res => {
        if (post.type === "repost" && user?.id === post.author) {
          history.back();
        }
      }).catch((err) => {
        setReposted(true);
        setRepostedAmount(repostedAmount);
        toastError(err.message);
      });
    }
  }

  async function like(e) {
    if(!pb.authStore?.model) {
      toastError("Please login to like")
      return
    }
    setLiked(!liked);
    if (!liked) {
      setLikedAmount(likedAmount + 1);
      likePost(post.post).catch((err) => {
        setLiked(false);
        setLikedAmount(likedAmount);
        toastError(err.message);
      });
    } else {
      setLikedAmount(likedAmount - 1);
      unlikePost(post.post).catch((err) => {
        setLiked(true);
        setLikedAmount(likedAmount);
        toastError(err.message);
      });
    }
  }

  async function save(e) {
    if(!user) {
      toastError("Please login to save a post")
      return
    }
    setSaved(!saved);
    if (!saved) {
      setSavedAmount(savedAmount + 1);
      savePost(post.id).catch((err) => {
        setSaved(!saved);
        setSavedAmount(savedAmount - 1);
        toastError(err.message);
      });
    } else {
      setSavedAmount(savedAmount - 1);
      unsavePost(post.id).catch((err) => {
        setSaved(!saved);
        setSavedAmount(savedAmount + 1);
        toastError(err.message);
      });
    }
  }

  function removePost(e) {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      if (window.confirm("Do you really want to delete your Post?")) {
        hidePost(post.id)
          .then((res) => {
            toastSuccess("Post successful removed");
            history.back();
          })
          .catch((err) => {
            console.log(err)
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
    <div class={style["single-post"] + " container mobile-space"}>
      {postStatus === "success" ? (
        post !== undefined ? (
          <div class={style["left-column"]}>
            <div class={style["post-back"]} onclick={() => history.back()}>
              <i class="fa-solid fa-arrow-left"></i> Back
            </div>
            {post.type === "repost" && (
              <p class={style["post-notice"]}>
                <i class="fa-solid fa-retweet"></i> {post.expand.author.username} reposted
              </p>
            )}
            {post.type === "like" && (
              <p class={style["post-notice"]}>
                <i class="fa-regular fa-heart"></i> {post.expand.author.username} liked
              </p>
            )}
            {post.type === "comment" && (
              <p class={style["post-notice"]}>
                <i class="fa-regular fa-comment"></i> {post.expand.post.expand.author.username} commented{" "}
                {post?.expand?.comment?.author?.username && "on " + post?.expand?.comment?.author?.username}
              </p>
            )}
            {post.comment != "" && <RepliedCard data={post.expand.comment} single={true} />}
            <div class={style["posted-card"]}>
              <div class={style["posted-card-header"]}>
                <Link href={"/profile/" + post.expand.post.expand.author.id}>
                  <img
                    src={
                      post?.expand?.post?.expand?.author?.avatar
                        ? pb.getFileUrl(post.expand.post.expand.author, post.expand.post.expand.author.avatar, { thumb: "250x0" })
                        : ppPlaceholder
                    }
                  />
                </Link>
                <Link href={"/profile/" + post.expand.post.expand.author.id} class={style["posted-card-header-main"]}>
                  <p>
                    <strong>{post.expand.post.expand.author.name || post.expand.post.expand.author.username}</strong>
                  </p>
                  <p class="smaller dimmed">{createDate(post.expand.post.created)}</p>
                </Link>
                {user?.id === post.expand.post.expand.author.id && (
                  <div class={style["posted-extra-menu"]}>
                    <i
                      class="fa-solid fa-ellipsis-vertical pointer"
                      onclick={(e) => {
                        e.stopPropagation();
                        setExtraMenu(true);
                      }}
                    ></i>
                    {extraMenu && (
                      <div ref={extraMenuRef} class={style["posted-extra-dropdown"]}>
                        <div class="red" onclick={removePost}>
                          Remove
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div class={style["posted-card-body"]}>
                <p class="text-pre-wrap">
                  {reactStringReplace(post.expand.post.text, /(#\w+)/gi, (match, i) => (
                    <Link href={"/explore/top/" + match.replaceAll("#", "%23")} class="link" onclick={(e) => e.stopPropagation()}>
                      {match}
                    </Link>
                  ))}
                </p>
              </div>
              {post.expand.post.images.length > 0 && (
                <div class={style["posted-card-pictures"] + " " + (post.expand.post.images.length % 2 === 0 ? style["even"] : style["odd"])}>
                  {post.expand.post.images.map((img) => (
                    <a class={"chocolat-image-" + post.id} href={pb.getFileUrl(post.expand.post, img)} title="image caption a">
                      <img src={pb.getFileUrl(post.expand.post, img, { thumb: "350x0" })} />
                    </a>
                  ))}
                </div>
              )}
              <div class={style["posted-card-interaction"]}>
                <div class={style["interaction-button"] + " " + style["interaction-comment"]} tabindex="0">
                  <i class="fa-regular fa-comment"></i>
                  <div>
                    <p>{commentAmount}</p>
                    <p>Comment</p>
                  </div>
                </div>
                <div class={style["interaction-button"] + " " + style["interaction-retweet"] + " " + (reposted && "reposted")} onclick={repost} tabindex="0">
                  <i class="fa-solid fa-retweet"></i>{" "}
                  <div>
                    <p>{repostedAmount}</p>
                    <p>Repost</p>
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
              {user && 
              ((post.expand.post.canReply === "followers" && (user?.follows?.includes(post.expand.post.author) || post.expand.post.author === user?.id)) || post.expand.post.canReply === "everyone" || true) && (
                <PostCard user={user} commentOn={{ id: post.expand.post.id, onFinish: onCommentPostet }} />
              )}

              <div class={style["comment-cont"]} style={{ overflow: "visible" }}>
                <div class={style["sort-comments"]}>
                  {post.expand.post.canReply === "followers" && <p class="small dimmed m-0">Followers only</p>}
                  <div class={style["sort-comments-btn"]} onclick={() => setSortStatus(true)}>
                    <i class="fa-solid fa-arrow-down-wide-short"></i> Sort Comments
                  </div>
                  {sortStatus && (
                    <div class={style["sort-comments-selection"]} ref={extraMenuCom}>
                      <div
                        onclick={() => {
                          setSortComments("top");
                          setSortStatus(false);
                        }}
                      >
                        <i class="fa-solid fa-heart"></i> Popularity
                      </div>
                      <div
                        onclick={() => {
                          setSortComments("newest");
                          setSortStatus(false);
                        }}
                      >
                        <i class="fa-solid fa-clock"></i> Newest first
                      </div>
                      <div
                        onclick={() => {
                          setSortComments("oldest");
                          setSortStatus(false);
                        }}
                      >
                        <i class="fa-solid fa-clock-rotate-left"></i> Oldest first
                      </div>
                    </div>
                  )}
                </div>
                {!!newComments.length && newComments.reverse().map((com) => <CommentCard data={com} user={user} />)}
                {commentStatus === "success" &&
                  (!comments.pages[0].totalItems && !newComments.length ? (
                    <div style={{ textAlign: "center" }} class="accent">
                      This post received no comments yet
                    </div>
                  ) : (
                    comments.pages.map((page) => page.items.map((com) => <CommentCard data={com} user={user} />))
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
          <div>Post not found</div>
        )
      ) : postStatus === "error" ? (
        <p class="accent text-center">Post not found</p>
      ) : (
        <Loader />
      )}

      <div class={style["right-column"]}>
        {tagsStatus === "success" && tags.length > 0 && (
          <div class="card">
            <div class="card-header">
              <strong class="smaller">Post Hashtags</strong>
            </div>
            <div class="card-body">
              {tags.map((t) => (
                <Link href={"/explore/top/" + encode(t.name)} class={style["hashtag-cont"]}>
                  <p class="m-0">
                    <strong>{t.name}</strong>
                  </p>
                  <p class="smaller m-0">{t.amount} Posts</p>
                </Link>
              ))}
            </div>
          </div>
        )}
        {/* <div class="card">
          <div class="card-header">
            <strong class="smaller">Who to follow</strong>
          </div>
         {homeUser && (
            <div class="card-body">
              {homeUser.map((user) => (
                <Link href={"/profile/" + user.username} class={style["follow-card"]}>
                  <img class={style["follow-banner"]} src={user.banner?.small || bannerPlaceholder} />
                  <img class={style["follow-profile-picture"]} src={user.profilePicture?.small || ppPlaceholder} />
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
        </div>*/}
        <Footer />
      </div>
    </div>
  );
};

export default PostedCard;
