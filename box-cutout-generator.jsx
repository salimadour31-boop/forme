// =============================================
// BOX CUTOUT GENERATOR
// Génère des formes de découpe pour boîtes/emballages
// Version : 1.0.0
// Compatibilité : Illustrator CC 2020+
// =============================================

#target illustrator

var BOX_TYPES = {
    rectangular: "Boîte rectangulaire",
    cube: "Boîte cube",
    pyramid: "Boîte pyramidale",
    auto_bottom: "Boîte à fond automatique",
    separate_lid: "Boîte à couvercle séparé",
    window: "Boîte à fenêtre",
    compartments: "Boîte à compartiments"
};

var MATERIALS = {
    carton_1mm: { name: "Carton 1mm", thickness: 1 },
    carton_2mm: { name: "Carton 2mm", thickness: 2 },
    carton_3mm: { name: "Carton 3mm", thickness: 3 },
    corrugated_3mm: { name: "Carton ondulé 3mm", thickness: 3 },
    corrugated_5mm: { name: "Carton ondulé 5mm", thickness: 5 },
    wood_2mm: { name: "Bois 2mm", thickness: 2 },
    wood_3mm: { name: "Bois 3mm", thickness: 3 },
    acrylic_1mm: { name: "Acrylique 1mm", thickness: 1 },
    acrylic_2mm: { name: "Acrylique 2mm", thickness: 2 },
    "plastic_0.5mm": { name: "Plastique 0.5mm", thickness: 0.5 },
    plastic_1mm: { name: "Plastique 1mm", thickness: 1 }
};

var FLAP_TYPES = {
    none: "Aucun",
    simple: "Rabats simples",
    double: "Rabats doubles",
    auto_lock: "Auto-verrouillant"
};

var LAYER_COLORS = {
    cut: [255, 0, 0],
    fold: [0, 0, 255],
    guide: [0, 160, 0]
};

var MM_TO_POINTS = 72 / 25.4;

function ownKeys(object) {
    var keys = [];
    var key;
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}

function main() {
    if (app.documents.length === 0) {
        alert("Aucun document ouvert dans Illustrator.");
        return;
    }

    var dialog = new Window("dialog", "Générateur de boîtes");
    dialog.orientation = "column";
    dialog.alignChildren = ["fill", "top"];
    dialog.spacing = 10;
    dialog.margins = 16;

    var boxKeys = ownKeys(BOX_TYPES);
    var materialKeys = ownKeys(MATERIALS);
    var flapKeys = ownKeys(FLAP_TYPES);

    var typeGroup = dialog.add("group");
    typeGroup.add("statictext", undefined, "Type de boîte :");
    var typeDropdown = typeGroup.add("dropdownlist", undefined, labelsFor(boxKeys, BOX_TYPES));
    typeDropdown.selection = 0;

    var materialGroup = dialog.add("group");
    materialGroup.add("statictext", undefined, "Matériau :");
    var materialDropdown = materialGroup.add("dropdownlist", undefined, labelsFor(materialKeys, MATERIALS, true));
    materialDropdown.selection = 0;

    var dimensionsGroup = dialog.add("group");
    dimensionsGroup.orientation = "column";
    dimensionsGroup.alignChildren = ["left", "center"];
    dimensionsGroup.add("statictext", undefined, "Dimensions (mm) :");

    var lengthInput = addDimensionInput(dimensionsGroup, "Longueur :", "100");
    var widthInput = addDimensionInput(dimensionsGroup, "Largeur :", "100");
    var heightInput = addDimensionInput(dimensionsGroup, "Hauteur :", "50");

    var flapGroup = dialog.add("group");
    flapGroup.add("statictext", undefined, "Type de rabat :");
    var flapDropdown = flapGroup.add("dropdownlist", undefined, labelsFor(flapKeys, FLAP_TYPES));
    flapDropdown.selection = 1;

    var optionsGroup = dialog.add("group");
    var addHolesCheckbox = optionsGroup.add("checkbox", undefined, "Ajouter des trous d'aération");
    addHolesCheckbox.value = false;

    var marginGroup = dialog.add("group");
    marginGroup.add("statictext", undefined, "Marge du guide (mm) :");
    var marginInput = marginGroup.add("edittext", undefined, "2");
    marginInput.preferredSize = [45, 22];

    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "right";
    buttonGroup.add("button", undefined, "Générer", { name: "ok" });
    buttonGroup.add("button", undefined, "Annuler", { name: "cancel" });

    dialog.onShow = function() {
        lengthInput.active = true;
    };

    if (dialog.show() !== 1) {
        return;
    }

    try {
        var dimensions = {
            length: parsePositiveNumber(lengthInput.text, "Longueur"),
            width: parsePositiveNumber(widthInput.text, "Largeur"),
            height: parsePositiveNumber(heightInput.text, "Hauteur")
        };
        var margin = parseNonNegativeNumber(marginInput.text, "Marge");
        var boxType = boxKeys[typeDropdown.selection.index];
        var materialKey = materialKeys[materialDropdown.selection.index];
        var flapType = flapKeys[flapDropdown.selection.index];

        generateBox(
            app.activeDocument,
            boxType,
            materialKey,
            dimensions,
            flapType,
            addHolesCheckbox.value,
            margin
        );
    } catch (error) {
        alert("Impossible de générer la boîte : " + error.message);
    }
}

