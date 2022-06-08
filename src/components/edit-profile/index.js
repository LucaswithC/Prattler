import { h } from "preact";
import style from "./style.css";
import { useEffect, useState } from "preact/hooks";
import { useQuery, useQueryClient } from "react-query";

import toastError from "../toasts/error";

import ppPlaceholder from "../../assets/icons/pp_placeholder.svg";
import bannerPlaceholder from "../../assets/icons/banner_placeholder.svg";

import convert from "image-file-resize";
import {renameFile, getHeightAndWidthFromDataUrl, calculateAspectRatioFit} from "../other/files"

let emailCheckTimeout;

const EditProfile = ({ oldUser, editStatus, closeEdit, setUser }) => {
  const queryClient = useQueryClient();
  const {
    status: userStatus,
    data: user,
    error: userError,
    refetch: userRefetch,
  } = useQuery("currentUser", async () => {
    return Backendless.UserService.getCurrentUser();
  });

  const [newPPicture, setNewPPicture] = useState("");
  const [newPPPreview, setNewPPPreview] = useState("");
  const [newBannerPicture, setNewBannerPicture] = useState("");
  const [newBannerPreview, setNewBannerPreview] = useState("");
  const [ppUplaod, setPpUpload] = useState("");
  const [bannerUplaod, setBannerUpload] = useState("");

  const [newName, setNewName] = useState(user?.name || "");
  const [newBio, setNewBio] = useState(user?.bio || "");

  const [email, setEmail] = useState(user.email);
  const [emailStatus, setEmailStatus] = useState(true);
  const [emailError, setEmailError] = useState("");
  const curEmail = user.email;

  const [newPassword, setNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const [canSubmit, setSubmit] = useState(true);

  const [loading, setLoading] = useState(false);

  function setNewError(type, mss) {
    let newErr = { ...errors };
    newErr[type] = mss;
    setErrors(newErr);
  }

  function deleteError(type) {
    let newErr = { ...errors };
    delete newErr?.[type];
    setErrors(newErr);
  }

  useEffect(() => {
    setNewName(newName.slice(0, 30));
  }, [newName]);

  useEffect(() => {
    setNewBio(newBio.slice(0, 250));
  }, [newBio]);

  useEffect(() => {
    clearTimeout(emailCheckTimeout);
    if (email.length === 0) {
      setEmailError("");
    }
    if (/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email)) {
      setEmailStatus(true);
    } else if (email.length === 0) {
      setEmailStatus(false);
    } else {
      setEmailStatus(false);
    }
    let timeout = emailError.length > 0 ? 0 : 1000;
    emailCheckTimeout = setTimeout(() => {
      if (/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email)) {
        setEmailError("");
      } else if (email.length === 0) {
        setEmailError("");
      } else {
        setEmailError("Please provide a real Email-Adress");
      }
    }, timeout);
  }, [email]);

  useEffect(() => {
    setSubmit(true);
    if (newName > 30) setSubmit(false);
    if (newBio > 250) setSubmit(false);
    if (!emailStatus) setSubmit(false);
    if (email !== curEmail && oldPassword.length === 0) setSubmit(false);
    if (newPassword.length > 0 && oldPassword.length === 0) setSubmit(false);
    if (newPassword.length > 0 && !newPassword.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/g)) setSubmit(false);
  }, [newName, newBio, errors, emailStatus, email, oldPassword, newPassword]);

  function submitPP(e) {
    setPpUpload("");
    let file = e.target.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setNewPPicture(file);
      setNewPPPreview(fileReader.result);
    };
    if (file.type !== "image/png" && file.type !== "image/jpg" && file.type !== "image/jpeg" && file.type !== "image/gif") {
      setNewError("ppError", "Wrong Format. Only use png, jpg or gif");
    } else if (file.size > 2000000) {
      setNewError("ppError", "Size is too big. Max. Size is 2 MB");
    } else {
      deleteError("ppError");
      setNewPPicture(file);
      fileReader.readAsDataURL(file);
    }
  }

  function submitBanner(e) {
    setBannerUpload("");
    let file = e.target.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setNewBannerPreview(fileReader.result);
      setNewBannerPicture(file);
    };
    if (file.type !== "image/png" && file.type !== "image/jpg" && file.type !== "image/jpeg" && file.type !== "image/gif") {
      setNewError("bannerError", "Wrong Format. Only use png, jpg or gif");
    } else if (file.size > 2097152) {
      setNewError("bannerError", "Size is too big. Max. Size is 2 MB");
    } else {
      deleteError("bannerError");
      fileReader.readAsDataURL(file);
    }
  }

  const uploadPicture = async (file, upload, folder, override) => {
    upload("Uploading");
    const fileAsDataURL = window !== undefined && window.URL.createObjectURL(file);
    const dimension = await getHeightAndWidthFromDataUrl(fileAsDataURL);

    let sizes = {
      medium: calculateAspectRatioFit(dimension.width, dimension.height, folder === "banner" ? 1000 : 250),
      small: calculateAspectRatioFit(dimension.width, dimension.height, folder === "banner" ? 600 : 60),
    };

    const randomName = Date.now() + "" + Math.floor(Math.random() * 100000)

    let images = {
      original: renameFile(file, user.objectId + "-" + randomName + "-" + folder + "." + file.type.split("/")[1]),
    };
    await convert({
      file: renameFile(file, user.objectId + "-" + randomName + "-" + folder + "-medium." + file.type.split("/")[1]),
      width: sizes.medium.width,
      height: sizes.medium.height,
      type: file.type.split("/")[1],
    })
      .then((resp) => {
        images.medium = resp;
      })
      .catch((error) => {
        console.log(file.type.split("/")[1], error);
        throw error;
      });
    await convert({
      file: renameFile(file, user.objectId + "-" + randomName + "-" + folder + "-small." + file.type.split("/")[1]),
      width: sizes.small.width,
      height: sizes.small.height,
      type: file.type.split("/")[1],
    })
      .then((resp) => {
        images.small = resp;
      })
      .catch((error) => {
        throw error;
      });
    return await Promise.all([
      Backendless.Files.upload(images.original, folder, override),
      images.medium.size < images.original.size ? Backendless.Files.upload(images.medium, folder, override) : null,
      (images.small.size < images.medium.size && images.small.size < images.original.size) ? Backendless.Files.upload(images.small, folder, override) : null,
    ])
      .then((values) => {
        upload("");
        return {
          original: values[0].fileURL,
          medium: values[1]?.fileURL || values[0]?.fileURL,
          small: values[2]?.fileURL || values[1]?.fileURL || values[0]?.fileURL,
        };
      })
      .catch((err) => {
        upload("Error");
        throw err;
      });
  };

  const updateUser = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setLoading(true);
    if (canSubmit) {
      if (Object.keys(errors).length === 0) {
        let pp = newPPicture ? uploadPicture(newPPicture, setPpUpload, "profilePictures", false) : null;
        let banner = newBannerPicture ? uploadPicture(newBannerPicture, setBannerUpload, "banner", false) : null;
        Promise.all([pp, banner])
          .then((values) => {
            let updateData = {};
            let ppRes = values[0];
            let bannerRes = values[1];
            updateData.username = user.username;
            if (newName !== user.name) updateData.name = newName;
            if (newBio !== user.bio) updateData.bio = newBio;
            if (ppRes) {
              updateData.profilePicture = ppRes || user?.profilePicture;
              updateData.oldPP = user.profilePicture
            } 
            if (bannerRes) { 
              updateData.banner = bannerRes || user?.banner; 
              updateData.oldBanner = user.banner
            }
            if (email !== curEmail) updateData.email = email;
            if (newPassword) updateData.newPassword = newPassword;
            if (email !== curEmail || newPassword) updateData.oldPassword = oldPassword;
            Backendless.APIServices.Users.editUser(updateData)
              .then(function (updatedUser) {
                setGeneralError("Success");
                setLoading(false);
                Backendless.UserService.currentUser = updatedUser;
                queryClient.invalidateQueries("currentUser");
                let newUserData = Object.assign(oldUser, updatedUser);
                setUser(newUserData);
              })
              .catch(function (error) {
                user.email = curEmail;
                if (error.code === 3018) {
                  setGeneralError("An account with this email already exists | Err-Code: " + error.code);
                } else if (error.code === 10001) {
                  setGeneralError("Wrong current password | Err-Code: " + error.code);
                } else if (error.code === 20001) {
                  setGeneralError("False Email Format | Err-Code: " + error.code);
                } else if (error.code === 20002) {
                  setGeneralError("False Password Format | Err-Code: " + error.code);
                } else if (error.code === 30001) {
                  setGeneralError("Name is too long | Err-Code: " + error.code);
                } else if (error.code === 30002) {
                  setGeneralError("Biography is too long | Err-Code: " + error.code);
                } else {
                  setGeneralError("Something went wrong | Err-Code: " + error.code);
                }
                setLoading(false);
              });
          })
          .catch((error) => {
            console.log(error);
            setGeneralError("There was an error with the upload");
            setLoading(false);
            toastError("There was an error");
          });
      }
    }
  };

  return (
    <div>
      <div class={style["edit-cont"] + " " + (editStatus && style["active"])}>
        <i class={"fa-solid fa-circle-chevron-right " + style["close-edit"] + " " + (editStatus && style["active"])} onClick={closeEdit}></i>
        <div class={style["edit-profile"] + " " + (editStatus && style["active"]) + " mobile-space"}>
          <h2 class="accent">Edit your Profile</h2>
          <p>You can edit your Profile to your Preferences to create your Personal Appearance</p>
          {generalError === "Success" ? (
            <p class={"small " + style.correct}>
              <i class="fa-regular fa-circle-check"></i> Your profile got updated
            </p>
          ) : (
            generalError.length > 0 && (
              <p class={"small " + style.error}>
                <i class="fa-regular fa-circle-xmark"></i> {generalError}
              </p>
            )
          )}
          <form class={style["edit-form"]} onSubmit={updateUser}>
            <input id={style["pp-input"]} type="file" accept="image/png, image/jpg, image/jpeg, image/gif" onInput={submitPP} />
            <label for={style["pp-input"]} class={style["pp-label"]}>
              <div class={style["pp-img"] + " " + (newPPicture !== "" && style["img-active"])}>
                <img src={newPPPreview || user?.profilePicture?.small || ppPlaceholder} />
                <i class="fa-solid fa-circle-plus"></i>
              </div>
              <div class={style["pp-text"]}>
                <h3 class="accent">Upload a Profile Picture</h3>
                <p class="smaller dimmed m-0">Best 50 x 50 px, not bigger than 2 MB, only png/jpg/gif</p>
                <div class="button sec small mt-1">Select Image</div>
              </div>
            </label>
            {ppUplaod === "Uploading" ? (
              <p class={style.uploading}>
                <i class="fa-solid fa-arrows-rotate"></i> Uploading...
              </p>
            ) : (
              ppUplaod === "Error" && (
                <p class={"smaller m-0 " + style.error + " " + style["error-message"]}>
                  <i class="fa-regular fa-circle-xmark"></i> Something went wrong during the upload
                </p>
              )
            )}

            {errors?.ppError && (
              <p class={"smaller m-0 " + style.error + " " + style["error-message"]}>
                <i class="fa-regular fa-circle-xmark"></i> {errors.ppError}
              </p>
            )}
            <input id={style["banner-input"]} type="file" accept="image/png, image/jpg, image/jpeg, image/gif" onInput={submitBanner} />
            <label for={style["banner-input"]} class={style["pp-label"] + " " + style["banner-label"]}>
              <div class={style["pp-img"] + " " + (newBannerPicture && style["img-active"])}>
                <img src={newBannerPreview || user?.banner?.small || bannerPlaceholder} />
                <i class="fa-solid fa-circle-plus"></i>
              </div>
              <div class={style["pp-text"]}>
                <h3 class="accent">Upload a Banner</h3>
                <p class="smaller dimmed m-0">Best 1000 x 200 px, not bigger than 2 MB, only png/jpg/gif</p>
                <div class="button sec small mt-1">Select Image</div>
              </div>
            </label>
            {bannerUplaod === "Uploading" ? (
              <p class={style.uploading}>
                <i class="fa-solid fa-arrows-rotate"></i> Uploading...
              </p>
            ) : (
              bannerUplaod === "Error" && (
                <p class={"smaller m-0 " + style.error + " " + style["error-message"]}>
                  <i class="fa-regular fa-circle-xmark"></i> Something went wrong during the upload
                </p>
              )
            )}
            {errors?.bannerError && (
              <p class={"smaller m-0 " + style.error + " " + style["error-message"]}>
                <i class="fa-regular fa-circle-xmark"></i> {errors.bannerError}
              </p>
            )}
            <label class={style["nr-label"]}>
              Change your Name <span class="dimmed">{newName.length} / 30</span>
            </label>
            <input maxLength="30" placeholder={user.name} type="text" value={newName} onInput={(e) => setNewName(e.target.value)} />
            <label class={style["nr-label"]}>
              Change your Biography <span class="dimmed">{newBio.length} / 250</span>
            </label>
            <textarea maxLength="250" rows="3" value={newBio} onInput={(e) => setNewBio(e.target.value)}></textarea>
            <label>Change your Email</label>
            <input
              autocomplete="off"
              placeholder={user.email}
              type="email"
              value={email}
              onInput={(e) => setEmail(e.target.value)}
              class={emailError.length > 0 && style["error-box"]}
            />
            {emailError.length > 0 && (
              <p class={"smaller m-0 " + style.error + " " + style["error-message"]}>
                <i class="fa-regular fa-circle-xmark"></i> {emailError}
              </p>
            )}
            <label>Change your Password</label>
            <input autocomplete="new-password" type="password" onInput={(e) => setNewPassword(e.target.value)} />
            {newPassword.length > 0 && (
              <div class={style["input-req"]}>
                {newPassword.match(/^.{8,20}$/g) ? (
                  <div class={"smaller " + style.correct}>
                    <i class="fa-regular fa-circle-check"></i>
                    <p class="m-0">8 - 20 Characters long</p>
                  </div>
                ) : (
                  <div class={"smaller " + style.error}>
                    <i class="fa-regular fa-circle-xmark"></i>
                    <p class="m-0">8 - 20 Characters long</p>
                  </div>
                )}
                {newPassword.match(/(?=.*[a-z])(?=.*[A-Z])\w+/g) ? (
                  <div class={"smaller " + style.correct}>
                    <i class="fa-regular fa-circle-check"></i>
                    <p class="m-0">1+ lower- and 1+ uppercase Letter</p>
                  </div>
                ) : (
                  <div class={"smaller " + style.error}>
                    <i class="fa-regular fa-circle-xmark"></i>
                    <p class="m-0">1+ lower- and 1+ uppercase Letter</p>
                  </div>
                )}
                {newPassword.match(/(?=.*\d)/g) ? (
                  <div class={"smaller " + style.correct}>
                    <i class="fa-regular fa-circle-check"></i>
                    <p class="m-0">min. 1 Number</p>
                  </div>
                ) : (
                  <div class={"smaller " + style.error}>
                    <i class="fa-regular fa-circle-xmark"></i>
                    <p class="m-0">min. 1 Number</p>
                  </div>
                )}
              </div>
            )}
            {(newPassword.length > 0 || email !== user.email) && (
              <div>
                <label>Current Password</label>
                <input type="password" onInput={(e) => setOldPassword(e.target.value)} />
                <p class="smaller dimmed m-0">When changing your email adress or your password you need to input your current password</p>
              </div>
            )}
            {generalError === "Success" ? (
              <p class={"small " + style.correct}>
                <i class="fa-regular fa-circle-check"></i> Your profile got updated
              </p>
            ) : (
              generalError.length > 0 && (
                <p class={"small " + style.error}>
                  <i class="fa-regular fa-circle-xmark"></i> {generalError}
                </p>
              )
            )}
            {canSubmit ? (
              <button type="submit" class={style["submit"]}>
                {loading && <i class={"fa-solid fa-spinner " + style["login-loader"]}></i>}
                Save
              </button>
            ) : (
              <div class={"button disabled " + style.submit}>Save</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
