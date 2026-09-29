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
function conflictBackupPath(relativePath, timestamp, side) {
  const normalized = normalizeRelative(relativePath);
  const slash = normalized.lastIndexOf("/");
  const dir = slash >= 0 ? normalized.slice(0, slash + 1) : "";
  const file = slash >= 0 ? normalized.slice(slash + 1) : normalized;
  const dot = file.lastIndexOf(".");
  const stem = dot > 0 ? file.slice(0, dot) : file;
  const ext = dot > 0 ? file.slice(dot) : "";
  const stamp = timestamp.replace(/[^\d-]/g, "");
  if (!stamp || !stem) throw new Error("Cannot name a conflict backup.");
  return `${dir}${stamp}_${stem}_${side}_backup${ext}`;
}
function conflictText(kind) {
  if (kind === "both-changed") {
    return "Changed on this device and in Dropbox. Review keeps lines that exist on only one side, then asks where both sides changed.";
  }
  if (kind === "deleted-local") {
    return "This file is not on this device, and it is still in Dropbox. Review can restore the Dropbox copy.";
  }
  return "This file is on this device and not in Dropbox. Review can send this copy.";
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
    this.move = async (fromPath, toPath) => {
      var _a2;
      const res = await this.rpc("files/move_v2", {
        from_path: fromPath,
        to_path: toPath,
        autorename: false,
        allow_ownership_transfer: false
      });
      if (res.missing) throw new DropboxError("missing");
      const metadata = res.body.metadata;
      if (!(metadata == null ? void 0 : metadata.rev)) throw new DropboxError("Dropbox move did not return a revision.");
      return { rev: metadata.rev, size: (_a2 = metadata.size) != null ? _a2 : 0 };
    };
    this.delete = async (dropboxPath) => {
      const res = await this.rpc("files/delete_v2", { path: dropboxPath });
      if (res.missing) return;
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

// src/merge.ts
function decodeUtf8(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (e) {
    return null;
  }
}
function diffRows(local, remote) {
  const left = local === "" ? [] : local.split("\n");
  const right = remote === "" ? [] : remote.split("\n");
  if (left.length * right.length > 25e4) {
    return [{ kind: "change", id: 0, local, remote }];
  }
  const ops = lineOps(left, right);
  const rows = [];
  let id = 0;
  let index = 0;
  while (index < ops.length) {
    const op = ops[index];
    if (op.tag === "same") {
      rows.push({ kind: "same", id: id++, local: op.line, remote: op.line });
      index += 1;
      continue;
    }
    const localLines = [];
    const remoteLines = [];
    while (index < ops.length && ops[index].tag !== "same") {
      if (ops[index].tag === "local") localLines.push(ops[index].line);
      else remoteLines.push(ops[index].line);
      index += 1;
    }
    rows.push({
      kind: "change",
      id: id++,
      local: localLines.join("\n"),
      remote: remoteLines.join("\n")
    });
  }
  return rows;
}
function mergeBlocks(rows) {
  const grouped = [];
  for (const row of rows) {
    const prev = grouped[grouped.length - 1];
    if (row.kind === "same" && (prev == null ? void 0 : prev.kind) === "same") {
      prev.local = `${prev.local}
${row.local}`;
      prev.remote = prev.local;
      continue;
    }
    grouped.push({ ...row });
  }
  const blocks = [];
  let index = 0;
  while (index < grouped.length) {
    if (!isTableBlock(grouped[index])) {
      blocks.push(grouped[index]);
      index += 1;
      continue;
    }
    const run = [];
    while (index < grouped.length && isTableBlock(grouped[index])) {
      run.push(grouped[index]);
      index += 1;
    }
    blocks.push(combineBlocks(run));
  }
  return blocks;
}
function hunkShape(row) {
  if (row.kind !== "change") return null;
  if (row.local.length > 0 && row.remote.length === 0) return "local-only";
  if (row.remote.length > 0 && row.local.length === 0) return "remote-only";
  return "both";
}
function seedChoices(rows) {
  const applied = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const shape = hunkShape(row);
    if (shape === "local-only") applied.set(row.id, { local: true, remote: false });
    if (shape === "remote-only") applied.set(row.id, { local: false, remote: true });
  }
  return applied;
}
function pendingHunks(rows, applied, custom) {
  return rows.filter((row) => row.kind === "change" && !applied.has(row.id) && !custom.has(row.id));
}
function hunkLabel(row, choice, edited) {
  if (edited) return "Edited";
  const shape = hunkShape(row);
  if (shape === "local-only") return (choice == null ? void 0 : choice.local) === false ? "Left out" : "Kept";
  if (shape === "remote-only") return (choice == null ? void 0 : choice.remote) === false ? "Left out" : "Kept";
  if (!choice) return "Needs a choice";
  if (choice.local && choice.remote) return "Both kept";
  if (choice.local) return "Kept from this device";
  if (choice.remote) return "Kept from Dropbox";
  return "Left out";
}
function mergeWords(base, local, remote) {
  if (local === remote) return { text: local, overlap: false };
  const baseWords = wordTokens(base);
  const localWords = wordTokens(local);
  const remoteWords = wordTokens(remote);
  if (withinMergeLimit(baseWords, localWords) && withinMergeLimit(baseWords, remoteWords)) {
    return mergePieces(baseWords, localWords, remoteWords, "");
  }
  const baseLines = linePieces(base);
  const localLines = linePieces(local);
  const remoteLines = linePieces(remote);
  if (!withinMergeLimit(baseLines, localLines) || !withinMergeLimit(baseLines, remoteLines)) {
    return { text: local, overlap: true };
  }
  return mergePieces(baseLines, localLines, remoteLines, "\n");
}
function withinMergeLimit(before, after) {
  return before.length * Math.max(after.length, 1) <= 1e6;
}
function blockLines(local, remote) {
  const left = splitBlock(local);
  const right = splitBlock(remote);
  return {
    local: left.map((line, index) => changedSpans(line, right[index])),
    remote: right.map((line, index) => changedSpans(line, left[index]))
  };
}
function changedSpans(line, other) {
  if (line.length === 0) return [];
  if (other === void 0 || other.length === 0) return [{ text: line, strong: true }];
  if (line === other) return [{ text: line, strong: false }];
  const left = tokens(line);
  const right = tokens(other);
  if (left.length * right.length > 2e4) return [{ text: line, strong: true }];
  const spans = [];
  for (const op of lineOps(left, right)) {
    if (op.tag === "remote") continue;
    const strong = op.tag === "local";
    const prev = spans[spans.length - 1];
    if (prev && prev.strong === strong) prev.text += op.line;
    else spans.push({ text: op.line, strong });
  }
  return spans.length > 0 ? spans : [{ text: line, strong: true }];
}
function tokens(value) {
  return wordTokens(value);
}
function wordTokens(value) {
  if (value.length === 0) return [];
  return value.split(/(\s+)/).filter((part) => part.length > 0);
}
function linePieces(value) {
  if (value.length === 0) return [];
  return value.split("\n");
}
function mergePieces(base, local, remote, joiner) {
  const edits = [
    ...pieceEdits(base, local, "local"),
    ...pieceEdits(base, remote, "remote")
  ].sort((a, b) => a.start - b.start || a.end - b.end || (a.side === "local" ? -1 : 1));
  const clusters = [];
  for (const edit of edits) {
    const current = clusters[clusters.length - 1];
    if (!current || !current.some((item) => piecesOverlap(item, edit))) clusters.push([edit]);
    else current.push(edit);
  }
  const out = [];
  let cursor = 0;
  let overlap = false;
  for (const cluster of clusters) {
    const start = Math.min(...cluster.map((edit) => edit.start));
    const end = Math.max(...cluster.map((edit) => edit.end));
    out.push(...base.slice(cursor, start));
    const locals = cluster.filter((edit) => edit.side === "local");
    const remotes = cluster.filter((edit) => edit.side === "remote");
    if (locals.length > 0 && remotes.length > 0) overlap = true;
    out.push(...applyPieces(base, locals.length > 0 ? locals : remotes, start, end));
    cursor = end;
  }
  out.push(...base.slice(cursor));
  return { text: out.join(joiner), overlap };
}
function pieceEdits(before, after, side) {
  const ops = lineOps(before, after);
  const edits = [];
  let baseIndex = 0;
  let index = 0;
  while (index < ops.length) {
    if (ops[index].tag === "same") {
      baseIndex += 1;
      index += 1;
      continue;
    }
    const start = baseIndex;
    const pieces = [];
    while (index < ops.length && ops[index].tag !== "same") {
      if (ops[index].tag === "local") baseIndex += 1;
      else pieces.push(ops[index].line);
      index += 1;
    }
    edits.push({ start, end: baseIndex, pieces, side });
  }
  return edits;
}
function piecesOverlap(a, b) {
  if (a.start === a.end && b.start === b.end) return a.start === b.start;
  return a.start < b.end && b.start < a.end;
}
function applyPieces(base, edits, start, end) {
  const out = [];
  let cursor = start;
  for (const edit of [...edits].sort((a, b) => a.start - b.start)) {
    if (edit.start < cursor) continue;
    out.push(...base.slice(cursor, edit.start));
    out.push(...edit.pieces);
    cursor = edit.end;
  }
  out.push(...base.slice(cursor, end));
  return out;
}
function splitBlock(text) {
  if (text.length === 0) return [];
  return text.split("\n");
}
function textFromApplied(rows, applied, custom) {
  var _a2, _b2;
  const lines = [];
  for (const row of rows) {
    if (row.kind === "same") {
      lines.push(row.local);
      continue;
    }
    if (custom == null ? void 0 : custom.has(row.id)) {
      const edited = (_a2 = custom.get(row.id)) != null ? _a2 : "";
      if (edited.length > 0) lines.push(edited);
      continue;
    }
    const choice = (_b2 = applied.get(row.id)) != null ? _b2 : { local: true, remote: false };
    if (choice.local && row.local.length > 0) lines.push(row.local);
    if (choice.remote && row.remote.length > 0) lines.push(row.remote);
  }
  return lines.join("\n");
}
function hunkText(row, choice) {
  const parts = [];
  if (choice.local && row.local.length > 0) parts.push(row.local);
  if (choice.remote && row.remote.length > 0) parts.push(row.remote);
  return parts.join("\n");
}
function isTableBlock(row) {
  return `${row.local}
${row.remote}`.split("\n").some((line) => /^\s*\|/.test(line));
}
function combineBlocks(rows) {
  var _a2;
  const changed = rows.find((row) => row.kind === "change");
  return {
    kind: changed ? "change" : "same",
    id: (_a2 = changed == null ? void 0 : changed.id) != null ? _a2 : rows[0].id,
    local: rows.map((row) => row.local).filter((text) => text.length > 0).join("\n"),
    remote: rows.map((row) => row.remote).filter((text) => text.length > 0).join("\n")
  };
}
function lineOps(left, right) {
  const rows = left.length;
  const cols = right.length;
  const scores = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
  for (let i2 = rows - 1; i2 >= 0; i2--) {
    for (let j2 = cols - 1; j2 >= 0; j2--) {
      scores[i2][j2] = left[i2] === right[j2] ? scores[i2 + 1][j2 + 1] + 1 : Math.max(scores[i2 + 1][j2], scores[i2][j2 + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (left[i] === right[j]) {
      ops.push({ tag: "same", line: left[i] });
      i += 1;
      j += 1;
    } else if (scores[i + 1][j] >= scores[i][j + 1]) {
      ops.push({ tag: "local", line: left[i] });
      i += 1;
    } else {
      ops.push({ tag: "remote", line: right[j] });
      j += 1;
    }
  }
  while (i < rows) ops.push({ tag: "local", line: left[i++] });
  while (j < cols) ops.push({ tag: "remote", line: right[j++] });
  return ops;
}

// src/modals.ts
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
var SyncPlanModal = class extends import_obsidian3.Modal {
  constructor(app, lines, onSync) {
    super(app);
    this.lines = lines;
    this.onSync = onSync;
  }
  onOpen() {
    this.setTitle("Sync plan");
    const { contentEl } = this;
    if (this.lines.length === 0) {
      contentEl.createEl("p", { text: "Already in sync. Nothing would change." });
    } else {
      contentEl.createEl("p", { text: "This is what a sync would do. Nothing has been written." });
      const list = contentEl.createDiv({ cls: "vault-sync-plan" });
      for (const line of this.lines) {
        const row = list.createDiv({ cls: "vault-sync-plan-row" });
        row.createSpan({ cls: "vault-sync-plan-action", text: planAction(line.action) });
        const body = row.createDiv();
        body.createDiv({ cls: "vault-sync-conflict-path", text: line.path });
        body.createDiv({ cls: "setting-item-description", text: line.note });
      }
    }
    const buttons = contentEl.createDiv({ cls: "modal-button-container" });
    if (this.lines.length > 0) {
      const sync = buttons.createEl("button", { cls: "mod-cta", text: "Sync both ways" });
      sync.onclick = () => {
        this.close();
        this.onSync();
      };
    }
    const close = buttons.createEl("button", { text: "Close" });
    close.onclick = () => this.close();
  }
};
function planAction(action) {
  if (action === "upload") return "Upload";
  if (action === "download") return "Download";
  if (action === "merge") return "Merge";
  if (action === "rename") return "Rename";
  if (action === "trash") return "Trash";
  return "Review";
}
var ConflictModal = class extends import_obsidian3.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    const count = this.plugin.state.conflicts.length;
    this.setTitle(count === 0 ? "Sync conflicts" : `Sync conflicts (${count})`);
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
      text: "Review keeps lines that exist on only one side. Where both sides changed the same lines, choose before applying. Apply writes that result in both places and keeps a backup of each previous copy."
    });
    for (const conflict of conflicts) {
      const row = contentEl.createDiv({ cls: "vault-sync-conflict" });
      row.createEl("div", { cls: "vault-sync-conflict-path", text: conflict.path });
      row.createEl("div", { cls: "setting-item-description", text: conflictText(conflict.kind) });
      const buttons = row.createDiv({ cls: "vault-sync-conflict-buttons" });
      const open = buttons.createEl("button", { text: "Review" });
      open.onclick = () => {
        this.close();
        this.plugin.reviewConflict(conflict.path, () => this.plugin.showConflicts());
      };
    }
  }
};
var ConflictResolveModal = class extends import_obsidian3.Modal {
  constructor(app, plugin, path, onDone) {
    super(app);
    this.plugin = plugin;
    this.path = path;
    this.onDone = onDone;
    this.applied = /* @__PURE__ */ new Map();
    this.custom = /* @__PURE__ */ new Map();
    this.openFolds = /* @__PURE__ */ new Set();
    this.rows = [];
    this.binary = null;
    this.mode = "text";
    this.saving = false;
    this.scrollTop = 0;
    this.focusPending = false;
    this.editing = null;
    this.draft = "";
    this.focusEdit = false;
    this.load = async () => {
      try {
        const sides = await this.plugin.engine.readConflictBytes(this.path);
        if (!sides.local && !sides.remote) throw new Error("This file is gone on this device and in Dropbox.");
        const localText = sides.local ? decodeUtf8(sides.local) : "";
        const remoteText = sides.remote ? decodeUtf8(sides.remote) : "";
        if (sides.local && localText === null || sides.remote && remoteText === null) {
          this.renderSideChoice("This file is not text. Choose which copy to keep.", sides.local, sides.remote);
          return;
        }
        if (!sides.local || !sides.remote) {
          const message = sides.local ? "This file is on this device and not in Dropbox. Nothing is written until you apply." : "This file is not on this device, and it is still in Dropbox. Nothing is written until you apply.";
          this.renderSideChoice(message, sides.local, sides.remote);
          return;
        }
        this.rows = mergeBlocks(diffRows(localText != null ? localText : "", remoteText != null ? remoteText : ""));
        this.applied = seedChoices(this.rows);
        this.focusPending = true;
        this.renderText();
      } catch (error) {
        this.contentEl.empty();
        this.contentEl.createEl("p", { text: errorMessage(error) });
      }
    };
    this.save = async () => {
      var _a2;
      if (this.saving) return;
      if (this.mode === "binary" && !this.binary) {
        new import_obsidian3.Notice("Choose which copy to keep.");
        return;
      }
      if (this.mode === "text" && pendingHunks(this.rows, this.applied, this.custom).length > 0) {
        new import_obsidian3.Notice("Choose the lines that differ on both sides.");
        return;
      }
      this.saving = true;
      try {
        const encoded = new TextEncoder().encode(textFromApplied(this.rows, this.applied, this.custom));
        const bytes = (_a2 = this.binary) != null ? _a2 : encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
        const backups = await this.plugin.engine.saveResolution(this.path, bytes, /* @__PURE__ */ new Date());
        new import_obsidian3.Notice(backups.length > 0 ? `Resolved ${this.path}. Backups: ${backups.join(", ")}` : `Resolved ${this.path}.`);
        this.close();
        this.onDone();
      } catch (error) {
        this.saving = false;
        new import_obsidian3.Notice(errorMessage(error));
      }
    };
  }
  onOpen() {
    this.modalEl.addClass("vault-sync-merge-modal");
    this.setTitle(this.path);
    this.contentEl.createEl("p", { text: "Reading this device and Dropbox\u2026" });
    void this.load();
  }
  renderText() {
    const open = this.contentEl.querySelector(".vault-sync-merge-scroll");
    if (open) this.scrollTop = open.scrollTop;
    const focusPending = this.focusPending;
    const focusEdit = this.focusEdit;
    this.focusPending = false;
    this.focusEdit = false;
    const { contentEl } = this;
    contentEl.empty();
    const pending = pendingHunks(this.rows, this.applied, this.custom);
    const disagreements = this.rows.filter((row) => hunkShape(row) === "both");
    contentEl.createEl("p", {
      cls: "vault-sync-merge-summary",
      text: disagreements.length === 0 ? "These copies only add different lines, and those lines are already kept. Apply writes the note on this device and in Dropbox." : pending.length === 0 ? "Every disagreement has a choice. Apply writes the note on this device and in Dropbox." : "Lines found on only one side are already kept. Choose each place where both sides changed."
    });
    const scroll = contentEl.createDiv({ cls: "vault-sync-merge-scroll" });
    for (const row of this.rows) {
      if (row.kind === "same") this.renderContext(scroll, row);
      else if (hunkShape(row) === "both") this.renderChoice(scroll, row);
      else this.renderSingle(scroll, row);
    }
    const footer = contentEl.createDiv({ cls: "vault-sync-merge-footer" });
    const nav = footer.createDiv({ cls: "vault-sync-merge-nav" });
    const previous = nav.createEl("button", { text: "Previous" });
    previous.onclick = () => this.jumpHunk(-1);
    const next = nav.createEl("button", { text: "Next" });
    next.onclick = () => this.jumpHunk(1);
    const status = nav.createSpan({
      cls: pending.length === 0 ? "vault-sync-merge-status" : "vault-sync-merge-status is-pending",
      text: pending.length === 0 ? "Ready to apply" : `${pending.length} still ${pending.length === 1 ? "needs" : "need"} a choice`
    });
    status.setAttr("aria-live", "polite");
    const apply = footer.createDiv({ cls: "vault-sync-merge-nav" });
    if (disagreements.length > 1) {
      const allLocal = apply.createEl("button", {
        text: "This device for all",
        title: "Where both sides changed, keep this device. Lines that exist on only one side stay as they are."
      });
      allLocal.onclick = () => this.keepDisagreements({ local: true, remote: false });
      const allRemote = apply.createEl("button", {
        text: "Dropbox for all",
        title: "Where both sides changed, keep Dropbox. Lines that exist on only one side stay as they are."
      });
      allRemote.onclick = () => this.keepDisagreements({ local: false, remote: true });
    }
    const save = apply.createEl("button", { cls: "mod-cta", text: "Apply" });
    save.disabled = pending.length > 0;
    save.onclick = () => {
      void this.save();
    };
    const cancel = apply.createEl("button", { text: "Cancel" });
    cancel.onclick = () => this.close();
    if (focusEdit) {
      window.requestAnimationFrame(() => {
        const area = scroll.querySelector("textarea");
        if (area instanceof HTMLTextAreaElement) {
          area.focus();
          area.scrollIntoView({ block: "center" });
        }
      });
    } else if (focusPending) {
      window.requestAnimationFrame(() => {
        var _a2;
        const target = (_a2 = scroll.querySelector(".is-pending")) != null ? _a2 : scroll.querySelector("[data-hunk]");
        target == null ? void 0 : target.scrollIntoView({ block: "center" });
      });
    } else {
      scroll.scrollTop = this.scrollTop;
    }
  }
  renderContext(parent, row) {
    const lines = row.local.split("\n");
    const limit = 2;
    if (lines.length <= limit * 2 + 1 || this.openFolds.has(row.id)) {
      parent.createDiv({ cls: "vault-sync-context", text: row.local });
      if (lines.length > limit * 2 + 1) {
        const fold2 = parent.createDiv({ cls: "vault-sync-fold" });
        const button2 = fold2.createEl("button", { text: "Hide unchanged lines" });
        button2.onclick = () => {
          this.openFolds.delete(row.id);
          this.renderText();
        };
      }
      return;
    }
    parent.createDiv({ cls: "vault-sync-context", text: lines.slice(0, limit).join("\n") });
    const fold = parent.createDiv({ cls: "vault-sync-fold" });
    const hidden = lines.length - limit * 2;
    const button = fold.createEl("button", { text: `Show ${hidden} unchanged ${hidden === 1 ? "line" : "lines"}` });
    button.onclick = () => {
      this.openFolds.add(row.id);
      this.renderText();
    };
    parent.createDiv({ cls: "vault-sync-context", text: lines.slice(-limit).join("\n") });
  }
  renderSingle(parent, row) {
    var _a2;
    const shape = hunkShape(row);
    const remote = shape === "remote-only";
    const choice = this.applied.get(row.id);
    const edited = this.custom.has(row.id);
    const kept = remote ? (choice == null ? void 0 : choice.remote) !== false : (choice == null ? void 0 : choice.local) !== false;
    const card = parent.createDiv({ cls: "vault-sync-change is-single" });
    card.dataset.hunk = String(row.id);
    if (kept || edited) card.addClass("is-done");
    const head = card.createDiv({ cls: "vault-sync-change-head" });
    const title = head.createDiv({ cls: "vault-sync-change-title" });
    title.createSpan({ text: remote ? "Only in Dropbox" : "Only on this device" });
    title.createSpan({ cls: "vault-sync-change-state", text: hunkLabel(row, choice, edited) });
    const actions = head.createDiv({ cls: "vault-sync-head-actions" });
    const toggle = actions.createEl("button", { text: edited ? "Keep original" : kept ? "Leave out" : "Keep" });
    toggle.onclick = () => this.toggleKept(row, edited ? true : !kept);
    const edit = actions.createEl("button", { text: edited ? "Edit again" : "Edit" });
    if (edited || this.editing === row.id) edit.addClass("is-on");
    edit.onclick = () => this.startEdit(row);
    const body = card.createDiv({ cls: "vault-sync-side-body" });
    if (!kept || edited) body.addClass("is-dim");
    this.writeLines(body, remote ? row.remote : row.local);
    if (this.editing === row.id) this.renderEditor(card, row.id);
    else if (edited) this.renderCustom(card, (_a2 = this.custom.get(row.id)) != null ? _a2 : "");
  }
  renderChoice(parent, row) {
    var _a2;
    const choice = this.applied.get(row.id);
    const edited = this.custom.has(row.id);
    const editing = this.editing === row.id;
    const pending = !choice && !edited;
    const card = parent.createDiv({ cls: "vault-sync-change" });
    card.dataset.hunk = String(row.id);
    if (pending) card.addClass("is-pending");
    else card.addClass("is-done");
    const head = card.createDiv({ cls: "vault-sync-change-head" });
    const title = head.createDiv({ cls: "vault-sync-change-title" });
    title.createSpan({ text: "Both sides changed" });
    const state = title.createSpan({ cls: "vault-sync-change-state", text: hunkLabel(row, choice, edited) });
    if (pending) state.addClass("is-pending");
    const actions = card.createDiv({ cls: "vault-sync-change-actions" });
    this.choiceButton(actions, "Keep this device", !edited && (choice == null ? void 0 : choice.local) === true && choice.remote === false, () => this.choose(row.id, { local: true, remote: false }));
    this.choiceButton(actions, "Keep Dropbox", !edited && (choice == null ? void 0 : choice.remote) === true && choice.local === false, () => this.choose(row.id, { local: false, remote: true }));
    this.choiceButton(actions, "Keep both", !edited && (choice == null ? void 0 : choice.local) === true && choice.remote === true, () => this.choose(row.id, { local: true, remote: true }));
    this.choiceButton(actions, "Leave out", !edited && (choice == null ? void 0 : choice.local) === false && (choice == null ? void 0 : choice.remote) === false, () => this.choose(row.id, { local: false, remote: false }));
    const edit = actions.createEl("button", { text: edited ? "Edit again" : "Edit" });
    if (edited || editing) edit.addClass("is-on");
    edit.onclick = () => this.startEdit(row);
    const spans = blockLines(row.local, row.remote);
    const sides = card.createDiv({ cls: "vault-sync-change-sides" });
    this.renderSide(sides, "This device", "local", spans.local, !edited && !editing && (choice == null ? void 0 : choice.local) === true, !edited && !editing && choice !== void 0 && !choice.local);
    this.renderSide(sides, "Dropbox", "remote", spans.remote, !edited && !editing && (choice == null ? void 0 : choice.remote) === true, !edited && !editing && choice !== void 0 && !choice.remote);
    const caption = this.savedCaption(row, choice, edited, editing);
    if (caption) card.createDiv({ cls: "vault-sync-saved", text: caption });
    if (editing) this.renderEditor(card, row.id);
    else if (edited) this.renderCustom(card, (_a2 = this.custom.get(row.id)) != null ? _a2 : "");
  }
  renderSide(parent, label, kind, lines, kept, dim) {
    const side = parent.createDiv({ cls: `vault-sync-side is-${kind}` });
    if (kept) side.addClass("is-kept");
    if (dim) side.addClass("is-dim");
    side.createDiv({ cls: "vault-sync-side-label", text: label });
    const body = side.createDiv({ cls: "vault-sync-side-body" });
    this.writeSpans(body, lines);
  }
  renderEditor(parent, id) {
    const box = parent.createDiv({ cls: "vault-sync-result" });
    box.createDiv({ cls: "vault-sync-result-label", text: "Edit the text that will be saved" });
    const area = box.createEl("textarea", { cls: "vault-sync-merge-editor" });
    area.value = this.draft;
    area.oninput = () => {
      this.draft = area.value;
    };
    const actions = box.createDiv({ cls: "vault-sync-change-actions" });
    const use = actions.createEl("button", { cls: "mod-cta", text: "Use this text" });
    use.onclick = () => {
      this.custom.set(id, this.draft);
      this.editing = null;
      this.renderText();
    };
    const cancel = actions.createEl("button", { text: "Cancel" });
    cancel.onclick = () => {
      this.editing = null;
      this.renderText();
    };
  }
  renderCustom(parent, text) {
    const box = parent.createDiv({ cls: "vault-sync-result" });
    box.createDiv({ cls: "vault-sync-result-label", text: "Text that will be saved" });
    if (text.length === 0) {
      box.createDiv({ cls: "vault-sync-side-empty", text: "These lines will be left out." });
      return;
    }
    const body = box.createDiv({ cls: "vault-sync-side-body" });
    this.writeLines(body, text);
  }
  savedCaption(row, choice, edited, editing) {
    if (editing || edited || !choice) return null;
    if (choice.local && choice.remote) return "Saving this device's text, then Dropbox's text.";
    if (choice.local) return "Saving the text from this device.";
    if (choice.remote) return "Saving the text from Dropbox.";
    return row.local.length > 0 || row.remote.length > 0 ? "These lines will be left out." : null;
  }
  writeLines(parent, text) {
    const lines = text.length === 0 ? [] : text.split("\n");
    if (lines.length === 0) {
      parent.createDiv({ cls: "vault-sync-side-empty", text: "Nothing on this side" });
      return;
    }
    for (const line of lines) {
      const row = parent.createDiv({ cls: "vault-sync-side-line" });
      if (line.length === 0) row.addClass("is-blank");
      else row.setText(line);
    }
  }
  writeSpans(parent, lines) {
    if (lines.length === 0) {
      parent.createDiv({ cls: "vault-sync-side-empty", text: "Nothing on this side" });
      return;
    }
    for (const spans of lines) {
      const row = parent.createDiv({ cls: "vault-sync-side-line" });
      if (spans.length === 0 || spans.every((span) => span.text.length === 0)) {
        row.addClass("is-blank");
        continue;
      }
      for (const span of spans) {
        const node = row.createSpan({ text: span.text });
        if (span.strong) node.addClass("is-strong");
      }
    }
  }
  choiceButton(parent, text, on, action) {
    const button = parent.createEl("button", { text });
    if (on) button.addClass("is-on");
    button.onclick = action;
  }
  choose(id, choice) {
    this.editing = null;
    this.applied.set(id, choice);
    this.custom.delete(id);
    this.renderText();
  }
  toggleKept(row, on) {
    this.editing = null;
    this.applied.set(row.id, hunkShape(row) === "remote-only" ? { local: false, remote: on } : { local: on, remote: false });
    this.custom.delete(row.id);
    this.renderText();
  }
  startEdit(row) {
    var _a2, _b2;
    if (this.editing === row.id) return;
    const choice = (_a2 = this.applied.get(row.id)) != null ? _a2 : { local: true, remote: true };
    this.draft = (_b2 = this.custom.get(row.id)) != null ? _b2 : hunkText(row, choice.local || choice.remote ? choice : { local: true, remote: true });
    this.editing = row.id;
    this.focusEdit = true;
    this.renderText();
  }
  keepDisagreements(choice) {
    this.editing = null;
    for (const row of this.rows) {
      if (hunkShape(row) !== "both") continue;
      this.applied.set(row.id, { ...choice });
      this.custom.delete(row.id);
    }
    this.renderText();
  }
  jumpHunk(step) {
    const bars = Array.from(this.contentEl.querySelectorAll("[data-hunk]"));
    if (bars.length === 0) return;
    const pending = bars.filter((bar) => bar.hasClass("is-pending"));
    const list = pending.length > 0 ? pending : bars;
    const current = list.findIndex((bar) => bar.hasClass("is-current"));
    const next = list[(current + step + list.length) % list.length];
    for (const bar of bars) bar.removeClass("is-current");
    next.addClass("is-current");
    next.scrollIntoView({ block: "center" });
  }
  renderSideChoice(message, local, remote) {
    this.mode = "binary";
    this.binary = null;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("p", { cls: "vault-sync-merge-summary", text: message });
    const sides = contentEl.createDiv({ cls: "vault-sync-change-sides vault-sync-file-choice" });
    const choose = (bytes, button) => {
      this.binary = bytes;
      for (const item of Array.from(sides.querySelectorAll("button"))) item.removeClass("is-on");
      button.addClass("is-on");
      const save2 = contentEl.querySelector(".vault-sync-binary-save");
      if (save2) save2.disabled = false;
    };
    if (local) {
      const side = sides.createDiv({ cls: "vault-sync-side is-local" });
      side.createDiv({ cls: "vault-sync-side-label", text: "This device" });
      side.createDiv({ cls: "vault-sync-side-empty", text: "Keep the copy stored on this device." });
      const keep = side.createEl("button", { text: "Keep this device" });
      keep.onclick = () => choose(local, keep);
    }
    if (remote) {
      const side = sides.createDiv({ cls: "vault-sync-side is-remote" });
      side.createDiv({ cls: "vault-sync-side-label", text: "Dropbox" });
      side.createDiv({ cls: "vault-sync-side-empty", text: "Keep the copy stored in Dropbox." });
      const keep = side.createEl("button", { text: "Keep Dropbox" });
      keep.onclick = () => choose(remote, keep);
    }
    const footer = contentEl.createDiv({ cls: "vault-sync-merge-footer" });
    const apply = footer.createDiv({ cls: "vault-sync-merge-nav" });
    const save = apply.createEl("button", { cls: "mod-cta vault-sync-binary-save", text: "Apply" });
    save.disabled = true;
    save.onclick = () => {
      void this.save();
    };
    const cancel = apply.createEl("button", { text: "Cancel" });
    cancel.onclick = () => this.close();
  }
};

