'use strict';
// Level 7: same controls as L3/L5, with a faster bird and denser hazards.
const HUNT_MODEL=Object.freeze({
 id:'rebound-hunt-l7-v1',intendedLevels:Object.freeze([7]),
 width:600,radius:14,paddleWidth:126,birdSpeed:322,paddleResponse:34,
 powers:Object.freeze({coffee:Object.freeze({energy:30}),rustico:Object.freeze({shield:8}),pasticciotto:Object.freeze({energy:20,slow:7})}),
 bonus:Object.freeze({initial:1.4,interval:4.0,jitter:2.7,life:4,max:3}),
 enemy:Object.freeze({initial:.75,interval:3.8,jitter:2.1,life:16,max:4})
});
