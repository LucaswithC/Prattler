import { h } from "preact";
import style from "./style.css";
import { useEffect, useState, useRef } from "preact/hooks";
import { useQueryClient } from "react-query";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";

import Loader from "../loader/loader";

import toastError from "../toasts/error";
import toastSuccess from "../toasts/success";
import { route } from "preact-router";

import useClickOutside from "use-click-outside";

const PostCard = ({ user, commentOn }) => {
  const queryClient = useQueryClient();
  const [replyStatus, setReplyStatus] = useState(false);
  const [replySetting, setReplySetting] = useState("everyone");
  const [postInput, setPostInput] = useState("");
  const [uploadImg, setUploadImg] = useState([]);
  const [uploadImgStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const replyRef = useRef()
  useClickOutside(replyRef, () => {if(replyStatus) setReplyStatus(false)});

  function postTextbox(e) {
    if (e.target.scrollHeight > e.target.clientHeight) e.target.style.height = e.target.scrollHeight + "px";
    setPostInput(e.target.value);
  }

  useEffect(() => {
    setPostInput(postInput.slice(0, 250));
  }, [postInput]);

  const previewImage = async (e) => {
    let images = e;
    let files = Array.from(images).map((img) => {
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        if (img.type !== "image/png" && img.type !== "image/jpg" && img.type !== "image/jpeg" && img.type !== "image/gif") {
          toastError(img.name + " is the wrong format");
          reject("format");
        } else if (img.size > 4194304) {
          toastError(img.name + " is too big");
          reject("size");
        } else {
          fileReader.onload = async () => {
            resolve(fileReader.result);
          };
          fileReader.readAsDataURL(img);
        }
      });
    });
    await Promise.all(files).then((res) => {
      let imgArr = [...uploadImg, ...res];
      setUploadImg(imgArr.slice(0, 4));
      if (imgArr.slice(4).length > 0) {
        toastError("You can only upload 4 images");
      }
    });
  };

  function startImgDrag(ev, index) {
    ev.dataTransfer.setData("text", index);
  }

  function onImgDragOver(ev) {
    ev.preventDefault();
  }

  function onImgDragEnter(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add(style["img-fade"]);
  }

  function onImgDragLeave(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.remove(style["img-fade"]);
  }

  function onImgDrop(ev, index) {
    if (ev.dataTransfer.getData("text")) {
      ev.currentTarget.classList.remove(style["img-fade"]);
      ev.preventDefault();
      let data = ev.dataTransfer.getData("text");
      let img1 = uploadImg[data];
      let img2 = uploadImg[index];
      let imgArr = [...uploadImg];
      imgArr[index] = img1;
      imgArr[data] = img2;
      setUploadImg(imgArr);
    }
  }
  var enterTarget = null;
  function uploadDropEnter(e) {
    if (!e.dataTransfer.getData("text")) {
      enterTarget = e.target;
      if (e.currentTarget.classList.contains(style["post-card"])) {
        e.currentTarget.classList.add(style["post-active-drop"]);
      }
      e.preventDefault();
      e.stopPropagation();
      console.log("enter");
    }
  }

  function uploadDropLeave(e) {
    if (!e.dataTransfer.getData("text")) {
      if (enterTarget == e.target) {
        enterTarget = null;
        e.preventDefault();
        e.currentTarget.classList.remove(style["post-active-drop"]);
        e.stopPropagation();
        console.log("left");
      }
    }
  }

  function onUploadDrop(e) {
    e.preventDefault();
    uploadDropLeave(e);
    if (e.dataTransfer.files.length > 0) {
      previewImage(e.dataTransfer.files);
    }
  }

  function deleteImg(e, index) {
    e.stopPropagation();
    let imgArr = [...uploadImg];
    let firstHalf = imgArr.slice(0, index);
    let lastHalf = imgArr.slice(index, imgArr.length);
    lastHalf.shift();
    imgArr = [...firstHalf, ...lastHalf];
    setUploadImg(imgArr);
  }

  const uploadPicture = async (file, upload) => {
    setUploadStatus("Uploading");
    let cloudname = "dtc8u5oa0";
    const fileForm = new FormData();
    fileForm.append("file", file);
    fileForm.append("upload_preset", "pk0uto3z");
    fileForm.append("cloud_name", cloudname);
    let imgUpload = await fetch(`https://api.cloudinary.com/v1_1/${cloudname}/image/upload`, {
      method: "POST",
      body: fileForm,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setUploadStatus("Error");
          throw new Error("Error");
          return "Error";
        } else {
          return data.url;
        }
      });
    return imgUpload;
  };

  const sendPost = async (e) => {
    e.preventDefault();
    setLoading(true);
    const promises = [];
    uploadImg.forEach((img) => promises.push(uploadPicture(img)));
    Promise.all(promises).then((values) => {
      setUploadStatus("");
      let newPost = {
        text: postInput,
        images: [...values],
        reply: replySetting,
      };
      if (commentOn) {
        Backendless.APIServices.Posts.addPostComment(commentOn.feedId, commentOn.objectId, newPost)
          .then((res) => {
            setLoading(false);
            setPostInput("");
            setUploadImg([]);
            toastSuccess("Comment successful posted")
            commentOn.onFinish(res)
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
          });
      } else {
        Backendless.APIServices.Posts.addPost(newPost)
          .then((res) => {
            setLoading(false);
            setPostInput("");
            setUploadImg([]);
            toastSuccess("Post successful posted");
            route("/post/" + res.objectId);
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
          });
      }
    });
  };

  return (
    <div
      class={style["post-card"] + " " + (!!commentOn && style["comment"])}
      ondragover={onImgDragOver}
      ondrop={onUploadDrop}
      onDragEnter={uploadDropEnter}
      onDragLeave={uploadDropLeave}
    >
      {!!commentOn ? (
        <div>
          {postInput && (
            <div class={style["comment-header"]}>
              <progress class={style["post-value-progress"]} value={postInput.length} max="250"></progress>
              <p class="accent">{postInput.length} <span class={style["comment-small"]}>/ 250</span></p>
            </div>
            )}
        </div>
      ) : (
        <div>
          <div class={style["post-card-header"]}>
            <strong class="smaller">Post something</strong>
            <span class="accent">{postInput.length} / 250</span>
          </div>
          <progress class={style["post-value-progress"]} value={postInput.length} max="250"></progress>
        </div>
      )}
      <div>
        <form onSubmit={sendPost} class={style["post-card-body"]}>
          <img class={style["post-pp"]} src={user?.profilePicture || ppPlaceholder} />
          <div class={style["post-card-body-main"]}>
            <textarea
              id="post-input"
              value={postInput}
              placeholder={!!commentOn ? "Reply something..." : "Post something..."}
              onInput={postTextbox}
              maxLength="250"
              rows={!!commentOn ? "1" : "2"}
            ></textarea>
            {uploadImg.length > 0 && (
              <div class={style["posted-card-pictures"] + " " + (uploadImg.length % 2 === 0 ? style["even"] : style["odd"])}>
                {uploadImg.map((img, index) => (
                  <div
                    draggable="true"
                    ondragstart={(event) => startImgDrag(event, index)}
                    ondragover={onImgDragOver}
                    ondrop={(event) => onImgDrop(event, index)}
                    onDragEnter={onImgDragEnter}
                    onDragLeave={onImgDragLeave}
                  >
                    <img src={img} title="image caption a" />
                    <i class={style["img-delete"] + " fa-solid fa-xmark"} onclick={(event) => deleteImg(event, index)}></i>
                  </div>
                ))}
              </div>
            )}
            {uploadImgStatus === "Uploading" ? (
              <p class={style.uploading}>
                <i class="fa-solid fa-arrows-rotate"></i> Uploading...
              </p>
            ) : (
              uploadImgStatus === "Error" && (
                <p class={"smaller m-0 " + style.error + " " + style["error-message"]}>
                  <i class="fa-regular fa-circle-xmark"></i> Something went wrong during the upload
                </p>
              )
            )}
            {((!!commentOn && postInput) || !commentOn) && (
              <div class={style["post-card-footer"]}>
                <input
                  id="post-img-id"
                  class={style["post-img-input"]}
                  type="file"
                  accept="image/png, image/jpg, image/jpeg, image/gif"
                  multiple="true"
                  onInput={(e) => previewImage(e.target.files)}
                />
                <label for="post-img-id" class={"pointer " + style["img-label"]}>
                  <i class="fa-solid fa-images"></i>
                </label>
                <div class={style["post-reply"]}>
                  {replySetting === "everyone" ? (
                    <div onClick={() => setReplyStatus(true)} class={style["current-reply"]}>
                      <i class="fa-solid fa-earth-americas"></i> Everyone can reply
                    </div>
                  ) : (
                    <div onClick={() => setReplyStatus(true)} class={style["current-reply"]}>
                      <i class="fa-solid fa-user-group"></i> Your Followers can reply
                    </div>
                  )}
                  {replyStatus && (
                    <div ref={replyRef} class={style["reply-setting"]}>
                      <strong>Who can reply?</strong>
                      <span>Choose who can reply to this Post</span>
                      <div
                        for="reply-anyone"
                        onClick={() => {
                          setReplySetting("everyone");
                          setReplyStatus(false);
                        }}
                      >
                        <i class="fa-solid fa-earth-americas"></i> Everyone
                      </div>
                      <div
                        for="reply-follower"
                        onClick={() => {
                          setReplySetting("followers");
                          setReplyStatus(false);
                        }}
                      >
                        <i class="fa-solid fa-user-group"></i> Your Followers
                      </div>
                    </div>
                  )}
                </div>
                {postInput.length > 0 ? (
                  <button type="submit" class={style["post-submit"]}>
                    {loading && <Loader type={"text"} />} Post
                  </button>
                ) : (
                  <div class={"button disabled " + style["post-submit"]}>{!!commentOn ? "Comment" : "Post"}</div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostCard;
