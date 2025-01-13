export default function tick(callback: (dt: number) => void) {
  let prevTimeStamp = 0;
  function step(timeStamp: number = 0) {
    // Compute dt
    const dt = (timeStamp - prevTimeStamp) / 1000;
    prevTimeStamp = timeStamp;

    callback(dt);

    window.requestAnimationFrame(step);
  }

  window.requestAnimationFrame((t: number) => {
    prevTimeStamp = t;
    step(t);
  });
}
