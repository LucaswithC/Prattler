import { h } from "preact";
import style from "./style.css";
import { useEffect, useState, useRef } from "preact/hooks";
import { route, Link } from "preact-router";
import Chocolat from "chocolat";
import { useQueryClient } from "react-query";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import PostCard from "../post-card";

import toastSuccess from "../toasts/success.js";
import toastError from "../toasts/error.js";

import reactStringReplace from "react-string-replace";
import RepliedCard from "../replied-card";

import createDate from "../other/date";

import useClickOutside from "use-click-outside";

import pb from "../../_pocketbase/connect";
import { hidePost, likePost, removeRepost, repostPost, savePost, unlikePost, unsavePost } from "../../_pocketbase/services/Posts";

const { encode, decode } = require("url-encode-decode");

const PostedCard = ({ data, user }) => {
  const queryClient = useQueryClient();
  const [replyStatus, setReplyStatus] = useState(false);
  const [replySetting, setReplySetting] = useState("everyone");
  const [deleted, setDeleted] = useState(false);

  const [liked, setLiked] = useState(data.expand.post.didLike || false);
  const [likedAmount, setLikedAmount] = useState(data.expand.post.totalLikes || 0);
  const [reposted, setReposted] = useState(data.expand.post.didRepost || false);
  const [repostedAmount, setRepostedAmount] = useState(data.expand.post.totalReposts || 0);
  const [saved, setSaved] = useState(data.didSave || false);
  const [savedAmount, setSavedAmount] = useState(data.totalSaves || 0);

  const [extraMenu, setExtraMenu] = useState(false);
  const extraMenuRef = useRef();
  const newCommentRef = useRef();

  useClickOutside(extraMenuRef, () => {
    if (extraMenu) setExtraMenu(false);
  });

  const [newComments, setNewComments] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      Chocolat(document.querySelectorAll(".chocolat-image" + data.id), {
        loop: true,
      });
    }
  }, [data]);

  function onImgClick(e) {
    e.stopPropagation();
  }

  async function repost(e) {
    if(!pb.authStore?.model) {
      toastError("Please login to repost")
      return
    }
    setReposted(!reposted);
    if (!reposted) {
      setRepostedAmount(repostedAmount + 1);
      repostPost(data.post).catch((err) => {
        setReposted(false);
        setRepostedAmount(repostedAmount);
        toastError(err.message);
      });
    } else {
      setRepostedAmount(repostedAmount - 1);
      removeRepost(data.post).catch((err) => {
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
      await likePost(data.post).then().catch(async (err) => {
        setLiked(false);
        setLikedAmount(likedAmount);
        toastError(err.message);
      });
    } else {
      setLikedAmount(likedAmount - 1);
      await unlikePost(data.post).catch((err) => {
        setLiked(true);
        setLikedAmount(likedAmount);
        toastError(err.message);
      });
    }
  }

  async function save(e) {
    if (!user) {
      toastError("Please login to save posts")
      return
    }
    setSaved(!saved);
    if (!saved) {
      setSavedAmount(savedAmount + 1);
      savePost(data.id).catch((err) => {
        setSaved(!saved);
        setSavedAmount(savedAmount - 1);
        toastError(err.message);
      });
    } else {
      setSavedAmount(savedAmount - 1);
      unsavePost(data.id).catch((err) => {
        setSaved(!saved);
        setSavedAmount(savedAmount + 1);
        toastError(err.message);
      });
    }
  }

  function removePost(e) {
    e.stopPropagation();
    e.preventDefault();
    if (typeof window !== "undefined") {
      if (window.confirm("Do you really want to delete your Post?")) {
        hidePost(data.id)
          .then((res) => {
            toastSuccess("Post successful removed");
            setDeleted(true);
          })
          .catch((err) => {
            toastError("Something went wrong");
          });
      }
    }
  }

  function onCommentPostet(comment) {
    setNewComments([...newComments, comment]);
  }

  function openComments() {
    if (!user) return;
    if (newCommentRef.current.clientHeight > 0) {
      newCommentRef.current.style.height = newCommentRef.current.clientHeight + "px";
      newCommentRef.current.style.overflow = "hidden";
      setTimeout(() => {
        newCommentRef.current.style.height = 0;
      }, 1);
    } else {
      newCommentRef.current.style.height = newCommentRef.current.scrollHeight + "px";
      setTimeout(() => {
        if (newCommentRef.current.scrollHeight === newCommentRef.current.clientHeight) newCommentRef.current.style.height = "auto";
        newCommentRef.current.style.overflow = "visible";
      }, 250);
    }
  }

  return (
    !deleted && (
      <div>
        {data.type === "repost" && (
          <p class={style["post-notice"]}>
            <i class="fa-solid fa-retweet"></i> {data.expand.author.username} reposted
          </p>
        )}
        {data.type === "like" && (
          <p class={style["post-notice"]}>
            <i class="fa-regular fa-heart"></i> {data.expand.author.username} liked
          </p>
        )}
        {data.type === "comment" && (
          <p class={style["post-notice"]}>
            <i class="fa-regular fa-comment"></i> {data.expand.post.expand.author.username} commented{" "}
            {data?.expand?.comment?.expand?.author?.username && "on " + data?.expand?.comment?.expand?.author?.username}
          </p>
        )}
        {data.comment != "" && <RepliedCard data={data?.expand?.comment} />}
        <Link href={"/post/" + data.id} class={style["posted-card"]}>
          <div class={style["posted-card-header"]}>
            <Link href={"/profile/" + data.expand.post.expand.author.id}>
              <img
                src={
                  data.expand.post.expand.author?.avatar
                    ? pb.getFileUrl(data.expand.post.expand.author, data.expand.post.expand.author?.avatar, { thumb: "60x0" })
                    : ppPlaceholder
                }
              />
            </Link>
            <Link href={"/profile/" + data.expand.post.expand.author.id} class={style["posted-card-header-main"]}>
              <p>
                <strong>{data.expand.post.expand.author.name || data.expand.post.expand.author.username}</strong>
              </p>
              <p class="smaller dimmed">{createDate(data.expand.post.created)}</p>
            </Link>
            {user?.username === data.expand.post.expand.author.username && (
              <div class={style["posted-extra-menu"] + " " + (extraMenu && style["extra-open"])}>
                <i
                  class="fa-solid fa-ellipsis-vertical pointer"
                  onclick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
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
              {reactStringReplace(data.expand.post.text, /(#\w+)/gi, (match, i) => (
                <Link href={"/explore/top/" + encode(match)} class="link" onclick={(e) => e.stopPropagation()}>
                  {match}
                </Link>
              ))}
            </p>
          </div>
          {data?.expand.post.images.length > 0 && (
            <div class={style["posted-card-pictures"] + " " + (data?.expand.post.images.length % 2 === 0 ? style["even"] : style["odd"])}>
              {data?.expand.post.images.map((img) => (
                <a class={"chocolat-image" + data.id} href={pb.getFileUrl(data.expand.post, img)} title="image caption a" onclick={onImgClick}>
                  <img src={pb.getFileUrl(data.expand.post, img, { thumb: "350x0" })} />
                </a>
              ))}
            </div>
          )}
        </Link>
        <div class={style["posted-card-bottom"]}>
          <div class={style["posted-card-interaction"]}>
            <div class={style["interaction-button"] + " " + style["interaction-comment"]} tabindex="0" onclick={openComments}>
              <i class="fa-regular fa-comment"></i>
              <div>
                <p>{data.expand.post.totalComments || "0"}</p>
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
              <i class={"fa-heart" + " " + (liked ? "fa-solid" : "fa-regular")}></i>{" "}
              <div>
                <p>{likedAmount}</p>
                <p>Like</p>
              </div>
            </div>
            <div class={style["interaction-button"] + " " + style["interaction-save"]} onclick={save} tabindex="0">
              <i class={"fa-bookmark" + " " + (saved ? "fa-solid" : "fa-regular")}></i>{" "}
              <div>
                <p>{savedAmount}</p>
                <p>Bookmark</p>
              </div>
            </div>
          </div>
          {user && (
            <div ref={newCommentRef} class={style["newCommentsCont"]}>
              {(data.expand.post.canReply === "followers" && !user?.follows?.includes(data.expand.post.expand.author.id) && data.expand.post.author !== user?.id) ? (
                <p class="small dimmed m-0">Followers only</p>
                ) : (
                <PostCard user={user} commentOn={{ id: data.expand.post.id, onFinish: onCommentPostet }} />
              )}
            </div>
          )}
          <div class={style["comment-cont"]}>
            {newComments.reverse().map((com) => (
              <Link href={"/post/" + com.id} class={style["comment"]}>
                <img
                  src={
                    com.expand.post.expand.author.avatar
                      ? pb.getFileUrl(com.expand.post.expand.author, com.expand.post.expand.author.avatar, { thumb: "60x0" })
                      : ppPlaceholder
                  }
                />
                <div>
                  <div class={style["comment-header"]}>
                    <span class="smaller">
                      <strong>{com.expand.post.expand.author.name || com.expand.post.expand.author.username}</strong>{" "}
                      <span class="dimmed">{createDate(com.expand.post.created)}</span>
                    </span>
                  </div>
                  <p class={"smaller m-0 " + style["comment-text"]}>{com.expand.post.text}</p>
                  {/* <div class={style["comment-likes"] + " smaller"}>
                  <i class="fa-regular fa-heart"></i> 12 Likes
                </div> */}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  );
};

export default PostedCard;
