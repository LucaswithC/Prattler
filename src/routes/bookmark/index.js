import { h } from 'preact';
import {useEffect, useState} from "preact/hooks";
import { Link } from "preact-router/match";
import style from './style.css'
import styleExp from '../explore/style.css';

import { useQuery, useQueryClient } from "react-query";

import ChirpedCard from "../../components/chirped-card";


// Note: `user` comes from the URL, courtesy of our router
const Profile = () => {
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser();
  });
  const {
    status: saveStatus,
    data: saveData,
    error: saveError,
  } = useQuery("Bookmarks", async () => {
    let queryBuilder = Backendless.DataQueryBuilder.create();
      queryBuilder.setSortBy(["created DESC"]);
      queryBuilder.setRelated(["chirp"]);
      queryBuilder.setRelated(["chirp.creator"]);
      return Backendless.Data.of("Saves").find(queryBuilder);
    })

	return (

		<div class={"container " + styleExp.explore}>
      <div class={"card " + styleExp["filter-card"]}>
        <Link href="/bookmarks" activeClassName={styleExp.active} class={styleExp["filter-out"]}>
            <strong>Chirps</strong>
        </Link>
        <Link href="/bookmarks/replies" activeClassName={styleExp.active} class={styleExp["filter-out"]}>
          
            <strong>Chirps & Replies</strong>
          
        </Link>
        <Link href="/bookmarks/media" activeClassName={styleExp.active} class={styleExp["filter-out"]}>
          
            <strong>Media</strong>
          
        </Link>
        <Link href="/bookmarks/likes" activeClassName={styleExp.active} class={styleExp["filter-out"]}>
          
            <strong>Likes</strong>
          
        </Link>
      </div>
      <div class={style["bookmark-tweets"]}>
        {saveData && saveData.map((save) => <ChirpedCard data={save.chirp} user={user} />)}
        {/* <ChirpedCard imagesStatus={true} liked={false} />
        <ChirpedCard liked={true} />
        <ChirpedCard />
        <ChirpedCard /> */}
      </div>
    </div>
	);
}

export default Profile;
