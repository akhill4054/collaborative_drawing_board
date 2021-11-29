// Board UI.
let memberList = document.getElementById("memberList");

function addMember(member) {
    for (let i = 0; i < memberList.children.length; i++) {
        if (memberList.children.item(i).id == member.u) {
            // To prevent multiple same members.
            return;
        }
    }

    if (member.is_host) { member.n += " (Host)"; }

    let memberItem = 
        "<li id='" + member.u + "'>" +
            "<div class='card " + (member.is_host ? "bg-danger" : "bg-dark") + "'>" +
                "<div class='card-body text-center'>" +
                    "<p class='card-text " + (member.is_host ? "host-name" : "member-name") + "'>" +
                    member.n +"</p>" +
                "</div>" +
            "</div>" +
        "</li>";
    
    if (member.is_host) {
        $("#memberList").prepend(memberItem);
    } else {
        $("#memberList").append(memberItem);
    }
}

function removeMember(member) {
    $("#memberList #" + member.u).remove()
}

// Listeners.
function shareInvitation() {
    navigator.clipboard.writeText(
        "Hey there! I'm inviting you to join an interactive board session.\n"
        + "Here's the session id: " + sessionId);

    $.snack(
        type = 'info',
        title = 'Invitation copied to cliipboard.',
        delay = 1500,
    );
}


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

        for (let i = 0; i < res.members.length; i++) {
            addMember(res.members[i]);
        }

        $.snack(
            type = res.type,
            title = res.msg,
            delay = 2000,
        );
    });
});

socket.on("join", (data) => {
    addMember(data);
});

socket.on("leave", (data) => {
    removeMember(data);
    console.log("Member left. u:", data.u)
});

socket.on("session-ended", (data) => {
    $.snack(
        type = 'warn',
        title = data.msg
    );
    setTimeout(() => {
        $.snack(
            type = 'info',
            title = 'Redirecting to homepage ..'
        );
        setTimeout(() => {
            window.location.href = "/home/";
        }, 2000);
    }, 4000);
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
window.addEventListener('mouseup', mouseUp, false);

var ctx = canvas.getContext('2d');

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
        s: brushSize,
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
            xr: m.x / canvas.width,
            yr: m.y / canvas.height,
            c: brushColor,
            s: brushSize
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    memCtx.clearRect(0, 0, canvas.width, canvas.height);
};

function drawPoints(ctx, points, fillColor, _brushSize, _mode) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // put back the saved content
    ctx.drawImage(memCanvas, 0, 0);

    // Set line width.
    ctx.lineWidth = _brushSize == null ? brushSize : _brushSize;
    // Set fill color.
    if (_mode == null) _mode = mode;
    if (_mode == 'erase') {
        // Make fill color board-bg-color.
        fillColor = DEFAULT_CANVAS_COLOR;
    }
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = fillColor;

    // draw a basic circle instead
    if (points.length < 6) {
        var b = points[0];
        
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

    // Draw grids.
    // Horizontal.

    // Vertical.

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
    if (data.m == 'pen' || data.m == 'erase') {
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
            drawPoints(ctx, points, data.c, data.s, data.m);
        });
    } else if (data.m == 'drawn') {
        drawEventPoints.delete(data.u);
        saveCanvas();
    }
});

function clearBoard() {
    socket.emit("clear-board");
}

function leaveBoard() {
    $.snack(
        type = "info",
        title = "Leaving session .."
    )
    socket.emit("leave", (res) => {
        if (res == "Ok") window.location.href = "/home/";
    });
}

function endSession() {
    $.snack(
        type = "info",
        title = "Ending session .."
    )
    socket.emit("end-session", (res) => {
        if (res == "Ok") window.location.href = "/home/";
    });
}

socket.on("clear-board", (data) => {
    clear();
    console.log('Board cleared by:', data.u);
});

function saveCanvas() {
    // When the pen is done, save the resulting context
    // to the in-memory canvas.
    memCtx.clearRect(0, 0, canvas.width, canvas.height);
    memCtx.drawImage(canvas, 0, 0);
}