function labelsFor(keys, source, isMaterial) {
    var labels = [];
    var i;
    for (i = 0; i < keys.length; i++) {
        labels.push(isMaterial ? source[keys[i]].name : source[keys[i]]);
    }
    return labels;
}

function addDimensionInput(parent, label, value) {
    var group = parent.add("group");
    group.add("statictext", undefined, label);
    var input = group.add("edittext", undefined, value);
    input.preferredSize = [70, 22];
    return input;
}

function parsePositiveNumber(text, label) {
    var value = parseFloat(text);
    if (isNaN(value) || !isFinite(value) || value <= 0) {
        throw new Error(label + " doit être un nombre supérieur à zéro.");
    }
    return value;
}

function parseNonNegativeNumber(text, label) {
    var value = parseFloat(text);
    if (isNaN(value) || !isFinite(value) || value < 0) {
        throw new Error(label + " doit être un nombre positif ou nul.");
    }
    return value;
}

function createModel() {
    return {
        edges: [],
        extraFolds: [],
        cutouts: [],
        bounds: null
    };
}

function pointKey(point) {
    return point[0].toFixed(3) + "," + point[1].toFixed(3);
}

function edgeKey(pointA, pointB) {
    var keyA = pointKey(pointA);
    var keyB = pointKey(pointB);
    return keyA < keyB ? keyA + "|" + keyB : keyB + "|" + keyA;
}

function addModelEdge(model, pointA, pointB) {
    var key = edgeKey(pointA, pointB);
    var i;
    for (i = 0; i < model.edges.length; i++) {
        if (model.edges[i].key === key) {
            model.edges[i].count++;
            return;
        }
    }
    model.edges.push({ key: key, a: pointA, b: pointB, count: 1 });
}

function addPolygon(model, points, skippedEdges) {
    var i;
    var skip;
    for (i = 0; i < points.length; i++) {
        skip = false;
        if (skippedEdges) {
            var j;
            for (j = 0; j < skippedEdges.length; j++) {
                if (skippedEdges[j] === i) {
                    skip = true;
                    break;
                }
            }
        }
        if (!skip) {
            addModelEdge(model, points[i], points[(i + 1) % points.length]);
        }
    }
}

function addRectPanel(model, x, y, width, height, skippedEdges) {
    addPolygon(model, [
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height]
    ], skippedEdges);
}

