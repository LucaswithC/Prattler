//   /*******************************************************************
//   * Messages.js
//   * Generated by Backendless Corp.
//   ********************************************************************/

import pb from "../connect";

const Utils = {
  isObject: (obj) => obj === Object(obj),
  isString: (obj) => Object.prototype.toString.call(obj).slice(8, -1) === "String",
  isNumber: (obj) => Object.prototype.toString.call(obj).slice(8, -1) === "Number",
  isBoolean: (obj) => Object.prototype.toString.call(obj).slice(8, -1) === "Boolean",
  isDate: (obj) => Object.prototype.toString.call(obj).slice(8, -1) === "Date",
};

// Backendless.APIServices.Messages = {
function postMessage(message, channelId) {
  return new Promise((resolve, reject) => {
    if (!Utils.isString(message)) {
      return reject(new Error('Invalid value for argument "message". Must be string value'));
    }

    if (!Utils.isString(channelId)) {
      return reject(new Error('Invalid value for argument "channelId". Must be string value'));
    }

    if (!pb.authStore?.model) {
      return reject(new Error("You must be logged in"));
    }

    let newMsg = {
      text: message,
      channel: channelId,
      author: pb.authStore.model.id,
    };

    pb.collection("messages")
      .create(newMsg)
      .then((res) => {
        pb.collection("channels")
          .update(channelId, {})
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      })
      .catch((err) => reject(err));
  });
}

function getMessages(channelId, pageSize = 20, pageOffset = 1) {
  return new Promise((resolve, reject) => {
    if (!Utils.isString(channelId)) {
      return reject(new Error('Invalid value for argument "channelId". Must be string value'));
    }

    if (!pb.authStore.model.id) {
      return reject(new Error("You must be logged in"));
    }

    pb.collection("messages")
      .getList(pageOffset, pageSize, {
        filter: `channel = "${channelId}"`,
        sort: "-created",
        expand: "author",
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
}

function getSingleMessage(channelId, time) {
  return new Promise((resolve, reject) => {
    if (!Utils.isString(channelId)) {
      throw new Error('Invalid value for argument "channelId". Must be string value');
    }

    pb.collection("messages")
      .getList(1, 1, {
        filter: `channel = "${channelId}" && created < "${time}"`,
        sort: "-created",
        expand: "author"
      })
      .then((res) => resolve(res.items?.[0]))
      .catch((err) => reject(err));
  });
}

function getChannelName(channelId) {
  return new Promise((resolve, reject) => {
    if (!Utils.isString(channelId)) {
      throw new Error('Invalid value for argument "channelId". Must be string value');
    }

    pb.collection("channels")
      .getOne(channelId)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
}

function getJoinedChannels(pageSize = 20, pageOffset = 1) {
  return new Promise((resolve, reject) => {
    if (!pb.authStore?.model) {
      return reject(new Error("You must be logged in."));
    }

    pb.collection("channels")
      .getList(pageOffset, pageSize, {
        filter: `members.id ?= "${pb.authStore.model.id}"`,
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
}

function getSearchedChannels(searchTerm) {
  return new Promise((resolve, reject) => {
    if (!Utils.isString(searchTerm)) {
      return reject(new Error('Invalid value for argument "searchTerm". Must be string value'));
    }

    if (!pb.authStore.model) {
      return reject(new Error("You must be logged in"));
    }

    return pb
      .collection("channels")
      .getFullList(200, {
        filter: `name ~ "${searchTerm}"`,
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
}

function joinChannel(channelId) {
  return new Promise((resolve, reject) => {
    if (!Utils.isString(channelId)) {
      return reject(new Error('Invalid value for argument "channelId". Must be string value'));
    }

    if (!pb.authStore?.model) {
      return reject(new Error("You must be logged in"));
    }

    pb.collection("channels")
      .update(channelId, {
        "members+": pb.authStore.model.id,
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
}

function leaveChannel(channelId) {
  return new Promise((resolve, reject) => {
    if (!Utils.isString(channelId)) {
      return reject(new Error('Invalid value for argument "channelId". Must be string value'));
    }

    if (!pb.authStore?.model) {
      return reject(new Error("You must be logged in"));
    }

    pb.collection("channels")
      .update(channelId, {
        "members-": pb.authStore.model.id,
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
}

function getChannelMembers(channelId) {
  return new Promise((resolve, reject) => {
    if (!Utils.isString(channelId)) {
      return reject(new Error('Invalid value for argument "channelId". Must be string value'));
    }

    pb.collection("channels")
      .getOne(channelId, {
        expand: "members",
      })
      .then((res) => resolve(res?.expand?.members))
      .catch((err) => reject(err));
  });
}

 function newChannel(name,description) {
  return new Promise((resolve, reject) => {
    if (!Utils.isString(name)) {
      return reject(new Error('Invalid value for argument "name". Must be string value'))
    }

    if (!Utils.isString(description)) {
      return reject(new Error('Invalid value for argument "description". Must be string value'))
    }

    if (!pb.authStore.model) {
      return reject(new Error("You must be logged in"))
    }

    const data = {
      name: name,
        desc: description,
        members: [pb.authStore.model.id]
    }

    pb.collection("channels").create(data).then(res => resolve(res)).catch(err => reject(err))
  })
}

// }

export { postMessage, getMessages, getSingleMessage, getJoinedChannels, getSearchedChannels, getChannelName, joinChannel, leaveChannel, getChannelMembers, newChannel };