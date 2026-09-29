"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => VaultSyncPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

// node_modules/fflate/esm/browser.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ (function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
})();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i = 0; i < d.length; ++i)
        cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
var gzh = function(c, o) {
  var fn = o.filename;
  c[0] = 31, c[1] = 139, c[2] = 8, c[8] = o.level < 2 ? 4 : o.level == 9 ? 2 : 0, c[9] = 3;
  if (o.mtime != 0)
    wbytes(c, 4, Math.floor(new Date(o.mtime || Date.now()) / 1e3));
  if (fn) {
    c[3] = 8;
    for (var i = 0; i <= fn.length; ++i)
      c[i + 10] = fn.charCodeAt(i);
  }
};
var gzhl = function(o) {
  return 10 + (o.filename ? o.filename.length + 1 : 0);
};
var Deflate = /* @__PURE__ */ (function() {
  function Deflate2(opts, cb) {
    if (typeof opts == "function")
      cb = opts, opts = {};
    this.ondata = cb;
    this.o = opts || {};
    this.s = { l: 0, i: 32768, w: 32768, z: 32768 };
    this.b = new u8(98304);
    if (this.o.dictionary) {
      var dict = this.o.dictionary.subarray(-32768);
      this.b.set(dict, 32768 - dict.length);
      this.s.i = 32768 - dict.length;
    }
  }
  Deflate2.prototype.p = function(c, f) {
    this.ondata(dopt(c, this.o, 0, 0, this.s), f);
  };
  Deflate2.prototype.push = function(chunk, final) {
    if (!this.ondata)
      err(5);
    if (this.s.l)
      err(4);
    var endLen = chunk.length + this.s.z;
    if (endLen > this.b.length) {
      if (endLen > 2 * this.b.length - 32768) {
        var newBuf = new u8(endLen & -32768);
        newBuf.set(this.b.subarray(0, this.s.z));
        this.b = newBuf;
      }
      var split = this.b.length - this.s.z;
      this.b.set(chunk.subarray(0, split), this.s.z);
      this.s.z = this.b.length;
      this.p(this.b, false);
      this.b.set(this.b.subarray(-32768));
      this.b.set(chunk.subarray(split), 32768);
      this.s.z = chunk.length - split + 32768;
      this.s.i = 32766, this.s.w = 32768;
    } else {
      this.b.set(chunk, this.s.z);
      this.s.z += chunk.length;
    }
    this.s.l = final & 1;
    if (this.s.z > this.s.w + 8191 || final) {
      this.p(this.b, final || false);
      this.s.w = this.s.i, this.s.i -= 2;
    }
    if (final) {
      this.s = this.o = {};
      this.b = et;
    }
  };
  Deflate2.prototype.flush = function(sync) {
    if (!this.ondata)
      err(5);
    if (this.s.l)
      err(4);
    this.p(this.b, false);
    this.s.w = this.s.i, this.s.i -= 2;
    if (sync) {
      var c = new u8(6);
      c[0] = this.s.r >> 3;
      var ep = wfblk(c, this.s.r, et);
      this.s.r = 0;
      this.ondata(c.subarray(0, ep >> 3), false);
    }
  };
  return Deflate2;
})();
function gzipSync(data, opts) {
  if (!opts)
    opts = {};
  var c = crc(), l = data.length;
  c.p(data);
  var d = dopt(data, opts, gzhl(opts), 8), s = d.length;
  return gzh(d, opts), wbytes(d, s - 8, c.d()), wbytes(d, s - 4, l), d;
}
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
var dbf = function(l) {
  return l == 1 ? 3 : l < 6 ? 2 : l == 9 ? 1 : 0;
};
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
};
var ZipPassThrough = /* @__PURE__ */ (function() {
  function ZipPassThrough2(filename) {
    this.filename = filename;
    this.c = crc();
    this.size = 0;
    this.compression = 0;
  }
  ZipPassThrough2.prototype.process = function(chunk, final) {
    this.ondata(null, chunk, final);
  };
  ZipPassThrough2.prototype.push = function(chunk, final) {
    if (!this.ondata)
      err(5);
    this.c.p(chunk);
    this.size += chunk.length;
    if (final)
      this.crc = this.c.d();
    this.process(chunk, final || false);
  };
  return ZipPassThrough2;
})();
var ZipDeflate = /* @__PURE__ */ (function() {
  function ZipDeflate2(filename, opts) {
    var _this = this;
    if (!opts)
      opts = {};
    ZipPassThrough.call(this, filename);
    this.d = new Deflate(opts, function(dat, final) {
      _this.ondata(null, dat, final);
    });
    this.compression = 8;
    this.flag = dbf(opts.level);
  }
  ZipDeflate2.prototype.process = function(chunk, final) {
    try {
      this.d.push(chunk, final);
    } catch (e) {
      this.ondata(e, null, final);
    }
  };
  ZipDeflate2.prototype.push = function(chunk, final) {
    ZipPassThrough.prototype.push.call(this, chunk, final);
  };
  return ZipDeflate2;
})();
var Zip = /* @__PURE__ */ (function() {
  function Zip2(cb) {
    this.ondata = cb;
    this.u = [];
    this.d = 1;
  }
  Zip2.prototype.add = function(file) {
    var _this = this;
    if (!this.ondata)
      err(5);
    if (this.d & 2)
      this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, false);
    else {
      var f = strToU8(file.filename), fl_1 = f.length;
      var com = file.comment, o = com && strToU8(com);
      var u = fl_1 != file.filename.length || o && com.length != o.length;
      var hl_1 = fl_1 + exfl(file.extra) + 30;
      if (fl_1 > 65535)
        this.ondata(err(11, 0, 1), null, false);
      var header3 = new u8(hl_1);
      wzh(header3, 0, file, f, u, -1);
      var chks_1 = [header3];
      var pAll_1 = function() {
        for (var _i = 0, chks_2 = chks_1; _i < chks_2.length; _i++) {
          var chk = chks_2[_i];
          _this.ondata(null, chk, false);
        }
        chks_1 = [];
      };
      var tr_1 = this.d;
      this.d = 0;
      var ind_1 = this.u.length;
      var uf_1 = mrg(file, {
        f,
        u,
        o,
        t: function() {
          if (file.terminate)
            file.terminate();
        },
        r: function() {
          pAll_1();
          if (tr_1) {
            var nxt = _this.u[ind_1 + 1];
            if (nxt)
              nxt.r();
            else
              _this.d = 1;
          }
          tr_1 = 1;
        }
      });
      var cl_1 = 0;
      file.ondata = function(err2, dat, final) {
        if (err2) {
          _this.ondata(err2, dat, final);
          _this.terminate();
        } else {
          cl_1 += dat.length;
          chks_1.push(dat);
          if (final) {
            var dd = new u8(16);
            wbytes(dd, 0, 134695760);
            wbytes(dd, 4, file.crc);
            wbytes(dd, 8, cl_1);
            wbytes(dd, 12, file.size);
            chks_1.push(dd);
            uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
            if (tr_1)
              uf_1.r();
            tr_1 = 1;
          } else if (tr_1)
            pAll_1();
        }
      };
      this.u.push(uf_1);
    }
  };
  Zip2.prototype.end = function() {
    var _this = this;
    if (this.d & 2) {
      this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, true);
      return;
    }
    if (this.d)
      this.e();
    else
      this.u.push({
        r: function() {
          if (!(_this.d & 1))
            return;
          _this.u.splice(-1, 1);
          _this.e();
        },
        t: function() {
        }
      });
    this.d = 3;
  };
  Zip2.prototype.e = function() {
    var bt = 0, l = 0, tl = 0;
    for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
      var f = _a2[_i];
      tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
    }
    var out = new u8(tl + 22);
    for (var _b2 = 0, _c = this.u; _b2 < _c.length; _b2++) {
      var f = _c[_b2];
      wzh(out, bt, f, f.f, f.u, -f.c - 2, l, f.o);
      bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l += f.b;
    }
    wzf(out, bt, this.u.length, tl, l);
    this.ondata(null, out, true);
    this.d = 2;
  };
  Zip2.prototype.terminate = function() {
    for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
      var f = _a2[_i];
      f.t();
    }
    this.d = 2;
  };
  return Zip2;
})();

