import { h } from "preact";
import style from "./style.css";
import { useEffect, useState } from "preact/hooks";

import Chocolat from "chocolat";
import { useQuery } from "react-query";
import { Link } from "preact-router";

const ChirpedCard = ({ chirpId }) => {
  const [sortStatus, setSortStatus] = useState(false);
  const [replySetting, setReplySetting] = useState("everyone");
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
    var queryBuilder = Backendless.DataQueryBuilder.create().setWhereClause(`objectId='${chirpId}'`);
    queryBuilder.setRelated(["creator"]);
    return Backendless.Data.of("Chirps").findFirst(queryBuilder);
  });

  useEffect(() => {
    if (chirpStatus === "success") {
      if (chirp !== undefined) {
        window.scrollTo({ top: 0 });
        Chocolat(document.querySelectorAll(".chocolat-image-" + chirp.objectId), {
          loop: true,
        });
      }
    }
  }, [chirpStatus, chirp]);

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

  function createDate(dateC) {
    let months = ["January", "Feburary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let date = new Date(dateC);
    return (
      <p class="smaller">
        {date.getDate()}. {months[date.getMonth()]} {date.getFullYear()} at {date.getHours()}:{date.getMinutes()}
      </p>
    );
  }

  return (
    <div class={style["single-chirp"] + " container"}>
      {chirpStatus === "success" ? (
        chirp !== undefined ? (
          <div class={style["left-column"]}>
            <div class={style["chirp-back"]} onclick={() => history.back()}>
              <i class="fa-solid fa-arrow-left"></i> Back
            </div>
            <div class={style["chirped-card"]}>
              <div class={style["chirped-card-header"]}>
                <Link href={"/profile/" + chirp.creator.username}>
                  <img src={chirp.creator.profilePicture} />
                </Link>
                <Link href={"/profile/" + chirp.creator.username} class={style["chirped-card-header-main"]}>
                  <p>
                    <strong>{chirp.creator.name}</strong>
                  </p>
                  <p class="smaller">{createDate(chirp.created)}</p>
                </Link>
              </div>
              <div class={style["chirped-card-body"]}>
                <p>{chirp.text}</p>
              </div>
              {chirp.images.length > 0 && (
                <div class={style["chirped-card-pictures"] + " " + (chirp.images.length % 2 === 0 ? style["even"] : style["odd"])}>
                  {chirp.images.map((img) => (
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
                    <p>{chirp.comments || "0"}</p>
                    <p>Comment</p>
                  </div>
                </div>
                <div class={style["interaction-button"] + " " + style["interaction-retweet"]} onclick={rechirp} tabindex="0">
                  <i class="fa-solid fa-retweet"></i>{" "}
                  <div>
                    <p>{chirp.rechirps || "0"}</p>
                    <p>Rechirp</p>
                  </div>
                </div>
                <div class={style["interaction-button"] + " " + style["interaction-like"]} onclick={like} tabindex="0">
                  <i class="fa-regular fa-heart"></i>{" "}
                  <div>
                    <p>{chirp.likes || "0"}</p>
                    <p>Like</p>
                  </div>
                </div>
                <div class={style["interaction-button"] + " " + style["interaction-save"]} onclick={save} tabindex="0">
                  <i class="fa-regular fa-bookmark"></i>{" "}
                  <div>
                    <p>{chirp.saves || "0"}</p>
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
              <div class={style["comment-cont"]} style={{overflow: "visible"}}>
                <div class={style["sort-comments"]}>
                  <div class={style["sort-comments-btn"]} onclick={() => setSortStatus(true)}>
                    <i class="fa-solid fa-arrow-down-wide-short"></i> Sort Comments
                  </div>
                  {sortStatus && (
                    <div class={style["sort-comments-selection"]} onMouseLeave={() => setSortStatus(false)}>
                      <div onclick={() => setSortStatus(false)}>
                        <i class="fa-solid fa-heart"></i> Popularity
                      </div>
                      <div onclick={() => setSortStatus(false)}>
                        <i class="fa-solid fa-clock"></i> Newest first
                      </div>
                      <div onclick={() => setSortStatus(false)}>
                        <i class="fa-solid fa-clock-rotate-left"></i> Oldest first
                      </div>
                    </div>
                  )}
                </div>
                <div style={{textAlign: "center"}} class="accent">Your post received no comments yet</div>
                {/* <div class={style["comment"]}>
                  <div>
                    <div class={style["comment-header"]}>
                      <img src="https://source.unsplash.com/random/?profile" />
                      <span class="smaller">
                        <p class="m-0">
                          <strong>Hunter Oliver</strong>
                        </p>{" "}
                        <p class="dimmed m-0">24. August at 20:43</p>
                      </span>
                      <div class={style["comment-likes"] + " smaller"} onclick={like}>
                        {" "}
                        <i class="fa-regular fa-heart"></i> 12 Likes
                      </div>
                    </div>
                    <p class={style["comment-text"]}>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.{" "}
                      <a href="www.ecosia.com" target="_blank">
                        ecosia.com
                      </a>
                    </p>
                  </div>
                </div>
                <div class={style["comment"]}>
                  <div>
                    <div class={style["comment-header"]}>
                      <img src="https://source.unsplash.com/random/?profile" />
                      <span class="smaller">
                        <p class="m-0">
                          <strong>Hunter Oliver</strong>
                        </p>{" "}
                        <p class="dimmed m-0">24. August at 20:43</p>
                      </span>
                      <div class={style["comment-likes"] + " smaller"} onclick={like}>
                        {" "}
                        <i class="fa-regular fa-heart"></i> 12 Likes
                      </div>
                    </div>
                    <p class={style["comment-text"]}>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.{" "}
                      <a href="www.ecosia.com" target="_blank">
                        ecosia.com
                      </a>
                    </p>
                  </div>
                </div>*/}
              </div> 
            </div>
          </div>
        ) : (
          <div>Chirp not found</div>
        )
      ) : (
        <div>Loading</div>
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
