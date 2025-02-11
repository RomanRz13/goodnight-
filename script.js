
const { random, PI, sin, cos, round, floor, ceil, min, max } = Math;

function App() {
    const svg = document.getElementById('svg');
    let width, height, cx, cy;

    let zoom = 100;
    let vbOX = 0;
    let vbOY = 0;

    init();

    function init() {
        onResize();
        initEventHandlers();

        new Flower({
            parent: svg,
            x: 0,
            y: 0,
            petals: 8,
            rings: 12,
            step: 4,
            colors: ['#21B91B', '#FFFF80', '#D1104D', '#7F266A'],
            alpha: 0.8,
            angle: rnd(PI),
            layerAnim: 'layerAnim5',
            reverseDelay: false,
        });
    }

    function initEventHandlers() {
        window.addEventListener('resize', onResize);
        document.body.addEventListener('click', onClick);
    }

    function onClick(e) {
        createFlower({
            x: e.clientX - cx,
            y: e.clientY - cy,
        });
    }

    function createFlower(params) {
        const iRadiusCoef = rnd(1, 7);
        const oRadiusCoef = rnd(iRadiusCoef, 7);
        new Flower({
            parent: svg,
            petals: rndInt(4, 12),
            rings: rndInt(3, 8),
            step: rndInt(3, 8),
            alpha: rnd(0.7, 1),
            angle: rnd(PI),
            iRadius: rnd(2, 5),
            iRadiusCoef,
            oRadius: rnd(5, 10),
            oRadiusCoef,
            ...params
        });
    }

    function onResize() {
        const r = svg.getBoundingClientRect();
        width = r.width;
        height = r.height;
        cx = width / 2;
        cy = height / 2;
        updateViewBox();
    }

    function updateViewBox() {
        const vbW = (width * 100) / zoom;
        const vbH = (height * 100) / zoom;
        const vbX = vbOX - vbW / 2;
        const vbY = vbOY - vbH / 2;
        svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
    }
}

class Flower {
    constructor(conf) {
        this.conf = {
            alpha: 1,
            angle: 0,
            iRadius: 2, iRadiusCoef: 5,
            oRadius: 5, oRadiusCoef: 10,
            layerAnim: 'layerAnim' + (rndInt(1, 12)),
            reverseDelay: rnd(1) > 0.5,
            ...conf
        };
        this.create();
    }
    create() {
        let { parent, x, y, petals, rings, step, colors, alpha, angle, iRadius, iRadiusCoef, oRadius, oRadiusCoef, layerAnim, reverseDelay } = this.conf;

        this.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.group.classList.add('flower');
        parent.appendChild(this.group);

        if (!colors) {
            colors = [chroma.random(), chroma.random()];
            if (rings > 6) colors.push(chroma.random());
        }

        const cscale = chroma.scale(colors);
        let layer, np, color, di;
        for (let i = rings; i > 0; i--) {
            layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            layer.classList.add('layer');

            np = floor((i + step - 1) / step) * petals;
            color = cscale(i * 1 / rings).alpha(alpha);
            this.createPetalsRing(layer, x, y, np, iRadius + i * iRadiusCoef, oRadius + i * oRadiusCoef, angle + i % 2 * PI / np, color);

            di = reverseDelay ? (rings - i + 1) : i;
            layer.style.animationName = layerAnim;
            layer.style.animationDuration = (rings * 0.3) + 's';
            layer.style.animationDelay = (di * 0.15) + 's';
            this.group.appendChild(layer);
        }
    }
    createPetalsRing(parent, x, y, n, iRadius, oRadius, angle, fill) {
        const da = 2 * PI / n;
        const dr = oRadius - iRadius;
        const cpda = rnd(0.5 * da / 5, 1.5 * da / 5);
        const cpdr = rnd(dr * 0.25, dr * 1.1);
        let a;
        for (let i = 0; i < n; i++) {
            a = angle + i * da;
            new Petal({
                parent,
                x, y,
                startA: a,
                endA: a + da,
                iRadius,
                oRadius,
                cpda,
                cpdr,
                fill,
            });
        }
    }
}

class Petal {
    constructor({ parent, x, y, startA, endA, iRadius, oRadius, cpda, cpdr, fill }) {
        this.parent = parent;
        this.fill = fill;

        const da = endA - startA;
        const iRadius0 = iRadius / 5;
        this.sp = [x + cos(startA + da / 2) * iRadius0, y + sin(startA + da / 2) * iRadius0];
        this.cp1 = [x + cos(startA - cpda) * (iRadius + cpdr), y + sin(startA - cpda) * (iRadius + cpdr)];
        this.cp2 = [x + cos(endA + cpda) * (iRadius + cpdr), y + sin(endA + cpda) * (iRadius + cpdr)];
        this.ep = [x + cos(startA + da / 2) * oRadius, y + sin(startA + da / 2) * oRadius];

        this.curve1 = new QCurve({ sp: this.sp, cp: this.cp1, ep: this.ep });
        this.curve2 = new QCurve({ sp: this.sp, cp: this.cp2, ep: this.ep });
        this.create();
    }
    create() {
        this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.path.setAttribute('d', this.pathD());
        this.path.style.fill = this.fill;
        this.parent.appendChild(this.path);
    }
    pathD() {
        return [
            this.curve1.pathD(),
            this.curve2.pathD(),
        ].join(' ');
    }
}

class QCurve {
    constructor({ sp, cp, ep }) {
        this.sp = sp;
        this.cp = cp;
        this.ep = ep;
    }
    pathD() {
        return [
            `M${this.sp[0]} ${this.sp[1]}`,
            `Q${this.cp[0]} ${this.cp[1]}`,
            `${this.ep[0]} ${this.ep[1]}`,
        ].join(' ');
    }
}

function clamp(v, min, max) {
    return min(max(v, min), max);
}

function rnd(min, max) {
    if (max === undefined) { max = min; min = 0; }
    return random() * (max - min) + min;
}

function rndInt(min, max) {
    if (max === undefined) { max = min; min = 0; }
    min = ceil(min);
    max = floor(max);
    return floor(random() * (max - min)) + min;
}

App();
