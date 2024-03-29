import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Link } from "preact-router/match";
import style from "./style.css";
import styleExp from "../explore/style.css";

import { useQuery, useQueryClient, useInfiniteQuery } from "react-query";

import PostedCard from "../../components/posted-card";
import Loader from "../../components/loader/loader";
import useInView from "../../components/other/inView/index";
import Footer from "../../components/footer";

// Note: `user` comes from the URL, courtesy of our router
const Bookmark = ({ filter }) => {
  const { isInView: loadInView, inViewRef: loadRef } = useInView();
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser()
  }, {
    retry: false,
  });
  const {
    status: saveStatus,
    data: saveData,
    error: saveError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    "Bookmarks-" + filter,
    async ({ pageParam = 0 }) => {
      let filterQuery = { pageSize: 20, pageOffset: pageParam };
      if (!filter) filterQuery.whereClause = [`(type = 'Post' or type = 'Repost')`];
      else if (filter === "replies") filterQuery.whereClause = [`(type = 'Post' or type = 'Repost' or type = 'Comment')`];
      else if (filter === "media") filterQuery.whereClause = [`(type = 'Post' or type = 'Repost' or type = 'Comment') and post.images->'$[0]' != null`];
      else if (filter === "likes") filterQuery.whereClause = [`type = 'Like'`];
      return Backendless.APIServices.Posts.getSaved(filterQuery);
    },
    {
      getNextPageParam: (lastPage, pages) => (lastPage.length === 20 ? pages.length * 20 : undefined),
    }
  );

  useEffect(async () => {
    if(userError?.code === 3064 || saveError?.code === 3064) {
      Backendless.UserService.logout()
      .then(function () {
        queryClient.invalidateQueries("currentUser")
        location.reload();
      })
    }
  }, [userStatus, saveStatus])

  useEffect(() => {
    if (loadInView) fetchNextPage();
  }, [loadInView]);

  return (
    <div class={"container mobile-space " + styleExp.explore}>
      <div class={styleExp["filter-outer"]}>
      <div class={"card " + styleExp["filter-card"]}>
        <Link href="/bookmarks" activeClassName={styleExp.active} class={styleExp["filter-out"]}>
          <strong>Posts</strong>
        </Link>
        <Link href="/bookmarks/replies" activeClassName={styleExp.active} class={styleExp["filter-out"]}>
          <strong>Posts & Replies</strong>
        </Link>
        <Link href="/bookmarks/media" activeClassName={styleExp.active} class={styleExp["filter-out"]}>
          <strong>Media</strong>
        </Link>
        <Link href="/bookmarks/likes" activeClassName={styleExp.active} class={styleExp["filter-out"]}>
          <strong>Likes</strong>
        </Link>
        </div>
        <Footer />
      </div>
      <div class={style["bookmark-tweets"]}>
        {saveStatus == "success" && ( saveData.pages[0].length == 0 ? (
          <p class="loader-outer accent">No posts found</p>
        ) : (
          saveData.pages.map((page) => page.map((post) => <PostedCard data={post} user={user} />))
        ))}
        <div ref={loadRef}>
          {isFetchingNextPage || saveStatus === "loading" ? (
            <Loader />
          ) : (
            hasNextPage && (
              <button class="small" onClick={fetchNextPage}>
                Load more
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmark;
