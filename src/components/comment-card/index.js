import { useEffect, useState } from "preact/hooks";
import style from "./style.css";
import { route, Link } from "preact-router";

import Chocolat from "chocolat";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";

import createDate from "../other/date";
import pb from "../../_pocketbase/connect";
import { unlikePost, likePost } from "../../_pocketbase/services/Posts";
import toastError from "../toasts/error";

const CommentCard = ({ data, user }) => {
    const [liked, setLiked] = useState(data.expand.post.didLike)
    const [likedAmount, setLikedAmount] = useState(data.expand.post.totalLikes || 0)

      useEffect(() => {
          if (typeof window !== "undefined")  {
          Chocolat(document.querySelectorAll(".chocolat-image-" + data.id), {
            loop: true,
          });}
    }, [])

    function like(e) { 
      e.preventDefault() 
      e.stopPropagation()
      if (!pb.authStore?.model) {
        toastError("Please login to like posts")
        return
      }
        setLiked(!liked)
        if(!liked) {
          setLikedAmount(likedAmount + 1)
          likePost(data.post)
          .catch(err => {
            setLiked(false)
            setLikedAmount(likedAmount)
            toastError(err.message)
          })
        } else {
          setLikedAmount(likedAmount - 1)
          unlikePost(data.post)
          .catch(err => {
            setLiked(true)
            setLikedAmount(likedAmount)
            toastError(err.message)
          })
        }
      }

  return (
    <Link href={"/post/" + data.id} class={style["comment"]}>
      <div>
        <div class={style["comment-header"]}>
        <Link href={"/profile/" + data.expand.post.expand.author.id} onClick={(e) => e.stopPropagation()}><img src={data.expand.post.expand.author.avatar ? pb.getFileUrl(data.expand.post.expand.author, data.expand.post.expand.author.avatar, {thumb: "60x0"}) :  ppPlaceholder} class={style["pp-img"]} /></Link>
          <Link href={"/profile/" + data.expand.post.expand.author.id} class="smaller" onClick={(e) => e.stopPropagation()}>
            <p class="m-0">
              <strong>{data.expand.post.expand.author?.name || data.expand.post.expand.author.username}</strong>
            </p>
            <p class="dimmed m-0 smaller">{createDate(data.created)}</p>
          </Link>
          <div class={style["comment-likes"] + " smaller " + (liked && "liked")} onClick={(e) => like(e)}>
            <i class={"fa-heart " + (liked ? "fa-solid" : "fa-regular")}></i> {likedAmount} {likedAmount === 1 ? "Like" : "Likes"}
          </div>
        </div>
        <p class={style["comment-text"]}>
          {data.expand.post.text}
        </p>
        {data?.expand.post.images.length > 0 && (
            <div class={style["comment-card-pictures"] + " " + (data?.expand.post.images.length % 2 === 0 ? style["even"] : style["odd"])}>
              {data?.expand.post.images.map((img) => (
                <a class={"chocolat-image-" + data.id} href={pb.getFileUrl(data.expand.post, img)} title="image caption a" onClick={(e) => e.stopPropagation()}>
                  <img src={pb.getFileUrl(data.expand.post, img, {thumb: "350x0"})} />
                </a>
              ))}
            </div>
          )}
      </div>
    </Link>
  );
};

export default CommentCard
