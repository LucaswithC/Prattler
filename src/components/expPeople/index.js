import style from "./style.css";

import { Link, route } from "preact-router";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import bannerPlaceholder from "../../assets/icons/banner_placeholder.svg";
import { useState } from "preact/hooks";
import toastError from "../toasts/error";
import toastInfo from "../toasts/info";
import pb from "../../_pocketbase/connect";
import { followUser, unfollowUser } from "../../_pocketbase/services/Users";

const ExpPeople = ({ user, curUser }) => {
  const [followers, setFollowers] = useState(user.followers.length);
  const [follows, setFollows] = useState(user.follows.length)
  const [followed, setFollowed] = useState(curUser.follows.includes(user.id));

  async function follow(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!curUser) {
      toastInfo("Please login to follow");
      route("/signup");
      return;
    }
    if (!followed) {
      followUser(user.id).then(res => {
        setFollowed(!followed);
        setFollowers(followers + 1);
      }).catch((err) => {
        toastError(err);
      });
    } else {
      unfollowUser(user.id).then(res => {
        setFollowed(!followed);
        setFollowers(followers - 1);
      }).catch((err) => {
        toastError(err);
      });
    }
  }

  return (
    <Link href={"/profile/" + user.id} class={style["people-card"] + " card"}>
      <img class={style["people-banner"]} src={user.banner ? pb.getFileUrl(user, user.banner, {thumb: "600x0"}) : bannerPlaceholder} />
      <div class={style["people-body"]}>
        <img class={style["people-pp"]} src={user.avatar ? pb.getFileUrl(user, user.avatar, {thumb: "250x0"}) : ppPlaceholder} />
        <div class={style["people-left"]}>
          <p class="mb-0">
            <strong>{user?.name || user.username}</strong>{" "}
            <span class="smaller dimmed">
              | <strong>{followers}</strong> Follower | <strong>{follows}</strong> Following
            </span>
          </p>
          <p class="mt-0 dimmed smaller">@{user.username}</p>
          <p>{user.biography}</p>
        </div>
        <div class={style["people-right"]}>
          {user.id !== curUser?.id &&
            (followed ? (
              <button class="sec" onClick={follow}>
                Unfollow
              </button>
            ) : (
              <button onClick={follow}>
                <i class="fa-solid fa-user-plus"></i> Follow
              </button>
            ))}
        </div>
      </div>
    </Link>
  );
};

export default ExpPeople;
