

export default function createDate(dateC) {
    let now = Date.now()
    let months = ["January", "Feburary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let diff = now - new Date(dateC).getTime()
    if(diff < 60000) {
        return `${Math.floor(diff / 1000)} sec.`
    } else if (diff < 3600000) {
        return `${Math.floor(diff / 1000 / 60)} min.`;
    } else if (diff < 86400000) {
        let hours = Math.floor(diff / 1000 / 60 / 60)
        return `${hours} ${hours === 1 ? "hour" : "hours"}`
    } else if (diff < 604800000) {
        let days = Math.floor(diff / 1000 / 60 / 60 /24) 
        return `${days} ${days === 1 ? "day" : "days"}`
    } else {
        let dateNow = new Date(now);
        let dateCreated = new Date(dateC);
        return `${dateCreated.getDate()}. ${months[dateCreated.getMonth()]} ${dateNow.getFullYear() !== dateCreated.getFullYear() ? dateCreated.getFullYear() : ""}`;
    }
  }