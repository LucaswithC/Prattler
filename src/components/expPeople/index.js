
import style from "./style.css";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import bannerPlaceholder from "../../assets/icons/banner_placeholder.svg";

const ExpPeople = ({ user }) => {

return (
    <div class={style["people-card"] + " card"}>
        <img class={style["people-banner"]} src={user.banner || bannerPlaceholder} />
        <img class={style["people-pp"]} src={user.profilePicture || ppPlaceholder} />
        <div class={style["people-body"]}>
            <div class={style["people-left"]}>
            <p class="mb-0"><strong>{user?.name || user.username}</strong> <span class="smaller dimmed">| <strong>123</strong> Follower | <strong>123</strong> Following</span></p>
            <p class="mt-0 dimmed smaller">@{user.username}</p>
            <p>{user.bio}</p>
        </div>
        <div class={style["people-right"]}>
            <button><i class="fa-solid fa-user-plus"></i> Follow</button>
        </div>
        </div>
    </div>
)
}

export default ExpPeople;