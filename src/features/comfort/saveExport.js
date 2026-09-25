import { DURABLE_PROGRESS_KEY, syncDurableProgress, getProgressSaveResult } from '../../progressStorage.js';
export function prepareSaveExport(){
 syncDurableProgress();if(!getProgressSaveResult()?.ok)throw Error('Save failed');
 const raw=localStorage.getItem(DURABLE_PROGRESS_KEY);const data=JSON.parse(raw||'null');
 if(data?.version!==1||!data.values||typeof data.values!=='object')throw Error('Missing save');
 return JSON.stringify({format:'hirundu-local-backup',version:1,exportedAt:new Date().toISOString(),snapshot:data},null,2);
}
