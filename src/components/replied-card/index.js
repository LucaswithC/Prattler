import style from "./style.css";
import { Link } from "preact-router";

import createDate from "../other/date";

import ProfilePlaceholder from "../../assets/icons/pp_placeholder.svg"

const RepliedCard = ({ data, single }) => {
  return (
    <Link href={data.type === "removed" ? "#" : "/post/" + data.objectId} class={style["reply-cont"] + " " + (single && style["single"]) + " " + (data.type === "removed" && style["removed"])}>
      <div class={style["reply-left"]}>
        <img src={data.profilePicture?.small || ProfilePlaceholder} />
      </div>
      <div class={style["reply-right"]}>
        <p class="small m-0">
          <strong>{data.creatorName}</strong>
        </p>
        <p class="smaller dimmed m-0">{data.type !== "removed" && createDate(data.created)}</p>
        <p class="m-0 mt-1">{data.type === "removed" ? "This post has been removed" : data.text}</p>
      </div>
    </Link>
  );
};

export default RepliedCard;
