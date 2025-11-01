function r(s=""){const e=String(s??"");if(!e)return"/";const t=e.startsWith("/")?e.slice(1):e;return`${"/".endsWith("/")?"/":"//"}${t}`}export{r as w};
