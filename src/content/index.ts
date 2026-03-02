console.log("extention loaded");

var debuggerAttached = false

setInterval(() => {
  const skipAddBtn = document.querySelector(".ytp-skip-ad-button");
  if (skipAddBtn && !debuggerAttached) {
    console.log("Debugger Attach")
    debuggerAttached = true;
    chrome.runtime.sendMessage({
      type: "debug.attach",
    });

  } else if (!skipAddBtn && debuggerAttached) {
    console.log("Debugger detach")
    debuggerAttached = false
    chrome.runtime.sendMessage({
      type: "debug.detach",
    })
  }

  if (skipAddBtn && debuggerAttached)  {
    clickElementByQuery(".ytp-skip-ad-button", "left")
  }
}, 500)

function clickElementByQuery(query: string, button: string) {
  const skipAddBtn = document.querySelector(query) as HTMLButtonElement;

  if (skipAddBtn){
    const rect = skipAddBtn.getBoundingClientRect();
    console.log("Click ", rect);
    chrome.runtime.sendMessage({
      type: "click",
      position: {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      },
      button,
    })

  }
}

// // Check if the browser supports the Media Session API
// if ('mediaSession' in navigator) {
//
//   // // Listen for the physical hardware "Play" button
//   // navigator.mediaSession.setActionHandler('play', () => {
//   //   console.log("Hardware PLAY button pressed!");
//   //   // Insert your logic to play your audio/video here
//   // });
//
//   // Listen for the physical hardware "Pause" button
//   navigator.mediaSession.setActionHandler('pause', () => {
//     console.log("Hardware PAUSE button pressed!");
//     // Insert your logic to pause your audio/video here
//     skipAdd();
//   });
// } else {
//   // console.log("Media Session API is not supported in this browser.");
//   const videoEl = document.querySelector(".video-stream.html5-main-video") as HTMLVideoElement;
//   if (videoEl) {
//     videoEl.addEventListener("pause", () => {
//       console.log("pause: Extention");
//       skipAdd();
//     })
//   }
// } 

