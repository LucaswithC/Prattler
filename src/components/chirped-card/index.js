import { h } from "preact";
import style from "./style.css";
import { useEffect, useState } from "preact/hooks";
import { route, Link } from "preact-router";
import Chocolat from "chocolat";
import { useQueryClient } from "react-query";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import ChirpCard from "../chirp-card";

import toastSuccess from "../../components/toasts/success.js";
import toastError from "../../components/toasts/error.js";

import reactStringReplace from "react-string-replace";
import RepliedCard from "../replied-card";

import createDate from "../other/date";

const { encode, decode } = require("url-encode-decode");

const ChirpedCard = ({ data, user }) => {
  const queryClient = useQueryClient();
  const [replyStatus, setReplyStatus] = useState(false);
  const [replySetting, setReplySetting] = useState("everyone");
  const [deleted, setDeleted] = useState(false);

  const [liked, setLiked] = useState(data.post.liked || false);
  const [likedAmount, setLikedAmount] = useState(data.post.totalLikes || 0);
  const [reposted, setReposted] = useState(data.post.reposted || false);
  const [repostedAmount, setRepostedAmount] = useState(data.post.totalRepost || 0);
  const [saved, setSaved] = useState(data.post.saved || false);
  const [savedAmount, setSavedAmount] = useState(data.post.totalSaves || 0);

  const [extraMenu, setExtraMenu] = useState(false);

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

  async function rechirp(e) {
    if (!reposted) {
      setReposted(!reposted);
      setRepostedAmount(likedAmount + 1);
      await Backendless.APIServices.Posts.repost(data.post.postObjectId).catch((err) => {
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

  function save(e) {
    setSaved(!saved);
  }

  function openChirp(id) {
    if (getSelection() == "") {
      route("/chirp/" + id);
    }
  }

  function deleteChirp(e) {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      if (window.confirm("Do you really want to delete your Chirp?")) {
        Backendless.Data.of("Chirps")
          .remove({ objectId: data.objectId })
          .then(function (timestamp) {
            console.log(timestamp);
            toastSuccess("Chirp successful deleted");
            setDeleted(true);
          })
          .catch(function (error) {
            console.log(error);
            toastError("Something went wrong");
          });
      }
    }
  }

  function onCommentPostet(comment) {}

  return (
    !deleted && (
      <div>
        {data.type === "Repost" && (
          <p class={style["chirp-notice"]}>
            <i class="fa-solid fa-retweet"></i> {data.newPublisher.name} rechirped
          </p>
        )}
        {data.type === "Like" && (
          <p class={style["chirp-notice"]}>
            <i class="fa-regular fa-heart"></i> {data.newPublisher.name} liked
          </p>
        )}
        {data.type === "Comment" && (
          <p class={style["chirp-notice"]}>
            <i class="fa-regular fa-comment"></i> {data.post.creator.name} commented on {data.replyInformation.creatorName}
          </p>
        )}
        {!!data?.replyInformation && (
          <RepliedCard data={data.replyInformation} />
        )}
        <div class={style["chirped-card"]} onclick={() => openChirp(data.objectId)}>
          <div class={style["chirped-card-header"]}>
            <Link href={"/profile/" + data.post.creator.username}>
              <img src={data.post.creator.profilePicture || ppPlaceholder} />
            </Link>
            <Link href={"/profile/" + data.post.creator.username} class={style["chirped-card-header-main"]}>
              <p>
                <strong>{data.post.creator.name || data.post.creator.username}</strong>
              </p>
              <p class="smaller dimmed">{createDate(data.created)}</p>
            </Link>
            {user?.username === data.post.creator.username && (
              <div class={style["chirped-extra-menu"]}>
                <i
                  class="fa-solid fa-ellipsis-vertical pointer"
                  onclick={(e) => {
                    e.stopPropagation();
                    setExtraMenu(true);
                  }}
                ></i>
                {extraMenu && (
                  <div class={style["chirped-extra-dropdown"]} onMouseLeave={() => setExtraMenu(false)}>
                    <div class="red" onclick={deleteChirp}>
                      Delete
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div class={style["chirped-card-body"]}>
            <p>
              {reactStringReplace(data.post.text, /(#\w+)/gi, (match, i) => (
                <Link href={"/explore/top/" + encode(match)} class="link" onclick={(e) => e.stopPropagation()}>
                  {match}
                </Link>
              ))}
            </p>
          </div>
          {data?.post.images.length > 0 && (
            <div class={style["chirped-card-pictures"] + " " + (data?.post.images.length % 2 === 0 ? style["even"] : style["odd"])}>
              {data?.post.images.map((img) => (
                <a class={"chocolat-image" + data.objectId} href={img} title="image caption a" onclick={onImgClick}>
                  <img src={img} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div class={style["chirped-card-bottom"]}>
          <div class={style["chirped-card-interaction"]}>
            <div class={style["interaction-button"] + " " + style["interaction-comment"]} tabindex="0">
              <i class="fa-regular fa-comment"></i>
              <div>
                <p>{data.post.totalComments || "0"}</p>
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
          {user && (!(data.post.replyStatus === "followers" && !data.followed) || (data.post.creator.ownerId === user.objectId)) && <ChirpCard user={user} commentOn={{ feedId: data.objectId, objectId: data.post.postObjectId, onFinish: onCommentPostet }} />}
          {/* <div class={style["comment-cont"]}>
            <div class={style["comment"]}>
              <img src="https://source.unsplash.com/random/?profile" />
              <div>
                <div class={style["comment-header"]}>
                  <span class="smaller">
                    <strong>Hunter Oliver</strong> <span class="dimmed">24. August at 20:43</span>
                  </span>
                </div>
                <p class={"smaller m-0 " + style["comment-text"]}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.{" "}
                  <a class="link" href="www.ecosia.com" target="_blank">
                    ecosia.com
                  </a>
                </p>
                <div class={style["comment-likes"] + " smaller"} onclick={like}>
                  {" "}
                  <i class="fa-regular fa-heart"></i> 12 Likes
                </div>
              </div>
            </div>
            <div class={style["comment"]}>
              <img src="https://source.unsplash.com/random/?profile" />
              <div>
                <div class={style["comment-header"]}>
                  <span class="smaller">
                    <strong>Abdurahman Forrest</strong> <span class="dimmed">24. August at 20:43</span>
                  </span>
                </div>
                <p class={"smaller m-0 " + style["comment-text"]}>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo
                  inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia vo
                </p>
                <div class={style["comment-likes"] + " smaller"} onclick={like}>
                  {" "}
                  <i class="fa-regular fa-heart"></i> 8 Likes
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    )
  );
};

export default ChirpedCard;
