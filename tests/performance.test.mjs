import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameMetrics,easePosition} from '../dist/js/performance.js';

test('FPS reflects measured frame intervals and never starts with a fabricated result',()=>{const m=new FrameMetrics();assert.equal(m.summary().fps,0);for(let i=0;i<121;i++)m.record(i*(1000/120),.25);assert.equal(m.summary().fps,120);assert.equal(m.summary().draw,.25);assert.ok(m.summary().p95<8.5);});
test('frame metrics count stalls, bound retained samples and reset after backgrounding',()=>{const m=new FrameMetrics();for(let i=0;i<200;i++)m.record(i*20,2);assert.equal(m.summary().fps,50);assert.equal(m.summary().samples,180);m.record(4500,10);assert.ok(m.summary().fps<50);m.reset();assert.equal(m.summary().fps,0);});
test('camera interpolation is frame-rate independent and cannot overshoot its destination',()=>{let at60=0,at120=0;for(let i=0;i<60;i++)at60=easePosition(at60,10,1/60);for(let i=0;i<120;i++)at120=easePosition(at120,10,1/120);assert.ok(Math.abs(at60-at120)<1e-8);assert.ok(at60<=10&&at60>9.99);assert.equal(easePosition(0,10,0),0);});
