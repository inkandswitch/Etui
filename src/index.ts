import {
  makeTool,
  type DataTypeDescription,
  type ToolDescription,
} from "@patchwork/sdk";

import type { Doc } from "./datatype";

export const dataType: DataTypeDescription<Doc> = {
  type: "patchwork:dataType",
  id: "etui",
  name: "Etui",
  icon: "Pencil",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "etui",
    name: "Etui Drawing",
    icon: "Pencil",
    supportedDataTypes: ["etui"],
    async load() {
      const { Tool } = await import("./tool");
      return makeTool({ EditorComponent: Tool });
    },
  },
];
