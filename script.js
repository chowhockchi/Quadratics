let myChart = null;
let currentA, currentB, currentC;
let currentIneq = "=";

const DOM = {
    a: document.getElementById('inputA'),
    b: document.getElementById('inputB'),
    c: document.getElementById('inputC'),
    updateBtn: document.getElementById('updateBtn'),
    calcDisc: document.getElementById('calcDisc'),
    rootsNature: document.getElementById('rootsNature'),
    sorValue: document.getElementById('sorValue'),
    porValue: document.getElementById('porValue'),
    factoredForm: document.getElementById('factoredForm'),
    ctsSteps: document.getElementById('ctsSteps'),
    ineqBtns: document.querySelectorAll('.ineq-btn'),
    ineqResult: document.getElementById('inequalityResult')
};

function parseMathInput(str) {
    if (!str || str.trim() === "") return NaN;
    
    // 全小写化，方便处理
    str = str.toLowerCase();
    
    // 替换常见的数学表达
    str = str.replace(/sqrt/g, 'Math.sqrt');
    str = str.replace(/pi/g, 'Math.PI');
    // 把孤立的 e 替换成 Math.E (\b 是单词边界，防止把别的字母错换了)
    str = str.replace(/\be\b/g, 'Math.E'); 
    
    // 绝对安全的终极白名单（不仅加入了 PI，还加入了大写的 E！）
    if (!/^[0-9+\-*/().\sMathsqrteiPIE]+$/.test(str)) {
        return NaN;
    }
    
    try {
        // 利用 Function 构造器安全地计算表达式结果
        return Function('"use strict";return (' + str + ')')();
    } catch (error) {
        return NaN;
    }
}

// ==========================================
// 💖 THE GENIUS FRACTION ENGINE 💖
// (Don't touch this unless you have 200 IQ)
// ==========================================
function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { let t = b; b = a % b; a = t; }
    return a;
}

function toFrac(val) {
    let str = parseFloat(val).toString();
    let decPlaces = str.includes('.') ? str.split('.')[1].length : 0;
    let d = Math.pow(10, decPlaces);
    let n = Math.round(val * d);
    return simplifyFrac({ n, d });
}

function simplifyFrac(f) {
    let g = gcd(f.n, f.d);
    let n = f.n / g;
    let d = f.d / g;
    if (d < 0) { n = -n; d = -d; }
    return { n, d };
}

function mulFrac(f1, f2) { return simplifyFrac({ n: f1.n * f2.n, d: f1.d * f2.d }); }
function subFrac(f1, f2) { return simplifyFrac({ n: f1.n * f2.d - f2.n * f1.d, d: f1.d * f2.d }); }
function sqFrac(f) { return simplifyFrac({ n: f.n * f.n, d: f.d * f.d }); }
function valFrac(f) { return f.n / f.d; }

// Formatting Helpers for Steps
function fracAbsStr(f) {
    let n = Math.abs(f.n);
    return f.d === 1 ? `${n}` : `${n}/${f.d}`;
}

function formatFrac(f) {
    if (f.n === 0) return "0";
    let sign = f.n < 0 ? "-" : "";
    return sign + fracAbsStr(f);
}

function termStr(f) {
    if (f.n === 0) return "+ 0";
    return f.n < 0 ? `- ${fracAbsStr(f)}` : `+ ${fracAbsStr(f)}`;
}

