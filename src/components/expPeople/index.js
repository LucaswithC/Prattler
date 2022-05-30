
import style from "./style.css";

import { Link, route } from "preact-router";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import bannerPlaceholder from "../../assets/icons/banner_placeholder.svg";
import { useState } from "preact/hooks";
import toastError from "../toasts/error";
import toastInfo from "../toasts/info";

const ExpPeople = ({ user, curUser }) => {
    const [followers, setFollowers] = useState(user.followers)
    const [followed, setFollowed] = useState(user.followed)

    async function follow(e) {
        e.preventDefault()
        e.stopPropagation()
        toastInfo("Please login to follow")
        if(!curUser) {route("/signup"); return;}
        setFollowers(followed ? followers - 1 : followers + 1)
        setFollowed(!followed)
        if (!followed) {
          await Backendless.APIServices.Users.followUser(user.objectId).catch((err) => {
            setFollowed(!followed)
            setFollowers(followers - 1)
            toastError(err);
          });
        } else {
          await Backendless.APIServices.Users.unfollowUser(user.objectId).catch((err) => {
            setFollowed(!followed)
            setFollowers(followers + 1)
            toastError(err);
          });
        }
      }

return (
    <Link href={"/profile/" + user.username} class={style["people-card"] + " card"}>
        <img class={style["people-banner"]} src={user.banner || bannerPlaceholder} />
        <img class={style["people-pp"]} src={user.profilePicture || ppPlaceholder} />
        <div class={style["people-body"]}>
            <div class={style["people-left"]}>
            <p class="mb-0"><strong>{user?.name || user.username}</strong> <span class="smaller dimmed">| <strong>{followers}</strong> Follower | <strong>{user.following}</strong> Following</span></p>
            <p class="mt-0 dimmed smaller">@{user.username}</p>
            <p>{user.bio}</p>
        </div>
        <div class={style["people-right"]}>
            {user.objectId !== curUser?.objectId && ( followed ? (
                <button class="sec" onClick={follow}>Unfollow</button>
            ) : (
                <button onClick={follow}><i class="fa-solid fa-user-plus"></i> Follow</button>
            ))}
        </div>
        </div>
    </Link>
)
}

export default ExpPeople;