function addLockingFlap(model, x, y, width, depth, direction) {
    var tongueDepth = Math.max(5, Math.min(depth * 0.18, 12));
    var points;
    var sharedEdge;

    if (direction === "up") {
        points = [
            [x, y], [x + width, y], [x + width, y + depth],
            [x + width * 0.65, y + depth], [x + width * 0.6, y + depth + tongueDepth],
            [x + width * 0.4, y + depth + tongueDepth], [x + width * 0.35, y + depth],
            [x, y + depth]
        ];
        sharedEdge = 0;
    } else if (direction === "down") {
        points = [
            [x, y], [x + width, y], [x + width, y - depth],
            [x + width * 0.65, y - depth], [x + width * 0.6, y - depth - tongueDepth],
            [x + width * 0.4, y - depth - tongueDepth], [x + width * 0.35, y - depth],
            [x, y - depth]
        ];
        sharedEdge = 0;
    } else {
        points = [
            [x, y], [x, y + width], [x + depth, y + width],
            [x + depth, y + width * 0.65], [x + depth + tongueDepth, y + width * 0.6],
            [x + depth + tongueDepth, y + width * 0.4], [x + depth, y + width * 0.35],
            [x + depth, y]
        ];
        sharedEdge = 7;
    }

    addPolygon(model, points, [sharedEdge]);
    addFold(model, points[sharedEdge], points[(sharedEdge + 1) % points.length]);
}

function addFold(model, pointA, pointB) {
    model.extraFolds.push({ a: pointA, b: pointB });
}

function addRectangularNet(model, length, width, height, flapType, originX, originY, includeGlueTab) {
    var x = originX || 0;
    var y = originY || 0;
    var tabDepth = Math.max(10, Math.min(height * 0.35, 20));
    var tabInset = Math.min(5, width * 0.12);

    addRectPanel(model, x, y, length, width);
    addRectPanel(model, x, y + width, length, height);
    addRectPanel(model, x, y - height, length, height);
    addRectPanel(model, x + length, y, height, width);

    if (includeGlueTab) {
        addRectPanel(model, x - height, y, height, width, [3]);
        addPolygon(model, [
            [x - height, y],
            [x - height - tabDepth, y + tabInset],
            [x - height - tabDepth, y + width - tabInset],
            [x - height, y + width]
        ], [3]);
        addFold(model, [x - height, y], [x - height, y + width]);
    } else {
        addRectPanel(model, x - height, y, height, width);
    }

    if (flapType === "auto_lock") {
        addLockingFlap(model, x, y + width + height, length, Math.max(width / 2, 8), "up");
        addRectPanel(model, x, y - height - Math.max(width / 2, 8), length, Math.max(width / 2, 8));
    } else if (flapType !== "none") {
        addRectPanel(model, x, y + width + height, length, Math.max(width / 2, 8));
        addRectPanel(model, x, y - height - Math.max(width / 2, 8), length, Math.max(width / 2, 8));
    }
    if (flapType === "double") {
        addRectPanel(model, x + length + height, y, Math.max(length / 2, 8), width);
    } else if (flapType === "auto_lock") {
        addLockingFlap(model, x + length + height, y, width, Math.max(length / 2, 8), "right");
    }
}

function addAutomaticBottomNet(model, length, width, height, flapType) {
    var panelWidths = [length, width, length, width];
    var panelCount = panelWidths.length;
    var x = 0;
    var bottomDepth = Math.max(12, Math.min(Math.min(length, width) * 0.55, 40));
    var tabDepth = Math.max(10, Math.min(height * 0.35, 20));
    var tabInset = Math.min(5, height * 0.12);
    var i;

    for (i = 0; i < panelCount; i++) {
        addRectPanel(model, x, 0, panelWidths[i], height, i === panelCount - 1 ? [1] : null);
        if (flapType !== "none") {
            addRectPanel(model, x, height, panelWidths[i], Math.max(height / 2, 8));
        }

        if (i === 0 || i === 2) {
            addLockingFlap(model, x, 0, panelWidths[i], bottomDepth, "down");
        } else {
            addRectPanel(model, x, -bottomDepth, panelWidths[i], bottomDepth);
        }
        x += panelWidths[i];
    }

    addPolygon(model, [
        [x, 0], [x + tabDepth, tabInset], [x + tabDepth, height - tabInset], [x, height]
    ], [3]);
    addFold(model, [x, 0], [x, height]);
}

