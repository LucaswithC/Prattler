import style from "./style.css";
import { useEffect, useRef, useState } from "preact/hooks";
import { useQuery, useQueryClient, useInfiniteQuery } from "react-query";
import useInView from "../other/inView/container.tsx";
import Loader from "../loader/loader";
import { Link } from "preact-router";

import createDate from "../other/date";

let dummyData = [
  {
    _id: "62a3d1b9e4190332638d76cc",
    index: 0,
    guid: "9b4ecffe-8c9a-45a6-a1bd-e28cbcd4e395",
    isActive: false,
    picture: "https://placehold.jp/150x150.png",
    name: "Levine",
    about:
      "Mollit qui sunt deserunt ea adipisicing qui ullamco in est sunt magna occaecat incididunt. Esse pariatur sint est culpa qui nostrud pariatur. Labore deserunt proident esse culpa enim nulla culpa magna incididunt esse eiusmod. Nostrud Lorem velit culpa culpa cillum commodo non velit ex deserunt nulla laborum aute. Anim eu magna eu commodo incididunt excepteur tempor ad pariatur magna occaecat duis exercitation amet.\r\n",
    registered: "2014-06-30T02:06:44 -02:00",
  },
  {
    _id: "62a3d1b9494a91940d0f290f",
    index: 1,
    guid: "e844b59c-f460-4fcd-8bb4-962885de4b1a",
    isActive: true,
    picture: "https://placehold.jp/150x150.png",
    name: "Baker",
    about:
      "Dolor aute cillum nisi esse do et voluptate proident. Proident officia sunt occaecat minim esse eu ex. Excepteur minim excepteur quis tempor. Mollit irure sunt voluptate exercitation enim laborum esse consectetur Lorem qui pariatur eiusmod. Nostrud velit proident dolore id eu. Non quis dolor nulla sit sint eiusmod adipisicing nisi. Proident tempor commodo dolor cillum ut laborum voluptate et aliqua.\r\n",
    registered: "2014-06-02T02:02:13 -02:00",
  },
  {
    _id: "62a3d1b97e329d303b8692b1",
    index: 2,
    guid: "808423ab-54ac-40b0-9a7c-d2d784ba610e",
    isActive: true,
    picture: "https://placehold.jp/150x150.png",
    name: "Barber",
    about:
      "Cillum amet ut aliquip dolor irure aliqua velit eiusmod enim in esse incididunt. Et eu incididunt consequat aute. Reprehenderit nostrud proident Lorem consectetur enim occaecat adipisicing laborum culpa ipsum amet anim amet ex.\r\n",
    registered: "2015-03-11T10:43:11 -01:00",
  },
  {
    _id: "62a3d1b9c3514ea712d66b3b",
    index: 3,
    guid: "498d8458-caf2-4f9a-a5cd-d5439724738d",
    isActive: false,
    picture: "https://placehold.jp/150x150.png",
    name: "Nettie",
    about:
      "Labore do dolor ullamco officia laboris. Fugiat non est elit id laboris. Laborum laborum aliquip ea adipisicing irure anim in sint. Do fugiat consequat enim nulla eiusmod eiusmod in mollit aliqua reprehenderit pariatur. Non sint culpa duis est.\r\n",
    registered: "2018-01-10T12:46:26 -01:00",
  },
  {
    _id: "62a3d1b964e0da91ab96aa25",
    index: 4,
    guid: "f38fbbd5-505f-485a-a5ad-f4bbfdb0c299",
    isActive: false,
    picture: "https://placehold.jp/150x150.png",
    name: "Consuelo",
    about:
      "Ipsum ut pariatur laborum magna et. Fugiat tempor ut ad quis anim aliqua. Culpa elit consequat ad nisi cupidatat nulla cillum magna laborum labore. Incididunt dolor consectetur ut eiusmod excepteur amet mollit ullamco excepteur minim deserunt aliquip.\r\n",
    registered: "2019-08-19T07:45:32 -02:00",
  },
  {
    _id: "62a3d1b9702d98fd04d41e97",
    index: 5,
    guid: "d8962c74-b550-48fa-833d-516a6ebc1035",
    isActive: true,
    picture: "https://placehold.jp/150x150.png",
    name: "Vicki",
    about:
      "Sit aute laboris culpa culpa nisi. Aute ex fugiat ut consequat qui qui minim duis ea ad eiusmod elit. Ea labore ut ex veniam velit reprehenderit excepteur reprehenderit. Eu labore eiusmod dolor aute elit voluptate consequat exercitation dolore anim. Cupidatat consequat ad magna sunt ex eiusmod eiusmod voluptate id reprehenderit quis sint proident. Consequat proident id id ut reprehenderit non est commodo mollit aliquip reprehenderit.\r\n",
    registered: "2016-12-19T05:07:47 -01:00",
  },
  {
    _id: "62a3d1b93f14d3833f060397",
    index: 6,
    guid: "b173ca61-15d2-440e-b2f6-aea17dd8d976",
    isActive: false,
    picture: "https://placehold.jp/150x150.png",
    name: "Daugherty",
    about:
      "Amet enim mollit pariatur veniam voluptate consequat cupidatat ullamco cillum laboris. Quis quis aliquip sunt ut. Irure adipisicing aliqua consectetur aute. Nulla aliquip eu proident nisi ipsum sint in adipisicing occaecat consectetur laboris ea ut. Reprehenderit amet amet minim amet id non mollit amet occaecat ea. Ut reprehenderit nostrud anim labore irure Lorem cupidatat dolore nostrud ipsum mollit esse occaecat.\r\n",
    registered: "2021-01-20T02:08:18 -01:00",
  },
  {
    _id: "62a3d1b92c22350101942cc1",
    index: 7,
    guid: "6a3801f3-f652-4286-bf6a-3c7981ed3811",
    isActive: false,
    picture: "https://placehold.jp/150x150.png",
    name: "Davenport",
    about:
      "Laboris magna aliquip officia tempor ea do sunt. Laboris consequat qui non veniam enim duis ex elit enim fugiat velit ut id. Officia laborum pariatur labore quis qui sint officia non. Esse adipisicing excepteur magna incididunt anim. Veniam nostrud proident magna duis nulla cupidatat labore anim. Cupidatat elit consequat nisi minim duis ipsum cillum culpa. Tempor dolore dolor id esse veniam sint aute fugiat ea ea voluptate culpa sunt exercitation.\r\n",
    registered: "2017-03-19T09:55:55 -01:00",
  },
  {
    _id: "62a3d1b96a88908dbb937635",
    index: 8,
    guid: "703f37f4-7959-4531-bf64-428bd3498b9a",
    isActive: false,
    picture: "https://placehold.jp/150x150.png",
    name: "Josephine",
    about:
      "Enim tempor quis eu elit. Velit voluptate dolore sunt proident eu anim labore quis officia. Excepteur duis adipisicing nostrud amet laborum elit est cillum magna consequat Lorem. Eiusmod magna duis ullamco ipsum aliquip laboris ea consequat reprehenderit et.\r\n",
    registered: "2017-05-30T08:41:37 -02:00",
  },
  {
    _id: "62a3d1b98e8456d3961cba8a",
    index: 9,
    guid: "15ce7269-0791-4092-8a22-836fcbbbc31a",
    isActive: true,
    picture: "https://placehold.jp/150x150.png",
    name: "Mendoza",
    about:
      "Non labore ad in nostrud reprehenderit ullamco occaecat veniam dolore sunt adipisicing proident. Labore enim ut sit incididunt deserunt labore laboris minim culpa commodo. Magna anim dolore est mollit et voluptate deserunt aliqua Lorem anim aliqua dolore sunt culpa. Eu ut nostrud magna ullamco esse non.\r\n",
    registered: "2020-11-14T04:36:18 -01:00",
  },
  {
    _id: "62a3d1b9017eedbbf6b0ec1c",
    index: 10,
    guid: "6b11ade3-ac21-4b4c-bb76-17a7210319bb",
    isActive: true,
    picture: "https://placehold.jp/150x150.png",
    name: "Tammy",
    about:
      "Amet sunt esse eu elit ipsum ipsum nostrud occaecat. Est elit duis fugiat id sunt commodo consectetur excepteur amet adipisicing do sunt. Et consectetur culpa exercitation anim laboris mollit elit.\r\n",
    registered: "2020-10-24T03:18:27 -02:00",
  },
  {
    _id: "62a3d1b95589974146a56948",
    index: 11,
    guid: "8c693a1a-9ffd-4e65-a336-d3e9e8f40616",
    isActive: true,
    picture: "https://placehold.jp/150x150.png",
    name: "Farley",
    about:
      "Occaecat enim duis eiusmod nisi cillum ex. Ex velit commodo dolore ullamco. Aute anim nostrud voluptate elit pariatur veniam qui veniam mollit aliquip tempor in Lorem. Aliquip enim mollit sunt deserunt pariatur eu culpa nostrud. Sunt nisi magna minim aliqua incididunt. Commodo sint in deserunt tempor eiusmod exercitation. Cillum labore culpa pariatur labore culpa fugiat fugiat nisi nulla sunt irure pariatur.\r\n",
    registered: "2016-04-12T04:02:25 -02:00",
  },
  {
    _id: "62a3d1b9a7f1ee2bfa5b2c19",
    index: 12,
    guid: "ace97ce9-b872-4293-9e2f-0247e14ddc7b",
    isActive: false,
    picture: "https://placehold.jp/150x150.png",
    name: "Dianna",
    about:
      "Adipisicing mollit duis sint eu minim duis nisi cupidatat amet irure aute irure. Deserunt culpa mollit sunt ad tempor veniam fugiat qui minim irure nulla amet. Laboris ad irure officia consequat incididunt ipsum excepteur irure aliquip. Cupidatat ea ex quis excepteur et aute Lorem irure esse cupidatat dolore tempor. Lorem minim nulla tempor voluptate tempor laboris. Laborum consectetur esse minim amet incididunt velit commodo ea duis nulla enim culpa.\r\n",
    registered: "2015-05-11T11:44:14 -02:00",
  },
  {
    _id: "62a3d1b9a16835edc0bc96e5",
    index: 13,
    guid: "bb2b8b16-07fa-4a02-8dd5-cf3c96b95bcf",
    isActive: true,
    picture: "https://placehold.jp/150x150.png",
    name: "Pat",
    about:
      "In elit ullamco cillum enim cillum cupidatat occaecat ut sit deserunt elit dolor occaecat. Pariatur veniam aliqua aute eiusmod dolor do cupidatat. Nisi aliqua exercitation nulla fugiat Lorem laborum cillum sit. Non magna do deserunt veniam voluptate.\r\n",
    registered: "2018-08-07T08:54:13 -02:00",
  },
  {
    _id: "62a3d1b9763f8c0fa2d994a5",
    index: 14,
    guid: "57c25c5d-03cc-4dfc-9672-8ec4f8f72226",
    isActive: false,
    picture: "https://placehold.jp/150x150.png",
    name: "Katherine",
    about:
      "Id exercitation veniam eu esse culpa magna commodo. Voluptate proident occaecat proident dolor nisi. Excepteur velit consectetur commodo ullamco consequat voluptate dolor elit velit exercitation enim excepteur.\r\n",
    registered: "2019-08-07T08:00:39 -02:00",
  },
  {
    _id: "62a3d1b91ceff3ff2b70e01d",
    index: 15,
    guid: "e0539c34-ab4d-4ddb-a28d-ce6a65b718dc",
    isActive: true,
    picture: "https://placehold.jp/150x150.png",
    name: "Candy",
    about:
      "Ex tempor sunt incididunt irure ut esse non deserunt nulla labore in. Mollit cillum sint magna incididunt pariatur amet nostrud amet occaecat do id ex. Cupidatat veniam consectetur fugiat quis consequat velit deserunt ipsum eu sunt irure deserunt. Fugiat incididunt elit laborum ipsum ea veniam. Amet consequat anim fugiat nostrud. Aliquip culpa Lorem quis quis minim sint ipsum tempor. Sint cupidatat est exercitation sint sunt sit et sunt.\r\n",
    registered: "2021-09-28T04:36:53 -02:00",
  },
  {
    _id: "62a3d1b901207f8d793c0b67",
    index: 16,
    guid: "9189749f-2a66-49c6-aab1-5d848ff08179",
    isActive: false,
    picture: "https://placehold.jp/150x150.png",
    name: "Bradford",
    about:
      "Laborum reprehenderit sit irure non incididunt deserunt id. Voluptate sit enim deserunt est duis sit officia amet non. Nostrud id exercitation occaecat anim incididunt irure nulla do.\r\n",
    registered: "2014-06-18T01:02:49 -02:00",
  },
  {
    _id: "62a3d1b953abfcf431cd63c2",
    index: 17,
    guid: "f329afbd-1ffb-4f0a-9d28-6b2bee5769c4",
    isActive: false,
    picture: "https://placehold.jp/150x150.png",
    name: "Buckley",
    about:
      "Non deserunt fugiat commodo consequat nisi aute culpa reprehenderit. Elit voluptate fugiat laboris occaecat exercitation. Sunt deserunt commodo Lorem nisi esse enim. Aute do occaecat id nostrud culpa do velit ad exercitation incididunt exercitation sunt qui. Eiusmod cillum dolor ipsum ad adipisicing excepteur eu qui qui laborum. Dolor ad eu culpa reprehenderit eiusmod.\r\n",
    registered: "2017-02-01T12:33:01 -01:00",
  },
];

