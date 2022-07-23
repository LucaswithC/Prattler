import { useEffect, useState } from "preact/hooks";
import style from "./style.css";
import { route, Link } from "preact-router";

import Chocolat from "chocolat";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";

import createDate from "../other/date";

const CommentCard = ({ data, user }) => {
    const [id, setId] = useState(String(Math.round(Math.random() * 100000)))
    const [liked, setLiked] = useState(data.post.liked)
    const [likedAmount, setLikedAmount] = useState(data.post.totalLikes || 0)

      useEffect(() => {
          if (typeof window !== "undefined")  {
          Chocolat(document.querySelectorAll(".chocolat-image-" + data.objectId + id), {
            loop: true,
          });}
    }, [])

    async function likePost() {
        setLiked(!liked)
        if(!liked) {
          setLikedAmount(likedAmount + 1)
          await Backendless.APIServices.Posts.likePost(data.post.postObjectId || data.post.objectId)
          .catch(err => {
            setLiked(!liked)
            setLikedAmount(likedAmount - 1)
            toastError(err.message)
          })
        } else {
          setLikedAmount(likedAmount - 1)
          await Backendless.APIServices.Posts.unlikePost(data.post.postObjectId || data.post.objectId)
          .catch(err => {
            setLiked(!liked)
            setLikedAmount(likedAmount + 1)
            toastError(err.message)
          })
        }
      }

  return (
    <Link href={"/post/" + data.objectId} class={style["comment"]}>
      <div>
        <div class={style["comment-header"]}>
        <Link href={"/profile/" + data.post.creator.username} onClick={(e) => e.stopPropagation()}><img src={data.post.creator.profilePicture?.small || ppPlaceholder} class={style["pp-img"]} /></Link>
          <Link href={"/profile/" + data.post.creator.username} class="smaller" onClick={(e) => e.stopPropagation()}>
            <p class="m-0">
              <strong>{data.post.creator?.name || data.post.creator.username}</strong>
            </p>
            <p class="dimmed m-0 smaller">{createDate(data.created)}</p>
          </Link>
          <div class={style["comment-likes"] + " smaller " + (liked && "liked")} onClick={likePost}>
            <i class={"fa-heart " + (liked ? "fa-solid" : "fa-regular")}></i> {likedAmount} {likedAmount === 1 ? "Like" : "Likes"}
          </div>
        </div>
        <p class={style["comment-text"]}>
          {data.post.text}
        </p>
        {data?.post.images.length > 0 && (
            <div class={style["comment-card-pictures"] + " " + (data?.post.images.length % 2 === 0 ? style["even"] : style["odd"])}>
              {data?.post.images.map((img) => (
                <a class={"chocolat-image-" + data.objectId + id} href={img} title="image caption a" onClick={(e) => e.stopPropagation()}>
                  <img src={img} />
                </a>
              ))}
            </div>
          )}
      </div>
    </Link>
  );
};

export default CommentCard