function addPyramidNet(model, length, width, height) {
    var slantAlongLength = Math.sqrt((width / 2) * (width / 2) + height * height);
    var slantAlongWidth = Math.sqrt((length / 2) * (length / 2) + height * height);
    var outline = [
        [-slantAlongWidth, width / 2],
        [0, 0],
        [length / 2, -slantAlongLength],
        [length, 0],
        [length + slantAlongWidth, width / 2],
        [length, width],
        [length / 2, width + slantAlongLength],
        [0, width]
    ];
    addPolygon(model, outline);
    addFold(model, [0, 0], [length, 0]);
    addFold(model, [length, 0], [length, width]);
    addFold(model, [length, width], [0, width]);
    addFold(model, [0, width], [0, 0]);
}

function addCutoutRectangle(model, x, y, width, height) {
    model.cutouts.push({ type: "rectangle", x: x, y: y, width: width, height: height });
}

function addVentHoles(model, length, width, height) {
    var diameter = Math.max(2, Math.min(6, height / 5, length / 10));
    model.cutouts.push({ type: "circle", x: length / 2, y: width + height / 2, diameter: diameter });
    model.cutouts.push({ type: "circle", x: length / 2, y: -height / 2, diameter: diameter });
}

function generateBox(doc, boxType, materialKey, dimensions, flapType, addHoles, margin) {
    var material = MATERIALS[materialKey];
    var length = dimensions.length;
    var width = dimensions.width;
    var height = dimensions.height;
    var model = createModel();
    var firstBounds;

    if (boxType === "cube") {
        width = length;
        height = length;
    }

    if (boxType === "pyramid") {
        addPyramidNet(model, length, width, height);
    } else if (boxType === "separate_lid") {
        addRectangularNet(model, length, width, height, "none", 0, 0, true);
        firstBounds = getBounds(model);
        var lidHeight = Math.max(material.thickness * 4, Math.min(height * 0.35, 25));
        var lidLength = length + material.thickness * 2;
        var lidWidth = width + material.thickness * 2;
        addRectangularNet(
            model,
            lidLength,
            lidWidth,
            lidHeight,
            "none",
            firstBounds.maxX + 20 + lidHeight,
            0,
            false
        );
    } else if (boxType === "auto_bottom") {
        addAutomaticBottomNet(model, length, width, height, flapType);
        if (addHoles) {
            model.cutouts.push({ type: "circle", x: length / 2, y: height / 2, diameter: Math.max(2, Math.min(6, height / 5)) });
        }
    } else {
        addRectangularNet(model, length, width, height, flapType, 0, 0, true);
        if (boxType === "window") {
            addCutoutRectangle(model, length * 0.25, width * 0.25, length * 0.5, width * 0.5);
        }
        if (boxType === "compartments") {
            addFold(model, [length / 2, 0], [length / 2, width]);
            addFold(model, [0, width / 2], [length, width / 2]);
        }
        if (addHoles) {
            if (boxType === "pyramid") {
                model.cutouts.push({ type: "circle", x: length / 2, y: width / 2, diameter: Math.max(2, Math.min(6, Math.min(length, width) / 10)) });
            } else {
                addVentHoles(model, length, width, height);
            }
        }
    }

    model.bounds = getBounds(model);
    drawModel(doc, model, margin);
}

function getBounds(model) {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    var i;

    for (i = 0; i < model.edges.length; i++) {
        minX = Math.min(minX, model.edges[i].a[0], model.edges[i].b[0]);
        minY = Math.min(minY, model.edges[i].a[1], model.edges[i].b[1]);
        maxX = Math.max(maxX, model.edges[i].a[0], model.edges[i].b[0]);
        maxY = Math.max(maxY, model.edges[i].a[1], model.edges[i].b[1]);
    }

    if (minX === Infinity) {
        throw new Error("Aucune géométrie à dessiner.");
    }
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
}

