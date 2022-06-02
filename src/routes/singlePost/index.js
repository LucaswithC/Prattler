import { h } from "preact";
import style from "./style.css";
import { useEffect, useState, useRef } from "preact/hooks";

import Chocolat from "chocolat";
import { useQuery, useInfiniteQuery } from "react-query";
import { Link } from "preact-router";
import PostCard from "../../components/post-card";
import CommentCard from "../../components/comment-card";
import RepliedCard from "../../components/replied-card";

import useInView from "../../components/other/inView";

import toastError from "../../components/toasts/error";
import toastSuccess from "../../components/toasts/success";

import reactStringReplace from "react-string-replace";
import Loader from "../../components/loader/loader";

import createDate from "../../components/other/date";

import useClickOutside from "use-click-outside";
import Footer from "../../components/footer";
import { encode } from "url-encode-decode";

const PostedCard = ({ postId }) => {
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
      return Backendless.UserService.getCurrentUser();
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
      return Backendless.APIServices.Posts.getSinglePost(postId);
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
      let postTags = post.post.text.match(/#\w+/gi);
      if (postTags) return Backendless.APIServices.Posts.getTags(postTags);
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
    async ({ pageParam = 0 }) => {
      let sortBy;
      switch (sortComments) {
        case "newest":
          sortBy = "post.created DESC";
          break;
        case "oldest":
          sortBy = "post.created";
          break;
        default:
          sortBy = "Count(post.likes) DESC";
          break;
      }
      return Backendless.APIServices.Posts.getPostComments(post.post.postObjectId, { pageSize: 20, pageOffset: pageParam, sortBy });
    },
    {
      getNextPageParam: (lastPage, pages) => (lastPage.length === 20 ? pages.length * 20 : undefined),
      enabled: !!post,
    }
  );

  useEffect(async () => {
    if (userError?.code === 3064 || postError?.code === 3064 || tagsError?.code === 3064 || commentsError?.code === 3064) {
      Backendless.UserService.logout().then(function () {
        queryClient.invalidateQueries("currentUser");
        location.reload();
      });
    }
  }, [userStatus, postStatus, tagsStatus, commentStatus]);

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
          Chocolat(document.querySelectorAll(".chocolat-image-" + post.objectId), {
            loop: true,
          });
        }
        setLiked(post.post?.liked);
        setReposted(post.post?.reposted);
        setSaved(post.saved);
        setCommentAmount(post.post?.totalComments || 0);
        setLikedAmount(post.post?.totalLikes || 0);
        setRepostedAmount(post.post?.totalRepost || 0);
        setSavedAmount(post.totalSaved || 0);
      }
    }
  }, [postStatus, post]);

  useEffect(() => {
    if (loadInView) fetchNextPage();
  }, [loadInView]);

  async function repost(e) {
    if (!reposted) {
      setReposted(!reposted);
      setRepostedAmount(likedAmount + 1);
      await Backendless.APIServices.Posts.repost(post.post.postObjectId).catch((err) => {
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
      await Backendless.APIServices.Posts.likePost(post.post.postObjectId).catch((err) => {
        setLiked(!liked);
        setLikedAmount(likedAmount - 1);
        toastError(err.message);
      });
    } else {
      setLikedAmount(likedAmount - 1);
      await Backendless.APIServices.Posts.unlikePost(post.post.postObjectId).catch((err) => {
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
      await Backendless.APIServices.Posts.savePost(post.objectId).catch((err) => {
        setSaved(!saved);
        setSavedAmount(savedAmount - 1);
        toastError(err.message);
      });
    } else {
      setSavedAmount(savedAmount - 1);
      await Backendless.APIServices.Posts.unsavePost(post.objectId).catch((err) => {
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
        Backendless.APIServices.Posts.removePost(post.post.postObjectId)
          .then((res) => {
            toastSuccess("Post successful removed");
            history.back();
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
    <div class={style["single-post"] + " container mobile-space"}>
      {postStatus === "success" ? (
        post !== undefined ? (
          <div class={style["left-column"]}>
            <div class={style["post-back"]} onclick={() => history.back()}>
              <i class="fa-solid fa-arrow-left"></i> Back
            </div>
            {post.type === "Repost" && (
              <p class={style["post-notice"]}>
                <i class="fa-solid fa-retweet"></i> {post.newPublisher.name} reposted
              </p>
            )}
            {post.type === "Like" && (
              <p class={style["post-notice"]}>
                <i class="fa-regular fa-heart"></i> {post.newPublisher.name} liked
              </p>
            )}
            {post.type === "Comment" && (
              <p class={style["post-notice"]}>
                <i class="fa-regular fa-comment"></i> {post.post.creator.name} commented on {post.replyInformation.creatorName}
              </p>
            )}
            {!!post?.replyInformation && <RepliedCard data={post.replyInformation} single={true} />}
            <div class={style["posted-card"]}>
              <div class={style["posted-card-header"]}>
                <Link href={"/profile/" + post.post.creator.username}>
                  <img src={post.post.creator.profilePicture} />
                </Link>
                <Link href={"/profile/" + post.post.creator.username} class={style["posted-card-header-main"]}>
                  <p>
                    <strong>{post.post.creator.name}</strong>
                  </p>
                  <p class="smaller dimmed">{createDate(post.post.created)}</p>
                </Link>
                {user?.username === post.post.creator.username && (
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
                  {reactStringReplace(post.post.text, /(#\w+)/gi, (match, i) => (
                    <Link href={"/explore/top/" + match.replaceAll("#", "%23")} class="link" onclick={(e) => e.stopPropagation()}>
                      {match}
                    </Link>
                  ))}
                </p>
              </div>
              {post.post.images.length > 0 && (
                <div class={style["posted-card-pictures"] + " " + (post.post.images.length % 2 === 0 ? style["even"] : style["odd"])}>
                  {post.post.images.map((img) => (
                    <a class={"chocolat-image-" + post.objectId} href={img} title="image caption a">
                      <img src={img} />
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
              {user && (!(post.post.replyStatus === "followers" && !post.followed) || post.post.creator.ownerId === user.objectId) && (
                <PostCard user={user} commentOn={{ feedId: post.objectId, objectId: post.post.postObjectId, onFinish: onCommentPostet }} />
              )}

              <div class={style["comment-cont"]} style={{ overflow: "visible" }}>
                <div class={style["sort-comments"]}>
                  {post.post.replyStatus === "followers" && <p class="small dimmed m-0">Followers only</p>}
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
                <Link href={"/explore/top/" + encode(t.hashtag)} class={style["hashtag-cont"]}>
                  <p class="m-0">
                    <strong>{t.hashtag}</strong>
                  </p>
                  <p class="smaller m-0">{t.postCount} Posts</p>
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
        </div>*/}
        <Footer />
      </div>
    </div>
  );
};

export default PostedCard;
