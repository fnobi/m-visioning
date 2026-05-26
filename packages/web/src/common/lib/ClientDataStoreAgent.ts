import {
  collection,
  doc,
  limit,
  onSnapshot,
  getDocs,
  orderBy,
  query,
  where,
  setDoc,
  getDoc,
  deleteDoc,
  type QueryConstraint,
  collectionGroup,
  type DocumentData,
  type Query,
  type DocumentReference,
  runTransaction,
  getCountFromServer
} from "firebase/firestore";
import {
  DataStoreAgent,
  QueryChain,
  type DocumentSnapshotMock,
  type DataStoreItemBase,
  type TransactionGetStepParams,
  type TransactionSetStepParams
} from "~/common/lib/DataStoreAgent";
import { firebaseFirestore } from "~/common/lib/firebase-app";

const applyQueryChain = <T>(
  q: Query<DocumentData, DocumentData>,
  queryChain?: (c: QueryChain<T>) => unknown
) => {
  const qs: QueryConstraint[] = [];
  if (queryChain) {
    queryChain(
      new QueryChain<T>({
        where: (k, op, v) => qs.push(where(k, op, v)),
        orderBy: (k, d) => qs.push(orderBy(k, d)),
        limit: n => qs.push(limit(n))
      })
    );
  }
  return qs.length ? query(q, ...qs) : q;
};

// eslint-disable-next-line import/prefer-default-export
export class ClientDataStoreAgent<
  T extends DataStoreItemBase,
  D extends {},
  C extends {}
> extends DataStoreAgent<T, D, C, DocumentReference, Query> {
  // eslint-disable-next-line class-methods-use-this
  protected collectionReference({
    collectionPath
  }: {
    collectionPath: string;
  }) {
    return collection(firebaseFirestore(), collectionPath);
  }

  protected collectionGroupReference() {
    return collectionGroup(firebaseFirestore(), this.scheme.name);
  }

  protected documentReference({
    collectionPath,
    id
  }: {
    collectionPath: string;
    id?: string;
  }) {
    const collectionRef = this.collectionReference({ collectionPath });
    return id ? doc(collectionRef, id) : doc(collectionRef);
  }

  protected override newDocId(opts: { collectionPath: string }) {
    const documentRef = this.documentReference(opts);
    return documentRef.id;
  }

  // eslint-disable-next-line class-methods-use-this
  protected override async setDoc(
    r: DocumentReference,
    {
      data,
      merge
    }: {
      data: DataStoreItemBase;
      merge?: boolean;
    }
  ) {
    await setDoc(r, data, { merge });
    return r.id;
  }

  // eslint-disable-next-line class-methods-use-this
  protected getDoc(r: DocumentReference) {
    return getDoc(r);
  }

  // eslint-disable-next-line class-methods-use-this
  protected async deleteDoc(r: DocumentReference) {
    await deleteDoc(r);
  }

  // eslint-disable-next-line class-methods-use-this
  protected async getQueryDocs(
    r: Query,
    {
      queryChain
    }: {
      queryChain?: (c: QueryChain<T>) => unknown;
    }
  ) {
    const snapshot = await getDocs(applyQueryChain(r, queryChain));
    return snapshot.docs;
  }

  // eslint-disable-next-line class-methods-use-this
  protected async getQueryCount(
    r: Query,
    {
      queryChain
    }: {
      queryChain?: (c: QueryChain<T>) => unknown;
    }
  ) {
    const snapshot = await getCountFromServer(applyQueryChain(r, queryChain));
    return snapshot.data().count;
  }

  // eslint-disable-next-line class-methods-use-this
  protected subscribeDoc(
    r: DocumentReference,
    opts: {
      handler: (d: Object | null) => void;
      onError: (e: unknown) => void;
    }
  ) {
    const { handler, onError } = opts;
    return onSnapshot(r, handler, onError);
  }

  // eslint-disable-next-line class-methods-use-this
  protected subscribeQueryDocs(
    r: Query,
    opts: {
      queryChain?: ((c: QueryChain<T>) => unknown) | undefined;
      handler: (l: DocumentSnapshotMock[]) => void;
      onError: (e: unknown) => void;
    }
  ) {
    const { queryChain, handler, onError } = opts;
    const collectionQuery = applyQueryChain(r, queryChain);
    return onSnapshot(
      collectionQuery,
      snapshot => handler(snapshot.docs),
      onError
    );
  }

  public static runTransaction<M>(
    getStep: (
      o: TransactionGetStepParams<DocumentReference, Query>
    ) => Promise<M>,
    setStep: (
      p: M,
      m: TransactionSetStepParams<DocumentReference, Query>
    ) => void
  ) {
    return runTransaction(firebaseFirestore(), async t => {
      const r = await getStep({
        get: async (s, o) =>
          s.parseDocumentSnapshot(await t.get(s.singleItemReference(o)))
      });
      return setStep(r, {
        set: (s, args) =>
          t.set(s.singleItemReference(args), args.data, { merge: args.merge }),
        delete: (s, args) => t.delete(s.singleItemReference(args))
      });
    });
  }
}
