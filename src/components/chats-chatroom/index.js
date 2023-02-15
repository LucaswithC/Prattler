import style from "./style.css";
import { useEffect, useRef, useState } from "preact/hooks";
import { useQuery, useQueryClient, useInfiniteQuery } from "react-query";
import useInView from "../other/inView/container.tsx";
import Loader from "../loader/loader";
import { Link } from "preact-router";

import createDate from "../other/date";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import pb from "../../_pocketbase/connect";
import { getMessages, getSingleMessage, postMessage } from "../../_pocketbase/services/Messages";

let unsubFunc = false;

const Chatroom = ({ selectedChannel, channelId, setSidebarOpen }) => {
  const queryClient = useQueryClient();
  const chatRef = useRef();
  const scrollRef = useRef();
  const topScrollRef = useRef();
  const { isInView: loadInView, inViewRef: loadRef, containerRef: contRef } = useInView();
  const {
    status: userStatus,
    data: user,
    error: userError,
  } = useQuery("currentUser", async () => {
    return pb.authStore.model;
  });
  const {
    status: messageStatus,
    data: messages,
    error: messageError,
    isFetching,
    isFetchingPreviousPage,
    fetchPreviousPage,
    hasPreviousPage,
  } = useInfiniteQuery(
    "messages-" + channelId,
    async ({ pageParam = 0 }) => {
      let msgs = await getMessages(channelId, 20, pageParam);
      console.log(msgs);
      return msgs.items.reverse();
    },
    {
      getNextPageParam: undefined,
      getPreviousPageParam: (firstPage, pages) => (firstPage.length >= 20 ? pages.length + 1 : undefined),
    },
    {
      enable: false,
    }
  );
  const [bottomScroll, setBottomScroll] = useState(0);
  const [msgUpdate, setMsgUpdate] = useState(Math.floor(Math.random() * 10000));

  useEffect(async () => {
    if (user && !pb.authStore.isValid) {
      pb.authStore.clear();
      queryClient.invalidateQueries("currentUser");
      location.reload();
    }
  }, [userStatus]);

  useEffect(async () => {
    if (userError?.code === 3064 || messageError?.code === 3064) {
      // Backendless.UserService.logout()
      // .then(function () {
      //   queryClient.invalidateQueries("currentUser")
      //   location.reload();
      // })
    }
  }, [userStatus, messageStatus]);

  useEffect(() => {
    console.log("fetching");
    if (!isFetching) setMsgUpdate(Math.floor(Math.random() * 10000));
  }, [isFetching]);

  useEffect(() => {
    if (loadInView) fetchPreviousPage();
  }, [loadInView]);

  useEffect(() => {
    contRef(chatRef.current);
  }, []);

  const onObjectCreate = async (e) => {
    let newMsg = await getSingleMessage(channelId, e.record.updated);
    queryClient.setQueryData("messages-" + channelId, (old) => {
      let pagenr = old.pages.length - 1;
      if (old.pages[old.pages.length - 1][old.pages[pagenr].length - 1]?.id !== newMsg.id) {
        old.pages[old.pages.length - 1].push(newMsg);
      }
      return { ...old };
    });
    setMsgUpdate(Math.floor(Math.random() * 10000));
  };

  // useEffect(async () => {
  //   pb.collection("channels").unsubscribe()
  //   unsubFunc = await pb.collection("channels").subscribe(channelId, onObjectCreate);
  //   scrollRef.current.scrollIntoView();
  //   return () => {
  //     if (unsubFunc) {
  //       pb.collection("channels").unsubscribe();
  //     }
  //   };
  // });

  useEffect(async () => {
    await pb.collection("channels").unsubscribe()
    unsubFunc = await pb.collection("channels").subscribe(channelId, onObjectCreate);
    return async () => {
      if (unsubFunc) {
        await pb.collection("channels").unsubscribe();
      }
    };
  }, [channelId]);

  useEffect(() => {
    if (chatRef.current !== null) {
      if (bottomScroll <= 50) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      } else {
        topScrollRef.current.scrollIntoView(true);
        setTimeout(() => {
          chatRef.current.scrollTo({
            top: chatRef.current.scrollTop - 100,
            left: 0,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [msgUpdate]);

  return (
    <div class={style["chatroom"]}>
      <div class={style["chat-header"]}>
        <div class={style["mobile-chat-menu"]} onclick={() => setSidebarOpen(true)}>
          <i class="fa-solid fa-bars"></i>
        </div>
        <h4>{selectedChannel.name}</h4>
        <div class={style["chat-loading"] + " " + ((isFetchingPreviousPage || messageStatus === "loading") && style["active"])}>
          <Loader type="small" />
        </div>
      </div>
      <div
        class={style["chat-body-cont"]}
        ref={chatRef}
        onScroll={(e) => {
          const { height } = e.target.getBoundingClientRect();
          setBottomScroll(e.target.scrollHeight - (e.target.scrollTop + height));
        }}
      >
        <div class={style["chat-body"]}>
          {!isFetchingPreviousPage && messageStatus !== "loading" && hasPreviousPage && (
            <button class="small third mx-auto" onClick={fetchPreviousPage}>
              Load more
            </button>
          )}
          {!(!hasPreviousPage && messageStatus === "success") && <div ref={loadRef}></div>}
          {messageStatus === "success" ? (
            messages.pages.length === 1 && messages.pages?.[0].length === 0 ? (
              <p class="accent text-center">No messages in this channel yet</p>
            ) : (
              messages.pages.map((p, ip) => (
                <>
                  {p.map((d, i) => (
                    <Message
                      data={d}
                      index={i}
                      self={d.author === user.id}
                      prevDate={messages.pages?.[ip]?.[i - 1]?.created || messages.pages?.[ip - 1]?.[messages.pages?.[ip - 1].length - 1]?.created || null}
                    />
                  ))}
                  {ip === 0 && <div ref={topScrollRef}></div>}
                </>
              ))
            )
          ) : (
            <></>
          )}
          <div ref={scrollRef}></div>
        </div>
      </div>
      <NewMessage channelId={channelId} />
    </div>
  );
};

export default Chatroom;

const Message = ({ data, index, self, prevDate }) => {
  const months = ["January", "Feburary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return (
    <>
      {(prevDate === null || new Date(data.created).getDate() !== new Date(prevDate).getDate()) && (
        <div class={style.divider}>
          <span class={style["divider-text"]}>
            {new Date(data.created).getDate() + ". " + months[new Date(data.created).getMonth()] + " " + new Date(data.created).getFullYear()}
          </span>
        </div>
      )}
      <div class={style.message + " " + (self && style.self)}>
        <Link href={"/profile/" + data.author} class={style["message-img"]}>
          <img src={data.expand.author.avatar ? pb.getFileUrl(data.expand.author, data.expand.author.avatar, { thumb: "60x0" }) : ppPlaceholder} />
        </Link>
        <div class={style["message-body"]}>
          <div class={style["message-author"] + " dimmed small"}>
            {!self && (
              <strong>
                <Link href={"/profile/" + data.author}>{data?.expand.author?.name || data?.expand.author.username}</Link>
              </strong>
            )}{" "}
            <span class="smaller">{createDate(new Date(data.created).getTime() - 3000)}</span>
          </div>
          <div class={style["message-text"]}>{data.text}</div>
        </div>
      </div>
    </>
  );
};

const NewMessage = ({ channelId }) => {
  const [chatInput, setChatInput] = useState("");
  function chatTextbox(e) {
    let newTextbox = document.createElement("textarea");
    newTextbox.classList.add(style["chat-textarea"]);
    newTextbox.classList.add(style["chat-textarea-calc-size"]);
    newTextbox.style.overflow = "auto";
    newTextbox.value = e.target.value;
    document.body.appendChild(newTextbox);
    e.target.style.height = newTextbox.scrollHeight + "px";
    if (newTextbox.scrollHeight >= 100) e.target.style.overflow = "auto";
    else e.target.style.overflow = "hidden";
    newTextbox.remove();
    setChatInput(e.target.value);
  }

  async function sendMessage(e) {
    e.preventDefault();
    let msg = e.target.elements.message.value;
    setChatInput("");
    await postMessage(msg, channelId);
  }

  return (
    <form onSubmit={sendMessage}>
      <div class={style["message-input-cont"]}>
        <div class={style["message-input"]}>
          <textarea
            name="message"
            id="chat-input"
            class={style["chat-textarea"]}
            value={chatInput}
            placeholder="Chat away"
            onInput={chatTextbox}
            rows="1"
          ></textarea>
          {chatInput.length <= 0 ? (
            <button disabled={true} class={"small disabled " + style["message-btn"]}>
              <i class="fa-solid fa-location-arrow"></i>
            </button>
          ) : (
            <button type="submit" class={"small " + style["message-btn"]}>
              <i class="fa-solid fa-location-arrow"></i>
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