function makeRGBColor(rgb) {
    var color = new RGBColor();
    color.red = rgb[0];
    color.green = rgb[1];
    color.blue = rgb[2];
    return color;
}

function createLayer(doc, name, rgb) {
    var layer = doc.layers.add();
    layer.name = name;
    layer.color = makeRGBColor(rgb);
    return layer;
}

function drawModel(doc, model, margin) {
    var cutLayer = createLayer(doc, "Découpe", LAYER_COLORS.cut);
    var foldLayer = createLayer(doc, "Pliage", LAYER_COLORS.fold);
    var guideLayer = createLayer(doc, "Guides", LAYER_COLORS.guide);
    var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
    var bounds = model.bounds;
    var centerX = (artboard[0] + artboard[2]) / 2;
    var centerY = (artboard[1] + artboard[3]) / 2;
    var scale = MM_TO_POINTS;
    var midX = (bounds.minX + bounds.maxX) / 2;
    var midY = (bounds.minY + bounds.maxY) / 2;
    var i;

    function toDocumentPoint(point) {
        return [
            centerX + (point[0] - midX) * scale,
            centerY - (point[1] - midY) * scale
        ];
    }

    for (i = 0; i < model.edges.length; i++) {
        if (model.edges[i].count > 1) {
            drawLine(foldLayer, toDocumentPoint(model.edges[i].a), toDocumentPoint(model.edges[i].b));
        } else {
            drawLine(cutLayer, toDocumentPoint(model.edges[i].a), toDocumentPoint(model.edges[i].b));
        }
    }
    for (i = 0; i < model.extraFolds.length; i++) {
        drawLine(foldLayer, toDocumentPoint(model.extraFolds[i].a), toDocumentPoint(model.extraFolds[i].b));
    }
    for (i = 0; i < model.cutouts.length; i++) {
        drawCutout(cutLayer, model.cutouts[i], toDocumentPoint);
    }

    drawSafetyGuide(guideLayer, bounds, margin, centerX, centerY, scale, midX, midY);
}

function stylePath(path, color) {
    path.stroked = true;
    path.strokeWidth = 0.25;
    path.strokeColor = color;
    path.filled = false;
}

function drawLine(layer, pointA, pointB) {
    var path = layer.pathItems.add();
    path.setEntirePath([pointA, pointB]);
    path.closed = false;
    stylePath(path, layer.color);
}

function drawCutout(layer, cutout, toDocumentPoint) {
    var path;
    var topLeft;
    var bottomRight;
    if (cutout.type === "circle") {
        var center = toDocumentPoint([cutout.x, cutout.y]);
        var diameter = cutout.diameter * MM_TO_POINTS;
        path = layer.pathItems.ellipse(
            center[1] + diameter / 2,
            center[0] - diameter / 2,
            diameter,
            diameter
        );
        stylePath(path, layer.color);
        return;
    }

    topLeft = toDocumentPoint([cutout.x, cutout.y + cutout.height]);
    bottomRight = toDocumentPoint([cutout.x + cutout.width, cutout.y]);
    path = layer.pathItems.add();
    path.setEntirePath([
        topLeft,
        [bottomRight[0], topLeft[1]],
        bottomRight,
        [topLeft[0], bottomRight[1]]
    ]);
    path.closed = true;
    stylePath(path, layer.color);
}

function drawSafetyGuide(layer, bounds, margin, centerX, centerY, scale, midX, midY) {
    var minX = bounds.minX - margin;
    var minY = bounds.minY - margin;
    var maxX = bounds.maxX + margin;
    var maxY = bounds.maxY + margin;
    var points = [
        [centerX + (minX - midX) * scale, centerY - (minY - midY) * scale],
        [centerX + (maxX - midX) * scale, centerY - (minY - midY) * scale],
        [centerX + (maxX - midX) * scale, centerY - (maxY - midY) * scale],
        [centerX + (minX - midX) * scale, centerY - (maxY - midY) * scale]
    ];
    var path = layer.pathItems.add();
    path.setEntirePath(points);
    path.closed = true;
    stylePath(path, layer.color);
}

main();