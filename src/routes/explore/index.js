import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Link } from "preact-router/match";
import style from "./style.css";

import { useQuery, useQueryClient } from "react-query";

import ChirpedCard from "../../components/chirped-card";
import ExpPeople from "../../components/expPeople";
import LoginImg from "../../assets/images/login_img.svg";

// Note: `user` comes from the URL, courtesy of our router
const Profile = ({ searchTerm, filter }) => {
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser();
  });
  const {
    status: expStatus,
    data: expData,
    error: expError,
  } = useQuery(filter + "-Explore", async () => {
    let queryBuilder = Backendless.DataQueryBuilder.create();
    if (filter === "people") {
      queryBuilder.setSortBy(["created DESC"]);
      return Backendless.Data.of("Users").find(queryBuilder);
    } else {
      queryBuilder.setSortBy(["created DESC"]);
      queryBuilder.setRelated(["creator"]);
      if (filter === "media") queryBuilder.setWhereClause(`images->'$[0]' != null`);
      return Backendless.Data.of("Chirps").find(queryBuilder);
    }
  });
  const [search, setSearch] = useState(searchTerm.replace("hash+", "#"));

  return (
    <div>
      {!user && (
        <div class={style["not-login-cont"]}>
          <div class={style["not-login"]}>
            <img src={LoginImg} class={style["not-login-img"]} />
            <div>
              <h2 class="accent">Signup/Login now</h2>
              <p>If you signup/login you can follow your favourite Chirpers, get a personalised Home-Feed and Chirp for yourself!</p>
              <Link href="/login" class="button sec mr-1">
                Login
              </Link>
              <Link href="/signup" class="button">
                Signup
              </Link>
            </div>
          </div>
        </div>
      )}
      <div class={"container " + style.explore}>
        <div class={"card " + style["filter-card"]}>
          <Link href={"/explore/top" + (search && "/" + search)} activeClassName={style.active} class={style["filter-out"]}>
            <strong>Top</strong>
          </Link>
          <Link href={"/explore/latest" + (search && "/" + search)} activeClassName={style.active} class={style["filter-out"]}>
            <strong>Latest</strong>
          </Link>
          <Link href={"/explore/people" + (search && "/" + search)} activeClassName={style.active} class={style["filter-out"]}>
            <strong>People</strong>
          </Link>
          <Link href={"/explore/media" + (search && "/" + search)} activeClassName={style.active} class={style["filter-out"]}>
            <strong>Media</strong>
          </Link>
        </div>
        <div>
          <form class={style["filter-search"]}>
            <div class={style["search-cont"]}>
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" placeholder="#GreekSalad" value={search} onInput={(e) => setSearch(e.target.value)} />
            </div>

            <button type="submit">Search</button>
          </form>
          {expData &&
            (filter === "people" ? expData.map((person) => <ExpPeople user={person} />) : expData.map((chirp) => <ChirpedCard data={chirp} user={user} />))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
