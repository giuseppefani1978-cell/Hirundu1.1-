'use strict';
// Level 5: same rebound system as L3, with a slightly quicker flight.
// The third wall row is defined in game.js to raise difficulty without changing controls.
const HUNT_MODEL=Object.freeze({
 id:'rebound-hunt-l5-v1',intendedLevels:Object.freeze([5]),
 width:600,radius:14,paddleWidth:132,birdSpeed:307,paddleResponse:32,
 powers:Object.freeze({coffee:Object.freeze({energy:30}),rustico:Object.freeze({shield:8}),pasticciotto:Object.freeze({energy:20,slow:7})}),
 bonus:Object.freeze({initial:1.5,interval:4.2,jitter:3,life:4,max:3}),
 enemy:Object.freeze({initial:.9,interval:4.5,jitter:2.4,life:16,max:3})
});
