/* eslint-disable max-classes-per-file */

import { compact } from "@m-visioning/core/util/array-util";

type WhereFilterOp =
  | "<"
  | "<="
  | "=="
  | "!="
  | ">="
  | ">"
  | "array-contains"
  | "in"
  | "array-contains-any"
  | "not-in";

type OrderByDirection = "asc" | "desc";

export type DataStoreItemBase = Record<string, unknown>;

export type DocumentSnapshotMock = {
  id: string;
  ref: { path: string };
  data: () => DataStoreItemBase | undefined;
};

export type TypedCollectionList<T> = { id: string; data: T }[];

type TypedCollectionGroupList<T> = {
  fullPath: string;
  ids: string[];
  data: T;
}[];

export type DataStoreScheme<T, D, C = {}> = {
  name: string;
  parse: (src: unknown) => T;
  documentId: (m: D) => string;
  parentCollection?: DataStoreScheme<unknown, C, {}>;
};

interface QueryBuilder {
  where: (k: string, op: WhereFilterOp, v: unknown) => void;
  orderBy: (k: string, d: OrderByDirection) => void;
  limit: (n: number) => void;
}

const collectionPathFromParent = <T, D extends {}, C extends {}>(
  s: DataStoreScheme<T, D, C>,
  o: D & C
): string[] => [
  ...(s.parentCollection
    ? collectionPathFromParent(s.parentCollection, o)
    : []),
  s.name,
  s.documentId(o)
];

const calcCollectionPath = <D, C extends {}>(
  s: DataStoreScheme<unknown, D, C>,
  m: C
) =>
  [
    ...(s.parentCollection
      ? collectionPathFromParent(s.parentCollection, m)
      : []),
    s.name
  ].join("/");

export class QueryChain<T> {
  private builder: QueryBuilder;

  public constructor(b: QueryBuilder) {
    this.builder = b;
  }

  public where<K extends keyof T>(k: K, op: WhereFilterOp, v: unknown) {
    this.builder.where(String(k), op, v);
    return this;
  }

  public equal<K extends keyof T>(k: K, v: T[K]) {
    return this.where(k, "==", v);
  }

  public orderBy<K extends keyof T>(k: K, d: OrderByDirection) {
    this.builder.orderBy(String(k), d);
    return this;
  }

  public limit(n: number) {
    this.builder.limit(n);
    return this;
  }
}

export abstract class DataStoreAgent<
  T extends DataStoreItemBase,
  D,
  C extends {},
  Dr,
  Cr