// src/archive.ts
var BLOCK = 512;
function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function sanitizeVaultName(name) {
  const cleaned = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || "vault";
}
function backupFileName(date, vaultName, format) {
  return `${formatTimestamp(date)}_${sanitizeVaultName(vaultName)}.${format}`;
}
function normalizeBackupFolder(input) {
  const folder = input.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!folder) return "backups";
  const parts = folder.split("/");
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) {
    throw new Error("Backup folder must be a folder inside the vault.");
  }
  return parts.join("/");
}
function isInBackupFolder(path, folder) {
  const key = path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").toLowerCase();
  const root = folder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!key || !root) return false;
  return key === root || key.startsWith(`${root}/`);
}
function zipEntries(files, folders) {
  const parts = [];
  let failure = null;
  const zip = new Zip((error, chunk) => {
    if (error) failure = error instanceof Error ? error : new Error(String(error));
    else if (chunk.length > 0) parts.push(chunk);
  });
  for (const folder of folders) addZip(zip, folderPath(folder.path), new Uint8Array(0), folder.mtimeMs);
  for (const file of files) addZip(zip, file.path, file.data, file.mtimeMs);
  zip.end();
  if (failure) throw failure;
  return concat(parts);
}
function gzipEntries(files, folders) {
  const parts = [];
  for (const folder of folders) parts.push(...tarFolderParts(folder.path, folder.mtimeMs));
  for (const file of files) parts.push(...tarFileParts(file.path, file.data, file.mtimeMs));
  parts.push(tarEnd());
  return gzipBytes(concat(parts));
}
function addZip(zip, path, data, mtimeMs) {
  const entry = new ZipDeflate(path);
  entry.mtime = new Date(mtimeMs);
  zip.add(entry);
  entry.push(data, true);
}
function folderPath(path) {
  return path.endsWith("/") ? path : `${path}/`;
}
function gzipBytes(data) {
  return gzipSync(data);
}
function tarFileParts(path, data, mtimeMs) {
  const parts = tarHeaderParts(path, data.length, mtimeMs, "0");
  parts.push(data);
  const extra = padding(data.length);
  if (extra > 0) parts.push(new Uint8Array(extra));
  return parts;
}
function tarFolderParts(path, mtimeMs) {
  const folder = path.endsWith("/") ? path.slice(0, -1) : path;
  return tarHeaderParts(folder, 0, mtimeMs, "5");
}
function tarHeaderParts(path, size, mtimeMs, typeflag) {
  const located = locateName(path);
  const parts = [];
  if (located.long) parts.push(...longNameParts(path));
  parts.push(header(located.name, located.prefix, size, Math.floor(mtimeMs / 1e3), typeflag));
  return parts;
}
function tarEnd() {
  return new Uint8Array(BLOCK * 2);
}
function locateName(path) {
  if (byteLength(path) <= 100) return { name: path, prefix: "", long: false };
  const pieces = path.split("/");
  for (let index = pieces.length - 1; index >= 1; index -= 1) {
    const name = pieces.slice(index).join("/");
    const prefix = pieces.slice(0, index).join("/");
    if (byteLength(name) <= 100 && byteLength(prefix) <= 155) return { name, prefix, long: false };
  }
  return { name: shortName(path), prefix: "", long: true };
}
function longNameParts(path) {
  const content = utf8(`${path}\0`);
  const padded = new Uint8Array(content.length + padding(content.length));
  padded.set(content);
  return [header("././@LongLink", "", content.length, 0, "L"), padded];
}
function header(name, prefix, size, mtimeSec, typeflag) {
  const block = new Uint8Array(BLOCK);
  writeText(block, 0, name, 100);
  writeOctal(block, 100, 8, 420);
  writeOctal(block, 108, 8, 0);
  writeOctal(block, 116, 8, 0);
  writeOctal(block, 124, 12, size);
  writeOctal(block, 136, 12, mtimeSec);
  block.fill(32, 148, 156);
  block[156] = typeflag.charCodeAt(0);
  writeText(block, 257, "ustar", 5);
  block[262] = 0;
  block[263] = "0".charCodeAt(0);
  block[264] = "0".charCodeAt(0);
  writeText(block, 345, prefix, 155);
  let sum = 0;
  for (let index = 0; index < BLOCK; index += 1) sum += block[index];
  const checksum = sum.toString(8).padStart(6, "0");
  for (let index = 0; index < 6; index += 1) block[148 + index] = checksum.charCodeAt(index);
  block[154] = 0;
  block[155] = 32;
  return block;
}
function shortName(path) {
  const base = path.split("/").pop() || "file";
  let result = "";
  for (const char of base) {
    if (byteLength(result + char) > 100) break;
    result += char;
  }
  return result || "file";
}
function writeText(block, offset, text, max) {
  const bytes = utf8(text);
  block.set(bytes.subarray(0, Math.min(bytes.length, max)), offset);
}
function writeOctal(block, offset, length, value) {
  const text = Math.max(0, Math.floor(value)).toString(8).padStart(length - 1, "0");
  for (let index = 0; index < length - 1; index += 1) block[offset + index] = text.charCodeAt(index);
  block[offset + length - 1] = 0;
}
function padding(size) {
  return (BLOCK - size % BLOCK) % BLOCK;
}
function byteLength(text) {
  return utf8(text).length;
}
function utf8(text) {
  return new TextEncoder().encode(text);
}
function concat(parts) {
  let size = 0;
  for (const part of parts) size += part.length;
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

// src/backup.ts
var import_obsidian = require("obsidian");
var BackupCancelled = class extends Error {
  constructor() {
    super("Backup stopped.");
    this.name = "BackupCancelled";
  }
};
async function createBackup(options) {
  var _a2;
  const folder = normalizeBackupFolder(options.folder);
  const items = await listVault(options.vault, folder);
  const files = [];
  const folders = [];
  let index = 0;
  for (const item of items) {
    if (options.cancelled()) throw new BackupCancelled();
    index += 1;
    options.update(`${index} / ${items.length}  ${item.path}`);
    const stat = await options.vault.adapter.stat(item.path);
    const mtimeMs = (_a2 = stat == null ? void 0 : stat.mtime) != null ? _a2 : options.now.getTime();
    if (item.kind === "folder") {
      folders.push({ path: item.path, mtimeMs });
    } else {
      files.push({
        path: item.path,
        data: new Uint8Array(await options.vault.adapter.readBinary(item.path)),
        mtimeMs
      });
    }
    await yieldToUi();
  }
  if (options.cancelled()) throw new BackupCancelled();
  options.update("Writing archive\u2026");
  const bytes = options.format === "gzip" ? gzipEntries(files, folders) : zipEntries(files, folders);
  const target = (0, import_obsidian.normalizePath)(`${folder}/${backupFileName(options.now, options.vaultName, options.format)}`);
  await ensureFolder(options.vault, folder);
  await options.vault.adapter.writeBinary(target, copyBuffer(bytes));
  return target;
}
async function listVault(vault, backupFolder) {
  const items = [];
  await walk(vault, await listPath(vault, "/"), backupFolder, items);
  return items;
}
async function walk(vault, listed, backupFolder, items) {
  for (const folder of listed.folders) {
    if (isInBackupFolder(folder, backupFolder)) continue;
    items.push({ path: folder, kind: "folder" });
    await walk(vault, await listPath(vault, folder), backupFolder, items);
  }
  for (const file of listed.files) {
    if (isInBackupFolder(file, backupFolder)) continue;
    items.push({ path: file, kind: "file" });
  }
}
async function listPath(vault, path) {
  try {
    return await vault.adapter.list(path || "/");
  } catch (error) {
    if (path === "/") return vault.adapter.list("");
    throw error;
  }
}
async function ensureFolder(vault, folder) {
  const parts = folder.split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const existing = vault.getAbstractFileByPath(current);
    if (existing) continue;
    try {
      await vault.createFolder(current);
    } catch (error) {
      if (!vault.getAbstractFileByPath(current)) throw error;
    }
  }
}
function copyBuffer(bytes) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}
function yieldToUi() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// src/dropbox.ts
var import_obsidian2 = require("obsidian");

