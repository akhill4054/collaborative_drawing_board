const BOARD_ASPECT_RATIO = 16/9;
const DEFAULT_BRUSH_COLOR = "#ffffff";
const DEFAULT_CANVAS_COLOR = "#0f0f0f";



var canvas = document.getElementById('board');

var brushColor = DEFAULT_BRUSH_COLOR;
var strokeWidth = 3;
var mode = 'pen'; // pen, erase

// Setup canvas.
canvas.style.background = DEFAULT_CANVAS_COLOR;
canvas.width = window.innerWidth * 0.75;
// width / height = BOARD_ASPECT_RATIO
canvas.height = canvas.width / BOARD_ASPECT_RATIO;

// Let's set default options for all color pickers.
jscolor.presets.default = {
    value: brushColor,
    position: 'right',
    hideOnPaletteClick:true,
    backgroundColor: '#f1f1f1',
    palette: '#fff #000 #808080 #996e36 #f55525 #ffe438 #88dd20 #22e0cd #269aff #bb1cd4',
};

let colorPicker = document.getElementById("colorPicker");
colorPicker.addEventListener("change", (e) => {
    brushColor = colorPicker.value;
    console.log("Brush volor change to:", brushColor);
});
