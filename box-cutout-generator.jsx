// =============================================
// PACKDORA BOX GENERATOR v2.1
// Générateur de boîtes pour Adobe Illustrator (corrigé)
// Auteur : Illustrator Script Smith
// Version : 2.1.0
// Date : 28/10/2026
// Compatibilité : Illustrator CC 2020+
// =============================================

#target illustrator

// ===== CONSTANTES =====
var BOX_TYPES = {
    "rectangular": { name: "Boîte rectangulaire", hasFlaps: true, hasLid: false },
    "cube": { name: "Boîte cube", hasFlaps: true, hasLid: false },
    "rectangular_lid": { name: "Boîte + couvercle", hasFlaps: true, hasLid: true },
    "window_box": { name: "Boîte à fenêtre", hasFlaps: true, hasWindow: true },
    "gable": { name: "Boîte à anses", hasHandle: true },
    "compartments_4": { name: "Boîte 4 compartiments", compartments: 4 }
};

var MATERIALS = {
    "kraft_2mm": { name: "Kraft 2mm", thickness: 2, color: [150, 100, 50] },
    "white_cardboard_1.5mm": { name: "Carton blanc 1.5mm", thickness: 1.5, color: [240, 240, 240] },
    "corrugated_3mm": { name: "Ondulé 3mm", thickness: 3, color: [200, 180, 150] },
    "acrylic_2mm": { name: "Acrylique 2mm", thickness: 2, color: [200, 220, 255] }
};

var FLAP_TYPES = {
    "none": { name: "Aucun", factor: 0 },
    "simple": { name: "Rabats simples", factor: 1 },
    "double_flap": { name: "Rabats doubles", factor: 2 },  // ✅ Corrigé (plus de 'double')
    "auto_lock": { name: "Auto-verrouillant", factor: 1.5 }
};

var WINDOW_SHAPES = {
    "none": "Aucune",
    "square": "Carrée",
    "circle": "Ronde",
    "hexagon": "Hexagonale"
};

// ===== FONCTIONS UTILITAIRES =====
function mmToPt(mm) {
    return mm * 2.83464567; // 1mm ≈ 2.83464567pt
}

function createLayer(doc, name, color) {
    var layer = doc.layers.add();
    layer.name = name;
    layer.color.rgb = color;
    return layer;
}

function drawRect(layer, x, y, width, height, strokeColor, fillColor) {
    var rect = layer.pathItems.rectangle(y, x, width, height);
    rect.stroked = true;
    rect.strokeColor.rgb = strokeColor;
    if (fillColor) {
        rect.filled = true;
        rect.fillColor.rgb = fillColor;
    } else {
        rect.filled = false;
    }
    return rect;
}

function drawCircle(layer, cx, cy, radius, strokeColor) {
    var circle = layer.pathItems.ellipse(cy, cx, radius * 2, radius * 2);
    circle.stroked = true;
    circle.strokeColor.rgb = strokeColor;
    circle.filled = false;
    return circle;
}

// ===== GÉNÉRATION DES BOÎTES =====
function generateBox(doc, boxType, material, dimensions, flapType, options) {
    var length = mmToPt(dimensions.length);
    var width = mmToPt(dimensions.width);
    var height = mmToPt(dimensions.height);
    var thickness = mmToPt(material.thickness);

    // Créer les calques
    var cutLayer = createLayer(doc, "Découpe", [255, 0, 0]);    // Rouge
    var foldLayer = createLayer(doc, "Pliage", [0, 0, 255]);    // Bleu
    var guideLayer = createLayer(doc, "Guides", [0, 255, 0]);   // Vert

    // Générer selon le type de boîte
    switch (boxType) {
        case "rectangular":
        case "rectangular_lid":
            generateRectangularBox(cutLayer, foldLayer, guideLayer, length, width, height, thickness, flapType, options);
            if (boxType === "rectangular_lid") {
                generateLid(cutLayer, foldLayer, length, width, height, thickness, flapType);
            }
            break;
        case "cube":
            generateRectangularBox(cutLayer, foldLayer, guideLayer, length, length, height, thickness, flapType, options);
            break;
        case "window_box":
            generateWindowBox(cutLayer, foldLayer, guideLayer, length, width, height, thickness, flapType, options);
            break;
        case "gable":
            generateGableBox(cutLayer, foldLayer, guideLayer, length, width, height, thickness, options);
            break;
        case "compartments_4":
            generateCompartmentBox(cutLayer, foldLayer, guideLayer, length, width, height, thickness, 4);
            break;
    }

    // Ajouter une fenêtre si demandé
    if (options.addWindow && (boxType === "window_box" || boxType === "rectangular")) {
        var windowSize = mmToPt(options.windowSize || 30);
        var windowX = length / 2 - windowSize / 2;
        var windowY = height / 2 - windowSize / 2;
        if (options.windowShape === "square") {
            drawRect(cutLayer, windowX, windowY, windowSize, windowSize, [255, 0, 0], null);
        } else if (options.windowShape === "circle") {
            drawCircle(cutLayer, windowX + windowSize / 2, windowY + windowSize / 2, windowSize / 2, [255, 0, 0]);
        }
    }
}

function generateRectangularBox(cutLayer, foldLayer, guideLayer, length, width, height, thickness, flapType, options) {
    // Base de la boîte
    drawRect(cutLayer, 0, 0, length, width, [255, 0, 0], null);

    // Côtés
    var sideHeight = height;
    // Côté avant
    drawRect(cutLayer, 0, width, length, sideHeight, [255, 0, 0], null);
    // Côté droit
    drawRect(cutLayer, length, 0, sideHeight, width, [255, 0, 0], null);
    // Côté arrière
    drawRect(cutLayer, 0, -sideHeight, length, sideHeight, [255, 0, 0], null);
    // Côté gauche
    drawRect(cutLayer, -sideHeight, 0, sideHeight, width, [255, 0, 0], null);

    // Rabats (si activé)
    if (flapType !== "none") {
        var flapHeight = flapType.factor * thickness;
        // Rabats avant/arrière
        drawRect(foldLayer, 0, width + sideHeight, length, flapHeight, [0, 0, 255], null);
        drawRect(foldLayer, 0, -sideHeight - flapHeight, length, flapHeight, [0, 0, 255], null);
        // Rabats gauche/droite
        drawRect(foldLayer, length, 0, flapHeight, width, [0, 
