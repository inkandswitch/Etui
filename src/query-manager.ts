import Render from "./render";
import Query from "./query";

export default class QueryManager {
  queries: Map<number, Query> = new Map();
  ids: number = 0;

  constructor() {
    this.queries = new Map();
  }

  addQuery(s: Query): number {
    let id = this.ids++;
    this.queries.set(id, s);
    return id;
  }

  removeQuery(id: number) {
    this.queries.delete(id);
  }

  getQuery(id: number): Query {
    return this.queries.get(id)!;
  }

  render(r: Render) {
    this.queries.forEach((s) => {
      s.render(r);
    });
  }
}