// src/app-key.ts
var APP_KEY = /^[A-Za-z0-9]{15}$/;
function normalizeAppKey(value) {
  const token = value.trim().split(/\s+/).find((part) => APP_KEY.test(part));
  if (!token) {
    throw new Error(
      "Paste only the Dropbox App key. It is 15 characters, shown next to App secret. Do not paste the App secret or a generated access token."
    );
  }
  return token;
}

// src/hash.ts
async function sha256Hex(data) {
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}
function base64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function randomVerifier() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}
async function codeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

// src/paths.ts
function normalizeRelative(value) {
  return value.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}
function pathKey(value) {
  return normalizeRelative(value).toLowerCase();
}
function normalizeDropboxFolder(input) {
  const trimmed = input.trim().replace(/\\/g, "/");
  if (!trimmed) throw new Error("Set the Dropbox folder.");
  if (trimmed === "/") return "/";
  const parts = trimmed.split("/").filter((part) => part.length > 0);
  if (parts.some((part) => part === "." || part === "..")) {
    throw new Error("Dropbox folder cannot contain . or ..");
  }
  return `/${parts.join("/")}`;
}
function listPath2(folder) {
  return folder === "/" ? "" : folder;
}
function syncVaultFolder(root, vaultName) {
  const parent = normalizeDropboxFolder(root);
  const name = vaultName.replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim() || "vault";
  return parent === "/" ? `/${name}` : `${parent}/${name}`;
}
function toDropboxPath(root, relativePath) {
  const rel = normalizeRelative(relativePath);
  const base = normalizeDropboxFolder(root);
  if (base === "/") return `/${rel}`;
  return rel ? `${base}/${rel}` : base;
}
function fromDropboxPath(root, pathDisplay) {
  const full = pathDisplay.startsWith("/") ? pathDisplay : `/${pathDisplay}`;
  const base = normalizeDropboxFolder(root);
  if (base === "/") {
    const rel = full.slice(1);
    return rel.length > 0 ? rel : null;
  }
  if (full.toLowerCase() === base.toLowerCase()) return null;
  const prefix = `${base.toLowerCase()}/`;
  if (!full.toLowerCase().startsWith(prefix)) return null;
  return full.slice(base.length + 1);
}
function normalizeAttachmentsFolder(input) {
  let folder = normalizeRelative(input);
  if (folder.startsWith("./")) folder = folder.slice(2);
  const parts = folder.split("/").filter((part) => part.length > 0);
  if (parts.length === 0 || parts.some((part) => part === "." || part === ".." || part.startsWith("."))) {
    throw new Error("Set the attachments folder to a folder inside the vault.");
  }
  return parts.join("/");
}
function isIncluded(relativePath, attachmentsFolder) {
  const path = normalizeRelative(relativePath);
  if (!path) return false;
  const parts = path.split("/");
  if (parts.some((part) => part.length === 0 || part.startsWith(".") || part === "..")) return false;
  if (path.toLowerCase().endsWith(".md")) return true;
  const folder = normalizeRelative(attachmentsFolder);
  if (!folder || folder === "." || folder.split("/").some((part) => part === "." || part === "..")) {
    return false;
  }
  return path.toLowerCase().startsWith(`${folder.toLowerCase()}/`);
}
function headerJson(value) {
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (ch) => {
    return `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}
function conflictText(kind) {
  if (kind === "both-changed") {
    return "Changed on this device and in Dropbox. Neither copy was written. Edit the file, then sync again to send your version.";
  }
  if (kind === "deleted-local") {
    return "This file is not on this device, and it is still in Dropbox. Nothing was deleted. Put the file back in the vault, then sync again.";
  }
  return "This file is on this device and not in Dropbox. Nothing was removed. Edit it and sync again to send it, or delete it here and sync again to drop it.";
}

// src/dropbox.ts
var CHUNK = 8 * 1024 * 1024;
var DropboxError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "DropboxError";
  }
};
var DropboxClient = class {
  constructor(settings, save) {
    this.settings = settings;
    this.save = save;
    this.authorizationUrl = async () => {
      const key = this.readAppKey();
      const verifier = randomVerifier();
      this.settings.codeVerifier = verifier;
      await this.save();
      const challenge = await codeChallenge(verifier);
      const params = new URLSearchParams({
        client_id: key,
        response_type: "code",
        token_access_type: "offline",
        code_challenge: challenge,
        code_challenge_method: "S256"
      });
      return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
    };
    this.exchangeCode = async (code) => {
      const verifier = this.settings.codeVerifier;
      if (!verifier) throw new DropboxError("Open the Dropbox authorization page again, then paste the new code.");
      const body = new URLSearchParams({
        code: code.trim(),
        grant_type: "authorization_code",
        client_id: this.readAppKey(),
        code_verifier: verifier
      });
      const token = await this.tokenRequest(body);
      if (!token.refresh_token) {
        throw new DropboxError("Dropbox did not return a refresh token. Open the authorization page again.");
      }
      this.settings.refreshToken = token.refresh_token;
      this.settings.accessToken = token.access_token;
      this.settings.accessTokenExpiresAt = Date.now() + token.expires_in * 1e3;
      this.settings.codeVerifier = "";
      this.settings.accountEmail = await this.accountEmail();
      await this.save();
    };
    this.disconnect = async () => {
      this.settings.refreshToken = "";
      this.settings.accessToken = "";
      this.settings.accessTokenExpiresAt = 0;
      this.settings.codeVerifier = "";
      this.settings.accountEmail = "";
      await this.save();
    };
    this.listFiles = async (folder) => {
      const first = await this.rpc("files/list_folder", {
        path: listPath2(folder),
        recursive: true,
        include_deleted: false,
        include_mounted_folders: true,
        limit: 2e3
      });
      if (first.missing) return { missing: true, files: [] };
      const files = [];
      let page = first.body;
      for (; ; ) {
        for (const entry of page.entries) {
          if (entry[".tag"] !== "file") continue;
          const relativePath = fromDropboxPath(folder, entry.path_display);
          if (relativePath === null) continue;
          files.push({
            relativePath,
            dropboxPath: entry.path_display,
            rev: entry.rev,
            size: entry.size
          });
        }
        if (!page.has_more) break;
        const next = await this.rpc("files/list_folder/continue", { cursor: page.cursor });
        if (next.missing) throw new DropboxError("Dropbox folder listing ended early.");
        page = next.body;
      }
      return { missing: false, files };
    };
    this.download = async (dropboxPath) => {
      var _a2;
      const res = await this.content("files/download", { path: dropboxPath });
      if (res.status === 409 && isNotFound(res.text)) throw new DropboxError("missing");
      if (res.status < 200 || res.status >= 300) throw new DropboxError(errorText(res.text, res.status));
      const meta = JSON.parse(header2(res, "dropbox-api-result") || "{}");
      if (meta.rev) {
        return { bytes: res.arrayBuffer, rev: meta.rev, size: (_a2 = meta.size) != null ? _a2 : res.arrayBuffer.byteLength };
      }
      const found = await this.metadata(dropboxPath);
      if (!found) throw new DropboxError("Dropbox download did not return a revision.");
      return { bytes: res.arrayBuffer, rev: found.rev, size: found.size };
    };
    this.metadata = async (dropboxPath) => {
      var _a2;
      const res = await this.rpc("files/get_metadata", { path: dropboxPath });
      if (res.missing) return null;
      const body = res.body;
      if (body[".tag"] !== "file" || !body.rev || !body.path_display) return null;
      return { rev: body.rev, size: (_a2 = body.size) != null ? _a2 : 0, pathDisplay: body.path_display };
    };
    this.upload = async (dropboxPath, bytes, mode) => {
      const commit = { path: dropboxPath, mode };
      const result = bytes.byteLength <= CHUNK ? await this.simpleUpload(commit, bytes) : await this.sessionUpload(commit, bytes);
      return result;
    };
    this.simpleUpload = async (commit, bytes) => {
      const res = await this.content("files/upload", uploadArg(commit), bytes);
      return readUpload(res);
    };
    this.sessionUpload = async (commit, bytes) => {
      const chunks = [];
      for (let offset = 0; offset < bytes.byteLength; offset += CHUNK) {
        chunks.push(bytes.slice(offset, Math.min(offset + CHUNK, bytes.byteLength)));
      }
      const started = await this.content("files/upload_session/start", { close: false }, chunks[0]);
      if (started.status < 200 || started.status >= 300) {
        throw new DropboxError(errorText(started.text, started.status));
      }
      const sessionId = JSON.parse(started.text).session_id;
      let cursor = chunks[0].byteLength;
      for (let i = 1; i < chunks.length - 1; i++) {
        const appended = await this.content(
          "files/upload_session/append_v2",
          { cursor: { session_id: sessionId, offset: cursor }, close: false },
          chunks[i]
        );
        if (appended.status < 200 || appended.status >= 300) {
          throw new DropboxError(errorText(appended.text, appended.status));
        }
        cursor += chunks[i].byteLength;
      }
      const last = chunks[chunks.length - 1];
      const finished = await this.content(
        "files/upload_session/finish",
        {
          cursor: { session_id: sessionId, offset: cursor },
          commit: uploadArg(commit)
        },
        last
      );
      return readUpload(finished);
    };
    this.accountEmail = async () => {
      var _a2;
      const res = await this.rpc("users/get_current_account", null);
      const body = res.body;
      return (_a2 = body.email) != null ? _a2 : "";
    };
    this.readAppKey = () => {
      try {
        const key = normalizeAppKey(this.settings.appKey);
        this.settings.appKey = key;
        return key;
      } catch (error) {
        throw new DropboxError(error instanceof Error ? error.message : String(error));
      }
    };
    this.refresh = async () => {
      if (!this.settings.refreshToken || !this.settings.appKey.trim()) {
        throw new DropboxError("Connect Dropbox in the plugin settings.");
      }
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.settings.refreshToken,
        client_id: this.readAppKey()
      });
      const token = await this.tokenRequest(body);
      if (token.refresh_token) this.settings.refreshToken = token.refresh_token;
      this.settings.accessToken = token.access_token;
      this.settings.accessTokenExpiresAt = Date.now() + token.expires_in * 1e3;
      await this.save();
    };
    this.accessToken = async () => {
      if (this.settings.accessToken && this.settings.accessTokenExpiresAt > Date.now() + 12e4) {
        return this.settings.accessToken;
      }
      await this.refresh();
      return this.settings.accessToken;
    };
    this.tokenRequest = async (body) => {
      const res = await (0, import_obsidian2.requestUrl)({
        url: "https://api.dropboxapi.com/oauth2/token",
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        throw: false
      });
      const parsed = parseJson(res.text);
      if (res.status < 200 || res.status >= 300 || !parsed.access_token) {
        throw new DropboxError(parsed.error_description || parsed.error || `Dropbox authorization failed (${res.status}).`);
      }
      return parsed;
    };
    this.rpc = async (endpoint, args) => {
      const send = async () => {
        const token = await this.accessToken();
        return (0, import_obsidian2.requestUrl)({
          url: `https://api.dropboxapi.com/2/${endpoint}`,
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: args === null ? "null" : JSON.stringify(args),
          throw: false
        });
      };
      const res = await this.withRetry(send);
      if (res.status === 409 && isNotFound(res.text)) return { missing: true, body: null };
      if (res.status < 200 || res.status >= 300) throw new DropboxError(errorText(res.text, res.status));
      return { missing: false, body: parseJson(res.text) };
    };
    this.content = async (endpoint, arg, body) => {
      const send = async () => {
        const token = await this.accessToken();
        const payload = {
          url: `https://content.dropboxapi.com/2/${endpoint}`,
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/octet-stream",
            "Dropbox-API-Arg": headerJson(arg)
          },
          throw: false
        };
        if (body !== void 0) payload.body = body;
        return (0, import_obsidian2.requestUrl)(payload);
      };
      return this.withRetry(send);
    };
    this.withRetry = async (send) => {
      let delay = 1e3;
      let refreshed = false;
      let res = await send();
      for (let attempt = 0; attempt < 3; attempt++) {
        if (res.status === 401 && !refreshed) {
          refreshed = true;
          await this.refresh();
          res = await send();
          continue;
        }
        if (res.status === 429 || res.status >= 500) {
          const retryAfter = Number(header2(res, "retry-after"));
          await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1e3 : delay);
          delay *= 2;
          res = await send();
          continue;
        }
        return res;
      }
      return res;
    };
  }
};
function uploadArg(commit) {
  const mode = commit.mode === "add" || commit.mode === "overwrite" ? { ".tag": commit.mode } : { ".tag": "update", update: commit.mode.update };
  return {
    path: commit.path,
    mode,
    autorename: false,
    mute: true,
    strict_conflict: false
  };
}
function readUpload(res) {
  var _a2;
  if (res.status === 409 && res.text.includes("conflict")) return { conflict: true };
  if (res.status < 200 || res.status >= 300) throw new DropboxError(errorText(res.text, res.status));
  const meta = parseJson(res.text);
  if (!meta.rev) throw new DropboxError("Dropbox upload did not return a revision.");
  return { conflict: false, rev: meta.rev, size: (_a2 = meta.size) != null ? _a2 : 0 };
}
function parseJson(text) {
  if (!text) return {};
  return JSON.parse(text);
}
function isNotFound(text) {
  return text.includes("not_found");
}
function errorText(text, status) {
  const parsed = text ? safeParse(text) : null;
  if (parsed && typeof parsed === "object") {
    const record = parsed;
    if (record.error_summary) return record.error_summary;
    if (record.error_description) return record.error_description;
  }
  return text || `Dropbox request failed (${status}).`;
}
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}
function header2(res, name) {
  const want = name.toLowerCase();
  for (const key of Object.keys(res.headers)) {
    if (key.toLowerCase() === want) return res.headers[key];
  }
  return void 0;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// src/errors.ts
function errorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

// src/modals.ts
var import_obsidian3 = require("obsidian");
var SyncProgressModal = class extends import_obsidian3.Modal {
  constructor(app, title = "Syncing") {
    super(app);
    this.title = title;
    this.cancelled = false;
    this.finished = false;
    this.line = null;
  }
  onOpen() {
    this.setTitle(this.title);
    this.line = this.contentEl.createEl("p", { cls: "vault-sync-progress-line", text: "Starting\u2026" });
    const buttons = this.contentEl.createDiv({ cls: "modal-button-container" });
    const stop = buttons.createEl("button", { text: "Stop" });
    stop.onclick = () => this.close();
  }
  setStatus(text) {
    var _a2;
    (_a2 = this.line) == null ? void 0 : _a2.setText(text);
  }
  finish() {
    if (this.finished) return;
    this.finished = true;
    this.close();
  }
  onClose() {
    if (!this.finished) this.cancelled = true;
  }
};
var ConflictModal = class extends import_obsidian3.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    this.setTitle("Sync conflicts");
    this.render();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    const conflicts = this.plugin.state.conflicts;
    if (conflicts.length === 0) {
      contentEl.createEl("p", { text: "No conflicts." });
      return;
    }
    contentEl.createEl("p", {
      text: "Resolve these in the vault, then sync again. A conflict is left unchanged until you edit or delete the file."
    });
    for (const conflict of conflicts) {
      const row = contentEl.createDiv({ cls: "vault-sync-conflict" });
      row.createEl("div", { cls: "vault-sync-conflict-path", text: conflict.path });
      row.createEl("div", { cls: "setting-item-description", text: conflictText(conflict.kind) });
      const file = this.app.vault.getAbstractFileByPath(conflict.path);
      if (file instanceof import_obsidian3.TFile) {
        const buttons = row.createDiv({ cls: "vault-sync-conflict-buttons" });
        const open = buttons.createEl("button", { text: "Open" });
        open.onclick = () => {
          void this.app.workspace.getLeaf(false).openFile(file);
          this.close();
        };
      }
    }
  }
};

