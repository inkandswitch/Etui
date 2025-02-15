import { MouseData } from "input";
import QueryManager from "query-manager";
import { Tool } from "./tool-manager";
import Query from "query";

export default class QueryTool implements Tool {
  querymanager: QueryManager;
  query: Query | null = null;

  active: boolean = false;

  constructor(querymanager: QueryManager) {
    this.querymanager = querymanager;
  }

  onMouseDown(p: MouseData): void {
    this.query = new Query(p.world, p.world);
    this.querymanager.addQuery(this.query);
  }

  onMouseDrag(p: MouseData): void {
    if (this.query) {
      this.query.updateBottomRight(p.world);
    }
  }
}
