'use strict';
// Shared rebound-hunt baseline for levels 3, 5 and 7.
// Each level supplies its own map, POIs, translated clues and battle handoff.
const HUNT_MODEL=Object.freeze({
 id:'rebound-hunt-v1',intendedLevels:Object.freeze([3,5,7]),
 width:600,radius:14,paddleWidth:132,birdSpeed:297.5,paddleResponse:32,
 powers:Object.freeze({coffee:Object.freeze({energy:30}),rustico:Object.freeze({shield:8}),pasticciotto:Object.freeze({energy:20,slow:7})}),
 bonus:Object.freeze({initial:1.5,interval:4.2,jitter:3,life:4,max:3}),
 enemy:Object.freeze({initial:.9,interval:4.8,jitter:2.6,life:16,max:3})
});
