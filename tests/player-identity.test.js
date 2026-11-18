import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNickname,setPlayerNickname,doctorName,doctorText,doctorSpeaker} from '../src/player-identity.js';
import {newCampaign,validateCampaign} from '../src/campaign-state.js';
test('nickname validation rejects markup and empty or excessive names',()=>{for(const n of ['', '   ', '<img src=x>', '甲'.repeat(13)])assert.throws(()=>normalizeNickname(n));assert.equal(normalizeNickname('  小宝  '),'小宝');assert.equal(normalizeNickname('Ａlex_2'),'Alex_2');});
test('player titles replace only the protagonist and preserve other doctors',()=>{setPlayerNickname('小宝');assert.equal(doctorName(),'小宝医生');assert.equal(doctorText('陈医生？医生，您好。谢谢医生。另一名医生接手。'),'小宝医生？小宝医生，您好。谢谢小宝医生。另一名医生接手。');assert.equal(doctorSpeaker('医生'),'小宝医生');assert.equal(doctorSpeaker('陈医生 · 心理活动'),'小宝医生 · 心理活动');assert.equal(doctorSpeaker('林先生'),'林先生');});
test('nickname survives save validation, while legacy progress remains compatible',()=>{setPlayerNickname('小宝');const save=newCampaign();save.route='T08';save.line=2;assert.equal(validateCampaign(save).playerNickname,'小宝');const old=structuredClone(save);delete old.playerNickname;assert.equal(validateCampaign(old).route,'T08');assert.equal(validateCampaign(old).line,2);assert.throws(()=>validateCampaign({...save,playerNickname:'<script>'}));});
