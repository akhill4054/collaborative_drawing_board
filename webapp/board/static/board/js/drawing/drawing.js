const BOARD_ASPECT_RATIO = 18/9;
const DEFAULT_BRUSH_COLOR = "#ffffff";
const DEFAULT_CANVAS_COLOR = "#0f0f0f";
const MAX_CANVAS_WIDTH = 0.75;


var canvas = document.getElementById('board');

var brushColor = DEFAULT_BRUSH_COLOR;
var brushSize = 0;
var mode = 'pen'; // pen, erase


// Setup canvas.
function setupCanvasDimensions() {
    canvas.width = window.innerWidth * MAX_CANVAS_WIDTH;
    
    // width / height = BOARD_ASPECT_RATIO
    canvas.height = canvas.width / BOARD_ASPECT_RATIO;
}
setupCanvasDimensions();
canvas.style.background = DEFAULT_CANVAS_COLOR;

window.addEventListener('resize', function(event){
    setupCanvasDimensions();
});

// Let's set default options for all color pickers.
jscolor.presets.default = {
    value: brushColor,
    position: 'right',
    hideOnPaletteClick:true,
    backgroundColor: '#f1f1f1',
    palette: '#fff #000 #808080 #996e36 #f55525 #ffe438 #88dd20 #22e0cd #269aff #bb1cd4',
};


// Control change listeners.
let colorPicker = document.getElementById("colorPicker");

colorPicker.addEventListener("change", (e) => {
    brushColor = colorPicker.value;
    console.log("Brush volor change to:", brushColor);
});

let brushSizeSelector = document.getElementById("brushSize");
brushSize = brushSizeSelector.value;

brushSizeSelector.addEventListener("change", (e) => {
    brushSize = brushSizeSelector.value;
    console.log("Brush volor change to:", brushSize);
});

let brushPicker = document.getElementById("paintBrush");
let erasorPicker = document.getElementById("erasor");

function changeMode(_mode) {
    mode = _mode;

    let active, inactive;

    if (_mode == 'pen') {
        active = brushPicker; inactive = erasorPicker;
    } else {
        inactive = brushPicker; active = erasorPicker;
    }

    active.classList.replace("btn-outline-light", "btn-primary");
    inactive.classList.replace("btn-primary", "btn-outline-light");
}
