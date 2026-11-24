import { onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';
import { requireFirestore } from '@/config/firebase';
import type { ActivityLog } from '@/domain/entities';
import type { ActivityPort } from '@/domain/ports';
import { watchMapper } from './mapper';
import { paths } from './paths';

export class FirebaseActivityRepository implements ActivityPort {
  watchGroupActivity(groupId: string, next: (items: ActivityLog[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(
      query(paths.activity(db), where('groupId', '==', groupId)),
      watchMapper<ActivityLog>(next),
      error,
    );
  }

  watchAccountActivity(accountId: string, next: (items: ActivityLog[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(
      query(paths.activity(db), where('accountId', '==', accountId)),
      watchMapper<ActivityLog>(next),
      error,
    );
  }
}
