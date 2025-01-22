import { initFrom, DataTypeImplementation } from "@patchwork/sdk";

// The document structure that will store etui's state
export interface Doc {
  title: string;
  strokes: Array<{
    points: Array<[number, number]>;
    color: string;
    width: number;
  }>;
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Initial state for a new document
const initialState: Doc = {
  title: "Etui Sketch",
  strokes: [],
  camera: {
    x: 0,
    y: 0,
    zoom: 1,
  },
};

export const markCopy = (doc: Doc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: Doc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: Doc) => {
  return doc.title || "Conversation";
};

export const init = (doc: Doc) => {
  initFrom(doc, initialState);
};

export const dataType: DataTypeImplementation<Doc, unknown> = {
  init,
  getTitle,
  setTitle,
  markCopy,
};
