import style from "./style.css";
import { Link } from "preact-router";

import createDate from "../other/date";

import ProfilePlaceholder from "../../assets/icons/pp_placeholder.svg"
import pb from "../../_pocketbase/connect";

const RepliedCard = ({data, single }) => {
  return (
    <>
    {data === undefined ? (
      <div class={style["reply-cont"] + " " + (single && style["single"]) + " " + style["removed"]}>
         <p class="m-0">This post is not available</p>
      </div>
    ) : (
    <Link href={"/post/" + data?.id + "?comment"} class={style["reply-cont"] + " " + (single && style["single"])}>
      <div class={style["reply-left"]}>
        <img src={data?.expand?.author?.avatar ? pb.getFileUrl(data?.expand?.author, data?.expand?.author?.avatar, {thumb: "60x0"}) : ProfilePlaceholder} />
      </div>
      <div class={style["reply-right"]}>
        <p class="small m-0">
          <strong>{data.expand.author.name || data.expand.author.username}</strong>
        </p>
        <p class="smaller dimmed m-0">{createDate(data.created)}</p>
        <p class={style["replied-text"] + " m-0 mt-1"}>{data.text}</p>
      </div>
    </Link>
    )}
    </>
  );
};

export default RepliedCard;
