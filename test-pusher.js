const Pusher = require("pusher");
const pusher = new Pusher({
  appId: "2166872",
  key: "3b82f3854dea6a78f607",
  secret: "3dc2134a5d860ec53fe0",
  cluster: "ap2",
  useTLS: true
});
pusher.trigger("my-channel", "my-event", {
  message: "hello world"
}).then(res => console.log("Pusher Success!", res.status))
  .catch(err => console.error("Pusher Error:", err));
