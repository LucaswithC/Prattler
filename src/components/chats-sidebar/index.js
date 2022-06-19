import style from "./style.css";
import { useEffect, useState } from "preact/hooks";
import { useQuery, useQueryClient, useInfiniteQuery } from "react-query";
import { Link } from "preact-router/match";
import Loader from "../loader/loader";
import toastError from "../toasts/error";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";

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
    async ({ pageParam = 0 }) => {
      return Backendless.APIServices.Messages.getJoinedChannels(pageParam);
    },
    {
      getNextPageParam: (lastPage, pages) => (lastPage.length >= 20 ? pages.length * 20 : undefined),
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
      return Backendless.APIServices.Messages.getSearchedChannels(searchTerm);
    },
    {
      enabled: false,
      select: data => ([...data]),
    }
  );

  useEffect(async () => {
    if(channelError?.code === 3064 || searchError?.code === 3064) {
      Backendless.UserService.logout()
      .then(function () {
        queryClient.invalidateQueries("currentUser")
        location.reload();
      })
    }
  }, [channelStatus, searchStatus])

  useEffect(() => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (searchTerm) searchRefetch();
    }, 500);
  }, [searchTerm]);

  function openChannel(ip, id) {
    setSelectedChannel(channels.pages[ip][id]);
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
                  [...searchResults].map((c, id) => <SearchedChannel channel={c} index={id} />)
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
              {channels.pages?.[0].length > 0 ? (
                channels.pages.map((p, ip) => p.map((c, id) => (
                  <Link href={"/chats/" + c.objectId}>
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
  } = useInfiniteQuery(
    "members-" + selectedChannel.objectId,
    async ({ pageParam = 0 }) => {
      if (selectedChannel.objectId) {
        return Backendless.APIServices.Messages.getChannelMembers(selectedChannel.objectId, pageParam);
      } else throw new Error();
    },
    {
      enabled: !!selectedChannel?.objectId,
      getNextPageParam: (lastPage, pages) => (lastPage.length >= 20 ? pages.length * 20 : undefined),
    }
  );

  useEffect(async () => {
    if(membersError?.code === 3064) {
      Backendless.UserService.logout()
      .then(function () {
        queryClient.invalidateQueries("currentUser")
        location.reload();
      })
    }
  }, [membersStatus])

  function unfollowChannel() {
    Backendless.APIServices.Messages.leaveChannel(selectedChannel.objectId)
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
          <p class={style["channel-desc"]}>{selectedChannel.description}</p>
          <h4 class="uppercase">Members</h4>
          <div class={style["chat-groups"]}>
            {membersStatus === "success" &&
              members.pages.map((p) =>
                p.map((m) => (
                  <Link href={"/profile/" + m.username} class={"unset " + style["group"]}>
                    <img src={m?.profilePicture?.small || ppPlaceholder} class={style["member-img"]}>
                      FD
                    </img>
                    <h4>{m.name}</h4>
                  </Link>
                ))
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
  const [followed, setFollowed] = useState(channel.joined);
  const queryClient = useQueryClient();

  function followChannel() {
    if (!followed) {
      Backendless.APIServices.Messages.joinChannel(channel.objectId)
        .then((res) => queryClient.invalidateQueries("joined-channels"))
        .catch((err) => {
          setFollowed(!followed);
          toastError("Something went wrong joining the Channel");
          queryClient.setQueryData("searched-channels", (old) => {
            let oldData = [...old]
            oldData[index].joined = !followed;
            return [...oldData];
          });
        });
    } else {
      Backendless.APIServices.Messages.leaveChannel(channel.objectId)
        .then((res) => queryClient.invalidateQueries("joined-channels"))
        .catch((err) => {
          setFollowed(!followed);
          toastError("Something went wrong leaving the Channel");
          queryClient.setQueryData("searched-channels", (old) => {
            let oldData = [...old]
            oldData[index].joined = !followed;
            return [...oldData];
          });
        });
    }
    setFollowed(!followed);
    queryClient.setQueryData("searched-channels", (old) => {
      let oldData = [...old]
      oldData[index].joined = !followed;
      return [...oldData];
    });
  }

  useEffect(() => {
    setFollowed(channel.joined)
  }, [channel])

  return (
    <div class={"unset " + style["group"] + " " + style["search-group"]}>
      {console.log(index, channel.joined)}
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