// src/settings.ts
var import_obsidian4 = require("obsidian");
var VaultSyncSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.authUrl = "";
    this.authCode = "";
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("p", {
      text: "Syncs Markdown notes and one attachments folder through Dropbox. Install this plugin in the vault on the Mac and on the iPhone. Both devices use the same Dropbox folder and the same attachments path."
    });
    containerEl.createEl("p", {
      text: "The Mac vault can stay on Google Drive. The iPhone vault can stay on iCloud. This plugin reads the open vault and copies those files through Dropbox."
    });
    containerEl.createEl("p", {
      text: "While Obsidian is open, the vault syncs in the background. One run uploads changes from this device and downloads changes from Dropbox. It also syncs when you return to the app. If a file changed on both devices, or it was removed on only one device, it is left in place. Resolve it in the vault, then sync again."
    });
    new import_obsidian4.Setting(containerEl).setName("Dropbox app key").setDesc("Create a Scoped access app in the Dropbox App Console. On Permissions, enable files.metadata.read, files.content.read, files.content.write, and account_info.read, then click Submit. Paste only the App key. It is 15 characters. Do not paste the App secret. Full Dropbox access uses the folder below. App folder access keeps files inside that app; set the folder to / to use the root of the app folder.").addText((text) => {
      text.setPlaceholder("App key").setValue(this.plugin.settings.appKey);
      text.onChange(async (value) => {
        this.plugin.settings.appKey = value.trim();
        await this.plugin.persist();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Dropbox folder").setDesc("Folder for every synced vault. Each vault is stored in a subfolder with the vault's name, so the Mac and the iPhone need the same vault name.").addText((text) => {
      text.setPlaceholder("/ObsidianAnovem").setValue(this.plugin.settings.dropboxFolder);
      text.onChange(async (value) => {
        this.plugin.settings.dropboxFolder = value.trim();
        await this.plugin.persist();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Attachments folder").setDesc("Folder inside the vault. Markdown notes anywhere in the vault are included. Other files are included only from this folder. Use the same path, including capital letters, on every device.").addText((text) => {
      text.setPlaceholder("attachments").setValue(this.plugin.settings.attachmentsFolder);
      text.onChange(async (value) => {
        this.plugin.settings.attachmentsFolder = value.trim();
        await this.plugin.persist();
      });
    });
    if (this.plugin.settings.refreshToken) {
      new import_obsidian4.Setting(containerEl).setName("Dropbox account").setDesc(this.plugin.settings.accountEmail || "Connected").addButton((button) => {
        button.setButtonText("Disconnect").setWarning();
        button.onClick(async () => {
          await this.plugin.client.disconnect();
          this.authUrl = "";
          this.authCode = "";
          this.display();
        });
      });
    } else {
      new import_obsidian4.Setting(containerEl).setName("Connect Dropbox").setDesc("Opens Dropbox so you can copy an authorization code. Paste that code below.").addButton((button) => {
        button.setButtonText("Open Dropbox").setCta();
        button.onClick(async () => {
          try {
            this.authUrl = await this.plugin.client.authorizationUrl();
            window.open(this.authUrl, "_blank");
            this.display();
          } catch (error) {
            new import_obsidian4.Notice(errorMessage(error));
          }
        });
      });
      if (this.authUrl || this.plugin.settings.codeVerifier) {
        new import_obsidian4.Setting(containerEl).setName("Authorization address").setDesc("If the browser did not open, copy this address and open it.").addTextArea((text) => {
          text.setValue(this.authUrl);
          text.inputEl.rows = 3;
          text.inputEl.readOnly = true;
        });
        new import_obsidian4.Setting(containerEl).setName("Authorization code").addText((text) => {
          text.setPlaceholder("Paste the code").setValue(this.authCode);
          text.onChange((value) => {
            this.authCode = value.trim();
          });
        }).addButton((button) => {
          button.setButtonText("Connect").setCta();
          button.onClick(async () => {
            try {
              await this.plugin.client.exchangeCode(this.authCode);
              this.authUrl = "";
              this.authCode = "";
              this.display();
              const email = this.plugin.settings.accountEmail;
              new import_obsidian4.Notice(email ? `Connected as ${email}` : "Connected to Dropbox.");
            } catch (error) {
              new import_obsidian4.Notice(errorMessage(error));
            }
          });
        });
      }
    }
    new import_obsidian4.Setting(containerEl).setName("Background sync").setDesc("Runs while Obsidian is open, including while you edit. It also runs when you come back to the app. It stops when Obsidian is closed.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.backgroundSync);
      toggle.onChange(async (value) => {
        this.plugin.settings.backgroundSync = value;
        await this.plugin.persist();
        this.plugin.scheduleBackgroundSync();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Sync every").setDesc("Minutes between background syncs. From 1 to 240.").addText((text) => {
      text.setPlaceholder("5").setValue(String(this.plugin.settings.syncIntervalMinutes));
      text.onChange(async (value) => {
        const minutes = Number(value);
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) return;
        this.plugin.settings.syncIntervalMinutes = minutes;
        await this.plugin.persist();
        this.plugin.scheduleBackgroundSync();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Sync").setDesc(this.plugin.settings.lastSyncSummary || "Not synced yet.").addButton((button) => {
      button.setButtonText("Show conflicts");
      button.onClick(() => this.plugin.showConflicts());
    }).addButton((button) => {
      button.setButtonText("Sync both ways").setCta();
      button.onClick(() => {
        void this.plugin.syncNow();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Backup format").setDesc("The file is named {timestamp}_{vault name}.zip or {timestamp}_{vault name}.gzip. gzip is a gzip-compressed tar of the vault. The backup folder itself is left out of the archive.").addDropdown((dropdown) => {
      dropdown.addOption("zip", "zip");
      dropdown.addOption("gzip", "gzip");
      dropdown.setValue(this.plugin.settings.backupFormat === "gzip" ? "gzip" : "zip");
      dropdown.onChange(async (value) => {
        this.plugin.settings.backupFormat = value === "gzip" ? "gzip" : "zip";
        await this.plugin.persist();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Backup folder").setDesc("Folder inside the vault. On the Mac the file stays with the Google Drive vault. On the iPhone it stays with the iCloud vault.").addText((text) => {
      text.setPlaceholder("backups").setValue(this.plugin.settings.backupFolder);
      text.onChange(async (value) => {
        this.plugin.settings.backupFolder = value.trim();
        await this.plugin.persist();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Backup").addButton((button) => {
      button.setButtonText("Backup vault").setCta();
      button.onClick(() => {
        void this.plugin.backupNow();
      });
    });
  }
};

// src/sync.ts
var import_obsidian5 = require("obsidian");

// src/plan.ts
function planSync(local, remote) {
  if (local === "absent" && remote === "absent") return { action: "forget" };
  if (local === "untracked" && remote === "absent") return { action: "upload" };
  if (local === "absent" && remote === "untracked") return { action: "download" };
  if (local === "untracked") return { action: "compare" };
  if (remote === "untracked") return { action: "compare" };
  if (local === "unchanged" && remote === "unchanged") return { action: "skip" };
  if (local === "changed" && remote === "unchanged") return { action: "upload" };
  if (local === "unchanged" && remote === "changed") return { action: "download" };
  if (local === "changed" && remote === "changed") return { action: "compare" };
  if (local === "absent") return { action: "conflict", kind: "deleted-local" };
  return { action: "conflict", kind: "deleted-remote" };
}
function planAfterCompare(equal) {
  if (equal) return { action: "adopt" };
  return { action: "conflict", kind: "both-changed" };
}
function planManualResolution(snapshot, localHash, remoteRev) {
  if (localHash === null && remoteRev === null) return "forget";
  const localSame = localHash === snapshot.localHash;
  const remoteSame = remoteRev === snapshot.remoteRev;
  if (localSame && remoteSame) return "hold";
  if (!localSame && remoteSame) {
    if (localHash === null) return "hold";
    return "upload";
  }
  if (localSame && !remoteSame) {
    if (remoteRev === null || localHash === null) return "hold";
    return "download";
  }
  if (localHash === null || remoteRev === null) return "hold";
  return "compare";
}

// src/sync.ts
function summarize(report) {
  const base = report.cancelled ? "Sync stopped. " : "";
  if (!report.cancelled && report.uploaded === 0 && report.downloaded === 0 && report.conflicts === 0 && report.failed.length === 0) {
    return "Already in sync.";
  }
  const text = `${base}Uploaded ${report.uploaded}, downloaded ${report.downloaded}, conflicts ${report.conflicts}.`;
  if (report.failed.length === 0) return text;
  return `${text} ${report.failed.slice(0, 3).join(" ")}`;
}
var SyncEngine = class {
  constructor(app, settings, state, persist, client) {
    this.app = app;
    this.settings = settings;
    this.state = state;
    this.persist = persist;
    this.client = client;
    this.sync = async (ui) => {
      const report = { uploaded: 0, downloaded: 0, conflicts: 0, failed: [], cancelled: false };
      const nextConflicts = [];
      const seen = /* @__PURE__ */ new Set();
      let listed = false;
      let items = [];
      const previous = new Map(this.state.conflicts.map((conflict) => [pathKey(conflict.path), conflict]));
      try {
        if (!this.settings.refreshToken) throw new Error("Connect Dropbox in Vault Anovem Sync settings.");
        const root = normalizeDropboxFolder(this.settings.dropboxFolder);
        const folder = syncVaultFolder(root, this.app.vault.getName());
        const attachments = normalizeAttachmentsFolder(this.settings.attachmentsFolder);
        this.settings.dropboxFolder = root;
        this.settings.attachmentsFolder = attachments;
        ui.update("Reading Dropbox\u2026");
        await yieldToUi2();
        const remote = await this.client.listFiles(folder);
        listed = true;
        items = this.collect(attachments, remote.files);
        let index = 0;
        for (const item of items) {
          if (ui.cancelled()) {
            report.cancelled = true;
            break;
          }
          index += 1;
          const label = itemPath(item);
          ui.update(`${index} / ${items.length}  ${label}`);
          seen.add(item.key);
          try {
            const outcome = await this.apply(item, folder, previous.get(item.key));
            if (outcome.type === "upload") report.uploaded += 1;
            if (outcome.type === "download") report.downloaded += 1;
            if (outcome.type === "conflict") {
              nextConflicts.push({
                path: itemPath(item),
                kind: outcome.kind,
                localHash: outcome.localHash,
                remoteRev: outcome.remoteRev
              });
            }
          } catch (error) {
            if (error instanceof DropboxError && error.message === "missing") {
              if (item.local) nextConflicts.push({ path: item.local.path, kind: "deleted-remote" });
              else this.deleteRecord(item.key);
            } else {
              report.failed.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
          await yieldToUi2();
        }
        return report;
      } finally {
        if (listed) {
          const itemKeys = new Set(items.map((item) => item.key));
          for (const [key, conflict] of previous) {
            if (!seen.has(key) && itemKeys.has(key)) nextConflicts.push(conflict);
          }
          const byKey = /* @__PURE__ */ new Map();
          for (const conflict of nextConflicts) byKey.set(pathKey(conflict.path), conflict);
          this.state.conflicts = [...byKey.values()];
          report.conflicts = this.state.conflicts.length;
        }
        await this.persist();
      }
    };
    this.collect = (attachments, remoteFiles) => {
      const map = /* @__PURE__ */ new Map();
      const slot = (relativePath) => {
        const key = pathKey(relativePath);
        let item = map.get(key);
        if (!item) {
          item = { key };
          map.set(key, item);
        }
        return item;
      };
      for (const file of this.app.vault.getFiles()) {
        if (!isIncluded(file.path, attachments)) continue;
        slot(file.path).local = file;
      }
      for (const remote of remoteFiles) {
        if (!isIncluded(remote.relativePath, attachments)) continue;
        slot(remote.relativePath).remote = remote;
      }
      for (const [recordPath, record] of Object.entries(this.state.files)) {
        const item = slot(recordPath);
        item.record = record;
        item.recordPath = recordPath;
      }
      return [...map.values()].sort((a, b) => itemPath(a).localeCompare(itemPath(b)));
    };
    this.apply = async (item, folder, existing) => {
      var _a2, _b2;
      const local = await inspectLocal(item.local, item.record);
      const localHash = item.local ? local.hash : null;
      const remoteRev = (_b2 = (_a2 = item.remote) == null ? void 0 : _a2.rev) != null ? _b2 : null;
      if (hasSnapshot(existing)) return this.applyManual(item, folder, existing, local, localHash, remoteRev);
      return this.applyFresh(item, folder, local, localHash, remoteRev);
    };
    this.applyManual = async (item, folder, existing, local, localHash, remoteRev) => {
      var _a2, _b2;
      let action = planManualResolution(
        { localHash: (_a2 = existing.localHash) != null ? _a2 : null, remoteRev: (_b2 = existing.remoteRev) != null ? _b2 : null },
        localHash,
        remoteRev
      );
      if (action === "compare" && item.remote && item.local) {
        const downloaded = await this.client.download(item.remote.dropboxPath);
        const remoteHash = await sha256Hex(downloaded.bytes);
        if (remoteHash === local.hash) {
          this.putRecord(item.local.path, {
            hash: local.hash,
            size: local.size,
            mtime: local.mtime,
            dropboxRev: downloaded.rev || item.remote.rev
          }, item.recordPath);
          return { type: "none" };
        }
        action = "hold";
      } else if (action === "compare") {
        action = "hold";
      }
      if (action === "forget") {
        this.deleteRecord(item.key);
        return { type: "none" };
      }
      if (action === "hold") return conflictOutcome(localHash, remoteRev);
      if (action === "download") return this.downloadRemote(item, local, localHash, remoteRev);
      return this.uploadLocal(item, folder, local, localHash, remoteRev);
    };
    this.applyFresh = async (item, folder, local, localHash, remoteRev) => {
      const remote = !item.remote ? "absent" : !item.record ? "untracked" : item.remote.rev === item.record.dropboxRev ? "unchanged" : "changed";
      let action = planSync(local.presence, remote);
      if (action.action === "compare") {
        if (!item.remote || !item.local) return conflictOutcome(localHash, remoteRev);
        const downloaded = await this.client.download(item.remote.dropboxPath);
        const remoteHash = await sha256Hex(downloaded.bytes);
        action = planAfterCompare(remoteHash === local.hash);
        if (action.action === "adopt") {
          this.putRecord(item.local.path, {
            hash: local.hash,
            size: local.size,
            mtime: local.mtime,
            dropboxRev: downloaded.rev || item.remote.rev
          }, item.recordPath);
        }
      }
      if (action.action === "skip" || action.action === "adopt") return { type: "none" };
      if (action.action === "forget") {
        this.deleteRecord(item.key);
        return { type: "none" };
      }
      if (action.action === "conflict") return conflictOutcome(localHash, remoteRev);
      if (action.action === "download") return this.downloadRemote(item, local, localHash, remoteRev);
      if (action.action !== "upload") return { type: "none" };
      return this.uploadLocal(item, folder, local, localHash, remoteRev);
    };
    this.downloadRemote = async (item, local, localHash, remoteRev) => {
      var _a2, _b2;
      if (!item.remote) return conflictOutcome(localHash, remoteRev);
      const downloaded = await this.client.download(item.remote.dropboxPath);
      const remoteHash = await sha256Hex(downloaded.bytes);
      const canonical = (_b2 = (_a2 = item.local) == null ? void 0 : _a2.path) != null ? _b2 : item.remote.relativePath;
      if (item.local && remoteHash === local.hash) {
        this.putRecord(canonical, {
          hash: local.hash,
          size: local.size,
          mtime: local.mtime,
          dropboxRev: downloaded.rev || item.remote.rev
        }, item.recordPath);
        return { type: "none" };
      }
      await writeLocal(this.app.vault, canonical, downloaded.bytes);
      await this.rememberWritten(canonical, downloaded.rev || item.remote.rev, downloaded.bytes);
      return { type: "download" };
    };
    this.uploadLocal = async (item, folder, local, localHash, remoteRev) => {
      var _a2, _b2, _c, _d;
      if (!item.local) return conflictOutcome(localHash, remoteRev);
      const bytes = (_a2 = local.bytes) != null ? _a2 : await this.app.vault.readBinary(item.local);
      const apiPath = (_c = (_b2 = item.remote) == null ? void 0 : _b2.dropboxPath) != null ? _c : toDropboxPath(folder, item.local.path);
      const mode = item.remote ? { update: item.remote.rev } : "add";
      const uploaded = await this.client.upload(apiPath, bytes, mode);
      const hash = local.hash || await sha256Hex(bytes);
      if (uploaded.conflict) {
        if (mode === "add") {
          const downloaded = await this.client.download(apiPath);
          const remoteHash = await sha256Hex(downloaded.bytes);
          if (remoteHash === hash) {
            this.putRecord(item.local.path, {
              hash,
              size: bytes.byteLength,
              mtime: stableMtime(this.app, item.local.path, local.mtime, bytes.byteLength),
              dropboxRev: downloaded.rev
            }, item.recordPath);
            return { type: "none" };
          }
          return conflictOutcome(hash, downloaded.rev || remoteRev);
        }
        const found = await this.client.metadata(apiPath);
        return conflictOutcome(hash, (_d = found == null ? void 0 : found.rev) != null ? _d : remoteRev);
      }
      this.putRecord(item.local.path, {
        hash,
        size: bytes.byteLength,
        mtime: stableMtime(this.app, item.local.path, local.mtime, bytes.byteLength),
        dropboxRev: uploaded.rev
      }, item.recordPath);
      return { type: "upload" };
    };
    this.rememberWritten = async (path, rev2, bytes) => {
      const writtenHash = await sha256Hex(bytes);
      const file = this.app.vault.getAbstractFileByPath((0, import_obsidian5.normalizePath)(path));
      if (!(file instanceof import_obsidian5.TFile)) {
        this.putRecord(path, { hash: writtenHash, size: bytes.byteLength, mtime: 0, dropboxRev: rev2 });
        return;
      }
      const mtime = file.stat.mtime;
      const check = await sha256Hex(await this.app.vault.readBinary(file));
      const again = this.app.vault.getAbstractFileByPath(file.path);
      const stable = check === writtenHash && again instanceof import_obsidian5.TFile && again.stat.mtime === mtime;
      this.putRecord(file.path, {
        hash: writtenHash,
        size: bytes.byteLength,
        mtime: stable ? mtime : 0,
        dropboxRev: rev2
      });
    };
    this.putRecord = (canonical, record, previousPath) => {
      const key = pathKey(canonical);
      for (const existing of Object.keys(this.state.files)) {
        if (existing !== canonical && pathKey(existing) === key) delete this.state.files[existing];
      }
      if (previousPath && previousPath !== canonical) delete this.state.files[previousPath];
      this.state.files[canonical] = record;
    };
    this.deleteRecord = (key) => {
      for (const existing of Object.keys(this.state.files)) {
        if (pathKey(existing) === key) delete this.state.files[existing];
      }
    };
  }
};
async function inspectLocal(file, record) {
  if (!file) return { presence: "absent", hash: "", mtime: 0, size: 0 };
  const mtime = file.stat.mtime;
  const size = file.stat.size;
  if (record && record.mtime !== 0 && record.mtime === mtime && record.size === size) {
    return { presence: "unchanged", hash: record.hash, mtime, size };
  }
  const bytes = await file.vault.readBinary(file);
  const hash = await sha256Hex(bytes);
  if (!record) return { presence: "untracked", hash, bytes, mtime, size };
  if (hash === record.hash) {
    record.mtime = mtime;
    record.size = size;
    return { presence: "unchanged", hash, bytes, mtime, size };
  }
  return { presence: "changed", hash, bytes, mtime, size };
}
function stableMtime(app, path, mtime, size) {
  const after = app.vault.getAbstractFileByPath((0, import_obsidian5.normalizePath)(path));
  if (after instanceof import_obsidian5.TFile && after.stat.mtime === mtime && after.stat.size === size) return mtime;
  return 0;
}
async function writeLocal(vault, path, bytes) {
  const normalized = (0, import_obsidian5.normalizePath)(path);
  const existing = vault.getAbstractFileByPath(normalized);
  if (existing instanceof import_obsidian5.TFile) {
    await vault.modifyBinary(existing, bytes);
    return;
  }
  if (existing) throw new Error(`${normalized} is not a file.`);
  await ensureFolder2(vault, normalized);
  await vault.createBinary(normalized, bytes);
}
async function ensureFolder2(vault, filePath) {
  const slash = filePath.lastIndexOf("/");
  if (slash <= 0) return;
  const parts = filePath.slice(0, slash).split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const existing = vault.getAbstractFileByPath(current);
    if (existing instanceof import_obsidian5.TFile) throw new Error(`${current} is a file, so ${filePath} cannot be saved.`);
    if (existing) continue;
    try {
      await vault.createFolder(current);
    } catch (error) {
      if (!vault.getAbstractFileByPath(current)) throw error;
    }
  }
}
function itemPath(item) {
  var _a2, _b2, _c, _d, _e;
  return (_e = (_d = (_c = (_a2 = item.local) == null ? void 0 : _a2.path) != null ? _c : (_b2 = item.remote) == null ? void 0 : _b2.relativePath) != null ? _d : item.recordPath) != null ? _e : item.key;
}
function hasSnapshot(conflict) {
  return !!conflict && "localHash" in conflict && "remoteRev" in conflict;
}
function conflictOutcome(localHash, remoteRev) {
  const kind = localHash === null ? "deleted-local" : remoteRev === null ? "deleted-remote" : "both-changed";
  return { type: "conflict", kind, localHash, remoteRev };
}
function yieldToUi2() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// src/types.ts
var DEFAULT_SETTINGS = {
  appKey: "",
  refreshToken: "",
  accessToken: "",
  accessTokenExpiresAt: 0,
  codeVerifier: "",
  accountEmail: "",
  dropboxFolder: "/ObsidianAnovem",
  attachmentsFolder: "",
  lastSyncAt: 0,
  lastSyncSummary: "",
  backgroundSync: true,
  syncIntervalMinutes: 5,
  backupFormat: "zip",
  backupFolder: "backups"
};
function emptyState() {
  return { files: {}, conflicts: [] };
}

// src/vault-config.ts
async function configuredAttachmentFolder(app) {
  try {
    const raw = await app.vault.adapter.read(`${app.vault.configDir}/app.json`);
    const parsed = JSON.parse(raw);
    if (typeof parsed.attachmentFolderPath !== "string") return "";
    return normalizeAttachmentsFolder(parsed.attachmentFolderPath);
  } catch (e) {
    return "";
  }
}

// src/main.ts
var SYNC_ICON = "vault-anovem-sync";
(0, import_obsidian6.addIcon)(
  SYNC_ICON,
  `<g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 50h64"/><path d="M18 50 32 36"/><path d="M18 50 32 64"/><path d="M82 50 68 36"/><path d="M82 50 68 64"/></g>`
);
var VaultSyncPlugin = class extends import_obsidian6.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.state = emptyState();
    this.running = false;
    this.statusBar = null;
    this.backgroundTimer = null;
    this.lastBackgroundAt = 0;
    this.scheduleBackgroundSync = () => {
      if (this.backgroundTimer !== null) {
        window.clearInterval(this.backgroundTimer);
        this.backgroundTimer = null;
      }
      if (!this.settings.backgroundSync) return;
      const minutes = normalizeSyncMinutes(this.settings.syncIntervalMinutes);
      this.settings.syncIntervalMinutes = minutes;
      this.backgroundTimer = window.setInterval(() => {
        void this.syncNow("background");
      }, minutes * 60 * 1e3);
      this.registerInterval(this.backgroundTimer);
    };
    this.persist = async () => {
      await this.saveData({ settings: this.settings, state: this.state });
    };
    this.syncNow = async (source = "manual") => {
      var _a2, _b2;
      if (source === "background") {
        if (!this.settings.backgroundSync || !this.settings.refreshToken || this.running) return;
        if (Date.now() - this.lastBackgroundAt < 15e3) return;
        this.lastBackgroundAt = Date.now();
      } else if (this.running) {
        new import_obsidian6.Notice("A sync or backup is already running.");
        return;
      }
      const background = source === "background";
      const conflictsBefore = this.state.conflicts.length;
      this.running = true;
      const modal = background ? null : new SyncProgressModal(this.app);
      modal == null ? void 0 : modal.open();
      try {
        const report = await this.engine.sync({
          cancelled: () => {
            var _a3;
            return (_a3 = modal == null ? void 0 : modal.cancelled) != null ? _a3 : false;
          },
          update: (text) => {
            var _a3;
            modal == null ? void 0 : modal.setStatus(text);
            (_a3 = this.statusBar) == null ? void 0 : _a3.setText(text);
          }
        });
        this.settings.lastSyncAt = Date.now();
        this.settings.lastSyncSummary = summarize(report);
        await this.persist();
        (_a2 = this.statusBar) == null ? void 0 : _a2.setText(this.settings.lastSyncSummary);
        modal == null ? void 0 : modal.finish();
        const conflictsChanged = this.state.conflicts.length !== conflictsBefore;
        const moved = report.uploaded > 0 || report.downloaded > 0 || report.failed.length > 0 || report.cancelled;
        if (!background || moved || conflictsChanged) new import_obsidian6.Notice(this.settings.lastSyncSummary);
        if (!background && this.state.conflicts.length > 0) this.showConflicts();
      } catch (error) {
        modal == null ? void 0 : modal.finish();
        const message = errorMessage(error);
        this.settings.lastSyncSummary = message;
        (_b2 = this.statusBar) == null ? void 0 : _b2.setText(message);
        if (!background || this.settings.refreshToken) new import_obsidian6.Notice(message);
        await this.persist();
      } finally {
        this.running = false;
      }
    };
    this.backupNow = async () => {
      var _a2, _b2;
      if (this.running) {
        new import_obsidian6.Notice("A sync or backup is already running.");
        return;
      }
      this.running = true;
      const modal = new SyncProgressModal(this.app, "Backup");
      modal.open();
      try {
        const format = this.settings.backupFormat === "gzip" ? "gzip" : "zip";
        const folder = normalizeBackupFolder(this.settings.backupFolder);
        this.settings.backupFolder = folder;
        const path = await createBackup({
          vault: this.app.vault,
          vaultName: this.app.vault.getName(),
          format,
          folder,
          now: /* @__PURE__ */ new Date(),
          cancelled: () => modal.cancelled,
          update: (text) => {
            var _a3;
            modal.setStatus(text);
            (_a3 = this.statusBar) == null ? void 0 : _a3.setText(text);
          }
        });
        await this.persist();
        modal.finish();
        (_a2 = this.statusBar) == null ? void 0 : _a2.setText(this.settings.lastSyncSummary || "Sync");
        new import_obsidian6.Notice(`Backup saved to ${path}`);
      } catch (error) {
        modal.finish();
        (_b2 = this.statusBar) == null ? void 0 : _b2.setText(this.settings.lastSyncSummary || "Sync");
        new import_obsidian6.Notice(error instanceof BackupCancelled ? error.message : errorMessage(error));
      } finally {
        this.running = false;
      }
    };
  }
  async onload() {
    var _a2, _b2;
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data == null ? void 0 : data.settings);
    this.state = ((_a2 = data == null ? void 0 : data.state) == null ? void 0 : _a2.files) ? { files: data.state.files, conflicts: (_b2 = data.state.conflicts) != null ? _b2 : [] } : emptyState();
    if (!this.settings.attachmentsFolder) {
      const detected = await configuredAttachmentFolder(this.app);
      if (detected) this.settings.attachmentsFolder = detected;
    }
    this.client = new DropboxClient(this.settings, () => this.persist());
    this.engine = new SyncEngine(this.app, this.settings, this.state, () => this.persist(), this.client);
    this.addSettingTab(new VaultSyncSettingTab(this.app, this));
    this.addCommand({
      id: "sync",
      name: "Sync both ways",
      callback: () => {
        void this.syncNow();
      }
    });
    this.addCommand({
      id: "show-conflicts",
      name: "Show sync conflicts",
      callback: () => this.showConflicts()
    });
    this.addCommand({
      id: "backup",
      name: "Backup vault",
      callback: () => {
        void this.backupNow();
      }
    });
    this.addRibbonIcon(SYNC_ICON, "Sync both ways", () => {
      void this.syncNow();
    });
    this.addRibbonIcon("archive", "Backup vault", () => {
      void this.backupNow();
    });
    if (!import_obsidian6.Platform.isMobile) {
      this.statusBar = this.addStatusBarItem();
      this.statusBar.setText(this.settings.lastSyncSummary || "Sync");
    }
    this.scheduleBackgroundSync();
    this.app.workspace.onLayoutReady(() => {
      const start = window.setTimeout(() => void this.syncNow("background"), 5e3);
      this.register(() => window.clearTimeout(start));
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") void this.syncNow("background");
    };
    document.addEventListener("visibilitychange", onVisible);
    this.register(() => document.removeEventListener("visibilitychange", onVisible));
    await this.persist();
  }
  showConflicts() {
    new ConflictModal(this.app, this).open();
  }
};
function normalizeSyncMinutes(value) {
  if (!Number.isFinite(value)) return 5;
  return Math.min(240, Math.max(1, Math.round(value)));
}