> {
  public readonly scheme: DataStoreScheme<T, D, C>;

  public constructor(scheme: DataStoreScheme<T, D, C>) {
    this.scheme = scheme;
  }

  private calcCollectionParam(opts: C) {
    return {
      collectionPath: calcCollectionPath(this.scheme, opts)
    };
  }

  private calcDocParam(opts: C & D) {
    return {
      ...this.calcCollectionParam(opts),
      id: this.scheme.documentId(opts)
    };
  }

  public parseDocumentSnapshot(snapshot: DocumentSnapshotMock) {
    const d = snapshot.data();
    return d ? this.scheme.parse(d) : null;
  }

  protected parseCollectionSnapshot(
    docs: DocumentSnapshotMock[]
  ): TypedCollectionList<T> {
    return compact(
      docs.map(d => {
        const data = this.parseDocumentSnapshot(d);
        return data
          ? {
              id: d.id,
              data
            }
          : null;
      })
    );
  }

  protected parseCollectionGroupSnapshot(
    docs: DocumentSnapshotMock[]
  ): TypedCollectionGroupList<T> {
    return compact(
      docs.map(d => {
        const data = this.parseDocumentSnapshot(d);
        return data
          ? {
              fullPath: d.ref.path,
              ids: d.ref.path
                .split(/\//g)
                .reduce<string[]>(
                  (prev, curr, i) => (i % 2 === 0 ? prev : [...prev, curr]),
                  []
                ),
              data
            }
          : null;
      })
    );
  }

  protected abstract collectionReference(args: { collectionPath: string }): Cr;

  protected abstract collectionGroupReference(): Cr;

  protected abstract documentReference(args: {
    collectionPath: string;
    id?: string;
  }): Dr;

  protected abstract newDocId(args: { collectionPath: string }): string;

  protected abstract setDoc(
    r: Dr,
    args: {
      data: DataStoreItemBase;
      merge?: boolean;
    }
  ): Promise<string>;

  protected abstract getDoc(r: Dr): Promise<DocumentSnapshotMock>;

  protected abstract deleteDoc(r: Dr): Promise<void>;

  protected abstract getQueryDocs(
    r: Cr,
    args: {
      queryChain?: (c: QueryChain<T>) => unknown;
    }
  ): Promise<DocumentSnapshotMock[]>;

  protected abstract getQueryCount(
    r: Cr,
    args: {
      queryChain?: (c: QueryChain<T>) => unknown;
    }
  ): Promise<number>;

  protected abstract subscribeDoc(
    r: Dr,
    args: {
      handler: (d: DocumentSnapshotMock) => void;
      onError: (e: unknown) => void;
    }
  ): () => void;

  protected abstract subscribeQueryDocs(
    r: Cr,
    args: {
      queryChain?: (c: QueryChain<T>) => unknown;
      handler: (l: DocumentSnapshotMock[]) => void;
      onError: (e: unknown) => void;
    }
  ): () => void;

  public newItemId(opts: C) {
    return this.newDocId({
      collectionPath: calcCollectionPath(this.scheme, opts)
    });
  }

  public singleItemReference(opts: C & D): Dr {
    return this.documentReference(this.calcDocParam(opts));
  }

  private singleNewItemReference(opts: C): Dr {
    return this.documentReference(this.calcCollectionParam(opts));
  }

  private itemListReference(opts: C): Cr {
    return this.collectionReference(this.calcCollectionParam(opts));
  }

  public async fetchItem(opts: C & D): Promise<T | null> {
    return this.parseDocumentSnapshot(
      await this.getDoc(this.singleItemReference(opts))
    );
  }

  public setItem(
    opts: C &
      D & {
        data: T;
        merge?: boolean;
      }
  ) {
    const { data, merge } = opts;
    return this.setDoc(this.singleItemReference(opts), {
      data,
      merge
    }).then(() => data);
  }

  public addItem(opts: C & { data: T }) {
    const { data } = opts;
    return this.setDoc(this.singleNewItemReference(opts), {
      data
    });
  }

  public mergeItem(
    opts: C &
      D & {
        data: Partial<T>;
      }
  ) {
    const { data } = opts;
    return this.setDoc(this.singleItemReference(opts), {
      data,
      merge: true
    });
  }

  public deleteItem(opts: C & D) {
    return this.deleteDoc(this.singleItemReference(opts));
  }

  public subscribeItem(
    opts: C &
      D & {
        handler: (d: T | null) => void;
        onError: (e: unknown) => void;
      }
  ) {
    const { handler, onError } = opts;
    return this.subscribeDoc(this.singleItemReference(opts), {
      handler: snapshot => handler(this.parseDocumentSnapshot(snapshot)),
      onError
    });
  }

  public async fetchList(
    opts: C & {
      queryChain?: (c: QueryChain<T>) => unknown;
    }
  ) {
    const { queryChain } = opts;
    const docs = await this.getQueryDocs(this.itemListReference(opts), {
      queryChain
    });
    return this.parseCollectionSnapshot(docs);
  }

  public async fetchListCount(
    opts: C & {
      queryChain?: (c: QueryChain<T>) => unknown;
    }
  ) {
    const { queryChain } = opts;
    const count = await this.getQueryCount(this.itemListReference(opts), {
      queryChain
    });
    return count;
  }

  public async fetchGroupList(queryChain?: (c: QueryChain<T>) => unknown) {
    const docs = await this.getQueryDocs(this.collectionGroupReference(), {
      queryChain
    });
    return this.parseCollectionGroupSnapshot(docs);
  }

  public async fetchGroupListCount(queryChain?: (c: QueryChain<T>) => unknown) {
    const count = await this.getQueryCount(this.collectionGroupReference(), {
      queryChain
    });
    return count;
  }

  public subscribeList(
    opts: C & {
      queryChain?: (c: QueryChain<T>) => unknown;
      handler: (l: TypedCollectionList<T>) => void;
      onError: (e: unknown) => void;
    }
  ) {
    const { queryChain, handler, onError } = opts;
    return this.subscribeQueryDocs(this.itemListReference(opts), {
      queryChain,
      handler: docs => handler(this.parseCollectionSnapshot(docs)),
      onError
    });
  }

  public subscribeGroupList({
    queryChain,
    handler,
    onError
  }: {
    queryChain?: (c: QueryChain<T>) => unknown;
    handler: (l: { fullPath: string; ids: string[]; data: T }[]) => void;
    onError: (e: unknown) => void;
  }) {
    return this.subscribeQueryDocs(this.collectionGroupReference(), {
      queryChain,
      handler: docs => handler(this.parseCollectionGroupSnapshot(docs)),
      onError
    });
  }
}

export interface TransactionGetStepParams<Dr, Cr> {
  get: <T extends DataStoreItemBase, D extends {}, C extends {}>(
    s: DataStoreAgent<T, D, C, Dr, Cr>,
    o: D & C
  ) => Promise<T | null>;
}

export interface TransactionSetStepParams<Dr, Cr> {
  set: <T extends DataStoreItemBase, D extends {}, C extends {}>(
    s: DataStoreAgent<T, D, C, Dr, Cr>,
    args: Parameters<DataStoreAgent<T, D, C, Dr, Cr>["setItem"]>[0]
  ) => void;
  delete: <T extends DataStoreItemBase, D extends {}, C extends {}>(
    s: DataStoreAgent<T, D, C, Dr, Cr>,
    args: Parameters<DataStoreAgent<T, D, C, Dr, Cr>["deleteItem"]>[0]
  ) => void;
}
