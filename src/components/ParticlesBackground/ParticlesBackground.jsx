import { useEffect, useState, useMemo, memo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

const ParticlesBackgroundMain = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => setInit(true));
  }, []);

  const options = useMemo(() => ({
    fpsLimit: 120, 
    fullScreen: { enable: true, zIndex: -1 },
    background: { color: "transparent" },
    particles: {
      number: { value: 50 },
      shape: { type: "circle" },
      color: {
        value: ["rgba(2,0,36,0.3)", "rgba(9,9,121,0.3)", "rgba(0,212,255,0.3)"], // same as login
      },
      opacity: { value: 0.5 },
      size: { value: 400, random: { enable: true, minimumValue: 200 } },
      move: {
        enable: true,
        speed: 10,
        direction: "top",
        outModes: { default: "out" },
      },
    },
    detectRetina: true,
    interactivity: { events: { resize: true } },
    emitters: {
      direction: "top",
      position: { x: 50, y: 150 },
      rate: { delay: 0.2, quantity: 2 },
      size: { width: 100, height: 0 },
    },
  }), []);

  return init ? <Particles id="tsparticles-main" options={options} /> : null;
};

export default memo(ParticlesBackgroundMain);
