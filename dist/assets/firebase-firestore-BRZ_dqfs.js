import{_ as Ji,r as wr,a as Xi,g as Zi,b as to,S as eo}from"./firebase-core-h1zRlpyh.js";import{L as no,I as Ct,C as ro,F as so,c as ht,e as io,f as Rs,p as oo,u as ao,d as uo,h as co,j as et,k as lo,l as ho,M as fo,X as mo,m as _o,n as gn,o as po,q as go,W as Pe,r as yo,S as vr}from"./firebase-shared-DXlCRIsH.js";const Rr="@firebase/firestore",Vr="4.8.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class K{constructor(t){this.uid=t}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}K.UNAUTHENTICATED=new K(null),K.GOOGLE_CREDENTIALS=new K("google-credentials-uid"),K.FIRST_PARTY=new K("first-party-uid"),K.MOCK_USER=new K("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Kt="11.10.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dt=new no("@firebase/firestore");function Ot(){return Dt.logLevel}function g(r,...t){if(Dt.logLevel<=ht.DEBUG){const e=t.map(Mn);Dt.debug(`Firestore (${Kt}): ${r}`,...e)}}function dt(r,...t){if(Dt.logLevel<=ht.ERROR){const e=t.map(Mn);Dt.error(`Firestore (${Kt}): ${r}`,...e)}}function yt(r,...t){if(Dt.logLevel<=ht.WARN){const e=t.map(Mn);Dt.warn(`Firestore (${Kt}): ${r}`,...e)}}function Mn(r){if(typeof r=="string")return r;try{/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/return(function(e){return JSON.stringify(e)})(r)}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function E(r,t,e){let n="Unexpected state";typeof t=="string"?n=t:e=t,Vs(r,n,e)}function Vs(r,t,e){let n=`FIRESTORE (${Kt}) INTERNAL ASSERTION FAILED: ${t} (ID: ${r.toString(16)})`;if(e!==void 0)try{n+=" CONTEXT: "+JSON.stringify(e)}catch{n+=" CONTEXT: "+e}throw dt(n),new Error(n)}function S(r,t,e,n){let s="Unexpected state";typeof e=="string"?s=e:n=e,r||Vs(t,s,n)}function w(r,t){return r}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const f={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class p extends so{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class it{constructor(){this.promise=new Promise(((t,e)=>{this.resolve=t,this.reject=e}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ps{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`)}}class Eo{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable((()=>e(K.UNAUTHENTICATED)))}shutdown(){}}class To{constructor(t){this.token=t,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(t,e){this.changeListener=e,t.enqueueRetryable((()=>e(this.token.user)))}shutdown(){this.changeListener=null}}class Io{constructor(t){this.t=t,this.currentUser=K.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(t,e){S(this.o===void 0,42304);let n=this.i;const s=u=>this.i!==n?(n=this.i,e(u)):Promise.resolve();let i=new it;this.o=()=>{this.i++,this.currentUser=this.u(),i.resolve(),i=new it,t.enqueueRetryable((()=>s(this.currentUser)))};const o=()=>{const u=i;t.enqueueRetryable((async()=>{await u.promise,await s(this.currentUser)}))},a=u=>{g("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=u,this.o&&(this.auth.addAuthTokenListener(this.o),o())};this.t.onInit((u=>a(u))),setTimeout((()=>{if(!this.auth){const u=this.t.getImmediate({optional:!0});u?a(u):(g("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new it)}}),0),o()}getToken(){const t=this.i,e=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(e).then((n=>this.i!==t?(g("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(S(typeof n.accessToken=="string",31837,{l:n}),new Ps(n.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const t=this.auth&&this.auth.getUid();return S(t===null||typeof t=="string",2055,{h:t}),new K(t)}}class Ao{constructor(t,e,n){this.P=t,this.T=e,this.I=n,this.type="FirstParty",this.user=K.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const t=this.R();return t&&this.A.set("Authorization",t),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class wo{constructor(t,e,n){this.P=t,this.T=e,this.I=n}getToken(){return Promise.resolve(new Ao(this.P,this.T,this.I))}start(t,e){t.enqueueRetryable((()=>e(K.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class Pr{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class vo{constructor(t,e){this.V=e,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,Xi(t)&&t.settings.appCheckToken&&(this.p=t.settings.appCheckToken)}start(t,e){S(this.o===void 0,3512);const n=i=>{i.error!=null&&g("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const o=i.token!==this.m;return this.m=i.token,g("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?e(i.token):Promise.resolve()};this.o=i=>{t.enqueueRetryable((()=>n(i)))};const s=i=>{g("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((i=>s(i))),setTimeout((()=>{if(!this.appCheck){const i=this.V.getImmediate({optional:!0});i?s(i):g("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new Pr(this.p));const t=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(t).then((e=>e?(S(typeof e.token=="string",44558,{tokenResult:e}),this.m=e.token,new Pr(e.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ro(r){const t=typeof self<"u"&&(self.crypto||self.msCrypto),e=new Uint8Array(r);if(t&&typeof t.getRandomValues=="function")t.getRandomValues(e);else for(let n=0;n<r;n++)e[n]=Math.floor(256*Math.random());return e}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ss(){return new TextEncoder}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ln{static newId(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",e=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const s=Ro(40);for(let i=0;i<s.length;++i)n.length<20&&s[i]<e&&(n+=t.charAt(s[i]%62))}return n}}function R(r,t){return r<t?-1:r>t?1:0}function In(r,t){let e=0;for(;e<r.length&&e<t.length;){const n=r.codePointAt(e),s=t.codePointAt(e);if(n!==s){if(n<128&&s<128)return R(n,s);{const i=Ss(),o=Vo(i.encode(Sr(r,e)),i.encode(Sr(t,e)));return o!==0?o:R(n,s)}}e+=n>65535?2:1}return R(r.length,t.length)}function Sr(r,t){return r.codePointAt(t)>65535?r.substring(t,t+2):r.substring(t,t+1)}function Vo(r,t){for(let e=0;e<r.length&&e<t.length;++e)if(r[e]!==t[e])return R(r[e],t[e]);return R(r.length,t.length)}function zt(r,t,e){return r.length===t.length&&r.every(((n,s)=>e(n,t[s])))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cr="__name__";class st{constructor(t,e,n){e===void 0?e=0:e>t.length&&E(637,{offset:e,range:t.length}),n===void 0?n=t.length-e:n>t.length-e&&E(1746,{length:n,range:t.length-e}),this.segments=t,this.offset=e,this.len=n}get length(){return this.len}isEqual(t){return st.comparator(this,t)===0}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof st?t.forEach((n=>{e.push(n)})):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=t===void 0?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return this.length===0}isPrefixOf(t){if(t.length<this.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}isImmediateParentOf(t){if(this.length+1!==t.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}forEach(t){for(let e=this.offset,n=this.limit();e<n;e++)t(this.segments[e])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const n=Math.min(t.length,e.length);for(let s=0;s<n;s++){const i=st.compareSegments(t.get(s),e.get(s));if(i!==0)return i}return R(t.length,e.length)}static compareSegments(t,e){const n=st.isNumericId(t),s=st.isNumericId(e);return n&&!s?-1:!n&&s?1:n&&s?st.extractNumericId(t).compare(st.extractNumericId(e)):In(t,e)}static isNumericId(t){return t.startsWith("__id")&&t.endsWith("__")}static extractNumericId(t){return Ct.fromString(t.substring(4,t.length-2))}}class C extends st{construct(t,e,n){return new C(t,e,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...t){const e=[];for(const n of t){if(n.indexOf("//")>=0)throw new p(f.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);e.push(...n.split("/").filter((s=>s.length>0)))}return new C(e)}static emptyPath(){return new C([])}}const Po=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class j extends st{construct(t,e,n){return new j(t,e,n)}static isValidIdentifier(t){return Po.test(t)}canonicalString(){return this.toArray().map((t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),j.isValidIdentifier(t)||(t="`"+t+"`"),t))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Cr}static keyField(){return new j([Cr])}static fromServerFormat(t){const e=[];let n="",s=0;const i=()=>{if(n.length===0)throw new p(f.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(n),n=""};let o=!1;for(;s<t.length;){const a=t[s];if(a==="\\"){if(s+1===t.length)throw new p(f.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const u=t[s+1];if(u!=="\\"&&u!=="."&&u!=="`")throw new p(f.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);n+=u,s+=2}else a==="`"?(o=!o,s++):a!=="."||o?(n+=a,s++):(i(),s++)}if(i(),o)throw new p(f.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new j(e)}static emptyPath(){return new j([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class y{constructor(t){this.path=t}static fromPath(t){return new y(C.fromString(t))}static fromName(t){return new y(C.fromString(t).popFirst(5))}static empty(){return new y(C.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return t!==null&&C.comparator(this.path,t.path)===0}toString(){return this.path.toString()}static comparator(t,e){return C.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new y(new C(t.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Cs(r,t,e){if(!e)throw new p(f.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${t}.`)}function So(r,t,e,n){if(t===!0&&n===!0)throw new p(f.INVALID_ARGUMENT,`${r} and ${e} cannot be used together.`)}function br(r){if(!y.isDocumentKey(r))throw new p(f.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function Dr(r){if(y.isDocumentKey(r))throw new p(f.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function bs(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function Ye(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const t=(function(n){return n.constructor?n.constructor.name:null})(r);return t?`a custom ${t} object`:"an object"}}return typeof r=="function"?"a function":E(12329,{type:typeof r})}function W(r,t){if("_delegate"in r&&(r=r._delegate),!(r instanceof t)){if(t.name===r.constructor.name)throw new p(f.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const e=Ye(r);throw new p(f.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${e}`)}}return r}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function U(r,t){const e={typeString:r};return t&&(e.value=t),e}function pe(r,t){if(!bs(r))throw new p(f.INVALID_ARGUMENT,"JSON must be an object");let e;for(const n in t)if(t[n]){const s=t[n].typeString,i="value"in t[n]?{value:t[n].value}:void 0;if(!(n in r)){e=`JSON missing required field: '${n}'`;break}const o=r[n];if(s&&typeof o!==s){e=`JSON field '${n}' must be a ${s}.`;break}if(i!==void 0&&o!==i.value){e=`Expected '${n}' field to equal '${i.value}'`;break}}if(e)throw new p(f.INVALID_ARGUMENT,e);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nr=-62135596800,kr=1e6;class b{static now(){return b.fromMillis(Date.now())}static fromDate(t){return b.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),n=Math.floor((t-1e3*e)*kr);return new b(e,n)}constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new p(f.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new p(f.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<Nr)throw new p(f.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new p(f.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/kr}_compareTo(t){return this.seconds===t.seconds?R(this.nanoseconds,t.nanoseconds):R(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:b._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(t){if(pe(t,b._jsonSchema))return new b(t.seconds,t.nanoseconds)}valueOf(){const t=this.seconds-Nr;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}b._jsonSchemaVersion="firestore/timestamp/1.0",b._jsonSchema={type:U("string",b._jsonSchemaVersion),seconds:U("number"),nanoseconds:U("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class I{static fromTimestamp(t){return new I(t)}static min(){return new I(new b(0,0))}static max(){return new I(new b(253402300799,999999999))}constructor(t){this.timestamp=t}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ue=-1;function Co(r,t){const e=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,s=I.fromTimestamp(n===1e9?new b(e+1,0):new b(e,n));return new Et(s,y.empty(),t)}function bo(r){return new Et(r.readTime,r.key,ue)}class Et{constructor(t,e,n){this.readTime=t,this.documentKey=e,this.largestBatchId=n}static min(){return new Et(I.min(),y.empty(),ue)}static max(){return new Et(I.max(),y.empty(),ue)}}function Do(r,t){let e=r.readTime.compareTo(t.readTime);return e!==0?e:(e=y.comparator(r.documentKey,t.documentKey),e!==0?e:R(r.largestBatchId,t.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const No="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class ko{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(t){this.onCommittedListeners.push(t)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((t=>t()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Wt(r){if(r.code!==f.FAILED_PRECONDITION||r.message!==No)throw r;g("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class m{constructor(t){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,t((e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)}),(e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)}))}catch(t){return this.next(void 0,t)}next(t,e){return this.callbackAttached&&E(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(e,this.error):this.wrapSuccess(t,this.result):new m(((n,s)=>{this.nextCallback=i=>{this.wrapSuccess(t,i).next(n,s)},this.catchCallback=i=>{this.wrapFailure(e,i).next(n,s)}}))}toPromise(){return new Promise(((t,e)=>{this.next(t,e)}))}wrapUserFunction(t){try{const e=t();return e instanceof m?e:m.resolve(e)}catch(e){return m.reject(e)}}wrapSuccess(t,e){return t?this.wrapUserFunction((()=>t(e))):m.resolve(e)}wrapFailure(t,e){return t?this.wrapUserFunction((()=>t(e))):m.reject(e)}static resolve(t){return new m(((e,n)=>{e(t)}))}static reject(t){return new m(((e,n)=>{n(t)}))}static waitFor(t){return new m(((e,n)=>{let s=0,i=0,o=!1;t.forEach((a=>{++s,a.next((()=>{++i,o&&i===s&&e()}),(u=>n(u)))})),o=!0,i===s&&e()}))}static or(t){let e=m.resolve(!1);for(const n of t)e=e.next((s=>s?m.resolve(s):n()));return e}static forEach(t,e){const n=[];return t.forEach(((s,i)=>{n.push(e.call(this,s,i))})),this.waitFor(n)}static mapArray(t,e){return new m(((n,s)=>{const i=t.length,o=new Array(i);let a=0;for(let u=0;u<i;u++){const c=u;e(t[c]).next((l=>{o[c]=l,++a,a===i&&n(o)}),(l=>s(l)))}}))}static doWhile(t,e){return new m(((n,s)=>{const i=()=>{t()===!0?e().next((()=>{i()}),s):n()};i()}))}}function xo(r){const t=r.match(/Android ([\d.]+)/i),e=t?t[1].split(".").slice(0,2).join("."):"-1";return Number(e)}function Ht(r){return r.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Je{constructor(t,e){this.previousValue=t,e&&(e.sequenceNumberHandler=n=>this._e(n),this.ae=n=>e.writeSequenceNumber(n))}_e(t){return this.previousValue=Math.max(t,this.previousValue),this.previousValue}next(){const t=++this.previousValue;return this.ae&&this.ae(t),t}}Je.ue=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Un=-1;function ge(r){return r==null}function Me(r){return r===0&&1/r==-1/0}function Fo(r){return typeof r=="number"&&Number.isInteger(r)&&!Me(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ds="";function Oo(r){let t="";for(let e=0;e<r.length;e++)t.length>0&&(t=xr(t)),t=Mo(r.get(e),t);return xr(t)}function Mo(r,t){let e=t;const n=r.length;for(let s=0;s<n;s++){const i=r.charAt(s);switch(i){case"\0":e+="";break;case Ds:e+="";break;default:e+=i}}return e}function xr(r){return r+Ds+""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fr(r){let t=0;for(const e in r)Object.prototype.hasOwnProperty.call(r,e)&&t++;return t}function Rt(r,t){for(const e in r)Object.prototype.hasOwnProperty.call(r,e)&&t(e,r[e])}function Ns(r){for(const t in r)if(Object.prototype.hasOwnProperty.call(r,t))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class k{constructor(t,e){this.comparator=t,this.root=e||$.EMPTY}insert(t,e){return new k(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,$.BLACK,null,null))}remove(t){return new k(this.comparator,this.root.remove(t,this.comparator).copy(null,null,$.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const n=this.comparator(t,e.key);if(n===0)return e.value;n<0?e=e.left:n>0&&(e=e.right)}return null}indexOf(t){let e=0,n=this.root;for(;!n.isEmpty();){const s=this.comparator(t,n.key);if(s===0)return e+n.left.size;s<0?n=n.left:(e+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal(((e,n)=>(t(e,n),!1)))}toString(){const t=[];return this.inorderTraversal(((e,n)=>(t.push(`${e}:${n}`),!1))),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new Se(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new Se(this.root,t,this.comparator,!1)}getReverseIterator(){return new Se(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new Se(this.root,t,this.comparator,!0)}}class Se{constructor(t,e,n,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!t.isEmpty();)if(i=e?n(t.key,e):1,e&&s&&(i*=-1),i<0)t=this.isReverse?t.left:t.right;else{if(i===0){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const t=this.nodeStack[this.nodeStack.length-1];return{key:t.key,value:t.value}}}class ${constructor(t,e,n,s,i){this.key=t,this.value=e,this.color=n??$.RED,this.left=s??$.EMPTY,this.right=i??$.EMPTY,this.size=this.left.size+1+this.right.size}copy(t,e,n,s,i){return new $(t??this.key,e??this.value,n??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,n){let s=this;const i=n(t,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(t,e,n),null):i===0?s.copy(null,e,null,null,null):s.copy(null,null,null,null,s.right.insert(t,e,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return $.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let n,s=this;if(e(t,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(t,e),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),e(t,s.key)===0){if(s.right.isEmpty())return $.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(t,e))}return s.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,$.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,$.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw E(43730,{key:this.key,value:this.value});if(this.right.isRed())throw E(14113,{key:this.key,value:this.value});const t=this.left.check();if(t!==this.right.check())throw E(27949);return t+(this.isRed()?0:1)}}$.EMPTY=null,$.RED=!0,$.BLACK=!1;$.EMPTY=new class{constructor(){this.size=0}get key(){throw E(57766)}get value(){throw E(16141)}get color(){throw E(16727)}get left(){throw E(29726)}get right(){throw E(36894)}copy(t,e,n,s,i){return this}insert(t,e,n){return new $(t,e)}remove(t,e){return this}isEmpty(){return!0}inorderTraversal(t){return!1}reverseTraversal(t){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class q{constructor(t){this.comparator=t,this.data=new k(this.comparator)}has(t){return this.data.get(t)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal(((e,n)=>(t(e),!1)))}forEachInRange(t,e){const n=this.data.getIteratorFrom(t[0]);for(;n.hasNext();){const s=n.getNext();if(this.comparator(s.key,t[1])>=0)return;e(s.key)}}forEachWhile(t,e){let n;for(n=e!==void 0?this.data.getIteratorFrom(e):this.data.getIterator();n.hasNext();)if(!t(n.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new Or(this.data.getIterator())}getIteratorFrom(t){return new Or(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach((n=>{e=e.add(n)})),e}isEqual(t){if(!(t instanceof q)||this.size!==t.size)return!1;const e=this.data.getIterator(),n=t.data.getIterator();for(;e.hasNext();){const s=e.getNext().key,i=n.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const t=[];return this.forEach((e=>{t.push(e)})),t}toString(){const t=[];return this.forEach((e=>t.push(e))),"SortedSet("+t.toString()+")"}copy(t){const e=new q(this.comparator);return e.data=t,e}}class Or{constructor(t){this.iter=t}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Z{constructor(t){this.fields=t,t.sort(j.comparator)}static empty(){return new Z([])}unionWith(t){let e=new q(j.comparator);for(const n of this.fields)e=e.add(n);for(const n of t)e=e.add(n);return new Z(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return!0;return!1}isEqual(t){return zt(this.fields,t.fields,((e,n)=>e.isEqual(n)))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ks extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class G{constructor(t){this.binaryString=t}static fromBase64String(t){const e=(function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new ks("Invalid base64 string: "+i):i}})(t);return new G(e)}static fromUint8Array(t){const e=(function(s){let i="";for(let o=0;o<s.length;++o)i+=String.fromCharCode(s[o]);return i})(t);return new G(e)}[Symbol.iterator](){let t=0;return{next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(e){return btoa(e)})(this.binaryString)}toUint8Array(){return(function(e){const n=new Uint8Array(e.length);for(let s=0;s<e.length;s++)n[s]=e.charCodeAt(s);return n})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return R(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}G.EMPTY_BYTE_STRING=new G("");const Lo=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Tt(r){if(S(!!r,39018),typeof r=="string"){let t=0;const e=Lo.exec(r);if(S(!!e,46558,{timestamp:r}),e[1]){let s=e[1];s=(s+"000000000").substr(0,9),t=Number(s)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:t}}return{seconds:F(r.seconds),nanos:F(r.nanos)}}function F(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function It(r){return typeof r=="string"?G.fromBase64String(r):G.fromUint8Array(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xs="server_timestamp",Fs="__type__",Os="__previous_value__",Ms="__local_write_time__";function qn(r){var t,e;return((e=(((t=r==null?void 0:r.mapValue)===null||t===void 0?void 0:t.fields)||{})[Fs])===null||e===void 0?void 0:e.stringValue)===xs}function Xe(r){const t=r.mapValue.fields[Os];return qn(t)?Xe(t):t}function ce(r){const t=Tt(r.mapValue.fields[Ms].timestampValue);return new b(t.seconds,t.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uo{constructor(t,e,n,s,i,o,a,u,c,l){this.databaseId=t,this.appId=e,this.persistenceKey=n,this.host=s,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=a,this.longPollingOptions=u,this.useFetchStreams=c,this.isUsingEmulator=l}}const Le="(default)";class le{constructor(t,e){this.projectId=t,this.database=e||Le}static empty(){return new le("","")}get isDefaultDatabase(){return this.database===Le}isEqual(t){return t instanceof le&&t.projectId===this.projectId&&t.database===this.database}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ls="__type__",qo="__max__",Ce={mapValue:{}},Us="__vector__",Ue="value";function At(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?qn(r)?4:zo(r)?9007199254740991:Bo(r)?10:11:E(28295,{value:r})}function ct(r,t){if(r===t)return!0;const e=At(r);if(e!==At(t))return!1;switch(e){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===t.booleanValue;case 4:return ce(r).isEqual(ce(t));case 3:return(function(s,i){if(typeof s.timestampValue=="string"&&typeof i.timestampValue=="string"&&s.timestampValue.length===i.timestampValue.length)return s.timestampValue===i.timestampValue;const o=Tt(s.timestampValue),a=Tt(i.timestampValue);return o.seconds===a.seconds&&o.nanos===a.nanos})(r,t);case 5:return r.stringValue===t.stringValue;case 6:return(function(s,i){return It(s.bytesValue).isEqual(It(i.bytesValue))})(r,t);case 7:return r.referenceValue===t.referenceValue;case 8:return(function(s,i){return F(s.geoPointValue.latitude)===F(i.geoPointValue.latitude)&&F(s.geoPointValue.longitude)===F(i.geoPointValue.longitude)})(r,t);case 2:return(function(s,i){if("integerValue"in s&&"integerValue"in i)return F(s.integerValue)===F(i.integerValue);if("doubleValue"in s&&"doubleValue"in i){const o=F(s.doubleValue),a=F(i.doubleValue);return o===a?Me(o)===Me(a):isNaN(o)&&isNaN(a)}return!1})(r,t);case 9:return zt(r.arrayValue.values||[],t.arrayValue.values||[],ct);case 10:case 11:return(function(s,i){const o=s.mapValue.fields||{},a=i.mapValue.fields||{};if(Fr(o)!==Fr(a))return!1;for(const u in o)if(o.hasOwnProperty(u)&&(a[u]===void 0||!ct(o[u],a[u])))return!1;return!0})(r,t);default:return E(52216,{left:r})}}function he(r,t){return(r.values||[]).find((e=>ct(e,t)))!==void 0}function $t(r,t){if(r===t)return 0;const e=At(r),n=At(t);if(e!==n)return R(e,n);switch(e){case 0:case 9007199254740991:return 0;case 1:return R(r.booleanValue,t.booleanValue);case 2:return(function(i,o){const a=F(i.integerValue||i.doubleValue),u=F(o.integerValue||o.doubleValue);return a<u?-1:a>u?1:a===u?0:isNaN(a)?isNaN(u)?0:-1:1})(r,t);case 3:return Mr(r.timestampValue,t.timestampValue);case 4:return Mr(ce(r),ce(t));case 5:return In(r.stringValue,t.stringValue);case 6:return(function(i,o){const a=It(i),u=It(o);return a.compareTo(u)})(r.bytesValue,t.bytesValue);case 7:return(function(i,o){const a=i.split("/"),u=o.split("/");for(let c=0;c<a.length&&c<u.length;c++){const l=R(a[c],u[c]);if(l!==0)return l}return R(a.length,u.length)})(r.referenceValue,t.referenceValue);case 8:return(function(i,o){const a=R(F(i.latitude),F(o.latitude));return a!==0?a:R(F(i.longitude),F(o.longitude))})(r.geoPointValue,t.geoPointValue);case 9:return Lr(r.arrayValue,t.arrayValue);case 10:return(function(i,o){var a,u,c,l;const h=i.fields||{},d=o.fields||{},_=(a=h[Ue])===null||a===void 0?void 0:a.arrayValue,A=(u=d[Ue])===null||u===void 0?void 0:u.arrayValue,v=R(((c=_==null?void 0:_.values)===null||c===void 0?void 0:c.length)||0,((l=A==null?void 0:A.values)===null||l===void 0?void 0:l.length)||0);return v!==0?v:Lr(_,A)})(r.mapValue,t.mapValue);case 11:return(function(i,o){if(i===Ce.mapValue&&o===Ce.mapValue)return 0;if(i===Ce.mapValue)return 1;if(o===Ce.mapValue)return-1;const a=i.fields||{},u=Object.keys(a),c=o.fields||{},l=Object.keys(c);u.sort(),l.sort();for(let h=0;h<u.length&&h<l.length;++h){const d=In(u[h],l[h]);if(d!==0)return d;const _=$t(a[u[h]],c[l[h]]);if(_!==0)return _}return R(u.length,l.length)})(r.mapValue,t.mapValue);default:throw E(23264,{le:e})}}function Mr(r,t){if(typeof r=="string"&&typeof t=="string"&&r.length===t.length)return R(r,t);const e=Tt(r),n=Tt(t),s=R(e.seconds,n.seconds);return s!==0?s:R(e.nanos,n.nanos)}function Lr(r,t){const e=r.values||[],n=t.values||[];for(let s=0;s<e.length&&s<n.length;++s){const i=$t(e[s],n[s]);if(i)return i}return R(e.length,n.length)}function jt(r){return An(r)}function An(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?(function(e){const n=Tt(e);return`time(${n.seconds},${n.nanos})`})(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?(function(e){return It(e).toBase64()})(r.bytesValue):"referenceValue"in r?(function(e){return y.fromName(e).toString()})(r.referenceValue):"geoPointValue"in r?(function(e){return`geo(${e.latitude},${e.longitude})`})(r.geoPointValue):"arrayValue"in r?(function(e){let n="[",s=!0;for(const i of e.values||[])s?s=!1:n+=",",n+=An(i);return n+"]"})(r.arrayValue):"mapValue"in r?(function(e){const n=Object.keys(e.fields||{}).sort();let s="{",i=!0;for(const o of n)i?i=!1:s+=",",s+=`${o}:${An(e.fields[o])}`;return s+"}"})(r.mapValue):E(61005,{value:r})}function Ne(r){switch(At(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const t=Xe(r);return t?16+Ne(t):16;case 5:return 2*r.stringValue.length;case 6:return It(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return(function(n){return(n.values||[]).reduce(((s,i)=>s+Ne(i)),0)})(r.arrayValue);case 10:case 11:return(function(n){let s=0;return Rt(n.fields,((i,o)=>{s+=i.length+Ne(o)})),s})(r.mapValue);default:throw E(13486,{value:r})}}function Ur(r,t){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${t.path.canonicalString()}`}}function wn(r){return!!r&&"integerValue"in r}function Bn(r){return!!r&&"arrayValue"in r}function qr(r){return!!r&&"nullValue"in r}function Br(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function ke(r){return!!r&&"mapValue"in r}function Bo(r){var t,e;return((e=(((t=r==null?void 0:r.mapValue)===null||t===void 0?void 0:t.fields)||{})[Ls])===null||e===void 0?void 0:e.stringValue)===Us}function re(r){if(r.geoPointValue)return{geoPointValue:Object.assign({},r.geoPointValue)};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:Object.assign({},r.timestampValue)};if(r.mapValue){const t={mapValue:{fields:{}}};return Rt(r.mapValue.fields,((e,n)=>t.mapValue.fields[e]=re(n))),t}if(r.arrayValue){const t={arrayValue:{values:[]}};for(let e=0;e<(r.arrayValue.values||[]).length;++e)t.arrayValue.values[e]=re(r.arrayValue.values[e]);return t}return Object.assign({},r)}function zo(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===qo}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Y{constructor(t){this.value=t}static empty(){return new Y({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let n=0;n<t.length-1;++n)if(e=(e.mapValue.fields||{})[t.get(n)],!ke(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=re(e)}setAll(t){let e=j.emptyPath(),n={},s=[];t.forEach(((o,a)=>{if(!e.isImmediateParentOf(a)){const u=this.getFieldsMap(e);this.applyChanges(u,n,s),n={},s=[],e=a.popLast()}o?n[a.lastSegment()]=re(o):s.push(a.lastSegment())}));const i=this.getFieldsMap(e);this.applyChanges(i,n,s)}delete(t){const e=this.field(t.popLast());ke(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()]}isEqual(t){return ct(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let n=0;n<t.length;++n){let s=e.mapValue.fields[t.get(n)];ke(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},e.mapValue.fields[t.get(n)]=s),e=s}return e.mapValue.fields}applyChanges(t,e,n){Rt(e,((s,i)=>t[s]=i));for(const s of n)delete t[s]}clone(){return new Y(re(this.value))}}function qs(r){const t=[];return Rt(r.fields,((e,n)=>{const s=new j([e]);if(ke(n)){const i=qs(n.mapValue).fields;if(i.length===0)t.push(s);else for(const o of i)t.push(s.child(o))}else t.push(s)})),new Z(t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class z{constructor(t,e,n,s,i,o,a){this.key=t,this.documentType=e,this.version=n,this.readTime=s,this.createTime=i,this.data=o,this.documentState=a}static newInvalidDocument(t){return new z(t,0,I.min(),I.min(),I.min(),Y.empty(),0)}static newFoundDocument(t,e,n,s){return new z(t,1,e,I.min(),n,s,0)}static newNoDocument(t,e){return new z(t,2,e,I.min(),I.min(),Y.empty(),0)}static newUnknownDocument(t,e){return new z(t,3,e,I.min(),I.min(),Y.empty(),2)}convertToFoundDocument(t,e){return!this.createTime.isEqual(I.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=t),this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=Y.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=Y.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=I.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(t){return t instanceof z&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new z(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qe{constructor(t,e){this.position=t,this.inclusive=e}}function zr(r,t,e){let n=0;for(let s=0;s<r.position.length;s++){const i=t[s],o=r.position[s];if(i.field.isKeyField()?n=y.comparator(y.fromName(o.referenceValue),e.key):n=$t(o,e.data.field(i.field)),i.dir==="desc"&&(n*=-1),n!==0)break}return n}function $r(r,t){if(r===null)return t===null;if(t===null||r.inclusive!==t.inclusive||r.position.length!==t.position.length)return!1;for(let e=0;e<r.position.length;e++)if(!ct(r.position[e],t.position[e]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class de{constructor(t,e="asc"){this.field=t,this.dir=e}}function $o(r,t){return r.dir===t.dir&&r.field.isEqual(t.field)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bs{}class M extends Bs{constructor(t,e,n){super(),this.field=t,this.op=e,this.value=n}static create(t,e,n){return t.isKeyField()?e==="in"||e==="not-in"?this.createKeyFieldInFilter(t,e,n):new Go(t,e,n):e==="array-contains"?new Wo(t,n):e==="in"?new Ho(t,n):e==="not-in"?new Yo(t,n):e==="array-contains-any"?new Jo(t,n):new M(t,e,n)}static createKeyFieldInFilter(t,e,n){return e==="in"?new Qo(t,n):new Ko(t,n)}matches(t){const e=t.data.field(this.field);return this.op==="!="?e!==null&&e.nullValue===void 0&&this.matchesComparison($t(e,this.value)):e!==null&&At(this.value)===At(e)&&this.matchesComparison($t(e,this.value))}matchesComparison(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return t===0;case"!=":return t!==0;case">":return t>0;case">=":return t>=0;default:return E(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class nt extends Bs{constructor(t,e){super(),this.filters=t,this.op=e,this.he=null}static create(t,e){return new nt(t,e)}matches(t){return zs(this)?this.filters.find((e=>!e.matches(t)))===void 0:this.filters.find((e=>e.matches(t)))!==void 0}getFlattenedFilters(){return this.he!==null||(this.he=this.filters.reduce(((t,e)=>t.concat(e.getFlattenedFilters())),[])),this.he}getFilters(){return Object.assign([],this.filters)}}function zs(r){return r.op==="and"}function $s(r){return jo(r)&&zs(r)}function jo(r){for(const t of r.filters)if(t instanceof nt)return!1;return!0}function vn(r){if(r instanceof M)return r.field.canonicalString()+r.op.toString()+jt(r.value);if($s(r))return r.filters.map((t=>vn(t))).join(",");{const t=r.filters.map((e=>vn(e))).join(",");return`${r.op}(${t})`}}function js(r,t){return r instanceof M?(function(n,s){return s instanceof M&&n.op===s.op&&n.field.isEqual(s.field)&&ct(n.value,s.value)})(r,t):r instanceof nt?(function(n,s){return s instanceof nt&&n.op===s.op&&n.filters.length===s.filters.length?n.filters.reduce(((i,o,a)=>i&&js(o,s.filters[a])),!0):!1})(r,t):void E(19439)}function Gs(r){return r instanceof M?(function(e){return`${e.field.canonicalString()} ${e.op} ${jt(e.value)}`})(r):r instanceof nt?(function(e){return e.op.toString()+" {"+e.getFilters().map(Gs).join(" ,")+"}"})(r):"Filter"}class Go extends M{constructor(t,e,n){super(t,e,n),this.key=y.fromName(n.referenceValue)}matches(t){const e=y.comparator(t.key,this.key);return this.matchesComparison(e)}}class Qo extends M{constructor(t,e){super(t,"in",e),this.keys=Qs("in",e)}matches(t){return this.keys.some((e=>e.isEqual(t.key)))}}class Ko extends M{constructor(t,e){super(t,"not-in",e),this.keys=Qs("not-in",e)}matches(t){return!this.keys.some((e=>e.isEqual(t.key)))}}function Qs(r,t){var e;return(((e=t.arrayValue)===null||e===void 0?void 0:e.values)||[]).map((n=>y.fromName(n.referenceValue)))}class Wo extends M{constructor(t,e){super(t,"array-contains",e)}matches(t){const e=t.data.field(this.field);return Bn(e)&&he(e.arrayValue,this.value)}}class Ho extends M{constructor(t,e){super(t,"in",e)}matches(t){const e=t.data.field(this.field);return e!==null&&he(this.value.arrayValue,e)}}class Yo extends M{constructor(t,e){super(t,"not-in",e)}matches(t){if(he(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const e=t.data.field(this.field);return e!==null&&e.nullValue===void 0&&!he(this.value.arrayValue,e)}}class Jo extends M{constructor(t,e){super(t,"array-contains-any",e)}matches(t){const e=t.data.field(this.field);return!(!Bn(e)||!e.arrayValue.values)&&e.arrayValue.values.some((n=>he(this.value.arrayValue,n)))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xo{constructor(t,e=null,n=[],s=[],i=null,o=null,a=null){this.path=t,this.collectionGroup=e,this.orderBy=n,this.filters=s,this.limit=i,this.startAt=o,this.endAt=a,this.Pe=null}}function jr(r,t=null,e=[],n=[],s=null,i=null,o=null){return new Xo(r,t,e,n,s,i,o)}function zn(r){const t=w(r);if(t.Pe===null){let e=t.path.canonicalString();t.collectionGroup!==null&&(e+="|cg:"+t.collectionGroup),e+="|f:",e+=t.filters.map((n=>vn(n))).join(","),e+="|ob:",e+=t.orderBy.map((n=>(function(i){return i.field.canonicalString()+i.dir})(n))).join(","),ge(t.limit)||(e+="|l:",e+=t.limit),t.startAt&&(e+="|lb:",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map((n=>jt(n))).join(",")),t.endAt&&(e+="|ub:",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map((n=>jt(n))).join(",")),t.Pe=e}return t.Pe}function $n(r,t){if(r.limit!==t.limit||r.orderBy.length!==t.orderBy.length)return!1;for(let e=0;e<r.orderBy.length;e++)if(!$o(r.orderBy[e],t.orderBy[e]))return!1;if(r.filters.length!==t.filters.length)return!1;for(let e=0;e<r.filters.length;e++)if(!js(r.filters[e],t.filters[e]))return!1;return r.collectionGroup===t.collectionGroup&&!!r.path.isEqual(t.path)&&!!$r(r.startAt,t.startAt)&&$r(r.endAt,t.endAt)}function Rn(r){return y.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yt{constructor(t,e=null,n=[],s=[],i=null,o="F",a=null,u=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=n,this.filters=s,this.limit=i,this.limitType=o,this.startAt=a,this.endAt=u,this.Te=null,this.Ie=null,this.de=null,this.startAt,this.endAt}}function Zo(r,t,e,n,s,i,o,a){return new Yt(r,t,e,n,s,i,o,a)}function Ze(r){return new Yt(r)}function Gr(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function Ks(r){return r.collectionGroup!==null}function se(r){const t=w(r);if(t.Te===null){t.Te=[];const e=new Set;for(const i of t.explicitOrderBy)t.Te.push(i),e.add(i.field.canonicalString());const n=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";(function(o){let a=new q(j.comparator);return o.filters.forEach((u=>{u.getFlattenedFilters().forEach((c=>{c.isInequality()&&(a=a.add(c.field))}))})),a})(t).forEach((i=>{e.has(i.canonicalString())||i.isKeyField()||t.Te.push(new de(i,n))})),e.has(j.keyField().canonicalString())||t.Te.push(new de(j.keyField(),n))}return t.Te}function ot(r){const t=w(r);return t.Ie||(t.Ie=ta(t,se(r))),t.Ie}function ta(r,t){if(r.limitType==="F")return jr(r.path,r.collectionGroup,t,r.filters,r.limit,r.startAt,r.endAt);{t=t.map((s=>{const i=s.dir==="desc"?"asc":"desc";return new de(s.field,i)}));const e=r.endAt?new qe(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new qe(r.startAt.position,r.startAt.inclusive):null;return jr(r.path,r.collectionGroup,t,r.filters,r.limit,e,n)}}function Vn(r,t){const e=r.filters.concat([t]);return new Yt(r.path,r.collectionGroup,r.explicitOrderBy.slice(),e,r.limit,r.limitType,r.startAt,r.endAt)}function Pn(r,t,e){return new Yt(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),t,e,r.startAt,r.endAt)}function tn(r,t){return $n(ot(r),ot(t))&&r.limitType===t.limitType}function Ws(r){return`${zn(ot(r))}|lt:${r.limitType}`}function Mt(r){return`Query(target=${(function(e){let n=e.path.canonicalString();return e.collectionGroup!==null&&(n+=" collectionGroup="+e.collectionGroup),e.filters.length>0&&(n+=`, filters: [${e.filters.map((s=>Gs(s))).join(", ")}]`),ge(e.limit)||(n+=", limit: "+e.limit),e.orderBy.length>0&&(n+=`, orderBy: [${e.orderBy.map((s=>(function(o){return`${o.field.canonicalString()} (${o.dir})`})(s))).join(", ")}]`),e.startAt&&(n+=", startAt: ",n+=e.startAt.inclusive?"b:":"a:",n+=e.startAt.position.map((s=>jt(s))).join(",")),e.endAt&&(n+=", endAt: ",n+=e.endAt.inclusive?"a:":"b:",n+=e.endAt.position.map((s=>jt(s))).join(",")),`Target(${n})`})(ot(r))}; limitType=${r.limitType})`}function en(r,t){return t.isFoundDocument()&&(function(n,s){const i=s.key.path;return n.collectionGroup!==null?s.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(i):y.isDocumentKey(n.path)?n.path.isEqual(i):n.path.isImmediateParentOf(i)})(r,t)&&(function(n,s){for(const i of se(n))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0})(r,t)&&(function(n,s){for(const i of n.filters)if(!i.matches(s))return!1;return!0})(r,t)&&(function(n,s){return!(n.startAt&&!(function(o,a,u){const c=zr(o,a,u);return o.inclusive?c<=0:c<0})(n.startAt,se(n),s)||n.endAt&&!(function(o,a,u){const c=zr(o,a,u);return o.inclusive?c>=0:c>0})(n.endAt,se(n),s))})(r,t)}function ea(r){return r.collectionGroup||(r.path.length%2==1?r.path.lastSegment():r.path.get(r.path.length-2))}function Hs(r){return(t,e)=>{let n=!1;for(const s of se(r)){const i=na(s,t,e);if(i!==0)return i;n=n||s.field.isKeyField()}return 0}}function na(r,t,e){const n=r.field.isKeyField()?y.comparator(t.key,e.key):(function(i,o,a){const u=o.data.field(i),c=a.data.field(i);return u!==null&&c!==null?$t(u,c):E(42886)})(r.field,t,e);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return E(19790,{direction:r.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kt{constructor(t,e){this.mapKeyFn=t,this.equalsFn=e,this.inner={},this.innerSize=0}get(t){const e=this.mapKeyFn(t),n=this.inner[e];if(n!==void 0){for(const[s,i]of n)if(this.equalsFn(s,t))return i}}has(t){return this.get(t)!==void 0}set(t,e){const n=this.mapKeyFn(t),s=this.inner[n];if(s===void 0)return this.inner[n]=[[t,e]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],t))return void(s[i]=[t,e]);s.push([t,e]),this.innerSize++}delete(t){const e=this.mapKeyFn(t),n=this.inner[e];if(n===void 0)return!1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],t))return n.length===1?delete this.inner[e]:n.splice(s,1),this.innerSize--,!0;return!1}forEach(t){Rt(this.inner,((e,n)=>{for(const[s,i]of n)t(s,i)}))}isEmpty(){return Ns(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ra=new k(y.comparator);function ft(){return ra}const Ys=new k(y.comparator);function ee(...r){let t=Ys;for(const e of r)t=t.insert(e.key,e);return t}function Js(r){let t=Ys;return r.forEach(((e,n)=>t=t.insert(e,n.overlayedDocument))),t}function St(){return ie()}function Xs(){return ie()}function ie(){return new kt((r=>r.toString()),((r,t)=>r.isEqual(t)))}const sa=new k(y.comparator),ia=new q(y.comparator);function V(...r){let t=ia;for(const e of r)t=t.add(e);return t}const oa=new q(R);function aa(){return oa}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jn(r,t){if(r.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Me(t)?"-0":t}}function Zs(r){return{integerValue:""+r}}function ua(r,t){return Fo(t)?Zs(t):jn(r,t)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nn{constructor(){this._=void 0}}function ca(r,t,e){return r instanceof fe?(function(s,i){const o={fields:{[Fs]:{stringValue:xs},[Ms]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&qn(i)&&(i=Xe(i)),i&&(o.fields[Os]=i),{mapValue:o}})(e,t):r instanceof me?ei(r,t):r instanceof _e?ni(r,t):(function(s,i){const o=ti(s,i),a=Qr(o)+Qr(s.Ee);return wn(o)&&wn(s.Ee)?Zs(a):jn(s.serializer,a)})(r,t)}function la(r,t,e){return r instanceof me?ei(r,t):r instanceof _e?ni(r,t):e}function ti(r,t){return r instanceof Be?(function(n){return wn(n)||(function(i){return!!i&&"doubleValue"in i})(n)})(t)?t:{integerValue:0}:null}class fe extends nn{}class me extends nn{constructor(t){super(),this.elements=t}}function ei(r,t){const e=ri(t);for(const n of r.elements)e.some((s=>ct(s,n)))||e.push(n);return{arrayValue:{values:e}}}class _e extends nn{constructor(t){super(),this.elements=t}}function ni(r,t){let e=ri(t);for(const n of r.elements)e=e.filter((s=>!ct(s,n)));return{arrayValue:{values:e}}}class Be extends nn{constructor(t,e){super(),this.serializer=t,this.Ee=e}}function Qr(r){return F(r.integerValue||r.doubleValue)}function ri(r){return Bn(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ha{constructor(t,e){this.field=t,this.transform=e}}function da(r,t){return r.field.isEqual(t.field)&&(function(n,s){return n instanceof me&&s instanceof me||n instanceof _e&&s instanceof _e?zt(n.elements,s.elements,ct):n instanceof Be&&s instanceof Be?ct(n.Ee,s.Ee):n instanceof fe&&s instanceof fe})(r.transform,t.transform)}class fa{constructor(t,e){this.version=t,this.transformResults=e}}class L{constructor(t,e){this.updateTime=t,this.exists=e}static none(){return new L}static exists(t){return new L(void 0,t)}static updateTime(t){return new L(t)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}function xe(r,t){return r.updateTime!==void 0?t.isFoundDocument()&&t.version.isEqual(r.updateTime):r.exists===void 0||r.exists===t.isFoundDocument()}class rn{}function si(r,t){if(!r.hasLocalMutations||t&&t.fields.length===0)return null;if(t===null)return r.isNoDocument()?new Ee(r.key,L.none()):new ye(r.key,r.data,L.none());{const e=r.data,n=Y.empty();let s=new q(j.comparator);for(let i of t.fields)if(!s.has(i)){let o=e.field(i);o===null&&i.length>1&&(i=i.popLast(),o=e.field(i)),o===null?n.delete(i):n.set(i,o),s=s.add(i)}return new Vt(r.key,n,new Z(s.toArray()),L.none())}}function ma(r,t,e){r instanceof ye?(function(s,i,o){const a=s.value.clone(),u=Wr(s.fieldTransforms,i,o.transformResults);a.setAll(u),i.convertToFoundDocument(o.version,a).setHasCommittedMutations()})(r,t,e):r instanceof Vt?(function(s,i,o){if(!xe(s.precondition,i))return void i.convertToUnknownDocument(o.version);const a=Wr(s.fieldTransforms,i,o.transformResults),u=i.data;u.setAll(ii(s)),u.setAll(a),i.convertToFoundDocument(o.version,u).setHasCommittedMutations()})(r,t,e):(function(s,i,o){i.convertToNoDocument(o.version).setHasCommittedMutations()})(0,t,e)}function oe(r,t,e,n){return r instanceof ye?(function(i,o,a,u){if(!xe(i.precondition,o))return a;const c=i.value.clone(),l=Hr(i.fieldTransforms,u,o);return c.setAll(l),o.convertToFoundDocument(o.version,c).setHasLocalMutations(),null})(r,t,e,n):r instanceof Vt?(function(i,o,a,u){if(!xe(i.precondition,o))return a;const c=Hr(i.fieldTransforms,u,o),l=o.data;return l.setAll(ii(i)),l.setAll(c),o.convertToFoundDocument(o.version,l).setHasLocalMutations(),a===null?null:a.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map((h=>h.field)))})(r,t,e,n):(function(i,o,a){return xe(i.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):a})(r,t,e)}function _a(r,t){let e=null;for(const n of r.fieldTransforms){const s=t.data.field(n.field),i=ti(n.transform,s||null);i!=null&&(e===null&&(e=Y.empty()),e.set(n.field,i))}return e||null}function Kr(r,t){return r.type===t.type&&!!r.key.isEqual(t.key)&&!!r.precondition.isEqual(t.precondition)&&!!(function(n,s){return n===void 0&&s===void 0||!(!n||!s)&&zt(n,s,((i,o)=>da(i,o)))})(r.fieldTransforms,t.fieldTransforms)&&(r.type===0?r.value.isEqual(t.value):r.type!==1||r.data.isEqual(t.data)&&r.fieldMask.isEqual(t.fieldMask))}class ye extends rn{constructor(t,e,n,s=[]){super(),this.key=t,this.value=e,this.precondition=n,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class Vt extends rn{constructor(t,e,n,s,i=[]){super(),this.key=t,this.data=e,this.fieldMask=n,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function ii(r){const t=new Map;return r.fieldMask.fields.forEach((e=>{if(!e.isEmpty()){const n=r.data.field(e);t.set(e,n)}})),t}function Wr(r,t,e){const n=new Map;S(r.length===e.length,32656,{Ae:e.length,Re:r.length});for(let s=0;s<e.length;s++){const i=r[s],o=i.transform,a=t.data.field(i.field);n.set(i.field,la(o,a,e[s]))}return n}function Hr(r,t,e){const n=new Map;for(const s of r){const i=s.transform,o=e.data.field(s.field);n.set(s.field,ca(i,o,t))}return n}class Ee extends rn{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class oi extends rn{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pa{constructor(t,e,n,s){this.batchId=t,this.localWriteTime=e,this.baseMutations=n,this.mutations=s}applyToRemoteDocument(t,e){const n=e.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(t.key)&&ma(i,t,n[s])}}applyToLocalView(t,e){for(const n of this.baseMutations)n.key.isEqual(t.key)&&(e=oe(n,t,e,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(t.key)&&(e=oe(n,t,e,this.localWriteTime));return e}applyToLocalDocumentSet(t,e){const n=Xs();return this.mutations.forEach((s=>{const i=t.get(s.key),o=i.overlayedDocument;let a=this.applyToLocalView(o,i.mutatedFields);a=e.has(s.key)?null:a;const u=si(o,a);u!==null&&n.set(s.key,u),o.isValidDocument()||o.convertToNoDocument(I.min())})),n}keys(){return this.mutations.reduce(((t,e)=>t.add(e.key)),V())}isEqual(t){return this.batchId===t.batchId&&zt(this.mutations,t.mutations,((e,n)=>Kr(e,n)))&&zt(this.baseMutations,t.baseMutations,((e,n)=>Kr(e,n)))}}class Gn{constructor(t,e,n,s){this.batch=t,this.commitVersion=e,this.mutationResults=n,this.docVersions=s}static from(t,e,n){S(t.mutations.length===n.length,58842,{Ve:t.mutations.length,me:n.length});let s=(function(){return sa})();const i=t.mutations;for(let o=0;o<i.length;o++)s=s.insert(i[o].key,n[o].version);return new Gn(t,e,n,s)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ga{constructor(t,e){this.largestBatchId=t,this.mutation=e}getKey(){return this.mutation.key}isEqual(t){return t!==null&&this.mutation===t.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ya{constructor(t,e){this.count=t,this.unchangedNames=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var O,P;function ai(r){switch(r){case f.OK:return E(64938);case f.CANCELLED:case f.UNKNOWN:case f.DEADLINE_EXCEEDED:case f.RESOURCE_EXHAUSTED:case f.INTERNAL:case f.UNAVAILABLE:case f.UNAUTHENTICATED:return!1;case f.INVALID_ARGUMENT:case f.NOT_FOUND:case f.ALREADY_EXISTS:case f.PERMISSION_DENIED:case f.FAILED_PRECONDITION:case f.ABORTED:case f.OUT_OF_RANGE:case f.UNIMPLEMENTED:case f.DATA_LOSS:return!0;default:return E(15467,{code:r})}}function ui(r){if(r===void 0)return dt("GRPC error has no .code"),f.UNKNOWN;switch(r){case O.OK:return f.OK;case O.CANCELLED:return f.CANCELLED;case O.UNKNOWN:return f.UNKNOWN;case O.DEADLINE_EXCEEDED:return f.DEADLINE_EXCEEDED;case O.RESOURCE_EXHAUSTED:return f.RESOURCE_EXHAUSTED;case O.INTERNAL:return f.INTERNAL;case O.UNAVAILABLE:return f.UNAVAILABLE;case O.UNAUTHENTICATED:return f.UNAUTHENTICATED;case O.INVALID_ARGUMENT:return f.INVALID_ARGUMENT;case O.NOT_FOUND:return f.NOT_FOUND;case O.ALREADY_EXISTS:return f.ALREADY_EXISTS;case O.PERMISSION_DENIED:return f.PERMISSION_DENIED;case O.FAILED_PRECONDITION:return f.FAILED_PRECONDITION;case O.ABORTED:return f.ABORTED;case O.OUT_OF_RANGE:return f.OUT_OF_RANGE;case O.UNIMPLEMENTED:return f.UNIMPLEMENTED;case O.DATA_LOSS:return f.DATA_LOSS;default:return E(39323,{code:r})}}(P=O||(O={}))[P.OK=0]="OK",P[P.CANCELLED=1]="CANCELLED",P[P.UNKNOWN=2]="UNKNOWN",P[P.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",P[P.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",P[P.NOT_FOUND=5]="NOT_FOUND",P[P.ALREADY_EXISTS=6]="ALREADY_EXISTS",P[P.PERMISSION_DENIED=7]="PERMISSION_DENIED",P[P.UNAUTHENTICATED=16]="UNAUTHENTICATED",P[P.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",P[P.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",P[P.ABORTED=10]="ABORTED",P[P.OUT_OF_RANGE=11]="OUT_OF_RANGE",P[P.UNIMPLEMENTED=12]="UNIMPLEMENTED",P[P.INTERNAL=13]="INTERNAL",P[P.UNAVAILABLE=14]="UNAVAILABLE",P[P.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ea=new Ct([4294967295,4294967295],0);function Yr(r){const t=Ss().encode(r),e=new fo;return e.update(t),new Uint8Array(e.digest())}function Jr(r){const t=new DataView(r.buffer),e=t.getUint32(0,!0),n=t.getUint32(4,!0),s=t.getUint32(8,!0),i=t.getUint32(12,!0);return[new Ct([e,n],0),new Ct([s,i],0)]}class Qn{constructor(t,e,n){if(this.bitmap=t,this.padding=e,this.hashCount=n,e<0||e>=8)throw new ne(`Invalid padding: ${e}`);if(n<0)throw new ne(`Invalid hash count: ${n}`);if(t.length>0&&this.hashCount===0)throw new ne(`Invalid hash count: ${n}`);if(t.length===0&&e!==0)throw new ne(`Invalid padding when bitmap length is 0: ${e}`);this.fe=8*t.length-e,this.ge=Ct.fromNumber(this.fe)}pe(t,e,n){let s=t.add(e.multiply(Ct.fromNumber(n)));return s.compare(Ea)===1&&(s=new Ct([s.getBits(0),s.getBits(1)],0)),s.modulo(this.ge).toNumber()}ye(t){return!!(this.bitmap[Math.floor(t/8)]&1<<t%8)}mightContain(t){if(this.fe===0)return!1;const e=Yr(t),[n,s]=Jr(e);for(let i=0;i<this.hashCount;i++){const o=this.pe(n,s,i);if(!this.ye(o))return!1}return!0}static create(t,e,n){const s=t%8==0?0:8-t%8,i=new Uint8Array(Math.ceil(t/8)),o=new Qn(i,s,e);return n.forEach((a=>o.insert(a))),o}insert(t){if(this.fe===0)return;const e=Yr(t),[n,s]=Jr(e);for(let i=0;i<this.hashCount;i++){const o=this.pe(n,s,i);this.we(o)}}we(t){const e=Math.floor(t/8),n=t%8;this.bitmap[e]|=1<<n}}class ne extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sn{constructor(t,e,n,s,i){this.snapshotVersion=t,this.targetChanges=e,this.targetMismatches=n,this.documentUpdates=s,this.resolvedLimboDocuments=i}static createSynthesizedRemoteEventForCurrentChange(t,e,n){const s=new Map;return s.set(t,Te.createSynthesizedTargetChangeForCurrentChange(t,e,n)),new sn(I.min(),s,new k(R),ft(),V())}}class Te{constructor(t,e,n,s,i){this.resumeToken=t,this.current=e,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(t,e,n){return new Te(n,e,V(),V(),V())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fe{constructor(t,e,n,s){this.Se=t,this.removedTargetIds=e,this.key=n,this.be=s}}class ci{constructor(t,e){this.targetId=t,this.De=e}}class li{constructor(t,e,n=G.EMPTY_BYTE_STRING,s=null){this.state=t,this.targetIds=e,this.resumeToken=n,this.cause=s}}class Xr{constructor(){this.ve=0,this.Ce=Zr(),this.Fe=G.EMPTY_BYTE_STRING,this.Me=!1,this.xe=!0}get current(){return this.Me}get resumeToken(){return this.Fe}get Oe(){return this.ve!==0}get Ne(){return this.xe}Be(t){t.approximateByteSize()>0&&(this.xe=!0,this.Fe=t)}Le(){let t=V(),e=V(),n=V();return this.Ce.forEach(((s,i)=>{switch(i){case 0:t=t.add(s);break;case 2:e=e.add(s);break;case 1:n=n.add(s);break;default:E(38017,{changeType:i})}})),new Te(this.Fe,this.Me,t,e,n)}ke(){this.xe=!1,this.Ce=Zr()}qe(t,e){this.xe=!0,this.Ce=this.Ce.insert(t,e)}Qe(t){this.xe=!0,this.Ce=this.Ce.remove(t)}$e(){this.ve+=1}Ue(){this.ve-=1,S(this.ve>=0,3241,{ve:this.ve})}Ke(){this.xe=!0,this.Me=!0}}class Ta{constructor(t){this.We=t,this.Ge=new Map,this.ze=ft(),this.je=be(),this.Je=be(),this.He=new k(R)}Ye(t){for(const e of t.Se)t.be&&t.be.isFoundDocument()?this.Ze(e,t.be):this.Xe(e,t.key,t.be);for(const e of t.removedTargetIds)this.Xe(e,t.key,t.be)}et(t){this.forEachTarget(t,(e=>{const n=this.tt(e);switch(t.state){case 0:this.nt(e)&&n.Be(t.resumeToken);break;case 1:n.Ue(),n.Oe||n.ke(),n.Be(t.resumeToken);break;case 2:n.Ue(),n.Oe||this.removeTarget(e);break;case 3:this.nt(e)&&(n.Ke(),n.Be(t.resumeToken));break;case 4:this.nt(e)&&(this.rt(e),n.Be(t.resumeToken));break;default:E(56790,{state:t.state})}}))}forEachTarget(t,e){t.targetIds.length>0?t.targetIds.forEach(e):this.Ge.forEach(((n,s)=>{this.nt(s)&&e(s)}))}it(t){const e=t.targetId,n=t.De.count,s=this.st(e);if(s){const i=s.target;if(Rn(i))if(n===0){const o=new y(i.path);this.Xe(e,o,z.newNoDocument(o,I.min()))}else S(n===1,20013,{expectedCount:n});else{const o=this.ot(e);if(o!==n){const a=this._t(t),u=a?this.ut(a,t,o):1;if(u!==0){this.rt(e);const c=u===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.He=this.He.insert(e,c)}}}}}_t(t){const e=t.De.unchangedNames;if(!e||!e.bits)return null;const{bits:{bitmap:n="",padding:s=0},hashCount:i=0}=e;let o,a;try{o=It(n).toUint8Array()}catch(u){if(u instanceof ks)return yt("Decoding the base64 bloom filter in existence filter failed ("+u.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw u}try{a=new Qn(o,s,i)}catch(u){return yt(u instanceof ne?"BloomFilter error: ":"Applying bloom filter failed: ",u),null}return a.fe===0?null:a}ut(t,e,n){return e.De.count===n-this.ht(t,e.targetId)?0:2}ht(t,e){const n=this.We.getRemoteKeysForTarget(e);let s=0;return n.forEach((i=>{const o=this.We.lt(),a=`projects/${o.projectId}/databases/${o.database}/documents/${i.path.canonicalString()}`;t.mightContain(a)||(this.Xe(e,i,null),s++)})),s}Pt(t){const e=new Map;this.Ge.forEach(((i,o)=>{const a=this.st(o);if(a){if(i.current&&Rn(a.target)){const u=new y(a.target.path);this.Tt(u).has(o)||this.It(o,u)||this.Xe(o,u,z.newNoDocument(u,t))}i.Ne&&(e.set(o,i.Le()),i.ke())}}));let n=V();this.Je.forEach(((i,o)=>{let a=!0;o.forEachWhile((u=>{const c=this.st(u);return!c||c.purpose==="TargetPurposeLimboResolution"||(a=!1,!1)})),a&&(n=n.add(i))})),this.ze.forEach(((i,o)=>o.setReadTime(t)));const s=new sn(t,e,this.He,this.ze,n);return this.ze=ft(),this.je=be(),this.Je=be(),this.He=new k(R),s}Ze(t,e){if(!this.nt(t))return;const n=this.It(t,e.key)?2:0;this.tt(t).qe(e.key,n),this.ze=this.ze.insert(e.key,e),this.je=this.je.insert(e.key,this.Tt(e.key).add(t)),this.Je=this.Je.insert(e.key,this.dt(e.key).add(t))}Xe(t,e,n){if(!this.nt(t))return;const s=this.tt(t);this.It(t,e)?s.qe(e,1):s.Qe(e),this.Je=this.Je.insert(e,this.dt(e).delete(t)),this.Je=this.Je.insert(e,this.dt(e).add(t)),n&&(this.ze=this.ze.insert(e,n))}removeTarget(t){this.Ge.delete(t)}ot(t){const e=this.tt(t).Le();return this.We.getRemoteKeysForTarget(t).size+e.addedDocuments.size-e.removedDocuments.size}$e(t){this.tt(t).$e()}tt(t){let e=this.Ge.get(t);return e||(e=new Xr,this.Ge.set(t,e)),e}dt(t){let e=this.Je.get(t);return e||(e=new q(R),this.Je=this.Je.insert(t,e)),e}Tt(t){let e=this.je.get(t);return e||(e=new q(R),this.je=this.je.insert(t,e)),e}nt(t){const e=this.st(t)!==null;return e||g("WatchChangeAggregator","Detected inactive target",t),e}st(t){const e=this.Ge.get(t);return e&&e.Oe?null:this.We.Et(t)}rt(t){this.Ge.set(t,new Xr),this.We.getRemoteKeysForTarget(t).forEach((e=>{this.Xe(t,e,null)}))}It(t,e){return this.We.getRemoteKeysForTarget(t).has(e)}}function be(){return new k(y.comparator)}function Zr(){return new k(y.comparator)}const Ia={asc:"ASCENDING",desc:"DESCENDING"},Aa={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},wa={and:"AND",or:"OR"};class va{constructor(t,e){this.databaseId=t,this.useProto3Json=e}}function Sn(r,t){return r.useProto3Json||ge(t)?t:{value:t}}function ze(r,t){return r.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function hi(r,t){return r.useProto3Json?t.toBase64():t.toUint8Array()}function Ra(r,t){return ze(r,t.toTimestamp())}function tt(r){return S(!!r,49232),I.fromTimestamp((function(e){const n=Tt(e);return new b(n.seconds,n.nanos)})(r))}function Kn(r,t){return Cn(r,t).canonicalString()}function Cn(r,t){const e=(function(s){return new C(["projects",s.projectId,"databases",s.database])})(r).child("documents");return t===void 0?e:e.child(t)}function di(r){const t=C.fromString(r);return S(yi(t),10190,{key:t.toString()}),t}function $e(r,t){return Kn(r.databaseId,t.path)}function ae(r,t){const e=di(t);if(e.get(1)!==r.databaseId.projectId)throw new p(f.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+e.get(1)+" vs "+r.databaseId.projectId);if(e.get(3)!==r.databaseId.database)throw new p(f.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+e.get(3)+" vs "+r.databaseId.database);return new y(mi(e))}function fi(r,t){return Kn(r.databaseId,t)}function Va(r){const t=di(r);return t.length===4?C.emptyPath():mi(t)}function bn(r){return new C(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function mi(r){return S(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function ts(r,t,e){return{name:$e(r,t),fields:e.value.mapValue.fields}}function Pa(r,t){return"found"in t?(function(n,s){S(!!s.found,43571),s.found.name,s.found.updateTime;const i=ae(n,s.found.name),o=tt(s.found.updateTime),a=s.found.createTime?tt(s.found.createTime):I.min(),u=new Y({mapValue:{fields:s.found.fields}});return z.newFoundDocument(i,o,a,u)})(r,t):"missing"in t?(function(n,s){S(!!s.missing,3894),S(!!s.readTime,22933);const i=ae(n,s.missing),o=tt(s.readTime);return z.newNoDocument(i,o)})(r,t):E(7234,{result:t})}function Sa(r,t){let e;if("targetChange"in t){t.targetChange;const n=(function(c){return c==="NO_CHANGE"?0:c==="ADD"?1:c==="REMOVE"?2:c==="CURRENT"?3:c==="RESET"?4:E(39313,{state:c})})(t.targetChange.targetChangeType||"NO_CHANGE"),s=t.targetChange.targetIds||[],i=(function(c,l){return c.useProto3Json?(S(l===void 0||typeof l=="string",58123),G.fromBase64String(l||"")):(S(l===void 0||l instanceof Buffer||l instanceof Uint8Array,16193),G.fromUint8Array(l||new Uint8Array))})(r,t.targetChange.resumeToken),o=t.targetChange.cause,a=o&&(function(c){const l=c.code===void 0?f.UNKNOWN:ui(c.code);return new p(l,c.message||"")})(o);e=new li(n,s,i,a||null)}else if("documentChange"in t){t.documentChange;const n=t.documentChange;n.document,n.document.name,n.document.updateTime;const s=ae(r,n.document.name),i=tt(n.document.updateTime),o=n.document.createTime?tt(n.document.createTime):I.min(),a=new Y({mapValue:{fields:n.document.fields}}),u=z.newFoundDocument(s,i,o,a),c=n.targetIds||[],l=n.removedTargetIds||[];e=new Fe(c,l,u.key,u)}else if("documentDelete"in t){t.documentDelete;const n=t.documentDelete;n.document;const s=ae(r,n.document),i=n.readTime?tt(n.readTime):I.min(),o=z.newNoDocument(s,i),a=n.removedTargetIds||[];e=new Fe([],a,o.key,o)}else if("documentRemove"in t){t.documentRemove;const n=t.documentRemove;n.document;const s=ae(r,n.document),i=n.removedTargetIds||[];e=new Fe([],i,s,null)}else{if(!("filter"in t))return E(11601,{At:t});{t.filter;const n=t.filter;n.targetId;const{count:s=0,unchangedNames:i}=n,o=new ya(s,i),a=n.targetId;e=new ci(a,o)}}return e}function _i(r,t){let e;if(t instanceof ye)e={update:ts(r,t.key,t.value)};else if(t instanceof Ee)e={delete:$e(r,t.key)};else if(t instanceof Vt)e={update:ts(r,t.key,t.data),updateMask:Ma(t.fieldMask)};else{if(!(t instanceof oi))return E(16599,{Rt:t.type});e={verify:$e(r,t.key)}}return t.fieldTransforms.length>0&&(e.updateTransforms=t.fieldTransforms.map((n=>(function(i,o){const a=o.transform;if(a instanceof fe)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(a instanceof me)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:a.elements}};if(a instanceof _e)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:a.elements}};if(a instanceof Be)return{fieldPath:o.field.canonicalString(),increment:a.Ee};throw E(20930,{transform:o.transform})})(0,n)))),t.precondition.isNone||(e.currentDocument=(function(s,i){return i.updateTime!==void 0?{updateTime:Ra(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:E(27497)})(r,t.precondition)),e}function Ca(r,t){return r&&r.length>0?(S(t!==void 0,14353),r.map((e=>(function(s,i){let o=s.updateTime?tt(s.updateTime):tt(i);return o.isEqual(I.min())&&(o=tt(i)),new fa(o,s.transformResults||[])})(e,t)))):[]}function ba(r,t){return{documents:[fi(r,t.path)]}}function Da(r,t){const e={structuredQuery:{}},n=t.path;let s;t.collectionGroup!==null?(s=n,e.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(s=n.popLast(),e.structuredQuery.from=[{collectionId:n.lastSegment()}]),e.parent=fi(r,s);const i=(function(c){if(c.length!==0)return gi(nt.create(c,"and"))})(t.filters);i&&(e.structuredQuery.where=i);const o=(function(c){if(c.length!==0)return c.map((l=>(function(d){return{field:Lt(d.field),direction:xa(d.dir)}})(l)))})(t.orderBy);o&&(e.structuredQuery.orderBy=o);const a=Sn(r,t.limit);return a!==null&&(e.structuredQuery.limit=a),t.startAt&&(e.structuredQuery.startAt=(function(c){return{before:c.inclusive,values:c.position}})(t.startAt)),t.endAt&&(e.structuredQuery.endAt=(function(c){return{before:!c.inclusive,values:c.position}})(t.endAt)),{Vt:e,parent:s}}function Na(r){let t=Va(r.parent);const e=r.structuredQuery,n=e.from?e.from.length:0;let s=null;if(n>0){S(n===1,65062);const l=e.from[0];l.allDescendants?s=l.collectionId:t=t.child(l.collectionId)}let i=[];e.where&&(i=(function(h){const d=pi(h);return d instanceof nt&&$s(d)?d.getFilters():[d]})(e.where));let o=[];e.orderBy&&(o=(function(h){return h.map((d=>(function(A){return new de(Ut(A.field),(function(T){switch(T){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(A.direction))})(d)))})(e.orderBy));let a=null;e.limit&&(a=(function(h){let d;return d=typeof h=="object"?h.value:h,ge(d)?null:d})(e.limit));let u=null;e.startAt&&(u=(function(h){const d=!!h.before,_=h.values||[];return new qe(_,d)})(e.startAt));let c=null;return e.endAt&&(c=(function(h){const d=!h.before,_=h.values||[];return new qe(_,d)})(e.endAt)),Zo(t,s,o,i,a,"F",u,c)}function ka(r,t){const e=(function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return E(28987,{purpose:s})}})(t.purpose);return e==null?null:{"goog-listen-tags":e}}function pi(r){return r.unaryFilter!==void 0?(function(e){switch(e.unaryFilter.op){case"IS_NAN":const n=Ut(e.unaryFilter.field);return M.create(n,"==",{doubleValue:NaN});case"IS_NULL":const s=Ut(e.unaryFilter.field);return M.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Ut(e.unaryFilter.field);return M.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=Ut(e.unaryFilter.field);return M.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return E(61313);default:return E(60726)}})(r):r.fieldFilter!==void 0?(function(e){return M.create(Ut(e.fieldFilter.field),(function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return E(58110);default:return E(50506)}})(e.fieldFilter.op),e.fieldFilter.value)})(r):r.compositeFilter!==void 0?(function(e){return nt.create(e.compositeFilter.filters.map((n=>pi(n))),(function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return E(1026)}})(e.compositeFilter.op))})(r):E(30097,{filter:r})}function xa(r){return Ia[r]}function Fa(r){return Aa[r]}function Oa(r){return wa[r]}function Lt(r){return{fieldPath:r.canonicalString()}}function Ut(r){return j.fromServerFormat(r.fieldPath)}function gi(r){return r instanceof M?(function(e){if(e.op==="=="){if(Br(e.value))return{unaryFilter:{field:Lt(e.field),op:"IS_NAN"}};if(qr(e.value))return{unaryFilter:{field:Lt(e.field),op:"IS_NULL"}}}else if(e.op==="!="){if(Br(e.value))return{unaryFilter:{field:Lt(e.field),op:"IS_NOT_NAN"}};if(qr(e.value))return{unaryFilter:{field:Lt(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Lt(e.field),op:Fa(e.op),value:e.value}}})(r):r instanceof nt?(function(e){const n=e.getFilters().map((s=>gi(s)));return n.length===1?n[0]:{compositeFilter:{op:Oa(e.op),filters:n}}})(r):E(54877,{filter:r})}function Ma(r){const t=[];return r.fields.forEach((e=>t.push(e.canonicalString()))),{fieldPaths:t}}function yi(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mt{constructor(t,e,n,s,i=I.min(),o=I.min(),a=G.EMPTY_BYTE_STRING,u=null){this.target=t,this.targetId=e,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=a,this.expectedCount=u}withSequenceNumber(t){return new mt(this.target,this.targetId,this.purpose,t,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(t,e){return new mt(this.target,this.targetId,this.purpose,this.sequenceNumber,e,this.lastLimboFreeSnapshotVersion,t,null)}withExpectedCount(t){return new mt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,t)}withLastLimboFreeSnapshotVersion(t){return new mt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,t,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class La{constructor(t){this.gt=t}}function Ua(r){const t=Na({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?Pn(t,t.limit,"L"):t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qa{constructor(){this.Dn=new Ba}addToCollectionParentIndex(t,e){return this.Dn.add(e),m.resolve()}getCollectionParents(t,e){return m.resolve(this.Dn.getEntries(e))}addFieldIndex(t,e){return m.resolve()}deleteFieldIndex(t,e){return m.resolve()}deleteAllFieldIndexes(t){return m.resolve()}createTargetIndexes(t,e){return m.resolve()}getDocumentsMatchingTarget(t,e){return m.resolve(null)}getIndexType(t,e){return m.resolve(0)}getFieldIndexes(t,e){return m.resolve([])}getNextCollectionGroupToUpdate(t){return m.resolve(null)}getMinOffset(t,e){return m.resolve(Et.min())}getMinOffsetFromCollectionGroup(t,e){return m.resolve(Et.min())}updateCollectionGroup(t,e,n){return m.resolve()}updateIndexEntries(t,e){return m.resolve()}}class Ba{constructor(){this.index={}}add(t){const e=t.lastSegment(),n=t.popLast(),s=this.index[e]||new q(C.comparator),i=!s.has(n);return this.index[e]=s.add(n),i}has(t){const e=t.lastSegment(),n=t.popLast(),s=this.index[e];return s&&s.has(n)}getEntries(t){return(this.index[t]||new q(C.comparator)).toArray()}}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const es={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Ei=41943040;class J{static withCacheSize(t){return new J(t,J.DEFAULT_COLLECTION_PERCENTILE,J.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(t,e,n){this.cacheSizeCollectionThreshold=t,this.percentileToCollect=e,this.maximumSequenceNumbersToCollect=n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */J.DEFAULT_COLLECTION_PERCENTILE=10,J.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,J.DEFAULT=new J(Ei,J.DEFAULT_COLLECTION_PERCENTILE,J.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),J.DISABLED=new J(-1,0,0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gt{constructor(t){this._r=t}next(){return this._r+=2,this._r}static ar(){return new Gt(0)}static ur(){return new Gt(-1)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ns="LruGarbageCollector",za=1048576;function rs([r,t],[e,n]){const s=R(r,e);return s===0?R(t,n):s}class $a{constructor(t){this.Tr=t,this.buffer=new q(rs),this.Ir=0}dr(){return++this.Ir}Er(t){const e=[t,this.dr()];if(this.buffer.size<this.Tr)this.buffer=this.buffer.add(e);else{const n=this.buffer.last();rs(e,n)<0&&(this.buffer=this.buffer.delete(n).add(e))}}get maxValue(){return this.buffer.last()[0]}}class ja{constructor(t,e,n){this.garbageCollector=t,this.asyncQueue=e,this.localStore=n,this.Ar=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Rr(6e4)}stop(){this.Ar&&(this.Ar.cancel(),this.Ar=null)}get started(){return this.Ar!==null}Rr(t){g(ns,`Garbage collection scheduled in ${t}ms`),this.Ar=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",t,(async()=>{this.Ar=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(e){Ht(e)?g(ns,"Ignoring IndexedDB error during garbage collection: ",e):await Wt(e)}await this.Rr(3e5)}))}}class Ga{constructor(t,e){this.Vr=t,this.params=e}calculateTargetCount(t,e){return this.Vr.mr(t).next((n=>Math.floor(e/100*n)))}nthSequenceNumber(t,e){if(e===0)return m.resolve(Je.ue);const n=new $a(e);return this.Vr.forEachTarget(t,(s=>n.Er(s.sequenceNumber))).next((()=>this.Vr.gr(t,(s=>n.Er(s))))).next((()=>n.maxValue))}removeTargets(t,e,n){return this.Vr.removeTargets(t,e,n)}removeOrphanedDocuments(t,e){return this.Vr.removeOrphanedDocuments(t,e)}collect(t,e){return this.params.cacheSizeCollectionThreshold===-1?(g("LruGarbageCollector","Garbage collection skipped; disabled"),m.resolve(es)):this.getCacheSize(t).next((n=>n<this.params.cacheSizeCollectionThreshold?(g("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),es):this.pr(t,e)))}getCacheSize(t){return this.Vr.getCacheSize(t)}pr(t,e){let n,s,i,o,a,u,c;const l=Date.now();return this.calculateTargetCount(t,this.params.percentileToCollect).next((h=>(h>this.params.maximumSequenceNumbersToCollect?(g("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${h}`),s=this.params.maximumSequenceNumbersToCollect):s=h,o=Date.now(),this.nthSequenceNumber(t,s)))).next((h=>(n=h,a=Date.now(),this.removeTargets(t,n,e)))).next((h=>(i=h,u=Date.now(),this.removeOrphanedDocuments(t,n)))).next((h=>(c=Date.now(),Ot()<=ht.DEBUG&&g("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-l}ms
	Determined least recently used ${s} in `+(a-o)+`ms
	Removed ${i} targets in `+(u-a)+`ms
	Removed ${h} documents in `+(c-u)+`ms
Total Duration: ${c-l}ms`),m.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:h}))))}}function Qa(r,t){return new Ga(r,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ka{constructor(){this.changes=new kt((t=>t.toString()),((t,e)=>t.isEqual(e))),this.changesApplied=!1}addEntry(t){this.assertNotApplied(),this.changes.set(t.key,t)}removeEntry(t,e){this.assertNotApplied(),this.changes.set(t,z.newInvalidDocument(t).setReadTime(e))}getEntry(t,e){this.assertNotApplied();const n=this.changes.get(e);return n!==void 0?m.resolve(n):this.getFromCache(t,e)}getEntries(t,e){return this.getAllFromCache(t,e)}apply(t){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(t)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wa{constructor(t,e){this.overlayedDocument=t,this.mutatedFields=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ha{constructor(t,e,n,s){this.remoteDocumentCache=t,this.mutationQueue=e,this.documentOverlayCache=n,this.indexManager=s}getDocument(t,e){let n=null;return this.documentOverlayCache.getOverlay(t,e).next((s=>(n=s,this.remoteDocumentCache.getEntry(t,e)))).next((s=>(n!==null&&oe(n.mutation,s,Z.empty(),b.now()),s)))}getDocuments(t,e){return this.remoteDocumentCache.getEntries(t,e).next((n=>this.getLocalViewOfDocuments(t,n,V()).next((()=>n))))}getLocalViewOfDocuments(t,e,n=V()){const s=St();return this.populateOverlays(t,s,e).next((()=>this.computeViews(t,e,s,n).next((i=>{let o=ee();return i.forEach(((a,u)=>{o=o.insert(a,u.overlayedDocument)})),o}))))}getOverlayedDocuments(t,e){const n=St();return this.populateOverlays(t,n,e).next((()=>this.computeViews(t,e,n,V())))}populateOverlays(t,e,n){const s=[];return n.forEach((i=>{e.has(i)||s.push(i)})),this.documentOverlayCache.getOverlays(t,s).next((i=>{i.forEach(((o,a)=>{e.set(o,a)}))}))}computeViews(t,e,n,s){let i=ft();const o=ie(),a=(function(){return ie()})();return e.forEach(((u,c)=>{const l=n.get(c.key);s.has(c.key)&&(l===void 0||l.mutation instanceof Vt)?i=i.insert(c.key,c):l!==void 0?(o.set(c.key,l.mutation.getFieldMask()),oe(l.mutation,c,l.mutation.getFieldMask(),b.now())):o.set(c.key,Z.empty())})),this.recalculateAndSaveOverlays(t,i).next((u=>(u.forEach(((c,l)=>o.set(c,l))),e.forEach(((c,l)=>{var h;return a.set(c,new Wa(l,(h=o.get(c))!==null&&h!==void 0?h:null))})),a)))}recalculateAndSaveOverlays(t,e){const n=ie();let s=new k(((o,a)=>o-a)),i=V();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(t,e).next((o=>{for(const a of o)a.keys().forEach((u=>{const c=e.get(u);if(c===null)return;let l=n.get(u)||Z.empty();l=a.applyToLocalView(c,l),n.set(u,l);const h=(s.get(a.batchId)||V()).add(u);s=s.insert(a.batchId,h)}))})).next((()=>{const o=[],a=s.getReverseIterator();for(;a.hasNext();){const u=a.getNext(),c=u.key,l=u.value,h=Xs();l.forEach((d=>{if(!i.has(d)){const _=si(e.get(d),n.get(d));_!==null&&h.set(d,_),i=i.add(d)}})),o.push(this.documentOverlayCache.saveOverlays(t,c,h))}return m.waitFor(o)})).next((()=>n))}recalculateAndSaveOverlaysForDocumentKeys(t,e){return this.remoteDocumentCache.getEntries(t,e).next((n=>this.recalculateAndSaveOverlays(t,n)))}getDocumentsMatchingQuery(t,e,n,s){return(function(o){return y.isDocumentKey(o.path)&&o.collectionGroup===null&&o.filters.length===0})(e)?this.getDocumentsMatchingDocumentQuery(t,e.path):Ks(e)?this.getDocumentsMatchingCollectionGroupQuery(t,e,n,s):this.getDocumentsMatchingCollectionQuery(t,e,n,s)}getNextDocuments(t,e,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(t,e,n,s).next((i=>{const o=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(t,e,n.largestBatchId,s-i.size):m.resolve(St());let a=ue,u=i;return o.next((c=>m.forEach(c,((l,h)=>(a<h.largestBatchId&&(a=h.largestBatchId),i.get(l)?m.resolve():this.remoteDocumentCache.getEntry(t,l).next((d=>{u=u.insert(l,d)}))))).next((()=>this.populateOverlays(t,c,i))).next((()=>this.computeViews(t,u,c,V()))).next((l=>({batchId:a,changes:Js(l)})))))}))}getDocumentsMatchingDocumentQuery(t,e){return this.getDocument(t,new y(e)).next((n=>{let s=ee();return n.isFoundDocument()&&(s=s.insert(n.key,n)),s}))}getDocumentsMatchingCollectionGroupQuery(t,e,n,s){const i=e.collectionGroup;let o=ee();return this.indexManager.getCollectionParents(t,i).next((a=>m.forEach(a,(u=>{const c=(function(h,d){return new Yt(d,null,h.explicitOrderBy.slice(),h.filters.slice(),h.limit,h.limitType,h.startAt,h.endAt)})(e,u.child(i));return this.getDocumentsMatchingCollectionQuery(t,c,n,s).next((l=>{l.forEach(((h,d)=>{o=o.insert(h,d)}))}))})).next((()=>o))))}getDocumentsMatchingCollectionQuery(t,e,n,s){let i;return this.documentOverlayCache.getOverlaysForCollection(t,e.path,n.largestBatchId).next((o=>(i=o,this.remoteDocumentCache.getDocumentsMatchingQuery(t,e,n,i,s)))).next((o=>{i.forEach(((u,c)=>{const l=c.getKey();o.get(l)===null&&(o=o.insert(l,z.newInvalidDocument(l)))}));let a=ee();return o.forEach(((u,c)=>{const l=i.get(u);l!==void 0&&oe(l.mutation,c,Z.empty(),b.now()),en(e,c)&&(a=a.insert(u,c))})),a}))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ya{constructor(t){this.serializer=t,this.Br=new Map,this.Lr=new Map}getBundleMetadata(t,e){return m.resolve(this.Br.get(e))}saveBundleMetadata(t,e){return this.Br.set(e.id,(function(s){return{id:s.id,version:s.version,createTime:tt(s.createTime)}})(e)),m.resolve()}getNamedQuery(t,e){return m.resolve(this.Lr.get(e))}saveNamedQuery(t,e){return this.Lr.set(e.name,(function(s){return{name:s.name,query:Ua(s.bundledQuery),readTime:tt(s.readTime)}})(e)),m.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ja{constructor(){this.overlays=new k(y.comparator),this.kr=new Map}getOverlay(t,e){return m.resolve(this.overlays.get(e))}getOverlays(t,e){const n=St();return m.forEach(e,(s=>this.getOverlay(t,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}saveOverlays(t,e,n){return n.forEach(((s,i)=>{this.wt(t,e,i)})),m.resolve()}removeOverlaysForBatchId(t,e,n){const s=this.kr.get(n);return s!==void 0&&(s.forEach((i=>this.overlays=this.overlays.remove(i))),this.kr.delete(n)),m.resolve()}getOverlaysForCollection(t,e,n){const s=St(),i=e.length+1,o=new y(e.child("")),a=this.overlays.getIteratorFrom(o);for(;a.hasNext();){const u=a.getNext().value,c=u.getKey();if(!e.isPrefixOf(c.path))break;c.path.length===i&&u.largestBatchId>n&&s.set(u.getKey(),u)}return m.resolve(s)}getOverlaysForCollectionGroup(t,e,n,s){let i=new k(((c,l)=>c-l));const o=this.overlays.getIterator();for(;o.hasNext();){const c=o.getNext().value;if(c.getKey().getCollectionGroup()===e&&c.largestBatchId>n){let l=i.get(c.largestBatchId);l===null&&(l=St(),i=i.insert(c.largestBatchId,l)),l.set(c.getKey(),c)}}const a=St(),u=i.getIterator();for(;u.hasNext()&&(u.getNext().value.forEach(((c,l)=>a.set(c,l))),!(a.size()>=s)););return m.resolve(a)}wt(t,e,n){const s=this.overlays.get(n.key);if(s!==null){const o=this.kr.get(s.largestBatchId).delete(n.key);this.kr.set(s.largestBatchId,o)}this.overlays=this.overlays.insert(n.key,new ga(e,n));let i=this.kr.get(e);i===void 0&&(i=V(),this.kr.set(e,i)),this.kr.set(e,i.add(n.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xa{constructor(){this.sessionToken=G.EMPTY_BYTE_STRING}getSessionToken(t){return m.resolve(this.sessionToken)}setSessionToken(t,e){return this.sessionToken=e,m.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wn{constructor(){this.qr=new q(B.Qr),this.$r=new q(B.Ur)}isEmpty(){return this.qr.isEmpty()}addReference(t,e){const n=new B(t,e);this.qr=this.qr.add(n),this.$r=this.$r.add(n)}Kr(t,e){t.forEach((n=>this.addReference(n,e)))}removeReference(t,e){this.Wr(new B(t,e))}Gr(t,e){t.forEach((n=>this.removeReference(n,e)))}zr(t){const e=new y(new C([])),n=new B(e,t),s=new B(e,t+1),i=[];return this.$r.forEachInRange([n,s],(o=>{this.Wr(o),i.push(o.key)})),i}jr(){this.qr.forEach((t=>this.Wr(t)))}Wr(t){this.qr=this.qr.delete(t),this.$r=this.$r.delete(t)}Jr(t){const e=new y(new C([])),n=new B(e,t),s=new B(e,t+1);let i=V();return this.$r.forEachInRange([n,s],(o=>{i=i.add(o.key)})),i}containsKey(t){const e=new B(t,0),n=this.qr.firstAfterOrEqual(e);return n!==null&&t.isEqual(n.key)}}class B{constructor(t,e){this.key=t,this.Hr=e}static Qr(t,e){return y.comparator(t.key,e.key)||R(t.Hr,e.Hr)}static Ur(t,e){return R(t.Hr,e.Hr)||y.comparator(t.key,e.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Za{constructor(t,e){this.indexManager=t,this.referenceDelegate=e,this.mutationQueue=[],this.er=1,this.Yr=new q(B.Qr)}checkEmpty(t){return m.resolve(this.mutationQueue.length===0)}addMutationBatch(t,e,n,s){const i=this.er;this.er++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new pa(i,e,n,s);this.mutationQueue.push(o);for(const a of s)this.Yr=this.Yr.add(new B(a.key,i)),this.indexManager.addToCollectionParentIndex(t,a.key.path.popLast());return m.resolve(o)}lookupMutationBatch(t,e){return m.resolve(this.Zr(e))}getNextMutationBatchAfterBatchId(t,e){const n=e+1,s=this.Xr(n),i=s<0?0:s;return m.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return m.resolve(this.mutationQueue.length===0?Un:this.er-1)}getAllMutationBatches(t){return m.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(t,e){const n=new B(e,0),s=new B(e,Number.POSITIVE_INFINITY),i=[];return this.Yr.forEachInRange([n,s],(o=>{const a=this.Zr(o.Hr);i.push(a)})),m.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(t,e){let n=new q(R);return e.forEach((s=>{const i=new B(s,0),o=new B(s,Number.POSITIVE_INFINITY);this.Yr.forEachInRange([i,o],(a=>{n=n.add(a.Hr)}))})),m.resolve(this.ei(n))}getAllMutationBatchesAffectingQuery(t,e){const n=e.path,s=n.length+1;let i=n;y.isDocumentKey(i)||(i=i.child(""));const o=new B(new y(i),0);let a=new q(R);return this.Yr.forEachWhile((u=>{const c=u.key.path;return!!n.isPrefixOf(c)&&(c.length===s&&(a=a.add(u.Hr)),!0)}),o),m.resolve(this.ei(a))}ei(t){const e=[];return t.forEach((n=>{const s=this.Zr(n);s!==null&&e.push(s)})),e}removeMutationBatch(t,e){S(this.ti(e.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.Yr;return m.forEach(e.mutations,(s=>{const i=new B(s.key,e.batchId);return n=n.delete(i),this.referenceDelegate.markPotentiallyOrphaned(t,s.key)})).next((()=>{this.Yr=n}))}rr(t){}containsKey(t,e){const n=new B(e,0),s=this.Yr.firstAfterOrEqual(n);return m.resolve(e.isEqual(s&&s.key))}performConsistencyCheck(t){return this.mutationQueue.length,m.resolve()}ti(t,e){return this.Xr(t)}Xr(t){return this.mutationQueue.length===0?0:t-this.mutationQueue[0].batchId}Zr(t){const e=this.Xr(t);return e<0||e>=this.mutationQueue.length?null:this.mutationQueue[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tu{constructor(t){this.ni=t,this.docs=(function(){return new k(y.comparator)})(),this.size=0}setIndexManager(t){this.indexManager=t}addEntry(t,e){const n=e.key,s=this.docs.get(n),i=s?s.size:0,o=this.ni(e);return this.docs=this.docs.insert(n,{document:e.mutableCopy(),size:o}),this.size+=o-i,this.indexManager.addToCollectionParentIndex(t,n.path.popLast())}removeEntry(t){const e=this.docs.get(t);e&&(this.docs=this.docs.remove(t),this.size-=e.size)}getEntry(t,e){const n=this.docs.get(e);return m.resolve(n?n.document.mutableCopy():z.newInvalidDocument(e))}getEntries(t,e){let n=ft();return e.forEach((s=>{const i=this.docs.get(s);n=n.insert(s,i?i.document.mutableCopy():z.newInvalidDocument(s))})),m.resolve(n)}getDocumentsMatchingQuery(t,e,n,s){let i=ft();const o=e.path,a=new y(o.child("__id-9223372036854775808__")),u=this.docs.getIteratorFrom(a);for(;u.hasNext();){const{key:c,value:{document:l}}=u.getNext();if(!o.isPrefixOf(c.path))break;c.path.length>o.length+1||Do(bo(l),n)<=0||(s.has(l.key)||en(e,l))&&(i=i.insert(l.key,l.mutableCopy()))}return m.resolve(i)}getAllFromCollectionGroup(t,e,n,s){E(9500)}ri(t,e){return m.forEach(this.docs,(n=>e(n)))}newChangeBuffer(t){return new eu(this)}getSize(t){return m.resolve(this.size)}}class eu extends Ka{constructor(t){super(),this.Or=t}applyChanges(t){const e=[];return this.changes.forEach(((n,s)=>{s.isValidDocument()?e.push(this.Or.addEntry(t,s)):this.Or.removeEntry(n)})),m.waitFor(e)}getFromCache(t,e){return this.Or.getEntry(t,e)}getAllFromCache(t,e){return this.Or.getEntries(t,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nu{constructor(t){this.persistence=t,this.ii=new kt((e=>zn(e)),$n),this.lastRemoteSnapshotVersion=I.min(),this.highestTargetId=0,this.si=0,this.oi=new Wn,this.targetCount=0,this._i=Gt.ar()}forEachTarget(t,e){return this.ii.forEach(((n,s)=>e(s))),m.resolve()}getLastRemoteSnapshotVersion(t){return m.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(t){return m.resolve(this.si)}allocateTargetId(t){return this.highestTargetId=this._i.next(),m.resolve(this.highestTargetId)}setTargetsMetadata(t,e,n){return n&&(this.lastRemoteSnapshotVersion=n),e>this.si&&(this.si=e),m.resolve()}hr(t){this.ii.set(t.target,t);const e=t.targetId;e>this.highestTargetId&&(this._i=new Gt(e),this.highestTargetId=e),t.sequenceNumber>this.si&&(this.si=t.sequenceNumber)}addTargetData(t,e){return this.hr(e),this.targetCount+=1,m.resolve()}updateTargetData(t,e){return this.hr(e),m.resolve()}removeTargetData(t,e){return this.ii.delete(e.target),this.oi.zr(e.targetId),this.targetCount-=1,m.resolve()}removeTargets(t,e,n){let s=0;const i=[];return this.ii.forEach(((o,a)=>{a.sequenceNumber<=e&&n.get(a.targetId)===null&&(this.ii.delete(o),i.push(this.removeMatchingKeysForTargetId(t,a.targetId)),s++)})),m.waitFor(i).next((()=>s))}getTargetCount(t){return m.resolve(this.targetCount)}getTargetData(t,e){const n=this.ii.get(e)||null;return m.resolve(n)}addMatchingKeys(t,e,n){return this.oi.Kr(e,n),m.resolve()}removeMatchingKeys(t,e,n){this.oi.Gr(e,n);const s=this.persistence.referenceDelegate,i=[];return s&&e.forEach((o=>{i.push(s.markPotentiallyOrphaned(t,o))})),m.waitFor(i)}removeMatchingKeysForTargetId(t,e){return this.oi.zr(e),m.resolve()}getMatchingKeysForTargetId(t,e){const n=this.oi.Jr(e);return m.resolve(n)}containsKey(t,e){return m.resolve(this.oi.containsKey(e))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ti{constructor(t,e){this.ai={},this.overlays={},this.ui=new Je(0),this.ci=!1,this.ci=!0,this.li=new Xa,this.referenceDelegate=t(this),this.hi=new nu(this),this.indexManager=new qa,this.remoteDocumentCache=(function(s){return new tu(s)})((n=>this.referenceDelegate.Pi(n))),this.serializer=new La(e),this.Ti=new Ya(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.ci=!1,Promise.resolve()}get started(){return this.ci}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(t){return this.indexManager}getDocumentOverlayCache(t){let e=this.overlays[t.toKey()];return e||(e=new Ja,this.overlays[t.toKey()]=e),e}getMutationQueue(t,e){let n=this.ai[t.toKey()];return n||(n=new Za(e,this.referenceDelegate),this.ai[t.toKey()]=n),n}getGlobalsCache(){return this.li}getTargetCache(){return this.hi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ti}runTransaction(t,e,n){g("MemoryPersistence","Starting transaction:",t);const s=new ru(this.ui.next());return this.referenceDelegate.Ii(),n(s).next((i=>this.referenceDelegate.di(s).next((()=>i)))).toPromise().then((i=>(s.raiseOnCommittedEvent(),i)))}Ei(t,e){return m.or(Object.values(this.ai).map((n=>()=>n.containsKey(t,e))))}}class ru extends ko{constructor(t){super(),this.currentSequenceNumber=t}}class Hn{constructor(t){this.persistence=t,this.Ai=new Wn,this.Ri=null}static Vi(t){return new Hn(t)}get mi(){if(this.Ri)return this.Ri;throw E(60996)}addReference(t,e,n){return this.Ai.addReference(n,e),this.mi.delete(n.toString()),m.resolve()}removeReference(t,e,n){return this.Ai.removeReference(n,e),this.mi.add(n.toString()),m.resolve()}markPotentiallyOrphaned(t,e){return this.mi.add(e.toString()),m.resolve()}removeTarget(t,e){this.Ai.zr(e.targetId).forEach((s=>this.mi.add(s.toString())));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(t,e.targetId).next((s=>{s.forEach((i=>this.mi.add(i.toString())))})).next((()=>n.removeTargetData(t,e)))}Ii(){this.Ri=new Set}di(t){const e=this.persistence.getRemoteDocumentCache().newChangeBuffer();return m.forEach(this.mi,(n=>{const s=y.fromPath(n);return this.fi(t,s).next((i=>{i||e.removeEntry(s,I.min())}))})).next((()=>(this.Ri=null,e.apply(t))))}updateLimboDocument(t,e){return this.fi(t,e).next((n=>{n?this.mi.delete(e.toString()):this.mi.add(e.toString())}))}Pi(t){return 0}fi(t,e){return m.or([()=>m.resolve(this.Ai.containsKey(e)),()=>this.persistence.getTargetCache().containsKey(t,e),()=>this.persistence.Ei(t,e)])}}class je{constructor(t,e){this.persistence=t,this.gi=new kt((n=>Oo(n.path)),((n,s)=>n.isEqual(s))),this.garbageCollector=Qa(this,e)}static Vi(t,e){return new je(t,e)}Ii(){}di(t){return m.resolve()}forEachTarget(t,e){return this.persistence.getTargetCache().forEachTarget(t,e)}mr(t){const e=this.yr(t);return this.persistence.getTargetCache().getTargetCount(t).next((n=>e.next((s=>n+s))))}yr(t){let e=0;return this.gr(t,(n=>{e++})).next((()=>e))}gr(t,e){return m.forEach(this.gi,((n,s)=>this.Sr(t,n,s).next((i=>i?m.resolve():e(s)))))}removeTargets(t,e,n){return this.persistence.getTargetCache().removeTargets(t,e,n)}removeOrphanedDocuments(t,e){let n=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.ri(t,(o=>this.Sr(t,o,e).next((a=>{a||(n++,i.removeEntry(o,I.min()))})))).next((()=>i.apply(t))).next((()=>n))}markPotentiallyOrphaned(t,e){return this.gi.set(e,t.currentSequenceNumber),m.resolve()}removeTarget(t,e){const n=e.withSequenceNumber(t.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(t,n)}addReference(t,e,n){return this.gi.set(n,t.currentSequenceNumber),m.resolve()}removeReference(t,e,n){return this.gi.set(n,t.currentSequenceNumber),m.resolve()}updateLimboDocument(t,e){return this.gi.set(e,t.currentSequenceNumber),m.resolve()}Pi(t){let e=t.key.toString().length;return t.isFoundDocument()&&(e+=Ne(t.data.value)),e}Sr(t,e,n){return m.or([()=>this.persistence.Ei(t,e),()=>this.persistence.getTargetCache().containsKey(t,e),()=>{const s=this.gi.get(e);return m.resolve(s!==void 0&&s>n)}])}getCacheSize(t){return this.persistence.getRemoteDocumentCache().getSize(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yn{constructor(t,e,n,s){this.targetId=t,this.fromCache=e,this.Is=n,this.ds=s}static Es(t,e){let n=V(),s=V();for(const i of e.docChanges)switch(i.type){case 0:n=n.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new Yn(t,e.fromCache,n,s)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class su{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(t){this._documentReadCount+=t}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iu{constructor(){this.As=!1,this.Rs=!1,this.Vs=100,this.fs=(function(){return lo()?8:xo(ho())>0?6:4})()}initialize(t,e){this.gs=t,this.indexManager=e,this.As=!0}getDocumentsMatchingQuery(t,e,n,s){const i={result:null};return this.ps(t,e).next((o=>{i.result=o})).next((()=>{if(!i.result)return this.ys(t,e,s,n).next((o=>{i.result=o}))})).next((()=>{if(i.result)return;const o=new su;return this.ws(t,e,o).next((a=>{if(i.result=a,this.Rs)return this.Ss(t,e,o,a.size)}))})).next((()=>i.result))}Ss(t,e,n,s){return n.documentReadCount<this.Vs?(Ot()<=ht.DEBUG&&g("QueryEngine","SDK will not create cache indexes for query:",Mt(e),"since it only creates cache indexes for collection contains","more than or equal to",this.Vs,"documents"),m.resolve()):(Ot()<=ht.DEBUG&&g("QueryEngine","Query:",Mt(e),"scans",n.documentReadCount,"local documents and returns",s,"documents as results."),n.documentReadCount>this.fs*s?(Ot()<=ht.DEBUG&&g("QueryEngine","The SDK decides to create cache indexes for query:",Mt(e),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(t,ot(e))):m.resolve())}ps(t,e){if(Gr(e))return m.resolve(null);let n=ot(e);return this.indexManager.getIndexType(t,n).next((s=>s===0?null:(e.limit!==null&&s===1&&(e=Pn(e,null,"F"),n=ot(e)),this.indexManager.getDocumentsMatchingTarget(t,n).next((i=>{const o=V(...i);return this.gs.getDocuments(t,o).next((a=>this.indexManager.getMinOffset(t,n).next((u=>{const c=this.bs(e,a);return this.Ds(e,c,o,u.readTime)?this.ps(t,Pn(e,null,"F")):this.vs(t,c,e,u)}))))})))))}ys(t,e,n,s){return Gr(e)||s.isEqual(I.min())?m.resolve(null):this.gs.getDocuments(t,n).next((i=>{const o=this.bs(e,i);return this.Ds(e,o,n,s)?m.resolve(null):(Ot()<=ht.DEBUG&&g("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),Mt(e)),this.vs(t,o,e,Co(s,ue)).next((a=>a)))}))}bs(t,e){let n=new q(Hs(t));return e.forEach(((s,i)=>{en(t,i)&&(n=n.add(i))})),n}Ds(t,e,n,s){if(t.limit===null)return!1;if(n.size!==e.size)return!0;const i=t.limitType==="F"?e.last():e.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}ws(t,e,n){return Ot()<=ht.DEBUG&&g("QueryEngine","Using full collection scan to execute query:",Mt(e)),this.gs.getDocumentsMatchingQuery(t,e,Et.min(),n)}vs(t,e,n,s){return this.gs.getDocumentsMatchingQuery(t,n,s).next((i=>(e.forEach((o=>{i=i.insert(o.key,o)})),i)))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jn="LocalStore",ou=3e8;class au{constructor(t,e,n,s){this.persistence=t,this.Cs=e,this.serializer=s,this.Fs=new k(R),this.Ms=new kt((i=>zn(i)),$n),this.xs=new Map,this.Os=t.getRemoteDocumentCache(),this.hi=t.getTargetCache(),this.Ti=t.getBundleCache(),this.Ns(n)}Ns(t){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(t),this.indexManager=this.persistence.getIndexManager(t),this.mutationQueue=this.persistence.getMutationQueue(t,this.indexManager),this.localDocuments=new Ha(this.Os,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Os.setIndexManager(this.indexManager),this.Cs.initialize(this.localDocuments,this.indexManager)}collectGarbage(t){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(e=>t.collect(e,this.Fs)))}}function uu(r,t,e,n){return new au(r,t,e,n)}async function Ii(r,t){const e=w(r);return await e.persistence.runTransaction("Handle user change","readonly",(n=>{let s;return e.mutationQueue.getAllMutationBatches(n).next((i=>(s=i,e.Ns(t),e.mutationQueue.getAllMutationBatches(n)))).next((i=>{const o=[],a=[];let u=V();for(const c of s){o.push(c.batchId);for(const l of c.mutations)u=u.add(l.key)}for(const c of i){a.push(c.batchId);for(const l of c.mutations)u=u.add(l.key)}return e.localDocuments.getDocuments(n,u).next((c=>({Bs:c,removedBatchIds:o,addedBatchIds:a})))}))}))}function cu(r,t){const e=w(r);return e.persistence.runTransaction("Acknowledge batch","readwrite-primary",(n=>{const s=t.batch.keys(),i=e.Os.newChangeBuffer({trackRemovals:!0});return(function(a,u,c,l){const h=c.batch,d=h.keys();let _=m.resolve();return d.forEach((A=>{_=_.next((()=>l.getEntry(u,A))).next((v=>{const T=c.docVersions.get(A);S(T!==null,48541),v.version.compareTo(T)<0&&(h.applyToRemoteDocument(v,c),v.isValidDocument()&&(v.setReadTime(c.commitVersion),l.addEntry(v)))}))})),_.next((()=>a.mutationQueue.removeMutationBatch(u,h)))})(e,n,t,i).next((()=>i.apply(n))).next((()=>e.mutationQueue.performConsistencyCheck(n))).next((()=>e.documentOverlayCache.removeOverlaysForBatchId(n,s,t.batch.batchId))).next((()=>e.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,(function(a){let u=V();for(let c=0;c<a.mutationResults.length;++c)a.mutationResults[c].transformResults.length>0&&(u=u.add(a.batch.mutations[c].key));return u})(t)))).next((()=>e.localDocuments.getDocuments(n,s)))}))}function Ai(r){const t=w(r);return t.persistence.runTransaction("Get last remote snapshot version","readonly",(e=>t.hi.getLastRemoteSnapshotVersion(e)))}function lu(r,t){const e=w(r),n=t.snapshotVersion;let s=e.Fs;return e.persistence.runTransaction("Apply remote event","readwrite-primary",(i=>{const o=e.Os.newChangeBuffer({trackRemovals:!0});s=e.Fs;const a=[];t.targetChanges.forEach(((l,h)=>{const d=s.get(h);if(!d)return;a.push(e.hi.removeMatchingKeys(i,l.removedDocuments,h).next((()=>e.hi.addMatchingKeys(i,l.addedDocuments,h))));let _=d.withSequenceNumber(i.currentSequenceNumber);t.targetMismatches.get(h)!==null?_=_.withResumeToken(G.EMPTY_BYTE_STRING,I.min()).withLastLimboFreeSnapshotVersion(I.min()):l.resumeToken.approximateByteSize()>0&&(_=_.withResumeToken(l.resumeToken,n)),s=s.insert(h,_),(function(v,T,D){return v.resumeToken.approximateByteSize()===0||T.snapshotVersion.toMicroseconds()-v.snapshotVersion.toMicroseconds()>=ou?!0:D.addedDocuments.size+D.modifiedDocuments.size+D.removedDocuments.size>0})(d,_,l)&&a.push(e.hi.updateTargetData(i,_))}));let u=ft(),c=V();if(t.documentUpdates.forEach((l=>{t.resolvedLimboDocuments.has(l)&&a.push(e.persistence.referenceDelegate.updateLimboDocument(i,l))})),a.push(hu(i,o,t.documentUpdates).next((l=>{u=l.Ls,c=l.ks}))),!n.isEqual(I.min())){const l=e.hi.getLastRemoteSnapshotVersion(i).next((h=>e.hi.setTargetsMetadata(i,i.currentSequenceNumber,n)));a.push(l)}return m.waitFor(a).next((()=>o.apply(i))).next((()=>e.localDocuments.getLocalViewOfDocuments(i,u,c))).next((()=>u))})).then((i=>(e.Fs=s,i)))}function hu(r,t,e){let n=V(),s=V();return e.forEach((i=>n=n.add(i))),t.getEntries(r,n).next((i=>{let o=ft();return e.forEach(((a,u)=>{const c=i.get(a);u.isFoundDocument()!==c.isFoundDocument()&&(s=s.add(a)),u.isNoDocument()&&u.version.isEqual(I.min())?(t.removeEntry(a,u.readTime),o=o.insert(a,u)):!c.isValidDocument()||u.version.compareTo(c.version)>0||u.version.compareTo(c.version)===0&&c.hasPendingWrites?(t.addEntry(u),o=o.insert(a,u)):g(Jn,"Ignoring outdated watch update for ",a,". Current version:",c.version," Watch version:",u.version)})),{Ls:o,ks:s}}))}function du(r,t){const e=w(r);return e.persistence.runTransaction("Get next mutation batch","readonly",(n=>(t===void 0&&(t=Un),e.mutationQueue.getNextMutationBatchAfterBatchId(n,t))))}function fu(r,t){const e=w(r);return e.persistence.runTransaction("Allocate target","readwrite",(n=>{let s;return e.hi.getTargetData(n,t).next((i=>i?(s=i,m.resolve(s)):e.hi.allocateTargetId(n).next((o=>(s=new mt(t,o,"TargetPurposeListen",n.currentSequenceNumber),e.hi.addTargetData(n,s).next((()=>s)))))))})).then((n=>{const s=e.Fs.get(n.targetId);return(s===null||n.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(e.Fs=e.Fs.insert(n.targetId,n),e.Ms.set(t,n.targetId)),n}))}async function Dn(r,t,e){const n=w(r),s=n.Fs.get(t),i=e?"readwrite":"readwrite-primary";try{e||await n.persistence.runTransaction("Release target",i,(o=>n.persistence.referenceDelegate.removeTarget(o,s)))}catch(o){if(!Ht(o))throw o;g(Jn,`Failed to update sequence numbers for target ${t}: ${o}`)}n.Fs=n.Fs.remove(t),n.Ms.delete(s.target)}function ss(r,t,e){const n=w(r);let s=I.min(),i=V();return n.persistence.runTransaction("Execute query","readwrite",(o=>(function(u,c,l){const h=w(u),d=h.Ms.get(l);return d!==void 0?m.resolve(h.Fs.get(d)):h.hi.getTargetData(c,l)})(n,o,ot(t)).next((a=>{if(a)return s=a.lastLimboFreeSnapshotVersion,n.hi.getMatchingKeysForTargetId(o,a.targetId).next((u=>{i=u}))})).next((()=>n.Cs.getDocumentsMatchingQuery(o,t,e?s:I.min(),e?i:V()))).next((a=>(mu(n,ea(t),a),{documents:a,qs:i})))))}function mu(r,t,e){let n=r.xs.get(t)||I.min();e.forEach(((s,i)=>{i.readTime.compareTo(n)>0&&(n=i.readTime)})),r.xs.set(t,n)}class is{constructor(){this.activeTargetIds=aa()}Gs(t){this.activeTargetIds=this.activeTargetIds.add(t)}zs(t){this.activeTargetIds=this.activeTargetIds.delete(t)}Ws(){const t={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(t)}}class _u{constructor(){this.Fo=new is,this.Mo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(t){}updateMutationState(t,e,n){}addLocalQueryTarget(t,e=!0){return e&&this.Fo.Gs(t),this.Mo[t]||"not-current"}updateQueryState(t,e,n){this.Mo[t]=e}removeLocalQueryTarget(t){this.Fo.zs(t)}isLocalQueryTarget(t){return this.Fo.activeTargetIds.has(t)}clearQueryState(t){delete this.Mo[t]}getAllActiveQueryTargets(){return this.Fo.activeTargetIds}isActiveQueryTarget(t){return this.Fo.activeTargetIds.has(t)}start(){return this.Fo=new is,Promise.resolve()}handleUserChange(t,e,n){}setOnlineState(t){}shutdown(){}writeSequenceNumber(t){}notifyBundleLoaded(t){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pu{xo(t){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const os="ConnectivityMonitor";class as{constructor(){this.Oo=()=>this.No(),this.Bo=()=>this.Lo(),this.ko=[],this.qo()}xo(t){this.ko.push(t)}shutdown(){window.removeEventListener("online",this.Oo),window.removeEventListener("offline",this.Bo)}qo(){window.addEventListener("online",this.Oo),window.addEventListener("offline",this.Bo)}No(){g(os,"Network connectivity changed: AVAILABLE");for(const t of this.ko)t(0)}Lo(){g(os,"Network connectivity changed: UNAVAILABLE");for(const t of this.ko)t(1)}static C(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let De=null;function Nn(){return De===null?De=(function(){return 268435456+Math.round(2147483648*Math.random())})():De++,"0x"+De.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yn="RestConnection",gu={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class yu{get Qo(){return!1}constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;const e=t.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.$o=e+"://"+t.host,this.Uo=`projects/${n}/databases/${s}`,this.Ko=this.databaseId.database===Le?`project_id=${n}`:`project_id=${n}&database_id=${s}`}Wo(t,e,n,s,i){const o=Nn(),a=this.Go(t,e.toUriEncodedString());g(yn,`Sending RPC '${t}' ${o}:`,a,n);const u={"google-cloud-resource-prefix":this.Uo,"x-goog-request-params":this.Ko};this.zo(u,s,i);const{host:c}=new URL(a),l=Rs(c);return this.jo(t,a,u,n,l).then((h=>(g(yn,`Received RPC '${t}' ${o}: `,h),h)),(h=>{throw yt(yn,`RPC '${t}' ${o} failed with error: `,h,"url: ",a,"request:",n),h}))}Jo(t,e,n,s,i,o){return this.Wo(t,e,n,s,i)}zo(t,e,n){t["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+Kt})(),t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),e&&e.headers.forEach(((s,i)=>t[i]=s)),n&&n.headers.forEach(((s,i)=>t[i]=s))}Go(t,e){const n=gu[t];return`${this.$o}/v1/${e}:${n}`}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Eu{constructor(t){this.Ho=t.Ho,this.Yo=t.Yo}Zo(t){this.Xo=t}e_(t){this.t_=t}n_(t){this.r_=t}onMessage(t){this.i_=t}close(){this.Yo()}send(t){this.Ho(t)}s_(){this.Xo()}o_(){this.t_()}__(t){this.r_(t)}a_(t){this.i_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Q="WebChannelConnection";class Tu extends yu{constructor(t){super(t),this.u_=[],this.forceLongPolling=t.forceLongPolling,this.autoDetectLongPolling=t.autoDetectLongPolling,this.useFetchStreams=t.useFetchStreams,this.longPollingOptions=t.longPollingOptions}jo(t,e,n,s,i){const o=Nn();return new Promise(((a,u)=>{const c=new mo;c.setWithCredentials(!0),c.listenOnce(_o.COMPLETE,(()=>{try{switch(c.getLastErrorCode()){case gn.NO_ERROR:const h=c.getResponseJson();g(Q,`XHR for RPC '${t}' ${o} received:`,JSON.stringify(h)),a(h);break;case gn.TIMEOUT:g(Q,`RPC '${t}' ${o} timed out`),u(new p(f.DEADLINE_EXCEEDED,"Request time out"));break;case gn.HTTP_ERROR:const d=c.getStatus();if(g(Q,`RPC '${t}' ${o} failed with status:`,d,"response text:",c.getResponseText()),d>0){let _=c.getResponseJson();Array.isArray(_)&&(_=_[0]);const A=_==null?void 0:_.error;if(A&&A.status&&A.message){const v=(function(D){const x=D.toLowerCase().replace(/_/g,"-");return Object.values(f).indexOf(x)>=0?x:f.UNKNOWN})(A.status);u(new p(v,A.message))}else u(new p(f.UNKNOWN,"Server responded with status "+c.getStatus()))}else u(new p(f.UNAVAILABLE,"Connection failed."));break;default:E(9055,{c_:t,streamId:o,l_:c.getLastErrorCode(),h_:c.getLastError()})}}finally{g(Q,`RPC '${t}' ${o} completed.`)}}));const l=JSON.stringify(s);g(Q,`RPC '${t}' ${o} sending request:`,s),c.send(e,"POST",l,n,15)}))}P_(t,e,n){const s=Nn(),i=[this.$o,"/","google.firestore.v1.Firestore","/",t,"/channel"],o=po(),a=go(),u={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},c=this.longPollingOptions.timeoutSeconds;c!==void 0&&(u.longPollingTimeout=Math.round(1e3*c)),this.useFetchStreams&&(u.useFetchStreams=!0),this.zo(u.initMessageHeaders,e,n),u.encodeInitMessageHeaders=!0;const l=i.join("");g(Q,`Creating RPC '${t}' stream ${s}: ${l}`,u);const h=o.createWebChannel(l,u);this.T_(h);let d=!1,_=!1;const A=new Eu({Ho:T=>{_?g(Q,`Not sending because RPC '${t}' stream ${s} is closed:`,T):(d||(g(Q,`Opening RPC '${t}' stream ${s} transport.`),h.open(),d=!0),g(Q,`RPC '${t}' stream ${s} sending:`,T),h.send(T))},Yo:()=>h.close()}),v=(T,D,x)=>{T.listen(D,(H=>{try{x(H)}catch(lt){setTimeout((()=>{throw lt}),0)}}))};return v(h,Pe.EventType.OPEN,(()=>{_||(g(Q,`RPC '${t}' stream ${s} transport opened.`),A.s_())})),v(h,Pe.EventType.CLOSE,(()=>{_||(_=!0,g(Q,`RPC '${t}' stream ${s} transport closed`),A.__(),this.I_(h))})),v(h,Pe.EventType.ERROR,(T=>{_||(_=!0,yt(Q,`RPC '${t}' stream ${s} transport errored. Name:`,T.name,"Message:",T.message),A.__(new p(f.UNAVAILABLE,"The operation could not be completed")))})),v(h,Pe.EventType.MESSAGE,(T=>{var D;if(!_){const x=T.data[0];S(!!x,16349);const H=x,lt=(H==null?void 0:H.error)||((D=H[0])===null||D===void 0?void 0:D.error);if(lt){g(Q,`RPC '${t}' stream ${s} received error:`,lt);const Re=lt.status;let Ft=(function(Yi){const Ar=O[Yi];if(Ar!==void 0)return ui(Ar)})(Re),Ve=lt.message;Ft===void 0&&(Ft=f.INTERNAL,Ve="Unknown error status: "+Re+" with message "+lt.message),_=!0,A.__(new p(Ft,Ve)),h.close()}else g(Q,`RPC '${t}' stream ${s} received:`,x),A.a_(x)}})),v(a,yo.STAT_EVENT,(T=>{T.stat===vr.PROXY?g(Q,`RPC '${t}' stream ${s} detected buffering proxy`):T.stat===vr.NOPROXY&&g(Q,`RPC '${t}' stream ${s} detected no buffering proxy`)})),setTimeout((()=>{A.o_()}),0),A}terminate(){this.u_.forEach((t=>t.close())),this.u_=[]}T_(t){this.u_.push(t)}I_(t){this.u_=this.u_.filter((e=>e===t))}}function En(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function on(r){return new va(r,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xn{constructor(t,e,n=1e3,s=1.5,i=6e4){this.Fi=t,this.timerId=e,this.d_=n,this.E_=s,this.A_=i,this.R_=0,this.V_=null,this.m_=Date.now(),this.reset()}reset(){this.R_=0}f_(){this.R_=this.A_}g_(t){this.cancel();const e=Math.floor(this.R_+this.p_()),n=Math.max(0,Date.now()-this.m_),s=Math.max(0,e-n);s>0&&g("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.R_} ms, delay with jitter: ${e} ms, last attempt: ${n} ms ago)`),this.V_=this.Fi.enqueueAfterDelay(this.timerId,s,(()=>(this.m_=Date.now(),t()))),this.R_*=this.E_,this.R_<this.d_&&(this.R_=this.d_),this.R_>this.A_&&(this.R_=this.A_)}y_(){this.V_!==null&&(this.V_.skipDelay(),this.V_=null)}cancel(){this.V_!==null&&(this.V_.cancel(),this.V_=null)}p_(){return(Math.random()-.5)*this.R_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const us="PersistentStream";class wi{constructor(t,e,n,s,i,o,a,u){this.Fi=t,this.w_=n,this.S_=s,this.connection=i,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=a,this.listener=u,this.state=0,this.b_=0,this.D_=null,this.v_=null,this.stream=null,this.C_=0,this.F_=new Xn(t,e)}M_(){return this.state===1||this.state===5||this.x_()}x_(){return this.state===2||this.state===3}start(){this.C_=0,this.state!==4?this.auth():this.O_()}async stop(){this.M_()&&await this.close(0)}N_(){this.state=0,this.F_.reset()}B_(){this.x_()&&this.D_===null&&(this.D_=this.Fi.enqueueAfterDelay(this.w_,6e4,(()=>this.L_())))}k_(t){this.q_(),this.stream.send(t)}async L_(){if(this.x_())return this.close(0)}q_(){this.D_&&(this.D_.cancel(),this.D_=null)}Q_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(t,e){this.q_(),this.Q_(),this.F_.cancel(),this.b_++,t!==4?this.F_.reset():e&&e.code===f.RESOURCE_EXHAUSTED?(dt(e.toString()),dt("Using maximum backoff delay to prevent overloading the backend."),this.F_.f_()):e&&e.code===f.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.U_(),this.stream.close(),this.stream=null),this.state=t,await this.listener.n_(e)}U_(){}auth(){this.state=1;const t=this.K_(this.b_),e=this.b_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([n,s])=>{this.b_===e&&this.W_(n,s)}),(n=>{t((()=>{const s=new p(f.UNKNOWN,"Fetching auth token failed: "+n.message);return this.G_(s)}))}))}W_(t,e){const n=this.K_(this.b_);this.stream=this.z_(t,e),this.stream.Zo((()=>{n((()=>this.listener.Zo()))})),this.stream.e_((()=>{n((()=>(this.state=2,this.v_=this.Fi.enqueueAfterDelay(this.S_,1e4,(()=>(this.x_()&&(this.state=3),Promise.resolve()))),this.listener.e_())))})),this.stream.n_((s=>{n((()=>this.G_(s)))})),this.stream.onMessage((s=>{n((()=>++this.C_==1?this.j_(s):this.onNext(s)))}))}O_(){this.state=5,this.F_.g_((async()=>{this.state=0,this.start()}))}G_(t){return g(us,`close with error: ${t}`),this.stream=null,this.close(4,t)}K_(t){return e=>{this.Fi.enqueueAndForget((()=>this.b_===t?e():(g(us,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}}class Iu extends wi{constructor(t,e,n,s,i,o){super(t,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",e,n,s,o),this.serializer=i}z_(t,e){return this.connection.P_("Listen",t,e)}j_(t){return this.onNext(t)}onNext(t){this.F_.reset();const e=Sa(this.serializer,t),n=(function(i){if(!("targetChange"in i))return I.min();const o=i.targetChange;return o.targetIds&&o.targetIds.length?I.min():o.readTime?tt(o.readTime):I.min()})(t);return this.listener.J_(e,n)}H_(t){const e={};e.database=bn(this.serializer),e.addTarget=(function(i,o){let a;const u=o.target;if(a=Rn(u)?{documents:ba(i,u)}:{query:Da(i,u).Vt},a.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){a.resumeToken=hi(i,o.resumeToken);const c=Sn(i,o.expectedCount);c!==null&&(a.expectedCount=c)}else if(o.snapshotVersion.compareTo(I.min())>0){a.readTime=ze(i,o.snapshotVersion.toTimestamp());const c=Sn(i,o.expectedCount);c!==null&&(a.expectedCount=c)}return a})(this.serializer,t);const n=ka(this.serializer,t);n&&(e.labels=n),this.k_(e)}Y_(t){const e={};e.database=bn(this.serializer),e.removeTarget=t,this.k_(e)}}class Au extends wi{constructor(t,e,n,s,i,o){super(t,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",e,n,s,o),this.serializer=i}get Z_(){return this.C_>0}start(){this.lastStreamToken=void 0,super.start()}U_(){this.Z_&&this.X_([])}z_(t,e){return this.connection.P_("Write",t,e)}j_(t){return S(!!t.streamToken,31322),this.lastStreamToken=t.streamToken,S(!t.writeResults||t.writeResults.length===0,55816),this.listener.ea()}onNext(t){S(!!t.streamToken,12678),this.lastStreamToken=t.streamToken,this.F_.reset();const e=Ca(t.writeResults,t.commitTime),n=tt(t.commitTime);return this.listener.ta(n,e)}na(){const t={};t.database=bn(this.serializer),this.k_(t)}X_(t){const e={streamToken:this.lastStreamToken,writes:t.map((n=>_i(this.serializer,n)))};this.k_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wu{}class vu extends wu{constructor(t,e,n,s){super(),this.authCredentials=t,this.appCheckCredentials=e,this.connection=n,this.serializer=s,this.ra=!1}ia(){if(this.ra)throw new p(f.FAILED_PRECONDITION,"The client has already been terminated.")}Wo(t,e,n,s){return this.ia(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,o])=>this.connection.Wo(t,Cn(e,n),s,i,o))).catch((i=>{throw i.name==="FirebaseError"?(i.code===f.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new p(f.UNKNOWN,i.toString())}))}Jo(t,e,n,s,i){return this.ia(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([o,a])=>this.connection.Jo(t,Cn(e,n),s,o,a,i))).catch((o=>{throw o.name==="FirebaseError"?(o.code===f.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new p(f.UNKNOWN,o.toString())}))}terminate(){this.ra=!0,this.connection.terminate()}}class Ru{constructor(t,e){this.asyncQueue=t,this.onlineStateHandler=e,this.state="Unknown",this.sa=0,this.oa=null,this._a=!0}aa(){this.sa===0&&(this.ua("Unknown"),this.oa=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this.oa=null,this.ca("Backend didn't respond within 10 seconds."),this.ua("Offline"),Promise.resolve()))))}la(t){this.state==="Online"?this.ua("Unknown"):(this.sa++,this.sa>=1&&(this.ha(),this.ca(`Connection failed 1 times. Most recent error: ${t.toString()}`),this.ua("Offline")))}set(t){this.ha(),this.sa=0,t==="Online"&&(this._a=!1),this.ua(t)}ua(t){t!==this.state&&(this.state=t,this.onlineStateHandler(t))}ca(t){const e=`Could not reach Cloud Firestore backend. ${t}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this._a?(dt(e),this._a=!1):g("OnlineStateTracker",e)}ha(){this.oa!==null&&(this.oa.cancel(),this.oa=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nt="RemoteStore";class Vu{constructor(t,e,n,s,i){this.localStore=t,this.datastore=e,this.asyncQueue=n,this.remoteSyncer={},this.Pa=[],this.Ta=new Map,this.Ia=new Set,this.da=[],this.Ea=i,this.Ea.xo((o=>{n.enqueueAndForget((async()=>{xt(this)&&(g(Nt,"Restarting streams for network reachability change."),await(async function(u){const c=w(u);c.Ia.add(4),await Ie(c),c.Aa.set("Unknown"),c.Ia.delete(4),await an(c)})(this))}))})),this.Aa=new Ru(n,s)}}async function an(r){if(xt(r))for(const t of r.da)await t(!0)}async function Ie(r){for(const t of r.da)await t(!1)}function vi(r,t){const e=w(r);e.Ta.has(t.targetId)||(e.Ta.set(t.targetId,t),nr(e)?er(e):Jt(e).x_()&&tr(e,t))}function Zn(r,t){const e=w(r),n=Jt(e);e.Ta.delete(t),n.x_()&&Ri(e,t),e.Ta.size===0&&(n.x_()?n.B_():xt(e)&&e.Aa.set("Unknown"))}function tr(r,t){if(r.Ra.$e(t.targetId),t.resumeToken.approximateByteSize()>0||t.snapshotVersion.compareTo(I.min())>0){const e=r.remoteSyncer.getRemoteKeysForTarget(t.targetId).size;t=t.withExpectedCount(e)}Jt(r).H_(t)}function Ri(r,t){r.Ra.$e(t),Jt(r).Y_(t)}function er(r){r.Ra=new Ta({getRemoteKeysForTarget:t=>r.remoteSyncer.getRemoteKeysForTarget(t),Et:t=>r.Ta.get(t)||null,lt:()=>r.datastore.serializer.databaseId}),Jt(r).start(),r.Aa.aa()}function nr(r){return xt(r)&&!Jt(r).M_()&&r.Ta.size>0}function xt(r){return w(r).Ia.size===0}function Vi(r){r.Ra=void 0}async function Pu(r){r.Aa.set("Online")}async function Su(r){r.Ta.forEach(((t,e)=>{tr(r,t)}))}async function Cu(r,t){Vi(r),nr(r)?(r.Aa.la(t),er(r)):r.Aa.set("Unknown")}async function bu(r,t,e){if(r.Aa.set("Online"),t instanceof li&&t.state===2&&t.cause)try{await(async function(s,i){const o=i.cause;for(const a of i.targetIds)s.Ta.has(a)&&(await s.remoteSyncer.rejectListen(a,o),s.Ta.delete(a),s.Ra.removeTarget(a))})(r,t)}catch(n){g(Nt,"Failed to remove targets %s: %s ",t.targetIds.join(","),n),await Ge(r,n)}else if(t instanceof Fe?r.Ra.Ye(t):t instanceof ci?r.Ra.it(t):r.Ra.et(t),!e.isEqual(I.min()))try{const n=await Ai(r.localStore);e.compareTo(n)>=0&&await(function(i,o){const a=i.Ra.Pt(o);return a.targetChanges.forEach(((u,c)=>{if(u.resumeToken.approximateByteSize()>0){const l=i.Ta.get(c);l&&i.Ta.set(c,l.withResumeToken(u.resumeToken,o))}})),a.targetMismatches.forEach(((u,c)=>{const l=i.Ta.get(u);if(!l)return;i.Ta.set(u,l.withResumeToken(G.EMPTY_BYTE_STRING,l.snapshotVersion)),Ri(i,u);const h=new mt(l.target,u,c,l.sequenceNumber);tr(i,h)})),i.remoteSyncer.applyRemoteEvent(a)})(r,e)}catch(n){g(Nt,"Failed to raise snapshot:",n),await Ge(r,n)}}async function Ge(r,t,e){if(!Ht(t))throw t;r.Ia.add(1),await Ie(r),r.Aa.set("Offline"),e||(e=()=>Ai(r.localStore)),r.asyncQueue.enqueueRetryable((async()=>{g(Nt,"Retrying IndexedDB access"),await e(),r.Ia.delete(1),await an(r)}))}function Pi(r,t){return t().catch((e=>Ge(r,e,t)))}async function un(r){const t=w(r),e=wt(t);let n=t.Pa.length>0?t.Pa[t.Pa.length-1].batchId:Un;for(;Du(t);)try{const s=await du(t.localStore,n);if(s===null){t.Pa.length===0&&e.B_();break}n=s.batchId,Nu(t,s)}catch(s){await Ge(t,s)}Si(t)&&Ci(t)}function Du(r){return xt(r)&&r.Pa.length<10}function Nu(r,t){r.Pa.push(t);const e=wt(r);e.x_()&&e.Z_&&e.X_(t.mutations)}function Si(r){return xt(r)&&!wt(r).M_()&&r.Pa.length>0}function Ci(r){wt(r).start()}async function ku(r){wt(r).na()}async function xu(r){const t=wt(r);for(const e of r.Pa)t.X_(e.mutations)}async function Fu(r,t,e){const n=r.Pa.shift(),s=Gn.from(n,t,e);await Pi(r,(()=>r.remoteSyncer.applySuccessfulWrite(s))),await un(r)}async function Ou(r,t){t&&wt(r).Z_&&await(async function(n,s){if((function(o){return ai(o)&&o!==f.ABORTED})(s.code)){const i=n.Pa.shift();wt(n).N_(),await Pi(n,(()=>n.remoteSyncer.rejectFailedWrite(i.batchId,s))),await un(n)}})(r,t),Si(r)&&Ci(r)}async function cs(r,t){const e=w(r);e.asyncQueue.verifyOperationInProgress(),g(Nt,"RemoteStore received new credentials");const n=xt(e);e.Ia.add(3),await Ie(e),n&&e.Aa.set("Unknown"),await e.remoteSyncer.handleCredentialChange(t),e.Ia.delete(3),await an(e)}async function Mu(r,t){const e=w(r);t?(e.Ia.delete(2),await an(e)):t||(e.Ia.add(2),await Ie(e),e.Aa.set("Unknown"))}function Jt(r){return r.Va||(r.Va=(function(e,n,s){const i=w(e);return i.ia(),new Iu(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{Zo:Pu.bind(null,r),e_:Su.bind(null,r),n_:Cu.bind(null,r),J_:bu.bind(null,r)}),r.da.push((async t=>{t?(r.Va.N_(),nr(r)?er(r):r.Aa.set("Unknown")):(await r.Va.stop(),Vi(r))}))),r.Va}function wt(r){return r.ma||(r.ma=(function(e,n,s){const i=w(e);return i.ia(),new Au(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{Zo:()=>Promise.resolve(),e_:ku.bind(null,r),n_:Ou.bind(null,r),ea:xu.bind(null,r),ta:Fu.bind(null,r)}),r.da.push((async t=>{t?(r.ma.N_(),await un(r)):(await r.ma.stop(),r.Pa.length>0&&(g(Nt,`Stopping write stream with ${r.Pa.length} pending writes`),r.Pa=[]))}))),r.ma}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rr{constructor(t,e,n,s,i){this.asyncQueue=t,this.timerId=e,this.targetTimeMs=n,this.op=s,this.removalCallback=i,this.deferred=new it,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((o=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(t,e,n,s,i){const o=Date.now()+n,a=new rr(t,e,o,s,i);return a.start(n),a}start(t){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),t)}skipDelay(){return this.handleDelayElapsed()}cancel(t){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new p(f.CANCELLED,"Operation cancelled"+(t?": "+t:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((t=>this.deferred.resolve(t)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function sr(r,t){if(dt("AsyncQueue",`${t}: ${r}`),Ht(r))return new p(f.UNAVAILABLE,`${t}: ${r}`);throw r}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bt{static emptySet(t){return new Bt(t.comparator)}constructor(t){this.comparator=t?(e,n)=>t(e,n)||y.comparator(e.key,n.key):(e,n)=>y.comparator(e.key,n.key),this.keyedMap=ee(),this.sortedSet=new k(this.comparator)}has(t){return this.keyedMap.get(t)!=null}get(t){return this.keyedMap.get(t)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(t){const e=this.keyedMap.get(t);return e?this.sortedSet.indexOf(e):-1}get size(){return this.sortedSet.size}forEach(t){this.sortedSet.inorderTraversal(((e,n)=>(t(e),!1)))}add(t){const e=this.delete(t.key);return e.copy(e.keyedMap.insert(t.key,t),e.sortedSet.insert(t,null))}delete(t){const e=this.get(t);return e?this.copy(this.keyedMap.remove(t),this.sortedSet.remove(e)):this}isEqual(t){if(!(t instanceof Bt)||this.size!==t.size)return!1;const e=this.sortedSet.getIterator(),n=t.sortedSet.getIterator();for(;e.hasNext();){const s=e.getNext().key,i=n.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const t=[];return this.forEach((e=>{t.push(e.toString())})),t.length===0?"DocumentSet ()":`DocumentSet (
  `+t.join(`  
`)+`
)`}copy(t,e){const n=new Bt;return n.comparator=this.comparator,n.keyedMap=t,n.sortedSet=e,n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ls{constructor(){this.fa=new k(y.comparator)}track(t){const e=t.doc.key,n=this.fa.get(e);n?t.type!==0&&n.type===3?this.fa=this.fa.insert(e,t):t.type===3&&n.type!==1?this.fa=this.fa.insert(e,{type:n.type,doc:t.doc}):t.type===2&&n.type===2?this.fa=this.fa.insert(e,{type:2,doc:t.doc}):t.type===2&&n.type===0?this.fa=this.fa.insert(e,{type:0,doc:t.doc}):t.type===1&&n.type===0?this.fa=this.fa.remove(e):t.type===1&&n.type===2?this.fa=this.fa.insert(e,{type:1,doc:n.doc}):t.type===0&&n.type===1?this.fa=this.fa.insert(e,{type:2,doc:t.doc}):E(63341,{At:t,ga:n}):this.fa=this.fa.insert(e,t)}pa(){const t=[];return this.fa.inorderTraversal(((e,n)=>{t.push(n)})),t}}class Qt{constructor(t,e,n,s,i,o,a,u,c){this.query=t,this.docs=e,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=i,this.fromCache=o,this.syncStateChanged=a,this.excludesMetadataChanges=u,this.hasCachedResults=c}static fromInitialDocuments(t,e,n,s,i){const o=[];return e.forEach((a=>{o.push({type:0,doc:a})})),new Qt(t,e,Bt.emptySet(e),o,n,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(t){if(!(this.fromCache===t.fromCache&&this.hasCachedResults===t.hasCachedResults&&this.syncStateChanged===t.syncStateChanged&&this.mutatedKeys.isEqual(t.mutatedKeys)&&tn(this.query,t.query)&&this.docs.isEqual(t.docs)&&this.oldDocs.isEqual(t.oldDocs)))return!1;const e=this.docChanges,n=t.docChanges;if(e.length!==n.length)return!1;for(let s=0;s<e.length;s++)if(e[s].type!==n[s].type||!e[s].doc.isEqual(n[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lu{constructor(){this.ya=void 0,this.wa=[]}Sa(){return this.wa.some((t=>t.ba()))}}class Uu{constructor(){this.queries=hs(),this.onlineState="Unknown",this.Da=new Set}terminate(){(function(e,n){const s=w(e),i=s.queries;s.queries=hs(),i.forEach(((o,a)=>{for(const u of a.wa)u.onError(n)}))})(this,new p(f.ABORTED,"Firestore shutting down"))}}function hs(){return new kt((r=>Ws(r)),tn)}async function ir(r,t){const e=w(r);let n=3;const s=t.query;let i=e.queries.get(s);i?!i.Sa()&&t.ba()&&(n=2):(i=new Lu,n=t.ba()?0:1);try{switch(n){case 0:i.ya=await e.onListen(s,!0);break;case 1:i.ya=await e.onListen(s,!1);break;case 2:await e.onFirstRemoteStoreListen(s)}}catch(o){const a=sr(o,`Initialization of query '${Mt(t.query)}' failed`);return void t.onError(a)}e.queries.set(s,i),i.wa.push(t),t.va(e.onlineState),i.ya&&t.Ca(i.ya)&&ar(e)}async function or(r,t){const e=w(r),n=t.query;let s=3;const i=e.queries.get(n);if(i){const o=i.wa.indexOf(t);o>=0&&(i.wa.splice(o,1),i.wa.length===0?s=t.ba()?0:1:!i.Sa()&&t.ba()&&(s=2))}switch(s){case 0:return e.queries.delete(n),e.onUnlisten(n,!0);case 1:return e.queries.delete(n),e.onUnlisten(n,!1);case 2:return e.onLastRemoteStoreUnlisten(n);default:return}}function qu(r,t){const e=w(r);let n=!1;for(const s of t){const i=s.query,o=e.queries.get(i);if(o){for(const a of o.wa)a.Ca(s)&&(n=!0);o.ya=s}}n&&ar(e)}function Bu(r,t,e){const n=w(r),s=n.queries.get(t);if(s)for(const i of s.wa)i.onError(e);n.queries.delete(t)}function ar(r){r.Da.forEach((t=>{t.next()}))}var kn,ds;(ds=kn||(kn={})).Fa="default",ds.Cache="cache";class ur{constructor(t,e,n){this.query=t,this.Ma=e,this.xa=!1,this.Oa=null,this.onlineState="Unknown",this.options=n||{}}Ca(t){if(!this.options.includeMetadataChanges){const n=[];for(const s of t.docChanges)s.type!==3&&n.push(s);t=new Qt(t.query,t.docs,t.oldDocs,n,t.mutatedKeys,t.fromCache,t.syncStateChanged,!0,t.hasCachedResults)}let e=!1;return this.xa?this.Na(t)&&(this.Ma.next(t),e=!0):this.Ba(t,this.onlineState)&&(this.La(t),e=!0),this.Oa=t,e}onError(t){this.Ma.error(t)}va(t){this.onlineState=t;let e=!1;return this.Oa&&!this.xa&&this.Ba(this.Oa,t)&&(this.La(this.Oa),e=!0),e}Ba(t,e){if(!t.fromCache||!this.ba())return!0;const n=e!=="Offline";return(!this.options.ka||!n)&&(!t.docs.isEmpty()||t.hasCachedResults||e==="Offline")}Na(t){if(t.docChanges.length>0)return!0;const e=this.Oa&&this.Oa.hasPendingWrites!==t.hasPendingWrites;return!(!t.syncStateChanged&&!e)&&this.options.includeMetadataChanges===!0}La(t){t=Qt.fromInitialDocuments(t.query,t.docs,t.mutatedKeys,t.fromCache,t.hasCachedResults),this.xa=!0,this.Ma.next(t)}ba(){return this.options.source!==kn.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bi{constructor(t){this.key=t}}class Di{constructor(t){this.key=t}}class zu{constructor(t,e){this.query=t,this.Ha=e,this.Ya=null,this.hasCachedResults=!1,this.current=!1,this.Za=V(),this.mutatedKeys=V(),this.Xa=Hs(t),this.eu=new Bt(this.Xa)}get tu(){return this.Ha}nu(t,e){const n=e?e.ru:new ls,s=e?e.eu:this.eu;let i=e?e.mutatedKeys:this.mutatedKeys,o=s,a=!1;const u=this.query.limitType==="F"&&s.size===this.query.limit?s.last():null,c=this.query.limitType==="L"&&s.size===this.query.limit?s.first():null;if(t.inorderTraversal(((l,h)=>{const d=s.get(l),_=en(this.query,h)?h:null,A=!!d&&this.mutatedKeys.has(d.key),v=!!_&&(_.hasLocalMutations||this.mutatedKeys.has(_.key)&&_.hasCommittedMutations);let T=!1;d&&_?d.data.isEqual(_.data)?A!==v&&(n.track({type:3,doc:_}),T=!0):this.iu(d,_)||(n.track({type:2,doc:_}),T=!0,(u&&this.Xa(_,u)>0||c&&this.Xa(_,c)<0)&&(a=!0)):!d&&_?(n.track({type:0,doc:_}),T=!0):d&&!_&&(n.track({type:1,doc:d}),T=!0,(u||c)&&(a=!0)),T&&(_?(o=o.add(_),i=v?i.add(l):i.delete(l)):(o=o.delete(l),i=i.delete(l)))})),this.query.limit!==null)for(;o.size>this.query.limit;){const l=this.query.limitType==="F"?o.last():o.first();o=o.delete(l.key),i=i.delete(l.key),n.track({type:1,doc:l})}return{eu:o,ru:n,Ds:a,mutatedKeys:i}}iu(t,e){return t.hasLocalMutations&&e.hasCommittedMutations&&!e.hasLocalMutations}applyChanges(t,e,n,s){const i=this.eu;this.eu=t.eu,this.mutatedKeys=t.mutatedKeys;const o=t.ru.pa();o.sort(((l,h)=>(function(_,A){const v=T=>{switch(T){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return E(20277,{At:T})}};return v(_)-v(A)})(l.type,h.type)||this.Xa(l.doc,h.doc))),this.su(n),s=s!=null&&s;const a=e&&!s?this.ou():[],u=this.Za.size===0&&this.current&&!s?1:0,c=u!==this.Ya;return this.Ya=u,o.length!==0||c?{snapshot:new Qt(this.query,t.eu,i,o,t.mutatedKeys,u===0,c,!1,!!n&&n.resumeToken.approximateByteSize()>0),_u:a}:{_u:a}}va(t){return this.current&&t==="Offline"?(this.current=!1,this.applyChanges({eu:this.eu,ru:new ls,mutatedKeys:this.mutatedKeys,Ds:!1},!1)):{_u:[]}}au(t){return!this.Ha.has(t)&&!!this.eu.has(t)&&!this.eu.get(t).hasLocalMutations}su(t){t&&(t.addedDocuments.forEach((e=>this.Ha=this.Ha.add(e))),t.modifiedDocuments.forEach((e=>{})),t.removedDocuments.forEach((e=>this.Ha=this.Ha.delete(e))),this.current=t.current)}ou(){if(!this.current)return[];const t=this.Za;this.Za=V(),this.eu.forEach((n=>{this.au(n.key)&&(this.Za=this.Za.add(n.key))}));const e=[];return t.forEach((n=>{this.Za.has(n)||e.push(new Di(n))})),this.Za.forEach((n=>{t.has(n)||e.push(new bi(n))})),e}uu(t){this.Ha=t.qs,this.Za=V();const e=this.nu(t.documents);return this.applyChanges(e,!0)}cu(){return Qt.fromInitialDocuments(this.query,this.eu,this.mutatedKeys,this.Ya===0,this.hasCachedResults)}}const cr="SyncEngine";class $u{constructor(t,e,n){this.query=t,this.targetId=e,this.view=n}}class ju{constructor(t){this.key=t,this.lu=!1}}class Gu{constructor(t,e,n,s,i,o){this.localStore=t,this.remoteStore=e,this.eventManager=n,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=o,this.hu={},this.Pu=new kt((a=>Ws(a)),tn),this.Tu=new Map,this.Iu=new Set,this.du=new k(y.comparator),this.Eu=new Map,this.Au=new Wn,this.Ru={},this.Vu=new Map,this.mu=Gt.ur(),this.onlineState="Unknown",this.fu=void 0}get isPrimaryClient(){return this.fu===!0}}async function Qu(r,t,e=!0){const n=Mi(r);let s;const i=n.Pu.get(t);return i?(n.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.cu()):s=await Ni(n,t,e,!0),s}async function Ku(r,t){const e=Mi(r);await Ni(e,t,!0,!1)}async function Ni(r,t,e,n){const s=await fu(r.localStore,ot(t)),i=s.targetId,o=r.sharedClientState.addLocalQueryTarget(i,e);let a;return n&&(a=await Wu(r,t,i,o==="current",s.resumeToken)),r.isPrimaryClient&&e&&vi(r.remoteStore,s),a}async function Wu(r,t,e,n,s){r.gu=(h,d,_)=>(async function(v,T,D,x){let H=T.view.nu(D);H.Ds&&(H=await ss(v.localStore,T.query,!1).then((({documents:Ve})=>T.view.nu(Ve,H))));const lt=x&&x.targetChanges.get(T.targetId),Re=x&&x.targetMismatches.get(T.targetId)!=null,Ft=T.view.applyChanges(H,v.isPrimaryClient,lt,Re);return ms(v,T.targetId,Ft._u),Ft.snapshot})(r,h,d,_);const i=await ss(r.localStore,t,!0),o=new zu(t,i.qs),a=o.nu(i.documents),u=Te.createSynthesizedTargetChangeForCurrentChange(e,n&&r.onlineState!=="Offline",s),c=o.applyChanges(a,r.isPrimaryClient,u);ms(r,e,c._u);const l=new $u(t,e,o);return r.Pu.set(t,l),r.Tu.has(e)?r.Tu.get(e).push(t):r.Tu.set(e,[t]),c.snapshot}async function Hu(r,t,e){const n=w(r),s=n.Pu.get(t),i=n.Tu.get(s.targetId);if(i.length>1)return n.Tu.set(s.targetId,i.filter((o=>!tn(o,t)))),void n.Pu.delete(t);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await Dn(n.localStore,s.targetId,!1).then((()=>{n.sharedClientState.clearQueryState(s.targetId),e&&Zn(n.remoteStore,s.targetId),xn(n,s.targetId)})).catch(Wt)):(xn(n,s.targetId),await Dn(n.localStore,s.targetId,!0))}async function Yu(r,t){const e=w(r),n=e.Pu.get(t),s=e.Tu.get(n.targetId);e.isPrimaryClient&&s.length===1&&(e.sharedClientState.removeLocalQueryTarget(n.targetId),Zn(e.remoteStore,n.targetId))}async function Ju(r,t,e){const n=sc(r);try{const s=await(function(o,a){const u=w(o),c=b.now(),l=a.reduce(((_,A)=>_.add(A.key)),V());let h,d;return u.persistence.runTransaction("Locally write mutations","readwrite",(_=>{let A=ft(),v=V();return u.Os.getEntries(_,l).next((T=>{A=T,A.forEach(((D,x)=>{x.isValidDocument()||(v=v.add(D))}))})).next((()=>u.localDocuments.getOverlayedDocuments(_,A))).next((T=>{h=T;const D=[];for(const x of a){const H=_a(x,h.get(x.key).overlayedDocument);H!=null&&D.push(new Vt(x.key,H,qs(H.value.mapValue),L.exists(!0)))}return u.mutationQueue.addMutationBatch(_,c,D,a)})).next((T=>{d=T;const D=T.applyToLocalDocumentSet(h,v);return u.documentOverlayCache.saveOverlays(_,T.batchId,D)}))})).then((()=>({batchId:d.batchId,changes:Js(h)})))})(n.localStore,t);n.sharedClientState.addPendingMutation(s.batchId),(function(o,a,u){let c=o.Ru[o.currentUser.toKey()];c||(c=new k(R)),c=c.insert(a,u),o.Ru[o.currentUser.toKey()]=c})(n,s.batchId,e),await Ae(n,s.changes),await un(n.remoteStore)}catch(s){const i=sr(s,"Failed to persist write");e.reject(i)}}async function ki(r,t){const e=w(r);try{const n=await lu(e.localStore,t);t.targetChanges.forEach(((s,i)=>{const o=e.Eu.get(i);o&&(S(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?o.lu=!0:s.modifiedDocuments.size>0?S(o.lu,14607):s.removedDocuments.size>0&&(S(o.lu,42227),o.lu=!1))})),await Ae(e,n,t)}catch(n){await Wt(n)}}function fs(r,t,e){const n=w(r);if(n.isPrimaryClient&&e===0||!n.isPrimaryClient&&e===1){const s=[];n.Pu.forEach(((i,o)=>{const a=o.view.va(t);a.snapshot&&s.push(a.snapshot)})),(function(o,a){const u=w(o);u.onlineState=a;let c=!1;u.queries.forEach(((l,h)=>{for(const d of h.wa)d.va(a)&&(c=!0)})),c&&ar(u)})(n.eventManager,t),s.length&&n.hu.J_(s),n.onlineState=t,n.isPrimaryClient&&n.sharedClientState.setOnlineState(t)}}async function Xu(r,t,e){const n=w(r);n.sharedClientState.updateQueryState(t,"rejected",e);const s=n.Eu.get(t),i=s&&s.key;if(i){let o=new k(y.comparator);o=o.insert(i,z.newNoDocument(i,I.min()));const a=V().add(i),u=new sn(I.min(),new Map,new k(R),o,a);await ki(n,u),n.du=n.du.remove(i),n.Eu.delete(t),lr(n)}else await Dn(n.localStore,t,!1).then((()=>xn(n,t,e))).catch(Wt)}async function Zu(r,t){const e=w(r),n=t.batch.batchId;try{const s=await cu(e.localStore,t);Fi(e,n,null),xi(e,n),e.sharedClientState.updateMutationState(n,"acknowledged"),await Ae(e,s)}catch(s){await Wt(s)}}async function tc(r,t,e){const n=w(r);try{const s=await(function(o,a){const u=w(o);return u.persistence.runTransaction("Reject batch","readwrite-primary",(c=>{let l;return u.mutationQueue.lookupMutationBatch(c,a).next((h=>(S(h!==null,37113),l=h.keys(),u.mutationQueue.removeMutationBatch(c,h)))).next((()=>u.mutationQueue.performConsistencyCheck(c))).next((()=>u.documentOverlayCache.removeOverlaysForBatchId(c,l,a))).next((()=>u.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(c,l))).next((()=>u.localDocuments.getDocuments(c,l)))}))})(n.localStore,t);Fi(n,t,e),xi(n,t),n.sharedClientState.updateMutationState(t,"rejected",e),await Ae(n,s)}catch(s){await Wt(s)}}function xi(r,t){(r.Vu.get(t)||[]).forEach((e=>{e.resolve()})),r.Vu.delete(t)}function Fi(r,t,e){const n=w(r);let s=n.Ru[n.currentUser.toKey()];if(s){const i=s.get(t);i&&(e?i.reject(e):i.resolve(),s=s.remove(t)),n.Ru[n.currentUser.toKey()]=s}}function xn(r,t,e=null){r.sharedClientState.removeLocalQueryTarget(t);for(const n of r.Tu.get(t))r.Pu.delete(n),e&&r.hu.pu(n,e);r.Tu.delete(t),r.isPrimaryClient&&r.Au.zr(t).forEach((n=>{r.Au.containsKey(n)||Oi(r,n)}))}function Oi(r,t){r.Iu.delete(t.path.canonicalString());const e=r.du.get(t);e!==null&&(Zn(r.remoteStore,e),r.du=r.du.remove(t),r.Eu.delete(e),lr(r))}function ms(r,t,e){for(const n of e)n instanceof bi?(r.Au.addReference(n.key,t),ec(r,n)):n instanceof Di?(g(cr,"Document no longer in limbo: "+n.key),r.Au.removeReference(n.key,t),r.Au.containsKey(n.key)||Oi(r,n.key)):E(19791,{yu:n})}function ec(r,t){const e=t.key,n=e.path.canonicalString();r.du.get(e)||r.Iu.has(n)||(g(cr,"New document in limbo: "+e),r.Iu.add(n),lr(r))}function lr(r){for(;r.Iu.size>0&&r.du.size<r.maxConcurrentLimboResolutions;){const t=r.Iu.values().next().value;r.Iu.delete(t);const e=new y(C.fromString(t)),n=r.mu.next();r.Eu.set(n,new ju(e)),r.du=r.du.insert(e,n),vi(r.remoteStore,new mt(ot(Ze(e.path)),n,"TargetPurposeLimboResolution",Je.ue))}}async function Ae(r,t,e){const n=w(r),s=[],i=[],o=[];n.Pu.isEmpty()||(n.Pu.forEach(((a,u)=>{o.push(n.gu(u,t,e).then((c=>{var l;if((c||e)&&n.isPrimaryClient){const h=c?!c.fromCache:(l=e==null?void 0:e.targetChanges.get(u.targetId))===null||l===void 0?void 0:l.current;n.sharedClientState.updateQueryState(u.targetId,h?"current":"not-current")}if(c){s.push(c);const h=Yn.Es(u.targetId,c);i.push(h)}})))})),await Promise.all(o),n.hu.J_(s),await(async function(u,c){const l=w(u);try{await l.persistence.runTransaction("notifyLocalViewChanges","readwrite",(h=>m.forEach(c,(d=>m.forEach(d.Is,(_=>l.persistence.referenceDelegate.addReference(h,d.targetId,_))).next((()=>m.forEach(d.ds,(_=>l.persistence.referenceDelegate.removeReference(h,d.targetId,_)))))))))}catch(h){if(!Ht(h))throw h;g(Jn,"Failed to update sequence numbers: "+h)}for(const h of c){const d=h.targetId;if(!h.fromCache){const _=l.Fs.get(d),A=_.snapshotVersion,v=_.withLastLimboFreeSnapshotVersion(A);l.Fs=l.Fs.insert(d,v)}}})(n.localStore,i))}async function nc(r,t){const e=w(r);if(!e.currentUser.isEqual(t)){g(cr,"User change. New user:",t.toKey());const n=await Ii(e.localStore,t);e.currentUser=t,(function(i,o){i.Vu.forEach((a=>{a.forEach((u=>{u.reject(new p(f.CANCELLED,o))}))})),i.Vu.clear()})(e,"'waitForPendingWrites' promise is rejected due to a user change."),e.sharedClientState.handleUserChange(t,n.removedBatchIds,n.addedBatchIds),await Ae(e,n.Bs)}}function rc(r,t){const e=w(r),n=e.Eu.get(t);if(n&&n.lu)return V().add(n.key);{let s=V();const i=e.Tu.get(t);if(!i)return s;for(const o of i){const a=e.Pu.get(o);s=s.unionWith(a.view.tu)}return s}}function Mi(r){const t=w(r);return t.remoteStore.remoteSyncer.applyRemoteEvent=ki.bind(null,t),t.remoteStore.remoteSyncer.getRemoteKeysForTarget=rc.bind(null,t),t.remoteStore.remoteSyncer.rejectListen=Xu.bind(null,t),t.hu.J_=qu.bind(null,t.eventManager),t.hu.pu=Bu.bind(null,t.eventManager),t}function sc(r){const t=w(r);return t.remoteStore.remoteSyncer.applySuccessfulWrite=Zu.bind(null,t),t.remoteStore.remoteSyncer.rejectFailedWrite=tc.bind(null,t),t}class Qe{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(t){this.serializer=on(t.databaseInfo.databaseId),this.sharedClientState=this.bu(t),this.persistence=this.Du(t),await this.persistence.start(),this.localStore=this.vu(t),this.gcScheduler=this.Cu(t,this.localStore),this.indexBackfillerScheduler=this.Fu(t,this.localStore)}Cu(t,e){return null}Fu(t,e){return null}vu(t){return uu(this.persistence,new iu,t.initialUser,this.serializer)}Du(t){return new Ti(Hn.Vi,this.serializer)}bu(t){return new _u}async terminate(){var t,e;(t=this.gcScheduler)===null||t===void 0||t.stop(),(e=this.indexBackfillerScheduler)===null||e===void 0||e.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Qe.provider={build:()=>new Qe};class ic extends Qe{constructor(t){super(),this.cacheSizeBytes=t}Cu(t,e){S(this.persistence.referenceDelegate instanceof je,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new ja(n,t.asyncQueue,e)}Du(t){const e=this.cacheSizeBytes!==void 0?J.withCacheSize(this.cacheSizeBytes):J.DEFAULT;return new Ti((n=>je.Vi(n,e)),this.serializer)}}class Fn{async initialize(t,e){this.localStore||(this.localStore=t.localStore,this.sharedClientState=t.sharedClientState,this.datastore=this.createDatastore(e),this.remoteStore=this.createRemoteStore(e),this.eventManager=this.createEventManager(e),this.syncEngine=this.createSyncEngine(e,!t.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>fs(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=nc.bind(null,this.syncEngine),await Mu(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(t){return(function(){return new Uu})()}createDatastore(t){const e=on(t.databaseInfo.databaseId),n=(function(i){return new Tu(i)})(t.databaseInfo);return(function(i,o,a,u){return new vu(i,o,a,u)})(t.authCredentials,t.appCheckCredentials,n,e)}createRemoteStore(t){return(function(n,s,i,o,a){return new Vu(n,s,i,o,a)})(this.localStore,this.datastore,t.asyncQueue,(e=>fs(this.syncEngine,e,0)),(function(){return as.C()?new as:new pu})())}createSyncEngine(t,e){return(function(s,i,o,a,u,c,l){const h=new Gu(s,i,o,a,u,c);return l&&(h.fu=!0),h})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,t.initialUser,t.maxConcurrentLimboResolutions,e)}async terminate(){var t,e;await(async function(s){const i=w(s);g(Nt,"RemoteStore shutting down."),i.Ia.add(5),await Ie(i),i.Ea.shutdown(),i.Aa.set("Unknown")})(this.remoteStore),(t=this.datastore)===null||t===void 0||t.terminate(),(e=this.eventManager)===null||e===void 0||e.terminate()}}Fn.provider={build:()=>new Fn};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hr{constructor(t){this.observer=t,this.muted=!1}next(t){this.muted||this.observer.next&&this.xu(this.observer.next,t)}error(t){this.muted||(this.observer.error?this.xu(this.observer.error,t):dt("Uncaught Error in snapshot listener:",t.toString()))}Ou(){this.muted=!0}xu(t,e){setTimeout((()=>{this.muted||t(e)}),0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oc{constructor(t){this.datastore=t,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastTransactionError=null,this.writtenDocs=new Set}async lookup(t){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw this.lastTransactionError=new p(f.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes."),this.lastTransactionError;const e=await(async function(s,i){const o=w(s),a={documents:i.map((h=>$e(o.serializer,h)))},u=await o.Jo("BatchGetDocuments",o.serializer.databaseId,C.emptyPath(),a,i.length),c=new Map;u.forEach((h=>{const d=Pa(o.serializer,h);c.set(d.key.toString(),d)}));const l=[];return i.forEach((h=>{const d=c.get(h.toString());S(!!d,55234,{key:h}),l.push(d)})),l})(this.datastore,t);return e.forEach((n=>this.recordVersion(n))),e}set(t,e){this.write(e.toMutation(t,this.precondition(t))),this.writtenDocs.add(t.toString())}update(t,e){try{this.write(e.toMutation(t,this.preconditionForUpdate(t)))}catch(n){this.lastTransactionError=n}this.writtenDocs.add(t.toString())}delete(t){this.write(new Ee(t,this.precondition(t))),this.writtenDocs.add(t.toString())}async commit(){if(this.ensureCommitNotCalled(),this.lastTransactionError)throw this.lastTransactionError;const t=this.readVersions;this.mutations.forEach((e=>{t.delete(e.key.toString())})),t.forEach(((e,n)=>{const s=y.fromPath(n);this.mutations.push(new oi(s,this.precondition(s)))})),await(async function(n,s){const i=w(n),o={writes:s.map((a=>_i(i.serializer,a)))};await i.Wo("Commit",i.serializer.databaseId,C.emptyPath(),o)})(this.datastore,this.mutations),this.committed=!0}recordVersion(t){let e;if(t.isFoundDocument())e=t.version;else{if(!t.isNoDocument())throw E(50498,{Wu:t.constructor.name});e=I.min()}const n=this.readVersions.get(t.key.toString());if(n){if(!e.isEqual(n))throw new p(f.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(t.key.toString(),e)}precondition(t){const e=this.readVersions.get(t.toString());return!this.writtenDocs.has(t.toString())&&e?e.isEqual(I.min())?L.exists(!1):L.updateTime(e):L.none()}preconditionForUpdate(t){const e=this.readVersions.get(t.toString());if(!this.writtenDocs.has(t.toString())&&e){if(e.isEqual(I.min()))throw new p(f.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return L.updateTime(e)}return L.exists(!0)}write(t){this.ensureCommitNotCalled(),this.mutations.push(t)}ensureCommitNotCalled(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ac{constructor(t,e,n,s,i){this.asyncQueue=t,this.datastore=e,this.options=n,this.updateFunction=s,this.deferred=i,this.Gu=n.maxAttempts,this.F_=new Xn(this.asyncQueue,"transaction_retry")}zu(){this.Gu-=1,this.ju()}ju(){this.F_.g_((async()=>{const t=new oc(this.datastore),e=this.Ju(t);e&&e.then((n=>{this.asyncQueue.enqueueAndForget((()=>t.commit().then((()=>{this.deferred.resolve(n)})).catch((s=>{this.Hu(s)}))))})).catch((n=>{this.Hu(n)}))}))}Ju(t){try{const e=this.updateFunction(t);return!ge(e)&&e.catch&&e.then?e:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(e){return this.deferred.reject(e),null}}Hu(t){this.Gu>0&&this.Yu(t)?(this.Gu-=1,this.asyncQueue.enqueueAndForget((()=>(this.ju(),Promise.resolve())))):this.deferred.reject(t)}Yu(t){if(t.name==="FirebaseError"){const e=t.code;return e==="aborted"||e==="failed-precondition"||e==="already-exists"||!ai(e)}return!1}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vt="FirestoreClient";class uc{constructor(t,e,n,s,i){this.authCredentials=t,this.appCheckCredentials=e,this.asyncQueue=n,this.databaseInfo=s,this.user=K.UNAUTHENTICATED,this.clientId=Ln.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(n,(async o=>{g(vt,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o})),this.appCheckCredentials.start(n,(o=>(g(vt,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(t){this.authCredentialListener=t}setAppCheckTokenChangeListener(t){this.appCheckCredentialListener=t}terminate(){this.asyncQueue.enterRestrictedMode();const t=new it;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),t.resolve()}catch(e){const n=sr(e,"Failed to shutdown persistence");t.reject(n)}})),t.promise}}async function Tn(r,t){r.asyncQueue.verifyOperationInProgress(),g(vt,"Initializing OfflineComponentProvider");const e=r.configuration;await t.initialize(e);let n=e.initialUser;r.setCredentialChangeListener((async s=>{n.isEqual(s)||(await Ii(t.localStore,s),n=s)})),t.persistence.setDatabaseDeletedListener((()=>{yt("Terminating Firestore due to IndexedDb database deletion"),r.terminate().then((()=>{g("Terminating Firestore due to IndexedDb database deletion completed successfully")})).catch((s=>{yt("Terminating Firestore due to IndexedDb database deletion failed",s)}))})),r._offlineComponents=t}async function _s(r,t){r.asyncQueue.verifyOperationInProgress();const e=await cc(r);g(vt,"Initializing OnlineComponentProvider"),await t.initialize(e,r.configuration),r.setCredentialChangeListener((n=>cs(t.remoteStore,n))),r.setAppCheckTokenChangeListener(((n,s)=>cs(t.remoteStore,s))),r._onlineComponents=t}async function cc(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){g(vt,"Using user provided OfflineComponentProvider");try{await Tn(r,r._uninitializedComponentsProvider._offline)}catch(t){const e=t;if(!(function(s){return s.name==="FirebaseError"?s.code===f.FAILED_PRECONDITION||s.code===f.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11})(e))throw e;yt("Error using user provided cache. Falling back to memory cache: "+e),await Tn(r,new Qe)}}else g(vt,"Using default OfflineComponentProvider"),await Tn(r,new ic(void 0));return r._offlineComponents}async function dr(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(g(vt,"Using user provided OnlineComponentProvider"),await _s(r,r._uninitializedComponentsProvider._online)):(g(vt,"Using default OnlineComponentProvider"),await _s(r,new Fn))),r._onlineComponents}function lc(r){return dr(r).then((t=>t.syncEngine))}function hc(r){return dr(r).then((t=>t.datastore))}async function Ke(r){const t=await dr(r),e=t.eventManager;return e.onListen=Qu.bind(null,t.syncEngine),e.onUnlisten=Hu.bind(null,t.syncEngine),e.onFirstRemoteStoreListen=Ku.bind(null,t.syncEngine),e.onLastRemoteStoreUnlisten=Yu.bind(null,t.syncEngine),e}function dc(r,t,e={}){const n=new it;return r.asyncQueue.enqueueAndForget((async()=>(function(i,o,a,u,c){const l=new hr({next:d=>{l.Ou(),o.enqueueAndForget((()=>or(i,h)));const _=d.docs.has(a);!_&&d.fromCache?c.reject(new p(f.UNAVAILABLE,"Failed to get document because the client is offline.")):_&&d.fromCache&&u&&u.source==="server"?c.reject(new p(f.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):c.resolve(d)},error:d=>c.reject(d)}),h=new ur(Ze(a.path),l,{includeMetadataChanges:!0,ka:!0});return ir(i,h)})(await Ke(r),r.asyncQueue,t,e,n))),n.promise}function fc(r,t,e={}){const n=new it;return r.asyncQueue.enqueueAndForget((async()=>(function(i,o,a,u,c){const l=new hr({next:d=>{l.Ou(),o.enqueueAndForget((()=>or(i,h))),d.fromCache&&u.source==="server"?c.reject(new p(f.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):c.resolve(d)},error:d=>c.reject(d)}),h=new ur(a,l,{includeMetadataChanges:!0,ka:!0});return ir(i,h)})(await Ke(r),r.asyncQueue,t,e,n))),n.promise}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Li(r){const t={};return r.timeoutSeconds!==void 0&&(t.timeoutSeconds=r.timeoutSeconds),t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ps=new Map;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ui="firestore.googleapis.com",gs=!0;class ys{constructor(t){var e,n;if(t.host===void 0){if(t.ssl!==void 0)throw new p(f.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=Ui,this.ssl=gs}else this.host=t.host,this.ssl=(e=t.ssl)!==null&&e!==void 0?e:gs;if(this.isUsingEmulator=t.emulatorOptions!==void 0,this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,this.localCache=t.localCache,t.cacheSizeBytes===void 0)this.cacheSizeBytes=Ei;else{if(t.cacheSizeBytes!==-1&&t.cacheSizeBytes<za)throw new p(f.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes}So("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:t.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Li((n=t.experimentalLongPollingOptions)!==null&&n!==void 0?n:{}),(function(i){if(i.timeoutSeconds!==void 0){if(isNaN(i.timeoutSeconds))throw new p(f.INVALID_ARGUMENT,`invalid long polling timeout: ${i.timeoutSeconds} (must not be NaN)`);if(i.timeoutSeconds<5)throw new p(f.INVALID_ARGUMENT,`invalid long polling timeout: ${i.timeoutSeconds} (minimum allowed value is 5)`);if(i.timeoutSeconds>30)throw new p(f.INVALID_ARGUMENT,`invalid long polling timeout: ${i.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!t.useFetchStreams}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&(function(n,s){return n.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,t.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams}}class cn{constructor(t,e,n,s){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new ys({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new p(f.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(t){if(this._settingsFrozen)throw new p(f.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new ys(t),this._emulatorOptions=t.emulatorOptions||{},t.credentials!==void 0&&(this._authCredentials=(function(n){if(!n)return new Eo;switch(n.type){case"firstParty":return new wo(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new p(f.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(t.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(e){const n=ps.get(e);n&&(g("ComponentProvider","Removing Datastore"),ps.delete(e),n.terminate())})(this),Promise.resolve()}}function mc(r,t,e,n={}){var s;r=W(r,cn);const i=Rs(t),o=r._getSettings(),a=Object.assign(Object.assign({},o),{emulatorOptions:r._getEmulatorOptions()}),u=`${t}:${e}`;i&&(oo(`https://${u}`),ao("Firestore",!0)),o.host!==Ui&&o.host!==u&&yt("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const c=Object.assign(Object.assign({},o),{host:u,ssl:i,emulatorOptions:n});if(!uo(c,a)&&(r._setSettings(c),n.mockUserToken)){let l,h;if(typeof n.mockUserToken=="string")l=n.mockUserToken,h=K.MOCK_USER;else{l=co(n.mockUserToken,(s=r._app)===null||s===void 0?void 0:s.options.projectId);const d=n.mockUserToken.sub||n.mockUserToken.user_id;if(!d)throw new p(f.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");h=new K(d)}r._authCredentials=new To(new Ps(l,h))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pt{constructor(t,e,n){this.converter=e,this._query=n,this.type="query",this.firestore=t}withConverter(t){return new Pt(this.firestore,t,this._query)}}class N{constructor(t,e,n){this.converter=e,this._key=n,this.type="document",this.firestore=t}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new pt(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new N(this.firestore,t,this._key)}toJSON(){return{type:N._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(t,e,n){if(pe(e,N._jsonSchema))return new N(t,n||null,new y(C.fromString(e.referencePath)))}}N._jsonSchemaVersion="firestore/documentReference/1.0",N._jsonSchema={type:U("string",N._jsonSchemaVersion),referencePath:U("string")};class pt extends Pt{constructor(t,e,n){super(t,e,Ze(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new N(this.firestore,null,new y(t))}withConverter(t){return new pt(this.firestore,t,this._path)}}function kc(r,t,...e){if(r=et(r),Cs("collection","path",t),r instanceof cn){const n=C.fromString(t,...e);return Dr(n),new pt(r,null,n)}{if(!(r instanceof N||r instanceof pt))throw new p(f.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(C.fromString(t,...e));return Dr(n),new pt(r.firestore,null,n)}}function _c(r,t,...e){if(r=et(r),arguments.length===1&&(t=Ln.newId()),Cs("doc","path",t),r instanceof cn){const n=C.fromString(t,...e);return br(n),new N(r,null,new y(n))}{if(!(r instanceof N||r instanceof pt))throw new p(f.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(C.fromString(t,...e));return br(n),new N(r.firestore,r instanceof pt?r.converter:null,new y(n))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Es="AsyncQueue";class Ts{constructor(t=Promise.resolve()){this.Zu=[],this.Xu=!1,this.ec=[],this.tc=null,this.nc=!1,this.rc=!1,this.sc=[],this.F_=new Xn(this,"async_queue_retry"),this.oc=()=>{const n=En();n&&g(Es,"Visibility state changed to "+n.visibilityState),this.F_.y_()},this._c=t;const e=En();e&&typeof e.addEventListener=="function"&&e.addEventListener("visibilitychange",this.oc)}get isShuttingDown(){return this.Xu}enqueueAndForget(t){this.enqueue(t)}enqueueAndForgetEvenWhileRestricted(t){this.ac(),this.uc(t)}enterRestrictedMode(t){if(!this.Xu){this.Xu=!0,this.rc=t||!1;const e=En();e&&typeof e.removeEventListener=="function"&&e.removeEventListener("visibilitychange",this.oc)}}enqueue(t){if(this.ac(),this.Xu)return new Promise((()=>{}));const e=new it;return this.uc((()=>this.Xu&&this.rc?Promise.resolve():(t().then(e.resolve,e.reject),e.promise))).then((()=>e.promise))}enqueueRetryable(t){this.enqueueAndForget((()=>(this.Zu.push(t),this.cc())))}async cc(){if(this.Zu.length!==0){try{await this.Zu[0](),this.Zu.shift(),this.F_.reset()}catch(t){if(!Ht(t))throw t;g(Es,"Operation failed with retryable error: "+t)}this.Zu.length>0&&this.F_.g_((()=>this.cc()))}}uc(t){const e=this._c.then((()=>(this.nc=!0,t().catch((n=>{throw this.tc=n,this.nc=!1,dt("INTERNAL UNHANDLED ERROR: ",Is(n)),n})).then((n=>(this.nc=!1,n))))));return this._c=e,e}enqueueAfterDelay(t,e,n){this.ac(),this.sc.indexOf(t)>-1&&(e=0);const s=rr.createAndSchedule(this,t,e,n,(i=>this.lc(i)));return this.ec.push(s),s}ac(){this.tc&&E(47125,{hc:Is(this.tc)})}verifyOperationInProgress(){}async Pc(){let t;do t=this._c,await t;while(t!==this._c)}Tc(t){for(const e of this.ec)if(e.timerId===t)return!0;return!1}Ic(t){return this.Pc().then((()=>{this.ec.sort(((e,n)=>e.targetTimeMs-n.targetTimeMs));for(const e of this.ec)if(e.skipDelay(),t!=="all"&&e.timerId===t)break;return this.Pc()}))}dc(t){this.sc.push(t)}lc(t){const e=this.ec.indexOf(t);this.ec.splice(e,1)}}function Is(r){let t=r.message||"";return r.stack&&(t=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function As(r){return(function(e,n){if(typeof e!="object"||e===null)return!1;const s=e;for(const i of n)if(i in s&&typeof s[i]=="function")return!0;return!1})(r,["next","error","complete"])}class rt extends cn{constructor(t,e,n,s){super(t,e,n,s),this.type="firestore",this._queue=new Ts,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const t=this._firestoreClient.terminate();this._queue=new Ts(t),this._firestoreClient=void 0,await t}}}function xc(r,t){const e=typeof r=="object"?r:Zi(),n=typeof r=="string"?r:Le,s=to(e,"firestore").getImmediate({identifier:n});if(!s._initialized){const i=io("firestore");i&&mc(s,...i)}return s}function Xt(r){if(r._terminated)throw new p(f.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||pc(r),r._firestoreClient}function pc(r){var t,e,n;const s=r._freezeSettings(),i=(function(a,u,c,l){return new Uo(a,u,c,l.host,l.ssl,l.experimentalForceLongPolling,l.experimentalAutoDetectLongPolling,Li(l.experimentalLongPollingOptions),l.useFetchStreams,l.isUsingEmulator)})(r._databaseId,((t=r._app)===null||t===void 0?void 0:t.options.appId)||"",r._persistenceKey,s);r._componentsProvider||!((e=s.localCache)===null||e===void 0)&&e._offlineComponentProvider&&(!((n=s.localCache)===null||n===void 0)&&n._onlineComponentProvider)&&(r._componentsProvider={_offline:s.localCache._offlineComponentProvider,_online:s.localCache._onlineComponentProvider}),r._firestoreClient=new uc(r._authCredentials,r._appCheckCredentials,r._queue,i,r._componentsProvider&&(function(a){const u=a==null?void 0:a._online.build();return{_offline:a==null?void 0:a._offline.build(u),_online:u}})(r._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class X{constructor(t){this._byteString=t}static fromBase64String(t){try{return new X(G.fromBase64String(t))}catch(e){throw new p(f.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(t){return new X(G.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}toJSON(){return{type:X._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(t){if(pe(t,X._jsonSchema))return X.fromBase64String(t.bytes)}}X._jsonSchemaVersion="firestore/bytes/1.0",X._jsonSchema={type:U("string",X._jsonSchemaVersion),bytes:U("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zt{constructor(...t){for(let e=0;e<t.length;++e)if(t[e].length===0)throw new p(f.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new j(t)}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ln{constructor(t){this._methodName=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class at{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new p(f.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new p(f.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}_compareTo(t){return R(this._lat,t._lat)||R(this._long,t._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:at._jsonSchemaVersion}}static fromJSON(t){if(pe(t,at._jsonSchema))return new at(t.latitude,t.longitude)}}at._jsonSchemaVersion="firestore/geoPoint/1.0",at._jsonSchema={type:U("string",at._jsonSchemaVersion),latitude:U("number"),longitude:U("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ut{constructor(t){this._values=(t||[]).map((e=>e))}toArray(){return this._values.map((t=>t))}isEqual(t){return(function(n,s){if(n.length!==s.length)return!1;for(let i=0;i<n.length;++i)if(n[i]!==s[i])return!1;return!0})(this._values,t._values)}toJSON(){return{type:ut._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(t){if(pe(t,ut._jsonSchema)){if(Array.isArray(t.vectorValues)&&t.vectorValues.every((e=>typeof e=="number")))return new ut(t.vectorValues);throw new p(f.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}ut._jsonSchemaVersion="firestore/vectorValue/1.0",ut._jsonSchema={type:U("string",ut._jsonSchemaVersion),vectorValues:U("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gc=/^__.*__$/;class yc{constructor(t,e,n){this.data=t,this.fieldMask=e,this.fieldTransforms=n}toMutation(t,e){return this.fieldMask!==null?new Vt(t,this.data,this.fieldMask,e,this.fieldTransforms):new ye(t,this.data,e,this.fieldTransforms)}}class qi{constructor(t,e,n){this.data=t,this.fieldMask=e,this.fieldTransforms=n}toMutation(t,e){return new Vt(t,this.data,this.fieldMask,e,this.fieldTransforms)}}function Bi(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw E(40011,{Ec:r})}}class fr{constructor(t,e,n,s,i,o){this.settings=t,this.databaseId=e,this.serializer=n,this.ignoreUndefinedProperties=s,i===void 0&&this.Ac(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get Ec(){return this.settings.Ec}Rc(t){return new fr(Object.assign(Object.assign({},this.settings),t),this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}Vc(t){var e;const n=(e=this.path)===null||e===void 0?void 0:e.child(t),s=this.Rc({path:n,mc:!1});return s.fc(t),s}gc(t){var e;const n=(e=this.path)===null||e===void 0?void 0:e.child(t),s=this.Rc({path:n,mc:!1});return s.Ac(),s}yc(t){return this.Rc({path:void 0,mc:!0})}wc(t){return We(t,this.settings.methodName,this.settings.Sc||!1,this.path,this.settings.bc)}contains(t){return this.fieldMask.find((e=>t.isPrefixOf(e)))!==void 0||this.fieldTransforms.find((e=>t.isPrefixOf(e.field)))!==void 0}Ac(){if(this.path)for(let t=0;t<this.path.length;t++)this.fc(this.path.get(t))}fc(t){if(t.length===0)throw this.wc("Document fields must not be empty");if(Bi(this.Ec)&&gc.test(t))throw this.wc('Document fields cannot begin and end with "__"')}}class Ec{constructor(t,e,n){this.databaseId=t,this.ignoreUndefinedProperties=e,this.serializer=n||on(t)}Dc(t,e,n,s=!1){return new fr({Ec:t,methodName:e,bc:n,path:j.emptyPath(),mc:!1,Sc:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function te(r){const t=r._freezeSettings(),e=on(r._databaseId);return new Ec(r._databaseId,!!t.ignoreUndefinedProperties,e)}function hn(r,t,e,n,s,i={}){const o=r.Dc(i.merge||i.mergeFields?2:0,t,e,s);gr("Data must be an object, but it was:",o,n);const a=zi(n,o);let u,c;if(i.merge)u=new Z(o.fieldMask),c=o.fieldTransforms;else if(i.mergeFields){const l=[];for(const h of i.mergeFields){const d=On(t,h,e);if(!o.contains(d))throw new p(f.INVALID_ARGUMENT,`Field '${d}' is specified in your field mask but missing from your input data.`);ji(l,d)||l.push(d)}u=new Z(l),c=o.fieldTransforms.filter((h=>u.covers(h.field)))}else u=null,c=o.fieldTransforms;return new yc(new Y(a),u,c)}class dn extends ln{_toFieldTransform(t){if(t.Ec!==2)throw t.Ec===1?t.wc(`${this._methodName}() can only appear at the top level of your update data`):t.wc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return t.fieldMask.push(t.path),null}isEqual(t){return t instanceof dn}}class mr extends ln{_toFieldTransform(t){return new ha(t.path,new fe)}isEqual(t){return t instanceof mr}}function _r(r,t,e,n){const s=r.Dc(1,t,e);gr("Data must be an object, but it was:",s,n);const i=[],o=Y.empty();Rt(n,((u,c)=>{const l=yr(t,u,e);c=et(c);const h=s.gc(l);if(c instanceof dn)i.push(l);else{const d=we(c,h);d!=null&&(i.push(l),o.set(l,d))}}));const a=new Z(i);return new qi(o,a,s.fieldTransforms)}function pr(r,t,e,n,s,i){const o=r.Dc(1,t,e),a=[On(t,n,e)],u=[s];if(i.length%2!=0)throw new p(f.INVALID_ARGUMENT,`Function ${t}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let d=0;d<i.length;d+=2)a.push(On(t,i[d])),u.push(i[d+1]);const c=[],l=Y.empty();for(let d=a.length-1;d>=0;--d)if(!ji(c,a[d])){const _=a[d];let A=u[d];A=et(A);const v=o.gc(_);if(A instanceof dn)c.push(_);else{const T=we(A,v);T!=null&&(c.push(_),l.set(_,T))}}const h=new Z(c);return new qi(l,h,o.fieldTransforms)}function Tc(r,t,e,n=!1){return we(e,r.Dc(n?4:3,t))}function we(r,t){if($i(r=et(r)))return gr("Unsupported field value:",t,r),zi(r,t);if(r instanceof ln)return(function(n,s){if(!Bi(s.Ec))throw s.wc(`${n._methodName}() can only be used with update() and set()`);if(!s.path)throw s.wc(`${n._methodName}() is not currently supported inside arrays`);const i=n._toFieldTransform(s);i&&s.fieldTransforms.push(i)})(r,t),null;if(r===void 0&&t.ignoreUndefinedProperties)return null;if(t.path&&t.fieldMask.push(t.path),r instanceof Array){if(t.settings.mc&&t.Ec!==4)throw t.wc("Nested arrays are not supported");return(function(n,s){const i=[];let o=0;for(const a of n){let u=we(a,s.yc(o));u==null&&(u={nullValue:"NULL_VALUE"}),i.push(u),o++}return{arrayValue:{values:i}}})(r,t)}return(function(n,s){if((n=et(n))===null)return{nullValue:"NULL_VALUE"};if(typeof n=="number")return ua(s.serializer,n);if(typeof n=="boolean")return{booleanValue:n};if(typeof n=="string")return{stringValue:n};if(n instanceof Date){const i=b.fromDate(n);return{timestampValue:ze(s.serializer,i)}}if(n instanceof b){const i=new b(n.seconds,1e3*Math.floor(n.nanoseconds/1e3));return{timestampValue:ze(s.serializer,i)}}if(n instanceof at)return{geoPointValue:{latitude:n.latitude,longitude:n.longitude}};if(n instanceof X)return{bytesValue:hi(s.serializer,n._byteString)};if(n instanceof N){const i=s.databaseId,o=n.firestore._databaseId;if(!o.isEqual(i))throw s.wc(`Document reference is for database ${o.projectId}/${o.database} but should be for database ${i.projectId}/${i.database}`);return{referenceValue:Kn(n.firestore._databaseId||s.databaseId,n._key.path)}}if(n instanceof ut)return(function(o,a){return{mapValue:{fields:{[Ls]:{stringValue:Us},[Ue]:{arrayValue:{values:o.toArray().map((c=>{if(typeof c!="number")throw a.wc("VectorValues must only contain numeric values.");return jn(a.serializer,c)}))}}}}}})(n,s);throw s.wc(`Unsupported field value: ${Ye(n)}`)})(r,t)}function zi(r,t){const e={};return Ns(r)?t.path&&t.path.length>0&&t.fieldMask.push(t.path):Rt(r,((n,s)=>{const i=we(s,t.Vc(n));i!=null&&(e[n]=i)})),{mapValue:{fields:e}}}function $i(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof b||r instanceof at||r instanceof X||r instanceof N||r instanceof ln||r instanceof ut)}function gr(r,t,e){if(!$i(e)||!bs(e)){const n=Ye(e);throw n==="an object"?t.wc(r+" a custom object"):t.wc(r+" "+n)}}function On(r,t,e){if((t=et(t))instanceof Zt)return t._internalPath;if(typeof t=="string")return yr(r,t);throw We("Field path arguments must be of type string or ",r,!1,void 0,e)}const Ic=new RegExp("[~\\*/\\[\\]]");function yr(r,t,e){if(t.search(Ic)>=0)throw We(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,e);try{return new Zt(...t.split("."))._internalPath}catch{throw We(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,e)}}function We(r,t,e,n,s){const i=n&&!n.isEmpty(),o=s!==void 0;let a=`Function ${t}() called with invalid data`;e&&(a+=" (via `toFirestore()`)"),a+=". ";let u="";return(i||o)&&(u+=" (found",i&&(u+=` in field ${n}`),o&&(u+=` in document ${s}`),u+=")"),new p(f.INVALID_ARGUMENT,a+r+u)}function ji(r,t){return r.some((e=>e.isEqual(t)))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class He{constructor(t,e,n,s,i){this._firestore=t,this._userDataWriter=e,this._key=n,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new N(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const t=new Ac(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}get(t){if(this._document){const e=this._document.data.field(fn("DocumentSnapshot.get",t));if(e!==null)return this._userDataWriter.convertValue(e)}}}class Ac extends He{data(){return super.data()}}function fn(r,t){return typeof t=="string"?yr(r,t):t instanceof Zt?t._internalPath:t._delegate._internalPath}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gi(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new p(f.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class Er{}class Qi extends Er{}function Fc(r,t,...e){let n=[];t instanceof Er&&n.push(t),n=n.concat(e),(function(i){const o=i.filter((u=>u instanceof Tr)).length,a=i.filter((u=>u instanceof mn)).length;if(o>1||o>0&&a>0)throw new p(f.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(n);for(const s of n)r=s._apply(r);return r}class mn extends Qi{constructor(t,e,n){super(),this._field=t,this._op=e,this._value=n,this.type="where"}static _create(t,e,n){return new mn(t,e,n)}_apply(t){const e=this._parse(t);return Ki(t._query,e),new Pt(t.firestore,t.converter,Vn(t._query,e))}_parse(t){const e=te(t.firestore);return(function(i,o,a,u,c,l,h){let d;if(c.isKeyField()){if(l==="array-contains"||l==="array-contains-any")throw new p(f.INVALID_ARGUMENT,`Invalid Query. You can't perform '${l}' queries on documentId().`);if(l==="in"||l==="not-in"){vs(h,l);const A=[];for(const v of h)A.push(ws(u,i,v));d={arrayValue:{values:A}}}else d=ws(u,i,h)}else l!=="in"&&l!=="not-in"&&l!=="array-contains-any"||vs(h,l),d=Tc(a,o,h,l==="in"||l==="not-in");return M.create(c,l,d)})(t._query,"where",e,t.firestore._databaseId,this._field,this._op,this._value)}}function Oc(r,t,e){const n=t,s=fn("where",r);return mn._create(s,n,e)}class Tr extends Er{constructor(t,e){super(),this.type=t,this._queryConstraints=e}static _create(t,e){return new Tr(t,e)}_parse(t){const e=this._queryConstraints.map((n=>n._parse(t))).filter((n=>n.getFilters().length>0));return e.length===1?e[0]:nt.create(e,this._getOperator())}_apply(t){const e=this._parse(t);return e.getFilters().length===0?t:((function(s,i){let o=s;const a=i.getFlattenedFilters();for(const u of a)Ki(o,u),o=Vn(o,u)})(t._query,e),new Pt(t.firestore,t.converter,Vn(t._query,e)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class Ir extends Qi{constructor(t,e){super(),this._field=t,this._direction=e,this.type="orderBy"}static _create(t,e){return new Ir(t,e)}_apply(t){const e=(function(s,i,o){if(s.startAt!==null)throw new p(f.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new p(f.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new de(i,o)})(t._query,this._field,this._direction);return new Pt(t.firestore,t.converter,(function(s,i){const o=s.explicitOrderBy.concat([i]);return new Yt(s.path,s.collectionGroup,o,s.filters.slice(),s.limit,s.limitType,s.startAt,s.endAt)})(t._query,e))}}function Mc(r,t="asc"){const e=t,n=fn("orderBy",r);return Ir._create(n,e)}function ws(r,t,e){if(typeof(e=et(e))=="string"){if(e==="")throw new p(f.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Ks(t)&&e.indexOf("/")!==-1)throw new p(f.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${e}' contains a '/' character.`);const n=t.path.child(C.fromString(e));if(!y.isDocumentKey(n))throw new p(f.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${n}' is not because it has an odd number of segments (${n.length}).`);return Ur(r,new y(n))}if(e instanceof N)return Ur(r,e._key);throw new p(f.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Ye(e)}.`)}function vs(r,t){if(!Array.isArray(r)||r.length===0)throw new p(f.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${t.toString()}' filters.`)}function Ki(r,t){const e=(function(s,i){for(const o of s)for(const a of o.getFlattenedFilters())if(i.indexOf(a.op)>=0)return a.op;return null})(r.filters,(function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(t.op));if(e!==null)throw e===t.op?new p(f.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${t.op.toString()}' filter.`):new p(f.INVALID_ARGUMENT,`Invalid query. You cannot use '${t.op.toString()}' filters with '${e.toString()}' filters.`)}class Wi{convertValue(t,e="none"){switch(At(t)){case 0:return null;case 1:return t.booleanValue;case 2:return F(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(It(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 11:return this.convertObject(t.mapValue,e);case 10:return this.convertVectorValue(t.mapValue);default:throw E(62114,{value:t})}}convertObject(t,e){return this.convertObjectMap(t.fields,e)}convertObjectMap(t,e="none"){const n={};return Rt(t,((s,i)=>{n[s]=this.convertValue(i,e)})),n}convertVectorValue(t){var e,n,s;const i=(s=(n=(e=t.fields)===null||e===void 0?void 0:e[Ue].arrayValue)===null||n===void 0?void 0:n.values)===null||s===void 0?void 0:s.map((o=>F(o.doubleValue)));return new ut(i)}convertGeoPoint(t){return new at(F(t.latitude),F(t.longitude))}convertArray(t,e){return(t.values||[]).map((n=>this.convertValue(n,e)))}convertServerTimestamp(t,e){switch(e){case"previous":const n=Xe(t);return n==null?null:this.convertValue(n,e);case"estimate":return this.convertTimestamp(ce(t));default:return null}}convertTimestamp(t){const e=Tt(t);return new b(e.seconds,e.nanos)}convertDocumentKey(t,e){const n=C.fromString(t);S(yi(n),9688,{name:t});const s=new le(n.get(1),n.get(3)),i=new y(n.popFirst(5));return s.isEqual(e)||dt(`Document ${i} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _n(r,t,e){let n;return n=r?e&&(e.merge||e.mergeFields)?r.toFirestore(t,e):r.toFirestore(t):t,n}class wc extends Wi{constructor(t){super(),this.firestore=t}convertBytes(t){return new X(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new N(this.firestore,null,e)}}class qt{constructor(t,e){this.hasPendingWrites=t,this.fromCache=e}isEqual(t){return this.hasPendingWrites===t.hasPendingWrites&&this.fromCache===t.fromCache}}class gt extends He{constructor(t,e,n,s,i,o){super(t,e,n,s,o),this._firestore=t,this._firestoreImpl=t,this.metadata=i}exists(){return super.exists()}data(t={}){if(this._document){if(this._converter){const e=new Oe(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(e,t)}return this._userDataWriter.convertValue(this._document.data.value,t.serverTimestamps)}}get(t,e={}){if(this._document){const n=this._document.data.field(fn("DocumentSnapshot.get",t));if(n!==null)return this._userDataWriter.convertValue(n,e.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new p(f.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t=this._document,e={};return e.type=gt._jsonSchemaVersion,e.bundle="",e.bundleSource="DocumentSnapshot",e.bundleName=this._key.toString(),!t||!t.isValidDocument()||!t.isFoundDocument()?e:(this._userDataWriter.convertObjectMap(t.data.value.mapValue.fields,"previous"),e.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),e)}}gt._jsonSchemaVersion="firestore/documentSnapshot/1.0",gt._jsonSchema={type:U("string",gt._jsonSchemaVersion),bundleSource:U("string","DocumentSnapshot"),bundleName:U("string"),bundle:U("string")};class Oe extends gt{data(t={}){return super.data(t)}}class bt{constructor(t,e,n,s){this._firestore=t,this._userDataWriter=e,this._snapshot=s,this.metadata=new qt(s.hasPendingWrites,s.fromCache),this.query=n}get docs(){const t=[];return this.forEach((e=>t.push(e))),t}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(t,e){this._snapshot.docs.forEach((n=>{t.call(e,new Oe(this._firestore,this._userDataWriter,n.key,n,new qt(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(t={}){const e=!!t.includeMetadataChanges;if(e&&this._snapshot.excludesMetadataChanges)throw new p(f.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===e||(this._cachedChanges=(function(s,i){if(s._snapshot.oldDocs.isEmpty()){let o=0;return s._snapshot.docChanges.map((a=>{const u=new Oe(s._firestore,s._userDataWriter,a.doc.key,a.doc,new qt(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);return a.doc,{type:"added",doc:u,oldIndex:-1,newIndex:o++}}))}{let o=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((a=>i||a.type!==3)).map((a=>{const u=new Oe(s._firestore,s._userDataWriter,a.doc.key,a.doc,new qt(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);let c=-1,l=-1;return a.type!==0&&(c=o.indexOf(a.doc.key),o=o.delete(a.doc.key)),a.type!==1&&(o=o.add(a.doc),l=o.indexOf(a.doc.key)),{type:vc(a.type),doc:u,oldIndex:c,newIndex:l}}))}})(this,e),this._cachedChangesIncludeMetadataChanges=e),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new p(f.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t={};t.type=bt._jsonSchemaVersion,t.bundleSource="QuerySnapshot",t.bundleName=Ln.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const e=[],n=[],s=[];return this.docs.forEach((i=>{i._document!==null&&(e.push(i._document),n.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))})),t.bundle=(this._firestore,this.query._query,t.bundleName,"NOT SUPPORTED"),t}}function vc(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return E(61501,{type:r})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Lc(r){r=W(r,N);const t=W(r.firestore,rt);return dc(Xt(t),r._key).then((e=>Hi(t,r,e)))}bt._jsonSchemaVersion="firestore/querySnapshot/1.0",bt._jsonSchema={type:U("string",bt._jsonSchemaVersion),bundleSource:U("string","QuerySnapshot"),bundleName:U("string"),bundle:U("string")};class pn extends Wi{constructor(t){super(),this.firestore=t}convertBytes(t){return new X(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new N(this.firestore,null,e)}}function Uc(r){r=W(r,Pt);const t=W(r.firestore,rt),e=Xt(t),n=new pn(t);return Gi(r._query),fc(e,r._query).then((s=>new bt(t,n,r,s)))}function qc(r,t,e){r=W(r,N);const n=W(r.firestore,rt),s=_n(r.converter,t,e);return ve(n,[hn(te(n),"setDoc",r._key,s,r.converter!==null,e).toMutation(r._key,L.none())])}function Bc(r,t,e,...n){r=W(r,N);const s=W(r.firestore,rt),i=te(s);let o;return o=typeof(t=et(t))=="string"||t instanceof Zt?pr(i,"updateDoc",r._key,t,e,n):_r(i,"updateDoc",r._key,t),ve(s,[o.toMutation(r._key,L.exists(!0))])}function zc(r){return ve(W(r.firestore,rt),[new Ee(r._key,L.none())])}function $c(r,t){const e=W(r.firestore,rt),n=_c(r),s=_n(r.converter,t);return ve(e,[hn(te(r.firestore),"addDoc",n._key,s,r.converter!==null,{}).toMutation(n._key,L.exists(!1))]).then((()=>n))}function jc(r,...t){var e,n,s;r=et(r);let i={includeMetadataChanges:!1,source:"default"},o=0;typeof t[o]!="object"||As(t[o])||(i=t[o++]);const a={includeMetadataChanges:i.includeMetadataChanges,source:i.source};if(As(t[o])){const h=t[o];t[o]=(e=h.next)===null||e===void 0?void 0:e.bind(h),t[o+1]=(n=h.error)===null||n===void 0?void 0:n.bind(h),t[o+2]=(s=h.complete)===null||s===void 0?void 0:s.bind(h)}let u,c,l;if(r instanceof N)c=W(r.firestore,rt),l=Ze(r._key.path),u={next:h=>{t[o]&&t[o](Hi(c,r,h))},error:t[o+1],complete:t[o+2]};else{const h=W(r,Pt);c=W(h.firestore,rt),l=h._query;const d=new pn(c);u={next:_=>{t[o]&&t[o](new bt(c,d,h,_))},error:t[o+1],complete:t[o+2]},Gi(r._query)}return(function(d,_,A,v){const T=new hr(v),D=new ur(_,T,A);return d.asyncQueue.enqueueAndForget((async()=>ir(await Ke(d),D))),()=>{T.Ou(),d.asyncQueue.enqueueAndForget((async()=>or(await Ke(d),D)))}})(Xt(c),l,a,u)}function ve(r,t){return(function(n,s){const i=new it;return n.asyncQueue.enqueueAndForget((async()=>Ju(await lc(n),s,i))),i.promise})(Xt(r),t)}function Hi(r,t,e){const n=e.docs.get(t._key),s=new pn(r);return new gt(r,s,t._key,n,new qt(e.hasPendingWrites,e.fromCache),t.converter)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rc={maxAttempts:5};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vc{constructor(t,e){this._firestore=t,this._commitHandler=e,this._mutations=[],this._committed=!1,this._dataReader=te(t)}set(t,e,n){this._verifyNotCommitted();const s=_t(t,this._firestore),i=_n(s.converter,e,n),o=hn(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,n);return this._mutations.push(o.toMutation(s._key,L.none())),this}update(t,e,n,...s){this._verifyNotCommitted();const i=_t(t,this._firestore);let o;return o=typeof(e=et(e))=="string"||e instanceof Zt?pr(this._dataReader,"WriteBatch.update",i._key,e,n,s):_r(this._dataReader,"WriteBatch.update",i._key,e),this._mutations.push(o.toMutation(i._key,L.exists(!0))),this}delete(t){this._verifyNotCommitted();const e=_t(t,this._firestore);return this._mutations=this._mutations.concat(new Ee(e._key,L.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new p(f.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function _t(r,t){if((r=et(r)).firestore!==t)throw new p(f.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pc{constructor(t,e){this._firestore=t,this._transaction=e,this._dataReader=te(t)}get(t){const e=_t(t,this._firestore),n=new wc(this._firestore);return this._transaction.lookup([e._key]).then((s=>{if(!s||s.length!==1)return E(24041);const i=s[0];if(i.isFoundDocument())return new He(this._firestore,n,i.key,i,e.converter);if(i.isNoDocument())return new He(this._firestore,n,e._key,null,e.converter);throw E(18433,{doc:i})}))}set(t,e,n){const s=_t(t,this._firestore),i=_n(s.converter,e,n),o=hn(this._dataReader,"Transaction.set",s._key,i,s.converter!==null,n);return this._transaction.set(s._key,o),this}update(t,e,n,...s){const i=_t(t,this._firestore);let o;return o=typeof(e=et(e))=="string"||e instanceof Zt?pr(this._dataReader,"Transaction.update",i._key,e,n,s):_r(this._dataReader,"Transaction.update",i._key,e),this._transaction.update(i._key,o),this}delete(t){const e=_t(t,this._firestore);return this._transaction.delete(e._key),this}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sc extends Pc{constructor(t,e){super(t,e),this._firestore=t}get(t){const e=_t(t,this._firestore),n=new pn(this._firestore);return super.get(t).then((s=>new gt(this._firestore,n,e._key,s._document,new qt(!1,!1),e.converter)))}}function Gc(r,t,e){r=W(r,rt);const n=Object.assign(Object.assign({},Rc),e);return(function(i){if(i.maxAttempts<1)throw new p(f.INVALID_ARGUMENT,"Max attempts must be at least 1")})(n),(function(i,o,a){const u=new it;return i.asyncQueue.enqueueAndForget((async()=>{const c=await hc(i);new ac(i.asyncQueue,c,a,o,u).zu()})),u.promise})(Xt(r),(s=>t(new Sc(r,s))),n)}function Qc(){return new mr("serverTimestamp")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Kc(r){return Xt(r=W(r,rt)),new Vc(r,(t=>ve(r,t)))}(function(t,e=!0){(function(s){Kt=s})(eo),Ji(new ro("firestore",((n,{instanceIdentifier:s,options:i})=>{const o=n.getProvider("app").getImmediate(),a=new rt(new Io(n.getProvider("auth-internal")),new vo(o,n.getProvider("app-check-internal")),(function(c,l){if(!Object.prototype.hasOwnProperty.apply(c.options,["projectId"]))throw new p(f.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new le(c.options.projectId,l)})(o,s),o);return i=Object.assign({useFetchStreams:e},i),a._setSettings(i),a}),"PUBLIC").setMultipleInstances(!0)),wr(Rr,Vr,t),wr(Rr,Vr,"esm2017")})();export{Uc as a,$c as b,kc as c,_c as d,Lc as e,Kc as f,xc as g,qc as h,Mc as i,zc as j,jc as o,Fc as q,Gc as r,Qc as s,Bc as u,Oc as w};
