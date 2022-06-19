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

const { encode, decode } = require("url-encode-decode");

const PostedCard = ({ data, user }) => {
  const queryClient = useQueryClient();
  const [replyStatus, setReplyStatus] = useState(false);
  const [replySetting, setReplySetting] = useState("everyone");
  const [deleted, setDeleted] = useState(false);

  const [liked, setLiked] = useState(data.post.liked || false);
  const [likedAmount, setLikedAmount] = useState(data.post.totalLikes || 0);
  const [reposted, setReposted] = useState(data.post.reposted || false);
  const [repostedAmount, setRepostedAmount] = useState(data.post.totalRepost || 0);
  const [saved, setSaved] = useState(data.saved || false);
  const [savedAmount, setSavedAmount] = useState(data.totalSaved || 0);

  const [extraMenu, setExtraMenu] = useState(false);
  const extraMenuRef = useRef();
  const newCommentRef = useRef();

  useClickOutside(extraMenuRef, () => {
    if (extraMenu) setExtraMenu(false);
  });

  const [newComments, setNewComments] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      Chocolat(document.querySelectorAll(".chocolat-image" + data.objectId), {
        loop: true,
      });
    }
  }, [data]);

  function onImgClick(e) {
    e.stopPropagation();
  }

  async function repost(e) {
    setReposted(!reposted);
    if (!reposted) {
      setRepostedAmount(repostedAmount + 1);
      await Backendless.APIServices.Posts.repost(data.post.postObjectId).catch((err) => {
        setReposted(!liked);
        setRepostedAmount(likedAmount - 1);
        toastError(err.message);
      });
    } else {
      setRepostedAmount(repostedAmount - 1);
      await Backendless.APIServices.Posts.removeRepost(data.post.postObjectId).catch((err) => {
        setReposted(!liked);
        setRepostedAmount(repostedAmount + 1);
        toastError(err.message);
      });
    }
  }

  async function like(e) {
    setLiked(!liked);
    if (!liked) {
      setLikedAmount(likedAmount + 1);
      await Backendless.APIServices.Posts.likePost(data.post.postObjectId).catch((err) => {
        setLiked(!liked);
        setLikedAmount(likedAmount - 1);
        toastError(err.message);
      });
    } else {
      setLikedAmount(likedAmount - 1);
      await Backendless.APIServices.Posts.unlikePost(data.post.postObjectId).catch((err) => {
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
      await Backendless.APIServices.Posts.savePost(data.objectId).catch((err) => {
        setSaved(!saved);
        setSavedAmount(savedAmount - 1);
        toastError(err.message);
      });
    } else {
      setSavedAmount(savedAmount - 1);
      await Backendless.APIServices.Posts.unsavePost(data.objectId).catch((err) => {
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
        Backendless.APIServices.Posts.removePost(data.post.postObjectId)
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
    if(!user) return;
    if(newCommentRef.current.clientHeight > 0) {
      newCommentRef.current.style.height = newCommentRef.current.clientHeight + "px";
      setTimeout(() => {
        newCommentRef.current.style.height = 0;
      }, 1)
    } else {
      newCommentRef.current.style.height = newCommentRef.current.scrollHeight + "px";
      setTimeout(() => {
        if(newCommentRef.current.scrollHeight === newCommentRef.current.clientHeight) newCommentRef.current.style.height = 'auto';
      }, 250)
    }
  }

  return (
    !deleted && (
      <div>
        {data.type === "Repost" && (
          <p class={style["post-notice"]}>
            <i class="fa-solid fa-retweet"></i> {data.newPublisher.name} reposted
          </p>
        )}
        {data.type === "Like" && (
          <p class={style["post-notice"]}>
            <i class="fa-regular fa-heart"></i> {data.newPublisher.name} liked
          </p>
        )}
        {data.type === "Comment" && (
          <p class={style["post-notice"]}>
            <i class="fa-regular fa-comment"></i> {data.post.creator.name} commented {data?.replyInformation?.creatorName && "on" + data?.replyInformation?.creatorName}
          </p>
        )}
        {"replyInformation" in data && <RepliedCard data={data?.replyInformation} />}
        <Link href={"/post/" + data.objectId} class={style["posted-card"]}>
          <div class={style["posted-card-header"]}>
            <Link href={"/profile/" + data.post.creator.username}>
              <img src={data.post.creator.profilePicture?.small || ppPlaceholder} />
            </Link>
            <Link href={"/profile/" + data.post.creator.username} class={style["posted-card-header-main"]}>
              <p>
                <strong>{data.post.creator.name || data.post.creator.username}</strong>
              </p>
              <p class="smaller dimmed">{createDate(data.post.created)}</p>
            </Link>
            {user?.username === data.post.creator.username && (
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
              {reactStringReplace(data.post.text, /(#\w+)/gi, (match, i) => (
                <Link href={"/explore/top/" + encode(match)} class="link" onclick={(e) => e.stopPropagation()}>
                  {match}
                </Link>
              ))}
            </p>
          </div>
          {data?.post.images.length > 0 && (
            <div class={style["posted-card-pictures"] + " " + (data?.post.images.length % 2 === 0 ? style["even"] : style["odd"])}>
              {data?.post.images.map((img) => (
                <a class={"chocolat-image" + data.objectId} href={img.original} title="image caption a" onclick={onImgClick}>
                  <img src={img.small} />
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
                <p>{data.post.totalComments || "0"}</p>
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
              {(!(data.post.replyStatus === "followers" && !data.followed) || data.post.creator.ownerId === user.objectId) ? (
              <PostCard user={user} commentOn={{ feedId: data.objectId, objectId: data.post.postObjectId, onFinish: onCommentPostet }} />
              ) : (
                <p class="small dimmed m-0">Followers only</p>
              )}
            </div>
          )}
          <div class={style["comment-cont"]}>
            {newComments.reverse().map((com) => (
              <Link href={"/post/" + com.objectId} class={style["comment"]}>
                <img src={com.post.creator.profilePicture?.small || ppPlaceholder} />
                <div>
                  <div class={style["comment-header"]}>
                    <span class="smaller">
                      <strong>{com.post.creator.name || com.post.creator.username}</strong> <span class="dimmed">{createDate(com.post.created)}</span>
                    </span>
                  </div>
                  <p class={"smaller m-0 " + style["comment-text"]}>{com.post.text}</p>
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
