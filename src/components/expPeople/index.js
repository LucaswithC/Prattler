
import style from "./style.css";

import { Link } from "preact-router";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import bannerPlaceholder from "../../assets/icons/banner_placeholder.svg";

const ExpPeople = ({ user }) => {

return (
    <Link href={"/profile/" + user.username} class={style["people-card"] + " card"}>
        <img class={style["people-banner"]} src={user.banner || bannerPlaceholder} />
        <img class={style["people-pp"]} src={user.profilePicture || ppPlaceholder} />
        <div class={style["people-body"]}>
            <div class={style["people-left"]}>
            <p class="mb-0"><strong>{user?.name || user.username}</strong> <span class="smaller dimmed">| <strong>{user.followers}</strong> Follower | <strong>{user.following}</strong> Following</span></p>
            <p class="mt-0 dimmed smaller">@{user.username}</p>
            <p>{user.bio}</p>
        </div>
        <div class={style["people-right"]}>
            {user.followed ? (
            <button class="sec">Unfollow</button>
            ) : (
            <button><i class="fa-solid fa-user-plus"></i> Follow</button>
            )}
        </div>
        </div>
    </Link>
)
}

export default ExpPeople;