// ==========================================
// CORE LOGIC
// ==========================================
function updateMath() {
    const a = parseMathInput(DOM.a.value);
    const b = parseMathInput(DOM.b.value);
    const c = parseMathInput(DOM.c.value);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
        alert("Invalid input! Please enter valid numbers, fractions, or 'sqrt(x)'.");
        return;
    }

    if (a === 0) {
        alert("a cannot be zero for a quadratic equation.");
        return;
    }

    currentA = a; currentB = b; currentC = c;

    let fa = toFrac(a);
    let fb = toFrac(b);
    let fc = toFrac(c);

    // 1. Discriminant & Nature of Roots (Using Fractions!)
    let discFrac = subFrac(sqFrac(fb), mulFrac(toFrac(4), mulFrac(fa, fc)));
    let discVal = valFrac(discFrac);
    DOM.calcDisc.innerHTML = `(${formatFrac(fb)})² - 4(${formatFrac(fa)})(${formatFrac(fc)}) = ${formatFrac(discFrac)}`;
    
    let root1 = null, root2 = null;
    if (discVal > 0) {
        DOM.rootsNature.innerText = "Conclusion: 2 Distinct Real Roots";
        root1 = (-b - Math.sqrt(discVal)) / (2 * a);
        root2 = (-b + Math.sqrt(discVal)) / (2 * a);
    } else if (discVal === 0) {
        DOM.rootsNature.innerText = "Conclusion: 2 Equal Real Roots";
        root1 = root2 = -b / (2 * a);
    } else {
        DOM.rootsNature.innerText = "Conclusion: No Real Roots";
    }

    // 2. Vieta's Formulas (Simplest Fractions)
    let b_over_a = mulFrac(fb, {n: fa.d, d: fa.n});
    let sor = mulFrac({n: -1, d: 1}, b_over_a); // -b/a
    let por = mulFrac(fc, {n: fa.d, d: fa.n});  // c/a
    
    DOM.sorValue.innerText = formatFrac(sor);
    DOM.porValue.innerText = formatFrac(por);

    // 3. Factored Form (Keeping Decimals for Roots since Surds can't always be simple fractions)
    if (discVal >= 0) {
        let r1Str = root1 < 0 ? `+ ${Math.abs(root1).toFixed(3).replace(/\.?0+$/, '')}` : `- ${root1.toFixed(3).replace(/\.?0+$/, '')}`;
        let r2Str = root2 < 0 ? `+ ${Math.abs(root2).toFixed(3).replace(/\.?0+$/, '')}` : `- ${root2.toFixed(3).replace(/\.?0+$/, '')}`;
        let aStrFact = a === 1 ? "" : (a === -1 ? "-" : formatFrac(fa));
        DOM.factoredForm.innerText = `y = ${aStrFact}(x ${r1Str})(x ${r2Str})`;
    } else {
        DOM.factoredForm.innerText = "Cannot be factored into real linear factors.";
    }

    // 4. Completing the Square Steps (All in Simplest Fractions!)
    let half_b_over_a = mulFrac(b_over_a, {n: 1, d: 2});
    let sq_term = sqFrac(half_b_over_a);
    let a_sq_term = mulFrac(fa, sq_term);
    let sub_a_sq = mulFrac({n: -1, d: 1}, a_sq_term); // Inverse for step 4 subtraction
    let q = subFrac(fc, a_sq_term);

    let aDisp = formatFrac(fa);
    let aDispVert = aDisp === "1" ? "" : (aDisp === "-1" ? "-" : aDisp);

    let stepsHTML = `
        <div>1) y = ${aDisp}[x² ${termStr(b_over_a)}x] ${termStr(fc)}</div>
        <div>2) y = ${aDisp}[x² ${termStr(b_over_a)}x + (${fracAbsStr(half_b_over_a)})² - (${fracAbsStr(half_b_over_a)})²] ${termStr(fc)}</div>
        <div>3) y = ${aDisp}[(x ${termStr(half_b_over_a)})² - ${fracAbsStr(sq_term)}] ${termStr(fc)}</div>
        <div>4) y = ${aDisp}(x ${termStr(half_b_over_a)})² ${termStr(sub_a_sq)} ${termStr(fc)}</div>
        <div style="font-weight:bold; color:#e74c3c; margin-top:10px;">Vertex Form: y = ${aDispVert}(x ${termStr(half_b_over_a)})² ${termStr(q)}</div>
    `;
    DOM.ctsSteps.innerHTML = stepsHTML;

    // Draw Graph and Update Inequalities
    drawGraph(a, b, c, discVal, root1, root2);
    updateInequalityDisplay();
}

function drawGraph(a, b, c, disc, r1, r2) {
    const vertexX = -b / (2 * a);
    
    let spread = 5; 
    if (disc > 0) {
        let rootDist = Math.abs(r1 - vertexX);
        spread = Math.max(5, rootDist * 1.5); 
    }
    
    let xMin = vertexX - spread;
    let xMax = vertexX + spread;

    let xValues = [];
    let yValues = [];
    for (let x = xMin; x <= xMax; x += spread / 50) {
        xValues.push(x);
        yValues.push((a * x * x) + (b * x) + c);
    }

    let aboveColor = currentIneq === ">" ? 'rgba(46, 204, 113, 0.4)' : 'transparent';
    let belowColor = currentIneq === "<" ? 'rgba(231, 76, 60, 0.4)' : 'transparent';

    if (myChart) {
        myChart.destroy();
    }

    const ctx = document.getElementById('quadChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xValues.map(x => x.toFixed(2)),
            datasets: [{
                label: `y = ${a}x² + ${b}x + ${c}`,
                data: yValues,
                borderColor: '#2c3e50',
                borderWidth: 2,
                pointRadius: 0,
                fill: {
                    target: 'origin',
                    above: aboveColor,
                    below: belowColor
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'x-axis' }, grid: { color: (ctx) => ctx.tick.value === 0 ? '#e74c3c' : '#e2e8f0' } },
                y: { title: { display: true, text: 'y-axis' }, grid: { color: (ctx) => ctx.tick.value === 0 ? '#e74c3c' : '#e2e8f0' } }
            },
            plugins: { tooltip: { callbacks: { label: function(context) { return `(x: ${context.label}, y: ${context.raw.toFixed(3)})`; } } } }
        }
    });
}

