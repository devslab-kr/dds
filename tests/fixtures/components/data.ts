export const items=Array.from({length:10000},(_,index)=>({value:`item-${index}`,label:`Option ${String(index).padStart(5,'0')}`}));
export const externalItems=[{value:'new',label:'New result'}];
export const retainedOption={value:'saved',label:'Saved selection'};
