import type { CRDTOperation } from "./crdt";

export function transformOperation(op: CRDTOperation, operationLog: CRDTOperation[]): CRDTOperation {
  const concurrentOps = operationLog.filter(
    existing =>
      existing.userId !== op.userId &&
      Math.abs(existing.timestamp - op.timestamp) < 5000
  );

  let transformed = { ...op };

  for (const concurrent of concurrentOps) {
    transformed = transformAgainst(transformed, concurrent);
  }

  return transformed;
}

export function transformAgainst(op: CRDTOperation, against: CRDTOperation): CRDTOperation {
  if (op.blockId !== against.blockId) {
    if (op.type === 'insert_block' && against.type === 'insert_block') {
      if (op.afterId === against.afterId) {
        if (against.timestamp < op.timestamp) {
          return { ...op, afterId: against.blockId };
        }
      }
    }
    return op;
  }

  switch (op.type) {
    case 'update_block':
      if (against.type === 'update_block') {
        return {
          ...op,
          updates: { ...against.updates, ...op.updates },
        };
      }
      if (against.type === 'delete_block') {
        return { ...op, type: 'noop' as import('@obnofi/types/core').OperationType };
      }
      break;

    case 'delete_block':
      if (against.type === 'delete_block') {
        return { ...op, type: 'noop' as import('@obnofi/types/core').OperationType };
      }
      break;
  }

  return op;
}