function updateInequalityDisplay() {
    const a = currentA;
    const disc = (currentB * currentB) - (4 * currentA * currentC);
    const ineq = currentIneq;
    let ans = "";

    const fmt = (num) => Number.isInteger(num) ? num.toString() : num.toFixed(3).replace(/\.?0+$/, '');

    if (ineq === "=") {
        ans = "Range of x: Displaying standard graph. Select > or < to see inequality range.";
    } else {
        if (disc < 0) {
            if (a > 0) ans = ineq === ">" ? "All real numbers (x ∈ ℝ)" : "No solution";
            else       ans = ineq === ">" ? "No solution" : "All real numbers (x ∈ ℝ)";
        } else if (disc === 0) {
            let root = fmt(-currentB / (2 * a));
            if (a > 0) ans = ineq === ">" ? `x ≠ ${root}` : "No solution";
            else       ans = ineq === ">" ? "No solution" : `x ≠ ${root}`;
        } else {
            let r1 = (-currentB - Math.sqrt(disc)) / (2 * a);
            let r2 = (-currentB + Math.sqrt(disc)) / (2 * a);
            let smaller = fmt(Math.min(r1, r2));
            let larger = fmt(Math.max(r1, r2));

            if (a > 0) {
                ans = ineq === ">" ? `x < ${smaller} or x > ${larger}` : `${smaller} < x < ${larger}`;
            } else {
                ans = ineq === ">" ? `${smaller} < x < ${larger}` : `x < ${smaller} or x > ${larger}`;
            }
        }
        ans = `Range of x for y ${ineq} 0:  ${ans}`;
    }

    DOM.ineqResult.innerText = ans;
}

// Event Listeners
DOM.updateBtn.addEventListener('click', updateMath);

DOM.ineqBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        DOM.ineqBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentIneq = e.target.getAttribute('data-type');
        updateMath(); 
    });
});

// Init on load
updateMath();

// ==========================================
// 💖 COORDINATE FINDER LOGIC 💖
// ==========================================
const findXInput = document.getElementById('findXInput');
const findYBtn = document.getElementById('findYBtn');
const resFindY = document.getElementById('resFindY');

const findYInput = document.getElementById('findYInput');
const findXBtn = document.getElementById('findXBtn');
const resFindX = document.getElementById('resFindX');

// 给定 x 找 y (直接代入方程)
findYBtn.addEventListener('click', () => {
    let xVal = parseMathInput(findXInput.value);
    if (isNaN(xVal)) {
        resFindY.innerText = "Please enter a valid x.";
        return;
    }
    
    let a = currentA, b = currentB, c = currentC;
    let yVal = (a * xVal * xVal) + (b * xVal) + c;
    
    // 顺便用天才的分数引擎帮你转成分数
    let fracY = toFrac(yVal);
    let fracStr = fracY.d === 1 ? "" : ` (or ${formatFrac(fracY)})`;
    
    resFindY.innerText = `y = ${yVal.toFixed(3).replace(/\.?0+$/, '')}${fracStr}`;
});

// 给定 y 找 x (解 ax^2 + bx + (c - y) = 0)
findXBtn.addEventListener('click', () => {
    let yVal = parseMathInput(findYInput.value);
    if (isNaN(yVal)) {
        resFindX.innerText = "Please enter a valid y value.";
        return;
    }
    
    let a = currentA, b = currentB, c = currentC;
    let newC = c - yVal; 
    let disc = (b * b) - (4 * a * newC); // 重新计算判别式
    
    if (disc < 0) {
        resFindX.innerText = "No real x values for this y!";
    } else if (disc === 0) {
        let x1 = -b / (2 * a);
        let fracX = toFrac(x1);
        let fracStr = fracX.d === 1 ? "" : ` (or ${formatFrac(fracX)})`;
        resFindX.innerText = `x = ${x1.toFixed(3).replace(/\.?0+$/, '')}${fracStr}`;
    } else {
        let x1 = (-b - Math.sqrt(disc)) / (2 * a);
        let x2 = (-b + Math.sqrt(disc)) / (2 * a);
        // 无理数就不强行转分数了，免得看起来太蠢
        resFindX.innerText = `x₁ = ${x1.toFixed(3).replace(/\.?0+$/, '')}, x₂ = ${x2.toFixed(3).replace(/\.?0+$/, '')}`;
    }
});