import style from "./style.css";

import { useQuery, useQueryClient } from "react-query";

import Sidebar from "../../components/chats-sidebar";
import Chatroom from "../../components/chats-chatroom";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import Loader from "../../components/loader/loader";
import toastError from "../../components/toasts/error";

const Chats = ({ chatId }) => {
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState({});
  const [channelDetails, setChannelDetails] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser()
  }, {
    retry: false
  });

  useEffect(() => {
    if (userStatus === "success") {
      if (!user) route("/explore/top");
    } else if (userStatus === "error") {
      console.log(userError.message);
      route("/explore/top");
    }
  }, [userStatus]);

  useEffect(async () => {
    if(userError?.code === 3064) {
      Backendless.UserService.logout()
      .then(function () {
        queryClient.invalidateQueries("currentUser")
        location.reload();
      })
    }
  }, [userStatus])

  useEffect(async () => {
    if (!selectedChannel?.name && chatId) {
      let channelName = await Backendless.APIServices.Messages.getChannelName(chatId);
      setSelectedChannel(channelName);
      setChannelDetails(true);
    } else if (!chatId) {
      setSidebarOpen(true)
    }
  }, []);

  return (
    <div class={style["chats"]}>
      <Sidebar
        setSelectedChannel={setSelectedChannel}
        selectedChannel={selectedChannel}
        setModalOpen={setModalOpen}
        channelDetails={channelDetails}
        setChannelDetails={setChannelDetails}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      {chatId ? <Chatroom selectedChannel={selectedChannel} channelId={chatId} setSidebarOpen={setSidebarOpen} /> : <NoChat setSidebarOpen={setSidebarOpen} />}
      <NewChannel modalOpen={modalOpen} setModalOpen={setModalOpen} setSelectedChannel={setSelectedChannel} setChannelDetails={setChannelDetails} />
    </div>
  );
};

export default Chats;

const NoChat = ({setSidebarOpen}) => (
  <div class={style["no-chat"]}>
    <h3 class="accent text-center">You have no channel selected</h3>
    <button onclick={() => setSidebarOpen(true)}>Open Your Channels</button>
  </div>
);

const NewChannel = ({ modalOpen, setModalOpen, setSelectedChannel, setChannelDetails }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(name.slice(0, 30));
  }, [name]);

  useEffect(() => {
    setDesc(desc.slice(0, 250));
  }, [desc]);

  function createChannel(e) {
    e.preventDefault();
    setLoading(true);

    Backendless.APIServices.Messages.createChannel(name, desc)
      .then((res) => {
        setLoading(false);
        setSelectedChannel(res);
        setModalOpen(false);
        setChannelDetails(true);
        route("/chats/" + res.objectId);
      })
      .catch((err) => {
        setLoading(false);
        toastError("Something went wrong");
      });
  }

  return (
    <div class={"modal-cont" + " " + (modalOpen && "active")} onClick={() => setModalOpen(false)}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h4 class="uppercase">New Channel</h4>
          <i class="fa-solid fa-xmark close-modal" onClick={() => setModalOpen(false)}></i>
        </div>
        <div class="modal-body">
          <form class={style["channel-modal"]} onSubmit={createChannel}>
            <div class={style["modal-label"]}>
              <label>Channel Name</label>
              <span class="dimmed">{name.length}/30</span>
            </div>
            <input type="text" placeholder="Your Channel Name" value={name} onInput={(e) => setName(e.target.value)} maxlength="30" />
            <div class={style["modal-label"]}>
              <label>Channel Description</label>
              <span class="dimmed">{desc.length}/250</span>
            </div>
            <textarea placeholder="Describe your Channel as best as possible" value={desc} onInput={(e) => setDesc(e.target.value)} maxlength="250"></textarea>
            {name.length <= 0 || name.length > 30 ? (
              <button disabled={true} class="disabled">
                Save
              </button>
            ) : (
              <button type="submit">{loading && <Loader type="text" />}Save</button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
