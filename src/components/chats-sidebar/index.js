import style from "./style.css";
import { useEffect, useState } from "preact/hooks";
import { useQuery, useQueryClient, useInfiniteQuery } from "react-query";
import { Link } from "preact-router/match";
import Loader from "../loader/loader";
import toastError from "../toasts/error";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import pb from "../../_pocketbase/connect";
import { getChannelMembers, getJoinedChannels, getSearchedChannels, joinChannel, leaveChannel } from "../../_pocketbase/services/Messages";

let searchTimeout;

const Sidebar = ({ selectedChannel, setSelectedChannel, setModalOpen, channelDetails, setChannelDetails, sidebarOpen, setSidebarOpen }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedChannel(selectedChannel);
  }, [selectedChannel]);

  return (
    <div
      class={style["sidebar-cont"] + " " + (sidebarOpen && style.active)}
      onClick={() => {
        setSidebarOpen(false);
      }}
    >
      <div class={style.sidebar} onClick={(e) => e.stopPropagation()}>
        <AllChannels
          setSelectedChannel={setSelectedChannel}
          setChannelDetails={setChannelDetails}
          channelDetails={channelDetails}
          setModalOpen={setModalOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <ChannelOveriew channelDetails={channelDetails} setChannelDetails={setChannelDetails} selectedChannel={selectedChannel} />
      </div>
      <div class={style["close-sidebar"]}>
        <i class="fa-solid fa-x"></i>
      </div>
    </div>
  );
};

export default Sidebar;

