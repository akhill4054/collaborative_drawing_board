// Web-socket
const socket = io('http://localhost:8000/board');

socket.on("connect", () => {
    console.log('Connected')
    $.snack(
        type = 'success',
        title = 'Connected',
        delay = 1000,
    );
    socket.emit('enter_session', {
        session_id: sessionId,
        user_session_key: userSessionKey,
    }, (res) => {
        $.snack(
            type = res.type,
            title = res.msg,
            delay = 2000,
        );
    });
});

socket.on("join", (data) => {
    console.log('Joined:', data);
});

socket.on("disconnect", () => {
    console.log('Disconnected')
    $.snack(
        type = 'error',
        title = 'Disconnected, please check your internet connection.',
        delay = 2000,
    );
});


// Board
// Bind canvas to listeners
canvas.addEventListener('mousedown', mouseDown, false);
canvas.addEventListener('mousemove', mouseMove, false);
canvas.addEventListener('mouseup', mouseUp, false);

var ctx = canvas.getContext('2d');

ctx.lineWidth = strokeWidth;
ctx.lineJoin = 'round';
ctx.lineCap = 'round';

var started = false;
var lastx = 0;
var lasty = 0;

// create an in-memory canvas
var memCanvas = document.createElement('canvas');
memCanvas.width = canvas.width;
memCanvas.height = canvas.height;
var memCtx = memCanvas.getContext('2d');
var points = [];

let drawEventPoints = new Map();

function mouseDown(e) {
    var m = getMouse(e, canvas);
    points.push({
        x: m.x,
        y: m.y
    });
    started = true;

    // Emit draw event.
    socket.emit('draw', {
        u: userSessionKey,
        m: mode,
        xr: m.x / canvas.width,
        yr: m.y / canvas.height,
        c: brushColor
    });

    drawPoints(ctx, points, brushColor);
};

function mouseMove(e) {
    if (started) {
        var m = getMouse(e, canvas);
        points.push({
            x: m.x,
            y: m.y
        });
    
        drawPoints(ctx, points, brushColor);

        // Emit draw event.
        socket.emit('draw', {
            u: userSessionKey,
            m: mode,
            c: brushColor,
            xr: m.x / canvas.width,
            yr: m.y / canvas.height,
        });
    }
};

function mouseUp(e) {
    if (started) {
        // End drawing.
        socket.emit('draw', {
            u: userSessionKey,
            m: 'drawn',
            xr: 0,
            yr: 0
        });

        started = false;
        points = [];

        saveCanvas();
    }
};

// clear both canvases!
function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    memCtx.clearRect(0, 0, canvas.width, canvas.height);
};

function drawPoints(ctx, points, fillColor) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // put back the saved content
    ctx.drawImage(memCanvas, 0, 0);

    // draw a basic circle instead
    if (points.length < 6) {
        var b = points[0];
        
        // Set fill color.
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = fillColor;
        
        ctx.beginPath(), ctx.arc(b.x, b.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0), ctx.closePath(), ctx.fill();
        return
    }
    ctx.beginPath(), ctx.moveTo(points[0].x, points[0].y);
    // draw a bunch of quadratics, using the average of two points as the control point
    for (i = 1; i < points.length - 2; i++) {
        var c = (points[i].x + points[i + 1].x) / 2,
            d = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, c, d)
    }
    ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y), ctx.stroke()
}

// Creates an object with x and y defined,
// set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky,
// we have to worry about padding and borders
// takes an event and a reference to the canvas
function getMouse(e, canvas) {
    var element = canvas, offsetX = 0, offsetY = 0, mx, my;

    // Compute the total offset. It's possible to cache this if you want
    if (element.offsetParent !== undefined) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;

    // We return a simple javascript object with x and y defined
    return { x: mx, y: my };
}


// Socket drawing events.
socket.on("draw", (data) => {    
    if (data.m == 'pen') {
        let xPoint = data.xr * canvas.width;
        let yPoint = data.yr * canvas.height;

        if (drawEventPoints.get(data.u) == null) {
            drawEventPoints.set(data.u, []);
        }
        drawEventPoints.get(data.u).push({
            x: xPoint, 
            y: yPoint
        });

        drawEventPoints.forEach((points) => {
            drawPoints(ctx, points, data.c);
        });
    } else if (data.m == 'drawn') {
        drawEventPoints.delete(data.u);
        saveCanvas();
    }
});

function saveCanvas() {
    // When the pen is done, save the resulting context
    // to the in-memory canvas.
    memCtx.clearRect(0, 0, canvas.width, canvas.height);
    memCtx.drawImage(canvas, 0, 0);
}
