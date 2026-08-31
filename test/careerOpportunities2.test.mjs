import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareerOpportunityState, discoverCareerOpportunities, evaluateOpportunity, decideCareerOpportunity, expireCareerOpportunities, aiChooseOpportunity, careerOpportunitySummary } from '../src/systems/careerOpportunities2.js';

const base=(patch={})=>({week:8,seasonNumber:1,rider:{age:15,klass:'250',injury:null},family:{money:7000,support_level:2},form:76,reputation:70,professionalism:78,visibility:62,support:55,relationship:65,readiness:76,development:68,region:'home',momentum:72,...patch});

test('market discovers distinct contextual opportunities without arbitrary levels',()=>{const s=discoverCareerOpportunities(createCareerOpportunityState(),base());const types=new Set(s.active.map(x=>x.type));for(const type of ['team-seat','manufacturer','training','media','mobility','class-move'])assert.ok(types.has(type));assert.ok(s.active.every(x=>x.eligibility.eligible));});

test('offers expose upside obligations risk family impact expiration and source',()=>{const s=discoverCareerOpportunities({},base());const team=s.active.find(x=>x.type==='team-seat');assert.ok(team.value>0);assert.ok(team.obligations.length);assert.ok(team.expiresWeek>8);assert.ok(team.source);assert.ok(team.familyImpact);});

test('guardian approval is required for youth acceptance',()=>{const s=discoverCareerOpportunities({},base());const team=s.active.find(x=>x.type==='team-seat');assert.equal(decideCareerOpportunity(s,team.id,'accept',base()).error,'guardian-approval-required');const accepted=decideCareerOpportunity(s,team.id,'accept',{...base(),guardianApproved:true});assert.equal(accepted.opportunity.status,'accepted');assert.equal(accepted.state.team.title,team.title);});

test('counter and decline persist as real history',()=>{let s=discoverCareerOpportunities({},base({rider:{age:19,klass:'250'}}));let media=s.active.find(x=>x.type==='media');let r=decideCareerOpportunity(s,media.id,'counter',{...base(),rider:{age:19},counterTerms:{visibilityGain:14}});assert.equal(r.opportunity.status,'countered');assert.equal(r.state.history.length,1);s=r.state;const training=s.active.find(x=>x.type==='training');r=decideCareerOpportunity(s,training.id,'decline',base({rider:{age:19}}));assert.equal(r.opportunity.status,'declined');assert.equal(r.state.history.length,2);});

test('manufacturer support is distinct and changes actual support terms',()=>{const s=discoverCareerOpportunities({},base({rider:{age:20,klass:'250'}}));const m=s.active.find(x=>x.type==='manufacturer');const r=decideCareerOpportunity(s,m.id,'accept',base({rider:{age:20}}));assert.equal(r.state.manufacturer.terms.bikeDiscount,35);assert.ok(r.state.manufacturer.terms.partsCredit>=1000);});

test('fill-in opportunities are temporary and can become breakthrough windows',()=>{const s=discoverCareerOpportunities({},base({rosterGap:true}));const fill=s.active.find(x=>x.type==='fill-in');assert.ok(fill);assert.equal(fill.terms.temporary,true);assert.equal(fill.expiresWeek,9);});

test('selective contract scope supports focused schedules',()=>{const s=discoverCareerOpportunities({},base({contractFocus:'motocross',rounds:[1,2,4]}));const o=s.active.find(x=>x.type==='contract-scope');assert.deepEqual(o.scope.rounds,[1,2,4]);const r=decideCareerOpportunity(s,o.id,'accept',{...base(),guardianApproved:true});assert.equal(r.state.contract.scope.series,'motocross');});

test('class move is strategic and records opportunity cost',()=>{const s=discoverCareerOpportunities({},base());const move=s.active.find(x=>x.type==='class-move');assert.ok(move.opportunityCost.includes('current-class championship'));assert.equal(move.terms.newBikeRequired,true);});

test('evaluation sees affordability and family review separately',()=>{const s=discoverCareerOpportunities({},base({family:{money:100,support_level:1}}));const camp=s.active.find(x=>x.type==='training');const e=evaluateOpportunity(s,camp.id,base({family:{money:100,support_level:1}}));assert.equal(e.affordable,false);assert.equal(e.recommendation,'decline-or-negotiate');});

test('expiration and duplicate suppression keep history stable',()=>{let s=discoverCareerOpportunities({},base());const count=s.active.length;s=discoverCareerOpportunities(s,base());assert.equal(s.active.length,count);s=expireCareerOpportunities(s,20);assert.equal(s.active.length,0);assert.ok(s.history.every(x=>x.status==='expired'));});

test('AI uses same offer terms but different priorities can change decision',()=>{const s=discoverCareerOpportunities({},base({rosterGap:true}));const fill=s.active.find(x=>x.type==='fill-in');assert.equal(aiChooseOpportunity(fill,{ambition:90,stability:20,money:5000}),'accept');assert.notEqual(aiChooseOpportunity(fill,{ambition:20,stability:90,money:200}),'accept');});

test('summary exposes current commitments and visible decision history',()=>{let s=discoverCareerOpportunities({},base({rider:{age:20,klass:'250'}}));const team=s.active.find(x=>x.type==='team-seat');s=decideCareerOpportunity(s,team.id,'accept',base({rider:{age:20}})).state;const summary=careerOpportunitySummary(s);assert.equal(summary.accepted,1);assert.ok(summary.currentTeam);});
