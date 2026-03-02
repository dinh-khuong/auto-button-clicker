import { clickElement, checkQuerries, dettachDebugger } from './perform';

console.log("extention loaded");

setInterval(() => {
  clickElement({
    query: ".ytp-skip-ad-button",
    button: "left",
  });

  if (!checkQuerries([ ".ytp-skip-ad-button" ])) {
    dettachDebugger();
  }
}, 500)

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

