import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import style from "./style.css";
import stylesExp from "../explore/style.css";
import { Link } from "preact-router/match";
import { useQuery, useQueryClient} from "react-query";

import ChirpedCard from "../../components/chirped-card";
import EditProfile from "../../components/edit-profile";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import bannerPlaceholder from "../../assets/icons/banner_placeholder.svg";

// Note: `user` comes from the URL, courtesy of our router
const Profile = ({ userFilter, filter }) => {
  const queryClient = useQueryClient()
  const {status: userStatus, data: user, error: userError, refetch: userRefetch} = useQuery(userFilter + '-User', async () => {
    if(userFilter === "me") {
    return Backendless.UserService.getCurrentUser()
    } else {
      let queryBuilder = Backendless.DataQueryBuilder.create();
      queryBuilder.setWhereClause(`username='${userFilter}'`)
      return Backendless.Data.of("Users").findFirst(queryBuilder);
    }
  })
  const {status: chirpsStatus, data: chirpsData, error: chirpsError} = useQuery([userFilter + '-Chirps-' +  (filter || "all"), user], async () => {
    let queryBuilder = Backendless.DataQueryBuilder.create();
    if(!filter) queryBuilder.setWhereClause(`ownerId='${user.ownerId}'`)
    queryBuilder.setSortBy(["created DESC"])
    queryBuilder.setRelated(["creator"]);
    if(filter === "media") queryBuilder.setWhereClause(`ownerId='${user.ownerId}' and images->'$[0]' != null`)
    return Backendless.Data.of("Chirps").find(queryBuilder);
  }, {
    enabled: !!user
  })

  const [modalState, setModalState] = useState(false);
  const [editStatus, setEditStatus] = useState(false)

  useEffect(() => {
    if(userStatus === "success") {
      if (!user) route("/");
    } else if (userStatus === "error") {
      console.log(userError.message);
      route("/");
    }
  }, [userStatus]);

  useEffect(() => {
    if (user) {
      if (typeof window !== "undefined") {
      let modal = document.querySelector("." + style["follower-modal"]);
      modal.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }
    }
  }, [user]);

  function openModal() {
    setModalState(true);
  }

  function closeModal() {
    setModalState(false);
  }

  function openEdit() {
    if (typeof window !== "undefined") {
    let body = document.querySelector("body")
    body.style.overflow = "hidden"
	  setEditStatus(true) }
  }

  function closeEdit() {
    if (typeof window !== "undefined") {
    let body = document.querySelector("body")
    body.style.overflow = "auto"
	setEditStatus(false) }
  }

  function logout() {
    Backendless.UserService.logout()
      .then(function () {
        queryClient.invalidateQueries("currentUser");
        route("/explore/top")
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  function reload() {
    Backendless.UserService.getCurrentUser()
 .then( function( currentUser ) {
   console.log(currentUser)
  })
 .catch( function ( error ) {
  });
  }

  return (
    <div>
      {user && (
        <div class={style.profile}>
          <div class={style["follower-modal-cont"] + " " + (modalState && style.active)} onclick={closeModal}>
            <div class={style["follower-modal"]}>
              <div class={style["modal-header"]}>
                <strong>Jeremy Marther's Followers</strong>
                <i class={"fa-solid fa-xmark " + style["close-modal"]} onclick={closeModal}></i>
              </div>
              <div class={style["modal-body"]}>
                <div class={style["follower-item"]}>
                  <div>
                    <div class={style["follower-header"]}>
                      <img src="https://source.unsplash.com/random/?profile" />
                      <div>
                        <p class="m-0">
                          <strong>Austin Power</strong>
                        </p>
                        <p class="m-0 smaller dimmed">4458 Followers</p>
                      </div>
                    </div>
                    <p class="dimmed">This is my Bio exerpt</p>
                  </div>
                  <div>
                    <button>
                      <i class="fa-solid fa-user-plus"></i> Follow
                    </button>
                  </div>
                </div>
                <div class={style["follower-item"]}>
                  <div>
                    <div class={style["follower-header"]}>
                      <img src="https://source.unsplash.com/random/?profile" />
                      <div>
                        <p class="m-0">
                          <strong>Austin Power</strong>
                        </p>
                        <p class="m-0 smaller dimmed">4458 Followers</p>
                      </div>
                    </div>
                    <p class="dimmed">This is my Bio exerpt</p>
                  </div>
                  <div>
                    <button>
                      <i class="fa-solid fa-user-plus"></i> Follow
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <img class={style["header-img"]} src={user?.banner || bannerPlaceholder} />
          <div class="container">
            <div class={style["profile-header"]}>
              <img class={style["profile-picture"]} src={user?.profilePicture || ppPlaceholder} />
              <div class={style["profile-main"]}>
                <div class={style["profile-name-info"]}>
                  <div>
                  <h3>{user?.name || user.username}</h3>
                  <p class="smaller dimmed m-0">@{user.username}</p>
                  </div>
                  <p class="smaller m-0 pointer" onclick={openModal}>
                    <strong>{user?.following || 0}</strong> Following
                  </p>
                  <p class="smaller m-0 pointer" onclick={openModal}>
                    <strong>{user?.followers || 0}</strong> Followers
                  </p>
                </div>
                <p class={style["profile-bio"]}>{userFilter === "me" ? (user?.bio || <p class="m-0 dimmed"><i>You don't have a Biography yet! <span class="accent pointer" onclick={openEdit}>Add now</span></i></p>) : (<p></p>)}</p>
              </div>
              <div class={style["profile-secondary"]}>
                {userFilter === "me" ? (
                  <div>
                  <button class="sec" onclick={openEdit}>
                    <i class="fa-solid fa-pen"></i> Edit
                  </button>
                  <p class={"pointer " + style["logout-text"]} onClick={logout}>
                  Logout
                  </p>
                  </div>
                ) : (
                  <button>
                    <i class="fa-solid fa-user-plus"></i> Follow
                  </button>
                )}
                
              </div>
            </div>
            <div class={stylesExp.explore}>
              <div class={"card " + stylesExp["filter-card"]}>
                <Link href={"/profile/" + userFilter} activeClassName={stylesExp.active} class={stylesExp["filter-out"]}>
                  <strong>Chirps</strong>
                </Link>
                <Link href={"/profile/" + userFilter + "/replies"} activeClassName={stylesExp.active} class={stylesExp["filter-out"]}>
                  <strong>Chirps & Replies</strong>
                </Link>
                <Link href={"/profile/" + userFilter + "/media"} activeClassName={stylesExp.active} class={stylesExp["filter-out"]}>
                  <strong>Media</strong>
                </Link>
                <Link href={"/profile/" + userFilter + "/likes"} activeClassName={stylesExp.active} class={stylesExp["filter-out"]}>
                  <strong>Likes</strong>
                </Link>
              </div>
              <div class={style.chirps}>
                {chirpsStatus === "success" ? (
                  chirpsData.length > 0 ? chirpsData.map(chirp => <ChirpedCard data={chirp} user={user} />) : <p class="accent" style={{textAlign:"center", fontWeight: "500"}}>This Account hasn't chirped yet</p>
                  ) : <p style={{fontSize: "3rem", textAlign: "center"}}><i class="fa-solid fa-spinner loader"></i></p>}
              </div>
            </div>
          </div>
		  {userFilter === "me" && (<EditProfile user={user} editStatus={editStatus} closeEdit={closeEdit} />)}
        </div>
      )}
    </div>
  );
};

export default Profile;