const messagesRt = Backendless.Data.of("Messages").rt();

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
    return Backendless.UserService.getCurrentUser();
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
      let msgs = await Backendless.APIServices.Messages.getMessages(channelId, { pageOffset: pageParam });
      return msgs.reverse();
    },
    {
      getNextPageParam: undefined,
      getPreviousPageParam: (firstPage, pages) => (firstPage.length >= 20 ? pages.length * 20 : undefined),
    }, {
      enable: false
    }
  );
  const [bottomScroll, setBottomScroll] = useState(0);
  const [msgUpdate, setMsgUpdate] = useState(Math.floor(Math.random() * 10000));

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
    if(userError?.code === 3064 || messageError?.code === 3064) {
      Backendless.UserService.logout()
      .then(function () {
        queryClient.invalidateQueries("currentUser")
        location.reload();
      })
    }
  }, [userStatus, messageStatus])

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

  useEffect(() => {
    messagesRt.removeCreateListeners();

    const onObjectCreate = async (realMessage) => {
      let newMsg = await Backendless.APIServices.Messages.getSingleMessage(realMessage.objectId);
      queryClient.setQueryData("messages-" + channelId, (old) => {
        old.pages[old.pages.length - 1].push(newMsg);
        return { ...old };
      });
      setMsgUpdate(Math.floor(Math.random() * 10000));
    };
    const onError = (error) => console.log("An error has occurred - ", error);

    messagesRt.addCreateListener(`channel = '${channelId}'`, onObjectCreate, onError);

    scrollRef.current.scrollIntoView();
  }, [channelId]);

  useEffect(() => {
    if (chatRef.current !== null) {
      if (bottomScroll <= 50) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      } else {
        topScrollRef.current.scrollIntoView(true)
        setTimeout(() => {
        chatRef.current.scrollTo({
          top: chatRef.current.scrollTop - 100,
          left: 0,
          behavior: 'smooth'
        });
      }, 100)
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
                      self={d.author === user.objectId}
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
            {months[new Date(data.created).getMonth()] + " " + new Date(data.created).getDate() + " " + new Date(data.created).getFullYear()}
          </span>
        </div>
      )}
      <div class={style.message + " " + (self && style.self)}>
        <Link href={"/profile/" + data.username} class={style["message-img"]} ><img src={data.profilePicture.small} /></Link>
        <div class={style["message-body"]}>
          <div class={style["message-author"] + " dimmed small"}>
            {!self && <strong><Link href={"/profile/" + data.username} >{data.name}</Link></strong>} <span class="smaller">{createDate(data.created - 3000)}</span>
          </div>
          <div class={style["message-text"]}>{data.message}</div>
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
    await Backendless.APIServices.Messages.postMessage(msg, channelId);
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
          {chatInput.length <= 0 ? 
          <button disabled={true} class={"small disabled " + style["message-btn"]}>
            <i class="fa-solid fa-location-arrow"></i>
          </button> : 
          <button type="submit" class={"small " + style["message-btn"]}>
            <i class="fa-solid fa-location-arrow"></i>
          </button>}
        </div>
      </div>
    </form>
  );
};
