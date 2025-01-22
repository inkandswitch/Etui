import React, { useEffect, useRef } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import type { AutomergeUrl } from "@automerge/automerge-repo";

import type { Doc } from "./datatype";

// We'll need to adapt these imports to work with React
import { setupEtui } from "./main";

export function Tool({ docUrl }: { docUrl: AutomergeUrl }) {
  console.log("docUrl", docUrl);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [doc, changeDoc] = useDocument<Doc>(docUrl);

  useEffect(() => {
    if (!canvasRef.current || !doc) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    // Initialize etui with our canvas
    console.log(canvas)
    const etui = setupEtui(canvas);

    // Set up stroke handler to save to Automerge
    etui.onStrokeComplete = (stroke: Doc["strokes"][0]) => {
      changeDoc((doc: Doc) => {
        doc.strokes.push(stroke);
      });
    };

    // Set up camera handler
    etui.onCameraChange = (camera: Doc["camera"]) => {
      changeDoc((doc: Doc) => {
        doc.camera = camera;
      });
    };

    // Load existing strokes
    doc.strokes.forEach((stroke: Doc["strokes"][0]) => {
      etui.addStroke(stroke);
    });

    // Set initial camera position
    etui.setCamera(doc.camera);

    return () => {
      window.removeEventListener("resize", updateSize);
      etui.cleanup?.();
    };
  }, [canvasRef.current, doc]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
      />
    </div>
  );
}
