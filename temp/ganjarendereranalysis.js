static graph(f, options) {
  // Store the original input
  if (!f) return; var origf = f;
  // generate default options.
  options = options || {}; options.scale = options.scale || 1; options.camera = options.camera || (tot != 4 ? Element.Scalar(1) : (Element.Bivector(0, 0, 0, 0, 0, options.p || 0).Exp()).Mul(Element.Bivector(0, 0, 0, 0, options.h || 0, 0).Exp()));
  if (options.conformal && tot == 4) var ni = options.ni || this.Coeff(4, 1, 3, 1), no = options.no || this.Coeff(4, 0.5, 3, -0.5), minus_no = no.Scale(-1);
  var ww = options.width, hh = options.height, cvs = options.canvas, tpcam = new Element([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -5, 0, 0, 1, 0]), tpy = this.Coeff(4, 1), tp = new Element(),
    // project 3D to 2D. This allows to render 3D and 2D PGA with the same code.
    project = (o) => {
      if (!o) return o; while (o.call) o = o();
      //          if (o instanceof Element && o.length == 32) o = new Element([o[0],o[1],o[2],o[3],o[4],o[6],o[7],o[8],o[10],o[11],o[13],o[16],o[17],o[19],o[22],o[26]]); 
      // Clip 3D lines so they don't go past infinity.
      if (o instanceof Element && o.length == 16 && o[8] ** 2 + o[9] ** 2 + o[10] ** 2 > 0.0001) {
        o = [[options.clip || 2, 1, 0, 0], [-(options.clip || 2), 1, 0, 0], [options.clip || 2, 0, 1, 0], [-(options.clip || 2), 0, 1, 0], [options.clip || 2, 0, 0, 1], [-(options.clip || 2), 0, 0, 1]].map(v => {
          var r = Element.Vector(...v).Wedge(o); return r[14] ? r.Scale(1 / r[14], r) : undefined;
        }).filter(x => x && Math.abs(x[13]) <= (options.clip || 2) + 0.001 && Math.abs(x[12]) <= (options.clip || 2) + 0.001 && Math.abs(x[11]) <= (options.clip || 2) + 0.001).slice(0, 2);
        return o.map(o => (tpcam).Vee(options.camera.Mul(o).Mul(options.camera.Conjugate)).Wedge(tpy));
      }
      // Convert 3D planes to polies.
      if (o instanceof Element && o.length == 16 && o.Grade(1).Length > 0.01) {
        var m = Element.Add(1, Element.Mul(o.Normalized, Element.Coeff(3, 1))).Normalized, e0 = 0;
        o = Element.sw(m, [[-1, -1], [-1, 1], [1, 1], [-1, -1], [1, 1], [1, -1]].map(([x, z]) => Element.Trivector(x * o.Length, e0, z * o.Length, 1)));
        return o.map(o => (tpcam).Vee(options.camera.Mul(o).Mul(options.camera.Conjugate)).Wedge(tpy));
      }
      return (tot == 4 && o instanceof Element && o.length == 16) ? (tpcam).Vee(options.camera.Mul(o).Mul(options.camera.Conjugate)).Wedge(tpy) : (o.length == 2 ** tot) ? Element.sw(options.camera, o) : o;
    };
  // gl escape.
  if (options.gl && !(tot == 4 && options.conformal)) return Element.graphGL(f, options); if (options.up) return Element.graphGL2(f, options);
  // if we get an array or function without parameters, we render c2d or p2d SVG points/lines/circles/etc
  if (!(f instanceof Function) || f.length === 0) {
    // Our current cursor, color, animation state and 2D mapping.
    var lx, ly, lr, color, res, anim = false, to2d = (tot == 5) ? [0, 8, 11, 13, 19, 17, 22, 26] : (tot == 3) ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 7, 9, 10, 13, 12, 14, 15];
    // Make sure we have an array of elements. (if its an object, convert to array with elements and names.)
    if (f instanceof Function) f = f(); if (!(f instanceof Array)) f = [].concat.apply([], Object.keys(f).map((k) => typeof f[k] == 'number' ? [f[k]] : [f[k], k]));
    // The build function generates the actual SVG. It will be called everytime the user interacts or the anim flag is set.
    function build(f, or) {
      // Make sure we have an aray.
      if (or && f && f instanceof Function) f = f();
      // Reset position and color for cursor.
      lx = -2; ly = options.conformal ? -1.85 : 1.85; lr = 0; color = '#444';
      // Create the svg element. (master template string till end of function)
      var svg = new DOMParser().parseFromString(`<SVG viewBox="-2 -${2 * (hh / ww || 1)} 4 ${4 * (hh / ww || 1)}" style="width:${ww || 512}px; height:${hh || 512}px; background-color:#eee; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; user-select:none">
            ${// Add a grid (option)
        options.grid ? (() => {
          if (tot == 4 && !options.conformal) {
            const lines3d = (n, from, to, j, l = 0, ox = 0, oy = 0, alpha = 1) => [`<G stroke-opacity="${alpha}" fill-opacity="${alpha}">`, ...[...Array(n + 1)].map((x, i) => {
              var f = from.map((x, i) => x * (i == 3 ? 1 : (options.gridSize || 1))), t = to.map((x, i) => x * (i == 3 ? 1 : (options.gridSize || 1))); f[j] = t[j] = (i - (n / 2)) / (n / 2) * (options.gridSize || 1);
              var D3a = Element.Trivector(...f), D2a = project(D3a), D3b = Element.Trivector(...t), D2b = project(D3b);
              var lx = options.scale * D2a[drm[2]] / D2a[drm[1]]; if (drm[1] == 6 || drm[1] == 14) lx *= -1; var ly = -options.scale * D2a[drm[3]] / D2a[drm[1]];
              var lx2 = options.scale * D2b[drm[2]] / D2b[drm[1]]; if (drm[1] == 6 || drm[1] == 14) lx2 *= -1; var ly2 = -options.scale * D2b[drm[3]] / D2b[drm[1]];
              var r = `<line x1="${lx}" y1="${ly}" x2="${lx2}" y2="${ly2}" stroke="black" stroke-width="${i % 10 == 0 ? 0.005 : i % 5 == 0 ? 0.002 : 0.0005}" />`;
              if (l && i && i != n) r += `<text text-anchor="middle" font-size="0.04" fill="black" x="${l == 1 ? lx + ox : lx2 + ox}" y="${oy + (l == 1 ? ly : ly2)}" >${((from[j] < 0 ? -1 : 1) * (i - (n / 2)) / (n / 2) * (options.gridSize || 1)).toFixed(1)}</text>`
              return r;
            }), '</G>'];
            var front = Element.sw(options.camera, Element.Trivector(1, 0, 0, 0)).Dual.Dot(Element.Vector(0, 0, 0, 1)).s, ff = front > 0 ? 1 : -1;
            var left = Element.sw(options.camera, Element.Trivector(0, 0, 1, 0)).Dual.Dot(Element.Vector(0, 0, 0, 1)).s, ll = left > 0 ? 1 : -1;
            var fa = Math.max(0, Math.min(1, 5 * Math.abs(left))), la = Math.max(0, Math.min(1, 5 * Math.abs(front)));
            return [
              ...lines3d(20, [-1, -1, -1, 1], [1, -1, 1, 1], 2, options.labels ? ff : 0, 0, 0.05),
              ...lines3d(20, [-1, -1, -1, 1], [1, -1, 1, 1], 0, options.labels ? ll : 0, 0, 0.05),
              ...lines3d(20, [-1, -1, ll, 1], [1, 1, ll, 1], 0, 0, 0, 0, fa),
              ...lines3d(20, [-1, 1, ll, 1], [1, -1, ll, 1], 1, !options.labels ? 0 : (ff != -1) ? 1 : 2, ll * ff * -0.05, 0, fa),
              ...lines3d(20, [ff, 1, -1, 1], [ff, -1, 1, 1], 1, !options.labels ? 0 : (ll != -1) ? 1 : 2, ll * ff * 0.05, 0, la),
              ...lines3d(20, [ff, -1, -1, 1], [ff, 1, 1, 1], 2, 0, 0, 0, la),
            ].join('');
          }
          const s = options.scale, n = (10 / s) | 0, cx = options.camera.e02, cy = options.camera.e01, alpha = Math.min(1, (s - 0.2) * 10); if (options.scale < 0.1) return;
          const lines = (n, dir, space, width, color) => [...Array(2 * n + 1)].map((x, xi) => `<line x1="${dir ? -10 : ((xi - n) * space - (tot < 4 ? 2 * cy : 0)) * s}" y1="${dir ? ((xi - n) * space - (tot < 4 ? 2 * cx : 0)) * s : -10}" x2="${dir ? 10 : ((xi - n) * space - (tot < 4 ? 2 * cy : 0)) * s}" y2="${dir ? ((xi - n) * space - (tot < 4 ? 2 * cx : 0)) * s : 10}" stroke-width="${width}" stroke="${color}"/>`)
          return [`<G stroke-opacity='${alpha}' fill-opacity='${alpha}'>`, ...lines(n * 2, 0, 0.2, 0.005, '#DDD'), ...lines(n * 2, 1, 0.2, 0.005, '#DDD'), ...lines(n, 0, 1, 0.005, '#AAA'), ...lines(n, 1, 1, 0.005, '#AAA'), ...lines(n, 0, 5, 0.005, '#444'), ...lines(n, 1, 5, 0.005, '#444')]
            .concat(options.labels ? [...Array(4 * n + 1)].map((x, xi) => (xi - n * 2 == 0) ? `` : `<text text-anchor="middle" font-size="0.05" x="${((xi - n * 2) * 0.2 - (tot < 4 ? 2 * cy : 0)) * s}" y="0.06" >${((xi - n * 2) * 0.2).toFixed(1)}</text>`) : [])
            .concat(options.labels ? [...Array(4 * n + 1)].map((x, xi) => `<text text-anchor="end" font-size="0.05" y="${((xi - n * 2) * 0.2 - (tot < 4 ? 2 * cx : 0)) * s - 0.01}" x="-0.01" >${((xi - n * 2) * -0.2).toFixed(1)}</text>`) : []).join('') + '</G>';
        })() : ''}
            // Handle conformal 2D elements.
            ${options.conformal ? f.map && f.map((o, oidx) => {
          // Optional animation handling.
          if ((o == Element.graph && or !== false) || (oidx == 0 && options.animate && or !== false)) { anim = true; requestAnimationFrame(() => { var r = build(origf, (!res) || (document.body.contains(res))).innerHTML; if (res) res.innerHTML = r; }); if (!options.animate) return; }
          // Resolve expressions passed in.
          while (o.call) o = o();
          if (options.ipns && o instanceof Element) o = o.Dual;
          var sc = options.scale;
          var lineWidth = options.lineWidth || 1;
          var pointRadius = options.pointRadius || 1;
          var dash_for_r2 = (r2, render_r, target_width) => {
            // imaginary circles are dotted
            if (r2 >= 0) return 'none';
            var half_circum = render_r * Math.PI;
            var width = half_circum / Math.max(Math.round(half_circum / target_width), 1);
            return `${width} ${width}`;
          };
          // Arrays are rendered as segments or polygons. (2 or more elements)
          if (o instanceof Array) { lx = ly = lr = 0; o = o.map(o => { while (o.call) o = o(); return o.Scale(-1 / o.Dot(ni).s); }); o.forEach((o) => { lx += sc * (o.e1); ly += sc * (-o.e2) }); lx /= o.length; ly /= o.length; return o.length > 2 ? `<POLYGON STYLE="pointer-events:none; fill:${color};opacity:0.7" points="${o.map(o => (sc * o.e1 + ',' + (-o.e2 * sc) + ' '))}"/>` : `<LINE style="pointer-events:none" x1=${o[0].e1 * sc} y1=${-o[0].e2 * sc} x2=${o[1].e1 * sc} y2=${-o[1].e2 * sc} stroke="${color || '#888'}"/>`; }
          // Allow insertion of literal svg strings.
          if (typeof o == 'string' && o[0] == '<') { return o; }
          // Strings are rendered at the current cursor position.
          if (typeof o == 'string') { var res2 = (o[0] == '_') ? '' : `<text x="${lx}" y="${ly}" font-family="Verdana" font-size="${options.fontSize * 0.1 || 0.1}" style="pointer-events:none" fill="${color || '#333'}" transform="rotate(${lr},${lx},${ly})">&nbsp;${o}&nbsp;</text>`; ly += 0.14; return res2; }
          // Numbers change the current color.
          if (typeof o == 'number') { color = '#' + (o + (1 << 25)).toString(16).slice(-6); return ''; };
          // All other elements are rendered ..
          var ni_part = o.Dot(no.Scale(-1));  // O_i + n_o O_oi
          var no_part = ni.Scale(-1).Dot(o);  // O_o + O_oi n_i
          if (ni_part.VLength * 1e-6 > no_part.VLength) {
            // direction or dual - nothing to render
            return "";
          }
          var no_ni_part = no_part.Dot(no.Scale(-1));  // O_oi
          var no_only_part = ni.Wedge(no_part).Dot(no.Scale(-1));  // O_o

          /* Note: making 1e-6 smaller increases the maximum circle radius before they are drawn as lines */
          if (no_ni_part.VLength * 1e-6 > no_only_part.VLength) {
            var is_flat = true;
            var direction = no_ni_part;
          }
          else {
            var is_flat = false;
            var direction = no_only_part;
          }
          // normalize to make the direction unitary
          var dl = direction.Length;
          o = o.Scale(1 / dl);
          direction = direction.Scale(1 / dl)

          var b0 = direction.Grade(0).VLength > 0.001, b1 = direction.Grade(1).VLength > 0.001, b2 = direction.Grade(2).VLength > 0.001;
          if (!is_flat && b0 && !b1 && !b2) {
            // Points
            if (direction.s < 0) { o = Element.Sub(o); }
            lx = sc * (o.e1); ly = sc * (-o.e2); lr = 0; return res2 = `<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="${pointRadius * 0.03}" fill="${color || 'green'}"/>`;
          } else if (is_flat && !b0 && b1 && !b2) {
            // Lines.
            var loc = minus_no.LDot(o).Div(o), att = ni.Dot(o);
            lx = sc * (-loc.e1); ly = sc * (loc.e2); lr = Math.atan2(-o[14], o[13]) / Math.PI * 180; return `<LINE style="pointer-events:none" x1=${lx - 10} y1=${ly} x2=${lx + 10} y2=${ly} stroke="${color || '#888'}" transform="rotate(${lr},${lx},${ly})"/>`;
          } else if (!is_flat && !b0 && !b1 && b2) {
            // Circles
            var loc = o.Div(ni.LDot(o)); lx = sc * (-loc.e1); ly = sc * (loc.e2);
            var r2 = o.Mul(o.Conjugate).s;
            var r = Math.sqrt(Math.abs(r2)) * sc;
            return `<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="${r}" fill="none" stroke="${color || 'green'}" stroke-dasharray="${dash_for_r2(r2, r, lineWidth * 0.020)}"/>`;
          } else if (!is_flat && !b0 && b1 && !b2) {
            // Point Pairs.
            lr = 0; var ei = ni, eo = no, nix = o.Wedge(ei), sqr = o.LDot(o).s / nix.LDot(nix).s, r = Math.sqrt(Math.abs(sqr)), attitude = ((ei.Wedge(eo)).LDot(nix)).Normalized.Mul(Element.Scalar(r)), pos = o.Div(nix); pos = pos.Div(pos.LDot(Element.Sub(ei)));
            if (nix == 0) { pos = o.Dot(Element.Coeff(4, -1)); sqr = -1; }
            lx = sc * (pos.e1); ly = sc * (-pos.e2);
            if (sqr == 0) return `<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="${pointRadius * 0.03}" stroke-width="${lineWidth * 0.01}" fill="none" stroke="${color || 'green'}"/>`;
            // Draw imaginary pairs hollow
            if (sqr > 0) var fill = color || 'green', stroke = 'none', dash_array = 'none';
            else var fill = 'none', stroke = color || 'green';
            lx = sc * (pos.e1 + attitude.e1); ly = sc * (-pos.e2 - attitude.e2);
            var res2 = `<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="${pointRadius * 0.03}" fill="${fill}" stroke-width="${lineWidth * 0.01}" stroke="${stroke}" stroke-dasharray="${dash_for_r2(sqr, pointRadius * 0.03, lineWidth * 0.020)}" />`;
            lx = sc * (pos.e1 - attitude.e1); ly = sc * (-pos.e2 + attitude.e2);
            return res2 + `<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="${pointRadius * 0.03}" fill="${fill}" stroke-width="${lineWidth * 0.01}" stroke="${stroke}" stroke-dasharray="${dash_for_r2(sqr, pointRadius * 0.03, lineWidth * 0.020)}" />`;
          } else {
            /* Unrecognized */
            return "";
          }
          // Handle projective 2D and 3D elements.
        }) : f.map && f.map((o, oidx) => {
          if ((o == Element.graph && or !== false) || (oidx == 0 && options.animate && or !== false)) { anim = true; requestAnimationFrame(() => { var r = build(origf, (!res) || (document.body.contains(res))).innerHTML; if (res) res.innerHTML = r; }); if (!options.animate) return; } while (o instanceof Function) o = o(); o = (o instanceof Array) ? o.map(project) : project(o); if (o === undefined) return;
          // dual option dualizes before render
          if (options.dual && o instanceof Element) o = o.Dual;
          // line segments and polygons
          if (o instanceof Array && o.length > 1) { lx = ly = lr = 0; o.forEach((o) => { while (o.call) o = o(); lx += options.scale * ((drm[1] == 6 || drm[1] == 14) ? -1 : 1) * o[drm[2]] / o[drm[1]]; ly += options.scale * o[drm[3]] / o[drm[1]] }); lx /= o.length; ly /= o.length; return o.length > 2 ? `<POLYGON STYLE="pointer-events:none; fill:${color};opacity:0.7" points="${o.map(o => ((drm[1] == 6 || drm[1] == 14) ? -1 : 1) * options.scale * o[drm[2]] / o[drm[1]] + ',' + (-options.scale) * o[drm[3]] / o[drm[1]] + ' ')}"/>` : `<LINE style="pointer-events:none" x1=${options.scale * ((drm[1] == 6 || drm[1] == 14) ? -1 : 1) * o[0][drm[2]] / o[0][drm[1]]} y1=${-options.scale * o[0][drm[3]] / o[0][drm[1]]} x2=${options.scale * ((drm[1] == 6 || drm[1] == 14) ? -1 : 1) * o[1][drm[2]] / o[1][drm[1]]} y2=${-options.scale * o[1][drm[3]] / o[1][drm[1]]} stroke="${color || '#888'}"/>`; }
          // svg
          if (typeof o == 'string' && o[0] == '<') { return o; }
          // Labels
          if (typeof o == 'string') { var res2 = (o[0] == '_') ? '' : `<text x="${lx}" y="${-ly}" font-family="Verdana" font-size="${options.fontSize * 0.1 || 0.1}" style="pointer-events:none" fill="${color || '#333'}" transform="rotate(${-lr},0,0)">&nbsp;${o}&nbsp;</text>`; ly -= 0.14; return res2; }
          // Colors
          if (typeof o == 'number') { color = '#' + (o + (1 << 25)).toString(16).slice(-6); return ''; };
          // Points
          if (o[to2d[6]] ** 2 > 0.0001) { lx = options.scale * o[drm[2]] / o[drm[1]]; if (drm[1] == 6 || drm[1] == 14) lx *= -1; ly = options.scale * o[drm[3]] / o[drm[1]]; lr = 0; var res2 = `<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${-ly}" r="${options.pointRadius * 0.03 || 0.03}" fill="${color || 'green'}"/>`; ly += 0.05; lx -= 0.1; return res2; }
          // Lines
          if (o[to2d[2]] ** 2 + o[to2d[3]] ** 2 > 0.0001) { var l = Math.sqrt(o[to2d[2]] ** 2 + o[to2d[3]] ** 2); o[to2d[2]] /= l; o[to2d[3]] /= l; o[to2d[1]] /= l; lx = 0.5; ly = options.scale * ((drm[1] == 6) ? -1 : -1) * o[to2d[1]]; lr = -Math.atan2(o[to2d[2]], o[to2d[3]]) / Math.PI * 180; var res2 = `<LINE style="pointer-events:none" x1=-10 y1=${-ly} x2=10 y2=${-ly} stroke="${color || '#888'}" transform="rotate(${-lr},0,0)"/>`; ly += 0.05; return res2; }
          // Vectors
          if (o[to2d[4]] ** 2 + o[to2d[5]] ** 2 > 0.0001) { lr = 0; ly += 0.05; lx += 0.1; var res2 = `<LINE style="pointer-events:none" x1=${lx} y1=${-ly} x2=${lx - o.e02} y2=${-(ly + o.e01)} stroke="${color || '#888'}"/>`; ly = ly + o.e01 / 4 * 3 - 0.05; lx = lx - o.e02 / 4 * 3; return res2; }
        }).join()}`, 'text/html').body;
      // return the inside of the created svg element.
      return svg.removeChild(svg.firstChild);
    };
    // Create the initial svg and install the mousehandlers.
    res = build(f); res.value = f; res.options = options; res.setAttribute("stroke-width", options.lineWidth * 0.005 || 0.005);
    res.remake = (animate) => { options.animate = animate; if (animate) { var r = build(origf, (!res) || (document.body.contains(res))).innerHTML; if (res) res.innerHTML = r; }; return res; };
    //onmousedown="if(evt.target==this)this.sel=undefined" 
    var mousex, mousey, cammove = false;
    res.onwheel = (e) => { e.preventDefault(); options.scale = Math.min(5, Math.max(0.1, (options.scale || 1) - e.deltaY * 0.0001)); if (!anim) { var r = build(origf, (!res) || (document.body.contains(res))).innerHTML; if (res) res.innerHTML = r; } }
    res.onmousedown = (e) => { if (e.target == res) res.sel = undefined; mousex = e.clientX; mousey = e.clientY; cammove = true; }
    res.onmousemove = (e) => {
      if (cammove && tot == 4 && !options.conformal) {
        if (!e.buttons) { cammove = false; return; };
        var [dx, dy] = [(options.scale || 1) * (e.clientX - mousex) * 3, 3 * (options.scale || 1) * (e.clientY - mousey)];
        [mousex, mousey] = [e.clientX, e.clientY];
        if (res.sel !== undefined && f[res.sel].set) {
          var [cw, ch] = [res.clientWidth, res.clientHeight];
          var ox = (1 / (options.scale || 1)) * ((e.offsetX / cw) - 0.5) * (cw > ch ? (cw / ch) : 1);
          var oy = (1 / (options.scale || 1)) * ((e.offsetY / ch) - 0.5) * (ch > cw ? (ch / cw) : 1);
          var tb = Element.sw(options.camera, f[res.sel]);
          var z = -(tb.e012 / tb.e123 + 5) / 5 * 4; tb.e023 = ox * z * tb.e123; tb.e013 = oy * z * tb.e123;
          f[res.sel].set(Element.sw(options.camera.Reverse, tb));
          //f[res.sel].set(   Element.sw(Element.sw(options.camera.Reverse,Element.Bivector(-dx/res.clientWidth,dy/res.clientHeight,0,0,0,0).Exp()),f[res.sel]) );
        } else {
          options.h = (options.h || 0) + dx / 300;
          options.p = (options.p || 0) - dy / 600;
          if (options.camera) options.camera.set((Element.Bivector(0, 0, 0, 0, 0, options.p).Exp()).Mul(Element.Bivector(0, 0, 0, 0, options.h, 0).Exp())/*.Mul(options.camera)*/)
        }
        if (!anim) { var r = build(origf, (!res) || (document.body.contains(res))).innerHTML; if (res) res.innerHTML = r; }
        return;
      }
      if (res.sel === undefined || f[res.sel] == undefined || f[res.sel].set == undefined || !e.buttons) return;
      var resx = res.getBoundingClientRect().width, resy = res.getBoundingClientRect().height,
        x = ((e.clientX - res.getBoundingClientRect().left) / (resx / 4 || 128) - 2) * (resx > resy ? resx / resy : 1), y = ((e.clientY - res.getBoundingClientRect().top) / (resy / 4 || 128) - 2) * (resy > resx ? resy / resx : 1);
      x /= options.scale; y /= options.scale;
      if (options.conformal) { f[res.sel].set(this.Coeff(1, x, 2, -y).Add(no).Add(ni.Scale(0.5 * (x * x + y * y)))) }
      else { f[res.sel][drm[2]] = ((drm[1] == 6) ? -x : x) - ((tot < 4) ? 2 * options.camera.e01 : 0); f[res.sel][drm[3]] = -y + ((tot < 4) ? 2 * options.camera.e02 : 0); f[res.sel][drm[1]] = 1; f[res.sel].set(f[res.sel].Normalized) }
      if (!anim) { var r = build(origf, (!res) || (document.body.contains(res))).innerHTML; if (res) res.innerHTML = r; }
      res.dispatchEvent(new CustomEvent('input'))
    };
    return res;
  }
  // 1d and 2d functions are rendered on a canvas.
  cvs = cvs || document.createElement('canvas'); if (ww) cvs.width = ww; if (hh) cvs.height = hh; var w = cvs.width, h = cvs.height, context = cvs.getContext('2d'), data = context.getImageData(0, 0, w, h);
  // Grid support for the canvas.  
  const [x_from, x_to, y_from, y_to] = options.range || [-1, 1, 1, -1];
  function drawGrid() {
    const [X, Y] = [x => (x - x_from) * w / (x_to - x_from), y => (y - y_from) * h / (y_to - y_from)]
    context.strokeStyle = "#008800"; context.lineWidth = 1;
    // X and Y axis
    context.beginPath();
    context.moveTo(X(x_from), Y(0)); context.lineTo(X(x_to), Y(0)); context.stroke();
    context.moveTo(X(0), Y(y_from)); context.lineTo(X(0), Y(y_to)); context.stroke();
    // Draw ticks
    context.strokeStyle = "#00FF00"; context.lineWidth = 2; context.font = "10px Arial"; context.fillStyle = "#448844";
    for (var i = x_from, j = y_from, ii = 0; ii <= 10; ++ii) {
      context.beginPath(); j += (y_to - y_from) / 10; i += (x_to - x_from) / 10;
      context.moveTo(X(i), Y(-(y_to - y_from) / 200)); context.lineTo(X(i), Y((y_to - y_from) / 200)); context.stroke();
      if (i.toFixed(1) != 0) context.fillText(i.toFixed(1), X(i - (x_to - x_from) / 100), Y(-(y_to - y_from) / 40));
      context.moveTo(X((x_to - x_from) / 200), Y(j)); context.lineTo(X(-(x_to - x_from) / 200), Y(j)); context.stroke();
      if (j.toFixed(1) != 0) context.fillText(j.toFixed(1), X((x_to - x_from) / 100), Y(j));
    }
  }
  // two parameter functions .. evaluate for both and set resulting color.
  if (f.length == 2) for (var px = 0; px < w; px++) for (var py = 0; py < h; py++) { var res = f(px / w * (x_to - x_from) + x_from, py / h * (y_to - y_from) + y_from); res = res.buffer ? [].slice.call(res) : res.slice ? res : [res, res, res]; data.data.set(res.map(x => x * 255).concat([255]), py * w * 4 + px * 4); }
  // one parameter function.. go over x range, use result as y.
  else if (f.length == 1) for (var px = 0; px < w; px++) { var res = f(px / w * (x_to - x_from) + x_from); res = Math.round((res / (y_to - y_from) + (-y_from / (y_to - y_from))) * h); if (res > 0 && res < h - 1) data.data.set([0, 0, 0, 255], res * w * 4 + px * 4); }
  context.putImageData(data, 0, 0);
  if (f.length == 1 || f.length == 2) if (options.grid) drawGrid();
  return cvs;
}