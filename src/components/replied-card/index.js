import style from "./style.css";
import { Link } from "preact-router";

import createDate from "../other/date";

const RepliedCard = ({ data, single }) => {
  return (
    <Link href={"/chirp/" + data.objectId} class={style["reply-cont"] + " " + (single && style["single"])}>
      <div class={style["reply-left"]}>
        <img src={data.profilePicture} />
      </div>
      <div class={style["reply-right"]}>
        <p class="small m-0">
          <strong>{data.creatorName}</strong>
        </p>
        <p class="smaller dimmed m-0">{createDate(data.created)}</p>
        <p class="m-0 mt-1">{data.text}</p>
      </div>
    </Link>
  );
};

export default RepliedCard;