const AllChannels = ({ setSelectedChannel, setChannelDetails, channelDetails, setModalOpen, setSidebarOpen }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  // const {
  //   status: channelStatus,
  //   data: channels,
  //   error: channelError,
  // } = useQuery("joined-channels", async () => {
  //   return Backendless.APIServices.Messages.getJoinedChannels();
  // });
  const {
    status: channelStatus,
    data: channels,
    error: channelError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    "joined-channels",
    async ({ pageParam = 1 }) => {
      return getJoinedChannels(20, pageParam)
    },
    {
      getNextPageParam: (lastPage, pages) => (lastPage.totalPages > pages.length ? pages.length + 1 : undefined),
    }
  );
  const {
    status: searchStatus,
    data: searchResults,
    error: searchError,
    refetch: searchRefetch,
    isFetching: searchFetching
  } = useQuery(
    "searched-channels",
    async () => {
      return getSearchedChannels(searchTerm)
    },
    {
      enabled: false,
      select: data => ([...data]),
    }
  );

  // useEffect(async () => {
  //   if(channelError?.code === 3064 || searchError?.code === 3064) {
  //     // Backendless.UserService.logout()
  //     // .then(function () {
  //     //   queryClient.invalidateQueries("currentUser")
  //     //   location.reload();
  //     // })
  //   }
  // }, [channelStatus, searchStatus])

  useEffect(() => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (searchTerm) searchRefetch();
    }, 500);
  }, [searchTerm]);

  function openChannel(ip, id) {
    setSelectedChannel(channels.pages[ip].items[id]);
    setChannelDetails(true);
    setSidebarOpen(false)
  }

  return (
    <div class={style["all-channels"] + " " + (channelDetails && style.deactive)}>
      <div class={style["side-header"]}>
        <h3>Channels</h3>
        <button class="small third" onClick={() => setModalOpen(true)}>
          +
        </button>
      </div>
      <div class={style["side-body"]}>
        <div class={style["search-cont"]}>
          <i class={"fa-solid fa-magnifying-glass " + style["input-i"]}></i>
          <input
            autocomplete="off"
            name="searchInput"
            type="search"
            placeholder="Search channel"
            value={searchTerm}
            onInput={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={() => setSearchTerm("")} type="reset" class={"unset pointer " + style["input-i-reset-btn"]}>
            <i class={"fa-solid fa-xmark " + style["input-i-reset"]}></i>
          </button>
        </div>
        <div class={style["chat-groups"]}>
          {searchTerm.length > 0 ? (
            <>
              <h4 class="uppercase">Search Results</h4>
              {searchStatus === "success" && !searchFetching ? (
                searchResults.length > 0 ? (
                  searchResults.map((c, id) => <SearchedChannel channel={c} index={id} />)
                ) : (
                  <p>No Channels found</p>
                )
              ) : (
                <Loader type="small" />
              )}
            </>
          ) : channelStatus === "success" ? (
            <>
              <h4 class="uppercase">Your Channels</h4>
              {channels.pages?.[0].totalItems > 0 ? (
                channels.pages.map((p, ip) => p.items.map((c, id) => (
                  <Link href={"/chats/" + c.id}>
                    <div class={"unset " + style["group"]} onClick={() => openChannel(ip, id)}>
                      <div class={style["group-img"]}>
                        {c.name
                          .split(" ")
                          .slice(0, 2)
                          .map((d) => d[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <h4>{c.name}</h4>
                    </div>
                  </Link>
                )))
              ) : (
                <p>You follow no channels yet</p>
              )}
              <div>
              {isFetchingNextPage || channelStatus === "loading" ? (
                <Loader type="small" />
              ) : (
                hasNextPage && (
                  <button class="small third" onClick={fetchNextPage}>
                    Load more
                  </button>
                )
              )}
            </div>
            </>
          ) : (
            <Loader type="small" />
          )}
        </div>
      </div>
    </div>
  );
};

const ChannelOveriew = ({ channelDetails, setChannelDetails, selectedChannel }) => {
  const queryClient = useQueryClient();

  const {
    status: membersStatus,
    data: members,
    error: membersError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useQuery(
    "members-" + selectedChannel.id,
    async () => {
      if (selectedChannel.id) {
        return getChannelMembers(selectedChannel.id)
      } else throw new Error();
    },
    {
      enabled: !!selectedChannel?.id,
    }
  );

  useEffect(async () => {
    if(membersError?.code === 3064) {
      // Backendless.UserService.logout()
      // .then(function () {
      //   queryClient.invalidateQueries("currentUser")
      //   location.reload();
      // })
    }
  }, [membersStatus])

  function unfollowChannel() {
    leaveChannel(selectedChannel.id)
      .then((res) => {
        queryClient.invalidateQueries("joined-channels");
        setChannelDetails(false);
      })
      .catch((err) => {
        toastError("Something went wrong leaving the Channel");
      });
  }

  return (
    <div class={style["channel-overview"] + " " + (channelDetails && style.active)}>
      <div class={style["side-header"] + " pointer"} onClick={() => setChannelDetails(false)}>
        <button class="small empty">
          <i class="fa-solid fa-chevron-left"></i>
        </button>{" "}
        <h3>All channels</h3>
      </div>
      {selectedChannel && (
        <div class={style["side-body"]}>
          <h4 class="uppercase">{selectedChannel.name}</h4>
          <p class={style["channel-desc"]}>{selectedChannel.desc}</p>
          <h4 class="uppercase">Members</h4>
          <div class={style["chat-groups"]}>
            {console.log(members)}
            {membersStatus === "success" &&
              members.map((m) =>
                  <Link href={"/profile/" + m.id} class={"unset " + style["group"]}>
                    <img src={m?.avatar ? pb.getFileUrl(m, m.avatar, {thumb: "60x0"}) : ppPlaceholder} class={style["member-img"]}>
                      FD
                    </img>
                    <h4>{m.name}</h4>
                  </Link>
              )}
            <div>
              {isFetchingNextPage || membersStatus === "loading" ? (
                <Loader type="small" />
              ) : (
                hasNextPage && (
                  <button class="small third" onClick={fetchNextPage}>
                    Load more
                  </button>
                )
              )}
            </div>
          </div>
          <button class="third mt-2" onClick={unfollowChannel}>
            Leave
          </button>
        </div>
      )}
    </div>
  );
};

const SearchedChannel = ({ channel, index }) => {
  const [followed, setFollowed] = useState(channel.members.includes(pb.authStore?.model?.id));
  console.log(channel, pb.authStore.model.id)
  const queryClient = useQueryClient();

  function followChannel() {
    if (!followed) {
      joinChannel(channel.id)
        .then((res) => {
          queryClient.invalidateQueries("joined-channels")
          setFollowed(true);
          queryClient.setQueryData("searched-channels", (old) => {
            let oldData = [...old]
            oldData[index].members.push(pb.authStore.model.id)
            return [...oldData];
          });
        })
        .catch((err) => {
          setFollowed(false);
          toastError("Something went wrong joining the Channel");
        });
    } else {
      leaveChannel(channel.id)
        .then((res) => {
          queryClient.invalidateQueries("joined-channels")
          setFollowed(false);
          queryClient.setQueryData("searched-channels", (old) => {
            let oldData = [...old]
            oldData[index].members.filter(m => m !== pb.authStore.model.id)
            return [...oldData];
          });
        })
        .catch((err) => {
          setFollowed(true);
          toastError("Something went wrong leaving the Channel");
        });
    }
  }

  useEffect(() => {
    setFollowed(channel.members.includes(pb.authStore.model.id))
  }, [channel])

  return (
    <div class={"unset " + style["group"] + " " + style["search-group"]}>
      {console.log(index, followed)}
      <div class={style["group-img"]}>
        {channel.name
          .split(" ")
          .slice(0, 2)
          .map((d) => d[0])
          .join("")
          .toUpperCase()}
      </div>
      <h4>{channel.name}</h4>
      <button class={"small " + (followed && "sec")} onClick={followChannel}>
        {followed ? "-" : "+"}
      </button>
    </div>
  );
};
