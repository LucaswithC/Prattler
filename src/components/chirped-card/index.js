import { h } from "preact";
import style from "./style.css";
import { useEffect, useState } from "preact/hooks";
import { route, Link } from "preact-router";
import Chocolat from "chocolat";
import { useQueryClient } from "react-query";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";

import toastSuccess from "../../components/toasts/success.js";
import toastError from "../../components/toasts/error.js";

const ChirpedCard = ({ data, user }) => {
  const queryClient = useQueryClient();
  const [replyStatus, setReplyStatus] = useState(false);
  const [replySetting, setReplySetting] = useState("everyone");
  const [deleted, setDeleted] = useState(false);

  const [extraMenu, setExtraMenu] = useState(false);

  useEffect(() => {
    Chocolat(document.querySelectorAll(".chocolat-image" + data.objectId), {
      loop: true,
    });
  }, [data]);

  function onImgClick(e) {
    e.stopPropagation();
  }

  function rechirp(e) {
    e.currentTarget.classList.toggle("rechirped");
  }

  function like(e) {
    e.currentTarget.classList.toggle("liked");
    let heart = e.currentTarget.querySelector("i");
    heart.classList.toggle("fa-regular");
    heart.classList.toggle("fa-solid");
  }

  function save(e) {
    let bookmark = e.currentTarget.querySelector("i");
    bookmark.classList.toggle("fa-regular");
    bookmark.classList.toggle("fa-solid");
  }

  function openChirp(id) {
    if (getSelection() == "") {
      route("/chirp/" + id);
    }
  }

  function createDate(dateC) {
    let months = ["January", "Feburary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let date = new Date(dateC);
    return (
      <p class="smaller">
        {date.getDate()}. {months[date.getMonth()]} {date.getFullYear()} at {date.getHours()}:{date.getMinutes()}
      </p>
    );
  }

  function deleteChirp(e) {
    e.stopPropagation();
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

  return (
    !deleted && (
      <div>
        {/* {props.rechirped && (
      <p class={style["chirp-notice"]}>
        <i class="fa-solid fa-retweet"></i> Robert Pattinson rechirped
      </p>
      )}
      {props.liked && (
      <p class={style["chirp-notice"]}>
        <i class="fa-regular fa-heart"></i> Marylin Streep liked
      </p>
      )} */}
        <div class={style["chirped-card"]} onclick={() => openChirp(data.objectId)}>
          <div class={style["chirped-card-header"]}>
            <Link href={"/profile/" + data.creator.username}>
              <img src={data.creator.profilePicture || ppPlaceholder} />
            </Link>
            <Link href={"/profile/" + data.creator.username} class={style["chirped-card-header-main"]}>
              <p>
                <strong>{data.creator.name || data.creator.username}</strong>
              </p>
              {createDate(data.created)}
            </Link>
            {user?.username === data.creator.username && (
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
            <p>{data.text}</p>
          </div>
          {data?.images.length > 0 && (
            <div class={style["chirped-card-pictures"] + " " + (data?.images.length % 2 === 0 ? style["even"] : style["odd"])}>
              {data?.images.map((img) => (
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
                <p>{data.comments || "0"}</p>
                <p>Comment</p>
              </div>
            </div>
            <div class={style["interaction-button"] + " " + style["interaction-retweet"]} onclick={rechirp} tabindex="0">
              <i class="fa-solid fa-retweet"></i>{" "}
              <div>
                <p>{data.rechirps || "0"}</p>
                <p>Rechirp</p>
              </div>
            </div>
            <div class={style["interaction-button"] + " " + style["interaction-like"]} onclick={like} tabindex="0">
              <i class="fa-regular fa-heart"></i>{" "}
              <div>
                <p>{data.likes || "0"}</p>
                <p>Like</p>
              </div>
            </div>
            <div class={style["interaction-button"] + " " + style["interaction-save"]} onclick={save} tabindex="0">
              <i class="fa-regular fa-bookmark"></i>{" "}
              <div>
                <p>{data.saves || "0"}</p>
                <p>Bookmark</p>
              </div>
            </div>
          </div>
          {user && (
            <div class={style["new-comment-cont"]}>
              <img src={user.profilePicture} />
              <input type="text" placeholder="Chirp your reply" />
            </div>
          )}
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
