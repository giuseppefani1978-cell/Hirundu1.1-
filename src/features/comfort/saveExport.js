import { DURABLE_PROGRESS_KEY, syncDurableProgress, getProgressSaveResult, restoreDurableProgressSnapshot } from '../../progressStorage.js';
export function prepareSaveExport(){
 syncDurableProgress();if(!getProgressSaveResult()?.ok)throw Error('Save failed');
 const raw=localStorage.getItem(DURABLE_PROGRESS_KEY);const data=JSON.parse(raw||'null');
 if(data?.version!==1||!data.values||typeof data.values!=='object')throw Error('Missing save');
 return JSON.stringify({format:'hirundu-local-backup',version:1,exportedAt:new Date().toISOString(),snapshot:data},null,2);
}

export function parseSaveImport(raw){
 const backup=JSON.parse(raw);
 if(backup?.format!=='hirundu-local-backup'||backup?.version!==1||backup?.snapshot?.version!==1||!backup.snapshot.values||typeof backup.snapshot.values!=='object'||Array.isArray(backup.snapshot.values))throw Error('Invalid save');
 if(Object.values(backup.snapshot.values).some(value=>typeof value!=='string'))throw Error('Invalid values');
 return backup.snapshot;
}

export function restoreSaveImport(raw){
 const snapshot=parseSaveImport(raw);
 const restored=restoreDurableProgressSnapshot(snapshot);
 if(!restored)throw Error('Restore failed');
 return restored;
}