// src/release.ts
var RELEASE_REPO = "alexyuvchenko/obsidian-vault-anovem-sync";
var PLUGIN_FILES = ["manifest.json", "main.js", "styles.css"];
function compareVersions(left, right) {
  var _a2, _b2;
  const a = versionParts(left);
  const b = versionParts(right);
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const diff = ((_a2 = a[i]) != null ? _a2 : 0) - ((_b2 = b[i]) != null ? _b2 : 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
function parseLatestRelease(body, current) {
  if (!body || typeof body !== "object") throw new Error("GitHub did not return a release.");
  const release = body;
  const version = versionLabel(release.tag_name);
  if (!version) throw new Error("GitHub release has no version.");
  if (compareVersions(version, current) <= 0) return null;
  if (!Array.isArray(release.assets)) throw new Error("GitHub release has no plugin files.");
  const files = {};
  for (const name of PLUGIN_FILES) {
    const asset = release.assets.find((item) => {
      return !!item && typeof item === "object" && item.name === name;
    });
    const url = asset == null ? void 0 : asset.browser_download_url;
    if (typeof url !== "string" || !url.startsWith("https://")) {
      throw new Error(`GitHub release is missing ${name}.`);
    }
    files[name] = url;
  }
  return { version, current, files };
}
function versionLabel(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^v/i, "");
}
function versionParts(value) {
  return versionLabel(value).split(".").map((part) => {
    const match = /^(\d+)/.exec(part);
    return match ? Number(match[1]) : 0;
  });
}

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
    new import_obsidian4.Setting(containerEl).setName("Plugin update").setDesc(`Installed ${this.plugin.manifest.version}. Downloads the latest GitHub release into this vault and reloads the plugin. Obsidian stays open.`).addButton((button) => {
      button.setButtonText("Install or update").setCta();
      button.onClick(() => {
        void this.plugin.updateFromGitHub();
      });
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
    new import_obsidian4.Setting(containerEl).setName("Conflict resolving").setDesc("Review asks you to choose when both sides changed, and when a file was removed on only one side. Merge combines those notes against the last synced copy, keeps this device where the same words changed, renames a matching note, and moves a one-sided deletion to the trash. Preview sync shows the plan either way.").addDropdown((dropdown) => {
      dropdown.addOption("review", "Review");
      dropdown.addOption("merge", "Merge");
      dropdown.setValue(this.plugin.settings.conflictMode === "merge" ? "merge" : "review");
      dropdown.onChange(async (value) => {
        this.plugin.settings.conflictMode = value === "merge" ? "merge" : "review";
        await this.plugin.persist();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Sync").setDesc(this.plugin.settings.lastSyncSummary || "Not synced yet.").addButton((button) => {
      button.setButtonText("Preview");
      button.onClick(() => {
        void this.plugin.previewNow();
      });
    }).addButton((button) => {
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
function planSync(local, remote, mode = "review", initial = false) {
  if (local === "absent" && remote === "absent") return { action: "forget" };
  if (mode === "merge" && initial && local !== "absent") return { action: "upload" };
  if (mode === "merge" && initial && remote !== "absent") return { action: "download" };
  if (local === "untracked" && remote === "absent") return { action: "upload" };
  if (local === "absent" && remote === "untracked") return { action: "download" };
  if (local === "untracked") return { action: "compare" };
  if (remote === "untracked") return { action: "compare" };
  if (local === "unchanged" && remote === "unchanged") return { action: "skip" };
  if (local === "changed" && remote === "unchanged") return { action: "upload" };
  if (local === "unchanged" && remote === "changed") return { action: "download" };
  if (local === "changed" && remote === "changed") return mode === "merge" ? { action: "merge" } : { action: "compare" };
  if (mode === "merge" && local === "absent" && remote === "unchanged") return { action: "trash-remote" };
  if (mode === "merge" && local === "unchanged" && remote === "absent") return { action: "trash-local" };
  if (local === "absent") return { action: "conflict", kind: "deleted-local" };
  return { action: "conflict", kind: "deleted-remote" };
}
function planRename(matches, oldRemoteUnchanged, newRemoteExists) {
  return matches === 1 && oldRemoteUnchanged && !newRemoteExists;
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
  const quiet = report.uploaded === 0 && report.downloaded === 0 && report.merged === 0 && report.renamed === 0 && report.trashed === 0 && report.conflicts === 0 && report.failed.length === 0;
  if (!report.cancelled && quiet) return "Already in sync.";
  let text = `${base}Uploaded ${report.uploaded}, downloaded ${report.downloaded}, merged ${report.merged}, renamed ${report.renamed}, trashed ${report.trashed}, conflicts ${report.conflicts}.`;
  if (report.overlaps.length > 0) {
    text += ` Kept this device where the same words changed: ${report.overlaps.slice(0, 3).join(", ")}.`;
  }
  if (report.failed.length === 0) return text;
  return `${text} ${report.failed.slice(0, 3).join(" ")}`;
}
function emptyReport() {
  return { uploaded: 0, downloaded: 0, merged: 0, renamed: 0, trashed: 0, overlaps: [], conflicts: 0, failed: [], cancelled: false };
}
var SyncEngine = class {
  constructor(app, settings, state, persist, client) {
    this.app = app;
    this.settings = settings;
    this.state = state;
    this.persist = persist;
    this.client = client;
    this.remotes = /* @__PURE__ */ new Map();
    this.pendingRenames = /* @__PURE__ */ new Map();
    this.renamedAway = /* @__PURE__ */ new Set();
    this.initialSync = false;
    this.mergeMode = false;
    this.readConflictBytes = async (relativePath) => {
      const normalized = (0, import_obsidian5.normalizePath)(relativePath);
      const file = this.app.vault.getAbstractFileByPath(normalized);
      const local = file instanceof import_obsidian5.TFile ? await this.app.vault.readBinary(file) : null;
      const folder = syncVaultFolder(normalizeDropboxFolder(this.settings.dropboxFolder), this.app.vault.getName());
      const meta = await this.client.metadata(toDropboxPath(folder, normalized));
      if (!meta) return { local, remote: null };
      const downloaded = await this.client.download(meta.pathDisplay);
      return { local, remote: downloaded.bytes };
    };
    this.saveResolution = async (relativePath, resolved, now) => {
      const sides = await this.readConflictBytes(relativePath);
      const folder = syncVaultFolder(normalizeDropboxFolder(this.settings.dropboxFolder), this.app.vault.getName());
      const stamp = formatTimestamp(now);
      const backups = [];
      if (sides.local) backups.push(await this.writeBoth(folder, conflictBackupPath(relativePath, stamp, "local"), sides.local));
      if (sides.remote) backups.push(await this.writeBoth(folder, conflictBackupPath(relativePath, stamp, "dropbox"), sides.remote));
      await this.writeBoth(folder, relativePath, resolved);
      this.state.conflicts = this.state.conflicts.filter((item) => pathKey(item.path) !== pathKey(relativePath));
      await this.persist();
      return backups;
    };
    this.sync = async (ui) => {
      const result = await this.run(ui, true);
      return result.report;
    };
    this.preview = async (ui) => {
      const result = await this.run(ui, false);
      return result.lines;
    };
    this.run = async (ui, write) => {
      const report = emptyReport();
      const lines = [];
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
        this.mergeMode = this.settings.conflictMode === "merge";
        this.initialSync = this.mergeMode && Object.keys(this.state.files).length === 0;
        ui.update("Reading Dropbox\u2026");
        await yieldToUi2();
        const remote = await this.client.listFiles(folder);
        listed = true;
        items = this.collect(attachments, remote.files);
        await this.indexRenames(items, ui);
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
            const outcome = await this.apply(item, folder, previous.get(item.key), write);
            this.count(report, lines, label, outcome);
            if (write && outcome.type === "conflict") {
              nextConflicts.push({
                path: label,
                kind: outcome.kind,
                localHash: outcome.localHash,
                remoteRev: outcome.remoteRev
              });
            }
          } catch (error) {
            if (error instanceof DropboxError && error.message === "missing") {
              if (item.local) {
                const conflict = conflictOutcome(await this.localHash(item), null);
                this.count(report, lines, label, conflict);
                if (write) nextConflicts.push({ path: item.local.path, kind: "deleted-remote", localHash: conflict.localHash, remoteRev: null });
              } else if (write) this.deleteRecord(item.key);
            } else {
              report.failed.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
          await yieldToUi2();
        }
        return { report, lines };
      } finally {
        if (write && listed) {
          const itemKeys = new Set(items.map((item) => item.key));
          for (const [key, conflict] of previous) {
            if (!seen.has(key) && itemKeys.has(key)) nextConflicts.push(conflict);
          }
          const byKey = /* @__PURE__ */ new Map();
          for (const conflict of nextConflicts) byKey.set(pathKey(conflict.path), conflict);
          this.state.conflicts = [...byKey.values()];
          report.conflicts = this.state.conflicts.length;
        }
        if (write) await this.persist();
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
      this.remotes.clear();
      for (const remote of remoteFiles) {
        if (!isIncluded(remote.relativePath, attachments)) continue;
        slot(remote.relativePath).remote = remote;
        this.remotes.set(pathKey(remote.relativePath), remote);
      }
      for (const [recordPath, record] of Object.entries(this.state.files)) {
        const item = slot(recordPath);
        item.record = record;
        item.recordPath = recordPath;
      }
      return [...map.values()].sort((a, b) => itemPath(a).localeCompare(itemPath(b)));
    };
    this.apply = async (item, folder, existing, write) => {
      var _a2, _b2;
      const local = await inspectLocal(item.local, item.record);
      const localHash = item.local ? local.hash : null;
      const remoteRev = (_b2 = (_a2 = item.remote) == null ? void 0 : _a2.rev) != null ? _b2 : null;
      const classified = hasSnapshot(existing) ? await this.classifyManual(item, existing, local, localHash, remoteRev) : await this.classifyFresh(item, local, localHash, remoteRev);
      if (!write) return classified;
      return this.execute(item, folder, local, classified);
    };
    this.classifyManual = async (item, existing, local, localHash, remoteRev) => {
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
          return {
            type: "adopt",
            path: item.local.path,
            bytes: downloaded.bytes,
            record: {
              hash: local.hash,
              size: local.size,
              mtime: local.mtime,
              dropboxRev: downloaded.rev || item.remote.rev
            }
          };
        }
        action = "hold";
      } else if (action === "compare") {
        action = "hold";
      }
      if (action === "forget") return { type: "forget" };
      if (action === "hold") return conflictOutcome(localHash, remoteRev);
      if (action === "download") return { type: "download" };
      return { type: "upload" };
    };
    this.classifyFresh = async (item, local, localHash, remoteRev) => {
      var _a2;
      if (this.renamedAway.has(item.key) && !item.local) return { type: "forget" };
      const rename = this.pendingRenames.get(item.key);
      if (rename && item.local) return { type: "rename", fromPath: rename.fromPath, fromKey: rename.fromKey, record: rename.record };
      const remote = !item.remote ? "absent" : !item.record ? "untracked" : item.remote.rev === item.record.dropboxRev ? "unchanged" : "changed";
      let action = planSync(local.presence, remote, this.mergeMode ? "merge" : "review", this.initialSync);
      if (action.action === "compare") {
        if (!item.remote || !item.local) return conflictOutcome(localHash, remoteRev);
        const downloaded = await this.client.download(item.remote.dropboxPath);
        const remoteHash = await sha256Hex(downloaded.bytes);
        action = planAfterCompare(remoteHash === local.hash);
        if (action.action === "adopt") {
          return {
            type: "adopt",
            path: item.local.path,
            bytes: (_a2 = local.bytes) != null ? _a2 : downloaded.bytes,
            record: {
              hash: local.hash,
              size: local.size,
              mtime: local.mtime,
              dropboxRev: downloaded.rev || item.remote.rev
            }
          };
        }
      }
      if (action.action === "skip") return this.mergeMode && item.local ? { type: "backfill", path: item.local.path } : { type: "none" };
      if (action.action === "forget") return { type: "forget" };
      if (action.action === "conflict") return conflictOutcome(localHash, remoteRev);
      if (action.action === "download") return { type: "download" };
      if (action.action === "upload") return { type: "upload" };
      if (action.action === "trash-local") return { type: "trash-local" };
      if (action.action === "trash-remote") return { type: "trash-remote" };
      if (action.action === "merge") return this.classifyMerge(item, local, localHash, remoteRev);
      return { type: "none" };
    };
    this.classifyMerge = async (item, local, localHash, remoteRev) => {
      var _a2, _b2, _c;
      if (!item.local || !item.remote) return conflictOutcome(localHash, remoteRev);
      const downloaded = await this.client.download(item.remote.dropboxPath);
      const remoteHash = await sha256Hex(downloaded.bytes);
      if (remoteHash === local.hash) {
        return {
          type: "adopt",
          path: item.local.path,
          bytes: (_a2 = local.bytes) != null ? _a2 : downloaded.bytes,
          record: {
            hash: local.hash,
            size: local.size,
            mtime: local.mtime,
            dropboxRev: downloaded.rev || item.remote.rev
          }
        };
      }
      const localBytes = (_b2 = local.bytes) != null ? _b2 : await this.app.vault.readBinary(item.local);
      const localText = decodeUtf8(localBytes);
      const remoteText = decodeUtf8(downloaded.bytes);
      const baseBytes = await this.readBase((_c = item.recordPath) != null ? _c : item.local.path);
      const baseText = baseBytes ? decodeUtf8(baseBytes) : null;
      if (localText === null || remoteText === null || baseText === null) return conflictOutcome(localHash, remoteRev);
      const merged = mergeWords(baseText, localText, remoteText);
      const encoded = new TextEncoder().encode(merged.text);
      return {
        type: "merge",
        overlap: merged.overlap,
        path: item.local.path,
        bytes: encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength)
      };
    };
    this.execute = async (item, folder, local, classified) => {
      var _a2, _b2, _c, _d;
      if (classified.type === "backfill") {
        try {
          if (!await this.readBase(classified.path)) {
            const file = this.app.vault.getAbstractFileByPath((0, import_obsidian5.normalizePath)(classified.path));
            if (file instanceof import_obsidian5.TFile) await this.saveBase(classified.path, await this.app.vault.readBinary(file));
          }
        } catch (e) {
        }
        return { type: "none" };
      }
      if (classified.type === "forget") {
        this.deleteRecord(item.key);
        return { type: "none" };
      }
      if (classified.type === "adopt") {
        await this.agree(classified.path, classified.record, item.recordPath, classified.bytes);
        return { type: "none" };
      }
      if (classified.type === "download") return this.downloadRemote(item, local, item.local ? local.hash : null, (_b2 = (_a2 = item.remote) == null ? void 0 : _a2.rev) != null ? _b2 : null);
      if (classified.type === "upload") return this.uploadLocal(item, folder, local, item.local ? local.hash : null, (_d = (_c = item.remote) == null ? void 0 : _c.rev) != null ? _d : null);
      if (classified.type === "trash-local") return this.trashLocal(item);
      if (classified.type === "trash-remote") return this.trashRemote(item);
      if (classified.type === "merge") {
        await this.writeBoth(folder, classified.path, classified.bytes);
        return classified;
      }
      if (classified.type === "rename") return this.rename(item, folder, local, classified);
      return classified;
    };
    this.rename = async (item, folder, local, classified) => {
      var _a2;
      const oldRemote = this.remotes.get(classified.fromKey);
      if (!oldRemote || !item.local) return conflictOutcome(local.hash, null);
      const moved = await this.client.move(oldRemote.dropboxPath, toDropboxPath(folder, item.local.path));
      await this.agree(item.local.path, {
        hash: classified.record.hash,
        size: local.size,
        mtime: local.mtime,
        dropboxRev: moved.rev
      }, classified.fromPath, (_a2 = local.bytes) != null ? _a2 : await this.app.vault.readBinary(item.local));
      await this.removeBase(classified.fromPath);
      return { type: "rename", fromPath: classified.fromPath, fromKey: classified.fromKey, record: classified.record };
    };
    this.trashLocal = async (item) => {
      if (!item.local) return { type: "none" };
      await trashVaultFile(this.app, item.local);
      this.deleteRecord(item.key);
      return { type: "trash-local" };
    };
    this.trashRemote = async (item) => {
      if (!item.remote) return { type: "none" };
      await this.client.delete(item.remote.dropboxPath);
      this.deleteRecord(item.key);
      return { type: "trash-remote" };
    };
    this.downloadRemote = async (item, local, localHash, remoteRev) => {
      var _a2, _b2;
      if (!item.remote) return conflictOutcome(localHash, remoteRev);
      const downloaded = await this.client.download(item.remote.dropboxPath);
      const remoteHash = await sha256Hex(downloaded.bytes);
      const canonical = (_b2 = (_a2 = item.local) == null ? void 0 : _a2.path) != null ? _b2 : item.remote.relativePath;
      if (item.local && remoteHash === local.hash) {
        await this.agree(canonical, {
          hash: local.hash,
          size: local.size,
          mtime: local.mtime,
          dropboxRev: downloaded.rev || item.remote.rev
        }, item.recordPath, downloaded.bytes);
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
            await this.agree(item.local.path, {
              hash,
              size: bytes.byteLength,
              mtime: stableMtime(this.app, item.local.path, local.mtime, bytes.byteLength),
              dropboxRev: downloaded.rev
            }, item.recordPath, bytes);
            return { type: "none" };
          }
          return conflictOutcome(hash, downloaded.rev || remoteRev);
        }
        const found = await this.client.metadata(apiPath);
        return conflictOutcome(hash, (_d = found == null ? void 0 : found.rev) != null ? _d : remoteRev);
      }
      await this.agree(item.local.path, {
        hash,
        size: bytes.byteLength,
        mtime: stableMtime(this.app, item.local.path, local.mtime, bytes.byteLength),
        dropboxRev: uploaded.rev
      }, item.recordPath, bytes);
      return { type: "upload" };
    };
    this.writeBoth = async (folder, relativePath, bytes) => {
      const normalized = (0, import_obsidian5.normalizePath)(relativePath);
      await writeLocal(this.app.vault, normalized, bytes);
      const uploaded = await this.client.upload(toDropboxPath(folder, normalized), bytes, "overwrite");
      if (uploaded.conflict) throw new Error(`Dropbox rejected ${normalized}.`);
      await this.rememberWritten(normalized, uploaded.rev, bytes);
      return normalized;
    };
    this.rememberWritten = async (path, rev2, bytes) => {
      const writtenHash = await sha256Hex(bytes);
      const file = this.app.vault.getAbstractFileByPath((0, import_obsidian5.normalizePath)(path));
      if (!(file instanceof import_obsidian5.TFile)) {
        this.putRecord(path, { hash: writtenHash, size: bytes.byteLength, mtime: 0, dropboxRev: rev2 });
        await this.saveBase(path, bytes);
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
      await this.saveBase(file.path, bytes);
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
        if (pathKey(existing) !== key) continue;
        void this.removeBase(existing);
        delete this.state.files[existing];
      }
    };
    this.agree = async (path, record, previous, bytes) => {
      this.putRecord(path, record, previous);
      await this.saveBase(path, bytes);
    };
    this.count = (report, lines, label, outcome) => {
      if (outcome.type === "upload") {
        report.uploaded += 1;
        lines.push({ path: label, action: "upload", note: "Send this copy to Dropbox." });
      } else if (outcome.type === "download") {
        report.downloaded += 1;
        lines.push({ path: label, action: "download", note: "Save the Dropbox copy here." });
      } else if (outcome.type === "merge") {
        report.merged += 1;
        if (outcome.overlap) report.overlaps.push(outcome.path);
        lines.push({
          path: label,
          action: "merge",
          note: outcome.overlap ? "Same words changed. This device is kept there." : "Changes from both sides combine."
        });
      } else if (outcome.type === "rename") {
        report.renamed += 1;
        lines.push({ path: label, action: "rename", note: `Dropbox path moves from ${outcome.fromPath}.` });
      } else if (outcome.type === "trash-local") {
        report.trashed += 1;
        lines.push({ path: label, action: "trash", note: "Removed in Dropbox. This copy goes to the trash." });
      } else if (outcome.type === "trash-remote") {
        report.trashed += 1;
        lines.push({ path: label, action: "trash", note: "Removed here. The Dropbox copy goes to the trash." });
      } else if (outcome.type === "conflict") {
        lines.push({ path: label, action: "conflict", note: "Needs a review." });
      }
    };
    this.indexRenames = async (items, ui) => {
      var _a2, _b2;
      this.pendingRenames.clear();
      this.renamedAway.clear();
      if (!this.mergeMode || this.initialSync) return;
      const orphans = items.filter((item) => !item.local && item.record && item.recordPath);
      const used = /* @__PURE__ */ new Set();
      for (const item of items) {
        if (ui.cancelled()) return;
        if (!item.local || item.record || item.remote) continue;
        const local = await inspectLocal(item.local, void 0);
        const matches = orphans.filter((orphan) => {
          var _a3;
          return !used.has(orphan.key) && ((_a3 = orphan.record) == null ? void 0 : _a3.hash) === local.hash;
        });
        const remote = matches.length === 1 ? this.remotes.get(matches[0].key) : void 0;
        const unchanged = !!remote && remote.rev === ((_a2 = matches[0].record) == null ? void 0 : _a2.dropboxRev);
        if (!((_b2 = matches[0]) == null ? void 0 : _b2.record) || !matches[0].recordPath || !planRename(matches.length, unchanged, false)) continue;
        used.add(matches[0].key);
        this.pendingRenames.set(item.key, { fromKey: matches[0].key, fromPath: matches[0].recordPath, record: matches[0].record });
        this.renamedAway.add(matches[0].key);
      }
    };
    this.localHash = async (item) => {
      if (!item.local) return null;
      const local = await inspectLocal(item.local, item.record);
      return local.hash;
    };
    this.baseFolder = () => {
      return (0, import_obsidian5.normalizePath)(`${this.app.vault.configDir}/plugins/vault-anovem-sync/bases`);
    };
    this.baseFile = async (relativePath) => {
      const encoded = new TextEncoder().encode(pathKey(relativePath));
      const name = await sha256Hex(encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength));
      return `${this.baseFolder()}/${name}`;
    };
    this.readBase = async (relativePath) => {
      const path = await this.baseFile(relativePath);
      if (!await this.app.vault.adapter.exists(path)) return null;
      return this.app.vault.adapter.readBinary(path);
    };
    this.saveBase = async (relativePath, bytes) => {
      try {
        const folder = this.baseFolder();
        if (!await this.app.vault.adapter.exists(folder)) await this.app.vault.adapter.mkdir(folder);
        await this.app.vault.adapter.writeBinary(await this.baseFile(relativePath), bytes);
      } catch (e) {
      }
    };
    this.removeBase = async (relativePath) => {
      try {
        const path = await this.baseFile(relativePath);
        if (await this.app.vault.adapter.exists(path)) await this.app.vault.adapter.remove(path);
      } catch (e) {
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
async function trashVaultFile(app, file) {
  const manager = app.fileManager;
  if (typeof manager.trashFile === "function") {
    await manager.trashFile.call(app.fileManager, file);
    return;
  }
  await app.vault.trash(file, false);
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
  backupFolder: "backups",
  conflictMode: "review"
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
    this.conflictStatus = null;
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
        this.refreshConflictChrome();
        if (this.state.conflicts.length > 0 && (!background || conflictsChanged)) this.showConflicts();
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
    this.previewNow = async () => {
      if (this.running) {
        new import_obsidian6.Notice("A sync or backup is already running.");
        return;
      }
      this.running = true;
      const modal = new SyncProgressModal(this.app, "Previewing sync");
      modal.open();
      try {
        const lines = await this.engine.preview({
          cancelled: () => modal.cancelled,
          update: (text) => {
            var _a2;
            modal.setStatus(text);
            (_a2 = this.statusBar) == null ? void 0 : _a2.setText(text);
          }
        });
        modal.finish();
        new SyncPlanModal(this.app, lines, () => {
          void this.syncNow();
        }).open();
      } catch (error) {
        modal.finish();
        new import_obsidian6.Notice(errorMessage(error));
      } finally {
        this.running = false;
      }
    };
    this.updateFromGitHub = async () => {
      try {
        const listed = await (0, import_obsidian6.requestUrl)({
          url: `https://api.github.com/repos/${RELEASE_REPO}/releases/latest`,
          headers: { Accept: "application/vnd.github+json" }
        });
        const plan = parseLatestRelease(listed.json, this.manifest.version);
        if (!plan) {
          new import_obsidian6.Notice(`Vault Anovem Sync ${this.manifest.version} is current.`);
          return;
        }
        const dir = this.manifest.dir;
        if (!dir) throw new Error("Plugin folder is missing.");
        for (const name of PLUGIN_FILES) {
          const downloaded = await (0, import_obsidian6.requestUrl)({ url: plan.files[name] });
          await this.app.vault.adapter.writeBinary(`${dir}/${name}`, downloaded.arrayBuffer);
        }
        new import_obsidian6.Notice(`Installed ${plan.version}. Reloading the plugin.`);
        await reloadPlugin(this.app, this.manifest.id);
      } catch (error) {
        new import_obsidian6.Notice(errorMessage(error));
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
      id: "preview-sync",
      name: "Preview sync",
      callback: () => {
        void this.previewNow();
      }
    });
    this.addCommand({
      id: "show-conflicts",
      name: "Show sync conflicts",
      callback: () => this.showConflicts()
    });
    this.addCommand({
      id: "review-conflict",
      name: "Review sync conflict in the active note",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const open = !!file && this.state.conflicts.some((conflict) => pathKey(conflict.path) === pathKey(file.path));
        if (checking) return open;
        if (file && open) this.reviewConflict(file.path);
        return open;
      }
    });
    this.addCommand({
      id: "update-plugin",
      name: "Install or update plugin from GitHub",
      callback: () => {
        void this.updateFromGitHub();
      }
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
      this.conflictStatus = this.addStatusBarItem();
      this.conflictStatus.addClass("vault-sync-conflict-status");
      this.conflictStatus.onclick = () => this.showConflicts();
    }
    this.registerEvent(this.app.workspace.on("file-open", () => this.refreshConflictBanner()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.refreshConflictBanner()));
    this.refreshConflictChrome();
    this.scheduleBackgroundSync();
    this.app.workspace.onLayoutReady(() => {
      this.refreshConflictChrome();
      if (this.state.conflicts.length > 0) this.showConflicts();
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
  reviewConflict(path, onDone) {
    new ConflictResolveModal(this.app, this, path, () => {
      this.refreshConflictChrome();
      onDone == null ? void 0 : onDone();
    }).open();
  }
  refreshConflictChrome() {
    const count = this.state.conflicts.length;
    if (this.conflictStatus) {
      this.conflictStatus.toggleClass("is-clear", count === 0);
      this.conflictStatus.setText(count === 0 ? "" : `${count} ${count === 1 ? "conflict" : "conflicts"}`);
    }
    this.refreshConflictBanner();
  }
  onunload() {
    document.querySelectorAll(".vault-sync-conflict-banner").forEach((el) => el.remove());
  }
  refreshConflictBanner() {
    var _a2, _b2;
    document.querySelectorAll(".vault-sync-conflict-banner").forEach((el) => el.remove());
    const file = this.app.workspace.getActiveFile();
    if (!file || !this.state.conflicts.some((conflict) => pathKey(conflict.path) === pathKey(file.path))) return;
    const view = (_b2 = this.app.workspace.getActiveViewOfType(import_obsidian6.MarkdownView)) != null ? _b2 : (_a2 = this.app.workspace.getMostRecentLeaf()) == null ? void 0 : _a2.view;
    if (!view) return;
    for (const host of bannerHosts(view.containerEl)) {
      const banner = host.createDiv({ cls: "vault-sync-conflict-banner" });
      host.prepend(banner);
      banner.createSpan({ text: "This note has a sync conflict." });
      const review = banner.createEl("button", { text: "Review" });
      review.onclick = () => this.reviewConflict(file.path);
    }
  }
};
async function reloadPlugin(app, id) {
  const plugins = app.plugins;
  await plugins.disablePlugin(id);
  await plugins.enablePlugin(id);
}
function bannerHosts(container) {
  const found = [".markdown-source-view", ".markdown-reading-view"].map((selector) => container.querySelector(selector)).filter((node) => node instanceof HTMLElement);
  if (found.length > 0) return found;
  const content = container.querySelector(".view-content");
  return [content instanceof HTMLElement ? content : container];
}
function normalizeSyncMinutes(value) {
  if (!Number.isFinite(value)) return 5;
  return Math.min(240, Math.max(1, Math.round(value)));
}
